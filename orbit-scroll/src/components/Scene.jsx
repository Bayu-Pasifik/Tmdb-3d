import { Component, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ScrollControls, useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { texUrl } from '../api/tmdb'

const PW = 0.7
const PH = 1.05
// spin = how far the ring turns per poster-step of scroll
const RINGS = [
  { r: 3.0, tilt: [0.38, 0, 0.22], speed: 0.1, spin: 0.5 },
  { r: 4.0, tilt: [0.55, 0, -0.18], speed: -0.075, spin: -0.4 },
  { r: 5.0, tilt: [0.22, 0, 0.42], speed: 0.055, spin: 0.3 },
]
// focused poster parks in front, left of the planet so both stay visible
const FOCUS = new THREE.Vector3(-2.2, 0.1, 4.4)
const DEFAULT_TINT = new THREE.Color('#d9663a')
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/* ---------- textures + average colour (drives the planet tint) ---------- */
function useTextures(movies) {
  const [map, setMap] = useState({})
  useEffect(() => {
    let dead = false
    const loader = new THREE.TextureLoader()
    const cv = document.createElement('canvas')
    cv.width = cv.height = 8
    const ctx = cv.getContext('2d', { willReadFrequently: true })

    movies.forEach((m) =>
      loader.load(
        texUrl(m.poster_path, 'w342'),
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          let color = DEFAULT_TINT.clone()
          try {
            ctx.drawImage(tex.image, 0, 0, 8, 8)
            const d = ctx.getImageData(0, 0, 8, 8).data
            let r = 0, g = 0, b = 0
            for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2] }
            const n = d.length / 4
            color = new THREE.Color(r / n / 255, g / n / 255, b / n / 255)
            const hsl = {}
            color.getHSL(hsl)
            color.setHSL(hsl.h, clamp(hsl.s, 0.45, 0.75), clamp(hsl.l, 0.36, 0.5))
          } catch { /* keep default tint */ }
          if (!dead) setMap((prev) => ({ ...prev, [m.id]: { tex, color } }))
        },
        undefined,
        () => {}
      )
    )
    return () => { dead = true }
  }, [movies])
  return map
}

/* ---------- planet ---------- */
const planetVert = /* glsl */ `
  varying vec3 vNormal; varying vec3 vPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const planetFrag = /* glsl */ `
  uniform float uTime; uniform vec3 uColor;
  varying vec3 vNormal; varying vec3 vPos;
  void main() {
    vec3 n = normalize(vNormal);
    float fres = pow(1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0), 2.2);
    float band = sin(vPos.y * 5.0 + sin(vPos.x * 2.5 + uTime * 0.35) * 1.4 + sin(vPos.z * 3.0 - uTime * 0.25) + uTime * 0.2);
    float swirl = sin(vPos.x * 7.0 + vPos.z * 5.0 + uTime * 0.5) * 0.5 + 0.5;
    vec3 col = mix(uColor * 0.16, uColor * 0.95, 0.45 + 0.35 * band * swirl);
    col += uColor * fres * 1.15;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`
const glowFrag = /* glsl */ `
  uniform vec3 uColor; varying vec3 vNormal;
  void main() {
    float i = pow(0.15 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 3.5);
    gl_FragColor = vec4(uColor * 1.1, clamp(i, 0.0, 0.55));
    #include <colorspace_fragment>
  }
`

function Planet({ tint, count }) {
  const scroll = useScroll()
  const body = useRef()
  const bodyU = useMemo(() => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color() } }), [])
  const glowU = useMemo(() => ({ uColor: { value: new THREE.Color() } }), [])

  useFrame((s) => {
    // idle drift + the planet turns as you scroll
    body.current.rotation.y = s.clock.elapsedTime * 0.12 + scroll.offset * (count - 1) * 0.6
    bodyU.uTime.value = s.clock.elapsedTime
    bodyU.uColor.value.copy(tint.current)
    glowU.uColor.value.copy(tint.current)
  })

  return (
    <>
      <mesh ref={body}>
        <sphereGeometry args={[1.7, 64, 64]} />
        <shaderMaterial uniforms={bodyU} vertexShader={planetVert} fragmentShader={planetFrag} />
      </mesh>
      <mesh scale={1.3} raycast={() => null}>
        <sphereGeometry args={[1.7, 48, 48]} />
        <shaderMaterial
          uniforms={glowU}
          vertexShader={planetVert}
          fragmentShader={glowFrag}
          side={THREE.BackSide}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

/* ---------- orbit rings (line + dust that turns with scroll) ---------- */
function Ring({ r, tilt, speed, spin, tint, count }) {
  const scroll = useScroll()
  const dust = useRef()
  const dustMat = useRef()
  const lineMat = useRef()

  const linePts = useMemo(() => {
    const a = new Float32Array(257 * 3)
    for (let i = 0; i <= 256; i++) {
      const t = (i / 256) * Math.PI * 2
      a.set([Math.cos(t) * r, 0, Math.sin(t) * r], i * 3)
    }
    return a
  }, [r])
  const dustPts = useMemo(() => {
    const a = new Float32Array(260 * 3)
    for (let i = 0; i < 260; i++) {
      const t = Math.random() * Math.PI * 2
      const rr = r + (Math.random() - 0.5) * 0.6
      a.set([Math.cos(t) * rr, (Math.random() - 0.5) * 0.25, Math.sin(t) * rr], i * 3)
    }
    return a
  }, [r])

  useFrame((s) => {
    const p = scroll.offset * (count - 1)
    dust.current.rotation.y = -(s.clock.elapsedTime * speed * 1.4 + p * spin)
    lineMat.current.color.copy(tint.current)
    dustMat.current.color.copy(tint.current)
  })

  return (
    <group rotation={tilt}>
      <lineLoop>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePts, 3]} />
        </bufferGeometry>
        <lineBasicMaterial ref={lineMat} transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineLoop>
      <points ref={dust}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPts, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={dustMat} size={0.05} transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  )
}

/* ---------- a poster riding its ring; scroll flies the nearest one to the front ---------- */
const tmp = new THREE.Vector3()
const wp = new THREE.Vector3()
const mixed = new THREE.Color()

function Poster({ index, count, ringIndex, baseAngle, entry, ringMat, onPick }) {
  const scroll = useScroll()
  const group = useRef()
  const hover = useRef(0)
  const [hovered, setHovered] = useState(false)
  const ring = RINGS[ringIndex]

  useFrame((s, dt) => {
    const g = group.current
    const p = scroll.offset * (count - 1)
    // continuous focus: 1 when this poster is the current scroll position, 0 one step away
    const f = THREE.MathUtils.smoothstep(1 - Math.min(Math.abs(index - p), 1), 0, 1)
    hover.current = THREE.MathUtils.damp(hover.current, hovered && f < 0.5 ? 1 : 0, 10, dt)

    // posters ride the ring; scroll adds extra rotation so the whole system spins as you travel
    const ang = baseAngle + s.clock.elapsedTime * ring.speed + p * ring.spin
    tmp.set(Math.cos(ang) * ring.r, 0, Math.sin(ang) * ring.r).applyMatrix4(ringMat)
    g.position.lerpVectors(tmp, FOCUS, f)

    // partly cancel perspective so front-side posters don't dwarf the planet
    const depthFix = Math.pow(g.getWorldPosition(wp).distanceTo(s.camera.position) / 12, 0.6)
    g.scale.setScalar((1 + f * 2.1) * (1 + hover.current * 0.25) * depthFix)
    g.quaternion.copy(s.camera.quaternion) // billboard
  })

  return (
    <group
      ref={group}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      onClick={(e) => { e.stopPropagation(); onPick(index) }}
    >
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[PW + 0.06, PH + 0.06]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh>
        <planeGeometry args={[PW, PH]} />
        {/* key remounts the material once the texture arrives (a map added later is not compiled in) */}
        <meshBasicMaterial key={entry ? 'loaded' : 'pending'} map={entry?.tex || null} color={entry ? '#ffffff' : '#27407f'} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ---------- background stars ---------- */
function Stars() {
  const ref = useRef()
  const pts = useMemo(() => {
    const a = new Float32Array(500 * 3)
    for (let i = 0; i < 500; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(18 + Math.random() * 14)
      a.set([v.x, v.y, v.z], i * 3)
    }
    return a
  }, [])
  useFrame((_, dt) => { ref.current.rotation.y += dt * 0.01 })
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[pts, 3]} /></bufferGeometry>
      <pointsMaterial size={0.09} color="#e8dccb" transparent opacity={0.5} depthWrite={false} />
    </points>
  )
}

/* ---------- whole system (lives inside ScrollControls) ---------- */
function System({ movies, textures, navRef, onIndex, onPick }) {
  const scroll = useScroll()
  const group = useRef()
  const lastIndex = useRef(-1)
  const { viewport, camera, pointer } = useThree()
  const tint = useRef(DEFAULT_TINT.clone())
  const ringMats = useMemo(
    () => RINGS.map((r) => new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...r.tilt))),
    []
  )
  const n = movies.length
  const perRing = [0, 1, 2].map((k) => movies.filter((_, i) => i % 3 === k).length)

  // expose programmatic scroll-to-poster for buttons, thumbnails, keys and clicks
  useEffect(() => {
    navRef.current = (i) => {
      const el = scroll.el
      const max = el.scrollHeight - el.clientHeight
      el.scrollTo({ top: (clamp(i, 0, n - 1) / (n - 1)) * max, behavior: 'smooth' })
    }
  }, [navRef, scroll, n])

  useFrame((_, dt) => {
    const p = scroll.offset * (n - 1)

    // report the nearest poster to the UI
    const idx = Math.round(p)
    if (idx !== lastIndex.current) { lastIndex.current = idx; onIndex(idx) }

    // planet tint cross-fades between the two posters the scroll is between
    const i0 = Math.floor(p)
    const i1 = Math.min(i0 + 1, n - 1)
    const c0 = textures[movies[i0]?.id]?.color || DEFAULT_TINT
    const c1 = textures[movies[i1]?.id]?.color || DEFAULT_TINT
    mixed.copy(c0).lerp(c1, p - i0)
    tint.current.lerp(mixed, 1 - Math.exp(-6 * dt))

    const wide = viewport.width > 8.5
    const g = group.current
    g.position.x = THREE.MathUtils.damp(g.position.x, wide ? viewport.width * 0.17 : 0, 4, dt)
    g.scale.setScalar(clamp(viewport.width / 14, 0.55, 1))

    // camera drifts with the mouse and gently swoops as you scroll
    const o = scroll.offset
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.8, 3, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.6 + pointer.y * 0.5 + (o - 0.5) * 1.4, 3, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 12 - Math.sin(o * Math.PI) * 1.6, 3, dt)
    camera.lookAt(0, 0, 0)
  })

  return (
    <group ref={group}>
      <Planet tint={tint} count={n} />
      {RINGS.map((r, i) => (
        <Ring key={i} {...r} tint={tint} count={n} />
      ))}
      {movies.map((m, i) => {
        const ringIndex = i % 3
        const slot = Math.floor(i / 3)
        return (
          <Poster
            key={m.id}
            index={i}
            count={n}
            ringIndex={ringIndex}
            baseAngle={(slot / Math.max(perRing[ringIndex], 1)) * Math.PI * 2 + ringIndex * 1.1}
            entry={textures[m.id]}
            ringMat={ringMats[ringIndex]}
            onPick={onPick}
          />
        )
      })}
    </group>
  )
}

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <p className="state error">WebGL failed to start.</p> : this.props.children }
}

export default function Scene({ movies, navRef, onIndex, onPick }) {
  const textures = useTextures(movies)
  return (
    <SceneBoundary>
      <Canvas camera={{ position: [0, 0.6, 12], fov: 38 }} dpr={[1, 2]}>
        <Stars />
        <ScrollControls pages={Math.max(4, movies.length * 0.6)} damping={0.25}>
          <System movies={movies} textures={textures} navRef={navRef} onIndex={onIndex} onPick={onPick} />
        </ScrollControls>
      </Canvas>
    </SceneBoundary>
  )
}
