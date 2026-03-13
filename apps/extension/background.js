/* background.js — ChainMerge Service Worker
 *
 * Content scripts on public pages (etherscan.io etc.) cannot fetch localhost
 * due to Chrome's Private Network Access policy. This service worker acts
 * as a proxy: content.js sends a message here, we fetch localhost, reply.
 */

const DEFAULT_API_URL = 'http://localhost:8080';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CM_DECODE') {
    handleDecode(message).then(sendResponse).catch((err) => {
      sendResponse({ ok: false, error: err.message });
    });
    return true; // keep channel open for async response
  }

  if (message.type === 'CM_HEALTH') {
    handleHealth(message).then(sendResponse).catch(() => {
      sendResponse({ ok: false });
    });
    return true;
  }
});

async function handleDecode({ chain, hash, apiUrl }) {
  const base   = (apiUrl || DEFAULT_API_URL).replace(/\/+$/, '');
  const params = new URLSearchParams({ chain, hash });
  const url    = `${base}/api/decode?${params}`;

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const body = await res.json();
    if (!res.ok) return { ok: false, error: body.error?.message || 'Decode failed' };
    return { ok: true, decoded: body.decoded };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function handleHealth({ apiUrl }) {
  const base = (apiUrl || DEFAULT_API_URL).replace(/\/+$/, '');
  try {
    const res  = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(3000) });
    const body = await res.json();
    return { ok: res.ok && body.status === 'ok' };
  } catch {
    return { ok: false };
  }
}
