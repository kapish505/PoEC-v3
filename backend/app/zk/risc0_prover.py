"""
Risc0 zkVM Prover Service for PoEC

Wraps the Risc0 host binary to generate ZK proofs of GNN anomaly detection.
Falls back to hash commitment if Risc0 is not installed.
"""

import asyncio
import hashlib
import json
import os
import subprocess
import tempfile
from dataclasses import dataclass
from typing import List, Optional, Tuple, Dict, Any
import logging

logger = logging.getLogger(__name__)


@dataclass
class ProofInput:
    """Input to the Risc0 zkVM."""
    data_hash: bytes  # 32 bytes
    anomaly_scores: List[int]  # Scaled to u32 (0-10000 for 0.0-1.0)
    model_hash: bytes  # 32 bytes
    threshold: int  # Scaled threshold (e.g., 7500 for 0.75)


@dataclass
class ProofOutput:
    """Output from the Risc0 zkVM."""
    commitment: str  # Hex string
    anomaly_count: int
    max_score: int
    threshold_exceeded: bool


@dataclass
class Risc0Receipt:
    """ZK proof receipt."""
    proof_bytes: bytes
    output: ProofOutput
    image_id: str
    proof_size_kb: float


class Risc0Prover:
    """
    Risc0 zkVM prover for PoEC.
    
    Generates real ZK proofs if Risc0 toolchain is installed,
    otherwise falls back to cryptographic hash commitments.
    """
    
    def __init__(self, risc0_bin_path: Optional[str] = None):
        """
        Initialize prover.
        
        Args:
            risc0_bin_path: Path to compiled Risc0 host binary.
                           If None, will look in risc0/target/release/poec-host
        """
        self.risc0_bin_path = risc0_bin_path or self._find_binary()
        self.risc0_available = self._check_risc0()
        self.image_id = "poec_guest_v1"  # Updated when binary is built
        
        if self.risc0_available:
            logger.info("Risc0 zkVM available - real proofs enabled")
        else:
            logger.warning("Risc0 not available - using hash commitment fallback")
    
    def _find_binary(self) -> str:
        """Find the Risc0 host binary."""
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(project_root, "risc0", "target", "release", "poec-host")
    
    def _check_risc0(self) -> bool:
        """Check if Risc0 toolchain is available."""
        # Check if binary exists
        if os.path.exists(self.risc0_bin_path):
            return True
        
        # Check if rzup is installed
        try:
            result = subprocess.run(
                ["rzup", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired):
            return False
    
    def prepare_input(
        self,
        data_hash: str,
        anomaly_scores: List[float],
        model_hash: str,
        threshold: float = 0.75
    ) -> ProofInput:
        """
        Prepare input for ZK proof generation.
        
        Args:
            data_hash: Hex-encoded SHA256 of input data
            anomaly_scores: List of scores from GNN (0.0 to 1.0)
            model_hash: Hex-encoded SHA256 of model
            threshold: Anomaly threshold (0.0 to 1.0)
        
        Returns:
            ProofInput ready for proving
        """
        # Convert hex strings to bytes
        data_bytes = bytes.fromhex(data_hash.replace("0x", "").zfill(64))
        model_bytes = bytes.fromhex(model_hash.replace("0x", "").zfill(64))
        
        # Scale floats to u32 (0-10000 range)
        scaled_scores = [int(s * 10000) for s in anomaly_scores]
        scaled_threshold = int(threshold * 10000)
        
        return ProofInput(
            data_hash=data_bytes,
            anomaly_scores=scaled_scores,
            model_hash=model_bytes,
            threshold=scaled_threshold
        )
    
    async def generate_proof(self, input_data: ProofInput) -> Risc0Receipt:
        """
        Generate ZK proof.
        
        Uses Risc0 if available, otherwise falls back to hash commitment.
        
        Args:
            input_data: Prepared proof input
        
        Returns:
            Risc0Receipt with proof and output
        """
        if self.risc0_available:
            return await self._generate_risc0_proof(input_data)
        else:
            return await self._generate_fallback_proof(input_data)
    
    async def _generate_risc0_proof(self, input_data: ProofInput) -> Risc0Receipt:
        """Generate real Risc0 proof."""
        # Create temporary input file
        input_json = {
            "data_hash": list(input_data.data_hash),
            "anomaly_scores": input_data.anomaly_scores,
            "model_hash": list(input_data.model_hash),
            "threshold": input_data.threshold
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(input_json, f)
            input_path = f.name
        
        try:
            # Run Risc0 host binary
            result = await asyncio.create_subprocess_exec(
                self.risc0_bin_path,
                input_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await result.communicate()
            
            if result.returncode != 0:
                raise RuntimeError(f"Risc0 proof generation failed: {stderr.decode()}")
            
            # Read output
            output_path = os.path.join(os.path.dirname(input_path), "output.json")
            proof_path = os.path.join(os.path.dirname(input_path), "proof.bin")
            
            with open(output_path) as f:
                output_json = json.load(f)
            
            with open(proof_path, 'rb') as f:
                proof_bytes = f.read()
            
            output = ProofOutput(
                commitment=bytes(output_json["commitment"]).hex(),
                anomaly_count=output_json["anomaly_count"],
                max_score=output_json["max_score"],
                threshold_exceeded=output_json["threshold_exceeded"]
            )
            
            return Risc0Receipt(
                proof_bytes=proof_bytes,
                output=output,
                image_id=self.image_id,
                proof_size_kb=len(proof_bytes) / 1024
            )
            
        finally:
            # Cleanup
            os.unlink(input_path)
    
    async def _generate_fallback_proof(self, input_data: ProofInput) -> Risc0Receipt:
        """
        Generate fallback hash commitment proof.
        
        This is not a real ZK proof but provides cryptographic commitment
        that can be verified for data integrity.
        """
        # Compute commitment hash
        hasher = hashlib.sha256()
        hasher.update(input_data.data_hash)
        hasher.update(input_data.model_hash)
        for score in input_data.anomaly_scores:
            hasher.update(score.to_bytes(4, 'little'))
        hasher.update(input_data.threshold.to_bytes(4, 'little'))
        commitment = hasher.digest()
        
        # Compute statistics
        anomaly_count = sum(1 for s in input_data.anomaly_scores if s > input_data.threshold)
        max_score = max(input_data.anomaly_scores) if input_data.anomaly_scores else 0
        threshold_exceeded = max_score > input_data.threshold
        
        output = ProofOutput(
            commitment=commitment.hex(),
            anomaly_count=anomaly_count,
            max_score=max_score,
            threshold_exceeded=threshold_exceeded
        )
        
        # Create mock proof (just the commitment for verification)
        proof_data = {
            "type": "hash_commitment",
            "commitment": commitment.hex(),
            "data_hash": input_data.data_hash.hex(),
            "model_hash": input_data.model_hash.hex(),
            "threshold": input_data.threshold,
            "anomaly_count": anomaly_count
        }
        proof_bytes = json.dumps(proof_data).encode()
        
        return Risc0Receipt(
            proof_bytes=proof_bytes,
            output=output,
            image_id="fallback_v1",
            proof_size_kb=len(proof_bytes) / 1024
        )
    
    def format_for_contract(self, receipt: Risc0Receipt) -> Dict[str, Any]:
        """
        Format receipt for on-chain verification.
        
        Returns data in format expected by Solidity verifier.
        """
        return {
            "imageId": receipt.image_id,
            "commitment": "0x" + receipt.output.commitment,
            "anomalyCount": receipt.output.anomaly_count,
            "maxScore": receipt.output.max_score,
            "thresholdExceeded": receipt.output.threshold_exceeded,
            "proofSize": f"{receipt.proof_size_kb:.2f} KB",
            "proofHex": receipt.proof_bytes.hex() if len(receipt.proof_bytes) < 1000 else receipt.proof_bytes[:500].hex() + "..."
        }


# Global prover instance
_prover_instance: Optional[Risc0Prover] = None


def get_prover() -> Risc0Prover:
    """Get or create global prover instance."""
    global _prover_instance
    if _prover_instance is None:
        _prover_instance = Risc0Prover()
    return _prover_instance
