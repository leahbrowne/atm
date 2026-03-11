'use client'

import { useEffect, useMemo, useState } from 'react'

type SignalRingProps = {
  value: number
}

const CIRCUMFERENCE = 220

export default function SignalRing({ value }: SignalRingProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const clampedValue = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))

  const dashOffset = useMemo(() => {
    if (!mounted) return CIRCUMFERENCE
    return CIRCUMFERENCE - (clampedValue / 100) * CIRCUMFERENCE
  }, [clampedValue, mounted])

  return (
    <div className="signal-widget">
      <div className="ring-container" aria-label={`Today's signal ${Math.round(clampedValue)} percent`}>
        <svg width="80" height="80" viewBox="0 0 80 80" role="img" aria-hidden>
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(232,131,74,1)" />
              <stop offset="100%" stopColor="rgba(240,160,112,1)" />
            </linearGradient>
          </defs>
          <circle className="ring-track" cx="40" cy="40" r="35" />
          <circle
            className="ring-fill"
            cx="40"
            cy="40"
            r="35"
            style={{ strokeDashoffset: dashOffset, transition: 'stroke-dashoffset 900ms ease' }}
          />
        </svg>

        <div className="ring-inner">
          <span className="ring-value">{Math.round(clampedValue)}%</span>
          <span className="ring-unit">Goal</span>
        </div>
      </div>
      <p className="signal-label">Today&apos;s Signal</p>
    </div>
  )
}
