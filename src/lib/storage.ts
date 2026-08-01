import type { AppState, Snapshot } from './types';
import { DEFAULT_SNAPSHOT } from './types';
import { loadFromGist, saveToGist } from './gist';

const LS_KEY = 'wt_data_v2';

function getInitialState(): AppState {
  const id = generateId();
  const snapshot: Snapshot = {
    id,
    date: new Date().toISOString().split('T')[0],
    label: 'Initial Snapshot',
    ...DEFAULT_SNAPSHOT,
  };
  return { snapshots: [snapshot], activeSnapshotId: id };
}

function lsRead(): AppState | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
      || localStorage.getItem('wealth_manager_v1'); // legacy key
    return raw ? JSON.parse(raw) as AppState : null;
  } catch { return null; }
}

function lsWrite(state: AppState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* storage full — ignore */ }
}

export async function loadState(): Promise<AppState> {
  if (import.meta.env.VITE_GIST_ID) {
    // Always read localStorage first — it's the fastest and most reliable
    const local = lsRead();

    try {
      const remote = await loadFromGist();
      // Prefer whichever has more snapshots or more recent data
      const useRemote = !local
        || remote.snapshots.length > local.snapshots.length
        || (remote.snapshots.length === local.snapshots.length
            && remote.snapshots.some((rs, i) => {
              const ls = local.snapshots[i];
              // Compare total amounts to detect which is newer
              const remoteSum = Object.values(rs).flat().reduce((s: number, e: unknown) =>
                s + (typeof e === 'object' && e !== null ? (e as Record<string, number>).amount ?? 0 : 0), 0);
              const localSum = Object.values(ls).flat().reduce((s: number, e: unknown) =>
                s + (typeof e === 'object' && e !== null ? (e as Record<string, number>).amount ?? 0 : 0), 0);
              return remoteSum > localSum;
            }));

      const best = useRemote ? remote : (local ?? remote);

      if (best.snapshots.length === 0) {
        const initial = getInitialState();
        lsWrite(initial);
        saveToGist(initial);
        return initial;
      }

      // Keep localStorage in sync with whatever we loaded
      lsWrite(best);
      // Clean up legacy key
      localStorage.removeItem('wealth_manager_v1');
      return best;
    } catch (err) {
      console.error('Gist load failed, using localStorage:', err);
      if (local && local.snapshots.length > 0) return local;
      const initial = getInitialState();
      lsWrite(initial);
      return initial;
    }
  }

  // Local Express dev path
  try {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('Server unreachable');
    const data: AppState = await res.json();
    if (data.snapshots.length === 0) {
      const local = lsRead();
      if (local) {
        await saveState(local);
        localStorage.removeItem('wealth_manager_v1');
        return local;
      }
      const initial = getInitialState();
      await saveState(initial);
      return initial;
    }
    return data;
  } catch {
    const local = lsRead();
    return local ?? getInitialState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  // Always write to localStorage immediately — never loses data
  lsWrite(state);

  if (import.meta.env.VITE_GIST_ID) {
    saveToGist(state); // debounced background sync to Gist
    return;
  }

  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch { /* already written to localStorage above */ }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatCurrency(amount: number, currency: 'USD' | 'INR' = 'USD'): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toFixed(0);
}

// 401k early withdrawal: 10% penalty + 22% assumed income tax = 32% effective hit
export const RETIREMENT_WITHDRAWAL_RATE = 0.32;
// Long-term capital gains tax rate (assumed 15% federal)
export const CAPITAL_GAINS_RATE = 0.15;

export interface LiquidityBreakdown {
  retirementAfterTax: number;   // 401k gross minus penalty+tax
  cashLiquid: number;            // cash is fully liquid
  stocksAfterTax: number;        // stocks minus long-term cap gains
  equityIlliquid: number;        // real estate equity — not liquid
  total: number;
}

export function calcUSLiquidity(
  retirementTotal: number,
  cashTotal: number,
  stocksTotal: number,
  equityTotal: number,
): LiquidityBreakdown {
  const retirementAfterTax = retirementTotal * (1 - RETIREMENT_WITHDRAWAL_RATE);
  const cashLiquid = cashTotal;
  const stocksAfterTax = stocksTotal * (1 - CAPITAL_GAINS_RATE);
  const equityIlliquid = equityTotal;
  return {
    retirementAfterTax,
    cashLiquid,
    stocksAfterTax,
    equityIlliquid,
    total: retirementAfterTax + cashLiquid + stocksAfterTax,
  };
}
