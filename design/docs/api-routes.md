# API Routes
## `app/api/`

---

## Purpose
All server-side data mutations go through API routes. Reads are handled server-side in page components where possible. This document specifies every route, its method, auth requirement, request body, and response shape.

---

## Auth Pattern

All protected routes use Clerk's `auth()` to get the current user. Admin-only routes additionally check the user's role.

```typescript
// Standard auth check
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return Response.json({ error: 'Unauthorised' }, { status: 401 })
  // ...
}

// Admin-only check
const user = await supabase
  .from('users')
  .select('role')
  .eq('clerk_id', userId)
  .single()

if (user.data?.role !== 'admin') {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
```

Use the **service role** Supabase client for all API routes so that RLS does not block server-side operations:

```typescript
// lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

## Routes

---

### POST `/api/progress`
Mark a module as complete or save audio position.

**Auth:** Any authenticated member or admin

**Request body:**
```typescript
{
  moduleId: string      // UUID
  completed?: boolean   // default false — set true to mark complete
  audioPosition?: number // seconds — for saving audio resume position
}
```

**Logic:**
1. Resolve `userId` from Clerk to Supabase `users.id`
2. Upsert into `progress` table (insert if not exists, update if exists)
3. If `completed = true`:
   - Set `completed_at = now()`
   - Call `update_streak` Supabase function
   - Update `users.last_active = now()`
4. If `audioPosition` is set, update `audio_position` field only

**Response:**
```typescript
{ success: true, streak: number } // return updated streak for client UI update
```

---

### GET `/api/progress`
Get current user's progress across all modules.

**Auth:** Any authenticated member or admin

**Response:**
```typescript
{
  progress: Array<{
    moduleId: string
    completed: boolean
    completedAt: string | null
    audioPosition: number
  }>
  streak: {
    current: number
    longest: number
    lastActivity: string
  }
}
```

---

### PATCH `/api/users/me`
Update current user's profile (job title, bio).

**Auth:** Any authenticated member or admin

**Request body:**
```typescript
{
  jobTitle?: string
  bio?: string
}
```

**Logic:**
1. Validate — `jobTitle` max 100 chars, `bio` max 280 chars
2. Update `users` table row where `clerk_id = userId`

**Response:**
```typescript
{ success: true }
```

---

### POST `/api/feedback`
Submit platform feedback.

**Auth:** Any authenticated member or admin

**Request body:**
```typescript
{
  category: 'bug' | 'content' | 'suggestion'
  message: string // max 1000 chars
}
```

**Logic:**
1. Validate category and message
2. Resolve Clerk userId to Supabase `users.id`
3. Insert into `feedback` table

**Response:**
```typescript
{ success: true }
```

---

### PATCH `/api/feedback/[id]`
Mark a feedback item as resolved.

**Auth:** Admin only

**Request body:**
```typescript
{ resolved: boolean }
```

**Logic:**
1. Verify admin role
2. Update `feedback` row where `id = params.id`

**Response:**
```typescript
{ success: true }
```

---

### POST `/api/users/invite`
Invite a new user to the platform.

**Auth:** Admin only

**Request body:**
```typescript
{
  email: string
  role: 'member' | 'admin'
}
```

**Logic:**
1. Verify admin role
2. Use Clerk Backend API to create an invitation:
```typescript
import { clerkClient } from '@clerk/nextjs/server'

await clerkClient.invitations.createInvitation({
  emailAddress: email,
  redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-in`,
  publicMetadata: { role }
})
```
3. Clerk sends the invitation email automatically

**Response:**
```typescript
{ success: true }
```

---

### DELETE `/api/users/[userId]`
Remove a user from the platform.

**Auth:** Admin only

**Logic:**
1. Verify admin role
2. Cannot delete yourself — check `userId !== currentUserId`
3. Delete from Clerk: `await clerkClient.users.deleteUser(userId)`
4. Supabase cascade delete handles related rows (progress, streaks, feedback)

**Response:**
```typescript
{ success: true }
```

---

### POST `/api/data-request`
Submit a data export or deletion request.

**Auth:** Any authenticated member or admin (own data only)

**Request body:**
```typescript
{ type: 'export' | 'delete' }
```

**Logic:**
1. Resolve userId
2. Insert into `data_requests` table with `status = 'pending'`
3. Send notification email to `hello@moremidigital.com`:

```typescript
// Using Resend (recommended) or Nodemailer
// Email content:
// Subject: "Data Request — [type] — [user email]"
// Body: user name, email, request type, timestamp, platform
```

4. Add `RESEND_API_KEY` to environment variables

**Response:**
```typescript
{ success: true }
```

---

### GET `/api/admin/stats`
Get platform-wide statistics for the admin dashboard.

**Auth:** Admin only

**Response:**
```typescript
{
  activeUsers: number        // logged in within last 7 days
  totalCompletions: number   // all-time module completions
  engagementRate: number     // % of users with 1+ completion this week
  bestStreak: number         // highest current_streak across all users
  openFeedback: number       // unresolved feedback count
  weeklyLogins: Array<{      // one per day, Mon–Sun current week
    date: string
    count: number
  }>
}
```

---

### GET `/api/admin/users`
Get all users with their stats.

**Auth:** Admin only

**Response:**
```typescript
{
  users: Array<{
    id: string
    name: string
    email: string
    role: string
    jobTitle: string
    modulesCompleted: number
    currentStreak: number
    lastActive: string
    loginMethod: 'linkedin' | 'google' | 'manual'
    status: 'active' | 'inactive'
  }>
}
```

---

### GET `/api/cron/rss`
Hourly RSS feed fetch. Called by Vercel cron scheduler.

**Auth:** Internal only — verify `Authorization: Bearer [CRON_SECRET]` header

**Logic:**
1. Fetch all RSS feeds in parallel (see intel.md for feed URLs)
2. Filter out articles already in `intel_articles` by checking `source_url` uniqueness
3. Auto-tag vertical based on feed source
4. Auto-tag competitor if title contains competitor keywords
5. Insert new articles
6. Delete articles older than 30 days
7. Log count of inserted articles

**Response:**
```typescript
{ inserted: number, deleted: number }
```

---

## Webhook — Clerk User Created

When a new user signs in for the first time, Clerk fires a `user.created` webhook.

**Endpoint:** `POST /api/webhooks/clerk`

**Purpose:**
1. Create a corresponding row in the Supabase `users` table
2. Create an empty `streaks` row for the user
3. Auto-assign role based on email domain

**Setup:**
1. Add webhook endpoint in Clerk dashboard → Webhooks → Add Endpoint
2. URL: `https://atm.moremidigital.com/api/webhooks/clerk`
3. Events to listen for: `user.created`
4. Add `CLERK_WEBHOOK_SECRET` to environment variables

**Logic:**
```typescript
import { Webhook } from 'svix'

// Verify webhook signature
const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
const evt = wh.verify(body, headers) as ClerkWebhookEvent

if (evt.type === 'user.created') {
  const { id, email_addresses, first_name, last_name, image_url } = evt.data
  const email = email_addresses[0]?.email_address

  // Auto-assign role based on domain
  const role = email?.endsWith('@allthingsmedia.co.uk') ? 'member' : 'member'
  // Note: admin role is always assigned manually in Clerk dashboard

  // Insert user into Supabase
  await supabaseAdmin.from('users').insert({
    clerk_id: id,
    name: `${first_name} ${last_name}`.trim(),
    email,
    role,
    avatar_url: image_url,
    company: 'All Things Media'
  })

  // Create empty streak row
  await supabaseAdmin.from('streaks').insert({
    user_id: // resolve from users table after insert
  })
}
```

Install `svix` for webhook verification: `npm install svix`

---

## Error Handling Pattern

All API routes return consistent error shapes:

```typescript
// Success
{ success: true, data?: any }

// Client error (4xx)
{ error: 'Human-readable message', code?: string }

// Server error (5xx)
{ error: 'Something went wrong. Please try again.' }
```

Never expose stack traces or internal error details in API responses.

---

## Rate Limiting

For Phase 1 with a small user base, basic rate limiting is sufficient. Add headers to the feedback and data-request endpoints:

```typescript
// Simple in-memory rate limit (sufficient for < 20 users)
// Or use Vercel's built-in edge rate limiting if available on the plan
```

Upgrade to a proper rate limiting solution (Upstash Redis + `@upstash/ratelimit`) in Phase 2 when the platform is multi-tenant.
