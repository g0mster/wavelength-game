import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { roundId, playerId } = await req.json();
  const db = getServerSupabase();

  const { data: round } = await db
    .from('rounds')
    .select('*, lobby_cards(target_position, player_id, question_index)')
    .eq('id', roundId)
    .single();

  if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 });

  // Only host or round owner can reveal
  const { data: room } = await db
    .from('rooms')
    .select('host_id')
    .eq('code', round.room_code)
    .single();

  if (room?.host_id !== playerId && round.owner_id !== playerId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Reveal the round
  await db.from('rounds').update({ phase: 'revealed', revealed_at: new Date().toISOString() }).eq('id', roundId);

  // Update player scores
  const { data: guesses } = await db.from('guesses').select('*').eq('round_id', roundId);
  for (const guess of guesses || []) {
    await db.rpc('increment_score', { p_id: guess.player_id, amount: guess.score });
  }

  return NextResponse.json({
    ok: true,
    target: round.lobby_cards.target_position,
  });
}
