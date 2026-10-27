# Running a study

You lead the development of your experiment, whether you write the code yourself or use a coding agent to implement it. This guide follows the whole process, from your study design to participant payments.

1. **Develop:** build the experiment and test the participant experience.
2. **Verify data:** record test sessions and check the data you will analyze.
3. **Post:** deploy the verified experiment and publish a Prolific study.
4. **Monitor:** follow recruitment and investigate incomplete sessions.
5. **Pay:** review submissions and pay participants, including bonuses.

A **study** is a recruitment run on Prolific. A **session** is one participant's attempt at your experiment. A **version** groups sessions collected with the same experiment procedure; a pilot and a revised experiment should have different versions.

The [Prolific pages](http://localhost:3031/prolific) connect submissions with sessions, and the [Data Viewer](http://localhost:3031/data) lets you explore the collected data by version or session.

## Developing your experiment

Start with your study design: instructions, trial structure, stimuli, response and timing rules, conditions, and payments. Decide what the analysis tables should contain as part of that design, so recording and preprocessing are built with the task.

If you use a **coding agent**, give it that specification and ask it to follow your project's `AGENTS.md`, read `core/docs/guide/README.md`, and build from the template's [working examples](http://localhost:3031/examples). Ask it to run type checks and browser tests and explain how it verified the requested behavior.

Open [Develop](http://localhost:3031/dev) to try each part as it is built. The outline lets you jump to a section; the Events and Data panels let you inspect what happens as you respond. Iterate with your agent until the behavior matches your design.

Walk through the complete experiment as a participant, including instructions, consent and contact details, task timing, and completion. Before posting the study, verify the recorded data as described next.

## Recording test data

Verify the data while developing the experiment. In [Develop](http://localhost:3031/dev), the **Events** panel shows the current run's recorded events, and the **Data** panel shows the preprocessed rows as you respond. Use its selector to check each data view's columns and values against your design.

To save a test session to the database, open [Develop with debug recording](http://localhost:3031/dev?mode=debug) (`/dev?mode=debug`) and run the experiment. The `mode=debug` URL parameter enables automatic recording to the **debug** database. If your URL already has parameters, add `&mode=debug` instead.

Ordinary Develop sessions let you inspect events and data views without automatically saving them to the database. Use debug recording for test sessions you want to inspect afterwards in the [Data Viewer](http://localhost:3031/data?mode=debug).

Check that responses, timing, conditions, bonuses, and analysis rows match what you did in the task. Ask your agent to fix missing or incorrect data, then record another test session before collecting from participants.

## Viewing your data

Open the [Data Viewer](http://localhost:3031/data?mode=debug) to inspect your **debug** test data. Once you recruit participants, switch to **live** data using the link at the top.

- **Versions:** open a version for completion counts, condition counts, timing, bonuses, errors, and tables combining its sessions.
- **Sessions:** open one participant's attempt for its status, timing, bonus, recorded events, and analysis tables. A replay link appears when session recording is configured.

An **event** is a timestamped record of something that happened. A **data view** turns those records into an analysis table, such as one row per trial. Your experiment supplies its own views, which appear as named tabs alongside sessions and events.

Use the table filters to find a session or inspect a subset of rows. Check the sync status and use the refresh control when you need the latest collected data.

## Saving data for analysis

Recording stores the session's events while the experiment runs. The Data Viewer's **save** button writes the current analysis tables to files on the computer running this app.

1. Open **Versions** in the [Data Viewer](http://localhost:3031/data) and choose your version.
2. Inspect its sessions and the named data-view tabs to check the expected rows and columns.
3. Click **save** beside the data path. It refreshes the sessions and writes the available views.
4. Check the saved timestamp and open the folder shown on the page to use the files in your analysis.

Analysis files are saved under `data/processed/live/<version>/` (or `debug` for test data). They include a session-summary CSV and the experiment's data views as CSV or JSON files. Table filters control what you see; saving exports the version's data, including rows hidden by a filter.

The original session records are kept separately from these analysis files. A revised data view can produce new columns from previously recorded events; save again to update the files. It can only recover information the experiment actually recorded.

## Posting to Prolific

Open [Prolific](http://localhost:3031/prolific) to connect your account. This app uses the **Prolific API** to manage studies on your behalf: enter an API token from your Prolific account and choose a workspace and project when prompted.

1. Choose **Create New Study** and enter the description, reward, estimated duration, number of places, and eligibility criteria. Check the hourly rate and total cost.
2. Commit the experiment's changes, or ask your agent to do so, then click **Deploy Website** to publish the verified experiment. The page checks that the published copy matches your current version.
3. Click **Create & Publish Study** when you are ready to recruit participants.

## Monitoring recruitment

Open a study to follow incoming submissions. The page refreshes while you are viewing it. You can pause, resume, or stop recruitment, and add more places to a running study.

Each submission pairs Prolific's status and completion code with a **data status**:

- **full** — the session reached completion and its data is saved.
- **partial** — the participant passed the task's no-return point but did not complete.
- **minimal** — the participant left early, often during instructions.
- **missing** — no matching session was found.

Open a session to investigate an unexpected result. You can also message a participant from the submission table and see the correspondence with the study.

If approved submissions have incomplete data, the page can offer **replacement places** targeted at their condition assignments. Review that proposal when filling gaps in a balanced design.

## Paying participants

After participants take part, use the study's review page to approve submissions for payment, request returns or reject submissions, and pay bonuses. It brings each Prolific submission together with its recorded data to suggest a decision and bonus amount.

### Default policy

- Normal completion with full data defaults to **approve**.
- A returned submission with incomplete data defaults to **no action**.
- Ambiguous cases are left **unspecified** for you to decide.

Inspect the session when needed, then choose the appropriate action for each row. You can override any proposal. The summary counts show how many decisions remain unspecified.

### Bonuses

If your experiment records bonuses, the review page reads those amounts from each session. It uses them for submissions being approved, already approved, or with full data; other submissions default to zero.

You can adjust individual amounts by hand; adjusted amounts are marked. You can also import a CSV when bonuses were calculated outside the app. Bonuses already paid are subtracted from the intended totals, so another review pays only the remaining difference.

Check the decisions and pending payment total, then click **Execute** to apply the review actions and bonus payments to Prolific.
