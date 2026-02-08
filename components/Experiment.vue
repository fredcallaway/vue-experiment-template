<script lang="ts" setup>

logEvent('experiment.begin')

defineWindowSize({
  width: 850,
  height: 650,
})

// wait for loggers to load
await new Promise(resolve => setTimeout(resolve, 10))

const bonus = useBonus()
bonus.centsPerPoint = 5

const colors = ['orange', 'blue'] as const  // `as const` allows typescript to confirm these colors are supported by PButton
const trials = random.shuffle(repeat(colors, 2)).map(color => ({color}))
const correct = ref(false)

</script>

<!-- if you include the line below anywhere in your template, the world may explode -->
<!--v-if-->

<template>
<div mt-10px w800px relative>

  <ESequence name="experiment" ref="experiment">
    <EConsent> <ConsentContent /> </EConsent>
  
    <EInstructions mt-15 v-slot="{ goNext }">

      <EPage>
        <header>
          In this experiment, you will click buttons. For example, the one below.
        </header>
        <PButton value="Start" @click="goNext" />
      </EPage>

    </EInstructions>
  
    <ERepeat name="main" :count="trials.length" v-slot="{ step }">
      <!-- show bonus at the top left -->
      <div text-xl font-bold>
        Bonus: ${{ bonus.dollars.toFixed(2) }}
      </div>
      <!-- a trial is a button choice followed by feedback -->
      <!-- note: you will usually create a separate component for your trials -->
      <ESequence name="trial" text-center mt30 >

        <EPage name="choice" v-slot="{ done }">
          <div>Click the {{ trials[step].color }} button.</div>
          <div mt3 flex-center gap4>
            <PButton v-for="color in colors" :key="color" :value="color" :color="color" @click="() => {
              correct = color == trials[step].color
              if (correct) {
                bonus.addPoints(1)
              }
              done()
            }" />
          </div>
        </EPage>
        
        <EDelay name="feedback" :ms="1000" text-3xl>
          <div text-green v-if="correct">
            correct!
          </div>
          <div text-red v-else>
            incorrect.
          </div>
        </EDelay>
        
      </ESequence>
    </ERepeat>
  
    <EDebriefSurvey />
  
    <ECompletion />
  </ESequence>
</div>
</template>

