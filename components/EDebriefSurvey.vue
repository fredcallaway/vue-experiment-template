<script lang="ts" setup>
import type { SurveyPage } from '~/core/components/epochs/ESurveySequence.vue'

const pages: SurveyPage[] = [
  {
    id: 'difficulty',
    prompt: 'How difficult was the experiment?',
    options: ['too easy', 'just right', 'too hard'],
  },
  {
    id: 'fun',
    prompt: 'How fun was the experiment?',
    options: ['worse than average', 'typical', 'better than average'],
  },
  {
    id: 'feedback',
    kind: 'text',
    prompt: 'Do you have any other feedback?',
    placeholder: 'Optional',
  },
]
</script>

<template>
  <div w-600px mx-auto>
    <h1>You're done!</h1>

    <p>
      Thanks for participating! We have a few quick questions before you go.
    </p>

    <ESurveySequence name="Survey" :pages="pages" />
  </div>
</template>
