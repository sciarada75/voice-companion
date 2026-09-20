// Stuff common to the three diary routes. It is not inside functions/ because in
// there every file becomes a public address, and this one must not be.
//
// HABITS and EVERY_HOURS come from habits.generated.js, written by
// tools/build_web/run.mjs out of config/profiles/<name>/habits.json. It is not edited by hand:
// it is a copy, and a copy edited by hand drifts from the original without
// anyone noticing.

import { HABITS, EVERY_HOURS } from './habits.generated.js';

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

// The password travels in a header, not in the address: the headers of the
// AssemblyAI tools stay encrypted, whereas an address ends up in the logs of half
// the world. There is health data in here.
export function authorised(request, env) {
  if (!env.DIARY_KEY) return false;
  return constantTimeEqual(request.headers.get('x-diary-key') || '', env.DIARY_KEY);
}

// Constant-time comparison: see the comment in functions/token.js.
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Workers run on UTC. At 00:30 Italian time it is still yesterday for UTC:
// without this conversion the blood sugar would end up on the day before and the
// whole history would be a day out of step, invisibly.
export function nowInRome(when = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(when);
  const v = {};
  for (const p of parts) v[p.type] = p.value;
  return {
    day: `${v.year}-${v.month}-${v.day}`,
    time: `${v.hour}:${v.minute}`,
    iso: when.toISOString(),
  };
}

// The days backwards, in Rome time. We go through midday UTC on purpose: taking
// 24 hours off midnight, on the night the clocks change, can skip or repeat a
// day.
export function daysBack(today, howMany) {
  const [y, m, d] = today.split('-').map(Number);
  const base = Date.UTC(y, m - 1, d, 12);
  const out = [];
  for (let i = 0; i < howMany; i++) {
    out.push(new Date(base - i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

export const habit = (id) => HABITS.find((x) => x.id === id) || null;
export { HABITS, EVERY_HOURS };

// Groups the rows into events. The rows arrive in insertion order, so the events
// come out from the oldest to the most recent.
export function intoEvents(rows) {
  const byEvent = new Map();
  for (const r of rows) {
    if (!byEvent.has(r.event)) {
      byEvent.set(r.event, { event: r.event, day: r.day, time: r.time, habit: r.habit, created_at: r.created_at, fields: {} });
    }
    const ev = byEvent.get(r.event);
    if (r.field === 'done' || r.field === 'note') ev.fields[r.field] = r.text;
    else ev.fields[r.field] = r.unit ? `${r.number} ${r.unit}` : r.number;
  }
  return [...byEvent.values()];
}

// How an event is read out loud. The model receives a ready-made phrase instead
// of loose numbers to interpret: fewer ways to get it wrong.
export function inWords(h, event) {
  if (event.fields.done === 'no') return `${event.time} — no`;
  const parts = [];
  for (const field of h.fields) {
    const v = event.fields[field.id];
    if (v !== undefined && v !== null) parts.push(String(v));
  }
  const said = parts.length ? parts.join(', ') : 'yes';
  return event.fields.note ? `${event.time} — ${said} (${event.fields.note})` : `${event.time} — ${said}`;
}

// How many hours have passed since an ISO instant. Needed by the every_hours
// rule.
export function hoursSince(iso, now = new Date()) {
  if (!iso) return null;
  return (now.getTime() - new Date(iso).getTime()) / 3600000;
}
