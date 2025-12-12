## Installation

Open a terminal and navigate to a directory where you want the project to live. Change MY_EXPERIMENT to something that makes sense for you.

```
git clone github.com/fredcallaway/vue-experiment-template MY_EXPERIMENT
cd MY_EXPERIMENT
git remote rename origin upstream
```

Then create a github repo for your own project. If you have the [github CLI](https://cli.github.com/) installed, you can use `gh repo create`. Otherwise, create it on github.com and run `git remote set origin YOUR_GITHUB_URL`.


## Setup

*Note: All the commands assume that you are in the directory that contains this README.md file.*

Install [bun](https://bun.com/) if you don't have it. You can also use vanilla node with npm or pnpm if you prefer. Bun is much faster at installing packages.

```
curl -fsSL https://bun.sh/install | bash
```

Then install dependencies and start the development server.

```
bun install
bun dev
```

The experiment will then be available at http://localhost:3030. If you're already hosting a site on port 3030, it will automatically use a different port; check the command output. You can configure the port in package.json.

### Firebase

*Note: you don't actually need to do this until you're ready to deploy your experiment.*

#### Create your first project

We use firebase for hosting and database.

Go to https://firebase.google.com/ and make an account. **DO NOT USE YOUR .EDU EMAIL** because your school may impose restrictions on your google cloud usage. Then create a project for your experiment.

1. Ensure you're logged in to a standard google (@gmail.com) account. Firebase will automatically use your currently active google account. If you're signed in on a .edu account, it may or may not work depending on your school.
2. Go to console.firebase.google.com
3. Click  "get started by setting up a firebase project"
4. Enter a new name not used before and check I agree to the TOS

*Note: for subsequent experiments, you should be able to skip this step and create new projects via the CLI.*

After creating your project, install the firebase CLI and log in.

```
bun install -g firebase-tools
firebase login
```

#### Set up web hosting

Next, initialize web hosting for your new project. 

```
firebase init hosting
```

Choose **Use an existing project** and select the project you just created on the web console. Then make the following selections:


✔ What do you want to use as your public directory? **.output/public**
✔ Configure as a single-page app (rewrite all urls to /index.html)? **Yes**
✔ Set up automatic builds and deploys with GitHub? **No**


> Pro-tip: for your future projects, you can skip the web console and create a new project from the command line by choosing "Create a new project" at the first prompt.


#### Set up database

```
firebase init database
```

Accept all the defaults (hit enter on every prompt). We will reset database.rules.json later so it doesn't matter if you accept or deny the overwrite.


#### Create web app and update configuration files

```
firebase apps:create web web
rm -f firebase.config.json
firebase apps:sdkconfig WEB -o firebase.config.json
git checkout firebase.json database.rules.json
rm -f public/index.html
```

Deploy the database and website.

```
bun run deploy
```

Copy the "Hosting URL" and paste it in as the url parameter in epoch.config.ts
(this may be automated in future template versions).

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
- Nuxtr
