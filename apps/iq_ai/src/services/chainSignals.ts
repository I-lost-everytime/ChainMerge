import { chainmergeClient } from "../lib/chainmergeClient.js";
import { iqAgentRuntime } from "../agents/iq/runtime.js";
import { appLogger } from "../lib/logger.js";

/**
 * Chain Signals Service
 * Polls the ChainMerge API for newly indexed transactions and forwards them
 * to the IQ AI Agent Runtime.
 */
export class ChainSignalsService {
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(private pollingIntervalMs = 15000) {}

  public start() {
    if (this.timer) return;
    appLogger.info(`[ChainSignals] Starting polling every ${this.pollingIntervalMs}ms`);
    this.timer = setInterval(() => this.poll(), this.pollingIntervalMs);
    // Execute initial poll immediately
    this.poll();
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      appLogger.info("[ChainSignals] Polling stopped");
    }
  }

  private async poll() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Fetch up to 20 recent indexed transactions
      const txs = await chainmergeClient.listRecentIndexedTxs(20);
      
      for (const tx of txs) {
        // Evaluate the normalized transaction against all agents
        await iqAgentRuntime.dispatchNormalizedTransaction(tx);
      }
    } catch (error) {
      console.error("[ChainSignals] Error polling ChainMerge:", error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Used for webhook or push-event architectures instead of polling
   */
  public async handleEventDrivenTx(chain: any, hash: string) {
    try {
      const tx = await chainmergeClient.decodeTx({ chain, hash });
      await iqAgentRuntime.dispatchNormalizedTransaction(tx);
    } catch (error) {
      console.error(`[ChainSignals] Error handling specific tx ${hash} on ${chain}:`, error);
    }
  }
}

// Export a singleton
export const chainSignals = new ChainSignalsService();
