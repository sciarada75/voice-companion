// POST /diary/loose-end — something the person left hanging, to be picked up
// in the NEXT conversation.
//
// The agent decides what counts. That is the right place for it: it is a
// judgement about the person in front of you, not arithmetic. It is also the
// shape that WORKS — on 20/09 `diary_record` fired reliably while
// `diary_status` never fired once, and the difference was that recording has a
// moment the model can feel and "at the start" does not (§6.15).
//
// "interactive", never "hold": the agent must not go quiet mid-sentence while a
// database and two API calls happen.

import { json, authorised, nowInRome } from '../../lib/diary.js';
import { setLastTime } from '../../lib/agent-prompt.js';

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env.DIARY) return json({ error: 'diary not configured' }, 503);
  if (!authorised(request, env)) return json({ error: 'not authorised' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid body' }, 400);
  }

  // 300 characters, like the diary's note field. This is a thread to pick up,
  // not a summary of the conversation: a summary is the quiz §0.3 forbids.
  const note = String(body?.note ?? '').slice(0, 300).trim();
  if (!note) return json({ error: 'note is required' }, 400);

  const now = nowInRome();
  await env.DIARY.prepare(
    'INSERT INTO loose_ends (note, day, created_at, state) VALUES (?, ?, ?, ?)',
  ).bind(note, now.day, now.iso, 'pending').run();

  // The agent update is two or three API calls, so it does not go in the
  // person's way. It takes effect from the NEXT conversation: the running
  // session keeps the instructions it started with, which is correct.
  waitUntil(setLastTime(env, note));

  return json({
    ok: true,
    // A fact, not a sentence to say. What the agent does with this is decided
    // by the rules, never here (§6.14).
    noted_for_next_time: note,
  });
}
