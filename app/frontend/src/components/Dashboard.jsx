import React, { useState, useEffect } from 'react'
import { FaChartLine, FaServer, FaMemory, FaMicrochip, FaNetworkWired, FaHdd, FaSpinner, FaPlus } from 'react-icons/fa'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-2 dark:text-white">{value}</p>
        </div>
        <div className={`p-4 rounded-full ${color} text-white shadow-md`}>
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
  const [refreshInterval, setRefreshInterval] = useState(5000)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showDnsLogForm, setShowDnsLogForm] = useState(false)
  const [newDnsLog, setNewDnsLog] = useState({ ip_address: '', domain: '' })
  const [statsHistory, setStatsHistory] = useState([])

  // Reset history when container changes
  useEffect(() => {
    setStatsHistory([])
  }, [selectedContainer])

  useEffect(() => {
    let intervalId = null

    const fetchData = async () => {
      if (!selectedContainer) return
      
      try {
        // Fetch container stats
        const statsResponse = await axios.get(`/api/containers/${selectedContainer.id}/stats`, {
          params: remoteHost ? { remote_host: remoteHost } : {}
        })
        const newStats = statsResponse.data
        setStats(newStats)

        // Update history
        setStatsHistory(prev => {
            const now = new Date().toLocaleTimeString();
            const point = {
                time: now,
                cpu: newStats.cpu.usage_percent,
                memory: newStats.memory.usage_percent
            };
            const newHistory = [...prev, point];
            // Keep last 20 points
            if (newHistory.length > 20) return newHistory.slice(newHistory.length - 20);
            return newHistory;
        })

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
    if (selectedContainer) {
        if (!stats) setLoading(true) // Only show loading spinner on first load
        fetchData()
    }

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
      // Triggered by manual button, relies on useEffect re-firing logic or just wait for next tick?
      // Actually manual refresh is tricky with useEffect based polling.
      // But we can force a fetch if we extracted the fetch logic.
      // Given the constraints, I'll assume users will toggle auto-refresh or wait.
      // Or I can add a dummy state to force update.
  }

  const handleDnsManualRefresh = async () => {
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
      setNewDnsLog({ ip_address: '', domain: '' })
      setShowDnsLogForm(false)
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
      <div className="bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg transition-all duration-300 text-center">
        <FaChartLine className="text-6xl text-blue-500 mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-bold dark:text-white mb-2">Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400">Select a container from the list to view real-time statistics and logs.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold flex items-center dark:text-white">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 p-2 rounded-lg mr-3">
                <FaChartLine />
            </span>
            {selectedContainer.name}
            {isRemoteConnected && (
              <span className="ml-3 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 py-1 px-2 rounded-full flex items-center border border-purple-200 dark:border-purple-800">
                <FaServer className="mr-1" /> Remote
              </span>
            )}
          </h2>
          <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
            <div className="flex items-center px-2">
              <label className="mr-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Auto-refresh</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={autoRefresh}
                  onChange={handleAutoRefreshToggle}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <select 
              value={refreshInterval} 
              onChange={handleRefreshChange}
              className="bg-white dark:bg-gray-600 border-none text-gray-700 dark:text-gray-200 text-sm rounded-md focus:ring-2 focus:ring-blue-500 p-1"
              disabled={!autoRefresh}
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded shadow-sm">
          <p>{error}</p>
        </div>
      )}

      {loading && !stats ? (
        <div className="flex justify-center items-center p-12">
          <FaSpinner className="animate-spin text-blue-500 text-4xl" />
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="CPU Usage" 
              value={`${stats.cpu.usage_percent}%`} 
              icon={<FaMicrochip className="text-xl" />}
              color="bg-gradient-to-br from-blue-400 to-blue-600"
            />
            <StatCard 
              title="Memory Usage" 
              value={`${stats.memory.usage_percent}%`}
              icon={<FaMemory className="text-xl" />}
              color="bg-gradient-to-br from-green-400 to-green-600"
            />
            <StatCard 
              title="Network I/O" 
              value={`↓ ${formatBytes(stats.network.rx_bytes)}`}
              icon={<FaNetworkWired className="text-xl" />}
              color="bg-gradient-to-br from-purple-400 to-purple-600"
            />
            <StatCard 
              title="Disk I/O" 
              value={`R: ${formatBytes(stats.disk.read_bytes)}`}
              icon={<FaHdd className="text-xl" />}
              color="bg-gradient-to-br from-yellow-400 to-yellow-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">CPU Usage History</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={statsHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                            <XAxis dataKey="time" stroke="#9CA3AF" tick={{fontSize: 12}} />
                            <YAxis stroke="#9CA3AF" tick={{fontSize: 12}} />
                            <Tooltip
                                contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6'}}
                                itemStyle={{color: '#60A5FA'}}
                            />
                            <Line type="monotone" dataKey="cpu" stroke="#3B82F6" strokeWidth={2} dot={false} activeDot={{r: 8}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Memory Usage History</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={statsHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                            <XAxis dataKey="time" stroke="#9CA3AF" tick={{fontSize: 12}} />
                            <YAxis stroke="#9CA3AF" tick={{fontSize: 12}} />
                            <Tooltip
                                contentStyle={{backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6'}}
                                itemStyle={{color: '#34D399'}}
                            />
                            <Line type="monotone" dataKey="memory" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{r: 8}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
          </div>
        </>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold dark:text-white">Container Logs</h3>
          </div>
          <div className="p-4">
            {loading && !logs.length ? (
                <div className="flex justify-center p-8">
                <FaSpinner className="animate-spin text-blue-500 text-2xl" />
                </div>
            ) : logs.length > 0 ? (
                <div className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-auto h-80 font-mono text-xs leading-relaxed">
                {logs.map((log, index) => (
                    <div key={index} className="mb-1 hover:bg-gray-800 p-0.5 rounded">
                    <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
                    <span className="break-all">{log.message}</span>
                    </div>
                ))}
                </div>
            ) : (
                <div className="text-center p-8 text-gray-500">
                <p>No logs available</p>
                </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold dark:text-white">DNS Access Logs</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleDnsManualRefresh}
                className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Refresh"
              >
                <FaServer />
              </button>
              <button
                onClick={toggleDnsLogForm}
                className="p-2 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                title="Add Log"
              >
                <FaPlus />
              </button>
            </div>
          </div>

          <div className="p-6">
            {dnsError && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                {dnsError}
                </div>
            )}

            {showDnsLogForm && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-4 border border-gray-100 dark:border-gray-600">
                <h4 className="text-sm font-medium mb-3 dark:text-white">Add DNS Entry</h4>
                <div className="space-y-3">
                    <input
                        type="text"
                        name="ip_address"
                        value={newDnsLog.ip_address}
                        onChange={handleDnsLogInputChange}
                        placeholder="IP Address"
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                    />
                    <input
                        type="text"
                        name="domain"
                        value={newDnsLog.domain}
                        onChange={handleDnsLogInputChange}
                        placeholder="Domain"
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                    />
                    <button
                        onClick={handleAddDnsLog}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                        Save
                    </button>
                </div>
                </div>
            )}

            {dnsLoading && !dnsLogs.length ? (
                <div className="flex justify-center p-8">
                <FaSpinner className="animate-spin text-blue-500 text-2xl" />
                </div>
            ) : dnsLogs.length > 0 ? (
                <div className="space-y-2">
                    <div className="bg-gray-900 text-gray-300 p-4 rounded-lg overflow-auto h-64 font-mono text-xs">
                        {dnsLogs.map((log, index) => (
                        <div key={index} className="flex justify-between py-1 border-b border-gray-800 last:border-0">
                            <span className="text-gray-500 w-1/4">[{log.timestamp}]</span>
                            <span className="text-yellow-400 w-1/3 truncate text-right pr-2">{log.ip_address}</span>
                            <span className="text-gray-600 px-1">→</span>
                            <span className="text-green-400 w-1/3 truncate">{log.domain}</span>
                        </div>
                        ))}
                    </div>
                    <button
                        onClick={handleShowMoreDnsLogs}
                        className="w-full py-2 text-sm text-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                        Load More Logs
                    </button>
                </div>
            ) : (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                <p>No DNS activity recorded</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
