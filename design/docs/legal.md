# Legal Page
## `/legal` — `app/(platform)/legal/page.tsx`

---

## Purpose
Houses all three legal documents the platform requires: Privacy Policy, Terms of Use, and Your Data. Single page with sidebar tab switching — no separate routes. Accessible from the footer on every page. Written in plain English with a professional but human tone.

## Reference
Design file: `design/legal.html`

## Access
Protected. Requires authenticated session. Users must be signed in to view — this is a platform document, not a public page. The login page has its own privacy notice handled separately.

---

## Layout

Two-column: left sidebar (240px) + main content area.

No topbar nav links — simplified topbar with brand mark on the left and "Back to Dashboard" link on the right only.

---

## Sidebar

Three tab items, stacked vertically:

| Icon | Label | Section ID |
|---|---|---|
| Shield | Privacy Policy | `privacy` |
| Document | Terms of Use | `terms` |
| Database | Your Data | `yourdata` |

Default active: `privacy`

On tab click:
- Switch active section in main content
- Smooth scroll to top of content area
- Update URL hash (`/legal#privacy`, `/legal#terms`, `/legal#yourdata`) so links from footer can deep-link to the correct section
- Update active state on sidebar tab

**Below tabs:**
```
Last updated
March 2026

Questions? Contact
hello@moremidigital.com
```

---

## URL Routing

Support hash-based deep linking. On page load, read the URL hash and set the initial active section accordingly:

```typescript
// On mount
const hash = window.location.hash.replace('#', '')
if (['privacy', 'terms', 'yourdata'].includes(hash)) {
  setActiveSection(hash)
}
```

Footer links should link as:
- `/legal#privacy`
- `/legal#terms`
- `/legal#yourdata`

---

## Section 1: Privacy Policy

### Intro
Eyebrow: "Legal" | Title: "Privacy Policy" | Lora italic intro: "This policy explains what information we collect when you use the Moremi Learning platform, why we collect it, and how it is used. We've written this in plain English because you deserve to understand it."

### Block 1 — Who we are
Moremi Digital Group operates the platform. All Things Media arranged access. Moremi = data processor. All Things Media = data controller.

### Block 2 — What we collect

Render as a styled table:

| Data | Source | Why |
|---|---|---|
| Name, job title, profile photo | LinkedIn or manual sign-up | To personalise your profile |
| Email address | LinkedIn, Google, or manual | Account access and notifications |
| Course progress and completions | Your activity on the platform | To track learning and unlock modules |
| Login timestamps and frequency | Automatic | Platform administration and streak tracking |
| Feedback and support messages | Submitted by you | To improve the platform |

### Block 3 — What we do not collect
Paragraph: no payment information, no LinkedIn connections or messages, no advertising tracking cookies, no sale of data to third parties.

### Block 4 — Who can see your data
Three named parties with what they can see:
- Moremi Digital Group: all usage data
- ATM administrator: name, role, course progress, login frequency, streak — not feedback
- Colleagues: first name and streak on leaderboard only
- Clerk: processes login credentials (link to clerk.com/privacy)

### Block 5 — How long we keep your data
Retained while account is active. Deleted within 30 days of account removal unless export requested.

### Block 6 — Your rights under GDPR
Right to access, correct, or delete personal data. Submit from the Your Data tab or email hello@moremidigital.com. Response within 30 days.

---

## Section 2: Terms of Use

### Intro
Eyebrow: "Legal" | Title: "Terms of Use" | Intro: "By accessing this platform you agree to these terms. They exist to protect both you and the integrity of the platform — not to create barriers."

### Block 1 — Access and eligibility
Access granted by All Things Media to employees and nominated members. Personal, non-transferable. Access can be suspended for breach of terms.

### Block 2 — Intellectual property
All content is intellectual property of Moremi Digital Group. Permitted for personal professional development within All Things Media only. No reproduction, distribution, or resale without written permission.

### Block 3 — Beta programme
Free access until 31 October 2026. Features may change during beta. Significant changes communicated in advance.

Include callout box:
```
No action is required from you during the beta period. If All Things Media
chooses to continue after October 2026, access will transition to a 
subscription arrangement. All your progress and data will carry over.
```

### Block 4 — Acceptable use
Platform for professional learning only. No accessing other users' accounts. No reverse engineering. No automated access tools.

### Block 5 — Limitation of liability
Content provided in good faith as educational resource. No guarantee of completeness or accuracy in fast-moving areas. Not professional or legal advice.

### Block 6 — Governing law
Laws of England and Wales.

---

## Section 3: Your Data

### Intro
Eyebrow: "Legal" | Title: "Your Data" | Intro: "A plain-English explanation of exactly what information exists about you on this platform, who can see it, and what you can do about it."

### Block 1 — What's in your account
Name, email, job title, profile photo, course progress, login history, streak data, feedback submitted. That's it.

### Block 2 — If you signed in with LinkedIn

Intro paragraph then a styled list showing collected vs not collected:

**Collected:**
- Name and profile photo
- Job title and current company
- Email address

**Not collected:**
- Your connections and network
- Messages or activity
- Contact information beyond email

Render each item as a row with an icon, label, and a status pill on the right ("Collected" in amber / "Not collected" in muted grey).

### Block 3 — Who sees what

Render as a styled table:

| Data | ATM Admin | Your Colleagues |
|---|---|---|
| Your name | Yes | First name on leaderboard |
| Course progress | Yes | No |
| Login frequency | Yes | No |
| Streak | Yes | Leaderboard only |
| Feedback submitted | No | No |
| Email address | No | No |

### Block 4 — Request your data or close your account

Intro paragraph then the data request form.

**Data Request Form Component:**
`components/shared/DataRequestForm.tsx`

Two option cards (select one):
- "Export My Data" — receive a copy of all data in a readable format
- "Delete My Account" — permanently remove account and all associated data

Default selected: Export My Data

Submit button: "Submit Request →" in amber

**On submit:**
1. POST to `/api/data-request` with `{ type: 'export' | 'delete', userId }`
2. Show success state: "Your request has been submitted. We'll respond within 30 days." with a green check
3. API route sends an email notification to hello@moremidigital.com with the request details
4. Log the request in a `data_requests` table for record-keeping

```typescript
// Supabase table: data_requests
// id, user_id, type (export|delete), status (pending|complete), created_at
```

**Important note visible in the form:**
Small lock icon + "Requests are processed by Moremi Digital Group within 30 days. Your request is private — it is not visible to All Things Media."

---

## API Routes Required

### POST `/api/data-request`
```typescript
// Body: { type: 'export' | 'delete' }
// Auth: authenticated user (own data only)
// Action:
//   1. Insert into data_requests table
//   2. Send email to hello@moremidigital.com via a transactional email service
//      (use Resend or Nodemailer — add RESEND_API_KEY to env vars)
//   3. If type === 'delete': do not immediately delete — flag for manual processing
//      (Leah confirms deletion to prevent accidental permanent loss)
// Response: { success: true }
```

---

## Footer Links from Other Pages

Every page footer contains three links. On click, navigate to the legal page and open the relevant section:

```tsx
// Footer component
<a href="/legal#privacy">Privacy Policy</a>
<a href="/legal#terms">Terms of Use</a>
<a href="/legal#yourdata">Your Data</a>
```

---

## Notes
- Do not use `next/link` for the footer legal links — use plain anchor tags with hash so the hash is preserved on navigation
- If a user is on mobile, the sidebar collapses into a tab bar at the top of the page (three labelled tabs: Privacy, Terms, Your Data)
- Content in this page is largely static — no database queries except the data request form submission
- Review and update the "Last updated" date in the sidebar whenever content changes
- The "Delete My Account" path is intentionally manual (flagged but not auto-executed) to give Leah a chance to reach out and understand the request before processing — especially useful during beta
