import { Component, Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ScrollControls, Sparkles, useScroll, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { texUrl } from '../api/tmdb'

// a poster whose texture fails to load is skipped instead of crashing the scene
class SafeCard extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

const W = 2.4
const H = 3.6
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const smooth = (t) => t * t * (3 - 2 * t)

function Card({ movie, index, count, onOpen, goTo }) {
  const texture = useTexture(texUrl(movie.poster_path, 'w500'))
  const scroll = useScroll()
  const group = useRef()
  const front = useRef()
  const back = useRef()
  const lift = useRef(0)
  const [hovered, setHovered] = useState(false)

  useFrame((_, dt) => {
    const p = scroll.offset * (count - 1)
    const d = index - p
    const s = smooth(Math.min(Math.abs(d), 1))

    // stack trails up-right and away; passed cards sweep down-left past the camera
    const x = d >= 0 ? d * 1.25 : d * 3.2
    const y = d >= 0 ? d * 0.55 : d * 1.4
    const z = d >= 0 ? -d * 1.7 : -d * 1.2

    lift.current = THREE.MathUtils.damp(lift.current, hovered ? 1 : 0, 8, dt)
    const g = group.current
    g.position.set(x, y + lift.current * 0.3, z + lift.current * 0.6)
    g.rotation.set(0, -0.95 * s, 0.04 * s * (d >= 0 ? 1 : -1))

    const fadeOut = d < 0 ? 1 - clamp(-d, 0, 1) : 1 - clamp((d - 6) / 2, 0, 1)
    const shade = 1 - clamp(d, 0, 8) * 0.05
    g.visible = fadeOut > 0.01
    for (const m of [front.current, back.current]) {
      m.opacity = fadeOut
      m.color.setScalar(shade)
    }
  })

  const click = (e) => {
    e.stopPropagation()
    const d = index - scroll.offset * (count - 1)
    if (Math.abs(d) < 0.5) onOpen(movie)
    else goTo(index)
  }

  return (
    <group
      ref={group}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      onClick={click}
    >
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[W + 0.14, H + 0.14]} />
        <meshBasicMaterial ref={back} color="#ffffff" transparent side={THREE.DoubleSide} />
      </mesh>
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial ref={front} map={texture} transparent toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// bridges the scroll state with the React UI (active index + programmatic navigation)
function Controller({ count, navRef, onIndex }) {
  const scroll = useScroll()
  const current = useRef(-1)

  useEffect(() => {
    navRef.current = (i) => {
      const el = scroll.el
      const max = el.scrollHeight - el.clientHeight
      const target = (clamp(i, 0, count - 1) / (count - 1)) * max
      el.scrollTo({ top: target, behavior: 'smooth' })
    }
  }, [count, navRef, scroll])

  useFrame(() => {
    const i = Math.round(scroll.offset * (count - 1))
    if (i !== current.current) {
      current.current = i
      onIndex(i)
    }
  })
  return null
}

// shift the whole stack so the active card sits left of centre on any aspect ratio
function Stack({ children }) {
  const { viewport } = useThree()
  return <group position={[-viewport.width * 0.22, -0.9, 0]}>{children}</group>
}

function Rig() {
  useFrame(({ camera, pointer }, dt) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.8, 3, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pointer.y * 0.5, 3, dt)
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function Scene({ movies, navRef, onIndex, onOpen }) {
  const count = movies.length
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 35 }} dpr={[1, 2]}>
      <Sparkles count={70} scale={[20, 12, 14]} size={3} speed={0.3} color="#7a5cff" opacity={0.6} />
      <Rig />
      <ScrollControls pages={Math.max(3, count * 0.5)} damping={0.3}>
        <Controller count={count} navRef={navRef} onIndex={onIndex} />
        <Stack>
          {movies.map((m, i) => (
            <SafeCard key={m.id}>
              <Suspense fallback={null}>
                <Card
                  movie={m}
                  index={i}
                  count={count}
                  onOpen={onOpen}
                  goTo={(n) => navRef.current?.(n)}
                />
              </Suspense>
            </SafeCard>
          ))}
        </Stack>
      </ScrollControls>
    </Canvas>
  )
}
