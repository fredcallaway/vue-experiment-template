# Vue Experiment Template

An opinionated, end-to-end system for building and running online experiments through [Prolific](https://www.prolific.com/). Built with Vue and Nuxt, this template covers the full lifecycle of an experiment, from study design to participant payments. It provides:

- **A website and database** through [Firebase](https://firebase.google.com/), free within its usage limits.
- **Prolific study management** to create studies, monitor recruitment, and pay participants, with automatic bonus calculation and partial-completion detection.
- **An interactive experiment outline** that lets you jump to different sections in one click.
- **Real-time event recording**, with live previews of tidy analysis tables that sync to your computer as CSVs.
- **Balanced condition assignment**, with tools to replace incomplete assignments.
- **Tools for you and your coding agent:** reusable experiment components, working examples, agent-facing documentation, type checking, and automated browser tests.
- **Optional session recordings** through [PostHog](https://posthog.com/session-replay) to see how participants experienced the task.

Start with [installation](#installation) and [Firebase setup](#firebase-setup) below. Once the app is running, open `/docs` for the guide to developing and running a study, whether you write code or use an agent.

## Installation

Install [Git](https://git-scm.com/downloads), [Bun](https://bun.com/docs/installation), and the current [Node.js LTS](https://nodejs.org/en/download) if needed. Node is used by the Firebase CLI and browser-testing tools. Configure your Git name and email before creating the project; GitHub's [Git setup guide](https://docs.github.com/en/get-started/git-basics/set-up-git) covers this.

Open a terminal in the directory where you keep your projects. Choose a new directory name for `DEST_DIR`, then run:

```bash
DEST_DIR="my-experiment"
TEMPLATE_REPO="https://github.com/fredcallaway/vue-experiment-template.git"

# Clone the current lab release, including its pinned core submodule.
git clone --branch release/1.0 --recurse-submodules "$TEMPLATE_REPO" "$DEST_DIR"
cd "$DEST_DIR"

# Start your experiment's own history from the template's files.
NEW_ROOT_COMMIT="$(git commit-tree HEAD^{tree} -m "Initial commit from $TEMPLATE_REPO")"
git reset --soft "$NEW_ROOT_COMMIT"
git branch -M main
git branch --unset-upstream 2>/dev/null || true
git remote remove origin
```

Create an empty repository on [GitHub](https://github.com/new), without a README, license, or `.gitignore`. Copy its repository URL, replace `YOUR_GITHUB_URL` below, and connect it:

```bash
git remote add origin YOUR_GITHUB_URL
git push -u origin main
```

Run the remaining commands from your experiment's root directory, which contains this README. Install dependencies:

```bash
bun install
```

## Firebase setup

Firebase provides the hosted website and Realtime Database. Each experiment needs its own Firebase project. Complete this setup before recording test sessions or using the data and Prolific tools: the inherited `firebase.config.json` connects to the template's shared project, including during local development.

### Use a lab-managed project as a student

The lab administrator owns the Firebase project and completes the [administrator setup](#create-and-configure-a-project-as-administrator), including its service account. Students receive a configured experiment repository and a project-specific service-account JSON key.

Configure the key once per checkout, or ask your coding agent to do it:

```bash
bun run ops -- firebase-auth configure --key "/absolute/path/to/service-account.json"
```

This validates that the key belongs to the configured Firebase project and copies it into private Git metadata with owner-only permissions. The key and its CLI configuration stay outside tracked source and deployed assets. Keep the administrator's original key file private too.

After configuration, use `bun run dev`, `bun run ops -- deploy run`, and the dashboard's **Deploy Website** button normally from any terminal. These operations automatically load the project's key and isolate Firebase CLI credentials from cached human logins and tokens. The configuration persists across new shells and server restarts. Running the configuration command again replaces the key; the next operation uses it, including in an already running dashboard.

Continue with [developing the experiment](#develop-your-experiment) and [publishing the website](#publish-the-website). The key authorizes Hosting operations. Database access for participant recording, deployment tracking, and data tools is controlled separately by database rules; the current tracking/data adapters do not use this key. Database setup remains the administrator's responsibility.

### Create and configure a project as administrator

Complete steps 1–8 using the account that will retain ownership of the lab's project. Administrator provisioning uses your Google login; students use the service-account workflow above.

#### 1. Create or choose your Google account

Firebase uses a Google account; there is no separate Firebase password.

1. If you need an account, open [Google account creation](https://accounts.google.com/signup), choose personal use, and follow the prompts to choose a Gmail address and password. Complete any verification Google requests. You can also use an existing non-Gmail email address; Google's [account-creation guide](https://support.google.com/accounts/answer/27441) explains that option.
2. Choose the account that will own the lab's project. School-managed accounts may restrict Google Cloud access; settle project ownership before creating it. Students using the service-account workflow do not need individual project membership.
3. Open the [Firebase console](https://console.firebase.google.com/) and sign in. Check the profile icon to confirm the intended account, especially if your browser is signed into several Google accounts.

#### 2. Create your first Firebase project

1. Choose **Create a project**, enter your experiment's name, and review its generated **project ID**. The ID is distinct from the display name and cannot be changed after creation.
2. Accept the Firebase terms when prompted. Google Analytics and Gemini assistance are optional; they are not needed for this template.
3. Create the project and open its overview. Record the project ID from **Project settings → General**.
4. Start on the **Spark** plan. This template's static Hosting and default Realtime Database can use its free quotas without a payment method. Check [Firebase pricing](https://firebase.google.com/pricing) before planning collection. Linking a Cloud Billing account upgrades the project to the paid **Blaze** plan; upgrading is a separate decision. See [Firebase's plan explanation](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

#### 3. Install and sign into the Firebase CLI

```bash
bun install -g firebase-tools
firebase --version
firebase login
firebase login:list
firebase projects:list
```

The login command opens your browser. Select the same Google account you used in the console. Confirm that `projects:list` includes your new project. For an existing CLI login, `firebase login:add` adds another account and `firebase login:use your-account@gmail.com` selects it. See the [Firebase CLI guide](https://firebase.google.com/docs/cli) if installation or authentication fails.

Set the following variable to your project's actual ID, then link this checkout:

```bash
EXPERIMENT_FIREBASE_PROJECT_ID="your-project-id"
firebase use --add
```

Select your new project and enter `default` as its alias. This writes `.firebaserc`. Confirm the selected ID with `firebase use`. Keep this terminal open for the commands below; if you reopen it, set `EXPERIMENT_FIREBASE_PROJECT_ID` again.

#### 4. Create Realtime Database

1. In your Firebase project's console, open **Realtime Database** and choose **Create database**. This template uses Realtime Database, rather than Cloud Firestore.
2. Choose a database region appropriate for the lab's data requirements. Record the database URL shown after creation; its hostname depends on the region.
3. For a disposable setup project containing only synthetic data, choose **Test mode** and note when its rules expire. Test mode permits public reads and writes. For a research project, obtain the lab's approved database rules before recording participant data. See [Firebase's database setup and rules guide](https://firebase.google.com/docs/database/web/start).

The inherited `database.rules.json` also permits public reads and writes, until 2030. It is not a production access-control policy. Review and replace it with the lab's approved rules before any database-rules deployment. Hosting deployment below leaves database rules unchanged.

#### 5. Register the web app and replace its configuration

In **Project overview**, choose the web icon (`</>`), name the app, and select **Register app**. The template already includes the Firebase SDK and initializes it, so you only need the new configuration. Copy the **App ID** from **Project settings → General → Your apps**; it looks like `1:123456789:web:abcdef`.

```bash
EXPERIMENT_FIREBASE_APP_ID="your-web-app-id"
EXPERIMENT_FIREBASE_CONFIG_DIR="$(mktemp -d)"
firebase apps:sdkconfig WEB "$EXPERIMENT_FIREBASE_APP_ID" \
  --project "$EXPERIMENT_FIREBASE_PROJECT_ID" --out "$EXPERIMENT_FIREBASE_CONFIG_DIR/firebase.config.json"
cp "$EXPERIMENT_FIREBASE_CONFIG_DIR/firebase.config.json" firebase.config.json
```

The CLI downloads to a new temporary file; the copy command replaces the inherited configuration. Open `firebase.config.json` and check that `projectId`, `appId`, and `databaseURL` match your new project, app, and database. Replace the full configuration, including its API key and other identifiers. If `databaseURL` is missing, confirm that Realtime Database exists and retrieve the config again, or add its exact URL from the console. See [Firebase web-app setup](https://firebase.google.com/docs/web/setup).

The web configuration, including its API key, is intended to be public and can be committed. Database rules control access to data. Keep account credentials and private tokens out of Git.

#### 6. Configure Hosting

Run:

```bash
firebase init hosting --project "$EXPERIMENT_FIREBASE_PROJECT_ID"
```

If asked to select a project, use the existing project you just created. Choose:

- **Public directory:** `.output/public`
- **Configure as a single-page app:** Yes
- **Automatic builds/deploys with GitHub:** No
- **Overwrite an existing index.html:** No, if prompted

Inspect `firebase.json`. Its Hosting public directory should be `.output/public`, with a `**` rewrite to `/index.html`. Keep the existing `database.rules.json` reference. The template's generator produces the website in that public directory; Firebase initialization may create a temporary welcome page there, which generation replaces.

#### 7. Save the project configuration

Set `contactEmail` in `epoch.config.ts` to your real researcher address and set `version` for your planned participant cohort. Review your changes and commit:

```bash
git diff -- firebase.config.json firebase.json epoch.config.ts
git add .firebaserc firebase.config.json firebase.json epoch.config.ts
git commit -m "firebase: configure experiment project"
```

If a development server was running during setup, restart it so it loads your new configuration.

#### 8. Create the project's deployment service account

1. In [Google Cloud → IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts), select this experiment's project and create a dedicated account such as `student-deployer`. Enable the IAM API if prompted. See [Google's service-account creation guide](https://docs.cloud.google.com/iam/docs/service-accounts-create).
2. Grant that service account these roles on this project: **Firebase Hosting Admin** (`roles/firebasehosting.admin`) and **API Keys Viewer** (`roles/serviceusage.apiKeysViewer`). This pair was sufficient for the template's tracked static Hosting deployment; Firebase documents both in its [Hosting roles](https://firebase.google.com/docs/projects/iam/roles-predefined-product#hosting). These permissions cover deployment, while you retain responsibility for project creation, billing, and database rules.
3. Open the new service account, choose **Keys → Add key → Create new key**, select **JSON**, and download the key. See [Google's key-management guide](https://docs.cloud.google.com/iam/docs/keys-create-delete). Store it outside the experiment repository and transfer it securely to the student. Keep it out of Git, deployed files, and logs; delete its key in IAM when its deployment access is no longer needed.
4. Give the student the project ID, configured repository, and private key file. Configure it once with [the student setup command](#use-a-lab-managed-project-as-a-student). The committed Firebase web configuration is public; the downloaded service-account key is private.

The project configuration is used by the supported deployment commands and dashboard regardless of the terminal's Google login or Firebase token. Allow a short delay for newly created accounts or role grants to propagate before retrying an initial permissions failure. See the [operations guide](core/operations/README.md#configure-firebase-authentication-once) for credential storage and replacement details.

## Develop your experiment

Start the app:

```bash
bun run dev
```

Open the local URL printed in the terminal, normally [http://localhost:3030](http://localhost:3030). If that port is occupied, Nuxt may select another port. The following routes are relative to that URL:

- `/docs` — the researcher workflow, data recording/export, technical explanations, and publishing guidance.
- `/dev` — build and inspect your experiment with the outline, event log, and data views.
- `/examples/study` — a complete example experiment.
- `/examples/trial` — a trial component with response events and a component-local data view.

Your experiment lives at the root, especially `components/Experiment.vue`, the other files under `components/`, and `epoch.config.ts`. [AGENTS.md](AGENTS.md) routes coding agents to the [shared project guide](core/docs/guide/README.md) and [live example sources](core/internal/examples/README.md). Use the [styling guide](core/docs/guide/styling.md) for UnoCSS conventions.

For an editor, use VS Code or Cursor with the Vue.js, UnoCSS, ESLint, and Nuxtr extensions.

## Publish the website

After developing and checking the experiment, commit your changes in the experiment repository and any intentionally edited submodules. Deployment requires a clean checkout with matching submodule commits and a real contact email.

```bash
bun run ops -- deploy inspect
bun run ops -- deploy run
```

Inspection reports the project/site from `firebase.config.json` and `firebase.json`, source revision, and experiment version. Confirm the target before running deployment. Deployment generates the website, uploads static Hosting, verifies the hosted build, and records its SHA/version. It reports the Hosting URL and should finish with `state: "tracked"`.

The [operations guide](core/operations/README.md) explains version warnings, deployment recovery, and preparing recruitment. The in-app `/docs` guide explains posting, monitoring, payment, and data export. Publishing the website and posting a Prolific study are separate actions.

## Core versions and updates

`core/` is a Git submodule. Each experiment commit pins one exact core commit; cloning with `--recurse-submodules` retrieves that version. When opening an existing experiment clone, restore its recorded submodule version with:

```bash
git submodule update --init --recursive
```

For a deliberate template update, choose a reviewed core commit, consult [core/CHANGES.md](core/CHANGES.md) for required migrations, and have your coding agent apply and verify the update. Commit the adopted `core` pointer separately from experiment changes. Updating core can change experiment behavior, so test the experiment before collecting data with the new version.

## Troubleshooting

### Confusing Nuxt errors

Stop this project's development server with **Ctrl+C in its terminal**, then clear its generated cache and restart:

```bash
rm -rf .nuxt
bun run dev
```

If that fails, stop this server again, reinstall dependencies, and restart:

```bash
rm -rf node_modules .nuxt
bun install
bun run dev
```

These commands only remove generated files. Preserve your source changes when comparing against an earlier working commit. If you suspect a template bug, [open an issue](https://github.com/fredcallaway/vue-experiment-template/issues) with the error and steps to reproduce it.

### EMFILE or EBADF errors

Large unrelated directories inside the project, such as a Python virtual environment, can exhaust file watchers. Move them outside the project and restart its development server.

### A composable requires the Nuxt instance

Restart after clearing `.nuxt` as above. If the error persists, ask your coding agent to check where the composable is called; Vue/Nuxt composables that need component context belong inside setup or the appropriate plugin.
