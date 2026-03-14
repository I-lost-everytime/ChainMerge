use crate::decoder::ethereum::{RawEthLog, RawEthReceipt, RawEthTransaction, ERC20_TRANSFER_TOPIC};
use crate::models::*;

pub fn normalize(
    tx: RawEthTransaction,
    receipt: RawEthReceipt,
    timestamp: Option<u64>,
) -> NormalizedTransaction {
    let block_number = tx
        .block_number
        .as_deref()
        .map(|h| u64::from_str_radix(h.trim_start_matches("0x"), 16).unwrap_or(0));

    let status = match receipt.status.as_deref() {
        Some("0x1") => TxStatus::Success,
        Some("0x0") => TxStatus::Failed,
        _ => TxStatus::Pending,
    };

    let gas_used = u64::from_str_radix(
        receipt.gas_used.trim_start_matches("0x"),
        16,
    ).unwrap_or(0);

    let gas_price = tx
        .gas_price
        .as_deref()
        .or(tx.max_fee_per_gas.as_deref())
        .map(|h| u64::from_str_radix(h.trim_start_matches("0x"), 16).unwrap_or(0))
        .unwrap_or(0);

    let fee_wei = gas_used.saturating_mul(gas_price);

    let value_wei = u128::from_str_radix(
        tx.value.trim_start_matches("0x"),
        16,
    ).unwrap_or(0);

    let mut events = decode_logs(&receipt.logs);

    if value_wei > 0 {
        if let Some(to) = &tx.to {
            events.insert(0, Event::NativeTransfer(NativeTransferEvent {
                from: tx.from.clone(),
                to: to.clone(),
                amount: value_wei.to_string(),
                symbol: "ETH".to_string(),
            }));
        }
    }

    if events.is_empty() && tx.to.is_some() && tx.input != "0x" {
        events.push(Event::ContractCall(ContractCallEvent {
            contract: tx.to.clone().unwrap_or_default(),
            method: extract_method_signature(&tx.input),
            inputs: None,
        }));
    }

    let decode_error = if events.iter().any(|e| matches!(e, Event::Unknown(_))) {
        Some("One or more events could not be fully decoded".to_string())
    } else {
        None
    };

    NormalizedTransaction {
        chain: "ethereum".to_string(),
        tx_hash: tx.hash.clone(),
        block_number,
        timestamp,
        status,
        sender: tx.from.clone(),
        receiver: tx.to.clone(),
        value: TokenAmount {
            amount: value_wei.to_string(),
            symbol: "ETH".to_string(),
            decimals: 18,
        },
        fee: TokenAmount {
            amount: fee_wei.to_string(),
            symbol: "ETH".to_string(),
            decimals: 18,
        },
        events,
        raw_data: None,
        decode_error,
    }
}

fn decode_logs(logs: &[RawEthLog]) -> Vec<Event> {
    logs.iter().map(|log| decode_log(log)).collect()
}

fn decode_log(log: &RawEthLog) -> Event {
    let topic0 = log.topics.first().map(|s| s.as_str()).unwrap_or("");
    match topic0 {
        ERC20_TRANSFER_TOPIC => decode_erc20_transfer(log),
        _ => Event::Unknown(UnknownEvent {
            raw: log.data.clone(),
            reason: Some(format!("Unrecognized event topic: {}", topic0)),
        }),
    }
}

fn decode_erc20_transfer(log: &RawEthLog) -> Event {
    if log.topics.len() < 3 {
        return Event::Unknown(UnknownEvent {
            raw: log.data.clone(),
            reason: Some("ERC-20 Transfer log missing topics".to_string()),
        });
    }

    let from = format!("0x{}", &log.topics[1][26..]);
    let to = format!("0x{}", &log.topics[2][26..]);

    let amount = u128::from_str_radix(
        log.data.trim_start_matches("0x"),
        16,
    ).unwrap_or(0).to_string();

    Event::TokenTransfer(TokenTransferEvent {
        token: TokenInfo {
            address: log.address.clone(),
            symbol: None,
            decimals: 18,
        },
        from,
        to,
        amount,
    })
}

fn extract_method_signature(input: &str) -> Option<String> {
    let hex = input.trim_start_matches("0x");
    if hex.len() >= 8 {
        Some(format!("0x{}", &hex[..8]))
    } else {
        None
    }
}