import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, uuid } from '@/lib/supabase';
import { pickRandomIndicesFromPacks, ALL_PACK_IDS, PackId } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  const { code, playerId } = await req.json();
  const db = getServerSupabase();

  const { data: room } = await db.from('rooms').select('*').eq('code', code).single();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.host_id !== playerId) return NextResponse.json({ error: 'Not host' }, { status: 403 });
  if (room.phase !== 'waiting') return NextResponse.json({ error: 'Already started' }, { status: 400 });

  const packs: PackId[] = (room.packs?.length ? room.packs : ALL_PACK_IDS) as PackId[];

  // Get all players in the room
  const { data: players } = await db.from('players').select('id').eq('room_code', code);
  if (!players?.length) return NextResponse.json({ error: 'No players' }, { status: 400 });

  // Assign 3 unique question indices per player (no duplicates across the room)
  const usedIndices: number[] = [];
  const allCards: object[] = [];

  for (const player of players) {
    const indices = pickRandomIndicesFromPacks(3, packs, usedIndices);
    usedIndices.push(...indices);
    indices.forEach((qi, i) => {
      allCards.push({
        id: uuid(),
        player_id: player.id,
        room_code: code,
        card_order: i + 1,
        question_index: qi,
        target_position: Math.random() * 0.8 + 0.1,
        person_name: null,
        submitted_at: null,
      });
    });
  }

  const { error: cardError } = await db.from('lobby_cards').insert(allCards);
  if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 });

  await db.from('rooms').update({ phase: 'lobby' }).eq('code', code);
  return NextResponse.json({ ok: true });
}
