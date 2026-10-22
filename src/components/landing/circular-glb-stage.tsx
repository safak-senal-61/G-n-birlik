'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

interface CircularGlbStageProps {
  compact?: boolean
  initialMode?: 'orbit' | 'model1' | 'model2'
}

export default function CircularGlbStage({
  compact = false,
}: CircularGlbStageProps) {
  const mountRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    let width = container.clientWidth || 380
    let height = container.clientHeight || 380

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100)
    camera.position.set(0, 0.55, 4.9)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3

    container.innerHTML = ''
    container.appendChild(renderer.domElement)

    // Aydınlatma
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8)
    scene.add(ambientLight)

    const hemiLight = new THREE.HemisphereLight(0xf6f5f2, 0x0d6847, 1.5)
    hemiLight.position.set(0, 8, 0)
    scene.add(hemiLight)

    const keyLight = new THREE.DirectionalLight(0xfffdf8, 2.8)
    keyLight.position.set(4, 6, 5)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x5cd6a5, 2.1)
    rimLight.position.set(-5, 3, -4)
    scene.add(rimLight)

    // Sadece 2. Modelin Kendisi (Etrafında hiçbir halka, yuvarlak, kutu veya yazı yok)
    const characterHolder = new THREE.Group()
    scene.add(characterHolder)

    let isDisposed = false
    const loader = new GLTFLoader()

    loader.load(
      '/models/meshy-model-2.glb',
      (gltf) => {
        if (isDisposed) return
        const model = gltf.scene
        const box = new THREE.Box3().setFromObject(model)
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box.getSize(size)
        box.getCenter(center)

        const maxDim = Math.max(size.x, size.y, size.z) || 1
        const scale = 2.55 / maxDim

        model.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
        model.scale.setScalar(scale)

        characterHolder.add(model)
      },
      undefined,
      () => {}
    )

    // Aşağı ve yukarı kaydırınca karakterin kendi 360° circular dönüş ve salınım animasyonu
    let lastScrollY = typeof window !== 'undefined' ? window.scrollY : 0
    let targetScrollAngle = 0
    let currentScrollAngle = 0
    let scrollVelocity = 0
    let dragAngle = 0
    let targetDragAngle = 0
    let isDragging = false
    let prevX = 0
    let clock = 0

    const handleScroll = () => {
      const sy = window.scrollY || 0
      const dy = sy - lastScrollY
      lastScrollY = sy

      targetScrollAngle = sy * 0.015
      scrollVelocity = Math.max(-2.5, Math.min(2.5, dy * 0.06))
    }

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true
      prevX = e.clientX
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - prevX
      prevX = e.clientX
      targetDragAngle += dx * 0.015
    }

    const onPointerUp = () => {
      isDragging = false
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    const domEl = renderer.domElement
    domEl.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    const handleResize = () => {
      if (!container) return
      width = container.clientWidth || 380
      height = container.clientHeight || 380
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    let reqId = 0
    const animate = () => {
      reqId = requestAnimationFrame(animate)
      clock += 0.016

      currentScrollAngle += (targetScrollAngle - currentScrollAngle) * 0.09
      dragAngle += (targetDragAngle - dragAngle) * 0.1
      scrollVelocity *= 0.92

      // Karakter kendi yerinde canlı durur ve aşağı/yukarı kaydırdıkça 360° dairesel döner
      characterHolder.rotation.y =
        Math.sin(clock * 0.85) * 0.38 + currentScrollAngle * 1.45 + dragAngle
      characterHolder.position.y = Math.sin(clock * 2.1 + currentScrollAngle) * 0.09
      characterHolder.position.x = Math.cos(currentScrollAngle * 1.2) * 0.12
      characterHolder.rotation.z = Math.sin(clock * 1.4) * 0.03 + scrollVelocity * 0.07

      renderer.render(scene, camera)
    }

    handleScroll()
    animate()

    return () => {
      isDisposed = true
      cancelAnimationFrame(reqId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      domEl.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      renderer.dispose()
    }
  }, [])

  return (
    <div
      className={`relative w-full ${
        compact ? 'h-[300px] sm:h-[340px]' : 'h-[340px] sm:h-[400px]'
      } flex items-center justify-center bg-transparent border-0 shadow-none select-none overflow-visible`}
    >
      <div ref={mountRef} className="relative z-10 w-full h-full" />
    </div>
  )
}
