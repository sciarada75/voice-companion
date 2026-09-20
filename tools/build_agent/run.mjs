#!/usr/bin/env node
// Assembles agents/<agent>.jsonc from config/profiles/<profile>/persona.json
// + topics.json.
//
// Why it exists: the system_prompt is a JSON string with escaped \n, horrible to
// edit by hand. The real content lives in readable files, and this one puts it
// together.
//
//   PROFILE=<name> node tools/build_agent/run.mjs && AGENT=<name> npm run publish

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { recordableHabits } from '../habits.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

// WHICH person is being assembled. The two paths used to be written in here, and
// as long as they stayed here the system could have ONE person only: that was the
// bottleneck described in HANDOVER §2 (standing someone up cost a day of writing
// by hand).
//
//   PROFILE=<name> node tools/build_agent/run.mjs
//
const PROFILE = process.env.PROFILE || '';
const DIR = `config/profiles/${PROFILE}`;

const profilesAvailable = () =>
  existsSync(join(ROOT, 'config/profiles'))
    ? readdirSync(join(ROOT, 'config/profiles'), { withFileTypes: true })
        .filter(d => d.isDirectory()).map(d => d.name)
    : [];

// No default profile. A default is how a deleted person keeps coming back.
if (!PROFILE) {
  console.error(`\nERROR: say which profile to build.`);
  console.error(`  PROFILE=<name> node tools/build_agent/run.mjs`);
  console.error(`Profiles available: ${profilesAvailable().join(', ') || 'none yet'}\n`);
  process.exit(1);
}

if (!existsSync(join(ROOT, DIR))) {
  console.error(`\nERROR: the profile "${PROFILE}" does not exist.`);
  console.error(`Looked in ${DIR}/`);
  console.error(`Profiles available: ${profilesAvailable().join(', ') || 'none yet'}\n`);
  process.exit(1);
}

const person = read(`${DIR}/persona.json`);
const spine = read(`${DIR}/topics.json`);

// What the agent is called on AssemblyAI and which file it ends up in. It lives
// in the config because two different people are two different agents, with two
// different files.
const AGENT = person.agent?.name ?? PROFILE;
const AGENT_FILE = person.agent?.file ?? PROFILE;

const { name: NAME, agent_name: AGENT_NAME } = person;

// The three axes: good at something, fond of something, loving something. Not
// "the trade": a trade field breaks for a woman born in 1940 who never had paid
// work, whose expertise was real and was never employment.
const list = (xs, pre) => (xs ?? []).map(x => (pre ?? "- ") + x).join(String.fromCharCode(10));
const numbered = xs => (xs ?? []).map((x, i) => (i + 1) + ". " + x).join(String.fromCharCode(10));
// The knobs live in config, not here: change them and republish without touching
// code. See voice_settings in the profile's persona.json.
const voiceSettings = person.voice_settings;

// How things are PRONOUNCED. The synthesiser reads "126" as "one two six", which
// means nothing to them. The spoken form goes into the prompt, so the model does
// not even have the digits to copy.
// These live in config because they depend on THE PERSON and THE LANGUAGE: in
// another language the same number is written differently. Same mechanism,
// one table per profile.
const PRONUNCIATION = person.pronunciation ?? {};
const spoken = n => PRONUNCIATION[n] || n;

// The things they worked with, knew, or care about — whatever the profile names.
// Deliberately generic: a field named after one domain breaks for every person
// whose expertise lies elsewhere, or was never a paid trade at all.
const THINGS = (person.things ?? []).map(spoken);

// Same idea, for STRESS and spelling: words the voice would say wrongly
// (in English, words written one way and said two, like "read" or "wind") are
// respelled so they come out right. On a word that is theirs, a wrong stress is
// the first thing they notice.
// Applies ONLY to spoken text — system_prompt and greeting. Never to
// keyterms and transcription_prompt: those exist to UNDERSTAND them, and they
// say the word normally.
// Pairs [word, how_it_is_to_be_spelled_for_the_voice] taken from the profile's config.
const SPOKEN_STRESS = (person.spoken_stress ?? [])
  .map(([word, sub]) => [new RegExp(`\\b${word}\\b`, 'gi'), sub]);
const forTheVoice = s => SPOKEN_STRESS.reduce(
  (t, [re, sub]) => t.replace(re, m =>
    m === m.toUpperCase() ? sub.toUpperCase()
    : m[0] === m[0].toUpperCase() ? sub[0].toUpperCase() + sub.slice(1)
    : sub),
  s);

// --- the topics, grouped by domain --------------------------------------------
// Separate worlds. When one runs dry, or they do not feel like it today, you
// change world instead of pushing.
// The labels live in topics.json, under "domains": they are THIS person's
// worlds, so they change with her. The rule that NEVER changes, and that holds
// for anybody: a topic without a "it used to be like this, now it is like that"
// is a wasted offer, and must be marked as not to be proposed (see the vegetable
// garden).
const DOMAIN_LABEL = spine.domains ?? {};

// NOTE: the "opening" field does NOT end up in the prompt, on purpose. Give the
// model the exact sentence and it reads it out, and you can hear it: it sounds
// like a call centre. Only the SUBSTANCE goes in here — what he knew, what has
// changed, and the facts it has permission to say. It finds the words by itself,
// as anyone who knows these things would. "opening" stays in the JSON as a
// reminder for Claudia.
const domains = [...new Set(spine.topics.map(t => t.domain))];
const topics = domains.map(dom => {
  const blocks = spine.topics
    .filter(t => t.domain === dom)
    .map(t => {
      // Title and what changed, nothing more. The hook, the anecdote and the
      // "you may say" block tripled the prompt, slowed every reply (3.5 s,
      // 19/09) and buried the rules under the topics (HANDOVER §6.5). They
      // also went in with Italian labels inside an English prompt.
      return t.evolution ? `• ${t.title}: ${t.evolution}` : `• ${t.title}`;
    })
    .join('\n');
  return `${DOMAIN_LABEL[dom] || dom.toUpperCase()}\n${blocks}`;
}).join('\n\n');

// --- the rules text, once per language -----------------------------------------
// It used to live IN HERE, as a 186-line Italian string, and as long as it did
// the system could speak ONE language only: it was the twin of the hard-coded
// paths problem (one person only). Now it lives in config/rules/<language>.md and
// the {{LIKE_THIS}} holes are filled with the profile's data.
//
// What goes in the rules file: the doctrine, which is identical for anybody —
// how the conversation is carried, what the questions have to be like, the wall
// around health. What does NOT go in it: anything concerning one person in
// particular, which comes from the profile.
// No default language either, for the same reason as the profile.
const LANGUAGE = person.language ?? '';
const RULES = `config/rules/${LANGUAGE}.md`;

// A language file is named with a language code: it.md, en.md, pt-BR.md.
// Everything else in the folder is documentation (README.md) and must not be
// treated as a language — the check below tripped over that immediately.
const IS_LANGUAGE = f => /^[a-z]{2}(-[A-Z]{2})?\.md$/.test(f);
const languagesAvailable = () =>
  readdirSync(join(ROOT, 'config/rules')).filter(IS_LANGUAGE);

if (!LANGUAGE || !existsSync(join(ROOT, RULES))) {
  const languages = languagesAvailable().map(f => f.replace(/\.md$/, ''));
  console.error(`\nERROR: ${LANGUAGE ? `no rules for language "${LANGUAGE}"` : 'the profile does not say which language'}.`);
  console.error(`Set "language" in ${DIR}/persona.json.`);
  console.error(`Languages available: ${languages.join(', ') || 'none'}\n`);
  process.exit(1);
}

// The languages must ask for the SAME placeholders. If a hole is added to en.md
// and forgotten in it.md, Italian silently loses a piece of the prompt and
// nobody notices until you talk to it: that is §6.2 again. Checking it costs
// nothing, so it is checked on every build.
{
  const holes = f => new Set(
    [...readFileSync(join(ROOT, 'config/rules', f), 'utf8').matchAll(/\{\{(\w+)\}\}/g)]
      .map(m => m[1]));
  const files = languagesAvailable();
  const ref = files[0], expected = holes(ref);
  for (const f of files.slice(1)) {
    const theirs = holes(f);
    const missing = [...expected].filter(x => !theirs.has(x));
    const extra = [...theirs].filter(x => !expected.has(x));
    if (missing.length || extra.length) {
      console.error(`\nERROR: ${f} and ${ref} do not ask for the same placeholders.`);
      if (missing.length) console.error(`  ${f} does not use: ${missing.join(', ')}`);
      if (extra.length) console.error(`  ${f} uses these as well: ${extra.join(', ')}`);
      console.error('The languages have to stay aligned.\n');
      process.exit(1);
    }
  }
}

// The notebook exists only if the profile has habits.json. The rules text about
// the notebook CANNOT be written by hand in two versions hoping the model picks
// the right one: on 20/09 it told Claudia "I have recorded the vitamins" without
// having any tool at all. So the truth is decided by the code, here, and it ends
// up in the prompt as {{DIARY}}.
const HABITS = `${DIR}/habits.json`;
const habits = existsSync(join(ROOT, HABITS)) ? read(HABITS) : null;
// Only habits the person can report count. A file holding just visits has no
// notebook: the same test decides the tools AND what the prompt claims.
const recordable = recordableHabits(habits);
const hasNotebook = recordable.length > 0;
const DIARY = hasNotebook
  ? 'When they tell you a number or a habit, such as a medicine taken, a reading or a walk, record it with your diary tool, then repeat back exactly what you recorded, number included, so they can catch a mistake. When they ask what is in their diary, read it with the tool and tell them exactly, with the time. If nothing is there, say so. Never guess, and never use a value from another day.'
  : 'YOU HAVE NO DIARY IN THIS VERSION, AND NOTHING THEY SAY IS BEING SAVED. Never say that you have noted, recorded, written down or will remember anything, and never offer to. If they tell you something worth keeping, such as a medicine, say plainly and without fuss that you cannot write it down yet, and that it is coming. Saying you recorded a medicine when you did not is the worst thing you can do in this conversation.';

// The "never mention" list comes from setup.json, written by the setup module,
// and NOT from the profile: the generator must not even see it (give it a topic
// while telling it to avoid that topic, and the topic ends up in the topics).
const SETUP = `${DIR}/setup.json`;
const settings = existsSync(join(ROOT, SETUP)) ? read(SETUP) : null;
const neverMention = (settings?.never_mention ?? []).filter(Boolean);
const NEVER = neverMention.length
  ? neverMention.map((r) => `- ${r}`).join('\n')
  : 'Nothing has been flagged. Even so, the rule below stands.';

const VALUES = {
  DIARY,
  NEVER,
  AGENT: AGENT_NAME,
  PERSON: NAME,
  PERSON_UPPER: String(NAME).toUpperCase(),
  PLACE: person.place,
  YEARS_ACTIVE: person.window,
  YEARS_COUNT: person.years_active,
  YEARS_SINCE: person.years_since,
  GOOD_AT: numbered(person.good_at),
  FOND_OF: list(person.fond_of),
  LOVES: list(person.loves),
  WARNING: person.warning,
  THINGS: THINGS.join(", "),
  PACE: person.pace,
  DOES_NOT_KNOW: list(person.does_not_know),
  EXAMPLES: (spine.examples ?? []).join(String.fromCharCode(10)),
  TOPICS: topics,
};

// A hole left empty stops LOUDLY. Were it let through, the word "undefined"
// would end up in the prompt, the server would accept the whole thing without a
// word of protest, and it would be §6.2 all over again: the file says one thing,
// the agent does another, and nobody notices until you talk to it.
const system_prompt = readFileSync(join(ROOT, RULES), 'utf8')
  .replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = VALUES[key];
    if (v === undefined || v === null || v === '') {
      console.error(`\nERROR: the placeholder {{${key}}} of ${RULES} has no`);
      console.error(`value in the profile "${PROFILE}". Add it, or take the`);
      console.error(`placeholder out of the rules.\n`);
      process.exit(1);
    }
    return String(v);
  });

// --- keyterms -----------------------------------------------------------------
// Not polish, correctness. If the transcriber mishears a word of their own
// trade, the agent answers something they never said, and they conclude
// it is broken. The vocabulary is theirs, so it comes from the profile.
// Max 100: common words dilute the weight of the rest.
const keyterms = [...new Set([...(spine.keyterms ?? []), ...THINGS])];
if (keyterms.length > 100) {
  console.error(`\nERROR: ${keyterms.length} keyterms, the maximum is 100.\n`);
  process.exit(1);
}

// --- the notebook tools -------------------------------------------------------
// Optional. A profile with no habits.json simply has no notebook and no tools.
//
// They carry an "http" block, so AssemblyAI makes the calls from its own server
// rather than the browser. That is the difference between working on a real
// phone call and not: on a phone call there is no web page that could answer a
// tool.
//
// The password travels in a header. publish.mjs substitutes ${DIARY_KEY} from
// .env, and AssemblyAI keeps it encrypted and never reads it back — which is why
// the key is not written here and this file can live in git.
// (read further up, because {{DIARY}} depends on it)

const tools = [];
if (hasNotebook) {
  const base = habits.url || process.env.DIARY_URL;
  if (!base) {
    console.error(`\nERROR: ${HABITS} declares habits but no "url" for the notebook,`);
    console.error(`and DIARY_URL is not set either. The tools have nowhere to call.\n`);
    process.exit(1);
  }
  const key = [{ name: 'x-diary-key', value: '${DIARY_KEY}' }];
  const t = habits.tools ?? {};
  const idList = recordable.map(h => h.id).join(', ');

  tools.push(
    {
      name: 'diary_status',
      // NOT "use this once at the start": there is no start for the model to
      // act at. The greeting is fixed text and never goes through it, so its
      // first turn happens after the person has already spoken. On 20/09 it
      // never used this tool at all. The trigger has to be something it can
      // recognise while talking, so it is phrased as a moment, not a position.
      // What does NOT depend on this any more: recording that a conversation
      // happened (functions/token.js) and knowing what else is already written
      // (it comes back with every diary_record).
      description: t.status ?? `What is already recorded today (${idList}), and whether anything is worth asking about. Use it before you ask them about their routine, so you never ask about something they have already told you.`,
      parameters: { type: 'object', properties: {}, required: [] },
      // "hold": the answer is needed before speaking, and it is a short request.
      execution_mode: 'hold',
      timeout_seconds: 10,
      http: { url: `${base}/status`, http_method: 'GET', headers: key },
    },
    {
      name: 'diary_record',
      description: t.record ?? `Record what they have just said (${idList}). Use it the moment they say it, at any point in the conversation, even mid-subject. Write down only the numbers they actually said: the ones they did not say are left out, never zeroed, never carried over from yesterday.`,
      parameters: {
        type: 'object',
        properties: {
          habit: { type: 'string', description: `One of: ${idList}.` },
          done: { type: 'string', description: 'yes or no. If they gave a number, it is yes.' },
          value: { type: 'number', description: 'The reading, where the habit has one.' },
          units: { type: 'number', description: 'Units taken, where the habit has them.' },
          minutes: { type: 'number', description: 'Minutes, where the habit has them.' },
          steps: { type: 'number', description: 'Steps, where the habit has them.' },
          note: { type: 'string', description: 'Their own words on how it seemed, if they said so. Never a score or a rating.' },
        },
        required: ['habit'],
      },
      // "interactive": the conversation carries on while the write happens. On
      // "hold" the agent would go silent waiting for the database mid-sentence,
      // which is the defect that made the first user abandon a smart speaker.
      execution_mode: 'interactive',
      timeout_seconds: 10,
      http: { url: `${base}/record`, http_method: 'POST', headers: key },
    },
    {
      name: 'diary_read',
      description: t.read ?? 'Read the notebook back when they ask what is recorded ("have I done it yet?", "what was it this morning?"). Answer ONLY with what comes back from here. If there is nothing, say so: do not guess and do not use another day’s value.',
      parameters: {
        type: 'object',
        properties: {
          habit: { type: 'string', description: `One of: ${idList}. Leave it out to get them all.` },
          days: { type: 'number', description: 'How many days back. One is today. Default seven.' },
        },
        required: [],
      },
      execution_mode: 'hold',
      timeout_seconds: 10,
      http: { url: `${base}/history`, http_method: 'GET', headers: key },
    },
  );
}

// --- the voice ----------------------------------------------------------------
// Only voice.voice_id is validated by the API. language_codes and output.voice
// accept any string at all and create the agent without a word of protest, so
// neither proves anything: only speaking to it does. See HANDOVER, constraints.
const VOICE = voiceSettings.voice;
if (!VOICE) {
  console.error(`\nERROR: ${DIR}/persona.json does not say which voice to use.`);
  console.error(`Add "voice" under voice_settings. The API validates this one,`);
  console.error(`so a wrong value fails loudly and lists the valid ones.\n`);
  process.exit(1);
}

const agent = {
  name: AGENT,
  tools,
  system_prompt: forTheVoice(system_prompt),
  // FIXED text, said identically on every call, and it does NOT pass through the
  // model: so it has to open with substance. "Shall we have a chat?" asks
  // permission to converse, which is not how a real conversation starts.
  greeting: forTheVoice(person.greetings.list[person.greetings.chosen_greeting] ?? person.greetings.list[0]),
  voice: { voice_id: VOICE },
  input: {
    language_codes: [LANGUAGE],
    transcription_mode: voiceSettings.transcription_mode,
    transcription_prompt: spine.transcription_prompt ?? '',
    keyterms,
    turn_detection: {
      // min_silence / max_silence are set ON PURPOSE, even though the AssemblyAI
      // docs warn that they switch off the adaptive rhythm. That rhythm protects
      // someone who pauses to hunt for words. Protecting someone who does NOT do
      // that costs a long wait on every turn — the worst defect on a voice-only
      // call, because in silence they think the line dropped and talk over you.
      // max_silence is the ceiling: without it the default is 3000 ms.
      min_silence: voiceSettings.min_silence,
      max_silence: voiceSettings.max_silence,
      // Raised from the 0.5 default: a murmur or speaker echo was enough to
      // trigger an interruption, and every interruption flushes the audio buffer
      // already received — that is how whole words vanished mid-sentence.
      vad_threshold: voiceSettings.vad_threshold,
      interrupt_response: true,
      interruption_delay: voiceSettings.interruption_delay,
    },
  },
  output: { voice: VOICE },

  // llm EMPTY, not absent. The explicit field is needed: the update PUT merges
  // on the server side, so removing the key does NOT clear the previous value —
  // the agent kept hold of the gateway even after I had taken it out of the
  // file. With [] you go back to the model managed by AssemblyAI, included in
  // the price of the session.
  llm: [],
  //
  // Why it is not there: on 8 September I had put claude-sonnet-4-6 in via the
  // LLM Gateway. Result: the greeting went out (the greeting does not pass
  // through the model, it goes straight to the voice) and then total silence,
  // because every reply called the gateway and the gateway answered 400 "Your
  // account does not have access to this LLM Gateway model". Tried 10 different
  // models, not one of them accessible: the gateway is paid for and this account
  // has only the free credits. If one day the account is enabled it can be put
  // back — but it has to be tried with .tmp/diag.mjs first, not taken for
  // granted.
};

const header = `// GENERATED by tools/build_agent/run.mjs — do NOT edit by hand.
// The content lives in ${DIR}/persona.json and ${DIR}/topics.json.
// Regenerate with:  PROFILE=${PROFILE} node tools/build_agent/run.mjs && AGENT=${AGENT_FILE} npm run publish
`;

writeFileSync(join(ROOT, `agents/${AGENT_FILE}.jsonc`), header + JSON.stringify(agent, null, 2) + '\n');

console.log(`agents/${AGENT_FILE}.jsonc written (profile: ${PROFILE})`);
console.log(`  topics:           ${spine.topics.length}`);
console.log(`  keyterms:         ${keyterms.length}`);
console.log(`  system_prompt:    ${system_prompt.length} characters`);
console.log(`  transcription_prompt: ${agent.input.transcription_prompt.length}/1750 characters`);

const notVerified = spine.topics.filter(t => !t.verified).length;
if (notVerified) console.log(`\n  WARNING: ${notVerified}/${spine.topics.length} topics still verified:false`);
if (agent.input.transcription_prompt.length > 1750) console.log('\n  ERROR: transcription_prompt over the 1750 character limit');
