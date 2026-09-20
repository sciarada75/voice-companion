# The doctrine files

One file per language (today only `en.md`). The build picks one using the
`language` field in the profile's `persona.json`, fills the `{{PLACEHOLDER}}`
holes from that profile, and the result becomes the agent's `system_prompt`.
A file counts as a language only if its name looks like `en.md` or `en-GB.md`;
this README is ignored.

## What goes in here, and what does not

**In here: what is true for anyone.** The loop of the conversation, the shape of
the questions, how the voice must sound, the wall around health, how the
notebook is written and read back.

**Not in here: anything about a particular person.** Their name, their skill,
their things, their worked examples. All of that arrives through placeholders,
from `config/profiles/<name>/`. If you find yourself typing a brand, a place or
a person's detail into one of these files, it belongs in the profile instead.

**Never put a sentence in these files that the model could say.** Describe the
move ("ask one open question about where they grew up"), not the words. A
sentence written here gets spoken verbatim: it happened on 19/09.

## The placeholders

All must exist in every language file, and the build **stops** if two languages
do not ask for the same set — otherwise adding a hole to one file and forgetting
another would silently strip a piece of prompt from that language, and nobody
would find out until they spoke to it.

`AGENT` `PERSON` `PLACE` `GOOD_AT` `FOND_OF` `LOVES` `PACE` `WARNING`
`THINGS` `TOPICS` `DIARY`

`DIARY` is not a profile field: the build writes it from whether the profile
has a `habits.json`. Either the agent has the notebook tools and is told how to
use them, or it is told in capitals that nothing is being saved. It must never
be a choice the model makes (see §6.12 in HANDOVER).

The build can still fill `PERSON_UPPER`, `YEARS_*`, `DOES_NOT_KNOW` and
`EXAMPLES`, but the rules no longer ask for them (rewrite, 19/09). The worked
examples were dropped on purpose: example dialogues get recited, and they were
all "expert brought up to date" lectures, which is no longer the shape of the
call.

A placeholder with no value in the profile also stops the build. Letting it
through would put the word "undefined" into the prompt, the server would accept
it without protest, and it would only surface in conversation.

## Adding a language

Copy an existing file, translate the doctrine, keep every placeholder. Then set
`language` in a profile and build. Two things do **not** translate mechanically,
and both live in the profile, not here:

- **Spoken numbers** (`pronunciation`): the voice reads digits literally, so "126"
  becomes "one two six" unless the spoken form is given, and the spoken form is
  different in every language.
- **Words the voice mispronounces** (`spoken_stress`): in English, words
  written one way and said two — *bass, read, lead, wind*; in languages with
  written stress, the accent mark. Same idea: spell it so the voice says it right.

Register does not translate either: some languages have a formal "you". The rule
underneath is the same everywhere — talk to them as an equal, never the way you
would talk to a patient.

## Why the rules are the way they are

These look arbitrary until you know what each one cost.

- **Questions are short** because they exist to let the person get a foot into
  the conversation, not to make them write a report. But **if they start talking
  of their own accord, let them run**: that part is theirs.
- **Introspective forms are banned** ("how did that feel", "how did you find
  it") because they ask the person to account for themselves. Hard work, vague
  answer.
- **No ellipses, no mumbling, no hedging.** Not a style preference: **the voice
  reads exactly what is written**, so an ellipsis becomes a person losing their
  way. This was mistaken for a timbre problem once; it was in the prompt.
- **Open with the substance.** On a voice-only call silence means the line
  dropped, and they start talking over you.
- **Correct grammar always.** The agent must be followable by someone who only
  hears it once and cannot read it again. Simple does not mean ungrammatical.
- **Long answers broken up, with a check in between.** Five facts in a row means
  the first three are lost. **Short things are not broken up** — a "clear so
  far?" after two lines is an irritation.
- **Keep the thread.** An explanation left half-finished because they took the
  conversation elsewhere is not "already covered": follow them, and offer to
  resume when it runs its course. It is the thing a machine usually does not do,
  so it counts double.
- **Never the carer's register.** No praise, no diminutives, no "how are we
  today?".
- **The agent does not pretend to be human**, nor to have done the job. It is
  openly a machine that has read things; they were there.
- **A topic with no jump is a wasted offer.** If nothing about it has changed,
  it is not a topic. This is why a home vegetable garden is never offered: in
  thirty years it has barely changed, and the whole product rests on there being
  a before and an after.
- **Being wrong is not a failure.** If the agent gets a fact wrong and they
  catch it, that gives them back the expert's seat without an interview. This
  deleted a whole layer of fact-guarding tools. **The exception is absolute and
  lives in the notebook:** loose about everything else, exact about health
  numbers.
