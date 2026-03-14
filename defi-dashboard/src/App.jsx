import { useState, useEffect, useRef } from 'react'
import './index.css'

// ── Static data ───────────────────────────────────────────────────
const WALLET = { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', short: '0xd8dA…6045' }

const ETH_TOKENS = [
  { symbol: 'ETH',  name: 'Ethereum',       balance: '4.821',    value: '$17,284', change: '+2.4%',  up: true  },
  { symbol: 'USDC', name: 'USD Coin',        balance: '3,420.00', value: '$3,420',  change: '0.0%',   up: null  },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.142',    value: '$9,104',  change: '+1.8%',  up: true  },
  { symbol: 'UNI',  name: 'Uniswap',         balance: '210.5',    value: '$842',    change: '-0.9%',  up: false },
]
const MULTI_TOKENS = [
  { symbol: 'ETH',  name: 'Ethereum',       balance: '4.821',    value: '$17,284', change: '+2.4%',  up: true,  chain: 'ethereum' },
  { symbol: 'SOL',  name: 'Solana',         balance: '84.2',     value: '$11,230', change: '+5.1%',  up: true,  chain: 'solana'   },
  { symbol: 'USDC', name: 'USD Coin',        balance: '3,420.00', value: '$3,420',  change: '0.0%',   up: null,  chain: 'ethereum' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', balance: '0.142',    value: '$9,104',  change: '+1.8%',  up: true,  chain: 'ethereum' },
  { symbol: 'ATOM', name: 'Cosmos',          balance: '320.0',    value: '$2,144',  change: '+3.2%',  up: true,  chain: 'cosmos'   },
  { symbol: 'APT',  name: 'Aptos',           balance: '150.0',    value: '$1,050',  change: '-1.2%',  up: false, chain: 'aptos'    },
  { symbol: 'UNI',  name: 'Uniswap',         balance: '210.5',    value: '$842',    change: '-0.9%',  up: false, chain: 'ethereum' },
]
const ETH_TXS = [
  { hash: '0x9e621f...a8a9', to: '0xA0b8...6e48',  amount: '1.24 ETH',  time: '2m ago',  type: 'send',    status: 'success', chain: 'ethereum' },
  { hash: '0x4f2b8c...1b2c', to: 'Uniswap V3',     amount: '500 USDC',  time: '8m ago',  type: 'swap',    status: 'success', chain: 'ethereum' },
  { hash: '0xab1234...9876', to: 'Aave Pool',       amount: '2.5 ETH',   time: '15m ago', type: 'deposit', status: 'success', chain: 'ethereum' },
  { hash: '0x7c9d3f...4e5f', to: '0x9876fe...dcba', amount: '0.08 ETH',  time: '31m ago', type: 'send',    status: 'success', chain: 'ethereum' },
  { hash: '0x2e5f8b...3a7e', to: 'Compound V2',     amount: '1000 DAI',  time: '52m ago', type: 'deposit', status: 'failed',  chain: 'ethereum' },
]
const MULTI_TXS = [
  { hash: '0x9e621f...a8a9', to: '0xA0b8...6e48',  amount: '1.24 ETH',  time: '2m ago',  type: 'send',    status: 'success', chain: 'ethereum' },
  { hash: '5ZvGTs...sY1t',   to: '9WzDX5...kPn',   amount: '42 SOL',    time: '4m ago',  type: 'send',    status: 'success', chain: 'solana'   },
  { hash: '0x4f2b8c...1b2c', to: 'Uniswap V3',     amount: '500 USDC',  time: '8m ago',  type: 'swap',    status: 'success', chain: 'ethereum' },
  { hash: 'A1B2C3...A1B2',   to: 'cosmos1...4nkp', amount: '120 ATOM',  time: '13m ago', type: 'send',    status: 'success', chain: 'cosmos'   },
  { hash: '0xab1234...9876', to: 'Aave Pool',       amount: '2.5 ETH',   time: '15m ago', type: 'deposit', status: 'success', chain: 'ethereum' },
  { hash: '0xabcdef...90ab', to: '0x7e8f9a...1b2c', amount: '300 APT',   time: '22m ago', type: 'send',    status: 'success', chain: 'aptos'    },
]
const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', color: '#627eea', encoding: 'ABI'      },
  { id: 'solana',   name: 'Solana',   color: '#9945ff', encoding: 'Borsh'    },
  { id: 'cosmos',   name: 'Cosmos',   color: '#6f7bf7', encoding: 'Protobuf' },
  { id: 'aptos',    name: 'Aptos',    color: '#00d4aa', encoding: 'BCS'      },
]
const INSTALL_LINES = [
  { text: '$ npm install chainmerge-sdk',                  cls: 'tl-cmd' },
  { text: '',                                               cls: ''       },
  { text: 'npm warn deprecated glob@7.2.3',                cls: 'tl-dim' },
  { text: 'added 1 package, audited 312 packages in 1.8s', cls: 'tl-dim' },
  { text: '',                                               cls: ''       },
  { text: 'Initializing chainmerge-sdk v0.1.0...',         cls: 'tl-txt' },
  { text: '  registering: ethereum  (ABI encoding)',        cls: 'tl-txt' },
  { text: '  registering: solana    (Borsh encoding)',      cls: 'tl-txt' },
  { text: '  registering: cosmos    (Protobuf encoding)',   cls: 'tl-txt' },
  { text: '  registering: aptos     (BCS encoding)',        cls: 'tl-txt' },
  { text: '',                                               cls: ''       },
  { text: '✓ chainmerge-sdk ready — 4 chains active',      cls: 'tl-ok'  },
]

// Wallet connection steps
const CONNECT_STEPS = [
  { id: 'scan',    label: 'Scanning for wallet…',         duration: 700  },
  { id: 'request', label: 'Requesting permissions…',      duration: 900  },
  { id: 'sign',    label: 'Verifying signature…',         duration: 800  },
  { id: 'load',    label: 'Loading on-chain balances…',   duration: 1000 },
  { id: 'done',    label: 'Wallet connected',             duration: 0    },
]

const TOKEN_ICONS = { ETH: '⟠', SOL: '◎', USDC: '$', WBTC: '₿', ATOM: '⚛', APT: '▲', UNI: '🦄' }
const TYPE_ICON   = { send: '↑', swap: '⇄', deposit: '↓' }
const TYPE_COLOR  = { send: '#f87171', swap: '#fbbf24', deposit: '#34d399' }

// ── Wallet connect modal ──────────────────────────────────────────
function WalletConnectModal({ onConnected, onClose }) {
  const [stepIdx,   setStepIdx]   = useState(0)
  const [done,      setDone]      = useState(false)
  const [dots,      setDots]      = useState('')

  // Animated dots
  useEffect(() => {
    if (done) return
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 350)
    return () => clearInterval(iv)
  }, [done])

  // Step sequencer
  useEffect(() => {
    if (stepIdx >= CONNECT_STEPS.length - 1) { setDone(true); return }
    const t = setTimeout(() => setStepIdx(i => i + 1), CONNECT_STEPS[stepIdx].duration)
    return () => clearTimeout(t)
  }, [stepIdx])

  const current = CONNECT_STEPS[stepIdx]

  return (
    <div className="overlay" onClick={e => { if (!done && e.target === e.currentTarget) onClose() }}>
      <div className="modal wallet-modal">
        <div className="modal-titlebar">
          <div className="mac-dots">
            <span className="mac-r" /><span className="mac-y" /><span className="mac-g" />
          </div>
          <span className="modal-title">MetaMask — connect wallet</span>
          <span />
        </div>

        {/* Wallet icon + pulse */}
        <div className="wc-body">
          <div className={'wc-icon-wrap' + (done ? ' done' : '')}>
            <div className="wc-pulse" />
            <div className="wc-pulse wc-pulse2" />
            <div className="wc-icon">🦊</div>
          </div>

          <div className="wc-address">
            <span className="wc-addr-label">wallet</span>
            <span className="wc-addr">{WALLET.short}</span>
          </div>

          {/* Steps */}
          <div className="wc-steps">
            {CONNECT_STEPS.slice(0, -1).map((s, i) => (
              <div key={s.id} className={'wc-step' + (i < stepIdx ? ' done' : i === stepIdx ? ' active' : '')}>
                <span className="wc-step-dot">
                  {i < stepIdx ? '✓' : i === stepIdx ? <span className="wc-spinner" /> : '○'}
                </span>
                <span className="wc-step-label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Status line */}
          <div className={'wc-status' + (done ? ' wc-status-done' : '')}>
            {done ? '✓ Connected to Ethereum mainnet' : current.label + dots}
          </div>

          {done && (
            <button className="done-btn wc-confirm-btn" onClick={onConnected}>
              Open portfolio →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  // phase: 'disconnected' | 'connecting' | 'eth' | 'modal' | 'multi'
  const [phase,        setPhase]        = useState('disconnected')
  const [activePage,   setActivePage]   = useState('portfolio')
  const [termLines,    setTermLines]    = useState([])
  const [termDone,     setTermDone]     = useState(false)
  const [activeTab,    setActiveTab]    = useState('all')
  const [decodeChain,  setDecodeChain]  = useState('ethereum')
  const [decodeHash,   setDecodeHash]   = useState('')
  const [decoding,     setDecoding]     = useState(false)
  const [decodeResult, setDecodeResult] = useState(null)
  const [decodeError,  setDecodeError]  = useState(null)
  const termRef  = useRef(null)
  const timerRef = useRef(null)

  const walletConnected = phase !== 'disconnected' && phase !== 'connecting'
  const sdkActive       = phase === 'multi'
  const tokens          = sdkActive ? MULTI_TOKENS : ETH_TOKENS
  const availChains     = sdkActive ? CHAINS : [CHAINS[0]]
  const txs             = sdkActive
    ? (activeTab === 'all' ? MULTI_TXS : MULTI_TXS.filter(t => t.chain === activeTab))
    : ETH_TXS

  function openInstallModal() {
    setTermLines([]); setTermDone(false); setPhase('modal')
  }

  // Terminal animation
// Terminal animation
const termStarted = useRef(false)
useEffect(() => {
  if (phase !== 'modal') { termStarted.current = false; return }
  if (termStarted.current) return
  termStarted.current = true
  let i = 0
  const start = () => {
    timerRef.current = setInterval(() => {
      if (i < INSTALL_LINES.length) {
        const line = INSTALL_LINES[i]
        setTermLines(prev => [...prev, line])
        i++
      } else {
        clearInterval(timerRef.current)
        setTermDone(true)
      }
    }, 180)
  }
  setTimeout(start, 80)
  return () => clearInterval(timerRef.current)
}, [phase])

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight
  }, [termLines])

  function confirmInstall() { setPhase('multi'); setActiveTab('all') }

  async function onDecode() {
    const hash = decodeHash.trim()
    if (!hash) return
    setDecoding(true); setDecodeResult(null); setDecodeError(null)
    try {
      const res  = await fetch(`http://localhost:3000/api/decode?chain=${decodeChain}&hash=${encodeURIComponent(hash)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setDecodeResult(data)
    } catch (err) { setDecodeError(err.message) }
    finally { setDecoding(false) }
  }

  const dcMeta = CHAINS.find(c => c.id === decodeChain)

  // ── DISCONNECTED landing ──────────────────────────────────────
  if (phase === 'disconnected') {
    return (
      <div className="page">
        <div className="landing">
          <div className="landing-card">
            <div className="landing-logo">Meridian</div>
            <div className="landing-tagline">Your multichain portfolio, unified.</div>
            <div className="landing-chains">
              {CHAINS.map(c => (
                <span key={c.id} className="landing-chain-pill"
                  style={{ color: c.color, borderColor: c.color + '50', background: c.color + '10' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, display: 'inline-block', marginRight: 5 }} />
                  {c.name}
                </span>
              ))}
            </div>
            <button className="connect-btn" onClick={() => setPhase('connecting')}>
              <span className="connect-fox">🦊</span>
              Connect Wallet
            </button>
            <div className="landing-note">Simulated · no real funds · demo only</div>
          </div>
        </div>
      </div>
    )
  }

  // ── CONNECTING modal ──────────────────────────────────────────
  if (phase === 'connecting') {
    return (
      <div className="page">
        <WalletConnectModal
          onConnected={() => setPhase('eth')}
          onClose={() => setPhase('disconnected')}
        />
      </div>
    )
  }

  // ── CONNECTED (eth / modal / multi) ──────────────────────────
  return (
    <div className="page">

      {/* SDK install modal */}
      {phase === 'modal' && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-titlebar">
              <div className="mac-dots">
                <span className="mac-r" /><span className="mac-y" /><span className="mac-g" />
              </div>
              <span className="modal-title">chainmerge-sdk — install</span>
              <span />
            </div>
            <div className="modal-meta">
              <span className="mm-key">package</span>
              <a href="https://pypi.org/project/chainmerge-sdk/" target="_blank" rel="noreferrer" className="mm-val">
                chainmerge-sdk @ pypi.org ↗
              </a>
            </div>
            <div className="term" ref={termRef}>
              {termLines.map((l, i) => (
                <div key={i} className={'tl ' + l.cls}>{l.text || '\u00a0'}</div>
              ))}
              {!termDone && <span className="tcursor" />}
            </div>
            {termDone && (
              <div className="modal-done">
                <div className="done-chains">
                  {CHAINS.map(c => (
                    <span key={c.id} className="done-chip"
                      style={{ color: c.color, borderColor: c.color + '40', background: c.color + '0e' }}>
                      <span className="done-dot" style={{ background: c.color }} />
                      {c.name}
                    </span>
                  ))}
                </div>
                <button className="done-btn" onClick={confirmInstall}>
                  Open multichain dashboard →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Topbar */}
      <header className="topbar">
        <div className="tb-inner">
          <div className="tb-left">
            <div className="tb-logo">Meridian</div>
            <nav className="tb-nav">
              {['portfolio','swap','history'].map(pg => (
                <span key={pg}
                  className={'tb-nl' + (activePage === pg ? ' active' : '')}
                  onClick={() => setActivePage(pg)}>
                  {pg.charAt(0).toUpperCase() + pg.slice(1)}
                </span>
              ))}
            </nav>
          </div>
          <div className="tb-right">
            <div className="tb-wallet">
              <span className="tb-wdot" />
              {WALLET.short}
            </div>
            {phase === 'eth' && (
              <button className="btn-add" onClick={openInstallModal}>⊕ Add multichain support</button>
            )}
            {phase === 'modal' && (
              <button className="btn-add busy" disabled><span className="spin-xs" />installing…</button>
            )}
            {phase === 'multi' && (
              <div className="badge-on"><span className="badge-dot" />chainmerge-sdk</div>
            )}
            <button className="disconnect-btn" onClick={() => setPhase('disconnected')}>
              Disconnect
            </button>
          </div>
        </div>
      </header>

      {/* Portfolio header */}
      <div className="port-header">
        <div className="ph-inner">
          <div>
            {activePage === 'portfolio' && (<>
              <div className="ph-label">{sdkActive ? 'Total portfolio' : 'Ethereum portfolio'}</div>
              <div className="ph-total">{sdkActive ? '$44,074' : '$30,650'}</div>
              <div className="ph-change">{sdkActive ? '+$1,842 (4.4%)' : '+$642 (2.1%)'} today</div>
            </>)}
            {activePage === 'swap' && (<>
              <div className="ph-label">Swap</div>
              <div className="ph-total">Cross-chain token routing</div>
              <div className="ph-change">Simulated flows · no funds move</div>
            </>)}
            {activePage === 'history' && (<>
              <div className="ph-label">History</div>
              <div className="ph-total">Unified transaction log</div>
              <div className="ph-change">{sdkActive ? 'Across Ethereum, Solana, Cosmos, Aptos' : 'Ethereum only · add more chains'}</div>
            </>)}
          </div>
          <div className="ph-right">
            {sdkActive
              ? CHAINS.map(c => (
                  <div key={c.id} className="ph-pill"
                    style={{ borderColor: c.color + '40', background: c.color + '0d' }}>
                    <span className="ph-dot" style={{ background: c.color }} />
                    <span style={{ color: c.color, fontSize: 11, fontWeight: 500 }}>{c.name}</span>
                  </div>
                ))
              : <div className="ph-eth">Ethereum only · <button className="ph-add" onClick={openInstallModal}>add more chains →</button></div>
            }
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="content">

        {activePage === 'portfolio' && (<>
          <div className="left-col">

            <div className="card">
              <div className="card-head">
                <span className="card-title">Holdings</span>
                <span className="card-count">{tokens.length} assets</span>
              </div>
              {tokens.map((t, i) => {
                const ch = CHAINS.find(c => c.id === t.chain)
                return (
                  <div key={i} className="tok-row">
                    <div className="tok-ico">{TOKEN_ICONS[t.symbol] || t.symbol[0]}</div>
                    <div className="tok-info">
                      <div className="tok-name">{t.name}</div>
                      <div className="tok-bal">{t.balance} {t.symbol}</div>
                    </div>
                    {sdkActive && ch && (
                      <div className="tok-chain"
                        style={{ color: ch.color, background: ch.color + '12', borderColor: ch.color + '35' }}>
                        {ch.name}
                      </div>
                    )}
                    <div className="tok-right">
                      <div className="tok-val">{t.value}</div>
                      <div className={'tok-chg' + (t.up === true ? ' up' : t.up === false ? ' dn' : '')}>{t.change}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="card">
              <div className="card-head">
                <span className="card-title">Transactions</span>
                {sdkActive && (
                  <div className="ctabs">
                    {[{ id: 'all', name: 'All', color: '#718096' }, ...CHAINS].map(c => (
                      <button key={c.id}
                        className={'ctab' + (activeTab === c.id ? ' on' : '')}
                        style={activeTab === c.id && c.id !== 'all'
                          ? { color: c.color, borderColor: c.color + '50', background: c.color + '0d' } : {}}
                        onClick={() => setActiveTab(c.id)}>
                        {c.id !== 'all' && <span className="ctab-dot" style={{ background: c.color }} />}
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {txs.map((tx, i) => {
                const ch = CHAINS.find(c => c.id === tx.chain)
                return (
                  <div key={i} className="tx-row">
                    <div className="tx-ico" style={{ color: TYPE_COLOR[tx.type], background: TYPE_COLOR[tx.type] + '15' }}>
                      {TYPE_ICON[tx.type] || '·'}
                    </div>
                    <div className="tx-info">
                      <div className="tx-top">
                        <span className="tx-type">{tx.type}</span>
                        {sdkActive && ch && (
                          <span className="tx-badge"
                            style={{ color: ch.color, background: ch.color + '12', borderColor: ch.color + '35' }}>
                            {ch.name}
                          </span>
                        )}
                        <span className={'tx-st ' + tx.status}>{tx.status}</span>
                        <span className="tx-time">{tx.time}</span>
                      </div>
                      <div className="tx-sub">
                        <span className="tx-hash">{tx.hash}</span>
                        <span className="tx-sep">·</span>
                        <span className="tx-to">to {tx.to}</span>
                      </div>
                    </div>
                    <div className="tx-amt">{tx.amount}</div>
                  </div>
                )
              })}
              {!sdkActive && (
                <div className="card-foot">
                  Showing Ethereum only ·
                  <button className="foot-link" onClick={openInstallModal}>Add multichain →</button>
                </div>
              )}
            </div>
          </div>

          <div className="right-col">
            <div className="card">
              <div className="card-head"><span className="card-title">Decode Transaction</span></div>
              <div className="dec-body">
                <div className="field">
                  <div className="field-lbl">chain</div>
                  <div className="cpick-grid">
                    {availChains.map(c => (
                      <button key={c.id}
                        className={'cpick' + (decodeChain === c.id ? ' sel' : '')}
                        style={decodeChain === c.id ? { borderColor: c.color, background: c.color + '10', color: c.color } : {}}
                        onClick={() => { setDecodeChain(c.id); setDecodeResult(null); setDecodeError(null) }}>
                        <span className="cpick-dot" style={{ background: c.color }} />
                        {c.name}
                      </button>
                    ))}
                    {!sdkActive && (
                      <div className="cpick-lock" onClick={openInstallModal}>
                        <span>🔒</span><span>install SDK to unlock</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="field">
                  <div className="field-lbl">transaction hash</div>
                  <input className="hash-in" placeholder="paste tx hash..."
                    value={decodeHash}
                    onChange={e => { setDecodeHash(e.target.value); setDecodeError(null) }}
                    onKeyDown={e => e.key === 'Enter' && onDecode()} />
                </div>
                <button className={'dec-btn' + (decoding ? ' busy' : '')}
                  disabled={!decodeHash.trim() || decoding}
                  style={dcMeta && decodeHash.trim() ? { borderColor: dcMeta.color + '40', background: dcMeta.color + '08', color: dcMeta.color } : {}}
                  onClick={onDecode}>
                  {decoding ? <><span className="spin" />decoding…</> : `Decode${dcMeta ? ' on ' + dcMeta.name : ''}`}
                </button>
                {sdkActive && <div className="sdk-note">powered by <span>chainmerge-sdk</span> · {dcMeta?.encoding}</div>}
                {decodeError && (
                  <div className="err-box">
                    <div className="err-t">Failed</div>
                    <div className="err-m">{decodeError}</div>
                    <div className="err-h">Make sure ChainMerge API is running on :3000</div>
                  </div>
                )}
                {decodeResult && (
                  <div className="res-box">
                    <div className="res-head">
                      <span className="res-chain" style={{ color: CHAINS.find(c => c.id === decodeResult.chain)?.color }}>
                        {CHAINS.find(c => c.id === decodeResult.chain)?.name || decodeResult.chain}
                      </span>
                      <span className={'res-st ' + (decodeResult.status === 'success' ? 'ok' : 'fail')}>{decodeResult.status}</span>
                    </div>
                    <div className="res-rows">
                      {decodeResult.tx_hash  && <div className="res-row"><span className="rk">hash</span><span className="rv">{decodeResult.tx_hash.slice(0,18)}…</span></div>}
                      {decodeResult.sender   && <div className="res-row"><span className="rk">from</span><span className="rv">{decodeResult.sender.slice(0,14)}…</span></div>}
                      {decodeResult.receiver && <div className="res-row"><span className="rk">to</span>  <span className="rv">{decodeResult.receiver.slice(0,14)}…</span></div>}
                      {decodeResult.fee      && <div className="res-row"><span className="rk">fee</span> <span className="rv">{decodeResult.fee.amount} {decodeResult.fee.symbol}</span></div>}
                      <div className="res-row"><span className="rk">events</span><span className="rv">{decodeResult.events?.length || 0} decoded</span></div>
                    </div>
                    <pre className="res-raw">{JSON.stringify(decodeResult, null, 2)}</pre>
                  </div>
                )}
                {!sdkActive && !decodeResult && !decodeError && (
                  <div className="dec-note">Install chainmerge-sdk to unlock Solana, Cosmos, Aptos and more.</div>
                )}
              </div>
            </div>
          </div>
        </>)}

        {activePage === 'swap' && (<>
          <div className="left-col">
            <div className="card">
              <div className="card-head">
                <span className="card-title">Swap</span>
                <span className="card-count">{sdkActive ? 'Multichain routing' : 'Ethereum only'}</span>
              </div>
              <div className="dec-body">
                <div className="field">
                  <div className="field-lbl">from chain</div>
                  <div className="cpick-grid">
                    {availChains.map(c => (
                      <button key={c.id} className="cpick"
                        style={{ borderColor: c.color + '50', background: c.color + '08', color: c.color }}>
                        <span className="cpick-dot" style={{ background: c.color }} />{c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field"><div className="field-lbl">amount</div><input className="hash-in" placeholder="0.00" /></div>
                <div className="field"><div className="field-lbl">to token</div><input className="hash-in" placeholder="Select token…" /></div>
                <button className="dec-btn" disabled>Preview route (demo only)</button>
                {!sdkActive && <div className="dec-note">Install chainmerge-sdk to simulate cross-chain swap paths.</div>}
              </div>
            </div>
          </div>
          <div className="right-col">
            <div className="card">
              <div className="card-head">
                <span className="card-title">Recent swaps</span>
                <span className="card-count">{txs.filter(t => t.type === 'swap').length} sample routes</span>
              </div>
              {txs.filter(t => t.type === 'swap').map((tx, i) => {
                const ch = CHAINS.find(c => c.id === tx.chain)
                return (
                  <div key={i} className="tx-row">
                    <div className="tx-ico" style={{ color: TYPE_COLOR[tx.type], background: TYPE_COLOR[tx.type] + '15' }}>⇄</div>
                    <div className="tx-info">
                      <div className="tx-top">
                        <span className="tx-type">swap</span>
                        {sdkActive && ch && <span className="tx-badge" style={{ color: ch.color, background: ch.color + '12', borderColor: ch.color + '35' }}>{ch.name}</span>}
                        <span className={'tx-st ' + tx.status}>{tx.status}</span>
                        <span className="tx-time">{tx.time}</span>
                      </div>
                      <div className="tx-sub"><span className="tx-hash">{tx.hash}</span><span className="tx-sep">·</span><span className="tx-to">to {tx.to}</span></div>
                    </div>
                    <div className="tx-amt">{tx.amount}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </>)}

        {activePage === 'history' && (<>
          <div className="left-col">
            <div className="card">
              <div className="card-head">
                <span className="card-title">Activity</span>
                <span className="card-count">{sdkActive ? 'All chains' : 'Ethereum only'}</span>
              </div>
              {txs.map((tx, i) => {
                const ch = CHAINS.find(c => c.id === tx.chain)
                return (
                  <div key={i} className="tx-row">
                    <div className="tx-ico" style={{ color: TYPE_COLOR[tx.type], background: TYPE_COLOR[tx.type] + '15' }}>{TYPE_ICON[tx.type] || '·'}</div>
                    <div className="tx-info">
                      <div className="tx-top">
                        <span className="tx-type">{tx.type}</span>
                        {sdkActive && ch && <span className="tx-badge" style={{ color: ch.color, background: ch.color + '12', borderColor: ch.color + '35' }}>{ch.name}</span>}
                        <span className={'tx-st ' + tx.status}>{tx.status}</span>
                        <span className="tx-time">{tx.time}</span>
                      </div>
                      <div className="tx-sub"><span className="tx-hash">{tx.hash}</span><span className="tx-sep">·</span><span className="tx-to">to {tx.to}</span></div>
                    </div>
                    <div className="tx-amt">{tx.amount}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="right-col">
            <div className="card">
              <div className="card-head"><span className="card-title">Filters</span><span className="card-count">Static demo</span></div>
              <div className="dec-body">
                <div className="field">
                  <div className="field-lbl">chain</div>
                  <div className="cpick-grid">
                    {[{ id: 'all', name: 'All', color: '#718096' }, ...CHAINS].map(c => (
                      <button key={c.id} className="cpick" style={c.id !== 'all' ? { borderColor: c.color + '40', background: c.color + '08', color: c.color } : {}}>
                        {c.id !== 'all' && <span className="cpick-dot" style={{ background: c.color }} />}{c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <div className="field-lbl">type</div>
                  <div className="cpick-grid">
                    {['send', 'swap', 'deposit'].map(t => (
                      <button key={t} className="cpick"><span className="cpick-dot" />{t}</button>
                    ))}
                  </div>
                </div>
                <div className="dec-note">In a real app this drives server-side history queries.</div>
              </div>
            </div>
          </div>
        </>)}

      </div>
    </div>
  )
}