import { z } from 'zod'

const LogEventSchema = z.object({
  eventType: z.string(),
  timestamp: z.number(),
  currentEpochId: z.string(),
  index: z.number(),
  uid: z.string(),
  data: z.record(z.string(), z.any()),
})

const SimpleFSMSchema = z.object({ t: z.number(), r: z.number() })
const FSMSchema = z.object({
  transition: z.array(z.array(z.number())),
  reward: z.array(z.number()),
  initial: z.array(z.number()),
})
const ArmDefSchema = z.union([z.number(), SimpleFSMSchema, FSMSchema])

const BanditInitializeEventSchema = z.object({
  eventType: z.literal('bandit.initialize'),
  currentEpochId: z.string().endsWith('bandit'),
  data: z.object({
    horizon: z.number(),
    arms: z.array(ArmDefSchema),
    highReward: z.number().optional(),
    lowReward: z.number().optional(),
    preFeedbackTime: z.number().optional(),
    feedbackTime: z.number().optional(),
    doneTime: z.number().optional(),
    keys: z.array(z.string()).optional(),
    practice: z.boolean().optional(),
    example: z.boolean().optional(),
    hideTokens: z.boolean().optional(),
    hidePayoffs: z.boolean().optional(),
    description: z.string().optional(),
  }),
})
type BanditInitializeEvent = z.infer<typeof BanditInitializeEventSchema>

const BanditTrialEventSchema = z.object({
  eventType: z.literal('bandit.trial'),
  currentEpochId: z.string().endsWith('bandit'),
  data: z.object({
    arm: z.number(),
    reward: z.boolean(),
    rt: z.number(),
  }),
})
type BanditTrialEvent = z.infer<typeof BanditTrialEventSchema>



declareDataView('bandit', (sessionData: SessionData) => {
  // console.log('prepareBanditData', sessionData.events)
  const sessionId = sessionData.meta.sessionId
  const completionTime = sessionData.meta.completionTime
  if (!isDefined(completionTime)) {
    return []
  }

  return R.pipe(
    sessionData.events,
    R.filter(e => e.timestamp < completionTime), // HACK to fix bugs from playback writing data
    R.filter(e => e.eventType.startsWith('bandit')),
    R.filter(e => !(e.currentEpochId.includes('instructions'))),
    R.groupBy(e => e.currentEpochId),
    R.values(),
    R.map(blockEvents => {
      const { data: blockParams } = BanditInitializeEventSchema.parse(blockEvents[0])
      const highReward = blockParams.highReward ?? 1
      const lowReward = blockParams.lowReward ?? -highReward
      return R.pipe(blockEvents,
        R.filter(e => e.eventType == 'bandit.trial'),
        R.map((trial, trialIdx) => { 
          const { currentEpochId, data: trialData } = BanditTrialEventSchema.parse(trial)
          const match = currentEpochId.match(/(practice|main)\[(\d+)]/)
          if (!match) return parseError('Invalid epochId', {sessionId, trial })
          const [, stage, blockIdx] = match
          
          if (trialIdx > blockParams.horizon) {
            return parseError('Trial index exceeds block size', {sessionId, trial })
          }
          
          const arms = blockParams.arms.map(arm => SimpleFSMSchema.parse(arm))

          return {
            stage,
            block_idx: parseInt(blockIdx!),
            high_reward: highReward,
            low_reward: lowReward,
            t1: arms[0].t,
            t2: arms[1].t,
            r1: arms[0].r,
            r2: arms[1].r,
            horizon: blockParams.horizon,
            kind: blockParams.description,
            trial_idx: trialIdx,
            arm: trialData.arm,
            reward: Number(trialData.reward),
            rt: trialData.rt,
          }
        }),
      )
    }),
    R.values(),
    R.flat(),
  )
})

export const prepareTimingData = (sessionData: SessionData) => {
  const { startTime, completionTime } = sessionData.meta

  // const getSection = (e: EpochEvent) => (e.data.id.match(/experiment\[\d+\]-[^-]+/))?.[0] ?? null
  const getSection = (e: EpochEvent) => (e.data.id.match(/experiment\[\d+\]-([^[-]+)/))?.[1] ?? null
  const events = R.pipe(
    sessionData.events,
    R.filter(e => isEpochEvent(e)),
    R.map(e => ({
      id: e.data.id,
      section: getSection(e),
      time: (e.timestamp - startTime),
    })),
    R.filter(x => x.section !== null),
  )
  
  // const sections: Array<{section: string, start: string, end: string, duration: string}> = []

  const sections = [
    { section: 'total', 
      start: formatTime(0),
      end: completionTime ? formatTime(completionTime - startTime) : 'N/A',
      duration: completionTime ? formatTime(completionTime - startTime) : 'N/A', 
    },
  ]
  let currentSection: string | null = null
  let sectionStart = 0
  
  events.forEach((event, idx) => {
    if (event.section !== currentSection) {
      if (currentSection !== null) {
        const end = event.time
        sections.push({
          section: currentSection,
          start: formatTime(sectionStart),
          end: formatTime(end),
          duration: formatTime(end - sectionStart),
        })
      }
      currentSection = event.section
      sectionStart = event.time
    }
    // ignore last section (Completion)
  })
  
  return sections
}

const toWideFormat = <T extends Record<string, any>>(items: T[], key: keyof T, value: keyof T) => {
  return R.pipe(
    items,
    R.pullObject(x=>x[key], x=>x[value]),
    x => ([x])
  )
}

declareDataView('timing', (sessionData: SessionData) => {
  return toWideFormat(prepareTimingData(sessionData), 'section', 'duration')
})

declareDataView('bonus', (sessionData: SessionData) => {
  return R.pipe(
    sessionData.events,
    R.filter(e => e.eventType == 'bonus.update'),
    R.last(),
    R.prop('data', 'total'),
    // @ts-ignore
    (x => [{bonusCents: clamp(x, 0, Infinity)}])
  )
})
