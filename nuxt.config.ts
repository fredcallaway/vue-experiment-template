// https://nuxt.com/docs/api/configuration/nuxt-config

const posthog = {
  // Pull these values from https://app.posthog.com/settings/project
  projectId: 'NULL',
  publicKey: 'NULL', // "Project token"
  host: 'https://us.i.posthog.com', // Replace us with eu if "Region" is "EU Cloud" or similar

  // Create an api key at https://app.posthog.com/settings/user-api-keys 
  // Enable ONLY organization:read and error_tracking:write scopes
  // NOTE: this key is publicly exposed, but you can't do much with it so it's minimal risk
  personalApiKey: 'NULL',
}

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

  runtimeConfig: {
    public: {
      // used in [session].vue to make replay links
      posthogProjectId: posthog.projectId,
    },
  },

  posthogConfig: {
    publicKey: posthog.publicKey,
    host: posthog.host,
    sourcemaps: {
      enabled: true,
      envId: posthog.projectId,
      personalApiKey: posthog.personalApiKey,
    },
  },

  compatibilityDate: '2025-05-15',
})
