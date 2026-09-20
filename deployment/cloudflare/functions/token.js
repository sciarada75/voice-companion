// The ONLY thing that runs server-side once this is online: it mints a
// 60-second token for the browser. The AssemblyAI key stays here and never
// reaches the page — if it did reach it, anyone who opened the page could spend
// the credits.
//
// Cloudflare Pages Functions: the name of the file IS the route.
// functions/token.js answers on /token. No server switched on, no Mac involved:
// the function wakes up when you call it and switches itself off again.
//
// Two variables to set in the Cloudflare dashboard (Settings > Variables),
// both as SECRET, never in the repository:
//   ASSEMBLYAI_API_KEY  the account key
//   PAGE_KEY        the password that has to be in the address
//
// NOTE: the local server's /agent route does NOT exist here, on purpose.
// It returns the agent's complete configuration, that is the system_prompt,
// that is the person's biography: name, where they live, what jobs they have done.
// Locally that is fine, on a public address it is not.

const AGENTS_API = 'https://agents.assemblyai.com/v1';

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export async function onRequestGet({ request, env, waitUntil }) {
  // If the configuration on the Cloudflare side is missing, it shuts down.
  // Better not to work at all than to work wide open to anyone.
  if (!env.PAGE_KEY || !env.ASSEMBLYAI_API_KEY) {
    return json({ error: 'server not configured' }, 503);
  }

  const key = new URL(request.url).searchParams.get('k') || '';
  if (!constantTimeEqual(key, env.PAGE_KEY)) {
    return json({ error: 'not authorised' }, 401);
  }

  try {
    const res = await fetch(
      `${AGENTS_API}/token?product=voice_agent&expires_in_seconds=60`,
      { headers: { authorization: env.ASSEMBLYAI_API_KEY } },
    );
    if (!res.ok) return json({ error: 'token request failed' }, 502);

    // THIS IS WHERE "A CONVERSATION HAPPENED TODAY" GETS WRITTEN, and it is
    // written HERE rather than by the agent on purpose.
    //
    // It used to be written by the diary_status tool, which the agent was told
    // to use once at the start. On 20/09 the first real conversation showed it
    // never called it at all — and it cannot: the greeting is fixed text that
    // does not go through the model, so the model's first turn only happens
    // AFTER the person has spoken, by which time it is answering them.
    // There is no "start of the conversation" moment for a model to act at.
    //
    // Minting a token IS the start of a conversation, and it is code, not a
    // model deciding. That matters more here than anywhere else: without this
    // row, every day reads "there was no conversation", and the four states in
    // the diary (they did it / they said no / nobody asked / there was no
    // conversation) collapse into one. See HANDOVER §4.
    //
    // KNOWN LIMIT: a token minted for a conversation that then fails — the
    // microphone is blocked, the person walks away — still counts as a
    // conversation. That is wrong, but it is wrong far less often than never
    // recording one at all, and it errs towards "we asked" rather than towards
    // "they did not do it", which is the safer direction for the person.
    //
    // waitUntil: the write must not make the person wait to start talking.
    if (env.DIARY) {
      waitUntil(recordConversation(env));
    }

    return json(await res.json(), 200);
  } catch {
    return json({ error: 'token request failed' }, 502);
  }
}

// A failure here must never stop someone talking: the diary is worth less than
// the conversation, so this swallows its own errors on purpose.
async function recordConversation(env) {
  try {
    const day = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Rome',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    await env.DIARY.prepare(
      'INSERT INTO conversations (session, day, created_at) VALUES (?, ?, ?)',
    ).bind(crypto.randomUUID(), day, new Date().toISOString()).run();
  } catch {
    // Deliberately silent.
  }
}

// Constant-time comparison. With a normal ===, the comparison stops at the
// first wrong letter: whoever is trying to guess measures how long it takes and
// works out the password one letter at a time. Here all the letters are always
// looked at, so the timing says nothing.
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
