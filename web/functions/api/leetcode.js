// Cloudflare Pages Function — GET /api/leetcode?slug=two-sum
// Deploy note documents the Netlify/Vercel equivalents. Stateless, cacheable proxy that
// fetches LeetCode's public GraphQL API server-side (avoids browser CORS).
export async function onRequest(context) {
  const url = new URL(context.request.url)
  const slug = (url.searchParams.get('slug') || '').trim()
  const json = (code, obj) =>
    new Response(JSON.stringify(obj), {
      status: code,
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=86400' },
    })
  if (!slug) return json(400, { error: 'missing slug' })
  try {
    const r = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json', referer: 'https://leetcode.com', 'user-agent': 'Mozilla/5.0' },
      body: JSON.stringify({
        query: 'query q($s:String!){question(titleSlug:$s){title titleSlug difficulty topicTags{name}}}',
        variables: { s: slug },
      }),
    })
    const j = await r.json()
    const q = j && j.data && j.data.question
    if (!q) return json(404, { error: 'not found' })
    return json(200, { title: q.title, titleSlug: q.titleSlug, difficulty: q.difficulty, topics: (q.topicTags || []).map((t) => t.name) })
  } catch (e) {
    return json(502, { error: 'proxy failed' })
  }
}
