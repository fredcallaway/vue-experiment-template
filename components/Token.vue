<script lang="ts" setup>

const props = defineProps<{
  large?: boolean
}>()

const size = computed(() => props.large ? 'text-4xl' : 'text-2xl')

</script>

<template>
  <!-- https://icones.js.org/collection/mdi -->
  <!-- <span class="i-mdi-alpha-t-circle-outline text-blue-600" :class="size" /> -->
  <span  
    circle-5 m0.2 mx-0.6
    inline-flex items-center justify-center
    text-white rounded-full font-bold
    bg-blue-500 text-sm
    >
    T
  </span>
</template>