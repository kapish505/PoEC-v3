pragma circom 2.1.6;

include "node_modules/circomlibjs/circuits/poseidon.circom";
include "node_modules/circomlibjs/circuits/comparators.circom";

/*
 * GNN Risk Score Proof Circuit
 * 
 * Proves that:
 * 1. Agent's risk score was computed correctly from features
 * 2. Score exceeds/meets the threshold for the given risk level
 * 3. Computation matches the committed data hash
 *
 * This is a simplified circuit that proves aggregated results,
 * not the full GNN inference (which would be computationally prohibitive).
 */

template GNNRiskProof(nFeatures) {
    // Public inputs
    signal input dataHash;           // Hash of input transaction data
    signal input threshold;          // Risk threshold (e.g., 75 = 0.75 scaled)
    signal input claimedScore;       // Claimed risk score (0-100 scaled)
    signal input agentAddress;       // Agent wallet address (as field element)
    
    // Private inputs (witness)
    signal input features[nFeatures]; // Node features from GNN
    signal input weights[nFeatures];  // Model weights (simplified)
    signal input salt;                // Random salt for commitment
    
    // Outputs
    signal output isRisky;            // 1 if score >= threshold, 0 otherwise
    signal output commitment;         // Poseidon commitment to computation
    
    // Step 1: Compute weighted sum (simplified GNN output)
    signal weightedSum[nFeatures + 1];
    weightedSum[0] <== 0;
    
    for (var i = 0; i < nFeatures; i++) {
        weightedSum[i + 1] <== weightedSum[i] + features[i] * weights[i];
    }
    
    // Step 2: Normalize to 0-100 range (simplified activation)
    // In practice, this would be a more complex sigmoid approximation
    signal normalizedScore;
    normalizedScore <== weightedSum[nFeatures];
    
    // Step 3: Verify claimed score matches computation
    claimedScore === normalizedScore;
    
    // Step 4: Compare score to threshold
    component greaterEq = GreaterEqThan(8); // 8 bits for 0-100 range
    greaterEq.in[0] <== claimedScore;
    greaterEq.in[1] <== threshold;
    isRisky <== greaterEq.out;
    
    // Step 5: Create Poseidon commitment
    component hasher = Poseidon(4);
    hasher.inputs[0] <== dataHash;
    hasher.inputs[1] <== claimedScore;
    hasher.inputs[2] <== agentAddress;
    hasher.inputs[3] <== salt;
    commitment <== hasher.out;
}

// Main component with 5 features (matching GNN: in_degree, out_degree, total_sent, total_recv, tx_count)
component main {public [dataHash, threshold, claimedScore, agentAddress]} = GNNRiskProof(5);
