import React from 'react'
import { FaServer, FaNetworkWired } from 'react-icons/fa'

const Header = ({ domainSuffix }) => {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <FaNetworkWired className="text-2xl mr-2" />
            <h1 className="text-2xl font-bold">ZeroDeploy</h1>
          </div>
          
          <div className="flex items-center bg-blue-700 px-4 py-2 rounded-lg">
            <FaServer className="mr-2" />
            <span className="font-mono">
              <span className="opacity-70">Domain Suffix:</span> {domainSuffix}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header