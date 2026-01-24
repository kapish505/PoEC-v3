// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ResultAnchor
 * @dev Registry for proof-backed anomaly detection analysis results.
 * Stores Merkle roots of analysis proofs with dataset and model hashes.
 */
contract ResultAnchor {
    
    struct AnalysisProof {
        bytes32 taskId;          // Unique analysis task ID
        bytes32 merkleRoot;      // Merkle root of anomaly tree
        bytes32 datasetHash;     // SHA-256 of input data
        bytes32 modelHash;       // SHA-256 of model identifier
        string bundleCID;        // IPFS CID of full proof bundle
        uint256 timestamp;       // Block timestamp
        address submitter;       // Agent who submitted
        bool zkVerified;         // Was this ZK proof verified?
        bytes32 zkCommitment;    // ZK proof commitment hash
    }
    
    // Mapping: taskId => AnalysisProof
    mapping(bytes32 => AnalysisProof) public proofs;
    
    // Events
    event ProofAnchored(
        bytes32 indexed taskId,
        bytes32 merkleRoot,
        bytes32 datasetHash,
        bytes32 modelHash,
        string bundleCID,
        address indexed submitter,
        uint256 timestamp
    );
    
    /**
     * @dev Anchor a proof to the blockchain.
     * @param _taskId Unique identifier for this analysis task
     * @param _merkleRoot Merkle root of anomaly proof tree
     * @param _datasetHash SHA-256 hash of input dataset
     * @param _modelHash SHA-256 hash of model used
     * @param _bundleCID IPFS CID where full proof bundle is stored
     */
    function anchorProof(
        bytes32 _taskId,
        bytes32 _merkleRoot,
        bytes32 _datasetHash,
        bytes32 _modelHash,
        string memory _bundleCID
    ) public {
        require(proofs[_taskId].timestamp == 0, "Proof already anchored for this task");
        
        proofs[_taskId] = AnalysisProof({
            taskId: _taskId,
            merkleRoot: _merkleRoot,
            datasetHash: _datasetHash,
            modelHash: _modelHash,
            bundleCID: _bundleCID,
            timestamp: block.timestamp,
            submitter: msg.sender,
            zkVerified: false,
            zkCommitment: bytes32(0)
        });
        
        emit ProofAnchored(
            _taskId,
            _merkleRoot,
            _datasetHash,
            _modelHash,
            _bundleCID,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Verify if a proof exists for a given task.
     * @param _taskId Task identifier to check
     * @return exists Whether the proof exists
     * @return timestamp When it was anchored
     * @return submitter Who anchored it
     */
    function verifyProof(bytes32 _taskId) 
        public 
        view 
        returns (bool exists, uint256 timestamp, address submitter) 
    {
        AnalysisProof memory proof = proofs[_taskId];
        
        if (proof.timestamp == 0) {
            return (false, 0, address(0));
        }
        
        return (true, proof.timestamp, proof.submitter);
    }
    
    /**
     * @dev Get full proof details for a task.
     * @param _taskId Task identifier
     * @return Full AnalysisProof struct
     */
    function getProof(bytes32 _taskId) 
        public 
        view 
        returns (AnalysisProof memory) 
    {
        return proofs[_taskId];
    }
    
    /**
     * @dev Verify integrity: check if dataset and model hashes match.
     * @param _taskId Task identifier
     * @param _datasetHash Expected dataset hash
     * @param _modelHash Expected model hash
     * @return True if both hashes match stored values
     */
    function verifyIntegrity(
        bytes32 _taskId,
        bytes32 _datasetHash,
        bytes32 _modelHash
    ) public view returns (bool) {
        AnalysisProof memory proof = proofs[_taskId];
        
        if (proof.timestamp == 0) {
            return false;
        }
        
        return (proof.datasetHash == _datasetHash && proof.modelHash == _modelHash);
    }
    
    /**
     * @dev On-chain Merkle proof verification.
     * Verifies a single anomaly against the stored Merkle root.
     * 
     * @param _taskId Task identifier
     * @param _leaf Leaf hash (anomaly hash)
     * @param _proof Array of sibling hashes in Merkle path
     * @param _positions Array of positions (true = left, false = right)
     * @return True if proof is valid
     */
    function verifyAnomaly(
        bytes32 _taskId,
        bytes32 _leaf,
        bytes32[] memory _proof,
        bool[] memory _positions
    ) public view returns (bool) {
        require(_proof.length == _positions.length, "Proof and positions length mismatch");
        
        AnalysisProof memory storedProof = proofs[_taskId];
        
        if (storedProof.timestamp == 0) {
            return false;
        }
        
        bytes32 computedHash = _leaf;
        
        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 proofElement = _proof[i];
            
            if (_positions[i]) {
                // Current is left, sibling is right
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Current is right, sibling is left
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        return computedHash == storedProof.merkleRoot;
    }
}
