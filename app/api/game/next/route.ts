import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { code, playerId } = await req.json();
  const db = getServerSupabase();

  const { data: room } = await db.from('rooms').select('*').eq('code', code).single();
  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
  if (room.host_id !== playerId) return NextResponse.json({ error: 'Not host' }, { status: 403 });

  const nextRound = room.current_round + 1;

  if (nextRound > room.total_rounds) {
    // Game over
    await db.from('rooms').update({ phase: 'finished' }).eq('code', code);
    return NextResponse.json({ ok: true, finished: true });
  }

  await db.from('rooms').update({ current_round: nextRound }).eq('code', code);
  return NextResponse.json({ ok: true, finished: false, nextRound });
}
