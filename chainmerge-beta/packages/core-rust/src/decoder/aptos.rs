use super::Decoder;
use crate::models::*;
use crate::normalizer::aptos as aptos_normalizer;
use anyhow::{Context, Result};
use async_trait::async_trait;
use serde::Deserialize;

pub struct AptosDecoder;

// ─── Raw REST response types ──────────────────────────────────────────────────

#[derive(Debug, Deserialize, Clone)]
pub struct AptosTransaction {
    pub hash: String,
    pub version: Option<String>,
    pub state_change_hash: Option<String>,
    #[serde(rename = "type")]
    pub tx_type: String,
    pub sender: Option<String>,
    pub sequence_number: Option<String>,
    pub gas_unit_price: Option<String>,
    pub gas_used: Option<String>,
    pub max_gas_amount: Option<String>,
    pub expiration_timestamp_secs: Option<String>,
    pub timestamp: Option<String>,
    pub success: Option<bool>,
    pub vm_status: Option<String>,
    pub payload: Option<AptosPayload>,
    pub events: Option<Vec<AptosEvent>>,
    pub changes: Option<Vec<serde_json::Value>>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AptosPayload {
    #[serde(rename = "type")]
    pub payload_type: Option<String>,
    pub function: Option<String>,
    pub arguments: Option<Vec<serde_json::Value>>,
    pub type_arguments: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AptosEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub data: Option<serde_json::Value>,
    pub guid: Option<serde_json::Value>,
    pub sequence_number: Option<String>,
}

// ─── Decoder ─────────────────────────────────────────────────────────────────

#[async_trait]
impl Decoder for AptosDecoder {
    fn chain_name(&self) -> &'static str {
        "aptos"
    }

    async fn decode(&self, tx_hash: &str, rpc_url: &str) -> Result<NormalizedTransaction> {
        let client = reqwest::Client::new();

        // Aptos REST API
        let url = format!(
            "{}/v1/transactions/by_hash/{}",
            rpc_url.trim_end_matches('/'),
            tx_hash
        );

        let resp = client
            .get(&url)
            .header("Accept", "application/json")
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await
            .context("Failed to reach Aptos RPC")?;

        if resp.status() == 404 {
            anyhow::bail!("Transaction not found on Aptos");
        }

        let tx: AptosTransaction = resp
            .json()
            .await
            .context("Failed to parse Aptos response")?;

        Ok(aptos_normalizer::normalize(tx))
    }
}