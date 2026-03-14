mod decoder;
mod models;
mod normalizer;

use axum::{
    extract::Query,
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use decoder::get_decoder;
use serde::{Deserialize, Serialize};
use std::env;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;

#[derive(Deserialize)]
struct DecodeParams {
    chain: String,
    hash: String,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
    code: String,
}

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();
    tracing_subscriber::fmt::init();

    let port = env::var("RUST_SERVER_PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/decode", get(decode_transaction))
        .layer(cors);

    info!("ChainMerge Rust engine starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "ok",
        "engine": "ChainMerge Lite",
        "version": "0.1.0",
        "supported_chains": ["ethereum", "solana"]
    }))
}

async fn decode_transaction(
    Query(params): Query<DecodeParams>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<ErrorResponse>)> {
    if params.hash.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: "Transaction hash is required".to_string(),
                code: "MISSING_HASH".to_string(),
            }),
        ));
    }

    let decoder = get_decoder(&params.chain).ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorResponse {
                error: format!("Unsupported chain: '{}'. Supported: ethereum, solana", params.chain),
                code: "UNSUPPORTED_CHAIN".to_string(),
            }),
        )
    })?;

    let rpc_url = get_rpc_url(&params.chain).ok_or_else(|| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorResponse {
                error: format!("RPC URL not configured for chain: {}", params.chain),
                code: "RPC_NOT_CONFIGURED".to_string(),
            }),
        )
    })?;

    match decoder.decode(&params.hash, &rpc_url).await {
        Ok(normalized) => {
            info!("Decoded {} tx: {}", params.chain, params.hash);
            Ok(Json(serde_json::to_value(normalized).unwrap()))
        }
        Err(e) => {
            let err_str = e.to_string();
            let (code, status) = if err_str.contains("not found") {
                ("TX_NOT_FOUND", StatusCode::NOT_FOUND)
            } else if err_str.contains("RPC") {
                ("RPC_ERROR", StatusCode::BAD_GATEWAY)
            } else {
                ("DECODE_ERROR", StatusCode::INTERNAL_SERVER_ERROR)
            };

            Err((
                status,
                Json(ErrorResponse {
                    error: err_str,
                    code: code.to_string(),
                }),
            ))
        }
    }
}

fn get_rpc_url(chain: &str) -> Option<String> {
    match chain.to_lowercase().as_str() {
        "ethereum" | "eth" => env::var("ETH_RPC_URL").ok(),
        "solana" | "sol"   => env::var("SOL_RPC_URL").ok(),
        // Tier 2 simulated chains don't need real RPC
        "sui" | "polkadot" | "dot" | "bitcoin" | "btc" | "starknet" | "strk"
        | "cosmos" | "atom" | "aptos" | "apt" => {
            Some("simulated".to_string())
        }
        _ => None,
    }
}