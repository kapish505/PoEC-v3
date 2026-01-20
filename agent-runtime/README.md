# PoEC Agent Runtime

x402-style agent orchestration for PoEC v2 with cryptographic proof anchoring.

## Features

- 🤖 **Autonomous Workflow**: Complete analysis orchestration from data acquisition to blockchain anchoring
- 🔐 **Cryptographic Proofs**: Merkle tree-based proof generation for every anomaly
- ⚓ **Blockchain Anchoring**: On-chain proof verification via ResultAnchor smart contract  
- ✍️ **Digital Signatures**: Agent-signed proof bundles
- 🎯 **Configurable**: Environment-based configuration for different networks

## Installation

```bash
cd agent-runtime
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
- `POEC_API_URL`: Backend URL (default: http://localhost:8000)
- `ETHEREUM_NODE_URL`: Blockchain RPC endpoint
- `RESULT_ANCHOR_ADDRESS`: Deployed ResultAnchor contract address
- `AGENT_PRIVATE_KEY`: Private key for signing and anchoring

## Usage

### Run Agent Workflow

```bash
# With local CSV file
npm run agent run ../demo_india_gst_complex_iso.csv

# With mock data source
npm run agent run --mock placeholder.csv

# With blockchain anchoring
npm run agent run ../demo_india_gst_complex_iso.csv --anchor
```

### Workflow Steps

1. **Data Acquisition**: Load CSV from file or API
2. **Upload**: Send to PoEC backend
3. **Analysis**: Run anomaly detection (GNN + heuristics)
4. **Proof Building**: Generate Merkle tree and proof bundle
5. **Signing**: Sign bundle with agent key
6. **Anchoring** (optional): Submit Merkle root to blockchain

## Output

The agent provides colored, step-by-step console output:

```
🤖 PoEC Agent Runtime v2.0

📥 Step 1: Acquiring data...
✅ Acquired 45678 bytes

📤 Step 2: Uploading to PoEC backend...
✅ Uploaded. Batch ID: abcd1234

🔍 Step 3: Running anomaly detection analysis...
✅ Analysis complete
   Anomalies found: 12
   Mode: full

🔐 Step 4: Building cryptographic proof bundle...
✅ Proof bundle built
   Task ID: f4e3d2c1b0a09876
   Merkle Root: 0x1234...
   Bundle CID: proof_bundles/f4e3d2c1b0a09876.json

✍️  Step 5: Signing proof bundle...
✅ Bundle signed

⚓ Step 6: Anchoring proof to blockchain...
✅ Proof anchored successfully
   Transaction: 0xabcd...
   Block: 12345
```

## Architecture

- **Stateless**: No local storage of sensitive data
- **Modular**: Swap data sources and storage adapters
- **Error Handling**: Graceful failures with detailed logging
- **Type-Safe**: Full TypeScript implementation

## Development

```bash
# Build TypeScript
npm run build

# Run in dev mode
npm run dev run <csv-path>
```

## Security

⚠️ **Never commit `.env` with real private keys!**

- Use `.env.example` as template
- Store production keys in secure vaults (AWS Secrets Manager, etc.)
- Agent wallets should have minimal funding (gas only)
