"""
Fallback modes for graceful degradation.
"""
from typing import Dict, Any


class DeterministicOnlyMode:
    """
    Flags and metadata for deterministic-only analysis mode.
    
    When GNN/ML inference is skipped due to resource constraints,
    this mode ensures deterministic detectors still run.
    """
    
    @staticmethod
    def get_metadata() -> Dict[str, Any]:
        """
        Get metadata for deterministic-only mode.
        
        Returns:
            Dict with mode information
        """
        return {
            "analysis_mode": "deterministic_only",
            "gnn_enabled": False,
            "reason": "Dataset size exceeds fast-path limit",
            "detectors_active": [
                "circular_trading",
                "dense_clusters",
                "wash_trading",
                "structuring"
            ],
            "note": "GNN-based learned anomalies skipped for performance"
        }
    
    @staticmethod
    def should_skip_gnn_slice(slice_key: str, skip_gnn: bool) -> bool:
        """
        Determine if GNN should be skipped for a specific slice.
        
        Args:
            slice_key: Time slice identifier
            skip_gnn: Global skip flag
            
        Returns:
            True if GNN should be skipped
        """
        return skip_gnn
