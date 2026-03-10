# Admin Page
## `/admin` — `app/admin/page.tsx`

---

## Purpose
Leah's and the ATM-nominated administrator's view of the platform. Shows who is using it, how often, what content is being engaged with, feedback submissions, and the subscription and billing status. Single page with section switching — no separate routes.

## Reference
Design file: `design/admin.html`

## Access
Protected. Requires `admin` role. If a `member` navigates to `/admin`, redirect to `/dashboard`. Do not show a 403 page — just silently redirect.

---

## Layout

Two-column: left sidebar (200px) + main content.

---

## Sidebar

Static navigation — clicking each item shows the corresponding section in the main area, hides all others. Use React state: `activeSection` string.

```
Overview (default)
Users
Engagement
─────────────
Courses
Feedback
Billing
─────────────
[Back to Platform →]  (links to /dashboard)
```

Top right: admin avatar (Leah's initials "LB"), no dropdown needed.
"View as User" button next to avatar — navigates to `/dashboard` so Leah can see what members see.
Admin badge next to brand wordmark so it's always clear which view you're in.

---

## Sections

All sections are rendered in the DOM but only the active one is visible (`display: none` / `display: block`). This avoids page reloads and keeps navigation instant.

---

### Section 1: Overview (default)

**Page header:**
- Title: "Platform Overview"
- Subtitle: "All Things Media · Week of [current week date]"
- Right: client name badge in amber

**Stat strip — 5 cards:**

| Stat | Source |
|---|---|
| Active Users | count of users with `last_active` within last 7 days |
| Modules Completed | total count of `progress` rows where `completed = true` |
| Engagement Rate | % of users with at least 1 completion this week |
| Best Streak | highest `current_streak` across all users |
| Open Feedback | count of `feedback` rows where `resolved = false` |

**User table (abbreviated):**
Show top 5 users by last activity. Same table as Users section but limited to 5 rows. "View all users →" link switches to Users section.

**Daily login chart:**
Bar chart showing logins per day for the current week (Mon–Sun). Use a simple SVG bar chart — no external chart library needed for this basic view. Today's bar is highlighted in amber.

Data: count of distinct `users.last_active` dates grouped by day for the current week.

---

### Section 2: Users

**Header:** "Users" + "Invite User +" button (right)

**Invite flow:**
Clicking "Invite User +" opens a modal:
- Email address input
- Role select (Member / Admin)
- Send Invite button → triggers Clerk invitation API
- The invited user receives an email from Clerk with a sign-in link
- If their email domain is `@allthingsmedia.co.uk`, role is auto-assigned as `member` — the admin doesn't need to set it manually

**User table:**

Columns: Member (name + role) | Status | Modules | Streak | Last Active | Login Method

**Status:**
- Active: green pill — user has logged in within the last 7 days
- Inactive: muted pill — no login in the last 7 days
- Inactive users with last_active > 14 days: show last_active date in red

**Modules:** count of completed modules for that user, amber colour

**Streak:** "🔥 N" for current_streak > 0, "— N" for 0

**Last Active:** relative timestamp (Today, Yesterday, "3 days ago", or date if >7 days)

**Login Method:** LinkedIn | Google | Manual (from Clerk user metadata)

**Row actions:**
On hover, show a "..." menu at the far right of each row:
- View Profile (navigates to that user's profile — admin can see any user's profile)
- Resend Invite (if user has never logged in)
- Remove Access (triggers Clerk user deletion after confirmation modal)

**Empty state:** "No users yet. Use the Invite button to add your first member."

---

### Section 3: Engagement

**Header:** "Engagement"

**Date range selector:** "This Week" | "This Month" | "All Time" — tabs, no dropdown. Filters all data in this section.

**Engagement metrics — 3 stat cards:**
- Average modules per user
- Most active day of the week (calculated from progress.completed_at)
- Average session length (time between first and last action on a given day)

**Module completion table:**
Each module as a row:

| Column | Source |
|---|---|
| Module title | `modules.title` |
| Course | `courses.title` |
| Completions | count of `progress` where `module_id` = this module and `completed = true` |
| Completion rate | completions / total users |
| Avg time to complete | average days between module_order unlock and completion |

Progress bar column: visual fill showing completion rate.

**Daily activity chart:**
Larger version of the overview chart. Bars for each day in the selected date range. Shows both logins (dim) and completions (amber) as stacked or grouped bars.

---

### Section 4: Courses

**Header:** "Course Content"

**This section is read-only for Phase 1.** Leah manages content directly in Supabase. This section shows the content inventory so the ATM admin can see what's live.

**Course list:**
Each course as a card:
- Course title
- Status badge: Live (green) / Coming Soon (muted)
- Number of modules
- Expandable: click to see module list with live/draft status per module

**Add Course / Add Module:** show buttons but they are disabled with tooltip "Managed by Moremi" — Phase 2 will enable content management from the admin panel.

---

### Section 5: Feedback

**Header:** "Feedback" + "N open" count badge

**Filter tabs:** All | Open | Resolved | Bug | Content | Suggestion

**Feedback list:**

Each item:
- Category pill (Bug = red, Suggestion = blue, Content = green)
- Feedback text
- Submitted by (name + role)
- Submitted date
- "Mark Resolved" button on the right

On "Mark Resolved":
- PATCH `/api/feedback/[id]` with `{ resolved: true }`
- Item moves to Resolved state (tick icon, muted styling)
- Open count badge decrements

**Important:** Feedback is only visible to admin (Leah and ATM admin). It is explicitly not visible to the submitting user after submission, and not visible to other members. State this in the UI with a small lock icon and note: "Feedback is private — only admins can see this."

**Empty state (open):** "No open feedback. The team is happy."

---

### Section 6: Billing

**Beta banner:**
- Eyebrow: "Current Plan"
- Title: "Beta Trial — Complimentary Access"
- Description: full access at no cost through the beta period
- Right side: countdown showing "31 Oct" expiry date + "N days remaining" (calculate dynamically from today's date)

**Days remaining calculation:**
```typescript
const expiryDate = new Date('2026-10-31')
const today = new Date()
const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
```

**Pricing tiers — 3 cards:**

| Tier | Name | Price | Users | Key feature |
|---|---|---|---|---|
| Starter | Foundation | £149/month | Up to 5 | Courses + Intel + Leaderboard |
| Growth | Professional | £299/month | Up to 15 | + Performance Dashboard + LinkedIn badges |
| Enterprise | Bespoke | Custom | Unlimited | + Custom content + Strategy review |

Growth tier marked as "Recommended" with amber top border and glow.

CTA buttons:
- Foundation: "Select Plan" (standard)
- Professional: "Select Plan" (amber primary)
- Bespoke: "Talk to Moremi" (standard) — this button triggers a mailto to hello@moremidigital.com

**Billing note:**
Lora italic note below the pricing cards:
"Your beta access runs until 31 October 2026. You'll receive a reminder in September before the trial closes — no action needed until then. All usage data, progress, and content will carry over automatically to whichever plan you choose."

**Current plan indicator:**
All three cards show their CTA buttons as normal. No card is marked as "current" — they are on the free beta and none of the paid plans applies yet. This is intentional: it keeps all three options visible and equal, letting the conversation happen naturally.

---

## API Routes Required

### POST `/api/feedback`
```typescript
// Body: { category: 'bug' | 'content' | 'suggestion', message: string }
// Auth: any authenticated user
// Action: insert into feedback table, associate with current user
// Response: { success: true }
```

### PATCH `/api/feedback/[id]`
```typescript
// Body: { resolved: boolean }
// Auth: admin only
// Action: update feedback row
// Response: { success: true }
```

### POST `/api/users/invite`
```typescript
// Body: { email: string, role: 'member' | 'admin' }
// Auth: admin only
// Action: create Clerk invitation for email
// Response: { success: true }
```

### DELETE `/api/users/[userId]`
```typescript
// Auth: admin only
// Action: delete Clerk user, cascade delete Supabase records
// Response: { success: true }
```

---

## Notes
- Admin page does not use the platform layout — it has its own topbar and sidebar
- The platform footer still appears at the bottom of the admin page
- ATM admin and Leah see the same admin view — no super-admin vs admin distinction in Phase 1
- Leah's direct Clerk dashboard access gives her visibility of all users across all clients, not just ATM
- On mobile: admin page is functional but not optimised — Leah will primarily use it on desktop
