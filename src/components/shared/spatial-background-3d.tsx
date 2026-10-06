'use client'

import React, { useEffect, useRef } from 'react'

export function SpatialBackground3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    let mouseX = width / 2
    let mouseY = height / 2
    let targetMouseX = mouseX
    let targetMouseY = mouseY

    // Generate floating 3D nodes
    const nodeCount = Math.min(32, Math.floor((width * height) / 38000))
    const nodes: Array<{
      x: number
      y: number
      z: number
      vx: number
      vy: number
      vz: number
      size: number
      color: string
      shape: 'sphere' | 'cube' | 'diamond'
    }> = []

    const colors = [
      'rgba(16, 185, 129, 0.45)', // Emerald
      'rgba(14, 165, 233, 0.4)',  // Sky
      'rgba(245, 158, 11, 0.35)', // Amber
      'rgba(139, 92, 246, 0.35)', // Purple
      'rgba(20, 184, 166, 0.4)',  // Teal
    ]

    const shapes: ('sphere' | 'cube' | 'diamond')[] = ['sphere', 'cube', 'diamond']

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 600 + 100, // Z depth: 100 to 700
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 8 + 4,
        color: colors[i % colors.length],
        shape: shapes[i % shapes.length],
      })
    }

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX
      targetMouseY = e.clientY
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // Render loop
    const render = () => {
      // Smooth mouse spring interpolation
      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05

      ctx.clearRect(0, 0, width, height)

      // Parallax focal center
      const offsetX = ((mouseX - width / 2) / width) * 45
      const offsetY = ((mouseY - height / 2) / height) * 45

      // Draw subtle spatial connections between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.12
            ctx.beginPath()
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`
            ctx.lineWidth = 0.8
            ctx.moveTo(nodes[i].x + offsetX * (nodes[i].z / 400), nodes[i].y + offsetY * (nodes[i].z / 400))
            ctx.lineTo(nodes[j].x + offsetX * (nodes[j].z / 400), nodes[j].y + offsetY * (nodes[j].z / 400))
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]

        // Update position
        n.x += n.vx
        n.y += n.vy
        n.z += n.vz

        // Bounce within bounds
        if (n.x < -40) n.x = width + 40
        if (n.x > width + 40) n.x = -40
        if (n.y < -40) n.y = height + 40
        if (n.y > height + 40) n.y = -40
        if (n.z < 80 || n.z > 700) n.vz *= -1

        // Perspective 3D projection
        const scale = 400 / n.z
        const px = n.x + offsetX * scale
        const py = n.y + offsetY * scale
        const radius = n.size * scale

        ctx.save()
        ctx.translate(px, py)

        if (n.shape === 'sphere') {
          const grad = ctx.createRadialGradient(
            -radius * 0.3,
            -radius * 0.3,
            radius * 0.1,
            0,
            0,
            radius
          )
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
          grad.addColorStop(0.3, n.color)
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)')

          ctx.beginPath()
          ctx.arc(0, 0, radius * 1.6, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        } else if (n.shape === 'cube') {
          // Isometric 3D diamond/cube
          ctx.rotate(0.35 + (n.x * 0.005))
          ctx.fillStyle = n.color
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.rect(-radius, -radius, radius * 2, radius * 2)
          ctx.fill()
          ctx.stroke()
        } else {
          // Diamond 3D prism
          ctx.beginPath()
          ctx.moveTo(0, -radius * 1.3)
          ctx.lineTo(radius, 0)
          ctx.lineTo(0, radius * 1.3)
          ctx.lineTo(-radius, 0)
          ctx.closePath()
          ctx.fillStyle = n.color
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
          ctx.lineWidth = 0.8
          ctx.fill()
          ctx.stroke()
        }

        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-75">
      {/* Soft atmospheric gradient orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none animate-float-3d" />
      <div className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full bg-teal-400/10 blur-3xl pointer-events-none animate-float-3d-reverse" />
      <div className="absolute -bottom-32 left-1/3 w-[28rem] h-[28rem] rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />

      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  )
}

export default SpatialBackground3D
