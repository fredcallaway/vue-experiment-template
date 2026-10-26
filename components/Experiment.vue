<script lang="ts" setup>
import { logEvent } from '../core/composables/logEvent'
import { useBonus } from '../core/composables/useBonus'
import { defineWindowSize } from '../core/composables/windowEnforcer'
import { repeat } from '../core/utils/array'
import { random } from '../core/utils/random'


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
<div class="relative wfull hfull p3">

  <ESequence name="experiment" ref="experiment">
    
    <EContinue class="mt10 text-center" button>
      Hello. It is me, the template experiment. <br>
      I live in <code>components/Experiment.vue</code><br>
      <b>I AM BEING SIMPLIFIED!</b> (this is the simplified branch)
    </EContinue>

    <EConsent> <ConsentContent /> </EConsent>

    <EInstructions />
  
    <!-- Don't forget this! It prevents people from restarting your study -->
    <ENoReturn class="my30" />

    <ERepeat name="main" :count="trials.length" v-slot="{ step }">
      <div class="text-xl font-bold flex justify-between">
        <div>
          Bonus: ${{ bonus.dollars.toFixed(2) }}
        </div>
        <div>
          Trial: <span class="w-6 text-right inline-block">{{ step + 1 }}</span> / {{ trials.length }}
        </div>
      </div>
      <!-- a trial is a button choice followed by feedback -->
      <!-- note: you will usually create a separate component for your trials -->
      <ESequence class="text-center mt30" name="trial">

        <EPage name="choice" v-slot="{ done }">
          <div>Click the {{ trials[step].color }} button.</div>
          <div class="mt3 flex flex-wrap justify-center items-center gap4">
            <PButton
              v-for="color in colors"
              :key="color"
              :value="color"
              :color="color"
              @click="() => {
              correct = color == trials[step].color
              if (correct) {
                bonus.addPoints(1)
              }
              done()
            }"
            />
          </div>
        </EPage>
        
        <EPage class="text-3xl" name="feedback" :duration="1000">
          <div class="text-green" v-if="correct">
            correct!
          </div>
          <div class="text-red" v-else>
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
