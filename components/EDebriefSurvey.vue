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
const surveyColumns = ['difficulty', 'fun', 'feedback'] as const
type SurveyColumn = typeof surveyColumns[number]

function hasEpochSegment(epochId: string, name: string) {
  return epochId
    .split('-')
    .some(segment => segment === name || segment.startsWith(`${name}[`))
}

function lastEpochSegment(epochId: string) {
  return assertDefined(epochId.split('-').at(-1), `epoch id has no final segment: ${epochId}`)
}

function isSurveyColumn(value: string): value is SurveyColumn {
  return surveyColumns.includes(value as SurveyColumn)
}

declareDataView('survey', (sessionData: SessionData) => {
  const row: Record<SurveyColumn, string> = Object.fromEntries(
    surveyColumns.map(column => [column, ''])
  ) as Record<SurveyColumn, string>

  sessionData.events
    .filter(event => event.eventType === 'survey.response' && hasEpochSegment(event.currentEpochId, 'Survey'))
    .forEach((event) => {
      const column = lastEpochSegment(event.currentEpochId)
      if (!isSurveyColumn(column)) return

      const response = event.data.response
      if (typeof response !== 'string') {
        throw new Error(`survey.response for ${column} must have a string response`)
      }
      row[column] = response === 'SKIP' ? '' : response
    })

  return [row]
})
</script>
