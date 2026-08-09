// Priority lives on the individual objective, not on the checklist, and there are
// only two levels — an objective is either urgent or it is not. Each level carries a
// word as well as a hue, so the level never depends on colour alone (WCAG 1.4.1).
export const URGENCY = {
  urgent: { key: 'urgent', label: 'Urgent', short: 'URGENT', rank: 2, color: '#ff5252', dim: 'rgba(255,82,82,.14)', edge: 'rgba(255,82,82,.42)' },
  normal: { key: 'normal', label: 'Normal', rank: 1, color: '#9a9a9a', dim: 'rgba(255,255,255,.06)', edge: 'rgba(255,255,255,.22)' },
}

export const URGENCY_ORDER = ['urgent', 'normal']

// Accepts a boolean, or any of the retired three-level keys, so checklists written
// before priority moved onto the item still resolve.
export function urgencyOf(v) {
  if (v === true || v === 'urgent' || v === 'critical' || v === 'high') return URGENCY.urgent
  return URGENCY.normal
}

export const isUrgent = (item) => !!(item && item.urgent)
