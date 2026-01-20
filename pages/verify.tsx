import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft, Shield, FileJson, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function VerifyPage() {
    const [taskId, setTaskId] = useState('');
    const [proofJSON, setProofJSON] = useState('');
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [selectedAnomaly, setSelectedAnomaly] = useState<number | null>(null);

    const handleVerify = async () => {
        setLoading(true);
        setVerificationResult(null);

        try {
            // Parse proof JSON
            const proof = JSON.parse(proofJSON);

            // Verify using v2 API
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Left: Input Section */}
                    <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'}`}>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FileJson size={20} className="text-blue-500" />
                            Proof Input
                        </h2>

                        <div className="space-y-4">
                            {/* Task ID (Optional) */}
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">
                                    Task ID (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={taskId}
                                    onChange={(e) => setTaskId(e.target.value)}
                                    placeholder="Enter task ID to fetch proof..."
                                    className={`w-full px-4 py-2.5 rounded-lg border text-sm font-mono ${isDarkMode ? 'bg-black/30 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                />
                            </div>

                            {/* Proof JSON */}
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

                            {/* Verify Button */}
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

                        {/* Example */}
                        <div className={`mt-6 p-4 rounded-lg border text-xs ${isDarkMode ? 'bg-blue-500/5 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                            <strong className="block mb-1">💡 How to Get a Proof:</strong>
                            <ol className="list-decimal list-inside space-y-1 text-slate-400">
                                <li>Run analysis on dashboard</li>
                                <li>Call <code className="bg-black/20 px-1 rounded">/api/v2/proof/build</code></li>
                                <li>Extract proof for any anomaly from bundle</li>
                                <li>Paste here to verify</li>
                            </ol>
                        </div>
                    </div>

                    {/* Right: Results Section */}
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

                        <AnimatePresence mode="wait">
                            {verificationResult && (
                                <motion.div
                                    key={verificationResult.valid ? 'valid' : 'invalid'}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-4"
                                >
                                    {/* Status Badge */}
                                    <div className={`p-6 rounded-2xl border-2 flex items-center gap-4 ${verificationResult.valid
                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                            : 'bg-red-500/10 border-red-500/30'
                                        }`}>
                                        {verificationResult.valid ? (
                                            <CheckCircle size={48} className="text-emerald-500" />
                                        ) : (
                                            <XCircle size={48} className="text-red-500" />
                                        )}
                                        <div>
                                            <h3 className={`text-2xl font-bold ${verificationResult.valid ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {verificationResult.valid ? 'Valid Proof' : 'Invalid Proof'}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {verificationResult.valid
                                                    ? 'Anomaly authenticity confirmed via Merkle verification'
                                                    : verificationResult.error || 'Proof verification failed'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Proof Details */}
                                    {verificationResult.valid && verificationResult.proof && (
                                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Proof Components</h4>

                                            <div className="space-y-2 font-mono text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Leaf Hash:</span>
                                                    <span className="text-blue-400 truncate max-w-[200px]" title={verificationResult.proof.leaf}>
                                                        {verificationResult.proof.leaf.substring(0, 16)}...
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Root Hash:</span>
                                                    <span className="text-emerald-400 truncate max-w-[200px]" title={verificationResult.proof.root}>
                                                        {verificationResult.proof.root.substring(0, 16)}...
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Path Length:</span>
                                                    <span className="text-purple-400">{verificationResult.proof.path.length} steps</span>
                                                </div>
                                            </div>

                                            {/* Anomaly Data */}
                                            {verificationResult.proof.anomaly && (
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <button
                                                        onClick={() => setSelectedAnomaly(selectedAnomaly === 0 ? null : 0)}
                                                        className="w-full flex items-center justify-between text-sm font-bold text-slate-300 hover:text-white transition-colors"
                                                    >
                                                        Verified Anomaly Details
                                                        {selectedAnomaly === 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>

                                                    <AnimatePresence>
                                                        {selectedAnomaly === 0 && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="mt-3 space-y-2 text-xs">
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-500">Type:</span>
                                                                        <span className="text-white">{verificationResult.proof.anomaly.anomaly_type}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-500">Confidence:</span>
                                                                        <span className={`font-bold ${verificationResult.proof.anomaly.confidence === 'High'
                                                                                ? 'text-red-400'
                                                                                : 'text-amber-400'
                                                                            }`}>{verificationResult.proof.anomaly.confidence}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-500">Detection:</span>
                                                                        <span className="text-white">{verificationResult.proof.anomaly.detection_method}</span>
                                                                    </div>
                                                                    <div className="flex justify-between">
                                                                        <span className="text-slate-500">Entities:</span>
                                                                        <span className="text-blue-300">
                                                                            {verificationResult.proof.anomaly.entities_involved.join(', ')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Blockchain Verification (Future) */}
                                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle size={16} className="text-indigo-400 mt-0.5" />
                                            <div className="text-xs text-indigo-300">
                                                <strong className="block mb-1">On-Chain Verification Available</strong>
                                                <p className="text-indigo-400/70">
                                                    Use the agent runtime to anchor proofs on-chain via ResultAnchor contract.
                                                    Then verify against blockchain state for tamper-proof auditability.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
