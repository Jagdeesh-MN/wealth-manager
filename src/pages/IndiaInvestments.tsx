import type { Snapshot, Entry } from '../lib/types';
import { generateId, formatCurrency } from '../lib/storage';
import { EditableTable } from '../components/EditableTable';
import { AddFieldModal } from '../components/AddFieldModal';
import { AISummary } from '../components/AISummary';
import { TrendChart } from '../components/TrendChart';
import { IndianRupee, Home, Banknote, CircleDot, MoreHorizontal } from 'lucide-react';

interface Props {
  snapshot: Snapshot;
  allSnapshots: Snapshot[];
  onUpdate: (partial: Partial<Snapshot>) => void;
}

export function IndiaInvestments({ snapshot, allSnapshots, onUpdate }: Props) {
  const realEstateTotal = snapshot.indiaRealEstate.reduce((s, e) => s + e.marketValue - e.loanBalance, 0);
  const cashTotal = snapshot.indiaCash.reduce((s, e) => s + e.amount, 0);
  const goldTotal = snapshot.indiaGold.reduce((s, e) => s + e.grams * e.valuePerGram, 0);
  const otherTotal = snapshot.indiaOther.reduce((s, e) => s + e.amount, 0);
  const grandTotal = realEstateTotal + cashTotal + goldTotal + otherTotal;

  const trendData = allSnapshots
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => ({
      date: s.date,
      label: s.label,
      realEstate: s.indiaRealEstate.reduce((t, e) => t + e.marketValue - e.loanBalance, 0),
      cash: s.indiaCash.reduce((t, e) => t + e.amount, 0),
      gold: s.indiaGold.reduce((t, e) => t + e.grams * e.valuePerGram, 0),
      other: s.indiaOther.reduce((t, e) => t + e.amount, 0),
    }));

  const fmtInr = (v: number) => formatCurrency(v, 'INR');

  const aiPrompt = `India Investments Financial Summary (all values in INR):
- Total India Wealth: ${fmtInr(grandTotal)}
- Real Estate Net Equity: ${fmtInr(realEstateTotal)}
  ${snapshot.indiaRealEstate.map(e => `  - ${e.name}: Market ₹${e.marketValue.toLocaleString('en-IN')}, Loan ₹${e.loanBalance.toLocaleString('en-IN')}, Net ₹${(e.marketValue-e.loanBalance).toLocaleString('en-IN')}`).join('\n')}
- Cash & Deposits: ${fmtInr(cashTotal)}
  ${snapshot.indiaCash.map(e => `  - ${e.label}: ${fmtInr(e.amount)}`).join('\n')}
- Gold Holdings: ${fmtInr(goldTotal)}
  ${snapshot.indiaGold.map(e => `  - ${e.label}: ${e.grams}g @ ₹${e.valuePerGram}/g`).join('\n')}
- Other Investments: ${fmtInr(otherTotal)}
  ${snapshot.indiaOther.map(e => `  - ${e.label}: ${fmtInr(e.amount)}`).join('\n')}
Exchange Rate Used: 1 USD = ₹${snapshot.usdToInr}
USD Equivalent: ${formatCurrency(grandTotal / snapshot.usdToInr)}

Analyze the India portfolio: property exposure, gold allocation, liquidity, and tax-efficient instruments.`;

  function updateEntry<T extends { id: string }>(arr: T[], id: string, field: string, value: string | number): T[] {
    return arr.map(e => e.id === id ? { ...e, [field]: value } : e);
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <IndianRupee className="w-7 h-7 text-orange-500" /> India Investments
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">All values in Indian Rupees (INR)</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Total India Wealth</p>
          <p className="text-3xl font-bold text-orange-500">{fmtInr(grandTotal)}</p>
          <p className="text-xs text-slate-400 mt-0.5">≈ {formatCurrency(grandTotal / snapshot.usdToInr)}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Real Estate', value: realEstateTotal, icon: Home, colorBg: 'bg-orange-100', colorIcon: 'text-orange-600' },
          { label: 'Cash & FDs', value: cashTotal, icon: Banknote, colorBg: 'bg-blue-100', colorIcon: 'text-blue-600' },
          { label: 'Gold', value: goldTotal, icon: CircleDot, colorBg: 'bg-yellow-100', colorIcon: 'text-yellow-600' },
          { label: 'Other', value: otherTotal, icon: MoreHorizontal, colorBg: 'bg-green-100', colorIcon: 'text-green-600' },
        ].map(({ label, value, icon: Icon, colorBg, colorIcon }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg ${colorBg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4 h-4 ${colorIcon}`} />
            </div>
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-base font-bold text-slate-800">{fmtInr(value)}</p>
            <p className="text-xs text-slate-300">{grandTotal ? ((value/grandTotal)*100).toFixed(1) : 0}%</p>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      {allSnapshots.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Growth Trend (INR)</h3>
          <TrendChart
            data={trendData}
            series={[
              { key: 'realEstate', label: 'Real Estate', color: '#f97316' },
              { key: 'cash', label: 'Cash', color: '#3b82f6' },
              { key: 'gold', label: 'Gold', color: '#eab308' },
              { key: 'other', label: 'Other', color: '#22c55e' },
            ]}
            currencySymbol="₹"
          />
        </div>
      )}

      {/* Real Estate */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-slate-700">Real Estate</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-orange-500">{fmtInr(realEstateTotal)}</span>
            <AddFieldModal
              sectionName="property"
              onAdd={(label) => onUpdate({
                indiaRealEstate: [...snapshot.indiaRealEstate, { id: generateId(), name: label, marketValue: 0, loanBalance: 0 }]
              })}
            />
          </div>
        </div>
        <div className="px-2 py-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400">Property Name</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-slate-400">Market Value (₹)</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-slate-400">Loan Balance (₹)</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-slate-400">Net Equity (₹)</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {snapshot.indiaRealEstate.map(row => (
                <tr key={row.id} className="group hover:bg-slate-50">
                  <td className="py-2 px-3">
                    <input
                      value={row.name}
                      onChange={e => onUpdate({ indiaRealEstate: updateEntry(snapshot.indiaRealEstate, row.id, 'name', e.target.value) })}
                      className="w-full bg-transparent text-slate-700 text-sm border-0 border-b border-transparent focus:border-indigo-300 focus:outline-none py-0.5"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={row.marketValue}
                      onChange={e => onUpdate({ indiaRealEstate: updateEntry(snapshot.indiaRealEstate, row.id, 'marketValue', parseFloat(e.target.value)||0) })}
                      className="w-full bg-transparent text-slate-700 text-sm border-0 border-b border-transparent focus:border-indigo-300 focus:outline-none py-0.5 text-right"
                      min={0}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={row.loanBalance}
                      onChange={e => onUpdate({ indiaRealEstate: updateEntry(snapshot.indiaRealEstate, row.id, 'loanBalance', parseFloat(e.target.value)||0) })}
                      className="w-full bg-transparent text-red-400 text-sm border-0 border-b border-transparent focus:border-indigo-300 focus:outline-none py-0.5 text-right"
                      min={0}
                    />
                  </td>
                  <td className="py-2 px-3 text-right text-sm font-medium text-green-600">
                    {fmtInr(row.marketValue - row.loanBalance)}
                  </td>
                  <td className="py-2 px-1">
                    <button
                      onClick={() => onUpdate({ indiaRealEstate: snapshot.indiaRealEstate.filter(e => e.id !== row.id) })}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="py-2 px-3 text-xs font-semibold text-slate-600">Total Net Equity</td>
                <td className="py-2 px-3 text-right text-xs text-slate-400">{fmtInr(snapshot.indiaRealEstate.reduce((s,e)=>s+e.marketValue,0))}</td>
                <td className="py-2 px-3 text-right text-xs text-red-400">-{fmtInr(snapshot.indiaRealEstate.reduce((s,e)=>s+e.loanBalance,0))}</td>
                <td className="py-2 px-3 text-right text-sm font-bold text-green-600">{fmtInr(realEstateTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Cash */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-700">Cash & Bank Deposits</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-blue-600">{fmtInr(cashTotal)}</span>
            <AddFieldModal
              sectionName="account"
              onAdd={(label) => onUpdate({ indiaCash: [...snapshot.indiaCash, { id: generateId(), label, amount: 0 }] })}
            />
          </div>
        </div>
        <div className="px-2 py-2">
          <EditableTable<Entry>
            data={snapshot.indiaCash}
            currency="INR"
            columns={[
              { key: 'label', label: 'Account / FD', type: 'text' },
              { key: 'notes', label: 'Notes', type: 'text' },
              { key: 'amount', label: 'Amount (₹)', type: 'currency', prefix: '₹' },
            ]}
            onUpdate={(id, field, value) => onUpdate({ indiaCash: updateEntry(snapshot.indiaCash, id, field, value) })}
            onDelete={(id) => onUpdate({ indiaCash: snapshot.indiaCash.filter(e => e.id !== id) })}
            totalLabel="Total Cash"
            totalValue={cashTotal}
          />
        </div>
      </div>

      {/* Gold */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CircleDot className="w-4 h-4 text-yellow-500" />
            <h3 className="text-sm font-semibold text-slate-700">Gold Holdings</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-yellow-600">{fmtInr(goldTotal)}</span>
            <AddFieldModal
              sectionName="gold item"
              onAdd={(label) => onUpdate({ indiaGold: [...snapshot.indiaGold, { id: generateId(), label, grams: 0, valuePerGram: 6500 }] })}
            />
          </div>
        </div>
        <div className="px-2 py-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 px-3 text-left text-xs font-medium text-slate-400">Description</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-slate-400">Grams</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-slate-400">₹/gram</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-slate-400">Total Value (₹)</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {snapshot.indiaGold.map(row => (
                <tr key={row.id} className="group hover:bg-slate-50">
                  <td className="py-2 px-3">
                    <input value={row.label} onChange={e => onUpdate({ indiaGold: updateEntry(snapshot.indiaGold, row.id, 'label', e.target.value) })}
                      className="w-full bg-transparent text-slate-700 text-sm border-0 border-b border-transparent focus:border-indigo-300 focus:outline-none py-0.5" />
                  </td>
                  <td className="py-2 px-3">
                    <input type="number" value={row.grams} onChange={e => onUpdate({ indiaGold: updateEntry(snapshot.indiaGold, row.id, 'grams', parseFloat(e.target.value)||0) })}
                      className="w-full bg-transparent text-slate-700 text-sm border-0 border-b border-transparent focus:border-indigo-300 focus:outline-none py-0.5 text-right" min={0} />
                  </td>
                  <td className="py-2 px-3">
                    <input type="number" value={row.valuePerGram} onChange={e => onUpdate({ indiaGold: updateEntry(snapshot.indiaGold, row.id, 'valuePerGram', parseFloat(e.target.value)||0) })}
                      className="w-full bg-transparent text-slate-700 text-sm border-0 border-b border-transparent focus:border-indigo-300 focus:outline-none py-0.5 text-right" min={0} />
                  </td>
                  <td className="py-2 px-3 text-right text-sm font-medium text-yellow-600">{fmtInr(row.grams * row.valuePerGram)}</td>
                  <td className="py-2 px-1">
                    <button onClick={() => onUpdate({ indiaGold: snapshot.indiaGold.filter(e => e.id !== row.id) })}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50">
                <td className="py-2 px-3 text-xs font-semibold text-slate-600">Total Gold</td>
                <td className="py-2 px-3 text-right text-xs text-slate-500">{snapshot.indiaGold.reduce((s,e)=>s+e.grams,0).toFixed(1)}g</td>
                <td />
                <td className="py-2 px-3 text-right text-sm font-bold text-yellow-600">{fmtInr(goldTotal)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Other */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MoreHorizontal className="w-4 h-4 text-green-500" />
            <h3 className="text-sm font-semibold text-slate-700">Other Investments</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-green-600">{fmtInr(otherTotal)}</span>
            <AddFieldModal
              sectionName="investment"
              onAdd={(label) => onUpdate({ indiaOther: [...snapshot.indiaOther, { id: generateId(), label, amount: 0 }] })}
            />
          </div>
        </div>
        <div className="px-2 py-2">
          <EditableTable<Entry>
            data={snapshot.indiaOther}
            currency="INR"
            columns={[
              { key: 'label', label: 'Investment', type: 'text' },
              { key: 'notes', label: 'Notes', type: 'text' },
              { key: 'amount', label: 'Value (₹)', type: 'currency', prefix: '₹' },
            ]}
            onUpdate={(id, field, value) => onUpdate({ indiaOther: updateEntry(snapshot.indiaOther, id, field, value) })}
            onDelete={(id) => onUpdate({ indiaOther: snapshot.indiaOther.filter(e => e.id !== id) })}
            totalLabel="Total Other"
            totalValue={otherTotal}
          />
        </div>
      </div>

      {/* AI Summary */}
      <AISummary prompt={aiPrompt} pageKey={`india-${snapshot.id}`} />
    </div>
  );
}
