const express = require('express');
const cors = require('cors');
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const toml = require('@iarna/toml');

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Docker client
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// Configuration
const DOMAIN_SUFFIX = process.env.DOMAIN_SUFFIX || 'vexinet.local';
const DNS_CONFIG_PATH = process.env.DNS_CONFIG_PATH || '/app/config/config.toml';

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0', backend: 'nodejs' });
});

// Container Listing
app.get('/api/containers', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: false });

        const mappedContainers = containers.map(container => {
            const name = container.Names[0].replace('/', '');
            let ip = 'No IP';
            if (container.NetworkSettings && container.NetworkSettings.Networks) {
                const networkNames = Object.keys(container.NetworkSettings.Networks);
                if (networkNames.length > 0) {
                    ip = container.NetworkSettings.Networks[networkNames[0]].IPAddress || 'No IP';
                }
            }

            return {
                id: container.Id,
                name: name,
                image: container.Image,
                state: container.State,
                status: container.Status,
                ip_address: ip,
                dns_enabled: true
            };
        });

        res.json(mappedContainers);
    } catch (err) {
        console.error('Error listing containers:', err);
        res.status(500).json({ error: err.message });
    }
});

// Container Stats
app.get('/api/containers/:id/stats', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        const stats = await container.stats({ stream: false });

        const cpuStats = stats.cpu_stats;
        const precpuStats = stats.precpu_stats;
        const memoryStats = stats.memory_stats;
        const networks = stats.networks || {};

        let cpuPercent = 0.0;
        const cpuUsage = cpuStats.cpu_usage.total_usage;
        const systemCpuUsage = cpuStats.system_cpu_usage;
        const precpuUsage = precpuStats.cpu_usage.total_usage;
        const precpuSystemUsage = precpuStats.system_cpu_usage;

        if (systemCpuUsage > 0 && precpuSystemUsage > 0) {
            const cpuDelta = cpuUsage - precpuUsage;
            const systemDelta = systemCpuUsage - precpuSystemUsage;
            if (cpuDelta > 0 && systemDelta > 0) {
                cpuPercent = (cpuDelta / systemDelta) * (cpuStats.online_cpus || 1) * 100.0;
            }
        }

        const memoryUsage = memoryStats.usage;
        const memoryLimit = memoryStats.limit;
        const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100.0 : 0;

        let rxBytes = 0;
        let txBytes = 0;
        for (const networkKey in networks) {
            const network = networks[networkKey];
            rxBytes += network.rx_bytes;
            txBytes += network.tx_bytes;
        }

        const blkioStats = stats.blkio_stats || {};
        const ioServiceBytesRecursive = blkioStats.io_service_bytes_recursive || [];
        let readBytes = 0;
        let writeBytes = 0;
        ioServiceBytesRecursive.forEach(stat => {
            if (stat.op === 'Read') readBytes += stat.value;
            if (stat.op === 'Write') writeBytes += stat.value;
        });

        const formattedStats = {
            id: req.params.id,
            name: stats.name,
            timestamp: new Date().toISOString(),
            cpu: {
                usage_percent: parseFloat(cpuPercent.toFixed(2)),
                online_cpus: cpuStats.online_cpus || 1
            },
            memory: {
                usage: memoryUsage,
                limit: memoryLimit,
                usage_percent: parseFloat(memoryPercent.toFixed(2))
            },
            network: {
                rx_bytes: rxBytes,
                tx_bytes: txBytes
            },
            disk: {
                read_bytes: readBytes,
                write_bytes: writeBytes
            }
        };

        res.json(formattedStats);
    } catch (err) {
        console.error('Error getting container stats:', err);
        res.status(500).json({ error: err.message });
    }
});

// Container Logs
app.get('/api/containers/:id/logs', async (req, res) => {
    try {
        const container = docker.getContainer(req.params.id);
        const lines = req.query.lines || 100;

        const logsBuffer = await container.logs({
            stdout: true,
            stderr: true,
            tail: lines,
            timestamps: true,
            follow: false
        });

        const logString = logsBuffer.toString('utf8');
        const logLines = logString.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => {
                // Heuristic parsing for timestamp
                let timestamp = '';
                let message = line;

                // Try to find a timestamp pattern
                const timestampMatch = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

                if (timestampMatch) {
                    timestamp = timestampMatch[0];
                    // Message is everything after the timestamp
                    const tsIndex = line.indexOf(timestamp);
                    if (tsIndex !== -1) {
                        message = line.substring(tsIndex + timestamp.length).trim();
                        // Sometimes there are nanoseconds
                         const nanoMatch = message.match(/^\.\d+Z\s/);
                         if (nanoMatch) {
                             timestamp += nanoMatch[0].trim();
                             message = message.substring(nanoMatch[0].length).trim();
                         }
                    }
                } else {
                    timestamp = new Date().toISOString();
                }

                // Clean up non-printable characters from the start of the message (docker header bytes)
                // Docker header is 8 bytes. If we don't have a timestamp at the start,
                // it's likely the header bytes are messing it up or it's just text.
                // A simple regex to remove non-ascii/control chars from start
                message = message.replace(/^[\x00-\x1F\x7F-\x9F]+/, '');

                return {
                    timestamp: timestamp,
                    message: message
                };
            });

        res.json(logLines);
    } catch (err) {
        console.error('Error getting container logs:', err);
        res.status(500).json({ error: err.message });
    }
});

// Domain Configuration
app.get('/api/domains', async (req, res) => {
    try {
        const containers = await docker.listContainers({ all: false });
        const domains = {};

        for (const container of containers) {
            const name = container.Names[0].replace('/', '');
            let ip = 'No IP';
            if (container.NetworkSettings && container.NetworkSettings.Networks) {
                const networkNames = Object.keys(container.NetworkSettings.Networks);
                if (networkNames.length > 0) {
                    ip = container.NetworkSettings.Networks[networkNames[0]].IPAddress || 'No IP';
                }
            }

            domains[name] = {
                name: `${name}.${DOMAIN_SUFFIX}`,
                enabled: true,
                address: ip
            };
        }

        res.json({ domains: domains, domain_suffix: DOMAIN_SUFFIX });
    } catch (err) {
        console.error('Error getting domains:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/domains', async (req, res) => {
    try {
        const { containers } = req.body;

        // Generate TOML config (simplified structure based on standard zeronsd TOML)
        // Usually:
        // [services]
        //   [services.myservice]
        //     type = "A"
        //     ipv4 = ["1.2.3.4"]
        // But the previous file showed:
        // [[services]]
        // name = "dns.vexinet.local"
        // type = "A"
        // address = "127.0.0.1"

        const config = {
            network: DOMAIN_SUFFIX,
            services: []
        };

        if (containers && Array.isArray(containers)) {
            containers.forEach(container => {
                if (container.dns_enabled && container.ip_address && container.ip_address !== 'No IP') {
                    config.services.push({
                        name: `${container.name}.${DOMAIN_SUFFIX}`,
                        type: 'A',
                        address: container.ip_address
                    });
                }
            });
        }

        // Add default entry from read file example
        config.services.push({
             name: `dns.${DOMAIN_SUFFIX}`,
             type: 'A',
             address: "127.0.0.1"
        });

        const tomlString = toml.stringify(config);

        // Write to file
        try {
            const configDir = path.dirname(DNS_CONFIG_PATH);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(DNS_CONFIG_PATH, tomlString);
            console.log('Updated DNS config:', DNS_CONFIG_PATH);
        } catch (writeErr) {
            console.warn('Could not write DNS config file:', writeErr.message);
        }

        res.json({ success: true, message: 'DNS configuration updated' });
    } catch (err) {
        console.error('Error updating domains:', err);
        res.status(500).json({ error: err.message });
    }
});

// DNS Logs (In-memory storage for now)
let dnsLogs = [];

app.get('/api/dns/logs', (req, res) => {
    // Return recent logs
    const count = parseInt(req.query.count) || 5;
    res.json(dnsLogs.slice(0, count));
});

app.post('/api/dns/logs', (req, res) => {
    const { ip_address, domain } = req.body;
    if (!ip_address || !domain) {
        return res.status(400).json({ error: 'Missing ip_address or domain' });
    }

    const newLog = {
        timestamp: new Date().toISOString(),
        ip_address,
        domain
    };

    dnsLogs.unshift(newLog);
    // Keep only last 100 logs
    if (dnsLogs.length > 100) {
        dnsLogs = dnsLogs.slice(0, 100);
    }

    res.json({ success: true, message: 'DNS access logged successfully' });
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// SPA fallback
app.get(/.*/, (req, res) => {
    if (req.path.startsWith("/api")) return res.status(404).json({ error: "Not found" });
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
