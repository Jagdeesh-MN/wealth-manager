import { useState, type ReactNode } from 'react';
import { TrendingUp, Lock } from 'lucide-react';

const STORED_HASH = import.meta.env.VITE_APP_PASSWORD_HASH as string | undefined;
const SESSION_KEY = 'wt_unlocked';

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

interface Props { children: ReactNode }

export function PasswordGate({ children }: Props) {
  // Skip gate entirely in local dev (no password hash configured)
  if (!STORED_HASH) return <>{children}</>;

  const alreadyUnlocked = sessionStorage.getItem(SESSION_KEY) === '1';
  if (alreadyUnlocked) return <>{children}</>;

  return <PasswordForm />;
}

function PasswordForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  if (unlocked) {
    // Re-render triggers parent to re-evaluate sessionStorage
    window.location.reload();
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(false);
    const hash = await sha256Hex(password);
    if (hash === STORED_HASH) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
    } else {
      setError(true);
      setChecking(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-sm p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-3">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">WealthTracker</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> Private access only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter password"
            className={`w-full px-4 py-3 rounded-xl border text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all ${
              error ? 'border-red-400 dark:border-red-600' : 'border-slate-200 dark:border-slate-700'
            }`}
          />
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 text-center">Incorrect password. Try again.</p>
          )}
          <button
            type="submit"
            disabled={checking || !password}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
          >
            {checking ? 'Checking...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
