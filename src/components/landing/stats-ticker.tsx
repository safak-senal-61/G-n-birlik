'use client'

import React, { useEffect, useState, useRef } from 'react'

interface StatsTickerProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export function StatsTicker({
  value,
  prefix = '',
  suffix = '',
  duration = 1800,
  className = '',
}: StatsTickerProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const elementRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.2 }
    )

    if (elementRef.current) observer.observe(elementRef.current)
    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    let startTime: number | null = null
    const startValue = 0

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      // Ease out expo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = Math.floor(startValue + (value - startValue) * ease)
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(step)
      } else {
        setDisplayValue(value)
      }
    }

    requestAnimationFrame(step)
  }, [hasStarted, value, duration])

  return (
    <span ref={elementRef} className={`font-mono font-black tabular-nums tracking-tight ${className}`}>
      {prefix}
      {displayValue.toLocaleString('tr-TR')}
      {suffix}
    </span>
  )
}

export default StatsTicker
