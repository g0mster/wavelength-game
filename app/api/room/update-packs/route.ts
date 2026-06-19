import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { code, playerId, packs } = await req.json();
  if (!Array.isArray(packs) || packs.length === 0) {
    return NextResponse.json({ error: 'Select at least one pack' }, { status: 400 });
  }

  const db = getServerSupabase();
  const { data: room } = await db.from('rooms').select('host_id, phase').eq('code', code).single();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.host_id !== playerId) return NextResponse.json({ error: 'Not host' }, { status: 403 });
  if (room.phase !== 'waiting') return NextResponse.json({ error: 'Game already started' }, { status: 400 });

  await db.from('rooms').update({ packs }).eq('code', code);
  return NextResponse.json({ ok: true });
}
