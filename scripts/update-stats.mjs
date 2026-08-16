// Auto-update the dynamic sections of the profile README (tw93-style):
// - the stats line (followers / total stars / forks)
// - the latest-releases list (dsh-tool-git)
// Runs on a schedule via .github/workflows/update-stats.yml. Zero dependencies.
const USER = 'lxj808624'
const FEATURED_REPOS = ['dsh-tool-git']
const BASE = 'https://api.github.com'
const README = new URL('../README.md', import.meta.url)

const headers = {
  'User-Agent': 'profile-readme-updater',
  Accept: 'application/vnd.github+json',
}

async function fetchJson(url) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`)
  return res.json()
}

function section(text, marker, fallback) {
  const start = `<!-- ${marker} starts -->`
  const end = `<!-- ${marker} ends -->`
  const i = text.indexOf(start)
  const j = text.indexOf(end)
  if (i < 0 || j < 0 || j <= i) return text
  return text.slice(0, i + start.length) + '\n' + fallback + '\n' + text.slice(j)
}

const [user, repos, releases] = await Promise.all([
  fetchJson(`${BASE}/users/${USER}`),
  fetchJson(`${BASE}/users/${USER}/repos?per_page=100&sort=updated`),
  fetchJson(`${BASE}/repos/${USER}/${FEATURED_REPOS[0]}/releases?per_page=5`),
])

const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0)
const totalForks = repos.reduce((s, r) => s + r.forks_count, 0)

const statsLine =
  `**量化策略研究员 · 全栈开发者 · DeepSeek Harness 生态贡献者** | GitHub: **${user.followers} followers** · **${totalStars} stars** · **${totalForks} forks** · 12+ 开源工具`

const releaseLines = releases.length
  ? releases.map(r => `• [${r.tag_name}](https://github.com/${USER}/${FEATURED_REPOS[0]}/releases/tag/${r.tag_name}) - ${r.published_at?.slice(0, 10)}`).join('\n')
  : '_暂无 Release_'

let text = await (await import('node:fs/promises')).readFile(README, 'utf8')
text = section(text, 'profile-stats', statsLine)
text = section(text, 'recent_releases', releaseLines)
await (await import('node:fs/promises')).writeFile(README, text)
console.log(`stats updated: ${user.followers} followers, ${totalStars} stars, ${totalForks} forks`)
