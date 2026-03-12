import type { Chain, DecodeErrorEnvelope, DecodeSuccessEnvelope, NormalizedTransaction } from "./types.js";

export interface ChainCodecClientOptions {
  /**
   * Base URL of the ChainCodec API, e.g.:
   * - "http://127.0.0.1:8080" for local development
   * - "https://api.chaincodec.io" for a hosted deployment
   *
   * Do not include a trailing slash.
   */
  baseUrl: string;

  /**
   * Optional API key that will be sent as "x-api-key".
   */
  apiKey?: string;

  /**
   * Custom fetch implementation for environments where "fetch"
   * is not globally available (e.g. Node < 18).
   */
  fetchImpl?: typeof fetch;
}

export class ChainCodecClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ChainCodecClientOptions) {
    if (!options.baseUrl) {
      throw new Error("ChainCodecClient: baseUrl is required");
    }

    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /**
   * Decode a single transaction into a normalized representation.
   */
  async decodeTx(params: {
    chain: Chain;
    hash: string;
    rpcUrl?: string;
  }): Promise<NormalizedTransaction> {
    const search = new URLSearchParams({
      chain: params.chain,
      hash: params.hash.trim(),
    });

    if (params.rpcUrl?.trim()) {
      search.set("rpc_url", params.rpcUrl.trim());
    }

    const url = `${this.baseUrl}/api/decode?${search.toString()}`;

    const res = await this.fetchImpl(url, {
      headers: {
        ...(this.apiKey ? { "x-api-key": this.apiKey } : null),
      },
    });

    const body = (await res.json()) as
      | DecodeSuccessEnvelope
      | DecodeErrorEnvelope;

    if (!res.ok) {
      const envelope = body as DecodeErrorEnvelope;
      const error = new Error(envelope.error.message);
      (error as any).code = envelope.error.code;
      (error as any).retryable = envelope.error.retryable;
      throw error;
    }

    const envelope = body as DecodeSuccessEnvelope;
    return envelope.decoded;
  }
}
