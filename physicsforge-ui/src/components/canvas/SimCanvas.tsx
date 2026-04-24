import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useSimStore } from '../../store/useSimStore'
import { gridToColors } from '../../engine/colormap'

function HeatPlane() {
  const meshRef    = useRef<THREE.Mesh>(null)
  const gridData   = useSimStore(s => s.gridData)
  const gridN      = useSimStore(s => s.gridN)

  // Build geometry once per resolution change
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(5, 5, gridN - 1, gridN - 1)
    // Pre-allocate color attribute
    const count = geo.attributes.position.count
    const colors = new Float32Array(count * 3)
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [gridN])

  // Seed with a visible gaussian if no data yet
  useEffect(() => {
    if (gridData.length === 0) {
      const n = gridN
      const fake: number[] = []
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const x = (i / (n - 1)) - 0.5
          const y = (j / (n - 1)) - 0.5
          fake.push(Math.exp(-40 * (x * x + y * y)))
        }
      }
      useSimStore.getState().setGridData(fake, n)
    }
  }, [])

  useFrame(() => {
    if (!meshRef.current || gridData.length === 0) return
    const geo  = meshRef.current.geometry
    const pos  = geo.attributes.position.array as Float32Array
    const cols = geo.attributes.color.array as Float32Array
    const rgb  = gridToColors(gridData)

    for (let i = 0; i < gridData.length; i++) {
      pos[i * 3 + 2]  = gridData[i] * 2.0   // height
      cols[i * 3]     = rgb[i * 3]
      cols[i * 3 + 1] = rgb[i * 3 + 1]
      cols[i * 3 + 2] = rgb[i * 3 + 2]
    }

    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate    = true
    geo.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshPhongMaterial
        vertexColors
        side={THREE.DoubleSide}
        shininess={60}
        specular={new THREE.Color(0x444444)}
      />
    </mesh>
  )
}

function GridLines({ n = 32 }: { n: number }) {
  const points: THREE.Vector3[] = []
  const half = 2.5
  const step = 5 / (n - 1)
  for (let i = 0; i < n; i += 4) {
    const t = -half + i * step
    points.push(new THREE.Vector3(t, 0, -half))
    points.push(new THREE.Vector3(t, 0,  half))
    points.push(new THREE.Vector3(-half, 0, t))
    points.push(new THREE.Vector3( half, 0, t))
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points)
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#333333" transparent opacity={0.3} />
    </lineSegments>
  )
}

export default function SimCanvas() {
  const gridN = useSimStore(s => s.gridN)

  return (
    <Canvas style={{ width: '100%', height: '100%', background: '#0d0d0d' }}>
      <PerspectiveCamera makeDefault position={[0, 6, 7]} fov={45} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]}  intensity={1.2} color="#ffffff" />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} color="#4488ff" />
      <pointLight       position={[0, 8, 0]}   intensity={0.6} color="#ffffff" />

      <HeatPlane />
      <GridLines n={gridN} />

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={4}
        maxDistance={14}
      />
    </Canvas>
  )
}