// Stage 9: the page the family actually reads.
//
//   PROFILE=peggy npm run report                write it, then serve it on :3200
//   PROFILE=peggy npm run report -- --no-serve  write the file and stop
//
// Shape, decided by Claudia 20/09:
//   - a wrap-up sentence first
//   - then five indicators, each read at three scales (today, 7 days, 30 days)
//   - at a glance ONLY the levels show: fine / to be verified / critical.
//     Any row opens to the notes and their own words
//   - below that, every month since the first call, compacted and expandable
//   - and an acknowledgement, so it is known that somebody read it
//
// Not a log. A log is what a family stops opening after the second week.
//
// Division of labour, deliberately:
//   - "how they spoke" is ARITHMETIC (compute_metrics plus the masked-secret
//     counter), identical for anyone who runs it
//   - the five indicators are read from the transcripts by the model, which
//     may describe and may never diagnose (§5.4: no "decline", no "cognitive",
//     no threshold dressed up as clinical — that is a medical-device claim)
//   - every reading compares them with THEIR OWN earlier calls, never a norm
//
// WHY IT IS SERVED AND NOT JUST WRITTEN: an acknowledgement has to be stored,
// and a page opened from the filesystem cannot store anything. The server is
// local, and nothing leaves the machine.
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { askForJson } from '../make_profile/model.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PROFILE = process.env.PROFILE || '';
if (!PROFILE) {
  console.error('\nERROR: say which profile.\n  PROFILE=<name> npm run report\n');
  process.exit(1);
}
const PORT = Number(process.env.PORT) || 3200;
const SERVE = !process.argv.includes('--no-serve');

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const exists = (p) => existsSync(join(ROOT, p));
const DIR = join(ROOT, 'sessions', PROFILE);
if (!existsSync(DIR)) {
  console.error(`\nERROR: no calls stored for "${PROFILE}". Run: PROFILE=${PROFILE} npm run sessions\n`);
  process.exit(1);
}
const STATE = join(ROOT, 'state');
mkdirSync(STATE, { recursive: true });

const settings = exists(`config/profiles/${PROFILE}/setup.json`) ? read(`config/profiles/${PROFILE}/setup.json`) : null;
const person = exists(`config/profiles/${PROFILE}/persona.json`) ? read(`config/profiles/${PROFILE}/persona.json`) : null;
const habits = exists(`config/profiles/${PROFILE}/habits.json`) ? read(`config/profiles/${PROFILE}/habits.json`) : null;
const CALLED = settings?.called || person?.name || PROFILE;

// What we believe about them, so the model can notice where what they say and
// what we were told do not hold together. Masked transcripts only.
const KNOWN = [
  person?.place && `lives in ${person.place}`,
  person?.good_at && `was good at: ${[].concat(person.good_at).join('; ').slice(0, 400)}`,
  person?.loves && `loves: ${[].concat(person.loves).join('; ').slice(0, 300)}`,
  (settings?.circle ?? []).length &&
    `people around them: ${settings.circle.map((c) => `${c.name}${c.relationship ? ` (${c.relationship})` : ''}`).join(', ')}`,
  (habits?.habits ?? []).length &&
    `their routine: ${habits.habits.map((a) => `${a.what}${a.when ? ` at ${a.when}` : ''}`).join('; ')}`,
].filter(Boolean).join('\n');

const metrics = JSON.parse(
  execFileSync(process.execPath, [join(ROOT, 'tools/compute_metrics/run.mjs'), '--json'], {
    env: { ...process.env, PROFILE },
    encoding: 'utf8',
  }),
);
const savedCalls = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => read(`sessions/${PROFILE}/${f}`))
  .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

const average = (r, k) => (r.length ? Math.round(r.reduce((n, c) => n + (c[k] ?? 0), 0) / r.length) : null);
const sum = (r, k) => r.reduce((n, c) => n + (c[k] ?? 0), 0);
const when = (c) => new Date(c.created_at ?? c.when).getTime();

const INDICATORS = ['self_awareness', 'routine', 'mood', 'body', 'private_information'];
const LABELS = {
  self_awareness: ['Knowing where they are', 'who they are, where they are, who is around, and whether it all holds together'],
  routine: ['Their routine', 'medicines, moving about, waking and sleeping'],
  mood: ['Mood', 'weeping, worry, anger, disappointment, or content'],
  body: ['The body', 'pain, aches, tremor, cold, chills, in their words'],
  private_information: ['Private information', 'anyone asking about accounts, PINs, cards, documents or money'],
};
const SHORT = { self_awareness: 'awareness', routine: 'routine', mood: 'mood', body: 'body', private_information: 'private' };

// --- the arithmetic ------------------------------------------------------------
function numbersFor(from, to) {
  const within = metrics.calls.filter((c) => when(c) >= from && when(c) < to);
  const before = metrics.calls.filter((c) => when(c) < from);
  const secrets = savedCalls
    .filter((c) => when(c) >= from && when(c) < to)
    .reduce((n, c) => n + (c.turns_with_secrets ?? 0), 0);
  return {
    calls: within.length,
    minutes: Math.round(sum(within, 'duration_s') / 60),
    their_share: average(within, 'their_share'),
    average_answer: average(within, 'average_answer_words'),
    flat: sum(within, 'flat_answers'),
    flat_in_a_row: sum(within, 'flat_in_a_row'),
    median_wait_ms: average(within, 'median_delay_ms'),
    turns_with_secrets: secrets,
    comparison: before.length
      ? { calls: before.length, their_share: average(before, 'their_share'), average_answer: average(before, 'average_answer_words') }
      : null,
  };
}

const transcriptsFor = (from, to, limit) =>
  savedCalls
    .filter((c) => when(c) >= from && when(c) < to)
    .map((c) => {
      const turns = (c.timeline?.turns ?? [])
        .flatMap((t) => [t.user_transcript && `THEM: ${t.user_transcript}`, t.agent_text && `COMPANION: ${t.agent_text}`])
        .filter(Boolean)
        .join('\n');
      return `--- call of ${new Date(c.created_at).toLocaleString()}\n${turns}`;
    })
    .join('\n\n')
    .slice(-limit);

// --- the read indicators -------------------------------------------------------
async function readPeriod(from, to, title, characters = 22_000) {
  const numbers = numbersFor(from, to);
  if (!numbers.calls) return { empty: true, numbers };

  const prompt = `You read the phone calls between ${CALLED} and their AI companion, and report to the people ${CALLED} has allowed to see this.

THE RULES, ABSOLUTE:
- Describe what happened. Never diagnose, never predict, never advise a treatment.
- Forbidden words: decline, cognitive, dementia, symptom of, risk of, concerning, deterioration.
- Compare ${CALLED} only with their own earlier calls. Never with other people, never with a norm for their age.
- Quiet is good news and must read as good news. Do not invent a worry to fill a field.
- Never repeat anything that looks like a password, a code, an account or a card number, even if it appears below.
- Plain English. Short sentences.

WHAT WE BELIEVE ABOUT THEM (may itself be wrong, they are the authority):
${KNOWN || 'Nothing on file.'}

THE CALLS IN THIS PERIOD (${title}, transcripts, already masked):
${transcriptsFor(from, to, characters)}

Report on exactly these, each with a level of exactly "fine", "to be verified" or "critical":
- "fine" means nothing stands out, or it went well. Most rows, most weeks, are fine.
- "to be verified" means something a person should look at, not something that is wrong yet.
- "critical" means somebody should act today.

1. self_awareness — do they know who they are, where they are, what day or time it is, who is around them? Does what they say hold together with what we believe, and with what they said earlier in the same period? Someone correcting our information is NOT a problem: they are the authority. It is worth noting when they contradict themselves.
2. routine — medicines, walking or other activity, waking and going to bed, and anything else in their routine above. Kept or not kept. Oversleeping, a skipped walk, a night without sleep, a missed tablet: each is worth noticing. A routine that holds is "fine" and should say so.
3. mood — did they weep, complain, or show fear, worry, anger or disappointment? Also say when they sounded content, since that is the same measure.
4. body — pain, aches, tremor, feeling cold, chills, dizziness, anything physical they mentioned. Their words, never an interpretation.
5. private_information — did anyone ask them for an account, a PIN, card details, money, their address or documents? Did they talk about money worries, or about someone pressing them? This is about people taking advantage of them, so any sign at all is at least "to be verified".

Answer with JSON only:
{
 "summary": "one sentence, under 25 words, that someone reads in a corridor",
 "self_awareness": { "level": "...", "note": "one or two short sentences", "evidence": "their own words, short, or an empty string" },
 "routine": { "level": "...", "note": "...", "evidence": "..." },
 "mood": { "level": "...", "note": "...", "evidence": "..." },
 "body": { "level": "...", "note": "...", "evidence": "..." },
 "private_information": { "level": "...", "note": "...", "evidence": "..." },
 "worth_a_call": "one sentence about what would be worth ringing them about, or an empty string"
}`;

  const reading = await askForJson(prompt, { label: title });
  return { ...reading, numbers };
}

// --- the three rolling scales ---------------------------------------------------
const NOW = Date.now();
const WINDOWS = [
  { key: 'today', title: 'today', days: 1, characters: 14_000 },
  { key: 'week', title: 'seven days', days: 7, characters: 22_000 },
  { key: 'month', title: 'thirty days', days: 30, characters: 26_000 },
];

console.log(`Reading ${savedCalls.length} stored calls for "${PROFILE}"...`);
const readings = {};
for (const f of WINDOWS) {
  process.stdout.write(`  ${f.title}... `);
  readings[f.key] = await readPeriod(NOW - f.days * 86_400_000, NOW + 1, f.title, f.characters);
  console.log(readings[f.key].empty ? 'no calls' : 'done');
}

// --- every month since the first call ------------------------------------------
// A month that is over never changes, so it is read once and kept. Only a month
// with new calls in it is read again. Without this cache, a year of history
// would mean twelve model calls every time somebody opens the page.
const ARCHIVE = join(STATE, `months-${PROFILE}.json`);
const archive = existsSync(ARCHIVE) ? JSON.parse(readFileSync(ARCHIVE, 'utf8')) : {};
const months = [];
if (savedCalls.length) {
  const first = new Date(when(savedCalls[0]));
  const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
  const end = new Date();
  while (cursor <= end) {
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getTime();
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1).getTime();
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    const title = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });
    const n = metrics.calls.filter((c) => when(c) >= from && when(c) < to).length;
    if (n) months.push({ key, title, from, to, calls: n });
    cursor.setMonth(cursor.getMonth() + 1);
  }
}
for (const m of months.slice().reverse()) {
  const inCache = archive[m.key];
  if (inCache && inCache.calls === m.calls) {
    m.reading = inCache.reading;
    continue;
  }
  process.stdout.write(`  ${m.title}... `);
  m.reading = await readPeriod(m.from, m.to, m.title, 26_000);
  archive[m.key] = { calls: m.calls, reading: m.reading, written: new Date().toISOString() };
  console.log('done');
}
writeFileSync(ARCHIVE, JSON.stringify(archive, null, 1) + '\n');

// --- who has read it ------------------------------------------------------------
const ACKNOWLEDGEMENTS = join(STATE, `acknowledgements-${PROFILE}.json`);
const acknowledged = () => (existsSync(ACKNOWLEDGEMENTS) ? JSON.parse(readFileSync(ACKNOWLEDGEMENTS, 'utf8')) : []);
const CIRCLE = (settings?.circle ?? []).filter((c) => c.access && c.access !== 'none');

// --- who may open it ------------------------------------------------------------
// The circle, and nobody else. Each person has their own key (written by the
// setup form), so the page knows who is reading without accounts or passwords,
// and an acknowledgement is signed by whoever the link belongs to. Taking
// access away is deleting that person's line in setup.json.
//
// "emergencies only" is not "the summary": those keys are told so, and see
// nothing else. And a profile set up before keys existed still has to be
// readable by whoever runs this, so one owner key is made and printed here.
const KEYS = new Map();
for (const c of CIRCLE) {
  if (c.key && c.access === 'summary') KEYS.set(c.key, { name: c.name, full: true });
  else if (c.key) KEYS.set(c.key, { name: c.name, full: false });
}
const OWNER_KEY_FILE = join(STATE, `report-key-${PROFILE}.txt`);
if (!existsSync(OWNER_KEY_FILE)) writeFileSync(OWNER_KEY_FILE, randomBytes(12).toString('hex') + '\n');
const ownerKey = readFileSync(OWNER_KEY_FILE, 'utf8').trim();
KEYS.set(ownerKey, { name: `${CALLED} (owner link)`, full: true });

// --- the page -------------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const levelClass = (l) => (/critic/i.test(l) ? 'high' : /verif/i.test(l) ? 'medium' : 'low');
const worstLevel = (levels) => {
  const v = levels.filter(Boolean);
  if (v.some((l) => /critic/i.test(l))) return 'critical';
  if (v.some((l) => /verif/i.test(l))) return 'to be verified';
  return v.length ? 'fine' : '';
};

const detail = (indicator, title, reading) => {
  if (!reading || reading.empty) return `<div class="scale"><b>${esc(title)}</b><p class="empty">no calls</p></div>`;
  const v = reading[indicator];
  if (!v) return '';
  return `<div class="scale"><b>${esc(title)} &middot; <span class="${levelClass(v.level)}">${esc(v.level)}</span></b>
    <p>${esc(v.note)}</p>${v.evidence ? `<q>${esc(v.evidence)}</q>` : ''}</div>`;
};

// One row per indicator: the three levels are what you see; everything else is
// behind the disclosure triangle.
const indicatorRow = (indicator) => {
  const [title, sub] = LABELS[indicator];
  const dots = WINDOWS.map((f) => {
    const v = readings[f.key]?.[indicator];
    return v
      ? `<span class="dot ${levelClass(v.level)}"><i>${f.title}</i>${esc(v.level)}</span>`
      : `<span class="dot empty"><i>${f.title}</i>&mdash;</span>`;
  }).join('');
  const worst = worstLevel(WINDOWS.map((f) => readings[f.key]?.[indicator]?.level));
  return `<details class="row ${levelClass(worst)}">
  <summary><span class="name">${title}<small>${sub}</small></span><span class="levels">${dots}</span></summary>
  <div class="details">${WINDOWS.map((f) => detail(indicator, f.title, readings[f.key])).join('')}</div>
</details>`;
};

// One row per month, all the way back to the first call.
const monthRow = (m) => {
  const l = m.reading ?? {};
  const chip = INDICATORS.map((v) => {
    const x = l[v];
    return `<span class="mini ${levelClass(x?.level)}" title="${esc(LABELS[v][0])}: ${esc(x?.level ?? 'no calls')}">${SHORT[v]}</span>`;
  }).join('');
  const worst = worstLevel(INDICATORS.map((v) => l[v]?.level));
  return `<details class="row month ${levelClass(worst)}">
  <summary><span class="name">${esc(m.title)}<small>${m.calls} call${m.calls === 1 ? '' : 's'} &middot; ${
    l.numbers?.minutes ?? 0} minutes &middot; ${l.numbers?.their_share ?? 0}% of the talking theirs</small></span>
  <span class="levels">${chip}</span></summary>
  <div class="details month-details">
    <p class="summary">${esc(l.summary ?? '')}</p>
    ${INDICATORS.map((v) => detail(v, LABELS[v][0], l)).join('')}
  </div>
</details>`;
};

const numbersRow = (label, take, format = (x) => x) =>
  `<tr><th>${label}</th>${WINDOWS.map((f) => {
    const n = readings[f.key]?.numbers;
    const v = n ? take(n) : null;
    return `<td>${v === null || v === undefined ? '&mdash;' : format(v)}</td>`;
  }).join('')}</tr>`;

function page(who) {
  const week = readings.week;
  const comparison = week?.numbers?.comparison;
  const done = acknowledged();
  const latest = done.at(-1);
  const firstCall = savedCalls.length ? new Date(when(savedCalls[0])) : null;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(CALLED)} &mdash; how it is going</title>
<style>
 :root{color-scheme:light dark;--ink:#1c1a17;--bg:#f7f4ef;--line:#d8d3cb;--soft:#efece5;--accent:#1d6f5c;
       --low:#1d6f5c;--medium:#9a6b1f;--high:#a33028}
 @media (prefers-color-scheme: dark){:root{--ink:#f0ece5;--bg:#17150f;--line:#3a3630;--soft:#201d16;--accent:#79c9b1;
       --low:#79c9b1;--medium:#dcae5f;--high:#e98a80}}
 body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 ui-serif,Georgia,serif}
 main{max-width:56rem;margin:0 auto;padding:2.6rem 1.1rem 5rem}
 h1{font-size:.95rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;opacity:.6;margin:0 0 1.1rem}
 h2{font-size:.85rem;letter-spacing:.06em;text-transform:uppercase;opacity:.6;margin:2.4rem 0 .6rem}
 .title{font-size:1.65rem;line-height:1.35;margin:0 0 1.2rem}
 .call{background:var(--soft);border-left:3px solid var(--accent);padding:.85rem 1rem;border-radius:.3rem;margin:0 0 1.4rem}
 .row{border-bottom:1px solid var(--line)}
 .row summary{display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap;
   padding:.75rem .2rem;cursor:pointer;list-style:none}
 .row summary::-webkit-details-marker{display:none}
 .row summary::before{content:'+';font-family:ui-monospace,monospace;opacity:.45;width:1rem;flex:0 0 auto}
 .row[open] summary::before{content:'–'}
 .row:hover summary{background:var(--soft)}
 .name{flex:1 1 14rem;font-weight:600}
 .name small{display:block;font-weight:400;opacity:.6;font-size:.8rem;line-height:1.35;margin-top:.1rem}
 .levels{display:flex;gap:.4rem;flex:0 0 auto;flex-wrap:wrap}
 .dot{min-width:8.4rem;padding:.3rem .55rem;border-radius:.3rem;background:var(--soft);
   font-size:.78rem;letter-spacing:.04em;text-transform:uppercase;font-weight:600;text-align:center}
 .dot i{display:block;font-style:normal;font-weight:400;text-transform:none;letter-spacing:0;
   font-size:.72rem;opacity:.6;margin-bottom:.1rem}
 .mini{padding:.28rem .5rem;border-radius:.3rem;background:var(--soft);font-size:.7rem;letter-spacing:.04em;
   text-transform:uppercase;font-weight:600}
 .low,.dot.low,.mini.low{color:var(--low)}
 .medium,.dot.medium,.mini.medium{color:var(--medium)}
 .high,.dot.high,.mini.high{color:var(--high)}
 .dot.medium,.mini.medium{background:color-mix(in srgb, var(--medium) 12%, transparent)}
 .dot.high,.mini.high{background:color-mix(in srgb, var(--high) 14%, transparent)}
 .dot.empty{opacity:.4}
 .details{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));gap:1.1rem;
   padding:.2rem .2rem 1.2rem 1.2rem}
 .month-details .summary{grid-column:1/-1;margin:0;font-size:1.02rem}
 .scale b{font-size:.76rem;letter-spacing:.05em;text-transform:uppercase;opacity:.75}
 .scale b span{opacity:1}
 .scale p{margin:.3rem 0 0;font-size:.93rem}
 .scale q{display:block;font-size:.87rem;opacity:.75;margin-top:.4rem;font-style:italic}
 .empty{opacity:.45}
 details.block>summary{cursor:pointer;font-size:.85rem;letter-spacing:.06em;text-transform:uppercase;opacity:.6;
   margin:2.4rem 0 .6rem}
 table{border-collapse:collapse;width:100%}
 th,td{text-align:left;padding:.55rem .6rem;border-bottom:1px solid var(--line);vertical-align:top}
 thead th{font-size:.78rem;letter-spacing:.05em;text-transform:uppercase;opacity:.6;font-weight:600}
 .numbers td{font-variant-numeric:tabular-nums}
 .read{display:flex;gap:.8rem;align-items:center;flex-wrap:wrap;background:var(--soft);border-radius:.4rem;
   padding:.8rem 1rem;margin:0 0 2rem;font-size:.93rem}
 .read select,.read input{font:inherit;padding:.45rem .5rem;border:1px solid var(--line);border-radius:.3rem;
   background:transparent;color:inherit}
 .read button{font:inherit;font-weight:600;padding:.5rem 1rem;border-radius:.3rem;border:1px solid var(--accent);
   background:var(--accent);color:#fff;cursor:pointer}
 .read .history{opacity:.7;font-size:.85rem;flex-basis:100%;margin:0}
 footer{margin-top:2.6rem;font-size:.85rem;opacity:.72}
 footer p{margin:.5rem 0}
</style></head><body><main>
<h1>${esc(CALLED)} &mdash; how it is going</h1>
<p class="title">${esc(week?.summary ?? 'No calls in the last seven days.')}</p>
${week?.worth_a_call ? `<p class="call"><strong>Worth a call:</strong> ${esc(week.worth_a_call)}</p>` : ''}

<form class="read" method="post" action="/acknowledge">
  ${latest
    ? `<span>Last acknowledged by <strong>${esc(latest.who)}</strong>, ${esc(new Date(latest.when).toLocaleString())}.</span>`
    : '<span><strong>Nobody has acknowledged this yet.</strong></span>'}
  <span style="opacity:.7">You are reading as <strong>${esc(who)}</strong>.</span>
  <button type="submit">I have read this</button>
  ${done.length > 1
    ? `<p class="history">Before that: ${done.slice(0, -1).reverse().slice(0, 4)
        .map((r) => `${esc(r.who)} on ${esc(new Date(r.when).toLocaleDateString())}`).join(' &middot; ')}</p>`
    : ''}
</form>

<h2>At a glance</h2>
<p style="margin:.2rem 0 1rem;font-size:.9rem;opacity:.72">Green needs nothing. Open a row to see what was said, today and over the weeks behind it.</p>
${INDICATORS.map(indicatorRow).join('\n')}

<h2>Month by month${firstCall ? `, since ${esc(firstCall.toLocaleDateString())}` : ''}</h2>
<p style="margin:.2rem 0 1rem;font-size:.9rem;opacity:.72">Newest first. The five marks are the same indicators, so a run of quiet months is visible without opening anything.</p>
${months.length ? months.slice().reverse().map(monthRow).join('\n') : '<p class="empty">Nothing yet.</p>'}

<details class="block"><summary>How they spoke &mdash; the counted part</summary>
<p style="margin:.2rem 0 .8rem;font-size:.9rem;opacity:.72">Counted, not interpreted. The useful one is the change against their own earlier calls.</p>
<table class="numbers"><thead><tr><th></th>${WINDOWS.map((f) => `<th>${f.title}</th>`).join('')}</tr></thead><tbody>
${numbersRow('calls', (n) => n.calls)}
${numbersRow('minutes talking', (n) => n.minutes)}
${numbersRow('their share of the words', (n) => n.their_share, (v) => v + '%')}
${numbersRow('average answer', (n) => n.average_answer, (v) => v + ' words')}
${numbersRow('one-word answers', (n) => n.flat)}
${numbersRow('times two came in a row', (n) => n.flat_in_a_row)}
${numbersRow('pause before they answer', (n) => n.median_wait_ms, (v) => (v / 1000).toFixed(1) + ' s')}
${numbersRow('turns where a code or account came up', (n) => n.turns_with_secrets)}
</tbody></table></details>

<footer>
<p>${comparison
    ? `Their own baseline, from the ${comparison.calls} calls before this week: ${comparison.their_share}% of the talking, ${comparison.average_answer} words an answer. Everything here is measured against that, and against nothing else.`
    : 'There is nothing earlier to compare with yet, so these calls are the baseline.'}</p>
<p>A pause before answering is not only them: it includes the time the companion waits to be sure they have finished.</p>
<p>This describes phone calls. It is not a medical opinion and it is not advice. Anything that looks like a code, an account or a card number is removed before a call is stored, and only the fact that one came up is kept.</p>
<p>${settings
    ? `Who may see this: ${CIRCLE.map((c) => `${esc(c.name)} (${esc(c.access)})`).join(', ') || 'nobody yet'}. ${esc(CALLED)} decides that, and can change it.`
    : 'No circle has been set up, so nobody is on the list yet.'}</p>
<p>Written ${new Date().toLocaleString()} from calls stored on this machine. Nothing was sent anywhere.</p>
</footer></main></body></html>`;
}

// The file on disk is for whoever runs this, and it carries no acknowledgement
// button: pressing it would have nowhere to write.
const WHERE = join(STATE, `report-${PROFILE}.html`);
writeFileSync(WHERE, page('nobody, this is the saved copy').replace(/<form class="read"[\s\S]*?<\/form>/, ''));

const week = readings.week;
console.log(`\n${week?.summary ?? 'No calls this week.'}\n`);
for (const v of INDICATORS) {
  const x = week?.[v];
  if (x) console.log(`  ${LABELS[v][0].padEnd(24)} ${String(x.level).padEnd(16)} ${x.note}`);
}
if (week?.worth_a_call) console.log(`\n  Worth a call: ${week.worth_a_call}`);
console.log(`\nPage: ${WHERE}`);

// --- serving, so that "I have read this" can be recorded ------------------------
if (SERVE) {
  const deny = (res, text) => {
    res.writeHead(403, { 'content-type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><meta charset="utf-8"><title>Not for you</title>
<body style="font:16px/1.6 ui-serif,Georgia,serif;max-width:32rem;margin:15vh auto;padding:0 1rem">
<p>${text}</p><p style="opacity:.7">Only the people ${esc(CALLED)} has given a link to can open this page, and ${esc(CALLED)} can take a link back at any time.</p>`);
  };

  // The key travels in the link the first time and lives in a cookie after,
  // so the page can be reloaded and bookmarked without the key sitting in
  // the address bar of a shared screen.
  const whoFrom = (req) => {
    const url = new URL(req.url, 'http://x');
    const fromLink = url.searchParams.get('k');
    const cookie = /(?:^|;\s*)k=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];
    return { key: fromLink || cookie, fromLink: Boolean(fromLink), url };
  };

  const server = http.createServer((req, res) => {
    const { key, fromLink, url } = whoFrom(req);
    const who = key && KEYS.get(key);
    if (!who) return deny(res, 'This page needs your own link.');
    if (!who.full) {
      return deny(res, `${esc(who.name)}, you are down for emergencies only, so there is nothing to read here. You will be contacted if something needs someone.`);
    }
    if (fromLink) {
      // Swap the key in the address bar for a cookie, once.
      res.writeHead(303, {
        location: url.pathname,
        'set-cookie': `k=${key}; HttpOnly; SameSite=Strict; Max-Age=31536000; Path=/`,
      });
      return res.end();
    }
    if (req.method === 'POST' && req.url === '/acknowledge') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const rows = acknowledged();
        rows.push({
          // Signed by the link, not by a name somebody typed.
          who: who.name,
          when: new Date().toISOString(),
          // What they acknowledged, so that a later "but I read it" can be
          // checked against the sentence that was on the page at the time.
          summary: week?.summary ?? '',
        });
        writeFileSync(ACKNOWLEDGEMENTS, JSON.stringify(rows, null, 1) + '\n');
        console.log(`  acknowledged by ${who.name}`);
        res.writeHead(303, { location: '/' });
        res.end();
      });
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(page(who.name));
  });
  server.on('error', (e) => {
    if (e.code !== 'EADDRINUSE') throw e;
    console.error(`\nPort ${PORT} is busy. Stop what is there, or: PORT=3201 npm run report\n`);
    process.exit(1);
  });
  server.listen(PORT, () => {
    console.log('\nEveryone who may open this, and their own link:');
    for (const [k, who] of KEYS) {
      console.log(`  ${who.full ? 'reads it ' : 'emergencies'}  ${who.name.padEnd(22)} http://localhost:${PORT}/?k=${k}`);
    }
    console.log('\nA link is a person. Delete their line in setup.json to take it back.');
    console.log('(ctrl-c to stop)\n');
  });
}
