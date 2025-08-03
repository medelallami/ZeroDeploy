import React, { useState, useEffect } from 'react'
import { FaChartLine, FaServer, FaMemory, FaMicrochip, FaNetworkWired, FaHdd, FaSpinner, FaGlobe, FaPlus } from 'react-icons/fa'
import axios from 'axios'

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-xl font-semibold mt-1 dark:text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

const Dashboard = ({ selectedContainer, isRemoteConnected, remoteHost }) => {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [dnsLogs, setDnsLogs] = useState([])
  const [dnsLogsCount, setDnsLogsCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [dnsLoading, setDnsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dnsError, setDnsError] = useState(null)
  const [refreshInterval, setRefreshInterval] = useState(5000) // 5 seconds
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showDnsLogForm, setShowDnsLogForm] = useState(false)
  const [newDnsLog, setNewDnsLog] = useState({ ip_address: '', domain: '' })

  useEffect(() => {
    let intervalId = null

    const fetchData = async () => {
      if (!selectedContainer) return
      
      setLoading(true)
      try {
        // Fetch container stats
        const statsResponse = await axios.get(`/api/containers/${selectedContainer.id}/stats`, {
          params: remoteHost ? { remote_host: remoteHost } : {}
        })
        setStats(statsResponse.data)

        // Fetch container logs
        const logsResponse = await axios.get(`/api/containers/${selectedContainer.id}/logs`, {
          params: {
            lines: 100,
            ...(remoteHost ? { remote_host: remoteHost } : {})
          }
        })
        setLogs(logsResponse.data)
        
        setError(null)
      } catch (err) {
        console.error('Error fetching container data:', err)
        setError('Failed to load container data')
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchData()

    // Set up interval for auto-refresh
    if (autoRefresh && selectedContainer) {
      intervalId = setInterval(fetchData, refreshInterval)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [selectedContainer, refreshInterval, autoRefresh, remoteHost])

  // Fetch DNS logs
  useEffect(() => {
    const fetchDnsLogs = async () => {
      setDnsLoading(true)
      try {
        const response = await axios.get('/api/dns/logs', {
          params: { count: dnsLogsCount }
        })
        setDnsLogs(response.data)
        setDnsError(null)
      } catch (err) {
        console.error('Error fetching DNS logs:', err)
        setDnsError('Failed to load DNS logs')
      } finally {
        setDnsLoading(false)
      }
    }

    fetchDnsLogs()

    // Set up interval for auto-refresh of DNS logs
    let dnsIntervalId = null
    if (autoRefresh) {
      dnsIntervalId = setInterval(fetchDnsLogs, refreshInterval)
    }

    return () => {
      if (dnsIntervalId) clearInterval(dnsIntervalId)
    }
  }, [dnsLogsCount, refreshInterval, autoRefresh])

  const handleRefreshChange = (e) => {
    const value = parseInt(e.target.value)
    setRefreshInterval(value)
  }

  const handleAutoRefreshToggle = () => {
    setAutoRefresh(!autoRefresh)
  }

  const handleManualRefresh = () => {
    // Trigger a manual refresh
    if (selectedContainer) {
      const fetchData = async () => {
        setLoading(true)
        try {
          // Fetch container stats
          const statsResponse = await axios.get(`/api/containers/${selectedContainer.id}/stats`, {
            params: remoteHost ? { remote_host: remoteHost } : {}
          })
          setStats(statsResponse.data)
  
          // Fetch container logs
          const logsResponse = await axios.get(`/api/containers/${selectedContainer.id}/logs`, {
            params: {
              lines: 100,
              ...(remoteHost ? { remote_host: remoteHost } : {})
            }
          })
          setLogs(logsResponse.data)
          
          setError(null)
        } catch (err) {
          console.error('Error fetching container data:', err)
          setError('Failed to load container data')
        } finally {
          setLoading(false)
        }
      }
      fetchData()
    }
  }

  const handleDnsManualRefresh = () => {
    // Trigger a manual refresh of DNS logs
    const fetchDnsLogs = async () => {
      setDnsLoading(true)
      try {
        const response = await axios.get('/api/dns/logs', {
          params: { count: dnsLogsCount }
        })
        setDnsLogs(response.data)
        setDnsError(null)
      } catch (err) {
        console.error('Error fetching DNS logs:', err)
        setDnsError('Failed to load DNS logs')
      } finally {
        setDnsLoading(false)
      }
    }
    fetchDnsLogs()
  }

  const handleShowMoreDnsLogs = () => {
    setDnsLogsCount(prevCount => prevCount + 5)
  }

  const handleDnsLogInputChange = (e) => {
    const { name, value } = e.target
    setNewDnsLog(prev => ({ ...prev, [name]: value }))
  }

  const handleAddDnsLog = async () => {
    if (!newDnsLog.ip_address || !newDnsLog.domain) return

    try {
      await axios.post('/api/dns/logs', newDnsLog)
      // Reset form
      setNewDnsLog({ ip_address: '', domain: '' })
      setShowDnsLogForm(false)
      // Refresh DNS logs
      handleDnsManualRefresh()
    } catch (err) {
      console.error('Error adding DNS log:', err)
      setDnsError('Failed to add DNS log')
    }
  }

  const toggleDnsLogForm = () => {
    setShowDnsLogForm(prev => !prev)
  }

  if (!selectedContainer) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
        <h2 className="text-xl font-semibold mb-4 flex items-center dark:text-white">
          <FaChartLine className="mr-2 text-blue-500" /> Dashboard
        </h2>
        <div className="text-center p-8 text-gray-500 dark:text-gray-400">
          <p>Select a container to view statistics and logs</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center dark:text-white">
          <FaChartLine className="mr-2 text-blue-500" /> Dashboard: {selectedContainer.name}
          {isRemoteConnected && (
            <span className="ml-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 py-1 px-2 rounded-full flex items-center transition-colors duration-200">
              <FaServer className="mr-1" /> Remote
            </span>
          )}
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label className="mr-2 text-sm text-gray-600 dark:text-gray-400">Auto-refresh:</label>
            <label className="inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={autoRefresh}
                onChange={handleAutoRefreshToggle}
              />
              <div className="relative w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500"></div>
            </label>
          </div>
          <div className="flex items-center">
            <label className="mr-2 text-sm text-gray-600 dark:text-gray-400">Refresh:</label>
            <select 
              value={refreshInterval} 
              onChange={handleRefreshChange}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 p-2 transition-colors duration-200"
              disabled={!autoRefresh}
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>
          <button
            onClick={handleManualRefresh}
            className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
            disabled={loading}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaServer />}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 mb-4 transition-colors duration-200">
          <p>{error}</p>
        </div>
      )}

      {loading && !stats ? (
        <div className="flex justify-center items-center p-8">
          <FaSpinner className="animate-spin text-blue-500 text-2xl" />
        </div>
      ) : stats ? (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3 dark:text-white">Container Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="CPU Usage" 
              value={`${stats.cpu.usage_percent}%`} 
              icon={<FaMicrochip className="text-white" />} 
              color="bg-blue-500"
            />
            <StatCard 
              title="Memory Usage" 
              value={`${stats.memory.usage_percent}% (${formatBytes(stats.memory.usage)})`} 
              icon={<FaMemory className="text-white" />} 
              color="bg-green-500"
            />
            <StatCard 
              title="Network I/O" 
              value={`↓ ${formatBytes(stats.network.rx_bytes)} / ↑ ${formatBytes(stats.network.tx_bytes)}`} 
              icon={<FaNetworkWired className="text-white" />} 
              color="bg-purple-500"
            />
            <StatCard 
              title="Disk I/O" 
              value={`R: ${formatBytes(stats.disk.read_bytes)} / W: ${formatBytes(stats.disk.write_bytes)}`} 
              icon={<FaHdd className="text-white" />} 
              color="bg-yellow-500"
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-medium mb-3 dark:text-white">Container Logs</h3>
          {loading && !logs.length ? (
            <div className="flex justify-center items-center p-8">
              <FaSpinner className="animate-spin text-blue-500 text-2xl" />
            </div>
          ) : logs.length > 0 ? (
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              <p>No logs available</p>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium dark:text-white">DNS Access Logs</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleDnsManualRefresh}
                className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
                disabled={dnsLoading}
              >
                {dnsLoading ? <FaSpinner className="animate-spin" /> : <FaServer />}
              </button>
              <button
                onClick={toggleDnsLogForm}
                className="p-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors duration-200"
              >
                <FaPlus />
              </button>
            </div>
          </div>

          {dnsError && (
            <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 mb-4 transition-colors duration-200">
              <p>{dnsError}</p>
            </div>
          )}

          {showDnsLogForm && (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4 transition-colors duration-200">
              <h4 className="text-md font-medium mb-2 dark:text-white">Add DNS Access Log</h4>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
                  <input
                    type="text"
                    name="ip_address"
                    value={newDnsLog.ip_address}
                    onChange={handleDnsLogInputChange}
                    placeholder="192.168.1.100"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domain</label>
                  <input
                    type="text"
                    name="domain"
                    value={newDnsLog.domain}
                    onChange={handleDnsLogInputChange}
                    placeholder="container.vexinet.local"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md transition-colors duration-200"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleAddDnsLog}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors duration-200"
                  >
                    Add Log
                  </button>
                </div>
              </div>
            </div>
          )}

          {dnsLoading && !dnsLogs.length ? (
            <div className="flex justify-center items-center p-8">
              <FaSpinner className="animate-spin text-blue-500 text-2xl" />
            </div>
          ) : dnsLogs.length > 0 ? (
            <div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 font-mono text-sm">
                {dnsLogs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-gray-500">[{log.timestamp}]</span> 
                    <span className="text-yellow-400">{log.ip_address}</span> → 
                    <span className="text-green-400">{log.domain}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-right">
                <button
                  onClick={handleShowMoreDnsLogs}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  Show more logs
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
              <p>No DNS logs available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard