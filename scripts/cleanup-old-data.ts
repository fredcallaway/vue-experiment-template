#!/usr/bin/env bun
/**
 * Cleanup Script - Remove old database format after migration
 *
 * This script removes the old /{mode}/data and /{mode}/_meta paths after verifying
 * that the migration was successful.
 *
 * ONLY RUN THIS AFTER:
 * 1. Running migrate-database.ts
 * 2. Verifying the new data in Firebase console
 * 3. Testing the application with the new format
 */

import { initializeApp } from 'firebase/app'
import { getDatabase, ref as dbRef, get, remove } from 'firebase/database'
import config  from '../epoch.config'

const app = initializeApp(config.firebase)
const db = getDatabase(app)

async function cleanup() {
  console.log('🧹 Cleaning up old database format...\n')

  const modes: DataMode[] = ['live', 'debug']
  const oldPaths = ['data', '_meta', 'sessions'] as const
  let totalOld = 0

  // Check what exists for each mode
  for (const mode of modes) {
    console.log(`${mode.toUpperCase()} - Old data:`)

    for (const path of oldPaths) {
      const snapshot = await get(dbRef(db, `/${mode}/${path}`))
      const data = snapshot.val() as Record<string, unknown> | null
      const count = data ? Object.keys(data).length : 0
      totalOld += count

      if (count > 0) {
        console.log(`  /${mode}/${path}: ${count} sessions`)
      }
    }
  }

  console.log()

  if (totalOld === 0) {
    console.log('✅ No old data found. Already cleaned up!')
    return
  }

  // Safety check - verify new data exists
  console.log('🔍 Verifying new format exists...')

  let totalNewMeta = 0
  for (const mode of modes) {
    const metaSnapshot = await get(dbRef(db, `/${mode}/meta`))
    const meta = metaSnapshot.val() as Record<string, unknown> | null
    const count = meta ? Object.keys(meta).length : 0
    totalNewMeta += count
    console.log(`  /${mode}/meta: ${count} sessions`)
  }

  console.log()

  if (totalNewMeta === 0) {
    console.error('❌ ERROR: No new format data found!')
    console.error('Migration may have failed. Do NOT clean up old data.')
    process.exit(1)
  }

  // Ask for confirmation
  console.log('⚠️  WARNING: This will permanently delete old data paths.')
  console.log('Make sure you have verified the migration was successful.')
  console.log()
  console.log('Type "yes" to confirm deletion: ')

  const answer = await new Promise<string>(resolve => {
    process.stdin.once('data', data => {
      resolve(data.toString().trim())
    })
  })

  if (answer !== 'yes') {
    console.log('\n❌ Cleanup cancelled.')
    process.exit(0)
  }

  // Perform cleanup
  console.log('\n🗑️  Removing old data...')

  for (const mode of modes) {
    for (const path of oldPaths) {
      const snapshot = await get(dbRef(db, `/${mode}/${path}`))
      if (snapshot.exists()) {
        await remove(dbRef(db, `/${mode}/${path}`))
        console.log(`  ✅ Removed /${mode}/${path}`)
      }
    }
  }

  console.log('\n✅ Cleanup completed!')
  process.exit(0)
}

type DataMode = 'live' | 'debug'

cleanup().catch(error => {
  console.error('❌ Cleanup failed:', error)
  process.exit(1)
})
