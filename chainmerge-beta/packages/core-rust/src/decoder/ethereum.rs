use super::Decoder;
use crate::models::*;
use crate::normalizer::ethereum as eth_normalizer;
use anyhow::{Context, Result};
use async_trait::async_trait;
use serde::Deserialize;
use serde_json::json;

pub struct EthereumDecoder;

#[derive(Debug, Deserialize)]
pub struct RpcResponse<T> {
    pub result: Option<T>,
    pub error: Option<RpcError>,
}

#[derive(Debug, Deserialize)]
pub struct RpcError {
    pub message: String,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RawEthTransaction {
    pub hash: String,
    pub from: String,
    pub to: Option<String>,
    pub value: String,
    pub gas_price: Option<String>,
    pub max_fee_per_gas: Option<String>,
    pub block_number: Option<String>,
    pub input: String,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RawEthReceipt {
    pub status: Option<String>,
    pub gas_used: String,
    pub logs: Vec<RawEthLog>,
    pub block_number: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RawEthLog {
    pub address: String,
    pub topics: Vec<String>,
    pub data: String,
    pub log_index: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RawEthBlock {
    pub timestamp: String,
}

pub const ERC20_TRANSFER_TOPIC: &str =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

#[async_trait]
impl Decoder for EthereumDecoder {
    fn chain_name(&self) -> &'static str {
        "ethereum"
    }

    async fn decode(&self, tx_hash: &str, rpc_url: &str) -> Result<NormalizedTransaction> {
        let client = reqwest::Client::new();

        let tx = fetch_transaction(&client, rpc_url, tx_hash)
            .await
            .context("Failed to fetch transaction")?;

        let receipt = fetch_receipt(&client, rpc_url, tx_hash)
            .await
            .context("Failed to fetch transaction receipt")?;

        let block_number_hex = tx.block_number.clone().unwrap_or_default();
        let timestamp = if !block_number_hex.is_empty() {
            fetch_block_timestamp(&client, rpc_url, &block_number_hex)
                .await
                .unwrap_or(None)
        } else {
            None
        };

        let normalized = eth_normalizer::normalize(tx, receipt, timestamp);
        Ok(normalized)
    }
}

async fn fetch_transaction(
    client: &reqwest::Client,
    rpc_url: &str,
    tx_hash: &str,
) -> Result<RawEthTransaction> {
    let body = json!({
        "jsonrpc": "2.0",
        "method": "eth_getTransactionByHash",
        "params": [tx_hash],
        "id": 1
    });

    let resp: RpcResponse<RawEthTransaction> = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await?
        .json()
        .await?;

    if let Some(err) = resp.error {
        anyhow::bail!("RPC error: {}", err.message);
    }

    resp.result.context("Transaction not found")
}

async fn fetch_receipt(
    client: &reqwest::Client,
    rpc_url: &str,
    tx_hash: &str,
) -> Result<RawEthReceipt> {
    let body = json!({
        "jsonrpc": "2.0",
        "method": "eth_getTransactionReceipt",
        "params": [tx_hash],
        "id": 2
    });

    let resp: RpcResponse<RawEthReceipt> = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await?
        .json()
        .await?;

    if let Some(err) = resp.error {
        anyhow::bail!("RPC error: {}", err.message);
    }

    resp.result.context("Receipt not found — transaction may be pending")
}

async fn fetch_block_timestamp(
    client: &reqwest::Client,
    rpc_url: &str,
    block_number_hex: &str,
) -> Result<Option<u64>> {
    let body = json!({
        "jsonrpc": "2.0",
        "method": "eth_getBlockByNumber",
        "params": [block_number_hex, false],
        "id": 3
    });

    let resp: RpcResponse<RawEthBlock> = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await?
        .json()
        .await?;

    Ok(resp
        .result
        .map(|b| u64::from_str_radix(b.timestamp.trim_start_matches("0x"), 16).unwrap_or(0)))
}