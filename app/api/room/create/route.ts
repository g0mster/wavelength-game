import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, nanoid, uuid } from '@/lib/supabase';
import { ALL_PACK_IDS } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  const { name, packs } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const db = getServerSupabase();
  const code = nanoid(4);
  const playerId = uuid();
  const selectedPacks = Array.isArray(packs) && packs.length > 0 ? packs : ALL_PACK_IDS;

  const { error: roomError } = await db.from('rooms').insert({
    code,
    phase: 'waiting',
    host_id: playerId,
    current_round: 0,
    total_rounds: 0,
    packs: selectedPacks,
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

  return NextResponse.json({ code, playerId });
}
