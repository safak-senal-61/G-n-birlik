'use client'

import React, { useRef, useState, useCallback } from 'react'

interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  maxTilt?: number
  scale?: number
  glare?: boolean
}

export function Card3D({
  children,
  className = '',
  maxTilt = 6,
  scale = 1,
  glare = true,
  ...props
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current
      if (!card) return

      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      // Calculate tilt angles (-maxTilt to +maxTilt)
      const rotateX = Number((((y - centerY) / centerY) * -maxTilt).toFixed(2))
      const rotateY = Number((((x - centerX) / centerX) * maxTilt).toFixed(2))

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`

      // Dynamic specular light reflection
      if (glare && glareRef.current) {
        glareRef.current.style.opacity = '1'
        glareRef.current.style.background = `radial-gradient(circle 260px at ${x}px ${y}px, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 80%)`
      }
    },
    [maxTilt, scale, glare]
  )

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 0.1s ease-out, box-shadow 0.25s ease'
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    const card = cardRef.current
    if (card) {
      card.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease'
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    }
    if (glare && glareRef.current) {
      glareRef.current.style.opacity = '0'
    }
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`preserve-3d relative transition-shadow duration-300 ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        willChange: isHovered ? 'transform' : 'auto',
      }}
      {...props}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] transition-opacity duration-300"
          style={{ opacity: 0, mixBlendMode: 'overlay' }}
        />
      )}
    </div>
  )
}

export default Card3D
