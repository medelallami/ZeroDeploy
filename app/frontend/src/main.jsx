import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'react-toastify/dist/ReactToastify.css'
import { DarkModeProvider } from './contexts/DarkModeContext'
import ThemedToastContainer from './components/ThemedToastContainer'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DarkModeProvider>
      <App />
      <ThemedToastContainer />
    </DarkModeProvider>
  </React.StrictMode>,
)