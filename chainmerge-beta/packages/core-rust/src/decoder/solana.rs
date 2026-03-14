use super::Decoder;
use crate::models::*;
use crate::normalizer::solana as sol_normalizer;
use anyhow::{Context, Result};
use async_trait::async_trait;
use serde::Deserialize;
use serde_json::json;

pub struct SolanaDecoder;

#[derive(Debug, Deserialize, Clone)]
pub struct SolanaRpcResponse<T> {
    pub result: Option<T>,
    pub error: Option<SolanaRpcError>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SolanaRpcError {
    pub message: String,
}

#[derive(Debug, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct RawSolanaTransaction {
    pub slot: Option<u64>,
    pub blockTime: Option<u64>,
    pub meta: Option<SolanaTransactionMeta>,
    pub transaction: SolanaTransactionData,
}

#[derive(Debug, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct SolanaTransactionMeta {
    pub err: Option<serde_json::Value>,
    pub fee: u64,
    pub preBalances: Vec<u64>,
    pub postBalances: Vec<u64>,
    pub preTokenBalances: Option<Vec<TokenBalance>>,
    pub postTokenBalances: Option<Vec<TokenBalance>>,
    pub logMessages: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct TokenBalance {
    pub accountIndex: usize,
    pub mint: String,
    pub uiTokenAmount: UiTokenAmount,
    pub owner: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct UiTokenAmount {
    pub amount: String,
    pub decimals: u8,
    pub uiAmountString: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SolanaTransactionData {
    pub message: SolanaMessage,
    pub signatures: Vec<String>,
}

#[derive(Debug, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct SolanaMessage {
    pub accountKeys: Vec<serde_json::Value>,
    pub instructions: Vec<serde_json::Value>,
}

#[async_trait]
impl Decoder for SolanaDecoder {
    fn chain_name(&self) -> &'static str {
        "solana"
    }

    async fn decode(&self, tx_hash: &str, rpc_url: &str) -> Result<NormalizedTransaction> {
        let client = reqwest::Client::new();

        let raw_tx = fetch_transaction(&client, rpc_url, tx_hash)
            .await
            .context("Failed to fetch Solana transaction")?;

        let normalized = sol_normalizer::normalize(tx_hash.to_string(), raw_tx);
        Ok(normalized)
    }
}

async fn fetch_transaction(
    client: &reqwest::Client,
    rpc_url: &str,
    signature: &str,
) -> Result<RawSolanaTransaction> {
    let body = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "getTransaction",
        "params": [
            signature,
            {
                "encoding": "json",
                "maxSupportedTransactionVersion": 0,
                "commitment": "confirmed"
            }
        ]
    });

    let resp: SolanaRpcResponse<RawSolanaTransaction> = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await?
        .json()
        .await?;

    if let Some(err) = resp.error {
        anyhow::bail!("Solana RPC error: {}", err.message);
    }

    resp.result.context("Transaction not found on Solana")
}