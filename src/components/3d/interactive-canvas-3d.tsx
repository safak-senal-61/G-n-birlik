'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface InteractiveCanvas3DProps {
  className?: string
  scrollProgress?: number
}

export function InteractiveCanvas3D({ className = '', scrollProgress = 0 }: InteractiveCanvas3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef(scrollProgress)
  scrollRef.current = scrollProgress

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // 1. Scene setup
    const scene = new THREE.Scene()
    const width = mount.clientWidth || 500
    const height = mount.clientHeight || 500

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 1.2, 7.2)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.25
      mount.appendChild(renderer.domElement)
    } catch {
      return
    }

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const emeraldLight = new THREE.PointLight(0x10b981, 3.5, 20)
    emeraldLight.position.set(2.5, 3, 4)
    scene.add(emeraldLight)

    const amberLight = new THREE.PointLight(0xf59e0b, 2.5, 12)
    amberLight.position.set(-2, -1, 3)
    scene.add(amberLight)

    const coreLight = new THREE.PointLight(0x34d399, 2.0, 10)
    coreLight.position.set(0, 0, 0)
    scene.add(coreLight)

    // 3. Central Radar & Escrow Vault Group
    const worldGroup = new THREE.Group()
    scene.add(worldGroup)

    // A. Concentric GPS Radar Rings (5km, 10km, 25km range)
    const radarGroup = new THREE.Group()
    radarGroup.rotation.x = Math.PI * 0.42 // Slight 3D tilt
    worldGroup.add(radarGroup)

    const ringRadii = [1.5, 2.4, 3.2]
    const ringMaterials: THREE.MeshBasicMaterial[] = []
    const ringGeometries: THREE.RingGeometry[] = []

    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.RingGeometry(r, r + 0.02, 64)
      const ringMat = new THREE.MeshBasicMaterial({
        color: idx === 1 ? 0x10b981 : 0x059669,
        transparent: true,
        opacity: 0.35 - idx * 0.08,
        side: THREE.DoubleSide,
      })
      ringGeometries.push(ringGeo)
      ringMaterials.push(ringMat)
      const ringMesh = new THREE.Mesh(ringGeo, ringMat)
      radarGroup.add(ringMesh)
    })

    // Radar Scanning Sweep Beam (Pie slice)
    const sweepGeo = new THREE.CircleGeometry(3.2, 32, 0, Math.PI / 4)
    const sweepMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
    })
    const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat)
    radarGroup.add(sweepMesh)

    // B. Central Escrow Vault (Emanet Kasası)
    const vaultGroup = new THREE.Group()
    worldGroup.add(vaultGroup)

    // Outer Faceted Shield (Safe Shell)
    const safeGeo = new THREE.DodecahedronGeometry(1.1, 0)
    const safeMat = new THREE.MeshPhysicalMaterial({
      color: 0x064e3b,
      emissive: 0x022c22,
      roughness: 0.25,
      metalness: 0.85,
      clearcoat: 0.9,
      transparent: true,
      opacity: 0.88,
    })
    const safeMesh = new THREE.Mesh(safeGeo, safeMat)
    vaultGroup.add(safeMesh)

    // Safe Wireframe Grid Lines
    const wireGeo = new THREE.DodecahedronGeometry(1.12, 0)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    })
    const wireMesh = new THREE.Mesh(wireGeo, wireMat)
    vaultGroup.add(wireMesh)

    // Golden Escrow Heart (Locked Funds)
    const heartGeo = new THREE.OctahedronGeometry(0.55, 0)
    const heartMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.95,
    })
    const heartMesh = new THREE.Mesh(heartGeo, heartMat)
    vaultGroup.add(heartMesh)

    // Outer Orbit Gimbal Rings
    const gimbalMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      metalness: 0.8,
      roughness: 0.2,
      emissive: 0x059669,
      emissiveIntensity: 0.3,
    })
    const gimbalGeo1 = new THREE.TorusGeometry(1.9, 0.02, 16, 80)
    const gimbalMesh1 = new THREE.Mesh(gimbalGeo1, gimbalMat)
    gimbalMesh1.rotation.x = Math.PI / 4
    worldGroup.add(gimbalMesh1)

    // C. Real Turkish Job Beacons (Sprites with real city & wage info)
    const jobList = [
      { city: 'Kadıköy', job: 'Restoran Servis', wage: '1.450 ₺', radius: 2.1, speed: 0.007, y: 0.4 },
      { city: 'Ümraniye', job: 'İnşaat Ustası', wage: '1.800 ₺', radius: 2.7, speed: 0.005, y: -0.3, urgent: true },
      { city: 'Çankaya', job: 'Ofis Temizlik', wage: '1.250 ₺', radius: 2.3, speed: 0.006, y: 0.7 },
      { city: 'Bornova', job: 'Nakliye / Taşıma', wage: '1.600 ₺', radius: 2.9, speed: 0.004, y: -0.6 },
      { city: 'Nilüfer', job: 'Depo / Yükleme', wage: '1.350 ₺', radius: 2.5, speed: 0.0065, y: 0.1 },
    ]

    const spritesData: Array<{
      sprite: THREE.Sprite
      texture: THREE.CanvasTexture
      angle: number
      speed: number
      radius: number
      baseY: number
    }> = []

    jobList.forEach((j, index) => {
      const canvas = document.createElement('canvas')
      canvas.width = 280
      canvas.height = 84
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Rounded badge card
      ctx.fillStyle = j.urgent ? 'rgba(153, 27, 27, 0.92)' : 'rgba(15, 23, 42, 0.92)'
      ctx.strokeStyle = j.urgent ? '#f87171' : '#34d399'
      ctx.lineWidth = 3

      ctx.beginPath()
      ctx.roundRect(4, 4, 272, 76, 16)
      ctx.fill()
      ctx.stroke()

      // Pulse indicator dot
      ctx.beginPath()
      ctx.arc(28, 42, 7, 0, Math.PI * 2)
      ctx.fillStyle = j.urgent ? '#ef4444' : '#10b981'
      ctx.fill()

      // City & Job Title
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
      ctx.fillText(`${j.city} • ${j.job}`, 46, 34)

      // Wage
      ctx.fillStyle = j.urgent ? '#fecaca' : '#6ee7b7'
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
      ctx.fillText(j.wage, 46, 62)

      const texture = new THREE.CanvasTexture(canvas)
      texture.minFilter = THREE.LinearFilter
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
      })
      const sprite = new THREE.Sprite(spriteMat)
      sprite.scale.set(1.4, 0.42, 1)

      const initialAngle = (index / jobList.length) * Math.PI * 2
      sprite.position.x = Math.cos(initialAngle) * j.radius
      sprite.position.z = Math.sin(initialAngle) * j.radius
      sprite.position.y = j.y
      worldGroup.add(sprite)

      spritesData.push({
        sprite,
        texture,
        angle: initialAngle,
        speed: j.speed,
        radius: j.radius,
        baseY: j.y,
      })
    })

    // D. Soft Ambient Particle Sparks
    const sparkCount = 60
    const sparkGeo = new THREE.BufferGeometry()
    const sparkPos = new Float32Array(sparkCount * 3)

    for (let i = 0; i < sparkCount * 3; i += 3) {
      const r = 2.0 + Math.random() * 2.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      sparkPos[i] = r * Math.sin(phi) * Math.cos(theta)
      sparkPos[i + 1] = r * Math.sin(phi) * Math.sin(theta)
      sparkPos[i + 2] = r * Math.cos(phi)
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3))
    const sparkMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.045,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })
    const sparkSystem = new THREE.Points(sparkGeo, sparkMat)
    worldGroup.add(sparkSystem)

    // 4. Smooth Mouse Interaction (lerp inertia)
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const handlePointerMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      targetX = x * 0.7
      targetY = y * 0.5
    }

    window.addEventListener('mousemove', handlePointerMove, { passive: true })

    const handleResize = () => {
      if (!mount) return
      const newWidth = mount.clientWidth
      const newHeight = mount.clientHeight || 500
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    // 5. Physics Animation Loop
    let animId: number
    const clock = new THREE.Clock()

    const animate = () => {
      const elapsed = clock.getElapsedTime()

      // Smooth mouse lerp
      currentX += (targetX - currentX) * 0.06
      currentY += (targetY - currentY) * 0.06

      // Lights tracking
      emeraldLight.position.x = currentX * 4 + 2
      emeraldLight.position.y = currentY * 3 + 2

      // Rotate radar sweep beam
      sweepMesh.rotation.z = -elapsed * 1.8

      // Rotate Central Escrow Vault
      safeMesh.rotation.y = elapsed * 0.22 + currentX * 0.3
      safeMesh.rotation.x = Math.sin(elapsed * 0.3) * 0.12 + currentY * 0.2
      wireMesh.rotation.y = safeMesh.rotation.y
      wireMesh.rotation.x = safeMesh.rotation.x

      // Escrow core pulse
      heartMesh.rotation.y = -elapsed * 0.5
      heartMesh.rotation.z = Math.cos(elapsed * 0.4) * 0.2
      const pulse = 1 + Math.sin(elapsed * 2.2) * 0.06
      heartMesh.scale.set(pulse, pulse, pulse)

      // Gimbal ring rotation
      gimbalMesh1.rotation.z = elapsed * 0.3 + currentX * 0.2
      gimbalMesh1.rotation.y = elapsed * 0.15

      // Orbiting job badges with smooth elevation floating
      spritesData.forEach((item, idx) => {
        item.angle += item.speed
        item.sprite.position.x = Math.cos(item.angle) * item.radius
        item.sprite.position.z = Math.sin(item.angle) * item.radius
        item.sprite.position.y = item.baseY + Math.sin(elapsed * 1.8 + idx) * 0.12

        // Soft scale pulse
        const s = 1 + Math.sin(elapsed * 2.5 + idx) * 0.04
        item.sprite.scale.set(1.4 * s, 0.42 * s, 1)
      })

      // Drift particle sparks
      sparkSystem.rotation.y = elapsed * 0.03

      // Scroll-based 3D scene reactivity
      const scrollFactor = scrollRef.current || 0
      worldGroup.rotation.y = currentX * 0.3 + scrollFactor * Math.PI * 0.6
      worldGroup.position.y = scrollFactor * 0.6
      worldGroup.position.z = -scrollFactor * 1.5

      renderer.render(scene, camera)
      animId = requestAnimationFrame(animate)
    }

    animate()

    // 6. Cleanup
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('resize', handleResize)
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      renderer.dispose()
      ringGeometries.forEach((g) => g.dispose())
      ringMaterials.forEach((m) => m.dispose())
      sweepGeo.dispose()
      sweepMat.dispose()
      safeGeo.dispose()
      safeMat.dispose()
      wireGeo.dispose()
      wireMat.dispose()
      heartGeo.dispose()
      heartMat.dispose()
      gimbalGeo1.dispose()
      gimbalMat.dispose()
      sparkGeo.dispose()
      sparkMat.dispose()
      spritesData.forEach((s) => {
        s.texture.dispose()
        s.sprite.material.dispose()
      })
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full min-h-[360px] sm:min-h-[460px] select-none pointer-events-auto cursor-grab active:cursor-grabbing ${className}`}
      aria-label="Günübirlik Canlı İş Radarı ve Emanet Kasası"
    />
  )
}

export default InteractiveCanvas3D
