import type { NormalizedTransaction } from "chainmerge-sdk";
import type { IqAgent } from "./runtime.js";
import { appLogger } from "../../lib/logger.js";

export class WhaleWatcher implements IqAgent {
  public name = "WhaleWatcher";

  public async handleNormalizedTransaction(tx: NormalizedTransaction): Promise<void> {
    if (!tx.events) return;
    
    for (const ev of tx.events) {
      if (ev.event_type !== "token_transfer") continue;

      // Monitor for thresholds over 1M USDC (assuming 6 decimals)
      const size = BigInt(ev.amount ?? "0");
      const isWhale = size > 1_000_000n * (10n ** 6n); 

      if (!isWhale) continue;

      // Phase 1: Logging & Diagnostics
      appLogger.info("🚨 [WhaleWatcher] Massive Move Detected:", {
        chain: tx.chain,
        txHash: tx.tx_hash,
        token: ev.token,
        amount: ev.amount,
        route: `${ev.from} -> ${ev.to}`,
      });

      // Phase 2: Active Strategy Engine & Execution
      appLogger.info("⚡ [WhaleWatcher] Evaluating Portfolio Risk...");
      
      const decision = this.evaluateRisk(ev.amount ?? "0");
      if (decision.action === "HEDGE") {
        appLogger.info(`🛡️ [WhaleWatcher] Executing Hedge: Moving ${decision.rebalanceAmount} USDC to Cold Vault to protect collateral.`);
        // Note: Real on-chain IQ AI execution wrapper goes here
      } else if (decision.action === "CAPITALIZE") {
        appLogger.info(`📈 [WhaleWatcher] Executing Rebalance: Buying ${decision.rebalanceAmount} equivalent of dipped target token.`);
      }
    }
  }

  // Basic mock evaluation logic based on transaction size
  private evaluateRisk(amountStr: string): { action: "HEDGE" | "CAPITALIZE" | "HOLD"; rebalanceAmount: string } {
    const amount = BigInt(amountStr);
    
    // If movement is severely massive (> 5M), trigger defensive hedge
    if (amount > 5_000_000n * (10n ** 6n)) {
      return { action: "HEDGE", rebalanceAmount: "500000" }; 
    }
    
    // If movement is large but moderate (1M - 5M), opportunistic capitalize
    return { action: "CAPITALIZE", rebalanceAmount: "100000" };
  }
}
