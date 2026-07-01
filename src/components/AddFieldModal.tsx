import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface Props {
  onAdd: (label: string, extraField?: string) => void;
  sectionName: string;
  extraFieldLabel?: string;
  extraFieldPlaceholder?: string;
}

export function AddFieldModal({ onAdd, sectionName, extraFieldLabel, extraFieldPlaceholder }: Props) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [extra, setExtra] = useState('');

  const handleAdd = () => {
    if (!label.trim()) return;
    onAdd(label.trim(), extraFieldLabel ? extra.trim() : undefined);
    setLabel('');
    setExtra('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded-lg border border-dashed border-indigo-200 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add {sectionName}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
      {extraFieldLabel && (
        <input
          placeholder={extraFieldPlaceholder || extraFieldLabel}
          value={extra}
          onChange={e => setExtra(e.target.value)}
          className="px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white w-28 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
      )}
      <input
        autoFocus
        placeholder="Label / Name"
        value={label}
        onChange={e => setLabel(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        className="px-2 py-1.5 text-xs border border-slate-200 rounded-md bg-white flex-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <button onClick={handleAdd} className="px-2.5 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Add</button>
      <button onClick={() => { setOpen(false); setLabel(''); setExtra(''); }} className="p-1 text-slate-400 hover:text-slate-600">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
