# Login Page
## `/sign-in` — `app/(auth)/sign-in/page.tsx`

---

## Purpose
The first screen every user sees. Sets the professional tone immediately. LinkedIn sign-in is the primary action — everything else is secondary.

## Reference
Design file: `design/login.html`

## Access
Public route — no auth required. If a user is already signed in, redirect to `/dashboard`.

---

## Layout

Two-column grid, full viewport height, no scroll.

**Left panel (50%):**
- Dark background with subtle amber radial gradient orbs
- Moremi brand mark + wordmark top left
- Headline: "The knowledge that keeps you one step ahead"
- Lora italic description
- Four feature bullet points (dot + text)
- ATM co-brand badge bottom left: "All Things Media · Member Portal"

**Right panel (50%):**
- Slightly lighter surface background (`--surface`)
- Centred login card, max-width 380px

---

## Login Card

### Heading
```
Welcome back
[Lora italic subtext] Sign in to your learning portal
```

### Sign-in buttons — in this exact order

**1. LinkedIn (primary)**
- Full width
- Blue-tinted border and background (`rgba(10,102,194,0.06)`)
- LinkedIn logo SVG in official blue (`#0a66c2`)
- Label: "Continue with LinkedIn"
- "Recommended" pill badge on the right in amber

**2. Google (secondary)**
- Full width
- Standard surface background
- Google logo SVG (multicolour)
- Label: "Continue with Google"

**3. Manual (tertiary)**
- Separated by a divider: `—— or sign in manually ——`
- Email input field
- Password input field
- Submit button: amber, full width, "Sign In →"

### Footer note
```
Access is provided by All Things Media.
Contact your administrator if you need help signing in.
```
Small, muted text. No self-registration link — access is invite only.

---

## Behaviour

- On successful LinkedIn or Google auth → Clerk handles redirect
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/dashboard`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/profile/complete`
- First-time user → goes to `/profile/complete` to add job title and bio
- Returning user → goes directly to `/dashboard`
- Failed manual login → show inline error below the submit button, Clash Display red text

---

## Clerk Implementation

Use Clerk's `<SignIn>` component as the authentication handler but apply custom styling to match the design. Override Clerk's appearance prop:

```typescript
import { SignIn } from '@clerk/nextjs'

<SignIn
  appearance={{
    elements: {
      rootBox: 'w-full',
      card: 'bg-transparent shadow-none border-none p-0',
      // hide Clerk's default UI — render our own buttons
    }
  }}
  routing="path"
  path="/sign-in"
/>
```

Alternatively, use Clerk's `useSignIn()` hook with fully custom UI — preferred for pixel-accurate design match.

---

## Feature List (left panel)
```
● Google Ads — what it is and how it works
● LinkedIn — building your professional presence  
● Your website — cookies, UX, and what the data means
● Market intelligence — your industry, updated daily
```

---

## Notes
- No sign-up link — users are added by ATM admin or via ATM email domain auto-assignment
- No "forgot password" on first render — add as a small text link below the submit button
- Mobile: stack panels vertically, left panel collapses to a compact brand header
