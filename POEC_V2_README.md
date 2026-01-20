# PoEC v2 - Proof of Economic Crime with Cryptographic Anchoring

**Incremental upgrade from v1 → v2 with zero rewrites**

## 🎯 What's New in v2

PoEC v2 extends the existing anomaly detection system with:

- 🔐 **Cryptographic Proof Anchoring**: Merkle tree-based proofs for every anomaly
- 🤖 **x402 Agent Orchestration**: Autonomous workflow from data → analysis → proof → blockchain
- ⚓ **Blockchain Verification**: On-chain anchoring via `ResultAnchor` smart contract
- 🛡️ **Render-Safe Execution**: Graceful degradation for free-tier deployment limits
- 📦 **Proof Bundles**: Portable, verifiable analysis results with IPFS storage

**All while preserving 100% of v1 functionality**.

---

## 📁 Project Structure

```
PoEC/
├── config/                      # NEW: Centralized configuration
├── backend/
│   ├── proof_builder/          # NEW: Merkle proofs & bundles
│   ├── wrappers/               # NEW: Render-safe execution
│   ├── app/api/routes_v2.py    # NEW: v2 endpoints
│   └── app/                    # v1 preserved (unchanged)
├── contracts/
│   └── contracts/ResultAnchor.sol  # NEW: Enhanced anchoring
├── agent-runtime/              # NEW: TypeScript orchestration
├── pages/                      # v1 UI (Phase 4: UI extensions pending)
└── components/                 # v1 components (unchanged)
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

v1 endpoints remain at `/api/v1/*`, new v2 endpoints at `/api/v2/*`.

### 2. Agent Runtime Setup

```bash
cd agent-runtime
npm install
cp .env.example .env
# Edit .env with your configuration
```

### 3. Smart Contract Deployment

```bash
cd contracts
npx hardhat node                                                    # Terminal 1
npx hardhat run scripts/deploy_result_anchor.js --network localhost # Terminal 2
```

Update `.env` in `agent-runtime` with deployed contract address.

### 4. Run Agent Workflow

```bash
cd agent-runtime
npm run agent run ../demo_india_gst_complex_iso.csv --anchor
```

This will:
1. Upload CSV to PoEC
2. Run anomaly detection
3. Build cryptographic proof (Merkle tree)
4. Sign proof bundle
5. Anchor Merkle root on-chain

---

## 🔗 API Endpoints

### v1 Endpoints (Unchanged)
- `POST /api/v1/ingest` - Upload CSV
- `POST /api/v1/analyze` - Run analysis
- `POST /api/v1/anchor` - Anchor to PoECRegistry (legacy)

### v2 Endpoints (New)
- `GET /api/v2/config` - Get v2 configuration
- `POST /api/v2/proof/build` - Build Merkle proof bundle
- `GET /api/v2/proof/{task_id}` - Retrieve proof bundle
- `POST /api/v2/verify/merkle` - Verify single anomaly proof
- `GET /api/v2/limits` - Get execution limits

---

## 🧬 Architecture Principles

### Zero Rewrites Policy

✅ **All changes are additive**:
- New modules in separate directories
- Original v1 code untouched
- Backward compatibility guaranteed

### Wrapper-Based Extension

- `wrappers/` layer adds limits enforcement without modifying core analysis
- `config/` centralizes all thresholds and behavior
- `routes_v2.py` adds new functionality without touching `routes.py`

### Stateless Execution

- No CSV persistence (processed in-memory)
- Proofs stored separately (local or IPFS)
- Only hashes and sanitized data on-chain

---

## 📊 Configuration

All behavior controlled via `config/`:

| File | Purpose |
|------|---------|
| `limits.json` | Execution limits per environment |
| `models.json` | GNN model metadata & detector thresholds |
| `storage.json` | Proof storage adapter configuration |
| `blockchain.json` | Network configs for anchoring |
| `country_profiles/` | Economic context (GST, VAT, etc.) |

Override with environment variables:
```bash
export POEC_ENV=production
export BLOCKCHAIN_NETWORK=sepolia
```

---

## 🔐 Cryptographic Proofs

### How It Works

1. **Analysis Results** → List of anomalies
2. **Canonical Serialization** → Sort keys, no whitespace
3. **Leaf Hashing** → SHA-256 of each anomaly
4. **Merkle Tree** → Binary tree construction
5. **Proof Generation** → Path from leaf to root
6. **Bundle Assembly** → Root + proofs + metadata
7. **Storage** → Save to IPFS or local filesystem
8. **Anchoring** → Submit root to ResultAnchor contract

### Example Verification

```typescript
// Get proof for anomaly #3
const proof = bundle.anomaly_proofs[3];

// Verify locally
const isValid = MerkleTree.verify_proof(
  proof.leaf,
  proof.path,
  bundle.merkle_root
);

// Verify on-chain (optional)
await resultAnchor.verifyAnomaly(
  taskId,
  proof.leaf,
  proof.path.map(p => p.hash),
  proof.path.map(p => p.position === 'left')
);
```

---

## 🛡️ Render Free-Tier Safety

### Limits Enforcement

| Limit | Render Free | Development |
|-------|-------------|-------------|
| Max Upload | 5 MB | 50 MB |
| Max Rows (Full) | 2,000 | 10,000 |
| Max Rows (Deterministic) | 5,000 | 50,000 |
| Timeout | 25s | 300s |

### Graceful Degradation

- **Small CSV**: Full analysis (GNN + heuristics)
- **Medium CSV**: Deterministic detectors only (skip GNN)
- **Large CSV**: Rejected with clear error message

Set environment via `POEC_ENV=render_free_tier`.

---

## 🧪 Testing

### Run Unit Tests (Future)
```bash
cd backend
pytest tests/test_proof_builder.py
pytest tests/test_v2_flow.py
```

### Manual Testing

1. **Test v2 Config Endpoint**:
   ```bash
   curl http://localhost:8000/api/v2/config
   ```

2. **Test Agent (Mock Mode)**:
   ```bash
   cd agent-runtime
   npm run agent run --mock placeholder.csv
   ```

3. **Test Full Workflow**:
   ```bash
   npm run agent run ../demo_india_gst_complex_iso.csv --anchor
   ```

---

## 📚 Documentation

- [Implementation Plan](file:///Users/kapish/.gemini/antigravity/brain/6613f1e4-4aaf-4ce7-a693-8abcce5f2abe/implementation_plan.md) - Detailed component breakdown
- [Walkthrough](file:///Users/kapish/.gemini/antigravity/brain/6613f1e4-4aaf-4ce7-a693-8abcce5f2abe/walkthrough.md) - What was built and how
- [Agent README](file:///Users/kapish/Work/PoEC_x402/PoEC/agent-runtime/README.md) - Agent usage guide
- [Task List](file:///Users/kapish/.gemini/antigravity/brain/6613f1e4-4aaf-4ce7-a693-8abcce5f2abe/task.md) - Implementation progress

---

## 🎓 Key Concepts

### Merkle Trees
Binary trees where each parent is the hash of its children. Allows proving a leaf (anomaly) belongs to a set (analysis) without revealing the entire set.

### x402 Agent Pattern
Autonomous agents that:
1. Acquire data
2. Invoke computation
3. Verify results
4. Anchor proofs on-chain

No human intervention required for routine workflows.

### Proof Bundle
Complete package containing:
- Merkle root (32 bytes)
- Individual proofs for each anomaly
- Dataset hash (integrity)
- Model hash (reproducibility)
- IPFS CID (retrievability)

---

## 🔮 Future Enhancements (Phase 4 & 5)

### Phase 4: UI Extensions
- [ ] `pages/verify.tsx` - Merkle proof verification UI
- [ ] `pages/agent_sim.tsx` - Agent workflow demo UI
- [ ] Update `dashboard.tsx` - Add proof section (conditional)

### Phase 5: Testing & Deployment
- [ ] Unit tests for all new modules
- [ ] Integration tests for v2 flow
- [ ] Contract tests for ResultAnchor
- [ ] Deploy to Sepolia testnet
- [ ] Deploy backend to Render (with v2 routes)

---

## 🤝 Contributing

This project follows a **strict incremental upgrade policy**:

❌ **Do NOT**:
- Rewrite existing v1 code
- Modify GNN or graph logic
- Change existing API responses
- Redesign UI components

✅ **Do**:
- Add new modules in separate directories
- Use wrappers and adapters
- Create new API endpoints (versioned)
- Extend via configuration

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

Built on top of PoEC v1's excellent foundation for economic crime detection using Graph Neural Networks and deterministic heuristics.

v2 extends, never replaces. 🚀
