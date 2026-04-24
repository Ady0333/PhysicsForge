import { useEffect, useRef } from 'react'
import { physicsWS } from '../api/websocket'
import { useSimStore } from '../store/useSimStore'

export function useWebSocket() {
  const setMetrics  = useSimStore(s => s.setMetrics)
  const isRunning   = useSimStore(s => s.isRunning)
  const setGridData = useSimStore(s => s.setGridData)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    physicsWS.connect()
    const unsub = physicsWS.onMessage(msg => {
      if (msg.type === 'frame') {
        setGridData(msg.grid, msg.n)
        setMetrics(1000 / msg.solveMs, msg.solveMs)
      }
    })
    return () => { unsub(); physicsWS.disconnect() }
  }, [setGridData, setMetrics])  // ← only change from before

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => physicsWS.step(), 50)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning])
}