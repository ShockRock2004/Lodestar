// Parses a leading time expression off an objective line, so typing
//   "09:00 - 10:30 Revise DP"  ->  a timed objective
//   "Revise DP"                ->  a plain text objective
// Deliberately broader than the strict "00:00 - 11:59" shape: 12-hour clocks,
// bare start times, and several dash/`to` separators all resolve to the same
// { start, end, text } record, so the user never has to remember one syntax.

const HHMM = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/i

// "9", "9:30", "09:30", "9am", "9:30 pm" -> minutes since midnight (or null)
function readClock(str) {
  const m = HHMM.exec(str)
  if (!m) return null
  let h = Number(m[1])
  const min = m[2] == null ? 0 : Number(m[2])
  const mer = m[3] ? m[3][0].toLowerCase() : null
  // A bare 1-2 digit number with no ":" and no am/pm is a quantity, not a clock
  // ("3 mock interviews" must stay plain text).
  if (m[2] == null && !mer) return null
  if (min > 59) return null
  if (mer) {
    if (h < 1 || h > 12) return null
    if (mer === 'a') h = h === 12 ? 0 : h
    else h = h === 12 ? 12 : h + 12
  } else if (h > 23) return null
  return { mins: h * 60 + min, len: m[0].length }
}

const SEP = /^\s*(?:-|–|—|to|until|till|->|→)\s*/i

// Wraps past midnight so a range that crosses over reads "23:00 – 01:00", not "25:00".
export const toHHMM = (mins) => {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

// Human label for a range: "09:00 – 10:30", or "09:00" for a single point.
export const fmtRange = (start, end) => (end == null ? toHHMM(start) : `${toHHMM(start)} – ${toHHMM(end)}`)

export function parseObjective(input) {
  const raw = String(input == null ? '' : input).trim()
  if (!raw) return null

  const a = readClock(raw)
  if (!a) return { text: raw, start: null, end: null }

  let rest = raw.slice(a.len)
  let end = null

  const sep = SEP.exec(rest)
  if (sep) {
    const b = readClock(rest.slice(sep[0].length))
    if (b) {
      end = b.mins
      rest = rest.slice(sep[0].length + b.len)
    }
  }

  // Drop a separator that only divides the time from its label ("09:00 — Revise DP").
  const text = rest.replace(/^\s*[-–—:·|]\s*/, '').trim()

  // An end before the start reads as crossing midnight ("23:00 - 01:00").
  if (end != null && end <= a.mins) end += 1440

  return { text: text || fmtRange(a.mins, end), start: a.mins, end, timed: true }
}

// Minutes since midnight, right now — used to mark an objective live/overdue.
export const nowMins = (d = new Date()) => d.getHours() * 60 + d.getMinutes()

// 'now' while the clock sits inside the range, 'past' once it has gone by,
// 'soon' within the next 90 minutes, otherwise 'later'.
export function timeState(item, now = nowMins()) {
  if (item.start == null) return null
  const end = item.end == null ? item.start : item.end
  if (now >= item.start && now <= end) return 'now'
  if (now > end) return 'past'
  return item.start - now <= 90 ? 'soon' : 'later'
}
