import { useState } from 'react';

const SECTIONS = [
  { id: 'quickstart', label: 'Quick Start' },
  { id: 'schema',     label: 'Unified Schema' },
  { id: 'sdk',        label: 'SDK Usage' },
  { id: 'chains',     label: 'Chain Support' },
  { id: 'api',        label: 'API Reference' },
];

const CHAIN_SUPPORT = [
  { chain: 'Ethereum', icon: '⬡', color: '#627EEA', encoding: 'ABI',       status: 'live' },
  { chain: 'Solana',   icon: '◎', color: '#9945FF', encoding: 'Borsh',     status: 'live' },
  { chain: 'Cosmos',   icon: '✦', color: '#8b8fa8', encoding: 'Protobuf',  status: 'live' },
  { chain: 'Aptos',    icon: '◆', color: '#00D4AA', encoding: 'BCS',       status: 'live' },
  { chain: 'Sui',      icon: '◉', color: '#4DA2FF', encoding: 'BCS',       status: 'simulated' },
  { chain: 'Polkadot', icon: '⬤', color: '#E6007A', encoding: 'SCALE',     status: 'simulated' },
  { chain: 'Bitcoin',  icon: '₿', color: '#F7931A', encoding: 'UTXO',      status: 'simulated' },
  { chain: 'StarkNet', icon: '★', color: '#EC796B', encoding: 'Cairo ABI', status: 'simulated' },
];

// Extracted to avoid template literals inside JSX style props (Babel parse error)
function ChainSupportCard({ c }) {
  const borderColor = c.status === 'live'
    ? 'color-mix(in srgb, ' + c.color + ' 25%, var(--border))'
    : 'var(--border)';
  return (
    <div className="chain-support-card" style={{ borderColor }}>
      <div className="support-chain-name">
        <span style={{ color: c.color }}>{c.icon}</span>
        {c.chain}
        {c.status === 'live'
          ? <span className="support-badge-live">LIVE</span>
          : <span className="support-badge-sim">SIM</span>}
      </div>
      <div className="support-encoding">{c.encoding} encoding</div>
    </div>
  );
}

export default function DocsPage() {
  const [active, setActive] = useState('quickstart');

  return (
    <>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title"><span>//</span> Docs</h1>
          <p className="page-sub">SDK usage · unified schema · API reference</p>
        </div>
      </div>

      <div className="docs-layout">
        {/* ── Sidebar ── */}
        <nav className="docs-nav">
          <div className="docs-nav-section">CONTENTS</div>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={'docs-nav-item' + (active === s.id ? ' active' : '')}
              onClick={() => setActive(s.id)}
            >
              {s.label}
            </button>
          ))}
          <div className="docs-nav-section" style={{ marginTop: 12 }}>PACKAGES</div>
          {['@chainmerge/sdk', 'core-rust', 'api-bridge'].map(p => (
            <button key={p} className="docs-nav-item" style={{ fontSize: 10, color: 'var(--text3)' }}>
              {p}
            </button>
          ))}
        </nav>

        {/* ── Content ── */}
        <div className="docs-content">

          {/* Quick Start */}
          {active === 'quickstart' && (
            <div className="docs-section">
              <div className="docs-section-title">Quick <span>Start</span></div>
              <p className="docs-text">
                Install the SDK, then decode any transaction from any chain with a single function call.
              </p>
              <div className="code-block">
                <span className="cmt"># Install</span>{'\n'}
                <span className="kw">npm</span>{' install @chainmerge/sdk'}
              </div>
              <div className="code-block">
                <span className="cmt">{'// Import'}</span>{'\n'}
                <span className="kw">import</span>{' { decode } '}
                <span className="kw">from</span>{' '}
                <span className="str">'@chainmerge/sdk'</span>{'\n\n'}
                <span className="cmt">{'// One line per chain — same output every time'}</span>{'\n'}
                <span className="kw">const</span>{' eth = '}
                <span className="kw">await</span>{' '}
                <span className="fn">decode</span>
                {'('}
                <span className="str">'ethereum'</span>
                {', txHash)\n'}
                <span className="kw">const</span>{' sol = '}
                <span className="kw">await</span>{' '}
                <span className="fn">decode</span>
                {'('}
                <span className="str">'solana'</span>
                {',   txHash)\n'}
                <span className="kw">const</span>{' atm = '}
                <span className="kw">await</span>{' '}
                <span className="fn">decode</span>
                {'('}
                <span className="str">'cosmos'</span>
                {',   txHash)\n'}
                <span className="kw">const</span>{' apt = '}
                <span className="kw">await</span>{' '}
                <span className="fn">decode</span>
                {'('}
                <span className="str">'aptos'</span>
                {',    txHash)\n\n'}
                <span className="cmt">{'// All return the same unified schema ↓'}</span>
              </div>
              <div className="docs-text">
                <strong>That's it.</strong> No chain-specific SDKs, no ABI parsing, no Borsh deserialization.
              </div>
            </div>
          )}

          {/* Unified Schema */}
          {active === 'schema' && (
            <div className="docs-section">
              <div className="docs-section-title">Unified <span>Schema</span></div>
              <p className="docs-text">
                Every decoded transaction returns this exact structure, regardless of the source chain.
              </p>
              <div className="code-block">
                {'{\n  '}
                <span className="key">"chain"</span>{':      '}
                <span className="str">"ethereum"</span>{'   // chain id\n  '}
                <span className="key">"tx_hash"</span>{':    '}
                <span className="str">"0xabc..."</span>{'  // original hash\n  '}
                <span className="key">"status"</span>{':     '}
                <span className="str">"success"</span>{'   // success | failed | pending\n  '}
                <span className="key">"block_number"</span>{': '}
                <span className="num">19842301</span>{'\n  '}
                <span className="key">"timestamp"</span>{':   '}
                <span className="num">1714000000</span>{'  // unix seconds\n  '}
                <span className="key">"sender"</span>{':     '}
                <span className="str">"0x..."</span>{'\n  '}
                <span className="key">"receiver"</span>{':   '}
                <span className="str">"0x..."</span>{'\n  '}
                <span className="key">"fee"</span>{': { amount, symbol, decimals }\n  '}
                <span className="key">"events"</span>{': [\n    {\n      '}
                <span className="key">"type"</span>{'   : '}
                <span className="str">"token_transfer"</span>{'\n      '}
                <span className="key">"from"</span>{'   : '}
                <span className="str">"0x..."</span>{'\n      '}
                <span className="key">"to"</span>{'     : '}
                <span className="str">"0x..."</span>{'\n      '}
                <span className="key">"amount"</span>{' : '}
                <span className="str">"1000000"</span>{'  // raw\n      '}
                <span className="key">"token"</span>{'  : { address, symbol, decimals }\n    }\n  ]\n}'}
              </div>
              <div className="docs-text">
                Event types: <strong>token_transfer</strong>, <strong>native_transfer</strong>,{' '}
                <strong>contract_call</strong>, <strong>swap</strong>, <strong>nft_transfer</strong>, <strong>unknown</strong>
              </div>
            </div>
          )}

          {/* SDK Usage */}
          {active === 'sdk' && (
            <div className="docs-section">
              <div className="docs-section-title">SDK <span>Usage</span></div>
              <div className="code-block">
                <span className="kw">import</span>{' { decode, ChainMerge } '}
                <span className="kw">from</span>{' '}
                <span className="str">'@chainmerge/sdk'</span>{'\n\n'}
                <span className="cmt">{'// Simple one-shot decode'}</span>{'\n'}
                <span className="kw">const</span>{' tx = '}
                <span className="kw">await</span>{' '}
                <span className="fn">decode</span>
                {'('}
                <span className="str">'ethereum'</span>
                {', '}
                <span className="str">'0xabc...'</span>
                {')\n\n'}
                <span className="cmt">{'// Custom RPC config'}</span>{'\n'}
                <span className="kw">const</span>{' client = '}
                <span className="kw">new</span>{' '}
                <span className="fn">ChainMerge</span>
                {'({ apiUrl: '}
                <span className="str">'http://localhost:3000'</span>
                {' })\n'}
                <span className="kw">const</span>{' tx2 = '}
                <span className="kw">await</span>{' client.'}
                <span className="fn">decode</span>
                {'('}
                <span className="str">'solana'</span>
                {', hash)\n\n'}
                <span className="cmt">{'// ChainIndex — watch a wallet'}</span>{'\n'}
                <span className="kw">const</span>{' index = client.'}
                <span className="fn">index</span>
                {'()\n'}
                <span className="kw">await</span>{' index.'}
                <span className="fn">watchWallet</span>
                {'('}
                <span className="str">'ethereum'</span>
                {', '}
                <span className="str">'0xd8dA...'</span>
                {')\n'}
                {'index.'}
                <span className="fn">on</span>
                {'('}
                <span className="str">'event'</span>
                {', (evt) => console.log(evt))'}
              </div>
              <div className="code-block">
                <span className="cmt">{'// ChainErrors — standardized error decoding (coming soon)'}</span>{'\n'}
                <span className="kw">const</span>{' err = '}
                <span className="kw">await</span>{' '}
                <span className="fn">decodeError</span>
                {'('}
                <span className="str">'ethereum'</span>
                {', failedTxHash)\n'}
                <span className="cmt">{'// → { code: "INSUFFICIENT_FUNDS", chain: "ethereum" }'}</span>{'\n\n'}
                <span className="cmt">{'// ChainRPC — failover RPC (coming soon)'}</span>{'\n'}
                <span className="kw">const</span>{' rpc = '}
                <span className="kw">new</span>{' '}
                <span className="fn">ChainRPC</span>
                {'({ ethereum: [url1, url2, url3] })\n'}
                <span className="cmt">{'// auto-switches if one RPC goes down'}</span>
              </div>
            </div>
          )}

          {/* Chain Support */}
          {active === 'chains' && (
            <div className="docs-section">
              <div className="docs-section-title">Chain <span>Support</span></div>
              <p className="docs-text" style={{ marginBottom: 14 }}>
                <strong>Live</strong> chains have real decoders in the Rust engine hitting actual RPCs.{' '}
                <strong style={{ color: 'var(--yellow)' }}>Simulated</strong> chains return realistic
                mock data via <code>simulated.rs</code> — real decoders coming next.
              </p>
              <div className="chain-support-grid">
                {CHAIN_SUPPORT.map(c => <ChainSupportCard key={c.chain} c={c} />)}
              </div>
            </div>
          )}

          {/* API Reference */}
          {active === 'api' && (
            <div className="docs-section">
              <div className="docs-section-title">API <span>Reference</span></div>
              <p className="docs-text">
                Node.js bridge on <strong>:3000</strong> · Rust engine on <strong>:3001</strong>
              </p>
              {[
                { method: 'GET', path: '/api/decode', params: 'chain=ethereum&hash=0xabc...', desc: 'Decode a transaction hash. Returns unified JSON schema.' },
                { method: 'GET', path: '/health',     params: '',                             desc: 'Check API and Rust engine health.' },
              ].map(e => (
                <div key={e.path} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(0,229,160,0.1)', color: 'var(--green)', border: '1px solid rgba(0,229,160,0.3)', borderRadius: 3, fontWeight: 700 }}>
                      {e.method}
                    </span>
                    <span style={{ color: 'var(--blue)', fontSize: 12 }}>{e.path}</span>
                  </div>
                  {e.params && <div style={{ fontSize: 11, color: 'var(--text3)' }}>?{e.params}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{e.desc}</div>
                </div>
              ))}
              <div className="code-block">
                <span className="cmt">{'# Terminal 1 — Rust engine'}</span>{'\n'}
                {'cd packages/core-rust && cargo run\n\n'}
                <span className="cmt">{'# Terminal 2 — Node API'}</span>{'\n'}
                {'cd packages/api && npm run dev\n\n'}
                <span className="cmt">{'# Terminal 3 — Unified frontend'}</span>{'\n'}
                {'cd packages/frontend && npm run dev\n'}
                <span className="cmt">{'# → http://localhost:5173'}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}