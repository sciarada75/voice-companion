# Pitch video — script

AssemblyAI Voice Agent Hackathon. **MP4, max 5 minutes, under 300 MB.**

**The product is called Closer.** Tagline, on the end card only, never spoken:
*Closer, if not near.* It is the argument of section 2 in four words — the
families are not near, and that is not the same as not close.

**682 spoken words, measured at 3:53 of narration** — the voice is macOS Jamie
at `-r 150`, which actually reads about 175 a minute, and every duration in the
film is taken from the rendered wav rather than estimated. Plus the agent's own
recording, heard on its own before a word of narration: **4:59.1 against a hard
5:00 cap** — measured on the file, which is now ONE composition rather than nine
concatenated renders, each of which used to carry 50ms of audio padding.

**The listen was paid for, not found.** Without it the film runs 4:51.1, so it
had 8.9 seconds of room and three lines each costs 36.2. Tightening every
silence in the film to its floor — the reserved gap after every last line, the
pads, the leads, the dead beat before the end card — yielded **5.2 seconds and
no more**, because the floor is the hold itself: a card stands for HOLD and
takes FALL to leave, so the shortest a section can end is 1.35s and the shortest
it can open is 0.35s. The rest came out of the script: **two lines each instead
of three**, and the first callout in section 4.

**EVERY FINISHED FRAME NOW STANDS STILL FOR A SECOND, with its words still up.**
Claudia, 25/09: *"when a frame finishes it has to stay still, with the text
there, for 1 second. still too fast."* Two things were wrong and only one of
them cost time. The words used to start fading the instant the voice stopped, so
every block ended on an empty screen — holding them through the silence is free,
and it is most of what read as rushed. The floor under the silence itself is
`HOLD` in `src/theme.ts`, and it costs **14 seconds**, which is why sections 1
and 4 gave some back. Two cuts opt out of it, marked where they are written:
*"And then it ends"*, and *"They check in on Sunday."*

**AND NOTHING OVERLAPS.** The first cut of the hold let the incoming words start
rising while the outgoing ones were still at full opacity, and the code called
it a dissolve. Claudia: *"text from one frame overlaps to the previous. do not
do that."* So `MIN_GAP` is now `HOLD + FALL + RISE` — the gap has to clear the
hold, the fade out and the fade in — and every card carries its OWN `hold` and
`fall`, computed from the gap that follows it. On the two hard cuts that works
out to no hold and a three-frame fade, which is what a hard cut means. It costs
**10 seconds**, and it is what puts the film over.

**The runtime is measured, not estimated.** The
render prints the total; nobody holds a stopwatch. If it runs over, the release
valve is **the setup-form line, already moved to the deck** — bring it back only
if the clock allows. Never cut section 3, 6 or 7: the argument, the reason
anybody pays, and the trust.

The first draft was 803 words, five and a half minutes of talking before the
demo had even started. The per-section counts exist so that cannot happen again
quietly.

Spoken words are in **bold**. Everything else is what is on screen.

**Two rules this script obeys, and any rewrite must keep.** §5.4 of `HANDOVER.md`
binds the spoken words in this video as much as the product: never "detects",
"decline", "cognitive" or "risk", and no threshold presented as clinical. And
every figure spoken aloud is `verified: primary` in `config/evidence.json` —
read out of the statistics agency's own publication, not out of a search result.

---

## 1 · The video everyone has already seen — 0:00 to 0:16

*(37 words)*

> **SCREEN.** Black. A caption in plain type: *"You have seen this video."*
> Hold two seconds.
>
> Then the genre, recreated — **not** footage taken from anyone else: a phone
> propped on a kitchen table, an older woman talking to a smart speaker, seen
> from behind, warm light. Eight seconds.

**You have seen this video. A grandmother talks to a machine. It is patient and
funny, she laughs, and it is lovely.**

**And then it ends.**

> **SCREEN.** Cut hard to the same kitchen, empty. Afternoon light, flatter.

**And it is Tuesday afternoon, and she is still on her own.**

> **HOLD** on the empty room for a second, with the line still up, and cut
> straight to the Italian figures. Claudia, 25/09: *"then it's tuesday
> afternoon, and she is back alone. hold it for a sec on the empty room, skip
> the rest, and move to italy's data."* The line that used to close the section
> — *"the demo was never the problem, it is a conversation that happened once,
> because somebody was in the room, filming it"* — is **cut**, and the
> advertisement's own slate with it. The empty room makes that argument without
> saying it, and the seven seconds it gives back pay for the holds everywhere
> else.

---

## 2 · The rest of it — 0:22 to 1:08

*(118 words)*

> **SCREEN.** Figures, one at a time, large, plain background. No stock
> photography of sad old people. Small source line under each:
> *ISTAT, Censimento permanente della popolazione 2023.*

**In Italy, two point seven million people over seventy-five live on their own.
One household in ten.**

**Ninety-three per cent of them can count on a relative. Three in a hundred have
nobody at all.**

> **SCREEN.** 92.8% fills the frame. Then 3.2% underneath it, small.

**So this is not abandonment. The families exist. They are at work, or three
hours away.**

> **SCREEN.** Cut to the weekend visit.

**They check in on Sunday.**

**What is missing is not love. It is the ordinary daily contact, where somebody
would simply have noticed.**

> **SCREEN.** Four lines type themselves out, in the voice of a worried adult
> child. No icons.

**Did she take the tablets. Is she eating. She told me the same story twice
last month. There is a new person with a key to the house, and she trusts
everybody.**

**None of it is an emergency. Which is exactly why nobody catches it.**

---

## 3 · The turn — 1:08 to 1:39

*(83 words)*

> **SCREEN.** Plain type: **So: a companion.**

**So, we need a companion: Closer. Not a generic LLM. Something with a job.**

> Rewritten 25/09, Claudia's words. It used to be *"So: a companion. Not a
> novelty. Something with a job."* Two things change: **the product is named
> here**, at 1:09, rather than waiting for the end card — and the thing it is
> being distinguished from is named too. "Not a novelty" left the comparison to
> the viewer; *not a generic LLM* is the comparison. The tagline is still never
> spoken; only the name is.

> **SCREEN.** Hold on the words as they are spoken. This is the centre of the
> video. Let it be quiet.

**Every old person was once very good at something. Then the world moved on
without them, and stopped asking.**

**Peggy ran the sample room at a clothing factory for forty-one years. She can
still tell whether a jacket was put together properly, and she is full of memories
about it. Nobody has asked her in ten years.**

**So the companion asks. And then it tells her what became of her trade after
she left.**

---

## 4 · Let it talk — 1:39 to 2:14

*(13 words of narration. The conversation does the rest, on its own.)*

> **SCREEN.** The product's own page, laid out from a real stored session, on a
> phone-shaped screen. Permanent small caption: *Peggy is a demonstration
> persona derived from national statistics. No real person's data appears in
> this project.*

**This is the actual thing, running.**

> **THE CONVERSATION PLAYS FIRST, ON ITS OWN.** Claudia, 25/09, watching the cut
> that put the narration over a bed of it: *"the overlap is not effective.
> instead, let the 2 voices start and talk for 3-4 sentences each first. then
> start with your explanation."* So nothing talks over anything. The real
> recording of this session runs at full level, three lines each, with the page
> moving in step with it — the scroll is driven by the session's own millisecond
> timings, so it cannot drift from the audio. **The pauses between turns are the
> agent's real response time and are not tightened.**
>
> Then, and only then, the film explains what was just heard. Each callout is
> the **focus pull from section 6** — everywhere else on the page goes down to
> the ground, the block stays lit and framed, with a note in the margin.
>
> **The listen is one number**, `LISTEN_TO` in `src/Section4.tsx`: 24.0 is two
> lines each, 36.2 three, 47.5 four.

> **The listen runs to her own longest answer** — the walk, the tiredness, the
> reading. Two lines each. A third line each costs twelve seconds the film could
> only find by spending the two lines that argue the product is different, so it
> stops here.
>
> **And there is only one callout.** *"Listen to how it runs. It answers, and
> asks one small thing back"* was cut on 25/09, and it is the right one to lose:
> the viewer has just HEARD that exchange, in the voices themselves. The film
> naming it afterwards was explaining a joke it had already told.

**It catches a joke and plays along, instead of explaining it.**

> *Margin: "The user asks a machine whether it knew him. The companion does not
> pretend, and adds something the user did not know."* The block: Steve Jobs,
> through *"I don't know him personally, of course."*
>
> **NOTHING IS PLAYED TWICE.** The Jobs answer used to come up to full for six
> seconds here, on the block just framed. Claudia: *"cut the record of the voice
> on the joke. the screenshot is enough."* It is — the exchange is on the glass,
> lit, framed and read.
>
> **And section 4 says nothing about the diary.** Claudia: *"if we have the
> recording function in the 2nd reel, do not mention in the 1st as well."*
> Section 5 is where the tool call, the write and the read-back are. Saying it
> here as well was saying it twice.

---

## 5 · What it is made of — 2:26 to 2:43

*(50 words)*

> **SCREEN.** Two things, four seconds of real interface each. Move briskly.
> No feature grid.

> **SCREEN.** The diary tool firing mid-conversation.

**It keeps her diary. She says she took her tablets, it writes it down and reads
it back, so she can catch a mistake.**

> **SCREEN.** The `[LAST TIME]` note in the stored agent.

**Each conversation leaves one loose end for the next. The dinner with her friend
next week — so the following one can ask how it went.**

---

## 5b · Set up for one person — 2:43 to 3:09

*(Restored to the film 24/09, having been moved to the deck on 22/09. The reason
it comes back: everything before it is what the companion does, and a judge's
next question is "for whom, and who decided?". This section is the answer, and
it is the only place the film shows that the person — not the family, not us —
holds the permissions.)*

*(REWRITTEN BY CLAUDIA 25/09. Two changes matter. The first sentence now says
the companion **starts** knowing the user, which is the claim the deck makes and
the old line only implied. And the beat between screens is nearly twice what the
narrated sections use: "when the full screen text is read, the viewer needs a
sec to digest." The card changes in the MIDDLE of that silence, so the eye
finishes one form, the screen turns over, and only then does the next sentence
start.)*

> **SCREEN.** The real setup form, filled with demonstration data only: no real
> contact, no real number. `example.com` addresses and the `+44 7700 900xxx`
> range, which is reserved for drama and reaches nobody.

**None of this is general. The companion starts knowing the user. The user or
somebody close sets it up for one person, in twenty minutes.**

> **SCREEN.** *3. Their circle — and what each person may see.* Hold on the
> access level long enough to read it. Sylvia, her daughter, is the name on this
> card, and she is the name on the report in section 6 — the circle typed here
> is the circle that can open that page.

**Her week is typed, never guessed. Her circle is hers: habits, relatives,
emergencies, or the whole summary.**

> **SCREEN.** The *Never mention* box, with its two lines in it.

**And one can add a list it will never raise. The dog that died. Money.
Somebody who is gone.**

---

## 6 · The people who love her — 3:09 to 3:38

*(68 words. This section is why anybody pays. It used to be one line inside
section 5, and three seconds is not enough to read a page.)*

> **SCREEN.** The real report, demonstration profile only, scrolling slowly from
> the top. It is headed *Closer report, sept 18th, 18.23* — what it is and when,
> not whose it is. Margin note while the camera is at the top: *After every
> interaction, the family get a page.*

**Her family get a page. It opens with one sentence, and usually that sentence is
that nothing happened.**

> **SCREEN.** Hold on the *Worth a call* box **and the acknowledgement box under
> it**, dimming everything else. The two are one thought, and the sentence below
> is about both: *Nobody has acknowledged this yet · You are reading as Sylvia ·
> [I have read this]*. Sylvia is the daughter typed into the circle in section
> 5b — the circle you watched being set up is the circle that can open this
> page, and she is the one who signs for it.
>
> *(This box was reported to Claudia on 24/09 as missing from the product. That
> was wrong. `tools/report/run.mjs` has always served it and always strips it
> from the saved copy — a button on a page opened from the filesystem has
> nowhere to write — and the saved copy is what this section films. The filming
> copy now carries the markup the local server returns.)*

**When something is noticed, it is reported quietly. The page gives one gentle
suggestion, and it stays there until one of the allowed relatives has marked it
read.**

> Rewritten 25/09. The line it replaces said *"it is **detected** and quietly
> reported"* — and §5.4 of `HANDOVER.md` binds the spoken words of this video as
> much as the product: never *detects*, *decline*, *cognitive* or *risk*. It had
> been in the script, and in the rendered film, since the first cut.

> **SCREEN.** The five rows — four reading *fine*, the top one open on her own
> words in italics. Then the counted table. Then hold the footer line:
> *"It is not a medical opinion and it is not advice."*

**Five things, at three scales, because a missed walk means one thing in a day
and another in a month. Where it has something to say, it says it in her own
words.**

---

## 7 · What it will not do — 3:38 to 4:18

*(86 words)*

> **SCREEN.** Plain type. Slow down. This is the section that earns trust. Play
> it straight and let the irony sit underneath it.

**It is not a medical device and does not audition for the part. It notices that
someone who used to have a walk has not in the last couple of days.**

> **SCREEN.** Cut. The block above and the one below are deliberately two
> frames, not one: spoken as a single run it was twenty-two seconds.

**That sad words keep recurring. That someone was confused about a daughter's
name, or is skipping routines. And tells the people who love her.**

> Hers, 25/09, rewritten rather than trimmed: the three examples became two, and
> *"talked for nine minutes last week, talked for two today"* gave way to
> *skipping routines*, which is a thing the notebook actually records. Four
> seconds shorter, and it is what let the listen stay at two lines each.

> **SCREEN.** The setup form, section 6, with the voice list open: anna, vera,
> charles, paul, iris, mary, george, eve. A still, because that menu is a native
> one and will not render into a screen capture.

**It is built for a person, not a condition. There is no dementia mode. There is
a list of voices to choose from, and a name the user gives the companion.**

> Corrected 25/09. It used to say *"There is Anna, or Mary, or George"*, which
> read as the PERSON'S name and was wrong about the still it was spoken over:
> those are the **voices**. Claudia: *"there is no dementia mode. There is a
> voice list to choose upon, and a name that can be set for the companion, on
> how the user likes to call it."* The form has both — `tools/setup_ui/run.mjs`
> asks for *"The companion's name"* right above the voice list.

> **SCREEN.** One more line. Let it land.

> **SCREEN.** Four lines, one under the other, arriving in turn. On nothing.

**It also refuses to be told or track a PIN, a personal detail, or financial
data. Itself included.**

---

## 8 · Close — 4:18 to 4:59

*(77 words)*

> **SCREEN.** The first kitchen again — the empty one from section 1, now with
> afternoon light that has warmed back up. Then the prototype URL and the
> repository, readable, held to the end.

**Every companion app promises the same things. Configurable. Remembers routines.
So does this one. That is the entry fee, not the product.**

**The difference is what it does with a silence. Other companions wait to be
asked. This one arrives with something to say. And if the conversation sounds unusual, alerts the family.**

**Built on the AssemblyAI Voice Agent API, so the same companion answers in a
browser or on a phone line.**

**Built for them. And for the people who love them.**

> **SCREEN.** The end card, held four seconds, then out:
>
> > **CLOSER**
> > *Closer, if not near.*
>
> Then URL and repository, smaller, underneath. The tagline is never spoken —
> it answers the film's own first line, and a line that is read lands harder
> than one that is said over it.

---

## Production notes

**Decided, 22/09.**

- **The product is Closer**, tagline *Closer, if not near.* The companion stays
  **Iris** — she introduces herself by that name in every recorded session, and
  the split is the ordinary one: Iris answers the phone, Closer is what the
  family buys. Do not let the narration call the product Iris.
- **The setup form moved to the deck.** It used to be the fourth item in section
  5 — *anyone can set it up for their own person in twenty minutes*. It proves
  the thing generalises, which matters to a judge, but it is the least urgent
  twenty seconds in the film and section 6 needed the room.

**Do not.**

- **Do not use OpenAI's or anyone else's footage** for section 1. The reference
  is to a genre everyone recognises, and it survives being recreated on a
  kitchen table with a phone. Using their clip risks the submission for nothing.
- **Do not name a competitor in the narration.** The script never does. "You
  have seen this video" does the same work, cannot age badly, and cannot be
  argued with.
- **Do not show `/dev`**, the developer page with the latency readout and the
  event log. Section 4 shows what the person sees.
- **Do not show a real contact, a real number, or anything from `state/`,
  `sessions/` or a `setup.json`.** Section 5 needs the setup form filled with
  demonstration data only.

**Figures.** Every number spoken aloud is `verified: primary` in
`config/evidence.json` — ISTAT's own publication, February 2026. Two tempting
ones are **deliberately left out**, because both are `search-summary`, meaning
nobody has read them in the original: *half of over-sixty-fives take five or
more medicines a day*, and *people over eighty-five living alone in the UK
rising forty per cent in ten years*. Either would strengthen section 2. Verify
it in the source first, or leave it out — a judge who checks one figure and
finds it soft discounts the whole video.

**Audio.** Section 4 is the only place the agent speaks and it is the most
persuasive thirty-five seconds in the video. Use a real recorded session, not a
re-run for the camera, and do not cut inside a turn. Subtitles throughout: a
judge may watch it muted.

**Order of work.** Record section 4 first. It is the only part that depends on
the system behaving, and everything else can be shot in an afternoon once it
exists.
