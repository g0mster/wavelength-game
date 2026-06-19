import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, nanoid, uuid } from '@/lib/supabase';
import { pickRandomIndices } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const db = getServerSupabase();
  const code = nanoid(4);
  const playerId = uuid();

  const { error: roomError } = await db.from('rooms').insert({
    code,
    phase: 'waiting',
    host_id: playerId,
    current_round: 0,
    total_rounds: 0,
  });
  if (roomError) return NextResponse.json({ error: roomError.message }, { status: 500 });

  const { error: playerError } = await db.from('players').insert({
    id: playerId,
    room_code: code,
    name: name.trim(),
    score: 0,
    lobby_done: false,
    connected: true,
  });
  if (playerError) return NextResponse.json({ error: playerError.message }, { status: 500 });

  // Create 3 lobby cards for the host
  const indices = pickRandomIndices(3);
  const cards = indices.map((qi, i) => ({
    id: uuid(),
    player_id: playerId,
    room_code: code,
    card_order: i + 1,
    question_index: qi,
    target_position: Math.random() * 0.8 + 0.1, // 0.1 to 0.9 to avoid edges
    person_name: null,
    submitted_at: null,
  }));

  const { error: cardError } = await db.from('lobby_cards').insert(cards);
  if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 });

  return NextResponse.json({ code, playerId });
}
