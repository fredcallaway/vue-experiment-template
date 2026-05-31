/* 
Use this file to define data views that aren't specific to one component.
We provide an example "timing" view that computes the amount of time spent
on each top-level epoch. You may wish to modify this if the structure of
your experiment warrants a different division.
*/

export const toWideFormat = <T extends Record<string, any>>(items: T[], key: keyof T, value: keyof T) => {
  return R.pipe(
    items,
    R.pullObject(x=>x[key], x=>x[value]),
    x => ([x])
  )
}

export type SurveyResponse = {
  id: string
  question: string
  response: string
  rt: number
}

function hasEpochSegment(epochId: string, name: string) {
  return epochId
    .split('-')
    .some(segment => segment === name || segment.startsWith(`${name}[`))
}

function lastEpochSegment(epochId: string) {
  return assertDefined(epochId.split('-').at(-1), `epoch id has no final segment: ${epochId}`)
}

function columnNameFromQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/[^\w\d]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function getSurveyResponses(sessionData: SessionData, surveyName: string): SurveyResponse[] {
  const events = sessionData.events
    .filter(event => event.eventType === 'survey.response' && hasEpochSegment(event.currentEpochId, surveyName))
  const componentCounts = R.countBy(events, event => lastEpochSegment(event.currentEpochId))

  return events.map((event) => {
    const componentName = lastEpochSegment(event.currentEpochId)
    const response = event.data.response
    const question = event.data.question
    const rt = event.data.rt

    if (typeof response !== 'string') {
      throw new Error(`survey.response for ${componentName} must have a string response`)
    }
    if (typeof question !== 'string') {
      throw new Error(`survey.response for ${componentName} must have a string question`)
    }
    if (typeof rt !== 'number') {
      throw new Error(`survey.response for ${componentName} must have a numeric rt`)
    }

    const id = componentCounts[componentName] === 1
      ? componentName
      : `${componentName}_${columnNameFromQuestion(question)}`

    return {
      id,
      question,
      response: response === 'SKIP' ? '' : response,
      rt,
    }
  })
}

declareDataView('survey', sessionData => toWideFormat(getSurveyResponses(sessionData, 'Survey'), 'id', 'response'))

declareDataView('timing', (sessionData: SessionData) => {
  const { startTime, completionTime } = sessionData.meta

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
  
  return toWideFormat(sections, 'section', 'duration')
})
