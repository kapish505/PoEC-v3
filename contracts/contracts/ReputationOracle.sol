// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ReputationOracle
 * @dev On-chain reputation storage for x402 agents with ZK proof verification.
 * 
 * Part of PoEC v3: ZK-Verified GNN Risk Engine for x402 Agent Economy.
 * Deployed on Monad Testnet.
 */
contract ReputationOracle {
    
    // ============================================================================
    // State
    // ============================================================================
    
    struct AgentReputation {
        uint256 score;           // Reputation score (0-100)
        uint256 lastUpdated;     // Block timestamp
        bytes32 commitment;      // ZK proof commitment
        bool verified;           // Whether score was ZK-verified
        uint256 analysisCount;   // Number of analyses performed
    }
    
    // Agent address => Reputation data
    mapping(address => AgentReputation) public reputations;
    
    // Authorized provers (can submit reputation updates)
    mapping(address => bool) public authorizedProvers;
    
    // Contract owner
    address public owner;
    
    // ZK Verifier contract (Groth16)
    address public zkVerifier;
    
    // ============================================================================
    // Events
    // ============================================================================
    
    event ReputationUpdated(
        address indexed agent,
        uint256 score,
        bytes32 commitment,
        bool verified,
        address prover
    );
    
    event ProverAuthorized(address indexed prover, bool authorized);
    event VerifierUpdated(address indexed newVerifier);
    
    // ============================================================================
    // Modifiers
    // ============================================================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyAuthorizedProver() {
        require(authorizedProvers[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    // ============================================================================
    // Constructor
    // ============================================================================
    
    constructor(address _zkVerifier) {
        owner = msg.sender;
        zkVerifier = _zkVerifier;
        authorizedProvers[msg.sender] = true;
    }
    
    // ============================================================================
    // External Functions
    // ============================================================================
    
    /**
     * @notice Submit reputation score without ZK verification (trusted prover)
     * @param agent Agent address
     * @param score Reputation score (0-100)
     * @param commitment Proof commitment hash
     */
    function submitReputation(
        address agent,
        uint256 score,
        bytes32 commitment
    ) external onlyAuthorizedProver {
        require(score <= 100, "Invalid score");
        
        reputations[agent] = AgentReputation({
            score: score,
            lastUpdated: block.timestamp,
            commitment: commitment,
            verified: false,
            analysisCount: reputations[agent].analysisCount + 1
        });
        
        emit ReputationUpdated(agent, score, commitment, false, msg.sender);
    }
    
    /**
     * @notice Submit reputation score with ZK proof verification
     * @param agent Agent address
     * @param score Reputation score (0-100)
     * @param commitment Proof commitment hash
     * @param proof Groth16 proof data [pA, pB, pC flattened]
     * @param publicInputs Public inputs for verification
     */
    function submitReputationWithProof(
        address agent,
        uint256 score,
        bytes32 commitment,
        uint256[8] calldata proof,
        uint256[4] calldata publicInputs
    ) external {
        require(score <= 100, "Invalid score");
        require(zkVerifier != address(0), "Verifier not set");
        
        // Verify ZK proof
        bool proofValid = _verifyProof(proof, publicInputs);
        require(proofValid, "Invalid ZK proof");
        
        reputations[agent] = AgentReputation({
            score: score,
            lastUpdated: block.timestamp,
            commitment: commitment,
            verified: true,
            analysisCount: reputations[agent].analysisCount + 1
        });
        
        emit ReputationUpdated(agent, score, commitment, true, msg.sender);
    }
    
    /**
     * @notice Get reputation for an agent
     * @param agent Agent address
     * @return score Reputation score
     * @return verified Whether score was ZK-verified
     * @return lastUpdated Last update timestamp
     */
    function getReputation(address agent) external view returns (
        uint256 score,
        bool verified,
        uint256 lastUpdated
    ) {
        AgentReputation memory rep = reputations[agent];
        return (rep.score, rep.verified, rep.lastUpdated);
    }
    
    /**
     * @notice Get full reputation data for an agent
     * @param agent Agent address
     * @return Full AgentReputation struct
     */
    function getFullReputation(address agent) external view returns (AgentReputation memory) {
        return reputations[agent];
    }
    
    /**
     * @notice Check if an agent has a reputation record
     * @param agent Agent address
     * @return exists True if agent has reputation data
     */
    function hasReputation(address agent) external view returns (bool exists) {
        return reputations[agent].lastUpdated > 0;
    }
    
    // ============================================================================
    // Admin Functions
    // ============================================================================
    
    function setProverAuthorization(address prover, bool authorized) external onlyOwner {
        authorizedProvers[prover] = authorized;
        emit ProverAuthorized(prover, authorized);
    }
    
    function setZKVerifier(address _zkVerifier) external onlyOwner {
        zkVerifier = _zkVerifier;
        emit VerifierUpdated(_zkVerifier);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }
    
    // ============================================================================
    // Internal Functions
    // ============================================================================
    
    /**
     * @dev Call the ZK verifier contract to verify proof
     */
    function _verifyProof(
        uint256[8] calldata proof,
        uint256[4] calldata publicInputs
    ) internal view returns (bool) {
        // Format: verifyProof(pA, pB, pC, publicInputs)
        // pA: [proof[0], proof[1]]
        // pB: [[proof[2], proof[3]], [proof[4], proof[5]]]
        // pC: [proof[6], proof[7]]
        
        (bool success, bytes memory result) = zkVerifier.staticcall(
            abi.encodeWithSignature(
                "verifyProof(uint256[2],uint256[2][2],uint256[2],uint256[4])",
                [proof[0], proof[1]],
                [[proof[2], proof[3]], [proof[4], proof[5]]],
                [proof[6], proof[7]],
                publicInputs
            )
        );
        
        if (!success) return false;
        return abi.decode(result, (bool));
    }
}
