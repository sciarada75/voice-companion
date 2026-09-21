# B2 — what was left hanging comes back

**Status:** agreed 21/09/2026. Phase B2 in HANDOVER §0.

Today every conversation starts from zero and says so honestly. This makes one
thing survive: something the person left hanging. Nothing else.

## What the person experiences

**Monday.** Peggy says "I didn't sleep well." Iris answers as she would anyway,
and notes that it is worth returning to. Peggy notices nothing.

**Tuesday.** Iris knows, and raises it in her own words when it fits — or not at
all, if Peggy opens with something that matters more.

**Wednesday.** Nothing was left hanging on Tuesday, so Iris says nothing about
it and starts from today.

## The two decisions this rests on

**Only a loose end, never a summary of what was discussed.** Claudia, 21/09.
A record of topics covered becomes a quiz, which §0.3 forbids: *the record is
kept, and never felt*. Absorbing new facts into the profile is stage 11, after
30/09, and is explicitly out of scope here.

**It goes in her instructions, not in the greeting.** A greeting is fixed text
that would be recited word for word — reliable, and exactly the defect in §6.3.
In the instructions she decides whether and how to raise it. **The cost is
accepted: she may not mention it at all on a given day.**

## Why the agent can be trusted to write it

20/09 taught the precise version of a rule that was too broad. `diary_record`
fired reliably; `diary_status` never fired once. The difference is not
reliability in general — it is that **a model acts on a moment it can feel, and
ignores an instruction to act at a position in time.** "At the start of the
conversation" is a position. "When they say something worth returning to" is a
moment, and it is the same shape as the tablets, which works.

So writing is the agent's job. Reading is not: nothing is required of it at the
start, because the note is already inside its instructions before it speaks.

## The parts

### 1. `note_for_next_time` — a fourth diary tool

```
name             note_for_next_time
parameters       note (string, required) — what is worth returning to, in
                 plain words, as the person would recognise it
execution_mode   interactive
http             POST {base}/diary/loose-end, header x-diary-key
```

`interactive`, never `hold`, for the reason `diary_record` is: the agent must
not fall silent mid-sentence waiting for a database.

**Description, and its wording is the whole design:**

> Note something worth returning to next time — they slept badly, they were
> waiting on news, they started a story and did not finish it. Use it the moment
> it comes up, not at the end. Only for something genuinely left hanging: if
> nothing was, do not use this.

Built only when the profile has `habits.json`, alongside the other three.

### 2. Storage — one new table

```sql
CREATE TABLE IF NOT EXISTS loose_ends (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  note       TEXT NOT NULL,
  day        TEXT NOT NULL,   -- local day in Europe/Rome, as everywhere else
  created_at TEXT NOT NULL,
  state      TEXT NOT NULL    -- 'pending' | 'delivered'
);
```

Rows are never updated in place except `state`, and never deleted: the history
of what was carried forward is worth keeping, and it is the same
event-not-a-box rule as `entries`.

**Only the most recent row matters.** If the person leaves three things hanging
in one conversation, carrying all three back would be an interrogation. The
latest wins.

### 3. Putting it into the instructions

`config/rules/en.md` gains one placeholder, `{{LAST_TIME}}`, inside a marked
block:

```
[LAST TIME]
{{LAST_TIME}}
[/LAST TIME]
```

`build_agent` fills it with the empty state: *"Nothing was left hanging last
time. Do not refer to a previous conversation."*

A Cloudflare function then rewrites **only what sits between those two
markers**, by `GET`ting the agent, replacing the block, and `PUT`ting it back.
`PUT` merges (§6.2a), so every other field is untouched.

**If the markers are not found, it changes nothing and logs loudly.** A prompt
edited by pattern-matching is one bad regex away from destroying a biography,
and §6.2's whole lesson is that a silent no-op is worse than a stop.

**After the `PUT`, it reads the agent back and confirms the note is in it.**
Non-negotiable rule, HANDOVER §4.

### 4. Expiry — one conversation, then gone

Handled in `/token`, which already runs exactly once when a conversation starts
and already writes the conversation row (§6.15).

| State of the latest row at `/token` | What happens |
|---|---|
| `pending` | mark it `delivered`. This conversation is the one that gets it. The instructions already hold it and are not touched. |
| `delivered` | rewrite the block back to the empty-state sentence. It has had its turn. The row stays as it is; the history is kept. |
| none | nothing |

So a note survives exactly one conversation. Without this, Monday's bad night
is asked about every day for a week, which is the *"you told me before"* failure
in a slower form.

All of it inside `waitUntil`, so nobody waits to start talking.

## What this is not

- **No summary of what was discussed.** Out of scope, and it is the quiz.
- **No new facts absorbed into the profile.** That is stage 11, after 30/09.
- **Nothing runs on Claudia's Mac.** No command, no scheduled job.
- **No second LLM.** Set aside 21/09 as overcomplicating something not built.

## Cost

€0. The judgement is made by the model already in the conversation; the storage
is the existing free D1; the agent update is one API call on the key Cloudflare
already holds.

## How it is verified

Unit tests (`npm test`, no network, no key):

1. Replacing the block leaves the rest of the prompt byte-identical.
2. A prompt with no markers is returned unchanged, and reports that it failed.
3. An empty note restores the empty-state sentence.
4. The block can be replaced twice without accumulating.

Over HTTP, as B1 was:

5. `POST /diary/loose-end` stores a row as `pending`.
6. The agent read back from AssemblyAI contains the note in its `system_prompt`.
7. A second `/token` marks it `delivered`; a third clears the block.

By voice, which is the only test that counts:

8. Say something worth returning to. End. Start again. **She raises it, in her
   own words** — or does not, which is allowed, and then the transcript is read
   to see whether she had it and chose not to.

## Known limits, accepted

- **She may not raise it.** Chosen, see above. The video may need two takes.
- **A note written late in a conversation still waits for the next one.** The
  running session keeps the instructions it started with.
- **Only the latest note carries.** Deliberate.
- **`/diary/status` remains unreliable.** Unchanged by this, and no longer
  load-bearing for anything (§6.15).
