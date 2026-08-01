import { useState, useEffect, useCallback } from 'react';
import type { AppState, Snapshot } from '../lib/types';
import { DEFAULT_SNAPSHOT } from '../lib/types';
import { loadState, saveState, generateId } from '../lib/storage';

function useStore() {
  const [state, setState] = useState<AppState | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  useEffect(() => {
    loadState().then(setState);
  }, []);

  const persist = useCallback((next: AppState) => {
    setState(next);
    setSaveStatus('saving');
    saveState(next)
      .then(() => setSaveStatus('saved'))
      .catch(() => setSaveStatus('error'));
  }, []);

  const activeSnapshot = state
    ? (state.snapshots.find(s => s.id === state.activeSnapshotId) ?? state.snapshots[0])
    : null;

  const updateSnapshot = useCallback((partial: Partial<Snapshot>) => {
    if (!state || !activeSnapshot) return;
    const next: AppState = {
      ...state,
      snapshots: state.snapshots.map(s =>
        s.id === activeSnapshot.id ? { ...s, ...partial } : s
      ),
    };
    persist(next);
  }, [state, activeSnapshot, persist]);

  const createSnapshot = useCallback((label: string, date: string) => {
    if (!state || !activeSnapshot) return;
    const newId = generateId();
    const newSnap: Snapshot = {
      ...activeSnapshot,
      id: newId,
      label,
      date,
    };
    const next: AppState = {
      snapshots: [...state.snapshots, newSnap],
      activeSnapshotId: newId,
    };
    persist(next);
  }, [state, activeSnapshot, persist]);

  const deleteSnapshot = useCallback((id: string) => {
    if (!state || state.snapshots.length <= 1) return;
    const remaining = state.snapshots.filter(s => s.id !== id);
    const next: AppState = {
      snapshots: remaining,
      activeSnapshotId: state.activeSnapshotId === id ? remaining[remaining.length - 1].id : state.activeSnapshotId,
    };
    persist(next);
  }, [state, persist]);

  const setActiveSnapshot = useCallback((id: string) => {
    if (!state) return;
    persist({ ...state, activeSnapshotId: id });
  }, [state, persist]);

  const resetSnapshot = useCallback(() => {
    if (!state) return;
    const fresh: Snapshot = {
      id: generateId(),
      date: new Date().toISOString().split('T')[0],
      label: 'New Snapshot',
      ...DEFAULT_SNAPSHOT,
    };
    const next: AppState = {
      snapshots: [...state.snapshots, fresh],
      activeSnapshotId: fresh.id,
    };
    persist(next);
  }, [state, persist]);

  const saveSnapshot = useCallback(() => {
    if (!state || !activeSnapshot) return;
    const today = new Date().toISOString().split('T')[0];
    const existing = state.snapshots.find(s => s.date === today);
    let next: AppState;
    if (existing) {
      // Overwrite today's snapshot with current data
      next = {
        ...state,
        snapshots: state.snapshots.map(s =>
          s.date === today ? { ...activeSnapshot, id: s.id, date: today, label: s.label } : s
        ),
        activeSnapshotId: existing.id,
      };
    } else {
      // Create a new snapshot for today
      const newId = generateId();
      next = {
        snapshots: [...state.snapshots, { ...activeSnapshot, id: newId, date: today, label: today }],
        activeSnapshotId: newId,
      };
    }
    persist(next);
  }, [state, activeSnapshot, persist]);

  return {
    state,
    activeSnapshot,
    saveStatus,
    saveSnapshot,
    updateSnapshot,
    createSnapshot,
    deleteSnapshot,
    setActiveSnapshot,
    resetSnapshot,
  };
}

export default useStore;
