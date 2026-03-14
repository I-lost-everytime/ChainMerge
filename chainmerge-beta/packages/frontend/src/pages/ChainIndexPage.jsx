import { useState, useEffect } from 'react'
import { getFromCache, saveToCache, getAllCached, getCacheSize, clearCache } from '../cache'

const CHAINS = [
  { value: 'ethereum', label: 'ETH',  icon: '⬡', color: '#60a5fa' },
  { value: 'solana',   label: 'SOL',  icon: '◎', color: '#a78bfa' },
  { value: 'cosmos',   label: 'ATOM', icon: '✦', color: '#34d399' },
  { value: 'aptos',    label: 'APT',  icon: '◆', color: '#f59e0b' },
  { value: 'sui',      label: 'SUI',  icon: '◉', color: '#38bdf8' },
  { value: 'polkadot', label: 'DOT',  icon: '⬤', color: '#e879f9' },
  { value: 'bitcoin',  label: 'BTC',  icon: '₿', color: '#fbbf24' },
  { value: 'starknet', label: 'STRK', icon: '★', color: '#fb923c' },
]

const SAMPLE_HASHES = {
  ethereum: '0x9e621f6080ff42ab706d6a5adcdd08fadbc6ed25bf78b26757bddc2cc1d6a8a9',
  solana:   '5ZvGTsHXtMaGGpJeUUqQcGi6ZvEVcxH7vZoKFbnDuJYFtCaKDeSKmAg2qB1CZcK',
  cosmos:   'A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2',
  aptos:    '0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  sui:      '0xsui1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
  polkadot: '0xdot1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
  bitcoin:  'btc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
  starknet: '0xstrk1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
}

function shortHash(h) {
  if (!h || h.length <= 14) return h
  return `${h.slice(0, 8)}…${h.slice(-6)}`
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

export default function ChainIndexPage() {
  const [chain,      setChain]      = useState('ethereum')
  const [hash,       setHash]       = useState('')
  const [loading,    setLoading]    = useState(false)
  const [lastResult, setLastResult] = useState(null) // { tx, fromCache }
  const [error,      setError]      = useState(null)
  const [cached,     setCached]     = useState([])
  const [tick,       setTick]       = useState(0)

  // Refresh cache list every second for live time display
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    setCached(getAllCached())
  }, [tick, lastResult])

  const chainMeta = c => CHAINS.find(x => x.value === c) || { label: c, icon: '◈', color: '#6b8099' }

  async function handleDecode() {
    const h = hash.trim()
    if (!h) return
    setError(null)
    setLastResult(null)

    // ── Check cache first ──────────────────────────────────────
    const cached = getFromCache(chain, h)
    if (cached) {
      setLastResult({ tx: cached, fromCache: true })
      return
    }

    // ── Cache miss — fetch from API ────────────────────────────
    setLoading(true)
    try {
      const res  = await fetch(`/api/decode?chain=${chain}&hash=${encodeURIComponent(h)}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Decode failed'); return }
      saveToCache(chain, h, data)
      setLastResult({ tx: data, fromCache: false })
    } catch (e) {
      setError('Could not reach ChainMerge API. Is it running on :3000?')
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    clearCache()
    setLastResult(null)
    setCached([])
  }

  const cm = chainMeta(chain)

  return (
    <>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Chain<span>Index</span></h1>
          <p className="page-sub">Decoded transactions are cached · same hash never hits RPC twice</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="index-stat-pill">
            <span style={{ color: 'var(--green)' }}>⊛</span>
            <span>{getCacheSize()} cached</span>
          </div>
          {getCacheSize() > 0 && (
            <button className="clear-btn" onClick={handleClear}>CLEAR CACHE</button>
          )}
        </div>
      </div>

      {/* ── Decode + cache input ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-label">// DECODE & CACHE TRANSACTION</div>

        {/* Chain picker */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {CHAINS.map(c => (
            <button key={c.value}
              onClick={() => { setChain(c.value); setHash(''); setError(null); setLastResult(null) }}
              style={{
                padding: '4px 11px', fontSize: 10, fontFamily: 'var(--font)',
                fontWeight: 700, letterSpacing: '1px', borderRadius: 3, cursor: 'pointer',
                background: chain === c.value ? `color-mix(in srgb, ${c.color} 15%, transparent)` : 'var(--bg3)',
                border: `1px solid ${chain === c.value ? c.color : 'var(--border)'}`,
                color: chain === c.value ? c.color : 'var(--text3)',
                transition: 'all 0.15s',
              }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        <div className="input-row">
          <div className="address-wrap" style={{ flex: 1 }}>
            <span className="address-prefix" style={{ color: cm.color }}>{cm.icon} HASH//</span>
            <input className="address-input" value={hash}
              onChange={e => { setHash(e.target.value); setError(null) }}
              onKeyDown={e => e.key === 'Enter' && handleDecode()}
              placeholder="paste transaction hash…" spellCheck={false} />
            {hash && <button className="address-clear" onClick={() => setHash('')}>×</button>}
          </div>
          <button className={`decode-btn${loading ? ' loading' : ''}`}
            onClick={handleDecode} disabled={loading || !hash.trim()}>
            {loading ? <><span className="spinner" /> FETCHING…</> : 'DECODE + CACHE →'}
          </button>
        </div>

        <div className="samples">
          <span className="samples-label">Sample:</span>
          <button className="sample-btn" onClick={() => setHash(SAMPLE_HASHES[chain] || '')}>
            {chain} tx
          </button>
        </div>
      </div>

      {/* ── Result ── */}
      {error && (
        <div className="error-box" style={{ marginBottom: 14 }}>
          <span className="error-icon">✗</span>
          <div><div className="error-title">Error</div><div className="error-msg">{error}</div></div>
        </div>
      )}

      {lastResult && (
        <div className="cache-result-card" style={{ marginBottom: 14,
          borderColor: lastResult.fromCache ? 'rgba(251,191,36,0.3)' : 'rgba(74,222,128,0.3)',
          background:  lastResult.fromCache ? 'rgba(251,191,36,0.04)' : 'rgba(74,222,128,0.04)',
        }}>
          <div className="cr-header">
            <span className="cr-badge" style={{
              color:   lastResult.fromCache ? '#fbbf24' : '#4ade80',
              background: lastResult.fromCache ? 'rgba(251,191,36,0.1)' : 'rgba(74,222,128,0.1)',
              border: `1px solid ${lastResult.fromCache ? 'rgba(251,191,36,0.25)' : 'rgba(74,222,128,0.25)'}`,
            }}>
              {lastResult.fromCache ? '⚡ CACHE HIT — no RPC call made' : '✓ FETCHED + SAVED TO CACHE'}
            </span>
            <span className="cr-chain" style={{ color: chainMeta(lastResult.tx.chain).color }}>
              {chainMeta(lastResult.tx.chain).icon} {lastResult.tx.chain}
            </span>
            <span className={'cr-status status-' + lastResult.tx.status}>{lastResult.tx.status}</span>
          </div>
          <div className="cr-fields">
            <div className="cr-row"><span className="cr-k">hash</span>    <span className="cr-v">{shortHash(lastResult.tx.tx_hash)}</span></div>
            <div className="cr-row"><span className="cr-k">from</span>    <span className="cr-v">{shortHash(lastResult.tx.sender)}</span></div>
            <div className="cr-row"><span className="cr-k">to</span>      <span className="cr-v">{shortHash(lastResult.tx.receiver)}</span></div>
            <div className="cr-row"><span className="cr-k">events</span>  <span className="cr-v">{lastResult.tx.events?.length || 0} decoded</span></div>
            <div className="cr-row"><span className="cr-k">fee</span>     <span className="cr-v">{lastResult.tx.fee?.amount} {lastResult.tx.fee?.symbol}</span></div>
            {lastResult.fromCache && lastResult.tx._cached_at && (
              <div className="cr-row"><span className="cr-k">cached</span><span className="cr-v" style={{ color: '#fbbf24' }}>{timeAgo(lastResult.tx._cached_at)}</span></div>
            )}
          </div>
        </div>
      )}

      {/* ── Cache table ── */}
      <div className="card">
        <div className="card-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>// CACHED TRANSACTIONS ({cached.length})</span>
          <span style={{ color: 'var(--text3)', fontSize: 10 }}>
            stored in memory · persists until page reload
          </span>
        </div>

        {cached.length === 0 ? (
          <div className="index-empty">
            <div className="index-empty-icon">⊛</div>
            <p>No transactions cached yet.</p>
            <span>Decode a transaction above and it will appear here.</span>
          </div>
        ) : (
          <div className="cache-table">
            <div className="ct-head">
              <span>CHAIN</span>
              <span>HASH</span>
              <span>FROM</span>
              <span>EVENTS</span>
              <span>STATUS</span>
              <span>CACHED</span>
            </div>
            {cached.map((tx, i) => {
              const cm = chainMeta(tx.chain)
              return (
                <div key={i} className="ct-row">
                  <span style={{ color: cm.color, fontWeight: 600 }}>{cm.icon} {cm.label}</span>
                  <span className="ct-hash">{shortHash(tx.tx_hash)}</span>
                  <span className="ct-addr">{shortHash(tx.sender)}</span>
                  <span>{tx.events?.length || 0}</span>
                  <span className={'status-' + tx.status}>{tx.status}</span>
                  <span style={{ color: 'var(--text3)' }}>{timeAgo(tx._cached_at)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── How it works callout ── */}
      <div className="roadmap-callout" style={{ marginTop: 14 }}>
        <div className="card-label">// HOW CHAININDEX WORKS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10, marginTop: 10 }}>
          {[
            { icon: '⬡', label: 'decode(chain, hash) called',         done: true  },
            { icon: '⊛', label: 'Check cache before RPC',              done: true  },
            { icon: '⚡', label: 'Cache hit → instant return',         done: true  },
            { icon: '🌐', label: 'Cache miss → fetch + store',         done: true  },
            { icon: '📦', label: 'Persistent storage (IndexedDB)',      done: false },
            { icon: '🔔', label: 'Webhook on new tx',                   done: false },
          ].map(f => (
            <div key={f.label} className="roadmap-item"
              style={{ opacity: f.done ? 1 : 0.45 }}>
              <span style={{ color: f.done ? 'var(--green)' : 'var(--text3)' }}>{f.done ? '✓' : f.icon}</span>
              <span style={{ color: f.done ? 'var(--text)' : 'var(--text3)' }}>{f.label}</span>
              {f.done && <span className="done-tag">DONE</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}