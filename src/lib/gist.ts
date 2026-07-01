import type { AppState } from './types';

const GIST_ID  = import.meta.env.VITE_GIST_ID as string | undefined;
const TOKEN    = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
const FILENAME = 'wealth-data.json';

const BASE_URL = () => `https://api.github.com/gists/${GIST_ID}`;

function authHeaders(): HeadersInit {
  return {
    'Authorization': `Bearer ${TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

export async function loadFromGist(): Promise<AppState> {
  const res = await fetch(BASE_URL(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`Gist fetch failed: ${res.status} ${res.statusText}`);
  const gist = await res.json() as { files: Record<string, { content: string }> };
  const file = gist.files[FILENAME];
  if (!file?.content) throw new Error(`"${FILENAME}" not found in Gist`);
  return JSON.parse(file.content) as AppState;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function saveToGist(state: AppState): void {
  if (!GIST_ID || !TOKEN) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      await fetch(BASE_URL(), {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          files: { [FILENAME]: { content: JSON.stringify(state, null, 2) } },
        }),
      });
    } catch (err) {
      console.error('Gist save failed:', err);
    }
  }, 2000);
}
