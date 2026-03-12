import { FormEvent, useMemo, useState } from "react";

type DecodeSuccess = {
  decoded: {
    chain: string;
    tx_hash: string;
    sender?: string;
    receiver?: string;
    value?: string;
    events: Array<{
      event_type: string;
      token?: string;
      from?: string;
      to?: string;
      amount?: string;
      raw_program?: string;
    }>;
  };
};

type DecodeFailure = {
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
};

const CHAIN_OPTIONS = [
  "solana",
  "ethereum",
  "cosmos",
  "aptos",
  "sui",
  "polkadot",
  "bitcoin",
  "starknet",
] as const;

export function App() {
  const [chain, setChain] = useState<(typeof CHAIN_OPTIONS)[number]>("ethereum");
  const [hash, setHash] = useState(
    "0xd5d0587189f3411699ae946baa2a7d3ebfaf13133f9014a22bab6948591611ad"
  );
  const [rpcUrl, setRpcUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DecodeSuccess | null>(null);
  const [error, setError] = useState<DecodeFailure | null>(null);

  const sampleTip = useMemo(() => {
    if (chain === "ethereum") {
      return "Use presets below for verified ERC-20 and native ETH examples.";
    }
    if (chain === "solana") {
      return "Use an SPL transfer hash to get token_transfer output.";
    }
    if (chain === "cosmos") {
      return "Cosmos decoder supports bank MsgSend via Cosmos tx REST endpoint.";
    }
    return "This chain key exists, but decoding may still be placeholder.";
  }, [chain]);

  function applyPreset(kind: "eth_erc20" | "eth_native") {
    setChain("ethereum");
    setRpcUrl("");

    if (kind === "eth_erc20") {
      setHash("0xd5d0587189f3411699ae946baa2a7d3ebfaf13133f9014a22bab6948591611ad");
      return;
    }

    setHash("0x5db45209923531658781b4a5ea73bde7193e7f0991595ad5af80121764afb8b4");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const params = new URLSearchParams({
        chain,
        hash: hash.trim(),
      });

      if (rpcUrl.trim()) {
        params.set("rpc_url", rpcUrl.trim());
      }

      const res = await fetch(`/api/decode?${params.toString()}`);
      const body = (await res.json()) as DecodeSuccess | DecodeFailure;

      if (!res.ok) {
        setError(body as DecodeFailure);
        return;
      }

      setResponse(body as DecodeSuccess);
    } catch (err) {
      setError({
        error: {
          code: "network_error",
          message: err instanceof Error ? err.message : "Unknown network error",
          retryable: true,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="panel hero">
        <p className="eyebrow">ChainCodec Demo</p>
        <h1>Multichain Decoder Playground</h1>
        <p className="subtitle">
          Submit a transaction hash and get one normalized response shape from the Rust backend.
        </p>
      </section>

      <section className="panel form-panel">
        <form onSubmit={onSubmit} className="decode-form">
          <label>
            Chain
            <select value={chain} onChange={(e) => setChain(e.target.value as (typeof CHAIN_OPTIONS)[number])}>
              {CHAIN_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Transaction Hash
            <input
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              placeholder="0x..."
              required
            />
          </label>

          <label>
            RPC URL (optional, per-chain defaults are built in)
            <input
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              placeholder="https://..."
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Decoding..." : "Decode Transaction"}
          </button>
        </form>

        <div className="presets">
          <p className="preset-title">Quick Presets</p>
          <div className="preset-actions">
            <button type="button" className="ghost" onClick={() => applyPreset("eth_erc20")}>
              Ethereum ERC-20
            </button>
            <button type="button" className="ghost" onClick={() => applyPreset("eth_native")}>
              Ethereum Native
            </button>
          </div>
        </div>

        <p className="tip">{sampleTip}</p>
      </section>

      <section className="panel output-panel">
        <h2>Output</h2>
        {!response && !error && <p className="muted">Run a decode request to see normalized JSON.</p>}

        {error && (
          <pre className="output error">{JSON.stringify(error, null, 2)}</pre>
        )}

        {response && (
          <pre className="output success">{JSON.stringify(response, null, 2)}</pre>
        )}
      </section>
    </main>
  );
}
