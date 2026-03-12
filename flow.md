Phase 1: Architecture & Schema Design (Day 1 - Morning)
Before writing any code, the team must strictly define the "contract" between the different layers of your application.
Define the Universal Data Schema: Create the standard JSON structure that all decoders will output. This includes standardizing field names for sender, receiver, values, and an events array with standardized types like token_transfer.
Establish the Project Monorepo: Set up a unified repository using a tool like Turborepo or simple workspace folders to house the Rust core, Node.js API, and React frontend in one place.
Set Up RPC Providers: Create accounts on platforms like Alchemy, Infura, or QuickNode to get reliable RPC endpoints for Ethereum and Solana mainnet/testnets.
Phase 2: Core Engine Development in Rust (Day 1 - Afternoon)
This is the most technically complex part of the hackathon. Rust will handle the heavy lifting of parsing raw byte data.
Create the Decoder Trait: Define a common Rust interface (trait) that dictates how a specific chain module should behave (e.g., a function that takes a tx hash and RPC URL, and returns the normalized Rust struct).
Build the EVM/Ethereum Module: Use a Rust library like alloy or ethers-rs. Connect to the Ethereum RPC, fetch the transaction by hash, and decode standard ERC-20 Transfer events using their well-known ABI signatures.
Build the Solana Module: Use solana-client and solana-sdk. Fetch the transaction and use borsh to deserialize the instruction data. Focus exclusively on the SPL Token Program's Transfer and TransferChecked instructions to save time.
Implement the Normalizer: Write mapping functions that convert the chain-specific outputs (EVM logs and Solana instructions) into your unified Rust structs.
Phase 3: Bridge to the Backend API (Day 1 - Evening)
You need a way for your Node.js/Express server to communicate with the Rust core.
Choose an Integration Method: For a hackathon, compiling the Rust code into a Node.js native addon using napi-rs or neon is highly efficient. Alternatively, you can wrap the Rust core in a lightweight Actix-web/Axum server and have Express call it via HTTP.
Build the Express API: Create a simple REST endpoint (e.g., GET /api/decode?chain=solana&hash=123...).
Add Error Handling: Implement basic error catching for invalid transaction hashes, unsupported chains, or RPC timeouts.
Phase 4: Frontend Development (Day 2 - Morning)
The frontend needs to be clean, intuitive, and clearly demonstrate the "unified" nature of your tool to the hackathon judges.
Scaffold the UI: Use React with a framework like Vite and a styling library like Tailwind CSS for rapid development.
Build the Input Component: Create a simple form featuring a dropdown menu to select the blockchain network and a text input field for the transaction hash.
Build the Output Component: Implement a syntax-highlighted JSON viewer component (like react-json-view) to beautifully display the normalized output.
Connect Frontend to Backend: Use fetch or axios to make requests to your Express API and handle loading states (spinners) while the Rust core is fetching and decoding the data.
Phase 5: Integration, Testing & Refinement (Day 2 - Afternoon)
Ensure the tool actually works with real-world data and doesn't crash during a live demo.
Curate Test Transactions: Find 5-10 real, complex transaction hashes on both Ethereum and Solana mainnets (specifically token transfers) to use as guaranteed working examples during your pitch.
Handle Edge Cases: Add fallback logic in the Rust core for when a transaction is not a token transfer (e.g., output an "Unsupported Event Type" rather than crashing the app).
Optimize Speed: Ensure your RPC calls are efficient and the Rust bindings are not leaking memory.
Phase 6: Deployment & Pitch Prep (Day 2 - Evening)
Move the project from localhost to the web so judges can try it themselves.
Deploy the Frontend: Push the React app to Vercel or Netlify.
Deploy the Backend/Core: Containerize the Node.js API (alongside the compiled Rust binary) using Docker and deploy it to a service like Render, Railway, or AWS EC2.
Write the Readme: Document the architecture, the universal JSON schema, and instructions on how to run the project locally.
---

Current Build Progress Mapping
- Phase 1 (contracts/schema): Completed
- Phase 2 (Rust core engine): Completed for primary transfer use-cases
- Phase 3 (backend bridge): Completed with Rust Axum API
- Phase 4 (frontend): Completed MVP UI and connected to backend
- Phase 5 (integration/tests): In progress with unit + fixture tests and live-chain smoke checks
- Phase 6 (deployment): Initial completion with Docker + CI; cloud deployment targets pending
