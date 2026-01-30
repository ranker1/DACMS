import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Keep this if you have global styles
import { BrowserRouter } from 'react-router-dom' // <--- CRITICAL IMPORT

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <--- CRITICAL WRAPPER */}
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)