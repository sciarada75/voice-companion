# Pitch video — script

AssemblyAI Voice Agent Hackathon. **MP4, max 5 minutes, under 300 MB.**

**571 spoken words.** At pitch pace, 150 a minute, that is 3:48 of narration,
plus 35 seconds of the agent's own voice and about 20 seconds of held title
cards: **4:43 against a hard 5:00 cap.** Read slowly, at 140, it hits 5:00
exactly.

**So read it aloud against a clock before shooting anything.** If it runs over,
cut section 5 — the four parts are the most compressible thing here and the
video survives losing the fourth. Never cut section 3 or section 6: one is the
argument and the other is the trust.

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

## 1 · The video everyone has already seen — 0:00 to 0:35

*(59 words)*

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

**The demo was never the problem. It is a conversation that happened once,
because somebody was in the room, filming it.**

---

## 2 · The rest of it — 0:35 to 1:25

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
hours away. They ring on Sunday.**

**What is missing is not love. It is the ordinary daily contact, where somebody
would simply have noticed.**

> **SCREEN.** Four lines type themselves out, in the voice of a worried adult
> child. No icons.

**Did she take the tablets. Is she eating. She told me the same story twice
last month. There is a new person with a key to the house, and she trusts
everybody.**

**None of it is an emergency. Which is exactly why nobody catches it.**

---

## 3 · The turn — 1:25 to 2:05

*(83 words)*

> **SCREEN.** Plain type: **So: a companion.**

**So: a companion. Not a novelty. Something with a job.**

> **SCREEN.** Hold on the words as they are spoken. This is the centre of the
> video. Let it be quiet.

**Every old person was once very good at something. Then the world moved on
without them, and stopped asking.**

**Peggy ran the sample room at a clothing factory for forty-one years. She can
still tell whether a jacket was put together properly, and she is usually rude
about it. Nobody has asked her in ten years.**

**So the companion asks. And then it tells her what became of her trade after
she left.**

---

## 4 · Let it talk — 2:05 to 2:55

*(51 words of narration. The agent does the rest.)*

> **SCREEN.** The real page, on a real screen, with real recorded session audio.
> Permanent small caption: *Peggy is a demonstration persona derived from
> national statistics. No real person's data appears in this project.*

**This is the actual thing, running.**

> **PLAY.** Thirty-five seconds of session audio, uncut, subtitled. Choose the
> exchange where the agent gives her something rather than asking her
> something — the factory work going abroad, or City leaving Maine Road.

**Notice what it mostly does not do. It does not ask her another question.**

**An open question opens a subject she then has to carry. She tires, and it dies.
So most turns end with something given, and a silence she can fill. Or not.**

---

## 5 · What it is made of — 2:55 to 3:45

*(97 words)*

> **SCREEN.** Four things, three seconds of real interface each. Move briskly.
> No feature grid.

> **SCREEN.** The diary tool firing mid-conversation.

**It keeps her diary. She says she took her tablets, it writes it down and reads
it back, so she can catch a mistake.**

> **SCREEN.** The `[LAST TIME]` note in the stored agent.

**Each conversation leaves one loose end for the next. The dinner with her friend
next week — so the following one can ask how it went.**

> **SCREEN.** The family report. Scroll five indicators, open one row to show
> her own words.

**Her family get a page. Five things, at three time scales, because a missed walk
means one thing in a day and another in a month. No transcript: they do not read
her post.**

> **SCREEN.** The setup form moving through its sections.

**And anyone can set it up for their own person in twenty minutes.**

---

## 6 · What it will not do — 3:45 to 4:15

*(86 words)*

> **SCREEN.** Plain type. Slow down. This is the section that earns trust. Play
> it straight and let the irony sit underneath it.

**And it does not detect anything.**

**It is not a medical device and does not audition for the part. It notices that
someone who talked for nine minutes last week talked for two today, and tells
the people who love her. A machine that has spoken to somebody twelve times is
not entitled to an opinion about her mind.**

**It is built for a person, not a condition. There is no dementia mode. There is
Peggy.**

> **SCREEN.** One more line. Let it land.

**It also refuses to be told a PIN. Itself included.**

---

## 7 · Close — 4:15 to 4:35

*(77 words)*

> **SCREEN.** The first kitchen again. Then the prototype URL and the repository,
> readable, held to the end.

**Every companion app promises the same things. Configurable. Remembers routines.
Alerts the family. So does this one. That is the entry fee, not the product.**

**The difference is what it does with a silence. Other companions wait to be
asked. This one arrives with something to say.**

**Built on the AssemblyAI Voice Agent API, so the same companion answers in a
browser or on a phone line.**

**Built for them. And for the people who love them.**

> **SCREEN.** Product name. URL. Repository. Hold three seconds. Out.

---

## Production notes

**The one thing blocked on a decision.**

- **The product has no name.** It is spoken once, in the final line, and shown
  twice on screen. Everything else in the script works without it. That last
  line does not.

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
