# Strength of Thousands

GM prep workspace and Quasar SPA for the Pathfinder 2e *Strength of Thousands* adventure path.

**Live site:** [enmaku.github.io/strength-of-thousands](https://enmaku.github.io/strength-of-thousands/)

## Teaching workspace

| Path | Purpose |
| --- | --- |
| `MISSION.md` | Why we're learning / running this AP |
| `lessons/` | Self-contained HTML GM prep lessons (open in browser) |
| `learning-records/` | What you already know; drives future lessons |
| `reference/` | Campaign overviews, glossaries, thematic guides |
| `reference/sot-session-log.md` | Living bookmark after each table session |
| `reference/sot-session-prep-guide.md` | Recipe for Session N prep lessons (GM prep → Sessions) |
| `RESOURCES.md` | External links and local resource index |
| `NOTES.md` | Learner preferences and working notes |

PDF text extracts under `reference/sot-extracts/` are **local only** (gitignored). See `reference/sot-extracts/README.md` to regenerate from your PDFs.

## Quasar app

| Layer | Choice |
| --- | --- |
| UI | Vue 3, Quasar 2, Pinia |
| Routing | Vue Router (hash mode — static hosting friendly) |
| Deploy | GitHub Actions → Pages (`dist/spa`) |

### Development

```bash
npm install
npm run dev
```

Open the URL Quasar prints (typically `http://localhost:9000/#/`).

### Local GitHub Pages build

```bash
chmod +x scripts/build-for-pages.sh   # once
./scripts/build-for-pages.sh
```

Preview the output:

```bash
npx quasar serve dist/spa --history
```

### Deploy

Push to `main`. The [publish workflow](.github/workflows/publish.yml) runs lint, build, and deploys `dist/spa`.

**One-time setup:** Repo → Settings → Pages → Build and deployment → Source: **GitHub Actions**.

Static lessons ship inside `dist/spa/lessons/` via `scripts/copy-teaching-assets.mjs` (runs on `postbuild`).
