import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import BeachGame from './components/beach-game.jsx'
import GameLayout from './components/layout.jsx'

function App() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Beach background layer */}
      <div className="absolute inset-0 z-0">
        <BeachGame />
      </div>
      
      {/* Game layout overlay */}
      <div className="absolute inset-0 z-10">
        <GameLayout />
      </div>
    </div>
  )
}

const container = document.getElementById('root')
const root = createRoot(container)

root.render(<App />)
