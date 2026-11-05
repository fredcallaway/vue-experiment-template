# Vue Experiment Template

An end-to-end system for building and running online experiments through [Prolific](https://www.prolific.com/), built with Vue and Nuxt. It provides:

- A hosted website and database through [Firebase](https://firebase.google.com/).
- Prolific study management, including recruitment, participant review, payments, and bonuses.
- An interactive experiment outline for jumping between sections while developing your task.
- Event recording and live previews of analysis tables that you can save as CSVs.
- Balanced condition assignment and optional session recordings through [PostHog](https://posthog.com/session-replay).
- Reusable components, working examples, and tools for your coding agent.

## Create your experiment

If you're reading this, Fred probably sent you an **experiment setup block**. It contains the settings and deployment credentials for your experiment. Keep the block private.

If you somehow found this independently, you'll need to set up Firebase yourself. See instructions [here](core/docs/guide/firebase-setup.md).

### Using an agent

Paste this into a new chat, followed by the block from your manager:

```text
Create my experiment using the setup instructions at
https://github.com/fredcallaway/vue-experiment-template/blob/release/1.0/README.md#create-your-experiment
Run the installer with the setup block below. Keep its credentials private.
Read the new project's AGENTS.md, start the development server, and give me the local URL.
```

### On your own

Install [Git](https://git-scm.com/downloads), [Bun](https://bun.com/docs/installation), and [Node.js LTS](https://nodejs.org/en/download) if you don't have them already.

Open a terminal in the folder where you keep your projects and run:

```bash
curl -fsSLo create-experiment.mjs https://raw.githubusercontent.com/fredcallaway/vue-experiment-template/release/1.0/scripts/create-experiment.mjs
node create-experiment.mjs
```

When prompted, paste the complete setup block, including its BEGIN and END lines. The pasted text is hidden. Setup creates your project folder, installs dependencies and the Firebase CLI, configures your experiment, and checks that it compiles. Credentials are saved once; you can use the project from any terminal afterward.

## Develop your experiment

Open the new project folder in a terminal or text editor and start the app:

```bash
bun run dev
```

Open the local URL printed in the terminal. The app includes:

- **Docs** (`/docs`) — a guide to developing and running your study.
- **Develop** (`/dev`) — your experiment, with its outline, event log, and data views.
- **Examples** (`/examples/study` and `/examples/trial`) — working experiments and trial components.

The Docs page will tell you everything else you need to know! There's also a handy tutorial mode, which you can activate by clicking the question in the top right of the page.

## For agents

Start with [AGENTS.md](AGENTS.md). Detailed CLI deployment and recovery procedures live in the [operations guide](core/operations/README.md).

When a lab manager asks for a setup block, follow [Prepare a student handoff](core/docs/guide/student-handoff.md). It covers creating a fresh Firebase project and returning the complete private block, with defaults for unspecified details.
