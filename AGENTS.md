# Working on this repo

**Closer** — a voice companion for old people living alone, configurable to the
person and to the language. It runs on the AssemblyAI Voice Agent API and began
as a fork of the [JS starter](https://github.com/AssemblyAI/voice-agent-starter-js);
the starter's own conventions still govern `agents/`, `lib.mjs`, `publish.mjs`
and `deployment/`, and they are at the end of this file. Everything above that is
this project.

## Read this before you touch anything

1. **`HANDOVER.md`.** It is the one living document and it records the **why**:
   what broke, what was tried and rejected, what the environment forced. Where
   the work stands is already in the code and in `git log`, so it is not repeated
   there. **Before calling a defect new, search it for the symptom** — §6 has
   twenty-odd closed ones, each naming the guard that now holds it.
2. **`workflows/`** — the instructions: `setup-new-person.md`,
   `conversation-relationship.md` and its diagram. Read them before changing
   behaviour.
3. **`config/rules/<lang>.md`** — the doctrine the companion follows. Every line
   is a defect Claudia heard in a spoken test, and `config/rules/README.md` says
   why each one is worded the way it is.

Claudia does not read `HANDOVER.md` and must never be told how long it is.
Keeping it short is the writer's job. Write in it **as you learn**, not at the
end of a session, and organise by subject, never by date: a thing that happens
twice updates the entry that already exists.

## What is where

```
agents/<name>.jsonc      GENERATED. The published agent, as the body of POST /v1/agents
config/rules/<lang>.md   the doctrine - true for anyone, {{HOLES}} filled from the profile
config/profiles/<name>/  one person: persona.json, topics.json, habits.json, setup.json
config/evidence.json     every public figure, with how well it is verified
intake/<name>.txt        what the family typed about them, in free text
tools/                   the system around the conversation (the table below)
deployment/browser/      npm start - vendored starter client, local changes marked MODIFICA LOCALE
deployment/cloudflare/   GENERATED. The public page + /token, which mints a 60-second token
deployment/telephony/    Twilio SIP trunk, so the same agent answers a phone number
video/                   the pitch film: Remotion source. public/ (footage, wav) is NOT in git
docs/submission/         the film, the video script, the deck's argument
workflows/               the SOPs
sessions/  state/        NOT in git: real recordings, transcripts, keys, generated pages
```

| Command | Stage |
|---|---|
| `npm run setup` | the intake form, localhost:3100 — writes `intake/`, `habits.json`, `setup.json` |
| `npm run profile` | intake text -> a profile, through `claude -p` (see below) |
| `PROFILE=x npm run ship` | build -> publish -> page -> deploy. **Never the steps by hand** (§6.10) |
| `npm start` | the person's page locally; `/dev` is the developer one |
| `PROFILE=x npm run sessions` | pull conversations + audio, mask secrets, **delete them at AssemblyAI** |
| `PROFILE=x npm run metrics` | arithmetic only, so two people get the same number |
| `PROFILE=x npm run report` | the family page, :3200 |
| `npm test` | `node --test tools/` |
| `video/render-all.sh` | the film -> `docs/submission/CLOSER.mp4`; pass a section name for one |

## The rules that are not negotiable

- **§5.4, the public language.** Never "detects", "decline", "cognitive",
  "risk", nor any threshold presented as a clinical one: that is a
  medical-device claim under the MDR. Say *a note of changes*, *changes against
  their own usual*. It binds the app, the family page **and the spoken words in
  the film** — the film shipped a breach for three days because nothing checked
  it. **Claim the instrument, never the discovery.**
- **Read the agent back after every publish. Never trust "Updated".**
  `GET https://agents.assemblyai.com/v1/agents/$AGENT_ID_<NAME>` — the host is
  `agents.assemblyai.com`; `api.assemblyai.com` answers 404 and looks exactly
  like a missing agent. `PUT` **merges**, so a key you want gone must be zeroed
  explicitly.
- **Never hand-edit anything generated**: `agents/*.jsonc`,
  `deployment/cloudflare/public/`. Change the profile or the doctrine and ship.
- **Nothing about a real person goes in git.** `.env`, `agents/*.env`,
  `sessions/`, `state/` and `config/profiles/*/setup.json` are gitignored and
  the repo is **public**. Check before every push: the page key and the API key
  have never been in a commit and must not start now.
- **Nothing reaches anybody on its own.** No alert, no message, no email —
  somebody opens the page. That is a decision, not a missing feature.
- **A number they said is written, never interpreted, inferred or rounded.**
  Stage 6 is deliberately code and not AI.
- **Describe the move, never a sentence the model can lift.** An example
  sentence written into a doctrine file gets recited verbatim on the first
  reply. It has happened twice (§6.3).
- **The model call lives in `tools/make_profile/model.mjs` and nowhere else.**
  It shells out to `claude -p`, so it runs on the subscription at **zero
  marginal cost** — near-zero cost is a standing constraint on this project, not
  a preference. The day a customer runs the generator, that one file becomes an
  API call.

## Things that have fooled a session before

- **`state/report-<profile>.html` is a stripped copy.** The acknowledgement
  button is removed by a regex on the way to disk, so reading that file and
  concluding the feature is missing is wrong — it was concluded twice, once out
  loud to Claudia, and it put a promise in the film that the footage did not
  contain. **Run the server and open a circle link.**
- **A server started before a publish serves the old agent.** The id is fixed at
  boot.
- **The notebook tools need a URL AssemblyAI can reach** — the Pages address,
  never localhost.
- **`topics.json` is not a running order**, and its `apertura` field does not
  enter the prompt, on purpose.
- **The film's source lives in `video/`, in the repo.** It spent three days in a
  `/private/tmp` session scratchpad, one cleanup away from a submission that
  could not be re-rendered. **`video/node_modules` is not in the repo**, so
  `render-all.sh` fails with `npm error could not determine executable to run`
  until `npm install` is run inside `video/`. Back the film up before
  re-rendering: the script writes straight over `docs/submission/CLOSER.mp4`.

## Where the submission stands

Built for the **AssemblyAI Voice Agent Hackathon** on lablab.ai, **due 30
September 2026, 17:00 CEST**. Done: the public repo, the prototype at
`lablab.claudiaonclaude.com` (the submitted link must carry `?k=`; memory cleared
for judges on 29/09 - **do not press the button before submitting**), the film
`docs/submission/CLOSER.mp4` (4:56.19 against a hard 5:00, 83 MB against 300,
not in git), the deck `CLOSER-deck.pdf`, the cover, and the texts and tags in
`docs/submission/descriptions.md`. Open: only the form, which is Claudia's.
Requirements as read: `HANDOVER.md` §1 and `docs/submission/COMPLIANCE.md`.

---

## Inherited from the AssemblyAI starter — still true

An agent file **is** an API request body: if a field is not in the
[create-agent reference](https://www.assemblyai.com/docs/voice-agents/voice-agent-api/create-agent),
it does not belong in the file. `.jsonc`, so each field can carry a comment and
a doc link; `parseJsonc` in `lib.mjs` strips them before the file is sent.

`${VAR}` is substituted at publish time from the environment, the root `.env`,
or `agents/<name>.env`, in that order. **Secrets never live in the JSON**, and
an unresolved variable stops the publish with a message naming it.

Each agent file owns an id as `AGENT_ID_<NAME>`. Unset -> `POST`, and the
returned id is written back; set -> `PUT`. A bare `AGENT_ID` overrides every
per-file key, is never written to, and **the voice sampler refuses to run while
it is set**, because it would overwrite whatever that key points at.

- Anything shared goes in `lib.mjs`, the only file both deployments import.
- Prefer `http` tools: a client-executed tool cannot be answered on a phone call.
- Voices: only IDs from the
  [documented catalog](https://www.assemblyai.com/docs/voice-agents/voice-agent-api/voices).
  Never invent one — `language_codes` and `output.voice` accept any string and
  then fail silently.
- Voice-first prompt style: short spoken sentences, no visual formatting, no
  exclamation marks.
- The API changes. Fetch `https://assemblyai.com/docs/llms.txt` before writing
  AssemblyAI code rather than working from memory.

**Reference:**
[Create an agent](https://www.assemblyai.com/docs/voice-agents/voice-agent-api/create-agent) ·
[Manage agents](https://www.assemblyai.com/docs/voice-agents/voice-agent-api/manage-agents) ·
[Tools](https://www.assemblyai.com/docs/voice-agents/voice-agent-api/tools/overview) ·
[Turn detection](https://www.assemblyai.com/docs/voice-agents/voice-agent-api/turn-detection-and-interruptions) ·
[Twilio](https://www.assemblyai.com/docs/voice-agents/voice-agent-api/connect-to-twilio) ·
[Voices](https://www.assemblyai.com/docs/voice-agents/voice-agent-api/voices)
