// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/ResultAnchor.sol";
import "../contracts/AgentRegistry.sol";
import "../contracts/ReputationOracle.sol";
import "../contracts/Groth16Verifier.sol";

contract DeployAll is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Verifier
        Groth16Verifier verifier = new Groth16Verifier();
        console.log("Groth16Verifier deployed to:", address(verifier));

        // 2. Deploy Reputation Oracle
        ReputationOracle oracle = new ReputationOracle(address(verifier));
        console.log("ReputationOracle deployed to:", address(oracle));

        // 3. Deploy Agent Registry
        AgentRegistry registry = new AgentRegistry();
        console.log("AgentRegistry deployed to:", address(registry));

        // 4. Deploy Result Anchor
        ResultAnchor resultAnchor = new ResultAnchor();
        console.log("ResultAnchor deployed to:", address(resultAnchor));

        vm.stopBroadcast();
        
        // Return deployed addresses for logging
        console.log("\n--- DEPLOYMENT SUMMARY ---");
        console.log("VERIFIER_ADDRESS=", address(verifier));
        console.log("REPUTATION_ORACLE_ADDRESS=", address(oracle));
        console.log("AGENT_REGISTRY_ADDRESS=", address(registry));
        console.log("RESULT_ANCHOR_ADDRESS=", address(resultAnchor));
    }
}
