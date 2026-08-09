import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from './ui/card.jsx'
import { IconSpark, IconRefresh, IconAlert, IconChevron } from './icons.jsx'
import { runAnalysis, getCachedReport, cacheReport, hasAnyKey, PLACEMENT_ISO } from '../lib/ai.js'
import { buildAiContext, localStats } from '../lib/aicontext.js'
import { cloudReady } from '../lib/cloudsync.js'
import { urgencyOf } from '../lib/urgency.js'

const TRAJ = {
  ahead: { label: 'Ahead of pace', color: '#2FB893' },
  'on-track': { label: 'On track', color: '#d4d4d4' },
  slipping: { label: 'Slipping', color: '#ff7d29' },
  critical: { label: 'Critical', color: '#ff5252' },
}

function Dial({ pct, tone }) {
  const v = Math.max(0, Math.min(100, pct == null ? 0 : pct))
  const size = 122, stroke = 8, r = (size - stroke) / 2
  // three-quarter arc, opening at the bottom
  const circ = 2 * Math.PI * r
  const span = circ * 0.75
  return (
    <div className="ai-dial" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(135deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)"
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${span} ${circ}`} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${span * (v / 100)} ${circ}`}
          style={{ transition: 'stroke-dasharray .8s cubic-bezier(.22,1,.36,1)' }} />
      </svg>
      <div className="ai-dial-mid">
        <div className="ai-dial-num" style={{ color: tone }}>{pct == null ? '—' : v}</div>
        <div className="ai-dial-cap">readiness</div>
      </div>
    </div>
  )
}

function Bars({ level }) {
  const u = urgencyOf(level)
  return (
    <span className="ai-bars" title={u.label} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <i key={i} style={{ background: i < u.bars ? u.color : 'rgba(255,255,255,.14)' }} />
      ))}
    </span>
  )
}

function Skeleton() {
  return (
    <div className="ai-skel" aria-hidden="true">
      <span className="ai-skel-line" style={{ width: '52%', height: 26 }} />
      <span className="ai-skel-line" style={{ width: '88%' }} />
      <span className="ai-skel-line" style={{ width: '74%' }} />
      <div className="ai-skel-grid">
        <span className="ai-skel-line" style={{ height: 58 }} />
        <span className="ai-skel-line" style={{ height: 58 }} />
        <span className="ai-skel-line" style={{ height: 58 }} />
      </div>
      <span className="ai-skel-line" style={{ width: '64%' }} />
      <span className="ai-skel-line" style={{ width: '80%' }} />
    </div>
  )
}

export default function AiPanel() {
  const cached = getCachedReport()
  const [report, setReport] = useState(cached ? cached.report : null)
  const [meta, setMeta] = useState(cached ? { provider: cached.provider, model: cached.model, at: cached.at } : null)
  const [stats, setStats] = useState(() => localStats(buildAiContext()))
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const abort = useRef(null)

  const run = useCallback(async () => {
    if (abort.current) abort.current.abort()
    const ac = new AbortController()
    abort.current = ac
    setLoading(true)
    setErr(null)
    try {
      // Analyse the same numbers the page renders: wait for the cloud pull to land
      // first, but never hang on it if the network is slow.
      await Promise.race([cloudReady, new Promise((r) => setTimeout(r, 6000))])
      if (ac.signal.aborted) return
      const ctx = buildAiContext()
      setStats(localStats(ctx))
      const out = await runAnalysis(ctx, { signal: ac.signal })
      if (ac.signal.aborted) return
      setReport(out.report)
      setMeta({ provider: out.provider, model: out.model, at: Date.now() })
      cacheReport({ report: out.report, provider: out.provider, model: out.model })
    } catch (e) {
      if (e.name === 'AbortError') return
      setErr(e.message || 'Analysis failed')
    } finally {
      if (!ac.signal.aborted) setLoading(false)
    }
  }, [])

  // Re-analyses on every mount, i.e. every page load / refresh, while the cached
  // report stays on screen so the panel is never blank (stale-while-revalidate).
  useEffect(() => {
    run()
    return () => { if (abort.current) abort.current.abort() }
  }, [run])

  const traj = report ? (TRAJ[report.trajectory] || TRAJ.slipping) : TRAJ.slipping
  const noKeys = !hasAnyKey()

  return (
    <Card variant="soft" className="cg-w ai-panel">
      <div className="ai-head">
        <span className="ai-badge"><IconSpark /></span>
        <div className="ai-head-tx">
          <div className="ai-eye">AI review</div>
          <div className="ai-head-sub">
            {loading ? 'Analysing your whole system…'
              : meta ? `${meta.provider} · ${meta.model}`
                : 'Not yet run'}
          </div>
        </div>
        <button type="button" className={'ai-refresh' + (loading ? ' is-busy' : '')} onClick={run}
          disabled={loading} aria-label="Re-run analysis" title="Re-run analysis">
          <IconRefresh />
        </button>
      </div>

      {/* deterministic figures — computed locally, never from the model */}
      <div className="ai-stats">
        <div className="ai-stat"><b>{stats.daysLeft}</b><span>days to Dec 1</span></div>
        <div className="ai-stat"><b>{stats.overall}%</b><span>overall</span></div>
        <div className="ai-stat"><b>{stats.streak}</b><span>day streak</span></div>
        <div className="ai-stat"><b>{stats.week}</b><span>done this week</span></div>
        <div className="ai-stat">
          <b style={{ color: stats.behindCount ? '#ff5252' : '#d4d4d4' }}>{stats.behindCount}</b>
          <span>tracks behind</span>
        </div>
        <div className="ai-stat"><b>{stats.openObjectives}</b><span>open objectives</span></div>
      </div>

      {!report && loading && <Skeleton />}

      {!report && !loading && err && (
        <div className="ai-error">
          <span className="ai-error-ico"><IconAlert /></span>
          <div>
            <div className="ai-error-t">{noKeys ? 'No API key configured' : 'Analysis unavailable'}</div>
            <div className="ai-error-d">
              {noKeys
                ? 'Add a Gemini or Groq key to VITE_GEMINI_API_KEY / VITE_GROQ_API_KEY in web/.env.local, then reload.'
                : err}
            </div>
            <button type="button" className="ai-retry" onClick={run}>Try again</button>
          </div>
        </div>
      )}

      {report && (
        <div className={'ai-body' + (loading ? ' is-stale' : '')}>
          <div className="ai-main">
            <h3 className="ai-headline cg-chrome">{report.headline}</h3>
            <p className="ai-verdict">{report.verdict}</p>

            <div className="ai-cols">
              <div className="ai-col">
                <div className="ai-sec">What&rsquo;s slipping</div>
                <ul className="ai-lag">
                  {report.lagging.map((l, i) => (
                    <li key={i}>
                      <span className="ai-lag-top">
                        <Bars level={l.severity} />
                        <span className="ai-lag-area">{l.area}</span>
                        <span className="ai-lag-sev" style={{ color: urgencyOf(l.severity).color }}>
                          {urgencyOf(l.severity).label}
                        </span>
                      </span>
                      <span className="ai-lag-detail">{l.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ai-col">
                <div className="ai-sec">Do this next</div>
                <ol className="ai-act">
                  {report.actions.map((a, i) => (
                    <li key={i}>
                      <span className="ai-act-n">{i + 1}</span>
                      <span className="ai-act-tx">
                        <span className="ai-act-do">{a.do}</span>
                        <span className="ai-act-why">{a.why}</span>
                      </span>
                      <span className="ai-act-when">{a.horizon}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="ai-notes">
              {report.blindspot && (
                <div className="ai-note">
                  <span className="ai-note-k">Blind spot</span>
                  <span className="ai-note-v">{report.blindspot}</span>
                </div>
              )}
              {report.reality_check && (
                <div className="ai-note is-hard">
                  <span className="ai-note-k">Reality check</span>
                  <span className="ai-note-v">{report.reality_check}</span>
                </div>
              )}
            </div>
          </div>

          <aside className="ai-rail">
            <Dial pct={report.readiness} tone={traj.color} />
            <span className="ai-traj" style={{ color: traj.color, borderColor: traj.color + '55', background: traj.color + '14' }}>
              {traj.label}
            </span>
            <div className="ai-count">
              <div className="ai-count-n">{stats.daysLeft}</div>
              <div className="ai-count-l">days until<br />{PLACEMENT_ISO}</div>
            </div>
            {stats.worstBehind && (
              <div className="ai-worst">
                <span className="ai-worst-k">Biggest gap</span>
                <span className="ai-worst-v">{stats.worstBehind.name}</span>
                <span className="ai-worst-d">{stats.worstBehind.behind}d behind</span>
              </div>
            )}
            {err && <div className="ai-stale-note">Showing last report — {err}</div>}
          </aside>
        </div>
      )}

      {report && (
        <Link className="ai-foot" to="/checklist">
          Plan this in a checklist <IconChevron />
        </Link>
      )}
    </Card>
  )
}
