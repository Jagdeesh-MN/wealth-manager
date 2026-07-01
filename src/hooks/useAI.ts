import { useState, useCallback, useRef } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import type { RawMessageStreamEvent } from '@anthropic-ai/sdk/resources';

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export function useAI() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (prompt: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setContent('');
    setError(null);
    setLoading(true);

    try {
      const stream = await client.messages.stream({
        model: 'claude-opus-4-8',
        max_tokens: 1024,
        thinking: { type: 'adaptive' },
        messages: [{ role: 'user', content: prompt }],
        system: `You are a personal wealth advisor analyzing a user's financial data.
Provide concise, actionable insights in 3-4 paragraphs:
1. Current position summary
2. Key trends and growth areas
3. Areas needing attention or improvement
4. Specific actionable recommendations

Use plain text, no markdown headers. Be specific with numbers when available. Keep it under 300 words.`,
      });

      for await (const chunk of stream as AsyncIterable<RawMessageStreamEvent>) {
        if (chunk.type === 'content_block_delta') {
          const delta = chunk.delta as { type: string; text?: string };
          if (delta.type === 'text_delta' && delta.text) {
            setContent(prev => prev + delta.text);
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Failed to generate summary');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  return { content, loading, error, generate, stop };
}
