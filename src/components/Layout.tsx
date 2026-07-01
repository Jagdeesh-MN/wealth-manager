import React, { useState } from 'react';
import type { AppState, Snapshot } from '../lib/types';
import { formatCurrency } from '../lib/storage';
import {
  LayoutDashboard, TrendingUp, Globe, DollarSign,
  PlusCircle, Trash2, ChevronDown, IndianRupee, Wallet,
  Sun, Moon, Download
} from 'lucide-react';

type Page = 'us' | 'india' | 'consolidated' | 'income';

interface Props {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  snapshots: Snapshot[];
  activeSnapshot: Snapshot;
  onCreateSnapshot: (label: string, date: string) => void;
  onDeleteSnapshot: (id: string) => void;
  onSelectSnapshot: (id: string) => void;
  dark: boolean;
  onToggleDark: () => void;
}

const navItems = [
  { id: 'us' as Page, label: 'US Accounts', icon: DollarSign, color: 'text-blue-600' },
  { id: 'india' as Page, label: 'India Investments', icon: IndianRupee, color: 'text-orange-500' },
  { id: 'consolidated' as Page, label: 'Consolidated', icon: Globe, color: 'text-green-600' },
  { id: 'income' as Page, label: 'Income & Expenses', icon: Wallet, color: 'text-purple-600' },
];

export function Layout({
  children, currentPage, onNavigate, snapshots, activeSnapshot,
  onCreateSnapshot, onDeleteSnapshot, onSelectSnapshot, dark, onToggleDark
}: Props) {
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [showNewForm, setShowNewForm] = useState(false);

  const usTotal = (activeSnapshot.usRetirement.reduce((s, e) => s + e.amount, 0)
    + activeSnapshot.usStocks.reduce((s, e) => s + e.amount, 0)
    + activeSnapshot.usCash.reduce((s, e) => s + e.amount, 0)
    + activeSnapshot.usEquity.reduce((s, e) => s + e.amount, 0));

  const indiaTotal = (
    activeSnapshot.indiaRealEstate.reduce((s, e) => s + e.marketValue - e.loanBalance, 0)
    + activeSnapshot.indiaCash.reduce((s, e) => s + e.amount, 0)
    + activeSnapshot.indiaGold.reduce((s, e) => s + e.grams * e.valuePerGram, 0)
    + activeSnapshot.indiaOther.reduce((s, e) => s + e.amount, 0)
  ) / activeSnapshot.usdToInr;

  const netWorth = usTotal + indiaTotal;

  const handleCreate = () => {
    if (!newLabel.trim()) return;
    onCreateSnapshot(newLabel.trim(), newDate);
    setNewLabel('');
    setShowNewForm(false);
    setSnapshotOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100">WealthTracker</h1>
                <p className="text-xs text-slate-400 dark:text-slate-500">Personal Finance</p>
              </div>
            </div>
            <button
              onClick={onToggleDark}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Net Worth Widget */}
        <div className="mx-3 mt-3 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-xl border border-indigo-100 dark:border-indigo-900">
          <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium">Total Net Worth</p>
          <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">{formatCurrency(netWorth)}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{activeSnapshot.label}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-indigo-600 dark:text-indigo-400' : item.color}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Snapshot Selector */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              const date = new Date().toISOString().split('T')[0];
              const exportData: AppState = { snapshots, activeSnapshotId: activeSnapshot.id };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = `wealth-data-${date}.json`; a.click();
              URL.revokeObjectURL(url);
            }}
            title="Export data as JSON"
            className="w-full flex items-center gap-2 px-3 py-2 mb-2 rounded-lg text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Data (JSON)
          </button>
          <button
            onClick={() => setSnapshotOpen(!snapshotOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{activeSnapshot.label}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${snapshotOpen ? 'rotate-180' : ''}`} />
          </button>

          {snapshotOpen && (
            <div className="mt-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                {snapshots.map(s => (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer ${
                      s.id === activeSnapshot.id ? 'bg-indigo-50 dark:bg-indigo-950' : ''
                    }`}
                    onClick={() => { onSelectSnapshot(s.id); setSnapshotOpen(false); }}
                  >
                    <div className="min-w-0">
                      <p className={`text-xs font-medium truncate ${s.id === activeSnapshot.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>{s.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{s.date}</p>
                    </div>
                    {snapshots.length > 1 && (
                      <button
                        onClick={e => { e.stopPropagation(); onDeleteSnapshot(s.id); }}
                        className="p-1 hover:text-red-500 text-slate-300 dark:text-slate-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {showNewForm ? (
                <div className="p-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
                  <input
                    autoFocus
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="Snapshot label..."
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  />
                  <input
                    type="date"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  />
                  <div className="flex gap-1">
                    <button onClick={handleCreate} className="flex-1 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
                    <button onClick={() => setShowNewForm(false)} className="flex-1 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full flex items-center gap-1.5 px-3 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 border-t border-slate-100 dark:border-slate-700 transition-colors"
                >
                  <PlusCircle className="w-3 h-3" />
                  New Snapshot
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}
