import { useAI } from '../hooks/useAI';
import { Sparkles, RefreshCw, StopCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Props {
  prompt: string;
  pageKey: string;
}

export function AISummary({ prompt, pageKey }: Props) {
  const { content, loading, error, generate, stop } = useAI();
  const [hasGenerated, setHasGenerated] = useState(false);
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  useEffect(() => {
    setHasGenerated(false);
  }, [pageKey]);

  const handleGenerate = async () => {
    setHasGenerated(true);
    await generate(prompt);
  };

  if (!apiKey) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">AI Summaries Unavailable</p>
            <p className="text-xs text-amber-600 mt-0.5">Add <code className="bg-amber-100 px-1 rounded">VITE_ANTHROPIC_API_KEY</code> to your .env file to enable AI-powered insights.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-indigo-800">AI Financial Insights</span>
        </div>
        <div className="flex gap-2">
          {loading && (
            <button onClick={stop} className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <StopCircle className="w-3 h-3" />
              Stop
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {hasGenerated ? 'Regenerate' : 'Generate'}
          </button>
        </div>
      </div>

      {!hasGenerated && !loading && (
        <p className="text-sm text-indigo-400 italic">Click "Generate" to get AI-powered analysis of your financial data.</p>
      )}

      {loading && !content && (
        <div className="flex items-center gap-2 py-2">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="text-xs text-indigo-400 ml-1">Analyzing your data...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {content && (
        <div className="animate-fade-in">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{content}</p>
          {loading && <span className="inline-flex gap-0.5 ml-1"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></span>}
        </div>
      )}
    </div>
  );
}
