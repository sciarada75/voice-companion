-- The diary. Cloudflare D1 database (SQLite), free, in EEUR
-- (served from Frankfurt): the data stays in Europe, which for health data
-- is not a detail.
--
-- WHY D1 AND NOT KV: KV is "eventually consistent", that is, after a write it
-- can hand back the old value for as long as a minute. Here the person can say
-- their blood sugar and ask for it again thirty seconds later: with KV the agent
-- would read the old figure back to them without noticing.
--
-- EVERY RECORDING IS AN EVENT, NOT A BOX FOR THE DAY.
-- The first version kept one box per habit per day, and the last answer
-- overwrote the previous one. With blood sugar measured before every meal that
-- model breaks silently: the lunch value overwrites the breakfast one and the
-- number left behind is perfectly believable. Now every time the person says
-- something an event is born with its own time, and three measurements in one
-- day are three events.
--
-- There is no need to know "at which meal": the event's time already tells us,
-- and it can be worked out afterwards if we want. Asking it while talking would
-- be a form to fill in.
--
-- THE conversations TABLE IS THE ONE THAT MAKES THE REST WORK. A day with no
-- data can mean that they did not do it, that nobody asked them, or that they
-- did not speak at all. Only the first says anything about the person. It also
-- tells us whether this is the first call of the day, which is the moment the
-- agent asks about the habits.

-- THERE WAS A "DROP TABLE IF EXISTS entries" HERE, which served to rebuild the
-- table when the model moved from daily boxes to events. Removed on purpose:
-- from now on this file can hold the person's real data, and a file that gets
-- re-run to add a table must not be able to empty another one.
-- If one day it really did need rebuilding, you write a separate migration and
-- you look it in the face.

-- ONE ROW = ONE VALUE. An event can have several rows (the walk has
-- minutes and steps), held together by event.
CREATE TABLE IF NOT EXISTS entries (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Identifier of the single recording: it groups the fields the person
  -- said in the same sentence.
  event      TEXT NOT NULL,
  -- Local day where they live (YYYY-MM-DD), not UTC: at 00:30 Italian time it
  -- is still yesterday for UTC, and the data would end up on the wrong day.
  day        TEXT NOT NULL,
  -- Local time HH:MM, so "the eleven o'clock one" can be read back without
  -- doing arithmetic.
  time       TEXT NOT NULL,
  -- id of the habit and of the field, as in config/habits.json. If they change
  -- there, the history splits in two: they do not get changed.
  habit      TEXT NOT NULL,
  field      TEXT NOT NULL,
  number     REAL,
  text       TEXT,
  unit       TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS entries_day_habit
  ON entries (day, habit, id DESC);
CREATE INDEX IF NOT EXISTS entries_habit_time
  ON entries (habit, created_at DESC);

CREATE TABLE IF NOT EXISTS conversations (
  session    TEXT PRIMARY KEY,
  day        TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS conversations_day
  ON conversations (day);

-- How long the agent takes to answer, measured by the page at every turn.
--
-- WHY IN A DATABASE AND NOT READ OFF THE SCREEN: because otherwise it falls to
-- Claudia to look at a small grey number while she is talking, remember it and
-- tell it back to me. Half the turns get lost, and the ones that get lost are
-- exactly the slow ones (which is when a person stops looking at the screen and
-- loses patience), and you cannot tell "it is slow now and then" from "it is
-- always slow" — which is the only thing that then changes what you go and fix.
--
-- NOTHING OF WHAT THEY SAY TO EACH OTHER ENDS UP HERE: only times in
-- milliseconds and the kind of phone. No words, no transcript.
CREATE TABLE IF NOT EXISTS latency (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  -- Which phone: network latency and audio change, the rest does not.
  device     TEXT,
  -- The four parts, in milliseconds. NULL where the turn did not allow them to
  -- be measured (a very short sentence may produce no delta at all): NULL and
  -- not zero, or the averages would say the turn is free.
  turn       REAL,
  model      REAL,
  voice      REAL,
  cushion    REAL,
  total      REAL
);

CREATE INDEX IF NOT EXISTS latency_when ON latency (created_at DESC);

-- What the person left hanging, to be picked up in the NEXT conversation.
--
-- Only the most recent row is ever used. If somebody leaves three things
-- hanging in one conversation, carrying all three back is an interrogation.
--
-- Rows are never deleted and the note is never rewritten: only `state` moves,
-- pending -> delivered. The history of what was carried forward is worth
-- keeping, and it is the same "an event, not a box" rule as `entries`.
CREATE TABLE IF NOT EXISTS loose_ends (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  note       TEXT NOT NULL,
  -- Local day in Europe/Rome, like everywhere else: at 00:30 Italian time UTC
  -- is still yesterday, and the row would land on the wrong day.
  day        TEXT NOT NULL,
  created_at TEXT NOT NULL,
  -- 'pending'   written, not yet given to a conversation
  -- 'delivered' a conversation has had it; the next one clears the block
  state      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS loose_ends_recent ON loose_ends (id DESC);
