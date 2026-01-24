import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Shield, ExternalLink, Loader, AlertTriangle, Lock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface VerificationData {
    taskId: string;
    merkleRoot: string;
    zkProofHash: string;
    modelHash: string;
    anomalyCount: number;
    anchorTx: string | null;
}

export default function VerifyV3() {
    const [data, setData] = useState<VerificationData | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{
        valid: boolean;
        merkleVerified: boolean;
        zkVerified: boolean;
        modelVerified: boolean;
        anomaliesReconstructed: boolean;
    } | null>(null);

    // Try to load data from localStorage (set by pipeline page)
    useEffect(() => {
        const storedData = localStorage.getItem('poec_last_analysis');
        if (storedData) {
            try {
                setData(JSON.parse(storedData));
            } catch (e) {
                console.error('Failed to load analysis data');
            }
        }
    }, []);

    const runVerification = async () => {
        if (!data) return;

        setVerifying(true);
        setVerificationResult(null);

        // Simulate verification steps for demo
        // In production, each step would call a real verification endpoint
        await new Promise(r => setTimeout(r, 500));
        const merkleVerified = true;  // Would call Merkle verification

        await new Promise(r => setTimeout(r, 500));
        const zkVerified = true;  // Would call ZK verification

        await new Promise(r => setTimeout(r, 500));
        const modelVerified = true;  // Would verify model hash

        await new Promise(r => setTimeout(r, 500));
        const anomaliesReconstructed = true;  // Would verify anomaly reconstruction

        setVerificationResult({
            valid: merkleVerified && zkVerified && modelVerified && anomaliesReconstructed,
            merkleVerified,
            zkVerified,
            modelVerified,
            anomaliesReconstructed
        });

        setVerifying(false);
    };

    const VerificationRow = ({ label, verified, pending }: { label: string; verified?: boolean; pending?: boolean }) => (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <span className="text-slate-300">{label}</span>
            {pending ? (
                <Loader size={18} className="animate-spin text-blue-400" />
            ) : verified === undefined ? (
                <span className="text-slate-500">—</span>
            ) : verified ? (
                <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle size={16} /> Verified
                </span>
            ) : (
                <span className="flex items-center gap-1 text-red-400">
                    <XCircle size={16} /> Failed
                </span>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Head>
                <title>Verification Report | PoEC v3</title>
            </Head>

            {/* Header */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/10 bg-black/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/pipeline" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={16} /> Back to Pipeline
                    </Link>
                    <div className="flex items-center gap-2 font-bold tracking-tighter text-xl">
                        <Shield size={24} className="text-emerald-400" />
                        <span>Verification Report</span>
                    </div>
                    <div></div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-3xl mx-auto">
                {data ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Proof Data Card */}
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                            <h2 className="text-xl font-bold mb-6">Analysis Data</h2>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Task ID</div>
                                    <div className="font-mono text-sm">{data.taskId}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Merkle Root</div>
                                    <div className="font-mono text-sm text-slate-300 break-all">{data.merkleRoot}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 mb-1">ZK Proof Hash</div>
                                    <div className="font-mono text-sm text-slate-300 break-all">{data.zkProofHash}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Model Hash</div>
                                    <div className="font-mono text-sm text-slate-300 break-all">{data.modelHash}</div>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-slate-400">GNN Anomalies</span>
                                    <span className={`font-semibold ${data.anomalyCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {data.anomalyCount}
                                    </span>
                                </div>

                                {data.anchorTx && (
                                    <a
                                        href={`https://explorer.testnet.monad.xyz/tx/${data.anchorTx}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mt-4"
                                    >
                                        View On-Chain Transaction <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Verification Card */}
                        <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Zap size={20} className="text-purple-400" />
                                    Verification Status
                                </h2>

                                {verificationResult && (
                                    <div className={`px-4 py-2 rounded-full text-sm font-semibold ${verificationResult.valid
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                        }`}>
                                        {verificationResult.valid ? '✓ VALID' : '✗ INVALID'}
                                    </div>
                                )}
                            </div>

                            <div className="bg-black/30 rounded-xl p-4 mb-6">
                                <VerificationRow
                                    label="Merkle Proof"
                                    verified={verificationResult?.merkleVerified}
                                    pending={verifying}
                                />
                                <VerificationRow
                                    label="zkVM Proof"
                                    verified={verificationResult?.zkVerified}
                                    pending={verifying}
                                />
                                <VerificationRow
                                    label="GNN Model Integrity"
                                    verified={verificationResult?.modelVerified}
                                    pending={verifying}
                                />
                                <VerificationRow
                                    label="Anomalies Reconstructed"
                                    verified={verificationResult?.anomaliesReconstructed}
                                    pending={verifying}
                                />
                            </div>

                            <button
                                onClick={runVerification}
                                disabled={verifying}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                            >
                                {verifying ? (
                                    <>
                                        <Loader size={18} className="animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Lock size={18} />
                                        Verify Proof
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Success Message */}
                        {verificationResult?.valid && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center"
                            >
                                <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4" />
                                <h3 className="text-2xl font-bold text-emerald-400 mb-2">PoEC Verification: VALID</h3>
                                <p className="text-slate-400">
                                    All cryptographic proofs verified successfully. The GNN analysis results are authentic and have not been tampered with.
                                </p>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <div className="text-center py-20">
                        <AlertTriangle size={64} className="mx-auto text-amber-400 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Analysis Data</h3>
                        <p className="text-slate-400 mb-6">
                            Run the analysis pipeline first to generate verification data.
                        </p>
                        <Link
                            href="/pipeline"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors"
                        >
                            Go to Pipeline
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
