# Vue Experiment Template

An end-to-end system for building and running online experiments through [Prolific](https://www.prolific.com/), built with Vue and Nuxt. It provides:

- A hosted website and database through [Firebase](https://firebase.google.com/).
- Prolific study management, including recruitment, participant review, payments, and bonuses.
- An interactive experiment outline for jumping between sections while developing your task.
- Event recording and live previews of analysis tables that you can save as CSVs.
- Balanced condition assignment and optional session recordings through [PostHog](https://posthog.com/session-replay).
- Reusable components, working examples, and tools for your coding agent.

## Create your experiment

Ask your lab manager for your **experiment setup block**. It contains the settings and deployment credentials for your experiment. You do not need a Google or Firebase account. Keep the block private.

Install [Git](https://git-scm.com/downloads), [Bun](https://bun.com/docs/installation), and [Node.js LTS](https://nodejs.org/en/download). Your coding agent can help with this.

Open a terminal in the folder where you keep your projects and run:

```bash
curl -fsSLo create-experiment.mjs https://raw.githubusercontent.com/fredcallaway/vue-experiment-template/release/1.0/scripts/create-experiment.mjs
node create-experiment.mjs
```

When prompted, paste the complete setup block, including its BEGIN and END lines. The pasted text is hidden. Setup creates your project folder, installs dependencies and the Firebase CLI, configures your experiment, and checks that it compiles. Credentials are saved once; you can use the project from any terminal afterward.

If you prefer to have your agent do the setup, paste this into a new chat, followed by the block from your manager:

```text
Create my experiment using the setup instructions at
https://github.com/fredcallaway/vue-experiment-template/blob/release/1.0/README.md#create-your-experiment
Run the installer with the setup block below. Keep its credentials private.
Read the new project's AGENTS.md, start the development server, and give me the local URL.
```

## Develop your experiment

Open the new project folder in your editor and start the app:

```bash
bun run dev
```

Open the local URL printed in the terminal. The app includes:

- **Docs** (`/docs`) — a guide to developing and running your study.
- **Develop** (`/dev`) — your experiment, with its outline, event log, and data views.
- **Examples** (`/examples/study` and `/examples/trial`) — working experiments and trial components.

Tell your agent what a trial should look like, what you want to manipulate, and what data you need. Use Develop to try the task and inspect its data before collecting participants. Your agent can also create a GitHub repository for your project.

## Run a study

Follow the in-app Docs to test your experiment, verify the data, and connect Prolific. Save and commit your changes before deployment; your agent can help with this.

In the **Prolific** interface, choose **Create New Study**, then **Deploy Website** to publish the experiment. When you are ready to recruit, use **Create & Publish Study**. The same interface lets you monitor recruitment, review submissions, and pay participants.

## For coding agents

Start with [AGENTS.md](AGENTS.md). Detailed CLI deployment and recovery procedures live in the [operations guide](core/operations/README.md).

To prepare the block a lab manager sends to a student, follow [Prepare a student handoff](core/docs/guide/student-handoff.md). This uses an already provisioned Firebase project.
