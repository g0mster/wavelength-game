'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) return setError('Enter your name');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('playerId', data.playerId);
      localStorage.setItem('playerName', name.trim());
      router.push(`/room/${data.code}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!name.trim()) return setError('Enter your name');
    if (!code.trim()) return setError('Enter room code');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/room/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code: code.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('playerId', data.playerId);
      localStorage.setItem('playerName', name.trim());
      router.push(`/room/${data.code}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🌊</div>
          <h1 className="text-4xl font-bold mb-2" style={{
            background: 'linear-gradient(135deg, #c4b5fd, #f9a8d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Wavelength
          </h1>
          <p className="text-gray-400 text-lg">Person Edition</p>
        </div>

        {mode === 'menu' && (
          <div className="card p-8 flex flex-col gap-4">
            <button className="btn-primary text-lg py-4" onClick={() => setMode('create')}>
              ✨ Create Room
            </button>
            <button className="btn-secondary text-lg py-4" onClick={() => setMode('join')}>
              🚀 Join Room
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="card p-8 flex flex-col gap-5">
            <button onClick={() => { setMode('menu'); setError(''); }} className="text-gray-400 hover:text-white text-sm self-start">
              ← Back
            </button>
            <h2 className="text-xl font-bold">Create a Room</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Your name</label>
              <input
                type="text"
                placeholder="e.g. Aaditya"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                maxLength={20}
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button className="btn-primary" onClick={handleCreate} disabled={loading}>
              {loading ? 'Creating...' : 'Create Room →'}
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="card p-8 flex flex-col gap-5">
            <button onClick={() => { setMode('menu'); setError(''); }} className="text-gray-400 hover:text-white text-sm self-start">
              ← Back
            </button>
            <h2 className="text-xl font-bold">Join a Room</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Your name</label>
              <input
                type="text"
                placeholder="e.g. Aaditya"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Room code</label>
              <input
                type="text"
                placeholder="e.g. AB3X"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                maxLength={6}
                className="uppercase tracking-widest text-center text-2xl font-bold"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button className="btn-primary" onClick={handleJoin} disabled={loading}>
              {loading ? 'Joining...' : 'Join Room →'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
