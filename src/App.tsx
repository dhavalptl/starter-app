import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main>
      <section id="center">
        <div>
          <h1>Starter App</h1>
          <p>Reusable Vite + React + TypeScript scaffold</p>
        </div>

        <div className="counter-row">
          <button
            type="button"
            className="counter"
            onClick={() => setCount((value) => Math.max(0, value - 1))}
          >
            Decrement
          </button>
          <button
            type="button"
            className="counter"
            onClick={() => setCount((value) => value + 1)}
          >
            Count is {count}
          </button>
        </div>
      </section>
    </main>
  )
}

export default App
