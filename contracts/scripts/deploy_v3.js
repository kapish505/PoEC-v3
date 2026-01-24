/**
 * PoEC v3 Contract Deployment Script
 * 
 * Deploys ZK-verified GNN Risk Engine contracts to Monad Testnet:
 * - Groth16Verifier (ZK proof verification)
 * - ReputationOracle (Agent reputation storage)
 * - ResultAnchor (Analysis results anchoring)
 * 
 * Usage: npx hardhat run scripts/deploy_v3.js --network monad
 */

const { ethers } = require("hardhat");

async function main() {
    console.log("\n🚀 PoEC v3 Contract Deployment - Monad Testnet\n");
    console.log("=".repeat(50));

    const [deployer] = await ethers.getSigners();
    console.log(`📍 Deployer: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} MON\n`);

    // Track deployed contracts
    const deployedContracts = {};

    // ========================================================================
    // Step 1: Deploy Groth16Verifier (if exists)
    // ========================================================================

    try {
        console.log("📦 Deploying Groth16Verifier...");
        const Verifier = await ethers.getContractFactory("Groth16Verifier");
        const verifier = await Verifier.deploy();
        await verifier.waitForDeployment();

        const verifierAddress = await verifier.getAddress();
        deployedContracts.verifier = verifierAddress;
        console.log(`   ✅ Groth16Verifier: ${verifierAddress}`);
    } catch (e) {
        console.log(`   ⚠️  Groth16Verifier not found (run circuits/compile.sh first)`);
        deployedContracts.verifier = ethers.ZeroAddress;
    }

    // ========================================================================
    // Step 2: Deploy ReputationOracle
    // ========================================================================

    console.log("\n📦 Deploying ReputationOracle...");
    const ReputationOracle = await ethers.getContractFactory("ReputationOracle");
    const reputationOracle = await ReputationOracle.deploy(deployedContracts.verifier);
    await reputationOracle.waitForDeployment();

    const reputationAddress = await reputationOracle.getAddress();
    deployedContracts.reputationOracle = reputationAddress;
    console.log(`   ✅ ReputationOracle: ${reputationAddress}`);

    // ========================================================================
    // Step 3: Deploy ResultAnchor (if not already deployed)
    // ========================================================================

    try {
        console.log("\n📦 Deploying ResultAnchor...");
        const ResultAnchor = await ethers.getContractFactory("ResultAnchor");
        const resultAnchor = await ResultAnchor.deploy();
        await resultAnchor.waitForDeployment();

        const resultAddress = await resultAnchor.getAddress();
        deployedContracts.resultAnchor = resultAddress;
        console.log(`   ✅ ResultAnchor: ${resultAddress}`);
    } catch (e) {
        console.log(`   ⚠️  ResultAnchor deployment failed: ${e.message}`);
    }

    // ========================================================================
    // Step 4: Deploy AgentRegistry (if not already deployed)
    // ========================================================================

    try {
        console.log("\n📦 Deploying AgentRegistry...");
        const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
        const agentRegistry = await AgentRegistry.deploy();
        await agentRegistry.waitForDeployment();

        const registryAddress = await agentRegistry.getAddress();
        deployedContracts.agentRegistry = registryAddress;
        console.log(`   ✅ AgentRegistry: ${registryAddress}`);
    } catch (e) {
        console.log(`   ⚠️  AgentRegistry deployment failed: ${e.message}`);
    }

    // ========================================================================
    // Summary
    // ========================================================================

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Deployment Complete!\n");
    console.log("Deployed Contracts:");
    console.log(JSON.stringify(deployedContracts, null, 2));

    console.log("\n📝 Update these addresses in:");
    console.log("   - backend/config/blockchain.json");
    console.log("   - .env.local (frontend)");

    console.log("\n🔗 Monad Explorer:");
    for (const [name, address] of Object.entries(deployedContracts)) {
        if (address !== ethers.ZeroAddress) {
            console.log(`   ${name}: https://explorer.testnet.monad.xyz/address/${address}`);
        }
    }

    // Output for easy copy-paste
    console.log("\n📋 Copy this to blockchain.json:");
    console.log(`{
  "network": "monad_testnet",
  "chain_id": 10143,
  "rpc_url": "https://testnet-rpc.monad.xyz",
  "explorer_url": "https://explorer.testnet.monad.xyz",
  "contracts": ${JSON.stringify(deployedContracts, null, 4)}
}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
