# Submission compliance — AssemblyAI Voice Agent Hackathon

Every requirement in lablab's own words, what satisfies it, and **the check that
proves it**. A line without evidence stays unticked. Claudia is not a coder and
cannot audit the code, so nothing here is satisfied by anyone's opinion,
including mine.

**Deadline: 30 September 2026, 17:00 CEST** — lablab's event schedule, "End of
Submissions!". Central European Summer Time is Claudia's own clock. The time
zone was an open unknown until 25/09 and is now settled; the earlier plan to
finish by the evening of the 29th still stands as margin, not as the limit.

---

## NEXT — what finishing the submission means, in order

Three artefacts and one form. Nothing else is open, and none of it is code.

1. ~~**The deck, as a PDF.**~~ **Done 27/09** - `CLOSER-deck.pdf`, 16 slides,
   16:9, 3.6 MB. Source `deck/index.html`, rendered by `deck/render.sh` through
   headless Chrome; **never hand-edit the PDF, and note that editing
   `deployment-proposal.md` does not change it.** The three Business Value
   slides lablab's pro-tips ask for are now in it - market sizing (08),
   competitors with the USP (09), the revenue model (10) - plus a *Why now*
   slide (03) and *Where Closer stops* (07), which draws the medical-device line
   **before** the first buyer rather than after, so a judge cannot misfile the
   product and then read the rest through that.
2. **The three descriptions**, written from the deck once it exists: title,
   short (≤255 characters, **counted**), long (≥100 words, **counted**).
3. **The technology & category tags** — name the AssemblyAI Voice Agent API.
4. **The form.** Claudia opens it; §3 lists what she must do and what she must
   screenshot. Paste the prototype link **with `?k=`** and click it back out of
   the form to prove the query string survived.

**Before submitting, re-run the §2 checks** against the live deployment, and
after any `npm run ship`, because the agent id is baked into the page at build
time.

**Do not reopen** the missing accounts, hosted sign-up, hosted family page or
alert channel. They are real gaps in the product and they are **not** judged:
see §4. The film and the prototype are done; the remaining work is paper.

---

**Sources, read 25-26/09/2026** (all JavaScript-rendered — plain fetching
returns an empty page, so they were read through a real browser):

- Hackathon page — https://lablab.ai/ai-hackathons/assemblyai-voice-agent-hackathon
- Submission Guidelines — https://lablab.ai/delivering-your-hackathon-solution
- Hackathon Guidelines / FAQ — https://lablab.ai/guide
- Getting Started — https://lablab.ai/getting-started-guide

---

## 1. Artefacts

| # | Required | State | Evidence |
|---|---|---|---|
| 1 | **Video presentation**, MP4, max 5 minutes | done | `docs/submission/CLOSER.mp4`, **4:56.19**, 83 MB, `ffprobe` 29/09 after three narration corrections in sections 7-8 (a phone line not connected, an alert that does not exist, a refusal broader than the rule). Backup of the 27/09 cut in `state/`. Re-renders from `video/` via `video/render-all.sh` |
| 2 | **Slide presentation**, PDF | done 27/09 | `docs/submission/CLOSER-deck.pdf`, **16 pages, 1440x810 pt (16:9), 3.6 MB**. Built from `deck/index.html` via `deck/render.sh`. The design system is the film's own - which the film lifts from the product's report stylesheet - so deck, film, cover and family page read as one thing |
| 3 | **Cover image**, PNG or JPG, 16:9 recommended | done 27/09 | `docs/submission/cover.png`, **1920x1080** PNG. Generated photograph (`cover-source.png`), the title set over it in the film's own EndCard typography so cover and film read as one thing |
| 4 | **Project title** | ready 29/09 | `descriptions.md`: *Closer — a voice companion for people living alone*, **50 characters counted**, with a 44-character fallback if the form caps at 50 exclusive. The pun *relative distance* was tried as the title and rejected; it is on deck slide 02. No limit is stated on any public page |
| 5 | **Short description**, ≤ 255 characters | ready 29/09 | `descriptions.md`, **238 characters counted** by the script in that file |
| 6 | **Long description**, ≥ 100 words | ready 29/09 | `descriptions.md`, **237 words counted**. Every claim checked against the running prototype, not a description of it |
| 7 | **Technology & category tags** | ready 29/09 | `descriptions.md`, led by the AssemblyAI Voice Agent API; pick from the form's own vocabulary. **No Twilio or telephony tag**: nothing is connected |
| 8 | **Public GitHub repository** | done | `github.com/sciarada75/voice-companion`, public since 20/09. Secret check: `.env`, `agents/*.env`, `sessions/`, `state/` and `config/profiles/*/setup.json` are gitignored; the page key and API key are in no commit |
| 9 | **Application URL**, a link that lets a judge interact | done | See §2 |
| 10 | **MIT-compliant** ("Submissions must be original and MIT-compliant", prize terms) | done 26/09 | `LICENSE` (bare MIT text) + `"license": "MIT"` in `package.json` + `NOTICE` for the fork credit. **The note must stay out of `LICENSE`**: appended there, GitHub's detector reported the repository as `NOASSERTION` instead of MIT, and the file exists for that signal. Verified by the GitHub API after pushing. **Before this the repo had neither, which under copyright's default means all rights reserved — the legal opposite of what the rules ask.** Upstream check, 26/09: the AssemblyAI starter ships no licence file, so the MIT grant covers this project's code and not the vendored portions, which the LICENSE credits |

## 2. The prototype, tested as a judge meets it

The submitted link **must carry `?k=<PAGE_KEY>`**. A judge's browser has never
seen the key; without it the page loads but no conversation can start.

Verified 26/09 against the live deployment:

| Request | Expected | Got |
|---|---|---|
| `GET /` | 200, the page loads | **200** |
| `GET /token` (no key) | 401 | **401** |
| `GET /token?k=wrong` | 401 | **401** |
| `GET /token?k=<real>` | 200 + a 60-second token | **200**, `expires_in_seconds: 60` |

So the prototype is genuinely reachable and genuinely gated. **Re-run this check
after the last deploy before submitting**, and re-run it if the key is rotated.

**Re-verified 29/09 after the last deploy, on both hosts** - `/` 200, `/token`
and `/diary/status` 401 without the key - **and past the gate, as a judge meets
it**: a real Chrome opened the keyed link, the key left the address bar, the
brief was on screen, *Talk to Iris* opened a session, and a first-time visitor
heard the full introduction. A synthesised voice then recorded a diary entry by
speaking. **Memory cleared for the judges**: D1 `conversations`, `entries`,
`loose_ends` at 0, the agent's memory block empty, greeting set to the
introduction (backup of the old rows in `state/`, not in git). **Mint nothing
before submitting** - every mint is a conversation, and the first one is the
judge's introduction.

Not yet verified: that the submission form preserves the `?k=` query string. If
it strips or normalises the URL, the prototype reads as dead. Check at
submission time by clicking the link back out of the form.

## 3. Process — only Claudia can do these

She must be logged in, so none of it can be verified from here, and "probably
done" is not evidence.

- [x] **Enrolled**, and **the participant profile is live** — `sciarada75371`.
      Evidence: the team dashboard, 26/09.
- [x] **A team exists with her in it**, as its only member. Evidence: the same
      dashboard, "Team Members: claudia mauri". *"In order to participate you need to be
      a member of a team on lablab.ai. This applies for solo participants as
      well"* (FAQ). **Solo is explicitly fine** — *"individual participation is
      also welcome. You're free to take on the challenge by yourself if you
      prefer"* (Getting Started); teams are 1-6, a maximum of six and **no
      minimum**. This is a hard blocker: *"submit your project via the dedicated
      button on your team's dashboard"*, and with no team there is no dashboard.
- [x] **Registered on the lablab Discord server** — *"complete your registration
      on both our lablab.ai platform and Discord server"* (Getting Started).
      Registering on it, **not** creating a channel on it. Evidence: Claudia,
      29/09 - *"discord joined days ago."*
- [ ] **Screenshot every field of the submission form.** The last thing that
      cannot be seen from here: it settles the title limit, the hosting-platform
      dropdown, the tags vocabulary, and anything nobody wrote down.

**Read carefully, because it has already caused one scare:** nothing requires a
Discord channel and nothing requires two people. **The sentence that reads that
way is on the team dashboard, not in any published guideline** — *"You need at
least 2 members with connected Discord to create channels, before Event ends."*
It is a precondition for a **feature**: a solo team does not get an auto-created
Discord team channel. A team channel appears nowhere in the submission
checklist, so it cannot block anything. Two sentences in the Getting Started
guide compound the impression and are also optional: the "Add Teammate" invite,
and "use dedicated channels under TEAM VOICE CHANNELS" for multi-person teams.

Searching the published pages for this rule finds nothing, because it is not
there. **When Claudia reports seeing something that the documentation does not
contain, the answer is usually that she is looking at the logged-in product and
the session is not.** Ask for the screenshot rather than concluding she misread.

## 4. Judging — where the points are, and where we are thin

Four criteria, equally named, no weights published: **Application of
Technology · Presentation · Business Value · Originality**.

**Product completeness is not a criterion.** No accounts, no hosted sign-up, no
alert channel and no hosted family page cost nothing directly. What is required
of the product is one thing only: a URL a judge can interact with, and §2 shows
that works.

**Business Value is a quarter of the score and it is the thin one.** lablab's own
pro-tips name what belongs there: **TAM and SAM, revenue streams, competitor
analysis with the USP, and scalability**. `deployment-proposal.md` has the market
framing, the first customer (telecare providers), the pilot, the order of buyers
and what Closer will not do — but **no market sizing, no revenue model and no
competitor slide**. That gap is worth more than everything on the
missing-features list.

Two smaller notes from the same page: they expect the video to *"begin with an
introduction, discuss your PDF presentation, then showcase your project's
functionalities"*, and they call a screen recording of real user interaction
"impactful" — section 4 of the film is exactly that.

## 5. Noise, ignored on purpose

Recorded so nobody re-panics about it.

- **The "IBM Bob report."** The generic Submission Guidelines page demands *"the
  exported IBM Bob report of all relevant tasks/sessions"*. It is boilerplate
  from an IBM hackathon: the AssemblyAI hackathon's own "What to submit" list
  does not mention it and there is no IBM tool in this project. **The
  hackathon-specific page governs the generic one.**
- **"Opt for Streamlit, Replit or Vercel."** Same page, a recommendation. The
  binding requirement is *"Application URL: provide a link that allows
  interaction with your prototype"*, and Cloudflare Pages satisfies it (§2).

## 6. Corrections this audit made to our own notes

Kept because each was believed and wrong, and belief is what makes a thing
un-checkable.

- **The deadline's time zone was not unknown** — it is published, 30/09 17:00 CEST.
- **The prize is five winners** at $1,000 cash + $1,000 credits each, not one
  taking $5k + $5k.
- **The 50-character title limit is unverified** and appears on no public page.
- **"Technology & category tags" was missing** from our requirement list entirely.
- **The repo had no licence** while the rules ask for MIT-compliance.
- **`package.json` still called the project `voice-agent-starter`** — the same
  defect as the README that described the starter to every reader (fixed 25/09);
  the name was the last survivor. Now `closer`. Nothing referenced it;
  `npm test` passes 24/24.
