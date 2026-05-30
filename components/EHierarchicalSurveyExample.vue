<template>
  <ESurveyWrapper name="GroupedSurveyExample">
    <ESurveyMultiButtons
      name="interface"
      intro="
        The next questions ask about the interface you just used.
        Please choose the answer that best matches your experience.
      "
      shared-prompt="How much do you agree with this statement?"
      options="strongly disagree, disagree, neutral, agree, strongly agree"
      :prompts="[
        'The task instructions were clear.',
        'The buttons responded the way I expected.',
        {
          prompt: 'I felt confident about what to do next.',
          flags: ['CONFIDENCE'],
        },
      ]"
    />
    <ESurveyMultiButtons
      name="attention"
      intro="
        These questions ask about attention and pacing.
        There are no right or wrong answers.
      "
      shared-prompt="How often did this happen during the experiment?"
      options="never, rarely, sometimes, often, always"
      :prompts="[
        'I lost track of what I was supposed to click.',
        'I felt rushed.',
        '[CATCH] I completed the experiment while asleep.',
      ]"
    />
  </ESurveyWrapper>
</template>
