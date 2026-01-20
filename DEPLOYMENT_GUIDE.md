# PoEC Deployment Guide (Free Tier)

This guide details the procedure to deploy PoEC on free-tier compatible platforms:
1.  **Smart Contracts** -> **Sepolia Testnet**
2.  **Backend API** -> **Render (Free Tier)**
3.  **Frontend UI** -> **Vercel**

---

## 📅 Part 1: Smart Contracts (Sepolia Testnet)

**Prerequisites**:
- A crypto wallet with **Sepolia ETH**. (Get from [Sepolia Faucet](https://sepoliafaucet.com/))
- Private Key of the deployer wallet.

### 1. Configure Environment
Create/Edit `.env` in `contracts/`:
```env
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

### 2. Deploy ResultAnchor
Run the deployment script targeting Sepolia:
```bash
npx hardhat run scripts/deploy_result_anchor.js --network sepolia
```

### 3. Save the Output
> ResultAnchor deployed to: **0x...** (Copy this!)

---

## 🧠 Part 2: Backend API (Render)

**Render** allows deploying Docker containers directly from git.

### 1. Push to GitHub
Ensure `backend/` and `render.yaml` are pushed to your repo.

### 2. Create Web Service on Render
1.  Go to [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub Repo.
4.  **Root Directory**: `backend`
5.  **Runtime**: `Docker`

### 3. Environment Variables
Add these in the "Environment" tab:
- `POEC_ENV`: `production`
- `ANCHOR_CONTRACT_ADDRESS`: **Address from Part 1**
- `ETHEREUM_NODE_URL`: `https://rpc.sepolia.org` (or your Alchemy/Infura URL)
- `DEPLOYER_PRIVATE_KEY`: Your Private Key

### 4. Deploy
Click **Create Web Service**. Wait for it to go live.
**Copy the Service URL** (e.g., `https://poec-backend.onrender.com`).

---

## 💻 Part 3: Frontend UI (Vercel)

### 1. Import to Vercel
1.  Go to Vercel Dashboard.
2.  Add New Project -> Select Repo.

### 2. Environment Variables
- `NEXT_PUBLIC_API_URL`: **The Render Backend URL from Part 2**

### 3. Deploy
Click **Deploy**.

---

**Note**: The free tier on Render spins down after inactivity. The first request might take 50s+.
