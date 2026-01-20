"""
Limit enforcement for uploads and analysis.
"""
from typing import Dict, Any
from fastapi import HTTPException


class LimitEnforcer:
    """
    Enforces execution limits for Render free tier safety.
    """
    
    def __init__(self, limits_config: Dict[str, Any]):
        """
        Initialize with limits configuration.
        
        Args:
            limits_config: Limits dict from config loader
        """
        self.max_upload_bytes = limits_config.get("max_upload_bytes", 5242880)
        self.max_rows_fast_path = limits_config.get("max_rows_fast_path", 2000)
        self.max_rows_deterministic_only = limits_config.get("max_rows_deterministic_only", 5000)
        self.timeout_seconds = limits_config.get("timeout_seconds", 25)
        self.gnn_timeout_seconds = limits_config.get("gnn_timeout_seconds", 15)
    
    def check_upload_size(self, file_size_bytes: int):
        """
        Check if upload size is within limits.
        
        Args:
            file_size_bytes: Size of uploaded file in bytes
            
        Raises:
            HTTPException: If file is too large
        """
        if file_size_bytes > self.max_upload_bytes:
            max_mb = self.max_upload_bytes / (1024 * 1024)
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum upload size: {max_mb:.1f} MB"
            )
    
    def check_row_count(self, row_count: int) -> str:
        """
        Check row count and determine analysis mode.
        
        Args:
            row_count: Number of rows in CSV
            
        Returns:
            Analysis mode: "full", "deterministic_only", or "blocked"
            
        Raises:
            HTTPException: If row count exceeds all limits
        """
        if row_count <= self.max_rows_fast_path:
            return "full"
        elif row_count <= self.max_rows_deterministic_only:
            return "deterministic_only"
        else:
            raise HTTPException(
                status_code=413,
                detail=f"Dataset too large. Maximum rows: {self.max_rows_deterministic_only}. "
                       f"Your dataset has {row_count} rows."
            )
    
    def should_skip_gnn(self, mode: str) -> bool:
        """
        Determine if GNN inference should be skipped.
        
        Args:
            mode: Analysis mode from check_row_count
            
        Returns:
            True if GNN should be skipped
        """
        return mode == "deterministic_only"
