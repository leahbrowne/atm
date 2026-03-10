# Deployment & Launch Checklist
## atm.moremidigital.com

---

## Overview

This document covers everything needed to go from a finished codebase to a live platform. Follow in order. Do not skip steps.

---

## Pre-Launch: Services to Set Up

### 1. Clerk — Authentication

1. Create account at clerk.com
2. Create a new application — name it "Moremi Learning"
3. Enable sign-in methods: **LinkedIn OAuth** and **Google OAuth** and **Email/Password**
4. Disable all other providers (Facebook, Apple, etc.)
5. Apply for LinkedIn OAuth (see LinkedIn section below)
6. Set redirect URLs:
   - Sign-in: `https://atm.moremidigital.com/sign-in`
   - After sign-in: `https://atm.moremidigital.com/dashboard`
   - After sign-up: `https://atm.moremidigital.com/profile/complete`
7. Copy API keys to `.env.local`
8. Create the `admin` role in Clerk dashboard → Roles
9. Set up webhook endpoint (see api-routes.md)

### 2. LinkedIn Developer App

⚠️ **Do this first — approval can take several days.**

1. Go to developer.linkedin.com
2. Create a new app — name: "Moremi Learning", company: Moremi Digital Group
3. Request the **Sign In with LinkedIn using OpenID Connect** product
4. Add authorised redirect URLs:
   - `https://atm.moremidigital.com/api/auth/callback/linkedin`
   - Clerk's callback URL (found in Clerk dashboard → LinkedIn OAuth settings)
5. Copy Client ID and Client Secret into Clerk's LinkedIn OAuth configuration
6. LinkedIn approval typically takes 1–5 business days — submit before starting the build

### 3. Supabase — Database

1. Create account at supabase.com
2. Create new project — name: "moremi-learning-atm", region: EU West (London)
3. Wait for project to provision (~2 minutes)
4. Open SQL Editor and run the full schema SQL from `database.md`
5. Run the seed data SQL from `database.md`
6. Enable Row Level Security (already in schema SQL)
7. Copy project URL and keys to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 4. Vercel — Hosting

1. Create account at vercel.com (or use existing)
2. Import GitHub repository
3. Framework preset: Next.js (auto-detected)
4. Add all environment variables from `.env.local`
5. Deploy — confirm build succeeds on preview URL
6. Add custom domain: `atm.moremidigital.com`
7. Vercel provides the CNAME value — add it at your domain registrar

### 5. DNS — Custom Subdomain

At your domain registrar (wherever moremidigital.com is registered):

1. Add a CNAME record:
   - Name: `atm`
   - Value: `cname.vercel-dns.com`
   - TTL: 3600 (or default)
2. DNS propagation takes up to 48 hours but usually resolves within an hour
3. Vercel automatically provisions an SSL certificate once DNS resolves

### 6. Email (for data requests and invitations)

1. Create account at resend.com
2. Add and verify your sending domain: `moremidigital.com`
3. Create an API key
4. Add `RESEND_API_KEY` to Vercel environment variables
5. Set `FROM_EMAIL=noreply@moremidigital.com` in environment variables

---

## Environment Variables — Complete List

Add all of these to both `.env.local` (local development) and Vercel project settings (production):

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/profile/complete

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email
RESEND_API_KEY=
FROM_EMAIL=noreply@moremidigital.com

# Cron security
CRON_SECRET=           # generate a random string: openssl rand -base64 32

# App
NEXT_PUBLIC_APP_URL=https://atm.moremidigital.com
```

---

## GitHub — Branch Setup

```bash
# After cloning/creating the repo
git checkout -b dev
git push origin dev

# In GitHub repository settings:
# Settings → Branches → Add branch protection rule
# Branch name pattern: main
# ✓ Require a pull request before merging
# ✓ Require approvals: 1
```

**Vercel branch configuration:**
- In Vercel project → Settings → Git:
  - Production branch: `main`
  - Preview branches: all branches (automatic)

---

## Codex Build Order

When handing to Codex, work through this sequence. Each step should be complete and tested before moving to the next.

```
Step 1  — Project initialisation
          npx create-next-app@latest atm-platform --typescript --tailwind --app
          npm install @clerk/nextjs @supabase/supabase-js rss-parser svix resend

Step 2  — Design system
          globals.css: CSS variables, base typography, animation keyframes
          Font loading in layout.tsx

Step 3  — Supabase schema
          Run schema SQL in Supabase dashboard
          Run seed SQL

Step 4  — Middleware
          middleware.ts: route protection, role checks

Step 5  — Clerk webhook
          app/api/webhooks/clerk/route.ts
          Test: sign in → check Supabase users table for new row

Step 6  — Shared layout
          Topbar.tsx (standard + module variants)
          Sidebar.tsx
          Footer.tsx
          app/(platform)/layout.tsx: wraps all platform pages

Step 7  — Login page
          app/(auth)/sign-in/page.tsx
          Custom UI using Clerk useSignIn hook

Step 8  — Dashboard
          app/(platform)/dashboard/page.tsx
          All sub-components in components/dashboard/

Step 9  — Module page
          app/(platform)/module/[moduleId]/page.tsx
          AudioPlayer.tsx component
          api/progress/route.ts

Step 10 — Profile page
          app/(platform)/profile/page.tsx
          app/(platform)/profile/complete/page.tsx (first login)
          api/users/me/route.ts

Step 11 — Intel page
          app/(platform)/intel/page.tsx
          api/cron/rss/route.ts
          vercel.json (cron schedule)

Step 12 — Legal page
          app/(platform)/legal/page.tsx

Step 13 — Admin page
          app/admin/page.tsx (separate from platform layout)
          api/admin/stats/route.ts
          api/admin/users/route.ts
          api/feedback/route.ts
          api/feedback/[id]/route.ts
          api/users/invite/route.ts
          api/users/[userId]/route.ts

Step 14 — Global components
          FeedbackButton.tsx + FeedbackModal.tsx (add to platform layout)
          Toast.tsx
          ProgressContext.tsx

Step 15 — PWA manifest
          public/manifest.json
          Add to layout.tsx head

Step 16 — Final checks (see post-build checklist below)
```

---

## Post-Build Checklist

Before sharing the URL with All Things Media, verify every item:

### Authentication
- [ ] LinkedIn sign-in works end-to-end
- [ ] Google sign-in works end-to-end
- [ ] Manual email/password sign-in works
- [ ] New user → redirected to `/profile/complete`
- [ ] Returning user → redirected to `/dashboard`
- [ ] Member navigating to `/admin` → redirected to `/dashboard`
- [ ] Admin can access `/admin`
- [ ] Signing out works and redirects to `/sign-in`

### Database
- [ ] New user row created in Supabase `users` table on first sign-in
- [ ] Streak row created for new user
- [ ] Progress saved when module marked complete
- [ ] Audio position saved every 10 seconds during playback

### Dashboard
- [ ] Welcome hero shows correct name and time-of-day greeting
- [ ] Signal ring animates correctly
- [ ] Stats strip shows real data
- [ ] Module list shows correct locked/unlocked states
- [ ] Completing module 1 unlocks module 2
- [ ] Leaderboard shows all team members
- [ ] Intel preview shows 3 articles

### Module page
- [ ] Audio player renders (disabled state if no audio_url)
- [ ] "Mark as complete" button works
- [ ] Progress persists across page reload
- [ ] Next module link appears after completing current module
- [ ] Locked module URL redirects to dashboard

### Intel
- [ ] Articles load and display correctly
- [ ] Vertical filter works
- [ ] URL hash updates on filter change
- [ ] Articles open in new tab on click

### Admin
- [ ] Stats strip shows real data
- [ ] User table shows all members
- [ ] "Invite User" sends Clerk invitation email
- [ ] Feedback list populates
- [ ] Mark resolved works
- [ ] Beta countdown shows correct days remaining
- [ ] "Talk to Moremi" billing CTA opens mailto

### Legal
- [ ] All three sections accessible via sidebar and footer links
- [ ] Hash-based deep linking works (`/legal#terms`)
- [ ] Data request form submits and shows success state
- [ ] Email notification sent to hello@moremidigital.com on submission

### Global
- [ ] Feedback button visible on all platform pages
- [ ] Feedback modal submits correctly
- [ ] Footer links work on all pages
- [ ] Responsive layout on mobile (iPhone 14 and above)
- [ ] PWA manifest valid (test with Chrome DevTools → Application tab)

---

## First Users — Onboarding Steps

When the platform is live and ready for ATM:

1. **Sign in yourself first** as Leah to confirm the full flow works
2. **Assign your admin role** in Clerk dashboard → Users → [your user] → Metadata → add `{ "role": "admin" }`
3. **Designate the ATM admin** — agree with ATM who this will be (CEO, office manager, etc.)
4. **Invite ATM admin** via the admin panel → "Invite User" → set role to Admin
5. **ATM admin signs in** — assign admin role in Clerk for their account
6. **Invite remaining team members** — ATM admin can do this from the platform, or Leah can invite via Clerk dashboard
7. **Confirm everyone can sign in** before your next visit / call

---

## Future Clients — Replication

When a new client is added, the process is:

1. Create a new subdomain: `[client].moremidigital.com`
2. Create a new GitHub repo from the template (or create a separate Vercel project pointing to the same repo with different env vars)
3. Create a new Supabase project for that client's data (data isolation between clients)
4. Update `company` default in the `users` table seed
5. Update co-branding in topbar (client name)
6. Add the client's domain to Clerk's allowed origins
7. Set up DNS CNAME for the new subdomain
8. Invite the client admin and first users

The codebase is designed to be reused per client — the main variables are the Supabase project (separate per client for data isolation) and the branding strings in the topbar.
