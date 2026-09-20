import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordableHabits } from './habits.mjs';

const form = (habits) => ({ habits });

test('a medicine becomes a daily yes/no entry the backend can record', () => {
  const [m] = recordableHabits(form([
    { id: 'tablets-morning', type: 'medicine', what: 'morning tablets', when: '' },
  ]));
  assert.equal(m.id, 'tablets-morning');
  assert.equal(m.spoken_as, 'morning tablets');
  assert.equal(m.recurrence, 'daily');
  // No number fields: nothing is ever recorded that the person did not say.
  assert.deepEqual(m.fields, []);
});

test('"when" is part of how the person says it', () => {
  const [h] = recordableHabits(form([
    { id: 'walk', type: 'habit', what: 'a walk', when: 'after lunch' },
  ]));
  assert.equal(h.spoken_as, 'a walk, after lunch');
});

test('visits and appointments are context, not something to record', () => {
  const out = recordableHabits(form([
    { id: 'daughter', type: 'visit', what: 'daughter visits', when: 'Thursday' },
    { id: 'gp', type: 'touchpoint', what: 'GP', when: '' },
    { id: 'pill', type: 'medicine', what: 'pill', when: '' },
  ]));
  assert.deepEqual(out.map((h) => h.id), ['pill']);
});

test('an entry already in the backend shape is left untouched', () => {
  const full = {
    id: 'bp', type: 'habit', spoken_as: 'blood pressure', recurrence: 'daily',
    fields: [{ id: 'value', spoken_as: 'the reading', unit: 'mmHg' }],
  };
  assert.deepEqual(recordableHabits(form([full])), [full]);
});

test('no habits file, or an empty one, means no notebook entries', () => {
  assert.deepEqual(recordableHabits(null), []);
  assert.deepEqual(recordableHabits({}), []);
  assert.deepEqual(recordableHabits(form([])), []);
});

test('two entries with the same id stop the build, loudly', () => {
  assert.throws(
    () => recordableHabits(form([
      { id: 'tablets', type: 'medicine', what: 'a', when: '' },
      { id: 'tablets', type: 'medicine', what: 'b', when: '' },
    ])),
    /tablets/,
  );
});
