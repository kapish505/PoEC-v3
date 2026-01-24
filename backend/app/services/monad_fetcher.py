"""
Monad RPC Data Fetcher for PoEC v3

Fetches on-chain transaction data from Monad testnet for
GNN-based agent reputation and risk analysis.
"""

import aiohttp
import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from functools import lru_cache

logger = logging.getLogger(__name__)

# Monad Testnet Configuration
MONAD_RPC_URL = "https://testnet.monad.xyz"
MONAD_CHAIN_ID = 10143
MONAD_EXPLORER = "https://explorer.testnet.monad.xyz"


class MonadFetcher:
    """
    Fetches transaction data from Monad RPC for agent analysis.
    
    Supports:
    - Transaction history for addresses
    - Token transfers
    - Contract interactions
    - Block data
    """
    
    def __init__(self, rpc_url: str = None):
        """Initialize Monad fetcher with RPC URL."""
        self.rpc_url = rpc_url or MONAD_RPC_URL
        self.chain_id = MONAD_CHAIN_ID
        self._request_id = 0
    
    def _next_id(self) -> int:
        """Get next JSON-RPC request ID."""
        self._request_id += 1
        return self._request_id
    
    async def _rpc_call(self, method: str, params: List[Any] = None) -> Any:
        """Make JSON-RPC call to Monad."""
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or [],
            "id": self._next_id()
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.rpc_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            ) as response:
                result = await response.json()
                
                if "error" in result:
                    logger.error(f"RPC error: {result['error']}")
                    raise RuntimeError(f"RPC error: {result['error']}")
                
                return result.get("result")
    
    async def get_balance(self, address: str) -> int:
        """Get MON balance for address."""
        result = await self._rpc_call("eth_getBalance", [address, "latest"])
        return int(result, 16) if result else 0
    
    async def get_transaction_count(self, address: str) -> int:
        """Get total transaction count for address."""
        result = await self._rpc_call("eth_getTransactionCount", [address, "latest"])
        return int(result, 16) if result else 0
    
    async def get_block(self, block_number: int = None) -> Dict[str, Any]:
        """Get block by number (latest if None)."""
        block_param = hex(block_number) if block_number else "latest"
        return await self._rpc_call("eth_getBlockByNumber", [block_param, True])
    
    async def get_transaction(self, tx_hash: str) -> Dict[str, Any]:
        """Get transaction by hash."""
        return await self._rpc_call("eth_getTransactionByHash", [tx_hash])
    
    async def get_transaction_receipt(self, tx_hash: str) -> Dict[str, Any]:
        """Get transaction receipt."""
        return await self._rpc_call("eth_getTransactionReceipt", [tx_hash])
    
    async def fetch_recent_transactions(
        self,
        address: str,
        block_range: int = 1000,
        max_transactions: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Fetch recent transactions involving an address.
        
        Args:
            address: Wallet address to analyze
            block_range: Number of blocks to scan
            max_transactions: Maximum transactions to return
        
        Returns:
            List of transaction dictionaries with parsed data
        """
        transactions = []
        address_lower = address.lower()
        
        try:
            # Get current block
            current_block = await self._rpc_call("eth_blockNumber", [])
            current_block_num = int(current_block, 16)
            
            # Scan recent blocks
            start_block = max(0, current_block_num - block_range)
            
            for block_num in range(current_block_num, start_block, -1):
                if len(transactions) >= max_transactions:
                    break
                
                block = await self.get_block(block_num)
                if not block or not block.get("transactions"):
                    continue
                
                for tx in block["transactions"]:
                    if isinstance(tx, str):
                        # Only hash, need to fetch full tx
                        tx = await self.get_transaction(tx)
                    
                    if not tx:
                        continue
                    
                    tx_from = tx.get("from", "").lower()
                    tx_to = (tx.get("to") or "").lower()
                    
                    if tx_from == address_lower or tx_to == address_lower:
                        transactions.append(self._parse_transaction(tx, block))
                        
                        if len(transactions) >= max_transactions:
                            break
            
            logger.info(f"Fetched {len(transactions)} transactions for {address}")
            return transactions
            
        except Exception as e:
            logger.error(f"Error fetching transactions: {e}")
            return []
    
    def _parse_transaction(
        self,
        tx: Dict[str, Any],
        block: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Parse raw transaction into analysis-friendly format."""
        value_wei = int(tx.get("value", "0x0"), 16)
        gas_price = int(tx.get("gasPrice", "0x0"), 16)
        gas = int(tx.get("gas", "0x0"), 16)
        
        return {
            "hash": tx.get("hash"),
            "block_number": int(tx.get("blockNumber", "0x0"), 16),
            "timestamp": int(block.get("timestamp", "0x0"), 16),
            "from": tx.get("from"),
            "to": tx.get("to"),
            "value": value_wei,
            "value_mon": value_wei / 1e18,  # Convert to MON
            "gas": gas,
            "gas_price": gas_price,
            "gas_cost_mon": (gas * gas_price) / 1e18,
            "input": tx.get("input"),
            "is_contract_call": tx.get("input", "0x") != "0x"
        }
    
    async def build_transaction_graph(
        self,
        address: str,
        block_range: int = 1000,
        max_transactions: int = 100
    ) -> Dict[str, Any]:
        """
        Build transaction graph data for GNN analysis.
        
        Returns graph in format compatible with existing GNN engine.
        """
        transactions = await self.fetch_recent_transactions(
            address, block_range, max_transactions
        )
        
        # Build nodes (unique addresses) and edges (transactions)
        nodes = set()
        edges = []
        
        for tx in transactions:
            from_addr = tx["from"]
            to_addr = tx["to"]
            
            if from_addr:
                nodes.add(from_addr)
            if to_addr:
                nodes.add(to_addr)
            
            if from_addr and to_addr:
                edges.append({
                    "source": from_addr,
                    "target": to_addr,
                    "amount": tx["value_mon"],
                    "timestamp": datetime.fromtimestamp(tx["timestamp"]).isoformat(),
                    "hash": tx["hash"]
                })
        
        return {
            "nodes": list(nodes),
            "node_count": len(nodes),
            "edges": edges,
            "edge_count": len(edges),
            "center_address": address,
            "block_range": block_range
        }
    
    async def get_agent_stats(self, address: str) -> Dict[str, Any]:
        """
        Get basic statistics for an agent address.
        """
        balance = await self.get_balance(address)
        tx_count = await self.get_transaction_count(address)
        
        return {
            "address": address,
            "balance_mon": balance / 1e18,
            "transaction_count": tx_count,
            "explorer_url": f"{MONAD_EXPLORER}/address/{address}"
        }


# Factory function
def create_fetcher(rpc_url: str = None) -> MonadFetcher:
    """Create a Monad fetcher instance."""
    return MonadFetcher(rpc_url)
