const hre = require("hardhat");

async function main() {
    console.log("Deploying AgentRegistry contract...");

    const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
    const agentRegistry = await AgentRegistry.deploy();

    await agentRegistry.waitForDeployment();

    console.log("✅ AgentRegistry deployed to:", agentRegistry.target);
    console.log("Network:", hre.network.name);
    console.log("Admin:", (await hre.ethers.getSigners())[0].address);

    // Register first agent (deployer as example)
    const [deployer] = await hre.ethers.getSigners();
    console.log("\n📝 Registering deployer as default agent...");

    const tx = await agentRegistry.registerAgent(
        deployer.address,
        "PoEC-Agent-01",
        "Default agent registered at deployment"
    );
    await tx.wait();

    console.log("✅ Default agent registered");

    // Get agent info
    const agent = await agentRegistry.getAgent(deployer.address);
    console.log("\nAgent Details:");
    console.log("  ID:", agent.agentId);
    console.log("  Address:", agent.agentAddress);
    console.log("  Active:", agent.isActive);

    console.log("\n📝 Add to .env:");
    console.log(`AGENT_REGISTRY_ADDRESS=${agentRegistry.target}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
