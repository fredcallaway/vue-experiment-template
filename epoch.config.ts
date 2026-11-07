import { defineEpochConfig } from './core/composables/useConfig'

export default defineEpochConfig({
  title: 'Psychology Experiment',
  icon: '/favicon.svg',
  // Replace with a real researcher email; the placeholder blocks production builds and deployments.
  contactEmail: 'yourEmailAddress@fakeDomain.foo',
  completion: {
    mode: 'prolific',
  },
})
