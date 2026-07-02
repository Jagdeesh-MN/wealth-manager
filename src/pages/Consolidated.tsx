import { useState } from 'react';
import type { Snapshot } from '../lib/types';
import { formatCurrency, calcUSLiquidity } from '../lib/storage';
import { fetchExchangeRate } from '../lib/exchange';
import { AISummary } from '../components/AISummary';
import { TrendChart } from '../components/TrendChart';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Globe, RefreshCw, TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface Props {
  snapshot: Snapshot;
  allSnapshots: Snapshot[];
  onUpdate: (partial: Partial<Snapshot>) => void;
}

type Currency = 'USD' | 'INR';

const PIE_COLORS = ['#6366f1', '#f97316', '#22c55e', '#eab308', '#ec4899', '#06b6d4', '#a855f7'];

export function Consolidated({ snapshot, allSnapshots, onUpdate }: Props) {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [fetchingRate, setFetchingRate] = useState(false);

  const rate = snapshot.usdToInr;

  const convert = (usd: number) => currency === 'INR' ? usd * rate : usd;
  const convertInr = (inr: number) => currency === 'USD' ? inr / rate : inr;
  const sym = currency === 'USD' ? '$' : '₹';
  const fmt = (v: number) => formatCurrency(v, currency);

  const retirementUSD = snapshot.usRetirement.reduce((s, e) => s + e.amount, 0);
  const stocksUSD = snapshot.usStocks.reduce((s, e) => s + e.amount, 0);
  const cashUSD = snapshot.usCash.reduce((s, e) => s + e.amount, 0);
  const equityUSD = snapshot.usEquity.reduce((s, e) => s + e.amount, 0);
  const totalUSUSD = retirementUSD + stocksUSD + cashUSD + equityUSD;

  const usLiquidity = calcUSLiquidity(retirementUSD, cashUSD, stocksUSD, equityUSD);

  const reINR = snapshot.indiaRealEstate.reduce((s, e) => s + e.marketValue - e.loanBalance, 0);
  const cashINR = snapshot.indiaCash.reduce((s, e) => s + e.amount, 0);
  const goldINR = snapshot.indiaGold.reduce((s, e) => s + e.grams * e.valuePerGram, 0);
  const otherINR = snapshot.indiaOther.reduce((s, e) => s + e.amount, 0);
  const totalINRinINR = reINR + cashINR + goldINR + otherINR;
  const totalIndiaUSD = totalINRinINR / rate;

  const totalNetWorthUSD = totalUSUSD + totalIndiaUSD;

  const monthlyIncome = snapshot.incomes.reduce((s, e) => s + e.amount, 0);
  const monthlyExpenses = [...snapshot.personalExpenses, ...snapshot.rentalExpenses].reduce((s, e) => s + e.amount, 0);
  const monthlySavings = snapshot.savings.reduce((s, e) => s + e.amount, 0);
  const monthlyNet = monthlyIncome - monthlyExpenses - monthlySavings;

  const pieData = [
    { name: 'US Retirement', value: convert(retirementUSD) },
    { name: 'US Stocks', value: convert(stocksUSD) },
    { name: 'US Cash', value: convert(cashUSD) },
    { name: 'US Equity', value: convert(equityUSD) },
    { name: 'India Real Estate', value: convertInr(reINR) },
    { name: 'India Cash', value: convertInr(cashINR) },
    { name: 'India Gold', value: convertInr(goldINR) },
    { name: 'India Other', value: convertInr(otherINR) },
  ].filter(d => d.value > 0);

  const trendData = allSnapshots
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(s => {
      const r = s.usdToInr;
      const usTotal = s.usRetirement.reduce((t, e) => t + e.amount, 0)
        + s.usStocks.reduce((t, e) => t + e.amount, 0)
        + s.usCash.reduce((t, e) => t + e.amount, 0)
        + s.usEquity.reduce((t, e) => t + e.amount, 0);
      const indiaUSD = (
        s.indiaRealEstate.reduce((t, e) => t + e.marketValue - e.loanBalance, 0)
        + s.indiaCash.reduce((t, e) => t + e.amount, 0)
        + s.indiaGold.reduce((t, e) => t + e.grams * e.valuePerGram, 0)
        + s.indiaOther.reduce((t, e) => t + e.amount, 0)
      ) / r;
      const totalUSD = usTotal + indiaUSD;
      return {
        date: s.date,
        label: s.label,
        us: currency === 'INR' ? usTotal * r : usTotal,
        india: currency === 'INR' ? indiaUSD * r : indiaUSD,
        total: currency === 'INR' ? totalUSD * r : totalUSD,
      };
    });

  const handleRefreshRate = async () => {
    setFetchingRate(true);
    const r = await fetchExchangeRate();
    onUpdate({ usdToInr: r });
    setFetchingRate(false);
  };

  const sortedSnapshots = [...allSnapshots].sort((a, b) => a.date.localeCompare(b.date));
  const prevSnapshot = sortedSnapshots.length > 1 ? sortedSnapshots[sortedSnapshots.length - 2] : null;
  const prevNetWorth = prevSnapshot
    ? (prevSnapshot.usRetirement.reduce((s, e) => s + e.amount, 0)
      + prevSnapshot.usStocks.reduce((s, e) => s + e.amount, 0)
      + prevSnapshot.usCash.reduce((s, e) => s + e.amount, 0)
      + prevSnapshot.usEquity.reduce((s, e) => s + e.amount, 0)
      + (prevSnapshot.indiaRealEstate.reduce((s, e) => s + e.marketValue - e.loanBalance, 0)
        + prevSnapshot.indiaCash.reduce((s, e) => s + e.amount, 0)
        + prevSnapshot.indiaGold.reduce((s, e) => s + e.grams * e.valuePerGram, 0)
        + prevSnapshot.indiaOther.reduce((s, e) => s + e.amount, 0)) / prevSnapshot.usdToInr)
    : null;

  const growth = prevNetWorth !== null ? totalNetWorthUSD - prevNetWorth : null;
  const growthPct = prevNetWorth ? ((totalNetWorthUSD - prevNetWorth) / prevNetWorth) * 100 : null;

  const aiPrompt = `Consolidated Portfolio Summary:
Total Net Worth: ${formatCurrency(totalNetWorthUSD)} (${formatCurrency(totalNetWorthUSD * rate, 'INR')})
Exchange Rate: 1 USD = ₹${rate}

US Portfolio: ${formatCurrency(totalUSUSD)} (${((totalUSUSD/totalNetWorthUSD)*100||0).toFixed(1)}%)
  - Retirement: ${formatCurrency(retirementUSD)}
  - Stocks: ${formatCurrency(stocksUSD)}
  - Cash: ${formatCurrency(cashUSD)}
  - Equity: ${formatCurrency(equityUSD)}
  - Immediate Liquidity (after tax/penalty): ${formatCurrency(usLiquidity.total)} (${totalUSUSD ? ((usLiquidity.total/totalUSUSD)*100).toFixed(0) : 0}% of US gross)

India Portfolio: ${formatCurrency(totalIndiaUSD)} (${((totalIndiaUSD/totalNetWorthUSD)*100||0).toFixed(1)}%)
  - Real Estate Equity: ${formatCurrency(reINR/rate)}
  - Cash & FDs: ${formatCurrency(cashINR/rate)}
  - Gold: ${formatCurrency(goldINR/rate)}
  - Other: ${formatCurrency(otherINR/rate)}

Monthly Cash Flow: Income ${formatCurrency(monthlyIncome)} | Expenses ${formatCurrency(monthlyExpenses)} | Savings ${formatCurrency(monthlySavings)} | Net ${formatCurrency(monthlyNet)}
${growth !== null ? `Growth since last snapshot: ${growth >= 0 ? '+' : ''}${formatCurrency(growth)} (${growthPct?.toFixed(1)}%)` : ''}

Provide a comprehensive analysis: geographic diversification, asset allocation vs best practices, currency risk, net worth trajectory, and top 3 actionable recommendations.`;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Globe className="w-7 h-7 text-green-500" /> Consolidated Portfolio
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">All assets across all countries</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Exchange Rate */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2 shadow-sm">
            <span className="text-xs text-slate-400">1 USD =</span>
            <input
              type="number"
              value={rate}
              onChange={e => onUpdate({ usdToInr: parseFloat(e.target.value) || 84 })}
              className="w-16 text-sm font-medium text-slate-700 bg-transparent border-0 focus:outline-none text-center"
              min={1}
            />
            <span className="text-xs text-slate-400">₹</span>
            <button
              onClick={handleRefreshRate}
              disabled={fetchingRate}
              className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
              title="Fetch live rate"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingRate ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {/* Currency Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${currency === 'USD' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >$ USD</button>
            <button
              onClick={() => setCurrency('INR')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${currency === 'INR' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >₹ INR</button>
          </div>
        </div>
      </div>

      {/* Net Worth Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-indigo-200 text-sm">Total Net Worth</p>
        <p className="text-5xl font-bold mt-1">
          {currency === 'USD' ? formatCurrency(totalNetWorthUSD) : formatCurrency(totalNetWorthUSD * rate, 'INR')}
        </p>
        {currency === 'USD' && (
          <p className="text-indigo-200 text-sm mt-1">≈ {formatCurrency(totalNetWorthUSD * rate, 'INR')}</p>
        )}
        {growth !== null && (
          <div className={`flex items-center gap-1.5 mt-3 text-sm ${growth >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            {growth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{growth >= 0 ? '+' : ''}{formatCurrency(Math.abs(growth))} ({growthPct?.toFixed(1)}%) since last snapshot</span>
          </div>
        )}
      </div>

      {/* US vs India Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">🇺🇸 US Portfolio</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{fmt(convert(totalUSUSD))}</p>
          <div className="mt-2 space-y-1">
            {[
              { label: 'Retirement', v: retirementUSD },
              { label: 'Stocks', v: stocksUSD },
              { label: 'Cash', v: cashUSD },
              { label: 'Equity', v: equityUSD },
            ].map(({ label, v }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className="font-medium text-slate-600">{fmt(convert(v))}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">% of total</span>
              <span className="font-semibold text-blue-600">{totalNetWorthUSD ? ((totalUSUSD/totalNetWorthUSD)*100).toFixed(1) : 0}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1 text-emerald-600"><Zap className="w-3 h-3" />Liquid (after tax)</span>
              <span className="font-semibold text-emerald-600">{fmt(convert(usLiquidity.total))}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs text-slate-400 font-medium">🇮🇳 India Portfolio</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{fmt(convertInr(totalINRinINR))}</p>
          <div className="mt-2 space-y-1">
            {[
              { label: 'Real Estate', v: reINR },
              { label: 'Cash & FDs', v: cashINR },
              { label: 'Gold', v: goldINR },
              { label: 'Other', v: otherINR },
            ].map(({ label, v }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className="font-medium text-slate-600">{fmt(convertInr(v))}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">% of total</span>
              <span className="font-semibold text-orange-500">{totalNetWorthUSD ? ((totalIndiaUSD/totalNetWorthUSD)*100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Liquidity KPI */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-emerald-800">Immediate Liquidity (US)</h3>
            <span className="text-xs text-emerald-500">401k after 32% penalty+tax · Stocks after 15% cap gains · Cash at 100%</span>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{fmt(convert(usLiquidity.total))}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {[
            { label: 'Cash (liquid)', value: usLiquidity.cashLiquid },
            { label: 'Stocks (after 15% CGT)', value: usLiquidity.stocksAfterTax },
            { label: '401k (after 32% tax)', value: usLiquidity.retirementAfterTax },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-lg px-3 py-2 border border-emerald-100 flex justify-between items-center">
              <span className="text-xs text-slate-500">{label}</span>
              <span className="text-sm font-semibold text-emerald-700">{fmt(convert(value))}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Net Worth Trend</h3>
          <TrendChart
            data={trendData}
            series={[
              { key: 'us', label: 'US', color: '#3b82f6' },
              { key: 'india', label: 'India', color: '#f97316' },
              { key: 'total', label: 'Total', color: '#6366f1' },
            ]}
            currencySymbol={sym}
            height={200}
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Asset Allocation</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [fmt(Number(value)), ''] as any}
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Monthly Cash Flow Summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Monthly Cash Flow</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Income', value: monthlyIncome, colorBg: 'bg-green-50', colorBorder: 'border-green-100', colorText: 'text-green-600', colorLabel: 'text-green-600', sign: '+' },
            { label: 'Expenses', value: monthlyExpenses, colorBg: 'bg-red-50', colorBorder: 'border-red-100', colorText: 'text-red-600', colorLabel: 'text-red-600', sign: '-' },
            { label: 'Savings', value: monthlySavings, colorBg: 'bg-blue-50', colorBorder: 'border-blue-100', colorText: 'text-blue-600', colorLabel: 'text-blue-600', sign: '-' },
            { label: 'Net Balance', value: monthlyNet, colorBg: monthlyNet >= 0 ? 'bg-green-50' : 'bg-red-50', colorBorder: monthlyNet >= 0 ? 'border-green-100' : 'border-red-100', colorText: monthlyNet >= 0 ? 'text-green-600' : 'text-red-600', colorLabel: monthlyNet >= 0 ? 'text-green-600' : 'text-red-600', sign: monthlyNet >= 0 ? '+' : '' },
          ].map(({ label, value, colorBg, colorBorder, colorText, colorLabel, sign }) => (
            <div key={label} className={`rounded-xl p-3 ${colorBg} border ${colorBorder}`}>
              <p className={`text-xs ${colorLabel}`}>{label}</p>
              <p className={`text-lg font-bold ${colorText}`}>
                {sign}{formatCurrency(Math.abs(value))}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Summary */}
      <AISummary prompt={aiPrompt} pageKey={`consolidated-${snapshot.id}`} />
    </div>
  );
}
