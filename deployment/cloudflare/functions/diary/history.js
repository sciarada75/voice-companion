// GET /diary/history?habit=blood-sugar&days=7 — reads the notebook back.
//
// What it is really for: on the phone you do not leaf through a little notebook.
// "What did it come out at this morning?" and "have I already taken the tablet?"
// are questions the person has to be able to get an answer to out loud. This is
// the part that gives her something back, not the part that asks her for
// something.
//
// THE RULE THAT COUNTS MORE THAN ALL THE OTHERS: nothing is inferred here. If a
// piece of data is not there, the answer is that it is not there. Not "probably
// yes", not the previous day's value. If they ask whether they have taken their
// insulin and they are told yes when we do not know, they can skip it or take it
// twice: that is not a software error, it is an error that lands on a person.
//
// THE FOUR STATES of a day with no data. Only the first two say anything about
// the person:
//   recorded   there are events, with times and numbers
//   said_no    they said themselves that they did not do it
//   not_asked  they spoke to each other, but it did not come up
//   no_conversation    that day they did not speak at all
// Flattening them into "missing" would mean measuring above all how often
// Claudia is away travelling.

import { json, authorised, nowInRome, daysBack, intoEvents, inWords, habit, HABITS } from '../../lib/diary.js';

export async function onRequestGet({ request, env }) {
  if (!env.DIARY) return json({ error: 'diary not configured' }, 503);
  if (!authorised(request, env)) return json({ error: 'not authorised' }, 401);

  const url = new URL(request.url);
  const requested = url.searchParams.get('habit');
  const howMany = Math.min(Math.max(Number(url.searchParams.get('days')) || 7, 1), 60);

  const list = requested ? [habit(requested)].filter(Boolean) : HABITS;
  if (!list.length) {
    return json({ error: 'unknown habit', known: HABITS.map((a) => a.id) }, 400);
  }

  const now = nowInRome();
  const days = daysBack(now.day, howMany);
  const placeholders = days.map(() => '?').join(', ');

  const [entries, conversations] = await Promise.all([
    env.DIARY.prepare(
      `SELECT event, day, time, habit, field, number, text, unit, created_at
         FROM entries WHERE day IN (${placeholders}) ORDER BY id ASC`,
    ).bind(...days).all(),
    env.DIARY.prepare(
      `SELECT DISTINCT day FROM conversations WHERE day IN (${placeholders})`,
    ).bind(...days).all(),
  ]);

  const talked = new Set(conversations.results.map((r) => r.day));
  const events = intoEvents(entries.results);

  const answer = list.map((h) => {
    const summary = { recorded: 0, said_no: 0, not_asked: 0, no_conversation: 0 };
    const perDay = days.map((day) => {
      const theirs = events.filter((e) => e.day === day && e.habit === h.id);
      if (!theirs.length) {
        const status = talked.has(day) ? 'not_asked' : 'no_conversation';
        summary[status]++;
        return { day, status };
      }
      const onlyNo = theirs.every((e) => e.fields.done === 'no');
      const status = onlyNo ? 'said_no' : 'recorded';
      summary[status]++;
      return { day, status, times: theirs.length, entries: theirs.map((e) => inWords(h, e)) };
    });
    return { habit: h.id, spoken_as: h.spoken_as, summary, days: perDay };
  });

  return json({
    from: days[days.length - 1],
    to: days[0],
    note: 'Only what the person said, with the time they said it. Where nothing appears, nothing was recorded.',
    habits: answer,
  });
}
