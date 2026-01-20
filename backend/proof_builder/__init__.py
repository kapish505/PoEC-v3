"""
Proof Builder Module - Cryptographic proof generation for PoEC v2.
Provides Merkle tree construction and proof bundle assembly.
"""

from .serializer import canonicalize_json
from .hasher import hash_sha256, hash_object
from .merkle import MerkleTree
from .bundle import ProofBundle, build_proof_bundle
from .storage import StorageAdapter, LocalStorageAdapter, IPFSStorageAdapter

__all__ = [
    'canonicalize_json',
    'hash_sha256',
    'hash_object',
    'MerkleTree',
    'ProofBundle',
    'build_proof_bundle',
    'StorageAdapter',
    'LocalStorageAdapter',
    'IPFSStorageAdapter',
]
