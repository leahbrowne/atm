# Market Intelligence Page
## `/intel` — `app/(platform)/intel/page.tsx`

---

## Purpose
A live industry news feed covering the four verticals relevant to All Things Media — Data Centres, Smart Home, Cinema & AV, and Competitors. Updates hourly via RSS. Gives sales and editorial staff a passive daily reason to open the platform even when they're not actively learning.

## Reference
Design file: `design/intel.html`

## Access
Protected. Requires authenticated session with `member` or `admin` role.

---

## Data Required

| Data | Source |
|---|---|
| All articles | `intel_articles` table — ordered by `published_at` desc |
| Featured article | `intel_articles` where `is_featured = true`, most recent |
| Filtered articles | `intel_articles` where `vertical = [selected filter]` |
| Article counts per vertical | Aggregate count from `intel_articles` grouped by `vertical` |

---

## Layout

Two-column: left sidebar (220px, fixed) + main content area (flexible).

---

## Left Sidebar

### Course Navigation Links
Standard sidebar links — same as dashboard. Dashboard, Google Ads, Website (soon), LinkedIn (soon).

### Vertical Filters
Five filter pills in the sidebar, stacked vertically:

| Pill | Vertical | Colour |
|---|---|---|
| All Stories | null (show all) | white/neutral |
| Data Centres | data-centre | `rgba(167,139,250,0.8)` purple |
| Smart Home | smart-home | `rgba(99,179,237,0.8)` blue |
| Cinema & AV | cinema-av | `rgba(154,205,80,0.8)` green |
| Competitors | competitor | `--amber` |

Each pill shows:
- Colour dot (6px circle)
- Vertical name
- Article count badge on the right

Active pill: slightly brighter background, text goes to `--text-primary`.

On click: filter the article list. Do not navigate — filter in place using React state or URL search params (`?vertical=data-centre`). URL params preferred so filters are shareable.

### Bottom — Feed Info
Small muted text: live green pulse dot + "Feed updates hourly. Sources: Data Centre Dynamics, CE Pro Europe, Cinema Technology, AVTechnology Europe, Smart Home World."

---

## Main Content

### Page Header
- Eyebrow: "Live Feed" in blue
- Title: "Market Intelligence" in Clash Display
- Description: Lora italic, one sentence about the feed

### Filter Bar (horizontal, above articles)
Tabs mirroring the sidebar filters for quick switching on desktop. Includes a separator before "Competitors" tab which gets amber styling when active. These are the same filters — selecting one updates the other. Keep in sync.

### Featured Article Card
Show only the most recent article where `is_featured = true`.

If no featured article exists: omit this section and go straight to the article list.

Structure:
- Eyebrow: "Top Story · [Vertical name]" with amber left line
- Headline: Clash Display 18px, line height 1.3
- Summary: Lora 13px, 3 lines, `--text-secondary`
- Footer: source name + time ago | "Read full story →" in amber
- Full card is clickable: opens `source_url` in new tab
- Top amber gradient border
- Hover: lifts slightly, box shadow deepens

### Article List

All articles (excluding the featured one) rendered as rows.

**Each article row:**
- Left colour accent bar (4px wide, vertical, colour by `vertical`)
- Content:
  - Source name (uppercase, muted) + category pill (coloured by vertical)
  - Headline (14px, `--text-primary`)
  - Summary (Lora 12.5px, 2 lines clamped, `--text-secondary`)
- Right meta:
  - Time ago (relative timestamp)
  - Arrow chevron

**Hover state:** background darkens slightly, article slides in from left (margin-left reduces to 0, padding-left increases), box shadow appears, arrow turns amber.

**On click:** open `source_url` in a new tab.

---

## Relative Timestamps

Calculate from `published_at`:
- Less than 1 hour: "N min ago"
- 1–23 hours: "Nh ago"
- Today but more than 23 hours: "Today"
- Yesterday: "Yesterday"
- 2–6 days: "N days ago"
- 7+ days: format as "3 Mar"

---

## Vertical Colour Mapping

Used consistently across accent bars, pills, and filter dots:

```typescript
const verticalColours = {
  'data-centre': {
    bar: 'rgba(167,139,250,0.7)',
    pill: 'rgba(167,139,250,0.9)',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.2)',
    label: 'Data Centres'
  },
  'smart-home': {
    bar: 'rgba(99,179,237,0.7)',
    pill: 'rgba(99,179,237,0.9)',
    bg: 'rgba(99,179,237,0.08)',
    border: 'rgba(99,179,237,0.2)',
    label: 'Smart Home'
  },
  'cinema-av': {
    bar: 'rgba(154,205,80,0.7)',
    pill: 'rgba(154,205,80,0.9)',
    bg: 'rgba(154,205,80,0.08)',
    border: 'rgba(154,205,80,0.2)',
    label: 'Cinema & AV'
  },
  'competitor': {
    bar: 'var(--amber)',
    pill: 'var(--amber)',
    bg: 'var(--amber-dim)',
    border: 'rgba(232,131,74,0.2)',
    label: 'Competitor'
  }
}
```

Export this as a constant from `lib/verticals.ts` and import wherever vertical colours are needed.

---

## RSS Cron Job
`app/api/cron/rss/route.ts`

Runs hourly via Vercel cron. Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/rss",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Logic:**
1. Fetch all RSS feeds in parallel using `rss-parser`
2. For each item, check if `source_url` already exists in `intel_articles` — skip duplicates
3. Insert new articles with appropriate `vertical` tag based on feed source
4. Auto-tag as `competitor` if title or description contains: ISE, CEDIA, Clarion, Informa, Haymarket, Reed, Messe Frankfurt
5. Set the most recent article in each new batch as `is_featured = false` — Leah manually sets `is_featured = true` in Supabase for the top story each day
6. Delete articles older than 30 days to keep the table clean

**Feed sources and vertical mapping:**
```typescript
const feeds = [
  { url: 'https://www.datacenterdynamics.com/rss/', vertical: 'data-centre' },
  { url: 'https://www.cepro.com/rss/', vertical: 'smart-home' },
  { url: 'https://www.avtechnologyeurope.com/rss', vertical: 'cinema-av' },
  { url: 'https://www.smarthomeworld.co.uk/rss', vertical: 'smart-home' },
]
```

**Secure the cron endpoint:** check for `Authorization: Bearer [CRON_SECRET]` header. Add `CRON_SECRET` to environment variables.

---

## Empty and Loading States

**Loading:** show skeleton cards (grey animated shimmer) for the article list while fetching.

**No articles for a vertical:** "No stories in this category yet. Check back soon." — centred, muted text.

**Feed error:** if RSS fetch fails, show last available articles with a small muted note: "Feed last updated [timestamp]."

---

## Notes
- Phase 2: personalise feed by role — sales members see competitor and market articles first, editorial see industry trend articles first
- Phase 2: allow Leah to mark articles as featured from an admin UI rather than directly in Supabase
- Article summaries are truncated at 2 lines in the list but show in full on the featured card
- On mobile: sidebar collapses into a horizontal scroll filter bar at the top of the page
