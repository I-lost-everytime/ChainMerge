use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NormalizedTransaction {
    pub chain: String,
    pub tx_hash: String,
    pub block_number: Option<u64>,
    pub timestamp: Option<u64>,
    pub status: TxStatus,
    pub sender: String,
    pub receiver: Option<String>,
    pub value: TokenAmount,
    pub fee: TokenAmount,
    pub events: Vec<Event>,
    pub raw_data: Option<serde_json::Value>,
    pub decode_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TxStatus {
    Success,
    Failed,
    Pending,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenAmount {
    pub amount: String,
    pub symbol: String,
    pub decimals: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Event {
    TokenTransfer(TokenTransferEvent),
    NativeTransfer(NativeTransferEvent),
    ContractCall(ContractCallEvent),
    Unknown(UnknownEvent),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenTransferEvent {
    pub token: TokenInfo,
    pub from: String,
    pub to: String,
    pub amount: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenInfo {
    pub address: String,
    pub symbol: Option<String>,
    pub decimals: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NativeTransferEvent {
    pub from: String,
    pub to: String,
    pub amount: String,
    pub symbol: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractCallEvent {
    pub contract: String,
    pub method: Option<String>,
    pub inputs: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnknownEvent {
    pub raw: String,
    pub reason: Option<String>,
}