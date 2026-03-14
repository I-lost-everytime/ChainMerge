import { useState } from "react";

function formatAmount(amount, decimals, symbol) {
  if (!amount || amount === "0") return `0 ${symbol || ""}`;
  try {
    const raw = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const whole = raw / divisor;
    const frac = raw % divisor;
    const fracStr = frac.toString().padStart(decimals, "0").slice(0, 6).replace(/0+$/, "");
    return `${whole}${fracStr ? "." + fracStr : ""} ${symbol || ""}`.trim();
  } catch {
    return `${amount} ${symbol || ""}`;
  }
}

const EVENT_COLORS = {
  token_transfer:  "#4ade80",
  native_transfer: "#60a5fa",
  contract_call:   "#f59e0b",
  unknown:         "#f87171",
};

const CHAIN_ICONS = { ethereum: "⬡", solana: "◎", cosmos: "✦" };

function SummaryBar({ data }) {
  return (
    <div className="summary-bar">
      <div className="summary-item">
        <span className="summary-key">CHAIN</span>
        <span className="summary-val chain-name">
          {CHAIN_ICONS[data.chain] || "◈"} {data.chain?.toUpperCase()}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-key">STATUS</span>
        <span className={`summary-val status-${data.status}`}>
          {data.status?.toUpperCase()}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-key">BLOCK</span>
        <span className="summary-val">
          {data.block_number?.toLocaleString() ?? "—"}
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-key">EVENTS</span>
        <span className="summary-val accent">{data.events?.length ?? 0}</span>
      </div>
      <div className="summary-item">
        <span className="summary-key">FEE</span>
        <span className="summary-val">
          {formatAmount(data.fee?.amount, data.fee?.decimals, data.fee?.symbol)}
        </span>
      </div>
    </div>
  );
}

function EventCard({ event, index }) {
  const color = EVENT_COLORS[event.type] || "#aaa";
  return (
    <div className="event-card" style={{ "--event-color": color }}>
      <div className="event-header">
        <span className="event-index">EVENT[{index}]</span>
        <span className="event-type" style={{ color }}>
          {event.type?.toUpperCase().replace("_", " ")}
        </span>
      </div>

      {event.type === "token_transfer" && (
        <div className="event-body">
          <div className="event-row">
            <span className="ekey">TOKEN</span>
            <span className="eval token-addr">{event.token?.address}</span>
          </div>
          <div className="event-row">
            <span className="ekey">FROM</span>
            <span className="eval addr">{event.from}</span>
          </div>
          <div className="event-row">
            <span className="ekey">TO</span>
            <span className="eval addr">{event.to}</span>
          </div>
          <div className="event-row">
            <span className="ekey">AMOUNT</span>
            <span className="eval amount">
              {formatAmount(event.amount, event.token?.decimals ?? 18, event.token?.symbol)}
              <span className="raw-amount"> (raw: {event.amount})</span>
            </span>
          </div>
        </div>
      )}

      {event.type === "native_transfer" && (
        <div className="event-body">
          <div className="event-row"><span className="ekey">FROM</span><span className="eval addr">{event.from}</span></div>
          <div className="event-row"><span className="ekey">TO</span><span className="eval addr">{event.to}</span></div>
          <div className="event-row">
            <span className="ekey">AMOUNT</span>
            <span className="eval amount">
              {formatAmount(event.amount, event.symbol === "ETH" ? 18 : 9, event.symbol)}
            </span>
          </div>
        </div>
      )}

      {event.type === "contract_call" && (
        <div className="event-body">
          <div className="event-row"><span className="ekey">CONTRACT</span><span className="eval addr">{event.contract}</span></div>
          {event.method && <div className="event-row"><span className="ekey">METHOD</span><span className="eval method">{event.method}</span></div>}
        </div>
      )}

      {event.type === "unknown" && (
        <div className="event-body">
          <div className="event-row"><span className="ekey">REASON</span><span className="eval error-text">{event.reason || "Could not decode"}</span></div>
          <div className="event-row"><span className="ekey">RAW</span><span className="eval raw-data">{event.raw?.slice(0, 80)}...</span></div>
        </div>
      )}
    </div>
  );
}

export default function OutputViewer({ data }) {
  const [view, setView] = useState("visual");

  return (
    <div className="output-viewer">
      <div className="view-tabs">
        <button
          className={`view-tab ${view === "visual" ? "active" : ""}`}
          onClick={() => setView("visual")}
        >
          ◈ VISUAL
        </button>
        <button
          className={`view-tab ${view === "json" ? "active" : ""}`}
          onClick={() => setView("json")}
        >
          {"{ } RAW JSON"}
        </button>
        <div className="tab-hash">{data.tx_hash?.slice(0, 20)}...</div>
      </div>

      {view === "visual" && (
        <div className="visual-view">
          <SummaryBar data={data} />
          <div className="addr-row">
            <div className="addr-box">
              <span className="addr-label">FROM</span>
              <span className="addr-val">{data.sender}</span>
            </div>
            <div className="addr-arrow">→</div>
            <div className="addr-box">
              <span className="addr-label">TO</span>
              <span className="addr-val">{data.receiver || "— (multi-instruction)"}</span>
            </div>
          </div>
          <div className="events-section">
            <div className="section-label">// DECODED EVENTS ({data.events?.length})</div>
            {data.events?.length === 0 && (
              <div className="no-events">No events decoded</div>
            )}
            {data.events?.map((evt, i) => (
              <EventCard key={i} event={evt} index={i} />
            ))}
          </div>
          {data.decode_error && (
            <div className="decode-warning">⚠ {data.decode_error}</div>
          )}
        </div>
      )}

      {view === "json" && (
        <div className="json-view">
          <pre className="json-pre">
            {JSON.stringify(data, null, 2)}
          </pre>
          <button
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
          >
            Copy JSON
          </button>
        </div>
      )}
    </div>
  );
}