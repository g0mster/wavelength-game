import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase, uuid } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { code, name } = await req.json();
  if (!name?.trim() || !code?.trim()) {
    return NextResponse.json({ error: 'Name and code required' }, { status: 400 });
  }

  const db = getServerSupabase();
  const roomCode = code.trim().toUpperCase();

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

  return NextResponse.json({ playerId, code: roomCode });
}
