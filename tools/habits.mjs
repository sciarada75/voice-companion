// One translation, used by BOTH build_agent and build_web, so the agent's tools
// and the online notebook can never disagree about which habits exist.
//
// Two shapes meet here:
//   - what tools/setup_ui writes to habits.json, as the family describes the
//     routine:  { id, type, what, when }
//   - what the notebook backend (deployment/cloudflare/lib/diary.js) reads:
//     { id, spoken_as, recurrence, fields: [{ id, spoken_as, unit }] }
//
// Before this file the backend read fields the form never wrote, so the first
// "I took my tablets" would have thrown on `habit.fields`. Nobody would have seen
// it until they spoke to it: the file said one thing, the server did another.
//
// Only what the PERSON does and can report is recordable. A visit or an
// appointment happens to them; it is context for the prompt, not a notebook line.
// And nothing here invents a number field: a reading enters the notebook only
// when a habit is hand-written in the backend shape with its own `fields`.

const RECORDABLE = new Set(['medicine', 'habit']);

export function recordableHabits(habitsFile) {
  const seen = new Set();
  const out = [];

  for (const h of habitsFile?.habits ?? []) {
    // Already in the backend shape: hand-written on purpose, keep it as it is.
    const entry = Array.isArray(h.fields)
      ? h
      : RECORDABLE.has(h.type)
        ? {
            id: h.id,
            spoken_as: h.when ? `${h.what}, ${h.when}` : h.what,
            recurrence: 'daily',
            fields: [],
          }
        : null;
    if (!entry) continue;

    if (seen.has(entry.id)) {
      throw new Error(
        `habits.json has two entries with the id "${entry.id}". The notebook finds ` +
        `a habit by id, so the second would never be reachable. Rename one.`,
      );
    }
    seen.add(entry.id);
    out.push(entry);
  }
  return out;
}
