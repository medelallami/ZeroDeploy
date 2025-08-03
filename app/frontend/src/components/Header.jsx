import React from 'react'
import { FaServer, FaNetworkWired, FaMoon, FaSun } from 'react-icons/fa'
import { useDarkMode } from '../contexts/DarkModeContext'

const Header = ({ domainSuffix }) => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <header className="bg-blue-600 dark:bg-blue-800 text-white shadow-md transition-colors duration-200">
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <FaNetworkWired className="text-2xl mr-2" />
            <h1 className="text-2xl font-bold">ZeroDeploy</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-blue-700 dark:bg-blue-900 hover:bg-blue-800 dark:hover:bg-blue-950 transition-colors duration-200"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <FaSun className="text-yellow-300" /> : <FaMoon className="text-gray-200" />}
            </button>

            <div className="flex items-center bg-blue-700 dark:bg-blue-900 px-4 py-2 rounded-lg">
              <FaServer className="mr-2" />
              <span className="font-mono">
                <span className="opacity-70">Domain Suffix:</span> {domainSuffix}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header