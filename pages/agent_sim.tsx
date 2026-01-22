import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Play, ArrowLeft, CheckCircle, Loader, Upload, Shield, Link as LinkIcon, FileJson, Lock, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type WorkflowStep = {
    name: string;
    status: 'pending' | 'running' | 'complete' | 'error';
    message?: string;
    data?: any;
};

export default function AgentSimulator() {
    const [file, setFile] = useState<File | null>(null);
    const [running, setRunning] = useState(false);
    const [steps, setSteps] = useState<WorkflowStep[]>([
        { name: 'Upload CSV', status: 'pending' },
        { name: 'Run Analysis', status: 'pending' },
        { name: 'Build Proof', status: 'pending' },
        { name: 'Sign Bundle', status: 'pending' },
        { name: 'Anchor On-Chain', status: 'pending' }
    ]);
    const [finalResult, setFinalResult] = useState<any>(null);
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Data Source Selection State
    const [dataSource, setDataSource] = useState<'csv' | 'bank_api' | 'stream'>('csv');
    const [simulatedData, setSimulatedData] = useState<any[] | null>(null);
    const [fetchingData, setFetchingData] = useState(false);

    const updateStep = (index: number, status: WorkflowStep['status'], message?: string, data?: any) => {
        setSteps(prev => prev.map((step, i) =>
            i === index ? { ...step, status, message, data } : step
        ));
    };

    const runAgentWorkflow = async () => {
        if (!file) return;

        setRunning(true);
        setFinalResult(null);

        // Reset all steps
        setSteps(prev => prev.map(s => ({ ...s, status: 'pending', message: undefined, data: undefined })));

        try {
            // Step 1: Upload CSV
            updateStep(0, 'running', 'Uploading to PoEC backend...');
            const formData = new FormData();
            formData.append('file', file);

            const ingestRes = await fetch(`${API_URL}/api/v1/ingest`, {
                method: 'POST',
                body: formData
            });

            if (!ingestRes.ok) throw new Error('Upload failed');
            const ingestData = await ingestRes.json();
            updateStep(0, 'complete', `Batch ID: ${ingestData.batch_id}`, { content_hash: ingestData.content_hash });

            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 2: Run Analysis
            updateStep(1, 'running', 'Executing GNN inference...');
            const analyzeRes = await fetch(`${API_URL}/api/v1/analyze`, {
                method: 'POST'
            });

            if (!analyzeRes.ok) throw new Error('Analysis failed');
            const analyzeData = await analyzeRes.json();
            updateStep(1, 'complete', `${analyzeData.anomalies.length} anomalies detected`, {
                anomaly_count: analyzeData.anomalies.length,
                model_hash: analyzeData.model_hash,
                results_hash: analyzeData.results_hash
            });

            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 3: Build Proof
            updateStep(2, 'running', 'Generating Merkle tree...');
            const proofRes = await fetch(`${API_URL}/api/v2/proof/build`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataset_hash: ingestData.content_hash,
                    model_hash: analyzeData.model_hash
                })
            });

            if (!proofRes.ok) throw new Error('Proof building failed');
            const proofData = await proofRes.json();
            updateStep(2, 'complete', `Merkle root: ${proofData.merkle_root.substring(0, 16)}...`, proofData);

            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 4: Sign Bundle (Simulated - would be done by agent with private key)
            updateStep(3, 'running', 'Signing proof bundle...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockSignature = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            updateStep(3, 'complete', `Signature: ${mockSignature.substring(0, 20)}...`, { signature: mockSignature });

            await new Promise(resolve => setTimeout(resolve, 500));

            // Step 5: Anchor On-Chain (Simulated - would call ResultAnchor contract)
            updateStep(4, 'running', 'Submitting to blockchain...');
            await new Promise(resolve => setTimeout(resolve, 1500));
            const mockTxHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            updateStep(4, 'complete', `TX: ${mockTxHash.substring(0, 20)}...`, {
                transaction_hash: mockTxHash,
                block_number: Math.floor(Math.random() * 1000000)
            });

            // Set final result
            setFinalResult({
                task_id: proofData.task_id,
                merkle_root: proofData.merkle_root,
                bundle_cid: proofData.bundle_cid,
                transaction_hash: mockTxHash,
                anomaly_count: analyzeData.anomalies.length
            });

        } catch (error: any) {
            const currentStep = steps.findIndex(s => s.status === 'running');
            if (currentStep >= 0) {
                updateStep(currentStep, 'error', error.message);
            }
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-800'}`}>
            <Head>
                <title>Agent Simulator | PoEC</title>
            </Head>

            {/* Header */}
            <div className="absolute top-6 left-6 right-6 h-16 z-50 pointer-events-none flex justify-center">
                <header className={`pointer-events-auto h-full px-6 flex items-center justify-between gap-12 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${isDarkMode ? 'bg-[#111]/80 border-white/10 shadow-black/50' : 'bg-white/80 border-slate-200 shadow-slate-200'} max-w-5xl w-full`}>

                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <ArrowLeft size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                        <div className="flex flex-col">
                            <span className={`font-bold tracking-tight text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>PoEC Console</span>
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">x402 Agent Simulator</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Demo Mode</span>
                    </div>
                </header>
            </div>

            {/* Main Content */}
            <main className="pt-32 pb-12 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Workflow */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'}`}>
                            <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    🤖
                                </div>
                                x402 Autonomous Agent Simulator
                            </h1>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Simulate the complete autonomous agent workflow: from data acquisition through analysis,
                                proof generation, signing, and blockchain anchoring. This demonstrates how the TypeScript
                                agent runtime orchestrates PoEC v2 without human intervention.
                            </p>
                        </div>

                        {/* Data Source Section */}
                        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'}`}>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
                                <Upload size={14} />
                                Data Source
                            </h2>

                            {/* Source Type Selector */}
                            <div className="mb-4">
                                <div className="flex gap-2 p-1 bg-black/30 rounded-lg">
                                    {(['csv', 'bank_api', 'stream'] as const).map((source) => (
                                        <button
                                            key={source}
                                            onClick={() => {
                                                setDataSource(source);
                                                setFile(null);
                                                setSimulatedData(null);
                                            }}
                                            disabled={running}
                                            className={`flex-1 py-2 px-3 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${dataSource === source
                                                ? 'bg-blue-600 text-white'
                                                : 'text-slate-400 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            {source === 'csv' && '📁 CSV Upload'}
                                            {source === 'bank_api' && '🏦 Bank API'}
                                            {source === 'stream' && '📡 Live Stream'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* CSV Upload Mode */}
                            {dataSource === 'csv' && (
                                <label className={`flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed transition-all cursor-pointer ${file
                                    ? (isDarkMode ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-emerald-500 bg-emerald-50')
                                    : (isDarkMode ? 'border-white/10 hover:border-blue-500/50 hover:bg-white/5' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50')
                                    }`}>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => e.target.files && setFile(e.target.files[0])}
                                        className="hidden"
                                        disabled={running}
                                    />
                                    {file ? <CheckCircle className="text-emerald-500" size={24} /> : <Upload className="text-slate-400" size={24} />}
                                    <span className="text-sm font-medium mt-2">{file ? file.name : 'Upload CSV'}</span>
                                </label>
                            )}

                            {/* Bank API Mode */}
                            {dataSource === 'bank_api' && (
                                <div className="space-y-3">
                                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50'}`}>
                                        <p className="text-xs text-slate-400 mb-2">
                                            Simulates a bank API response with realistic transactions including fraud patterns (circular trading, wash trading, structuring).
                                        </p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            setFetchingData(true);
                                            setSimulatedData(null);
                                            try {
                                                console.log('Fetching from:', `${API_URL}/api/v2/bank/simulate`);
                                                const res = await fetch(`${API_URL}/api/v2/bank/simulate`);
                                                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                                const data = await res.json();
                                                console.log('Bank API response:', data);
                                                if (!data.transactions) throw new Error('No transactions in response');
                                                setSimulatedData(data.transactions);
                                                // Convert to CSV blob
                                                const csvContent = 'source,target,amount,timestamp\n' +
                                                    data.transactions.map((t: any) => `${t.source},${t.target},${t.amount},${t.timestamp}`).join('\n');
                                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                                const csvFile = new File([blob], 'bank_simulated.csv', { type: 'text/csv' });
                                                setFile(csvFile);
                                            } catch (err: any) {
                                                console.error('Bank API fetch failed:', err);
                                                alert(`Failed to fetch bank data: ${err.message}`);
                                            } finally {
                                                setFetchingData(false);
                                            }
                                        }}
                                        disabled={running || fetchingData}
                                        className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                                    >
                                        {fetchingData ? <Loader size={16} className="animate-spin" /> : '🏦'}
                                        {fetchingData ? 'Fetching...' : 'Fetch Simulated Bank Transactions'}
                                    </button>
                                    {simulatedData && (
                                        <div className="text-xs text-emerald-400 font-mono">
                                            ✓ {simulatedData.length} transactions loaded
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Live Stream Mode */}
                            {dataSource === 'stream' && (
                                <div className="space-y-3">
                                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'border-purple-500/20 bg-purple-500/5' : 'border-purple-200 bg-purple-50'}`}>
                                        <p className="text-xs text-slate-400 mb-2">
                                            Simulates a live transaction stream with timestamped events. Includes rapid movement and circular patterns.
                                        </p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            setFetchingData(true);
                                            setSimulatedData(null);
                                            try {
                                                console.log('Fetching from:', `${API_URL}/api/v2/bank/stream?events=20`);
                                                const res = await fetch(`${API_URL}/api/v2/bank/stream?events=20`);
                                                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                                                const data = await res.json();
                                                console.log('Stream response:', data);
                                                if (!data.events) throw new Error('No events in response');
                                                setSimulatedData(data.events);
                                                // Convert to CSV blob
                                                const csvContent = 'source,target,amount,timestamp\n' +
                                                    data.events.map((t: any) => `${t.source},${t.target},${t.amount},${t.timestamp}`).join('\n');
                                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                                const csvFile = new File([blob], 'stream_events.csv', { type: 'text/csv' });
                                                setFile(csvFile);
                                            } catch (err: any) {
                                                console.error('Stream fetch failed:', err);
                                                alert(`Failed to fetch stream data: ${err.message}`);
                                            } finally {
                                                setFetchingData(false);
                                            }
                                        }}
                                        disabled={running || fetchingData}
                                        className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                                    >
                                        {fetchingData ? <Loader size={16} className="animate-spin" /> : '📡'}
                                        {fetchingData ? 'Streaming...' : 'Start Stream (20 events)'}
                                    </button>
                                    {simulatedData && (
                                        <div className="text-xs text-emerald-400 font-mono">
                                            ✓ {simulatedData.length} stream events captured
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={runAgentWorkflow}
                                disabled={!file || running}
                                className={`w-full mt-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${!file || running
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg'
                                    }`}
                            >
                                {running ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
                                {running ? 'Agent Running...' : 'Run Agent Workflow'}
                            </button>
                        </div>

                        {/* Workflow Steps */}
                        <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'}`}>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6">Execution Pipeline</h2>

                            <div className="space-y-3">
                                {steps.map((step, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`relative p-4 rounded-xl border transition-all ${step.status === 'complete'
                                            ? (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200')
                                            : step.status === 'running'
                                                ? (isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200')
                                                : step.status === 'error'
                                                    ? (isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200')
                                                    : (isDarkMode ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-200')
                                            }`}
                                    >
                                        {/* Connector Line */}
                                        {index < steps.length - 1 && (
                                            <div className={`absolute left-8 top-full w-0.5 h-3 ${step.status === 'complete' ? 'bg-emerald-500' : 'bg-slate-700'
                                                }`} />
                                        )}

                                        <div className="flex items-center gap-4">
                                            {/* Status Icon */}
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step.status === 'complete'
                                                ? 'bg-emerald-500'
                                                : step.status === 'running'
                                                    ? 'bg-blue-500'
                                                    : step.status === 'error'
                                                        ? 'bg-red-500'
                                                        : 'bg-slate-700'
                                                }`}>
                                                {step.status === 'complete' && <CheckCircle size={16} className="text-white" />}
                                                {step.status === 'running' && <Loader size={16} className="text-white animate-spin" />}
                                                {step.status === 'error' && <span className="text-white text-xs font-bold">!</span>}
                                                {step.status === 'pending' && <span className="text-slate-500 text-xs font-bold">{index + 1}</span>}
                                            </div>

                                            {/* Step Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-sm">{step.name}</h3>
                                                    {step.status === 'running' && (
                                                        <span className="text-xs text-blue-400 animate-pulse">Running...</span>
                                                    )}
                                                </div>
                                                {step.message && (
                                                    <p className="text-xs text-slate-400 mt-1 font-mono">{step.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Final Result */}
                        <AnimatePresence>
                            {finalResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-6 rounded-2xl border-2 ${isDarkMode ? 'bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/30' : 'bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-300'}`}
                                >
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-400">
                                        <CheckCircle size={24} />
                                        Workflow Complete
                                    </h2>

                                    <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-black/30' : 'bg-white/50'}`}>
                                            <span className="text-slate-500 block mb-1">Task ID</span>
                                            <span className="text-blue-400 font-bold">{finalResult.task_id}</span>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-black/30' : 'bg-white/50'}`}>
                                            <span className="text-slate-500 block mb-1">Anomalies</span>
                                            <span className="text-red-400 font-bold">{finalResult.anomaly_count}</span>
                                        </div>
                                        <div className={`p-3 rounded-lg col-span-2 ${isDarkMode ? 'bg-black/30' : 'bg-white/50'}`}>
                                            <span className="text-slate-500 block mb-1">Merkle Root</span>
                                            <span className="text-emerald-400 font-bold break-all">{finalResult.merkle_root}</span>
                                        </div>
                                        <div className={`p-3 rounded-lg col-span-2 ${isDarkMode ? 'bg-black/30' : 'bg-white/50'}`}>
                                            <span className="text-slate-500 block mb-1">Bundle CID</span>
                                            <span className="text-purple-400 font-bold break-all">{finalResult.bundle_cid}</span>
                                        </div>
                                        <div className={`p-3 rounded-lg col-span-2 ${isDarkMode ? 'bg-black/30' : 'bg-white/50'}`}>
                                            <span className="text-slate-500 block mb-1">Transaction Hash</span>
                                            <span className="text-blue-400 font-bold break-all">{finalResult.transaction_hash}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => {
                                                const proofJson = JSON.stringify({
                                                    leaf: finalResult.merkle_root,
                                                    root: finalResult.merkle_root,
                                                    path: [],
                                                    task_id: finalResult.task_id,
                                                    bundle_cid: finalResult.bundle_cid,
                                                    tx_hash: finalResult.transaction_hash
                                                }, null, 2);
                                                navigator.clipboard.writeText(proofJson);
                                                alert('Proof JSON copied to clipboard!');
                                            }}
                                            className="flex-1 py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold text-center transition-colors"
                                        >
                                            📋 Copy Proof JSON
                                        </button>
                                        <Link href="/verify" className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition-colors">
                                            Verify Proof
                                        </Link>
                                        <Link href="/dashboard" className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold text-center transition-colors">
                                            View in Dashboard
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right Column - x402 Info Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* x402 Agent Info Card */}
                        <div className={`p-6 rounded-2xl border-2 sticky top-24 ${isDarkMode ? 'bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border-green-500/30' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm">x402 Agent Runtime</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <span className="text-[10px] text-green-400 font-mono uppercase tracking-wider">Production Ready</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">What is x402?</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        x402 is an <strong className="text-white">autonomous agent standard</strong> that enables AI systems to operate independently—monitoring data sources, executing analysis, and anchoring cryptographic proofs to blockchain without human intervention.
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wide">How This Simulator Works</h4>
                                    <ul className="space-y-2 text-xs text-slate-400">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-400 mt-0.5">→</span>
                                            <span>Mimics real x402 agent behavior in a visual UI</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-400 mt-0.5">→</span>
                                            <span>Connects to simulated bank APIs & live streams</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-400 mt-0.5">→</span>
                                            <span>Demonstrates full forensic pipeline end-to-end</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <h4 className="text-xs font-bold text-white mb-2 uppercase tracking-wide">Production Deployment</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                                        In production, the x402 agent runs as a headless daemon with:
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-slate-300">Real private key signing</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-slate-300">Live blockchain anchoring</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                            <span className="text-slate-300">24/7 autonomous monitoring</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <div className="bg-black/30 rounded-lg p-3 font-mono text-[10px]">
                                        <div className="text-slate-500 mb-1"># Run production agent</div>
                                        <div className="text-green-400">$ cd agent-runtime</div>
                                        <div className="text-green-400">$ npm run start:daemon</div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Link href="/about" className="block w-full py-2 px-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg text-center text-xs font-bold text-green-400 transition-colors">
                                        Learn More About x402 →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
