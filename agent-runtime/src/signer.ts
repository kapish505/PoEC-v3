/**
 * Proof bundle signing utilities.
 */

import { ethers } from 'ethers';

export interface SignedBundle {
    bundle: any;
    signature: string;
    signer: string;
}

/**
 * Sign a proof bundle with agent's private key.
 */
export async function signBundle(
    bundle: any,
    privateKey: string
): Promise<SignedBundle> {
    const wallet = new ethers.Wallet(privateKey);

    // Create canonical message to sign
    const message = JSON.stringify({
        task_id: bundle.task_id,
        merkle_root: bundle.merkle_root,
        dataset_hash: bundle.dataset_hash,
        model_hash: bundle.model_hash,
        timestamp: bundle.timestamp,
    });

    const signature = await wallet.signMessage(message);

    return {
        bundle,
        signature,
        signer: wallet.address,
    };
}

/**
 * Verify a signed bundle.
 */
export function verifySignature(
    signedBundle: SignedBundle
): boolean {
    try {
        const message = JSON.stringify({
            task_id: signedBundle.bundle.task_id,
            merkle_root: signedBundle.bundle.merkle_root,
            dataset_hash: signedBundle.bundle.dataset_hash,
            model_hash: signedBundle.bundle.model_hash,
            timestamp: signedBundle.bundle.timestamp,
        });

        const recoveredAddress = ethers.verifyMessage(message, signedBundle.signature);

        return recoveredAddress.toLowerCase() === signedBundle.signer.toLowerCase();
    } catch {
        return false;
    }
}
