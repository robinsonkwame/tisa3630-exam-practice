import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import GameLayout from './components/layout.jsx'

function App() {
  return (
    <div className="relative w-full min-h-screen 
      /* Clean gradient background instead of beach */
      bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-600
    ">
      <GameLayout />
    </div>
  )
}

const container = document.getElementById('root')
const root = createRoot(container)

root.render(<App />)
