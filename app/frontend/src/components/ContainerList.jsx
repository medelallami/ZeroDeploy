import React from 'react'
import { FaDocker, FaCheck, FaTimes, FaNetworkWired, FaChartLine, FaServer } from 'react-icons/fa'

const ContainerList = ({ containers, onToggleDomain, domainSuffix, isRemoteConnected, remoteHost, onSelectContainer }) => {
  if (!containers || containers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg transition-colors duration-300 text-center">
        <FaDocker className="text-6xl text-blue-500 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2 dark:text-white">No Containers Found</h2>
        <p className="text-gray-500 dark:text-gray-400">Make sure Docker is running and you have active containers.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-colors duration-300">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-bold flex items-center dark:text-white">
          <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 p-2 rounded-lg mr-3">
            <FaDocker />
          </span>
          Active Containers
          <span className="ml-3 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1 px-2 rounded-full">
            {containers.length}
          </span>
        </h2>

        {isRemoteConnected && (
          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 py-1 px-3 rounded-full flex items-center font-medium border border-purple-200 dark:border-purple-800">
            <FaServer className="mr-2" /> {remoteHost}
          </span>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Name / Image
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Network
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                DNS Status
              </th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {containers.map((container) => (
              <tr key={container.id} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150 group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <FaDocker className="text-xl" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{container.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5 truncate max-w-xs" title={container.image}>
                        {container.image.split(':')[0]}
                        <span className="text-gray-400">:{container.image.split(':')[1] || 'latest'}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    container.state === 'running'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {container.state}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-900 dark:text-gray-300 font-mono">{container.ip_address}</span>
                         <div className="flex items-center mt-1">
                            <FaNetworkWired className="text-gray-400 text-xs mr-1.5" />
                            <a
                                href={`http://${container.name}.${domainSuffix}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline decoration-dotted"
                            >
                                {container.name}.{domainSuffix}
                            </a>
                         </div>
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={container.dns_enabled}
                        onChange={(e) => onToggleDomain(container.id, e.target.checked)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-blue-500 transition-colors"></div>
                      <span className="ml-3 text-sm font-medium">
                        {container.dns_enabled ? (
                          <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><FaCheck size={10} /> Active</span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-500 flex items-center gap-1"><FaTimes size={10} /> Disabled</span>
                        )}
                      </span>
                    </label>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onSelectContainer(container)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200 transform hover:scale-105"
                  >
                    <FaChartLine className="mr-2" /> Stats
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Showing {containers.length} containers running on local Docker engine
        </p>
      </div>
    </div>
  )
}

export default ContainerList
