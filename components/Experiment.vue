<script lang="ts" setup>

logEvent('experiment.begin')

defineWindowSize({
  width: 850,
  height: 650,
})

const bonus = useBonus()
bonus.centsPerPoint = 5

const colors = ['orange', 'blue'] as const  // `as const` allows typescript to confirm these colors are supported by PButton
const trials = random.shuffle(repeat(colors, 10)).map(color => ({color}))
const correct = ref(false)


</script>

<!-- if you include the line below anywhere in your template, the world may explode -->
<!--v-if-->

<template>
<div relative wfull hfull p3 >

  <ESequence name="experiment" ref="experiment">
    
    <EContinue button mt10 >
      Hello. It is me, the template experiment. <br>
      I live in <kbd>components/Experiment.vue</kbd> <br>
      <b>I AM BEING SIMPLIFIED!</b> (this is the simplified branch)
    </EContinue>

    <EConsent> <ConsentContent /> </EConsent>

    <ENavigableSequence v-slot="{ enableNext }" header=Instructions >
      <EPage @mounted="enableNext" name="welcome">
        <div class="prompt !max-w-130" >
          Thanks for participating in our experiment! We'll start with some instructions.
          Navigate with arrow keys or the buttons at the top.
        </div>
      </EPage>

      <EContinue button="Start">
        <div class="prompt">
          In this experiment, you will click buttons. For example, the one below.
          Click it.
        </div>
      </EContinue>

      <EPage name="click" v-slot="{ state }" >
        <div class="prompt" v-if="state.choice">
          You chose {{ state.choice }}.
        </div>
        <div class="prompt" v-else>
          Sometimes, there might be multiple buttons. I hate decisions!
        </div>
        <PButtons :disabled="R.isDefined(state.choice)" values="left right" classes="btn-blue btn-red" class="gap-20 mt-20" 
          @click="(val) => {
            state.choice = val
            enableNext()
          }"
        />
      </EPage>

      <EPage name="key" v-slot="{ done }">
        <div class="prompt">
          You might also press keys. Press the <kbd>K</kbd> key to continue.
        </div>
        <PKey keys="K" @press="done" />
      </EPage>
      
      <EContinue button="Start" >
        <div class="prompt">
          That's pretty much it! Have fun!
        </div>
      </EContinue>

    </ENavigableSequence>
  
    <ERepeat name="main" :count="trials.length" v-slot="{ step }" >
      <div text-xl font-bold flex justify-between >
        <div>
          Bonus: ${{ bonus.dollars.toFixed(2) }}
        </div>
        <div>
          Trial: <span w-6 text-right inline-block >{{ step + 1 }}</span> / {{ trials.length }}
        </div>
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
        
        <EPage name="feedback" :duration="1000" text-3xl>
          <div text-green v-if="correct">
            correct!
          </div>
          <div text-red v-else>
            incorrect.
          </div>
        </EPage>
        
      </ESequence>
    </ERepeat>

    <EClickTest :params="{ boardWidth: 600, boardHeight: 500 }" />

    <EHierarchicalSurveyExample />

    <EDebriefSurvey />
  
    <ECompletion />
  </ESequence>
</div>
</template>
