"""
Proof bundle assembly and management.
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from .merkle import MerkleTree
from .hasher import hash_object, hash_sha256


class ProofBundle:
    """
    Complete proof bundle for an analysis result.
    
    Contains:
    - Merkle root
    - Individual anomaly proofs
    - Metadata (dataset hash, model hash, timestamp)
    - Bundle CID (if stored)
    """
    
    def __init__(
        self,
        task_id: str,
        merkle_root: str,
        dataset_hash: str,
        model_hash: str,
        anomaly_proofs: List[Dict[str, Any]],
        metadata: Dict[str, Any] = None
    ):
        self.task_id = task_id
        self.merkle_root = merkle_root
        self.dataset_hash = dataset_hash
        self.model_hash = model_hash
        self.anomaly_proofs = anomaly_proofs
        self.metadata = metadata or {}
        self.bundle_cid = None
        self.timestamp = datetime.utcnow().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert bundle to dictionary."""
        return {
            "task_id": self.task_id,
            "merkle_root": self.merkle_root,
            "dataset_hash": self.dataset_hash,
            "model_hash": self.model_hash,
            "timestamp": self.timestamp,
            "bundle_cid": self.bundle_cid,
            "anomaly_count": len(self.anomaly_proofs),
            "anomaly_proofs": self.anomaly_proofs,
            "metadata": self.metadata
        }
    
    def set_cid(self, cid: str):
        """Set bundle CID after storage."""
        self.bundle_cid = cid


def build_proof_bundle(
    anomalies: List[dict],
    dataset_hash: str,
    model_hash: str,
    task_id: Optional[str] = None,
    metadata: Dict[str, Any] = None
) -> ProofBundle:
    """
    Build a complete proof bundle from analysis results.
    
    Args:
        anomalies: List of anomaly dicts from analysis
        dataset_hash: SHA-256 hash of input CSV
        model_hash: SHA-256 hash of model identifier
        task_id: Unique task identifier (auto-generated if None)
        metadata: Additional metadata
        
    Returns:
        ProofBundle instance
    """
    if not anomalies:
        # Handle empty anomaly case
        return ProofBundle(
            task_id=task_id or _generate_task_id(dataset_hash, model_hash),
            merkle_root="",
            dataset_hash=dataset_hash,
            model_hash=model_hash,
            anomaly_proofs=[],
            metadata=metadata
        )
    
    # Build Merkle tree
    tree = MerkleTree(anomalies)
    
    # Generate proofs for all anomalies
    anomaly_proofs = []
    for i in range(len(anomalies)):
        proof = tree.get_proof(i)
        if proof:
            anomaly_proofs.append(proof)
    
    # Generate task ID if not provided
    if task_id is None:
        task_id = _generate_task_id(dataset_hash, model_hash)
    
    return ProofBundle(
        task_id=task_id,
        merkle_root=tree.root,
        dataset_hash=dataset_hash,
        model_hash=model_hash,
        anomaly_proofs=anomaly_proofs,
        metadata=metadata
    )


def _generate_task_id(dataset_hash: str, model_hash: str) -> str:
    """Generate deterministic task ID from dataset and model hashes."""
    combined = f"{dataset_hash}:{model_hash}:{datetime.utcnow().isoformat()}"
    return hash_sha256(combined)[:16]  # 16-char hex ID
