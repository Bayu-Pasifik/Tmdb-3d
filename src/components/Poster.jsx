import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { img } from '../api/tmdb'

export default function Poster({ movie, position, rotation, onSelect }) {
  const texture = useTexture(img(movie.poster_path))
  const inner = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((_, dt) => {
    const target = hovered ? 1.2 : 1
    const s = THREE.MathUtils.damp(inner.current.scale.x, target, 8, dt)
    inner.current.scale.setScalar(s)
  })

  return (
    <group position={position} rotation={rotation}>
      <Float speed={2} rotationIntensity={0.25} floatIntensity={0.6}>
        <group
          ref={inner}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setHovered(false)
            document.body.style.cursor = 'auto'
          }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(movie)
          }}
        >
          {/* white frame */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.3, 1.9]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
          {/* poster */}
          <mesh>
            <planeGeometry args={[1.2, 1.8]} />
            <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </Float>
    </group>
  )
}
