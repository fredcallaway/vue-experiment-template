## Setup

Install [bun](https://bun.com/) if you don't have it. You can also use vanilla node with npm or pnpm if you prefer. Bun is much faster at installing packages.

```
curl -fsSL https://bun.sh/install | bash
```

Then install dependencies and start the development server.

```
bun install
bun dev
```

The experiment will then be available at http://localhost:3030. If you're already hosting a site on port 3030, it will automatically use a different port; check the command output.


### Firebase

*Note: you don't actually need to do this until you're ready to deploy your experiment.*

We use firebase for hosting and database. Start by installing the firebase CLI and logging in. You will need to make a firebase account at this point if you haven't already.

```
bun install -g firebase-tools
firebase login
```

Next, initialize hosting. It will ask for a project identifier; this will determine your domain name so **don't use an identifier that participants shouldn't see.** Other than that, you can just accept the default values.

```
firebase init hosting
```

Next, initialize the database. Enter **NO** when the `firebase init hosting` command asks about **GitHub deploys**.

```
firebase init database
```

Next, run the following commands to reset/update configuration files.

```
git checkout firebase.json database.rules.json
firebase apps:create web
firebase apps:sdkconfig WEB > firebase.config.json
```

Deploy the database and website.

```
bun run deploy
```

Copy the "Hosting URL" and set the url parameter in epoch.config.ts
(this should be automated in future versions).

Finally, commit your configuration files. **Note:** you may get a warning from GitHub about an exposed secret (the firebase apiKey). This is a false alarm; the api key is intended to be public.

```
git add .firebaserc firebase.config.json epoch.config.ts 
git commit -m 'firebase configuration'
```


### Development environment

I strongly recommend using VSCode or Cursor with the following extensions:
- UnoCSS
- Vue.js
- ESLint

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