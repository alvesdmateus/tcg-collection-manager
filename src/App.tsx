import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header>
          <h1>TCG Collection Manager</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

function HomePage() {
  return (
    <div>
      <h2>Welcome to TCG Collection Manager</h2>
      <p>A web application for managing your Trading Card Game collections.</p>
    </div>
  )
}

export default App
