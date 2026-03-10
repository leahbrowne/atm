'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { useSignIn, useUser } from '@clerk/nextjs'
import styles from './page.module.css'

const features = [
  'Channels — understand how digital marketing works and what to expect from it',
  'Your Website — know what your site is doing and why it matters',
  'Market Intelligence — stay informed on your industry, daily',
  'Your Team — build the shared language that drives better decisions',
]

export default function SignInPage() {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const { isLoaded, signIn, setActive } = useSignIn()

  const [emailAddress, setEmailAddress] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isSignedIn) {
      router.replace('/dashboard')
    }
  }, [isSignedIn, router])

  const handleOAuthGoogle = async () => {
    if (!isLoaded) return

    await signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    })
  }

  const handleManualSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isLoaded) return

    setError('')
    setIsSubmitting(true)

    try {
      const result = await signIn.create({
        identifier: emailAddress,
        password,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/dashboard')
      } else {
        setError('Unable to complete sign in. Please try again.')
      }
    } catch (caughtError: unknown) {
      const message =
        typeof caughtError === 'object' &&
        caughtError !== null &&
        'errors' in caughtError &&
        Array.isArray((caughtError as { errors?: Array<{ message?: string }> }).errors)
          ? (caughtError as { errors: Array<{ message?: string }> }).errors[0]?.message
          : undefined

      setError(message ?? 'Invalid email or password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.signInPage}>
      <section className={styles.leftPanel}>
        <div className={styles.panelBrand}>
          <div className={styles.brandMark} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3L21 7.8L12 12.6L3 7.8L12 3Z" stroke="currentColor" strokeWidth="1.4" />
              <path d="M21 12L12 16.8L3 12" stroke="currentColor" strokeWidth="1.4" />
              <path d="M21 16.2L12 21L3 16.2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </div>
          <div>
            <p className={styles.brandWordmark}>Momentum</p>
            <p className={styles.brandSub}>by Moremi</p>
          </div>
        </div>

        <div className={styles.panelContent}>
          <p className={styles.panelEyebrow}>FOR LEADERS AND TEAMS</p>
          <h1 className={styles.panelHeadline}>Marketing knowledge that sticks.</h1>
          <p className={styles.panelDescription}>
            Help teams understand marketing and use that understanding to grow the business.
          </p>

          <ul className={styles.featureList}>
            {features.map((item) => (
              <li key={item} className={styles.featureItem}>
                <span className={styles.featureDot} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.panelClient}>
          <p className={styles.clientBadge}>
            <strong>All Things Media</strong> · Member Portal
          </p>
        </div>
      </section>

      <section className={styles.rightPanel}>
        <div className={styles.loginCard}>
          <h2 className={styles.loginTitle}>Welcome back</h2>
          <p className={styles.loginSubtitle}>Sign in to your learning portal</p>

          <button className={`${styles.socialButton} ${styles.linkedInButton}`} type="button" disabled title="Coming soon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20.45 20.45H16.89V14.88C16.89 13.55 16.86 11.83 15.03 11.83C13.17 11.83 12.89 13.28 12.89 14.79V20.45H9.33V9H12.75V10.56H12.8C13.28 9.65 14.45 8.68 16.18 8.68C19.78 8.68 20.45 11.05 20.45 14.13V20.45ZM5.31 7.43C4.16 7.43 3.24 6.5 3.24 5.36C3.24 4.22 4.16 3.3 5.31 3.3C6.45 3.3 7.38 4.22 7.38 5.36C7.38 6.5 6.45 7.43 5.31 7.43ZM7.09 20.45H3.53V9H7.09V20.45Z"
                fill="#0A66C2"
              />
            </svg>
            <span className={styles.socialLabel}>Continue with LinkedIn</span>
            <span className={styles.recommendedPill}>Recommended</span>
          </button>

          <button className={`${styles.socialButton} ${styles.googleButton}`} type="button" onClick={handleOAuthGoogle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M23.5 12.27C23.5 11.46 23.43 10.69 23.3 9.95H12V14.47H18.46C18.18 15.93 17.36 17.16 16.12 17.99V20.92H19.9C22.11 18.88 23.5 15.88 23.5 12.27Z"
                fill="#4285F4"
              />
              <path
                d="M12 24C15.24 24 17.95 22.93 19.9 20.92L16.12 17.99C15.06 18.7 13.69 19.13 12 19.13C8.88 19.13 6.23 17.02 5.3 14.18H1.39V17.2C3.33 21.06 7.33 24 12 24Z"
                fill="#34A853"
              />
              <path
                d="M5.3 14.18C5.05 13.47 4.91 12.71 4.91 11.93C4.91 11.15 5.05 10.39 5.3 9.68V6.66H1.39C0.49 8.44 0 10.43 0 11.93C0 13.43 0.49 15.42 1.39 17.2L5.3 14.18Z"
                fill="#FBBC04"
              />
              <path
                d="M12 4.73C13.85 4.73 15.51 5.36 16.82 6.61L19.98 3.45C17.94 1.55 15.24 0 12 0C7.33 0 3.33 2.94 1.39 6.66L5.3 9.68C6.23 6.84 8.88 4.73 12 4.73Z"
                fill="#EA4335"
              />
            </svg>
            <span className={styles.socialLabel}>Continue with Google</span>
          </button>

          <div className={styles.divider}>or sign in manually</div>

          <form onSubmit={handleManualSignIn}>
            <div className={styles.inputGroup}>
              <input
                className={styles.inputField}
                type="email"
                placeholder="Email"
                value={emailAddress}
                onChange={(event) => setEmailAddress(event.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <input
                className={styles.inputField}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
              Sign In →
            </button>

            <Link className={styles.forgotPassword} href="/forgot-password">
              Forgot password?
            </Link>

            {error ? <p className={styles.errorMessage}>{error}</p> : null}
          </form>

          <p className={styles.footerNote}>
            Access is provided by All Things Media. Contact your administrator if you need help
            signing in.
          </p>
        </div>
      </section>
    </main>
  )
}
