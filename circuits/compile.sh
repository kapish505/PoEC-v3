#!/bin/bash
# Compile Circom circuit and generate proving keys
# Run from project root: ./circuits/compile.sh

set -e

CIRCUIT_DIR="$(dirname "$0")"
cd "$CIRCUIT_DIR"

echo "🔧 Compiling Circom circuit..."

# Step 1: Compile circuit to R1CS, WASM, and sym
circom gnn_proof.circom --r1cs --wasm --sym --output .

echo "✅ Circuit compiled successfully"

# Step 2: Download Powers of Tau (if not exists)
if [ ! -f "pot12_final.ptau" ]; then
    echo "📥 Downloading Powers of Tau..."
    curl -L https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau -o pot12_final.ptau
fi

# Step 3: Generate proving key (zkey)
echo "🔑 Generating proving key..."
npx snarkjs groth16 setup gnn_proof.r1cs pot12_final.ptau gnn_proof_0000.zkey

# Step 4: Contribute to ceremony (simulated for dev)
echo "🎲 Contributing to proving key..."
echo "random_entropy_for_dev_${RANDOM}" | npx snarkjs zkey contribute gnn_proof_0000.zkey gnn_proof.zkey --name="PoEC Dev" -v

# Step 5: Export verification key
echo "📤 Exporting verification key..."
npx snarkjs zkey export verificationkey gnn_proof.zkey verification_key.json

# Step 6: Export Solidity verifier
echo "⚙️ Exporting Solidity verifier..."
npx snarkjs zkey export solidityverifier gnn_proof.zkey ../contracts/Groth16Verifier.sol

# Cleanup intermediate files
rm -f gnn_proof_0000.zkey

echo ""
echo "✅ Circuit compilation complete!"
echo ""
echo "Generated files:"
echo "  - gnn_proof.r1cs (circuit constraints)"
echo "  - gnn_proof_js/ (WASM + witness generator)"
echo "  - gnn_proof.zkey (proving key)"
echo "  - verification_key.json (verification key)"
echo "  - ../contracts/Groth16Verifier.sol (on-chain verifier)"
