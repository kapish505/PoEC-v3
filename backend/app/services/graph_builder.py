"""
Graph Builder Service for PoEC v3

Converts raw transaction data from Monad RPC into GNN-compatible
graph format for anomaly detection.
"""

import hashlib
import logging
from typing import Dict, Any, List, Set
from datetime import datetime

logger = logging.getLogger(__name__)


class GraphBuilder:
    """
    Builds in-memory graph from transaction data.
    
    Graph format matches existing GNN schema:
    - nodes: unique addresses with metadata
    - edges: transactions with source/target/amount/date
    """
    
    def __init__(self):
        """Initialize graph builder."""
        pass
    
    def build_from_transactions(
        self,
        transactions: List[Dict[str, Any]],
        center_address: str = None
    ) -> Dict[str, Any]:
        """
        Build graph from transaction list.
        
        Args:
            transactions: List of transaction dicts with source/target/amount/date
            center_address: Optional center address for the graph
        
        Returns:
            {
                "nodes": [{"id": "0x...", "in_degree": 5, "out_degree": 3, ...}],
                "edges": [{"source": "0x...", "target": "0x...", "amount": 0.5, "date": "..."}],
                "node_count": int,
                "edge_count": int,
                "data_hash": str
            }
        """
        # Track nodes with metadata
        node_metadata: Dict[str, Dict[str, Any]] = {}
        edges: List[Dict[str, Any]] = []
        
        for tx in transactions:
            source = (tx.get("source") or tx.get("from") or "").lower()
            target = (tx.get("target") or tx.get("to") or "").lower()
            amount = float(tx.get("amount") or tx.get("value_mon") or 0)
            date = tx.get("date") or tx.get("timestamp")
            tx_hash = tx.get("hash", "")
            
            # Skip invalid transactions
            if not source or not target:
                continue
            
            # Initialize nodes if needed
            if source not in node_metadata:
                node_metadata[source] = {
                    "id": source,
                    "in_degree": 0,
                    "out_degree": 0,
                    "total_sent": 0.0,
                    "total_received": 0.0,
                    "tx_count": 0
                }
            
            if target not in node_metadata:
                node_metadata[target] = {
                    "id": target,
                    "in_degree": 0,
                    "out_degree": 0,
                    "total_sent": 0.0,
                    "total_received": 0.0,
                    "tx_count": 0
                }
            
            # Update node metadata
            node_metadata[source]["out_degree"] += 1
            node_metadata[source]["total_sent"] += amount
            node_metadata[source]["tx_count"] += 1
            
            node_metadata[target]["in_degree"] += 1
            node_metadata[target]["total_received"] += amount
            node_metadata[target]["tx_count"] += 1
            
            # Add edge (GNN schema: source, target, amount, date)
            edges.append({
                "source": source,
                "target": target,
                "amount": amount,
                "date": date if isinstance(date, str) else str(date) if date else None,
                "hash": tx_hash
            })
        
        # Build nodes list with computed features
        nodes = []
        for addr, meta in node_metadata.items():
            node = {
                "id": addr,
                "label": addr[:8] + "..." + addr[-4:] if len(addr) > 12 else addr,
                "in_degree": meta["in_degree"],
                "out_degree": meta["out_degree"],
                "total_sent": meta["total_sent"],
                "total_received": meta["total_received"],
                "net_flow": meta["total_received"] - meta["total_sent"],
                "tx_count": meta["tx_count"],
                "is_center": addr.lower() == (center_address or "").lower()
            }
            nodes.append(node)
        
        # Compute data hash for verification
        data_hash = self._compute_data_hash(transactions)
        
        logger.info(f"Built graph: {len(nodes)} nodes, {len(edges)} edges")
        
        return {
            "nodes": nodes,
            "edges": edges,
            "node_count": len(nodes),
            "edge_count": len(edges),
            "center_address": center_address,
            "data_hash": data_hash
        }
    
    def _compute_data_hash(self, transactions: List[Dict[str, Any]]) -> str:
        """Compute SHA256 hash of transaction data for verification."""
        hasher = hashlib.sha256()
        
        # Sort transactions by hash for deterministic hashing
        sorted_txs = sorted(transactions, key=lambda x: x.get("hash", ""))
        
        for tx in sorted_txs:
            tx_str = f"{tx.get('hash', '')}:{tx.get('source', '')}:{tx.get('target', '')}:{tx.get('amount', 0)}"
            hasher.update(tx_str.encode())
        
        return hasher.hexdigest()
    
    def to_gnn_format(self, graph: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert graph to format expected by GNN model.
        
        Returns edge list format with source/target/amount/date columns.
        """
        # GNN expects: list of edges with specific columns
        edges_for_gnn = []
        
        for edge in graph["edges"]:
            edges_for_gnn.append({
                "source": edge["source"],
                "target": edge["target"],
                "amount": edge["amount"],
                "date": edge["date"]
            })
        
        return {
            "edges": edges_for_gnn,
            "nodes": [n["id"] for n in graph["nodes"]],
            "data_hash": graph.get("data_hash", "")
        }


# Singleton instance
_builder_instance = None


def get_graph_builder() -> GraphBuilder:
    """Get or create graph builder instance."""
    global _builder_instance
    if _builder_instance is None:
        _builder_instance = GraphBuilder()
    return _builder_instance


def build_graph(transactions: List[Dict[str, Any]], center_address: str = None) -> Dict[str, Any]:
    """Convenience function to build graph from transactions."""
    builder = get_graph_builder()
    return builder.build_from_transactions(transactions, center_address)
