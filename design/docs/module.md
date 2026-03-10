# Module Page
## `/module/[moduleId]` — `app/(platform)/module/[moduleId]/page.tsx`

---

## Purpose
The core learning experience. Where users actually read and listen to course content. Should feel calm, focused, and easy to read — no distractions. The audio player is present and ready even if no audio file exists yet.

## Reference
Design file: `design/module.html`

## Access
Protected. Requires authenticated session. User must have the module unlocked (previous module completed, or it's the first module). If a user navigates directly to a locked module URL, redirect to `/dashboard`.

---

## URL Parameter
`moduleId` — UUID from the `modules` table.

---

## Data Required

| Data | Source |
|---|---|
| Module content | `modules` table — `title`, `content` (markdown), `audio_url`, `duration_mins` |
| Course info | `courses` table — via `modules.course_id` |
| All modules in course | `modules` table — all rows matching `course_id`, ordered by `module_order` |
| User's completion status per module | `progress` table — all rows for current user in this course |
| User streak | `streaks` table |

---

## Layout

Two-column: main content area (left, wider) + sticky sidebar (right, 320px).

### Topbar (modified)
Different from the main platform topbar for this page:
- Left: back arrow + "Back" link → returns to `/dashboard`
- Divider
- Breadcrumb: "Google Ads · Module 02"
- Right: progress pills (one per module in course — filled amber = done, dim amber = current, empty = locked) + avatar pill

### Main Content Area

#### Module Meta Row
- Module number pill (amber, e.g. "Module 02")
- Course name label
- Duration on the right ("8 min read")

#### Audio Player
Always render the audio player. It is a prominent feature even before audio exists.

**If `audio_url` is null (Phase 1 default):**
- Render the player in a "coming soon" state
- Play button is visible but disabled, styled with 50% opacity
- Small label below: "Audio version coming soon"
- Progress bar is static at 0%

**If `audio_url` is populated:**
- Fully functional player (see Audio Player Component below)

#### Module Heading
Clash Display, 28px, the module title.

#### Module Intro
Lora italic, 15px, the first paragraph — slightly larger and more prominent than body text.

#### Article Body
Render the `content` field as markdown. Apply these styles:
- `h2` tags: Clash Display, small caps, with top border separator
- `p` tags: Lora 15px, `--text-secondary` colour, 1.85 line height
- `strong` within `p`: `--text-primary` colour
- `.callout` class in markdown: left amber border, surface background, indented
- Custom component for `placement-grid` if used in content

#### Module Footer
- "Mark as complete" amber button (left)
- "Next: [next module title] →" muted link (right)
- On "Mark as complete":
  1. POST to `/api/progress` with `{ moduleId, completed: true }`
  2. Button changes to "Completed ✓" in amber, disabled
  3. Next module unlocks — update UI immediately
  4. If this was the last module: show completion celebration (brief amber flash on the signal ring, confetti optional)
  5. Recalculate streak via streak logic
- Next module link only shows if next module is in the same course and now unlocked

---

## Audio Player Component
`components/module/AudioPlayer.tsx`

### Props
```typescript
interface AudioPlayerProps {
  audioUrl: string | null
  title: string
  duration: string // formatted "8:24"
  moduleId: string
  savedPosition?: number // seconds, from progress table
}
```

### Features
- Play / pause toggle
- Progress bar with scrubbing (click to seek)
- Current time / total duration timestamps
- Playback speed: cycles through 1×, 1.25×, 1.5×, 2× on click
- **Position saving:** every 10 seconds, POST current position to `/api/progress` with `{ moduleId, audioPosition: seconds }`. On next load, resume from saved position.
- Keyboard shortcut: spacebar to play/pause when player is focused

### Visual states
- Default: play icon (triangle)
- Playing: pause icon (two rectangles)
- Disabled (no audio): play icon at 50% opacity, tooltip "Audio coming soon"

---

## Sidebar Component

### Course Modules List
All modules in the current course rendered as small rows:
- Status icon (check circle = done, filled dot = current, lock = locked)
- Module title (truncated if needed)
- Duration
- Clicking a completed or current module navigates to it
- Clicking a locked module: no action

### Key Takeaways
Static list pulled from the module content. Render the first 4 `<li>` items from any `<ul>` tagged with class `takeaways` in the markdown content. If no tagged list exists, omit this section.

### Streak Nudge
Small amber card at the bottom of the sidebar showing current streak and a short motivational label:
- 0 days: "Start your streak today"
- 1–2 days: "You're getting started 🔥"
- 3–6 days: "N day streak — keep going 🔥"
- 7+ days: "N day streak — impressive 🔥"

---

## Markdown Content Format

Module content is stored as markdown in the `modules.content` column. Authors (Leah) write content in markdown. The module page renders it using a markdown parser (use `react-markdown` with `remark-gfm`).

### Special classes to support in markdown

**Callout box:**
```markdown
:::callout
**Key point:** Your highlighted text here
:::
```

**Placement grid (2-column):**
```markdown
:::placement-grid
### Search
Icon: search
Where ads appear at the top of Google results pages.

### Display
Icon: monitor
Banner ads across millions of websites.
:::
```

These are custom directives — use `remark-directive` plugin to parse and render as React components.

---

## Progress Tracking

On page load:
- Fetch user's progress for this module from `progress` table
- If `completed = true`: mark as complete in UI immediately, show "Completed ✓" on button
- If `audio_position > 0`: resume audio from saved position

On marking complete:
- Update `progress` table: `completed = true`, `completed_at = now()`
- Recalculate streak
- Increment daily signal count

---

## Notes
- `[moduleId]` route is dynamic — all module content comes from Supabase, not hardcoded
- Module content can be updated in Supabase without a code deploy
- Mobile: sidebar collapses below content, rendered after the article body
- Reading time estimate: calculate from content word count (average 200 words/minute) if `duration_mins` is null
