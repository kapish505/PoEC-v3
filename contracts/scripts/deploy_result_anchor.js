const hre = require("hardhat");

async function main() {
    console.log("Deploying ResultAnchor contract...");

    const ResultAnchor = await hre.ethers.getContractFactory("ResultAnchor");
    const resultAnchor = await ResultAnchor.deploy();

    await resultAnchor.waitForDeployment();

    console.log("✅ ResultAnchor deployed to:", resultAnchor.target);
    console.log("Network:", hre.network.name);
    console.log("Block:", await hre.ethers.provider.getBlockNumber());

    // Save deployment address for reference
    console.log("\n📝 Add to .env:");
    console.log(`RESULT_ANCHOR_ADDRESS=${resultAnchor.target}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
