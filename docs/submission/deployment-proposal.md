# Closer — where this gets deployed

*Closer, if not near.*

Source text for the pitch deck. One section per slide. It obeys the same
language rules as the product and the video (§5.4 of `HANDOVER.md`): it never
says detects, decline, cognitive or risk, and presents no threshold as clinical.

---

## Slide — What exists today

A person talks to Closer in a browser or on an ordinary phone line. The same
published agent answers both, so nothing about the conversation depends on the
person owning a device, a smartphone or an app.

Around that conversation: a setup form that configures a companion for a
specific person in about twenty minutes, a diary the person can correct out
loud, a note each conversation leaves for the next one, and a page their family
opens with a key.

Prototype: `lablab.claudiaonclaude.com`. Code: `github.com/sciarada75/voice-companion`.

---

## Slide — The market is the majority, not the margin

In Italy, 2.7 million people over seventy-five live on their own — one
household in ten. **92.8% of them can count on a relative. 3.2% have nobody.**
*(ISTAT, Censimento permanente della popolazione, 2023.)*

Closer is not built for the 3.2%. It is built for the 92.8% whose family wants
to be there and is not: work, full days, three hours of motorway. What is
missing is not love. It is the ordinary daily contact, where somebody would
simply have noticed.

---

## Slide — First customer: telecare providers

Personal alarm and telecare operators — Beghelli Salvalavita in Italy, Tunstall
and the Age UK alarms in the UK.

**They already own everything Closer lacks:**

| They have | Closer has |
|---|---|
| The exact customer, already subscribed | A reason to speak on a day nothing is wrong |
| A phone relationship into the house | A conversation worth the person's time |
| A 24-hour call centre | A page that says who to ring first, and why |
| Distribution and billing | The thing their product cannot do |

**Their pendant only speaks when it is pressed.** It is a reactive product with
no answer for the ordinary Tuesday. Closer is the half that speaks first — and
their call centre becomes the escalation path this project deliberately does not
build for itself, because a machine should hand a person to a person.

---

## Slide — The pilot

Fifty subscribers. Ninety days. One language.

| Measured | Why it is the right measure |
|---|---|
| Share of the words spoken by the person | Rises when the conversation is working. Across twelve test conversations the thirty-day average is 13%, and the best conversations reached 26%, from 5–9% at the start. |
| Average answer length | Thirty-day average 7 words; the best conversations reached 12, from 4–5 at the start. |
| Conversations a week, against their own baseline | Compared only with themselves, never with a population. |
| *Worth a call* flags the desk agreed with | The only honest test of whether the family page is useful. |

Every figure is arithmetic, not a model's opinion, so two people running it get
the same number.

---

## Slide — Then, in order

1. **Comune social services.** Municipalities already run volunteer telephone
   rounds for over-75s living alone. A volunteer manages forty people. Closer
   speaks to four thousand and hands the volunteer the twelve worth a visit. It
   does not replace volunteers; it aims their time.
2. **Teleassistenza under the national telemedicine programme**, which is funded
   and has targets to meet.
3. **Home care agencies.** The carer comes Monday, Wednesday, Friday. Closer
   covers the other four days and gives the carer a page to read before going in.
4. **Pharmacy services.** The diary already records what was taken. Medication
   routine is a pharmacy's existing relationship, not a new one.

Same product each time. Different buyer.

---

## Slide — Why it travels

The architecture separates three things that are usually tangled: **the person**
(their profile), **the language**, and **the doctrine** (how the companion
behaves). A new country is a configuration, not a rewrite. A new person is a
form, filled in twenty minutes by someone who is not technical.

The conversation rules are the part that took the work: nine spoken tests, each
producing one rule. The agent picks one subject rather than offering a menu.
Most turns end without a question, because an open question opens a subject the
person then has to carry. It never says where a fact came from. Two flat answers
in a row and it stops.

---

## Slide — What Closer will not do

It does not detect anything. It is not a medical device and does not audition
for the part. It notices that someone who talked for nine minutes last week
talked for two today, and tells the people who love her.

Recordings and transcripts are pulled to the operator, masked, and **deleted
from the speech provider**. Secrets are removed before anything is written; only
the fact that one came up is kept. The companion refuses to be told a PIN,
itself included. The family page shows no transcript — they do not read her post
— and only the people the person named can open it.

A machine that has spoken to somebody twelve times is not entitled to an
opinion about her mind.
