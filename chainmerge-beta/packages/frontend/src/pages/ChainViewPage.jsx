import { useState, useEffect } from 'react'
import { queryCache, getAllCached, getCacheSize } from '../cache'

const CHAINS = [
  { value: 'all',      label: 'ALL CHAINS', color: '#6b8099' },
  { value: 'ethereum', label: 'ETH',        color: '#60a5fa' },
  { value: 'solana',   label: 'SOL',        color: '#a78bfa' },
  { value: 'cosmos',   label: 'ATOM',       color: '#34d399' },
  { value: 'aptos',    label: 'APT',        color: '#f59e0b' },
  { value: 'sui',      label: 'SUI',        color: '#38bdf8' },
  { value: 'polkadot', label: 'DOT',        color: '#e879f9' },
  { value: 'bitcoin',  label: 'BTC',        color: '#fbbf24' },
  { value: 'starknet', label: 'STRK',       color: '#fb923c' },
]

const STATUSES = ['all', 'success', 'failed', 'pending']
const TX_TYPES = ['all', 'token_transfer', 'native_transfer', 'contract_call', 'unknown']

const PRESET_QUERIES = [
  { label: 'All successful',     filters: { chain: 'all', status: 'success', type: 'all', search: '' } },
  { label: 'Token transfers',    filters: { chain: 'all', status: 'all',     type: 'token_transfer',  search: '' } },
  { label: 'Native transfers',   filters: { chain: 'all', status: 'all',     type: 'native_transfer', search: '' } },
  { label: 'Failed txs',         filters: { chain: 'all', status: 'failed',  type: 'all', search: '' } },
  { label: 'ETH only',           filters: { chain: 'ethereum', status: 'all', type: 'all', search: '' } },
  { label: 'SOL only',           filters: { chain: 'solana',   status: 'all', type: 'all', search: '' } },
]

function shortHash(h) {
  if (!h || h.length <= 14) return h || '—'
  return `${h.slice(0, 8)}…${h.slice(-6)}`
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60)   return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  return `${Math.floor(s / 3600)}h ago`
}

function buildQueryString(f) {
  const parts = []
  if (f.chain  !== 'all') parts.push(`chain = '${f.chain}'`)
  if (f.status !== 'all') parts.push(`status = '${f.status}'`)
  if (f.type   !== 'all') parts.push(`events[].type = '${f.type}'`)
  if (f.search)           parts.push(`hash|sender|receiver LIKE '%${f.search}%'`)
  if (!parts.length) return 'SELECT * FROM chainindex'
  return `SELECT * FROM chainindex\nWHERE ${parts.join('\n  AND ')}`
}

export default function ChainViewPage() {
  const [filters, setFilters] = useState({
    chain: 'all', status: 'all', type: 'all', search: ''
  })
  const [results,   setResults]   = useState([])
  const [cacheSize, setCacheSize] = useState(0)
  const [tick,      setTick]      = useState(0)
  const [selected,  setSelected]  = useState(null)

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    setResults(queryCache(filters))
    setCacheSize(getCacheSize())
  }, [filters, tick])

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
    setSelected(null)
  }

  function applyPreset(preset) {
    setFilters(preset.filters)
    setSelected(null)
  }

  const chainColor = c => CHAINS.find(x => x.value === c)?.color || '#6b8099'

  return (
    <>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Chain<span>View</span></h1>
          <p className="page-sub">Query the ChainIndex cache · filter decoded transactions · SQL-style interface</p>
        </div>
        <div className="index-stat-pill">
          <span style={{ color: 'var(--green)' }}>◈</span>
          <span>{cacheSize} rows in index</span>
        </div>
      </div>

      {/* ── SQL display ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-label">// QUERY</div>
        <pre className="sql-display">{buildQueryString(filters)}</pre>
        <div className="preset-row">
          <span className="samples-label">Presets:</span>
          {PRESET_QUERIES.map(p => (
            <button key={p.label} className="sample-btn" onClick={() => applyPreset(p)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-label">// FILTERS</div>
        <div className="filter-grid">

          {/* Chain */}
          <div className="filter-group">
            <div className="filter-label">chain</div>
            <div className="filter-pills">
              {CHAINS.map(c => (
                <button key={c.value}
                  className={'filter-pill' + (filters.chain === c.value ? ' on' : '')}
                  style={filters.chain === c.value
                    ? { color: c.color, borderColor: c.color, background: c.color + '18' } : {}}
                  onClick={() => setFilter('chain', c.value)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="filter-group">
            <div className="filter-label">status</div>
            <div className="filter-pills">
              {STATUSES.map(s => (
                <button key={s}
                  className={'filter-pill' + (filters.status === s ? ' on' : '')}
                  style={filters.status === s ? {
                    color: s === 'success' ? '#4ade80' : s === 'failed' ? '#f87171' : 'var(--blue)',
                    borderColor: s === 'success' ? '#4ade80' : s === 'failed' ? '#f87171' : 'var(--blue)',
                    background:  s === 'success' ? 'rgba(74,222,128,0.1)' : s === 'failed' ? 'rgba(248,113,113,0.1)' : 'rgba(96,165,250,0.1)',
                  } : {}}
                  onClick={() => setFilter('status', s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="filter-group">
            <div className="filter-label">event type</div>
            <div className="filter-pills">
              {TX_TYPES.map(t => (
                <button key={t}
                  className={'filter-pill' + (filters.type === t ? ' on' : '')}
                  onClick={() => setFilter('type', t)}>
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="filter-group">
            <div className="filter-label">search (hash / address)</div>
            <div className="address-wrap" style={{ maxWidth: 400 }}>
              <span className="address-prefix">LIKE//</span>
              <input className="address-input" value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
                placeholder="0x… partial hash or address" spellCheck={false} />
              {filters.search && (
                <button className="address-clear" onClick={() => setFilter('search', '')}>×</button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Results ── */}
      <div className="card">
        <div className="card-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>// RESULTS — {results.length} row{results.length !== 1 ? 's' : ''}</span>
          {results.length > 0 && (
            <span style={{ color: 'var(--text3)', fontSize: 10 }}>click row to expand</span>
          )}
        </div>

        {cacheSize === 0 ? (
          <div className="index-empty">
            <div className="index-empty-icon">◈</div>
            <p>ChainIndex is empty.</p>
            <span>Go to <strong style={{ color: 'var(--blue)' }}>CHAININDEX</strong> and decode some transactions first.</span>
          </div>
        ) : results.length === 0 ? (
          <div className="index-empty">
            <div className="index-empty-icon">◈</div>
            <p>No results match your query.</p>
            <span>Try changing the filters above.</span>
          </div>
        ) : (
          <>
            <div className="cache-table">
              <div className="ct-head">
                <span>CHAIN</span>
                <span>HASH</span>
                <span>FROM</span>
                <span>TO</span>
                <span>EVENTS</span>
                <span>STATUS</span>
                <span>CACHED</span>
              </div>
              {results.map((tx, i) => (
                <>
                  <div key={i} className={'ct-row clickable' + (selected === i ? ' selected' : '')}
                    onClick={() => setSelected(selected === i ? null : i)}>
                    <span style={{ color: chainColor(tx.chain), fontWeight: 600 }}>
                      {CHAINS.find(c => c.value === tx.chain)?.label || tx.chain}
                    </span>
                    <span className="ct-hash">{shortHash(tx.tx_hash)}</span>
                    <span className="ct-addr">{shortHash(tx.sender)}</span>
                    <span className="ct-addr">{shortHash(tx.receiver)}</span>
                    <span>{tx.events?.length || 0}</span>
                    <span className={'status-' + tx.status}>{tx.status}</span>
                    <span style={{ color: 'var(--text3)' }}>{timeAgo(tx._cached_at)}</span>
                  </div>
                  {selected === i && (
                    <div key={`exp-${i}`} className="ct-expanded">
                      <pre className="res-raw">{JSON.stringify(tx, null, 2)}</pre>
                    </div>
                  )}
                </>
              ))}
            </div>

            {/* Summary stats */}
            <div className="cv-stats">
              <div className="cv-stat">
                <span className="stat-val">{results.length}</span>
                <span className="stat-key">TOTAL ROWS</span>
              </div>
              <div className="cv-stat">
                <span className="stat-val" style={{ color: '#4ade80' }}>
                  {results.filter(r => r.status === 'success').length}
                </span>
                <span className="stat-key">SUCCESS</span>
              </div>
              <div className="cv-stat">
                <span className="stat-val" style={{ color: '#f87171' }}>
                  {results.filter(r => r.status === 'failed').length}
                </span>
                <span className="stat-key">FAILED</span>
              </div>
              <div className="cv-stat">
                <span className="stat-val">
                  {[...new Set(results.map(r => r.chain))].length}
                </span>
                <span className="stat-key">CHAINS</span>
              </div>
              <div className="cv-stat">
                <span className="stat-val">
                  {results.reduce((s, r) => s + (r.events?.length || 0), 0)}
                </span>
                <span className="stat-key">TOTAL EVENTS</span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}