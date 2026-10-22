'use client'

import React from 'react'

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
  maxTilt: _maxTilt,
  scale: _scale,
  glare: _glare,
  ...props
}: Card3DProps) {
  return (
    <div className={`relative ${className}`} {...props}>
      {children}
    </div>
  )
}

export default Card3D

