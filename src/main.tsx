import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // 引入您的 App.tsx
import './index.css'    // 引入 Tailwind 指令

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)