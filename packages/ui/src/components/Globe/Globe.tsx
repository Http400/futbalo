import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import {
  pointVertexShader,
  pointFragmentShader,
  earthVertexShader,
  earthFragmentShader,
  atmosphereShellVertexShader,
  atmosphereShellFragmentShader,
} from './shaders'

export interface GlobePoint {
  /** Latitude in degrees (-90 to 90) */
  lat: number
  /** Longitude in degrees (-180 to 180) */
  lng: number
  /** Unique identifier to track which points have already been rendered */
  id: string
  /** Label text displayed next to the point. Defaults to `id`. */
  label?: string
  /** Size multiplier for this point. Defaults to 1. */
  size?: number
}

export interface GlobeProps {
  /** Points to display on the globe */
  points?: GlobePoint[]
  /** Fixed width in px. Defaults to 100% of the container. */
  width?: number
  /** Fixed height in px. Defaults to 100% of the container. */
  height?: number
  /** Automatically rotate the globe. Default: true */
  autoRotate?: boolean
  /** Rotation speed in radians per frame. Default: 0.0005 */
  rotationSpeed?: number
  /** How fast points fade out (lifetime units per second). Default: 0.25 */
  fadeSpeed?: number
  /** When set, the globe animates to bring this lat/lng to the center of the view. */
  focusPoint?: { lat: number; lng: number } | null
  /** Initial lat/lng to center on when the globe first loads (no animation). */
  initialView?: { lat: number; lng: number } | null
  /** Allow the user to manually rotate the globe by dragging. Default: true */
  allowManualRotation?: boolean
}

function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

const GLOBE_RADIUS = 5
const MAX_POINTS = 1000
const BASE = 'https://threejs.org/examples/textures/planets'
const EARTH_DAY    = `${BASE}/earth_day_4096.jpg`
const EARTH_NIGHT  = `${BASE}/earth_night_4096.jpg`
const EARTH_BRC    = `${BASE}/earth_bump_roughness_clouds_4096.jpg`

// Sun direction in world space (fixed, normalized)
const SUN_DIRECTION = new THREE.Vector3(-1, 0.5, 1).normalize()
// Colors matching the three.js TSL earth example
const ATM_DAY_COLOR      = new THREE.Color('#4db2ff')
const ATM_TWILIGHT_COLOR = new THREE.Color('#bc490b')

interface SceneState {
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  rotationGroup: THREE.Group
  positionsBuffer: Float32Array
  lifetimesBuffer: Float32Array
  sizesBuffer: Float32Array
  pointsGeometry: THREE.BufferGeometry
  cursor: number
  animationId: number
}

interface LabelEntry {
  el: HTMLDivElement
  /** Point position in rotationGroup local space */
  localPos: THREE.Vector3
}

interface LabelLayout {
  el: HTMLDivElement
  x: number
  y: number
  w: number
  h: number
}

export default function Globe({
  points = [],
  width,
  height,
  autoRotate = true,
  rotationSpeed = 0.0005,
  fadeSpeed = 0,
  focusPoint = null,
  initialView = null,
  allowManualRotation = true,
}: GlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<SceneState | null>(null)
  const isDraggingRef = useRef(false)
  const previousMouseRef = useRef({ x: 0, y: 0 })
  const seenIdsRef = useRef<Set<string>>(new Set())
  const pointIndexByIdRef = useRef<Map<string, number>>(new Map())
  const targetRotRef = useRef<{ x: number; y: number } | null>(null)
  const labelsRef = useRef<LabelEntry[]>([])
  const allowManualRotationRef = useRef(allowManualRotation)

  useEffect(() => {
    allowManualRotationRef.current = allowManualRotation
  }, [allowManualRotation])

  // ------------------------------------------------------------------
  // Scene setup (runs once on mount)
  // ------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const w = width ?? container.clientWidth
    const h = height ?? container.clientHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Scene + Camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000)
    camera.position.z = 15

    // Group that rotates (globe + points)
    const rotationGroup = new THREE.Group()
    if (initialView) {
      rotationGroup.rotation.x = initialView.lat * (Math.PI / 180)
      rotationGroup.rotation.y = -Math.PI / 2 - initialView.lng * (Math.PI / 180)
    }
    scene.add(rotationGroup)

    // Earth globe
    const textureLoader = new THREE.TextureLoader()

    const dayTex = textureLoader.load(EARTH_DAY)
    dayTex.colorSpace = THREE.SRGBColorSpace
    dayTex.anisotropy = 8

    const nightTex = textureLoader.load(EARTH_NIGHT)
    nightTex.colorSpace = THREE.SRGBColorSpace
    nightTex.anisotropy = 8

    const brcTex = textureLoader.load(EARTH_BRC)
    brcTex.anisotropy = 8

    const globeUniforms = {
      dayTexture:            { value: dayTex },
      nightTexture:          { value: nightTex },
      brcTexture:            { value: brcTex },
      sunDirection:          { value: SUN_DIRECTION },
      atmosphereDayColor:    { value: ATM_DAY_COLOR },
      atmosphereTwilightColor: { value: ATM_TWILIGHT_COLOR },
    }

    const globeMaterial = new THREE.ShaderMaterial({
      vertexShader:   earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms:       globeUniforms,
    })
    const sphereGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64)
    const globeMesh = new THREE.Mesh(sphereGeometry, globeMaterial)
    rotationGroup.add(globeMesh)

    // Atmosphere shell (BackSide, 4 % larger than globe)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader:   atmosphereShellVertexShader,
      fragmentShader: atmosphereShellFragmentShader,
      uniforms: {
        sunDirection:            { value: SUN_DIRECTION },
        atmosphereDayColor:      { value: ATM_DAY_COLOR },
        atmosphereTwilightColor: { value: ATM_TWILIGHT_COLOR },
      },
      side:        THREE.BackSide,
      transparent: true,
      depthWrite:  false,
    })
    const atmosphereMesh = new THREE.Mesh(sphereGeometry, atmosphereMaterial)
    atmosphereMesh.scale.setScalar(1.04)
    rotationGroup.add(atmosphereMesh)

    // Lighting (kept for any future non-ShaderMaterial objects)
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const sun = new THREE.DirectionalLight(0xffffff, 1.5)
    sun.position.set(10, 5, 10)
    scene.add(sun)

    // Points system (pre-allocated buffer)
    const positionsBuffer = new Float32Array(MAX_POINTS * 3)
    const lifetimesBuffer = new Float32Array(MAX_POINTS)
    const sizesBuffer = new Float32Array(MAX_POINTS).fill(1)
    const pointsGeometry = new THREE.BufferGeometry()
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positionsBuffer, 3))
    pointsGeometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimesBuffer, 1))
    pointsGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizesBuffer, 1))

    const pointsMaterial = new THREE.ShaderMaterial({
      vertexShader: pointVertexShader,
      fragmentShader: pointFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    rotationGroup.add(new THREE.Points(pointsGeometry, pointsMaterial))

    stateRef.current = {
      renderer,
      camera,
      scene,
      rotationGroup,
      positionsBuffer,
      lifetimesBuffer,
      sizesBuffer,
      pointsGeometry,
      cursor: 0,
      animationId: 0,
    }

    // ------------------------------------------------------------------
    // Mouse / touch drag to rotate
    // ------------------------------------------------------------------
    const onMouseDown = (e: MouseEvent) => {
      if (!allowManualRotationRef.current) return
      isDraggingRef.current = true
      previousMouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const dx = e.clientX - previousMouseRef.current.x
      const dy = e.clientY - previousMouseRef.current.y
      rotationGroup.rotation.y += dx * 0.005
      rotationGroup.rotation.x += dy * 0.005
      rotationGroup.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationGroup.rotation.x))
      previousMouseRef.current = { x: e.clientX, y: e.clientY }
    }
    const onMouseUp = () => { isDraggingRef.current = false }

    canvas.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    // ------------------------------------------------------------------
    // Animation loop
    // ------------------------------------------------------------------
    let lastTime = 0
    // Pre-allocated scratch vectors to avoid per-frame heap allocation
    const tmpWorld = new THREE.Vector3()
    const tmpNDC = new THREE.Vector3()
    const animate = (time: number) => {
      stateRef.current!.animationId = requestAnimationFrame(animate)
      const delta = Math.min((time - lastTime) / 1000, 0.1)
      lastTime = time

      const target = targetRotRef.current
      if (target) {
        const LERP = 0.05
        rotationGroup.rotation.x += (target.x - rotationGroup.rotation.x) * LERP
        const dy = target.y - rotationGroup.rotation.y
        // Normalize to shortest arc
        const dyNorm = ((dy + Math.PI) % (2 * Math.PI)) - Math.PI
        rotationGroup.rotation.y += dyNorm * LERP
        if (Math.abs(target.x - rotationGroup.rotation.x) < 0.001 && Math.abs(dyNorm) < 0.001) {
          rotationGroup.rotation.x = target.x
          rotationGroup.rotation.y = target.y
          targetRotRef.current = null
        }
      } else if (autoRotate && !isDraggingRef.current) {
        rotationGroup.rotation.y += rotationSpeed
      }

      // Fade out points over time
      let dirty = false
      for (let i = 0; i < MAX_POINTS; i++) {
        const lt = lifetimesBuffer[i] ?? 0
        if (lt > 0) {
          lifetimesBuffer[i] = Math.max(0, lt - delta * fadeSpeed)
          dirty = true
        }
      }
      if (dirty) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        pointsGeometry.attributes['lifetime']!.needsUpdate = true
      }

      // Update HTML label positions
      const canvasW = renderer.domElement.clientWidth || (width ?? 640)
      const canvasH = renderer.domElement.clientHeight || (height ?? 640)
      // A point is on the front hemisphere when its world Z > R²/cameraZ
      const visibilityThreshold = (GLOBE_RADIUS * GLOBE_RADIUS) / camera.position.z
      const layout: LabelLayout[] = []
      for (const { el, localPos } of labelsRef.current) {
        tmpWorld.copy(localPos)
        rotationGroup.localToWorld(tmpWorld)
        const visible = tmpWorld.z > visibilityThreshold
        el.style.opacity = visible ? '1' : '0'
        if (visible) {
          tmpNDC.copy(tmpWorld).project(camera)
          const sx = (tmpNDC.x + 1) / 2 * canvasW + 10
          const sy = (-tmpNDC.y + 1) / 2 * canvasH - 10
          layout.push({ el, x: sx, y: sy, w: el.offsetWidth || 80, h: el.offsetHeight || 20 })
        }
      }

      // Iterative repulsion — push overlapping labels apart
      const PAD = 4
      for (let iter = 0; iter < 8; iter++) {
        for (let i = 0; i < layout.length; i++) {
          for (let j = i + 1; j < layout.length; j++) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const a = layout[i]!, b = layout[j]!
            const dx = b.x - a.x
            const dy = b.y - a.y
            const overlapX = (a.w + b.w) / 2 + PAD - Math.abs(dx)
            const overlapY = (a.h + b.h) / 2 + PAD - Math.abs(dy)
            if (overlapX > 0 && overlapY > 0) {
              // Separate on the axis with smaller overlap
              if (overlapY <= overlapX) {
                const sep = overlapY / 2
                if (dy >= 0) { a.y -= sep; b.y += sep } else { a.y += sep; b.y -= sep }
              } else {
                const sep = overlapX / 2
                if (dx >= 0) { a.x -= sep; b.x += sep } else { a.x += sep; b.x -= sep }
              }
            }
          }
        }
      }

      // Clamp labels to the visible portion of the canvas (canvas may extend beyond viewport)
      const canvasRect = renderer.domElement.getBoundingClientRect()
      const minX = Math.max(0, -canvasRect.left)
      const minY = Math.max(0, -canvasRect.top)
      const maxX = Math.min(canvasW, window.innerWidth - canvasRect.left)
      const maxY = Math.min(canvasH, window.innerHeight - canvasRect.top)
      for (const item of layout) {
        const cx = Math.max(minX, Math.min(item.x, maxX - item.w))
        const cy = Math.max(minY, Math.min(item.y, maxY - item.h))
        item.el.style.transform = `translate(${cx}px, ${cy}px)`
      }

      renderer.render(scene, camera)
    }
    stateRef.current.animationId = requestAnimationFrame(animate)

    // ------------------------------------------------------------------
    // Resize handling
    // ------------------------------------------------------------------
    const onResize = () => {
      if (!container || !stateRef.current) return
      const w = width ?? container.clientWidth
      const h = height ?? container.clientHeight
      stateRef.current.camera.aspect = w / h
      stateRef.current.camera.updateProjectionMatrix()
      stateRef.current.renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      if (stateRef.current) {
        cancelAnimationFrame(stateRef.current.animationId)
      }
      canvas.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      stateRef.current = null
      // Reset so points are re-added into the fresh buffer on remount
      // (React 18 Strict Mode double-invokes effects: mount → cleanup → remount)
      seenIdsRef.current = new Set()
      pointIndexByIdRef.current = new Map()
      // Remove label elements created for this scene
      for (const { el } of labelsRef.current) el.remove()
      labelsRef.current = []
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ------------------------------------------------------------------
  // Resize renderer when width/height props change
  // ------------------------------------------------------------------
  useEffect(() => {
    const state = stateRef.current
    const container = containerRef.current
    if (!state || !container) return
    const w = width ?? container.clientWidth
    const h = height ?? container.clientHeight
    state.camera.aspect = w / h
    state.camera.updateProjectionMatrix()
    state.renderer.setSize(w, h)
  }, [width, height])

  // ------------------------------------------------------------------
  // Animate globe to focusPoint when it changes
  // ------------------------------------------------------------------
  const computeTargetRot = useCallback((lat: number, lng: number) => {
    const targetX = lat * (Math.PI / 180)
    const targetY = -Math.PI / 2 - lng * (Math.PI / 180)
    return { x: targetX, y: targetY }
  }, [])

  useEffect(() => {
    const state = stateRef.current
    const target = focusPoint ?? initialView
    if (!target) return
    const rot = computeTargetRot(target.lat, target.lng)
    if (state) {
      // Normalize target Y so the globe takes the shortest arc from current rotation
      const currentY = state.rotationGroup.rotation.y
      const rawDiff = rot.y - currentY
      const normalized = ((rawDiff + Math.PI) % (2 * Math.PI)) - Math.PI
      rot.y = currentY + normalized
    }
    targetRotRef.current = rot
  }, [focusPoint, initialView, computeTargetRot])

  // ------------------------------------------------------------------
  // Add new points whenever the `points` prop changes
  // ------------------------------------------------------------------
  useEffect(() => {
    const state = stateRef.current
    const overlay = overlayRef.current
    if (!state) return

    for (const point of points) {
      if (seenIdsRef.current.has(point.id)) {
        // Update size for already-rendered points
        const idx = pointIndexByIdRef.current.get(point.id)
        if (idx !== undefined) {
          state.sizesBuffer[idx] = point.size ?? 1
        }
        continue
      }
      seenIdsRef.current.add(point.id)

      const pos = latLngToVec3(point.lat, point.lng, GLOBE_RADIUS + 0.05)
      const i = state.cursor * 3
      state.positionsBuffer[i] = pos.x
      state.positionsBuffer[i + 1] = pos.y
      state.positionsBuffer[i + 2] = pos.z
      state.lifetimesBuffer[state.cursor] = 1.0
      state.sizesBuffer[state.cursor] = point.size ?? 1
      pointIndexByIdRef.current.set(point.id, state.cursor)
      state.cursor = (state.cursor + 1) % MAX_POINTS

      // Create HTML label
      if (overlay) {
        const el = document.createElement('div')
        el.textContent = point.label ?? point.id
        el.style.cssText = [
          'position:absolute',
          'top:0',
          'left:0',
          'pointer-events:none',
          'color:#ffffff',
          'font-family:sans-serif',
          'font-size:0.75rem',
          'white-space:nowrap',
          'padding:2px 6px',
          'background:rgba(255,255,255,0.08)',
          'backdrop-filter:blur(8px)',
          'border:1px solid rgba(255,255,255,0.2)',
          'border-radius:4px',
          'transition:opacity 0.2s',
          'opacity:0',
        ].join(';')
        overlay.appendChild(el)
        labelsRef.current.push({ el, localPos: pos.clone() })
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    state.pointsGeometry.attributes['position']!.needsUpdate = true
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    state.pointsGeometry.attributes['lifetime']!.needsUpdate = true
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    state.pointsGeometry.attributes['aSize']!.needsUpdate = true
  }, [points])

  const resolvedWidth = width ?? '100%'
  const resolvedHeight = height ?? '100%'

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: resolvedWidth, height: resolvedHeight, cursor: allowManualRotation ? 'grab' : 'default' }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <div
        ref={overlayRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}
      />
    </div>
  )
}
