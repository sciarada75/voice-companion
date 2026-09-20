// Stage 1, with a face: setting up a new person.
//
//   npm run setup      ->  http://localhost:3100
//
// The steps, the fields and the reason for each are in
// workflows/setup-new-person.md. This file implements that workflow and
// nothing else; if the two disagree, the workflow is right.
//
// Two rules this file exists to keep:
//   - NEUTRAL. Nothing here assumes the person is a woman, is old, is frail,
//     or is someone other than whoever is typing. The form says "they" until
//     they say otherwise, and asks how they want to be referred to.
//   - The routine and the circle are TYPED, never inferred from prose. The
//     companion treats them as fact (a tablet at eight, Caterina on Thursday),
//     and stage 6 says nothing the person relies on is ever guessed.
//
// What it writes:
//   intake/<name>.txt                    the prose + the routine in words
//   config/profiles/<name>/habits.json   the routine as data, for the notebook
//   config/profiles/<name>/setup.json    addressing, contacts, circle, consent
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aai, loadEnv, publishAgent, storedAgentId } from '../../lib.mjs';

loadEnv();

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = Number(process.env.PORT) || 3100;

const slug = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// The exact words the person agrees to. Versioned: when the text changes, what
// somebody agreed to last month must not silently change with it.
const CONSENT = {
  version: '2026-09-20',
  text:
    'The companion talks with me on a schedule I choose. It keeps a diary of what I tell it: ' +
    'my habits, my medicines, how I feel, who visits. The diary is mine, and I can ask it ' +
    'anything that is in it. Calls are recorded and the recording is used to keep that diary ' +
    'and to notice changes in how I am. The people I have listed see only what I have allowed ' +
    'them to see, and I can change or withdraw that at any time, including stopping altogether.',
};

function write(d) {
  const name = slug(d.name);
  if (!name) throw new Error('The name is missing.');
  if (!d.consent) throw new Error('Nothing is saved until the consent box is ticked.');

  const called = (d.called || '').trim() || (d.name || '').trim();

  // --- intake: the prose the generator reads --------------------------------
  const rows = [];
  const block = (title, text) => {
    if (text && String(text).trim()) rows.push(`${title}\n${String(text).trim()}\n`);
  };
  block('ABOUT THEM', d.about);
  block('WHAT THEY LIKE TO BE CALLED', called);
  if (d.refer_to && d.refer_to !== 'ask') block('HOW TO REFER TO THEM', d.refer_to);
  block('DATE OF BIRTH', d.date_of_birth);
  block('WHAT IS NORMAL FOR THEM (so a long-standing gap is not read as a new one)', d.normal);
  block('WHAT THEY WOULD RATHER NOT TALK ABOUT', d.avoid);
  block('THEIR DAY', d.day);
  block('THEIR MEDICINES', d.medicines);
  block('WHO VISITS, AND WHEN', d.visits);
  block('THEIR FIXED POINTS IN THE WEEK', d.appointments);
  const circle = JSON.parse(d.circle || '[]').filter((c) => (c.name || '').trim());
  if (circle.length) {
    block(
      'PEOPLE CLOSE TO THEM',
      circle.map((c) => `${c.name}${c.relationship ? ` - ${c.relationship}` : ''}${c.note ? ` - ${c.note}` : ''}`).join('\n'),
    );
  }
  mkdirSync(join(ROOT, 'intake'), { recursive: true });
  writeFileSync(join(ROOT, `intake/${name}.txt`), rows.join('\n') + '\n');

  // --- habits.json: the routine as data -------------------------------------
  const habits = [];
  const add = (text, type) => {
    for (const row of String(text || '').split('\n').map((r) => r.trim()).filter(Boolean)) {
      const [when, ...rest] = row.split(/\s+[-–—]\s+/);
      const what = rest.join(' - ') || when;
      habits.push({
        id: slug(what).slice(0, 40) || `${type}-${habits.length + 1}`,
        type,
        what,
        when: rest.length ? when : '',
      });
    }
  };
  add(d.medicines, 'medicine');
  add(d.day, 'habit');
  add(d.visits, 'visit');
  add(d.appointments, 'touchpoint');

  const dir = join(ROOT, 'config/profiles', name);
  mkdirSync(dir, { recursive: true });
  const habitsFile = join(dir, 'habits.json');
  const before = existsSync(habitsFile) ? JSON.parse(readFileSync(habitsFile, 'utf8')) : {};
  writeFileSync(
    habitsFile,
    JSON.stringify(
      {
        _readme:
          'Written by tools/setup_ui. The agent gets notebook tools only if this file exists, ' +
          'and it needs a "url" (or DIARY_URL) that AssemblyAI can reach from its own servers.',
        ...before,
        habits,
      },
      null,
      2,
    ) + '\n',
  );

  // --- setup.json: who they are to the system, and what they agreed to ------
  const setupFile = join(dir, 'setup.json');
  const previous = existsSync(setupFile) ? JSON.parse(readFileSync(setupFile, 'utf8')) : null;
  writeFileSync(
    setupFile,
    JSON.stringify(
      {
        _readme:
          'Written by tools/setup_ui (workflows/setup-new-person.md). Consent is a fact with a ' +
          'date, not a memory. Access levels are the person\'s choice and can be withdrawn.',
        called,
        refer_to: d.refer_to || 'ask',
        date_of_birth: d.date_of_birth || '',
        language: d.language || 'en',
        voice: d.voice || '',
        // Deliberately NOT written into intake/<name>.txt: the generator must
        // not be handed a subject and told to avoid it, because what it writes
        // ends up in the topics. It goes straight into the prompt instead,
        // through {{NEVER}}.
        never_mention: String(d.never || '').split('\n').map((r) => r.trim()).filter(Boolean),
        agent: d.agent || 'Iris',
        contacts: { phone: d.phone || '', email: d.email || '' },
        // Each person in the circle gets their own key. It is how the report
        // knows who is reading: no accounts, no passwords to forget, and an
        // acknowledgement is signed by whoever the link belongs to. Taking
        // someone's access away means deleting their line here.
        circle: circle.map((c) => {
          const existing = (previous?.circle ?? []).find((v) => v.name === c.name);
          return {
            name: c.name,
            relationship: c.relationship || '',
            phone: c.phone || '',
            email: c.email || '',
            access: c.access || 'none',
            note: c.note || '',
            key: existing?.key || randomBytes(12).toString('hex'),
          };
        }),
        consent: {
          given: true,
          by: d.consent_by === 'other' ? 'legal representative or person acting for them' : 'the person themselves',
          when: new Date().toISOString(),
          version: CONSENT.version,
          text: CONSENT.text,
        },
      },
      null,
      2,
    ) + '\n',
  );

  return { name, habits: habits.length, circle: circle.length };
}

const PAGE = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Set up a companion</title>
<style>
  :root { color-scheme: light dark; --line:#d8d3cb; --ink:#1c1a17; --bg:#f7f4ef; --accent:#1d6f5c; --soft:#efece5; }
  @media (prefers-color-scheme: dark) { :root { --line:#3a3630; --ink:#f0ece5; --bg:#17150f; --accent:#79c9b1; --soft:#201d16; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.55 ui-serif, Georgia, serif; }
  main { max-width: 44rem; margin: 0 auto; padding: 2.5rem 1rem 7rem; }
  h1 { font-size: 1.9rem; margin: 0 0 .3rem; }
  p.sub { margin: 0 0 2rem; opacity: .75; }
  fieldset { border: 1px solid var(--line); border-radius: .6rem; padding: 1rem 1.1rem 1.4rem; margin: 0 0 1.3rem; }
  legend { font-weight: 600; padding: 0 .4rem; }
  legend small { font-weight: 400; opacity: .6; }
  label { display:block; margin: .9rem 0 .3rem; font-weight: 600; font-size: .95rem; }
  .hint { font-weight: 400; opacity: .72; font-size: .88rem; display:block; margin-top:.15rem; }
  input, textarea, select { width:100%; padding:.6rem .7rem; font: inherit; color: inherit;
    background: transparent; border: 1px solid var(--line); border-radius: .4rem; }
  textarea { min-height: 5.5rem; resize: vertical; }
  .row { display:flex; gap:.8rem; flex-wrap: wrap; } .row > div { flex:1 1 12rem; }
  button { font: inherit; font-weight:600; padding:.8rem 1.4rem; border-radius:.4rem; border:1px solid var(--accent);
    background: var(--accent); color:#fff; cursor:pointer; }
  button.ghost { background: transparent; color: var(--ink); border-color: var(--line); padding:.5rem .9rem; font-weight:500; }
  .bar { display:flex; gap:.8rem; align-items:center; flex-wrap:wrap; }
  .contact { border:1px solid var(--line); border-radius:.5rem; padding:.6rem .8rem 1rem; margin:.8rem 0; background:var(--soft); }
  .consent { background: var(--soft); border-radius:.5rem; padding:1rem 1.1rem; }
  .consent p { margin:.2rem 0 1rem; }
  .tick { display:flex; gap:.6rem; align-items:flex-start; font-weight:600; }
  .tick input { width:1.15rem; height:1.15rem; margin-top:.2rem; flex:0 0 auto; }
  #result { margin-top:1.2rem; padding:.9rem 1rem; border-left:3px solid var(--accent); white-space:pre-wrap;
    font-family: ui-monospace, monospace; font-size:.88rem; display:none; }
</style></head><body><main>
<h1>Set up a companion</h1>
<p class="sub">For yourself, or for someone close to you. Nothing is saved until the last box is ticked.</p>
<form id="f">

  <fieldset><legend>1. Who they are</legend>
    <div class="row">
      <div><label>Name<input name="name" required placeholder="Peggy Ward"></label></div>
      <div><label>What they like to be called<span class="hint">The name people actually use.</span>
        <input name="called" placeholder="Peggy"></label></div>
    </div>
    <div class="row">
      <div><label>How to refer to them<select name="refer_to">
        <option value="ask">ask them on the first call</option>
        <option value="she">she</option><option value="he">he</option><option value="they">they</option>
      </select></label></div>
      <div><label>Date of birth <span class="hint">The full date. Used to place their life against what changed, and to know when their birthday is.</span>
        <input name="date_of_birth" type="date"></label></div>
    </div>
    <div class="row">
      <div><label>Language<select name="language"><option value="en">English</option></select></label></div>
      <div><label>The companion's name<input name="agent" placeholder="Iris"></label></div>
    </div>
  </fieldset>

  <fieldset><legend>2. How to reach them</legend>
    <p class="hint" style="margin:0">Their own contact comes first: the diary is theirs before it is anyone else's.</p>
    <div class="row">
      <div><label>Phone<input name="phone" type="tel" placeholder="+39 ..."></label></div>
      <div><label>Email<input name="email" type="email" placeholder="name@example.com"></label></div>
    </div>
  </fieldset>

  <fieldset><legend>3. Their circle <small>&mdash; and what each person may see</small></legend>
    <p class="hint" style="margin:0">They decide this, and can change it later. The companion also uses these names in conversation: it knows who comes on a Thursday.</p>
    <div id="circle"></div>
    <button type="button" class="ghost" id="add">Add someone</button>
  </fieldset>

  <fieldset><legend>4. What they are like</legend>
    <label>Tell us about them<span class="hint">Five minutes, the way you would describe someone to a friend. Where they have lived, their family, what they were good at, what they follow, what they love.</span>
      <textarea name="about" required style="min-height:11rem"></textarea></label>
    <label>What is normal for them<span class="hint">Hearing, sight, mood, gaps they have had for years, words they have always mixed up. This is what stops something old being read as something new.</span>
      <textarea name="normal"></textarea></label>
    <label>Anything they would rather not talk about<span class="hint">A place, a person, a time. If it comes up, the companion drops it and turns to something else, without asking why.</span>
      <textarea name="avoid"></textarea></label>
    <label>Never mention <span class="hint">Harder than the box above: things the companion must never bring up at all, one per line. Their dog died. Money, or anything to do with their accounts. A person who is gone. If they raise it themselves the companion follows them, gently, and never corrects them.</span>
      <textarea name="never" placeholder="never mention the dog &ndash; he died in June and she still talks about him&#10;never talk about money, accounts or bills"></textarea></label>
  </fieldset>

  <fieldset><legend>5. The shape of their week</legend>
    <p class="hint" style="margin:0">One per line, as <em>when &ndash; what</em>. The companion uses these as facts, so type them rather than leaving them in the story above.</p>
    <label>Their day<span class="hint">seven &ndash; wakes up and makes coffee / after lunch &ndash; a nap / late afternoon &ndash; a short walk</span>
      <textarea name="day"></textarea></label>
    <label>Their medicines<span class="hint">eight &ndash; blood pressure tablet with breakfast / evening &ndash; vitamins</span>
      <textarea name="medicines"></textarea></label>
    <label>Who visits, and when<span class="hint">Thursday &ndash; their daughter Caterina / Sunday &ndash; their son</span>
      <textarea name="visits"></textarea></label>
    <label>Fixed points in the week<span class="hint">Tuesday and Friday &ndash; the cleaner / Saturday &ndash; the market / Sunday &ndash; Mass</span>
      <textarea name="appointments"></textarea></label>
  </fieldset>

  <fieldset><legend>6. The voice</legend>
    <label>Voice<select name="voice">
      <option value="anna">anna &mdash; British</option><option value="vera">vera &mdash; British</option>
      <option value="charles">charles &mdash; British</option><option value="paul">paul &mdash; British</option>
      <option value="iris">iris</option><option value="mary">mary &mdash; American</option>
      <option value="george">george &mdash; American</option><option value="eve">eve &mdash; American</option>
    </select></label>
    <div class="bar" style="margin-top:.8rem">
      <button type="button" class="ghost" id="listen">Hear this voice</button>
      <span class="hint" id="voice-status" style="margin:0">A sample is a real call of a few seconds, about two cents. No microphone is opened.</span>
    </div>
  </fieldset>

  <fieldset><legend>7. Consent</legend>
    <div class="consent">
      <p id="consent-text"></p>
      <label style="font-weight:600">Who is agreeing<select name="consent_by">
        <option value="person">the person themselves</option>
        <option value="other">someone who legally acts for them</option>
      </select></label>
      <label class="tick" style="margin-top:1rem">
        <input type="checkbox" name="consent" value="1" required>
        <span>They have read this, or had it read to them, and they agree.</span></label>
    </div>
  </fieldset>

  <div class="bar">
    <button type="submit">Save</button>
    <button type="button" class="ghost" id="generate">Save and create the profile</button>
    <span class="hint" style="margin:0">Creating the profile takes a couple of minutes.</span>
  </div>
</form>
<div id="result"></div>
</main><script>
const CONSENT = ${JSON.stringify(CONSENT.text)};
document.getElementById('consent-text').textContent = CONSENT;

const circle = document.getElementById('circle');
function addContact() {
  const d = document.createElement('div');
  d.className = 'contact';
  d.innerHTML = \`
    <div class="row">
      <div><label>Name<input class="c-name" placeholder="Caterina"></label></div>
      <div><label>Relationship<input class="c-relationship" placeholder="daughter"></label></div>
    </div>
    <div class="row">
      <div><label>Phone<input class="c-phone" type="tel"></label></div>
      <div><label>Email<input class="c-email" type="email"></label></div>
    </div>
    <div class="row">
      <div><label>What they may see<select class="c-access">
        <option value="none">nothing &mdash; just a name the companion knows</option>
        <option value="emergencies">emergencies only</option>
        <option value="summary">the regular summary, and emergencies</option>
      </select></label></div>
      <div><label>Note<input class="c-note" placeholder="comes every Thursday"></label></div>
    </div>
    <button type="button" class="ghost" style="margin-top:.7rem">Remove</button>\`;
  d.querySelector('button').addEventListener('click', () => d.remove());
  circle.appendChild(d);
}
document.getElementById('add').addEventListener('click', addContact);
addContact();

// --- hearing a voice ---------------------------------------------------------
// The page connects to the same websocket the companion uses, listens to the
// greeting, and hangs up. It never opens the microphone, so nothing of the
// room is sent anywhere.
const listen = document.getElementById('listen'), voiceStatus = document.getElementById('voice-status');
let listening = false;
listen.addEventListener('click', async () => {
  if (listening) return;
  const voice = f.voice.value;
  listening = true; listen.disabled = true;
  voiceStatus.textContent = 'connecting';
  let ws, ctx;
  const close = (message) => {
    try { ws && ws.close(); } catch {}
    try { ctx && ctx.close(); } catch {}
    listening = false; listen.disabled = false;
    voiceStatus.textContent = message;
  };
  try {
    const r = await fetch('/voice-sample?voice=' + encodeURIComponent(voice));
    if (!r.ok) throw new Error(await r.text());
    const { agent_id, token } = await r.json();
    ctx = new AudioContext({ sampleRate: 24000 });
    // Play each piece as it arrives. Waiting for reply.done meant waiting for
    // the whole sentence to be synthesised before a sound came out.
    let when = 0, partsReceived = 0, lastEnd = 0;
    const play = (samples) => {
      const buffer = ctx.createBuffer(1, samples.length, 24000);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / 32768;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      // A small cushion on the first piece, then strictly one after another.
      when = Math.max(when, ctx.currentTime + 0.12);
      source.start(when);
      when += buffer.duration;
      lastEnd = when;
    };
    const url = new URL('wss://agents.assemblyai.com/v1/ws');
    url.searchParams.set('token', token);
    ws = new WebSocket(url);
    const safetyTimeout = setTimeout(() => close('the sample did not arrive'), 20000);
    ws.onopen = () => {
      voiceStatus.textContent = 'listening to ' + voice;
      ws.send(JSON.stringify({ type: 'session.update', session: { agent_id } }));
    };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'reply.audio') {
        const raw = atob(msg.data), bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
        if (!partsReceived++) voiceStatus.textContent = 'playing ' + voice;
        play(new Int16Array(bytes.buffer));
      }
      if (msg.type === 'reply.done') {
        // The call ends the moment the last piece is in hand. What is still
        // queued plays from memory, so nothing is billed while listening.
        clearTimeout(safetyTimeout);
        if (!partsReceived) return close('nothing came back');
        try { ws.close(); } catch {}
        ws = null;
        setTimeout(
          () => close('that was ' + voice + '. Try another, or keep it.'),
          Math.max(0, (lastEnd - ctx.currentTime) * 1000) + 200,
        );
      }
    };
    ws.onerror = () => close('could not connect');
  } catch (err) {
    close('could not play a sample: ' + err.message);
  }
});

const f = document.getElementById('f'), result = document.getElementById('result');
function data() {
  const d = Object.fromEntries(new FormData(f).entries());
  d.circle = JSON.stringify([...circle.children].map((c) => ({
    name: c.querySelector('.c-name').value, relationship: c.querySelector('.c-relationship').value,
    phone: c.querySelector('.c-phone').value, email: c.querySelector('.c-email').value,
    access: c.querySelector('.c-access').value, note: c.querySelector('.c-note').value,
  })));
  return d;
}
function show(t) { result.style.display = 'block'; result.textContent = t; result.scrollIntoView({ block: 'nearest' }); }
async function send(generate) {
  if (!f.reportValidity()) return;
  show(generate ? 'Working. This takes a couple of minutes, and the terminal shows what is happening.' : 'Saving.');
  const r = await fetch(generate ? '/generate' : '/save', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data()),
  });
  show(await r.text());
}
f.addEventListener('submit', (e) => { e.preventDefault(); send(false); });
document.getElementById('generate').addEventListener('click', () => send(true));
</script></body></html>`;

// --- hearing a voice ---------------------------------------------------------
// AssemblyAI has no standalone text-to-speech (checked 20/09): a voice only
// exists inside a live session. So a sample IS a call — a few seconds of one,
// about two cents at $4.50/hour. No microphone is opened: the page connects,
// listens to the greeting, and hangs up.
//
// One reusable agent per voice, its id kept in .env under
// AGENT_ID_VOICE_TEST_<VOICE>, so trying a voice twice does not leave a trail
// of agents on the account.
const SAMPLE_PHRASE = 'Hello. This is how I sound, if you would like me to call you.';

// An agent published in this run is not published again: the GET and the PUT
// were costing a second or more before a single note came out.
const alreadyPublished = new Map();

async function tryVoice(voice) {
  if (!/^[a-z]+$/.test(voice)) throw new Error('not a voice name');
  const name = `voice-test-${voice}`;
  // A global AGENT_ID overrides every per-name key in lib.mjs, so publishing
  // here would overwrite whichever agent it points at. Refuse instead.
  if (process.env.AGENT_ID) {
    throw new Error('AGENT_ID is set in .env, which would make this overwrite that agent. Unset it to test voices.');
  }
  const body = {
    name: `Voice test ${voice}`,
    system_prompt: 'Say nothing at all unless you are spoken to. One short sentence if you are.',
    voice: { voice_id: voice },
    greeting: SAMPLE_PHRASE,
  };
  // publishAgent creates it the first time and updates it after, keeping the
  // id in .env under AGENT_ID_VOICE_TEST_<VOICE>. The token is minted at the
  // same time rather than after it, so the two round trips overlap.
  const publishing = alreadyPublished.get(voice) ?? publishAgent(body, { name });
  alreadyPublished.set(voice, publishing);
  const [{ id }, { token }] = await Promise.all([
    publishing,
    aai('/token?product=voice_agent&expires_in_seconds=60'),
  ]);
  return { agent_id: id, token };
}

const body = (req) =>
  new Promise((ok, no) => {
    let s = '';
    req.on('data', (c) => (s += c));
    req.on('end', () => {
      try { ok(JSON.parse(s || '{}')); } catch (e) { no(e); }
    });
  });

const server = http.createServer(async (req, res) => {
  const send = (code, type, body) => {
    res.writeHead(code, { 'content-type': type });
    res.end(body);
  };
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url.startsWith('/?'))) {
      return send(200, 'text/html; charset=utf-8', PAGE);
    }
    if (req.method === 'GET' && req.url.startsWith('/voice-sample')) {
      const voice = new URL(req.url, 'http://x').searchParams.get('voice') || '';
      const data = await tryVoice(voice);
      return send(200, 'application/json', JSON.stringify(data));
    }
    if (req.method === 'POST' && req.url === '/save') {
      const d = await body(req);
      const { name, habits, circle } = write(d);
      return send(200, 'text/plain; charset=utf-8',
        `Saved.\n\n  intake/${name}.txt\n  config/profiles/${name}/habits.json  (${habits} routine entries)\n` +
        `  config/profiles/${name}/setup.json  (${circle} in the circle, consent recorded)\n\n` +
        `To create the profile:\n  node tools/make_profile/run.mjs --name ${name} --from intake/${name}.txt ` +
        `--lang ${d.language || 'en'} --agent ${d.agent || 'Iris'} --voice ${d.voice || 'anna'} --topics 12\n`);
    }
    if (req.method === 'POST' && req.url === '/generate') {
      const d = await body(req);
      const { name } = write(d);
      const args = ['tools/make_profile/run.mjs', '--name', name, '--from', `intake/${name}.txt`,
        '--lang', d.language || 'en', '--agent', d.agent || 'Iris', '--voice', d.voice || 'anna', '--topics', '12'];
      console.log(`\n> node ${args.join(' ')}\n`);
      const p = spawn(process.execPath, args, { cwd: ROOT });
      let output = '';
      p.stdout.on('data', (c) => { output += c; process.stdout.write(c); });
      p.stderr.on('data', (c) => { output += c; process.stderr.write(c); });
      const code = await new Promise((ok) => p.on('close', ok));
      const tail = output.split('\n').slice(-25).join('\n');
      return send(200, 'text/plain; charset=utf-8',
        code === 0
          ? `Profile "${name}" created.\n\n${tail}\n\nNext, to publish and talk:\n  PROFILE=${name} npm run ship\n  AGENT=${name} npm start\n`
          : `The generator stopped (code ${code}).\n\n${tail}\n`);
    }
    send(404, 'text/plain', 'not found');
  } catch (e) {
    send(400, 'text/plain; charset=utf-8', 'Could not save: ' + e.message);
  }
});

// A busy port is a stop, never a silent move elsewhere (HANDOVER §6.11).
server.on('error', (e) => {
  if (e.code !== 'EADDRINUSE') throw e;
  console.error(`\nPort ${PORT} is busy. Something else is already serving there.`);
  console.error(`  lsof -nP -iTCP:${PORT} -sTCP:LISTEN`);
  console.error(`Stop it, or start this one elsewhere:\n  PORT=3101 npm run setup\n`);
  process.exit(1);
});
server.on('listening', () => console.log(`Set someone up: http://localhost:${PORT}`));
server.listen(PORT);
