# Profile Page
## `/profile` — `app/(platform)/profile/page.tsx`

---

## Purpose
The user's personal page. Shows their LinkedIn-pulled identity, learning stats, earned badges, and streak history. Feels like a professional record of their progress — something worth having. Also the destination for the first-login completion flow.

## Reference
Design file: `design/profile.html`

## Access
Protected. Requires authenticated session. Users can only view their own profile — no public profiles between members.

---

## Data Required

| Data | Source |
|---|---|
| Name, photo, LinkedIn URL | Clerk session + `users` table |
| Job title, bio | `users` table |
| Modules completed | `progress` table — count where `completed = true` |
| Day streak, longest streak | `streaks` table |
| Team ranking | `progress` table — rank among all ATM users |
| Time learning | `progress` table — sum of `duration_mins` for completed modules |
| Completed module list | `progress` + `modules` + `courses` tables joined |
| Badges earned | Calculated from progress data (see badge logic below) |
| Activity log | `progress` table — last 5 completion events, ordered by `completed_at` desc |
| This week's activity | `progress` table — completions in current Mon–Sun window |

---

## First-Login Completion Screen
### `/profile/complete` — `app/(platform)/profile/complete/page.tsx`

Shown once, immediately after first sign-in, before the user sees the dashboard.

**Trigger:** `users.job_title` is null for this user.

**Layout:** Centred card, max-width 480px, full viewport height, same dark background.

**Content:**
- Moremi brand mark
- Heading: "One last thing"
- Lora italic subtext: "Tell us a little about yourself — this only takes a moment."
- Form fields:
  - Job title (text input, required)
  - About you (textarea, optional, max 280 chars, placeholder: "A sentence or two about your role at All Things Media")
- Submit button: "Take me to my dashboard →" in amber
- On submit:
  1. PATCH `/api/users/me` with `{ job_title, bio }`
  2. Update `users` table
  3. Redirect to `/dashboard`

**If user navigates directly to `/profile/complete` when `job_title` is already set:** redirect to `/dashboard`.

---

## Layout

Two-column: main content (left) + sidebar (right, 300px).

---

## Main Content

### Profile Hero Card

**Cover strip:** 80px tall, amber gradient pattern (CSS repeating-linear-gradient), subtle diagonal lines.

**Avatar:** 72px circle, initials if no photo, amber border. If LinkedIn photo exists, use it.

**LinkedIn connected badge:** top right of avatar row. Shows "Connected via LinkedIn" with LinkedIn icon in blue if user signed in via LinkedIn. If Google or manual, omit.

**Name:** Clash Display 22px
**Job title:** Jost 12px, `--text-secondary`
**Company:** amber label with briefcase icon

**Profile summary (bio):** Lora serif 13px, `--text-secondary`, 1.8 line height. This is the `bio` field from `users` table. If null, show a muted prompt: "Add a short bio in settings."

**Edit button:** small pencil icon top right of the card. Opens an inline edit state for `job_title` and `bio` fields. On save, PATCH to `/api/users/me`.

---

### Stats Row
Four stat cards in a row:

| Stat | Value | Source |
|---|---|---|
| Modules Done | count of completed modules | amber colour |
| Day Streak | current_streak | white |
| Team Rank | #N | white |
| Time Learning | total mins formatted as "Xh Ym" | white |

---

### Completed Modules
List of all modules the user has completed, most recent first.

Each row:
- Amber check circle
- Module title
- Course name + module number (muted, uppercase)
- Completion date (e.g. "7 Mar 2026")

If no completions yet: show a muted empty state — "Your completed modules will appear here. Start with Module 01 in Google Ads."

---

### Badges

Earned and locked badges shown in a 3-column grid.

**Badge logic — calculate server-side:**

| Badge | Name | Condition |
|---|---|---|
| 🎯 | First Signal | 1 module completed |
| 🔥 | On a Roll | 3 day streak achieved |
| 📡 | Full Signal | All modules in one course completed |
| 🏆 | Top of the Board | Ranked #1 in team leaderboard |
| ⚡ | 7 Day Streak | 7 day streak achieved |
| 🎓 | Course Complete | Any course fully completed |
| 🧠 | Knowledge Builder | 10 modules completed total |
| 🌍 | All Verticals | Read intel from all 4 verticals |

**Earned badges:** full opacity, amber border, amber gradient background tint.
**Locked badges:** 40% opacity, standard surface, no border highlight.

Store earned badges in a `badges` table or compute dynamically from `progress` and `streaks` — dynamic is fine for Phase 1 given small user count.

---

## Sidebar

### Streak Card
- Large amber streak number
- "Day Streak 🔥" label
- Motivational subtext (same logic as module page sidebar)
- Week grid: 7 dots (Mon–Sun), filled amber = active day, dim amber = today but not yet active, empty = no activity
- Week dot logic: query `progress.completed_at` for current week, mark days with at least one completion

### Recent Activity
Last 5 events from `progress` table:
- Amber dot
- "Completed [module title]"
- Relative timestamp ("2 days ago", "Yesterday", "Today")

If fewer than 5 events: show what exists. If no events: "No activity yet."

---

## Notes
- Profile photo: use Clerk's `user.imageUrl` if available (populated from LinkedIn or Google). Fallback to initials avatar using first + last name initials.
- The bio textarea in the edit state should show a character counter: "N / 280"
- Mobile: stats row becomes 2×2 grid, badge grid becomes 2-column
- Do not show other users' profiles — if `/profile/[userId]` is ever added, that is Phase 2
