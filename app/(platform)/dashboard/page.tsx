import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import SignalRing from '@/components/shared/SignalRing'
import { VERTICAL_COLOURS } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

type Course = { id: string; title: string; description: string | null }
type Module = {
  id: string
  title: string
  duration: string | null
  track_order: number | null
  made_live_at: string | null
}
type Progress = { module_id: string; user_id: string; completed_at: string | null }
type Streak = { user_id: string; current_streak: number; last_activity: string | null }
type Member = { id: string; first_name: string | null; last_name: string | null; role: string | null }
type Intel = {
  id: string
  source: string | null
  vertical: keyof typeof VERTICAL_COLOURS
  headline: string
  summary: string | null
  published_at: string | null
  url: string | null
}

const placeholderComingSoon = [
  { id: '01', title: 'Social Strategy Masterclass', track_order: 1 },
  { id: '02', title: 'Attribution & Measurement', track_order: 2 },
  { id: '03', title: 'Creative Operations', track_order: 3 },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(dateValue?: string | null) {
  if (!dateValue) return 'Just now'
  const diff = Date.now() - new Date(dateValue).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function weekLabel() {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
}

export default async function DashboardPage() {
  const user = await currentUser()
  const userId = user?.id ?? 'guest-user'
  const firstName = user?.firstName ?? 'Member'
  const role = (user?.publicMetadata?.role as string | undefined) ?? 'Member'

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [
    activeCourseRes,
    modulesRes,
    progressRes,
    streakRes,
    latestModuleRes,
    comingSoonRes,
    intelRes,
    usersRes,
    allProgressRes,
    allStreaksRes,
  ] = await Promise.all([
    supabase.from('courses').select('id,title,description').eq('is_live', true).order('track_order', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('modules').select('id,title,duration,track_order,made_live_at,course_id').eq('is_live', true).order('track_order', { ascending: true }),
    supabase.from('progress').select('module_id,user_id,completed_at').eq('user_id', userId),
    supabase.from('streaks').select('user_id,current_streak,last_activity').eq('user_id', userId).maybeSingle(),
    supabase.from('modules').select('id,title,made_live_at').eq('is_live', true).gte('made_live_at', sevenDaysAgo.toISOString()).order('made_live_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('courses').select('id,title,track_order').eq('coming_soon', true).order('track_order', { ascending: true }).limit(3),
    supabase.from('intel_articles').select('id,source,vertical,headline,summary,published_at,url').order('published_at', { ascending: false }).limit(3),
    supabase.from('users').select('id,first_name,last_name,role'),
    supabase.from('progress').select('module_id,user_id,completed_at'),
    supabase.from('streaks').select('user_id,current_streak,last_activity'),
  ])

  const activeCourse = (activeCourseRes.data as Course | null) ?? null
  const allLiveModules = (modulesRes.data as (Module & { course_id: string })[] | null) ?? []
  const modules = activeCourse ? allLiveModules.filter((m) => m.course_id === activeCourse.id) : []
  const userProgress = (progressRes.data as Progress[] | null) ?? []
  const completedModuleIds = new Set(userProgress.map((entry) => entry.module_id))

  const completedTodayCount = userProgress.filter((entry) => entry.completed_at && new Date(entry.completed_at) >= todayStart).length
  const signalPercent = Math.min((completedTodayCount / 1) * 100, 100)

  const completedCount = modules.filter((module) => completedModuleIds.has(module.id)).length
  const totalCount = modules.length
  const coursePercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const nextModule = modules.find((module) => !completedModuleIds.has(module.id))
  const streak = (streakRes.data as Streak | null)?.current_streak ?? 0

  const allProgress = (allProgressRes.data as Progress[] | null) ?? []
  const allStreaks = (allStreaksRes.data as Streak[] | null) ?? []
  const users = (usersRes.data as Member[] | null) ?? []

  const completionByUser = allProgress.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.user_id] = (acc[entry.user_id] ?? 0) + 1
    return acc
  }, {})

  const leaderboard = users
    .map((member) => {
      const memberStreak = allStreaks.find((row) => row.user_id === member.id)
      return {
        id: member.id,
        name: [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Member',
        role: member.role || 'Member',
        modulesDone: completionByUser[member.id] ?? 0,
        streak: memberStreak?.current_streak ?? 0,
        hot: memberStreak?.last_activity ? new Date(memberStreak.last_activity).toDateString() === new Date().toDateString() : false,
      }
    })
    .sort((a, b) => b.modulesDone - a.modulesDone || b.streak - a.streak)

  const yourRank = Math.max(leaderboard.findIndex((row) => row.id === userId) + 1, 1)
  const recentModule = latestModuleRes.data as { id: string; title: string } | null
  const comingSoon = (comingSoonRes.data as { id: string; title: string; track_order: number | null }[] | null) ?? []
  const intel = (intelRes.data as Intel[] | null) ?? []

  return (
    <div className="dashboard-page">
      <section className="welcome-hero fade-up fade-delay-0">
        <div>
          <p className="welcome-greeting">{getGreeting()}</p>
          <h1 className="welcome-name">{firstName}</h1>
          <p className="welcome-role"><span className="role-dot" />{role}</p>
        </div>
        <SignalRing value={signalPercent} />
      </section>

      <section className="stat-strip fade-up fade-delay-1">
        <article className="stat-card"><p className="stat-value amber">{completedCount}</p><p className="stat-key">Modules Done</p></article>
        <article className="stat-card"><p className="stat-value">{streak}</p><p className="stat-key">Day Streak</p></article>
        <article className="stat-card"><p className="stat-value">#{yourRank}</p><p className="stat-key">Team Ranking</p></article>
      </section>

      {recentModule ? (
        <Link href={`/module/${recentModule.id}`} className="notif-banner fade-up fade-delay-2">
          <span className="notif-pulse" />
          <div className="notif-content">
            <p className="notif-eyebrow">New this week</p>
            <p className="notif-text"><strong>{recentModule.title}</strong> has just been added to your course</p>
          </div>
          <span className="notif-arrow">View →</span>
        </Link>
      ) : null}

      <section className="course-card fade-up fade-delay-3">
        <div className="course-header">
          <p className="course-eyebrow">Active Course</p>
          <h2 className="course-title">{activeCourse?.title ?? 'No live course yet'}</h2>
          <p className="course-desc">{activeCourse?.description ?? 'A new learning track will appear here as soon as it goes live.'}</p>
        </div>
        <div className="course-footer">
          <div className="progress-wrap">
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${coursePercent}%` }} /></div>
            <p className="progress-label">{completedCount} of {totalCount} modules complete · {coursePercent}%</p>
          </div>
          {nextModule ? (
            <Link href={`/module/${nextModule.id}`} className="resume-btn">Continue →</Link>
          ) : (
            <button type="button" className="resume-btn resume-btn-disabled" disabled>Course Complete ✓</button>
          )}
        </div>
      </section>

      <section className="fade-up fade-delay-4">
        <div className="section-head"><h3 className="section-title">Modules</h3><p className="section-meta">{totalCount} total</p></div>
        <div className="module-list">
          {modules.length === 0 ? <div className="module-row locked"><div className="module-info"><p className="module-name">Modules will appear here when the course goes live.</p></div></div> : null}
          {modules.map((module, index) => {
            const previousComplete = index === 0 || completedModuleIds.has(modules[index - 1]?.id)
            const isComplete = completedModuleIds.has(module.id)
            const isUnlocked = index === 0 || previousComplete
            const state = isComplete ? 'completed' : isUnlocked ? 'available' : 'locked'

            return (
              <Link
                key={module.id}
                href={isUnlocked ? `/module/${module.id}` : '#'}
                className={`module-row ${state === 'completed' ? 'completed' : ''} ${state === 'locked' ? 'locked' : ''}`}
                aria-disabled={!isUnlocked}
              >
                <span className="module-num">{String(index + 1).padStart(2, '0')}</span>
                <span className="module-icon">{state === 'completed' ? '✓' : state === 'available' ? '▶' : '🔒'}</span>
                <div className="module-info">
                  <p className="module-name">{module.title}</p>
                  <p className="module-time">{module.duration ?? '10 min'} lesson</p>
                </div>
                <span className={`module-badge ${state === 'completed' ? 'done' : state === 'available' ? 'next' : 'locked'}`}>
                  {state === 'completed' ? 'Complete' : state === 'available' ? 'Start' : 'Locked'}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="fade-up fade-delay-5">
        <div className="section-head"><h3 className="section-title">Coming Soon</h3></div>
        <div className="coming-grid">
          {(comingSoon.length ? comingSoon : placeholderComingSoon).slice(0, 3).map((course, index) => (
            <article key={course.id} className="coming-card">
              <p className="coming-label">Course {String(course.track_order ?? index + 1).padStart(2, '0')}</p>
              <h4 className="coming-name">{course.title}</h4>
              <p className="coming-pill"><span className="coming-pill-dot" />Opening Soon</p>
            </article>
          ))}
        </div>
      </section>

      <section className="intel-section fade-up fade-delay-6">
        <div className="intel-header">
          <div className="intel-header-left"><h3 className="section-title">Market Intelligence</h3><p className="section-meta">Updated hourly</p></div>
          <Link className="intel-view-all" href="/intel">View all →</Link>
        </div>
        <div className="intel-feed">
          {(intel.length ? intel : [{ id: 'placeholder', source: 'ATM Desk', vertical: 'competitor' as const, headline: 'No articles published yet', summary: 'Fresh intelligence appears here once the feed updates.', published_at: null, url: null }]).map((article) => {
            const theme = VERTICAL_COLOURS[article.vertical] ?? VERTICAL_COLOURS.competitor
            return (
              <a key={article.id} href={article.url ?? '#'} className="intel-item" target="_blank" rel="noreferrer">
                <span className="intel-accent" style={{ background: theme.bar }} />
                <div className="intel-content">
                  <div className="intel-source-row">
                    <span className="intel-source">{article.source ?? 'Market Watch'}</span>
                    <span className="intel-category" style={{ color: theme.pill, background: theme.bg, borderColor: theme.border }}>{theme.label}</span>
                  </div>
                  <p className="intel-headline">{article.headline}</p>
                  <p className="intel-summary">{article.summary ?? 'Summary pending.'}</p>
                </div>
                <div className="intel-meta"><p className="intel-time">{timeAgo(article.published_at)}</p><span className="intel-arrow">→</span></div>
              </a>
            )
          })}
        </div>
      </section>

      <section className="leaderboard fade-up fade-delay-6">
        <div className="lb-top"><h3 className="lb-title">Team Leaderboard</h3><p className="lb-period">{weekLabel()}</p></div>
        {(leaderboard.length ? leaderboard : [{ id: userId, name: firstName, role, modulesDone: completedCount, streak, hot: true }]).map((member, index) => (
          <div key={member.id} className={`lb-row ${member.id === userId ? 'you' : ''}`}>
            <p className="rank">#{index + 1}</p>
            <div className="lb-member">
              <p className="lb-name">{member.name}{member.id === userId ? <span className="you-pill">You</span> : null}</p>
              <p className="lb-role">{member.role}</p>
            </div>
            <p className="lb-modules">{member.modulesDone} modules</p>
            <p className={`lb-streak ${member.hot ? '' : 'cold'}`}>{member.hot ? `🔥 ${member.streak}` : `— ${member.streak}`}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
