import type { AppState, Snapshot } from './types';
import { DEFAULT_SNAPSHOT } from './types';
import { loadFromGist, saveToGist } from './gist';

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

export async function loadState(): Promise<AppState> {
  // Gist path — used in production when env vars are baked into the build
  if (import.meta.env.VITE_GIST_ID) {
    try {
      const data = await loadFromGist();
      if (data.snapshots.length === 0) {
        const raw = localStorage.getItem('wealth_manager_v1');
        if (raw) {
          const migrated = JSON.parse(raw) as AppState;
          saveToGist(migrated);
          localStorage.removeItem('wealth_manager_v1');
          return migrated;
        }
        const initial = getInitialState();
        saveToGist(initial);
        return initial;
      }
      const raw = localStorage.getItem('wealth_manager_v1');
      if (raw) localStorage.removeItem('wealth_manager_v1');
      return data;
    } catch (err) {
      console.error('Gist load failed, falling back to localStorage:', err);
      const raw = localStorage.getItem('wealth_manager_v1');
      if (raw) return JSON.parse(raw) as AppState;
      return getInitialState();
    }
  }

  // Express path — used during local dev when VITE_GIST_ID is not set
  try {
    const res = await fetch('/api/state');
    if (!res.ok) throw new Error('Server unreachable');
    const data: AppState = await res.json();
    if (data.snapshots.length === 0) {
      const raw = localStorage.getItem('wealth_manager_v1');
      if (raw) {
        const migrated = JSON.parse(raw) as AppState;
        await saveState(migrated);
        localStorage.removeItem('wealth_manager_v1');
        return migrated;
      }
      const initial = getInitialState();
      await saveState(initial);
      return initial;
    }
    const raw = localStorage.getItem('wealth_manager_v1');
    if (raw) localStorage.removeItem('wealth_manager_v1');
    return data;
  } catch {
    const raw = localStorage.getItem('wealth_manager_v1');
    if (raw) return JSON.parse(raw) as AppState;
    return getInitialState();
  }
}

export async function saveState(state: AppState): Promise<void> {
  if (import.meta.env.VITE_GIST_ID) {
    saveToGist(state);
    return;
  }
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch {
    localStorage.setItem('wealth_manager_v1', JSON.stringify(state));
  }
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
