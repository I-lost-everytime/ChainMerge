use super::Decoder;
use crate::models::*;
use crate::normalizer::cosmos as cosmos_normalizer;
use anyhow::{Context, Result};
use async_trait::async_trait;
use serde::Deserialize;

pub struct CosmosDecoder;

// ─── Raw REST response types ──────────────────────────────────────────────────

#[derive(Debug, Deserialize, Clone)]
pub struct CosmosTxResponse {
    pub tx_response: Option<CosmosTxResult>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CosmosTxResult {
    pub txhash: String,
    pub height: String,
    pub timestamp: String,
    pub code: u64,
    pub gas_used: String,
    pub gas_wanted: String,
    pub tx: Option<CosmosTx>,
    pub logs: Option<Vec<CosmosLog>>,
    pub events: Option<Vec<CosmosEvent>>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CosmosTx {
    pub body: Option<CosmosTxBody>,
    pub auth_info: Option<CosmosAuthInfo>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CosmosTxBody {
    pub messages: Vec<serde_json::Value>,
    pub memo: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CosmosAuthInfo {
    pub fee: Option<CosmosFee>,
    pub signer_infos: Option<Vec<serde_json::Value>>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CosmosFee {
    pub amount: Vec<CosmosCoin>,
    pub gas_limit: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CosmosCoin {
    pub denom: String,
    pub amount: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CosmosLog {
    pub events: Vec<CosmosEvent>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CosmosEvent {
    #[serde(rename = "type")]
    pub event_type: String,
    pub attributes: Vec<CosmosAttribute>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CosmosAttribute {
    pub key: String,
    pub value: Option<String>,
}

// ─── Decoder ─────────────────────────────────────────────────────────────────

#[async_trait]
impl Decoder for CosmosDecoder {
    fn chain_name(&self) -> &'static str {
        "cosmos"
    }

    async fn decode(&self, tx_hash: &str, rpc_url: &str) -> Result<NormalizedTransaction> {
        let client = reqwest::Client::new();

        // Cosmos LCD REST API — much simpler than raw Protobuf
        let url = format!("{}/cosmos/tx/v1beta1/txs/{}", rpc_url.trim_end_matches('/'), tx_hash);

        let resp = client
            .get(&url)
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await
            .context("Failed to reach Cosmos RPC")?;

        if resp.status() == 404 {
            anyhow::bail!("Transaction not found on Cosmos");
        }

        let tx_response: CosmosTxResponse = resp
            .json()
            .await
            .context("Failed to parse Cosmos response")?;

        let tx_result = tx_response
            .tx_response
            .context("Transaction not found")?;

        Ok(cosmos_normalizer::normalize(tx_result))
    }
}