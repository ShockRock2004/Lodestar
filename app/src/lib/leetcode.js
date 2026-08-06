// Client helper for LeetCode metadata.
// parseSlug pulls the problem slug from a pasted URL (or accepts a bare slug);
// fetchMeta calls our /api/leetcode proxy and degrades gracefully when offline or the
// backend isn't deployed (title derived from slug, empty topics, offline flag set).
export function parseSlug(input) {
  const v = (input || '').trim()
  if (!v) return ''
  const m = v.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i)
  if (m) return m[1].toLowerCase()
  if (/^[a-z0-9-]+$/i.test(v)) return v.toLowerCase() // bare slug e.g. "two-sum"
  return ''
}

export function titleFromSlug(slug) {
  return (slug || '')
    .split('-')
    .filter(Boolean)
    .map((wd) => wd[0].toUpperCase() + wd.slice(1))
    .join(' ')
}

export function canonicalUrl(slug) {
  return slug ? `https://leetcode.com/problems/${slug}/` : ''
}

export async function fetchMeta(slug) {
  const s = (slug || '').trim()
  if (!s) return null
  try {
    const r = await fetch(`/api/leetcode?slug=${encodeURIComponent(s)}`)
    if (!r.ok) throw new Error('bad status')
    const j = await r.json()
    if (!j || !j.title) throw new Error('no data')
    return {
      title: j.title,
      slug: j.titleSlug || s,
      difficulty: j.difficulty || '',
      topics: Array.isArray(j.topics) ? j.topics : [],
    }
  } catch (e) {
    return { title: titleFromSlug(s), slug: s, difficulty: '', topics: [], offline: true }
  }
}
