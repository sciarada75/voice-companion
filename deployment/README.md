# deployment/

Where the agent answers. Both resolve the same id for a given `AGENT`, so one published agent serves both.

| | | |
| --- | --- | --- |
| [browser/](browser/) | `npm start` | A page with a call button, for iterating on an agent. |
| [telephony/](telephony/) | `npm run phone` | A phone number, over a Twilio SIP trunk. |
| [cloudflare/](cloudflare/) | `PROFILE=x npm run ship` | The public address. A static page plus `/token`, which mints a 60-second session token so the API key never reaches the browser. |

None of them defines the agent. Behaviour lives in [agents/](../agents/), which
is built from a profile — see [AGENTS.md](../AGENTS.md).

**`cloudflare/public/` is generated and must not be hand-edited.** `npm run ship`
runs four steps in the only order that works — build the agent from the profile,
publish it, rebuild the page around the new agent id, deploy — and stops at the
first one that fails, saying which. Running them by hand is how the page ends up
pointing at an agent that no longer exists.
