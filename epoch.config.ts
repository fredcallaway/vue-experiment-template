import { defineEpochConfig } from './core/composables/useConfig'

export default defineEpochConfig({
  title: 'Psychology Experiment',
  icon: '/favicon.svg',
  // Keep through pre-posting fixes and unchanged-code batches. Bump for procedure/analysis changes after posting.
  version: '0.1',
  // Replace with a real researcher email; the placeholder blocks production builds and deployments.
  contactEmail: 'yourEmailAddress@fakeDomain.foo',
  completion: {
    mode: 'prolific',
  },
})
