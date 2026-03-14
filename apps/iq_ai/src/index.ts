import { chainSignals } from "./services/chainSignals.js";
import { iqAgentRuntime } from "./agents/iq/runtime.js";
import { GovernanceAnalyzer } from "./agents/iq/governanceAnalyzer.js";
import { ChainSignalsService } from "./services/chainSignals.js";
import { startApiServer } from "./api/server.js";
import { appLogger } from "./lib/logger.js";

async function bootstrap() {
  appLogger.info("Starting IQ AI × ChainMerge Orchestrator...");

  // 1. Register Active Agents
  // We've shifted from WhaleWatcher to full on-chain DAO governance monitoring
  iqAgentRuntime.registerAgent(new GovernanceAnalyzer());

  // 2. Start Developer API & Dashboard
  const port = parseInt(process.env.PORT || "3000", 10);
  startApiServer(port);

  // 3. Start Multi-chain Edge Signals
  const signalService = new ChainSignalsService(15000);
  signalService.start();

  // Graceful Shutdown
  process.on("SIGINT", () => {
    appLogger.info("Shutting down Orchestrator gracefully...");
    signalService.stop();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal error during bootstrap:", err);
  process.exit(1);
});
