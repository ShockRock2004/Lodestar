// Day-by-day reading plans, generated from chapter page ranges.

function buildDays(segments, perDay, groupName) {
  const flat = []
  segments.forEach((s) => { for (let p = s.from; p <= s.to; p++) flat.push({ p, t: s.title }) })
  const days = []
  for (let i = 0; i < flat.length; i += perDay) {
    const chunk = flat.slice(i, i + perDay)
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
const SD_DAYS = numbered([
  ...buildDays(SD_VOL1, 10, 'Volume 1'),
  ...buildDays(SD_VOL2, 10, 'Volume 2'),
])

const MATH_SEGS = [
  { title: 'Ch 4 · Matrix Decompositions', from: 98, to: 138 },
  { title: 'Ch 5 · Vector Calculus', from: 139, to: 171 },
  { title: 'Ch 6 · Probability & Distributions', from: 172, to: 224 },
  { title: 'Ch 7 · Continuous Optimization', from: 225, to: 248 },
  { title: 'Ch 8 · When Models Meet Data', from: 251, to: 288 },
  { title: 'Ch 9 · Linear Regression', from: 289, to: 316 },
  { title: 'Ch 10 · Dimensionality Reduction (PCA)', from: 317, to: 347 },
  { title: 'Ch 11 · Density Estimation (GMM)', from: 348, to: 369 },
  { title: 'Ch 12 · Classification (SVM)', from: 370, to: 391 },
]
const MATH_DAYS = numbered(buildDays(MATH_SEGS, 6))

const HANDSON_SEGS = [
  { title: 'Ch 2 · End-to-End ML Project', from: 39, to: 102 },
  { title: 'Ch 3 · Classification', from: 103, to: 130 },
  { title: 'Ch 4 · Training Models', from: 131, to: 174 },
  { title: 'Ch 7 · Ensemble Learning & Random Forests', from: 211, to: 236 },
  { title: 'Ch 10 · Intro to ANN with Keras', from: 299, to: 356 },
  { title: 'Ch 11 · Training Deep Neural Networks', from: 357, to: 402 },
  { title: 'Ch 16 · NLP with RNNs & Attention', from: 577, to: 634 },
  { title: 'Ch 19 · Training & Deploying TF Models', from: 721, to: 778 },
]
const HANDSON_DAYS = numbered(buildDays(HANDSON_SEGS, 6))

export const PLANS = {
  'system-design': { id: 'system-design', title: 'System Design', source: 'Alex Xu · Vol 1 + 2', perDay: 10, days: SD_DAYS, total: SD_DAYS.length },
  math: { id: 'math', title: 'Mathematics for ML', source: 'Deisenroth · Ch 4-12', perDay: 6, days: MATH_DAYS, total: MATH_DAYS.length },
  handson: { id: 'handson', title: 'Hands-On ML', source: 'Geron · 8 chapters', perDay: 6, days: HANDSON_DAYS, total: HANDSON_DAYS.length },
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
