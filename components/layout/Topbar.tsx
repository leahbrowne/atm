'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { SignOutButton, useUser } from '@clerk/nextjs'

type TopbarProps = {
  variant?: 'standard' | 'module' | 'admin'
}

export default function Topbar({ variant = 'standard' }: TopbarProps) {
  const { user } = useUser()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }

    window.addEventListener('mousedown', closeOnOutside)
    return () => window.removeEventListener('mousedown', closeOnOutside)
  }, [])

  const firstName = user?.firstName || 'Member'
  const initials = (user?.firstName?.[0] || 'M').toUpperCase()

  return (
    <header className="topbar">
      {variant === 'module' ? (
        <div className="topbar-module">
          <Link href="/dashboard" aria-label="Back to dashboard">←</Link>
          <span className="avatar-name">Google Ads / Campaign Foundations</span>
          <span className="module-pill">Step 2 of 4</span>
          <span className="module-pill">47% Complete</span>
        </div>
      ) : (
        <div className="topbar-brand">
          <div className="brand-mark" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M4 18 11 6l3.5 6L20 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="brand-wordmark">Momentum</p>
            <p className="brand-sub">by Moremi</p>
          </div>
          <div className="topbar-collab">
            <div className="collab-divider-line" />
            <div>
              <p className="client-wordmark">All Things Media</p>
              <p className="client-sub">Member Portal{variant === 'admin' ? ' · Admin' : ''}</p>
            </div>
          </div>
        </div>
      )}

      <div className="topbar-right">
        <button type="button" className="notif-btn" aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="M6 9a6 6 0 1 1 12 0v5l1.5 2.5H4.5L6 14V9Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>

        <div ref={ref} className="avatar-menu">
          <button type="button" className="avatar-btn" onClick={() => setOpen((value) => !value)}>
            <span className="avatar">{initials}</span>
            <span className="avatar-name">{firstName}</span>
          </button>

          {open ? (
            <div className="avatar-dropdown">
              <Link href="/profile">View Profile</Link>
              <SignOutButton>
                <button type="button">Sign Out</button>
              </SignOutButton>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
