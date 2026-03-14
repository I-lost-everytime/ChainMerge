import * as http from "http";
import * as url from "url";
import { appLogger } from "../lib/logger.js";
import { chainmergeClient } from "../lib/chainmergeClient.js";

export function startApiServer(port = 3000) {
  const server = http.createServer(async (req, res) => {
    // Enable CORS for external UIs
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    if (!req.url) return;
    const parsedUrl = url.parse(req.url, true);

    // 1. API Health Endpoint
    if (req.method === "GET" && parsedUrl.pathname === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "healthy",
        uptime: process.uptime(),
        chainMergeConnected: true,
      }));
      return;
    }

    // 2. Real-time logging feed endpoint
    if (req.method === "GET" && parsedUrl.pathname === "/api/logs") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(appLogger.getFeed()));
      return;
    }

    // 3. Transaction Explorer Proxy Endpoint
    if (req.method === "GET" && parsedUrl.pathname === "/api/tx") {
      try {
        const chain = parsedUrl.query.chain as any;
        const hash = parsedUrl.query.hash as string;
        if (!chain || !hash) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Missing chain or hash param" }));
          return;
        }
        
        const tx = await chainmergeClient.decodeTx({ chain, hash });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(tx));
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // 4. Governance Analysis proxy — bridges to the ADK iq-agent server
    if (req.method === "GET" && parsedUrl.pathname === "/api/govern") {
      try {
        const agentRes = await fetch("http://127.0.0.1:4000/api/analyze");
        const data = await agentRes.json();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(data));
      } catch (err: any) {
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "ADK agent server not reachable. Make sure npm run web is running in iq-agent/", details: err.message }));
      }
      return;
    }

    // POST — trigger a fresh governance analysis run on the ADK agent
    if (req.method === "POST" && parsedUrl.pathname === "/api/govern/run") {
      try {
        await fetch("http://127.0.0.1:4000/api/analyze/run", { method: "POST" });
        res.writeHead(202, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Analysis started" }));
      } catch (err: any) {
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "ADK agent server not reachable.", details: err.message }));
      }
      return;
    }

    // 5. Agent Activity Dashboard UI Component
    if (req.method === "GET" && (parsedUrl.pathname === "/" || parsedUrl.pathname === "/dashboard")) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>IQ AI × ChainMerge Hub</title>
          <style>
            :root { --primary: #6a1b9a; --bg: #f5f5f5; --card: #ffffff; --text: #333333; }
            body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); padding: 2rem; margin: 0; }
            .container { max-width: 1000px; margin: 0 auto; display: grid; gap: 2rem; grid-template-columns: 1fr 1fr; }
            .header-banner { grid-column: 1 / -1; background: var(--card); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center; }
            .card { background: var(--card); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: flex; flex-direction: column; max-height: 600px; }
            .card-full { grid-column: 1 / -1; background: var(--card); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            h1, h2 { color: var(--primary); margin-top: 0; }
            h1 { display: flex; align-items: center; gap: 10px; margin: 0; }
            .pulse { display: inline-block; width: 12px; height: 12px; background: #4caf50; border-radius: 50%; animation: pulse 2s infinite; }
            @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); } 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); } }
            .feed-container { overflow-y: auto; flex-grow: 1; border-left: 3px solid #e0e0e0; padding-left: 15px; font-family: monospace; font-size: 13px; margin-top: 10px; }
            .log { margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; }
            .log-time { color: #888; font-size: 11px; display: block; margin-bottom: 2px; }
            .log-msg { color: #333; font-weight: 500; }
            .log-data { color: #1565c0; display: block; margin-top: 4px; white-space: pre-wrap; word-break: break-all; }
            .form-group { margin-bottom: 1rem; }
            label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
            input, select { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
            button { background: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; cursor: pointer; font-weight: 600; transition: opacity 0.2s; }
            button:hover { opacity: 0.9; }
            button:disabled { opacity: 0.5; cursor: not-allowed; }
            #tx-result { margin-top: 1.5rem; background: #282c34; color: #abb2bf; padding: 1rem; border-radius: 6px; overflow-x: auto; font-family: monospace; font-size: 13px; max-height: 300px; display: none; }
            /* Governance Panel */
            .govern-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem; flex-wrap: wrap; gap: 1rem; }
            .govern-btn { background: var(--primary); color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
            .govern-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            .g-spinner { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; display: none; }
            @keyframes spin { to { transform: rotate(360deg); } }
            .gov-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(440px, 1fr)); gap: 1rem; margin-top: 0.5rem; }
            .gov-card { border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
            .gov-card-head { background: #f8f4ff; padding: 0.6rem 1rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e0e0e0; }
            .chain-tag { background: var(--primary); color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
            .short-hash { font-family: monospace; font-size: 0.72rem; color: #888; }
            .gov-body { display: grid; grid-template-columns: 1fr 1fr; font-size: 0.82rem; }
            .gov-raw { padding: 0.75rem; border-right: 1px solid #eee; }
            .gov-raw pre { font-family: monospace; font-size: 0.7rem; color: #555; white-space: pre-wrap; word-break: break-all; max-height: 160px; overflow-y: auto; }
            .gov-ai { padding: 0.75rem; }
            .gov-ai-label { font-size: 0.7rem; color: #888; text-transform: uppercase; margin-bottom: 0.4rem; font-weight: 600; }
            .gov-ai-text { color: #333; line-height: 1.6; white-space: pre-wrap; font-size: 0.8rem; }
            .sev { display: inline-block; padding: 1px 7px; border-radius: 3px; font-size: 0.68rem; font-weight: 700; margin-bottom: 4px; }
            .sev-low { background: #dcfce7; color: #16a34a; }
            .sev-med { background: #fef9c3; color: #92400e; }
            .sev-high { background: #fee2e2; color: #dc2626; }
            .gov-placeholder { text-align: center; padding: 2.5rem; color: #999; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header-banner">
              <h1><span class="pulse"></span> IQ AI Orchestrator</h1>
              <p style="margin:0;">System Status: <strong>Online</strong> | ChainMerge: <strong>Connected</strong></p>
            </div>

            <div class="card">
              <h2>📡 Agent Activity Feed</h2>
              <div class="feed-container" id="feed-container">
                <p style="color:#888;"><i>Loading agent logs...</i></p>
              </div>
            </div>

            <div class="card">
              <h2>🔍 Universal Tx Explorer</h2>
              <p style="font-size:14px; color:#666;">Decode any transaction globally using ChainMerge Engine.</p>
              <div class="form-group">
                <label>Chain</label>
                <select id="tx-chain">
                  <option value="ethereum">Ethereum</option>
                  <option value="solana">Solana</option>
                  <option value="cosmos">Cosmos</option>
                  <option value="sui">Sui</option>
                  <option value="aptos">Aptos</option>
                  <option value="bitcoin">Bitcoin</option>
                </select>
              </div>
              <div class="form-group">
                <label>Transaction Hash</label>
                <input type="text" id="tx-hash" placeholder="0x..." />
              </div>
              <button onclick="fetchTx()">Decode Transaction</button>
              <pre id="tx-result"></pre>
            </div>

            <!-- Governance Analysis Panel (full width) -->
            <div class="card-full">
              <div class="govern-header">
                <h2 style="margin:0;">🏛️ On-Chain Governance Analysis <span style="font-size:0.75rem;font-weight:400;color:#888;margin-left:8px;">powered by IQ AI × Gemini 2.5 Flash</span></h2>
                <button class="govern-btn" id="govBtn" onclick="runGovernance()">
                  <div class="g-spinner" id="g-spinner"></div>
                  <span>⚡ Run AI Analysis</span>
                </button>
              </div>
              <div id="gov-status" style="font-size:0.8rem;color:#888;margin-bottom:0.5rem;"></div>
              <div id="gov-container" class="gov-grid">
                <div class="gov-placeholder">🏛️ Click "Run AI Analysis" to analyse real indexed transactions with the IQ AI ADK agent and Gemini.</div>
              </div>
            </div>
          </div>

          <script>
            // ── Feed ──
            async function updateFeed() {
              try {
                const res = await fetch('/api/logs');
                const logs = await res.json();
                const container = document.getElementById('feed-container');
                if (logs.length === 0) { container.innerHTML = '<p style="color:#888;"><i>Waiting for transaction signals...</i></p>'; return; }
                let html = '';
                for (let i = 0; i < logs.length; i++) {
                  const l = logs[i];
                  const dataStr = l.data ? '<span class="log-data">' + JSON.stringify(l.data, null, 2) + '</span>' : '';
                  html += '<div class="log"><span class="log-time">' + new Date(l.timestamp).toLocaleTimeString() + '</span><span class="log-msg">' + l.message + '</span>' + dataStr + '</div>';
                }
                container.innerHTML = html;
              } catch(e) {}
            }

            // ── Tx Explorer ──
            async function fetchTx() {
              const chain = document.getElementById('tx-chain').value;
              const hash = document.getElementById('tx-hash').value;
              const el = document.getElementById('tx-result');
              if (!hash) return;
              el.style.display = 'block'; el.textContent = 'Decoding...';
              try {
                const res = await fetch('/api/tx?chain=' + chain + '&hash=' + hash);
                el.textContent = JSON.stringify(await res.json(), null, 2);
              } catch(e) { el.textContent = 'Error: ' + e.message; }
            }

            // ── Governance Analysis ──
            let govPolling = null;
            async function runGovernance() {
              const btn = document.getElementById('govBtn');
              const spinner = document.getElementById('g-spinner');
              const status = document.getElementById('gov-status');
              btn.disabled = true; spinner.style.display = 'block';
              status.textContent = 'Sending transactions to IQ AI ADK agent (Gemini 2.5 Flash)...';
              document.getElementById('gov-container').innerHTML = '<div class="gov-placeholder" style="grid-column:1/-1;">⏳ Analysing on-chain data with Gemini... This takes ~10–20 seconds.</div>';
              try { await fetch('/api/govern/run', { method: 'POST' }); } catch(e) {
                status.textContent = '⚠️ Could not reach ADK agent. Is npm run web running in iq-agent/?';
                btn.disabled = false; spinner.style.display = 'none'; return;
              }
              govPolling = setInterval(async () => {
                const res = await fetch('/api/govern');
                const data = await res.json();
                if (data.error) { clearInterval(govPolling); status.textContent = '⚠️ ' + data.error; btn.disabled = false; spinner.style.display = 'none'; return; }
                if (!data.analyzing && data.results && data.results.length > 0) {
                  clearInterval(govPolling);
                  btn.disabled = false; spinner.style.display = 'none';
                  status.textContent = '✅ Analysis complete — ' + data.results.length + ' transactions analysed by IQ AI.';
                  renderGov(data.results);
                }
              }, 1500);
            }

            function getSev(text) {
              const t = text.toUpperCase();
              if (t.includes('HIGH')) return '<span class="sev sev-high">HIGH</span>';
              if (t.includes('MEDIUM')) return '<span class="sev sev-med">MEDIUM</span>';
              return '<span class="sev sev-low">LOW</span>';
            }

            function renderGov(results) {
              const c = document.getElementById('gov-container');
              c.innerHTML = results.map(r => {
                const h = r.tx.tx_hash || '';
                const sh = h.length > 18 ? h.slice(0,8)+'...'+h.slice(-6) : h;
                return '<div class="gov-card">' +
                  '<div class="gov-card-head"><span class="chain-tag">' + (r.tx.chain||'?') + '</span><span class="short-hash">' + sh + '</span></div>' +
                  '<div class="gov-body">' +
                    '<div class="gov-raw"><div class="gov-ai-label">📦 ChainMerge Payload</div><pre>' + JSON.stringify(r.tx, null, 2) + '</pre></div>' +
                    '<div class="gov-ai"><div class="gov-ai-label">🤖 IQ AI Gemini Says</div>' + getSev(r.analysis) + '<div class="gov-ai-text">' + r.analysis.replace(/</g,'&lt;') + '</div></div>' +
                  '</div></div>';
              }).join('');
            }

            setInterval(updateFeed, 2000);
            updateFeed();
          </script>
        </body>
        </html>
      `);
      return;
    }

    // 404
    res.writeHead(404);
    res.end("Not Found");
  });

  server.listen(port, () => {
    appLogger.info("[API] Dashboard Server active on http://localhost:" + port);
  });

  return server;
}
