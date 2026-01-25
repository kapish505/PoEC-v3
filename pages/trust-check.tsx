'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, ShieldX, Search, ExternalLink, Clock, User, Hash, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Layout from '../components/Layout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ProofData {
    address: string;
    risk_score: number;
    anomaly_count: number;
    merkle_root: string | null;
    anchor_tx: string | null;
    verified_block: number | null;
    queried_at: string;
}

interface TrustDecision {
    level: 'TRUSTED' | 'CAUTION' | 'UNTRUSTED' | 'UNKNOWN';
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    message: string;
}

function getTrustDecision(proof: ProofData | null): TrustDecision {
    if (!proof || !proof.merkle_root) {
        return {
            level: 'UNKNOWN',
            color: 'text-slate-400',
            bgColor: 'bg-slate-500/10',
            borderColor: 'border-slate-500/30',
            icon: <ShieldX className="w-12 h-12" />,
            message: 'No on-chain proof found for this address.'
        };
    }

    if (proof.risk_score <= 0.3) {
        return {
            level: 'TRUSTED',
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/30',
            icon: <ShieldCheck className="w-12 h-12" />,
            message: 'This agent has a verified low-risk profile on-chain.'
        };
    } else if (proof.risk_score <= 0.6) {
        return {
            level: 'CAUTION',
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/30',
            icon: <AlertTriangle className="w-12 h-12" />,
            message: 'This agent has some flagged behaviors. Proceed with caution.'
        };
    } else {
        return {
            level: 'UNTRUSTED',
            color: 'text-red-400',
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/30',
            icon: <ShieldX className="w-12 h-12" />,
            message: 'High-risk agent. Multiple anomalies detected.'
        };
    }
}

export default function TrustCheckPage() {
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [proof, setProof] = useState<ProofData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleVerify = async () => {
        if (!address.trim()) return;

        setLoading(true);
        setError(null);
        setProof(null);
        setHasSearched(true);

        try {
            const response = await fetch(`${API_URL}/api/v3/agent/fetch_proof/${address.trim()}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: ProofData = await response.json();
            setProof(data);
        } catch (err: any) {
            setError(err.message || 'Failed to query trust data');
        } finally {
            setLoading(false);
        }
    };

    const decision = getTrustDecision(proof);
    const explorerBase = 'https://explorer.testnet.monad.xyz';

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-6">
                            <Shield className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-3">
                            x402 Agent Trust Verification
                        </h1>
                        <p className="text-slate-400 max-w-md mx-auto">
                            Query the on-chain ResultAnchor contract to verify if an agent has a cryptographically proven trust score.
                        </p>
                    </motion.div>

                    {/* Search Box */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-8"
                    >
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Agent Address
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                placeholder="0x..."
                                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                            />
                            <button
                                onClick={handleVerify}
                                disabled={loading || !address.trim()}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                            >
                                {loading ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    >
                                        <Search className="w-5 h-5" />
                                    </motion.div>
                                ) : (
                                    <Search className="w-5 h-5" />
                                )}
                                Verify
                            </button>
                        </div>
                    </motion.div>

                    {/* Results */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center"
                            >
                                <ShieldX className="w-12 h-12 text-red-400 mx-auto mb-4" />
                                <p className="text-red-400 font-medium">{error}</p>
                            </motion.div>
                        )}

                        {hasSearched && !loading && !error && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`${decision.bgColor} border ${decision.borderColor} rounded-2xl p-8`}
                            >
                                {/* Trust Level Header */}
                                <div className="text-center mb-8">
                                    <div className={`${decision.color} mx-auto mb-4`}>
                                        {decision.icon}
                                    </div>
                                    <h2 className={`text-2xl font-bold ${decision.color} mb-2`}>
                                        {decision.level}
                                    </h2>
                                    <p className="text-slate-400">{decision.message}</p>
                                </div>

                                {/* Proof Details */}
                                {proof && proof.merkle_root && (
                                    <div className="space-y-4 border-t border-white/10 pt-6">
                                        {/* Merkle Root */}
                                        <div className="flex items-start gap-3">
                                            <Hash className="w-5 h-5 text-slate-500 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Merkle Root</p>
                                                <p className="text-white font-mono text-sm break-all">{proof.merkle_root}</p>
                                            </div>
                                        </div>

                                        {/* Verified Block */}
                                        {proof.verified_block && (
                                            <div className="flex items-start gap-3">
                                                <Clock className="w-5 h-5 text-slate-500 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Anchored At</p>
                                                    <p className="text-white">Block #{proof.verified_block.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Risk Score */}
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-slate-500 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Risk Score</p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${proof.risk_score * 100}%` }}
                                                            transition={{ duration: 0.5, delay: 0.2 }}
                                                            className={`h-full ${proof.risk_score <= 0.3 ? 'bg-emerald-500' :
                                                                proof.risk_score <= 0.6 ? 'bg-amber-500' : 'bg-red-500'
                                                                }`}
                                                        />
                                                    </div>
                                                    <span className="text-white font-mono text-sm">
                                                        {(proof.risk_score * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Anomaly Count */}
                                        <div className="flex items-start gap-3">
                                            <User className="w-5 h-5 text-slate-500 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Detected Anomalies</p>
                                                <p className="text-white">{proof.anomaly_count} pattern(s) flagged</p>
                                            </div>
                                        </div>

                                        {/* Explorer Link */}
                                        <div className="pt-4 border-t border-white/10">
                                            <a
                                                href={`${explorerBase}/address/${address}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                View on Monad Explorer
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {/* No Proof Found */}
                                {(!proof || !proof.merkle_root) && (
                                    <div className="text-center pt-4 border-t border-white/10">
                                        <p className="text-slate-500 text-sm mb-4">
                                            This address has not been analyzed or anchored yet.
                                        </p>
                                        <Link
                                            href="/pipeline"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Run Analysis Pipeline →
                                        </Link>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* How It Works */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-12 text-center"
                    >
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
                            How x402 Agents Use This
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="text-2xl mb-2">1️⃣</div>
                                <p className="text-slate-400">Query <code className="text-blue-400">ResultAnchor</code> contract</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="text-2xl mb-2">2️⃣</div>
                                <p className="text-slate-400">Verify merkle root matches data</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <div className="text-2xl mb-2">3️⃣</div>
                                <p className="text-slate-400">Make trust decision</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
}
