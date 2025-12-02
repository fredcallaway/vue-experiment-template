<script lang="ts" setup>
import type { BanditProps } from './EBandit.vue'

logEvent('experiment.begin')

defineWindowSize({
  width: 850,
  height: 650,
})

// wait for loggers to load
await new Promise(resolve => setTimeout(resolve, 10))

const bonus = useBonus()
bonus.centsPerPoint = 3

const initialBonus = 10

const makeBlock = (description: string, t1: number, t2: number, r1: number, r2: number): BanditProps => {
  return {
      description,
      horizon: 40,
      arms: random.shuffle([
        {t: t2, r: r2},
        {t: t1, r: r1},
      ])
  }
}

// const transitionProbs = [0.0, 0.167, 0.333, 0.667, 0.837, 1.0]
const transitionProbs = [0.0, 0.333, 0.667, 1.0]

const { choice, permute } = useConditions()
const { tSame, tInv } = choice({
  tSame: transitionProbs,
  tInv: transitionProbs,
})

const blocks = [
  makeBlock('adversarial', 0, 1, 1, 0.25),
  ...permute('orderSameInv', [
    makeBlock('t-equal', tSame, tSame, 0.85, 0.85),
    makeBlock('t-inverse', tInv, 1-tInv, 0.85, 0.85),
  ]),
  // makeBlock('vanilla', 1, 1, 0.85, 0.85),
]

const currentEpoch = useCurrentEpoch()

const showBonus = computed<boolean>(() => {
  const E = currentEpoch.value
  if (E.id.includes('main')) return true
  if (E.id.includes("instructions")) {
    const E = findEpoch(E => E._name == "instructions") as IndexableEpoch | null
    if (!E) return false
    return E.step.value >= 4
  }
  return false
})

</script>

<!-- if you include theline below anywhere in your template, the world will explode -->
<!--v-if-->

<template>
<div mt-10px w800px relative>
  <div v-if="showBonus" l1 top--1 text-xl font-bold>
    Bonus: ${{ bonus.dollars.toFixed(2) }}
  </div>
  <ESequence name="experiment" ref="experiment">
    <EConsent> <ConsentContent /> </EConsent>
  
    <EInstructions mt-15 v-slot="{ enableNext }">

      <EPage>
        <header>
          In this experiment, you will be playing a game with machines like the one below.
        </header>
        <EBandit disabled :arms="[1]" :horizon="1" hide-tokens :keys="['NONE']" />
        <EDelay :ms="2000" :done="enableNext" />
      </EPage>

      <EPage @mounted="bonus.points = 0">
        <header>
          To use the machine, you need to enter a token. Press <strong>F</strong> to put a token in the machine.
        </header>
        <EBandit example :arms="[1]" :horizon="1" />
      </EPage>

      <EPage @mounted="bonus.points = 1">
        <header>
          Nice! The machine gave you a prize. Each prize is worth <span class="text-green-600 font-bold">{{ bonus.pointValueString }}</span>!

          <div w-100 mx-auto mt-8 scale-200 flex="~ row gap-2 justify-center items-center">
            <Reward scale-120 :value="1" />
            <div font-bold ml-1>=</div>
            <div text-3xl text-green-600 font-bold>{{ bonus.toCentsSymbol(1) }}</div>
          </div>
          <Arrow top--8 l13 text-green-600 :rot="5" :length="80"/>
        </header>
        <EBandit disabled :arms="[1]" :horizon="0" :initial-state="[[1, 0]]" :keys="['NONE']" />
        <EDelay :ms="2000" :done="enableNext" />
      </EPage>

      <EPage @mounted="bonus.points = 1">
        <header>
          Here's another machine. Press <strong>J</strong> to put a token in this one.
        </header>
        <EBandit example :arms="[1, 0]" :horizon="1" :initial-state="[[1, 0], [0, 0]]" :keys="['NONE', 'J']" />
      </EPage>

      <EPage @mounted="bonus.points = 0">
        <header>
          Oh no! That machine gave you an anti-prize. Each of those <em>costs</em> you {{ bonus.pointValueString }}.
        </header>
        <EBandit disabled :arms="[1, 0]" :horizon="0" :initial-state="[[1, 0], [0, 1]]" :keys="['NONE', 'NONE']" />
        <Arrow top--8 l13 text-red-600 :rot="5" :length="80"/>
        <EDelay :ms="2000" :done="enableNext" />
      </EPage>

      <EPage @mounted="bonus.points=0">
        <header>
          On every round, you'll be given a budget of tokens and a new pair of machines.
          <b>Take note!</b> Each machine is unique. You can't assume that the new machines
          will be similar to previous ones.
        </header>
        <EBandit disabled :arms="[1, 0]" :horizon="10" :keys="['NONE', 'NONE']" />
        <EDelay :ms="5000" :done="enableNext" />
      </EPage>

      <EPage @mounted="bonus.points = initialBonus">
        <header>
          Simple right? Feel free to review the instructions before you begin.
          We've started you off with ${{ bonus.dollars.toFixed(2) }} for your time so far.
        </header>
        <EButtons values="Start" />
      </EPage>
    </EInstructions>
  
    <ERepeat name="main" :count="blocks.length" v-slot="{ step }">
      <ESequence name="block">
        <EContinue text-center>
          <h1>Round {{ step + 1 }} of {{ blocks.length }}</h1>
          <p>
            There are two new machines for you to play.<br>
            {{ bonus.report }}.
          </p>
        </EContinue>
        <EBandit v-bind="blocks[step]" mt-15 :done-time="1000" />
      </ESequence>
    </ERepeat>
  
    <ESurvey />
  
    <ECompletion />
  </ESequence>
</div>
</template>

