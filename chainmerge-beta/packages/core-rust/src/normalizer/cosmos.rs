use crate::decoder::cosmos::CosmosTxResult;
use crate::models::*;

pub fn normalize(tx: CosmosTxResult) -> NormalizedTransaction {
    let block_number = tx.height.parse::<u64>().ok();

    let status = if tx.code == 0 {
        TxStatus::Success
    } else {
        TxStatus::Failed
    };

    // Parse timestamp
    let timestamp = parse_cosmos_timestamp(&tx.timestamp);

    // Extract fee
    let fee = tx
        .tx
        .as_ref()
        .and_then(|t| t.auth_info.as_ref())
        .and_then(|a| a.fee.as_ref())
        .and_then(|f| f.amount.first())
        .map(|coin| TokenAmount {
            amount: coin.amount.clone(),
            symbol: denom_to_symbol(&coin.denom),
            decimals: 6,
        })
        .unwrap_or(TokenAmount {
            amount: "0".to_string(),
            symbol: "ATOM".to_string(),
            decimals: 6,
        });

    // Extract events from logs
    let mut events = Vec::new();
    let mut sender = String::new();
    let mut receiver = None;

    // Parse messages
    if let Some(tx_body) = tx.tx.as_ref().and_then(|t| t.body.as_ref()) {
        for msg in &tx_body.messages {
            let msg_type = msg.get("@type")
                .and_then(|v| v.as_str())
                .unwrap_or("");

            match msg_type {
                "/cosmos.bank.v1beta1.MsgSend" => {
                    let from = msg.get("from_address")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    let to = msg.get("to_address")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();

                    if sender.is_empty() { sender = from.clone(); }
                    receiver = Some(to.clone());

                    // Extract amounts
                    if let Some(amounts) = msg.get("amount").and_then(|a| a.as_array()) {
                        for coin in amounts {
                            let denom = coin.get("denom")
                                .and_then(|v| v.as_str())
                                .unwrap_or("uatom");
                            let amount = coin.get("amount")
                                .and_then(|v| v.as_str())
                                .unwrap_or("0");

                            events.push(Event::TokenTransfer(TokenTransferEvent {
                                token: TokenInfo {
                                    address: denom.to_string(),
                                    symbol: Some(denom_to_symbol(denom)),
                                    decimals: 6,
                                },
                                from: from.clone(),
                                to: to.clone(),
                                amount: amount.to_string(),
                            }));
                        }
                    }
                }
                _ => {
                    events.push(Event::ContractCall(ContractCallEvent {
                        contract: "cosmos-hub".to_string(),
                        method: Some(msg_type.to_string()),
                        inputs: Some(msg.clone()),
                    }));
                }
            }
        }
    }

    let decode_error = if events.is_empty() {
        Some("No recognized message types found".to_string())
    } else {
        None
    };

    NormalizedTransaction {
        chain: "cosmos".to_string(),
        tx_hash: tx.txhash.clone(),
        block_number,
        timestamp,
        status,
        sender,
        receiver,
        value: TokenAmount {
            amount: "0".to_string(),
            symbol: "ATOM".to_string(),
            decimals: 6,
        },
        fee,
        events,
        raw_data: None,
        decode_error,
    }
}

fn denom_to_symbol(denom: &str) -> String {
    match denom {
        "uatom" => "ATOM".to_string(),
        "uosmo" => "OSMO".to_string(),
        "uusdc" => "USDC".to_string(),
        _ => denom.to_uppercase(),
    }
}

fn parse_cosmos_timestamp(ts: &str) -> Option<u64> {
    // Cosmos timestamps look like: "2024-05-20T12:00:00Z"
    // Simple approach: just return None if we can't parse
    // In production use chrono crate
    let _ = ts;
    None
}