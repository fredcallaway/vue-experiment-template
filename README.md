## Installation

Open a terminal and navigate to a directory where you want the project to live. Run e.g. `DEST_DIR=my-sweet-experiment` to set the directory to clone into. Then paste the following code.

```bash
# Configuration.
TEMPLATE_REPO="https://github.com/fredcallaway/vue-experiment-template.git"
: "${TEMPLATE_BRANCH:=simplified}"
: "${DEST_DIR:=vue-experiment}"

# Clone the template branch, including submodules
git clone --branch "$TEMPLATE_BRANCH" --recurse-submodules "$TEMPLATE_REPO" "$DEST_DIR"
cd "$DEST_DIR"

# Replace the template history with a single fresh root commit
NEW_ROOT_COMMIT="$(git commit-tree HEAD^{tree} -m "Initial commit from $TEMPLATE_REPO#$TEMPLATE_BRANCH")"
git reset --soft "$NEW_ROOT_COMMIT"
git branch -M main

# Remove the template remote and branch tracking
git branch --unset-upstream 2>/dev/null || true
git remote remove origin 2>/dev/null || true
git remote remove upstream 2>/dev/null || true
```

You can then create a github repo for your own project. If you have the [github CLI](https://cli.github.com/) installed, you can use `gh repo create`. Otherwise, create it on github.com and run `git remote set origin YOUR_GITHUB_URL`.


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

TODO: create an AGENT.md for the template.

# FAQ

## I'm getting an error that I don't understand

If you're getting a confusing error that doesn't seem to be related to your own code,
it's most likely a problem with the **nuxt cache**. Run this:
```
pkill bun; rm -rf .nuxt; bun run dev
```

If that doesn't work, try reinstalling all packages next:
```
pkill bun; rm -rf node_modules; rm -rf .nuxt; bun i; bun run dev
```

If it's still not working, use git to checkout a previous commit that was working. 
- If the old version *does not work*, skip to the next section.
- If the old version *does work*, then it's probably a bug in your code or the template. If you think it's the latter OR you haven't fixed it in 10 minutes, [post an issue on github](https://github.com/fredcallaway/vue-experiment-template/issues).


### MFILE and/or EBADF errors

This can happen if you have many extraneous files, for example a python virtual environment. Move those into a separate directory. If it persists (even after clearing .nuxt and node_modules), you might need to restart your computer.

### Error: [nuxt] A composable that requires access to the Nuxt instance was called outside of a plugin

Try removing the nuxt cache.
