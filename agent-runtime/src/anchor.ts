/**
 * Blockchain anchoring utilities for ResultAnchor contract.
 */

import { ethers } from 'ethers';

// ResultAnchor Contract ABI (minimal interface)
const RESULT_ANCHOR_ABI = [
    "function anchorProof(bytes32 _taskId, bytes32 _merkleRoot, bytes32 _datasetHash, bytes32 _modelHash, string _bundleCID) public",
    "function verifyProof(bytes32 _taskId) public view returns (bool exists, uint256 timestamp, address submitter)",
    "function getProof(bytes32 _taskId) public view returns (tuple(bytes32 taskId, bytes32 merkleRoot, bytes32 datasetHash, bytes32 modelHash, string bundleCID, uint256 timestamp, address submitter))",
    "event ProofAnchored(bytes32 indexed taskId, bytes32 merkleRoot, bytes32 datasetHash, bytes32 modelHash, string bundleCID, address indexed submitter, uint256 timestamp)"
];

export interface AnchorResult {
    success: boolean;
    transactionHash: string;
    blockNumber: number;
    taskId: string;
}

/**
 * Anchor a proof bundle to the blockchain.
 */
export async function anchorProofOnChain(
    taskId: string,
    merkleRoot: string,
    datasetHash: string,
    modelHash: string,
    bundleCID: string,
    config: {
        rpcUrl: string;
        contractAddress: string;
        privateKey: string;
    }
): Promise<AnchorResult> {
    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(config.privateKey, provider);

    // Connect to contract
    const contract = new ethers.Contract(
        config.contractAddress,
        RESULT_ANCHOR_ABI,
        wallet
    );

    // Convert hashes to bytes32 format
    const taskIdBytes32 = ethers.hexlify(ethers.toUtf8Bytes(taskId.padEnd(32, '\0')).slice(0, 32));
    const merkleRootBytes32 = merkleRoot.startsWith('0x') ? merkleRoot : '0x' + merkleRoot;
    const datasetHashBytes32 = datasetHash.startsWith('0x') ? datasetHash : '0x' + datasetHash;
    const modelHashBytes32 = modelHash.startsWith('0x') ? modelHash : '0x' + modelHash;

    // Send transaction
    const tx = await contract.anchorProof(
        taskIdBytes32,
        merkleRootBytes32,
        datasetHashBytes32,
        modelHashBytes32,
        bundleCID
    );

    // Wait for confirmation
    const receipt = await tx.wait();

    return {
        success: receipt.status === 1,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        taskId,
    };
}

/**
 * Verify if a proof exists on-chain.
 */
export async function verifyProofOnChain(
    taskId: string,
    config: {
        rpcUrl: string;
        contractAddress: string;
    }
): Promise<{ exists: boolean; timestamp: number; submitter: string }> {
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);

    const contract = new ethers.Contract(
        config.contractAddress,
        RESULT_ANCHOR_ABI,
        provider
    );

    const taskIdBytes32 = ethers.hexlify(ethers.toUtf8Bytes(taskId.padEnd(32, '\0')).slice(0, 32));

    const [exists, timestamp, submitter] = await contract.verifyProof(taskIdBytes32);

    return {
        exists,
        timestamp: Number(timestamp),
        submitter,
    };
}
