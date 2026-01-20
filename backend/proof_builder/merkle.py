"""
Merkle Tree implementation for proof generation.
"""
from typing import List, Dict, Any, Optional
from .hasher import hash_anomaly, merkle_parent_hash


class MerkleTree:
    """
    Binary Merkle tree for anomaly proofs.
    
    Features:
    - Deterministic construction from anomaly list
    - Proof generation for individual anomalies
    - Proof verification
    """
    
    def __init__(self, anomalies: List[dict]):
        """
        Build Merkle tree from anomalies.
        
        Args:
            anomalies: List of anomaly dicts
        """
        self.anomalies = anomalies
        self.leaves = [hash_anomaly(a) for a in anomalies]
        self.tree = self._build_tree(self.leaves)
        self.root = self.tree[-1][0] if self.tree else ""
    
    def _build_tree(self, leaves: List[str]) -> List[List[str]]:
        """
        Build Merkle tree levels bottom-up.
        
        Args:
            leaves: List of leaf hashes
            
        Returns:
            List of tree levels (level 0 = leaves, last level = root)
        """
        if not leaves:
            return []
        
        tree = [leaves]
        current_level = leaves
        
        while len(current_level) > 1:
            next_level = []
            
            for i in range(0, len(current_level), 2):
                left = current_level[i]
                # If odd number of nodes, duplicate the last one
                right = current_level[i + 1] if i + 1 < len(current_level) else left
                
                parent = merkle_parent_hash(left, right)
                next_level.append(parent)
            
            tree.append(next_level)
            current_level = next_level
        
        return tree
    
    def get_proof(self, anomaly_index: int) -> Optional[Dict[str, Any]]:
        """
        Generate Merkle proof for a specific anomaly.
        
        Args:
            anomaly_index: Index of anomaly in original list
            
        Returns:
            Proof dict with path and root, or None if invalid index
        """
        if anomaly_index < 0 or anomaly_index >= len(self.anomalies):
            return None
        
        if not self.tree:
            return None
        
        proof_path = []
        index = anomaly_index
        
        # Traverse from leaf to root, collecting sibling hashes
        for level_idx in range(len(self.tree) - 1):
            level = self.tree[level_idx]
            
            # Determine sibling
            if index % 2 == 0:
                # Current is left child, sibling is right
                sibling_idx = index + 1 if index + 1 < len(level) else index
                position = "left"
            else:
                # Current is right child, sibling is left
                sibling_idx = index - 1
                position = "right"
            
            sibling_hash = level[sibling_idx]
            
            proof_path.append({
                "hash": sibling_hash,
                "position": position
            })
            
            # Move to parent index
            index = index // 2
        
        return {
            "leaf": self.leaves[anomaly_index],
            "root": self.root,
            "path": proof_path,
            "anomaly": self.anomalies[anomaly_index]
        }
    
    @staticmethod
    def verify_proof(leaf: str, proof_path: List[Dict[str, str]], expected_root: str) -> bool:
        """
        Verify a Merkle proof.
        
        Args:
            leaf: Leaf hash to verify
            proof_path: List of {hash, position} dicts
            expected_root: Expected Merkle root
            
        Returns:
            True if proof is valid
        """
        current_hash = leaf
        
        for step in proof_path:
            sibling = step["hash"]
            position = step["position"]
            
            if position == "left":
                # Current node is left, sibling is right
                current_hash = merkle_parent_hash(current_hash, sibling)
            else:
                # Current node is right, sibling is left
                current_hash = merkle_parent_hash(sibling, current_hash)
        
        return current_hash == expected_root
