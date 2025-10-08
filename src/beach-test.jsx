import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import BeachGame from './components/beach-game.jsx'
import GameLayout from './components/layout.jsx'

function App() {
  return (
    <div className="relative w-full 
      /* Allow scrolling on mobile to see full content */
      min-h-screen h-auto overflow-x-hidden overflow-y-auto
      /* Desktop: Fixed height */
      md:h-screen md:overflow-hidden
    ">
      {/* Beach background layer */}
      <div className="absolute inset-0 z-0 min-h-full">
        <BeachGame />
      </div>
      
      {/* Game layout overlay */}
      <div className="relative z-10 min-h-full">
        <GameLayout />
      </div>
    </div>
  )
}

const container = document.getElementById('root')
const root = createRoot(container)

root.render(<App />)
