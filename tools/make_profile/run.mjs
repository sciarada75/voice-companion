#!/usr/bin/env node
// STAGES 1 AND 2: free text in, a working profile out.
//
//   node tools/make_profile/run.mjs --name nora --lang en --from intake.txt
//
// WHY THIS EXISTS, AND WHY IT IS THE PRODUCT: standing up a new person used to
// cost a day of writing by hand. Nobody fills in a forty-field form about their
// mother, but anyone can talk about her for five minutes. Free text to a
// structured profile is exactly a model's job, and until this existed there was
// no product - there was a prompt generator with one person hardcoded into it.
//
// What comes out: config/profiles/<name>/persona.json and topics.json, ready
// for tools/build_agent. It does NOT publish: that stays a separate, deliberate
// step, because publishing costs money to talk to.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { askForJson } from './model.mjs';
import { intakePrompt, topicsPrompt } from './prompts.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// --- arguments ----------------------------------------------------------------
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
}

const NAME = args.name;
const LANG = args.lang || 'en';
const FROM = args.from;
const AGENT_NAME = args.agent || 'Nora';
const COUNT = Number(args.topics || 12);

if (!NAME || !FROM) {
  console.error(`
Turn a description of a person into a working profile.

  node tools/make_profile/run.mjs --name <slug> --from <file> [--lang en] [--agent <name>] [--topics 12]

  --name    folder name under config/profiles/. Lowercase, no spaces.
  --from    a text file: how a relative would describe them, in plain words.
  --lang    which rules file to build against. Default en.
  --agent   what the companion calls itself. Default Nora.
  --topics  how many topics to write. Default 12.
`);
  process.exit(1);
}

const RULES = join(ROOT, 'config/rules', `${LANG}.md`);
if (!existsSync(RULES)) {
  console.error(`\nERROR: there is no rules file for "${LANG}" (looked for config/rules/${LANG}.md).`);
  console.error(`A profile in a language the doctrine does not cover cannot be built.\n`);
  process.exit(1);
}

const intake = readFileSync(FROM, 'utf8').trim();
if (intake.length < 100) {
  console.error(`\nERROR: ${FROM} is only ${intake.length} characters.`);
  console.error(`That is not enough to build a person from. Five minutes of talking is about 2000.\n`);
  process.exit(1);
}

const DIR = join(ROOT, 'config/profiles', NAME);
mkdirSync(DIR, { recursive: true });

console.log(`\nBuilding "${NAME}" in ${LANG}, from ${FROM} (${intake.length} characters).\n`);

// --- stage 1 ------------------------------------------------------------------
console.log('STAGE 1  intake -> who they are');
const person = await askForJson(
  intakePrompt({ intake, lang: LANG, name: NAME, agentName: AGENT_NAME }),
  { label: 'stage 1' },
);

// The greeting list and the voice knobs are shaped by the builder, not by the
// model: it returns plain strings and the structure is put on here, so a model
// that forgets a wrapper cannot break the build.
person.agent = { name: AGENT_NAME, file: NAME };
person.greetings = {
  _readme:
    'FIXED text, said identically on every call, and it does NOT pass through ' +
    'the model. The first is the introduction for the first call; the others are ' +
    'for later calls. Each ends by asking how they are, which the rules pick up. ' +
    'Rotation is not built yet, so change chosen_greeting by hand.',
  chosen_greeting: 0,
  list: Array.isArray(person.greetings) ? person.greetings : [String(person.greetings ?? '')],
};
person.pronunciation = person.pronunciation ?? {
  _readme:
    'The synthesiser reads the characters it is given: "126" comes out "one two ' +
    'six". Put the SPOKEN form here, keyed by how it is written elsewhere.',
};
person.spoken_stress = person.spoken_stress ?? [];
person.voice_settings = {
  _readme: 'The rhythm knobs. Change here, then rebuild and republish.',
  voice: args.voice || 'anna',
  _voice: 'The API validates this one. A wrong value fails and lists the 18 valid names.',
  transcription_mode: 'balanced',
  _transcription_mode:
    'balanced = answers at a natural pace. max_accuracy waits much longer before ' +
    'deciding they have finished: only for someone who stops to hunt for words.',
  min_silence: 600,
  _min_silence: 'ms of silence before their turn is considered over. Raise it if they get cut off.',
  max_silence: 1800,
  _max_silence: 'ms ceiling on waiting. Without it the default is 3000, which felt like a dropped line.',
  interruption_delay: 1000,
  _interruption_delay: 'How long they must really talk over the agent before it stops. At maximum: fewer accidental cuts, fewer lost words.',
  vad_threshold: 0.75,
  _vad_threshold: 'How speech-like a sound must be to count. Default 0.5 was so sensitive that speaker echo triggered an interruption, and every interruption flushes the audio buffer - that is how whole words vanished.',
};

writeFileSync(join(DIR, 'persona.json'), JSON.stringify(person, null, 2) + '\n');
console.log(`         ${person.name}, ${person.place}`);
console.log(`         good at ${(person.good_at || []).length}, follows ${(person.fond_of || []).length}, loves ${(person.loves || []).length}`);

// --- stage 2 ------------------------------------------------------------------
console.log('\nSTAGE 2  who they are -> what to talk about');
const topics = await askForJson(
  topicsPrompt({ person, lang: LANG, count: COUNT }),
  { label: 'stage 2' },
);

// THE IRON RULE, ENFORCED IN CODE AND NOT IN HOPE. A topic with no
// before-and-after is a wasted offer: the entire product rests on the agent
// having something they missed. Asking the model nicely is not enough, so
// anything without an "evolution" is dropped here and the drop is reported.
const kept = [];
const dropped = [];
for (const a of topics.topics ?? []) {
  if (!a.evolution || String(a.evolution).trim().length < 20) dropped.push(a.title || a.id);
  else kept.push({ ...a, verified: false });
}
topics.topics = kept;

writeFileSync(join(DIR, 'topics.json'), JSON.stringify(topics, null, 2) + '\n');

console.log(`         ${kept.length} topics across ${Object.keys(topics.domains || {}).length} worlds`);
if (dropped.length) {
  console.log(`         ${dropped.length} dropped for having no before-and-after: ${dropped.join(', ')}`);
}

// --- what a human has to look at before this is published ---------------------
console.log(`\nWritten to config/profiles/${NAME}/`);

const inferred = person.inferred ?? [];
if (inferred.length) {
  console.log(`\nINFERRED, NOT TOLD - confirm these before publishing:`);
  for (const d of inferred) console.log(`  ${d.field}: ${d.value}\n    because: ${d.why}`);
  console.log(`\n  A wrong detail about someone's life is the fastest way to prove the`);
  console.log(`  system does not know them. This list is the guard against that.`);
}

console.log(`\nEvery topic is marked verified:false. Nothing here has been checked.`);
console.log(`\nNext:`);
console.log(`  PROFILE=${NAME} node tools/build_agent/run.mjs`);
console.log(`  AGENT=${NAME} npm run publish`);
console.log(`  AGENT=${NAME} npm start\n`);
