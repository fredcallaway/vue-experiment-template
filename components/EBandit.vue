<script lang="ts">

export type FSM = {
  transition: number[][]
  reward: number[]
  initial: number[]
}

export type SimpleFSM = {
  t: number,
  r: number,
}

export type ArmDef = FSM | SimpleFSM | number

const makeFSM = (def: ArmDef): FSM => {
  // just provide reward probability
  if (typeof def === 'number') {
    return {
      transition: [[1]],
      reward: [def],
      initial: [1],
    }
  // binary FSM with symetric transition and reward probabilities
  } else if ('t' in def) {
    const {t, r} = def
    return {
      transition: [
        [ t, 1-t ],
        [ 1-t, t ]
      ],
      reward: [ r, 1-r ],
      initial: [ 0.5, 0.5 ]
    }
  // full FSM definition
  } else if ('transition' in def) {
    return def
  } else {
    throw new Error('Invalid arm definition')
  }
}

export type BanditProps = {
  horizon: number
  arms: ArmDef[]
  preFeedbackTime?: number 
  feedbackTime?: number
  doneTime?: number
  keys?: Key[]
  practice?: boolean
  example?: boolean
  highReward?: number
  lowReward?: number
  hideTokens?: boolean
  hidePayoffs?: boolean
  description?: string
}

</script>

<script lang="ts" setup>

// USE COMPOSABLES
const E = useEpoch('bandit') // always call useEpoch first; other composables use it as context
const bonus = useBonus()
const { sleep, onMountedAsync } = useLocalAsync()

// DEFINE PROPS AND CONSTANTS
const props = defineProps<BanditProps>()

const feedbackTime = props.feedbackTime ?? 800
const preFeedbackTime = props.preFeedbackTime ?? 800
const choiceTime = preFeedbackTime
const waitTime = preFeedbackTime - choiceTime
const highReward = props.highReward ?? 1
const lowReward = props.lowReward ?? -1
const doneTime = props.doneTime ?? 0

const hideTokens = false
const hidePayoffs = true
const machines = props.arms.map(makeFSM)



const weightedChoice = (probs: number[]) => {
  assert(probs.length > 0, 'probs must be a non-empty array')
  const total = probs.reduce((sum, prob) => sum + prob, 0)
  const rand = random.float() * total
  let cumulative = 0
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i]
    if (rand <= cumulative) return i
  }
  return probs.length - 1
}

// DEFINE REACTIVE STATE AND LOGIC
const S = reactive({
  currentReward: null as boolean | null,
  chosenArm: null as number | null,
  trialsRemaining: 0,
  phase: 'input' as 'input' | 'choice' | 'wait' | 'feedback' | 'done',
  state: machines.map(arm => weightedChoice(arm.initial)),
  wins: fill(0, machines.length),
  losses: fill(0, machines.length),
})

const getReward = (arm: number) => {
  return random.float() < machines[arm].reward[S.state[arm]]
}

const updateState = () => {
  for (let arm = 0; arm < machines.length; arm++) {
    S.state[arm] = weightedChoice(machines[arm].transition[S.state[arm]])
  }
}


// DEFINE PARTICIPANT INTERFACE
const P = useParticipant('Bandit')
const validKeys = props.keys ?? (
  machines.length == 1 ? ['F'] :
  machines.length == 2 ? ['F', 'J'] :
  machines.map((_, i) => (i + 1).toString())
)


onMountedAsync(async () => {
  if (useAttrs().disabled !== undefined) {
    S.trialsRemaining = props.horizon
    return
  }
  logEvent('bandit.initialize', props)


  if (!hideTokens) {
    // animate adding tokens
    for (let i = 0; i < props.horizon; i++) {
      S.trialsRemaining++
      await sleep(50)
    }
  } else {
    S.trialsRemaining = props.horizon
  }


  while (S.trialsRemaining > 0) {
    updateState()

    S.phase = 'input'
    const {key, rt} = await P.promiseKeyPress(validKeys as Key[])
    
    S.phase = 'choice'
    const arm = validKeys.indexOf(key)
    S.chosenArm = arm
    S.trialsRemaining--
    const reward = getReward(arm)
    S.currentReward = reward
    logEvent('bandit.trial', { 
      arm, 
      reward,
      rt,
    })
    await sleep(choiceTime)
    if (waitTime > 0) {
      S.phase = 'wait'
      await sleep(waitTime)
    }

    if (reward) {
      S.wins[S.chosenArm]++
    } else {
      S.losses[S.chosenArm]++
    }

    S.phase = 'feedback'
    await sleep(feedbackTime)
    bonus.addPoints(reward ? highReward : lowReward)
    S.chosenArm = null
    S.currentReward = null
  }
  await sleep(doneTime)
  E.done()
})

const {chosenArm, phase, currentReward, trialsRemaining} = toRefs(S)

</script>

<template>
<div>
  <div flex="~ row gap-10 justify-center items-center" mx-auto>
    <!-- banks -->
    <div flex="~ col justify-center">
      <div v-if="!hideTokens" class="bank tokens" w35 >
        <div>Tokens</div>
        <div h50>
          <Token v-for="i in trialsRemaining" :key="i" />
        </div>
      </div>
    </div>

    <!-- machines / arms -->
    <div class="machines-section" flex-center gap-10>
      <div v-for="(_, index) in arms" :key="index" w61>
        <div text="lg" mt-2 text-gray-300 text-center :class="{'opacity-0': validKeys[index] === 'NONE'}">
          press {{ validKeys[index].toUpperCase() }}
        </div>
        
        <!-- machine -->
        <div wfull h50 border-4 flex-center flex-col gap-5 box-border relative
          :class="highReward > 2 ? 'bg-amber-4' : 'bg-gray-500'"
        >
          <div v-if="!hidePayoffs" l1 t1 border-2 p0.5 bg-white >
            <Reward :scale=1.3 :value=lowReward  />
          </div>
          <div v-if="!hidePayoffs" r1 t1 border-2 p0.5 bg-white >
            <Reward :scale=1.3 :value=highReward  />
          </div>
          <!-- input -->
          <div circle-10 border-2 flex-center
            :bg="chosenArm === index && ['wait', 'feedback'].includes(phase) ? 'gray-400' : 'white'"
          > 
            <Token v-if="chosenArm === index && phase === 'choice'" />
          </div>

          <div w-20 h-14 border-2 flex-center
            :bg="chosenArm === index && phase === 'feedback' ? 'white' : 'gray-400'"
          >
            <Reward v-if="chosenArm === index && phase === 'feedback'" :scale="1.8" 
              :value="currentReward ? highReward : lowReward" />
          </div>
          
        </div>

        <!-- earnings -->
        <!-- <div v-if="!hideEarnings" border-4 mt5 p1 wfull grid grid-cols-1 gap-1 box-border>
          <div h12>
            <Reward v-for="i in range(S.wins[index])" :key="i" :value="highReward" />
          </div>
          <div h12>
            <Reward v-for="i in range(S.losses[index])" :key="i" :value="lowReward" />
          </div>
        </div> -->
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>

.bank {
  div:first-child {
    @apply font-bold text-center mx-auto
  }

  div:last-child {
    @apply p-1 auto-rows-25px;
    border: 4px solid black;
  }
}

/* Visibility control classes */
/* .hide-banks .banks-section {
  opacity: 0;
}

.hide-machines .machines-section {
  opacity: 0;
}

.hide-tokens .bank:first-child {
  opacity: 0;
}

.hide-earnings .bank:last-child {
  opacity: 0;
} */
</style>