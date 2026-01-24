/**
 * PoEC x402-Style Agent Runtime
 * 
 * Orchestrates the complete workflow:
 * 1. Acquire data from source
 * 2. Upload to PoEC backend
 * 3. Run analysis
 * 4. Build cryptographic proof
 * 5. Sign proof bundle
 * 6. Anchor Merkle root on-chain
 */

import { config } from 'dotenv';
import { Command } from 'commander';
import chalk from 'chalk';
import { FileDataSource, MockAPIDataSource } from './data_source';
import { PoECClient } from './poec_client';
import { signBundle } from './signer';
import { anchorProofOnChain, verifyProofOnChain } from './anchor';

// Load environment variables
config();

interface AgentConfig {
    poecApiUrl: string;
    blockchainNetwork: string;
    ethereumNodeUrl: string;
    resultAnchorAddress: string;
    agentPrivateKey: string;
}

function loadConfig(): AgentConfig {
    return {
        poecApiUrl: process.env.POEC_API_URL || 'http://localhost:8000',
        blockchainNetwork: process.env.BLOCKCHAIN_NETWORK || 'hardhat',
        ethereumNodeUrl: process.env.ETHEREUM_NODE_URL || 'http://localhost:8545',
        resultAnchorAddress: process.env.RESULT_ANCHOR_ADDRESS || '0xb46ced9f82335a2fd1ca12c899c23e8d5aefe35e',
        agentPrivateKey: process.env.AGENT_PRIVATE_KEY || '',
    };
}

async function runAgent(csvPath: string, options: any) {
    console.log(chalk.bold.cyan('\n🤖 PoEC Agent Runtime v2.0\n'));
    console.log(chalk.gray('='.repeat(60)));

    const agentConfig = loadConfig();
    const poecClient = new PoECClient(agentConfig.poecApiUrl);

    try {
        // Step 1: Acquire Data
        console.log(chalk.yellow('\n📥 Step 1: Acquiring data...\n'));

        const dataSource = options.mock
            ? new MockAPIDataSource()
            : new FileDataSource(csvPath);

        const csvBuffer = await dataSource.acquireCSV();
        console.log(chalk.green(`✅ Acquired ${csvBuffer.length} bytes`));

        // Step 2: Upload to PoEC
        console.log(chalk.yellow('\n📤 Step 2: Uploading to PoEC backend...\n'));

        const ingestResult = await poecClient.ingestCSV(csvBuffer, 'agent_data.csv');
        console.log(chalk.green(`✅ Uploaded. Batch ID: ${ingestResult.batch_id}`));
        console.log(chalk.gray(`   Dataset Hash: ${ingestResult.content_hash}`));

        // Step 3: Run Analysis
        console.log(chalk.yellow('\n🔍 Step 3: Running anomaly detection analysis...\n'));

        const analysisResult = await poecClient.runAnalysis();
        console.log(chalk.green(`✅ Analysis complete`));
        console.log(chalk.gray(`   Anomalies found: ${analysisResult.anomalies.length}`));
        console.log(chalk.gray(`   Mode: ${analysisResult.execution_metadata?.analysis_mode || 'full'}`));
        console.log(chalk.gray(`   GNN enabled: ${analysisResult.execution_metadata?.gnn_enabled ?? true}`));

        // Step 4: Build Proof
        console.log(chalk.yellow('\n🔐 Step 4: Building cryptographic proof bundle...\n'));

        const proofResult = await poecClient.buildProof(
            ingestResult.content_hash,
            analysisResult.model_hash,
            options.taskId
        );

        console.log(chalk.green(`✅ Proof bundle built`));
        console.log(chalk.gray(`   Task ID: ${proofResult.task_id}`));
        console.log(chalk.gray(`   Merkle Root: ${proofResult.merkle_root}`));
        console.log(chalk.gray(`   Bundle CID: ${proofResult.bundle_cid}`));

        // Step 5: Sign Bundle
        console.log(chalk.yellow('\n✍️  Step 5: Signing proof bundle...\n'));

        if (!agentConfig.agentPrivateKey) {
            console.log(chalk.red('❌ No private key configured. Skipping signature.'));
            console.log(chalk.gray('   Set AGENT_PRIVATE_KEY in .env to enable signing'));
        } else {
            const signedBundle = await signBundle(proofResult, agentConfig.agentPrivateKey);
            console.log(chalk.green(`✅ Bundle signed`));
            console.log(chalk.gray(`   Signer: ${signedBundle.signer}`));
            console.log(chalk.gray(`   Signature: ${signedBundle.signature.substring(0, 20)}...`));
        }

        // Step 6: Anchor On-Chain
        if (options.anchor) {
            console.log(chalk.yellow('\n⚓ Step 6: Anchoring proof to blockchain...\n'));

            if (!agentConfig.agentPrivateKey) {
                console.log(chalk.red('❌ No private key configured. Cannot anchor.'));
            } else {
                try {
                    const anchorResult = await anchorProofOnChain(
                        proofResult.task_id,
                        proofResult.merkle_root,
                        proofResult.dataset_hash,
                        proofResult.model_hash,
                        proofResult.bundle_cid,
                        {
                            rpcUrl: agentConfig.ethereumNodeUrl,
                            contractAddress: agentConfig.resultAnchorAddress,
                            privateKey: agentConfig.agentPrivateKey,
                        }
                    );

                    console.log(chalk.green(`✅ Proof anchored successfully`));
                    console.log(chalk.gray(`   Transaction: ${anchorResult.transactionHash}`));
                    console.log(chalk.gray(`   Block: ${anchorResult.blockNumber}`));
                    console.log(chalk.gray(`   Network: ${agentConfig.blockchainNetwork}`));

                    // Verify on-chain
                    console.log(chalk.yellow('\n🔍 Verifying on-chain...\n'));
                    const verification = await verifyProofOnChain(
                        proofResult.task_id,
                        {
                            rpcUrl: agentConfig.ethereumNodeUrl,
                            contractAddress: agentConfig.resultAnchorAddress,
                        }
                    );

                    if (verification.exists) {
                        console.log(chalk.green(`✅ On-chain verification successful`));
                        console.log(chalk.gray(`   Timestamp: ${new Date(verification.timestamp * 1000).toISOString()}`));
                        console.log(chalk.gray(`   Submitter: ${verification.submitter}`));
                    } else {
                        console.log(chalk.red(`❌ On-chain verification failed`));
                    }
                } catch (error: any) {
                    console.log(chalk.red(`❌ Anchoring failed: ${error.message}`));
                    console.log(chalk.gray('   Make sure blockchain node is running and contract is deployed'));
                }
            }
        } else {
            console.log(chalk.gray('\n⚓ Step 6: Anchoring skipped (use --anchor to enable)'));
        }

        // Summary
        console.log(chalk.bold.cyan('\n' + '='.repeat(60)));
        console.log(chalk.bold.green('\n✅ Agent workflow complete!\n'));
        console.log(chalk.white('Summary:'));
        console.log(chalk.gray(`  • Task ID: ${proofResult.task_id}`));
        console.log(chalk.gray(`  • Anomalies: ${analysisResult.anomalies.length}`));
        console.log(chalk.gray(`  • Merkle Root: ${proofResult.merkle_root}`));
        console.log(chalk.gray(`  • Bundle CID: ${proofResult.bundle_cid}`));
        console.log('');

    } catch (error: any) {
        console.log(chalk.bold.red('\n❌ Agent workflow failed\n'));
        console.error(chalk.red(error.message));

        if (error.response) {
            console.log(chalk.gray(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`));
        }

        process.exit(1);
    }
}

// CLI Setup
const program = new Command();

program
    .name('poec-agent')
    .description('PoEC v2 x402-style agent orchestration')
    .version('1.0.0');

program
    .command('run')
    .description('Run complete agent workflow')
    .argument('<csv-path>', 'Path to CSV file (or use --mock)')
    .option('-m, --mock', 'Use mock API data source instead of file')
    .option('-a, --anchor', 'Anchor proof to blockchain')
    .option('-t, --task-id <id>', 'Custom task ID')
    .action(runAgent);

program.parse();
