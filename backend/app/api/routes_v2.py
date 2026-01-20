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
from config_loader import config_loader
from proof_builder import build_proof_bundle, MerkleTree
from proof_builder.storage import get_storage_adapter
from wrappers import LimitEnforcer

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
