import assert from 'node:assert/strict'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import { generateKeyPairSync } from 'node:crypto'
import { chmod, copyFile, mkdir, mkdtemp, readFile, readdir, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { END, formatHandoff, parseHandoff } from './create-experiment.mjs'

const source = dirname(fileURLToPath(import.meta.url))
const installer = join(source, 'create-experiment.mjs')
const preparer = join(source, 'prepare-student.mjs')
const bun = execFileSync('which', ['bun'], { encoding: 'utf8' }).trim()
const git = execFileSync('which', ['git'], { encoding: 'utf8' }).trim()
const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 })
const privateKey = keyPair.privateKey.export({ type: 'pkcs8', format: 'pem' })
const readJson = async file => JSON.parse(await readFile(file, 'utf8'))

async function run(script, args, { cwd, env, input = '' }) {
  return await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = '', stderr = ''
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    child.on('error', reject)
    child.on('close', code => resolve({ code, stdout, stderr }))
    child.stdin.on('error', () => {})
    child.stdin.end(input)
  })
}

async function fixture(t, { firebaseInstalled = true } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'experiment-setup-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const template = join(root, 'template'), core = join(root, 'core-source'), project = join(root, 'configured-project')
  const bin = join(root, 'bin'), log = join(root, 'commands.jsonl')
  for (const path of [template, core, project, bin]) await mkdir(path)
  const env = {
    ...process.env, HOME: join(root, 'home'), PATH: `${bin}:${dirname(git)}:/usr/bin:/bin`, GIT_ALLOW_PROTOCOL: 'file:https',
    GIT_AUTHOR_NAME: 'Setup test', GIT_AUTHOR_EMAIL: 'setup@lab.test',
    GIT_COMMITTER_NAME: 'Setup test', GIT_COMMITTER_EMAIL: 'setup@lab.test',
    SETUP_TEST_LOG: log, SETUP_TEST_BIN: bin,
  }
  const gitRun = (cwd, ...args) => execFileSync(git, args, {
    cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
  for (const path of [template, core, project]) gitRun(path, 'init', '-q')
  await mkdir(join(core, 'operations'))
  await copyFile(resolve(source, '../core/operations/firebase-auth.ts'), join(core, 'operations/firebase-auth.ts'))
  await writeFile(join(core, 'pinned.txt'), 'reviewed core')
  gitRun(core, 'add', '.'); gitRun(core, 'commit', '-qm', 'reviewed core')
  const coreCommit = gitRun(core, 'rev-parse', 'HEAD')
  gitRun(template, 'submodule', 'add', '-q', core, 'core')
  await writeFile(join(core, 'pinned.txt'), 'newer unadopted core')
  gitRun(core, 'commit', '-qam', 'unadopted change')
  const templateConfig = { projectId: 'vue-experiment-template' }
  await writeFile(join(template, 'firebase.config.json'), JSON.stringify(templateConfig))
  await writeFile(join(template, 'firebase.json'), JSON.stringify({ hosting: { public: '.output/public' } }))
  await writeFile(join(template, 'epoch.config.ts'), 'export default { contactEmail: "unset@fakeDomain.foo" }\n')
  await writeFile(join(template, '.gitignore'), 'node_modules\n.nuxt\n')
  gitRun(template, 'add', '.'); gitRun(template, 'commit', '-qm', 'template')
  gitRun(template, 'tag', 'template-release')
  const key = {
    type: 'service_account', project_id: 'student-project',
    client_email: 'deployer@student-project.iam.gserviceaccount.com',
    private_key: privateKey, private_key_id: 'synthetic-test-key', token_uri: 'https://oauth2.googleapis.com/token',
  }
  const config = {
    projectId: key.project_id, appId: '1:123:web:abc', apiKey: 'public-test-key',
    databaseURL: 'https://student-project-default-rtdb.firebaseio.com', authDomain: 'student-project.firebaseapp.com',
  }
  await writeFile(join(project, 'firebase.config.json'), JSON.stringify(config))
  await writeFile(join(project, 'firebase.json'), JSON.stringify({ hosting: { site: 'student-hosting-site' } }))
  await mkdir(join(project, '.git/firebase-auth'), { recursive: true })
  await writeFile(join(project, '.git/firebase-auth/service-account.json'), JSON.stringify(key), { mode: 0o600 })
  const firebase = `#!${process.execPath}\nconsole.log('firebase test fixture');\n`
  if (firebaseInstalled) {
    await writeFile(join(bin, 'firebase'), firebase)
    await chmod(join(bin, 'firebase'), 0o755)
  }
  await writeFile(join(bin, 'bun'), `#!${process.execPath}
const fs = require('node:fs');
const cp = require('node:child_process');
const path = require('node:path');
const args = process.argv.slice(2);
if (args[0] === '--version') process.exit(0);
if (args[0] === '--eval') process.exit(cp.spawnSync(${JSON.stringify(bun)}, args, { stdio: 'inherit' }).status);
fs.appendFileSync(process.env.SETUP_TEST_LOG, JSON.stringify(args) + '\\n');
if (args[0] === 'install' && args.includes('--global')) {
  fs.writeFileSync(path.join(process.env.SETUP_TEST_BIN, 'firebase'), ${JSON.stringify(firebase)}, { mode: 0o755 });
  process.exit(0);
}
if (JSON.parse(fs.readFileSync('firebase.config.json')).projectId !== 'student-project') process.exit(20);
const credentialFile = path.join(process.env.HOME, '.config/experiment-template/firebase/student-project/service-account.json');
const credential = JSON.parse(fs.readFileSync(credentialFile));
if (credential.project_id !== 'student-project') process.exit(21);
if (process.env.SETUP_TEST_FAIL === '1' && args[0] === 'install') process.exit(22);
`)
  await chmod(join(bin, 'bun'), 0o755)
  const file = join(root, 'student-block.txt')
  const prepared = await run(preparer, ['--project', project, '--template', template, '--repository', template,
    '--name', 'student-experiment', '--contact-email', 'researcher@lab.test', '--out', file], { cwd: root, env })
  assert.equal(prepared.code, 0, prepared.stderr)
  assert.ok(!prepared.stdout.includes(privateKey))
  const text = await readFile(file, 'utf8')
  return { root, template, project, key, config, coreCommit,
    env: { ...env, HOME: join(root, 'student-home') }, gitRun, file, text, log }
}

test('a generated block creates a clean project from stdin with pinned core and private credentials', async t => {
  const f = await fixture(t)
  assert.equal((await stat(f.file)).mode & 0o777, 0o600)
  const before = f.gitRun(f.project, 'status', '--porcelain')
  const result = await run(installer, [], { cwd: f.root, env: f.env, input: f.text })
  assert.equal(result.code, 0, result.stderr)
  const destination = join(f.root, 'student-experiment')
  assert.deepEqual(await readJson(join(destination, 'firebase.config.json')), f.config)
  assert.equal((await readJson(join(destination, '.firebaserc'))).projects.default, f.config.projectId)
  assert.equal((await readJson(join(destination, 'firebase.json'))).hosting.site, 'student-hosting-site')
  assert.ok((await readFile(join(destination, 'epoch.config.ts'), 'utf8')).includes('researcher@lab.test'))
  assert.equal(f.gitRun(destination, 'rev-list', '--count', 'HEAD'), '1')
  assert.equal(f.gitRun(destination, 'branch', '--show-current'), 'main')
  const refs = f.gitRun(destination, 'for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/tags')
  assert.equal(refs, 'refs/heads/main')
  assert.equal(f.gitRun(destination, 'remote'), '')
  assert.equal(f.gitRun(destination, 'status', '--porcelain'), '')
  assert.equal(f.gitRun(join(destination, 'core'), 'rev-parse', 'HEAD'), f.coreCommit)
  assert.equal(await readFile(join(destination, 'core/pinned.txt'), 'utf8'), 'reviewed core')
  const credentialFile = join(f.env.HOME, '.config/experiment-template/firebase/student-project/service-account.json')
  assert.deepEqual(await readJson(credentialFile), f.key)
  assert.equal((await stat(credentialFile)).mode & 0o777, 0o600)
  assert.ok(!(await readdir(join(destination, '.git'))).includes('student-setup-key.json'))
  assert.ok(!f.gitRun(destination, 'show', 'HEAD').includes(privateKey))
  assert.ok(!`${result.stdout}${result.stderr}`.includes(privateKey))
  assert.equal(f.gitRun(f.project, 'status', '--porcelain'), before)
  assert.deepEqual((await readFile(f.log, 'utf8')).trim().split('\n').map(JSON.parse), [
    ['install', '--frozen-lockfile'], ['run', 'typecheck'],
  ])
  const observed = execFileSync(bun, ['--eval',
    'const {firebaseEnvironment}=await import("./core/operations/firebase-auth.ts");' +
    'const e=await firebaseEnvironment(process.cwd()); ' +
    'console.log(JSON.stringify({key:e.GOOGLE_APPLICATION_CREDENTIALS,token:e.FIREBASE_TOKEN}));',
  ], { cwd: destination, env: { ...f.env, FIREBASE_TOKEN: 'cached-human-token' }, encoding: 'utf8' })
  const savedKey = await realpath(join(f.env.HOME, '.config/experiment-template/firebase/student-project/service-account.json'))
  assert.equal(await realpath(JSON.parse(observed).key), savedKey)
  assert.equal(JSON.parse(observed).token, '')
})

test('pulling an experiment checks out the newly pinned core commit', async t => {
  const f = await fixture(t)
  const result = await run(installer, [], { cwd: f.root, env: f.env, input: f.text })
  assert.equal(result.code, 0, result.stderr)
  const destination = join(f.root, 'student-experiment')
  const upstream = join(f.root, 'upstream.git'), maintainer = join(f.root, 'maintainer')
  f.gitRun(f.root, 'clone', '--bare', destination, upstream)
  f.gitRun(destination, 'remote', 'add', 'origin', upstream)
  f.gitRun(destination, 'fetch', 'origin')
  f.gitRun(destination, 'branch', '--set-upstream-to=origin/main', 'main')
  f.gitRun(f.root, 'clone', upstream, maintainer)
  f.gitRun(maintainer, 'submodule', 'update', '--init', '--recursive')
  const coreCommit = f.gitRun(join(f.root, 'core-source'), 'rev-parse', 'HEAD')
  f.gitRun(join(maintainer, 'core'), 'checkout', coreCommit)
  f.gitRun(maintainer, 'add', 'core')
  f.gitRun(maintainer, 'commit', '-m', 'Adopt newer core')
  f.gitRun(maintainer, 'push', 'origin', 'main')

  f.gitRun(destination, 'pull')

  assert.equal(f.gitRun(join(destination, 'core'), 'rev-parse', 'HEAD'), coreCommit)
  assert.equal(f.gitRun(destination, 'status', '--porcelain'), '')
})

test('file input supports a chosen destination and installs a missing Firebase CLI once', async t => {
  const f = await fixture(t, { firebaseInstalled: false })
  const result = await run(installer, ['--file', f.file, '--directory', 'chosen-folder'], { cwd: f.root, env: f.env })
  assert.equal(result.code, 0, result.stderr)
  assert.equal(f.gitRun(join(f.root, 'chosen-folder'), 'status', '--porcelain'), '')
  assert.ok((await readFile(f.log, 'utf8')).includes('"--global"'))
})

test('interactive paste completes at the END line without echoing credentials or requiring EOF', async t => {
  if (spawnSync('python3', ['-c', 'import pty']).status !== 0) return t.skip('Python PTY support is unavailable')
  const f = await fixture(t)
  const program = `
import json, os, pty, select, subprocess, sys, time
master, slave = pty.openpty()
child = subprocess.Popen([sys.argv[1], sys.argv[2]], stdin=slave, stdout=slave, stderr=slave, cwd=sys.argv[4])
os.close(slave)
output = b''
pasted = False
deadline = time.monotonic() + 20
while time.monotonic() < deadline:
    if select.select([master], [], [], 0.1)[0]:
        try: chunk = os.read(master, 65536)
        except OSError: break
        if not chunk: break
        output += chunk
        if b'Input is hidden.' in output and not pasted:
            with open(sys.argv[3], 'rb') as block: os.write(master, block.read())
            pasted = True
    if child.poll() is not None: break
if child.poll() is None: child.kill()
code = child.wait()
os.close(master)
print(json.dumps({'code': code, 'pasted': pasted, 'hidden': b'BEGIN PRIVATE KEY' not in output}))
`
  const result = execFileSync('python3', ['-c', program, process.execPath, installer, f.file, f.root], {
    cwd: f.root, env: f.env, encoding: 'utf8', timeout: 25000,
  })
  assert.deepEqual(JSON.parse(result), { code: 0, pasted: true, hidden: true })
})

test('existing destinations and invalid blocks fail without changing files or leaking the key', async t => {
  const f = await fixture(t)
  const destination = join(f.root, 'student-experiment')
  await mkdir(destination)
  await writeFile(join(destination, 'keep.txt'), 'existing work')
  const existing = await run(installer, [], { cwd: f.root, env: f.env, input: f.text })
  assert.notEqual(existing.code, 0)
  assert.equal(await readFile(join(destination, 'keep.txt'), 'utf8'), 'existing work')
  const mismatch = await run(installer, [], {
    cwd: f.root, env: f.env, input: f.text.replace('"project_id": "student-project"', '"project_id": "wrong-project"'),
  })
  assert.notEqual(mismatch.code, 0)
  assert.ok(mismatch.stderr.includes('must belong'))
  const malformed = await run(installer, [], {
    cwd: f.root, env: f.env,
    input: `-----BEGIN EXPERIMENT SETUP-----\n{"private_key":"DO_NOT_ECHO", broken}\n${END}\n`,
  })
  assert.notEqual(malformed.code, 0)
  assert.ok(!malformed.stderr.includes('DO_NOT_ECHO'))
  assert.ok(!`${existing.stderr}${mismatch.stderr}`.includes(privateKey))
})

test('an interrupted installation preserves configured source and removes staging and temporary keys', async t => {
  const f = await fixture(t)
  const result = await run(installer, [], { cwd: f.root, env: { ...f.env, SETUP_TEST_FAIL: '1' }, input: f.text })
  assert.notEqual(result.code, 0)
  const destination = join(f.root, 'student-experiment')
  assert.equal((await readJson(join(destination, 'firebase.config.json'))).projectId, f.config.projectId)
  const credentialFile = join(f.env.HOME, '.config/experiment-template/firebase/student-project/service-account.json')
  assert.deepEqual(await readJson(credentialFile), f.key)
  assert.ok(!(await readdir(f.root)).some(name => name.startsWith('.experiment-setup-')))
  assert.ok(!(await readdir(join(destination, '.git'))).includes('student-setup-key.json'))
  assert.ok(result.stderr.includes(destination))
  assert.ok(!result.stderr.includes(privateKey))
})

test('handoff generation resolves a Hosting target and refuses source-tree output or overwriting a block', async t => {
  const f = await fixture(t)
  await writeFile(join(f.project, 'firebase.json'), JSON.stringify({ hosting: { target: 'experiment' } }))
  await writeFile(join(f.project, '.firebaserc'), JSON.stringify({
    targets: { [f.config.projectId]: { hosting: { experiment: ['resolved-site'] } } },
  }))
  const args = ['--project', f.project, '--template', f.template, '--repository', f.template,
    '--name', 'student-experiment', '--contact-email', 'researcher@lab.test']
  const targetFile = join(f.root, 'target-block.txt')
  const result = await run(preparer, [...args, '--out', targetFile], { cwd: f.root, env: f.env })
  assert.equal(result.code, 0, result.stderr)
  assert.equal(parseHandoff(await readFile(targetFile, 'utf8')).hostingSite, 'resolved-site')
  const inSource = await run(preparer, [...args, '--out', join(f.project, 'private.txt')], { cwd: f.root, env: f.env })
  assert.notEqual(inSource.code, 0)
  const overwrite = await run(preparer, [...args, '--out', f.file], { cwd: f.root, env: f.env })
  assert.notEqual(overwrite.code, 0)
  assert.equal(await readFile(f.file, 'utf8'), f.text)
  assert.equal(formatHandoff(parseHandoff(f.text)), f.text)
})

test('handoff generation uses the shared home key without legacy metadata and rejects shell-only credentials', async t => {
  const f = await fixture(t)
  await rm(join(f.project, '.git/firebase-auth'), { recursive: true })
  const args = ['--project', f.project, '--template', f.template, '--repository', f.template,
    '--name', 'student-experiment', '--contact-email', 'researcher@lab.test']
  const file = join(f.root, 'shared-key-block.txt')
  const shared = await run(preparer, [...args, '--out', file], {
    cwd: f.root, env: { ...f.env, HOME: join(f.root, 'home') },
  })
  assert.equal(shared.code, 0, shared.stderr)
  assert.deepEqual(parseHandoff(await readFile(file, 'utf8')).serviceAccount, f.key)
  const shell = await run(preparer, [...args, '--out', join(f.root, 'absent-key-block.txt')], {
    cwd: f.root, env: { ...f.env, HOME: join(f.root, 'empty-home') },
  })
  assert.notEqual(shell.code, 0)
  assert.ok(shell.stderr.includes('Configure a project key or supply --key'))
  assert.ok(!`${shell.stdout}${shell.stderr}${shared.stdout}${shared.stderr}`.includes(privateKey))
})
