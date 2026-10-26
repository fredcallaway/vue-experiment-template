<script lang="ts">
import { declareDataView } from '../core/composables/dataViews'
import { declareEventLogger } from '../core/composables/logEvent'

type InstructionPage = 'choice' | 'key'

const [logResponse, isResponse] = declareEventLogger<{
  page: InstructionPage
  response: string
  rt: number
}>('instructions.response')

// One row per tutorial response; rt is milliseconds since the page was shown.
declareDataView('instructions', session => session.events.filter(isResponse).map(event => event.data))
</script>

<script lang="ts" setup>
// Keep responses here so Back navigation preserves them when an EPage remounts.
const responses = reactive<Partial<Record<InstructionPage, string>>>({})
let pageStartedAt = 0

function startPage() {
  pageStartedAt = performance.now()
}

function recordResponse(page: InstructionPage, response: string, enableNext: () => void) {
  if (responses[page] !== undefined) return
  responses[page] = response
  logResponse({ page, response, rt: Math.round(performance.now() - pageStartedAt) })
  enableNext()
}
</script>

<template>
  <ENavigableSequence name="instructions" header="Instructions" v-slot="{ enableNext }">
    <EPage name="welcome" @mounted="enableNext">
      <p class="prompt">
        Thanks for participating! We'll start with some instructions.
        Navigate with the arrow keys or the buttons above. You can go Back to re-read earlier pages.
      </p>
    </EPage>

    <EPage name="choice" @mounted="startPage">
      <p class="prompt" v-if="responses.choice !== undefined">
        You chose {{ responses.choice }}. Select Next to continue.
      </p>
      <p class="prompt" v-else>
        In this experiment, you will click buttons. Choose either button below to unlock Next.
      </p>
      <PButtons
        values="left right"
        classes="btn-blue btn-red"
        class="gap-20 mt-20"
        :disabled="responses.choice !== undefined"
        @click="value => recordResponse('choice', value, enableNext)"
      />
    </EPage>

    <EPage name="key" @mounted="startPage">
      <p class="prompt" v-if="responses.key !== undefined">
        You pressed {{ responses.key }}. Select Next to continue.
      </p>
      <p class="prompt" v-else>
        You might also press keys. Press the <kbd>K</kbd> key to unlock Next.
      </p>
      <PKey
        v-if="responses.key === undefined"
        keys="K"
        once
        @press="({ key }) => recordResponse('key', key, enableNext)"
      />
    </EPage>

    <EContinue name="ready" button="Start">
      <p class="prompt">That's pretty much it! Select Start to begin the experiment. Have fun!</p>
    </EContinue>
  </ENavigableSequence>
</template>
