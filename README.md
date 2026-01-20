# PoEC v2.0 Enterprise Edition (Proof of Economic Consensus)

![Status](https://img.shields.io/badge/Status-Production_Ready-green)
![Version](https://img.shields.io/badge/Version-2.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-purple)

**The World's First Hybrid Financial Forensics Engine.**
PoEC combines deterministic rule-based auditing with probabilistic Graph Neural Networks (GNN) to identify complex financial anomalies (Circular Trading, Smurfing, Wash Trading) across fragmented ledgers. It anchors findings to the Sepolia Blockchain for immutable "Proof of Innocence".

---

## 🚀 Key Features

*   **Hybrid Analysis Engine**: Merges 4 detector types:
    *   🔴 **Deterministic**: Circular Trading, Dense Rings (Collusion), Wash Trading.
    *   🟡 **Probabilistic (AI)**: GNN-detected Structural Anomalies using PyTorch Geometric.
    *   🔵 **Learned**: Persistent behavioral outliers over time.
    *   ⚪ **Watchlist**: Low-confidence signals for auditor review.
*   **x402 Agent Runtime**: Autonomous TypeScript agent that handles data ingestion, analysis, proof bundling, and blockchain anchoring.
*   **Immutable Evidence**: Result snapshots are hashed and anchored to the **ResultAnchor** smart contract on Sepolia/Monad.
*   **Zero-Knowledge Ready**: Architecture prepared for client-side proving.

---

## 🛠️ Architecture & Tech Stack

### 1. Backend (The Brain)
*   **Framework**: FastAPI (Python 3.10)
*   **Core Logic**: NetworkX (Graph Ops), PyTorch Geometric (GNN)
*   **Database**: SQLite (Dev) / Postgres (Prod)
*   **Deployment**: Dockerized (Compatible with Render/NodeOps)

### 2. Frontend (The Console)
*   **Framework**: Next.js 14 (TypeScript)
*   **UI Library**: TailwindCSS, Framer Motion, Lucide Icons
*   **Visualization**: Cytoscape.js for interactive graph rendering

### 3. Smart Contracts (The Trust Layer)
*   **Network**: Sepolia / Monad Testnet
*   **Contracts**: `ResultAnchor.sol`, `AgentRegistry.sol`
*   **Tooling**: Hardhat

---

## ⚡ Deployment Instructions

### A. Smart Contracts
1.  Navigate to `contracts/`.
2.  Create `.env` with `DEPLOYER_PRIVATE_KEY` and optional `SEPOLIA_RPC_URL`.
3.  Deploy:
    ```bash
    npx hardhat run scripts/deploy_result_anchor.js --network sepolia
    ```
4.  **Save the Output Address**.

### B. Backend API (Docker/Render)
1.  Deploy the `backend/` directory as a Docker container.
2.  Set Environment Variables:
    *   `POEC_ENV`: `production`
    *   `ANCHOR_CONTRACT_ADDRESS`: (Address from Step A)
    *   `ETHEREUM_NODE_URL`: `https://rpc.sepolia.org` (or Alchemy/Infura)
    *   `DEPLOYER_PRIVATE_KEY`: (Your Agent Wallet Key)

### C. Frontend UI (Vercel)
1.  Deploy the root directory to Vercel (Next.js preset).
2.  Set Environment Variable:
    *   `NEXT_PUBLIC_API_URL`: (The URL of your deployed Backend)

---

## 💻 Local Development

1.  **Backend**:
    ```bash
    cd backend
    pip install -r requirements.txt
    uvicorn app.main:app --reload
    ```

2.  **Contracts**:
    ```bash
    cd contracts
    npx hardhat node
    npx hardhat run scripts/deploy_result_anchor.js --network localhost
    ```

3.  **Frontend**:
    ```bash
    npm install
    npm run dev
    ```

---

## 📚 API Documentation

Once the backend is running, full Swagger UI documentation is available at:
*   **Local**: `http://localhost:8000/docs`
*   **Prod**: `https://your-backend-url/docs`

---
© 2026 PoEC Labs. All Rights Reserved.
