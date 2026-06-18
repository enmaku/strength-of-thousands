import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HeroImportError, planHeroImportWithCatalog, planHeroRefresh } from '../src/domain/heroesApi.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const heroesDir = path.join(root, 'heroes')
const catalogPath = path.join(root, 'data', 'spire-students.json')

function isLocalHost(host) {
  const hostname = (host ?? '').split(':')[0]
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function wrapAsync(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

async function readCatalogSlugs() {
  const raw = await fs.readFile(catalogPath, 'utf8')
  const catalog = JSON.parse(raw)
  return catalog.map((entry) => entry.slug)
}

async function readHeroIndex() {
  const indexPath = path.join(heroesDir, 'index.json')
  try {
    const raw = await fs.readFile(indexPath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

async function writeHeroIndex(index) {
  await fs.mkdir(heroesDir, { recursive: true })
  const sorted = [...index].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }),
  )
  await fs.writeFile(path.join(heroesDir, 'index.json'), `${JSON.stringify(sorted, null, 2)}\n`)
}

async function readHero(slug) {
  const raw = await fs.readFile(path.join(heroesDir, `${slug}.json`), 'utf8')
  return JSON.parse(raw)
}

async function writeHero(slug, hero) {
  await fs.mkdir(heroesDir, { recursive: true })
  await fs.writeFile(path.join(heroesDir, `${slug}.json`), `${JSON.stringify(hero, null, 2)}\n`)
}

async function readAllHeroesBySlug() {
  const index = await readHeroIndex()
  const heroesBySlug = {}
  for (const entry of index) {
    heroesBySlug[entry.slug] = await readHero(entry.slug)
  }
  return heroesBySlug
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  return text ? JSON.parse(text) : {}
}

function serveStaticFile(res, filePath) {
  return fs
    .readFile(filePath)
    .then((data) => {
      const ext = path.extname(filePath)
      const types = {
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.html': 'text/html; charset=utf-8',
        '.md': 'text/markdown; charset=utf-8',
      }
      res.statusCode = 200
      res.setHeader('Content-Type', types[ext] ?? 'application/octet-stream')
      res.end(data)
    })
    .catch((err) => {
      if (err.code === 'ENOENT') {
        res.statusCode = 404
        res.end('Not found')
        return
      }
      throw err
    })
}

function mountStatic(server, urlPrefix, dir) {
  server.middlewares.use(
    urlPrefix,
    wrapAsync(async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        next()
        return
      }

      const rel = (req.url?.split('?')[0] ?? '/').replace(/^\//, '')
      if (!rel || rel.includes('..')) {
        res.statusCode = rel.includes('..') ? 400 : 404
        res.end(rel.includes('..') ? 'Invalid path' : 'Not found')
        return
      }

      await serveStaticFile(res, path.join(dir, rel))
    }),
  )
}

async function handleHeroesApi(req, res) {
  if (!isLocalHost(req.headers.host)) {
    sendJson(res, 403, { error: 'GM writes require localhost' })
    return
  }

  const subPath = req.url?.split('?')[0] ?? '/'

  if (req.method === 'GET' && (subPath === '/' || subPath === '')) {
    sendJson(res, 200, await readHeroIndex())
    return
  }

  const slugMatch = subPath.match(/^\/([^/]+)$/)
  if (req.method === 'GET' && slugMatch) {
    try {
      sendJson(res, 200, await readHero(slugMatch[1]))
    } catch (err) {
      if (err.code === 'ENOENT') sendJson(res, 404, { error: 'Hero not found' })
      else throw err
    }
    return
  }

  if (req.method === 'POST' && (subPath === '/' || subPath === '')) {
    try {
      const body = await readBody(req)
      const pathbuilderId = Number(body.pathbuilderId)
      const build = body.build

      if (!Number.isInteger(pathbuilderId) || pathbuilderId <= 0) {
        sendJson(res, 400, { error: 'pathbuilderId is required' })
        return
      }

      if (!build?.name) {
        sendJson(res, 400, { error: 'PathBuilder build is required' })
        return
      }

      const catalogSlugs = await readCatalogSlugs()
      const index = await readHeroIndex()
      const heroesBySlug = await readAllHeroesBySlug()
      const { slug, hero } = planHeroImportWithCatalog(
        build,
        pathbuilderId,
        index,
        catalogSlugs,
        heroesBySlug,
      )

      await writeHero(slug, hero)
      index.push({ slug, displayName: hero.displayName })
      await writeHeroIndex(index)

      sendJson(res, 201, { slug, ...hero })
    } catch (err) {
      if (err instanceof HeroImportError) {
        sendJson(res, err.status, { error: err.message })
        return
      }
      throw err
    }
    return
  }

  if (req.method === 'PUT' && slugMatch) {
    const slug = slugMatch[1]

    try {
      const existing = await readHero(slug)
      const body = await readBody(req)

      if (body.refresh) {
        if (!body.build?.name) {
          sendJson(res, 400, { error: 'PathBuilder build is required for refresh' })
          return
        }

        const hero = planHeroRefresh(existing, body.build)
        await writeHero(slug, hero)

        const index = await readHeroIndex()
        const entry = index.find((h) => h.slug === slug)
        if (entry) {
          entry.displayName = hero.displayName
          await writeHeroIndex(index)
        }

        sendJson(res, 200, hero)
        return
      }

      const catalogSlugs = await readCatalogSlugs()

      if (body.relationships) {
        for (const [studentSlug, hearts] of Object.entries(body.relationships)) {
          if (!catalogSlugs.includes(studentSlug)) {
            sendJson(res, 400, { error: `Unknown student slug: ${studentSlug}` })
            return
          }
          const value = Number(hearts)
          if (!Number.isInteger(value) || value < 0 || value > 5) {
            sendJson(res, 400, { error: `Invalid hearts for ${studentSlug}` })
            return
          }
        }
        existing.relationships = { ...existing.relationships, ...body.relationships }
      }

      if (body.displayName?.trim()) {
        existing.displayName = body.displayName.trim()
      }

      await writeHero(slug, existing)

      const index = await readHeroIndex()
      const entry = index.find((h) => h.slug === slug)
      if (entry) {
        entry.displayName = existing.displayName
        await writeHeroIndex(index)
      }

      sendJson(res, 200, existing)
    } catch (err) {
      if (err instanceof HeroImportError) {
        sendJson(res, err.status, { error: err.message })
        return
      }
      if (err.code === 'ENOENT') {
        sendJson(res, 404, { error: 'Hero not found' })
        return
      }
      throw err
    }
    return
  }

  sendJson(res, 405, { error: 'Method not allowed' })
}

export function campaignDevPlugin() {
  return {
    name: 'campaign-dev',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use('/api/heroes', wrapAsync(handleHeroesApi))
      mountStatic(server, '/heroes', heroesDir)
      mountStatic(server, '/reference', path.join(root, 'reference'))
      mountStatic(server, '/lessons', path.join(root, 'lessons'))
    },
  }
}
