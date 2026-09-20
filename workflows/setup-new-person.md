# Workflow: setting up a new person

Runs before any call happens. Ends with a published companion the person can
talk to, and a record of what they agreed to.
Tool: `npm run setup` (`tools/setup_ui/run.mjs`), a form on localhost:3100.

## Who is filling this in

Either **the person themselves**, or **someone close to them**. The form never
assumes which, and never assumes the person is a woman, is old, or is frail.
Everything is written in the neutral **they**, until the person says how they
want to be addressed.

## Objective

Collect the least that makes a good first call, in this order:

1. who they are and how to address them
2. how to reach them
3. who is close to them, and what those people may see
4. what they are like: the five minutes of plain talk
5. the shape of their week
6. the voice, chosen by ear
7. their consent, in their own hands

Nothing here is optional except where it says so. **A skipped step shows up
later as a bad call**, so the form asks for them all and says why each one is
there.

## The steps

### 1. Who they are

| Field | Why it exists |
|---|---|
| Name | Used by the companion in every call. |
| **What they like to be called** | A name on a document is not the name people use. Get it wrong once and the call is a stranger's call. |
| **How to refer to them** (he / she / they / ask them) | The doctrine is neutral. This is the one place the answer is given, and it changes the wording in the profile and, in gendered languages, the grammar of every sentence. |
| **Full date of birth** (optional) | Places their life against what changed in the world, and says when their birthday is. Never spoken back at them as an age. |
| Language | Decides which doctrine file is used. |
| The companion's name | What the person will call it. |

### 2. How to reach them

Phone and email. Two reasons:
- the companion is meant to reach them on a phone number eventually
- an alert about them has to arrive somewhere, and the first "somewhere" is
  them: their diary is theirs first (see `conversation-relationship.md`)

### 3. Their circle

Repeatable: **name, relationship, phone, email**, and what they may see.

Three access levels, and the person chooses per contact:

| Level | What that person gets |
|---|---|
| **Nothing** | They are in the profile as a name the companion can recognise, nothing more. |
| **Emergencies only** | A message when something needs someone now: a fall, "I feel unwell", medicine not taken. |
| **The regular summary** | The daily note, plus emergencies. |

**The person decides this, not the family.** The rule from
`conversation-relationship.md`: the data is theirs, everyone else sees only
what they allow, and they can take it back.

The circle is also conversational material: the companion knows a Thursday
visit is Caterina, and can ask about her by name.

### 4. What they are like

One large box of plain talk, five minutes of it, the way you would describe
someone to a friend. Where they have lived, their family, what they were good
at, what they follow, what they love.

Two smaller boxes:
- **What is normal for them:** hearing, sight, mood, gaps they have had for
  years, words they have always mixed up. Without it, something old gets read
  as something new.
- **What they would rather not talk about:** a place, a person, a period. If it
  comes up, the companion drops it and turns to something else, without asking
  why.
- **Never mention:** the hard list. The dog that died. Money, accounts, bills.
  A person who is gone. The companion never raises these at all, and if the
  person raises one themselves it follows them gently and never corrects them.
  **This list never goes into `intake/<name>.txt`**: handing the generator a
  subject and telling it to avoid it is how the subject ends up in the topics.
  It goes straight into the prompt through `{{NEVER}}`.

### 5. The shape of their week

One line each, `when – what`, in four boxes: their day, their medicines, who
visits and when, their fixed points in the week (the cleaner, the market, a
club, Mass).

**Typed, never inferred from the prose.** The companion treats these as fact,
and stage 6 says nothing the person relies on is ever guessed.

### 6. The voice

**Chosen by ear, never from a list of names.** "Hear this voice" plays the same
short line in the selected voice, and the person picks.

How it works, and why it is safe: AssemblyAI has no standalone text-to-speech,
so the sample is a real session. The page connects, **never opens the
microphone**, collects the greeting audio, hangs up, and plays it locally. A few
seconds, about two cents. The form says the cost before playing anything.

### 7. Consent

Last, on its own, in plain words. It says what the companion does, what is
recorded, who sees what (listing the circle as chosen above), and that it can
be changed or stopped at any time.

- **The person consents**, or whoever legally acts for them.
- Nothing is published until that box is ticked.
- Stored with a date in `config/profiles/<name>/setup.json`, so what they
  agreed to is a fact and not someone's memory.

## Secrets are never stored

Applies to every call, for every person, and is not a setup field.

- The companion **never asks** for a password, a PIN, a bank or card number, the
  code to a safe, an alarm or a key box, or where valuables are kept. If the
  person starts to say one, it stops them kindly, says it does not keep such
  things, and warns them not to give them to anyone over the phone, itself
  included.
- `pull_sessions` **masks them before writing anything to disk**: long runs of
  digits, and anything next to a word like password, PIN or code, become `***`.
  What is kept is the count of turns that touched something secret, as a signal
  for the family view.
- **Why it matters here:** an old person is a target, and whoever is closest
  often has the most access.
- **And their copy is deleted.** `npm run sessions` downloads the timeline and
  the recording, writes them here, and then deletes the session on AssemblyAI.
  `--keep` leaves it, and says so. The local copy is the archive; theirs is a
  queue.

## What it writes

| File | Contents |
|---|---|
| `intake/<name>.txt` | The prose, and the routine in words, for the generator |
| `config/profiles/<name>/habits.json` | The routine as data, for the notebook |
| `config/profiles/<name>/setup.json` | Addressing, date of birth, contacts, circle and access, the never-mention list, consent with its date |
| `config/profiles/<name>/persona.json` | Written by the generator, from the intake |

Then: `PROFILE=<name> npm run ship` publishes, `AGENT=<name> npm start` talks.

## Edge cases

- **The person is setting themselves up.** Their own contact is not repeated in
  the circle, and consent is theirs directly.
- **Someone else is setting them up, and the person is not there.** Consent
  cannot be ticked for them. The form takes everything else and holds the
  profile unpublished until the person, or their legal representative, agrees.
- **A contact with no email and no phone** may still be in the circle with
  access "nothing", as a name the companion knows.
- **They decline a field.** Every field except the name, the language and
  consent can be left empty, and the companion works with less.

## Open

- Sending the alerts at all (channel, cost) is phase C and not decided.
- Gendered languages need the "how to refer to them" answer to reach the
  doctrine file, which today has no placeholder for it.
