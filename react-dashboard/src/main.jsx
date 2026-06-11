import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply saved theme BEFORE first render — prevents flash of wrong theme
;(function() {
  const theme = localStorage.getItem('learnai_theme') || 'light'
  document.documentElement.setAttribute('data-theme', theme)
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
