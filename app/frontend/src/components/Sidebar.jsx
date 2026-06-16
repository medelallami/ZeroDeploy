import React from 'react';
import { FaDocker, FaChartLine, FaCog, FaServer } from 'react-icons/fa';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'containers', label: 'Containers', icon: <FaDocker /> },
    { id: 'dashboard', label: 'Dashboard', icon: <FaChartLine /> },
    { id: 'settings', label: 'Settings', icon: <FaCog /> },
  ];

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen flex flex-col shadow-xl">
      <div className="p-6 border-b border-gray-700 flex items-center">
        <FaServer className="text-blue-500 text-2xl mr-3" />
        <h1 className="text-xl font-bold tracking-wider">ZeroDeploy</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow-md transform scale-105'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white hover:pl-5'
            }`}
          >
            <span className="text-xl mr-4">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="text-xs text-gray-500 text-center">
          v1.0.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
