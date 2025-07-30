import React from 'react'
import { FaDocker, FaCheck, FaTimes, FaNetworkWired, FaServer } from 'react-icons/fa'

const ContainerList = ({ containers, onToggleDomain, domainSuffix, isRemoteConnected, remoteHost }) => {
  if (!containers || containers.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FaDocker className="mr-2 text-blue-500" /> Containers
        </h2>
        <div className="text-center p-8 text-gray-500">
          <p>No containers found</p>
          <p className="text-sm mt-2">Make sure Docker is running and containers are active</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FaDocker className="mr-2 text-blue-500" /> Containers ({containers.length})
        {isRemoteConnected && (
          <span className="ml-2 text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded-full flex items-center">
            <FaServer className="mr-1" /> Remote
          </span>
        )}
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Container
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Domain
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DNS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {containers.map((container) => (
              <tr key={container.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-md">
                      <FaDocker className="text-blue-500" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{container.name}</div>
                      <div className="text-sm text-gray-500">{container.image.split(':')[0]}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaNetworkWired className="text-gray-400 mr-2" />
                    <span className="text-sm font-mono">
                      {container.dns_enabled ? (
                        <span>{container.name}.{domainSuffix}</span>
                      ) : (
                        <span className="text-gray-400 line-through">{container.name}.{domainSuffix}</span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                  {container.ip_address || <span className="text-gray-400">No IP</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={container.dns_enabled}
                        onChange={(e) => onToggleDomain(container.id, e.target.checked)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ms-3">
                        {container.dns_enabled ? (
                          <FaCheck className="text-green-500" />
                        ) : (
                          <FaTimes className="text-red-500" />
                        )}
                      </span>
                    </label>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ContainerList