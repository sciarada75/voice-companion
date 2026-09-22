// Which greeting this conversation opens with.
//
// WHY THIS IS NOT IN THE PROMPT: the greeting is fixed text on the stored agent
// and it never goes through the model (§4, and the same reason diary_status was
// removed from the model's hands in token.js). So nothing the model does can
// vary it. Something has to CHOOSE, before the session starts, and write it.
//
// WHY IT ROTATES AT ALL: Claudia, 22/09, on hearing the same opening a second
// time — a greeting that announces every single day that somebody has described
// you to a machine is unsettling, and the disclosure belongs in the first
// conversation only. After that it is just somebody saying hello, and somebody
// saying hello does not use the same twelve words every morning.
//
// This file is a PURE FUNCTION with no network and no clock of its own, for the
// same reason prompt-block.js is (§6.16): what it returns is spoken to a person
// as the first thing they hear, so it has to be testable without talking to
// anybody.

// Which band an hour falls in. `bands` is {name: [fromHour, toHour]}, and a band
// whose end is smaller than its start wraps past midnight — evening runs 18 to
// 5, and 2am is evening, not "no band at all".
export function bandFor(hour, bands) {
  for (const [name, range] of Object.entries(bands ?? {})) {
    const [from, to] = range;
    if (from <= to ? hour >= from && hour < to : hour >= from || hour < to) {
      return name;
    }
  }
  return null;
}

// The local hour where THEY live, which is not where the server runs and not
// where Claudia is. A person in Ashton greeted good evening at four in the
// afternoon has been told, clearly, that this thing does not know where she is.
export function localHour(date, timeZone) {
  try {
    return Number(
      new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', hour12: false })
        .format(date),
    );
  } catch {
    // An unknown zone must not stop somebody talking. UTC is wrong by an hour
    // in Ashton and by two in Rome, which is survivable; throwing is not.
    return date.getUTCHours();
  }
}

// `conversations` is how many have happened BEFORE this one.
//
// `current` is what the agent is carrying now, and it is passed in so the same
// line is not used twice running. With three lines in a band that is the
// difference between a rotation and a coin toss that keeps landing the same way.
export function chooseGreeting({ greetings, conversations, now = new Date(), current = '' }) {
  if (!greetings) return null;

  // THE FIRST CONVERSATION EVER, and only that one, introduces itself and says
  // where what it knows came from. Never again: see the note at the top.
  if (!conversations) return greetings.introduction ?? null;

  const band = bandFor(localHour(now, greetings.timezone), greetings.bands);
  const lines = greetings.rotation?.[band] ?? [];
  if (!lines.length) return null;

  // Avoid repeating the line it already has. If that leaves nothing — a band
  // with one line in it — repeat rather than return nothing, because a stale
  // greeting from the wrong part of the day is worse than a repeated one.
  const fresh = lines.filter(l => l !== current);
  const pool = fresh.length ? fresh : lines;
  return pool[Math.floor(Math.random() * pool.length)];
}
