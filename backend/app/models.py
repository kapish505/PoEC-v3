from pydantic import BaseModel, Field

from typing import List, Optional
from datetime import datetime

class Transaction(BaseModel):
    transaction_id: str
    source_entity: str
    target_entity: str
    amount: float
    currency: str = "USD"
    timestamp: datetime
    transaction_type: str
    
    # --- Context & Observational Data ---
    entity_context: Optional[str] = "global"
    counterparty_context: Optional[str] = "global"
    
    # Observational Overlay (GST/VAT) - NOT used for detection logic
    tax_type: Optional[str] = None # GST, VAT, NONE
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    input_tax_credit: Optional[float] = None
    entity_size: Optional[str] = None # SME, Enterprise

class IngestResponse(BaseModel):
    batch_id: str
    record_count: int
    content_hash: str
    message: str
    graph_data: Optional[dict] = None

class Anomaly(BaseModel):
    anomaly_id: str
    anomaly_type: str  # CIRCULAR, DENSE_CLUSTER, GROWTH_SPIKE
    severity: float    # 0.0 to 1.0
    entities_involved: List[str]
    description: str
    evidence_data: dict
    confidence: str = "Low" # Low, Medium, High
    detection_method: str = "UNKNOWN" # LEARNED, DETERMINISTIC
    explanation_metadata: dict = {} # Structured metrics

class GraphSnapshot(BaseModel):
    snapshot_id: str
    start_date: datetime
    end_date: datetime
    node_count: int
    edge_count: int
    data_hash: str
