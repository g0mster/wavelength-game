-- Run this in Supabase SQL editor AFTER running supabase-schema.sql

-- RPC to safely increment a player's score
create or replace function increment_score(p_id text, amount int)
returns void language sql as $$
  update players set score = score + amount where id = p_id;
$$;
