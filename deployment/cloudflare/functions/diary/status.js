// GET /diary/status — is this the first call of today? what is worth asking
// about? what is already recorded?
//
// the agent calls it once, at the beginning. The agent's script is fixed and knows
// nothing about the time or about yesterday: without this call it would ask for
// the same thing ten times over, or would never ask anything at all.
//
// THE TWO RULES, which live here and not in the script because they are
// arithmetic, not judgements:
//   1. first call of the day -> everything gets asked about, once.
//   2. after that, a 'recurring' habit is asked about again only if at least
//      every_hours hours have passed since the last time the person said
//      anything about it.
// In both cases: ONE open question, one only per call. The rest they do
// themselves, whenever they feel like it, by saying "put down six units" in the
// middle of a conversation about carburettors.
//
// THIS IS NOT A REMINDER. Outside a call the agent does not exist, so it cannot
// remind anyone to take their insulin, and nobody must be led to believe
// otherwise.
//
// It also writes a row into conversations: that is what tells "they did not do
// it" apart from "nobody asked them", and it is also how we know whether this
// is the first call of the day.

import { json, authorised, nowInRome, intoEvents, inWords, hoursSince, HABITS, EVERY_HOURS } from '../../lib/diary.js';

export async function onRequestGet({ request, env }) {
  if (!env.DIARY) return json({ error: 'diary not configured' }, 503);
  if (!authorised(request, env)) return json({ error: 'not authorised' }, 401);

  const now = nowInRome();

  // We look BEFORE writing this call's row, otherwise it would always be "no":
  // the one just inserted would already be there.
  const earlier = await env.DIARY.prepare(
    'SELECT COUNT(*) AS count FROM conversations WHERE day = ?',
  ).bind(now.day).first();
  const first_call_today = (earlier?.count ?? 0) === 0;

  await env.DIARY.prepare(
    'INSERT INTO conversations (session, day, created_at) VALUES (?, ?, ?)',
  ).bind(crypto.randomUUID(), now.day, now.iso).run();

  const today = await env.DIARY.prepare(
    `SELECT event, day, time, habit, field, number, text, unit, created_at
       FROM entries WHERE day = ? ORDER BY id ASC`,
  ).bind(now.day).all();

  // The last time in absolute terms, not just today: at seven in the morning the
  // last insulin is from yesterday evening, and it is the hours that count
  // anyway.
  const latestRows = await env.DIARY.prepare(
    `SELECT habit, MAX(created_at) AS latest FROM entries GROUP BY habit`,
  ).all();
  const latest = new Map(latestRows.results.map((r) => [r.habit, r.latest]));

  const eventsToday = intoEvents(today.results);
  const recorded_today = [];
  const worth_asking = [];

  for (const h of HABITS) {
    const theirs = eventsToday.filter((e) => e.habit === h.id);
    if (theirs.length) {
      recorded_today.push({
        habit: h.id,
        spoken_as: h.spoken_as,
        times_today: theirs.length,
        entries: theirs.map((e) => inWords(h, e)),
      });
    }

    const hours = hoursSince(latest.get(h.id));
    if (first_call_today) {
      worth_asking.push(describe(h, hours, 'first call today'));
      continue;
    }
    if (h.recurrence === 'daily') {
      if (!theirs.length) worth_asking.push(describe(h, hours, 'not recorded yet today'));
      continue;
    }
    if (hours === null || hours >= EVERY_HOURS) {
      worth_asking.push(describe(h, hours, `at least ${EVERY_HOURS} hours since last time`));
    }
  }

  return json({
    now: `${now.day} ${now.time}`,
    first_call_today,
    // Said explicitly: the list is an opportunity, not a running order.
    how_to_use:
      'At most ONE of these, in this call, with an open question and after you have already talked about something else. If they change the subject, let it go.',
    worth_asking,
    recorded_today,
  });
}

function describe(h, hours, why) {
  return {
    habit: h.id,
    spoken_as: h.spoken_as,
    why,
    hours_since_last: hours === null ? null : Math.round(hours * 10) / 10,
    what_to_capture: h.fields.map((c) => (c.unit ? `${c.spoken_as} (${c.unit})` : c.spoken_as)),
  };
}
