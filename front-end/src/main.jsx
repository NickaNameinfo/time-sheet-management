import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AppThemeProvider } from './context/AppThemeContext'
import 'bootstrap/dist/css/bootstrap.min.css'
import ErrorBoundary from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </AppThemeProvider>
  </React.StrictMode>,
)
