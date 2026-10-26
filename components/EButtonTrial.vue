<script lang="ts">
import { declareDataView } from '../core/composables/dataViews'
import { defineParams } from '../core/composables/defineParams'
import { declareEventLogger } from '../core/composables/logEvent'
import { useBonus } from '../core/composables/useBonus'

export const buttonColors = ['orange', 'blue'] as const
export type ButtonColor = (typeof buttonColors)[number]

export const [provideButtonTrialParams, useButtonTrialParams] = defineParams({ feedbackMs: 1000 })
export type ButtonTrialParams = ReturnType<typeof useButtonTrialParams>

const [logResponse, isResponse] = declareEventLogger<{
  trial: number
  target: ButtonColor
  response: ButtonColor
  correct: boolean
  rt: number
}>('trial.response')

// One row per trial: stimulus, response, accuracy, and response time in milliseconds.
declareDataView('trials', session => session.events.filter(isResponse).map(event => event.data))
</script>

<script lang="ts" setup>
const props = defineProps<{
  trialNumber: number
  target: ButtonColor
  params?: Partial<ButtonTrialParams>
}>()

const params = useButtonTrialParams(props.params)
const bonus = useBonus()
const answered = ref(false)
const correct = ref(false)
let choiceStartedAt = 0

function startChoice() {
  choiceStartedAt = performance.now()
}

function respond(response: ButtonColor, done: () => void) {
  if (answered.value) return
  answered.value = true
  correct.value = response === props.target
  logResponse({
    trial: props.trialNumber,
    target: props.target,
    response,
    correct: correct.value,
    rt: Math.round(performance.now() - choiceStartedAt),
  })
  if (correct.value) bonus.addPoints(1)
  done()
}
</script>

<template>
  <ESequence name="trial" class="text-center mt30">
    <EPage name="choice" @mounted="startChoice" v-slot="{ done }">
      <div>Click the {{ target }} button.</div>
      <div class="mt3 flex flex-wrap justify-center items-center gap4">
        <PButton
          v-for="color in buttonColors"
          :key="color"
          :value="color"
          :color="color"
          :disabled="answered"
          @click="respond(color, done)"
        />
      </div>
    </EPage>

    <EPage name="feedback" class="text-3xl" :duration="params.feedbackMs">
      <div :class="correct ? 'text-green' : 'text-red'">{{ correct ? 'correct!' : 'incorrect.' }}</div>
    </EPage>
  </ESequence>
</template>
