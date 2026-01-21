from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
from app.models import Transaction, Anomaly, IngestResponse, GraphSnapshot
from app.models_orm import TransactionDB, AnomalyDB, SnapshotDB
from pydantic import BaseModel
from app.core import ingest, graph, hashing, database
from app.engine import detectors, gnn
from web3 import Web3
from sqlalchemy.orm import Session
import networkx as nx
import os
import json
from app.core.context import context_manager
from app.engine.overlays import TaxOverlay

router = APIRouter()

# Web3 Setup - Lazy initialization to ensure env vars are read at request time
_w3_instance = None

def get_web3():
    global _w3_instance
    if _w3_instance is None:
        node_url = os.getenv("ETHEREUM_NODE_URL", "http://localhost:8545")
        print(f"DEBUG: Initializing Web3 with URL: {node_url}")
        _w3_instance = Web3(Web3.HTTPProvider(node_url))
    return _w3_instance
# Correct ABI matching ResultAnchor.sol
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "bytes32", "name": "_taskId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "_merkleRoot", "type": "bytes32"},
            {"internalType": "bytes32", "name": "_datasetHash", "type": "bytes32"},
            {"internalType": "bytes32", "name": "_modelHash", "type": "bytes32"},
            {"internalType": "string", "name": "_bundleCID", "type": "string"}
        ],
        "name": "anchorProof",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "_taskId", "type": "bytes32"}
        ],
        "name": "verifyProof",
        "outputs": [
            {"internalType": "bool", "name": "exists", "type": "bool"},
            {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
            {"internalType": "address", "name": "submitter", "type": "address"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "bytes32", "name": "_taskId", "type": "bytes32"},
            {"internalType": "bytes32", "name": "_datasetHash", "type": "bytes32"},
            {"internalType": "bytes32", "name": "_modelHash", "type": "bytes32"}
        ],
        "name": "verifyIntegrity",
        "outputs": [
            {"internalType": "bool", "name": "", "type": "bool"}
        ],
        "stateMutability": "view",
        "type": "function"
    }
]
CONTRACT_ADDRESS = os.getenv("ANCHOR_CONTRACT_ADDRESS", "0x5FbDB2315678afecb367f032d93F642f64180aa3") 

@router.post("/ingest", response_model=IngestResponse)
async def ingest_data(file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    try:
        print(f"DEBUG: Receiving file {file.filename}")
        txs_pydantic, raw_hash = await ingest.ingest_csv(file)
        
        print("DEBUG: CSV parsed. clearing DB")
        # Clear old data for simple prototype flow (or append? treating as new batch replaces old for now)
        db.query(TransactionDB).delete()
        db.query(AnomalyDB).delete()
        
        print("DEBUG: DB cleared. preparing insert")
        # Bulk insert
        db_objs = []
        for tx in txs_pydantic:
            db_objs.append(TransactionDB(
                transaction_id=tx.transaction_id,
                source_entity=tx.source_entity,
                target_entity=tx.target_entity,
                amount=tx.amount,
                timestamp=tx.timestamp,
                transaction_type=tx.transaction_type
            ))
        
        print(f"DEBUG: inserting {len(db_objs)} rows")
        db.add_all(db_objs)
        db.commit()
        print("DEBUG: commit complete")
        
        return IngestResponse(
            batch_id=raw_hash[:8],
            record_count=len(db_objs),
            content_hash=raw_hash,
            message="Ingestion successful"
        )
    except HTTPException as he:
        # Re-raise HTTP exceptions (like validation errors from ingest_csv)
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"CRITICAL ERROR in ingest_data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@router.get("/context")
async def get_current_context():
    return {
        "active": context_manager.get_active_context(),
        "available": context_manager.get_available_contexts()
    }

@router.post("/context")
async def set_context(context_id: str):
    try:
        context_manager.set_context(context_id)
        return {"message": f"Switched context to {context_id}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/analyze")
async def run_analysis(db: Session = Depends(database.get_db)):
    print("DEBUG: entering run_analysis")
    
    # Fetch from DB
    tx_rows = db.query(TransactionDB).all()
    if not tx_rows:
        raise HTTPException(status_code=400, detail="No data ingested")
        
    # Convert back to Pydantic/Dict for graph build
    txs = [Transaction(
        transaction_id=t.transaction_id,
        source_entity=t.source_entity,
        target_entity=t.target_entity,
        amount=t.amount,
        timestamp=t.timestamp,
        transaction_type=t.transaction_type
    ) for t in tx_rows]
    
    print("DEBUG: building time-sliced graphs")
    time_slices = graph.build_time_sliced_graphs(txs, window='M')
    
    raw_anomalies = []
    all_gnn_scores = []
    
    # Analyze each slice
    for slice_key, sub_G in time_slices:
        print(f"DEBUG: analyzing slice {slice_key}")
        
        # 1. Heuristics (Deterministic)
        print("DEBUG: detect circular")
        circ_anomalies = detectors.detect_circular_trading(sub_G)
        for c in circ_anomalies:
            # Update Existing Anomaly Object
            c.anomaly_id = f"DETERM-CIRC-{slice_key}-{hashing.hash_content(c.entities_involved)}"
            c.evidence_data["slice"] = slice_key
            c.detection_method = "DETERMINISTIC"
            c.confidence = "Low" # Placeholder
            c.explanation_metadata = {
                "metric": "Suspicious Loop", 
                "value": f"{len(c.entities_involved)} Entities Involved",
                "context": "Funds returned to origin (Circular Logic)"
            }
            raw_anomalies.append(c)

        print("DEBUG: detect dense")
        dense_anomalies = detectors.detect_dense_clusters(sub_G)
        for d in dense_anomalies:
             # Update Existing Anomaly Object
             d.anomaly_id = f"DETERM-DENSE-{slice_key}-{d.evidence_data.get('density')}"
             d.evidence_data["slice"] = slice_key
             d.detection_method = "DETERMINISTIC"
             d.confidence = "Low"
             d.explanation_metadata = {
                "metric": "Network Density",
                "value": f"{round(d.evidence_data.get('density', 0), 2)} (High)",
                "context": "Abnormal Clustering > 2x Average"
             }
             raw_anomalies.append(d)
        
        print("DEBUG: detect wash trading")
        wash_anomalies = detectors.detect_wash_trading(sub_G)
        for w in wash_anomalies:
            w.anomaly_id = f"DETERM-WASH-{slice_key}-{w.evidence_data.get('total_volume')}"
            w.evidence_data["slice"] = slice_key
            w.detection_method = "DETERMINISTIC"
            w.confidence = "Low"
            w.explanation_metadata = {
                "metric": "Fake Volume Ratio",
                "value": f"{round((w.evidence_data.get('total_volume', 0) - w.evidence_data.get('net_flow', 0))/w.evidence_data.get('total_volume', 1)*100)}%",
                "context": "High Volume with Zero Net Transfer"
            }
            raw_anomalies.append(w)

        print("DEBUG: detect structuring")
        struct_anomalies = detectors.detect_structuring(sub_G)
        for s in struct_anomalies:
             s.anomaly_id = f"DETERM-STRUCT-{slice_key}-{hash(s.description)}"
             s.evidence_data["slice"] = slice_key
             s.detection_method = "DETERMINISTIC"
             s.confidence = "Low"
             s.explanation_metadata = {
                "metric": "Split-Transactions",
                "value": f"Count: {s.evidence_data.get('count', '?')}",
                "context": "Repeated payments just below reporting limit"
             }
             raw_anomalies.append(s)
        
        # 2. Real AI (GNN)
        print("DEBUG: running GNN inference")
        try:
            if sub_G.number_of_edges() > 10: # Min 10 edges to trigger GNN
                # OPTIMIZATION: Run heavy ML compute in threadpool to avoid blocking heartbeat
                # OPTIMIZATION: Reduced epochs from 100 to 25 for real-time responsiveness
                from starlette.concurrency import run_in_threadpool
                
                def _exec_gnn_sync(graph_obj):
                    detector = gnn.AnomalyDetector()
                    detector.train_baseline(graph_obj, epochs=25) 
                    return detector.detect(graph_obj)

                gnn_output = await run_in_threadpool(_exec_gnn_sync, sub_G)
                gnn_results = gnn_output["anomalies"]
                
                # Collect scores for visualization
                if "edge_scores" in gnn_output:
                     all_gnn_scores.extend(gnn_output["edge_scores"])

                # Convert GNN dicts to Pydantic Anomaly objects
                for ga in gnn_results:
                    # Calculate Explainability Metrics
                    src = ga['source']
                    tgt = ga['target']
                    src_deg = sub_G.degree(src)
                    tgt_deg = sub_G.degree(tgt)
                    
                    raw_anomalies.append(Anomaly(
                        anomaly_id=f"GNN-{slice_key}-{src}-{tgt}",
                        anomaly_type="STRUCTURAL_ANOMALY",
                        severity=ga['score'],
                        description=f"EXISTENCE PARADOX: The AI Model predicts with >99% confidence that a transaction link between these entities is topologically invalid / Impossible, yet it exists.",
                        entities_involved=[src, tgt],
                        evidence_data={"score": ga['score'], "slice": slice_key, "tag": "Existence Verification Failed"},
                        detection_method="LEARNED",
                        confidence="High",
                        explanation_metadata={
                            "factors": [
                                {"name": "Probability of Fraud", "value": f"{float(ga['score'])*100:.1f}%"},
                                {"name": "Model Decision", "value": "Structurally Impossible"},
                                {"name": "Reality Check", "value": "Link Exists (Deviation)"},
                                {"name": f"Source Activity", "value": f"{src_deg} connections"},
                                {"name": f"Target Activity", "value": f"{tgt_deg} connections"}
                            ],
                            "corroboration": "Violates Economic & Graph Logic"
                        }
                    ))
        except Exception as e:
            print(f"ERROR: GNN failed for slice {slice_key}: {e}")

    # Post-Processing: Temporal Persistence & Confidence
    signature_counts = {}
    first_seen = {}
    
    for a in raw_anomalies:
        sig = (a.anomaly_type, frozenset(a.entities_involved))
        if sig not in signature_counts:
            signature_counts[sig] = 0
            first_seen[sig] = a.evidence_data.get("slice", "Unknown")
        signature_counts[sig] += 1
        
    final_anomalies = []
    processed_sigs = set()

    for a in raw_anomalies:
        sig = (a.anomaly_type, frozenset(a.entities_involved))
        
        # DEDUPLICATION: Only process each signature once (the first one encountered)
        if sig in processed_sigs:
            continue
        processed_sigs.add(sig)
        
        count = signature_counts[sig]
        
        # Confidence Evolution
        if count >= 3:
            a.confidence = "High"
        elif count == 2:
            a.confidence = "Medium"
        else:
            a.confidence = "Low"
        
        # Watchlist Status for Learned Anomalies
        if a.detection_method == "LEARNED":
             if a.confidence == "Low":
                 a.anomaly_type = "WATCHLIST (Possible Anomaly)" # Change type/title for UI
             elif a.confidence == "Medium":
                 a.anomaly_type = "LEARNED ANOMALY (Evolving)"
        
        if count > 1:
             if "Persists" not in a.description:
                a.description += f" [First observed: {first_seen[sig]}]"
            
        final_anomalies.append(a)
    
    # --- 3. APPLY OBSERVATIONAL TAX OVERLAY ---
    # This layer never creates anomalies, only adds explanatory context if enabled logic (GST/VAT) matches
    print("DEBUG: applying tax overlay")
    overlay = TaxOverlay()
    anomalies = overlay.apply(final_anomalies, txs)
            
    # For snapshot, we still take the full graph for the overview
    G = graph.build_graph(txs)
    print("DEBUG: creating snapshot")
    snapshot = graph.snapshot_graph(G)
    
    # Persist Anomalies
    for a in anomalies:
        db.add(AnomalyDB(
            anomaly_id=a.anomaly_id,
            anomaly_type=a.anomaly_type,
            severity=a.severity,
            description=a.description,
            entities_involved=a.entities_involved,
            evidence_data=a.evidence_data,
            confidence=a.confidence,
            detection_method=a.detection_method,
            explanation_metadata=a.explanation_metadata
        ))
    db.commit()
    
    # Hash the result set
    results_hash = hashing.hash_content([a.dict() for a in anomalies])
    
    # Map max GNN scores to edges for visualization
    edge_score_map = {}
    for score_item in all_gnn_scores:
        key = f"{score_item['source']}-{score_item['target']}"
        # Keep max score across slices
        if key not in edge_score_map or score_item['score'] > edge_score_map[key]:
            edge_score_map[key] = score_item['score']

    # Construct safe graph data
    nodes = [{"data": {"id": str(n), "label": str(n)}} for n in G.nodes()]
    edges = []
    
    for u, v, d in G.edges(data=True):
         edge_key = f"{u}-{v}"
         gnn_score = edge_score_map.get(edge_key, 0.0)
         
         edge_data = {
             "source": str(u), 
             "target": str(v), 
             "label": f"{d.get('count', 1)} tx",
             "gnn_score": gnn_score,
             "id": edge_key,
             "amount": d.get("weight", 0),
             "types": d.get("types", []),
             "dates": d.get("dates", [])
         }
         edges.append({"data": edge_data})
    
    graph_data = {
        "elements": nodes + edges
    }
    
    return {
        "snapshot": snapshot,
        "anomalies": anomalies,
        "results_hash": results_hash,
        "model_hash": hashing.hash_content(json.load(open("config/models.json")).get("active_model_version", "unknown"))[:66], 
        "graph_data": graph_data
    }

class AnchorRequest(BaseModel):
    data_hash: str
    model_hash: str
    result_hash: str
    ipfs_cid: str = ""

@router.get("/anchor/status")
async def get_anchor_status():
    """
    Returns the server-side wallet configuration for transparency.
    """
    w3 = get_web3()
    if not w3.is_connected():
         return {"status": "disconnected", "network": "Unknown"}
    
    # Re-derive account (same logic as anchor_hash)
    PRIVATE_KEY = os.getenv("DEPLOYER_PRIVATE_KEY")
    if not PRIVATE_KEY:
         return {"status": "disconnected", "network": "Unknown", "error": "DEPLOYER_PRIVATE_KEY not set"}
    
    account = w3.eth.account.from_key(PRIVATE_KEY)
    
    try:
        balance_wei = w3.eth.get_balance(account.address)
        balance_eth = float(w3.from_wei(balance_wei, 'ether'))
    except:
        balance_eth = 0.0

    return {
        "status": "connected",
        "network": os.getenv("BLOCKCHAIN_NETWORK", "Sepolia Testnet"),
        "wallet_address": account.address,
        "contract_address": CONTRACT_ADDRESS,
        "balance_eth": balance_eth
    }

@router.post("/anchor")
async def anchor_hash(req: AnchorRequest):
    """
    Anchors the hash triplet to the registry.
    """
    w3 = get_web3()
    if not w3.is_connected():
         raise HTTPException(status_code=503, detail="Blockchain node not connected")
    
    PRIVATE_KEY = os.getenv("DEPLOYER_PRIVATE_KEY")
    if not PRIVATE_KEY:
         raise HTTPException(status_code=503, detail="DEPLOYER_PRIVATE_KEY not configured")
    
    # Normalize private key - remove 0x prefix if present (web3.py handles both)
    if PRIVATE_KEY.startswith("0x"):
        PRIVATE_KEY = PRIVATE_KEY[2:]
    
    print(f"DEBUG anchor: Contract={CONTRACT_ADDRESS}, Key length={len(PRIVATE_KEY)}")
         
    account = w3.eth.account.from_key(PRIVATE_KEY)
    
    try:
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
        
        # Ensure 0x prefix and pad to bytes32 format
        d_hash = req.data_hash if req.data_hash.startswith("0x") else "0x" + req.data_hash
        m_hash = req.model_hash if req.model_hash.startswith("0x") else "0x" + req.model_hash
        r_hash = req.result_hash if req.result_hash.startswith("0x") else "0x" + req.result_hash
        
        # Generate taskId from result_hash (for uniqueness)
        task_id = r_hash
        merkle_root = r_hash  # Use result_hash as merkle root for now
        dataset_hash = d_hash
        model_hash = m_hash
        bundle_cid = req.ipfs_cid or ""
        
        print(f"DEBUG anchor: taskId={task_id[:18]}... calling anchorProof")
        
        anchoring_txn = contract.functions.anchorProof(
            task_id, merkle_root, dataset_hash, model_hash, bundle_cid
        ).build_transaction({
            'from': account.address,
            'nonce': w3.eth.get_transaction_count(account.address, 'pending'),
            'gas': 200000,
            'gasPrice': int(w3.eth.gas_price * 1.5)
        })
        
        signed_txn = w3.eth.account.sign_transaction(anchoring_txn, private_key=PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.raw_transaction)
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Ensure tx hash has 0x prefix
        tx_hash_hex = receipt['transactionHash'].hex()
        if not tx_hash_hex.startswith('0x'):
            tx_hash_hex = '0x' + tx_hash_hex
        
        return {
            "transaction_hash": tx_hash_hex,
            "block_number": receipt['blockNumber'],
            "status": "confirmed"
        }
    except Exception as e:
        if "Hash already anchored" in str(e):
             return {"status": "already_anchored", "message": str(e)}
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/verify/{result_hash}")
async def verify_on_chain(result_hash: str):
    w3 = get_web3()
    if not w3.is_connected():
         raise HTTPException(status_code=503, detail="Blockchain node not connected")
    
    try:
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
        # Use result_hash as taskId (same as we used in anchorProof)
        task_id = result_hash if result_hash.startswith("0x") else "0x" + result_hash
        
        # verifyProof returns (bool exists, uint256 timestamp, address submitter)
        exists, timestamp, submitter = contract.functions.verifyProof(task_id).call()
        
        return {
            "verified": exists,
            "timestamp": timestamp,
            "submitter": submitter,
            "task_id": task_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions")
async def get_transactions(limit: int = 1000, db: Session = Depends(database.get_db)):
    """
    Fetch raw transactions for the Forensics view.
    """
    try:
        txs = db.query(TransactionDB).limit(limit).all()
        return [
            {
                "transaction_id": t.transaction_id,
                "source": t.source_entity,
                "target": t.target_entity,
                "amount": t.amount,
                "timestamp": t.timestamp,
                "type": t.transaction_type
            }
            for t in txs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
