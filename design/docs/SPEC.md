# Moremi Learning Platform — Master Spec
## atm.moremidigital.com

---

## Project Overview

A professional learning platform built for All Things Media, a UK-based trade media and events company. The platform delivers short digital marketing courses, a market intelligence feed, team gamification, and performance insights. It is white-labelled under the Moremi Learning brand with ATM co-branding throughout.

This is Phase 1. The focus is the Learning Hub and Market Intelligence feed. Performance dashboards and advanced analytics are Phase 2.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS + CSS Modules for custom components |
| Deployment | Vercel |
| Version Control | GitHub |

---

## Repository Structure

```
atm-platform/
├── app/
│   ├── (auth)/
│   │   └── sign-in/
│   │       └── page.tsx          # Login page
│   ├── (platform)/
│   │   ├── layout.tsx            # Shared layout with topbar, footer, sidebar
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── module/
│   │   │   └── [moduleId]/
│   │   │       └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── intel/
│   │   │   └── page.tsx
│   │   └── legal/
│   │       └── page.tsx
│   ├── admin/
│   │   └── page.tsx              # Admin only — separate from platform layout
│   └── api/
│       ├── feedback/
│       │   └── route.ts
│       ├── progress/
│       │   └── route.ts
│       └── data-request/
│           └── route.ts
├── components/
│   ├── layout/
│   │   ├── Topbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── dashboard/
│   │   ├── WelcomeHero.tsx
│   │   ├── StatStrip.tsx
│   │   ├── NotifBanner.tsx
│   │   ├── ActiveCourse.tsx
│   │   ├── ModuleList.tsx
│   │   ├── ComingSoon.tsx
│   │   ├── Leaderboard.tsx
│   │   └── IntelPreview.tsx
│   ├── module/
│   │   ├── AudioPlayer.tsx
│   │   ├── ModuleContent.tsx
│   │   └── ModuleSidebar.tsx
│   ├── intel/
│   │   ├── FeaturedArticle.tsx
│   │   ├── ArticleCard.tsx
│   │   └── FilterBar.tsx
│   ├── profile/
│   │   ├── ProfileHero.tsx
│   │   ├── BadgeGrid.tsx
│   │   └── StreakCard.tsx
│   ├── admin/
│   │   ├── UserTable.tsx
│   │   ├── EngagementChart.tsx
│   │   ├── FeedbackList.tsx
│   │   └── BillingSection.tsx
│   └── shared/
│       ├── FeedbackButton.tsx    # Persistent floating button
│       ├── FeedbackModal.tsx
│       └── SignalRing.tsx
├── lib/
│   ├── supabase.ts               # Supabase client
│   ├── clerk.ts                  # Clerk helpers
│   └── rss.ts                   # RSS feed parser
├── types/
│   └── index.ts
├── styles/
│   └── globals.css              # Design tokens, base styles
└── middleware.ts                 # Auth protection
```

---

## Design System

Reference the HTML files in `/design/` for exact visual implementation.

### Fonts
Load via Google Fonts and Fontshare in `layout.tsx`:
```
Clash Display — headings, numbers, labels (via Fontshare)
Lora — body text, descriptions, italic accents (via Google Fonts)
Jost — UI elements, navigation, buttons (via Google Fonts)
```

### Colour Tokens
Define in `globals.css` as CSS custom properties:

```css
:root {
  --black: #080808;
  --surface: #0f0f0f;
  --surface-2: #161616;
  --surface-3: #1c1c1c;
  --border: rgba(255,255,255,0.06);
  --border-mid: rgba(255,255,255,0.1);
  --border-active: rgba(232,131,74,0.35);
  --amber: #E8834A;
  --amber-light: #f0a070;
  --amber-dim: rgba(232,131,74,0.1);
  --amber-glow: rgba(232,131,74,0.05);
  --text-primary: #ede8e0;
  --text-secondary: rgba(237,232,224,0.45);
  --text-muted: rgba(237,232,224,0.22);
  --green: #4ade80;
  --green-dim: rgba(74,222,128,0.08);
  --red: rgba(248,113,113,0.9);
  --red-dim: rgba(248,113,113,0.08);
  --blue: rgba(99,179,237,0.9);
  --blue-dim: rgba(99,179,237,0.08);
}
```

### Animation
Standard fade-up on page load for all major sections:
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```
Stagger delays: 0s, 0.07s, 0.12s, 0.17s, 0.22s, 0.27s, 0.32s

---

## Authentication — Clerk

### Setup
1. Install: `npm install @clerk/nextjs`
2. Add to `layout.tsx`: wrap with `<ClerkProvider>`
3. Set environment variables (see below)

### Allowed sign-in methods
- LinkedIn OAuth (primary — display first, label "Recommended")
- Google OAuth (secondary)
- Email/password (tertiary — displayed below a divider as "or sign in manually")
- **Do not enable:** Facebook, Instagram, Twitter, Apple, or any other provider

### Roles
Two roles: `member` and `admin`

**Auto-assignment rule:**
- Any user with an `@allthingsmedia.co.uk` email domain → assign `member` role automatically via Clerk webhook on user creation
- Admin role is assigned manually in the Clerk dashboard — one person per client

**Role check in middleware:**
```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isPublicRoute = createRouteMatcher(['/sign-in(.*)'])

export default clerkMiddleware((auth, req) => {
  if (isAdminRoute(req)) {
    auth().protect({ role: 'admin' })
  }
  if (!isPublicRoute(req)) {
    auth().protect()
  }
})
```

### First login profile completion
After a user signs in for the first time via LinkedIn or Google, check if their `job_title` field in Supabase is null. If so, redirect to `/profile/complete` — a simple one-screen form asking for job title and a short bio. On submit, save to Supabase and redirect to dashboard. User only ever sees this once.

---

## Database — Supabase

### Tables

#### `users`
```sql
id              uuid primary key (matches Clerk user ID)
name            text
email           text
role            text (member | admin)
job_title       text
bio             text
avatar_url      text
linkedin_url    text
company         text default 'All Things Media'
created_at      timestamptz
last_active     timestamptz
```

#### `courses`
```sql
id              uuid primary key
title           text
description     text
track_order     int
is_live         boolean default false
coming_soon     boolean default false
estimated_mins  int
```

#### `modules`
```sql
id              uuid primary key
course_id       uuid references courses(id)
title           text
content         text (markdown)
audio_url       text (nullable — for ElevenLabs audio)
duration_mins   int
module_order    int
is_live         boolean default false
created_at      timestamptz
```

#### `progress`
```sql
id              uuid primary key
user_id         uuid references users(id)
module_id       uuid references modules(id)
completed       boolean default false
completed_at    timestamptz
audio_position  int default 0 (seconds — for resuming audio)
```

#### `streaks`
```sql
id              uuid primary key
user_id         uuid references users(id)
current_streak  int default 0
longest_streak  int default 0
last_activity   date
```

#### `feedback`
```sql
id              uuid primary key
user_id         uuid references users(id)
category        text (bug | content | suggestion)
message         text
resolved        boolean default false
created_at      timestamptz
```

#### `intel_articles`
```sql
id              uuid primary key
title           text
summary         text
source          text
source_url      text
vertical        text (data-centre | smart-home | cinema-av | competitor)
is_featured     boolean default false
published_at    timestamptz
created_at      timestamptz
```

---

## RSS Feed — Market Intelligence

Use the `rss-parser` npm package to fetch and parse feeds on a schedule.

```
npm install rss-parser
```

**Feeds to pull:**
- Data Centres: `https://www.datacenterdynamics.com/rss/`
- Smart Home: `https://www.cepro.com/rss/`
- Cinema & AV: `https://www.avtechnologyeurope.com/rss`
- Smart Home World: pull via Google Alerts RSS for relevant keywords

**Implementation:**
- Create a Vercel cron job (`vercel.json`) that runs every hour
- Fetch all feeds, parse new articles, insert into `intel_articles` table
- Tag each article with its vertical automatically based on feed source
- Flag as `competitor` if article mentions: ISE, CEDIA, Clarion, Informa, Haymarket

---

## Environment Variables

Create `.env.local` with:

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/profile/complete

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Deployment — Vercel

1. Push to GitHub `main` branch → auto-deploys to `atm.moremidigital.com`
2. Push to `dev` branch → auto-deploys to preview URL only
3. In Vercel project settings: add all environment variables
4. Custom domain: add `atm.moremidigital.com` in Vercel domains
5. DNS: add CNAME record at domain registrar pointing `atm` subdomain to `cname.vercel-dns.com`

### Branch strategy
- `main` → production (atm.moremidigital.com)
- `dev` → staging (preview URL)
- Feature branches → individual preview URLs
- Protect `main` branch in GitHub settings — require PR to merge

---

## Shared Components

### Topbar
Present on all platform pages. Contains:
- Moremi brand mark + wordmark + "Learning" subtext
- Diagonal divider
- "All Things Media · Member Portal" co-brand
- Notification bell (with amber dot when unread)
- User avatar pill (name + avatar, links to profile)

### Sidebar
Present on dashboard, intel, profile pages. Contains:
- Course navigation links
- Coming soon items with pill tags
- Streak badge at bottom

### Footer
Present on all pages. Contains:
- "Moremi Learning · All Things Media" brand
- Privacy Policy / Terms of Use / Your Data links → legal.html
- © 2026 Moremi Digital Group

### Feedback Button
Floating bottom-right on all platform pages. Opens FeedbackModal. Three categories: Bug, Content, Suggestion. On submit, POST to `/api/feedback`. Auto-closes after success state (2.2s).

---

## PWA — Phase 2 Preparation

Add to `app/layout.tsx` now so it's ready:
```typescript
// In <head>
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#080808" />
```

Create `/public/manifest.json`:
```json
{
  "name": "Moremi Learning",
  "short_name": "Moremi",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#080808",
  "theme_color": "#E8834A",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```
Service worker and offline support to be added in Phase 2.

---

## Content Notes

All course content is in Supabase. Seed the database with:
- 1 course: "Google Ads: What You Need to Know"
- 4 modules (see module.md for full content)
- 3 coming soon courses: Website, LinkedIn, Social Media
- Sample intel articles for all four verticals

Audio files: null for now. AudioPlayer component renders in ready state, play button disabled with "Coming Soon" tooltip until `audio_url` is populated.

---

## Build Order for Codex

Build in this sequence:
1. Project setup, dependencies, environment variables
2. Supabase schema — create all tables
3. Clerk auth — sign-in page, middleware, role logic
4. Shared layout — Topbar, Sidebar, Footer
5. Dashboard page
6. Module page
7. Profile page + first-login completion screen
8. Intel page
9. Legal page
10. Admin page
11. API routes — feedback, progress, data-request
12. RSS cron job
13. Feedback button + modal (global)
14. PWA manifest
