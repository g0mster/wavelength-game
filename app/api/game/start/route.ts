import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, uuid } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { code, playerId } = await req.json();
  const db = getServerSupabase();

  // Verify host
  const { data: room } = await db.from('rooms').select('*').eq('code', code).single();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.host_id !== playerId) return NextResponse.json({ error: 'Not host' }, { status: 403 });
  if (room.phase !== 'lobby') return NextResponse.json({ error: 'Not in lobby' }, { status: 400 });

  // Get all submitted lobby cards
  const { data: cards } = await db
    .from('lobby_cards')
    .select('*')
    .eq('room_code', code)
    .not('person_name', 'is', null);

  if (!cards || cards.length === 0) {
    return NextResponse.json({ error: 'No cards submitted' }, { status: 400 });
  }

  // Shuffle cards to create rounds
  const shuffled = [...cards].sort(() => Math.random() - 0.5);

  const rounds = shuffled.map((card, i) => ({
    id: uuid(),
    room_code: code,
    round_number: i + 1,
    lobby_card_id: card.id,
    owner_id: card.player_id,
    phase: 'guessing',
    revealed_at: null,
  }));

  const { error: roundError } = await db.from('rounds').insert(rounds);
  if (roundError) return NextResponse.json({ error: roundError.message }, { status: 500 });

  // Start the game
  const { error: roomError } = await db
    .from('rooms')
    .update({ phase: 'playing', current_round: 1, total_rounds: rounds.length })
    .eq('code', code);

  if (roomError) return NextResponse.json({ error: roomError.message }, { status: 500 });

  return NextResponse.json({ ok: true, totalRounds: rounds.length });
}
