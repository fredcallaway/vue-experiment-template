<script lang="ts" setup>

const props = defineProps<{
  scale?: number
  value?: number
}>()

const { centsPerPoint } = useBonus()

const value = computed(() => props.value ?? 0)
const scale = computed(() => props.scale ?? 1)
const scaledSize = computed(() => {
  const baseSize = 1.3 // base size in rem
  const scale = props.scale ?? 1
  return `${baseSize * scale}rem`
})

const fmtValue = computed(() => ensureSign(value.value * centsPerPoint))

</script>

<template>
  <span v-if="value > 0" 
    inline-flex items-center justify-center
    text-white rounded-full font-bold
    bg-green-600
    :style="{ margin: (scale * 1) + 'px', width: scaledSize, height: scaledSize, fontSize: `${0.8 * scale}rem` }"
  >
    {{ fmtValue }}
  </span>
  <span v-else-if="value < 0"
    inline-flex items-center justify-center
    text-white rounded-full font-bold
    bg-red-600
    :style="{ margin: (scale * 1) + 'px', width: scaledSize, height: scaledSize, fontSize: `${0.8 * scale}rem` }"
  >
    {{ fmtValue }}
  </span>
  <span v-else
    inline-flex items-center justify-center
    text-gray-600 rounded-full font-bold
    :style="{ margin: (scale * 1) + 'px', width: scaledSize, height: scaledSize, fontSize: `${1.4 * scale}rem` }"
  >
    ✕
  </span>
</template>