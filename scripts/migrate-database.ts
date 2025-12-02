#!/usr/bin/env bun
/**
 * Database Migration Script
 *
 * Migrates database from old format to new format:
 *
 * OLD FORMAT:
 * /{mode}/data/{sessionId}/events/{key}        - event records with eventType, timestamp, etc.
 * /{mode}/data/{sessionId}/participant/{key}   - participant event records
 * /{mode}/data/{sessionId}/session/...         - session metadata (bonus, etc.)
 * /{mode}/_meta/{sessionId}                    - session metadata
 *
 * NEW FORMAT:
 * /{mode}/events/{sessionId}/{compressedKey}   - compressed events (timestamp—index—type—uid)
 * /{mode}/meta/{sessionId}                     - session metadata
 * /{mode}/other/{sessionId}                    - other unstructured data (if any)
 *
 * This script:
 * 1. Backs up the full database to JSON
 * 2. Migrates /debug and /live paths
 * 3. Preserves original data until migration is verified
 */

import { initializeApp } from 'firebase/app'
import { getDatabase, ref as dbRef, get, set, remove } from 'firebase/database'
import config from '../epoch.config'
// import type { SessionMeta, LogEvent, DBEventKey } from '../shared/data'
import { compressEvent } from '../layers/epoch-framework/shared/data'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import * as R from 'remeda'
import { z } from 'zod'

// Initialize Firebase
const app = initializeApp(config.firebase)
const db = getDatabase(app)


// Zod schemas for database validation
const SessionMetaSchema = z.object({
  sessionId: z.string(),
  participantId: z.string(),
  studyId: z.string(),
  version: z.string(),
  mode: z.enum(['live', 'debug']),
  startTime: z.number(),
  completionTime: z.number().optional(),
  lastUpdateTime: z.number(),
  bonus: z.number(),
})
type SessionMeta = z.infer<typeof SessionMetaSchema>

const OldSessionMetaSchema = z.object({
  sessionId: z.string(),
  participantId: z.string(),
  studyId: z.string(),
  version: z.string(),
  mode: z.enum(['live', 'debug']),
  startTime: z.number(),
  completionTime: z.number().optional(),
  lastUpdateTime: z.number(),
  bonus: z.number().optional(),
  lastUpdate: z.number().optional(),
})
type OldSessionMeta = z.infer<typeof OldSessionMetaSchema>

const OldLogEventSchema = z.object({
  eventType: z.string(),
  timestamp: z.number(),
}).passthrough()
type OldLogEvent = z.infer<typeof OldLogEventSchema>

const OldParticipantEventSchema = z.object({
  eventType: z.string(),
  timestamp: z.number(),
  pid: z.string(),
  info: z.any(),
})
type OldParticipantEvent = z.infer<typeof OldParticipantEventSchema>

const OldSessionDataSchema = z.object({
  events: z.record(z.string(), OldLogEventSchema),
  participant: z.record(z.string(), OldParticipantEventSchema),
  session: z.record(z.string(), z.unknown()).optional(),
})
type OldSessionData = z.infer<typeof OldSessionDataSchema>

const OldDBModeDataSchema = z.object({
  meta: z.record(z.string(), OldSessionMetaSchema),
  data: z.record(z.string(), OldSessionDataSchema),
})
type OldDBModeData = z.infer<typeof OldDBModeDataSchema>

const DBEventKeySchema = z.string().regex(/^\d+—\d+—[^—]+—.{7}$/)
const DBSessionEventsSchema = z.record(DBEventKeySchema, z.union([z.record(z.string(), z.unknown()), z.literal(false)]))
type DBSessionEvents = z.infer<typeof DBSessionEventsSchema>

const DBModeDataSchema = z.object({
  meta: z.record(z.string(), SessionMetaSchema),
  events: z.record(z.string(), DBSessionEventsSchema),
  other: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
})
type DBModeData = z.infer<typeof DBModeDataSchema>

// const DBModeDataSchema = z.union([OldDBModeDataSchema, NewDBModeDataSchema])
// type DBModeData = z.infer<typeof DBModeDataSchema>

// const DatabaseSchema = z.object({
//   live: DBModeDataSchema.optional(),
//   debug: DBModeDataSchema.optional(),
// }).passthrough()
// type Database = z.infer<typeof DatabaseSchema>


function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message ?? 'Assertion failed');
  }
}

function assertDefined<T>(value: T | undefined | null, message?: string): T {
  if (value === undefined || value === null) {
    throw new Error(message ?? 'Value is undefined or null');
  }
  return value;
}

// Helper functions from local-data.ts migration code
const parseEventKey = (key: string) => {
  const parts = key.split('—')
  // if (parts.length != 4) {
  //   throw new Error(`Invalid key: ${key}`)
  // }
  const [timestamp, index, uid] = parts
  if (uid.length != 7) {
    throw new Error(`Invalid uid: ${uid}`)
  }

  return { timestamp: parseInt(timestamp), index: parseInt(index), uid }
}

const processOldEvents = (records: Record<string, OldLogEvent>): LogEvent[] => {

  assert(Object.keys(records).length > 0, 'No records to convert')
  return Object.entries(records).map(([key, oldData]) => {
    if (!oldData || typeof oldData !== 'object') {
      throw new Error(`Event "${key}" is not an object`)
    }
    const eventType = oldData.eventType
    const timestamp = oldData.timestamp
    if (typeof eventType !== 'string' || typeof timestamp !== 'number') {
      throw new Error(`Event "${key}" is missing eventType or timestamp`)
    }
    const { timestamp: timestamp2, index, uid } = parseEventKey(key)
    assert(Math.abs(timestamp - timestamp2) < 100, `Timestamp mismatch: ${timestamp} !== ${timestamp2}`)

    const data = R.omit(oldData, ['eventType', 'timestamp'])

    if (eventType.startsWith('participant.')) {
      assert(Object.keys(data).length == 2)
      assert(typeof data.pid === 'string')
      assert(data.info !== undefined)
    }
    if (eventType.startsWith('epoch')) {
      data.id = data._uid
      delete data._uid
      assert(Object.keys(data).length == 1)
      assert(typeof data.id === 'string')
    }

    return {
      eventType,
      currentEpochId: '', // this will be reconstructed later
      timestamp,
      index,
      uid,
      data,
    }
  })
}

const sortEvents = (events: LogEvent[]): LogEvent[] => {
  return [...events].sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp
    if (a.index !== b.index) return (a.index ?? 0) - (b.index ?? 0)
    if (a.eventType.startsWith('participant.')) return -1
    return a.uid.localeCompare(b.uid)
  })
}

const normalizeEvents = (events: LogEvent[]): LogEvent[] => {
  return sortEvents(events).map((event, index) => ({
    ...event,
    index,
  }))
}

const extractEvents = (modeData: OldDBModeData, sessionId: string): DBSessionEvents => {
  const rawData = modeData.data[sessionId]
  const result =  OldSessionDataSchema.safeParse(rawData)
  if (!result.success) {
    if (rawData.participant === undefined) {
      console.log(`  ${sessionId} has no participant data`)
      return {}
    }
    console.log('\n' + JSON.stringify(rawData) + '\n')
    throw new Error(`Failed to parse session data for sessionId=${sessionId}: ${result.error.message}`)
  }
  const data = result.data
  const events = processOldEvents(data.events)
  const participantEvents = processOldEvents(data.participant)
  const allEvents = normalizeEvents(events.concat(participantEvents))
  const compressedEvents = R.fromEntries(allEvents.map(event => compressEvent(event)))
  return DBSessionEventsSchema.parse(compressedEvents)
}

function extractMeta(modeData: OldDBModeData, sessionId: string): SessionMeta {
  const result = OldSessionMetaSchema.safeParse(modeData.meta[sessionId])
  if (!result.success) {
    console.log('\n' + JSON.stringify(modeData.meta[sessionId]) + '\n')
    throw new Error(`Invalid meta: for sessionId=${sessionId}: ${result.error.message}`)
  }
  const data = result.data as OldSessionMeta

  // bug in db paths 
  const live = (modeData.data[sessionId] as any).live
  if (R.isDefined(live)) {
    data.bonus = live.meta[sessionId].bonus
    data.completionTime = live.meta[sessionId].completionTime
  }
  
  if (data.bonus === undefined) {
    // old way of storing bonus
    const session = assertDefined(modeData.data[sessionId].session)
    data.bonus = assertDefined(session.bonus) as number
  }
  const lastUpdateTime = assertDefined(Math.max(
    (data.lastUpdateTime ?? 0),
    (data.lastUpdate ?? 0),
  ), "missing lastUpdate")

  let completionTime = data.completionTime
  if (completionTime === undefined) {
    const completionEvent = Object.values(modeData.data[sessionId].events).find(
      (e: OldLogEvent) => e.eventType === 'experiment.complete'
    )
    if (completionEvent) {
      completionTime = completionEvent.timestamp
    }
  }

  return SessionMetaSchema.parse({
    sessionId: data.sessionId,
    participantId: data.participantId,
    studyId: data.studyId,
    version: data.version,
    mode: data.mode,
    startTime: data.startTime,
    completionTime,
    lastUpdateTime,
    bonus: data.bonus,
  })

  
}


// Backup database to file
function saveBackup(data: any) {

  mkdirSync("./data/backup", { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `./data/backup/${timestamp}.json`

  writeFileSync(filename, JSON.stringify(data, null, 2))
  console.log(`✅ Backup saved to: ${filename}`)

  return filename
}

// Backup database to file
async function readFullDatabase() {
  console.log('Reading full database...')
  const snapshot = await get(dbRef(db, '/'))
  return snapshot.val()
  // const data = snapshot.val()
  
  // if (data === null || data === undefined) {
  //   throw new Error('Database is empty or null')
  // }
  
  // const result = DatabaseSchema.safeParse(data)
  // if (!result.success) {
  //   console.error('Database validation failed:')
  //   console.error(JSON.stringify(result.error.format(), null, 2))
  //   throw new Error(`Database validation failed: ${result.error.message}`)
  // }
  
  // return result.data
}


// function convertSession(modeData: OldDBModeData, sessionId: string) {

//   const meta = extractMeta(modeData, sessionId)

//   const regularEvents = processOldEvents(modeData.data[sessionId].events)
//   const participantEvents = processOldEvents(modeData.data[sessionId].participant)
//   const allEvents = normalizeEvents(regularEvents.concat(participantEvents))
//   const compressedEvents = R.fromEntries(allEvents.map(event => compressEvent(event))) as DBSessionEvents

//   const other = modeData.data[sessionId].session ?? {}

//   return { meta, events: compressedEvents, other}

// }

async function backupDatabase() {
  const allData = await readFullDatabase()
  const backupFile = saveBackup(allData)
  console.log(`✅ Backup saved to: ${backupFile}`)
  return backupFile
}

function readBackup(backupFile: string) {
  const allData = JSON.parse(readFileSync(backupFile, 'utf8'))
  return allData as Record<string, unknown>
  // const result = DatabaseSchema.safeParse(allData)
  // if (!result.success) {
  //   throw new Error(`Database validation failed: ${result.error.message}`)
  // }
  // return result.data
}

async function restoreDatabaseFromBackup(backupFile: string) {
  // backupDatabase()
  const allData = readBackup(backupFile)
  await set(dbRef(db, '/'), allData)
}

function migrateBackup(backupFile: string) {
  const allData = readBackup(backupFile)

  const newData: Record<DataMode, DBModeData> = {
    ...allData, // keep other top-level keys
    debug: {
      meta: {},
      events: {},
      other: {},
    },
    live: {
      meta: {},
      events: {},
      other: {},
    },
  }

  const validVersions = ['0.0.7', '0.1.1', '0.2.1']

  for (const mode of ['debug', 'live'] as DataMode[]) {
    console.log(`📊 Migrating ${mode} data...`)
    if (!R.isDefined(allData[mode])) {
      console.log(`${mode} is not defined; skipping`)
      continue
    }
    const oldModeData = allData[mode] as OldDBModeData
    if (!R.isDefined(oldModeData.data)) {
      console.log(`${mode} has no data field; assuming it is in new format`)
      const newModeData = DBModeDataSchema.parse(oldModeData)
      newData[mode] = newModeData
      continue
    }

    const sessionIds = Object.keys(oldModeData.meta)
    console.log(`  Found ${sessionIds.length} sessions`)

    for (const sessionId of sessionIds) {
      const version = oldModeData.meta[sessionId].version
      if (!validVersions.includes(version)) {
        console.log(`  ${sessionId} has invalid version ${version}; skipping`)
        continue
      }
      console.log(`  processing ${sessionId}...`)
      
      newData[mode].events[sessionId] = extractEvents(oldModeData, sessionId)
      newData[mode].meta[sessionId] = extractMeta(oldModeData, sessionId)
      newData[mode].other![sessionId] = oldModeData.data[sessionId].session ?? {}
    }
  }

  const dest = backupFile.replace("/backup/", "/migrated/")
  mkdirSync("./data/migrated", { recursive: true })
  writeFileSync(dest, JSON.stringify(newData, null, 2))
  console.log(`✅ Migrated data saved to: ${dest}`)
  return dest
}

async function main() {
  let backupFile = process.argv[2]
  if (!backupFile) {
    backupFile = await backupDatabase()
  }
  const migratedFile = migrateBackup(backupFile)
  const answer = await new Promise<string>((resolve) => {
    process.stdout.write('Update database? (type YES) ')
    process.stdin.once('data', data => resolve(data.toString().trim()))
  })
  if (answer === 'YES') {
    await restoreDatabaseFromBackup(migratedFile)
    console.log('✅ Database updated')
  } else {
    console.log('❌ Database NOT updated')
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
}).then(() => {
  process.exit(0)
})