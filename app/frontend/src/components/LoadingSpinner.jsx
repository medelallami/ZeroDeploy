import React from 'react'
import { FaSpinner } from 'react-icons/fa'

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <FaSpinner className="animate-spin text-blue-600 text-4xl mb-4" />
      <p className="text-gray-700">{message}</p>
    </div>
  )
}

export default LoadingSpinner