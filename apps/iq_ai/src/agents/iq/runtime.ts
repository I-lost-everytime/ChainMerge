import type { NormalizedTransaction } from "chainmerge-sdk";
import { appLogger } from "../../lib/logger.js";

export interface IqAgent {
  name: string;
  handleNormalizedTransaction(tx: NormalizedTransaction): Promise<void>;
}

export class IqAgentRuntime {
  private agents: IqAgent[] = [];

  constructor() {}

  /**
   * Register a new agent into the runtime.
   */
  public registerAgent(agent: IqAgent) {
    this.agents.push(agent);
    appLogger.info(`[IQ Runtime] Registered agent: ${agent.name}`);
  }

  /**
   * Dispatch a transaction to all registered agents concurrently.
   */
  public async dispatchNormalizedTransaction(tx: NormalizedTransaction): Promise<void> {
    const promises = this.agents.map((agent) =>
      agent.handleNormalizedTransaction(tx).catch((err) => {
        console.error(`[IQ Runtime] Agent ${agent.name} failed to process tx ${tx.tx_hash}:`, err);
      })
    );
    await Promise.allSettled(promises);
  }
}

// Export a singleton
export const iqAgentRuntime = new IqAgentRuntime();
