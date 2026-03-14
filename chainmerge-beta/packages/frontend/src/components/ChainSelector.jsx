const CHAINS = [
  // Tier 1 - Live
  { value: "ethereum", label: "Ethereum", icon: "⬡", color: "#627EEA", tier: 1 },
  { value: "solana",   label: "Solana",   icon: "◎", color: "#9945FF", tier: 1 },
  { value: "cosmos",   label: "Cosmos",   icon: "✦", color: "#6F7390", tier: 1 },
  { value: "aptos",    label: "Aptos",    icon: "◆", color: "#00D4AA", tier: 1 },
  // Tier 2 - Simulated
  { value: "sui",      label: "Sui",      icon: "◉", color: "#4DA2FF", tier: 2 },
  { value: "polkadot", label: "Polkadot", icon: "⬤", color: "#E6007A", tier: 2 },
  { value: "bitcoin",  label: "Bitcoin",  icon: "₿", color: "#F7931A", tier: 2 },
  { value: "starknet", label: "StarkNet", icon: "★", color: "#EC796B", tier: 2 },
];

export default function ChainSelector({ chain, onChange }) {
  return (
    <div className="chain-selector">
      <div className="chain-tier-group">
        <span className="tier-label">LIVE</span>
        <div className="chain-options">
          {CHAINS.filter(c => c.tier === 1).map((c) => (
            <button
              key={c.value}
              className={`chain-option ${chain === c.value ? "active" : ""}`}
              style={{ "--chain-color": c.color }}
              onClick={() => onChange(c.value)}
              title={c.label}
            >
              <span className="chain-icon">{c.icon}</span>
              <span className="chain-label">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="chain-tier-group">
        <span className="tier-label">SIM</span>
        <div className="chain-options">
          {CHAINS.filter(c => c.tier === 2).map((c) => (
            <button
              key={c.value}
              className={`chain-option simulated ${chain === c.value ? "active" : ""}`}
              style={{ "--chain-color": c.color }}
              onClick={() => onChange(c.value)}
              title={`${c.label} (Simulated)`}
            >
              <span className="chain-icon">{c.icon}</span>
              <span className="chain-label">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}