"""
Configuration loader for PoEC v2.
Loads JSON config files with environment variable override support.
"""
import json
import os
from pathlib import Path
from typing import Dict, Any

# Base directory for configs
CONFIG_DIR = Path(__file__).parent.parent / "config"


class ConfigLoader:
    """Singleton configuration loader."""
    
    _instance = None
    _configs: Dict[str, Any] = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load_all()
        return cls._instance
    
    def _load_all(self):
        """Load all configuration files."""
        self._configs = {
            "limits": self._load_json("limits.json"),
            "models": self._load_json("models.json"),
            "storage": self._load_json("storage.json"),
            "blockchain": self._load_json("blockchain.json"),
        }
    
    def _load_json(self, filename: str) -> Dict[str, Any]:
        """Load a JSON config file."""
        filepath = CONFIG_DIR / filename
        if not filepath.exists():
            print(f"WARNING: Config file {filename} not found, using defaults")
            return {}
        
        with open(filepath, 'r') as f:
            return json.load(f)
    
    def get_limits(self, environment: str = None) -> Dict[str, Any]:
        """Get limits for the current environment."""
        if environment is None:
            environment = os.getenv("POEC_ENV", "development")
        
        limits_config = self._configs.get("limits", {})
        return limits_config.get(environment, limits_config.get("development", {}))
    
    def get_models_config(self) -> Dict[str, Any]:
        """Get model configuration."""
        return self._configs.get("models", {})
    
    def get_storage_config(self) -> Dict[str, Any]:
        """Get storage configuration."""
        return self._configs.get("storage", {})
    
    def get_blockchain_config(self, network: str = None) -> Dict[str, Any]:
        """Get blockchain configuration for a specific network."""
        blockchain_config = self._configs.get("blockchain", {})
        
        if network is None:
            network = os.getenv("BLOCKCHAIN_NETWORK", blockchain_config.get("default_network", "hardhat"))
        
        networks = blockchain_config.get("networks", {})
        return networks.get(network, networks.get("hardhat", {}))
    
    def get_country_profile(self, profile_id: str = "india_gst") -> Dict[str, Any]:
        """Load a country-specific tax profile."""
        filepath = CONFIG_DIR / "country_profiles" / f"{profile_id}.json"
        
        if not filepath.exists():
            print(f"WARNING: Country profile {profile_id} not found")
            return {}
        
        with open(filepath, 'r') as f:
            return json.load(f)


# Singleton instance
config_loader = ConfigLoader()
