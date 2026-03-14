use crate::decoder::solana::{RawSolanaTransaction, TokenBalance};
use crate::models::*;
use std::collections::HashMap;

pub fn normalize(tx_hash: String, raw: RawSolanaTransaction) -> NormalizedTransaction {
    let meta = raw.meta.as_ref();

    let sender = raw
        .transaction
        .message
        .accountKeys
        .first()
        .and_then(|k| k.as_str())
        .unwrap_or_default()
        .to_string();

    let status = match meta.and_then(|m| m.err.as_ref()) {
        None => TxStatus::Success,
        Some(_) => TxStatus::Failed,
    };

    let fee = meta.map(|m| m.fee).unwrap_or(0);

    let pre_balances = meta.map(|m| m.preBalances.clone()).unwrap_or_default();
    let post_balances = meta.map(|m| m.postBalances.clone()).unwrap_or_default();

    let account_keys: Vec<String> = raw
        .transaction
        .message
        .accountKeys
        .iter()
        .filter_map(|k| k.as_str().map(|s| s.to_string()))
        .collect();

    let mut events: Vec<Event> = Vec::new();

    let token_events = extract_token_transfers(
        meta.and_then(|m| m.preTokenBalances.as_ref()).unwrap_or(&vec![]),
        meta.and_then(|m| m.postTokenBalances.as_ref()).unwrap_or(&vec![]),
        &account_keys,
    );
    events.extend(token_events);

    let sol_events = extract_sol_transfers(&pre_balances, &post_balances, &account_keys, &sender);
    events.extend(sol_events);

    if events.is_empty() {
        events.push(Event::Unknown(UnknownEvent {
            raw: sender.clone(),
            reason: Some("No recognized SPL token transfer found".to_string()),
        }));
    }

    let decode_error = if events.iter().any(|e| matches!(e, Event::Unknown(_))) {
        Some("One or more instructions could not be decoded".to_string())
    } else {
        None
    };

    NormalizedTransaction {
        chain: "solana".to_string(),
        tx_hash,
        block_number: raw.slot,
        timestamp: raw.blockTime,
        status,
        sender,
        receiver: None,
        value: TokenAmount {
            amount: "0".to_string(),
            symbol: "SOL".to_string(),
            decimals: 9,
        },
        fee: TokenAmount {
            amount: fee.to_string(),
            symbol: "SOL".to_string(),
            decimals: 9,
        },
        events,
        raw_data: None,
        decode_error,
    }
}

fn extract_token_transfers(
    pre: &[TokenBalance],
    post: &[TokenBalance],
    account_keys: &[String],
) -> Vec<Event> {
    let pre_map: HashMap<usize, &TokenBalance> =
        pre.iter().map(|b| (b.accountIndex, b)).collect();

    let mut events = Vec::new();

    for post_bal in post {
        let pre_amount: u128 = pre_map
            .get(&post_bal.accountIndex)
            .map(|b| b.uiTokenAmount.amount.parse().unwrap_or(0))
            .unwrap_or(0);

        let post_amount: u128 = post_bal.uiTokenAmount.amount.parse().unwrap_or(0);

        if post_amount > pre_amount {
            let receiver_account = account_keys
                .get(post_bal.accountIndex)
                .cloned()
                .unwrap_or_default();

            let received = post_amount - pre_amount;

            let sender_account = pre
                .iter()
                .find(|b| {
                    b.mint == post_bal.mint && b.accountIndex != post_bal.accountIndex
                })
                .and_then(|b| account_keys.get(b.accountIndex))
                .cloned()
                .unwrap_or_default();

            events.push(Event::TokenTransfer(TokenTransferEvent {
                token: TokenInfo {
                    address: post_bal.mint.clone(),
                    symbol: None,
                    decimals: post_bal.uiTokenAmount.decimals,
                },
                from: sender_account,
                to: receiver_account,
                amount: received.to_string(),
            }));
        }
    }

    events
}

fn extract_sol_transfers(
    pre: &[u64],
    post: &[u64],
    account_keys: &[String],
    fee_payer: &str,
) -> Vec<Event> {
    let mut events = Vec::new();

    for (i, (pre_bal, post_bal)) in pre.iter().zip(post.iter()).enumerate() {
        let account = account_keys.get(i).cloned().unwrap_or_default();

        if account == fee_payer {
            continue;
        }

        if *post_bal > pre_bal.saturating_add(1_000_000) {
            let received = post_bal - pre_bal;

            events.push(Event::NativeTransfer(NativeTransferEvent {
                from: fee_payer.to_string(),
                to: account,
                amount: received.to_string(),
                symbol: "SOL".to_string(),
            }));
        }
    }

    events
}