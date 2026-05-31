<template>
  <div w-600px mx-auto>
    <h1>You're done!</h1>

    <p>
      Thanks for participating! We have a few quick questions before you go.
    </p>

    <ESurveyWrapper name="Survey">
      <ESurveyButtons
        name="difficulty"
        prompt="How difficult was the experiment?"
        options="too easy, just right, too hard"
      />
      <ESurveyButtons
        name="fun"
        prompt="How fun was the experiment?"
        options="worse than average, typical, better than average"
      />
      <ESurveyText
        name="feedback"
        prompt="Do you have any other feedback?"
        placeholder="Optional"
      />
    </ESurveyWrapper>
  </div>
</template>

<script lang="ts">
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

function surveyResponseEvents(sessionData: SessionData, surveyName: string) {
  return sessionData.events
    .filter(event => event.eventType === 'survey.response' && hasEpochSegment(event.currentEpochId, surveyName))
}

declareDataView('survey', (sessionData: SessionData) => {
  const events = surveyResponseEvents(sessionData, 'Survey')
  const componentCounts = R.countBy(events, event => lastEpochSegment(event.currentEpochId))
  const row: Record<string, string> = {}

  events.forEach((event) => {
    const componentName = lastEpochSegment(event.currentEpochId)
    const response = event.data.response
    const question = event.data.question

    if (typeof response !== 'string') {
      throw new Error(`survey.response for ${componentName} must have a string response`)
    }
    if (typeof question !== 'string') {
      throw new Error(`survey.response for ${componentName} must have a string question`)
    }

    const column = componentCounts[componentName] === 1
      ? componentName
      : `${componentName}_${columnNameFromQuestion(question)}`
    row[column] = response === 'SKIP' ? '' : response
  })

  return [row]
})
</script>
