// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRiscZeroVerifier
 * @dev Interface for the RISC Zero proof verifier.
 * The actual verifier is deployed by RISC Zero team.
 */
interface IRiscZeroVerifier {
    function verify(
        bytes32 imageId,
        bytes32 journalDigest,
        bytes calldata seal
    ) external view returns (bool);
}

/**
 * @title RiscZeroResultAnchor
 * @dev Stores GNN analysis results with RISC Zero ZK proof verification.
 * 
 * This contract:
 * 1. Accepts analysis results with ZK proofs
 * 2. Verifies proofs on-chain (if verifier is configured)
 * 3. Stores results for later verification
 * 4. Tracks agent reputation based on verified analyses
 */
contract RiscZeroResultAnchor {
    
    // ========================================================================
    // Types
    // ========================================================================
    
    struct AnalysisResult {
        bytes32 taskId;          // Unique analysis task ID
        bytes32 dataHash;        // Hash of input transaction data
        bytes32 modelHash;       // Hash of GNN model
        bytes32 resultHash;      // Hash of analysis results
        bytes32 commitment;      // ZK proof commitment
        uint256 anomalyCount;    // Number of anomalies detected
        uint256 maxScore;        // Maximum anomaly score (scaled)
        bool thresholdExceeded;  // Whether threshold was exceeded
        bool zkVerified;         // Whether ZK proof was verified
        uint256 timestamp;       // Block timestamp
        address submitter;       // Who submitted the result
    }
    
    // ========================================================================
    // State
    // ========================================================================
    
    // RISC Zero verifier contract (set to address(0) if not using on-chain verification)
    IRiscZeroVerifier public immutable verifier;
    
    // Expected image ID for the RISC Zero guest program
    bytes32 public immutable imageId;
    
    // Mapping: taskId => AnalysisResult
    mapping(bytes32 => AnalysisResult) public results;
    
    // Mapping: address => list of taskIds
    mapping(address => bytes32[]) public agentAnalyses;
    
    // Admin
    address public admin;
    
    // ========================================================================
    // Events
    // ========================================================================
    
    event ResultAnchored(
        bytes32 indexed taskId,
        bytes32 dataHash,
        bytes32 commitment,
        uint256 anomalyCount,
        bool zkVerified,
        address indexed submitter,
        uint256 timestamp
    );
    
    event VerificationFailed(bytes32 indexed taskId, string reason);
    
    // ========================================================================
    // Constructor
    // ========================================================================
    
    constructor(address _verifier, bytes32 _imageId) {
        verifier = IRiscZeroVerifier(_verifier);
        imageId = _imageId;
        admin = msg.sender;
    }
    
    // ========================================================================
    // Core Functions
    // ========================================================================
    
    /**
     * @dev Anchor a new analysis result with optional ZK proof.
     * @param taskId Unique identifier for this analysis
     * @param dataHash SHA256 of input transaction data
     * @param modelHash SHA256 of GNN model weights
     * @param resultHash SHA256 of analysis output
     * @param commitment ZK proof commitment hash
     * @param anomalyCount Number of anomalies detected
     * @param maxScore Maximum anomaly score (scaled 0-10000)
     * @param thresholdExceeded Whether threshold was exceeded
     * @param seal RISC Zero proof seal (optional, empty for unverified)
     */
    function anchorResult(
        bytes32 taskId,
        bytes32 dataHash,
        bytes32 modelHash,
        bytes32 resultHash,
        bytes32 commitment,
        uint256 anomalyCount,
        uint256 maxScore,
        bool thresholdExceeded,
        bytes calldata seal
    ) external {
        require(results[taskId].timestamp == 0, "Task already anchored");
        
        bool zkVerified = false;
        
        // Attempt ZK verification if seal is provided and verifier exists
        if (seal.length > 0 && address(verifier) != address(0)) {
            try verifier.verify(imageId, commitment, seal) returns (bool success) {
                zkVerified = success;
            } catch {
                emit VerificationFailed(taskId, "Verifier call failed");
            }
        }
        
        // Store result
        results[taskId] = AnalysisResult({
            taskId: taskId,
            dataHash: dataHash,
            modelHash: modelHash,
            resultHash: resultHash,
            commitment: commitment,
            anomalyCount: anomalyCount,
            maxScore: maxScore,
            thresholdExceeded: thresholdExceeded,
            zkVerified: zkVerified,
            timestamp: block.timestamp,
            submitter: msg.sender
        });
        
        // Track for agent
        agentAnalyses[msg.sender].push(taskId);
        
        emit ResultAnchored(
            taskId,
            dataHash,
            commitment,
            anomalyCount,
            zkVerified,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @dev Anchor result without ZK proof (hash commitment only).
     */
    function anchorResultSimple(
        bytes32 taskId,
        bytes32 dataHash,
        bytes32 modelHash,
        bytes32 resultHash,
        uint256 anomalyCount
    ) external {
        require(results[taskId].timestamp == 0, "Task already anchored");
        
        results[taskId] = AnalysisResult({
            taskId: taskId,
            dataHash: dataHash,
            modelHash: modelHash,
            resultHash: resultHash,
            commitment: resultHash, // Use result hash as commitment
            anomalyCount: anomalyCount,
            maxScore: 0,
            thresholdExceeded: anomalyCount > 0,
            zkVerified: false,
            timestamp: block.timestamp,
            submitter: msg.sender
        });
        
        agentAnalyses[msg.sender].push(taskId);
        
        emit ResultAnchored(
            taskId,
            dataHash,
            resultHash,
            anomalyCount,
            false,
            msg.sender,
            block.timestamp
        );
    }
    
    // ========================================================================
    // View Functions
    // ========================================================================
    
    /**
     * @dev Get analysis result by taskId.
     */
    function getResult(bytes32 taskId) external view returns (AnalysisResult memory) {
        return results[taskId];
    }
    
    /**
     * @dev Check if a result exists and is ZK verified.
     */
    function isVerified(bytes32 taskId) external view returns (bool exists, bool zkVerified) {
        AnalysisResult memory result = results[taskId];
        return (result.timestamp > 0, result.zkVerified);
    }
    
    /**
     * @dev Get number of analyses by an agent.
     */
    function getAgentAnalysisCount(address agent) external view returns (uint256) {
        return agentAnalyses[agent].length;
    }
    
    /**
     * @dev Get analysis taskIds for an agent.
     */
    function getAgentAnalyses(address agent, uint256 offset, uint256 limit) 
        external view returns (bytes32[] memory) 
    {
        bytes32[] storage analyses = agentAnalyses[agent];
        uint256 total = analyses.length;
        
        if (offset >= total) {
            return new bytes32[](0);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = analyses[i];
        }
        
        return result;
    }
}
