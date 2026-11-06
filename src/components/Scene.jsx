import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, ScrollControls, Sparkles, useScroll } from '@react-three/drei'
import * as THREE from 'three'
import Poster from './Poster'

const PER_TURN = 8
const RADIUS = 5
const STEP_Y = 0.55

function Helix({ movies, onSelect }) {
  const group = useRef()
  const scroll = useScroll()
  const last = Math.max(movies.length - 1, 1)

  useFrame((_, dt) => {
    const t = scroll.offset
    const targetRot = -((t * last) / PER_TURN) * Math.PI * 2
    const targetY = t * last * STEP_Y
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetRot, 4, dt)
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, targetY, 4, dt)
  })

  return (
    <group ref={group}>
      {movies.map((movie, i) => {
        const a = (i / PER_TURN) * Math.PI * 2
        return (
          <Suspense key={movie.id} fallback={null}>
            <Poster
              movie={movie}
              position={[Math.sin(a) * RADIUS, -i * STEP_Y, Math.cos(a) * RADIUS]}
              rotation={[0, a, 0]}
              onSelect={onSelect}
            />
          </Suspense>
        )
      })}
    </group>
  )
}

function Orbs() {
  const colors = ['#ff9ad5', '#8ec5ff', '#ffe08a', '#b5f5c8', '#c9a7ff']
  return (
    <>
      {Array.from({ length: 14 }).map((_, i) => (
        <Float key={i} speed={1 + (i % 4) * 0.4} floatIntensity={2}>
          <mesh
            position={[
              Math.sin(i * 2.4) * 8,
              Math.cos(i * 1.7) * 4,
              Math.cos(i * 2.4) * 8 - 2,
            ]}
          >
            <sphereGeometry args={[0.15 + (i % 3) * 0.12, 24, 24]} />
            <meshStandardMaterial color={colors[i % colors.length]} roughness={0.2} metalness={0.1} />
          </mesh>
        </Float>
      ))}
    </>
  )
}

function Rig() {
  // mouse parallax
  useFrame(({ camera, pointer }, dt) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 1.5, 3, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pointer.y * 0.8, 3, dt)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function Scene({ movies, onSelect }) {
  return (
    <Canvas camera={{ position: [0, 0, 11], fov: 40 }} dpr={[1, 2]}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 6, 5]} intensity={1.5} />
      <Sparkles count={120} scale={[18, 10, 18]} size={4} speed={0.4} color="#ffffff" />
      <Orbs />
      <Rig />
      <ScrollControls pages={Math.max(3, movies.length * 0.35)} damping={0.25}>
        <Helix movies={movies} onSelect={onSelect} />
      </ScrollControls>
    </Canvas>
  )
}
