/* 
Use this file to define data views that aren't specific to one component.
We provide an example "timing" view that computes the amount of time spent
on each top-level epoch. You may wish to modify this if the structure of
your experiment warrants a different division.
*/

const toWideFormat = <T extends Record<string, any>>(items: T[], key: keyof T, value: keyof T) => {
  return R.pipe(
    items,
    R.pullObject(x=>x[key], x=>x[value]),
    x => ([x])
  )
}

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
