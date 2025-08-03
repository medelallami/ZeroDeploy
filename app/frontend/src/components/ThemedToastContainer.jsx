import React from 'react';
import { ToastContainer } from 'react-toastify';
import { useDarkMode } from '../contexts/DarkModeContext';

const ThemedToastContainer = () => {
  const { darkMode } = useDarkMode();
  
  return (
    <ToastContainer 
      position="bottom-right" 
      autoClose={3000} 
      theme={darkMode ? 'dark' : 'light'}
    />
  );
};

export default ThemedToastContainer;