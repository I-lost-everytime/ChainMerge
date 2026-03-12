export type Chain =
  | "solana"
  | "ethereum"
  | "cosmos"
  | "aptos"
  | "sui"
  | "polkadot"
  | "bitcoin"
  | "starknet";

export type EventType = "token_transfer" | "unsupported";

export interface NormalizedEvent {
  event_type: EventType;
  token?: string;
  from?: string;
  to?: string;
  amount?: string;
  raw_program?: string;
}

export type ActionType =
  | "transfer"
  | "swap"
  | "nft_transfer"
  | "stake"
  | "bridge"
  | "unknown";

export interface Action {
  action_type: ActionType;
  from?: string;
  to?: string;
  amount?: string;
  token?: string;
  metadata?: unknown;
}

export interface NormalizedTransaction {
  chain: Chain;
  tx_hash: string;
  sender?: string;
  receiver?: string;
  value?: string;
  events: NormalizedEvent[];
  actions: Action[];
}

export interface ErrorEnvelope {
  code: string;
  message: string;
  retryable: boolean;
}

export interface DecodeSuccessEnvelope {
  decoded: NormalizedTransaction;
}

export interface DecodeErrorEnvelope {
  error: ErrorEnvelope;
}
