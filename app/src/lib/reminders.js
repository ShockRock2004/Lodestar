// Contest reminder helpers: live countdown text, a Google Calendar link, and an .ics blob
// whose VALARM fires "remind before". The phone-app counterpart will read starts_at /
// remind_before_mins from Supabase and schedule native notifications; these give the web
// user working reminders today.
export const REMIND_OPTIONS = [
  { v: 10, l: '10 min before' }, { v: 30, l: '30 min before' }, { v: 60, l: '1 hour before' },
  { v: 180, l: '3 hours before' }, { v: 1440, l: '1 day before' },
]
const pad = (n) => String(n).padStart(2, '0')
const toUtcStamp = (d) =>
  d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
  pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z'

export function countdown(startsAt, now = Date.now()) {
  const t = new Date(startsAt).getTime()
  if (isNaN(t)) return ''
  const past = t - now < 0
  let ms = Math.abs(t - now)
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`
  return past ? `${s} ago` : `in ${s}`
}

export function googleCalUrl(r) {
  const start = new Date(r.starts_at)
  const end = new Date(start.getTime() + 2 * 3600000)
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${r.platform}: ${r.name || 'Contest'}`,
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
    details: 'Contest reminder from Lodestar',
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export function icsText(r) {
  const start = new Date(r.starts_at)
  const end = new Date(start.getTime() + 2 * 3600000)
  const mins = r.remind_before_mins || 60
  const id = (r.id || Math.random().toString(16).slice(2)) + '@studyos'
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lodestar//Contest//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${id}`, `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`, `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${r.platform}: ${(r.name || 'Contest').replace(/\n/g, ' ')}`,
    'BEGIN:VALARM', `TRIGGER:-PT${mins}M`, 'ACTION:DISPLAY', 'DESCRIPTION:Contest reminder',
    'END:VALARM', 'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(r) {
  const blob = new Blob([icsText(r)], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(r.platform || 'contest').toLowerCase()}-${(r.name || 'reminder').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
