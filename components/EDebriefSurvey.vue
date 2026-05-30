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
