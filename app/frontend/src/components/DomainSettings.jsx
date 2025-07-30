import React from 'react'
import { FaSync, FaNetworkWired, FaInfoCircle, FaServer } from 'react-icons/fa'

const DomainSettings = ({ onReload, reloading, containerCount, enabledCount, domainSuffix, isRemoteConnected, remoteHost }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FaNetworkWired className="mr-2 text-blue-500" /> DNS Settings
      </h2>
      
      <div className="mb-6">
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h3 className="font-medium text-blue-700 mb-2 flex items-center">
            <FaInfoCircle className="mr-1" /> Domain Information
          </h3>
          <div className="text-sm text-blue-800">
            <p className="mb-1"><span className="font-semibold">Suffix:</span> {domainSuffix}</p>
            <p className="mb-1"><span className="font-semibold">Total Containers:</span> {containerCount}</p>
            <p className="mb-1"><span className="font-semibold">DNS Enabled:</span> {enabledCount} of {containerCount}</p>
            {isRemoteConnected && (
              <p className="mt-2 flex items-center text-blue-700">
                <FaServer className="mr-1" /> 
                <span className="font-semibold">Remote Host:</span> 
                <span className="ml-1 font-mono text-xs break-all">{remoteHost}</span>
              </p>
            )}
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-4">
          <p>Changes to container DNS settings will take effect after reloading the configuration.</p>
        </div>
        
        <button
          onClick={onReload}
          disabled={reloading}
          className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-medium ${reloading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {reloading ? (
            <>
              <FaSync className="animate-spin mr-2" />
              Reloading...
            </>
          ) : (
            <>
              <FaSync className="mr-2" />
              Reload DNS Configuration
            </>
          )}
        </button>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="font-medium text-gray-700 mb-2">How It Works</h3>
        <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
          <li>ZeroDeploy monitors your Docker containers</li>
          <li>Each container gets a DNS entry based on its name</li>
          <li>Use the toggle switches to enable/disable DNS entries</li>
          <li>Click "Reload" to apply changes</li>
          <li>Access containers via <code className="bg-gray-100 px-1 py-0.5 rounded">[name].{domainSuffix}</code></li>
        </ul>
      </div>
    </div>
  )
}

export default DomainSettings