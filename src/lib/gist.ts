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
let pendingState: AppState | null = null;

async function pushToGist(state: AppState): Promise<void> {
  await fetch(BASE_URL(), {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({
      files: { [FILENAME]: { content: JSON.stringify(state, null, 2) } },
    }),
  });
}

export function saveToGist(state: AppState): void {
  if (!GIST_ID || !TOKEN) return;
  pendingState = state;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    if (!pendingState) return;
    const toSave = pendingState;
    pendingState = null;
    try { await pushToGist(toSave); } catch (err) { console.error('Gist save failed:', err); }
  }, 1500);
}

// Flush immediately when tab is hidden or closed — prevents data loss on navigation
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && pendingState) {
      const toSave = pendingState;
      pendingState = null;
      if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
      // Use sendBeacon for reliability on tab close; fall back to fetch
      const body = JSON.stringify({
        files: { [FILENAME]: { content: JSON.stringify(toSave, null, 2) } },
      });
      const sent = navigator.sendBeacon
        ? navigator.sendBeacon(
            BASE_URL(),
            new Blob([body], { type: 'application/json' })
          )
        : false;
      if (!sent) {
        // sendBeacon doesn't support custom headers, so fall back to keepalive fetch
        fetch(BASE_URL(), {
          method: 'PATCH',
          headers: authHeaders(),
          body,
          keepalive: true,
        }).catch(() => {});
      }
    }
  });
}
