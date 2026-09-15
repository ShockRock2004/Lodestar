// Day-by-day reading plans, generated from chapter page ranges.

// `perDay` is either a constant page count or an array of exact per-day sizes
// (used to redistribute a plan unevenly across a fixed number of days).
function buildDays(segments, perDay, groupName) {
  const flat = []
  segments.forEach((s) => { for (let p = s.from; p <= s.to; p++) flat.push({ p, t: s.title }) })
  const sizes = Array.isArray(perDay) ? perDay : null
  const days = []
  let i = 0, s = 0
  while (i < flat.length) {
    const size = sizes ? sizes[s++] : perDay
    const chunk = flat.slice(i, i + size)
    i += size
    const chapters = [...new Set(chunk.map((c) => c.t))]
    days.push({
      from: chunk[0].p,
      to: chunk[chunk.length - 1].p,
      chapters,
      group: groupName || chapters[0],
      count: chunk.length,
    })
  }
  return days
}

const numbered = (days) => days.map((d, i) => ({ ...d, n: i + 1 }))

const SD_VOL1 = [
  { title: 'Scale From Zero to Millions', from: 1, to: 33 },
  { title: 'Back-of-the-Envelope Estimation', from: 34, to: 41 },
  { title: 'A Framework for System Design Interviews', from: 42, to: 50 },
  { title: 'Design a Rate Limiter', from: 51, to: 70 },
  { title: 'Design Consistent Hashing', from: 71, to: 86 },
  { title: 'Design a Key-Value Store', from: 87, to: 109 },
  { title: 'Unique ID Generator', from: 110, to: 118 },
  { title: 'Design a URL Shortener', from: 119, to: 131 },
  { title: 'Design a Web Crawler', from: 132, to: 150 },
  { title: 'Design a Notification System', from: 151, to: 165 },
  { title: 'Design a News Feed System', from: 166, to: 177 },
  { title: 'Design a Chat System', from: 178, to: 199 },
  { title: 'Search Autocomplete System', from: 200, to: 219 },
  { title: 'Design YouTube', from: 220, to: 243 },
  { title: 'Design Google Drive', from: 244, to: 263 },
  { title: 'The Learning Continues', from: 264, to: 269 },
]
const SD_VOL2 = [
  { title: 'Proximity Service', from: 11, to: 45 },
  { title: 'Nearby Friends', from: 46, to: 70 },
  { title: 'Google Maps', from: 71, to: 107 },
  { title: 'Distributed Message Queue', from: 108, to: 145 },
  { title: 'Metrics Monitoring & Alerting', from: 146, to: 171 },
  { title: 'Ad Click Event Aggregation', from: 172, to: 206 },
  { title: 'Hotel Reservation System', from: 207, to: 236 },
  { title: 'Distributed Email Service', from: 237, to: 263 },
  { title: 'S3-like Object Storage', from: 264, to: 302 },
  { title: 'Real-time Gaming Leaderboard', from: 303, to: 329 },
  { title: 'Payment System', from: 330, to: 355 },
  { title: 'Digital Wallet', from: 356, to: 393 },
  { title: 'Stock Exchange', from: 394, to: 438 },
]
// A flat 10 pages/day across both volumes (the rate written on the targets board).
//
// Only Volume 1 is committed to a calendar window: day 1 (pp. 1-10) is Sep 11, 2026
// and day 27 (ending p. 269) is Oct 7 — comfortably inside the Oct 10 target. The
// 10-page chunking matches what was used before, so any existing checkmarks still
// line up with the same pages.
// Volume 2 is kept in the plan so its days stay visible and tickable, but it carries
// NO dates (see SD_DATED_DAYS in schedule.js): it is not part of the current plan, so
// it must never drag the pace figure. Pace measures Volume 1; the percentage still
// covers the whole book set, and the per-volume bars break it down.
const SD_PER_DAY = 10
const SD_VOL1_DAYS = buildDays(SD_VOL1, SD_PER_DAY, 'Volume 1')
const SD_VOL2_DAYS = buildDays(SD_VOL2, SD_PER_DAY, 'Volume 2')
export const SD_VOL1_TOTAL_DAYS = SD_VOL1_DAYS.length
const SD_DAYS = numbered([...SD_VOL1_DAYS, ...SD_VOL2_DAYS])

export const PLANS = {
  'system-design': { id: 'system-design', title: 'System Design', source: 'Alex Xu · Vol 1 + 2', perDay: SD_PER_DAY, days: SD_DAYS, total: SD_DAYS.length },
}

export function groupDays(days) {
  const groups = []
  const byName = {}
  days.forEach((d) => {
    if (!byName[d.group]) { byName[d.group] = { name: d.group, days: [] }; groups.push(byName[d.group]) }
    byName[d.group].days.push(d)
  })
  return groups
}
