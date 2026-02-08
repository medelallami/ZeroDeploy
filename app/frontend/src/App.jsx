import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import Layout from './components/Layout'
import ContainerList from './components/ContainerList'
import DomainSettings from './components/DomainSettings'
import Dashboard from './components/Dashboard'
import LoadingSpinner from './components/LoadingSpinner'
import RemoteHostForm from './components/RemoteHostForm'

function App() {
  const [containers, setContainers] = useState([])
  const [domains, setDomains] = useState({})
  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
  const [error, setError] = useState(null)
  const [domainSuffix, setDomainSuffix] = useState('vexinet.local')
  const [remoteHost, setRemoteHost] = useState('')
  const [isRemoteConnected, setIsRemoteConnected] = useState(false)
  const [selectedContainer, setSelectedContainer] = useState(null)
  const [activeTab, setActiveTab] = useState('containers') // 'containers', 'dashboard', 'settings'

  // Fetch containers and domains on component mount
  useEffect(() => {
    fetchData()
    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      fetchData(false) // Don't show loading indicator for polling
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      // Backend running on port 8000 (Node.js)
      // Vite proxy should handle /api requests to localhost:8000

      // Fetch containers
      const containersResponse = await axios.get('/api/containers', {
        params: remoteHost ? { remote_host: remoteHost } : {}
      })
      setContainers(containersResponse.data)

      // Fetch domains
      const domainsResponse = await axios.get('/api/domains', {
        params: remoteHost ? { remote_host: remoteHost } : {}
      })
      setDomains(domainsResponse.data.domains || {})
      setDomainSuffix(domainsResponse.data.domain_suffix || 'vexinet.local')
      
      setError(null)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data. Please check if the server is running.')
      // Only toast on manual load or initial
      if (showLoading) toast.error('Failed to load data')

      if (isRemoteConnected) {
        setIsRemoteConnected(false)
        toast.error('Lost connection to remote Docker host')
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleToggleDomain = async (containerId, enabled) => {
    // Optimistic update
    const updatedContainers = containers.map(container =>
        container.id === containerId 
          ? { ...container, dns_enabled: enabled } 
          : container
      );
    setContainers(updatedContainers);

    // Trigger backend update
    try {
        await axios.post('/api/domains', {
            containers: updatedContainers,
            remote_host: remoteHost || undefined
        });
        toast.success(`DNS ${enabled ? 'enabled' : 'disabled'} for container`);
    } catch (err) {
        console.error('Error updating domain config:', err);
        toast.error('Failed to update DNS configuration');
        // Revert on failure
        fetchData(false);
    }
  }

  const handleSelectContainer = (container) => {
    setSelectedContainer(container)
    setActiveTab('dashboard')
  }

  const handleConnectRemote = async (remoteHostUrl) => {
    // Not fully implemented in Node backend yet, but keeping structure
    setLoading(true)
    try {
      // Validate the URL format
      if (!remoteHostUrl.startsWith('tcp://') && !remoteHostUrl.startsWith('http://') && !remoteHostUrl.startsWith('https://')) {
        toast.error('Remote host URL must start with tcp://, http://, or https://')
        return
      }

      // Try to connect to the remote host (mock check for now as backend might not support it fully)
      // In a real scenario, we'd hit an endpoint to validate connectivity
      setRemoteHost(remoteHostUrl)
      setIsRemoteConnected(true)
      toast.success(`Connected to remote Docker host: ${remoteHostUrl}`)
      await fetchData(true)

    } catch (err) {
      console.error('Error connecting to remote host:', err)
      toast.error(`Error connecting to remote host: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnectRemote = () => {
    setRemoteHost('')
    setIsRemoteConnected(false)
    fetchData()
    toast.info('Disconnected from remote Docker host')
  }

  const handleReloadConfig = async () => {
    setReloading(true)
    try {
      const response = await axios.post('/api/domains', {
        containers: containers,
        remote_host: remoteHost || undefined
      })

      if (response.data.success) {
        toast.success('DNS configuration updated successfully')
        await fetchData(false)
      } else {
        toast.error('Failed to update DNS configuration')
      }
    } catch (err) {
      console.error('Error updating config:', err)
      toast.error('Error updating DNS configuration')
    } finally {
      setReloading(false)
    }
  }

  if (loading && !containers.length) {
    return <LoadingSpinner message="Loading container data..." />
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {error && (
        <div className="mb-6 bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded shadow-sm flex justify-between items-center">
          <p>{error}</p>
          <button
            onClick={() => fetchData()}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Connection Bar (only if remote is active or needed) */}
      <div className="mb-6">
         {/* Could place RemoteHostForm here or in settings */}
      </div>

      {activeTab === 'containers' && (
        <div className="space-y-6">
            {/* Header / Actions Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Containers</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your Docker containers and DNS settings</p>
                </div>
                <div className="flex gap-2">
                     {/* Placeholder for future actions */}
                </div>
            </div>

            <ContainerList
                containers={containers}
                onToggleDomain={handleToggleDomain}
                domainSuffix={domainSuffix}
                isRemoteConnected={isRemoteConnected}
                remoteHost={remoteHost}
                onSelectContainer={handleSelectContainer}
            />
        </div>
      )}

      {activeTab === 'dashboard' && (
        <Dashboard
            selectedContainer={selectedContainer}
            isRemoteConnected={isRemoteConnected}
            remoteHost={remoteHost}
        />
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DomainSettings
                onReload={handleReloadConfig}
                reloading={reloading}
                containerCount={containers.length}
                enabledCount={containers.filter(c => c.dns_enabled).length}
                domainSuffix={domainSuffix}
                isRemoteConnected={isRemoteConnected}
                remoteHost={remoteHost}
            />

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Remote Connection</h2>
                <RemoteHostForm
                    onConnect={handleConnectRemote}
                    onDisconnect={handleDisconnectRemote}
                    isConnected={isRemoteConnected}
                    currentHost={remoteHost}
                />
            </div>
        </div>
      )}
    </Layout>
  )
}

export default App
