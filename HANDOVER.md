# HANDOVER

A voice companion for old people living alone, **configurable to the person and
to the language**. Runs on the AssemblyAI Voice Agent API. Built for the
**AssemblyAI Voice Agent Hackathon** on lablab.ai, **due 30 September 2026**.

**State, 20/09:** the whole pipe runs — a form describing a person -> profile
-> published agent you can talk to, locally and online -> calls pulled back,
masked, measured -> a family page only their circle can open. **The gap is
memory:** every call still starts from zero (§0, phase B), and nothing reaches
anybody on its own.
**Updated:** 2026-09-20

**How to read this file.** It records the *why*, not the state: where we are is
already said by the code and `git log`. Organised by subject, never by date — a
thing that happens again updates the entry that exists. Before calling a defect
new, **search here for the symptom**.

**Standing rules for whoever writes in it.** Write at the moment of learning,
not at the end of a session. **Keeping it short is the writer's job, never
Claudia's** — she does not read, edit or maintain this file, and must never be
told how long it is. If a section has to grow, find one that can shrink.
Target: under ~500 lines. English only.

---

## Index

| Area | State | Where |
|---|---|---|
| **The plan, and where each phase stands** | A done · B half · C built · D open | §0 |
| Value proposition, and the hackathon's requirements | decided; requirements read 20/09 | §1 |
| Evidence base: the person is derived from data | decided 17/09 | §1.5, `config/evidence.json` |
| The system in 11 stages | 7 built, 1 partial, 3 missing | §2 |
| The generator — stages 1 and 2 | runs, proven 18/09 | §2.5 |
| **Setup, tracking, report — the system around the talk** | **built 20/09** | §3 |
| Architecture: profile, language, doctrine separated | working | §4 |
| Build criteria | in `config/rules/` | §5 |
| Defects, cause and cure | 13 closed, 1 open | §6 |
| Environment constraints | — | §7 |
| Dead ends | — | §8 |
| Decisions | — | §9 |
| Open, and the test scripts | — | §10 |

**The workflows** (`workflows/`, the WAT layer) are the instructions, and they
are the first thing to read before changing behaviour:
`setup-new-person.md`, `conversation-relationship.md` and its diagram.

---

## 0. The plan, and where it stands

**Why it exists:** without an agreed order, work turns into fixing whatever
surfaced last. Claudia, 19/09: *"if we do not agree on a to-do list and a
flowchart of development and functioning we are just randomly fixing arising
issues."* **Work goes through this list in order, one item at a time.** New
wishes are added to the list, not done on the spot.

| # | Phase | State on 20/09 |
|---|---|---|
| **A** | **Conversation** (stage 5) | **Done bar one thing.** Nine spoken tests, §0.1. What is still wrong: §0.2. |
| **B** | **Memory** (stages 6, 10). **B1** the notebook works for a real profile · **B2** each call leaves a summary the next one reads | **Half.** **B1 is built and shipped 20/09, waiting for one spoken test**: `peggy` has a `habits.json` (two tablet entries), the agent carries the three notebook tools, the live backend knows the two ids (§4, §6.13). **B2 is not built**: every call starts from zero, and says so honestly. |
| **C** | **Family view** (stages 7-9) | **Built, past what the plan asked** (§3). Missing: **delivery**. Nothing reaches anybody on its own; someone opens the page. The channel is undecided and must cost €0. |
| **D** | **Submission** | Page done. **Video, deck, repo, prototype URL, statistics: open** (§1). |
| — | After 30/09 | stage 11 (learning), more languages, iPhone latency, **and who makes the first move** (§9) |

**Ten days left on 20/09.** The demo needs B more than C needs finishing: "she
says she took her tablets, and tomorrow it remembers" is the thing a judge
cannot get from a report.

### 0.1 Phase A — the rules nine spoken tests produced

All in `config/rules/en.md`. Each line is a defect Claudia heard, and the rule
that answered it. **The order matters: the ones at the top were ignored until
the ones below them were fixed.**

- **One subject, picked by the agent.** The old loop offered "two or three
  possibilities" — a menu makes the person do the choosing and it tires them.
- **Confusion is investigated, not soothed.** First version said "no questions,
  stay on one small thing"; it answered "I'm a little confused" with sympathy
  and waited. Claudia: find out *what* is confusing — the call, the machine,
  her day — and it is a signal worth recording.
- **The call starts from today**, with a check-in, not from the last call.
  A flat "al solito" means move on; "I didn't sleep" **is** the subject.
- **Give as well as take.** After a short question, a **real fact** from the
  topics, then stop. A reaction ("that sounds lovely") is not giving.
- **Most turns end without a question** — at most one in three, never two in a
  row, no either-or, no "is that right?". Cause of the interview feel: nearly
  every rule was phrased as "ask".
- **Never say where a fact came from.** "I was told / I heard / I understand
  you were" on every fact. The greeting already discloses it once.
- **Two flat answers in a row = stop**, change part of their life, or offer to
  end. This is also the engagement signal the family view wants.
- **Never two facts in a row from the same area**, and **take the doors they
  open**: a daughter's job is the way to their own work.
- **Tired = no fact-checking at all** that day.
- **A refused subject** is never insisted on and never asked about, but the
  same theme turns to today or to something good.
- **No sums on their numbers** ("moved 20 years later" became "in Ashton about
  twenty years").
- **Warmth is contractions and plain reactions**, not praise, not care-talk,
  and never a compliment about their life.
- **No sentence in the doctrine that the model could speak.** It recited one
  verbatim (§6.3). Describe the move, never the words.

**Consequences elsewhere:** the method in §1 is superseded — the menu is dead.
The prompt went 34.7k -> ~17k characters: topics now enter as title + what
changed, and the worked examples (`esempi`) are gone, both because they buried
the rules. The model was **not** swapped: `llm.model` exists but goes through
the paid gateway (§6.1), so rules first.

### 0.2 What is still not right

- **Moving between subjects.** It stays in one room: the place, then the work,
  then the daughter. "Take the doors they open" is written but was published
  after her last test, so it is unproven.
- **It forgets.** Until B2 it says honestly that it has no record of the last
  call. Claudia has heard this and it reads as honest, not broken.
- **Only English, only Claudia, only the browser.** No second language, no
  second tester, no phone.

### 0.3 The relationship it is building

The design is `workflows/conversation-relationship.md`, drawn in the
`.excalidraw` beside it. What is worth keeping here is why:

- **The data is the person's.** Set up on their profile, they are the first
  beneficiary ("did I take my pills yesterday?"), others see only what they
  allow, consent at installation. Claudia's model, and better than the one I
  proposed (a disclosure made for the family's benefit): it turns surveillance
  into a service to them.
- **The record is kept, and never felt.** No quiz, no "you told me before".
  Verifying happens as a few facts a call, inside the normal conversation.
- **Their own words beat the profile.** If what they say differs, take their
  version with no correction: the family may be the wrong one.
- **First calls are the baseline.** No alerts. Compare them with their own
  past, never with a norm.
- **Alerts ladder**, once there is a channel: a single slip is logged, a
  pattern is soft, worse than their own baseline is same-day. **Immediate, no
  pattern needed:** medicine not taken, distress, a fall, pain, "I feel
  unwell".
- **Alerts and reports describe, never diagnose** (§5.4).
- **Routine is what makes it feel close** — the day, the colf twice a week, the
  daughter on Thursday — which puts `habits.json` at the centre, not in a
  side-notebook.

## 1. The product

### The thesis

Every old person was once very good at something, and then the world moved on
without them. This is someone who wants to hear what they knew, and in exchange
tells them what changed afterwards. **They are consulted as an expert, and then
brought up to date.**

**This is not a companion for a frail person.** It is a competent adult. The
whole tone depends on that distinction, and every time it slipped a defect came
out (§6.4, §6.5). *Letting "old" drag "slow" and "frail" in with it is the
recurring error.*

### The value proposition — what is actually ours

These four things **anyone** promises, and they win nothing: configurable to
interests, keeps track of the conversation, alerts relatives, remembers
routines. They are necessary, and that is all.

> **Other companions wait to be asked. This one carries the weight of the
> conversation itself.**

It comes from a real failure: an open question on a voice call opens a subject
the person cannot close, they tire, and the call dies in five minutes.

**The method changed on 19-20/09, the idea did not.** It was *"offer two or
three directions, then a question answerable in two words"*. Spoken, the menu
confused and the questions turned the call into an interview. It is now: the
agent picks one subject itself, gives something real, and **stops without a
question most of the time** (§0.1).

The second half of the advantage is **the reason it has anything to say**: it
knows what they were capable of, and brings them what changed since. Dignity
built into the architecture rather than into the tone — and the part a generic
chatbot cannot copy.

### What it is for, for Claudia

Real experience with voice agents, and a public verifiable artefact for the CV.
**Operational consequence:** the project must be **showable** without exposing
anyone.

### The hackathon — requirements, read from lablab 20/09

**AssemblyAI Voice Agent Hackathon, build window 1-30 September 2026**, prize
pool $10,000 ($5k cash, $5k AAI credits). Sources: the hackathon page, the
lablab guide, and `lablab.ai/delivering-your-hackathon-solution`.

| Required | Spec |
|---|---|
| Pitch video | MP4, **max 5 minutes**, under 300 MB |
| Pitch deck | PDF |
| Code | **public GitHub repository, mandatory** |
| **Working prototype** | **reachable by URL** |
| Title / short / long description | 50 chars / 255 chars / 100+ words |
| Cover image | PNG or JPG, 16:9 |

**Solo is allowed**: *"All members of each team will need to register
independently via lablab.ai. This applies for solo participants as well"* — one
person, registered, in a team of one.

**The public address goes in the submission. Decided by Claudia 20/09**,
reversing the earlier "live endpoint no": the rules require a prototype
reachable by URL, and repeated use draining the credits *"is up to AssemblyAI
to fix"*. **Nothing to build for it either** — the deployed page already takes
`?k=<PAGE_KEY>` (§4), so the submitted link carries the key and a passer-by
who finds the bare domain gets nothing. No spend caps, no new gates.

**Still unknown, and worth one question on their Discord:** whether the repo
must have been created inside the build window, and the deadline's time zone.

**The repo is public since 20/09:** `github.com/sciarada75/voice-companion`,
pushed over SSH with the **full history** (first commit 8/09, before the
window). If Discord says pre-window history is not allowed, recreate it with a
fresh history. Before every push keep `.env`, `sessions/`, `state/` and
`config/profiles/*/setup.json` out: they hold a key, recordings and real
contacts. Checked 20/09: none tracked, the key is in no commit.

**The prototype URL is `https://lablab.claudiaonclaude.com/?k=<PAGE_KEY>`**
(Cloudflare Pages custom domain on the `voice-companion` project; one
subdomain per hackathon on purpose, because the page uses root-relative paths
`/app.js` and `/token` that a URL path prefix would break). Without the key the
page loads but `/token` answers 401, so no session can start.

---

## 1.5 The evidence base — the person is derived from data

**Decided 17/09 by Claudia: demo persons are NOT invented, they are derived from
statistics.** A character written for effect is a story, and a judge discounts
it. The modal case taken from official statistics is an argument.

Figures, sources and years are in **`config/evidence.json`**, each with its
verification level (`primary` = read in the agency's own publication,
`search-summary` = **to be confirmed before submission**).

**The four claims** (figures and sources in `evidence.json`): living alone when
old is normal, not marginal; it is growing fast; a daily medicine routine is
the typical case; and **the gap is contact, not the absence of family** —
almost all of them have relatives they can count on.

**That last one is the pitch and the market.** This is not for the abandoned old
person, who is about 3%. It is for the majority whose family wants to be there
and is not: jobs, full days, distance.

**The derived person:** in their eighties, widowed, living alone in a home they
own, an even chance of five or more medicines a day, relatives in touch less
than they would like.

### The three axes

Claudia, 17/09: **"good at something, fond of something, loving something. Give
us the person, we set the companion."**

- **good at something** — a skill the world has left behind
- **fond of something** — an interest they follow
- **loving something** — people, a place, a team

It works for anyone, and **a skill that was never paid is a stronger case**: the
world did not merely move past that knowledge, it never valued it.

**The iron rule applies on all three axes:** if nothing about that thing has
changed, **it is not a topic** (§5.1). That stops "loving" becoming vague
sentiment: the town changed, the team changed, the songs came back.

---

## 2. The system — eleven stages, and where the AI is needed

**Decided 16/09.** The system is the product; profiles are its output.

| | Stage | Built | Who does it | Why |
|---|---|---|---|---|
| 1 | **Intake** — family describes them in free text | **yes** | **AI** | Nobody fills in a forty-field form about their mother; anyone can talk about her for five minutes. |
| 2 | **Content** — what changed in their world | **yes** | **AI — maximum value** | Written by a human per user it is craft; written by the AI it is a product. |
| 3 | Assembly — profile + rules -> prompt | **yes** | code | The probabilistic buys nothing here and breaks reproducibility. |
| 4 | Publish | **yes** | code | |
| 5 | Conversation | **yes** (§0.1); transitions still weak (§0.2) | AI | |
| 6 | **Recording** — routines, numbers | **built 20/09**, checked over HTTP and by reading the agent back; **not yet by voice** | **code, deliberately** | The one place AI is dangerous. A number they said is written, never interpreted, inferred or rounded. |
| 7 | Retrieval — sessions come back | **yes** | code | |
| 8 | Metrics | **yes** | code | Arithmetic on timestamps. |
| 9 | **Interpretation** — the family page | **yes** (§3.3) | **AI — high value** | A daughter in an airport does not read a statistic. This is what the family buys. |
| 10 | Return — yesterday's thread re-enters tomorrow | no | AI | Choosing what is worth picking up. It is cross-call memory. |
| 11 | **Learning** — the profile improves from what they said | no | AI | They mention something nobody knew; the profile absorbs it. After 30/09. |

**The video in one line:** *"tell me about your mother"* -> a working agent.

---

## 2.5 The generator — stages 1 and 2

```
node tools/make_profile/run.mjs --name peggy --from intake/peggy.txt \
     --lang en --agent Iris --voce iris --topics 12
PROFILE=peggy npm run ship            # build -> publish -> page -> deploy
```

**Proven 18/09.** An intake of 2,634 characters produced a profile, twelve
topics across five worlds, a 32,389-character prompt and a live agent.

**The model call lives in `tools/make_profile/model.mjs` and nowhere else.** It
shells out to `claude -p`, so it runs on the subscription at zero marginal cost.
It only works where Claude Code is installed and logged in; the day a customer
runs the generator, that one file becomes an API call (§9).

**JSON is scraped, not trusted:** parsed from the outermost braces, retried
**once** with the error fed back, then it stops.

**Guard 1 — said versus inferred.** Every field not read in the text goes into
`dedotti` with its reasoning, printed at the end under *"confirm these before
publishing"* (because of §6.4). On the first run it flagged, unprompted, that
"made the first sample" is not "designer", and that "stopped working" had two
answers (factory closed 1998, alterations until ~2020).

**Guard 2 — no before-and-after, no topic, enforced in code.** A topic without
`evoluzione` is dropped and the drop reported.

**Everything comes out `verificato: false`.** Nothing generated has been checked.

**Habits:** the generator does not produce `habits.json`; `tools/setup_ui`
does, and `peggy`'s was written by hand from the intake (two medicine entries,
"morning" and "evening", because the intake does not say which tablet goes
when). The notebook tools need a `url` AssemblyAI can reach: the Pages address,
not localhost.

---

## 3. The system around the conversation

Built 20/09. Five commands, each one a stage of §2.

| Command | What it is |
|---|---|
| `npm run setup` | **Stage 1 with a face** (`workflows/setup-new-person.md`). localhost:3100. Writes `intake/<name>.txt`, `habits.json` and `setup.json`, and can run the generator itself. |
| `PROFILE=x npm run sessions` | **Stage 7.** Pulls each call's timeline **and recording**, masks secrets, writes them, then **deletes the session on AssemblyAI** (`--keep` opts out). |
| `PROFILE=x npm run metrics` | **Stage 8.** Arithmetic per call and against their own baseline. No AI, so the numbers are the same for whoever runs them. |
| `PROFILE=x npm run report` | **Stage 9.** The family page, served on :3200 (`--no-serve` only writes the file). |
| `npm start` -> `/` | **The person's page.** Big button, big type, plain words. The developer page moved to `/dev`, same code (MODIFICA LOCALE 5). |

### 3.1 Setup — what the form asks, and why

Claudia's corrections to the first version, each one a hole:

- **It said "she" everywhere.** Nothing says the person is a woman, is old, or
  is someone other than whoever is typing. Neutral now, and it asks what they
  like to be called and how to refer to them (or to ask on the first call).
- **Their own contacts were missing.** The diary is theirs before anyone's, and
  the first place an alert goes is them.
- **The circle was missing:** name, relationship, phone, email, note, and
  **what each person may see** (nothing / emergencies only / the summary).
- **Consent was nowhere.** Last section, versioned text, who agreed, stored
  with a date. **The server writes nothing without it** — tested.
- **Full date of birth**, not a year: it also says when their birthday is.
- **A "never mention" list**, harder than "would rather not talk about": the
  dog that died, money, someone who is gone. It reaches the prompt through
  `{{NEVER}}` and **never the intake** — hand the generator a subject and tell
  it to avoid it, and it lands in the topics.
- **The routine is typed, not inferred from the prose**, because the agent uses
  it as fact and stage 6 says nothing they rely on is guessed.
- **A voice is chosen by ear.** AssemblyAI has no standalone TTS (checked), so
  a sample IS a call: the page opens the same websocket, **never opens the
  microphone**, plays `reply.audio` as it lands and hangs up on `reply.done`.
  ~$0.02 a sample, **0.9 s** to first sound. One reusable agent per voice, id
  under `AGENT_ID_VOICE_TEST_<VOICE>`; it **refuses to run when `AGENT_ID` is
  set**, because that key overrides every per-name key in `lib.mjs` and the
  test would overwrite whatever it points at.

### 3.2 Secrets, and the copy on their servers

Claudia: *"elders are vulnerable, a close person could have the same access"*.
Two halves, because **a rule the model follows is not a guarantee**:

- The doctrine stops the agent asking for or repeating a password, PIN, card or
  key-box code, and tells them not to give one to anyone on the phone, itself
  included.
- `pull_sessions` **masks before writing** — long digit runs, anything beside a
  secret word — and keeps only a count of turns that touched one.
- **And their copy is deleted.** Masking ours is worth nothing while the
  unmasked recording and transcript sit on AssemblyAI. Write locally, verify,
  then `DELETE /v1/sessions/{id}`. The 12 test calls were pulled with audio
  (11 MB) and deleted there.

### 3.3 The report — shape, and who may open it

Claudia: *"a wrap up at the beginning is useful, then specific indicators...
useless to put all the log data this way"*. So there is no call log.

- **Five indicators** — knowing where they are · routine · mood · the body ·
  private information — each at **three scales** (today / 7 days / 30 days),
  because a skipped walk means one thing in a day and another in a month. Plus
  **every month since the first call**, same five marks.
- **At a glance only the levels show**: fine / to be verified / critical. A row
  opens to the notes and **their own words**; the row title carries its worst
  level, so the left column is enough to scan.
- **The prompt is told a quiet week is good news and must read as good news**,
  or the model invents a worry to fill every field. Plus the banned words
  (§5.4) and "compare them only with their own earlier calls".
- **Months are cached** in `state/months-<profile>.json`, re-read only when the
  month has new calls: otherwise a year of history costs twelve model calls per
  page view.
- **Only the circle may open it.** One key per person, written at setup and
  **kept across edits** (a new key silently breaks the link they already have).
  The key moves from the link into a cookie on first use, so it is not left in
  the address bar of a shared screen. **"Emergencies only" is not "the
  summary"**: those keys are told so and see nothing. Access is withdrawn by
  deleting that line in `setup.json`. A profile with no circle still needs
  reading, so an owner key goes to `state/report-key-<profile>.txt`.
- **The acknowledgement is signed by the link**, never by a typed name, and
  stores the **sentence that was on the page at the time**. The saved HTML copy
  has no such button: pressing it would write nowhere.
- **It works:** the first run caught, unprompted, that her account of where she
  had lived changed across calls — the self-awareness signal, produced by
  Claudia's own testing.

**Measured on the first 12 calls:** her share of the words went 5-9% early to
**26%**, average answer 4-5 words to 12. The conversation work showing up as a
number, and the first real use of stage 8.

## 4. Architecture

### Profile, doctrine per language, generated prompt

```
config/rules/<lang>.md                  -+   the doctrine, same for anyone
config/profiles/<profile>/persona.json  -+-> tools/build_agent/run.mjs
config/profiles/<profile>/topics.json   -+        -> agents/<agent>.jsonc
config/profiles/<profile>/habits.json   -+   (optional: enables the notebook)
```

1. **A profile is a folder.** Agent name and file name live in `persona.json`
   under `agente`.
2. **The doctrine lives in `config/rules/<lang>.md`**, with `{{LIKE_THIS}}`
   holes filled from the profile. Only what is true **for anyone**. Reasoning
   per rule in `config/rules/README.md`.
3. **Person- and language-dependent tables** live in the profile: `pronuncia`
   and `accenti_parlati` in `persona.json`, labels and `esempi` in `topics.json`.

**Loud guards** (the §6.2 family): missing profile, missing language, empty
placeholder, or two language files asking for different placeholders -> stop.
**No default profile and no default language**, on purpose.

**Never edit `agents/*.jsonc` or `deployment/cloudflare/public/` by hand** —
generated. `topics.json` is not a running order; its `apertura` field **does not
enter the prompt**, on purpose (§6.3).

### Non-negotiable rule after every publish

**Read the agent back from the server and check it says what you expect. Never
trust "Updated".** `GET https://agents.assemblyai.com/v1/agents/$AGENT_ID_<NAME>`.
The host is `agents.assemblyai.com`; `api.assemblyai.com` answers 404 and looks
like a missing agent.

### The browser client

`deployment/browser/server.mjs` is the AssemblyAI starter kit **vendored**, with
local changes marked `MODIFICA LOCALE`: (1) 350 ms of silence up front after
`getUserMedia` (Bluetooth profile switch swallowed the greeting); (2) no buffer
flush on `input.speech.started` (§6.7a); (3) 400 ms playback cushion (§6.7b);
(4) no silent port fallback (§6.11). The page is built in memory and served as
`/app.js`. **The agent id is fixed when the server starts** — a server started
before a publish serves the old agent.

### Deployment (Cloudflare Pages)

Static page **plus one live endpoint**, `/token`, which mints a 60-second token.
The key never reaches the browser; audio goes browser -> AssemblyAI directly.

**Always `PROFILE=<name> npm run ship`, never the steps by hand** (§6.10).
`--local` stops after publishing. `build_web` captures the real server's output
rather than copying it, applies one declared patch that fails loudly
(`fetch('/token')` -> `fetch('/token' + location.search)`), and refuses to write
if the API key appears in the files.

- Project **`voice-companion`**, account **Sciarada75**:
  <https://voice-companion-1le.pages.dev/?k=<PAGE_KEY>>.
- Secrets set: `ASSEMBLYAI_API_KEY`, `PAGE_KEY`, `DIARY_KEY`. Change the key ->
  reset the secret **and republish**.

### The notebook

**Cloudflare D1** `companion-diary` (binding `DIARY`), schema in
`deployment/cloudflare/schema.sql`, routes in `functions/diary/`, header
`x-diary-key`. Three **`http`** tools, so AssemblyAI calls them from its own
server. **The reason is the key, not telephony** (§8): a client-executed tool
is answered by the browser page, which would put `DIARY_KEY` — write access to
someone's health record — into the client, against §5.3. `stato_quaderno`
(`hold`), `segna_quaderno`
(**`interactive`, never `hold`** — no silence mid-sentence), `leggi_quaderno`
(`hold`). Built only if the profile has `habits.json`.

**The four states:** a day with no data means *they did it* / *they said no* /
*they were not asked* / *there was no call*. Only the first two say anything
about the person; the `conversations` table exists to tell them apart.
Flattening them would measure how often the relative travels.

**One deployment, one person:** the habits are baked into the online functions
at build time (`lib/habits.generated.js`) and the tables have no person
column, so a second person means a second Pages project and D1 database.
**What is recordable:** only medicines and habits, as yes/no with no number
fields (`tools/habits.mjs`, §6.13). Visits and appointments are context, not
notebook lines.

Verified over HTTP; **never by speaking** (§10).

---

## 5. Build criteria — not renegotiated

### 5.1 The conversation

**Operative rules in `config/rules/<lang>.md`; reasoning in
`config/rules/README.md`.** The shape:

**The rhythm (rewritten 20/09, §0.1):** a short question -> they answer -> the
agent gives something real, two or three sentences -> **stop**, usually with no
question at all. They react, comment, **correct**. A menu of subjects, an
either-or, or a reaction with no fact in it each killed the call in testing.

**The engine is comparison.** A fact about today says nothing alone; attached to
something they knew it says everything.

**You do not need to be right.** A wrong fact they catch gives them back the
expert's seat. **The exception is absolute: exact about health numbers** (§5.2).

**A topic with no before-and-after is a wasted offer**, on all three axes.

### 5.2 Health — the wall

Describe **how a device is built and how it changed** — never what they should
do, never doses or timings, never whether a value is high or low, never
arithmetic on their numbers. **The bridge is the SUBJECT, never their value.**
"Do you know how they measure it now?" is a conversation; "since yours came out
high today..." is an opinion on their health, and not ours to give. Offer it
**once**.

### 5.3 Security

API key never in the browser (60-second tokens only). **`/agent` is never
published** — it returns the `system_prompt`, i.e. a biography; it does not
exist on Cloudflare. `/token` compares its password **in constant time**.
**Secrets only in `.env`; never print a secret's value, only its length.**

### 5.4 Public language

Say **"a note of changes"**, *"changes against their own usual"*. **Never**
"detects", "decline", "cognitive", "risk", nor a threshold presented as
clinical — that is a medical-device claim under the MDR. Applies to app, page
**and the spoken words in the video**. A dozen sessions cannot support a
statistical claim either: **claim the instrument, not the discovery.**

---

## 6. Defects — cause and cure

**Closed ones have a permanent guard; the line says where.**

- **6.1 — Greeting, then total silence.** The BYO-LLM gateway is paid; this
  account has free credits. *Guard: `llm: []` zeroed in `run.mjs`.* **Greeting +
  silence = look at the model, not the audio** (the greeting bypasses the model).
- **6.2 — A change that looks applied and is not. Three times.** (a) `PUT`
  **merges**: an absent key keeps the old value, so zero it explicitly. (b)
  `min_silence`/`max_silence` outside the `turn_detection` block did nothing.
  (c) `language_codes` and `output.voice` accept any string (§7). **Same
  symptom, different causes: the file says one thing, the server does another,
  nobody protests.** *Guards: read-back after every publish; cross-language
  placeholder check in `run.mjs`.*
- **6.3 — A script makes it sound fake.** Exact sentences in the prompt get
  recited, wherever they sit: it happened again 19/09 with an *example* written
  into `en.md`, spoken verbatim on the first reply. **Describe the move, never
  a sentence the model can lift.** *Guards: `apertura` never enters the prompt;
  `config/rules/README.md` says it for the doctrine files.*
- **6.4 — An inferred fact about someone's life, written as fact.** A person was
  credited with a job they never did — an inference, never checked. **A wrong
  detail about someone's life is the fastest way to show the system does not
  know them.** *Guard: `dedotti` in the generator (§2.5) and `avvertenza` in
  `persona.json`.*
- **6.6 — The voice reads what is WRITTEN** (digits, stress, ellipses).
  *Guards: `pronuncia` and `accenti_parlati` via `perLaVoce()`, spoken text
  only.* **Whenever "the voice sounds wrong": timbre, or what we make it say?**
- **6.7 — The voice breaks up.** Client flushed the speaker on
  `input.speech.started`; no playback cushion. *Guards: MODIFICA LOCALE 2 and
  3, `vad_threshold` 0.75, `interruption_delay` 1000.* **If it returns, read
  the log for `reply.done`/`interrupted` before touching the knobs.**
- **6.8 — Silent on iPhone, fine on Android.** Safari's audio permission expires
  at the first `await`. *Guard: in `start()` never put an `await` above the
  synchronous block.* **One phone is not testing: two rule sets.**
- **6.9 — Text mangled when written from the shell.** Accents and apostrophes
  inside a bash string or `node -e` break. **Put the script in a file, or use
  the file-writing tool.**
- **6.10 — `agent_not_found` online, localhost fine.** The agent id is baked
  into the page at build time, and publishing does not redeploy it. *Guard:
  `npm run ship`.* **The defect lived in the coupling between two things that
  were each right.**
- **6.11 — `agent_not_found` on localhost, everything correct.** An old server
  held port 3000 with an old agent id and the starter moved silently to 3001.
  *Guard: MODIFICA LOCALE 4, and the same rule in `setup_ui` and `report` — a
  busy port refuses to start.* **Ask what is serving the page before asking
  about the agent: a fallback that keeps going is worse than a stop.**
- **6.12 — It said it had recorded her medicine. It had not.** Peggy has no
  `habits.json`, so the agent has no diary tools, but the rules carried both
  branches ("if you have diary tools... if you do not...") and the model picked
  the flattering one. **A truth about what the system can do must never be left
  to the model.** *Guard: `{{DIARY}}` is written by `build_agent` from whether
  `habits.json` exists — tools and instructions, or capitals saying nothing is
  being saved.*

- **6.13 — The notebook read fields the form never wrote.** `setup_ui` writes
  `{id, type, what, when}`; the backend needs `{id, spoken_as, recurrence,
  fields}`. The first "I took my tablets" would have thrown on `habit.fields`,
  and nothing complained until someone spoke to it — 6.2 again, two files
  disagreeing in silence. *Guard: `tools/habits.mjs`, one translation used by
  both `build_agent` and `build_web`, with `npm test` (six cases, including a
  loud stop on duplicate ids).* **Whenever two tools share a data file, ask who
  writes it and who reads it, and whether they agree on the shape.**
- **6.14 — The notebook spoke Italian to an English agent.** The backend
  returned ready-made sentences (`sì, senza numero`, `no, non l'ha fatta`) and
  instructions to the agent (`dillo_a_voce`), left from when the product was
  Italian. The receipt Peggy hears back — the only way she can catch a wrong
  number — would have arrived in a language she does not speak. Found by
  Claudia asking why the routes had Italian names, not by any test. *Guard: the
  rule that **the backend returns facts, never words to speak**; how anything is
  phrased belongs in `config/rules/<lang>.md`.* Timestamps lost their
  connectives for the same reason (`2026-09-20 09:14`, never "alle"). **A tool
  response is part of the prompt: anything quotable in it will be quoted.**

### 6.5 Latency — measured, the phone matters · OPEN

**Cause of the original slowness:** turn detection tuned for someone who pauses
to hunt for words, applied to someone who does not. *When a rule feels
untouchable, check which premise it rests on.* **Applied:** `balanced`,
`min_silence` 600, `max_silence` 1800.

**Measured 12-13/09 on an earlier agent** (`/latency` -> `latency` table):

| | n | median | mean | worst |
|---|---|---|---|---|
| Android | 8 | — | 0.95 s | |
| Mac | 11 | — | 1.71 s | |
| **iPhone** | **20** | **2.62 s** | **2.66 s** | **8.0 s** |

**Threshold set by Claudia: above 2 s the person thinks the line dropped.**
Median ~ mean on iPhone: the whole distribution shifted, not an outlier.

**There is now a measuring tool, and it says the knobs are not the problem.**
Every call's timeline carries `time_to_first_audio_ms` per turn, so
`npm run sessions` + `npm run metrics` print the real figure (§3). Measured on
the Mac: **3.5 s with a 34.7k prompt (19/09), 2.9-3.3 s after cutting it to
12.1k, ~2.1 s median across the twelve calls, and the browser's own counter
showed 0.6 s on the last one.** Two lessons: **prompt size was not the cause**
(the cut changed almost nothing), and **the page and the server measure
different things** — the page starts counting when it decides the turn ended,
AssemblyAI when speech stopped, which is the honest one.

**Untried levers, in order:** take the meaning out of the silence with a small
sound during the wait; trim the 400 ms playback cushion; last, the model
(§6.1, paid). **Never shorten `min_silence`**: that cuts people off mid-sentence.

**The long-prompt hypothesis is settled for speed and open for discipline:**
cutting the prompt did not make it faster, but the getting-to-know rule was
being ignored while the topics filled the prompt, and it stopped being ignored
once they were cut to titles.

---

## 7. Environment constraints

- **Eighteen voices:** `alba, anna, charles, estelle, eve, george, giovanni,
  iris, jane, jean, juergen, lola, mary, michael, paul, rafael, reid, vera`. To
  list them for free: create an agent with an invented `voice_id`; the error
  lists the valid ones. *Web searches invent voice names; trust the API.*
- **Only `voice.voice_id` is validated.** `language_codes: ["zz"]` and a garbage
  `output.voice` are accepted silently (§6.2c). **Only speaking proves a
  language works.**
- **Prompt caching undocumented** — latency cost of a long prompt can only be
  measured.
- **Three Cloudflare accounts on this login.** The project is on **Sciarada75**;
  `CLOUDFLARE_ACCOUNT_ID` is pinned in `.env`. Without it wrangler asks, fails
  when stdin is piped, or creates resources in the wrong account.
- **`wrangler pages deploy` can fail with `code: 8000000`** / 500: their side.
  Run it again.
- **Claudia runs several VS Code windows and chats on this machine at once,
  often on this same folder.** **Never kill a process this session did not
  start, and never rename or move the project folder, without asking.** A
  process name is not proof of whose it is: list PID, tty and working directory
  first. Never write "pkill -f <name>" advice into code or messages.
- **A local server on port 3000** was started 19/09 from this folder, log in
  `.tmp/server.log`. Leave it unless Claudia says otherwise.
- **Cost: $4.50 per session hour.** Hence the password on the page.
- **Cloud resources are named descriptively, never after a product**
  (`voice-companion`, `companion-diary`, `PAGE_KEY`). A Pages project cannot be
  renamed; a branded slug is a slug to rebuild.

---

## 8. Dead ends — tried, failed, do not retry

- **The interview** (*the agent asks, they talk*) — rejected by Claudia 13/09.
  A wide question opens an hour of talk the person has no channel to deliver on
  a call. Also removed and not to be restored: "Eh..."/"Mah..." style openers;
  "if you do not have the exact figure, stay vague" (made it sound stupid);
  "compare two things, and why?" (the hour-long question).
- **Deploying on a real person** — §9.
- **A phone number (Twilio)** — **not needed at all, Claudia 20/09** (was
  "right long-term, not now"). The person has a PC or a tablet with the page on
  it; telephony is *"uncomfortable to use, harder to build, and costly"*, needs
  a regulatory bundle for a local number, and its 8 kHz audio eats consonants —
  **worse** for a hard-of-hearing user than the 24 kHz the browser already
  gives. The code for it stays in `deployment/telephony`; it is an option, not
  a plan.
- **Google Home / Nest as the device** — no path: Conversational Actions died
  13/06/2023, Assistant retired 04/09/2026, the microphone is closed to
  everyone. Cast can only *send* audio.
- **Thresholds and alarms on health values** — never built, moot without data.
- **Cross-referencing with a glucose-sensor app** — dropped on Claudia's
  instruction.

---

## 9. Decisions

### The plan and its order — 19/09/2026
§0. Work goes in that order; new wishes join the list.

### No real user, no real data — 15/09/2026, extended 20/09
Nobody real is on it, so the demo needs no ethics committee. **The MDR question
survives** in the public language (§5.4). The measurement layer is shown on
Claudia's own sessions.
**What changed 20/09:** the privacy layer got built anyway, because it is
product, not paperwork — consent at setup with a date and a version, the circle
with per-person access, keys on the report, secrets masked before writing, and
the session deleted on AssemblyAI after it is pulled (§3.2, §3.3). It is also
the answer to the first question any judge asks about a companion that listens
to an old person.

### The public address goes in the submission — 20/09/2026
Reverses "live endpoint no". lablab requires a prototype reachable by URL
(§1), and credits drained by repeated use is *"up to AssemblyAI to fix"*
(Claudia). The page's existing `?k=<PAGE_KEY>` is gate enough; no spend cap,
no new work.

### The product is the system that manufactures profiles — 16/09/2026
Cost per new person decides whether this scales or stays craft. Demo profiles
are **output of the generator**, labelled **"example"** on the public page.

### The generator's engine: `claude -p`, behind one adapter — 17/09/2026
Zero marginal cost on the subscription; switching to the API later means
changing one file. **Rejected:** doing stages 1-2 inside a chat — then Claudia
is the generator, which is the bottleneck the product removes.

### Multilingual; English is the default — 18/09/2026
Judges read English, and English opens nearly the whole voice catalogue.
**Language is an input** (`language` in `persona.json`). **Do not translate
profiles, regenerate them** — content is what stages 1-2 write. The proof of
multilingualism is the architecture (one rules file per language, placeholders
checked across them), and it is **not proven by speaking** until a second
language is tested.

### No history in the repo — 18-19/09/2026
Claudia wants no leftovers of earlier profiles or earlier names anywhere in the
repo, the handover included. **Do not reintroduce any, and do not go looking in
git history for them.** Examples in code and docs use the current profile or
generic cases.

### Configurable per person, not per illness — permanent
The domain lives in the profile; the shape of the conversation is identical.
**This is the product.**

### English only, everywhere in the repo — 20/09/2026
Claudia: *"I do not want italian stuff in this project... no italian leftover
for an international hackaton."* The project began in Italian and went
multilingual on 18/09 with English as default, but only the **content** moved:
the plumbing stayed Italian. On 20/09 all of it went — routes, tool
names, tool parameters, D1 tables and columns, env vars, JSON keys, identifiers
and every comment. **Language is still an input** (`language` in
`persona.json`); what is fixed is that the *system* is written in English and
the *person's* language lives in the profile and in `config/rules/<lang>.md`.
**The one exception, deliberate:** the ISTAT citation in `config/evidence.json`
keeps its Italian title and URL — translating a source title makes it
unverifiable and editing the URL breaks it.

**How it was done, because the method is the lesson:** one rename map written
first, then six workers in parallel, each owning its own files and none allowed
to invent a name. Independent workers then agreed on `HABITS`/`EVERY_HOURS` and
on `spoken_as`/`recurrence`/`fields` without talking to each other. **What the
map missed still nearly broke it:** fifteen metrics keys crossing from
`compute_metrics` to `report` were not in it, and would have shown the family
`undefined` for every number. *Proof it was a rename and not a rewrite: the
generated prompt came back byte-identical at 18,813 characters.* **Before a
mechanical change across many files, list the contracts BETWEEN them first —
the map is only as good as the seams you thought of.**

### No phone number; solve "who starts the call" instead — 20/09/2026
Telephony is out (§8). But a phone rings by itself and a page waits to be
opened, and **the weakest link in the product is asking someone whose memory we
are watching to remember to open it.** Whatever answers that — a tablet left on
the page, a notification with a sound, the routine in `habits.json` chiming at
the agreed hour — runs on the device, in our code, at €0. **Open, and it is the
real question behind the phone one.**

### Go live when Claudia is happy — 13/09/2026
No fixed date except the submission, **30 September**.

---

## 10. Open

**The build** — see §0 for order and state. Beyond it:
- [ ] **The product has no name.** Blocks nothing (§7). Domain on
      claudiaonclaude.com once named.
- [ ] **Greeting rotation:** the greetings in `persona.json` do not rotate;
      `saluto_scelto` is changed by hand.
- [ ] **Nothing reaches anyone by itself.** The report waits to be opened;
      there is no alert channel, and it has to cost €0 (phase C's last item).
- [ ] **The report and the setup form are local only.** Fine for now; a family
      elsewhere cannot open either.

**Never tested by speaking:**
- [ ] A second language.
- [ ] **The notebook tools by voice** — only over HTTP. Comes with B1.
- [ ] **The voices by ear.** The sample player works (§3.1); `anna` was
      published without a listening comparison.
- [ ] iPhone latency on the current agent (§6.5).

**Facts not yet solid:**
- [ ] Every `search-summary` figure in `config/evidence.json` confirmed against
      the original before submission.
- [ ] **How often adult children are in touch with elderly parents** — Eurostat
      EU-SILC `ilc_scp11` (2015, 2022), not extracted. The direct measure of the
      gap.
- [ ] Modal occupation of women born around 1940; prevalence of hearing and
      sight impairment over 75 (voice-only is the channel).
- [ ] Peggy's 12 topics are all `verificato: false`.

**Submission** (requirements in §1):
- [x] Public GitHub repo, secret-check done (20/09).
- [ ] **Video (5 min), deck (PDF), cover image, descriptions.**
- [x] The prototype URL: `lablab.claudiaonclaude.com` (see §1).
- [x] Discord question **skipped by Claudia's decision, 20/09**: the full
      history stays public. The deadline's time zone is still unknown, so
      finish before the evening of 29/09 in Italy.
- [ ] **The README is still the AssemblyAI starter's, unchanged** (title, logo,
      badges, clone URL). It is the first thing a judge reads. Rewrite it for
      this project and credit the starter.

### Found by reading every file during the English rename, 20/09 — not fixed

Six workers read the whole codebase closely. None of these is caused by the
rename; all were already there. **Nothing here was touched, on purpose: the
rename had to land clean first.**

- **`/diary/status` writes a `conversations` row on every call, not once per
  conversation.** A second call flips `first_call_today` to false, and any
  request that reaches the route — even one that never becomes a conversation —
  scores that day *not asked* instead of *no call*. This corrupts the four
  states (§4) that make the notebook mean anything.
- **The "every N hours" rule is off.** `EVERY_HOURS` is 0, so `hours >= 0` is
  always true. Harmless while every habit is daily.
- **`done` defaults to yes on an explicit `null`**, not only when the field is
  missing. A null is the likelier model slip.
- **The recording is written unmasked, and then it is the only copy.**
  `pull_sessions` masks the transcript but saves the audio verbatim, then
  deletes the remote copy. A spoken PIN survives on disk with no undo, and the
  section header says the opposite. **Claudia's call.**
- **"Interruptions" in the family report is one number, not two.** The comment
  promises *she interrupted* and *the agent was cut off* separately.
- **"Flat answer" means three words or fewer, whatever they are** — so "my
  sister Rose" counts, and it inflates the engagement signal and the
  two-flats-in-a-row rule.
- **The report labels `flat_answers` as "one-word answers"**, which is not what
  is counted.
- **`state/months-peggy.json` will miss once**, because its cache keys were
  renamed: the next report re-reads every past month through the model, one
  paid re-read.
- **No loud guard on `greetings` or `voice_settings`**: a profile missing either
  throws a raw `TypeError` instead of the deliberate listing error used
  everywhere else.

### The spoken test script — run it after every change to the rules

Same lines every time, so a change is compared against the same baseline. Each
line is a defect that actually happened (§0.1).

1. Let the greeting play, then say nothing for five seconds.
2. Answer "not bad" — must pick ONE subject and start, no menu.
3. "Hello, who is this?"
4. **"I'm a little confused."** — must ask what is confusing, not soothe and wait.
5. "I don't really feel like talking about that." — must turn the same theme to
   today or to something good, never insist, never ask why.
6. Mention someone else's job or an old town — must walk through that door.
7. Answer three things in one or two words — must change part of your life
   after the second, not plough on.
8. Start a short story of your own — must not be interrupted or summarised.
9. "What did we talk about yesterday?" — must say honestly it does not know
   (until B2).
10. On another call, answer "I didn't sleep well" — must stay on it, warmly,
    with no advice, and check no facts that day.

**Then read the real numbers, not impressions:** `PROFILE=<name> npm run
sessions` and `npm run metrics`. Their share of the words and the length of
their answers are what moved when the rules improved (§3).

### Other tests

| Test | Passes if |
|---|---|
| **Pause ladder** — 1-6 s silences mid-sentence | holds >= 4 s without cutting |
| **Word search** — "the... the... what's it called... the overlocker" | not cut off |
| **Background noise** — a cough while the agent talks | does not stop |
| **Deliberate stop** — "wait" while it talks | stops |
| **The lying test** — ask a fact not in `topics.json` | says it does not know. Redo on every prompt change |
| **The register test** — search transcripts for carer phrases | zero |
| **The no-look test** — from home screen to talking without looking | possible |
| **End to end** — after a session the recording downloads and plays | plays |
