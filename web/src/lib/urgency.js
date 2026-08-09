// Three urgency levels, shared by the checklist board, the board's urgent rail and
// the AI report. Each level carries a label and a bar count as well as a colour —
// colour alone must never be the only carrier of the meaning (WCAG 1.4.1), so every
// place that renders a level shows the bars or the word too.
export const URGENCY = {
  critical: { key: 'critical', label: 'Critical', short: 'CRIT', bars: 3, rank: 3, color: '#ff5252', dim: 'rgba(255,82,82,.14)', edge: 'rgba(255,82,82,.42)' },
  high: { key: 'high', label: 'High', short: 'HIGH', bars: 2, rank: 2, color: '#ff7d29', dim: 'rgba(255,125,41,.14)', edge: 'rgba(255,125,41,.42)' },
  normal: { key: 'normal', label: 'Normal', short: 'NORM', bars: 1, rank: 1, color: '#9a9a9a', dim: 'rgba(255,255,255,.06)', edge: 'rgba(255,255,255,.22)' },
}

export const URGENCY_ORDER = ['critical', 'high', 'normal']
export const urgencyOf = (key) => URGENCY[key] || URGENCY.normal
