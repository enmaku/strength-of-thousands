import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const transcriptsDir = path.join(root, 'transcripts')

export async function generateTranscriptIndex() {
  const entries = []
  let campaigns

  try {
    campaigns = await readdir(transcriptsDir, { withFileTypes: true })
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }

  for (const campaign of campaigns) {
    if (!campaign.isDirectory() || campaign.name.startsWith('.')) continue

    const campaignPath = path.join(transcriptsDir, campaign.name)
    const sessions = await readdir(campaignPath, { withFileTypes: true })

    for (const session of sessions) {
      if (!session.isDirectory() || !session.name.startsWith('session-')) continue

      const metaPath = path.join(campaignPath, session.name, 'meta.json')
      try {
        const meta = JSON.parse(await readFile(metaPath, 'utf8'))
        entries.push({
          campaign: campaign.name,
          sessionDir: session.name,
          sessionNumber: meta.sessionNumber,
          sessionId: meta.sessionId,
          label: `Session ${meta.sessionNumber}`,
        })
      } catch (err) {
        if (err.code !== 'ENOENT') throw err
      }
    }
  }

  entries.sort((a, b) => a.sessionNumber - b.sessionNumber)
  return entries
}

async function main() {
  const entries = await generateTranscriptIndex()
  await writeFile(
    path.join(transcriptsDir, 'index.json'),
    `${JSON.stringify(entries, null, 2)}\n`,
  )
  console.log(`Wrote transcripts/index.json (${entries.length} session(s))`)
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
