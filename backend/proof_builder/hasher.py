"""
SHA-256 hashing utilities.
"""
import hashlib
from typing import Union, Any
from .serializer import canonicalize_json


def hash_sha256(data: Union[str, bytes]) -> str:
    """
    Compute SHA-256 hash of data.
    
    Args:
        data: String or bytes to hash
        
    Returns:
        Hexadecimal hash string (64 characters)
    """
    if isinstance(data, str):
        data = data.encode('utf-8')
    
    return hashlib.sha256(data).hexdigest()


def hash_object(obj: Any) -> str:
    """
    Hash a Python object via canonical JSON serialization.
    
    Args:
        obj: Any JSON-serializable object
        
    Returns:
        SHA-256 hash (hex string)
    """
    canonical = canonicalize_json(obj)
    return hash_sha256(canonical)


def hash_anomaly(anomaly: dict) -> str:
    """
    Hash an anomaly object (leaf hash for Merkle tree).
    
    Args:
        anomaly: Anomaly dict
        
    Returns:
        SHA-256 hash of canonical anomaly representation
    """
    from .serializer import serialize_anomaly
    canonical = serialize_anomaly(anomaly)
    return hash_sha256(canonical)


def merkle_parent_hash(left: str, right: str) -> str:
    """
    Compute parent hash in Merkle tree.
    
    Args:
        left: Left child hash (hex string)
        right: Right child hash (hex string)
        
    Returns:
        SHA-256 hash of concatenated children
    """
    # Ensure consistent ordering (left < right lexicographically)
    if left > right:
        left, right = right, left
    
    combined = left + right
    return hash_sha256(combined)
