import React, { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Center } from '@react-three/drei'
import * as THREE from 'three'
import type { CubeState, Face } from '../types/cube'
import { COLOR_HEX } from '../constants/cubeConstants'

interface MoveConfig {
  axis: 'x' | 'y' | 'z'
  filter: (x: number, y: number, z: number) => boolean
  baseAngle: number
}

const MOVE_CONFIGS: Record<Face, MoveConfig> = {
  R: {
    axis: 'x',
    filter: (x) => x === 1,
    baseAngle: -Math.PI / 2,
  },
  L: {
    axis: 'x',
    filter: (x) => x === -1,
    baseAngle: Math.PI / 2,
  },
  U: {
    axis: 'y',
    filter: (_, y) => y === 1,
    baseAngle: -Math.PI / 2,
  },
  D: {
    axis: 'y',
    filter: (_, y) => y === -1,
    baseAngle: Math.PI / 2,
  },
  F: {
    axis: 'z',
    filter: (_, __, z) => z === 1,
    baseAngle: -Math.PI / 2,
  },
  B: {
    axis: 'z',
    filter: (_, __, z) => z === -1,
    baseAngle: Math.PI / 2,
  },
}

const PLASTIC_BLACK = '#18181b'

function getStickerColor(
  x: number,
  y: number,
  z: number,
  faceDirection: 0 | 1 | 2 | 3 | 4 | 5,
  cubeState: CubeState
): string {
  // 0: +X (Right)
  if (faceDirection === 0) {
    if (x !== 1) return PLASTIC_BLACK
    const row = 1 - y
    const col = 1 - z
    const idx = row * 3 + col
    return COLOR_HEX[cubeState.R[idx]] || PLASTIC_BLACK
  }

  // 1: -X (Left)
  if (faceDirection === 1) {
    if (x !== -1) return PLASTIC_BLACK
    const row = 1 - y
    const col = z + 1
    const idx = row * 3 + col
    return COLOR_HEX[cubeState.L[idx]] || PLASTIC_BLACK
  }

  // 2: +Y (Up)
  if (faceDirection === 2) {
    if (y !== 1) return PLASTIC_BLACK
    const row = z + 1
    const col = x + 1
    const idx = row * 3 + col
    return COLOR_HEX[cubeState.U[idx]] || PLASTIC_BLACK
  }

  // 3: -Y (Down)
  if (faceDirection === 3) {
    if (y !== -1) return PLASTIC_BLACK
    const row = 1 - z
    const col = x + 1
    const idx = row * 3 + col
    return COLOR_HEX[cubeState.D[idx]] || PLASTIC_BLACK
  }

  // 4: +Z (Front)
  if (faceDirection === 4) {
    if (z !== 1) return PLASTIC_BLACK
    const row = 1 - y
    const col = x + 1
    const idx = row * 3 + col
    return COLOR_HEX[cubeState.F[idx]] || PLASTIC_BLACK
  }

  // 5: -Z (Back)
  if (faceDirection === 5) {
    if (z !== -1) return PLASTIC_BLACK
    const row = 1 - y
    const col = 1 - x
    const idx = row * 3 + col
    return COLOR_HEX[cubeState.B[idx]] || PLASTIC_BLACK
  }

  return PLASTIC_BLACK
}

interface CubieProps {
  x: number
  y: number
  z: number
  cubeState: CubeState
}

const Cubie: React.FC<CubieProps> = React.memo(({ x, y, z, cubeState }) => {
  const materials = useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map((direction) => {
      const color = getStickerColor(
        x,
        y,
        z,
        direction as 0 | 1 | 2 | 3 | 4 | 5,
        cubeState
      )
      const isPlastic = color === PLASTIC_BLACK
      return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: isPlastic ? 0.7 : 0.25,
        metalness: isPlastic ? 0.2 : 0.05,
      })
    })
  }, [x, y, z, cubeState])

  const spacing = 1.05

  return (
    <mesh
      position={[x * spacing, y * spacing, z * spacing]}
      material={materials}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[0.96, 0.96, 0.96]} />
    </mesh>
  )
})

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

interface AnimatedCubeGroupProps {
  cubeState: CubeState
  cubies: { x: number; y: number; z: number; key: string }[]
  animatingMove?: string | null
  animationDirection?: 1 | -1
  animationDuration?: number
  onAnimationComplete?: () => void
}

const AnimatedCubeGroup: React.FC<AnimatedCubeGroupProps> = ({
  cubeState,
  cubies,
  animatingMove,
  animationDirection = 1,
  animationDuration = 0.35,
  onAnimationComplete,
}) => {
  const rotatingGroupRef = useRef<THREE.Group>(null)
  const progressRef = useRef(0)
  const isAnimatingRef = useRef(false)
  const moveConfigRef = useRef<{ axis: 'x' | 'y' | 'z'; targetAngle: number } | null>(null)

  const activeMove = animatingMove?.trim() || null
  const face = activeMove ? (activeMove[0] as Face) : null
  const config = face && MOVE_CONFIGS[face] ? MOVE_CONFIGS[face] : null

  // Trigger rotation animation whenever activeMove changes
  useEffect(() => {
    if (activeMove && config) {
      let mult = 1
      if (activeMove.includes('2')) mult = 2
      else if (activeMove.includes("'")) mult = -1

      if (animationDirection === -1) mult *= -1

      const targetAngle = config.baseAngle * mult
      moveConfigRef.current = { axis: config.axis, targetAngle }
      progressRef.current = 0
      isAnimatingRef.current = true

      if (rotatingGroupRef.current) {
        rotatingGroupRef.current.rotation.set(0, 0, 0)
      }
    } else {
      isAnimatingRef.current = false
      moveConfigRef.current = null
      progressRef.current = 0
      if (rotatingGroupRef.current) {
        rotatingGroupRef.current.rotation.set(0, 0, 0)
      }
    }
  }, [activeMove, animationDirection, config])

  useFrame((_, delta) => {
    if (!isAnimatingRef.current || !moveConfigRef.current || !rotatingGroupRef.current) {
      return
    }

    const duration = Math.max(0.05, animationDuration)
    progressRef.current += delta / duration

    if (progressRef.current >= 1) {
      progressRef.current = 1
      isAnimatingRef.current = false
      if (rotatingGroupRef.current) {
        rotatingGroupRef.current.rotation.set(0, 0, 0)
      }
      onAnimationComplete?.()
    } else {
      const ease = easeInOutCubic(progressRef.current)
      const angle = moveConfigRef.current.targetAngle * ease
      const axis = moveConfigRef.current.axis

      rotatingGroupRef.current.rotation.set(0, 0, 0)
      rotatingGroupRef.current.rotation[axis] = angle
    }
  })

  // Partition cubies into stationary and rotating
  const { stationaryCubies, rotatingCubies } = useMemo(() => {
    if (!config) {
      return { stationaryCubies: cubies, rotatingCubies: [] }
    }
    const stat: typeof cubies = []
    const rot: typeof cubies = []
    for (const c of cubies) {
      if (config.filter(c.x, c.y, c.z)) {
        rot.push(c)
      } else {
        stat.push(c)
      }
    }
    return { stationaryCubies: stat, rotatingCubies: rot }
  }, [cubies, config])

  return (
    <group>
      {/* Stationary layer (non-moving cubies) */}
      <group>
        {stationaryCubies.map(({ x, y, z, key }) => (
          <Cubie key={key} x={x} y={y} z={z} cubeState={cubeState} />
        ))}
      </group>

      {/* Rotating layer (animated face slice) */}
      <group ref={rotatingGroupRef}>
        {rotatingCubies.map(({ x, y, z, key }) => (
          <Cubie key={key} x={x} y={y} z={z} cubeState={cubeState} />
        ))}
      </group>
    </group>
  )
}

export interface RubiksCube3DProps {
  cubeState: CubeState
  interactive?: boolean
  autoRotate?: boolean
  // Rotating layer animation props
  animatingMove?: string | null
  animationDirection?: 1 | -1
  animationDuration?: number
  onAnimationComplete?: () => void
}

export const RubiksCube3D: React.FC<RubiksCube3DProps> = ({
  cubeState,
  interactive = true,
  autoRotate = false,
  animatingMove = null,
  animationDirection = 1,
  animationDuration = 0.35,
  onAnimationComplete,
}) => {
  const cubies = useMemo(() => {
    const list: { x: number; y: number; z: number; key: string }[] = []
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          list.push({ x, y, z, key: `${x}_${y}_${z}` })
        }
      }
    }
    return list
  }, [])

  return (
    <div className="w-full h-full min-h-[350px] relative select-none">
      <Canvas
        camera={{ position: [4.5, 3.8, 5.2], fov: 42 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight
          position={[10, 12, 10]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-10, -5, -10]} intensity={0.5} />
        <pointLight position={[0, 6, 0]} intensity={0.6} />

        <Center>
          <AnimatedCubeGroup
            cubeState={cubeState}
            cubies={cubies}
            animatingMove={animatingMove}
            animationDirection={animationDirection}
            animationDuration={animationDuration}
            onAnimationComplete={onAnimationComplete}
          />
        </Center>

        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={4}
            maxDistance={12}
            autoRotate={autoRotate}
            autoRotateSpeed={1.0}
            dampingFactor={0.05}
          />
        )}
      </Canvas>

      {/* Helpful view hints overlay */}
      <div className="absolute bottom-2 right-2 pointer-events-none text-xs text-slate-400/80 bg-slate-900/60 px-2 py-1 rounded backdrop-blur border border-slate-800">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  )
}
