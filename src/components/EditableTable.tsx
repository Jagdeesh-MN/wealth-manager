import { Trash2 } from 'lucide-react';
import { formatCurrency } from '../lib/storage';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'currency';
  width?: string;
  prefix?: string;
}

interface Props<T extends { id: string }> {
  data: T[];
  columns: Column[];
  currency?: 'USD' | 'INR';
  onUpdate: (id: string, field: string, value: string | number) => void;
  onDelete: (id: string) => void;
  totalLabel?: string;
  totalValue?: number;
}

export function EditableTable<T extends { id: string }>({
  data, columns, currency = 'USD', onUpdate, onDelete, totalLabel, totalValue
}: Props<T>) {
  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map(col => (
              <th key={col.key} className={`py-2 px-3 text-left text-xs font-medium text-slate-400 ${col.width || ''}`}>
                {col.label}
              </th>
            ))}
            <th className="py-2 px-1 w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map(row => (
            <tr key={row.id} className="group hover:bg-slate-50 transition-colors">
              {columns.map(col => {
                const val = (row as Record<string, unknown>)[col.key];
                const isNumber = col.type === 'number' || col.type === 'currency';
                return (
                  <td key={col.key} className="py-2 px-3">
                    <div className="relative flex items-center">
                      {col.prefix && (
                        <span className="text-slate-400 text-xs mr-1 pointer-events-none">
                          {col.prefix}
                        </span>
                      )}
                      <input
                        type={isNumber ? 'number' : 'text'}
                        value={val as string | number}
                        onChange={e => onUpdate(row.id, col.key, isNumber ? parseFloat(e.target.value) || 0 : e.target.value)}
                        className={`w-full bg-transparent text-slate-700 text-sm border-0 border-b border-transparent focus:border-indigo-300 focus:outline-none py-0.5 transition-colors ${isNumber ? 'text-right' : ''}`}
                        min={isNumber ? 0 : undefined}
                        step={isNumber ? 'any' : undefined}
                      />
                    </div>
                  </td>
                );
              })}
              <td className="py-2 px-1">
                <button
                  onClick={() => onDelete(row.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        {totalLabel !== undefined && totalValue !== undefined && (
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td className="py-2 px-3 text-xs font-semibold text-slate-600" colSpan={columns.length - 1}>{totalLabel}</td>
              <td className="py-2 px-3 text-right text-sm font-bold text-indigo-700">
                {formatCurrency(totalValue, currency)}
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
