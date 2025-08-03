import React, { useState } from 'react'
import { FaServer, FaLink, FaUnlink, FaInfoCircle } from 'react-icons/fa'

const RemoteHostForm = ({ onConnect, onDisconnect, isConnected, currentHost }) => {
  const [remoteHost, setRemoteHost] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (remoteHost.trim()) {
      onConnect(remoteHost.trim())
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-4 transition-colors duration-200">
      <h2 className="text-xl font-semibold mb-4 flex items-center dark:text-white">
        <FaServer className="mr-2 text-blue-500" /> Remote Docker Host
      </h2>

      {isConnected ? (
        <div className="mb-4">
          <div className="flex items-center bg-green-100 dark:bg-green-900 p-3 rounded-lg transition-colors duration-200">
            <FaLink className="text-green-600 dark:text-green-400 mr-2" />
            <div className="flex-grow">
              <p className="text-green-800 dark:text-green-300 font-medium">Connected to remote host</p>
              <p className="text-sm text-green-700 dark:text-green-400 font-mono">{currentHost}</p>
            </div>
            <button
              onClick={onDisconnect}
              className="bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900 text-red-600 dark:text-red-400 font-medium py-2 px-4 rounded border border-red-300 dark:border-red-700 flex items-center transition-colors duration-200"
            >
              <FaUnlink className="mr-1" /> Disconnect
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="flex-grow">
              <label htmlFor="remoteHost" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Remote Docker URL
              </label>
              <input
                type="text"
                id="remoteHost"
                value={remoteHost}
                onChange={(e) => setRemoteHost(e.target.value)}
                placeholder="tcp://192.168.1.100:2375"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-medium py-2 px-4 rounded flex items-center h-10 transition-colors duration-200"
              >
                <FaLink className="mr-1" /> Connect
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="mt-2">
        <button 
          onClick={() => setShowHelp(!showHelp)} 
          className="text-blue-600 dark:text-blue-400 text-sm flex items-center hover:underline transition-colors duration-200"
        >
          <FaInfoCircle className="mr-1" /> {showHelp ? 'Hide help' : 'Show help'}
        </button>
        
        {showHelp && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900 p-3 rounded transition-colors duration-200">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-1">How to connect to a remote Docker host:</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Ensure the remote Docker daemon is configured to accept remote connections</li>
              <li>Use one of these URL formats:
                <ul className="list-disc pl-5 mt-1">
                  <li><code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded transition-colors duration-200">tcp://hostname:2375</code> (unencrypted)</li>
                  <li><code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded transition-colors duration-200">http://hostname:2375</code></li>
                  <li><code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded transition-colors duration-200">https://hostname:2376</code> (TLS)</li>
                </ul>
              </li>
              <li>Make sure the remote host is reachable from this machine</li>
              <li>For security, consider using SSH tunneling or TLS authentication</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

export default RemoteHostForm