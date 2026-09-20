// The two prompts that do stages 1 and 2. Kept apart from the runner so the
// wording can be read and argued with without reading any plumbing.

// --- stage 1: free text in, structured person out -----------------------------
//
// The guard that matters is the said/inferred split. The worst defect this
// project has had was a detail about someone's life that had been INFERRED and
// written down as fact - a job they never did. A wrong detail about someone's life is the fastest way to prove the
// system does not know them, and a model writing profiles will infer
// constantly. So every inference has to declare itself and get shown to a human
// before anything is published.
export function intakePrompt({ intake, lang, name, agentName }) {
  return `You are building a profile for a voice companion that talks to an old person.

Below is how a relative described them, in their own words. Turn it into JSON.

THE RULE THAT MATTERS MOST: distinguish what you were TOLD from what you
INFERRED. If the text says she worked in a factory, you may NOT write that she
ran it. A wrong detail about someone's life is the fastest way to prove to them
that the system does not know them. Anything you did not
read in the text goes in "inferred" with your reasoning, so a person can confirm
or kill it before it is published.

THE THREE AXES. Do not look for "their job". Many people of this generation,
especially women, never had paid work and were expert anyway. Look for:
  - good_at  what they were genuinely good at, paid or not
  - fond_of  what they follow and care about
  - loves    who and what they love: people, a place, a team, music

WHO THEY ARE TALKING TO: the companion is called ${agentName}. It is openly a
machine. It carries the weight of the conversation: it offers two or three
concrete directions, tells them something real, then asks a question answerable
in two words. It is NOT a carer and never uses that register.

Write every text value in ${lang === 'en' ? 'English' : lang}.

Return ONLY this JSON object:

{
  "name": ${JSON.stringify(name)},
  "agent_name": ${JSON.stringify(agentName)},
  "language": ${JSON.stringify(lang)},
  "place": "where they live, as the agent would say it out loud",
  "window": "the years they were active, e.g. 1958-1994",
  "years_active": 0,
  "years_since": 0,
  "good_at": ["one line per skill. Keep separate things SEPARATE and say so if they must not be conflated."],
  "fond_of": ["one line per interest"],
  "loves": ["one line per person, place or thing they love"],
  "warning": "the one thing a stranger would get wrong about them, stated as a warning to the agent. Empty string if the text gives you none.",
  "condition": "anything about sight, hearing, mobility - and whether it means frail. Poor sight or hearing does not mean frail and does not mean slow.",
  "pace": "how they speak: speed, whether they hunt for words. This sets the turn-detection timing, so guessing here costs real latency.",
  "knows_well": ["what they know deeply, in their own terms"],
  "does_not_know": ["what arrived in their field AFTER they stopped. This is the agent's half of the exchange, not a quiz they must pass."],
  "things": ["the specific named things that pass through the conversation - models, tools, makes, places. These become transcription hints, so name them exactly."],
  "greetings": ["3 opening lines. FIXED text, and it does NOT pass through the model. The FIRST is the introduction for the very first call: their name, the agent's name, 'your companion', that it is happy to talk with them, keep track of their habits and keep a diary of them together, and it ends by asking how they are today. The others are for later calls: a warm hello by name, then how they are today. Short, spoken, warm, no exclamation marks, no time of day (the greeting does not know it)."],
  "inferred": [{ "field": "field name", "value": "what you put", "why": "why you inferred it" }]
}

Here is the description:

---
${intake}
---`;
}

// --- stage 2: person in, things to talk about out -----------------------------
//
// The iron rule is the before-and-after. A topic where nothing has changed is a
// wasted offer: the whole product rests on the agent having something they
// missed. This is why a home vegetable garden is never a topic - in thirty
// years it has barely changed.
export function topicsPrompt({ person, lang, count }) {
  return `You are writing the things a voice companion can talk about with one specific old person.

THE IRON RULE: every topic must have a genuine BEFORE AND AFTER. Something they
knew, and what happened to it since. If nothing about it has changed, it is not
a topic - leave it out. This applies to what they loved as much as to what they
did: the town changed, the team changed, the music came back.

DO NOT write a health topic. Health is handled separately and under a hard rule:
the agent describes how a device works and how it changed, and never says what
they should do, never doses or timings, never whether a value is high or low.

BE HONEST ABOUT CONFIDENCE. These are facts an expert will check. Being wrong
and corrected is fine and even valuable - it hands them back the expert's seat.
Being confidently wrong about a date is what makes the agent sound stupid. So
put a real note in "confidence" and never inflate it.

Write everything in ${lang === 'en' ? 'English' : lang}.

The person:
${JSON.stringify(person, null, 2)}

Return ONLY this JSON object. Write ${count} topics, spread across their
different worlds so the conversation can change subject when one runs dry.

{
  "domains": { "short_key": "LABEL - what this world is, one line. One entry per distinct world." },
  "keyterms": ["words the transcriber will mishear. Their vocabulary, names, makes, tools. No common words: they dilute the rest. Under 80."],
  "transcription_prompt": "one paragraph describing the conversation so the transcriber knows what it is hearing: who this person is, what gets discussed, the specific names. Under 1500 characters.",
  "examples": [
    "OFFERING: \\"...\\"  - an example of offering two or three concrete directions",
    "TELLING AND COMPARING, THEN A SHORT QUESTION: \\"...\\"",
    "TELLING SOMETHING TECHNICAL: \\"...\\"",
    "TAKING A CORRECTION: \\"...\\""
  ],
  "topics": [
    {
      "id": "short-slug",
      "title": "what this topic is",
      "hook": "the thing THEY know, in their terms - what the agent comes back to after they have spoken",
      "evolution": "what changed since. REQUIRED. No change, no topic.",
      "anecdote": "something concrete to put in front of them to react to. Not a question.",
      "answer": "the exact facts the agent is allowed to state. Only what you are confident of.",
      "verified": false,
      "confidence": "honestly: what here is solid and what needs checking",
      "domain": "one of the domains keys"
    }
  ]
}`;
}
