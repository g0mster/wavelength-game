import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, uuid } from '@/lib/supabase';
import { pickRandomIndices } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  const { code, name } = await req.json();
  if (!name?.trim() || !code?.trim()) {
    return NextResponse.json({ error: 'Name and code required' }, { status: 400 });
  }

  const db = getServerSupabase();
  const roomCode = code.trim().toUpperCase();

  // Check room exists and is in waiting phase
  const { data: room, error: roomError } = await db
    .from('rooms')
    .select('*')
    .eq('code', roomCode)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  }
  if (room.phase !== 'waiting') {
    return NextResponse.json({ error: 'Game already started' }, { status: 400 });
  }

  // Get existing question indices to avoid duplicates
  const { data: existingCards } = await db
    .from('lobby_cards')
    .select('question_index')
    .eq('room_code', roomCode);

  const usedIndices = (existingCards || []).map((c: { question_index: number }) => c.question_index);

  const playerId = uuid();
  const { error: playerError } = await db.from('players').insert({
    id: playerId,
    room_code: roomCode,
    name: name.trim(),
    score: 0,
    lobby_done: false,
    connected: true,
  });
  if (playerError) return NextResponse.json({ error: playerError.message }, { status: 500 });

  // Create 3 unique lobby cards for this player
  const indices = pickRandomIndices(3, usedIndices);
  const cards = indices.map((qi, i) => ({
    id: uuid(),
    player_id: playerId,
    room_code: roomCode,
    card_order: i + 1,
    question_index: qi,
    target_position: Math.random() * 0.8 + 0.1,
    person_name: null,
    submitted_at: null,
  }));

  const { error: cardError } = await db.from('lobby_cards').insert(cards);
  if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 });

  return NextResponse.json({ playerId, code: roomCode });
}
