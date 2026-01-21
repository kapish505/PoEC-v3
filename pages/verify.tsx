import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft, Shield, FileJson, Lock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalysis } from '../components/AnalysisContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function VerifyPage() {
    const { anomalies, anchorData, txHash, blockNumber } = useAnalysis();

    const [proofJSON, setProofJSON] = useState('');
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [selectedAnomaly, setSelectedAnomaly] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'manual' | 'current'>('current');

    const handleVerify = async () => {
        setLoading(true);
        setVerificationResult(null);

        try {
            // Validate input is valid JSON
            if (!proofJSON.trim().startsWith('{')) {
                throw new Error('Invalid format: Expected JSON object starting with {. Please paste a properly formatted Merkle proof like: {"leaf": "0x...", "root": "0x...", "path": [...]}');
            }

            let proof;
            try {
                proof = JSON.parse(proofJSON);
            } catch (parseErr) {
                throw new Error('Invalid JSON format. Expected: {"leaf": "0x...", "root": "0x...", "path": [...]}');
            }

            // Validate required fields
            if (!proof.leaf || !proof.root || !proof.path) {
                throw new Error('Missing required fields. Proof must contain: leaf, root, and path');
            }

            const res = await fetch(`${API_URL}/api/v2/verify/merkle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leaf: proof.leaf,
                    proof_path: proof.path,
                    expected_root: proof.root
                })
            });

            const result = await res.json();
            setVerificationResult({ ...result, proof });
        } catch (err: any) {
            setVerificationResult({
                valid: false,
                error: err.message || 'Verification failed'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOnChain = async () => {
        if (!anchorData?.result_hash) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/v1/verify/${anchorData.result_hash}`);
            const json = await res.json();
            setVerificationResult({
                valid: json.verified,  // Backend returns 'verified' not 'exists'
                timestamp: json.timestamp,
                ipfs_cid: json.ipfs_cid,
                on_chain: true
            });
        } catch (err: any) {
            setVerificationResult({ valid: false, error: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-800'}`}>
            <Head>
                <title>Verify Proof | PoEC</title>
            </Head>

            {/* Header */}
            <div className="absolute top-6 left-6 right-6 h-16 z-50 pointer-events-none flex justify-center">
                <header className={`pointer-events-auto h-full px-6 flex items-center justify-between gap-12 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${isDarkMode ? 'bg-[#111]/80 border-white/10 shadow-black/50' : 'bg-white/80 border-slate-200 shadow-slate-200'} max-w-5xl w-full`}>

                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <ArrowLeft size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                        <div className="flex flex-col">
                            <span className={`font-bold tracking-tight text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>PoEC Console</span>
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Proof Verification</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Shield className="text-emerald-500" size={20} />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Merkle Verifier</span>
                    </div>
                </header>
            </div>

            {/* Main Content */}
            <main className="pt-32 pb-12 px-6 max-w-5xl mx-auto">

                {/* Tab Selector */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('current')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'current' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                    >
                        Current Analysis ({anomalies.length} anomalies)
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'manual' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                    >
                        Manual Proof Input
                    </button>
                </div>

                {activeTab === 'current' ? (
                    <div className="space-y-6">
                        {/* Current Analysis Summary */}
                        {anomalies.length > 0 ? (
                            <>
                                {/* Blockchain Status */}
                                <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'}`}>
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Lock size={20} className="text-purple-500" />
                                        On-Chain Status
                                    </h2>

                                    {txHash ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-emerald-500">
                                                <CheckCircle size={20} />
                                                <span className="font-bold">Anchored on Sepolia Testnet</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <div className="text-xs text-slate-500 uppercase mb-1">Transaction Hash</div>
                                                    <a
                                                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-blue-400 underline hover:text-blue-300 font-mono text-xs flex items-center gap-1"
                                                    >
                                                        {txHash.substring(0, 20)}... <ExternalLink size={12} />
                                                    </a>
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-500 uppercase mb-1">Block Number</div>
                                                    <span className="font-mono">{blockNumber}</span>
                                                </div>
                                            </div>

                                            {anchorData && (
                                                <div className="mt-4 p-4 rounded-lg bg-black/30 border border-white/5">
                                                    <div className="text-xs text-slate-500 uppercase mb-2">Anchored Hashes</div>
                                                    <div className="space-y-2 font-mono text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Data Hash:</span>
                                                            <span className="text-slate-300">{anchorData.data_hash?.substring(0, 16)}...</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Model Hash:</span>
                                                            <span className="text-slate-300">{anchorData.model_hash?.substring(0, 16)}...</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-500">Result Root:</span>
                                                            <span className="text-blue-400 font-bold">{anchorData.result_hash?.substring(0, 16)}...</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={handleVerifyOnChain}
                                                disabled={loading}
                                                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 rounded-lg text-sm font-bold text-white transition-all"
                                            >
                                                {loading ? 'Verifying...' : 'Verify On-Chain'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                                            <p>No anchored transaction found.</p>
                                            <p className="text-xs mt-1">Run analysis and anchor to blockchain first.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Anomaly List */}
                                <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'}`}>
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <AlertTriangle size={20} className="text-amber-500" />
                                        Detected Anomalies ({anomalies.length})
                                    </h2>

                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {anomalies.map((anomaly, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedAnomaly === idx ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-black/20 hover:border-white/20'}`}
                                                onClick={() => setSelectedAnomaly(selectedAnomaly === idx ? null : idx)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-sm">{anomaly.anomaly_type}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${anomaly.confidence === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                        {anomaly.confidence}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    {anomaly.entities_involved?.slice(0, 3).join(', ')}
                                                    {anomaly.entities_involved?.length > 3 && ` +${anomaly.entities_involved.length - 3} more`}
                                                </div>

                                                <AnimatePresence>
                                                    {selectedAnomaly === idx && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="mt-3 pt-3 border-t border-white/10 text-xs space-y-1">
                                                                <div><span className="text-slate-500">Detection:</span> {anomaly.detection_method}</div>
                                                                <div><span className="text-slate-500">Score:</span> {anomaly.score?.toFixed(3)}</div>
                                                                <div className="text-slate-400 mt-2">{anomaly.explanation}</div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className={`rounded-2xl border p-12 text-center ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'}`}>
                                <Shield size={48} className="mx-auto mb-4 opacity-20" />
                                <h2 className="text-lg font-bold mb-2">No Analysis Data</h2>
                                <p className="text-sm text-slate-500 mb-4">Run an analysis on the dashboard to see verification options.</p>
                                <Link href="/dashboard" className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold text-white transition-all">
                                    Go to Dashboard
                                </Link>
                            </div>
                        )}

                        {/* Verification Result */}
                        {verificationResult && (
                            <div className={`rounded-2xl border p-6 ${verificationResult.valid ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                                <div className="flex items-center gap-3">
                                    {verificationResult.valid ? (
                                        <CheckCircle size={32} className="text-emerald-500" />
                                    ) : (
                                        <XCircle size={32} className="text-red-500" />
                                    )}
                                    <div>
                                        <h3 className={`text-xl font-bold ${verificationResult.valid ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {verificationResult.valid ? 'Verified On-Chain' : 'Verification Failed'}
                                        </h3>
                                        {verificationResult.timestamp && (
                                            <p className="text-xs text-slate-400">
                                                Anchored: {new Date(verificationResult.timestamp * 1000).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Manual Input Tab - Original UI */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'}`}>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FileJson size={20} className="text-blue-500" />
                                Proof Input
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                        Merkle Proof (JSON)
                                    </label>
                                    <textarea
                                        value={proofJSON}
                                        onChange={(e) => setProofJSON(e.target.value)}
                                        placeholder='{\n  "leaf": "0x...",\n  "root": "0x...",\n  "path": [...]\n}'
                                        className={`w-full h-64 px-4 py-3 rounded-lg border text-xs font-mono ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                    />
                                </div>

                                <button
                                    onClick={handleVerify}
                                    disabled={!proofJSON || loading}
                                    className={`w-full py-3 rounded-lg text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${!proofJSON || loading
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white shadow-lg'
                                        }`}
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Shield size={16} />
                                    )}
                                    {loading ? 'Verifying...' : 'Verify Proof'}
                                </button>
                            </div>
                        </div>

                        <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'}`}>
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Lock size={20} className="text-purple-500" />
                                Verification Result
                            </h2>

                            {!verificationResult && (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                    <Shield size={48} className="opacity-20 mb-4" />
                                    <p className="text-sm italic">Awaiting proof input...</p>
                                </div>
                            )}

                            {verificationResult && (
                                <div className={`p-6 rounded-2xl border-2 ${verificationResult.valid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                                    {verificationResult.valid ? (
                                        <CheckCircle size={48} className="text-emerald-500" />
                                    ) : (
                                        <XCircle size={48} className="text-red-500" />
                                    )}
                                    <h3 className={`text-2xl font-bold mt-3 ${verificationResult.valid ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {verificationResult.valid ? 'Valid Proof' : 'Invalid Proof'}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {verificationResult.valid ? 'Merkle proof verified successfully' : verificationResult.error}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
