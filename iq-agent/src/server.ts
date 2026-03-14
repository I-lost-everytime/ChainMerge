import * as http from "http";
import { createGovernanceAgent } from "./agents/governance/agent.js";

const CHAINMERGE_API = process.env.CHAINMERGE_BASE_URL || "http://127.0.0.1:8080";
const PORT = parseInt(process.env.AGENT_PORT || "4000", 10);

// In-memory cache of analysis results
let analysisResults: { tx: any; analysis: string; timestamp: string }[] = [];
let isAnalyzing = false;

async function fetchRecentTransactions(limit = 5) {
  const res = await fetch(`${CHAINMERGE_API}/api/index/recent?limit=${limit}`);
  if (!res.ok) throw new Error(`ChainMerge API error: ${res.status}`);
  const data = (await res.json()) as { items: any[] };
  return data.items;
}

async function runAnalysis() {
  if (isAnalyzing) return;
  isAnalyzing = true;

  try {
    const { runner } = await createGovernanceAgent();
    const txs = await fetchRecentTransactions(5);

    analysisResults = [];

    for (const tx of txs) {
      const prompt = `
Analyze this on-chain transaction from ChainMerge and assess its governance significance:

${JSON.stringify(tx, null, 2)}

Answer:
1. Is this related to any DAO or governance protocol?
2. What is the estimated voting weight of the sender?
3. Severity: LOW / MEDIUM / HIGH
4. Recommended IQ AI autonomous action?
      `;
      const response = await runner.ask(prompt);
      analysisResults.push({
        tx,
        analysis: response,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    console.error("Analysis error:", err.message);
  } finally {
    isAnalyzing = false;
  }
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  // JSON API for analysis results
  if (req.url === "/api/analyze" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ analyzing: isAnalyzing, results: analysisResults }));
    return;
  }

  // Trigger a fresh analysis
  if (req.url === "/api/analyze/run" && req.method === "POST") {
    runAnalysis(); // fire and forget
    res.writeHead(202, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Analysis started. Poll /api/analyze for results." }));
    return;
  }

  // Web Dashboard
  if (req.url === "/" || req.url === "/dashboard") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IQ AI Governance Analyzer</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    :root {
      --bg: #0d0f14; --surface: #161920; --card: #1e222d; --border: #2a2f3d;
      --primary: #7c5cfc; --primary-glow: rgba(124,92,252,0.2);
      --green: #22c55e; --yellow: #f59e0b; --red: #ef4444;
      --text: #e2e8f0; --muted: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

    header { background: var(--surface); border-bottom: 1px solid var(--border); padding: 1.2rem 2rem; display: flex; align-items: center; justify-content: space-between; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-icon { width: 36px; height: 36px; background: var(--primary-glow); border: 1px solid var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .logo h1 { font-size: 1.1rem; font-weight: 600; color: var(--text); }
    .logo span { font-size: 0.75rem; color: var(--muted); }
    .status-bar { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--muted); }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

    main { padding: 2rem; max-width: 1100px; margin: 0 auto; }
    .controls { display: flex; gap: 1rem; margin-bottom: 2rem; align-items: center; }
    button { background: var(--primary); color: white; border: none; padding: 0.65rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
    button:hover { opacity: 0.85; transform: translateY(-1px); }
    button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: none; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .info-box { background: var(--card); border: 1px solid var(--border); border-left: 3px solid var(--primary); border-radius: 8px; padding: 1rem 1.2rem; font-size: 0.85rem; color: var(--muted); margin-bottom: 2rem; }
    .info-box strong { color: var(--text); }

    .results-grid { display: grid; gap: 1.5rem; }
    .result-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: border-color 0.2s; }
    .result-card:hover { border-color: var(--primary); }

    .card-header { padding: 1rem 1.2rem; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
    .chain-badge { background: var(--primary-glow); border: 1px solid var(--primary); color: var(--primary); padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .tx-hash { font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: var(--muted); }
    .timestamp { font-size: 0.7rem; color: var(--muted); }

    .card-body { display: grid; grid-template-columns: 1fr 1fr; }
    @media(max-width:700px) { .card-body { grid-template-columns: 1fr; } }

    .tx-data { padding: 1rem 1.2rem; border-right: 1px solid var(--border); }
    .tx-data h3 { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }
    .tx-data pre { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: #94a3b8; line-height: 1.6; overflow-x: auto; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; }

    .ai-analysis { padding: 1rem 1.2rem; }
    .ai-analysis h3 { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 6px; }
    .ai-analysis h3 span { color: var(--primary); }
    .analysis-text { font-size: 0.85rem; line-height: 1.7; color: var(--text); white-space: pre-wrap; }

    .severity { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; margin-bottom: 0.5rem; }
    .sev-low { background: rgba(34,197,94,0.15); color: var(--green); }
    .sev-med { background: rgba(245,158,11,0.15); color: var(--yellow); }
    .sev-high { background: rgba(239,68,68,0.15); color: var(--red); }

    .empty { text-align: center; padding: 4rem 2rem; color: var(--muted); }
    .empty div { font-size: 3rem; margin-bottom: 1rem; }
    .empty p { font-size: 0.9rem; }

    .analyzing-overlay { text-align: center; padding: 3rem; color: var(--muted); }
    .big-spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
  </style>
</head>
<body>
  <header>
    <div class="logo">
      <div class="logo-icon">🏛️</div>
      <div>
        <h1>Governance Analyzer</h1>
        <span>IQ AI × ChainMerge</span>
      </div>
    </div>
    <div class="status-bar">
      <div class="dot"></div>
      ChainMerge Connected &nbsp;|&nbsp; Gemini 2.5 Flash
    </div>
  </header>

  <main>
    <div class="info-box">
      🔗 <strong>How it works:</strong> Click "Run Analysis" to pull the latest indexed transactions from your local <strong>ChainMerge codec</strong>, then your <strong>IQ AI ADK agent</strong> powered by <strong>Gemini 2.5 Flash</strong> analyses each one for governance significance in real time.
    </div>

    <div class="controls">
      <button id="runBtn" onclick="startAnalysis()">
        <div class="spinner" id="spinner"></div>
        <span>⚡ Run Governance Analysis</span>
      </button>
      <span id="status-text" style="font-size:0.85rem; color:var(--muted);"></span>
    </div>

    <div id="results-container" class="results-grid">
      <div class="empty">
        <div>🏛️</div>
        <p>Click "Run Governance Analysis" to fetch real on-chain transactions<br>and analyse them with the IQ AI agent.</p>
      </div>
    </div>
  </main>

  <script>
    let polling = null;

    async function startAnalysis() {
      const btn = document.getElementById('runBtn');
      const spinner = document.getElementById('spinner');
      const status = document.getElementById('status-text');

      btn.disabled = true;
      spinner.style.display = 'block';
      status.textContent = 'Fetching transactions from ChainMerge...';

      document.getElementById('results-container').innerHTML =
        '<div class="analyzing-overlay"><div class="big-spinner"></div><p>Gemini is analysing your on-chain data...</p></div>';

      await fetch('/api/analyze/run', { method: 'POST' });

      polling = setInterval(async () => {
        const res = await fetch('/api/analyze');
        const data = await res.json();

        if (!data.analyzing && data.results.length > 0) {
          clearInterval(polling);
          btn.disabled = false;
          spinner.style.display = 'none';
          status.textContent = 'Analysis complete — ' + data.results.length + ' transactions analysed.';
          renderResults(data.results);
        } else if (!data.analyzing && data.results.length === 0) {
          clearInterval(polling);
          btn.disabled = false;
          spinner.style.display = 'none';
          status.textContent = 'No indexed transactions found yet.';
        }
      }, 1500);
    }

    function getSeverityBadge(text) {
      if (text.toUpperCase().includes('HIGH')) return '<span class="severity sev-high">HIGH</span>';
      if (text.toUpperCase().includes('MEDIUM')) return '<span class="severity sev-med">MEDIUM</span>';
      return '<span class="severity sev-low">LOW</span>';
    }

    function renderResults(results) {
      const container = document.getElementById('results-container');
      container.innerHTML = results.map(r => {
        const hash = r.tx.tx_hash || '';
        const shortHash = hash.length > 20 ? hash.slice(0, 10) + '...' + hash.slice(-8) : hash;
        return '<div class="result-card">' +
          '<div class="card-header">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<span class="chain-badge">' + (r.tx.chain || 'unknown') + '</span>' +
              '<span class="tx-hash">' + shortHash + '</span>' +
            '</div>' +
            '<span class="timestamp">' + new Date(r.timestamp).toLocaleTimeString() + '</span>' +
          '</div>' +
          '<div class="card-body">' +
            '<div class="tx-data">' +
              '<h3>📦 ChainMerge Payload</h3>' +
              '<pre>' + JSON.stringify(r.tx, null, 2) + '</pre>' +
            '</div>' +
            '<div class="ai-analysis">' +
              '<h3>🤖 IQ AI says <span>↙</span></h3>' +
              getSeverityBadge(r.analysis) +
              '<div class="analysis-text">' + r.analysis.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
  </script>
</body>
</html>`);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

// Auto-run analysis on startup
console.log(`🏛️  IQ AI Governance Analyzer web dashboard starting on http://localhost:${PORT}`);
console.log(`📡 ChainMerge API: ${CHAINMERGE_API}`);
runAnalysis();

server.listen(PORT, () => {
  console.log(`✅ Dashboard live → http://localhost:${PORT}`);
});
