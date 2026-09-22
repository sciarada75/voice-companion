// The greeting is the first thing the person hears and nothing downstream can
// correct it, so the choice is a pure function and it is tested here rather
// than discovered in a conversation. Same reasoning as prompt-block.test.mjs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chooseGreeting, bandFor, localHour } from '../deployment/cloudflare/lib/greeting.js';

const G = {
  timezone: 'Europe/London',
  bands: { morning: [5, 12], afternoon: [12, 18], evening: [18, 5] },
  introduction: 'INTRO',
  rotation: { morning: ['M1', 'M2'], afternoon: ['A1', 'A2'], evening: ['E1', 'E2'] },
};

// 09:00 UTC is 10:00 in London in September: the band must follow the person,
// not the server.
const at = iso => new Date(iso);

test('the very first conversation introduces itself', () => {
  assert.equal(chooseGreeting({ greetings: G, conversations: 0, now: at('2026-09-22T09:00:00Z') }), 'INTRO');
});

test('every conversation after the first uses the rotation, never the introduction', () => {
  for (let n = 1; n < 20; n++) {
    const g = chooseGreeting({ greetings: G, conversations: n, now: at('2026-09-22T09:00:00Z') });
    assert.notEqual(g, 'INTRO', `conversation ${n} introduced itself again`);
    assert.ok(G.rotation.morning.includes(g));
  }
});

test('the band follows the local hour where they live, not UTC', () => {
  // 23:30 UTC on a British summer evening is 00:30 in Ashton: still evening,
  // because the evening band wraps past midnight.
  assert.equal(bandFor(localHour(at('2026-09-22T23:30:00Z'), 'Europe/London'), G.bands), 'evening');
  // 17:30 in London is afternoon; the same instant in Rome is 18:30, evening.
  assert.equal(bandFor(localHour(at('2026-09-22T16:30:00Z'), 'Europe/London'), G.bands), 'afternoon');
  assert.equal(bandFor(localHour(at('2026-09-22T16:30:00Z'), 'Europe/Rome'), G.bands), 'evening');
});

test('every hour of the day falls in exactly one band', () => {
  for (let h = 0; h < 24; h++) {
    const hits = Object.entries(G.bands).filter(([, [f, t]] ) =>
      f <= t ? h >= f && h < t : h >= f || h < t);
    assert.equal(hits.length, 1, `hour ${h} matched ${hits.length} bands`);
  }
});

test('an unknown timezone falls back to UTC instead of throwing', () => {
  assert.equal(localHour(at('2026-09-22T09:00:00Z'), 'Not/AZone'), 9);
});

test('no greetings configured returns nothing, and the agent keeps what it has', () => {
  assert.equal(chooseGreeting({ greetings: null, conversations: 3 }), null);
});

test('a band with no lines returns nothing rather than a line from another band', () => {
  const sparse = { ...G, rotation: { morning: [], afternoon: ['A1'], evening: ['E1'] } };
  assert.equal(chooseGreeting({ greetings: sparse, conversations: 3, now: at('2026-09-22T09:00:00Z') }), null);
});

test('the line the agent already carries is avoided when another is available', () => {
  for (let i = 0; i < 30; i++) {
    const g = chooseGreeting({ greetings: G, conversations: 3, now: at('2026-09-22T09:00:00Z'), current: 'M1' });
    assert.equal(g, 'M2');
  }
});

test('a band of one repeats rather than returning nothing', () => {
  const one = { ...G, rotation: { ...G.rotation, morning: ['M1'] } };
  assert.equal(chooseGreeting({ greetings: one, conversations: 3, now: at('2026-09-22T09:00:00Z'), current: 'M1' }), 'M1');
});

test('over many conversations it actually rotates, rather than settling on one line', () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    seen.add(chooseGreeting({ greetings: G, conversations: 5, now: at('2026-09-22T09:00:00Z') }));
  }
  assert.deepEqual([...seen].sort(), ['M1', 'M2']);
});
