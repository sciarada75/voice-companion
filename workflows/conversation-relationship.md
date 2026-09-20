# Workflow: the conversation relationship

Diagram: `conversation-relationship.excalidraw` (same folder).
**"She" in this file is one example person**, the modal case the evidence base
describes. The system assumes no gender and no age: setup asks how the person
wants to be referred to (`setup-new-person.md`), and the doctrine says "they".
Status: agreed "fair for now" with Claudia, 19/09/2026.

## Objective

The companion builds a relationship with one person over many calls. On the
first call it gets to know her by checking what the family said, one fact at a
time. On every call after that it picks up where the last one ended. Across all
calls it keeps a record of what she remembers, how her days go, how she
sounds, and what changed.

**The app is hers.** It is set up on her profile, and the record is her diary.
**She is its first beneficiary.** She can ask, "Did I take my pills
yesterday?", "What was my glucose this morning?", or "How many days did I walk
this week?". **Other people (family, a carer) see only what she allows.** She
grants access and she can take it back. Consent is given at installation.

The record also watches over her health and her clarity of mind, but inside
the conversation that stays invisible: no checking, no quiz, no "you told me
before that". For whoever she has let in, there is a short daily summary. Most
days it says "all fine", and a quiet, regular routine is itself the good
news.

The person is a competent adult who is **consulted, never examined**. If the
call ever feels like a test, she stops picking up, and then nothing else in
this workflow works.

## Inputs

| Input | From whom | Where it lives |
|---|---|---|
| A free-text description of her | a relative | `intake/<profile>.txt` |
| What is normal for her: hearing, mood, gaps she already has, words she mixes up | the same relative | `intake/<profile>.txt` (new section, see step 1) |
| Her routine: habits, visits, touchpoints, anything recurring | the same relative | `habits.json` (B1) |
| Consent, and who may see what | **her**, at installation | the permissions on her profile |
| Who gets the alerts, and how | only people she has allowed | channel not decided yet (phase C) |
| The record of every earlier call | this workflow | `state/<profile>/` (phase B) |

## Steps

### 1. Setup: the family describes her (stage 1)

- The profile is **hers**. A relative may help fill it in, but access to the
  data afterwards is hers to give.
- The relative talks or writes about her for five minutes. For example: a
  woman in her eighties, born in X, moved three times, sons and a daughter
  called Caterina, loves food, a medicine every morning, keep an eye on memory.
- The relative also says **what is normal for her**. Without it, a gap she has
  had for years gets read as a new decline.
- The relative fills in **her routine**, everything that recurs:
  - **habits:** when she wakes up, what she does first, her morning, lunch,
    the afternoon, her walk, when she goes to bed
  - **medicines:** name, time, with or without food
  - **visits:** Caterina every Thursday, a son on Sundays
  - **touchpoints**, meaning regular contacts with the outside world: the colf
    twice a week, the market on Saturday, Mass, a weekly phone call
  - **anything else recurring:** the doctor every three months, a TV programme
    she never misses
  The companion uses it in every call (step 4), and it is the yardstick for
  "a peaceful routine" (step 5).
- **Where setup happens:** `npm run setup`, a form on localhost:3100. The
  hybrid decided in Open questions: typed fields for the routine and the exact
  things, free text for who she is.
- The tool: `tools/make_profile/run.mjs`, which exists. It turns the text into
  a profile.
- **To build:** every fact in the profile gets tagged
  `source: family, status: unconfirmed`. The profile keeps a separate list of
  the normal things.

### 2. The first call: introduce, then check one fact at a time (stage 5)

1. **Introduce, and say plainly what the companion does.** "I'm Iris, your
   companion. I'm happy to talk with you, keep track of your habits, and keep
   a diary of them together with you. I've been told a little about you, but
   I'd like to get to know you myself." That one sentence covers the
   tracking. It is never brought up again as a subject.
2. **Pick one fact and ask about it.** Only one subject at a time.
3. **Say what you were told, then ask for the part you weren't told.**
   Straight after the check-in, in the order the profile lists the facts
   (where she lives, who she loves, what she did, what she follows).
   Mentioning the fact lets her confirm or correct it. Asking for the rest in
   her own words shows whether she really knows it, because a bare "yes"
   proves nothing: people say yes to be polite.
   - **Never plant a false fact to test her.** It can confuse a fragile
     memory, and it breaks trust if she notices.
   - **The rhythm is: a short question, then something interesting and
     relevant (a real fact from the topics: her old job, the town, the
     club), then stop.** A reaction on its own isn't giving.
   - **Only three or four facts per call.** "I was told" is said once, then
     what's known is woven in naturally.
   - **Then the call moves to her life today:** collecting what we *don't*
     know (her days, home, who she sees, this week, what she cooks). This is
     where her routine is learned. New information beats checked information.
   - **If being an AI comes up, it's a real subject,** discussed honestly at
     any point: how it feels to her, what Iris is and isn't.
4. **Compare her answer with the profile silently.** She never hears
   "correct" or "wrong". The answer falls into one of four outcomes:
   - **confirmed**: it matches
   - **enriched**: she added something new ("four times, not three, and once
     to Argentina")
   - **different**: it doesn't match
   - **can't recall**: she doesn't know or doesn't answer
5. **If it's different or she can't recall,** come back to it later in the
   same call, from another angle. Don't insist in the moment, and don't
   correct her.
6. **Bridge warmly to the next fact.** Use what she just said. "That's a lot
   of moves for a family." "You live somewhere famous for its food." Then go
   back to step 2.
7. **Throughout the call, notice where she talks easily and where she goes
   quiet.** That becomes the map of the topics she enjoys.

Checking facts is a small part of the call. Most of the call is talking about
what she loves, following the rules in `config/rules/<lang>.md`.

### 3. After every call: record, update, track (stages 6, 7, 10, 11)

This runs in code plus AI, after the call ends. She never hears it.

1. **Get the call back:** the transcript and timings. The tool is
   `tools/pull_sessions/`, **which is empty and needs building.**
2. **Write the session record** (sketched below): each fact checked and its
   outcome; the topics covered and how engaged she was; whether she mentioned
   the medicine; the threads left open; how long the call lasted.
3. **Update the profile.**
   - A confirmed fact becomes `status: confirmed`.
   - A new fact is added as `source: her`.
   - A "different" fact **goes to the family to check. It is not treated as a
     failure**, because the family may be the one who is wrong.
4. **Track her record over time,** for each fact, each topic and each call.
   The tool is `tools/compute_metrics/`, **which is empty and needs building.**

A sketch of the session record, for B2 (not final):

```json
{
  "call": "2026-09-20T10:05",
  "duration_min": 14,
  "facts": [
    { "fact": "moved three times", "outcome": "enriched", "said": "four, one to Argentina" },
    { "fact": "daughter Caterina", "outcome": "confirmed" },
    { "fact": "born in X", "outcome": "cant_recall", "retried": true }
  ],
  "topics": [ { "topic": "food of her town", "engagement": "high" } ],
  "medicine_mentioned": true,
  "open_threads": [ "the move to Argentina" ],
  "immediate_flags": []
}
```

### 4. The next calls: start from today, not from the file (stages 6, 10)

She may have forgotten the last call, and opening with it makes her feel
watched. The call starts from today. The record is used, but never shown.

1. **Open with a check-in that fits the time of day.** In the morning: "How
   are you today? Did you sleep well?" In the afternoon: "How has the day
   been?"
2. **Listen to how she answers, not just to what she says.**
   - "Yes", "fine", "al solito" (as usual): no reason to stay there. Move on.
   - "I didn't really sleep, I'm tired today": **that is the subject.** Build
     on it gently. It also goes into the record (sleep, mood) exactly as she
     said it.
3. **Know her routine and use it.** Older people are routine-sensitive, and
   knowing the rhythm of her week is what makes the companion feel close.
   - The day: what she does when she wakes up, in the morning, in the
     afternoon, and when she takes the medicine.
   - The week: the colf comes twice a week, and Caterina comes every Thursday.
   - On a Thursday: "Caterina comes today, doesn't she?" On a colf day: "Is
     today a cleaning day?"
   - This is the weekly routine file (`habits.json`, B1). It comes from setup
     and gets corrected by what she says.
4. **Go back to the previous call only if the conversation struggles.** Use it
   as a rescue ("Last time you told me about the move to Argentina"), not as
   the opener.
5. **Check an unsure fact at most once per call, and casually.** Never as a
   quiz.
6. **After lunch, sometimes, ask about lunch.** It's warm, it's routine, and
   it tells you whether she's eating. "How was lunch today? What did you
   cook?" Then use the record lightly: "I know you like that. Last week you
   told me you really enjoyed the hash browns. Do you think you'll ask the colf
   to make them again?" Use one callback to the past at a time, only when it
   comes naturally, and never "you told me before and now you don't
   remember".
7. The rest of the call is about what she loves.

A change in her routine can be a signal: Caterina didn't come on Thursday, or
she didn't take her walk. It is recorded and counts toward the alert ladder in
step 5. It is never raised with her as a reproach.

### 4a. She asks her own diary

At any point she can ask about her own record, and gets a plain answer:
- "Did I take my pills yesterday?" → "Yes, at eight, with breakfast."
- "What was my glucose this morning?" → the number **exactly as she said it**,
  never rounded or guessed. If nothing was recorded, say so.
- "How many days did I walk this week?" → "Four: Monday, Tuesday, Thursday and
  Saturday."

This is the notebook the rules already describe ("You are the notebook"). It
needs the record to be readable during the call. How to do that is a phase B
question: an `http` tool, or yesterday's summary loaded into the prompt.

### 4b. How she sounds: AssemblyAI signals (stages 7, 8)

Every call is recorded by AssemblyAI. That gives us signals she never notices,
because nothing is asked of her. **They are only ever compared with her own
baseline**, since a slow speaker is not a declining one.

| Signal | What it can hint at | Where it comes from (documented) |
|---|---|---|
| **Response latency**, meaning how long she takes to answer after the agent stops | slower thinking, tiredness, hearing | session **timeline**: per-turn timestamps (`GET /v1/sessions/{id}`) |
| Length of her turns; how often she interrupts or is interrupted | engagement, energy | the timeline: turns and their interrupted status |
| How long the call lasts; what time she calls | routine, mood | session metadata |
| **Speech rate** (words per minute) and **pauses** inside her sentences | fatigue, word-finding difficulty | re-transcribe **her channel** of the stereo recording with the pre-recorded API: word timestamps, multichannel |
| **Filler words** ("um", "er") and restarts | word-finding difficulty | pre-recorded API with filler words included |
| **Sentiment** of what she says | low mood | pre-recorded API Sentiment Analysis |
| What she says: repeats herself, loses the thread, contradicts a confirmed fact | clarity of mind | the transcript, read by AI after the call |

Tools: `tools/pull_sessions/` fetches the session. `tools/transcribe_session/`
re-transcribes her channel. `tools/compute_metrics/` does the arithmetic. **All
three are empty.** No single number is an alert. The trend over weeks against
her own baseline is.

### 5. Alerts for the people she has allowed (stages 8, 9)

Nothing on this table reaches anyone she hasn't allowed. What each person sees
(daily summary, alerts, emergencies only) is set in her permissions.

| Situation | What happens |
|---|---|
| Normal day: she called at her usual time, her routine held, nothing unusual in how she sounds | **Green line in the daily summary: "All fine."** A peaceful routine is good news, and it gets said. |

| First calls (her **baseline**, meaning her normal level) | **No alerts.** The calls only correct and enrich the profile. |
| A single slip | Logged, nothing sent. |
| It happens now and then | **Soft alert**, inside the regular summary. |
| It keeps happening, or it's worse than her own baseline | **Harder alert**, the same day. |
| Medicine not taken, distress, a fall, pain, "I feel unwell" | **Immediate**, the first time it happens. No pattern needed. |

- **Compare her with her own past,** never with the family's notes. A steady
  gap is just who she is. A new gap is the signal.
- **Alerts describe, never diagnose.** Write "she couldn't recall Caterina's
  name twice this week", never "signs of dementia".

## Tools

| Tool | Status | Used in |
|---|---|---|
| `tools/make_profile/run.mjs` | exists; fact tags and the "normal for her" list to add | step 1 |
| `tools/build_agent/run.mjs` + `config/rules/<lang>.md` | exists; the rules need the first-call behaviour (phase A) | step 2 |
| `tools/pull_sessions/` | **built 20/09**; `npm run sessions` | steps 3, 4b |
| `tools/transcribe_session/` | **empty**; pre-recorded API on her channel | step 4b |
| `tools/compute_metrics/` | **built 20/09**; `npm run metrics` | steps 3, 4b, 5 |
| session record + profile update | **not started** (B2). Today `pull_sessions` stores the masked transcript and `report` reads it; nothing yet writes a per-call record or updates the profile | step 3 |
| alert sender | **not started**; the channel is undecided and must cost €0. Today the report waits to be opened by someone in the circle, with their own key | step 5 |

## Edge cases

- **She asks "why are you asking me this?"** Tell the truth: "Your family told
  me a little about you, and I'd rather hear it from you."
- **She doesn't want to talk about something** (a place, a death, a move she
  didn't want). Never insist, never ask why. Turn the same theme towards today
  or towards something good: not the old town, but where she lives now and
  whether she's happy there, or the place she enjoyed living most. Log it as a
  sensitive topic, and don't bring it up again unless she does.
- **She says she's confused.** Find out what about, with one kind question:
  this call, the machine, something said, or her day. Then deal with that one
  thing. Never just soothe and wait. It is a signal for the record.
- **She's tired.** Stop checking, stay on one small thing, offer to stop.
- **The family's fact is wrong.** She is the authority on her own life. Update
  the profile and tell the family. This counts as a correction, not a
  failure.
- **She mentions a medicine or a number.** The number is written down exactly
  as she said it. It is never interpreted, rounded or inferred (stage 6).

## Open questions

- **Consent: decided by Claudia, 19/09.** Consent is given at installation.
  The data is hers, and other people get access only when she allows it. Still
  to design:
  - what the installation screen says
  - whether emergencies (a fall, "I feel unwell") are a separate permission,
    so she can share those without sharing everything else
  - what happens when a relative installs the app for her: her consent should
    still be hers, or that of whoever legally acts for her
- **Cost of the voice signals.** Re-transcribing her channel after each call
  goes through the pre-recorded API at a small price per hour. Confirm the
  price before building. Signals from the timeline cost nothing extra.

- **The setup format.** The recommendation is a hybrid:
  - **A short form** for the few things that must be exact: medicine names and
    times, the fixed days in her week, and who gets the alerts. These are
    typed, never interpreted from speech (the stage 6 principle).
  - **A voice interview with the relative** for everything about who she is.
    A separate onboarding agent on AssemblyAI asks the relative about her and
    follows up where the answer is thin. Its transcript feeds
    `make_profile`.
  - A plain free-text box stays available as a fallback.

- **Conflict with the current rules:** `config/rules/en.md` says "YOU DO THE
  TALKING". The first call needs her to talk about herself. Phase A has to
  decide how the first call differs from later calls.
- How many calls count as the baseline? Suggestion: the first three.
- What counts as "now and then" versus "keeps happening"? The thresholds come
  in phase C, once there is real data.
- Who receives the alerts, and on what channel? This has to cost €0.
