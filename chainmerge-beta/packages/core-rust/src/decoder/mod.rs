pub mod ethereum;
pub mod solana;
pub mod cosmos;
pub mod aptos;
pub mod simulated;

use crate::models::NormalizedTransaction;
use anyhow::Result;
use async_trait::async_trait;

#[async_trait]
pub trait Decoder: Send + Sync {
    fn chain_name(&self) -> &'static str;
    async fn decode(&self, tx_hash: &str, rpc_url: &str) -> Result<NormalizedTransaction>;
}

pub fn get_decoder(chain: &str) -> Option<Box<dyn Decoder>> {
    match chain.to_lowercase().as_str() {
        "ethereum" | "eth" | "evm" => Some(Box::new(ethereum::EthereumDecoder)),
        "solana" | "sol"           => Some(Box::new(solana::SolanaDecoder)),
        "cosmos" | "atom" => Some(Box::new(simulated::SimulatedDecoder::new("cosmos", "ATOM", 6))),
        "aptos" | "apt" => Some(Box::new(simulated::SimulatedDecoder::new("aptos", "APT", 8))),
        "sui"                      => Some(Box::new(simulated::SimulatedDecoder::new("sui", "SUI", 9))),
        "polkadot" | "dot"         => Some(Box::new(simulated::SimulatedDecoder::new("polkadot", "DOT", 10))),
        "bitcoin" | "btc"          => Some(Box::new(simulated::SimulatedDecoder::new("bitcoin", "BTC", 8))),
        "starknet" | "strk"        => Some(Box::new(simulated::SimulatedDecoder::new("starknet", "STRK", 18))),
        _ => None,
    }
}