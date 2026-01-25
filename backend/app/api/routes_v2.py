"""
PoEC v2 API Routes - Extended endpoints for proof building and verification.

ALL ADDITIONS ONLY - Does not modify existing v1 routes.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core import database
from app.models import Anomaly
from app.models_orm import AnomalyDB
from backend.config_loader import config_loader
from backend.proof_builder import build_proof_bundle, MerkleTree
from backend.proof_builder.storage import get_storage_adapter
from backend.wrappers import LimitEnforcer

router = APIRouter()

# Load configurations
limits_config = config_loader.get_limits()
storage_config = config_loader.get_storage_config()
storage_adapter = get_storage_adapter(storage_config)
limit_enforcer = LimitEnforcer(limits_config)


# ============================================================================
# Request/Response Models
# ============================================================================

class ProofBuildRequest(BaseModel):
    """Request to build proof bundle from existing analysis."""
    dataset_hash: str
    model_hash: str
    task_id: str = None


class MerkleVerifyRequest(BaseModel):
    """Request to verify a Merkle proof."""
    leaf: str
    proof_path: List[Dict[str, str]]
    expected_root: str


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/config")
async def get_v2_config():
    """
    Get current v2 configuration.
    
    Returns limits, model info, and feature flags.
    """
    return {
        "version": "2.0.0",
        "limits": limits_config,
        "models": config_loader.get_models_config(),
        "storage": {
            "adapter": storage_config.get("default_adapter"),
            "enabled": True
        },
        "features": {
            "proof_building": True,
            "merkle_verification": True,
            "graceful_degradation": True,
            "blockchain_anchoring": False  # Handled by agent
        }
    }


@router.post("/proof/build")
async def build_proof(
    request: ProofBuildRequest,
    db: Session = Depends(database.get_db)
):
    """
    Build cryptographic proof bundle from existing analysis anomalies.
    
    Workflow:
    1. Fetch anomalies from database
    2. Build Merkle tree
    3. Generate proofs for each anomaly
    4. Store bundle to configured storage
    5. Return bundle metadata
    """
    try:
        # Fetch anomalies from database
        anomaly_records = db.query(AnomalyDB).all()
        
        if not anomaly_records:
            raise HTTPException(
                status_code=404,
                detail="No anomalies found. Run analysis first."
            )
        
        # Convert ORM to dicts
        anomalies = []
        for record in anomaly_records:
            anomalies.append({
                "anomaly_id": record.anomaly_id,
                "anomaly_type": record.anomaly_type,
                "severity": record.severity,
                "entities_involved": record.entities_involved,
                "detection_method": record.detection_method,
                "confidence": record.confidence,
                "evidence_data": record.evidence_data,
                "explanation_metadata": record.explanation_metadata
            })
        
        # Build proof bundle
        bundle = build_proof_bundle(
            anomalies=anomalies,
            dataset_hash=request.dataset_hash,
            model_hash=request.model_hash,
            task_id=request.task_id,
            metadata={
                "total_anomalies": len(anomalies),
                "builder_version": "1.0.0"
            }
        )
        
        # Store bundle
        bundle_dict = bundle.to_dict()
        cid = storage_adapter.store(bundle_dict)
        bundle.set_cid(cid)
        
        return {
            "success": True,
            "task_id": bundle.task_id,
            "merkle_root": bundle.merkle_root,
            "dataset_hash": bundle.dataset_hash,
            "model_hash": bundle.model_hash,
            "bundle_cid": cid,
            "anomaly_count": len(anomalies),
            "timestamp": bundle.timestamp
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proof building failed: {str(e)}")


@router.get("/proof/{task_id}")
async def get_proof(task_id: str):
    """
    Retrieve a proof bundle by task ID.
    
    Args:
        task_id: Task identifier
        
    Returns:
        Full proof bundle
    """
    try:
        # Construct expected CID/path from task_id
        cid = f"proof_bundles/{task_id}.json"
        
        bundle_dict = storage_adapter.retrieve(cid)
        
        if not bundle_dict:
            raise HTTPException(status_code=404, detail="Proof bundle not found")
        
        return bundle_dict
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Proof retrieval failed: {str(e)}")


@router.post("/verify/merkle")
async def verify_merkle_proof(request: MerkleVerifyRequest):
    """
    Verify a Merkle proof for a single anomaly.
    
    Args:
        request: Merkle proof verification request
        
    Returns:
        Verification result
    """
    try:
        is_valid = MerkleTree.verify_proof(
            leaf=request.leaf,
            proof_path=request.proof_path,
            expected_root=request.expected_root
        )
        
        return {
            "valid": is_valid,
            "leaf": request.leaf,
            "root": request.expected_root,
            "verified_at": config_loader.get_limits()  # Timestamp via any JSON serializable
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")


@router.get("/limits")
async def get_limits():
    """
    Get current execution limits.
    
    Useful for frontend to show upload constraints.
    """
    return {
        "max_upload_mb": limits_config.get("max_upload_bytes", 0) / (1024 * 1024),
        "max_rows_fast_path": limits_config.get("max_rows_fast_path", 0),
        "max_rows_deterministic_only": limits_config.get("max_rows_deterministic_only", 0),
        "timeout_seconds": limits_config.get("timeout_seconds", 0),
        "environment": config_loader.get_limits()
    }


# ============================================================================
# Data Source Simulation Endpoints (ADD-ONLY)
# ============================================================================

import json
import random
from pathlib import Path
from datetime import datetime, timedelta

def load_data_source_config(config_name: str) -> dict:
    """Load data source configuration file."""
    config_path = Path(__file__).parent.parent.parent.parent / "config" / "data_sources" / config_name
    if config_path.exists():
        with open(config_path, 'r') as f:
            return json.load(f)
    return {}


@router.get("/bank/simulate")
async def simulate_bank_transactions(count: int = None):
    """
    Generate simulated bank transactions with fraud patterns.
    
    Uses config/data_sources/bank_profile.json for config-driven generation.
    Returns JSON that can be converted to CSV for analysis.
    """
    config = load_data_source_config("bank_profile.json")
    
    # Get entity pools
    entities = config.get("entities", {})
    all_entities = (
        entities.get("individuals", []) + 
        entities.get("businesses", []) + 
        entities.get("banks", [])
    )
    if not all_entities:
        all_entities = ["Entity_A", "Entity_B", "Entity_C", "Entity_D", "Entity_E"]
    
    # Get amount ranges
    amounts = config.get("amounts", {})
    min_amount = amounts.get("min", 100)
    max_amount = amounts.get("max", 50000)
    
    # Get transaction count
    tx_config = config.get("transaction_count", {})
    tx_count = count if count else tx_config.get("default", 50)
    tx_count = max(tx_config.get("min", 20), min(tx_count, tx_config.get("max", 200)))
    
    # Get patterns config
    patterns = config.get("patterns", {})
    
    # Get timestamp config
    ts_config = config.get("timestamp", {})
    start_date = datetime.strptime(ts_config.get("start_date", "2024-01-01"), "%Y-%m-%d")
    end_date = datetime.strptime(ts_config.get("end_date", "2024-03-31"), "%Y-%m-%d")
    
    transactions = []
    current_date = start_date
    
    for i in range(tx_count):
        # Decide if this should be a pattern
        roll = random.random()
        
        # Circular trading pattern
        if patterns.get("circular_trading", {}).get("enabled") and roll < patterns["circular_trading"].get("probability", 0):
            chain_len = random.randint(*patterns["circular_trading"].get("chain_length", [3, 5]))
            chain = random.sample(all_entities, min(chain_len, len(all_entities)))
            base_amount = random.randint(min_amount, max_amount)
            for j in range(len(chain)):
                transactions.append({
                    "source": chain[j],
                    "target": chain[(j + 1) % len(chain)],
                    "amount": base_amount + random.randint(-100, 100),
                    "timestamp": (current_date + timedelta(hours=j)).strftime("%Y-%m-%d %H:%M:%S")
                })
        
        # Wash trading pattern
        elif patterns.get("wash_trading", {}).get("enabled") and roll < patterns.get("wash_trading", {}).get("probability", 0) + 0.1:
            entity = random.choice(all_entities)
            intermediary = random.choice([e for e in all_entities if e != entity])
            amount = random.randint(min_amount, max_amount)
            transactions.append({
                "source": entity,
                "target": intermediary,
                "amount": amount,
                "timestamp": current_date.strftime("%Y-%m-%d %H:%M:%S")
            })
            transactions.append({
                "source": intermediary,
                "target": entity,
                "amount": amount,
                "timestamp": (current_date + timedelta(minutes=30)).strftime("%Y-%m-%d %H:%M:%S")
            })
        
        # Fan-out pattern (structuring)
        elif patterns.get("fan_out", {}).get("enabled") and roll < patterns.get("fan_out", {}).get("probability", 0) + 0.2:
            source = random.choice(all_entities)
            targets = random.sample([e for e in all_entities if e != source], min(patterns.get("fan_out", {}).get("targets_range", [3, 6])[0], len(all_entities) - 1))
            large_amount = random.randint(max_amount // 2, max_amount)
            split_amount = large_amount // len(targets)
            for target in targets:
                transactions.append({
                    "source": source,
                    "target": target,
                    "amount": split_amount + random.randint(-50, 50),
                    "timestamp": (current_date + timedelta(minutes=random.randint(5, 60))).strftime("%Y-%m-%d %H:%M:%S")
                })
        
        # Normal transaction
        else:
            source = random.choice(all_entities)
            target = random.choice([e for e in all_entities if e != source])
            transactions.append({
                "source": source,
                "target": target,
                "amount": random.randint(min_amount, max_amount),
                "timestamp": current_date.strftime("%Y-%m-%d %H:%M:%S")
            })
        
        # Advance date
        current_date += timedelta(hours=random.randint(1, 24))
        if current_date > end_date:
            current_date = start_date
    
    return {
        "source": "simulated_bank_api",
        "transactions": transactions,
        "count": len(transactions),
        "config_used": "bank_profile.json"
    }


@router.get("/bank/stream")
async def stream_bank_transactions(events: int = 10):
    """
    Simulate a live transaction stream.
    
    Uses config/data_sources/stream_profile.json for config-driven generation.
    Returns N timestamped events like a real-time ledger feed.
    """
    config = load_data_source_config("stream_profile.json")
    
    # Get stream config
    stream_config = config.get("stream", {})
    events = max(stream_config.get("min_events", 5), min(events, stream_config.get("max_events", 100)))
    
    # Get entities
    entities_config = config.get("entities", {})
    entities = entities_config.get("pool", ["Stream_A", "Stream_B", "Stream_C", "Stream_D", "Stream_E"])
    
    # Get amounts
    amounts_config = config.get("amounts", {})
    base_min = amounts_config.get("base_min", 500)
    base_max = amounts_config.get("base_max", 25000)
    noise_factor = amounts_config.get("noise_factor", 0.15)
    
    # Get timing
    timing_config = config.get("timing", {})
    interval_min = timing_config.get("interval_seconds_min", 1)
    interval_max = timing_config.get("interval_seconds_max", 30)
    
    # Get patterns
    patterns = config.get("patterns", {})
    
    transactions = []
    current_time = datetime.now()
    
    i = 0
    while i < events:
        roll = random.random()
        
        # Rapid movement pattern
        if patterns.get("rapid_movement", {}).get("enabled") and roll < patterns["rapid_movement"].get("probability", 0):
            # Chain of quick transactions
            chain = random.sample(entities, min(4, len(entities)))
            base_amount = random.randint(base_min, base_max)
            for j in range(len(chain) - 1):
                if i >= events:
                    break
                transactions.append({
                    "event_id": f"evt_{i:04d}",
                    "source": chain[j],
                    "target": chain[j + 1],
                    "amount": int(base_amount * (1 + random.uniform(-noise_factor, noise_factor))),
                    "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
                })
                current_time += timedelta(seconds=random.randint(1, 5))
                i += 1
        
        # Circular trading in stream
        elif patterns.get("circular", {}).get("enabled") and roll < patterns.get("circular", {}).get("probability", 0) + 0.15:
            ring = random.sample(entities, min(3, len(entities)))
            amount = random.randint(base_min, base_max)
            for j in range(len(ring)):
                if i >= events:
                    break
                transactions.append({
                    "event_id": f"evt_{i:04d}",
                    "source": ring[j],
                    "target": ring[(j + 1) % len(ring)],
                    "amount": amount,
                    "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
                })
                current_time += timedelta(seconds=random.randint(2, 10))
                i += 1
        
        # Normal stream event
        else:
            source = random.choice(entities)
            target = random.choice([e for e in entities if e != source])
            transactions.append({
                "event_id": f"evt_{i:04d}",
                "source": source,
                "target": target,
                "amount": int(random.randint(base_min, base_max) * (1 + random.uniform(-noise_factor, noise_factor))),
                "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
            })
            current_time += timedelta(seconds=random.randint(interval_min, interval_max))
            i += 1
    
    return {
        "source": "live_transaction_stream",
        "events": transactions[:events],  # Ensure exact count
        "count": min(len(transactions), events),
        "config_used": "stream_profile.json"
    }
