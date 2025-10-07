import React from 'react'
import { createRoot } from 'react-dom/client'
import BeachGame from './components/beach-game.jsx'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(<BeachGame />)