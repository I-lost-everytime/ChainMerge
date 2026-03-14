use crate::decoder::aptos::AptosTransaction;
use crate::models::*;

pub fn normalize(tx: AptosTransaction) -> NormalizedTransaction {
    let status = if tx.success.unwrap_or(false) {
        TxStatus::Success
    } else {
        TxStatus::Failed
    };

    let block_number = tx.version
        .as_deref()
        .and_then(|v| v.parse::<u64>().ok());

    let timestamp = tx.timestamp
        .as_deref()
        .and_then(|t| t.parse::<u64>().ok())
        .map(|t| t / 1_000_000); // Aptos uses microseconds

    // Calculate fee
    let gas_used = tx.gas_used.as_deref()
        .and_then(|g| g.parse::<u64>().ok())
        .unwrap_or(0);
    let gas_price = tx.gas_unit_price.as_deref()
        .and_then(|g| g.parse::<u64>().ok())
        .unwrap_or(0);
    let fee_amount = gas_used.saturating_mul(gas_price);

    let sender = tx.sender.clone().unwrap_or_default();

    // Decode events
    let mut events = Vec::new();
    let mut receiver = None;

    if let Some(aptos_events) = &tx.events {
        for event in aptos_events {
            match event.event_type.as_str() {
                // Coin transfer event
                e if e.contains("coin::DepositEvent") || e.contains("CoinDeposit") => {
                    let amount = event.data.as_ref()
                        .and_then(|d| d.get("amount"))
                        .and_then(|a| a.as_str())
                        .unwrap_or("0")
                        .to_string();

                    events.push(Event::NativeTransfer(NativeTransferEvent {
                        from: sender.clone(),
                        to: extract_address_from_event(&event.data),
                        amount,
                        symbol: "APT".to_string(),
                    }));
                }
                // Token transfer
                e if e.contains("TransferEvent") || e.contains("transfer") => {
                    let amount = event.data.as_ref()
                        .and_then(|d| d.get("amount"))
                        .and_then(|a| a.as_str())
                        .unwrap_or("0")
                        .to_string();

                    let to = extract_address_from_event(&event.data);
                    if receiver.is_none() { receiver = Some(to.clone()); }

                    events.push(Event::TokenTransfer(TokenTransferEvent {
                        token: TokenInfo {
                            address: extract_token_type(&event.event_type),
                            symbol: None,
                            decimals: 8,
                        },
                        from: sender.clone(),
                        to,
                        amount,
                    }));
                }
                _ => {}
            }
        }
    }

    // If no events, check payload for function call
    if events.is_empty() {
        if let Some(payload) = &tx.payload {
            if let Some(func) = &payload.function {
                events.push(Event::ContractCall(ContractCallEvent {
                    contract: func.split("::").next().unwrap_or("").to_string(),
                    method: Some(func.clone()),
                    inputs: payload.arguments.as_ref().map(|a| serde_json::json!(a)),
                }));
            }
        }
    }

    let decode_error = if events.is_empty() {
        Some("No recognized events found".to_string())
    } else {
        None
    };

    NormalizedTransaction {
        chain: "aptos".to_string(),
        tx_hash: tx.hash.clone(),
        block_number,
        timestamp,
        status,
        sender,
        receiver,
        value: TokenAmount {
            amount: "0".to_string(),
            symbol: "APT".to_string(),
            decimals: 8,
        },
        fee: TokenAmount {
            amount: fee_amount.to_string(),
            symbol: "APT".to_string(),
            decimals: 8,
        },
        events,
        raw_data: None,
        decode_error,
    }
}

fn extract_address_from_event(data: &Option<serde_json::Value>) -> String {
    data.as_ref()
        .and_then(|d| d.get("account"))
        .or_else(|| data.as_ref().and_then(|d| d.get("to")))
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string()
}

fn extract_token_type(event_type: &str) -> String {
    // Extract token type from event type string
    // e.g. "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    if let Some(start) = event_type.find('<') {
        if let Some(end) = event_type.rfind('>') {
            return event_type[start+1..end].to_string();
        }
    }
    event_type.to_string()
}