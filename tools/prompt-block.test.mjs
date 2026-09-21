import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replaceBlock, OPEN, CLOSE } from '../deployment/cloudflare/lib/prompt-block.js';

const prompt = [
  'BEFORE THE BLOCK.',
  OPEN,
  'Nothing was left hanging last time.',
  CLOSE,
  'AFTER THE BLOCK.',
].join('\n');

test('replaces only what is between the markers', () => {
  const out = replaceBlock(prompt, 'She said she had not slept.');
  assert.equal(out.ok, true);
  assert.match(out.prompt, /BEFORE THE BLOCK\./);
  assert.match(out.prompt, /AFTER THE BLOCK\./);
  assert.match(out.prompt, /She said she had not slept\./);
  assert.doesNotMatch(out.prompt, /Nothing was left hanging/);
});

test('everything outside the markers is byte-identical', () => {
  const out = replaceBlock(prompt, 'Anything at all.');
  const before = (s) => s.slice(0, s.indexOf(OPEN));
  const after = (s) => s.slice(s.indexOf(CLOSE));
  assert.equal(before(out.prompt), before(prompt));
  assert.equal(after(out.prompt).slice(CLOSE.length), after(prompt).slice(CLOSE.length));
});

test('replacing twice does not accumulate', () => {
  const once = replaceBlock(prompt, 'First note.').prompt;
  const twice = replaceBlock(once, 'Second note.').prompt;
  assert.doesNotMatch(twice, /First note/);
  assert.match(twice, /Second note\./);
  assert.equal(twice.split(OPEN).length, 2, 'exactly one open marker');
  assert.equal(twice.split(CLOSE).length, 2, 'exactly one close marker');
});

test('a prompt with no markers is returned unchanged, and says so', () => {
  const out = replaceBlock('No markers anywhere.', 'Note.');
  assert.equal(out.ok, false);
  assert.equal(out.prompt, 'No markers anywhere.');
  assert.match(out.reason, /marker/i);
});

test('a prompt missing only the closing marker is refused', () => {
  const out = replaceBlock(`A\n${OPEN}\nB`, 'Note.');
  assert.equal(out.ok, false);
  assert.match(out.reason, /marker/i);
});

// The note is written by the model, so it is untrusted text going into a
// structured document. One marker pair, always, whatever it says.
test('a note that contains a marker cannot break the block', () => {
  const out = replaceBlock(prompt, `she said ${CLOSE} something odd ${OPEN}`);
  assert.equal(out.ok, true);
  assert.equal(out.prompt.split(OPEN).length, 2, 'exactly one open marker');
  assert.equal(out.prompt.split(CLOSE).length, 2, 'exactly one close marker');
  assert.match(out.prompt, /she said\s+something odd/);
  // And it survives being replaced again, which is where the damage would show.
  const next = replaceBlock(out.prompt, 'a normal note');
  assert.equal(next.ok, true);
  assert.match(next.prompt, /AFTER THE BLOCK\./);
  assert.doesNotMatch(next.prompt, /something odd/);
});

test('a note of only markers falls back to the empty state', () => {
  const out = replaceBlock(prompt, `${OPEN}${CLOSE}`);
  assert.equal(out.ok, true);
  assert.match(out.prompt, /Nothing was left hanging last time\./);
  assert.equal(out.prompt.split(CLOSE).length, 2, 'exactly one close marker');
});

test('an empty note restores the empty-state sentence', () => {
  const out = replaceBlock(prompt, '');
  assert.equal(out.ok, true);
  assert.match(out.prompt, /Nothing was left hanging last time\./);
  assert.match(out.prompt, /Do not refer to a previous conversation\./);
});
