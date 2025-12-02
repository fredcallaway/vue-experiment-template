// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Extend the epoch-framework layer
  extends: ['./core'],

  // // Project-specific component registration
  // components: [
  //   {
  //     path: '~/components',
  //     pathPrefix: false,
  //   },
  // ],
  
  css: [
    '~/assets/style.css',
  ],

  compatibilityDate: '2025-05-15',
})
