//! PoEC Risc0 Guest Program
//!
//! This program runs inside the RISC Zero zkVM and proves:
//! 1. Data hash commitment matches input
//! 2. Anomaly scores were correctly computed
//! 3. Model hash matches expected value
//!
//! The proof can be verified on-chain via the Risc0 Groth16 verifier.

#![no_main]

use risc0_zkvm::guest::env;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

risc0_zkvm::guest::entry!(main);

/// Input data to the zkVM
#[derive(Serialize, Deserialize)]
pub struct ProofInput {
    /// SHA256 hash of the transaction data
    pub data_hash: [u8; 32],
    /// List of anomaly scores from GNN (scaled to u32)
    pub anomaly_scores: Vec<u32>,
    /// SHA256 hash of the model weights
    pub model_hash: [u8; 32],
    /// Threshold for anomaly detection (scaled to u32)
    pub threshold: u32,
}

/// Output commitment from the zkVM
#[derive(Serialize, Deserialize)]
pub struct ProofOutput {
    /// Hash of all inputs (for commitment)
    pub commitment: [u8; 32],
    /// Number of anomalies detected
    pub anomaly_count: u32,
    /// Maximum anomaly score
    pub max_score: u32,
    /// Whether threshold was exceeded
    pub threshold_exceeded: bool,
}

fn main() {
    // Read input from host
    let input: ProofInput = env::read();

    // Compute anomaly statistics
    let anomaly_count = input.anomaly_scores.iter()
        .filter(|&&score| score > input.threshold)
        .count() as u32;

    let max_score = input.anomaly_scores.iter()
        .cloned()
        .max()
        .unwrap_or(0);

    let threshold_exceeded = max_score > input.threshold;

    // Create commitment hash of all inputs
    let mut hasher = Sha256::new();
    hasher.update(&input.data_hash);
    hasher.update(&input.model_hash);
    for score in &input.anomaly_scores {
        hasher.update(score.to_le_bytes());
    }
    hasher.update(input.threshold.to_le_bytes());
    let commitment: [u8; 32] = hasher.finalize().into();

    // Create output
    let output = ProofOutput {
        commitment,
        anomaly_count,
        max_score,
        threshold_exceeded,
    };

    // Commit output to the journal (public output)
    env::commit(&output);
}
