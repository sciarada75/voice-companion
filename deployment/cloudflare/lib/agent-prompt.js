// Puts the loose end into the stored agent's instructions, and takes it out
// again. Everything that can go wrong here is silent, so every step is checked.
//
// WHY THE STORED AGENT AND NOT THE SESSION: AssemblyAI's own words are that
// `agent_id` must be sent "as the only field in your first session.update; it's
// mutually exclusive with the inline fields". So a conversation cannot be handed
// a little extra context — either it names our stored agent, or the page sends
// the whole configuration, which would put the person's biography in the
// browser and break §5.3. The note therefore has to be IN the agent before the
// conversation starts.

import { replaceBlock } from './prompt-block.js';

const AGENTS_API = 'https://agents.assemblyai.com/v1';

// PUT merges: a key that is absent keeps its old value (§6.2a). So sending only
// system_prompt leaves the voice, the tools and the turn detection alone.
export async function setLastTime(env, note) {
  const id = env.AGENT_ID;
  if (!id || !env.ASSEMBLYAI_API_KEY) {
    return { ok: false, reason: 'AGENT_ID or ASSEMBLYAI_API_KEY is not set on Cloudflare' };
  }
  const headers = { authorization: env.ASSEMBLYAI_API_KEY, 'content-type': 'application/json' };

  const read = await fetch(`${AGENTS_API}/agents/${id}`, { headers });
  if (!read.ok) return { ok: false, reason: `could not read the agent: ${read.status}` };
  const agent = await read.json();

  const edit = replaceBlock(agent.system_prompt ?? '', note);
  if (!edit.ok) return edit;

  // Already right: do not spend a write. Two conversations starting at once
  // would otherwise race to say the same thing.
  if (edit.prompt === agent.system_prompt) return { ok: true, unchanged: true };

  const write = await fetch(`${AGENTS_API}/agents/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ system_prompt: edit.prompt }),
  });
  if (!write.ok) return { ok: false, reason: `could not write the agent: ${write.status}` };

  // NEVER TRUST "Updated" — HANDOVER §4. Read it back and look at it.
  const check = await fetch(`${AGENTS_API}/agents/${id}`, { headers });
  if (!check.ok) return { ok: false, reason: `could not read the agent back: ${check.status}` };
  const after = await check.json();
  if (after.system_prompt !== edit.prompt) {
    return { ok: false, reason: 'the agent read back does not match what was written' };
  }
  return { ok: true };
}

// The opening line, chosen fresh before each conversation (lib/greeting.js).
//
// ONE REQUEST, NOT THREE, and this is the difference that matters: unlike the
// loose end, this is AWAITED before the token goes back to the page, because the
// greeting is the very first thing the person hears. Put it in waitUntil and the
// session starts before the write lands — §6.17 in a new hat, except here the
// person hears the wrong opening rather than nothing happening.
//
// Measured 22/09: a PUT is about 100 ms and ECHOES the stored agent back, so the
// response body IS the read-back that §4 requires. No separate GET, and none to
// read the current greeting either: an unchanged PUT is harmless, and a request
// saved is a request that cannot make somebody wait to be greeted.
export async function setGreeting(env, greeting) {
  const id = env.AGENT_ID;
  if (!id || !env.ASSEMBLYAI_API_KEY) {
    return { ok: false, reason: 'AGENT_ID or ASSEMBLYAI_API_KEY is not set on Cloudflare' };
  }
  if (!greeting) return { ok: false, reason: 'no greeting to write' };

  const write = await fetch(`${AGENTS_API}/agents/${id}`, {
    method: 'PUT',
    headers: { authorization: env.ASSEMBLYAI_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ greeting }),
  });
  if (!write.ok) return { ok: false, reason: `could not write the greeting: ${write.status}` };

  // NEVER TRUST "Updated" — §4. Here the check is free.
  const after = await write.json().catch(() => ({}));
  if (after.greeting !== greeting) {
    return { ok: false, reason: 'the agent read back does not carry the greeting written' };
  }
  return { ok: true };
}
