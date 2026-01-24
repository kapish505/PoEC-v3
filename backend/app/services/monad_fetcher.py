"""
Monad RPC Data Fetcher for PoEC v3

Fetches on-chain transaction data from Monad testnet for
GNN-based agent reputation and risk analysis.

Features:
- Retry logic with exponential backoff
- RPC provider switching (monad/alchemy)
- 1-hop connected address expansion
- Configurable block range
"""

import aiohttp
import asyncio
import os
import logging
from typing import Dict, Any, List, Optional, Set
from datetime import datetime

logger = logging.getLogger(__name__)

# ============================================================================
# Configuration
# ============================================================================

# RPC Provider settings
RPC_PROVIDER = os.getenv("RPC_PROVIDER", "monad")  # "monad" or "alchemy"
MONAD_RPC_URL = "https://testnet-rpc.monad.xyz"
ALCHEMY_MONAD_URL = os.getenv("ALCHEMY_MONAD_URL", "https://monad-testnet.g.alchemy.com/v2/demo")

MONAD_CHAIN_ID = 10143
MONAD_EXPLORER = "https://testnet.monadexplorer.com"

# Retry settings
MAX_RETRIES = 3
RETRY_DELAYS = [0.5, 1.0, 2.0]  # Exponential backoff

# Default settings
DEFAULT_BLOCK_RANGE = 500
DEFAULT_MAX_TRANSACTIONS = 200


def get_default_rpc_url() -> str:
    """Get RPC URL based on provider setting."""
    if RPC_PROVIDER.lower() == "alchemy":
        return ALCHEMY_MONAD_URL
    return MONAD_RPC_URL


class MonadFetcher:
    """
    Fetches transaction data from Monad RPC for agent analysis.
    
    Features:
    - Retry logic with exponential backoff
    - 1-hop connected address expansion
    - Configurable block range
    - RPC provider switching
    """
    
    def __init__(self, rpc_url: Optional[str] = None):
        """
        Initialize Monad fetcher.
        
        Args:
            rpc_url: Custom RPC URL. If None, uses RPC_PROVIDER setting.
        """
        self.rpc_url = rpc_url or get_default_rpc_url()
        self.chain_id = MONAD_CHAIN_ID
        self._request_id = 0
        logger.info(f"MonadFetcher initialized with RPC: {self.rpc_url[:50]}...")
    
    def _next_id(self) -> int:
        """Get next JSON-RPC request ID."""
        self._request_id += 1
        return self._request_id
    
    async def _rpc_call(self, method: str, params: List[Any] = None) -> Any:
        """Make JSON-RPC call to Monad (single attempt)."""
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
                headers={"Content-Type": "application/json"},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                result = await response.json()
                
                if "error" in result:
                    raise RuntimeError(f"RPC error: {result['error']}")
                
                return result.get("result")
    
    async def _rpc_call_with_retry(
        self, 
        method: str, 
        params: List[Any] = None,
        max_retries: int = MAX_RETRIES
    ) -> Any:
        """
        Make JSON-RPC call with retry logic.
        
        Retries 3 times with exponential backoff: 0.5s, 1s, 2s
        """
        last_error = None
        
        for attempt in range(max_retries):
            try:
                return await self._rpc_call(method, params)
            except Exception as e:
                last_error = e
                if attempt < max_retries - 1:
                    delay = RETRY_DELAYS[attempt]
                    logger.warning(f"RPC call failed (attempt {attempt + 1}/{max_retries}), retrying in {delay}s: {e}")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"RPC call failed after {max_retries} attempts: {e}")
        
        raise last_error or RuntimeError("RPC call failed")
    
    async def get_balance(self, address: str) -> int:
        """Get MON balance for address."""
        result = await self._rpc_call_with_retry("eth_getBalance", [address, "latest"])
        return int(result, 16) if result else 0
    
    async def get_transaction_count(self, address: str) -> int:
        """Get total transaction count for address."""
        result = await self._rpc_call_with_retry("eth_getTransactionCount", [address, "latest"])
        return int(result, 16) if result else 0
    
    async def get_block(self, block_number: int = None) -> Dict[str, Any]:
        """Get block by number (latest if None)."""
        block_param = hex(block_number) if block_number else "latest"
        return await self._rpc_call_with_retry("eth_getBlockByNumber", [block_param, True])
    
    async def get_current_block_number(self) -> int:
        """Get current block number."""
        result = await self._rpc_call_with_retry("eth_blockNumber", [])
        return int(result, 16) if result else 0
    
    async def get_transaction(self, tx_hash: str) -> Dict[str, Any]:
        """Get transaction by hash."""
        return await self._rpc_call_with_retry("eth_getTransactionByHash", [tx_hash])
    
    async def fetch_transactions(
        self,
        address: str,  # Required - no default
        block_range: int = DEFAULT_BLOCK_RANGE,
        max_transactions: int = DEFAULT_MAX_TRANSACTIONS,
        expand_hops: int = 1  # 1-hop expansion
    ) -> Dict[str, Any]:
        """
        Fetch transactions for an address with 1-hop expansion.
        
        Args:
            address: Wallet address to analyze (required)
            block_range: Number of blocks to scan (default: 500)
            max_transactions: Maximum transactions to return
            expand_hops: Number of hops to expand (default: 1)
        
        Returns:
            {
                "transactions": [...],
                "addresses": [...],
                "block_range": { "start": int, "end": int },
                "fetched_at": str
            }
        """
        if not address or address == "0x0000000000000000000000000000000000000000":
            raise ValueError("Valid agent address required")
        
        address_lower = address.lower()
        all_transactions: List[Dict[str, Any]] = []
        all_addresses: Set[str] = {address_lower}
        
        try:
            # Get current block
            current_block = await self.get_current_block_number()
            start_block = max(0, current_block - block_range)
            
            logger.info(f"Fetching blocks {start_block} to {current_block} for {address[:10]}...")
            
            # Phase 1: Fetch transactions for primary address
            primary_txs, connected = await self._fetch_address_transactions(
                address_lower, start_block, current_block, max_transactions // 2
            )
            all_transactions.extend(primary_txs)
            all_addresses.update(connected)
            
            # Phase 2: Expand to 1-hop connected addresses
            if expand_hops >= 1 and connected:
                logger.info(f"Expanding to {len(connected)} connected addresses...")
                remaining = max_transactions - len(all_transactions)
                per_address = max(5, remaining // len(connected))
                
                for conn_addr in list(connected)[:10]:  # Limit to 10 connected addresses
                    if len(all_transactions) >= max_transactions:
                        break
                    
                    try:
                        hop_txs, _ = await self._fetch_address_transactions(
                            conn_addr, start_block, current_block, per_address
                        )
                        all_transactions.extend(hop_txs)
                    except Exception as e:
                        logger.warning(f"Failed to fetch for {conn_addr[:10]}: {e}")
            
            # Deduplicate by tx hash
            seen_hashes = set()
            unique_txs = []
            for tx in all_transactions:
                if tx["hash"] not in seen_hashes:
                    seen_hashes.add(tx["hash"])
                    unique_txs.append(tx)
                    # Collect all addresses
                    if tx["from"]:
                        all_addresses.add(tx["from"].lower())
                    if tx["to"]:
                        all_addresses.add(tx["to"].lower())
            
            logger.info(f"Fetched {len(unique_txs)} unique transactions, {len(all_addresses)} addresses")
            
            return {
                "transactions": unique_txs[:max_transactions],
                "addresses": list(all_addresses),
                "block_range": {"start": start_block, "end": current_block},
                "center_address": address,
                "fetched_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error fetching transactions: {e}")
            raise
    
    async def _fetch_address_transactions(
        self,
        address: str,
        start_block: int,
        end_block: int,
        max_txs: int
    ) -> tuple:
        """
        Fetch transactions for a single address.
        
        Optimized approach: scan only most recent 50 blocks to avoid timeout.
        """
        transactions = []
        connected_addresses: Set[str] = set()
        address_lower = address.lower()
        
        # Limit scan to most recent 50 blocks to avoid timeout
        actual_start = max(start_block, end_block - 50)
        
        logger.info(f"Scanning blocks {actual_start} to {end_block} for {address_lower[:10]}...")
        
        # Scan blocks (most recent first)
        for block_num in range(end_block, actual_start, -1):
            if len(transactions) >= max_txs:
                break
            
            try:
                block = await self.get_block(block_num)
                if not block or not block.get("transactions"):
                    continue
                
                for tx in block["transactions"]:
                    if isinstance(tx, str):
                        continue  # Skip if only hash
                    
                    tx_from = (tx.get("from") or "").lower()
                    tx_to = (tx.get("to") or "").lower()
                    
                    if tx_from == address_lower or tx_to == address_lower:
                        parsed = self._parse_transaction(tx, block)
                        transactions.append(parsed)
                        
                        # Track connected addresses
                        if tx_from and tx_from != address_lower:
                            connected_addresses.add(tx_from)
                        if tx_to and tx_to != address_lower:
                            connected_addresses.add(tx_to)
                        
                        if len(transactions) >= max_txs:
                            break
            except asyncio.TimeoutError:
                logger.warning(f"Timeout fetching block {block_num}, continuing...")
                continue
            except Exception as e:
                logger.warning(f"Error fetching block {block_num}: {e}")
                continue
        
        return transactions, connected_addresses
    
    def _parse_transaction(
        self,
        tx: Dict[str, Any],
        block: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Parse raw transaction into GNN-compatible format."""
        value_wei = int(tx.get("value", "0x0"), 16)
        gas_price = int(tx.get("gasPrice", "0x0"), 16)
        gas = int(tx.get("gas", "0x0"), 16)
        timestamp = int(block.get("timestamp", "0x0"), 16)
        
        return {
            "hash": tx.get("hash"),
            "block_number": int(tx.get("blockNumber", "0x0"), 16),
            "timestamp": timestamp,
            # GNN-compatible schema (matches CSV format)
            "source": tx.get("from"),
            "target": tx.get("to"),
            "amount": value_wei / 1e18,  # MON
            "date": datetime.fromtimestamp(timestamp).isoformat() if timestamp else None,
            # Extra fields
            "from": tx.get("from"),
            "to": tx.get("to"),
            "value": value_wei,
            "value_mon": value_wei / 1e18,
            "gas": gas,
            "gas_price": gas_price,
            "gas_cost_mon": (gas * gas_price) / 1e18,
            "input": tx.get("input"),
            "is_contract_call": tx.get("input", "0x") != "0x"
        }
    
    async def build_transaction_graph(
        self,
        address: str,  # Required
        block_range: int = DEFAULT_BLOCK_RANGE,
        max_transactions: int = DEFAULT_MAX_TRANSACTIONS
    ) -> Dict[str, Any]:
        """
        Build transaction graph for GNN analysis.
        
        Returns graph in format compatible with existing GNN engine.
        """
        # Fetch transactions with 1-hop expansion
        fetch_result = await self.fetch_transactions(
            address, block_range, max_transactions
        )
        
        transactions = fetch_result["transactions"]
        
        # Build nodes and edges
        nodes = set()
        edges = []
        
        for tx in transactions:
            from_addr = tx["source"] or tx["from"]
            to_addr = tx["target"] or tx["to"]
            
            if from_addr:
                nodes.add(from_addr)
            if to_addr:
                nodes.add(to_addr)
            
            if from_addr and to_addr:
                edges.append({
                    "source": from_addr,
                    "target": to_addr,
                    "amount": tx["amount"],
                    "date": tx["date"],
                    "hash": tx["hash"]
                })
        
        return {
            "nodes": list(nodes),
            "node_count": len(nodes),
            "edges": edges,
            "edge_count": len(edges),
            "center_address": address,
            "block_range": fetch_result["block_range"],
            "transactions": transactions,  # Include raw transactions
            "fetched_at": fetch_result["fetched_at"]
        }
    
    async def get_agent_stats(self, address: str) -> Dict[str, Any]:
        """Get basic statistics for an agent address."""
        balance = await self.get_balance(address)
        tx_count = await self.get_transaction_count(address)
        
        return {
            "address": address,
            "balance_mon": balance / 1e18,
            "transaction_count": tx_count,
            "explorer_url": f"{MONAD_EXPLORER}/address/{address}"
        }


# Factory function
def create_fetcher(rpc_url: Optional[str] = None) -> MonadFetcher:
    """Create a Monad fetcher instance."""
    return MonadFetcher(rpc_url)
