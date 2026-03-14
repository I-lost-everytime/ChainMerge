import { createGovernanceAgent } from "./governance/agent.js";

const CHAINMERGE_API = process.env.CHAINMERGE_BASE_URL || "http://127.0.0.1:8080";

/**
 * Fetches the most recent indexed transactions from the ChainMerge local API.
 */
async function fetchRecentTransactions(limit = 5) {
  const url = `${CHAINMERGE_API}/api/index/recent?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ChainMerge API error: ${res.status}`);
  const data = (await res.json()) as { items: any[] };
  return data.items;
}

async function main() {
  console.log("🏛️  IQ AI × ChainMerge | Governance Analyzer Agent");
  console.log("================================================");

  // 1. Boot the IQ AI ADK governance agent
  const { runner } = await createGovernanceAgent();
  console.log("✅ Governance Analyzer Agent online.\n");

  // 2. Pull real data from the locally running ChainMerge codec
  console.log("📡 Fetching live indexed transactions from ChainMerge...\n");
  const txs = await fetchRecentTransactions(5);

  if (txs.length === 0) {
    console.log("⚠️  No indexed transactions found yet. Try decoding a tx via /api/decode first.");
    return;
  }

  // 3. Feed each normalized transaction into the ADK Governance Agent
  for (const tx of txs) {
    console.log(`\n──────────────────────────────────────────`);
    console.log(`🔗 Analyzing tx on ${tx.chain.toUpperCase()}: ${tx.tx_hash}`);
    console.log(`──────────────────────────────────────────`);

    const prompt = `
Analyze the following on-chain transaction from the ChainMerge multichain codec and assess its governance significance:

${JSON.stringify(tx, null, 2)}

Key questions to answer:
1. Is this transaction related to any DAO or governance protocol interaction?
2. What is the estimated voting weight or influence of the sender based on the value/token movement?
3. Should stakeholders be alerted? Rate severity: LOW / MEDIUM / HIGH.
4. What would be the recommended IQ AI autonomous action?
    `;

    const response = await runner.ask(prompt);
    console.log("\n🤖 Governance Analyst Says:\n");
    console.log(response);
  }

  console.log("\n✅ Governance analysis session complete.");
}

main().catch(console.error);
