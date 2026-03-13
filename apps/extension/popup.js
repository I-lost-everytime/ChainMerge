/* popup.js — ChainMerge Extension Settings */

const DEFAULT_API_URL = 'http://localhost:8080';

const keyInput      = document.getElementById('gemini-key-input');
const saveKeyBtn    = document.getElementById('save-key-btn');
const clearKeyBtn   = document.getElementById('clear-key-btn');
const keyStatus     = document.getElementById('key-status');
const saveToast     = document.getElementById('save-toast');
const healthDot     = document.getElementById('health-dot');
const healthText    = document.getElementById('health-text');
const apiUrlInput   = document.getElementById('api-url-input');
const saveUrlBtn    = document.getElementById('save-url-btn');
const apiUrlDisplay = document.getElementById('api-url-display');
const toggleVis     = document.getElementById('toggle-visibility');

// ── Load saved values ──────────────────────────────────────────
chrome.storage.local.get(['geminiApiKey', 'chainmergeApiUrl'], ({ geminiApiKey, chainmergeApiUrl }) => {
  if (geminiApiKey) {
    keyInput.value = geminiApiKey;
    setKeyStatus(true);
  }
  const url = chainmergeApiUrl || DEFAULT_API_URL;
  apiUrlInput.value = url;
  updateApiUrlDisplay(url);
  checkHealth(url);
});

// ── Key management ─────────────────────────────────────────────
saveKeyBtn.addEventListener('click', () => {
  const key = keyInput.value.trim();
  if (!key) return;
  chrome.storage.local.set({ geminiApiKey: key }, () => {
    setKeyStatus(true);
    showToast();
  });
});

clearKeyBtn.addEventListener('click', () => {
  chrome.storage.local.remove('geminiApiKey', () => {
    keyInput.value = '';
    setKeyStatus(false);
  });
});

toggleVis.addEventListener('click', () => {
  const isPassword = keyInput.type === 'password';
  keyInput.type = isPassword ? 'text' : 'password';
  toggleVis.textContent = isPassword ? 'Hide' : 'Show';
});

function setKeyStatus(isSet) {
  if (isSet) {
    keyStatus.textContent = '✓ Saved';
    keyStatus.className = 'status-pill set';
  } else {
    keyStatus.textContent = '✕ Not set';
    keyStatus.className = 'status-pill unset';
  }
}

function showToast() {
  saveToast.classList.add('visible');
  setTimeout(() => saveToast.classList.remove('visible'), 2500);
}

// ── API URL management ─────────────────────────────────────────
saveUrlBtn.addEventListener('click', () => {
  const url = apiUrlInput.value.trim().replace(/\/+$/, '') || DEFAULT_API_URL;
  chrome.storage.local.set({ chainmergeApiUrl: url }, () => {
    updateApiUrlDisplay(url);
    checkHealth(url);
  });
});

function updateApiUrlDisplay(url) {
  try {
    const parsed = new URL(url);
    apiUrlDisplay.textContent = parsed.host;
  } catch {
    apiUrlDisplay.textContent = url;
  }
}

// ── Health check ───────────────────────────────────────────────
async function checkHealth(baseUrl) {
  healthDot.className = 'health-dot';
  healthText.textContent = 'Checking…';
  healthText.style.color = '#8a97b0';

  chrome.runtime.sendMessage({ type: 'CM_HEALTH', apiUrl: baseUrl }, (result) => {
    if (result && result.ok) {
      healthDot.className = 'health-dot online';
      healthText.textContent = 'API online ✓';
      healthText.style.color = '#22d3a0';
    } else {
      healthDot.className = 'health-dot offline';
      healthText.textContent = 'API offline — is cargo run running?';
      healthText.style.color = '#f05b6e';
    }
  });
}
