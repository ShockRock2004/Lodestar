// AI review of the whole study system: Gemini first, Groq as the cross-provider
// fallback. Every number the report shows is computed locally and handed to the
// model as fact — the model supplies judgement, never arithmetic.
import { getStore, setStore } from './store.js'

export const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-3.5-flash', 'gemini-2.5-flash']
export const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']

const KEY_STORE = 'ai:keys'
const CACHE_STORE = 'ai:report'
const MODEL_STORE = 'ai:model' // last Gemini model that actually answered

// import.meta.env only exists under Vite; guard it so this module is also importable
// from a plain Node script (that is how the provider chain gets tested).
const env = (name) => {
  try { return (import.meta.env && import.meta.env[name]) || '' } catch (e) { return '' }
}

export const getKeys = () => {
  const saved = getStore(KEY_STORE, {})
  return {
    gemini: (saved.gemini || env('VITE_GEMINI_API_KEY') || '').trim(),
    groq: (saved.groq || env('VITE_GROQ_API_KEY') || '').trim(),
  }
}
export const setKeys = (next) => setStore(KEY_STORE, { ...getStore(KEY_STORE, {}), ...next })
export const hasAnyKey = () => { const k = getKeys(); return !!(k.gemini || k.groq) }

export const getCachedReport = () => getStore(CACHE_STORE, null)

// ---------------------------------------------------------------- deadline
export const PLACEMENT_ISO = '2026-12-01'
export function daysToPlacement(today = new Date()) {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [y, m, d] = PLACEMENT_ISO.split('-').map(Number)
  return Math.round((new Date(y, m - 1, d) - t) / 86400000)
}

// ---------------------------------------------------------------- prompt
const SCHEMA_TEXT = `{
  "headline": string (3-6 words, blunt, no punctuation at the end),
  "verdict": string (1-2 sentences of direct assessment),
  "readiness": integer 0-100 (honest placement readiness, not flattering),
  "trajectory": "ahead" | "on-track" | "slipping" | "critical",
  "lagging": [ { "area": string, "detail": string (one sentence, specific, cites a number), "severity": "critical"|"high"|"normal" } ]  (2 to 4 entries),
  "actions": [ { "do": string (imperative, concrete), "why": string (one short clause), "horizon": "today"|"this week"|"this month" } ]  (exactly 3),
  "blindspot": string (one sentence naming something the data shows they are ignoring),
  "reality_check": string (one blunt sentence tying today's pace to the placement date)
}`

const SYSTEM = `You are the performance reviewer inside Lodestar, a placement-prep tracker owned by a final-year IIT Madras student.

Your job is honest, specific, constructive criticism. Rules:
- Do NOT be encouraging by default. Do not congratulate effort. Do not use motivational filler.
- Lead with what is going wrong. If something is genuinely fine, say so in one clause and move on.
- Cite the actual numbers you were given. Never invent a number, date or track that is not in the data.
- Placement season starts 2026-12-01. Treat that as a hard deadline and measure everything against it.
- If a track is behind schedule, name it and say what that costs by December.
- Be terse. Every sentence must carry information. No preamble, no sign-off.
- You are given every track that is actually being studied. Do not ask about, infer, or
  penalise anything that is not listed — in particular, never mention a missing subject.
- A track marked NOT STARTED has a future start date. It is on plan, not behind. Never
  list it as slipping, never call its 0% a gap, and never tell them to start it early.
- Reply with JSON only, matching the schema exactly. No markdown fences.`

function userPrompt(ctx) {
  return `Today is ${ctx.today}. Placement season begins ${PLACEMENT_ISO} — ${ctx.daysLeft} days away.

OVERALL
- Combined completion across tracks: ${ctx.overall}%
- Current activity streak: ${ctx.streak} days
- Items completed in the last 7 days: ${ctx.week.total} (daily: ${ctx.week.raw.join(', ')})
- Today's targets: ${ctx.todayDone} of ${ctx.todayTotal} done

TRACKS
${ctx.tracks.map((t) => `- ${t.name}: ${t.pct == null ? 'n/a' : t.pct + '%'} complete, ${t.state}, pace: ${t.pace}${t.behind ? ` (BEHIND by ${t.behind} days)` : ''}`).join('\n')}

CHECKLISTS
- ${ctx.checklists.lists} checklists, ${ctx.checklists.active} still active
- ${ctx.checklists.openItems} objectives open, ${ctx.checklists.urgentOpen} of them marked urgent
- ${ctx.checklists.doneToday} objectives ticked off today
${ctx.checklistDetail.length ? ctx.checklistDetail.map((c) => `- "${c.title}" ${c.done}/${c.total} done${c.urgent ? `, ${c.urgent} urgent` : ''}${c.openTimed.length ? `, scheduled today: ${c.openTimed.join(', ')}` : ''}`).join('\n') : '- (no checklists created yet)'}

Return the JSON report now, following this schema:
${SCHEMA_TEXT}`
}

// ---------------------------------------------------------------- parsing
function extractJson(text) {
  if (!text) throw new Error('empty response')
  let s = String(text).trim()
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  const a = s.indexOf('{')
  const b = s.lastIndexOf('}')
  if (a === -1 || b === -1 || b < a) throw new Error('no JSON object in response')
  return JSON.parse(s.slice(a, b + 1))
}

const TRAJ = ['ahead', 'on-track', 'slipping', 'critical']
const SEV = ['critical', 'high', 'normal']
const str = (v, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

// Never let a malformed model reply reach the renderer.
function normalise(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const lagging = (Array.isArray(r.lagging) ? r.lagging : []).slice(0, 4)
    .map((x) => ({
      area: str(x && x.area, 60) || 'Unspecified',
      detail: str(x && x.detail),
      severity: SEV.includes(x && x.severity) ? x.severity : 'high',
    })).filter((x) => x.detail)
  const actions = (Array.isArray(r.actions) ? r.actions : []).slice(0, 4)
    .map((x) => ({
      do: str(x && x.do, 160),
      why: str(x && x.why, 160),
      horizon: ['today', 'this week', 'this month'].includes(x && x.horizon) ? x.horizon : 'this week',
    })).filter((x) => x.do)
  let readiness = Number(r.readiness)
  readiness = Number.isFinite(readiness) ? Math.max(0, Math.min(100, Math.round(readiness))) : null
  return {
    headline: str(r.headline, 60) || 'Progress review',
    verdict: str(r.verdict, 400),
    readiness,
    trajectory: TRAJ.includes(r.trajectory) ? r.trajectory : 'slipping',
    lagging, actions,
    blindspot: str(r.blindspot),
    reality_check: str(r.reality_check),
  }
}

// ---------------------------------------------------------------- providers
// `thinkingLevel: low` takes this call from ~20s to ~2s, which is the difference
// between the home card feeling live and feeling broken. Older models reject the
// field, so a 400 retries once without it rather than burning the whole model.
async function geminiFetch(key, model, ctx, signal, thinking) {
  const generationConfig = {
    temperature: 0.65,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',
  }
  if (thinking) generationConfig.thinkingConfig = { thinkingLevel: 'low' }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt(ctx) }] }],
        generationConfig,
      }),
    },
  )
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = (body && body.error && body.error.message) || `HTTP ${res.status}`
    const err = new Error(msg)
    err.status = res.status
    throw err
  }
  const cand = body && body.candidates && body.candidates[0]
  const parts = (cand && cand.content && cand.content.parts) || []
  const text = parts.map((p) => p.text || '').join('')
  if (!text) throw new Error(`no text in response (finish: ${cand && cand.finishReason})`)
  return extractJson(text)
}

async function callGemini(key, model, ctx, signal) {
  try {
    return await geminiFetch(key, model, ctx, signal, true)
  } catch (e) {
    if (e.status === 400) return geminiFetch(key, model, ctx, signal, false)
    throw e
  }
}

async function callGroq(key, model, ctx, signal) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.65,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userPrompt(ctx) },
      ],
    }),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = (body && body.error && body.error.message) || `HTTP ${res.status}`
    const err = new Error(msg)
    err.status = res.status
    throw err
  }
  const text = body && body.choices && body.choices[0] && body.choices[0].message && body.choices[0].message.content
  return extractJson(text)
}

// Gemini models in order (last known-good first), then Groq. Returns the report
// plus which provider produced it, and the list of attempts that failed.
export async function runAnalysis(ctx, { signal } = {}) {
  const keys = getKeys()
  const attempts = []

  if (keys.gemini) {
    const last = getStore(MODEL_STORE, null)
    const chain = last ? [last, ...GEMINI_MODELS.filter((m) => m !== last)] : GEMINI_MODELS
    for (const model of chain) {
      try {
        const report = normalise(await callGemini(keys.gemini, model, ctx, signal))
        setStore(MODEL_STORE, model)
        return { report, provider: 'Gemini', model, attempts }
      } catch (e) {
        if (e.name === 'AbortError') throw e
        attempts.push({ provider: 'Gemini', model, error: e.message })
      }
    }
  } else {
    attempts.push({ provider: 'Gemini', model: '-', error: 'no API key configured' })
  }

  if (keys.groq) {
    for (const model of GROQ_MODELS) {
      try {
        const report = normalise(await callGroq(keys.groq, model, ctx, signal))
        return { report, provider: 'Groq', model, attempts }
      } catch (e) {
        if (e.name === 'AbortError') throw e
        attempts.push({ provider: 'Groq', model, error: e.message })
      }
    }
  } else {
    attempts.push({ provider: 'Groq', model: '-', error: 'no API key configured' })
  }

  const err = new Error(attempts.length ? attempts[attempts.length - 1].error : 'no provider configured')
  err.attempts = attempts
  throw err
}

export function cacheReport(payload) {
  setStore(CACHE_STORE, { ...payload, at: Date.now() })
}
