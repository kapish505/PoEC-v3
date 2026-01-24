"""
Transaction Cache Service for PoEC v3

Provides caching layer for Monad RPC responses to reduce 
API calls and improve performance.
"""

import asyncio
import time
from typing import Dict, Any, Optional
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)


class TransactionCache:
    """
    In-memory cache for transaction data from Monad RPC.
    
    Features:
    - TTL-based expiration
    - LRU eviction when full
    - Thread-safe operations
    """
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 300):
        """
        Initialize cache.
        
        Args:
            max_size: Maximum entries to store
            ttl_seconds: Time-to-live for entries (default 5 minutes)
        """
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._timestamps: Dict[str, float] = {}
        self._lock = asyncio.Lock()
    
    def _make_key(self, address: str, data_type: str, params: Dict = None) -> str:
        """Generate cache key from address and parameters."""
        key = f"{address.lower()}:{data_type}"
        if params:
            param_str = ":".join(f"{k}={v}" for k, v in sorted(params.items()))
            key += f":{param_str}"
        return key
    
    async def get(
        self,
        address: str,
        data_type: str,
        params: Dict = None
    ) -> Optional[Any]:
        """
        Get cached data if available and not expired.
        
        Args:
            address: Agent wallet address
            data_type: Type of data (identity, history, reputation)
            params: Additional query parameters
        
        Returns:
            Cached data or None if not found/expired
        """
        async with self._lock:
            key = self._make_key(address, data_type, params)
            
            if key not in self._cache:
                return None
            
            # Check TTL
            timestamp = self._timestamps.get(key, 0)
            if time.time() - timestamp > self.ttl_seconds:
                # Expired, remove entry
                del self._cache[key]
                del self._timestamps[key]
                logger.debug(f"Cache miss (expired): {key}")
                return None
            
            logger.debug(f"Cache hit: {key}")
            return self._cache[key]
    
    async def set(
        self,
        address: str,
        data_type: str,
        data: Any,
        params: Dict = None
    ) -> None:
        """
        Store data in cache.
        
        Args:
            address: Agent wallet address
            data_type: Type of data
            data: Data to cache
            params: Additional query parameters
        """
        async with self._lock:
            key = self._make_key(address, data_type, params)
            
            # Evict oldest if at capacity
            if len(self._cache) >= self.max_size:
                oldest_key = min(self._timestamps, key=self._timestamps.get)
                del self._cache[oldest_key]
                del self._timestamps[oldest_key]
                logger.debug(f"Cache evicted: {oldest_key}")
            
            self._cache[key] = data
            self._timestamps[key] = time.time()
            logger.debug(f"Cache set: {key}")
    
    async def invalidate(self, address: str = None, data_type: str = None) -> int:
        """
        Invalidate cache entries.
        
        Args:
            address: Specific address to invalidate (None = all)
            data_type: Specific data type to invalidate (None = all)
        
        Returns:
            Number of entries invalidated
        """
        async with self._lock:
            if address is None and data_type is None:
                # Clear all
                count = len(self._cache)
                self._cache.clear()
                self._timestamps.clear()
                return count
            
            # Filter keys to remove
            keys_to_remove = []
            for key in self._cache.keys():
                if address and not key.startswith(address.lower()):
                    continue
                if data_type and f":{data_type}" not in key:
                    continue
                keys_to_remove.append(key)
            
            for key in keys_to_remove:
                del self._cache[key]
                del self._timestamps[key]
            
            return len(keys_to_remove)
    
    async def stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        async with self._lock:
            return {
                "size": len(self._cache),
                "max_size": self.max_size,
                "ttl_seconds": self.ttl_seconds,
                "utilization": len(self._cache) / self.max_size if self.max_size > 0 else 0
            }


# Global cache instance
_cache_instance: Optional[TransactionCache] = None


def get_cache() -> TransactionCache:
    """Get or create global cache instance."""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = TransactionCache()
    return _cache_instance


async def cached_fetch(
    fetcher_func,
    address: str,
    data_type: str,
    params: Dict = None,
    bypass_cache: bool = False
) -> Any:
    """
    Wrapper for fetching with cache.
    
    Args:
        fetcher_func: Async function to fetch data
        address: Address to fetch for
        data_type: Type of data
        params: Additional parameters
        bypass_cache: Skip cache lookup
    
    Returns:
        Data from cache or fresh fetch
    """
    cache = get_cache()
    
    if not bypass_cache:
        cached = await cache.get(address, data_type, params)
        if cached is not None:
            return cached
    
    # Fetch fresh data
    data = await fetcher_func(address, **(params or {}))
    
    # Store in cache
    await cache.set(address, data_type, data, params)
    
    return data
