require('dotenv').config({ path: '../../.env' });
const express = require('express');
const axios   = require('axios');
const cors    = require('cors');

const app      = express();
const PORT     = process.env.API_PORT || 3000;
const RUST_URL = `http://localhost:${process.env.RUST_SERVER_PORT || 3001}`;

// ─── Live chains (real decoders in Rust) ─────────────────────────────────────
const LIVE_CHAINS      = ['ethereum', 'solana'];
const SIMULATED_CHAINS = ['cosmos', 'aptos', 'sui', 'polkadot', 'bitcoin', 'starknet'];
const ALL_CHAINS       = [...LIVE_CHAINS, ...SIMULATED_CHAINS];

app.use(cors());
app.use(express.json());

// ─── Request logger ───────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const rustHealth = await axios.get(`${RUST_URL}/health`, { timeout: 3000 });
    res.json({ api: 'ok', rust_engine: rustHealth.data });
  } catch {
    res.status(503).json({
      api: 'ok',
      rust_engine: 'unavailable — start with: cd packages/core-rust && cargo run',
    });
  }
});

// ─── Main decode endpoint ─────────────────────────────────────────────────────
// GET /api/decode?chain=ethereum&hash=0xabc...
app.get('/api/decode', async (req, res) => {
  const { chain, hash } = req.query;

  if (!chain) {
    return res.status(400).json({ error: 'Missing parameter: chain', code: 'MISSING_CHAIN' });
  }
  if (!hash) {
    return res.status(400).json({ error: 'Missing parameter: hash',  code: 'MISSING_HASH'  });
  }

  const normalizedChain = chain.toLowerCase();

  if (!ALL_CHAINS.includes(normalizedChain)) {
    return res.status(400).json({
      error: `Unsupported chain: "${chain}". Supported: ${ALL_CHAINS.join(', ')}`,
      code:  'UNSUPPORTED_CHAIN',
      live:      LIVE_CHAINS,
      simulated: SIMULATED_CHAINS,
    });
  }

  // Basic hash format hints (non-blocking — Rust will validate properly)
  if (normalizedChain === 'ethereum' && !hash.startsWith('0x')) {
    return res.status(400).json({
      error: 'Ethereum transaction hashes must start with 0x',
      code:  'INVALID_HASH_FORMAT',
    });
  }

  try {
    const rustResponse = await axios.get(`${RUST_URL}/decode`, {
      params:  { chain: normalizedChain, hash },
      timeout: 30000,
    });
    return res.json(rustResponse.data);

  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Rust engine is not running. Start it: cd packages/core-rust && cargo run',
        code:  'ENGINE_UNAVAILABLE',
      });
    }
    if (err.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Request timed out. RPC node may be slow — try again.',
        code:  'TIMEOUT',
      });
    }
    console.error('Unexpected error:', err.message);
    return res.status(500).json({ error: 'Unexpected error', code: 'INTERNAL_ERROR' });
  }
});

// ─── 404 fallback ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.url}`, code: 'NOT_FOUND' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   ChainMerge API   →  :${PORT}                        ║
║   Rust Engine      →  :${process.env.RUST_SERVER_PORT || 3001}                        ║
║   Live chains      →  ${LIVE_CHAINS.join(', ')}  ║
║   Simulated        →  ${SIMULATED_CHAINS.join(', ')}    ║
╚════════════════════════════════════════════════════╝
  `);
});