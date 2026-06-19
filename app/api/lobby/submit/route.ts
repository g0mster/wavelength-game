import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { cardId, personName, playerId } = await req.json();
  if (!cardId || !personName?.trim() || !playerId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const db = getServerSupabase();

  // Verify the card belongs to this player
  const { data: card, error: cardErr } = await db
    .from('lobby_cards')
    .select('*')
    .eq('id', cardId)
    .eq('player_id', playerId)
    .single();

  if (cardErr || !card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  const { error } = await db
    .from('lobby_cards')
    .update({ person_name: personName.trim(), submitted_at: new Date().toISOString() })
    .eq('id', cardId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check if all cards in room are submitted
  const { data: allCards } = await db
    .from('lobby_cards')
    .select('person_name')
    .eq('room_code', card.room_code);

  const allDone = (allCards || []).every((c: { person_name: string | null }) => c.person_name !== null);

  // Mark player lobby_done if all their 3 cards are submitted
  const { data: myCards } = await db
    .from('lobby_cards')
    .select('person_name')
    .eq('player_id', playerId);

  const myDone = (myCards || []).every((c: { person_name: string | null }) => c.person_name !== null);

  if (myDone) {
    await db.from('players').update({ lobby_done: true }).eq('id', playerId);
  }

  return NextResponse.json({ ok: true, allDone });
}
