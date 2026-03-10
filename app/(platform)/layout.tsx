import { ReactNode } from 'react'
import Footer from '@/components/layout/Footer'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

function FeedbackButtonPlaceholder() {
  return null
}

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="platform-shell">
      <Topbar variant="standard" />
      <div className="platform-content">
        <Sidebar />
        <main className="platform-main">{children}</main>
      </div>
      <Footer />
      <FeedbackButtonPlaceholder />
    </div>
  )
}
