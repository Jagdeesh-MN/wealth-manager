import type { Snapshot } from '../lib/types';
import { generateId, formatCurrency } from '../lib/storage';
import { AISummary } from '../components/AISummary';
import { AddFieldModal } from '../components/AddFieldModal';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Home, PiggyBank, Plus, Trash2 } from 'lucide-react';

const inputCls = "w-full bg-transparent text-slate-700 text-sm border-0 border-b border-transparent focus:border-indigo-300 focus:outline-none py-0.5";

function AmountRow({ row, onLabelChange, onAmountChange, onDelete }: {
  row: { id: string; label: string; amount: number };
  onLabelChange: (v: string) => void;
  onAmountChange: (v: number) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="group hover:bg-slate-50 transition-colors">
      <td className="py-2 px-3">
        <input value={row.label} onChange={e => onLabelChange(e.target.value)} className={inputCls} />
      </td>
      <td className="py-2 px-3">
        <div className="flex items-center justify-end gap-1">
          <span className="text-slate-400 text-xs">$</span>
          <input
            type="number"
            value={row.amount}
            onChange={e => onAmountChange(parseFloat(e.target.value) || 0)}
            className={`${inputCls} text-right`}
            min={0}
          />
        </div>
      </td>
      <td className="py-2 px-1">
        <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

interface Props {
  snapshot: Snapshot;
  allSnapshots: Snapshot[];
  onUpdate: (partial: Partial<Snapshot>) => void;
}

export function IncomeExpenses({ snapshot, allSnapshots, onUpdate }: Props) {
  const totalIncome = snapshot.incomes.reduce((s, e) => s + e.amount, 0);
  const totalPersonal = snapshot.personalExpenses.reduce((s, e) => s + e.amount, 0);
  const totalRental = snapshot.rentalExpenses.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = totalPersonal + totalRental;
  const totalSavings = snapshot.savings.reduce((s, e) => s + e.amount, 0);
  const netBalance = totalIncome - totalExpenses;
  const totalOneTimeIncome = snapshot.oneTimeIncome.reduce((s, e) => s + e.amount, 0);
  const totalOneTimeExpenses = snapshot.oneTimeExpenses.reduce((s, e) => s + e.amount, 0);

  const trendData = allSnapshots
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => ({
      date: s.date,
      label: s.label,
      income: s.incomes.reduce((t, e) => t + e.amount, 0),
      expenses: [...s.personalExpenses, ...s.rentalExpenses].reduce((t, e) => t + e.amount, 0),
      savings: s.savings.reduce((t, e) => t + e.amount, 0),
    }));

  const fmt = (v: number) => formatCurrency(v);

  const aiPrompt = `Monthly Income & Expenses:
Total Monthly Income: ${fmt(totalIncome)}
  ${snapshot.incomes.map(e => `  - ${e.label} (${e.type}): ${fmt(e.amount)}`).join('\n')}

Total Monthly Expenses: ${fmt(totalExpenses)}
Personal Expenses (${fmt(totalPersonal)}):
  ${snapshot.personalExpenses.map(e => `  - ${e.label}: ${fmt(e.amount)}`).join('\n')}
Rental Property Expenses (${fmt(totalRental)}):
  ${snapshot.rentalExpenses.map(e => `  - ${e.label}: ${fmt(e.amount)}`).join('\n')}

Monthly Savings: ${fmt(totalSavings)}
  ${snapshot.savings.map(e => `  - ${e.label} (${e.type}): ${fmt(e.amount)}`).join('\n')}

Net Monthly Balance: ${fmt(netBalance)} (Income minus Expenses; savings are pre-salary deductions not counted here)
Savings Rate: ${totalIncome ? ((totalSavings/totalIncome)*100).toFixed(1) : 0}%
Expense Ratio: ${totalIncome ? ((totalExpenses/totalIncome)*100).toFixed(1) : 0}%

One-Time Items:
Large Income (total: ${fmt(totalOneTimeIncome)}): ${snapshot.oneTimeIncome.map(e => `${e.label}: ${fmt(e.amount)}`).join(', ') || 'None'}
Large Expenses (total: ${fmt(totalOneTimeExpenses)}): ${snapshot.oneTimeExpenses.map(e => `${e.label}: ${fmt(e.amount)}`).join(', ') || 'None'}

Analyze the income vs expense balance, savings rate adequacy (25% is ideal), expense categories, rental property profitability, and suggest specific optimizations.`;

  function updateField<T extends { id: string }>(arr: T[], id: string, field: string, value: string | number): T[] {
    return arr.map(e => e.id === id ? { ...e, [field]: value } : e);
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-7 h-7 text-purple-500" /> Income & Expenses
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Monthly cash flow and savings</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <TrendingUp className="w-5 h-5 text-green-500 mb-1" />
          <p className="text-xs text-green-600">Monthly Income</p>
          <p className="text-xl font-bold text-green-700">{fmt(totalIncome)}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <TrendingDown className="w-5 h-5 text-red-500 mb-1" />
          <p className="text-xs text-red-600">Monthly Expenses</p>
          <p className="text-xl font-bold text-red-700">{fmt(totalExpenses)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <PiggyBank className="w-5 h-5 text-blue-500 mb-1" />
          <p className="text-xs text-blue-600">Monthly Savings</p>
          <p className="text-xl font-bold text-blue-700">{fmt(totalSavings)}</p>
          <p className="text-xs text-blue-400">{totalIncome ? ((totalSavings/totalIncome)*100).toFixed(0) : 0}% rate</p>
        </div>
        <div className={`border rounded-xl p-4 ${netBalance >= 0 ? 'bg-purple-50 border-purple-100' : 'bg-orange-50 border-orange-100'}`}>
          <Wallet className={`w-5 h-5 mb-1 ${netBalance >= 0 ? 'text-purple-500' : 'text-orange-500'}`} />
          <p className={`text-xs ${netBalance >= 0 ? 'text-purple-600' : 'text-orange-600'}`}>Net Balance</p>
          <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-purple-700' : 'text-orange-700'}`}>{fmt(netBalance)}</p>
        </div>
      </div>

      {/* Trend Chart */}
      {allSnapshots.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Monthly Cash Flow Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
              <Tooltip
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [fmt(Number(value)), ''] as any}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="savings" name="Savings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Income Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-semibold text-slate-700">Monthly Income</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-green-600">{fmt(totalIncome)}</span>
            <AddFieldModal
              sectionName="income source"
              onAdd={(label) => onUpdate({ incomes: [...snapshot.incomes, { id: generateId(), label, amount: 0, type: 'other' }] })}
            />
          </div>
        </div>
        <div className="px-2 py-2">
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400">Source</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-slate-400">Monthly Amount</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {snapshot.incomes.map(row => (
                <AmountRow
                  key={row.id} row={row}
                  onLabelChange={v => onUpdate({ incomes: updateField(snapshot.incomes, row.id, 'label', v) })}
                  onAmountChange={v => onUpdate({ incomes: updateField(snapshot.incomes, row.id, 'amount', v) })}
                  onDelete={() => onUpdate({ incomes: snapshot.incomes.filter(e => e.id !== row.id) })}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="py-2 px-3 text-xs font-semibold text-slate-600">Total Income</td>
                <td className="py-2 px-3 text-right text-sm font-bold text-green-600">{fmt(totalIncome)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Personal Expenses */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-slate-700">Personal Expenses</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-red-600">{fmt(totalPersonal)}</span>
            <AddFieldModal
              sectionName="expense"
              onAdd={(label) => onUpdate({ personalExpenses: [...snapshot.personalExpenses, { id: generateId(), label, amount: 0, category: 'personal' }] })}
            />
          </div>
        </div>
        <div className="px-2 py-2">
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400">Expense</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-slate-400">Monthly Amount</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {snapshot.personalExpenses.map(row => (
                <AmountRow
                  key={row.id} row={row}
                  onLabelChange={v => onUpdate({ personalExpenses: updateField(snapshot.personalExpenses, row.id, 'label', v) })}
                  onAmountChange={v => onUpdate({ personalExpenses: updateField(snapshot.personalExpenses, row.id, 'amount', v) })}
                  onDelete={() => onUpdate({ personalExpenses: snapshot.personalExpenses.filter(e => e.id !== row.id) })}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="py-2 px-3 text-xs font-semibold text-slate-600">Total Personal</td>
                <td className="py-2 px-3 text-right text-sm font-bold text-red-600">{fmt(totalPersonal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Rental Property Expenses */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-slate-700">Rental Property Expenses</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-orange-600">{fmt(totalRental)}</span>
            <AddFieldModal
              sectionName="rental expense"
              onAdd={(label) => onUpdate({ rentalExpenses: [...snapshot.rentalExpenses, { id: generateId(), label, amount: 0, category: 'rental_property' }] })}
            />
          </div>
        </div>
        <div className="px-2 py-2">
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400">Expense</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-slate-400">Monthly Amount</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {snapshot.rentalExpenses.map(row => (
                <AmountRow
                  key={row.id} row={row}
                  onLabelChange={v => onUpdate({ rentalExpenses: updateField(snapshot.rentalExpenses, row.id, 'label', v) })}
                  onAmountChange={v => onUpdate({ rentalExpenses: updateField(snapshot.rentalExpenses, row.id, 'amount', v) })}
                  onDelete={() => onUpdate({ rentalExpenses: snapshot.rentalExpenses.filter(e => e.id !== row.id) })}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="py-2 px-3 text-xs font-semibold text-slate-600">Total Rental Expenses</td>
                <td className="py-2 px-3 text-right text-sm font-bold text-orange-600">{fmt(totalRental)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Savings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-700">Monthly Savings</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-blue-600">{fmt(totalSavings)}</span>
            <AddFieldModal
              sectionName="savings item"
              onAdd={(label) => onUpdate({ savings: [...snapshot.savings, { id: generateId(), label, amount: 0, type: 'other' }] })}
            />
          </div>
        </div>
        <div className="px-2 py-2">
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400">Savings Vehicle</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-slate-400">Monthly Amount</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {snapshot.savings.map(row => (
                <AmountRow
                  key={row.id} row={row}
                  onLabelChange={v => onUpdate({ savings: updateField(snapshot.savings, row.id, 'label', v) })}
                  onAmountChange={v => onUpdate({ savings: updateField(snapshot.savings, row.id, 'amount', v) })}
                  onDelete={() => onUpdate({ savings: snapshot.savings.filter(e => e.id !== row.id) })}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="py-2 px-3 text-xs font-semibold text-slate-600">Total Savings</td>
                <td className="py-2 px-3 text-right text-sm font-bold text-blue-600">{fmt(totalSavings)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Net Balance Banner */}
      <div className={`rounded-xl p-5 border ${netBalance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-600">Monthly Net Balance</p>
            <p className="text-xs text-slate-400 mt-0.5">Income − Expenses</p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netBalance >= 0 ? '+' : ''}{fmt(netBalance)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {fmt(totalIncome)} - {fmt(totalExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* One-Time Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" /> One-Time Income
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-green-600">{fmt(totalOneTimeIncome)}</span>
              <button
                onClick={() => onUpdate({ oneTimeIncome: [...snapshot.oneTimeIncome, { id: generateId(), label: 'Bonus', amount: 0, date: new Date().toISOString().split('T')[0] }] })}
                className="p-1 text-green-500 hover:bg-green-50 rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400">Description</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-slate-400">Amount</th>
                <th className="py-2 px-1 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {snapshot.oneTimeIncome.length === 0 && (
                <tr><td colSpan={3} className="text-xs text-slate-300 text-center py-4">No one-time income</td></tr>
              )}
              {snapshot.oneTimeIncome.map(row => (
                <AmountRow
                  key={row.id}
                  row={row}
                  onLabelChange={v => onUpdate({ oneTimeIncome: updateField(snapshot.oneTimeIncome, row.id, 'label', v) })}
                  onAmountChange={v => onUpdate({ oneTimeIncome: updateField(snapshot.oneTimeIncome, row.id, 'amount', v) })}
                  onDelete={() => onUpdate({ oneTimeIncome: snapshot.oneTimeIncome.filter(e => e.id !== row.id) })}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" /> One-Time Expenses
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-600">{fmt(totalOneTimeExpenses)}</span>
              <button
                onClick={() => onUpdate({ oneTimeExpenses: [...snapshot.oneTimeExpenses, { id: generateId(), label: 'Large Expense', amount: 0, date: new Date().toISOString().split('T')[0] }] })}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <table className="w-full text-sm min-w-[320px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400">Description</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-slate-400">Amount</th>
                <th className="py-2 px-1 w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {snapshot.oneTimeExpenses.length === 0 && (
                <tr><td colSpan={3} className="text-xs text-slate-300 text-center py-4">No one-time expenses</td></tr>
              )}
              {snapshot.oneTimeExpenses.map(row => (
                <AmountRow
                  key={row.id}
                  row={row}
                  onLabelChange={v => onUpdate({ oneTimeExpenses: updateField(snapshot.oneTimeExpenses, row.id, 'label', v) })}
                  onAmountChange={v => onUpdate({ oneTimeExpenses: updateField(snapshot.oneTimeExpenses, row.id, 'amount', v) })}
                  onDelete={() => onUpdate({ oneTimeExpenses: snapshot.oneTimeExpenses.filter(e => e.id !== row.id) })}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Summary */}
      <AISummary prompt={aiPrompt} pageKey={`income-${snapshot.id}`} />
    </div>
  );
}
