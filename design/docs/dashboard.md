# Dashboard Page
## `/dashboard` — `app/(platform)/dashboard/page.tsx`

---

## Purpose
The home screen every member lands on after login. Shows their personal progress, the active course, team leaderboard, a market intelligence preview, and coming soon content. The dashboard is the habit-forming screen — it should always give the user something to do or look at.

## Reference
Design file: `design/dashboard.html`

## Access
Protected. Requires authenticated session with `member` or `admin` role. Admin users also have access — they see the same dashboard as members.

---

## Data Required

All data fetched server-side where possible. Use Supabase server client.

| Data | Source | Query |
|---|---|---|
| User name, role, avatar | Clerk session | `auth().currentUser` |
| Today's signal (% of daily goal) | `progress` table | modules completed today / daily goal |
| Modules completed (total) | `progress` table | count where `user_id` = current user |
| Day streak | `streaks` table | `current_streak` where `user_id` = current user |
| Team ranking | `progress` table | rank user by total completions across team |
| Latest notification | `modules` table | most recently made-live module |
| Active course + modules | `courses` + `modules` tables | first live course, all modules in order |
| Coming soon courses | `courses` table | where `coming_soon = true` |
| Team leaderboard | `progress` + `streaks` + `users` | all ATM members, sorted by completions then streak |
| Intel preview | `intel_articles` table | 3 most recent, ordered by `published_at` desc |

---

## Sections — in render order

### 1. Welcome Hero
- Left: greeting ("Good morning / afternoon / evening" based on time of day), user's first name in Clash Display 28px, role pill with amber dot
- Right: Signal ring — SVG circle showing today's completion percentage. 0% on first login, fills as modules are completed. Label: "Today's Signal"
- Signal calculation: (modules completed today / 1) × 100. Daily goal is 1 module. Capped at 100%.

### 2. Stat Strip
Three cards in a row:
- Modules Done (amber number)
- Day Streak (white number)
- Team Ranking (#N format, white)

### 3. Notification Banner
Show only when a new module has been made live in the last 7 days.
- Pulsing amber dot
- Eyebrow: "New this week"
- Text: "[Module title] has just been added to your course"
- Right: "View →" in amber
- On click: scroll to module in the module list or navigate to module page
- Dismiss: clicking anywhere on banner navigates to the module
- If no new modules in last 7 days: do not render this section

### 4. Active Course Card
Shows the first live course and the user's progress within it.
- Eyebrow: "Active Course"
- Course title in Clash Display
- Lora italic description
- Progress bar: fills based on (completed modules / total modules) × 100
- Progress label: "N of N modules complete · N%"
- Button: "Continue →" — links to the next incomplete module (`/module/[moduleId]`)
- If all modules complete: button changes to "Course Complete ✓" in amber, disabled

### 5. Module List
All modules for the active course rendered as rows.

Each row contains:
- Module number (01, 02, etc.)
- Icon (check for complete, play for available, lock for locked)
- Module title
- Duration
- Status badge: Complete (amber) / Start (white) / Locked (muted)

**Locking logic:**
- Module 1: always unlocked
- Module N: unlocked only if Module N-1 is marked complete
- Exception: if a module has been newly made live and is the next in sequence, it unlocks regardless of timing

On click of an available module: navigate to `/module/[moduleId]`
On click of a locked module: no action, cursor default

### 6. Coming Soon
Three cards in a grid showing upcoming courses.
- Diagonal stripe texture (CSS `repeating-linear-gradient`)
- Course number label, course title, "Opening Soon" pill
- Data from `courses` table where `coming_soon = true`, ordered by `track_order`
- Static for now — no interaction

### 7. Market Intelligence Preview
Three most recent articles from `intel_articles` table.
- Section header: "Market Intelligence" with "Updated hourly" meta
- Each article: accent bar (colour by vertical), source, category pill, headline, summary (2 lines clamped), time ago, arrow
- "View all →" link → navigates to `/intel`
- Accent colours by vertical:
  - competitor: `--amber`
  - data-centre: `rgba(167,139,250,0.7)`
  - smart-home: `rgba(99,179,237,0.7)`
  - cinema-av: `rgba(154,205,80,0.7)`

### 8. Team Leaderboard
All members ranked by modules completed, then streak as tiebreaker.
- Current user row highlighted with amber left border and amber glow background
- "You" pill next to current user's name
- Show role (Sales / Editorial) under each name
- Streak shown as 🔥 N for active streaks, — N for cold streaks (no activity today)
- Header shows company name and current week date

---

## Streak Logic

Run on every page load and on module completion:
1. Check `last_activity` date in `streaks` table for current user
2. If `last_activity` = today: no change
3. If `last_activity` = yesterday: increment `current_streak` by 1, update `last_activity` to today
4. If `last_activity` < yesterday: reset `current_streak` to 1 (they've logged in today, streak restarts), update `last_activity`
5. Update `longest_streak` if `current_streak` > `longest_streak`

---

## Interactions

| Action | Behaviour |
|---|---|
| Click module row (available) | Navigate to `/module/[moduleId]` |
| Click module row (locked) | No action |
| Click notification banner | Navigate to new module |
| Click "Continue →" button | Navigate to next incomplete module |
| Click "View all →" in intel | Navigate to `/intel` |
| Click intel article | Open source URL in new tab |

---

## Empty States

- No modules completed yet: show "Start your first module" CTA in the course card
- No streak yet: streak shows 0, no flame emoji
- Leaderboard with one user: still render, shows just them

---

## Notes
- Server-side render the initial data, use client components only for interactive elements (signal ring animation, notification dismiss)
- Time of day greeting logic: before 12pm = "Good morning", 12–5pm = "Good afternoon", after 5pm = "Good evening"
- Signal ring animates from 0 to actual percentage on first render using CSS transition
