"""
ZK Prover Service for PoEC v3

Generates Groth16 zero-knowledge proofs of GNN risk computations
using snarkjs and Circom circuits.
"""

import subprocess
import json
import hashlib
import tempfile
import os
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class ZKProver:
    """
    Zero-Knowledge Prover for GNN risk score verification.
    
    Uses Circom + snarkjs to generate Groth16 proofs that verify:
    1. Risk score was computed from valid features
    2. Score meets/exceeds threshold
    3. Computation is bound to specific data hash
    """
    
    def __init__(self, circuit_dir: str = None):
        """Initialize the ZK Prover with circuit directory."""
        if circuit_dir is None:
            # Default to project root circuits directory
            circuit_dir = Path(__file__).parent.parent.parent.parent / "circuits"
        
        self.circuit_dir = Path(circuit_dir)
        self.circuit_wasm = self.circuit_dir / "gnn_proof_js" / "gnn_proof.wasm"
        self.circuit_zkey = self.circuit_dir / "gnn_proof.zkey"
        self.verification_key = self.circuit_dir / "verification_key.json"
        
        self._check_circuit_files()
    
    def _check_circuit_files(self):
        """Check if compiled circuit files exist."""
        if not self.circuit_wasm.exists():
            logger.warning(f"Circuit WASM not found at {self.circuit_wasm}. Run compile_circuit() first.")
        if not self.circuit_zkey.exists():
            logger.warning(f"Circuit zkey not found at {self.circuit_zkey}. Run setup_keys() first.")
    
    @staticmethod
    def hash_data(data: Any) -> int:
        """Hash data to a field element for circuit input."""
        if isinstance(data, str):
            data = data.encode()
        elif isinstance(data, dict):
            data = json.dumps(data, sort_keys=True).encode()
        
        hash_bytes = hashlib.sha256(data).digest()
        # Take first 31 bytes to fit in BN254 field
        return int.from_bytes(hash_bytes[:31], 'big')
    
    @staticmethod
    def address_to_field(address: str) -> int:
        """Convert Ethereum address to field element."""
        # Remove 0x prefix if present
        addr = address.lower().replace('0x', '')
        return int(addr, 16)
    
    def generate_witness(
        self,
        data_hash: int,
        threshold: int,
        claimed_score: int,
        agent_address: str,
        features: list[float],
        weights: list[float],
        salt: int
    ) -> Dict[str, Any]:
        """
        Generate witness (private + public inputs) for the circuit.
        
        Args:
            data_hash: Hash of input transaction data
            threshold: Risk threshold (0-100 scaled)
            claimed_score: Claimed risk score (0-100 scaled)
            agent_address: Agent wallet address
            features: GNN node features [in_deg, out_deg, sent, recv, tx_count]
            weights: Model weights (simplified)
            salt: Random salt for commitment
        
        Returns:
            Witness dictionary for circuit input
        """
        # Scale features to integers for circuit
        scaled_features = [int(f * 100) for f in features]
        scaled_weights = [int(w * 100) for w in weights]
        
        return {
            "dataHash": str(data_hash),
            "threshold": str(threshold),
            "claimedScore": str(claimed_score),
            "agentAddress": str(self.address_to_field(agent_address)),
            "features": [str(f) for f in scaled_features],
            "weights": [str(w) for w in scaled_weights],
            "salt": str(salt)
        }
    
    async def generate_proof(
        self,
        witness: Dict[str, Any]
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Generate a Groth16 ZK proof.
        
        Args:
            witness: Witness dictionary from generate_witness()
        
        Returns:
            Tuple of (proof, public_signals)
        """
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            
            # Write witness to JSON file
            witness_file = tmpdir / "input.json"
            with open(witness_file, 'w') as f:
                json.dump(witness, f)
            
            witness_wtns = tmpdir / "witness.wtns"
            proof_file = tmpdir / "proof.json"
            public_file = tmpdir / "public.json"
            
            try:
                # Step 1: Calculate witness
                subprocess.run([
                    "node",
                    str(self.circuit_dir / "gnn_proof_js" / "generate_witness.js"),
                    str(self.circuit_wasm),
                    str(witness_file),
                    str(witness_wtns)
                ], check=True, capture_output=True, text=True)
                
                # Step 2: Generate proof
                subprocess.run([
                    "npx", "snarkjs", "groth16", "prove",
                    str(self.circuit_zkey),
                    str(witness_wtns),
                    str(proof_file),
                    str(public_file)
                ], check=True, capture_output=True, text=True)
                
                # Read proof and public signals
                with open(proof_file, 'r') as f:
                    proof = json.load(f)
                with open(public_file, 'r') as f:
                    public_signals = json.load(f)
                
                return proof, public_signals
                
            except subprocess.CalledProcessError as e:
                logger.error(f"ZK proof generation failed: {e.stderr}")
                raise RuntimeError(f"ZK proof generation failed: {e.stderr}")
    
    async def verify_proof(
        self,
        proof: Dict[str, Any],
        public_signals: list
    ) -> bool:
        """
        Verify a Groth16 ZK proof.
        
        Args:
            proof: Proof dictionary
            public_signals: List of public signals
        
        Returns:
            True if proof is valid, False otherwise
        """
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)
            
            proof_file = tmpdir / "proof.json"
            public_file = tmpdir / "public.json"
            
            with open(proof_file, 'w') as f:
                json.dump(proof, f)
            with open(public_file, 'w') as f:
                json.dump(public_signals, f)
            
            try:
                result = subprocess.run([
                    "npx", "snarkjs", "groth16", "verify",
                    str(self.verification_key),
                    str(public_file),
                    str(proof_file)
                ], check=True, capture_output=True, text=True)
                
                return "OK" in result.stdout
                
            except subprocess.CalledProcessError as e:
                logger.error(f"ZK proof verification failed: {e.stderr}")
                return False
    
    def export_solidity_verifier(self, output_path: str = None) -> str:
        """
        Export Solidity verifier contract.
        
        Args:
            output_path: Path to write verifier contract
        
        Returns:
            Path to generated Solidity file
        """
        if output_path is None:
            output_path = self.circuit_dir.parent / "contracts" / "Groth16Verifier.sol"
        
        output_path = Path(output_path)
        
        subprocess.run([
            "npx", "snarkjs", "zkey", "export", "solidityverifier",
            str(self.circuit_zkey),
            str(output_path)
        ], check=True, capture_output=True, text=True)
        
        logger.info(f"Solidity verifier exported to {output_path}")
        return str(output_path)
    
    def format_proof_for_contract(self, proof: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format proof for Solidity contract verification.
        
        Args:
            proof: Proof dictionary from generate_proof()
        
        Returns:
            Contract-compatible proof format
        """
        return {
            "pA": [proof["pi_a"][0], proof["pi_a"][1]],
            "pB": [
                [proof["pi_b"][0][1], proof["pi_b"][0][0]],
                [proof["pi_b"][1][1], proof["pi_b"][1][0]]
            ],
            "pC": [proof["pi_c"][0], proof["pi_c"][1]]
        }


# Factory function for easy import
def create_prover(circuit_dir: str = None) -> ZKProver:
    """Create a ZK Prover instance."""
    return ZKProver(circuit_dir)
