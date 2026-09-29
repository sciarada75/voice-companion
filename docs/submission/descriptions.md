# Submission texts

What goes into the lablab form, ready to paste. Counted by script, not by eye
(`python3` one-liner at the bottom). Bound by §5.4 like everything public: never
*detects, decline, cognitive, risk*, no threshold presented as clinical. **Every
claim here was checked against the running prototype on 29/09, not against a
description of it** - the phone line failed that test in three other documents.

---

## Title

Closer — a voice companion for people living alone

*If the form turns out to cap the title at 50 characters:* **Closer — voice company for people living alone**

## Short description (≤ 255 characters)

A voice companion configured to one older person from what their family wrote. It asks about the past they know best, writes down what they said in their own words, and gives the family a page to open, never an alert. Built on AssemblyAI.

## Long description (≥ 100 words)

Two point seven million Italians over seventy-five live on their own. Most have a family that wants to be there and is not: work, children, three hours of motorway. What is missing is not love. It is the ordinary daily conversation.

Closer is a voice companion configured to one specific person. Their family describes them in plain words, a profile is generated from it, and the companion, Iris in the demo, talks to that person about what they know best: a trade, a town before it changed, a football club followed for sixty years. Old age leaves little to say about today and a great deal about the past, and nobody asks any more. Closer asks, listens, and gives back one thing about how their world has changed since.

It keeps a diary the person can correct out loud, remembers one thing from the last conversation, and gives the family a page they open with a key. Nothing is sent to anybody on its own, and it never interprets a health number: it writes down what was said and leaves the judgement to people.

Built on the AssemblyAI Voice Agent API, with server-side tools so the same agent is ready for a phone line, Cloudflare Pages and D1 for the diary, and a set of conversation rules, each written after a spoken test. The live demo tells the judge who they are playing and what to try.

## Technology & category tags

Pick from the form's own vocabulary; these are what the project actually uses.

- **Technology:** AssemblyAI Voice Agent API · AssemblyAI speech-to-text · Cloudflare Pages · Cloudflare Pages Functions · Cloudflare D1 · Node.js · Claude (profile generation) · Remotion (the film)
- **Category:** Voice AI · Healthcare · AgeTech · Social impact · Conversational AI

**Do not tag Twilio or telephony.** The agent is built for a phone line and none is connected.

## Links

- **Prototype:** `https://lablab.claudiaonclaude.com/?k=<PAGE_KEY>` - the real key, from `.env`. After pasting, click the link back out of the form and check the page opens with the brief and *Talk to Iris*: that proves the `?k=` survived. **That click is a conversation only if you press the button** - opening the page mints nothing.
- **Code:** `https://github.com/sciarada75/voice-companion`
- **Video:** `docs/submission/CLOSER.mp4` · **Deck:** `docs/submission/CLOSER-deck.pdf` · **Cover:** `docs/submission/cover.png`

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
