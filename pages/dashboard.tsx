import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Search, Shield, Zap, CheckCircle, AlertTriangle, Loader, ExternalLink, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DashboardV3() {
    const [agentAddress, setAgentAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [identity, setIdentity] = useState<any>(null);
    const [reputation, setReputation] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const analyzeAgent = async () => {
        if (!agentAddress.trim()) {
            setError('Please enter an agent address');
            return;
        }

        setLoading(true);
        setError(null);
        setIdentity(null);
        setReputation(null);

        try {
            // Step 1: Get identity
            const identityRes = await fetch(`${API_URL}/api/v3/agent/${agentAddress}/identity`);
            if (!identityRes.ok) throw new Error('Failed to fetch agent identity');
            const identityData = await identityRes.json();
            setIdentity(identityData);

            // Step 2: Get reputation with ZK proof
            const reputationRes = await fetch(`${API_URL}/api/v3/agent/${agentAddress}/reputation?generate_proof=true`);
            if (!reputationRes.ok) throw new Error('Failed to fetch reputation');
            const reputationData = await reputationRes.json();
            setReputation(reputationData);

        } catch (err: any) {
            setError(err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'HIGH': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
            case 'CRITICAL': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <Head>
                <title>Agent Risk Dashboard | PoEC v3</title>
            </Head>

            {/* Header */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/10 bg-black/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <div className="flex items-center gap-2 font-bold tracking-tighter text-xl">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">P</div>
                        <span>PoEC v3</span>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Agent Risk Analysis</h1>
                    <p className="text-slate-400 text-lg mb-12">
                        Query any agent address on Monad to get ZK-verified reputation scores and risk assessment.
                    </p>

                    {/* Search Bar */}
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 mb-8">
                        <label className="block text-sm font-medium text-slate-400 mb-3">Agent Wallet Address</label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={agentAddress}
                                onChange={(e) => setAgentAddress(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && analyzeAgent()}
                                placeholder="0x..."
                                className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <button
                                onClick={analyzeAgent}
                                disabled={loading}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-xl font-semibold flex items-center gap-2 transition-all"
                            >
                                {loading ? (
                                    <>
                                        <Loader size={18} className="animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Search size={18} />
                                        Analyze
                                    </>
                                )}
                            </button>
                        </div>
                        {error && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    <AnimatePresence>
                        {identity && reputation && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Identity Card */}
                                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Shield size={20} className="text-blue-400" />
                                        Agent Identity
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Address</div>
                                            <div className="font-mono text-sm text-slate-300 truncate">{identity.address}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Balance</div>
                                            <div className="font-semibold">{identity.balance_mon.toFixed(4)} MON</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 mb-1">Transactions</div>
                                            <div className="font-semibold">{identity.tx_count}</div>
                                        </div>
                                    </div>
                                    {identity.explorer_url && (
                                        <a
                                            href={identity.explorer_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                                        >
                                            View on Monad Explorer <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>

                                {/* Reputation Score */}
                                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <Zap size={20} className="text-purple-400" />
                                        Reputation Score
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Score Gauge */}
                                        <div className="flex flex-col items-center justify-center p-6 bg-black/50 rounded-xl border border-white/5">
                                            <div className="text-6xl font-bold mb-2">{reputation.reputation_score}</div>
                                            <div className="text-sm text-slate-400">out of 100</div>
                                            <div className={`mt-4 px-4 py-2 rounded-full text-sm font-semibold border ${getRiskColor(reputation.risk_level)}`}>
                                                {reputation.risk_level} RISK
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400">Analyzed Transactions</span>
                                                <span className="font-semibold">{reputation.analyzed_transactions}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400">Analysis Time</span>
                                                <span className="font-mono text-xs">{new Date(reputation.analyzed_at).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400">ZK Verified</span>
                                                {reputation.verified ? (
                                                    <span className="flex items-center gap-1 text-emerald-400">
                                                        <CheckCircle size={16} /> Yes
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-amber-400">
                                                        <AlertTriangle size={16} /> No
                                                    </span>
                                                )}
                                            </div>
                                            {reputation.commitment && (
                                                <div>
                                                    <div className="text-xs text-slate-500 mb-1">ZK Commitment</div>
                                                    <div className="font-mono text-xs text-slate-400 truncate">{reputation.commitment}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ZK Proof */}
                                {reputation.zk_proof && (
                                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                                        <h2 className="text-xl font-bold mb-4">Zero-Knowledge Proof</h2>
                                        <div className="bg-black/50 rounded-xl p-4 font-mono text-xs text-slate-400 overflow-auto max-h-64">
                                            <pre>{JSON.stringify(reputation.zk_proof, null, 2)}</pre>
                                        </div>
                                        <p className="mt-4 text-sm text-slate-400">
                                            This Groth16 proof cryptographically verifies the reputation computation without revealing the underlying transaction data.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Empty State */}
                    {!identity && !loading && (
                        <div className="text-center py-20">
                            <Shield size={64} className="mx-auto text-slate-700 mb-4" />
                            <h3 className="text-xl font-semibold text-slate-400 mb-2">No Agent Analyzed Yet</h3>
                            <p className="text-slate-500">Enter an agent address above to get started</p>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
