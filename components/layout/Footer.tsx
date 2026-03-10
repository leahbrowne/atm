import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <span>Momentum by Moremi</span>
        <span className="footer-divider" />
        <span>All Things Media</span>
      </div>

      <div className="footer-center">
        <Link href="/legal#privacy-policy">Privacy Policy</Link>
        <span>|</span>
        <Link href="/legal#terms-of-use">Terms of Use</Link>
        <span>|</span>
        <Link href="/legal#your-data">Your Data</Link>
      </div>

      <div className="footer-right">
        <span>© 2026 Moremi Digital Group</span>
      </div>
    </footer>
  )
}
