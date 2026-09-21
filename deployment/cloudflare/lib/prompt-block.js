// Replaces the text between two markers inside the agent's system_prompt, and
// NOTHING else.
//
// It is a separate file, with no network in it, because this is the piece that
// can do real damage: the string it edits is a person's biography, and a
// pattern that matched one character too far would quietly destroy it. Pure
// function, six tests, no excuses.
//
// If the markers are not both there it changes NOTHING and says why. A silent
// no-op is the §6.2 family of defects: the file says one thing, the server does
// another, and nobody notices until someone speaks to it.

export const OPEN = '[LAST TIME]';
export const CLOSE = '[/LAST TIME]';

// What the agent is told when nothing is carried forward. It is a sentence
// about what NOT to do, because an empty block would leave the model to invent
// a reason for the heading being there.
export const NOTHING =
  'Nothing was left hanging last time. Do not refer to a previous conversation.';

export function replaceBlock(prompt, note) {
  const start = prompt.indexOf(OPEN);
  const end = prompt.indexOf(CLOSE);

  if (start === -1 || end === -1 || end < start) {
    return {
      ok: false,
      prompt,
      reason: `the ${OPEN} / ${CLOSE} marker pair is not in the prompt, so nothing was changed`,
    };
  }

  // THE NOTE COMES FROM THE MODEL, so it is untrusted text going into a
  // structured document. A note that happened to contain a marker would leave
  // two of them in the prompt, the block would no longer have one boundary, and
  // the next write would land somewhere nobody chose. Strip them: the markers
  // are ours, and nothing the model says may ever become one.
  const text = strip(String(note ?? '')).trim() || NOTHING;
  return {
    ok: true,
    prompt: prompt.slice(0, start + OPEN.length) + '\n' + text + '\n' + prompt.slice(end),
  };
}

const strip = (s) => s.split(OPEN).join('').split(CLOSE).join('');
