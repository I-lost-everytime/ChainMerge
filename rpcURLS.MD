# ChainCodec RPC README

Use these RPC/base URLs with ChainCodec:

- `ethereum` (JSON-RPC): `https://ethereum-rpc.publicnode.com`
- `solana` (JSON-RPC): `https://api.mainnet-beta.solana.com`
- `cosmos` (REST/LCD base): `https://rest.cosmos.directory/cosmoshub`
- `aptos` (REST base): `https://api.mainnet.aptoslabs.com/v1`
- `sui` (JSON-RPC): `https://fullnode.mainnet.sui.io:443`
- `bitcoin` (Blockstream-style REST base): `https://blockstream.info/api`
- `polkadot` (Subscan base, required by current decoder): `https://polkadot.api.subscan.io`
- `starknet` (JSON-RPC): `https://rpc.starknet.lava.build`

Notes:
- `polkadot` requires `POLKADOT_SUBSCAN_API_KEY`.
- `bitcoin` must be Blockstream-compatible (`/tx/{hash}` path support).

## Polkadot Subscan API Key

- `POLKADOT_SUBSCAN_API_KEY`: `a57395d3167647c7b0adc2b6f48c0fb6`
