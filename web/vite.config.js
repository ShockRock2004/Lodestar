import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

const allowedHosts = [ '.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io', '.ngrok.app',
  '.trycloudflare.com', '.loca.lt', 'localhost' ]

// Dev-only proxy that mirrors the production /api/leetcode serverless function, so the
// client calls one identical path in dev and prod. Fetches LeetCode's public GraphQL API
// server-side to sidestep browser CORS.
function leetcodeDevProxy() {
  return {
    name: 'leetcode-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/leetcode', async (req, res) => {
        const send = (code, obj) => {
          res.statusCode = code
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(obj))
        }
        try {
          const u = new URL(req.originalUrl || req.url, 'http://localhost')
          const slug = (u.searchParams.get('slug') || '').trim()
          if (!slug) return send(400, { error: 'missing slug' })
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
          if (!q) return send(404, { error: 'not found' })
          send(200, { title: q.title, titleSlug: q.titleSlug, difficulty: q.difficulty, topics: (q.topicTags || []).map((t) => t.name) })
        } catch (e) {
          send(502, { error: 'proxy failed' })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), leetcodeDevProxy()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, open: false, host: true, allowedHosts },
  preview: { port: 4173, host: true, allowedHosts },
})
