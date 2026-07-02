import type { Snapshot, Entry, StockEntry, EquityEntry } from '../lib/types';
import { generateId, formatCurrency, calcUSLiquidity, RETIREMENT_WITHDRAWAL_RATE, CAPITAL_GAINS_RATE } from '../lib/storage';
import { EditableTable } from '../components/EditableTable';
import { AddFieldModal } from '../components/AddFieldModal';
import { AISummary } from '../components/AISummary';
import { TrendChart } from '../components/TrendChart';
import { DollarSign, TrendingUp, PiggyBank, Building2, Zap, Info } from 'lucide-react';

interface Props {
  snapshot: Snapshot;
  allSnapshots: Snapshot[];
  onUpdate: (partial: Partial<Snapshot>) => void;
}

const sectionCardClass = "bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden";
const sectionHeaderClass = "flex items-center justify-between px-5 py-4 border-b border-slate-100";

export function USAccounts({ snapshot, allSnapshots, onUpdate }: Props) {
  const retirementTotal = snapshot.usRetirement.reduce((s, e) => s + e.amount, 0);
  const stocksTotal = snapshot.usStocks.reduce((s, e) => s + e.amount, 0);
  const cashTotal = snapshot.usCash.reduce((s, e) => s + e.amount, 0);
  const equityTotal = snapshot.usEquity.reduce((s, e) => s + e.amount, 0);
  const grandTotal = retirementTotal + stocksTotal + cashTotal + equityTotal;

  const liquidity = calcUSLiquidity(retirementTotal, cashTotal, stocksTotal, equityTotal);

  const trendData = allSnapshots
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => ({
      date: s.date,
      label: s.label,
      retirement: s.usRetirement.reduce((t, e) => t + e.amount, 0),
      stocks: s.usStocks.reduce((t, e) => t + e.amount, 0),
      cash: s.usCash.reduce((t, e) => t + e.amount, 0),
      equity: s.usEquity.reduce((t, e) => t + e.amount, 0),
    }));

  const aiPrompt = `US Accounts Financial Summary:
- Total US Wealth: ${formatCurrency(grandTotal)}
- Retirement Funds (401k/IRA): ${formatCurrency(retirementTotal)} (${((retirementTotal/grandTotal)*100||0).toFixed(1)}% of total)
  ${snapshot.usRetirement.map(e => `  - ${e.label}: ${formatCurrency(e.amount)}`).join('\n')}
- Stock Investments: ${formatCurrency(stocksTotal)}
  ${snapshot.usStocks.map(e => `  - ${e.firm} (${e.label}): ${formatCurrency(e.amount)}`).join('\n')}
- Cash & Savings: ${formatCurrency(cashTotal)}
  ${snapshot.usCash.map(e => `  - ${e.label}: ${formatCurrency(e.amount)}`).join('\n')}
- Real Estate & Equity: ${formatCurrency(equityTotal)}
  ${snapshot.usEquity.map(e => `  - ${e.label} (${e.source}): ${formatCurrency(e.amount)}`).join('\n')}
Date: ${snapshot.date}

Please analyze this US investment portfolio. Comment on diversification, retirement readiness, and allocation balance.`;

  function updateEntry<T extends Entry>(arr: T[], id: string, field: string, value: string | number): T[] {
    return arr.map(e => e.id === id ? { ...e, [field]: value } : e);
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-blue-500" /> US Accounts
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">Track your US-based retirement, stocks, cash and equity</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Total US Wealth</p>
          <p className="text-3xl font-bold text-blue-600">{formatCurrency(grandTotal)}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Retirement', value: retirementTotal, icon: PiggyBank, colorBg: 'bg-blue-100', colorIcon: 'text-blue-600' },
          { label: 'Stocks', value: stocksTotal, icon: TrendingUp, colorBg: 'bg-green-100', colorIcon: 'text-green-600' },
          { label: 'Cash', value: cashTotal, icon: DollarSign, colorBg: 'bg-yellow-100', colorIcon: 'text-yellow-600' },
          { label: 'Equity', value: equityTotal, icon: Building2, colorBg: 'bg-purple-100', colorIcon: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, colorBg, colorIcon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg ${colorBg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${colorIcon}`} />
            </div>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(value)}</p>
            <p className="text-xs text-slate-300">{grandTotal ? ((value/grandTotal)*100).toFixed(1) : 0}%</p>
          </div>
        ))}
      </div>

      {/* Immediate Liquidity KPI */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-emerald-800">Immediate Liquidity</h3>
          <span className="text-xs text-emerald-500 font-medium">What you can actually access today</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 border border-emerald-100">
            <p className="text-xs text-slate-400 mb-0.5">Cash</p>
            <p className="text-base font-bold text-emerald-700">{formatCurrency(liquidity.cashLiquid)}</p>
            <p className="text-xs text-slate-400 mt-0.5">100% liquid</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-emerald-100">
            <p className="text-xs text-slate-400 mb-0.5">Stocks (after tax)</p>
            <p className="text-base font-bold text-emerald-700">{formatCurrency(liquidity.stocksAfterTax)}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatCurrency(stocksTotal - liquidity.stocksAfterTax)} cap gains ({(CAPITAL_GAINS_RATE * 100).toFixed(0)}%)
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-emerald-100">
            <p className="text-xs text-slate-400 mb-0.5">401k (after tax)</p>
            <p className="text-base font-bold text-emerald-700">{formatCurrency(liquidity.retirementAfterTax)}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatCurrency(retirementTotal - liquidity.retirementAfterTax)} penalty+tax ({(RETIREMENT_WITHDRAWAL_RATE * 100).toFixed(0)}%)
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200 opacity-60">
            <p className="text-xs text-slate-400 mb-0.5">Equity</p>
            <p className="text-base font-bold text-slate-400">{formatCurrency(equityTotal)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Illiquid</p>
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-600">
              401k assumes 10% early withdrawal penalty + 22% income tax. Stocks assume 15% long-term capital gains. Equity excluded as illiquid.
            </p>
          </div>
          <div className="text-right ml-4 flex-shrink-0">
            <p className="text-xs text-emerald-600 font-medium">Total Liquid</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(liquidity.total)}</p>
            <p className="text-xs text-emerald-500">{grandTotal ? ((liquidity.total / grandTotal) * 100).toFixed(0) : 0}% of gross wealth</p>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      {allSnapshots.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Growth Trend</h3>
          <TrendChart
            data={trendData}
            series={[
              { key: 'retirement', label: 'Retirement', color: '#3b82f6' },
              { key: 'stocks', label: 'Stocks', color: '#22c55e' },
              { key: 'cash', label: 'Cash', color: '#eab308' },
              { key: 'equity', label: 'Equity', color: '#a855f7' },
            ]}
          />
        </div>
      )}

      {/* Retirement Section */}
      <div className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-700">Retirement Funds</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-blue-600">{formatCurrency(retirementTotal)}</span>
            <AddFieldModal
              sectionName="account"
              onAdd={(label) => onUpdate({
                usRetirement: [...snapshot.usRetirement, { id: generateId(), label, amount: 0 }]
              })}
            />
          </div>
        </div>
        <div className="px-2 py-2">
          <EditableTable<Entry>
            data={snapshot.usRetirement}
            currency="USD"
            columns={[
              { key: 'label', label: 'Account Name', type: 'text' },
              { key: 'notes', label: 'Notes', type: 'text' },
              { key: 'amount', label: 'Balance (USD)', type: 'currency', prefix: '$' },
            ]}
            onUpdate={(id, field, value) => onUpdate({ usRetirement: updateEntry(snapshot.usRetirement, id, field, value) })}
            onDelete={(id) => onUpdate({ usRetirement: snapshot.usRetirement.filter(e => e.id !== id) })}
            totalLabel="Total Retirement"
            totalValue={retirementTotal}
          />
        </div>
      </div>

      {/* Stocks Section */}
      <div className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-semibold text-slate-700">Stock Investments</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-green-600">{formatCurrency(stocksTotal)}</span>
            <AddFieldModal
              sectionName="stock account"
              extraFieldLabel="Firm"
              extraFieldPlaceholder="e.g. Fidelity"
              onAdd={(label, firm) => onUpdate({
                usStocks: [...snapshot.usStocks, { id: generateId(), label, firm: firm || 'Other', amount: 0 }]
              })}
            />
          </div>
        </div>
        <div className="px-2 py-2">
          <EditableTable<StockEntry>
            data={snapshot.usStocks}
            currency="USD"
            columns={[
              { key: 'firm', label: 'Brokerage/Firm', type: 'text' },
              { key: 'label', label: 'Account', type: 'text' },
              { key: 'amount', label: 'Value (USD)', type: 'currency', prefix: '$' },
            ]}
            onUpdate={(id, field, value) => onUpdate({ usStocks: updateEntry(snapshot.usStocks, id, field, value) })}
            onDelete={(id) => onUpdate({ usStocks: snapshot.usStocks.filter(e => e.id !== id) })}
            totalLabel="Total Stocks"
            totalValue={stocksTotal}
          />
        </div>
      </div>

      {/* Cash Section */}
      <div className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-semibold text-slate-700">Cash & Savings</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-yellow-600">{formatCurrency(cashTotal)}</span>
            <AddFieldModal
              sectionName="cash account"
              onAdd={(label) => onUpdate({
                usCash: [...snapshot.usCash, { id: generateId(), label, amount: 0 }]
              })}
            />
          </div>
        </div>
        <div className="px-2 py-2">
          <EditableTable<Entry>
            data={snapshot.usCash}
            currency="USD"
            columns={[
              { key: 'label', label: 'Account', type: 'text' },
              { key: 'notes', label: 'Notes', type: 'text' },
              { key: 'amount', label: 'Balance (USD)', type: 'currency', prefix: '$' },
            ]}
            onUpdate={(id, field, value) => onUpdate({ usCash: updateEntry(snapshot.usCash, id, field, value) })}
            onDelete={(id) => onUpdate({ usCash: snapshot.usCash.filter(e => e.id !== id) })}
            totalLabel="Total Cash"
            totalValue={cashTotal}
          />
        </div>
      </div>

      {/* Equity Section */}
      <div className={sectionCardClass}>
        <div className={sectionHeaderClass}>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-slate-700">Equity Investments</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-purple-600">{formatCurrency(equityTotal)}</span>
            <AddFieldModal
              sectionName="equity"
              extraFieldLabel="Source"
              extraFieldPlaceholder="e.g. Real Estate"
              onAdd={(label, source) => onUpdate({
                usEquity: [...snapshot.usEquity, { id: generateId(), label, source: source || 'Other', amount: 0 }]
              })}
            />
          </div>
        </div>
        <div className="px-2 py-2">
          <EditableTable<EquityEntry>
            data={snapshot.usEquity}
            currency="USD"
            columns={[
              { key: 'source', label: 'Source', type: 'text' },
              { key: 'label', label: 'Description', type: 'text' },
              { key: 'amount', label: 'Equity (USD)', type: 'currency', prefix: '$' },
            ]}
            onUpdate={(id, field, value) => onUpdate({ usEquity: updateEntry(snapshot.usEquity, id, field, value) })}
            onDelete={(id) => onUpdate({ usEquity: snapshot.usEquity.filter(e => e.id !== id) })}
            totalLabel="Total Equity"
            totalValue={equityTotal}
          />
        </div>
      </div>

      {/* AI Summary */}
      <AISummary prompt={aiPrompt} pageKey={`us-${snapshot.id}`} />
    </div>
  );
}
