# Submission texts

**Submitted 30/09/2026.** This is what went into the lablab form, field by field. Counted by script, not by eye
(`python3` one-liner at the bottom). Bound by §5.4 like everything public: never
*detects, decline, cognitive, risk*, no threshold presented as clinical. **Every
claim here was checked against the running prototype on 29/09, not against a
description of it** - the phone line failed that test in three other documents.

---

## Title

Closer — a voice companion for people living alone

The form caps the title at **50**, and this is exactly 50, so it went in whole.

A title in a gallery says what the thing is; the feeling is carried by the
tagline on the cover, the film and the deck, *Closer, if not near*. The pun
*relative distance* (the phrase for how far apart two things are, and a
*relative* is family) was tried as the title on 29/09 and rejected: it has to be
worked out, it names nobody, and it would compete with the tagline. It lives on
deck slide 02, where the reader has time for it.

## Short description (50-255 characters)

A voice companion configured to one older person from what their family wrote. It asks about the past they know best, writes down what they said in their own words, and gives the family a page to open. Built on AssemblyAI.

## Long description (600-2000 characters in the form; 100+ words on the public page)

Two point seven million Italians over seventy-five live on their own. Most have a family that wants to be there and is not: work, children, three hours of motorway. What is missing is not love. It is the ordinary daily conversation.

Closer is a voice companion configured to one specific person. Their family describes them in plain words, a profile is generated from it, and the companion, Iris in the demo, talks to that person about what they know best: a trade, a town before it changed, a football club followed for sixty years. Old age leaves little to say about today and a great deal about the past, and nobody asks any more. Closer asks, listens, and gives back one thing about how their world has changed since.

It keeps a diary the person can correct out loud, remembers one thing from the last conversation, and gives the family a page they open with a key. Nothing is sent to anybody on its own, and it never interprets a health number: it writes down what was said and leaves the judgement to people.

Built on the AssemblyAI Voice Agent API, with server-side tools so the same agent is ready for a phone line, Cloudflare Pages and D1 for the diary, and a set of conversation rules, each written after a spoken test. The live demo tells the judge who they are playing and what to try.

## Technology & category tags

What the project actually uses: the AssemblyAI Voice Agent API, Cloudflare
Pages, Functions and D1, Node.js, Claude (profile generation), Remotion (the
film). **The form offers a fixed vocabulary and most of these are not in it.**

- **Category (one choice only):** **Voice Assistant.** Offered: family,
  assistant, health, mental health, virtual assistant, voice assistant,
  chatbot, home, healthcare, home automation. *Health*, *Healthcare* and
  *Mental health* were refused on purpose: they file Closer as the medical
  product deck slide 07 says it is not.
- **Technologies:** the vocabulary has **no "Voice Agent API" entry**, and no
  Node.js, JavaScript or Remotion. The AssemblyAI entries are *Assemblyai
  Guardrails (API)* and *LLM Gateway*; 25 other entries used Guardrails as the
  AssemblyAI marker (lablab's `/apps/tech/assemblyai`, 29/09). Recommended:
  **Assemblyai Guardrails API**, **Anthropic Claude**, **Claude Code**. The
  title and long description name the Voice Agent API explicitly. *Assistants
  API* is OpenAI's and was not used.

**No Twilio or telephony tag.** No phone line is connected.

## Links

- **Prototype:** `https://lablab.claudiaonclaude.com/?k=<PAGE_KEY>` - the real key, from `.env`. After pasting, click the link back out of the form and check the page opens with the brief and *Talk to Iris*: that proves the `?k=` survived. **That click is a conversation only if you press the button** - opening the page mints nothing.
- **Code:** `https://github.com/sciarada75/voice-companion`
- **Video:** `docs/submission/CLOSER.mp4` · **Deck:** `docs/submission/CLOSER-deck.pdf` · **Cover:** `docs/submission/cover.png` - all three **uploaded as files**; lablab hosts the video.
- **Demo application platform:** *Other* (offered: Streamlit, Replit, Vercel, native.builder, Other).

## Additional information (optional, up to 2000 characters)

How to try it: open the demo link on a computer, in Chrome or Safari, and allow the microphone. The panel on the right introduces Closer and the person it is set up for: Peggy, 83, who lives alone. Press "Talk to Iris" and speak as her.

The link carries its own access key (?k=...). Please use the whole link, or the conversation cannot start. Once opened, the browser remembers it.

Iris keeps one thing from the previous conversation. The demo is shared by all judges, so that may be something another judge said.

On a phone it works too, but keep the screen awake: a locked screen ends the conversation.

Peggy is fictional. Nothing in the demo is about a real person.

---

```sh
python3 - <<'PY'
import re
s = open('docs/submission/descriptions.md', encoding='utf-8').read()
part = lambda h: re.search(r'## ' + h + r'[^\n]*\n\n(.+?)\n\n## ', s, re.S).group(1).strip()
t = part('Title').split('\n')[0]
print('title', len(t), 'chars |', 'short', len(part('Short description')), 'chars |',
      'long', len(part('Long description').split()), 'words')
PY
```
