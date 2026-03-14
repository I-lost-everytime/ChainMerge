import { ChainMergeClient } from "chainmerge-sdk";
import type { NormalizedTransaction } from "chainmerge-sdk";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const baseUrl = process.env.CHAINMERGE_BASE_URL || "https://api.chainmerge.io";
const apiKey = process.env.CHAINMERGE_API_KEY;

export class ExtendedChainMergeClient extends ChainMergeClient {
  public async listRecentIndexedTxs(limit: number = 20): Promise<NormalizedTransaction[]> {
    const res = await fetch(`${baseUrl}/api/index/recent?limit=${limit}`);
    if (!res.ok) {
      // If endpoint doesn't exist, return empty array to prevent crashing
      console.warn(`[ChainMergeClient] /api/index/recent returned ${res.status}. Returning empty.`);
      return [];
    }
    return res.json();
  }
}

/**
 * Shared, configured instance of the ChainMerge SDK client.
 */
export const chainmergeClient = new ExtendedChainMergeClient({
  baseUrl,
  apiKey,
});
