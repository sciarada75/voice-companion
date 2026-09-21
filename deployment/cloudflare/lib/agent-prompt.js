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
