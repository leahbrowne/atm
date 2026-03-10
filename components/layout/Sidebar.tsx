'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Google Ads', href: '/module/google-ads' },
  { label: 'Website', href: '#', soon: true },
  { label: 'LinkedIn', href: '#', soon: true },
  { label: 'Market Intelligence', href: '/intel' },
  { label: 'Profile', href: '/profile' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      {navItems.map((item) => {
        const active = item.href !== '#' && pathname.startsWith(item.href)

        return (
          <Link key={item.label} href={item.href} className={`sidebar-item ${active ? 'sidebar-item-active' : ''}`}>
            <span>{item.label}</span>
            {item.soon ? <span className="soon-tag">Coming Soon</span> : null}
          </Link>
        )
      })}

      <div className="sidebar-bottom">
        <Link href="/profile" className="streak-card">
          <p style={{ fontSize: 20, lineHeight: 1 }}>🔥</p>
          <p style={{ fontFamily: 'Clash Display, sans-serif', fontSize: 18, color: 'var(--amber)' }}>4 Day Streak</p>
        </Link>
      </div>
    </aside>
  )
}
