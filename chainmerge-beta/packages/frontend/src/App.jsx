import { useState } from 'react';
import DecoderPage  from './pages/DecoderPage';
import ChainViewPage from './pages/ChainViewPage';
import ChainIndexPage from './pages/ChainIndexPage';
import DocsPage      from './pages/DocsPage';
import './index.css';

const NAV_ITEMS = [
  { id: 'decoder',    icon: '⬡', label: 'DECODER',    tag: null },
  { id: 'chainview',  icon: '◈', label: 'CHAINVIEW',  tag: null },
  { id: 'chainindex', icon: '⊛', label: 'CHAININDEX', tag: 'NEW' },
  { id: 'docs',       icon: '//','label': 'DOCS',      tag: null },
];

const CHAIN_PILLS = [
  { label: 'ETH', bg: 'rgba(98,126,234,0.15)',  color: '#627EEA', border: 'rgba(98,126,234,0.3)' },
  { label: 'SOL', bg: 'rgba(153,69,255,0.15)',  color: '#9945FF', border: 'rgba(153,69,255,0.3)' },
  { label: 'ATOM',bg: 'rgba(111,115,144,0.15)', color: '#8b8fa8', border: 'rgba(111,115,144,0.3)' },
  { label: 'APT', bg: 'rgba(0,212,170,0.15)',   color: '#00D4AA', border: 'rgba(0,212,170,0.3)'  },
];

export default function App() {
  const [page, setPage] = useState('decoder');

  return (
    <div className="app">
      <div className="grid-bg" />

      {/* ── Navbar ── */}
      <nav className="navbar">
        {/* Brand */}
        <div className="nav-brand">
          <span className="nav-logo-icon">⬡</span>
          <span className="nav-logo-text">
            Chain<span className="nav-logo-accent">Merge</span>
          </span>
          <span className="nav-logo-badge">BETA</span>
        </div>

        {/* Page links */}
        <div className="nav-links">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-link${page === item.id ? ' active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span className="nav-link-icon">{item.icon}</span>
              {item.label}
              {item.tag && <span className="nav-link-new">{item.tag}</span>}
            </button>
          ))}
        </div>

        {/* Right: status + chain pills */}
        <div className="nav-right">
          <div className="nav-status">
            <span className="status-dot" />
            API LIVE
          </div>
          <div className="nav-chain-pills">
            {CHAIN_PILLS.map(p => (
              <span
                key={p.label}
                className="nav-pill"
                style={{ background: p.bg, color: p.color, border: `1px solid ${p.border}` }}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Page ── */}
      <div key={page} className="page-wrap">
        {page === 'decoder'    && <DecoderPage />}
        {page === 'chainview'  && <ChainViewPage />}
        {page === 'chainindex' && <ChainIndexPage />}
        {page === 'docs'       && <DocsPage />}
      </div>

      {/* ── Footer ── */}
      <footer className="footer">
        <span>ChainMerge v0.1.0</span>
        <span className="sep">·</span>
        <span>Rust + Node.js + React</span>
        <span className="sep">·</span>
        <span style={{ color: 'var(--green)' }}>ETH · SOL · COSMOS · APT</span>
        <span className="sep">·</span>
        <span>Hackathon Demo</span>
      </footer>
    </div>
  );
}