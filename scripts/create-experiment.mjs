#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process'
import { createPrivateKey } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { Writable } from 'node:stream'
import { fileURLToPath } from 'node:url'

export const BEGIN = '-----BEGIN EXPERIMENT SETUP-----'
export const END = '-----END EXPERIMENT SETUP-----'
export const TEMPLATE_REPOSITORY = 'https://github.com/fredcallaway/vue-experiment-template.git'

export function validateHandoff(block) {
  const required = (value, label) => {
    if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing ${label} in the setup block`)
  }
  if (block?.schemaVersion !== 1) throw new Error('Unsupported experiment setup block version')
  if (!/^[a-z0-9][a-z0-9-]*$/.test(block.name ?? '')) {
    throw new Error('Use a project name with letters, digits, and hyphens')
  }
  required(block.template?.repository, 'template repository')
  if (!block.template.repository.startsWith('https://') && !isAbsolute(block.template.repository)) {
    throw new Error('The template repository must be an HTTPS URL or an absolute local path')
  }
  if (!/^[a-f0-9]{40}$/.test(block.template.commit ?? '')) {
    throw new Error('The setup block needs a full template commit')
  }
  const email = block.contactEmail ?? ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /fakedomain|example\./i.test(email)) {
    throw new Error('The setup block needs a real researcher contact email')
  }
  const config = block.firebaseConfig
  for (const field of ['projectId', 'appId', 'apiKey', 'databaseURL']) required(config?.[field], `Firebase ${field}`)
  if (config.projectId === 'vue-experiment-template') {
    throw new Error('Use the experiment Firebase project, not the template project')
  }
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(config.projectId)) throw new Error('Invalid Firebase project ID')
  let database
  try { database = new URL(config.databaseURL) } catch { /* Report the same error for all invalid database URLs. */ }
  if (database?.protocol !== 'https:' || !/\.(firebaseio\.com|firebasedatabase\.app)$/.test(database.hostname)) {
    throw new Error('The setup block needs the experiment Realtime Database URL')
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(block.hostingSite ?? '')) throw new Error('Missing or invalid Firebase Hosting site')
  const key = block.serviceAccount
  if (key?.type !== 'service_account' || key.project_id !== config.projectId) {
    throw new Error('The deployment key must belong to the experiment Firebase project')
  }
  required(key.client_email, 'service-account email')
  required(key.private_key, 'service-account private key')
  try { createPrivateKey(key.private_key) } catch { throw new Error('Invalid service-account private key') }
  return block
}

export function parseHandoff(text) {
  if (text.length > 1024 * 1024) throw new Error('The setup block is too large')
  const start = text.indexOf(BEGIN)
  const end = text.indexOf(END)
  if (start < 0 || end < start || text.indexOf(BEGIN, start + BEGIN.length) >= 0) {
    throw new Error('Paste one complete setup block, including its BEGIN and END lines')
  }
  let block
  try { block = JSON.parse(text.slice(start + BEGIN.length, end).trim()) } catch {
    throw new Error('The setup block is not valid JSON; copy the complete original block again')
  }
  return validateHandoff(block)
}

export const formatHandoff = block => `${BEGIN}\n${JSON.stringify(validateHandoff(block), null, 2)}\n${END}\n`

export function command(cwd, executable, args) {
  try {
    return execFileSync(executable, args, { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim()
  } catch {
    throw new Error(`${executable} ${args[0]} failed in ${cwd}; check the command output above`)
  }
}

async function readPastedBlock() {
  const silent = new Writable({ write(_chunk, _encoding, callback) { callback() } })
  const input = createInterface({ input: process.stdin, output: silent, terminal: Boolean(process.stdin.isTTY) })
  if (process.stdin.isTTY) console.error('Paste the complete setup block from your lab manager. Input is hidden.')
  input.on('SIGINT', () => { input.close(); process.exit(130) })
  let text = ''
  try {
    for await (const line of input) {
      text += line + '\n'
      if (text.length > 1024 * 1024) throw new Error('The setup block is too large')
      if (line.trim() === END) break
    }
  } finally {
    input.close()
    process.stdin.pause()
  }
  return text
}

export async function createExperiment(block, destination = resolve(block.name)) {
  validateHandoff(block)
  destination = resolve(destination)
  if (existsSync(destination)) throw new Error(`Destination already exists: ${destination}. Choose a new folder.`)
  for (const executable of ['git', 'bun']) {
    if (spawnSync(executable, ['--version'], { stdio: 'ignore' }).status !== 0) {
      throw new Error(`Install ${executable} before running experiment setup`)
    }
  }
  const staging = await mkdtemp(join(dirname(destination), '.experiment-setup-'))
  const root = join(staging, 'project')
  let installed = false
  try {
    console.error(`Creating ${block.name}…`)
    command(staging, 'git', ['clone', '--no-checkout', '--', block.template.repository, root])
    command(root, 'git', ['checkout', '--detach', block.template.commit])
    command(root, 'git', ['submodule', 'update', '--init', '--recursive'])
    if (!existsSync(join(root, 'core/operations/firebase-auth.ts'))) {
      throw new Error('This template revision does not support student setup; ask your manager for an updated block')
    }
    await writeFile(join(root, 'firebase.config.json'), JSON.stringify(block.firebaseConfig, null, 2) + '\n')
    const aliases = { projects: { default: block.firebaseConfig.projectId } }
    await writeFile(join(root, '.firebaserc'), JSON.stringify(aliases, null, 2) + '\n')
    const hosting = JSON.parse(await readFile(join(root, 'firebase.json'), 'utf8'))
    if (!hosting.hosting || Array.isArray(hosting.hosting)) {
      throw new Error('Expected a single-site template Hosting configuration')
    }
    delete hosting.hosting.target
    hosting.hosting.site = block.hostingSite
    await writeFile(join(root, 'firebase.json'), JSON.stringify(hosting, null, 2) + '\n')
    const config = await readFile(join(root, 'epoch.config.ts'), 'utf8')
    const contact = /\bcontactEmail:\s*(['"])[^'"\r\n]*\1/g
    if ([...config.matchAll(contact)].length !== 1) {
      throw new Error('Could not set the researcher contact in epoch.config.ts')
    }
    const configured = config.replace(contact, () => `contactEmail: ${JSON.stringify(block.contactEmail)}`)
    await writeFile(join(root, 'epoch.config.ts'), configured)

    // Keep the submodule's Git metadata while starting an independent experiment history.
    command(root, 'git', ['add', '.'])
    const tree = command(root, 'git', ['write-tree'])
    const commit = command(root, 'git', ['-c', 'user.name=Experiment setup', '-c', 'user.email=setup@localhost',
      'commit-tree', tree, '-m', `Initial commit for ${block.name}`])
    const refs = command(root, 'git', ['for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/tags'])
    for (const ref of refs.split('\n').filter(Boolean)) command(root, 'git', ['update-ref', '-d', ref])
    command(root, 'git', ['checkout', '-b', 'main', commit])
    command(root, 'git', ['remote', 'remove', 'origin'])

    // Reserve the destination without replacing an existing directory, then move before Nuxt creates absolute paths.
    await mkdir(destination)
    try { await rename(root, destination) } catch (error) { await rm(destination, { recursive: true }); throw error }
    installed = true
    const keyFile = join(destination, '.git', 'student-setup-key.json')
    try {
      await writeFile(keyFile, JSON.stringify(block.serviceAccount), { mode: 0o600, flag: 'wx' })
      command(destination, 'bun', ['--eval',
        'const {configureFirebaseCredentials} = await import("./core/operations/firebase-auth.ts"); ' +
        'await configureFirebaseCredentials(process.cwd(), process.argv[1]);', keyFile])
    } finally {
      await rm(keyFile, { force: true })
    }
    for (const args of [['install', '--frozen-lockfile'], ['run', 'typecheck']]) {
      const result = spawnSync('bun', args, { cwd: destination, stdio: 'inherit' })
      if (result.status !== 0) {
        throw new Error(`bun ${args.join(' ')} failed. Ask your agent to finish setup in ${destination}.`)
      }
    }
    if (spawnSync('firebase', ['--version'], { stdio: 'ignore' }).status !== 0) {
      const result = spawnSync('bun', ['install', '--global', 'firebase-tools@15.1.0'], { stdio: 'inherit' })
      if (result.status !== 0) {
        throw new Error(`Firebase CLI installation failed. Ask your agent to finish setup in ${destination}.`)
      }
      if (spawnSync('firebase', ['--version'], { stdio: 'ignore' }).status !== 0) {
        throw new Error('Firebase CLI is not on PATH. Ask your agent to add the Bun global bin directory to PATH.')
      }
    }
    console.log(`\nYour experiment is ready in ${destination}\nOpen that folder and run bun run dev.`)
    return destination
  } catch (error) {
    if (installed) console.error(`The configured project is preserved at ${destination}.`)
    throw error
  } finally {
    await rm(staging, { recursive: true, force: true })
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help')) {
    console.log('Usage: node create-experiment.mjs [--file setup.txt] [--directory new-folder]\n' +
      'Omit --file to paste your setup block.')
    return
  }
  const options = {}
  for (let i = 0; i < args.length; i += 2) {
    if (!['--file', '--directory'].includes(args[i]) || !args[i + 1] || options[args[i]]) {
      throw new Error('Use --file <setup.txt> and/or --directory <new-folder>; see --help')
    }
    options[args[i]] = args[i + 1]
  }
  const text = options['--file'] ? await readFile(options['--file'], 'utf8') : await readPastedBlock()
  await createExperiment(parseHandoff(text), options['--directory'])
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
