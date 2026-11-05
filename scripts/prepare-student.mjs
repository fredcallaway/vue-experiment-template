#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { command, formatHandoff, TEMPLATE_REPOSITORY } from './create-experiment.mjs'

export async function prepareStudent(options) {
  const project = resolve(options.project)
  const template = resolve(options.template ?? dirname(dirname(fileURLToPath(import.meta.url))))
  const output = resolve(options.out)
  if (command(template, 'git', ['status', '--porcelain', '--untracked-files=all', '--ignore-submodules=none'])) {
    throw new Error('Commit the template changes and core adoption before preparing a student block')
  }
  // Handoffs contain a private key; never write them inside a source checkout.
  const repository = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: dirname(output), encoding: 'utf8' })
  if (repository.status === 0) throw new Error('Write the student setup block outside Git repositories')
  const readJson = async (file, label) => {
    const text = await readFile(file, 'utf8')
    try { return JSON.parse(text) } catch { throw new Error(`Invalid ${label} JSON`) }
  }
  const firebaseConfig = await readJson(resolve(project, 'firebase.config.json'), 'Firebase configuration')
  const config = await readJson(resolve(project, 'firebase.json'), 'Hosting configuration')
  if (!config.hosting || Array.isArray(config.hosting)) {
    throw new Error('Select one Hosting site before preparing the student block')
  }
  let site = config.hosting.site
  if (!site && config.hosting.target) {
    const aliases = await readJson(resolve(project, '.firebaserc'), 'Firebase alias')
    const sites = aliases.targets?.[firebaseConfig.projectId]?.hosting?.[config.hosting.target]
    if (sites?.length !== 1) throw new Error('The Hosting target must resolve to exactly one site')
    site = sites[0]
  }
  const configuredKey = ['rev-parse', '--git-path', 'firebase-auth/service-account.json']
  const keyFile = options.key ?? command(project, 'git', configuredKey)
  const serviceAccount = await readJson(resolve(project, keyFile), 'service-account key')
  const block = {
    schemaVersion: 1,
    name: options.name,
    template: {
      repository: options.repository ?? TEMPLATE_REPOSITORY,
      commit: command(template, 'git', ['rev-parse', 'HEAD']),
    },
    contactEmail: options.contactEmail,
    firebaseConfig,
    hostingSite: site ?? firebaseConfig.projectId,
    serviceAccount,
  }
  await writeFile(output, formatHandoff(block), { mode: 0o600, flag: 'wx' })
  return output
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help')) {
    console.log('Usage: node scripts/prepare-student.mjs --project <configured-project> --name <new-project>\n' +
      '  --contact-email <researcher-email> --out <private-file> [--key <service-account.json>]\n' +
      '  [--template <template-checkout>] [--repository <template-clone-url>]')
    return
  }
  const options = {}
  const fields = {
    '--project': 'project', '--name': 'name', '--contact-email': 'contactEmail', '--out': 'out',
    '--key': 'key', '--template': 'template', '--repository': 'repository',
  }
  for (let i = 0; i < args.length; i += 2) {
    const field = fields[args[i]]
    if (!field || !args[i + 1] || options[field]) {
      throw new Error('Unknown, duplicate, or incomplete option; see --help')
    }
    options[field] = args[i + 1]
  }
  if (['project', 'name', 'contactEmail', 'out'].some(field => !options[field])) {
    throw new Error('Missing required option; see --help')
  }
  const output = await prepareStudent(options)
  console.log(`Student setup block saved to ${output}. Share its contents privately with the student.`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
