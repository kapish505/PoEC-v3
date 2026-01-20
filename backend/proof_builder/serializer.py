"""
Canonical JSON serialization for deterministic hashing.
"""
import json
from typing import Any


def canonicalize_json(obj: Any) -> str:
    """
    Convert a Python object to canonical JSON string.
    
    Features:
    - Sorted keys (alphabetically)
    - No whitespace
    - Deterministic serialization
    - UTF-8 encoding safe
    
    Args:
        obj: Any JSON-serializable Python object
        
    Returns:
        Canonical JSON string
    """
    return json.dumps(
        obj,
        sort_keys=True,
        separators=(',', ':'),
        ensure_ascii=False
    )


def serialize_anomaly(anomaly: dict) -> str:
    """
    Serialize an anomaly object to canonical JSON.
    
    Extracts only the fields needed for proof verification:
    - anomaly_id
    - anomaly_type
    - severity
    - entities_involved
    - detection_method
    - confidence
    
    Args:
        anomaly: Anomaly dict (from Pydantic model)
        
    Returns:
        Canonical JSON string
    """
    # Extract only stable fields (no timestamps, no descriptions that might change)
    proof_data = {
        "anomaly_id": anomaly.get("anomaly_id"),
        "anomaly_type": anomaly.get("anomaly_type"),
        "severity": anomaly.get("severity"),
        "entities_involved": sorted(anomaly.get("entities_involved", [])),  # Sort for determinism
        "detection_method": anomaly.get("detection_method"),
        "confidence": anomaly.get("confidence"),
    }
    
    return canonicalize_json(proof_data)
