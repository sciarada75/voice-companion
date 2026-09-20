// POST /latency — the page sends here how long the agent took to answer.
//
// It exists to take Claudia out of the middle. Without it, the only way to know
// the timings is for her to look at a grey line while she is talking and tell it
// back to me: turns get lost, and above all the slow ones get lost, which are the
// only interesting ones.
//
// NOTHING OF WHAT THEY SAY TO EACH OTHER ARRIVES HERE. Only four numbers in
// milliseconds and which phone it was. No words, no transcript: it is a
// conversation between two real people, and to work out whether it is slow the
// timings are enough.
//
// The password is the same one as the page's (?k=...), not the diary's:
// the caller is the page, which already knows that one. If it is missing, we keep
// quiet and do not write: a measurement is not worth a hole in the security.

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export async function onRequestPost({ request, env }) {
  if (!env.DIARY || !env.PAGE_KEY) return json({ error: 'not configured' }, 503);

  const key = new URL(request.url).searchParams.get('k') || '';
  if (!constantTimeEqual(key, env.PAGE_KEY)) return json({ error: 'not authorised' }, 401);

  let m;
  try {
    m = await request.json();
  } catch {
    return json({ error: 'invalid body' }, 400);
  }

  await env.DIARY.prepare(
    `INSERT INTO latency (created_at, device, turn, model, voice, cushion, total)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    new Date().toISOString(),
    device(request.headers.get('user-agent') || ''),
    number(m.turn), number(m.model), number(m.voice), number(m.cushion), number(m.total),
  ).run();

  return json({ ok: true }, 200);
}

// Only the family of device, not the whole user-agent: knowing the exact
// version of the browser is no use whatsoever, and the more stuff you keep the
// more stuff there is to justify.
function device(ua) {
  if (/iPhone|iPad/i.test(ua)) return 'iPhone';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh/i.test(ua)) return 'Mac';
  return 'other';
}

// NULL, not zero, when the turn did not allow that part to be measured.
function number(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
