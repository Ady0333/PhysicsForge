import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSimStore } from './store/useSimStore'
import { useWebSocket } from './hooks/useWebSocket'
import SimCanvas from './components/canvas/SimCanvas'
import clsx from 'clsx'

const PRESETS = [
  { id: 'heat',        label: 'Heat Diffusion',   eq: '∂u/∂t = α∇²u' },
  { id: 'wave',        label: 'Wave Equation',     eq: '∂²u/∂t² = c²∇²u' },
  { id: 'fluid',       label: 'Navier-Stokes',     eq: '∇·u = 0' },
  { id: 'elasticity',  label: 'Linear Elasticity', eq: '∇·σ + f = 0' },
  { id: 'schrodinger', label: 'Schrödinger',        eq: 'iℏ∂ψ/∂t = Ĥψ' },
] as const

export default function App() {
  const {
    preset, setPreset,
    solverMode, setSolverMode,
    isRunning, setRunning,
    fps, solveTime,
    parameters, setParameter,
  } = useSimStore()

  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useWebSocket()

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark')
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg)] text-[var(--text-primary)] transition-colors duration-300">

      {/* Header */}
      <header className="h-12 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[var(--accent)] font-mono text-xs font-medium tracking-widest uppercase">PhysicsForge</span>
          <span className="text-[var(--border)] text-xs">|</span>
          <span className="text-[var(--text-secondary)] text-xs font-mono">{preset}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs transition-colors"
          >
            {theme === 'light' ? '◐ dark' : '◑ light'}
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs transition-colors"
          >
            GitHub ↗
          </a>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left Sidebar */}
        <aside className="w-[280px] border-r border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0 overflow-y-auto">
          <div className="px-4 pt-5 pb-3">
            <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--text-secondary)]">Equations</p>
          </div>
          <nav className="flex flex-col gap-0.5 px-2">
            {PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={clsx(
                  'group w-full text-left px-3 py-2.5 rounded-md transition-all duration-150',
                  preset === p.id
                    ? 'bg-[var(--accent)] text-white'
                    : 'hover:bg-[var(--bg)] text-[var(--text-primary)]'
                )}
              >
                <div className="text-sm font-medium">{p.label}</div>
                <div className={clsx(
                  'font-mono text-[11px] mt-0.5',
                  preset === p.id ? 'text-sky-200' : 'text-[var(--text-secondary)]'
                )}>
                  {p.eq}
                </div>
              </button>
            ))}
          </nav>

          {/* Solver toggle */}
          <div className="mt-auto px-4 py-4 border-t border-[var(--border)]">
            <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--text-secondary)] mb-2">Solver</p>
            <div className="flex rounded-md border border-[var(--border)] overflow-hidden text-xs">
              {(['fem', 'neural'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setSolverMode(m)}
                  className={clsx(
                    'flex-1 py-1.5 transition-colors font-medium',
                    solverMode === m
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  )}
                >
                  {m === 'fem' ? 'FEM' : 'Neural ROM'}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 relative overflow-hidden">
          <SimCanvas />

          {/* Play/Pause */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setRunning(!isRunning)}
              className={clsx(
                'px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-sm',
                isRunning
                  ? 'bg-[var(--text-primary)] text-[var(--bg)]'
                  : 'bg-[var(--accent)] text-white'
              )}
            >
              {isRunning ? '⏸ Pause' : '▶ Run'}
            </motion.button>
          </div>
        </main>

        {/* Right Panel */}
        <aside className="w-[280px] border-l border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0 overflow-y-auto">
          <div className="px-4 pt-5 pb-3">
            <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--text-secondary)]">Parameters</p>
          </div>
          <div className="flex flex-col gap-5 px-4 pb-4">
            {Object.entries(parameters).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-medium capitalize text-[var(--text-primary)]">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <span className="text-xs font-mono text-[var(--text-secondary)]">{value}</span>
                </div>
                <input
                  type="range" min="0" max="1" step="0.01"
                  value={value}
                  onChange={e => setParameter(key, parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] h-1 rounded-full cursor-pointer"
                />
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="h-8 border-t border-[var(--border)] bg-[var(--surface)] flex items-center px-5 gap-6 shrink-0">
        {[
          { label: 'FPS',    value: fps.toFixed(0) },
          { label: 'Solve',  value: `${solveTime.toFixed(1)}ms` },
          { label: 'Mode',   value: solverMode.toUpperCase() },
          { label: 'Preset', value: preset },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{m.label}</span>
            <span className="text-[10px] font-mono text-[var(--text-primary)]">{m.value}</span>
          </div>
        ))}
      </footer>
    </div>
  )
}