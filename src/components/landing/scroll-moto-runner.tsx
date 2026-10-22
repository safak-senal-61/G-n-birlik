'use client'

import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export default function ScrollMotoRunner() {
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const canvasHostRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    const container = canvasHostRef.current
    if (!wrapper || !container) return

    const width = 210
    const height = 210

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
    camera.position.set(0, 0.75, 4.1)
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.85)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfffdf6, 2.9)
    keyLight.position.set(4, 6, 5)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x5cd6a5, 2.2)
    rimLight.position.set(-4, 3, -3)
    scene.add(rimLight)

    // Sadece 1. Modelin Kendisi (Motosiklet — etrafında hiçbir yuvarlak/halka yok)
    const motoGroup = new THREE.Group()
    scene.add(motoGroup)

    const modelHolder = new THREE.Group()
    motoGroup.add(modelHolder)

    let isDisposed = false
    const loader = new GLTFLoader()

    loader.load(
      '/models/meshy-model-1.glb',
      (gltf) => {
        if (isDisposed) return
        const model = gltf.scene
        const box = new THREE.Box3().setFromObject(model)
        const size = new THREE.Vector3()
        const center = new THREE.Vector3()
        box.getSize(size)
        box.getCenter(center)

        const maxDim = Math.max(size.x, size.y, size.z) || 1
        const scale = 2.3 / maxDim

        model.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
        model.scale.setScalar(scale)

        modelHolder.add(model)
      },
      undefined,
      () => {}
    )

    // Scroll Takibi: Sayfada aşağı indikçe motor da aşağı doğru çalışarak ilerler
    let lastScrollY = window.scrollY || 0
    let targetY = 90
    let currentY = 90
    let targetXOffset = 0
    let currentXOffset = 0
    let scrollVelocity = 0
    let smoothedVelocity = 0
    let clock = 0

    const updateScrollTarget = () => {
      const sy = window.scrollY || 0
      const dy = sy - lastScrollY
      lastScrollY = sy

      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        window.innerHeight + 1
      )
      const maxScroll = Math.max(1, docHeight - window.innerHeight)
      const progress = Math.min(1, Math.max(0, sy / maxScroll))

      // Ekranın üstünden (76px) en altına kadar sayfa kaydırmasıyla aşağı doğru ilerler
      const minTop = 76
      const maxTop = Math.max(minTop + 80, window.innerHeight - 215)
      targetY = minTop + progress * (maxTop - minTop)

      // İlerlerken gerçek bir şeritte viraj alıyormuş gibi hafif S-kavisli yatay salınım
      targetXOffset = Math.sin(sy * 0.0065) * 26

      // Anlık gaz / hızlanma ivmesi
      scrollVelocity = Math.max(-45, Math.min(45, dy))
    }

    window.addEventListener('scroll', updateScrollTarget, { passive: true })
    window.addEventListener('resize', updateScrollTarget)
    updateScrollTarget()

    let reqId = 0
    const animate = () => {
      reqId = requestAnimationFrame(animate)
      clock += 0.016

      // Yumuşak fiziksel takip (aşağı indikçe aşağı süzülerek ilerler)
      currentY += (targetY - currentY) * 0.11
      currentXOffset += (targetXOffset - currentXOffset) * 0.11
      smoothedVelocity += (scrollVelocity - smoothedVelocity) * 0.14
      scrollVelocity *= 0.85

      const speedMagnitude = Math.min(1.8, Math.abs(smoothedVelocity) * 0.06)

      // DOM Konumu: Sayfada aşağı indikçe motor aşağıya doğru iner
      wrapper.style.transform = `translate3d(${currentXOffset.toFixed(1)}px, ${currentY.toFixed(1)}px, 0)`

      // Çalışan Motor Titreşimi (Rölanti + Gaz verildiğinde artan frekans)
      const engineRumbleY =
        Math.sin(clock * 32) * (0.014 + speedMagnitude * 0.018) +
        Math.cos(clock * 19) * 0.008
      const engineRumbleRoll = Math.sin(clock * 26) * (0.008 + speedMagnitude * 0.012)

      // Viraj yatışı ve aşağı/yukarı sürüş yönelimi
      const curveDerivative = Math.cos((window.scrollY || 0) * 0.0065)
      const bankAngle = -curveDerivative * speedMagnitude * 0.22
      const pitchAngle = Math.max(-0.22, Math.min(0.26, smoothedVelocity * 0.009))

      // Motorun yönü: aşağı inerken ileri/aşağı viraj açısına döner, sürekli canlıdır
      const baseHeading = -0.55 + curveDerivative * 0.38 + Math.sin(clock * 0.9) * 0.08
      motoGroup.rotation.y = baseHeading
      motoGroup.rotation.x = 0.12 + pitchAngle
      motoGroup.rotation.z = bankAngle + engineRumbleRoll
      motoGroup.position.y = engineRumbleY

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      isDisposed = true
      cancelAnimationFrame(reqId)
      window.removeEventListener('scroll', updateScrollTarget)
      window.removeEventListener('resize', updateScrollTarget)
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="fixed top-0 right-1 sm:right-5 z-40 pointer-events-none select-none w-[140px] h-[140px] sm:w-[200px] sm:h-[200px] flex items-center justify-center will-change-transform"
      style={{ transform: 'translate3d(0px, 84px, 0)' }}
    >
      <div
        ref={canvasHostRef}
        className="w-full h-full flex items-center justify-center [&>canvas]:!w-full [&>canvas]:!h-full"
      />
    </div>
  )
}
