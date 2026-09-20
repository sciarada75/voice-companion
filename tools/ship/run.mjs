#!/usr/bin/env node
// One command, four steps, in the only order that works.
//
//   PROFILE=peggy node tools/ship/run.mjs [--local]
//
// WHY THIS EXISTS: the published agent's id is baked into the static page at
// BUILD time (server.mjs injects it, build_web captures whatever the server
// renders). So publishing a new agent does NOT change the deployed page: it
// keeps pointing at the previous agent, silently, and you only find out when
// the old agent is deleted and the browser says "agent_not_found" with no hint
// that the page is stale. That is exactly what happened on 18/09.
//
// Four steps that must always happen together, so they are one command rather
// than four things to remember:
//   1. build the agent file from the profile
//   2. publish it, which writes AGENT_ID_<NAME> to .env
//   3. rebuild the static page, which bakes in that id
//   4. deploy the page
//
// --local stops after step 2: useful when you only want to talk to it on
// localhost, where the server resolves the id live and nothing is baked.

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROFILE = process.env.PROFILE || '';
const LOCAL = process.argv.includes('--local');

if (!PROFILE) {
  console.error(`\nERROR: say which profile to ship.\n  PROFILE=<name> node tools/ship/run.mjs [--local]\n`);
  process.exit(1);
}

const env = { ...process.env, PROFILE, AGENT: process.env.AGENT || PROFILE };

function step(n, what, cmd, args, cwd = ROOT) {
  console.log(`\n[${n}] ${what}`);
  const r = spawnSync(cmd, args, { cwd, env, stdio: 'inherit', shell: false });
  if (r.status !== 0) {
    console.error(`\nSTOPPED at step ${n} (${what}). Nothing further was done.`);
    console.error(`Fix that, then run the whole command again — the steps are ordered`);
    console.error(`on purpose and half of them is worse than none.\n`);
    process.exit(r.status ?? 1);
  }
}

step(1, 'build the agent from the profile', process.execPath, [join(ROOT, 'tools/build_agent/run.mjs')]);
step(2, 'publish it to AssemblyAI', process.execPath, [join(ROOT, 'publish.mjs')]);

if (LOCAL) {
  console.log(`\nStopped after publishing, as asked (--local).`);
  console.log(`Talk to it:  AGENT=${env.AGENT} npm start   ->  http://localhost:3000\n`);
  process.exit(0);
}

step(3, 'rebuild the static page with the new agent id', process.execPath, [join(ROOT, 'tools/build_web/run.mjs')]);
step(4, 'deploy the page', 'npx', ['wrangler', 'pages', 'deploy', '--commit-dirty=true'],
  join(ROOT, 'deployment/cloudflare'));

console.log(`\nShipped "${PROFILE}".`);
console.log(`Now read the agent back from the server and check it says what you expect —`);
console.log(`never trust "Updated". See HANDOVER, the rule after every publish.\n`);
