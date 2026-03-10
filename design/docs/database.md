# Database — Supabase Schema & Seed Data
## Supabase PostgreSQL

---

## Purpose
Full schema definition and seed data for the Moremi Learning platform. Run the schema SQL first, then the seed SQL. All tables use UUID primary keys. Row Level Security (RLS) is enabled on all tables.

---

## Schema SQL

Run this in the Supabase SQL editor:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────
create table users (
  id            uuid primary key default uuid_generate_v4(),
  clerk_id      text unique not null,
  name          text,
  email         text unique not null,
  role          text not null default 'member' check (role in ('member', 'admin')),
  job_title     text,
  bio           text,
  avatar_url    text,
  linkedin_url  text,
  company       text default 'All Things Media',
  created_at    timestamptz default now(),
  last_active   timestamptz default now()
);

-- ─── COURSES ─────────────────────────────────────────────────
create table courses (
  id              uuid primary key default uuid_generate_v4(),
  title           text not null,
  description     text,
  track_order     int not null default 0,
  is_live         boolean default false,
  coming_soon     boolean default false,
  estimated_mins  int,
  created_at      timestamptz default now()
);

-- ─── MODULES ─────────────────────────────────────────────────
create table modules (
  id            uuid primary key default uuid_generate_v4(),
  course_id     uuid not null references courses(id) on delete cascade,
  title         text not null,
  content       text, -- markdown
  audio_url     text, -- null until ElevenLabs audio is ready
  duration_mins int default 8,
  module_order  int not null default 0,
  is_live       boolean default true,
  created_at    timestamptz default now()
);

-- ─── PROGRESS ────────────────────────────────────────────────
create table progress (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references users(id) on delete cascade,
  module_id       uuid not null references modules(id) on delete cascade,
  completed       boolean default false,
  completed_at    timestamptz,
  audio_position  int default 0, -- seconds
  unique(user_id, module_id)
);

-- ─── STREAKS ─────────────────────────────────────────────────
create table streaks (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid unique not null references users(id) on delete cascade,
  current_streak  int default 0,
  longest_streak  int default 0,
  last_activity   date
);

-- ─── FEEDBACK ────────────────────────────────────────────────
create table feedback (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  category    text not null check (category in ('bug', 'content', 'suggestion')),
  message     text not null,
  resolved    boolean default false,
  created_at  timestamptz default now()
);

-- ─── INTEL ARTICLES ──────────────────────────────────────────
create table intel_articles (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  summary       text,
  source        text not null,
  source_url    text unique not null,
  vertical      text not null check (vertical in ('data-centre', 'smart-home', 'cinema-av', 'competitor')),
  is_featured   boolean default false,
  published_at  timestamptz not null,
  created_at    timestamptz default now()
);

-- ─── DATA REQUESTS ───────────────────────────────────────────
create table data_requests (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references users(id) on delete cascade,
  type        text not null check (type in ('export', 'delete')),
  status      text not null default 'pending' check (status in ('pending', 'processing', 'complete')),
  created_at  timestamptz default now()
);

-- ─── INDEXES ─────────────────────────────────────────────────
create index idx_progress_user_id on progress(user_id);
create index idx_progress_module_id on progress(module_id);
create index idx_modules_course_id on modules(course_id);
create index idx_intel_articles_vertical on intel_articles(vertical);
create index idx_intel_articles_published_at on intel_articles(published_at desc);
create index idx_feedback_resolved on feedback(resolved);
create index idx_users_clerk_id on users(clerk_id);
```

---

## Row Level Security

```sql
-- Enable RLS on all tables
alter table users enable row level security;
alter table courses enable row level security;
alter table modules enable row level security;
alter table progress enable row level security;
alter table streaks enable row level security;
alter table feedback enable row level security;
alter table intel_articles enable row level security;
alter table data_requests enable row level security;

-- Users: can read own row, service role can read all
create policy "users_read_own" on users
  for select using (clerk_id = current_user);

create policy "users_update_own" on users
  for update using (clerk_id = current_user);

-- Courses: all authenticated users can read live courses
create policy "courses_read_live" on courses
  for select using (is_live = true or coming_soon = true);

-- Modules: all authenticated users can read live modules
create policy "modules_read_live" on modules
  for select using (is_live = true);

-- Progress: users can read and write own progress
create policy "progress_own" on progress
  for all using (user_id = (
    select id from users where clerk_id = current_user
  ));

-- Streaks: users can read and write own streak
create policy "streaks_own" on streaks
  for all using (user_id = (
    select id from users where clerk_id = current_user
  ));

-- Leaderboard: users can read all streaks (for leaderboard)
create policy "streaks_read_all" on streaks
  for select using (true);

-- Feedback: users can insert, only service role can read all
create policy "feedback_insert_own" on feedback
  for insert with check (user_id = (
    select id from users where clerk_id = current_user
  ));

-- Intel: all authenticated users can read
create policy "intel_read_all" on intel_articles
  for select using (true);

-- Data requests: users can insert own requests
create policy "data_requests_insert_own" on data_requests
  for insert with check (user_id = (
    select id from users where clerk_id = current_user
  ));
```

**Note:** Use the Supabase **service role key** (not anon key) in server-side API routes that need to bypass RLS for admin operations (reading all users, reading all feedback, etc.). Never expose the service role key to the client.

---

## Seed Data SQL

Run after schema. This populates the initial course and module content.

```sql
-- ─── SEED COURSES ────────────────────────────────────────────

insert into courses (id, title, description, track_order, is_live, coming_soon, estimated_mins) values
(
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Google Ads: What You Need to Know',
  'The essentials of Google Ads — what it is, where ads appear, how targeting works, and what the different formats look like. Four short modules, no prior knowledge needed.',
  1,
  true,
  false,
  30
),
(
  'a1b2c3d4-0002-0001-0001-000000000002',
  'Your Website & How It Works',
  'What your website is actually doing, what cookies are, why user experience matters, and what your website data is telling you.',
  2,
  false,
  true,
  32
),
(
  'a1b2c3d4-0003-0001-0001-000000000003',
  'LinkedIn for Sales & Editorial',
  'How LinkedIn works for your specific role — profile optimisation, staying visible, understanding the algorithm, and why consistency beats volume.',
  3,
  false,
  true,
  28
);

-- ─── SEED MODULES — Course 1: Google Ads ─────────────────────

insert into modules (id, course_id, title, content, audio_url, duration_mins, module_order, is_live) values
(
  'b1c2d3e4-0001-0001-0001-000000000001',
  'a1b2c3d4-0001-0001-0001-000000000001',
  'What is Google Ads?',
  '## The simplest possible explanation

Google Ads is a system that lets businesses pay to appear in front of people who are searching for something relevant — or who fit a profile of someone likely to be interested.

You pay Google. Google puts your message in front of the right people. Simple.

## Why it exists

Before Google Ads existed, if you wanted to reach potential customers online, your options were limited: build a website and hope people found it, or pay for banner ads on websites and hope the right people saw them. Neither was particularly efficient.

Google Ads changed this by connecting supply and demand directly. Someone types "data centre cooling solutions" into Google — that is a clear signal of intent. A company selling data centre cooling solutions would pay a great deal to appear at that precise moment.

That is the core mechanic: **intent matching**. The person has told Google what they want. The advertiser says who they want to reach. Google connects them.

:::callout
**The key insight:** Google Ads works because it captures demand that already exists. The person is searching. You just need to be there when they do.
:::

## What it is not

Google Ads is not the same as SEO (Search Engine Optimisation). SEO is the process of improving your website so it ranks higher in the *organic* (non-paid) results. Google Ads is paid — you appear because you are paying to be there, not because Google thinks your content is the best answer.

Both matter. They work differently. For now, the distinction to hold onto is: **organic results = earned, paid results = bought**.

## The scale of it

Google processes approximately 8.5 billion searches every day. The Google Ads platform reaches over 90% of internet users worldwide through search, display, video, and email. For most businesses, it is the largest and most measurable advertising channel available.

For All Things Media, it means your events and publications can be in front of exactly the right professional audience at exactly the right moment in their decision-making process.',
  null,
  7,
  1,
  true
),
(
  'b1c2d3e4-0002-0001-0001-000000000002',
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Where do ads appear?',
  '## The short answer

Google Ads can appear in four main places: at the top of Google search results, on websites across the internet, on YouTube, and inside Gmail. Each placement works differently and serves a different purpose.

:::callout
**The key thing to understand:** Google Ads are not just search results. They are a network that reaches people across the entire internet — not just when they are actively searching.
:::

## The four places ads appear

:::placement-grid
### Google Search
icon: search
The results that appear at the top and bottom of a Google search page. Labelled "Sponsored." This is the most direct form — the person is actively searching for something.

### Display Network
icon: monitor
Banner ads that appear on millions of websites — news sites, blogs, industry publications. Google places them based on who is visiting and what they have searched for previously.

### YouTube
icon: video
The ads that play before or during videos, or appear alongside search results on YouTube. Skippable and non-skippable formats. Good for brand awareness.

### Gmail
icon: mail
Ads that appear at the top of the Gmail Promotions tab, styled to look like emails. Effective for reaching business email users.
:::

## Why this matters for All Things Media

When you are reviewing a campaign report or sitting in a briefing with an agency, you will hear these placements referenced. **Search ads** capture people who are already looking for what you offer. **Display ads** build visibility with people who are not actively searching but fit your audience profile.

The mix between search and display in a campaign budget tells you a lot about the strategy. Heavy on search means the focus is conversion. Heavy on display means the focus is awareness.

:::callout
**A question worth asking your agency:** "Which placements is our budget going toward, and why that mix for this campaign?"
:::',
  null,
  8,
  2,
  true
),
(
  'b1c2d3e4-0003-0001-0001-000000000003',
  'a1b2c3d4-0001-0001-0001-000000000001',
  'How are ads triggered?',
  '## Keywords: the foundation

Search ads are triggered by keywords. An advertiser chooses a list of words and phrases — when someone searches for those terms, the ad becomes eligible to appear.

The advertiser does not just choose keywords, though. They also choose **match types**, which control how closely a search has to match the keyword before the ad is eligible.

## Match types explained

**Broad match** — the most flexible. Google will show your ad for searches related to your keyword, even if the exact word is not used. "Data centre events" on broad match might trigger for "technology conferences UK."

**Phrase match** — your ad shows for searches that include your keyword phrase, with words potentially before or after it. "Data centre events" on phrase match would trigger for "best data centre events 2026" but not "events at data centres."

**Exact match** — your ad shows only when the search is very close to your exact keyword. Highest precision, lowest volume.

:::callout
**Why this matters:** An agency that runs campaigns on broad match without careful oversight can spend your budget on loosely related searches that never convert. Always ask what match types are being used.
:::

## The auction: who actually appears

When someone searches, an auction happens in milliseconds. Every advertiser whose keywords match the search enters the auction. The winner is not simply the highest bidder — Google uses a combination of:

- **Bid:** how much you are willing to pay per click
- **Quality Score:** how relevant your ad and landing page are to the search
- **Ad extensions:** additional information (phone number, sitelinks) that improve the ad

A highly relevant ad with a moderate bid can outrank a poorly relevant ad with a high bid. This is by design — Google wants ads to be useful, not just profitable.

## Negative keywords

As important as keywords are **negative keywords** — terms you explicitly exclude. If you are advertising an exhibition for industry professionals, you might add "free," "DIY," and "for beginners" as negative keywords to avoid paying for clicks from people who will never become exhibitors.',
  null,
  8,
  3,
  true
),
(
  'b1c2d3e4-0004-0001-0001-000000000004',
  'a1b2c3d4-0001-0001-0001-000000000001',
  'What do the different ad formats look like?',
  '## Format follows placement

Each placement type has its own ad format. The format is not just aesthetic — it determines what information you can include, how much space you have, and what action you are asking the person to take.

## Search ads

Text only. Structured into:
- **Headline** (up to 3, each up to 30 characters)
- **Description** (up to 2, each up to 90 characters)
- **Display URL** (the web address shown — can be edited to look cleaner)

Google assembles these elements in different combinations to find what performs best. The advertiser provides the components; Google runs the combinations.

The result looks almost identical to an organic search result, with the only distinguishing mark being a small "Sponsored" label.

## Display ads

Image-based. Come in multiple standard sizes (banner, rectangle, skyscraper). Can be:
- **Static** — a single designed image
- **Responsive** — you provide images and copy, Google creates combinations automatically

Display ads appear on websites that have agreed to show Google ads in exchange for a share of the revenue. The New York Times, The Guardian, specialist trade publications — they all participate.

## Video ads

YouTube ads, primarily. Formats include:
- **Skippable in-stream** — plays before or during a video, skippable after 5 seconds. You only pay if the person watches 30 seconds or interacts.
- **Non-skippable in-stream** — 15 seconds, must be watched. Higher cost, guaranteed view.
- **Bumper ads** — 6 seconds, non-skippable. Good for reinforcing a message.

## Performance Max

A newer campaign type that uses all placements simultaneously — search, display, YouTube, Gmail — managed by Google AI. Provides broad reach but less transparency about where your budget is going. Growing in use but requires trust in Google to make the right decisions.

:::callout
**The format question to ask:** "Are we using responsive search ads, and is Google being given enough headline and description variations to test?" Giving Google only one or two options limits what the algorithm can optimise toward.
:::',
  null,
  7,
  4,
  true
);

-- ─── SEED INTEL ARTICLES (sample set) ────────────────────────

insert into intel_articles (title, summary, source, source_url, vertical, is_featured, published_at) values
(
  'UK hyperscale data centre investment reaches record £4.2bn as AI infrastructure demand accelerates',
  'Microsoft and Google commitments are driving the majority of spend, with secondary markets outside London seeing significant greenfield development for the first time.',
  'Data Centre Dynamics',
  'https://www.datacenterdynamics.com/en/news/uk-hyperscale-investment-2026/',
  'data-centre',
  true,
  now() - interval '1 hour'
),
(
  'CEDIA Expo Europe confirms Manchester venue for 2026 — largest smart home event outside the US',
  'The move to Manchester signals growing confidence in the UK residential tech market and puts pressure on regional trade shows to differentiate their exhibitor proposition clearly.',
  'CE Pro Europe',
  'https://www.cepro.com/events/cedia-expo-europe-manchester-2026/',
  'competitor',
  false,
  now() - interval '3 hours'
),
(
  'Dolby Atmos installations up 34% in European cinemas as operators invest in premium formats',
  'Independent exhibitors are leading adoption, with premium large format screens now accounting for a disproportionate share of total box office revenue across the UK.',
  'Cinema Technology',
  'https://www.cinematechnology.com/dolby-atmos-europe-2026/',
  'cinema-av',
  false,
  now() - interval '5 hours'
),
(
  'ISE 2026 breaks exhibitor records with 1,400 confirmed brands across audio, video and control',
  'The Barcelona show continues to consolidate its position as the dominant European AV trade event, raising the stakes for regional shows to define their niche value clearly.',
  'AVTechnology Europe',
  'https://www.avtechnologyeurope.com/ise-2026-records/',
  'competitor',
  false,
  now() - interval '7 hours'
),
(
  'Matter protocol adoption hits tipping point as all major UK retailers now stock certified devices',
  'The interoperability standard is reshaping the smart home installer market, creating demand for professional integration training and certified installers across residential projects.',
  'Smart Home World',
  'https://www.smarthomeworld.co.uk/matter-protocol-uk-2026/',
  'smart-home',
  false,
  now() - interval '1 day'
),
(
  'Power constraints emerge as primary bottleneck for UK data centre expansion plans',
  'Grid connection delays are pushing average development timelines beyond four years, accelerating interest in modular and edge computing solutions from operators unable to secure large-site power.',
  'Data Centre Dynamics',
  'https://www.datacenterdynamics.com/en/news/uk-power-constraints-2026/',
  'data-centre',
  false,
  now() - interval '1 day'
);
```

---

## Supabase Functions — Streak Calculation

Create a Postgres function to handle streak logic server-side:

```sql
create or replace function update_streak(p_user_id uuid)
returns void as $$
declare
  v_last_activity date;
  v_current_streak int;
  v_longest_streak int;
  v_today date := current_date;
begin
  select last_activity, current_streak, longest_streak
  into v_last_activity, v_current_streak, v_longest_streak
  from streaks
  where user_id = p_user_id;

  if not found then
    -- First time: create streak row
    insert into streaks (user_id, current_streak, longest_streak, last_activity)
    values (p_user_id, 1, 1, v_today);
    return;
  end if;

  if v_last_activity = v_today then
    -- Already active today, no change needed
    return;
  elsif v_last_activity = v_today - 1 then
    -- Consecutive day: increment streak
    v_current_streak := v_current_streak + 1;
  else
    -- Streak broken: restart from 1
    v_current_streak := 1;
  end if;

  v_longest_streak := greatest(v_current_streak, v_longest_streak);

  update streaks
  set current_streak = v_current_streak,
      longest_streak = v_longest_streak,
      last_activity = v_today
  where user_id = p_user_id;
end;
$$ language plpgsql;
```

Call this function from the `/api/progress` route whenever a module is marked as complete:

```typescript
await supabase.rpc('update_streak', { p_user_id: userId })
```

---

## Notes
- Seed UUIDs are hardcoded for predictability during development — replace with `uuid_generate_v4()` in production seeding scripts
- The `content` field in `modules` is full markdown — update it in Supabase directly as new module content is written
- `audio_url` will be null for all modules at launch — populate as ElevenLabs audio files are produced and uploaded to Cloudinary or Vercel Blob
- The Supabase anon key is safe to expose in the client — RLS policies ensure users can only access their own data
- The service role key must never be exposed to the client — use only in server-side API routes and cron jobs
