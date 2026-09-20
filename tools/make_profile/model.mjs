// The one place that talks to a model.
//
// WHY IT IS ITS OWN FILE: the generator needs a model, and the cost constraint
// rules out a paid API key. So the call goes through Claude Code in headless
// mode, which runs on the subscription already paid for: zero marginal cost.
// Behind this single function, so switching to the real Anthropic API later
// means rewriting this file and nothing else.
//
// The trade-off, stated plainly: this only works on a machine where Claude Code
// is installed and logged in. The day a customer runs the generator instead of
// Claudia, this file becomes an API call.

import { spawn } from 'node:child_process';

// Ask for JSON and get JSON back, or fail loudly.
//
// Models wrap JSON in prose and in ```json fences no matter how firmly you ask,
// so the answer is scraped rather than trusted: find the outermost braces and
// parse those. A parse failure is retried ONCE with the error fed back, because
// the second attempt usually fixes a trailing comma. Twice and we stop: a model
// that cannot produce the shape twice will not produce it on the tenth try, and
// silently carrying on would put a broken profile into the build.
export async function askForJson(prompt, { retries = 1, label = 'model' } = {}) {
  let lastError;
  let text = prompt;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const raw = await run(text);
    try {
      return extractJson(raw);
    } catch (err) {
      lastError = err;
      console.error(`  ${label}: answer was not usable JSON (${err.message})`);
      if (attempt < retries) {
        console.error(`  ${label}: asking again, with the error`);
        text =
          prompt +
          `\n\nYour previous answer could not be parsed as JSON: ${err.message}\n` +
          `Return ONLY the JSON object. No prose, no code fences, no trailing commas.`;
      }
    }
  }
  throw new Error(`${label}: could not get valid JSON after ${retries + 1} attempts: ${lastError.message}`);
}

function extractJson(raw) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('no JSON object in the answer');
  return JSON.parse(raw.slice(start, end + 1));
}

// The prompt goes in on stdin, not in argv: an intake plus a schema is far past
// what a command line will carry.
function run(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p'], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', d => (out += d));
    child.stderr.on('data', d => (err += d));
    child.on('error', e =>
      reject(new Error(`could not run "claude": ${e.message}. Is Claude Code installed and logged in?`)));
    child.on('close', code => {
      if (code !== 0) return reject(new Error(`claude exited ${code}: ${err.trim() || 'no output'}`));
      if (!out.trim()) return reject(new Error('claude returned nothing'));
      resolve(out);
    });
    child.stdin.end(prompt);
  });
}
