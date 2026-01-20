# PoEC v2 - Local Testing Checklist

## 🚀 Quick Start (First Time Setup)

### Step 1: Install Backend Dependencies
```bash
cd backend
pip3 install -r requirements.txt
```

### Step 2: Start Backend Server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

**Expected**: Server starts on http://127.0.0.1:8000

### Step 3: Install Agent Dependencies
```bash
cd agent-runtime
npm install
cp .env.example .env
```

### Step 4: Install Frontend Dependencies
```bash
cd <project-root>
npm install
```

### Step 5: Start Frontend
```bash
npm run dev
```

**Expected**: Frontend runs on http://localhost:3000

---

## ✅ Test Checklist

### Phase 1: Backend Health Check

#### Test 1.1: Root Endpoint
```bash
curl http://localhost:8000/
```

**Expected**:
```json
{"message": "PoEC Anomaly Detection Engine Ready"}
```

**Status**: [ ]

---

#### Test 1.2: v2 Configuration Endpoint
```bash
curl http://localhost:8000/api/v2/config
```

**Expected**:
```json
{
  "version": "2.0.0",
  "limits": {...},
  "features": {
    "proof_building": true,
    "merkle_verification": true,
    ...
  }
}
```

**Status**: [ ]

---

#### Test 1.3: v2 Limits Endpoint
```bash
curl http://localhost:8000/api/v2/limits
```

**Expected**:
```json
{
  "max_upload_mb": ...,
  "max_rows_fast_path": ...,
  "environment": {...}
}
```

**Status**: [ ]

---

### Phase 2: Agent Runtime Tests

#### Test 2.1: Agent Mock Mode (No CSV Required)
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
✅ Uploaded. Batch ID: ...

🔍 Step 3: Running anomaly detection analysis...
✅ Analysis complete
   Anomalies found: 3

🔐 Step 4: Building cryptographic proof bundle...
✅ Proof bundle built
   Merkle Root: 0x...

✍️  Step 5: Signing proof bundle...
✅ Bundle signed

✅ Agent workflow complete!
```

**Status**: [ ]

---

#### Test 2.2: Agent with Real CSV (If Available)
```bash
# Create test CSV
cat > test_data.csv << EOF
source_entity,target_entity,amount,timestamp
A1,A2,10000,2024-01-01
A2,A3,5000,2024-01-02
A3,A1,10000,2024-01-03
EOF

cd agent-runtime
npm run agent run ../test_data.csv
```

**Expected**: Similar to Test 2.1 but with real data hash

**Status**: [ ]

---

### Phase 3: Frontend UI Tests

#### Test 3.1: Dashboard Loads
1. Open browser: http://localhost:3000/dashboard
2. Check header displays "PoEC Console"
3. Verify "Analysis" and "Forensics" tabs visible
4. Check graph placeholder shows

**Expected**: No console errors, UI renders correctly

**Status**: [ ]

---

#### Test 3.2: Verify Page Loads
1. Open browser: http://localhost:3000/verify
2. Check "Merkle Verifier" header visible
3. Verify proof input textarea present
4. Check "Verify Proof" button exists

**Expected**: Clean UI, no errors

**Status**: [ ]

---

#### Test 3.3: Agent Simulator Page Loads
1. Open browser: http://localhost:3000/agent_sim
2. Check "x402 Agent Simulator" header
3. Verify CSV upload area present
4. Check 5 workflow steps displayed

**Expected**: UI loads completely

**Status**: [ ]

---

### Phase 4: End-to-End Proof Generation

#### Test 4.1: Dashboard Analysis
1. Go to http://localhost:3000/dashboard
2. Upload `test_data.csv` (created in Test 2.2)
3. Click "Run Engine"
4. Wait for analysis to complete

**Expected**:
- Console log shows "Cycle complete"
- Anomalies appear in right panel (if any detected)
- Graph visualization shows nodes

**Status**: [ ]

---

#### Test 4.2: Build Proof via API
After Test 4.1 completes, get hashes from dashboard (or use curl):

```bash
# Replace with actual hashes from analysis
curl -X POST http://localhost:8000/api/v2/proof/build \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_hash": "abc123...",
    "model_hash": "def456..."
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "task_id": "...",
  "merkle_root": "0x...",
  "bundle_cid": "proof_bundles/....json",
  "anomaly_count": 3
}
```

**Status**: [ ]

---

#### Test 4.3: Retrieve Proof Bundle
```bash
# Replace <task_id> with value from Test 4.2
curl http://localhost:8000/api/v2/proof/<task_id>
```

**Expected**: Full proof bundle JSON with:
- `merkle_root`
- `anomaly_proofs` array
- `dataset_hash`
- `model_hash`

**Status**: [ ]

---

#### Test 4.4: Verify Merkle Proof
1. Copy first proof from Test 4.3 response (`anomaly_proofs[0]`)
2. Go to http://localhost:3000/verify
3. Paste proof JSON in textarea
4. Click "Verify Proof"

**Expected**: Green "Valid Proof" message with checkmark

**Status**: [ ]

---

### Phase 5: Agent Simulator UI

#### Test 5.1: Upload and Run
1. Go to http://localhost:3000/agent_sim
2. Upload `test_data.csv`
3. Click "Run Agent Workflow"
4. Watch progress bars

**Expected**:
- All 5 steps complete with green checkmarks
- Final result shows task_id, merkle_root, bundle_cid
- Links to verify/dashboard appear

**Status**: [ ]

---

### Phase 6: Smart Contracts (Optional)

#### Test 6.1: Deploy ResultAnchor Locally
```bash
# Terminal 1: Start Hardhat
cd contracts
npx hardhat node
```

```bash
# Terminal 2: Deploy
cd contracts
npx hardhat run scripts/deploy_result_anchor.js --network localhost
```

**Expected**:
```
✅ ResultAnchor deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Status**: [ ]

---

#### Test 6.2: Deploy AgentRegistry
```bash
cd contracts
npx hardhat run scripts/deploy_agent_registry.js --network localhost
```

**Expected**:
```
✅ AgentRegistry deployed to: 0x...
✅ Default agent registered
```

**Status**: [ ]

---

#### Test 6.3: Agent with On-Chain Anchoring
1. Copy deployed contract address from Test 6.1
2. Update `agent-runtime/.env`:
   ```
   RESULT_ANCHOR_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
   ETHEREUM_NODE_URL=http://localhost:8545
   ```
3. Run agent with anchoring:
   ```bash
   cd agent-runtime
   npm run agent run ../test_data.csv --anchor
   ```

**Expected**:
- Steps 1-5 complete
- Step 6 shows: "✅ Proof anchored successfully"
- Transaction hash displayed
- Block number shown

**Status**: [ ]

---

### Phase 7: V1 Preservation Check

#### Test 7.1: Existing Dashboard Features
1. Go to http://localhost:3000/dashboard
2. Upload CSV
3. Run analysis
4. Check anomaly list displays
5. Verify graph visualization works
6. Click on anomaly to see details modal

**Expected**: Everything works exactly as before v2 implementation

**Status**: [ ]

---

#### Test 7.2: Existing API Endpoints
```bash
# Test v1 ingest
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "file=@test_data.csv"
```

**Expected**: Returns `batch_id` and `content_hash`

```bash
# Test v1 analyze
curl -X POST http://localhost:8000/api/v1/analyze
```

**Expected**: Returns anomalies, graph_data, snapshot

**Status**: [ ]

---

## 🎯 Success Criteria Summary

✅ **Backend**:
- [ ] v1 endpoints work (ingest, analyze)
- [ ] v2 endpoints work (config, proof/build, verify/merkle)
- [ ] No errors in server logs

✅ **Agent Runtime**:
- [ ] Mock mode completes successfully
- [ ] Real CSV mode works
- [ ] On-chain anchoring works (optional)

✅ **Frontend**:
- [ ] Dashboard unchanged and functional
- [ ] Verify page loads and verifies proofs
- [ ] Agent simulator runs workflow

✅ **Smart Contracts** (Optional):
- [ ] ResultAnchor deploys
- [ ] AgentRegistry deploys
- [ ] Agent can anchor on-chain

✅ **Integration**:
- [ ] Complete flow: Upload → Analyze → Build Proof → Verify
- [ ] Agent can orchestrate full workflow
- [ ] No breaking changes to v1

---

## 🐛 Troubleshooting

### Issue: Backend won't start
```bash
cd backend
pip3 install -r requirements.txt
python3 -m uvicorn app.main:app --reload
```

### Issue: "Module not found" errors
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Issue: Agent TypeScript errors
```bash
cd agent-runtime
npm install
npm run build
```

### Issue: Port already in use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn app.main:app --reload --port 8001
```

### Issue: Frontend build errors
```bash
rm -rf node_modules .next
npm install
npm run dev
```

---

## 📊 Testing Summary

Fill this out as you complete tests:

- **Total Tests**: 20
- **Passed**: ___ / 20
- **Failed**: ___ / 20
- **Skipped**: ___ / 20

---

## 🎓 Quick Visual Test

For a quick visual confirmation everything works:

1. **Start Backend**: `cd backend && uvicorn app.main:app --reload`
2. **Start Frontend**: `npm run dev`
3. **Open Agent Sim**: http://localhost:3000/agent_sim
4. **Upload CSV** and click "Run Agent Workflow"
5. **Watch the magic** ✨

If all 5 steps turn green and final result shows, PoEC v2 is working! 🎉

---

## 📝 Notes

- Tests 1-5 are essential
- Tests 6 are optional (smart contracts)
- Test 7 ensures v1 preservation
- Run tests in order for best results
- Each test builds on previous ones

**Good luck testing!** 🚀
