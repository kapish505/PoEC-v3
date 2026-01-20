# Quick Start Guide - Run PoEC v2 Locally

## Option 1: Automated Startup (Recommended)

```bash
cd /Users/kapish/Work/PoEC_x402/PoEC
./start_local.sh
```

This will:
- ✅ Install backend dependencies
- ✅ Start backend on http://localhost:8000
- ✅ Install frontend dependencies
- ✅ Start frontend on http://localhost:3000

---

## Option 2: Manual Startup

### Terminal 1: Backend
```bash
cd /Users/kapish/Work/PoEC_x402/PoEC/backend
pip3 install fastapi uvicorn pydantic pandas networkx python-multipart web3 httpx pytest sqlalchemy psycopg2-binary torch torch_geometric scikit-learn numpy python-dotenv

python3 -m uvicorn app.main:app --reload --port 8000
```

### Terminal 2: Frontend
```bash
cd /Users/kapish/Work/PoEC_x402/PoEC
npm install
npm run dev
```

---

## Quick Test

Once running, test these URLs:

1. **Backend Health**: http://localhost:8000
   - Should show: `{"message": "PoEC Anomaly Detection Engine Ready"}`

2. **v2 Config**: http://localhost:8000/api/v2/config
   - Should show v2 configuration with features

3. **Dashboard**: http://localhost:3000/dashboard
   - Should load existing PoEC dashboard

4. **Verify Page**: http://localhost:3000/verify
   - Should load Merkle proof verification UI

5. **Agent Simulator**: http://localhost:3000/agent_sim
   - Should load agent workflow demo

---

## Full Test Checklist

📋 **See**: [TEST_CHECKLIST.md](file:///Users/kapish/Work/PoEC_x402/PoEC/TEST_CHECKLIST.md)

20+ comprehensive tests covering:
- Backend health (v1 & v2 endpoints)
- Agent runtime (mock & real CSV)
- Frontend UI (all 3 pages)
- End-to-end proof generation
- Smart contracts (optional)
- V1 preservation verification

---

## Known Issues

### pysha3 Installation Error
**Symptom**: `Failed building wheel for pysha3`
**Impact**: None - this is optional for web3
**Solution**: Ignore - backend will work without it

### Backend Import Errors
**Symptom**: `ModuleNotFoundError: No module named 'dotenv'`
**Solution**:
```bash
pip3 install python-dotenv merkletools
```

---

## Stop Servers

```bash
# Find and kill processes
lsof -ti:8000 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

Or press `Ctrl+C` in each terminal.

---

## Agent Runtime (Optional)

### Setup
```bash
cd agent-runtime
npm install
cp .env.example .env
```

### Test Mock Mode
```bash
npm run agent run --mock placeholder.csv
```

Expected: 5 steps complete with green checkmarks

---

## Smart Contracts (Optional)

### Deploy Locally
```bash
# Terminal 1
cd contracts
npx hardhat node

# Terminal 2
npx hardhat run scripts/deploy_result_anchor.js --network localhost
npx hardhat run scripts/deploy_agent_registry.js --network localhost
```

---

## Next Steps

1. ✅ Start services (Option 1 or 2 above)
2. ✅ Run Quick Test (5 URLs above)
3. ✅ Work through [TEST_CHECKLIST.md](file:///Users/kapish/Work/PoEC_x402/PoEC/TEST_CHECKLIST.md)
4. 🎉 Celebrate PoEC v2 working!

---

**Need Help?** Check [TESTING_GUIDE.md](file:///Users/kapish/Work/PoEC_x402/PoEC/TESTING_GUIDE.md) for detailed troubleshooting.
