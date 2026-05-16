<script lang="ts" setup>
import type { SurveyPage } from '~/core/components/epochs/ESurveySequence.vue'

const pages: SurveyPage[] = [
  {
    id: 'difficulty',
    prompt: 'How difficult was the experiment?',
    options: ['too easy', 'just right', 'too hard'],
  },
  {
    id: 'interface',
    kind: 'multi',
    intro: `
      The next questions ask about the interface you just used.
      Please choose the answer that best matches your experience.
    `,
    sharedPrompt: 'How much do you agree with this statement?',
    options: ['strongly disagree', 'disagree', 'neutral', 'agree', 'strongly agree'],
    prompts: [
      'The task instructions were clear.',
      'The buttons responded the way I expected.',
      {
        id: 'interface-confidence',
        prompt: 'I felt confident about what to do next.',
        flags: ['CONFIDENCE'],
      },
    ],
  },
  {
    id: 'attention',
    kind: 'multi',
    intro: `
      These questions ask about attention and pacing.
      There are no right or wrong answers.
    `,
    sharedPrompt: 'How often did this happen during the experiment?',
    options: ['never', 'rarely', 'sometimes', 'often', 'always'],
    prompts: [
      'I lost track of what I was supposed to click.',
      'I felt rushed.',
      '[CATCH] I completed the experiment while asleep.',
    ],
  },
]
</script>

<template>
  <div w-700px mx-auto>
    <ESurveySequence name="GroupedSurveyExample" :pages="pages" mt-20 :fadeMs=200 />
  </div>
</template>
