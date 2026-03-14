use super::Decoder;
use crate::models::*;
use anyhow::Result;
use async_trait::async_trait;

/// Simulated decoder for Tier 2 chains.
/// Returns realistic normalized output without real RPC calls.
/// Demonstrates the plugin architecture works for any chain.
pub struct SimulatedDecoder {
    chain: String,
    symbol: String,
    decimals: u8,
}

impl SimulatedDecoder {
    pub fn new(chain: &str, symbol: &str, decimals: u8) -> Self {
        Self {
            chain: chain.to_string(),
            symbol: symbol.to_string(),
            decimals,
        }
    }
}

#[async_trait]
impl Decoder for SimulatedDecoder {
    fn chain_name(&self) -> &'static str {
        // Can't return &self.chain as &'static str
        // so we return a generic label
        "simulated"
    }

    async fn decode(&self, tx_hash: &str, _rpc_url: &str) -> Result<NormalizedTransaction> {
        // Simulate realistic output based on chain type
        let events = match self.chain.as_str() {
            "bitcoin" => vec![
                Event::NativeTransfer(NativeTransferEvent {
                    from: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh".to_string(),
                    to:   "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq".to_string(),
                    amount: "150000000".to_string(), // 1.5 BTC in satoshis
                    symbol: "BTC".to_string(),
                })
            ],
            "polkadot" => vec![
                Event::NativeTransfer(NativeTransferEvent {
                    from: "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5".to_string(),
                    to:   "14E5nqKAp3oAJcmzgs25pVCBMSAaQ5E3h4jzAGf7VXBTNoTr".to_string(),
                    amount: "10000000000".to_string(), // 1 DOT
                    symbol: "DOT".to_string(),
                })
            ],
            "sui" => vec![
                Event::TokenTransfer(TokenTransferEvent {
                    token: TokenInfo {
                        address: "0x2::sui::SUI".to_string(),
                        symbol: Some("SUI".to_string()),
                        decimals: 9,
                    },
                    from: "0x1234567890abcdef1234567890abcdef12345678".to_string(),
                    to:   "0xabcdef1234567890abcdef1234567890abcdef12".to_string(),
                    amount: "5000000000".to_string(), // 5 SUI
                })
            ],
            "starknet" => vec![
                Event::TokenTransfer(TokenTransferEvent {
                    token: TokenInfo {
                        address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d".to_string(),
                        symbol: Some("STRK".to_string()),
                        decimals: 18,
                    },
                    from: "0x01234567890abcdef01234567890abcdef01234567890abcdef01234567890ab".to_string(),
                    to:   "0x0abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890".to_string(),
                    amount: "1000000000000000000".to_string(), // 1 STRK
                })
            ],
            "cosmos" => vec![
                Event::NativeTransfer(NativeTransferEvent {
                    from:   "cosmos1yw6g44c4pqd2rxgrcqekxg9k8f4fd8xpab8qs2".to_string(),
                    to:     "cosmos1grgelyng2v6v3t8z87wu3sxgt9m5s03xfytvz7".to_string(),
                    amount: "5000000".to_string(),
                    symbol: "ATOM".to_string(),
                })
            ],
            "aptos" => vec![
                Event::TokenTransfer(TokenTransferEvent {
                    token: TokenInfo {
                        address: "0x1::aptos_coin::AptosCoin".to_string(),
                        symbol:   Some("APT".to_string()),
                        decimals: 8,
                    },
                    from:   "0x9f3a1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a".to_string(),
                    to:     "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b".to_string(),
                    amount: "250000000".to_string(),
                })
            ],
            _ => vec![
                Event::Unknown(UnknownEvent {
                    raw: tx_hash.to_string(),
                    reason: Some(format!("Simulation for {}", self.chain)),
                })
            ],
        };

        Ok(NormalizedTransaction {
            chain: self.chain.clone(),
            tx_hash: tx_hash.to_string(),
            block_number: Some(1234567),
            timestamp: Some(1716200000),
            status: TxStatus::Success,
            sender: events.iter().find_map(|e| match e {
                Event::NativeTransfer(t) => Some(t.from.clone()),
                Event::TokenTransfer(t) => Some(t.from.clone()),
                _ => None,
            }).unwrap_or_default(),
            receiver: events.iter().find_map(|e| match e {
                Event::NativeTransfer(t) => Some(t.to.clone()),
                Event::TokenTransfer(t) => Some(t.to.clone()),
                _ => None,
            }),
            value: TokenAmount {
                amount: "0".to_string(),
                symbol: self.symbol.clone(),
                decimals: self.decimals,
            },
            fee: TokenAmount {
                amount: "1000".to_string(),
                symbol: self.symbol.clone(),
                decimals: self.decimals,
            },
            events,
            raw_data: None,
            decode_error: None,
        })
    }
}