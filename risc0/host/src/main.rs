//! PoEC Risc0 Host Program
//!
//! This is the host side that:
//! 1. Prepares input data
//! 2. Runs the zkVM to generate a proof
//! 3. Returns the proof for on-chain verification

use risc0_zkvm::{default_prover, ExecutorEnv, Receipt};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::env;
use std::fs;

// Include the guest ELF binary (built by build.rs)
include!(concat!(env!("OUT_DIR"), "/methods.rs"));

/// Input data to the zkVM
#[derive(Serialize, Deserialize, Clone)]
pub struct ProofInput {
    pub data_hash: [u8; 32],
    pub anomaly_scores: Vec<u32>,
    pub model_hash: [u8; 32],
    pub threshold: u32,
}

/// Output commitment from the zkVM
#[derive(Serialize, Deserialize, Debug)]
pub struct ProofOutput {
    pub commitment: [u8; 32],
    pub anomaly_count: u32,
    pub max_score: u32,
    pub threshold_exceeded: bool,
}

/// Generate a ZK proof for the given input
pub fn generate_proof(input: ProofInput) -> Result<(Receipt, ProofOutput), Box<dyn std::error::Error>> {
    // Create executor environment with input
    let env = ExecutorEnv::builder()
        .write(&input)?
        .build()?;

    // Get the prover
    let prover = default_prover();

    // Generate proof
    let receipt = prover.prove(env, POEC_GUEST_ELF)?;

    // Extract output from journal
    let output: ProofOutput = receipt.journal.decode()?;

    // Verify the receipt locally before returning
    receipt.verify(POEC_GUEST_ID)?;

    Ok((receipt, output))
}

/// Verify a receipt
pub fn verify_proof(receipt: &Receipt) -> Result<bool, Box<dyn std::error::Error>> {
    receipt.verify(POEC_GUEST_ID)?;
    Ok(true)
}

/// Export receipt for on-chain verification
pub fn export_for_contract(receipt: &Receipt) -> Vec<u8> {
    // Serialize the receipt for Solidity verifier
    bincode::serialize(receipt).unwrap_or_default()
}

fn main() {
    // Example usage - can be called from Python via subprocess
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: poec-host <input.json>");
        std::process::exit(1);
    }

    // Read input from JSON file
    let input_json = fs::read_to_string(&args[1]).expect("Failed to read input file");
    let input: ProofInput = serde_json::from_str(&input_json).expect("Failed to parse input");

    println!("Generating ZK proof...");
    
    match generate_proof(input) {
        Ok((receipt, output)) => {
            println!("Proof generated successfully!");
            println!("Output: {:?}", output);
            
            // Save receipt to file
            let receipt_bytes = bincode::serialize(&receipt).unwrap();
            fs::write("proof.bin", &receipt_bytes).expect("Failed to write proof");
            
            // Save output to JSON
            let output_json = serde_json::to_string_pretty(&output).unwrap();
            fs::write("output.json", &output_json).expect("Failed to write output");
            
            println!("Proof saved to proof.bin");
            println!("Output saved to output.json");
        }
        Err(e) => {
            eprintln!("Proof generation failed: {}", e);
            std::process::exit(1);
        }
    }
}
