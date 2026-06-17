import { cp, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist', 'spa')

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true })
  await cp(src, dest, { recursive: true, force: true })
}

async function copyReferenceAssets(srcDir, destDir) {
  await mkdir(destDir, { recursive: true })
  const entries = await readdir(srcDir, { withFileTypes: true })
  for (const entry of entries) {
    if (
      entry.isFile() &&
      (entry.name.endsWith('.html') ||
        entry.name.endsWith('.js') ||
        entry.name.endsWith('.css'))
    ) {
      await cp(path.join(srcDir, entry.name), path.join(destDir, entry.name))
    }
  }
}

async function main() {
  const lessonsSrc = path.join(root, 'lessons')
  const referenceSrc = path.join(root, 'reference')
  const imagesSrc = path.join(referenceSrc, 'images')

  await copyDir(lessonsSrc, path.join(dist, 'lessons'))
  await copyReferenceAssets(referenceSrc, path.join(dist, 'reference'))

  try {
    await copyDir(imagesSrc, path.join(dist, 'reference', 'images'))
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }

  try {
    await copyDir(path.join(root, 'heroes'), path.join(dist, 'heroes'))
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }

  console.log('Copied teaching assets into dist/spa/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
