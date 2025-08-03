import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import Header from './components/Header'
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
  const [activeTab, setActiveTab] = useState('containers') // 'containers', 'dashboard'

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
      toast.error('Failed to load data')
      if (isRemoteConnected) {
        setIsRemoteConnected(false)
        toast.error('Lost connection to remote Docker host')
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleToggleDomain = (containerId, enabled) => {
    // Update local state first for immediate feedback
    setContainers(prevContainers => 
      prevContainers.map(container => 
        container.id === containerId 
          ? { ...container, dns_enabled: enabled } 
          : container
      )
    )
  }

  const handleSelectContainer = (container) => {
    setSelectedContainer(container)
    setActiveTab('dashboard')
  }

  const handleConnectRemote = async (remoteHostUrl) => {
    setLoading(true)
    try {
      // Validate the URL format
      if (!remoteHostUrl.startsWith('tcp://') && !remoteHostUrl.startsWith('http://') && !remoteHostUrl.startsWith('https://')) {
        toast.error('Remote host URL must start with tcp://, http://, or https://')
        return
      }

      // Try to connect to the remote host
      const response = await axios.post('/api/remote-scan', {
        remote_host: remoteHostUrl
      })

      if (response.data.success) {
        setRemoteHost(remoteHostUrl)
        setIsRemoteConnected(true)
        setContainers(response.data.containers)
        toast.success(`Connected to remote Docker host: ${remoteHostUrl}`)
        
        // Fetch domains for the remote host
        const domainsResponse = await axios.get('/api/domains', {
          params: { remote_host: remoteHostUrl }
        })
        setDomains(domainsResponse.data.domains || {})
        setDomainSuffix(domainsResponse.data.domain_suffix || 'vexinet.local')
      } else {
        toast.error('Failed to connect to remote Docker host')
      }
    } catch (err) {
      console.error('Error connecting to remote host:', err)
      toast.error(`Error connecting to remote host: ${err.response?.data?.detail || err.message}`)
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
      // Prepare container data for the API
      const containerConfigs = containers.map(container => ({
        id: container.id,
        name: container.name,
        ip_address: container.ip_address,
        dns_enabled: container.dns_enabled
      }))

      // Send update request
      const response = await axios.post('/api/domains', {
        containers: containerConfigs,
        remote_host: remoteHost || undefined
      })

      if (response.data.success) {
        toast.success('DNS configuration updated successfully')
        // Refresh data
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

  if (loading) {
    return <LoadingSpinner message="Loading container data..." />
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white transition-colors duration-200">
      <Header domainSuffix={domainSuffix} />
      
      {error ? (
        <div className="container mx-auto p-4 mt-8 text-center">
          <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded">
            <p>{error}</p>
            <button 
              onClick={() => fetchData()} 
              className="mt-2 bg-blue-500 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-800 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-4">
          <div className="mb-6">
            <RemoteHostForm 
              onConnect={handleConnectRemote} 
              onDisconnect={handleDisconnectRemote}
              isConnected={isRemoteConnected}
              currentHost={remoteHost}
            />
          </div>
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('containers')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'containers' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
                >
                  Containers & DNS
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  disabled={!selectedContainer}
                >
                  Dashboard
                </button>
              </nav>
            </div>
          </div>

          {activeTab === 'containers' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <ContainerList 
                  containers={containers} 
                  onToggleDomain={handleToggleDomain} 
                  domainSuffix={domainSuffix}
                  isRemoteConnected={isRemoteConnected}
                  remoteHost={remoteHost}
                  onSelectContainer={handleSelectContainer}
                />
              </div>
              <div className="md:col-span-1">
                <DomainSettings 
                  onReload={handleReloadConfig} 
                  reloading={reloading} 
                  containerCount={containers.length}
                  enabledCount={containers.filter(c => c.dns_enabled).length}
                  domainSuffix={domainSuffix}
                  isRemoteConnected={isRemoteConnected}
                  remoteHost={remoteHost}
                />
              </div>
            </div>
          ) : (
            <Dashboard 
              selectedContainer={selectedContainer}
              isRemoteConnected={isRemoteConnected}
              remoteHost={remoteHost}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default App