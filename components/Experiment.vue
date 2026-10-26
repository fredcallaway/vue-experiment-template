<script lang="ts" setup>
import { logEvent } from '../core/composables/logEvent'
import { useBonus } from '../core/composables/useBonus'
import { defineWindowSize } from '../core/composables/windowEnforcer'
import { repeat } from '../core/utils/array'
import { random } from '../core/utils/random'
import EButtonTrial, { buttonColors } from './EButtonTrial.vue'


logEvent('experiment.begin')

defineWindowSize({
  width: 850,
  height: 650,
})

const bonus = useBonus()
bonus.centsPerPoint = 5

const trials = random.shuffle(repeat(buttonColors, 10)).map(color => ({ color }))


</script>

<!-- if you include the line below anywhere in your template, the world may explode -->
<!--v-if-->

<template>
<div class="relative wfull hfull p3">

  <ESequence name="experiment" ref="experiment">
    
    <EContinue class="mt10 text-center" button>
      Hello. It is me, the template experiment. <br>
      I live in <code>components/Experiment.vue</code>
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
      <EButtonTrial :trial-number="step + 1" :target="trials[step].color" />
    </ERepeat>

    <EClickTest :params="{ boardWidth: 600, boardHeight: 500 }" />

    <EHierarchicalSurveyExample />

    <EDebriefSurvey />
  
    <ECompletion />
  </ESequence>
</div>
</template>
