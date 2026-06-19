'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PROMPTS, PACKS, PackId, ALL_PACK_IDS } from '@/lib/prompts';
import Spectrum from '@/components/Spectrum';

interface Player { id: string; name: string; score: number; lobby_done: boolean; }
interface LobbyCard { id: string; player_id: string; card_order: number; question_index: number; target_position: number; person_name: string | null; }
interface Round { id: string; round_number: number; lobby_card_id: string; owner_id: string; phase: string; lobby_cards: { question_index: number; person_name: string; target_position: number; player_id: string; }; }
interface Guess { id: string; round_id: string; player_id: string; position: number; score: number; }
interface Room { code: string; phase: string; host_id: string; current_round: number; total_rounds: number; packs: string[]; }

const LOBBY_SECONDS = 300;

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myCards, setMyCards] = useState<LobbyCard[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [needlePos, setNeedlePos] = useState(0.5);
  const [personInput, setPersonInput] = useState('');
  const [cardSubmitted, setCardSubmitted] = useState<Record<string, boolean>>({});
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [myGuess, setMyGuess] = useState<number | null>(null);
  const [guessLocked, setGuessLocked] = useState(false);
  const [allGuesses, setAllGuesses] = useState<Guess[]>([]);
  const [timer, setTimer] = useState(LOBBY_SECONDS);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPacks, setSelectedPacks] = useState<PackId[]>(ALL_PACK_IDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pid = playerId;
  const isHost = room?.host_id === pid;

  // Load player id from localStorage
  useEffect(() => {
    const id = localStorage.getItem('playerId');
    if (!id) { router.push('/'); return; }
    setPlayerId(id);
  }, [router]);

  // Fetch full state
  const fetchState = useCallback(async () => {
    if (!code || !pid) return;

    const [roomRes, playersRes, myCardsRes] = await Promise.all([
      supabase.from('rooms').select('*').eq('code', code).single(),
      supabase.from('players').select('*').eq('room_code', code).order('joined_at'),
      supabase.from('lobby_cards').select('*').eq('player_id', pid).eq('room_code', code).order('card_order'),
    ]);

    if (roomRes.data) {
      setRoom(roomRes.data);
      if (roomRes.data.packs?.length) setSelectedPacks(roomRes.data.packs as PackId[]);
    }
    if (playersRes.data) setPlayers(playersRes.data);
    if (myCardsRes.data) {
      setMyCards(myCardsRes.data);
      const submitted: Record<string, boolean> = {};
      myCardsRes.data.forEach((c: LobbyCard) => { submitted[c.id] = !!c.person_name; });
      setCardSubmitted(submitted);
    }

    // Load current round
    if (roomRes.data?.phase === 'playing') {
      const roundNum = roomRes.data.current_round;
      const { data: roundData } = await supabase
        .from('rounds')
        .select('*, lobby_cards(question_index, person_name, target_position, player_id)')
        .eq('room_code', code)
        .eq('round_number', roundNum)
        .single();

      if (roundData) {
        setCurrentRound(roundData);

        const { data: guessData } = await supabase
          .from('guesses')
          .select('*')
          .eq('round_id', roundData.id);

        setAllGuesses(guessData || []);

        const mine = (guessData || []).find((g: Guess) => g.player_id === pid);
        if (mine) {
          setMyGuess(mine.position);
          setGuessLocked(true);
          setNeedlePos(mine.position);
        } else if (roundData.owner_id !== pid) {
          setMyGuess(null);
          setGuessLocked(false);
          setNeedlePos(0.5);
        }
      }
    }
  }, [code, pid]);

  useEffect(() => {
    if (pid) fetchState();
  }, [pid, fetchState]);

  // Realtime subscriptions
  useEffect(() => {
    if (!code || !pid) return;

    const sub = supabase
      .channel(`room:${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${code}` }, () => fetchState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_code=eq.${code}` }, () => fetchState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lobby_cards', filter: `room_code=eq.${code}` }, () => fetchState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds', filter: `room_code=eq.${code}` }, () => fetchState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guesses', filter: `room_code=eq.${code}` }, () => fetchState())
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [code, pid, fetchState]);

  // Lobby timer
  useEffect(() => {
    if (room?.phase !== 'lobby') return;
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Auto-start game if host and all done
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [room?.phase]);

  // --- Actions ---
  async function togglePack(packId: PackId) {
    if (!isHost) return;
    const next = selectedPacks.includes(packId)
      ? selectedPacks.filter(p => p !== packId)
      : [...selectedPacks, packId];
    if (next.length === 0) return; // must keep at least 1
    setSelectedPacks(next);
    await fetch('/api/room/update-packs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, playerId: pid, packs: next }),
    });
  }

  async function startLobby() {
    setActionLoading(true);
    await fetch('/api/room/start-lobby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, playerId: pid }),
    });
    setActionLoading(false);
  }

  async function submitCard() {
    if (!personInput.trim()) return setError('Enter a person name');
    const card = myCards[currentCardIdx];
    if (!card) return;
    setActionLoading(true);
    setError('');
    const res = await fetch('/api/lobby/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardId: card.id, personName: personInput.trim(), playerId: pid }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setActionLoading(false); return; }
    setCardSubmitted(prev => ({ ...prev, [card.id]: true }));
    setPersonInput('');
    setNeedlePos(0.5);
    if (currentCardIdx < myCards.length - 1) setCurrentCardIdx(i => i + 1);
    setActionLoading(false);
  }

  async function startGame() {
    setActionLoading(true);
    const res = await fetch('/api/game/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, playerId: pid }),
    });
    const data = await res.json();
    if (!res.ok) setError(data.error);
    setActionLoading(false);
  }

  async function lockGuess() {
    if (myGuess === null) return;
    if (!currentRound) return;
    setActionLoading(true);
    const res = await fetch('/api/game/guess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId: currentRound.id, playerId: pid, position: myGuess }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); } else { setGuessLocked(true); }
    setActionLoading(false);
  }

  async function revealRound() {
    if (!currentRound) return;
    setActionLoading(true);
    await fetch('/api/game/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roundId: currentRound.id, playerId: pid }),
    });
    setActionLoading(false);
  }

  async function nextRound() {
    setActionLoading(true);
    const res = await fetch('/api/game/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, playerId: pid }),
    });
    const data = await res.json();
    if (res.ok) {
      setMyGuess(null);
      setGuessLocked(false);
      setNeedlePos(0.5);
      setAllGuesses([]);
      setCurrentRound(null);
    }
    if (!res.ok) setError(data.error);
    setActionLoading(false);
  }

  if (!room || !pid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  // ── WAITING ROOM ──────────────────────────────────────────
  if (room.phase === 'waiting') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 py-10">
        <div className="w-full max-w-lg">
          {/* Room code */}
          <div className="card p-6 mb-4 text-center">
            <p className="text-gray-400 text-sm mb-1">Room Code</p>
            <h1 className="text-5xl font-bold tracking-widest" style={{ color: '#c4b5fd' }}>{code}</h1>
            <p className="text-gray-500 text-sm mt-1">Share this code with your friends</p>
          </div>

          {/* Players */}
          <div className="card p-5 mb-4">
            <p className="text-gray-400 text-sm mb-3">Players ({players.length})</p>
            <div className="flex flex-col gap-2">
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="font-medium">{p.name}</span>
                  {p.id === room.host_id && <span className="text-xs text-yellow-400 ml-auto">Host</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Pack selection (host only) */}
          <div className="card p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-300 text-sm font-semibold">Question Packs</p>
              {isHost && (
                <p className="text-xs text-gray-500">{selectedPacks.length} selected</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PACKS.map(pack => {
                const on = selectedPacks.includes(pack.id);
                return (
                  <button
                    key={pack.id}
                    onClick={() => isHost && togglePack(pack.id)}
                    disabled={!isHost}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border ${
                      on
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 opacity-50'
                    } ${isHost ? 'cursor-pointer hover:border-purple-400' : 'cursor-default'}`}
                  >
                    <span className="text-2xl">{pack.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{pack.name}</p>
                      <p className="text-xs text-gray-400 truncate">{pack.description}</p>
                    </div>
                    {isHost && (
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${on ? 'bg-purple-400 border-purple-400' : 'border-gray-600'}`} />
                    )}
                  </button>
                );
              })}
            </div>
            {!isHost && (
              <p className="text-xs text-gray-500 mt-2 text-center">Host is selecting the packs</p>
            )}
          </div>

          {/* Start button */}
          {isHost ? (
            <button
              className="btn-primary w-full"
              onClick={startLobby}
              disabled={actionLoading || players.length < 2 || selectedPacks.length === 0}
            >
              {players.length < 2 ? 'Waiting for players...' : `Start Game →`}
            </button>
          ) : (
            <p className="text-center text-gray-500 text-sm">Waiting for host to start...</p>
          )}
        </div>
      </main>
    );
  }

  // ── LOBBY PHASE ───────────────────────────────────────────
  if (room.phase === 'lobby') {
    const allMyDone = myCards.every(c => cardSubmitted[c.id]);
    const allPlayersDone = players.every(p => p.lobby_done);
    const currentCard = myCards[currentCardIdx];
    const prompt = currentCard ? PROMPTS[currentCard.question_index] : null;
    const mm = Math.floor(timer / 60).toString().padStart(2, '0');
    const ss = (timer % 60).toString().padStart(2, '0');

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-400 text-sm">Lobby Phase</p>
              <p className="text-sm text-gray-500">Answer your 3 prompts with a person's name</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tabular-nums" style={{ color: timer < 60 ? '#f87171' : '#c4b5fd' }}>
                {mm}:{ss}
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2 justify-center mb-6">
            {myCards.map((c, i) => (
              <button
                key={c.id}
                onClick={() => !cardSubmitted[c.id] && setCurrentCardIdx(i)}
                className={`w-3 h-3 rounded-full transition-all ${
                  cardSubmitted[c.id] ? 'bg-green-400' :
                  i === currentCardIdx ? 'bg-purple-400 scale-125' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          {allMyDone ? (
            <div className="card p-8 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold mb-2">All done!</h2>
              <p className="text-gray-400 mb-6">
                {allPlayersDone
                  ? 'Everyone is ready!'
                  : `Waiting for ${players.filter(p => !p.lobby_done).length} more player(s)...`}
              </p>
              {/* Player readiness */}
              <div className="flex flex-col gap-2 mb-6">
                {players.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2">
                    <span className={p.lobby_done ? 'text-green-400' : 'text-gray-500'}>
                      {p.lobby_done ? '✓' : '○'}
                    </span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
              {isHost && allPlayersDone && (
                <button className="btn-primary w-full" onClick={startGame} disabled={actionLoading}>
                  {actionLoading ? 'Starting...' : 'Start Main Game →'}
                </button>
              )}
            </div>
          ) : prompt && currentCard ? (
            <div className="card p-6">
              <p className="text-center text-gray-400 text-sm mb-1">Prompt {currentCardIdx + 1} of 3</p>
              <p className="text-center text-sm text-yellow-300 mb-4 font-medium">
                Only you can see the bullseye — name someone who fits it!
              </p>

              {/* Spectrum */}
              <Spectrum
                leftLabel={prompt.left}
                rightLabel={prompt.right}
                value={needlePos}
                targetPosition={currentCard.target_position}
                showBullseye={true}
              />

              <p className="text-center text-gray-400 text-xs mt-3 mb-5">
                The bullseye is at <strong className="text-yellow-300">
                  {Math.round(currentCard.target_position * 100)}%
                </strong> toward <strong style={{ color: '#f9a8d4' }}>{prompt.right}</strong>
              </p>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Who fits here? (name a person)"
                  value={personInput}
                  onChange={e => setPersonInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submitCard()}
                  maxLength={30}
                  autoFocus
                />
                <button
                  className="btn-primary whitespace-nowrap px-4"
                  onClick={submitCard}
                  disabled={actionLoading || !personInput.trim()}
                >
                  {actionLoading ? '...' : 'Submit'}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
          ) : null}
        </div>
      </main>
    );
  }

  // ── PLAYING PHASE ─────────────────────────────────────────
  if (room.phase === 'playing' && currentRound) {
    const card = currentRound.lobby_cards;
    const prompt = PROMPTS[card.question_index];
    const isOwner = currentRound.owner_id === pid;
    const isRevealed = currentRound.phase === 'revealed';
    const ownerPlayer = players.find(p => p.id === currentRound.owner_id);
    const nonOwners = players.filter(p => p.id !== currentRound.owner_id);
    const allGuessed = nonOwners.every(p => allGuesses.some(g => g.player_id === p.id));

    const guessesForSpectrum = isRevealed
      ? allGuesses.map(g => {
          const gPlayer = players.find(p => p.id === g.player_id);
          return {
            position: g.position,
            name: gPlayer?.name ?? '?',
            score: g.score,
            isMine: g.player_id === pid,
          };
        })
      : [];

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-gray-400 text-sm">Round {room.current_round} of {room.total_rounds}</p>
              {ownerPlayer && (
                <p className="text-sm">
                  <span className="text-yellow-300 font-semibold">{ownerPlayer.name}</span>
                  <span className="text-gray-400">'s card</span>
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {players.sort((a, b) => b.score - a.score).slice(0, 3).map((p, i) => (
                <div key={p.id} className="text-xs text-center">
                  <div className="font-bold" style={{ color: i === 0 ? '#fbbf24' : '#9ca3af' }}>{p.score}pt</div>
                  <div className="text-gray-500 truncate max-w-[50px]">{p.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            {/* Person clue */}
            <div className="text-center mb-6">
              <p className="text-gray-400 text-xs mb-2">The person is</p>
              <div className="text-3xl font-bold" style={{ color: '#f9a8d4' }}>
                {card.person_name}
              </div>
              {ownerPlayer && (
                <p className="text-gray-500 text-xs mt-1">
                  (clue by {ownerPlayer.name} — they stay silent)
                </p>
              )}
            </div>

            {/* Spectrum */}
            <Spectrum
              leftLabel={prompt.left}
              rightLabel={prompt.right}
              value={isOwner ? 0.5 : (myGuess ?? needlePos)}
              onChange={!isOwner && !guessLocked && !isRevealed ? (v) => {
                setNeedlePos(v);
                setMyGuess(v);
              } : undefined}
              targetPosition={isRevealed ? card.target_position : undefined}
              showBullseye={isRevealed}
              guesses={guessesForSpectrum}
              locked={guessLocked}
              isOwner={isOwner}
            />

            {/* State messages */}
            {isOwner && !isRevealed && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-3">
                  <span className="text-yellow-400">🤐</span>
                  <p className="text-yellow-300 text-sm font-medium">This is your card — stay silent!</p>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  {nonOwners.length - allGuesses.length} player(s) still guessing...
                </p>
              </div>
            )}

            {!isOwner && !isRevealed && (
              <div className="mt-4">
                {!guessLocked ? (
                  <>
                    <p className="text-center text-gray-400 text-sm mb-3">
                      Drag the needle to where <strong className="text-pink-300">{card.person_name}</strong> falls on the spectrum
                    </p>
                    <button
                      className="btn-primary w-full"
                      onClick={lockGuess}
                      disabled={actionLoading || myGuess === null}
                    >
                      Lock In Answer
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-purple-400/10 border border-purple-400/30 rounded-xl px-4 py-3">
                      <span className="text-green-400">✓</span>
                      <p className="text-purple-300 text-sm font-medium">Locked in! Waiting for others...</p>
                    </div>
                    <div className="flex gap-2 justify-center mt-3">
                      {nonOwners.map(p => (
                        <div key={p.id} className={`text-xs px-2 py-1 rounded-full ${
                          allGuesses.some(g => g.player_id === p.id) ? 'bg-green-400/20 text-green-400' : 'bg-gray-700 text-gray-500'
                        }`}>
                          {p.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reveal button */}
            {!isRevealed && allGuessed && (isHost || isOwner) && (
              <button
                className="btn-primary w-full mt-4"
                onClick={revealRound}
                disabled={actionLoading}
              >
                Reveal Bullseye! 🎯
              </button>
            )}

            {/* Revealed state */}
            {isRevealed && (
              <div className="mt-4">
                <div className="text-center mb-4">
                  <p className="text-yellow-400 font-bold text-lg">Bullseye was at {Math.round(card.target_position * 100)}%</p>
                  <p className="text-gray-400 text-sm">toward {prompt.right}</p>
                </div>

                {/* Scores */}
                <div className="flex flex-col gap-2 mb-4">
                  {allGuesses.map(g => {
                    const gPlayer = players.find(p => p.id === g.player_id);
                    return (
                      <div key={g.id} className={`flex items-center gap-3 rounded-lg px-4 py-2 ${
                        g.player_id === pid ? 'bg-pink-400/10 border border-pink-400/30' : 'bg-white/5'
                      }`}>
                        <span className="font-medium flex-1">{gPlayer?.name ?? '?'}</span>
                        <span className="text-gray-400 text-sm">{Math.round(g.position * 100)}%</span>
                        <span className={`font-bold text-sm ml-2 ${
                          g.score === 4 ? 'text-yellow-400' :
                          g.score === 3 ? 'text-green-400' :
                          g.score === 2 ? 'text-blue-400' : 'text-gray-500'
                        }`}>
                          {g.score > 0 ? `+${g.score}` : '0'} pts
                          {g.score === 4 ? ' 🎯' : g.score === 3 ? ' ✨' : g.score === 2 ? ' 👍' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {isHost && (
                  <button className="btn-primary w-full" onClick={nextRound} disabled={actionLoading}>
                    {room.current_round >= room.total_rounds ? 'See Final Scores →' : 'Next Round →'}
                  </button>
                )}
                {!isHost && (
                  <p className="text-center text-gray-500 text-sm">Waiting for host to continue...</p>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm text-center mt-3">{error}</p>}
        </div>
      </main>
    );
  }

  // ── FINISHED ──────────────────────────────────────────────
  if (room.phase === 'finished') {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    const medals = ['🥇', '🥈', '🥉'];

    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-3">🌊</div>
              <h1 className="text-2xl font-bold mb-1">Game Over!</h1>
              <p className="text-gray-400">Final Scores</p>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              {sorted.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-4 rounded-xl px-5 py-4 ${
                    p.id === pid ? 'border border-purple-400/50 bg-purple-400/10' : 'bg-white/5'
                  }`}
                >
                  <span className="text-2xl">{medals[i] ?? `${i + 1}.`}</span>
                  <span className="font-bold flex-1">{p.name}</span>
                  <span className="text-xl font-bold" style={{ color: i === 0 ? '#fbbf24' : '#9ca3af' }}>
                    {p.score} pts
                  </span>
                </div>
              ))}
            </div>

            <button
              className="btn-primary w-full"
              onClick={() => router.push('/')}
            >
              Play Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Loading round
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400 animate-pulse">Loading round...</div>
    </div>
  );
}
