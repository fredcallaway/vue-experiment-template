## Setup

Install [bun](https://bun.com/) if you don't have it. You can also use vanilla node with npm or pnpm if you prefer. Bun is much faster at installing packages.

```
curl -fsSL https://bun.sh/install | bash
```

```
bun install
bun dev
```

### Development environment

Use VSCode or Cursor with the following extensions:
- UnoCSS
- Vue.js
- ESLint

### Configure

See epoch.config.ts. You'll know you're done when you stop getting linter errors. You don't need to do this until you're ready to deploy though.

### Deploy to Firebase


```
firebase login
firebase init hosting database
firebase apps:create web
# run the printed command: firebase apps:sdkconfig WEB 1:6683982...
firebase deploy
```

## Gotchas

- you lose reactivity when destructuring a reactive object (e.g. `useConfig()`)


## Misc

https://icon-sets.iconify.design/
https://icones.js.org/

## To document

- unocss
  - p-3
  - mt-1
  - btn-gray-sm
- 500 error
  - e.g. at http://localhost:3000/_nuxt/composables/useEpoch.ts?t=1752573119649:36:12
  - the line number at the end is what you want
- devtools
  - I installed https://devtools.vuejs.org/ but not sure it was necessary
  - the Render Tree tab is the most useful