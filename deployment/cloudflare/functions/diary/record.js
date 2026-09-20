// POST /diary/record — records what the person has just said.
//
// It gets called at ANY moment: if in the middle of a conversation about
// carburettors they say "put down six units", it gets recorded and we go back to
// the carburettors. There is no right moment for doing it.
//
// Every call is a new EVENT, with its own time. It never overwrites anything:
// three blood sugar readings in one day are three events, and a correction is a
// fourth event. That was the defect of the first version, where the lunch value
// wiped out the breakfast one and left behind a perfectly believable number.
//
// ONLY what they actually said gets written. A value they did not give is not
// there: you do not put zero, you do not estimate, you do not carry over
// yesterday's. A gap can be seen and can be asked about again; an invented
// number can never be spotted again.
//
// It has to be declared "interactive" and not "hold": the agent must not sit in
// silence waiting for the database while the person is talking. If a write fails
// one row is lost, and that is worth far less than a pause in the middle of a
// sentence.

import { json, authorised, nowInRome, habit, HABITS } from '../../lib/diary.js';

export async function onRequestPost({ request, env }) {
  if (!env.DIARY) return json({ error: 'diary not configured' }, 503);
  if (!authorised(request, env)) return json({ error: 'not authorised' }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid body' }, 400);
  }

  const h = habit(String(body?.habit ?? ''));
  if (!h) {
    return json({ error: 'unknown habit', known: HABITS.map((a) => a.id) }, 400);
  }

  const done = normaliseYesNo(body.done ?? true);
  if (!done) return json({ error: "done must be 'yes' or 'no'" }, 400);

  const now = nowInRome();
  const event = crypto.randomUUID();
  const insert = env.DIARY.prepare(
    `INSERT INTO entries (event, day, time, habit, field, number, text, unit, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const row = (field, number, text, unit) =>
    insert.bind(event, now.day, now.time, h.id, field, number, text, unit, now.iso);

  const writes = [row('done', null, done, null)];
  const readBack = [];

  if (done === 'yes') {
    for (const field of h.fields) {
      const number = numberOrNothing(body[field.id]);
      if (number === null) continue;
      writes.push(row(field.id, number, null, field.unit || null));
      readBack.push(field.unit ? `${number} ${field.unit}` : String(number));
    }
  }

  // Their own words on how it felt to them: "a bit high", "better than
  // yesterday". Free text, NEVER a score. A number from one to ten about health
  // is the shape that turns a notebook into a medical device.
  const note = body.note ? String(body.note).slice(0, 300).trim() : '';
  if (note) writes.push(row('note', null, note, null));

  await env.DIARY.batch(writes);

  // What gets read back is what was actually written, not what arrived.
  // It is not a courtesy: on a voice call this phrase is the only receipt the
  // person has. If they do not hear it, it was not recorded, and they can say it
  // again.
  return json({
    ok: true,
    when: `${now.day} ${now.time}`,
    recorded: `${h.spoken_as}: ${done === 'no' ? 'no' : (readBack.join(', ') || 'yes')}`,
  });
}

// The model can send 'Yes' with a capital, 'yes', true, false. They mean the same
// thing and none of them must make the recording fail; accents are stripped as
// well, so a word that arrives decorated still matches. The default value is
// 'yes': if the person says a number, they did it.
function normaliseYesNo(value) {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  const clean = String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
  if (clean === 'yes') return 'yes';
  if (clean === 'no') return 'no';
  return null;
}

// A number, or nothing. Never zero as a fallback: zero steps is a datum, "they
// did not tell me" is something else, and confusing the two ruins the history.
function numberOrNothing(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
