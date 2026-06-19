-- Run this in your Supabase SQL editor

create table if not exists rooms (
  code        text primary key,
  phase       text not null default 'waiting',
  -- phase: 'waiting' | 'lobby' | 'playing' | 'finished'
  host_id     text not null,
  current_round int not null default 0,
  total_rounds  int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists players (
  id          text primary key,
  room_code   text not null references rooms(code) on delete cascade,
  name        text not null,
  score       int not null default 0,
  lobby_done  boolean not null default false,
  connected   boolean not null default true,
  joined_at   timestamptz not null default now()
);

-- Each player's 3 lobby cards (prompt + their hidden bullseye + their clue)
create table if not exists lobby_cards (
  id              text primary key,
  player_id       text not null references players(id) on delete cascade,
  room_code       text not null,
  card_order      int not null, -- 1, 2, or 3
  question_index  int not null, -- index into the 315 prompts array
  target_position float not null, -- 0.0 to 1.0, the hidden bullseye center
  person_name     text,          -- filled in by the player during lobby
  submitted_at    timestamptz
);

-- Rounds in the main game (one per lobby card, shuffled order)
create table if not exists rounds (
  id            text primary key,
  room_code     text not null references rooms(code) on delete cascade,
  round_number  int not null,
  lobby_card_id text not null references lobby_cards(id),
  owner_id      text not null, -- player who created this card (stays silent)
  phase         text not null default 'guessing',
  -- phase: 'guessing' | 'revealed'
  revealed_at   timestamptz
);

-- Each player's guess for a round
create table if not exists guesses (
  id          text primary key,
  round_id    text not null references rounds(id) on delete cascade,
  player_id   text not null,
  room_code   text not null,
  position    float not null, -- 0.0 to 1.0
  score       int not null default 0,
  locked_at   timestamptz not null default now()
);

-- Enable realtime on all tables
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table lobby_cards;
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table guesses;
