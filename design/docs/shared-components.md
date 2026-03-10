# Shared Components & Global Features
## `components/shared/` and `components/layout/`

---

## Purpose
This document specifies all components used across multiple pages — the topbar, sidebar, footer, feedback system, and signal ring. Build these before individual pages. Every platform page depends on them.

---

## 1. Topbar
`components/layout/Topbar.tsx`

Used on: Dashboard, Intel, Profile, Legal, Module (modified variant)

### Standard Topbar

Fixed position, 58px height, `background: rgba(8,8,8,0.92)`, `backdrop-filter: blur(20px)`, bottom border `1px solid var(--border)`.

**Left section:**
- Brand mark: 28px square, amber border, amber dim background, stacked layers SVG icon in amber
- Wordmark: "MOREMI" in Clash Display 12px, 0.2em letter spacing, uppercase
- Sub-label: "Learning" in Jost 9px, amber, 0.25em letter spacing
- Diagonal divider line (CSS clip-path or border)
- Co-brand: "All Things Media" in small muted caps + " · Member Portal" even more muted

**Right section:**
- Notification bell icon
  - Shows amber dot indicator when there is unread content (new module in last 7 days, based on `modules.created_at`)
  - On click: dropdown with 1–3 notifications, each linking to the relevant module
  - On click notification: mark as read (store read state in localStorage keyed to the module ID)
- Avatar pill:
  - User's profile photo (from Clerk `user.imageUrl`) or initials fallback
  - User's first name
  - Border: `1px solid var(--border-mid)`
  - On click: dropdown with "View Profile" → `/profile` and "Sign Out" → Clerk `signOut()`

### Module Page Topbar Variant

Props: `variant="module"` — different left side:
- Back arrow + "Back" text link → navigates to `/dashboard` (or previous page via `router.back()`)
- Divider
- Breadcrumb: "[Course name] · [Module number]" — e.g. "Google Ads · Module 02"
- Right side: progress pills + avatar pill (no notification bell)

**Progress pills:**
- One pill per module in the course
- Width: 24px, height: 4px, border-radius: 2px
- Done: `var(--amber)`
- Current: `rgba(232,131,74,0.4)`
- Locked: `var(--border)`

### Props

```typescript
interface TopbarProps {
  variant?: 'standard' | 'module' | 'admin' | 'legal'
  // module variant
  courseTitle?: string
  moduleNumber?: string
  moduleProgress?: { total: number; completed: number; current: number }
}
```

---

## 2. Sidebar
`components/layout/Sidebar.tsx`

Used on: Dashboard, Intel, Profile (right sidebar), Admin (separate admin sidebar)

### Platform Sidebar (left, 220px)

Fixed position, full height minus topbar. `background: var(--surface)`, right border.

**Navigation:**

```
[label] Courses
  □ Dashboard
  □ Google Ads         [active when on a Google Ads module]
  □ Website            [Coming Soon pill]
  □ LinkedIn           [Coming Soon pill]

[label] Resources
  □ Market Intelligence
  □ Profile
```

Active state: left border `2px solid var(--amber)`, amber background glow.

Coming Soon pill: inline badge, `rgba(255,255,255,0.04)` background, `--text-muted` text.

**Bottom — Streak badge:**
Small card at the very bottom of the sidebar:
- Flame emoji + streak number in amber
- "Day streak" label
- Links to `/profile`

### Props

```typescript
interface SidebarProps {
  activePath: string // current route for active state
}
```

---

## 3. Footer
`components/layout/Footer.tsx`

Used on: all pages.

Single row, three sections:

**Left:** "Moremi Learning" in Clash Display + divider + "All Things Media" muted

**Centre:** Three links — Privacy Policy | Terms of Use | Your Data — all pointing to `/legal` with appropriate hash

**Right:** "© 2026 Moremi Digital Group" in muted text

Background: `var(--surface)`, top border `1px solid var(--border)`, padding: `24px 44px`.

On mobile: stack vertically, centre-aligned.

---

## 4. Feedback Button
`components/shared/FeedbackButton.tsx`

A floating button fixed to the bottom-right of the screen on all platform pages. Sits above the footer when the user scrolls to the bottom.

```css
position: fixed;
bottom: 28px;
right: 28px;
z-index: 50;
```

**Appearance:**
- Pill shape, `background: var(--surface-2)`, border `1px solid var(--border-mid)`
- Small chat bubble icon + "Feedback" text
- On hover: border goes to `var(--border-active)`, slight translateY(-1px)

**On click:** opens FeedbackModal

**Hide on:** login page, legal page — only show on platform and admin pages

---

## 5. Feedback Modal
`components/shared/FeedbackModal.tsx`

Overlay modal, centred, max-width 480px.

**Header:**
- "Report / Feedback" title in Clash Display
- "Sent only to Moremi" note with lock icon — in small amber text. Important for honesty.
- Close X button top right

**Category selector (3 pills, pick one):**

| Category | Colour |
|---|---|
| Bug | Red — `var(--red)` |
| Content | Green — `var(--green)` |
| Suggestion | Blue — `var(--blue)` |

Default selected: Suggestion

**Message textarea:**
- Placeholder varies by category:
  - Bug: "Describe what happened and where…"
  - Content: "Which module and what's the issue?"
  - Suggestion: "What would you like to see?"
- Min height: 100px
- Max chars: 1000, show counter bottom right

**Submit button:** amber, full width, "Send Feedback →"

**On submit:**
1. POST to `/api/feedback` with `{ category, message }`
2. Show success state for 2.2 seconds:
   - Checkmark icon
   - "Feedback sent. Thank you."
   - Green accent
3. Auto-close modal after 2.2 seconds

**On error:** show inline error "Something went wrong. Please try again." — do not close.

**Modal behaviour:**
- Open: fade in + scale from 0.96 to 1.0
- Close: reverse animation
- Click outside modal: close
- Press Escape: close
- Body scroll lock while open: add `overflow: hidden` to `<body>`

---

## 6. Signal Ring
`components/shared/SignalRing.tsx`

SVG circular progress indicator. Used in the dashboard welcome hero.

```typescript
interface SignalRingProps {
  percentage: number // 0–100
  size?: number // default 80
  strokeWidth?: number // default 4
}
```

**Implementation:**
SVG circle with `stroke-dasharray` and `stroke-dashoffset` to create the fill effect.

```typescript
const radius = (size - strokeWidth) / 2
const circumference = 2 * Math.PI * radius
const offset = circumference - (percentage / 100) * circumference
```

Track ring: `var(--border)` colour
Progress ring: `var(--amber)` colour with a subtle glow `filter: drop-shadow(0 0 4px rgba(232,131,74,0.4))`

Animate from 0 to `percentage` on mount using CSS transition: `transition: stroke-dashoffset 0.8s ease-out`

Centre label: percentage number in Clash Display + small "Today" label below

---

## 7. Global Progress Update

When a user marks a module as complete, multiple parts of the UI need to update simultaneously:

1. Module page: button changes to "Completed ✓"
2. Dashboard: signal ring percentage increases
3. Dashboard: stat strip "Modules Done" increments
4. Dashboard: module list row shows check icon
5. Streak: recalculated and saved

Use a React context (`ProgressContext`) to manage this state globally so components can subscribe to progress updates without prop drilling:

```typescript
// lib/context/ProgressContext.tsx
interface ProgressContextType {
  completedModules: string[] // array of module IDs
  markComplete: (moduleId: string) => Promise<void>
  streak: number
  todayCount: number
}
```

`markComplete` should:
1. POST to `/api/progress`
2. Update `completedModules` array in context
3. Recalculate `todayCount`
4. Trigger streak recalculation

---

## 8. Toast Notifications

`components/shared/Toast.tsx`

Lightweight toast system for one-off confirmations. Use for:
- Module marked as complete
- Feedback submitted
- Profile saved
- Any API success/error

**Appearance:**
- Bottom centre of screen, above footer
- `background: var(--surface-2)`, border, 8px radius
- Icon (check = green, error = red, info = amber) + message text
- Auto-dismiss after 3 seconds
- Slide up on appear, fade out on dismiss

Implement as a context + portal so it can be triggered from anywhere:

```typescript
const { showToast } = useToast()
showToast({ message: 'Module complete!', type: 'success' })
```

---

## 9. First Login Detection

Check on every authenticated page load whether the user has completed their profile:

```typescript
// In the platform layout
const { userId } = auth()
const user = await supabase
  .from('users')
  .select('job_title')
  .eq('id', userId)
  .single()

if (!user.data?.job_title) {
  redirect('/profile/complete')
}
```

This ensures even if a user bookmarks `/dashboard` and returns on a different device, they still complete their profile before seeing the platform.

---

## 10. Middleware Summary

```typescript
// middleware.ts
// Public routes: /sign-in, /sign-up (if enabled)
// Admin routes: /admin/* — requires admin role, redirect to /dashboard if member
// Platform routes: all others — require any authenticated session
// First-login check: handled in layout, not middleware
```

The middleware file is the single source of truth for access control. Keep it simple and explicit.
