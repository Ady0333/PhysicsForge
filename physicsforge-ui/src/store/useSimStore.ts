import { create } from 'zustand'

export type PhysicsPreset = 'heat' | 'wave' | 'fluid' | 'elasticity' | 'schrodinger'
export type SolverMode = 'fem' | 'neural'

interface SimState {
  preset: PhysicsPreset
  solverMode: SolverMode
  isRunning: boolean
  fps: number
  solveTime: number
  parameters: Record<string, number>
  gridData: number[]
  gridN: number
  // Actions
  setPreset: (p: PhysicsPreset) => void
  setSolverMode: (m: SolverMode) => void
  setRunning: (v: boolean) => void
  setMetrics: (fps: number, solveTime: number) => void
  setParameter: (key: string, value: number) => void
  setGridData: (grid: number[], n: number) => void
}

export const useSimStore = create<SimState>((set) => ({
  preset: 'heat',
  solverMode: 'fem',
  isRunning: false,
  fps: 0,
  solveTime: 0,
  gridData: [],
  gridN: 32,
  parameters: {
    thermalDiffusivity: 0.1,
    timeStep: 0.01,
    gridResolution: 32,
  },
  setPreset:    (preset)            => set({ preset }),
  setSolverMode:(solverMode)        => set({ solverMode }),
  setRunning:   (isRunning)         => set({ isRunning }),
  setMetrics:   (fps, solveTime)    => set({ fps, solveTime }),
  setParameter: (key, value)        => set(s => ({ parameters: { ...s.parameters, [key]: value } })),
  setGridData:  (gridData, gridN)   => set({ gridData, gridN }),
}))