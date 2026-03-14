import { AgentBuilder } from "@iqai/adk";
import * as dotenv from "dotenv";

dotenv.config();

export async function createGovernanceAgent() {
  return await AgentBuilder.create("governance_analyzer")
    .withModel("gemini-2.5-flash")
    .withDescription(
      "An on-chain governance analysis agent built to monitor DAO health, interpret vote weight events, and optionally alert stakeholders.",
    )
    .withInstruction(
      `You are an On-Chain Governance Analyzer. 
      Your task is to review transaction metadata detailing generic smart contract calls and vote events across DAOs.
      You should output a structured analysis estimating the severity/impact of the vote based on the sender's weight and the target contract.
      If the movement is highly unusual or massive, recommend an ALERT.`
    )
    .build();
}
