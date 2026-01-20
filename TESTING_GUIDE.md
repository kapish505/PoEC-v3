# PoEC v2 Testing Guide

## Quick Start Testing

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Verify v2 endpoints:
```bash
curl http://localhost:8000/api/v2/config
```

Expected response:
```json
{
  "version": "2.0.0",
  "limits": {...},
  "features": {
    "proof_building": true,
    "merkle_verification": true
  }
}
```

---

### 2. Agent Runtime Setup

```bash
cd agent-runtime
npm install
cp .env.example .env
```

Edit `.env`:
- Set `POEC_API_URL=http://localhost:8000`
- Configure blockchain settings if testing anchoring

---

### 3. Frontend Setup

```bash
cd <project-root>
npm install
npm run dev
```

Access:
- Dashboard: http://localhost:3000/dashboard
- Verify Page: http://localhost:3000/verify
- Agent Simulator: http://localhost:3000/agent_sim

---

## Test Scenarios

### Scenario 1: Basic Proof Generation

**Steps**:
1. Start backend: `uvicorn app.main:app --reload`
2. Upload CSV via dashboard
3. Run analysis
4. Call proof build API:
   ```bash
   curl -X POST http://localhost:8000/api/v2/proof/build \
     -H "Content-Type: application/json" \
     -d '{
       "dataset_hash": "<hash_from_analysis>",
       "model_hash": "<model_hash_from_analysis>"
     }'
   ```

**Expected Output**:
```json
{
  "success": true,
  "task_id": "abc123...",
  "merkle_root": "0x1234...",
  "bundle_cid": "proof_bundles/abc123.json",
  "anomaly_count": 5
}
```

---

### Scenario 2: Merkle Proof Verification

**Steps**:
1. Get proof bundle:
   ```bash
   curl http://localhost:8000/api/v2/proof/<task_id>
   ```

2. Extract first anomaly proof from `anomaly_proofs[0]`

3. Verify via UI:
   - Navigate to http://localhost:3000/verify
   - Paste proof JSON
   - Click "Verify Proof"

**Expected**: ✅ Valid Proof confirmation

---

### Scenario 3: Agent Workflow (Mock Mode)

**Steps**:
1. Ensure backend is running
2. Run agent in mock mode:
   ```bash
   cd agent-runtime
   npm run agent run --mock placeholder.csv
   ```

**Expected Output**:
```
🤖 PoEC Agent Runtime v2.0

📥 Step 1: Acquiring data...
✅ Acquired 450 bytes

📤 Step 2: Uploading to PoEC backend...
✅ Uploaded. Batch ID: abcd1234

🔍 Step 3: Running anomaly detection analysis...
✅ Analysis complete
   Anomalies found: 3

🔐 Step 4: Building cryptographic proof bundle...
✅ Proof bundle built
   Task ID: f4e3d2c1
   Merkle Root: 0x5678...

✍️  Step 5: Signing proof bundle...
✅ Bundle signed

✅ Agent workflow complete!
```

---

### Scenario 4: Full Agent with Real CSV

**Steps**:
1. Prepare demo CSV:
   ```bash
   cd agent-runtime
   npm run agent run ../demo_india_gst_complex_iso.csv
   ```

2. For blockchain anchoring (requires local Hardhat):
   ```bash
   # Terminal 1: Start Hardhat node
   cd contracts
   npx hardhat node

   # Terminal 2: Deploy contract
   npx hardhat run scripts/deploy_result_anchor.js --network localhost

   # Terminal 3: Run agent with anchoring
   cd agent-runtime
   # Update .env with deployed contract address
   npm run agent run ../demo_india_gst_complex_iso.csv --anchor
   ```

**Expected**: Transaction hash and block number logged

---

### Scenario 5: UI Feature Testing

**Verify Page** (`/verify`):
- ✅ Accepts proof JSON input
- ✅ Validates Merkle path
- ✅ Shows verification result with animations
- ✅ Displays anomaly details

**Agent Simulator** (`/agent_sim`):
- ✅ CSV file upload
- ✅ Step-by-step visual progress
- ✅ Final result display with all hashes
- ✅ Links to verify and dashboard

**Dashboard** (no changes yet):
- ✅ Existing v1 functionality unchanged
- ✅ Can still upload and analyze
- ✅ Graph visualization works
- ✅ Anomaly list displays correctly

---

## Edge Cases & Error Handling

### Test: Large CSV (Render Limits)

```bash
# Create large CSV (3000 rows)
python -c "
import csv
with open('large_test.csv', 'w') as f:
    writer = csv.writer(f)
    writer.writerow(['source_entity', 'target_entity', 'amount', 'timestamp'])
    for i in range(3000):
        writer.writerow([f'E{i%100}', f'E{(i+1)%100}', 1000+i, '2024-01-01'])
"

# Upload via dashboard - should trigger deterministic-only mode
```

**Expected**: Analysis completes but skips GNN inference

---

### Test: Invalid Proof Verification

```bash
curl -X POST http://localhost:8000/api/v2/verify/merkle \
  -H "Content-Type: application/json" \
  -d '{
    "leaf": "0xwrongdata",
    "proof_path": [],
    "expected_root": "0xfakeroot"
  }'
```

**Expected**: 
```json
{
  "valid": false
}
```

---

### Test: Empty Anomaly List

Upload CSV with no anomalies (all normal transactions), then build proof.

**Expected**: Proof bundle with empty merkle_root

---

## Integration Tests (Future)

Create `backend/tests/test_v2_integration.py`:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_proof_build_flow():
    # 1. Upload CSV
    with open("test_data.csv", "rb") as f:
        response = client.post("/api/v1/ingest", files={"file": f})
    assert response.status_code == 200
    ingest_data = response.json()
    
    # 2. Run analysis
    response = client.post("/api/v1/analyze")
    assert response.status_code == 200
    analysis_data = response.json()
    
    # 3. Build proof
    response = client.post("/api/v2/proof/build", json={
        "dataset_hash": ingest_data["content_hash"],
        "model_hash": analysis_data["model_hash"]
    })
    assert response.status_code == 200
    proof_data = response.json()
    
    assert proof_data["success"] == True
    assert len(proof_data["merkle_root"]) == 64  # SHA-256 hex
```

Run:
```bash
cd backend
pytest tests/test_v2_integration.py -v
```

---

## Performance Benchmarks

### Small CSV (100 rows)
- Upload: < 100ms
- Analysis: < 3s
- Proof Build: < 500ms
- **Total**: < 4s

### Medium CSV (1000 rows)
- Upload: < 200ms
- Analysis: 5-10s (full GNN)
- Proof Build: < 1s
- **Total**: 6-11s

### Large CSV (2000+ rows)
- Upload: < 300ms
- Analysis: Deterministic only (< 5s)
- Proof Build: < 2s
- **Total**: < 8s

---

## Troubleshooting

### Issue: "Module not found" errors in backend

**Solution**:
```bash
cd backend
pip install -r requirements.txt
# If still failing, try:
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

---

### Issue: TypeScript compilation errors in agent

**Solution**:
```bash
cd agent-runtime
npm install --save-dev @types/node typescript ts-node
npm run build
```

---

### Issue: IPFS storage errors

**Solution**:
Edit `config/storage.json`:
```json
{
  "default_adapter": "local"  // Use local storage instead of IPFS
}
```

---

### Issue: Merkle verification always fails

**Check**:
1. Proof JSON is correctly formatted
2. `leaf` matches canonical anomaly hash
3. `path` has correct `position` fields (left/right)
4. `expected_root` matches proof bundle root

---

## Success Criteria Checklist

### Configuration System
- [ ] Config files load without errors
- [ ] Environment overrides work (test with `POEC_ENV=production`)
- [ ] Country profiles accessible

### Proof Builder
- [ ] Merkle tree constructs from anomaly list
- [ ] Proof generation succeeds for all anomalies
- [ ] Verification works for valid proofs
- [ ] Verification fails for tampered proofs
- [ ] Bundle storage works (local)

### Wrappers
- [ ] Limit enforcer rejects oversized uploads
- [ ] Deterministic mode activates for large CSVs
- [ ] Full mode runs for small CSVs

### v2 API
- [ ] All endpoints return 200 OK
- [ ] `/api/v2/config` returns configuration
- [ ] `/api/v2/proof/build` creates bundles
- [ ] `/api/v2/verify/merkle` validates proofs

### Agent Runtime
- [ ] Mock mode completes successfully
- [ ] Real CSV mode completes successfully
- [ ] Colored output displays correctly
- [ ] Error handling works (no crashes)

### UI Extensions
- [ ] Verify page loads
- [ ] Proof input and verification works
- [ ] Agent simulator loads
- [ ] Workflow steps display correctly
- [ ] Final results show properly

### v1 Preservation
- [ ] Dashboard still works identically
- [ ] Upload and analyze unchanged
- [ ] Graph visualization works
- [ ] Anomaly list displays
- [ ] No visual differences from v1

---

## Next Steps After Testing

1. **Deploy Smart Contract to Testnet**:
   ```bash
   npx hardhat run scripts/deploy_result_anchor.js --network sepolia
   ```

2. **Update Agent .env** with deployed address

3. **Test On-Chain Anchoring** with real transactions

4. **Add Dashboard Proof Section** (pending implementation)

5. **Create Walkthrough Video** demonstrating full flow

6. **Document API** with OpenAPI/Swagger

---

## Support

For issues:
1. Check error logs: `backend/logs/` or console output
2. Verify all dependencies installed
3. Ensure backend is running before frontend/agent
4. Review configuration in `config/` directory

Ready to test! 🚀
