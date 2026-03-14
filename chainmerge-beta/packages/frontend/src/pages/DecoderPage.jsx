import { useState } from 'react';
import ChainSelector from '../components/ChainSelector';
import HashInput     from '../components/HashInput';
import OutputViewer  from '../components/OutputViewer';

const SAMPLE_TXS = {
  ethereum: [{ label: 'Multi Transfer', hash: '0x9e621f6080ff42ab706d6a5adcdd08fadbc6ed25bf78b26757bddc2cc1d6a8a9' }],
  solana:   [{ label: 'SOL Transfer',   hash: '5ZvGTsHXtMaGGpJeUUqQcGi6ZvEVcxH7vZoKFbnDuJYFtCaKDeSKmAg2qB1CZcK' }],
  cosmos:   [{ label: 'ATOM Transfer',  hash: 'A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2C3D4E5F6A1B2' }],
  aptos:    [{ label: 'APT Transfer',   hash: '0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' }],
  sui:      [{ label: 'SUI Transfer (sim)', hash: '0xsui1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd' }],
  polkadot: [{ label: 'DOT Transfer (sim)', hash: '0xdot1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd' }],
  bitcoin:  [{ label: 'BTC Transfer (sim)', hash: 'btc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd'  }],
  starknet: [{ label: 'STRK Transfer (sim)',hash: '0xstrk1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab' }],
};

export default function DecoderPage() {
  const [chain,   setChain]   = useState('ethereum');
  const [hash,    setHash]    = useState('');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [decoded, setDecoded] = useState(false);

  const handleDecode = async () => {
    if (!hash.trim()) return;
    setLoading(true); setError(null); setResult(null); setDecoded(false);
    try {
      const res  = await fetch(`/api/decode?chain=${chain}&hash=${encodeURIComponent(hash.trim())}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Unknown error'); }
      else         { setResult(data); setDecoded(true); }
    } catch {
      setError('Could not reach the API. Is ChainMerge running on :3000?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">Transaction <span>Decoder</span></h1>
          <p className="page-sub">Paste any tx hash · get unified JSON · one schema for all chains</p>
        </div>
      </div>

      {/* Input card */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-label">// DECODE TRANSACTION</div>
        <div className="input-row">
          <ChainSelector
            chain={chain}
            onChange={(c) => { setChain(c); setHash(''); setResult(null); setError(null); setDecoded(false); }}
          />
          <HashInput hash={hash} onChange={setHash} onSubmit={handleDecode} loading={loading} />
          <button
            className={`decode-btn${loading ? ' loading' : ''}${decoded ? ' success' : ''}`}
            onClick={handleDecode}
            disabled={loading || !hash.trim()}
          >
            {loading ? <span className="spinner" /> : decoded ? '✓ DECODED' : 'DECODE →'}
          </button>
        </div>
        <div className="samples">
          <span className="samples-label">Try sample:</span>
          {SAMPLE_TXS[chain]?.map(s => (
            <button key={s.hash} className="sample-btn"
              onClick={() => { setHash(s.hash); setResult(null); setError(null); setDecoded(false); }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Output */}
      <div className={`output-area${result ? ' has-result' : ''}${error ? ' has-error' : ''}`}>
        {!result && !error && !loading && (
          <div className="placeholder">
            <div className="placeholder-icon">◈</div>
            <p>Enter a transaction hash above to decode it into<br />a unified, chain-agnostic JSON format.</p>
            <div className="placeholder-chains">
              <span>ethereum://Transfer(address,address,uint256)</span>
              <span className="arrow">↓</span>
              <span className="unified">{'{ type: "token_transfer", from, to, amount }'}</span>
              <span>solana://SPL.TransferChecked</span>
              <span className="arrow">↓</span>
              <span className="unified">{'{ type: "token_transfer", from, to, amount }'}</span>
            </div>
          </div>
        )}
        {loading && (
          <div className="loading-state">
            <div className="loading-bars">
              {[...Array(8)].map((_, i) => <div key={i} className="bar" style={{ animationDelay: `${i * 0.1}s` }} />)}
            </div>
            <p>Fetching from {chain} RPC and decoding…</p>
          </div>
        )}
        {error  && (
          <div className="error-box" style={{ margin: 24 }}>
            <span className="error-icon">✗</span>
            <div><div className="error-title">Decode Failed</div><div className="error-msg">{error}</div></div>
          </div>
        )}
        {result && <OutputViewer data={result} />}
      </div>
    </>
  );
}