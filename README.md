# ChainMerge: The Universal Web3 Decoding Layer

ChainMerge is a multichain infrastructure project designed to solve the complexity of parsing transaction data across different blockchains. It provides a "Universal Translator" that normalizes raw data from 8+ ecosystems into one consistent JSON schema.

---

## 🚀 Key Features

- **8+ Chains Supported**: Ethereum, Solana, Cosmos, Aptos, Sui, Polkadot, Bitcoin, and Starknet.
- **Normalized Schema**: Treat every blockchain transaction as a single, consistent object.
- **AI Forensic Analysis**: Powered by Gemini 1.5 Flash to detect intent (Arbitrage, Swaps, Phishing).
- **Multilingual SDKs**: Official support for TypeScript/JavaScript and Python.
- **Built-in Indexing**: Fast retrieval of decoded transactions via an integrated SQLite store.

---

## 📂 Project Structure

This repository is a collection of components that make up the ChainMerge ecosystem:

### 🛠️ [Core & SDK (`chainmerge/`)](./chainmerge/)
The heart of the project.
- **Rust Core**: Deterministic and high-performance decoders for all supported chains.
- **API Service**: An `axum`-based HTTP API for remote decoding.
- **Production SDK**: The primary TypeScript/JavaScript SDK for integration.

### 🧪 [Beta Monorepo (`chainmerge-beta/`)](./chainmerge-beta/)
The next generation of ChainMerge services.
- Shared types and monorepo structure for rapid development.

### 📈 [DeFi Dashboard (`defi-dashboard/`)](./defi-dashboard/)
A reference implementation showing how to build a multichain dashboard using the ChainMerge SDK.

---

## 🛠️ Getting Started

### Using the SDK (NPM)

```bash
npm install chainmerge-sdk
```

```typescript
import { ChainMergeClient } from "chainmerge-sdk";

const client = new ChainMergeClient({ baseUrl: "https://api.chainmerge.com" });
const tx = await client.decodeTx({ chain: "solana", hash: "..." });
```

### Running the API Locally

1. Navigate to the API service: `cd chainmerge/services/api`
2. Run with Cargo: `cargo run --release`
3. Access documentation at: `http://localhost:8080/api/health`

---

## 📖 Documentation

- [**Full SDK Guide**](./chainmerge/CHAINMERGE_SDK_DOC.md): Detailed installation and usage for developers.
- [**Architecture Deep Dive**](./chainmerge/ARCH_RUST_TO_SDK.md): Understanding the Rust-to-SDK pipeline.
- [**AI Forensic Analysis**](./chainmerge/README.md#key-forensic-features): How we use Gemini to reason about transactions.

---

## 🤖 Real-World Applications

- **Alpha Nexus**: An autonomous AI agent that uses ChainMerge for real-time whale tracking and arbitrage scouting.
- **Wallets & Trackers**: Simplified portfolio views that don't require 10 different parser libraries.

---

*Built with *
