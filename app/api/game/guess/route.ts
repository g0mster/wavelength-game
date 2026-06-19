import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, uuid } from '@/lib/supabase';

function calcScore(guess: number, target: number): number {
  const diff = Math.abs(guess - target);
  if (diff <= 0.08) return 4;  // bullseye
  if (diff <= 0.16) return 3;  // close
  if (diff <= 0.25) return 2;  // near
  return 0;
}

export async function POST(req: NextRequest) {
  const { roundId, playerId, position } = await req.json();
  if (!roundId || !playerId || position === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const db = getServerSupabase();

  // Get round + card (for target position)
  const { data: round } = await db
    .from('rounds')
    .select('*, lobby_cards(target_position, player_id)')
    .eq('id', roundId)
    .single();

  if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  if (round.phase !== 'guessing') return NextResponse.json({ error: 'Not guessing phase' }, { status: 400 });

  // Card owner cannot guess their own card
  if (round.owner_id === playerId) {
    return NextResponse.json({ error: 'You cannot guess your own card' }, { status: 400 });
  }

  // Check if already guessed
  const { data: existing } = await db
    .from('guesses')
    .select('id')
    .eq('round_id', roundId)
    .eq('player_id', playerId)
    .single();

  if (existing) return NextResponse.json({ error: 'Already guessed' }, { status: 400 });

  const target = round.lobby_cards.target_position;
  const score = calcScore(position, target);

  const { error } = await db.from('guesses').insert({
    id: uuid(),
    round_id: roundId,
    player_id: playerId,
    room_code: round.room_code,
    position,
    score,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check if all non-owner players have guessed → auto-reveal
  const { data: players } = await db
    .from('players')
    .select('id')
    .eq('room_code', round.room_code);

  const nonOwners = (players || []).filter((p: { id: string }) => p.id !== round.owner_id);

  const { data: guesses } = await db
    .from('guesses')
    .select('player_id')
    .eq('round_id', roundId);

  const allGuessed = nonOwners.every((p: { id: string }) =>
    (guesses || []).some((g: { player_id: string }) => g.player_id === p.id)
  );

  return NextResponse.json({ ok: true, score, allGuessed });
}
