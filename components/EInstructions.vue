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
let pageStartedAt = 0

function startPage() {
  pageStartedAt = performance.now()
}

function recordResponse(page: InstructionPage, response: string) {
  logResponse({ page, response, rt: Math.round(performance.now() - pageStartedAt) })
}
</script>

<template>
  <ENavigableSequence name="instructions" header="Instructions" v-slot="{ enableNext }">
    <EPage name="welcome" @mounted="enableNext">
      <div class="prompt !max-w-130">
        Thanks for participating in our experiment! We'll start with some instructions.
        Navigate with arrow keys or the buttons at the top.
      </div>
    </EPage>

    <EContinue class="flex flex-wrap justify-center items-center flex-col" button="Start">
      <div class="prompt">
        In this experiment, you will click buttons. For example, the one below.
        Click it.
      </div>
    </EContinue>

    <EPage name="click" @mounted="startPage" v-slot="{ state }">
      <div class="prompt" v-if="state.choice">
        You chose {{ state.choice }}.
      </div>
      <div class="prompt" v-else>
        Sometimes, there might be multiple buttons. I hate decisions!
      </div>
      <PButtons
        values="left right"
        classes="btn-blue btn-red"
        class="gap-20 mt-20"
        :disabled="state.choice !== undefined"
        @click="value => {
          state.choice = value
          recordResponse('choice', value)
          enableNext()
        }"
      />
    </EPage>

    <EPage name="key" @mounted="startPage" v-slot="{ done }">
      <div class="prompt">
        You might also press keys. Press the <kbd>K</kbd> key to continue.
      </div>
      <PKey
        keys="K"
        @press="({ key }) => {
          recordResponse('key', key)
          done()
        }"
      />
    </EPage>

    <EContinue class="flex flex-wrap justify-center items-center flex-col" button="Start">
      <div class="prompt">
        That's pretty much it! Have fun!
      </div>
    </EContinue>
  </ENavigableSequence>
</template>
