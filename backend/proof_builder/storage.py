"""
Storage adapters for proof bundles.
"""
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod


class StorageAdapter(ABC):
    """Abstract storage adapter interface."""
    
    @abstractmethod
    def store(self, bundle_dict: Dict[str, Any]) -> str:
        """
        Store a proof bundle.
        
        Args:
            bundle_dict: Bundle dictionary
            
        Returns:
            Content identifier (CID, path, or URL)
        """
        pass
    
    @abstractmethod
    def retrieve(self, cid: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a proof bundle.
        
        Args:
            cid: Content identifier
            
        Returns:
            Bundle dictionary or None if not found
        """
        pass


class LocalStorageAdapter(StorageAdapter):
    """
    Local filesystem storage adapter.
    
    Stores proof bundles as JSON files in a local directory.
    """
    
    def __init__(self, storage_path: str = "./proof_bundles"):
        self.storage_path = Path(storage_path).resolve()
        self.storage_path.mkdir(parents=True, exist_ok=True)
    
    def store(self, bundle_dict: Dict[str, Any]) -> str:
        """Store bundle to local file."""
        task_id = bundle_dict.get("task_id", "unknown")
        filename = f"{task_id}.json"
        filepath = self.storage_path / filename
        
        with open(filepath, 'w') as f:
            json.dump(bundle_dict, f, indent=2)
        
        # Return relative path as CID
        return str(filepath.relative_to(Path.cwd()))
    
    def retrieve(self, cid: str) -> Optional[Dict[str, Any]]:
        """Retrieve bundle from local file."""
        filepath = Path(cid)
        
        if not filepath.exists():
            return None
        
        with open(filepath, 'r') as f:
            return json.load(f)


class IPFSStorageAdapter(StorageAdapter):
    """
    IPFS storage adapter.
    
    Stores proof bundles on IPFS network.
    Requires ipfshttpclient package and running IPFS node.
    """
    
    def __init__(self, node_url: str = "/ip4/127.0.0.1/tcp/5001"):
        try:
            import ipfshttpclient
            self.client = ipfshttpclient.connect(node_url)
            self.enabled = True
        except Exception as e:
            print(f"WARNING: IPFS client initialization failed: {e}")
            self.enabled = False
            self.client = None
    
    def store(self, bundle_dict: Dict[str, Any]) -> str:
        """Store bundle to IPFS."""
        if not self.enabled:
            raise RuntimeError("IPFS storage not available")
        
        # Convert to JSON string
        json_str = json.dumps(bundle_dict, indent=2)
        
        # Add to IPFS
        result = self.client.add_json(bundle_dict)
        
        return result  # Returns CID
    
    def retrieve(self, cid: str) -> Optional[Dict[str, Any]]:
        """Retrieve bundle from IPFS."""
        if not self.enabled:
            return None
        
        try:
            return self.client.get_json(cid)
        except:
            return None


class PinataStorageAdapter(StorageAdapter):
    """
    Pinata IPFS storage adapter.
    """
    def __init__(self, jwt: str = None, gateway: str = "https://gateway.pinata.cloud/ipfs/"):
        self.jwt = jwt or os.getenv("PINATA_JWT")
        self.gateway = gateway
        self.enabled = bool(self.jwt)
        if not self.enabled:
            print("WARNING: PINATA_JWT not found. Pinata storage disabled.")

    def store(self, bundle_dict: Dict[str, Any]) -> str:
        if not self.enabled:
            raise RuntimeError("Pinata storage not configured")
        
        import httpx
        url = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
        headers = {
            "Authorization": f"Bearer {self.jwt}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "pinataOptions": {"cidVersion": 1},
            "pinataMetadata": {"name": f"PoEC_Proof_{bundle_dict.get('task_id', 'unknown')}"},
            "pinataContent": bundle_dict
        }
        
        # Use sync client conformant to interface
        with httpx.Client() as client:
            resp = client.post(url, json=payload, headers=headers, timeout=30.0)
            resp.raise_for_status()
            return resp.json()["IpfsHash"]

    def retrieve(self, cid: str) -> Optional[Dict[str, Any]]:
        if not self.enabled:
            return None
        import httpx
        try:
            with httpx.Client() as client:
                resp = client.get(f"{self.gateway}{cid}", timeout=30.0)
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            print(f"Pinata retrieve failed: {e}")
        return None

def get_storage_adapter(config: Dict[str, Any] = None) -> StorageAdapter:
    """
    Factory function to get storage adapter based on config.
    """
    if config is None:
        # Check env for override
        if os.getenv("STORAGE_TYPE") == "pinata":
             return PinataStorageAdapter()
        return LocalStorageAdapter()
    
    default_adapter = config.get("default_adapter", "local")
    
    if os.getenv("STORAGE_TYPE") == "pinata" or default_adapter == "pinata":
         return PinataStorageAdapter()
    
    adapters = config.get("adapters", {})
    if default_adapter == "ipfs" and adapters.get("ipfs", {}).get("enabled", False):
        ipfs_config = adapters["ipfs"]
        return IPFSStorageAdapter(node_url=ipfs_config.get("node_url", "/ip4/127.0.0.1/tcp/5001"))
    else:
        local_config = adapters.get("local", {})
        return LocalStorageAdapter(storage_path=local_config.get("storage_path", "./proof_bundles"))
