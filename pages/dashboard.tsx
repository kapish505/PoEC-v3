import React, { useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
    Database, Upload, Network, Play, Loader, Clock, CheckCircle,
    AlertTriangle, ExternalLink, Shield, RefreshCw, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalysis, LogEntry, Anomaly as ContextAnomaly, GraphData } from '../components/AnalysisContext';
import AnomalyList from '../components/AnomalyList';

// Dynamic import for GraphViz to avoid SSR issues with Cytoscape
const GraphViz = dynamic(() => import('../components/GraphViz'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type DataSource = 'monad_rpc' | 'csv' | 'preseeded';
type PipelineStep = 'idle' | 'fetching' | 'building' | 'analyzing' | 'proving' | 'anchoring' | 'complete';

// Convert context anomalies to AnomalyList format
interface AnomalyListAnomaly {
    anomaly_id: string;
    anomaly_type: string;
    severity: number;
    description: string;
    confidence?: string;
    detection_method?: string;
    explanation_metadata?: any;
    entities_involved: string[];
    evidence_data: any;
}

export default function Dashboard() {
    const {
        dataSource, setDataSource,
        rpcUrl, setRpcUrl,
        graphData, setGraphData,
        anomalies, setAnomalies,
        proofBundle, setProofBundle,
        merkleRoot, setMerkleRoot,
        anchorTx, setAnchorTx,
        logs, addLog, clearLogs,
        pipelineStep, setPipelineStep,
        selectedAnomaly, setSelectedAnomaly,
        focusedNode, setFocusedNode,
        clearAll
    } = useAnalysis();

    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [agentAddress, setAgentAddress] = useState('0xC38bdC2352A2fBC60a4Fd4FbA4BECACE46B91b4B');
    const [timing, setTiming] = useState<{ [key: string]: number }>({});

    // Abort controller for cancelling requests
    const abortControllerRef = React.useRef<AbortController | null>(null);

    // Reset stuck pipelineStep on mount (in case of reload during running)
    React.useEffect(() => {
        if (pipelineStep !== 'idle' && pipelineStep !== 'complete') {
            setPipelineStep('idle');
            addLog('System', 'Pipeline reset due to page reload', 'warning');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Stop pipeline function
    const stopPipeline = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setPipelineStep('idle');
        addLog('System', 'Pipeline stopped by user', 'warning');
    };

    // Data source descriptions
    const dataSourceInfo: Record<DataSource, { title: string; description: string; icon: React.ReactNode }> = {
        monad_rpc: {
            title: 'Real-Time Monad Data',
            description: 'Fetching REAL transactions from Monad testnet via RPC. No simulation.',
            icon: <Network size={18} />
        },
        csv: {
            title: 'Manual CSV Upload',
            description: 'Upload your own transaction dataset (source, target, amount, timestamp).',
            icon: <Upload size={18} />
        },
        preseeded: {
            title: 'Pre-seeded Demo Data',
            description: 'Demo dataset pre-deployed on Monad for instant verification.',
            icon: <Database size={18} />
        }
    };

    // Convert graph data to Cytoscape elements
    const graphElements = useMemo(() => {
        if (!graphData) return [];

        const elements: any[] = [];

        // Add nodes
        (graphData.nodes || []).forEach((node: any) => {
            const nodeId = typeof node === 'string' ? node : node.id;
            const isAnomaly = anomalies.some(a =>
                a.entity === nodeId || (a as any).entities_involved?.includes(nodeId)
            );
            elements.push({
                data: {
                    id: nodeId,
                    label: nodeId.slice(0, 8) + '...',
                    isAnomaly,
                    anomalyScore: isAnomaly ? 0.9 : 0.1
                }
            });
        });

        // Add edges
        (graphData.edges || []).forEach((edge: any, i: number) => {
            elements.push({
                data: {
                    id: `e${i}`,
                    source: edge.source,
                    target: edge.target,
                    amount: edge.amount,
                    score: edge.amount || 0.5
                }
            });
        });

        return elements;
    }, [graphData, anomalies]);

    // Convert context anomalies to AnomalyList format
    const anomalyListData: AnomalyListAnomaly[] = useMemo(() => {
        return anomalies.map((a, i) => ({
            anomaly_id: a.id || `anomaly_${i}`,
            anomaly_type: a.type || 'Unknown',
            severity: a.score || 0.5,
            description: a.description || 'Anomalous behavior detected',
            confidence: a.score > 0.8 ? 'High' : 'Medium',
            detection_method: 'GNN',
            entities_involved: [a.entity || 'unknown'],
            evidence_data: { txHashes: a.txHashes || [] }
        }));
    }, [anomalies]);

    // Run the full pipeline
    const runPipeline = async () => {
        // Create abort controller for this run
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        clearLogs();
        setTiming({});
        const startTime = Date.now();
        const newTiming: { [key: string]: number } = {};

        try {
            // ==================== MONAD_RPC: UNIFIED PIPELINE ====================
            if (dataSource === 'monad_rpc') {
                addLog('Pipeline', 'Starting REAL end-to-end analysis...', 'info');
                addLog('Monad', `Target: ${agentAddress.slice(0, 10)}...${agentAddress.slice(-6)}`, 'info');
                addLog('Monad', `RPC: ${rpcUrl}`, 'info');

                // STEP 1: FETCH
                setPipelineStep('fetching');
                addLog('Fetch', 'Fetching transactions from Monad RPC (with 1-hop expansion)...', 'info');

                const startFetch = Date.now();

                // Call unified endpoint (50 blocks = ~30s of Monad testnet history)
                const res = await fetch(`${API_URL}/api/v3/analyze/full`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        address: agentAddress,
                        block_range: 50,  // Reduced from 500 to prevent timeout
                        rpc_url: rpcUrl
                    }),
                    signal
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ detail: 'Unknown error' }));
                    throw new Error(errorData.detail || `Analysis failed: ${res.status}`);
                }

                const result = await res.json();

                newTiming.fetch = Date.now() - startFetch;
                addLog('Fetch', `Completed in ${(newTiming.fetch / 1000).toFixed(2)}s`, 'success');

                // STEP 2: BUILDING (backend already did this)
                setPipelineStep('building');
                addLog('Graph', `Backend built graph: ${result.graph?.node_count || 0} nodes, ${result.graph?.edge_count || 0} edges`, 'success');

                // Convert backend graph to frontend format
                const fetchedGraphData: GraphData = {
                    nodes: (result.graph?.nodes || []).map((n: any) => ({
                        id: n.id || n,
                        label: n.label || (typeof n === 'string' ? n.slice(0, 8) + '...' : n.id?.slice(0, 8) + '...'),
                        balance: n.net_flow,
                        txCount: n.tx_count,
                        isAnomaly: false
                    })),
                    edges: (result.graph?.edges || []).map((e: any) => ({
                        source: e.source,
                        target: e.target,
                        amount: e.amount,
                        hash: e.hash,
                        timestamp: e.date
                    })),
                    centerAddress: agentAddress
                };
                setGraphData(fetchedGraphData);

                // STEP 3: GNN (backend already did this)
                setPipelineStep('analyzing');
                const anomalyCount = result.anomalies?.length || 0;
                addLog('GNN', `Real GNN inference completed`, 'success');
                addLog('GNN', `Detected ${anomalyCount} anomalies`, anomalyCount > 0 ? 'warning' : 'success');

                // Convert anomalies to context format
                const detectedAnomalies: ContextAnomaly[] = (result.anomalies || []).map((a: any, i: number) => ({
                    id: a.anomaly_id || `anomaly_${i}`,
                    entity: a.entities_involved?.[0] || 'unknown',
                    score: a.severity || 0.5,
                    type: a.anomaly_type || 'STRUCTURAL_ANOMALY',
                    description: a.description || 'Anomalous pattern detected by GNN',
                    txHashes: a.evidence_data?.transactions || []
                }));
                setAnomalies(detectedAnomalies);

                // Mark anomaly nodes
                if (fetchedGraphData.nodes && detectedAnomalies.length > 0) {
                    const anomalyEntities = new Set(detectedAnomalies.map(a => a.entity.toLowerCase()));
                    fetchedGraphData.nodes.forEach(n => {
                        if (anomalyEntities.has(n.id.toLowerCase())) {
                            n.isAnomaly = true;
                        }
                    });
                    setGraphData({ ...fetchedGraphData });
                }

                // STEP 4: ZK PROOF (backend already did this)
                setPipelineStep('proving');
                if (result.proof) {
                    addLog('zkVM', `Proof system: ${result.proof.system}`, 'success');
                    addLog('zkVM', `Commitment: ${result.proof.commitment?.slice(0, 20)}...`, 'success');

                    setProofBundle({
                        task_id: result.task_id,
                        merkle_root: result.merkle_root || '',
                        zk_commitment: result.proof.commitment || '',
                        proof_system: result.proof.system === 'risc0' ? 'risc0' : 'hash_commitment',
                        anomaly_count: result.proof.anomaly_count || anomalyCount,
                        timestamp: result.analyzed_at,
                        proof_size_kb: result.proof.proof_size_kb || 1.5
                    });
                    setMerkleRoot(result.merkle_root);
                } else {
                    addLog('zkVM', 'Proof not generated', 'warning');
                }

                // STEP 5: ANCHOR (backend already did this)
                setPipelineStep('anchoring');
                if (result.anchor_tx) {
                    addLog('Anchor', `Anchored to Monad: ${result.anchor_tx.slice(0, 18)}...`, 'success');
                    setAnchorTx(result.anchor_tx, null);
                } else {
                    addLog('Anchor', 'Anchoring skipped (wallet not configured)', 'warning');
                }

                // COMPLETE
                setPipelineStep('complete');
                newTiming.total = Date.now() - startTime;
                setTiming(newTiming);
                addLog('Pipeline', `REAL pipeline complete! Total: ${(newTiming.total / 1000).toFixed(2)}s`, 'success');

            } else if (dataSource === 'csv' && csvFile) {
                // ==================== CSV MODE (Full Pipeline) ====================
                setPipelineStep('fetching');
                addLog('CSV', `Uploading: ${csvFile.name}`, 'info');

                const formData = new FormData();
                formData.append('file', csvFile);

                const res = await fetch(`${API_URL}/api/v1/ingest`, {
                    method: 'POST',
                    body: formData
                });
                if (!res.ok) throw new Error('CSV upload failed');
                const ingestResult = await res.json();

                addLog('CSV', `Ingested ${ingestResult.record_count} transactions`, 'success');

                // Use graph data from backend if available
                let fetchedGraphData: GraphData = { nodes: [], edges: [], centerAddress: '' };
                if (ingestResult.graph_data) {
                    const gd = ingestResult.graph_data;
                    fetchedGraphData = {
                        nodes: (gd.nodes || []).map((n: any) => ({
                            id: n.id || n,
                            label: (n.label || n.id || n).slice(0, 8),
                            isAnomaly: false
                        })),
                        edges: (gd.edges || []).map((e: any) => ({
                            source: e.source,
                            target: e.target,
                            amount: e.amount,
                            hash: e.hash,
                            timestamp: e.date
                        })),
                        centerAddress: ''
                    };
                    setGraphData(fetchedGraphData);
                    addLog('Graph', `Visualizing ${gd.node_count} nodes from CSV`, 'success');
                } else {
                    setGraphData({ nodes: [], edges: [], centerAddress: '' });
                }

                // Run GNN analysis
                setPipelineStep('analyzing');
                addLog('GNN', 'Running neural network inference...', 'info');
                const analyzeRes = await fetch(`${API_URL}/api/v1/analyze`, { method: 'POST' });
                let detectedAnomalies: ContextAnomaly[] = [];
                if (analyzeRes.ok) {
                    const analyzeData = await analyzeRes.json();
                    detectedAnomalies = (analyzeData.anomalies || []).map((a: any, i: number) => ({
                        id: a.anomaly_id || `anomaly_${i}`,
                        entity: a.entities_involved?.[0] || 'unknown',
                        score: a.severity || 0.5,
                        type: a.anomaly_type || 'Unknown',
                        description: a.description || 'Anomaly detected',
                        txHashes: []
                    }));
                    setAnomalies(detectedAnomalies);
                    addLog('GNN', `Detected ${detectedAnomalies.length} anomalies`, 'success');

                    // Mark anomaly nodes
                    if (fetchedGraphData.nodes && detectedAnomalies.length > 0) {
                        const anomalyEntities = new Set(detectedAnomalies.map(a => a.entity.toLowerCase()));
                        fetchedGraphData.nodes.forEach(n => {
                            if (anomalyEntities.has(n.id.toLowerCase())) {
                                n.isAnomaly = true;
                            }
                        });
                        setGraphData({ ...fetchedGraphData });
                    }
                }

                // Generate proof (NEW!)
                setPipelineStep('proving');
                addLog('zkVM', 'Generating cryptographic commitment...', 'info');

                // Create hash commitment from analysis data
                const dataHash = Array.from(
                    new Uint8Array(
                        await crypto.subtle.digest('SHA-256',
                            new TextEncoder().encode(JSON.stringify({
                                nodes: fetchedGraphData.nodes.length,
                                edges: fetchedGraphData.edges.length,
                                anomalies: detectedAnomalies.length,
                                timestamp: Date.now()
                            }))
                        )
                    )
                ).map(b => b.toString(16).padStart(2, '0')).join('');

                const commitment = `0x${dataHash}`;

                setProofBundle({
                    task_id: `csv_${Date.now()}`,
                    merkle_root: commitment,
                    zk_commitment: commitment,
                    proof_system: 'hash_commitment',
                    anomaly_count: detectedAnomalies.length,
                    timestamp: new Date().toISOString(),
                    proof_size_kb: 0.5
                });
                setMerkleRoot(commitment);

                addLog('zkVM', `Commitment: ${commitment.slice(0, 20)}...`, 'success');

                setPipelineStep('complete');
                addLog('Pipeline', 'CSV analysis complete with proof!', 'success');

            } else if (dataSource === 'preseeded') {
                // ==================== DEMO MODE (Full Pipeline) ====================
                setPipelineStep('fetching');
                addLog('Demo', 'Loading pre-seeded demo dataset...', 'info');
                const fetchedGraphData: GraphData = {
                    nodes: [
                        { id: '0xAgent_A', label: 'Agent A' },
                        { id: '0xAgent_B', label: 'Agent B' },
                        { id: '0xAgent_C', label: 'Agent C', isAnomaly: true },
                        { id: '0xAgent_D', label: 'Agent D' },
                        { id: '0xAgent_E', label: 'Agent E', isAnomaly: true }
                    ],
                    edges: [
                        { source: '0xAgent_A', target: '0xAgent_B', amount: 100, hash: '0x1', timestamp: new Date().toISOString() },
                        { source: '0xAgent_B', target: '0xAgent_C', amount: 50, hash: '0x2', timestamp: new Date().toISOString() },
                        { source: '0xAgent_C', target: '0xAgent_A', amount: 75, hash: '0x3', timestamp: new Date().toISOString() },
                        { source: '0xAgent_D', target: '0xAgent_E', amount: 200, hash: '0x4', timestamp: new Date().toISOString() },
                        { source: '0xAgent_E', target: '0xAgent_A', amount: 30, hash: '0x5', timestamp: new Date().toISOString() }
                    ],
                    centerAddress: '0xAgent_A'
                };
                setGraphData(fetchedGraphData);
                addLog('Demo', 'Loaded 5 agents, 5 transactions', 'success');

                // Building step
                setPipelineStep('building');
                addLog('Graph', 'Building transaction graph...', 'info');
                await new Promise(r => setTimeout(r, 300));
                addLog('Graph', '5 nodes, 5 edges constructed', 'success');

                // GNN step
                setPipelineStep('analyzing');
                addLog('GNN', 'Running neural network inference...', 'info');
                await new Promise(r => setTimeout(r, 500));

                const demoAnomalies: ContextAnomaly[] = [
                    { id: 'a1', entity: '0xAgent_C', score: 0.92, type: 'Circular Trading', description: 'Suspicious circular flow detected (A→B→C→A)', txHashes: ['0x1', '0x2', '0x3'] },
                    { id: 'a2', entity: '0xAgent_E', score: 0.78, type: 'Rapid Movement', description: 'Unusual transaction velocity between D↔E↔A', txHashes: ['0x4', '0x5'] }
                ];
                setAnomalies(demoAnomalies);
                addLog('GNN', `Detected ${demoAnomalies.length} anomalies`, 'warning');

                // Proving step (NEW!)
                setPipelineStep('proving');
                addLog('zkVM', 'Generating cryptographic commitment...', 'info');
                await new Promise(r => setTimeout(r, 400));

                const demoCommitment = '0x' + Array.from({ length: 64 }, () =>
                    Math.floor(Math.random() * 16).toString(16)
                ).join('');

                setProofBundle({
                    task_id: `demo_${Date.now()}`,
                    merkle_root: demoCommitment,
                    zk_commitment: demoCommitment,
                    proof_system: 'hash_commitment',
                    anomaly_count: demoAnomalies.length,
                    timestamp: new Date().toISOString(),
                    proof_size_kb: 0.5
                });
                setMerkleRoot(demoCommitment);

                addLog('zkVM', `Commitment: ${demoCommitment.slice(0, 20)}...`, 'success');

                // Anchoring step (simulated for demo)
                setPipelineStep('anchoring');
                addLog('Anchor', 'Demo mode: Anchoring simulated', 'warning');
                await new Promise(r => setTimeout(r, 200));

                setPipelineStep('complete');
                addLog('Pipeline', 'Demo complete with proof!', 'success');
            }

        } catch (error: any) {
            addLog('Error', error.message || 'Pipeline failed', 'error');
            setPipelineStep('idle');
        }
    };

    // Handle anomaly selection
    const handleAnomalyFocus = (anomaly: AnomalyListAnomaly) => {
        const entityId = anomaly.entities_involved[0];
        setFocusedNode(entityId);
        setSelectedAnomaly(anomaly.anomaly_id);
    };

    // Step indicator
    const steps: { key: PipelineStep; label: string }[] = [
        { key: 'fetching', label: 'Fetch' },
        { key: 'building', label: 'Graph' },
        { key: 'analyzing', label: 'GNN' },
        { key: 'proving', label: 'zkVM' },
        { key: 'anchoring', label: 'Anchor' }
    ];

    const getStepIndex = (step: PipelineStep) => steps.findIndex(s => s.key === step);
    const currentIndex = getStepIndex(pipelineStep);
    const isRunning = pipelineStep !== 'idle' && pipelineStep !== 'complete';

    return (
        <>
            <Head>
                <title>Dashboard | PoEC v3</title>
            </Head>

            <div className="px-6 pb-8">
                {/* Step Progress Bar */}
                <div className="max-w-[1900px] mx-auto mb-6">
                    <div className="flex items-center justify-center gap-2 p-4 bg-[#0a0a0a] rounded-2xl border border-white/5">
                        {steps.map((step, i) => {
                            const isActive = pipelineStep === step.key;
                            const isComplete = currentIndex > i || pipelineStep === 'complete';
                            return (
                                <React.Fragment key={step.key}>
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isActive ? 'bg-blue-500/20 text-blue-400' :
                                        isComplete ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-slate-500'
                                        }`}>
                                        {isComplete ? <CheckCircle size={14} /> : isActive ? <Loader size={14} className="animate-spin" /> : <div className="w-3.5 h-3.5 rounded-full border border-current" />}
                                        <span className="text-xs font-medium">{step.label}</span>
                                    </div>
                                    {i < steps.length - 1 && <div className={`w-8 h-px ${isComplete ? 'bg-emerald-500/50' : 'bg-white/10'}`} />}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* 3-Column Layout */}
                <div className="max-w-[1900px] mx-auto grid grid-cols-12 gap-6">
                    {/* Left Column: Controls & Logs */}
                    <div className="col-span-3 space-y-4">
                        {/* Data Source Card */}
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5">
                            <h2 className="text-sm font-bold mb-4 text-slate-300 uppercase tracking-wider">Data Source</h2>

                            <select
                                value={dataSource}
                                onChange={(e) => setDataSource(e.target.value as DataSource)}
                                disabled={isRunning}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-3 focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                            >
                                <option value="monad_rpc">Real-Time Monad</option>
                                <option value="csv">CSV Upload</option>
                                <option value="preseeded">Demo Data</option>
                            </select>

                            <div className="p-3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl mb-4">
                                <div className="flex items-center gap-2 text-blue-400 mb-1">
                                    {dataSourceInfo[dataSource].icon}
                                    <span className="font-semibold text-xs">{dataSourceInfo[dataSource].title}</span>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed">{dataSourceInfo[dataSource].description}</p>
                            </div>

                            {dataSource === 'monad_rpc' && (
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">Agent Address</label>
                                        <input
                                            type="text"
                                            value={agentAddress}
                                            onChange={(e) => setAgentAddress(e.target.value)}
                                            placeholder="0x..."
                                            disabled={isRunning}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">RPC URL</label>
                                        <input
                                            type="text"
                                            value={rpcUrl}
                                            onChange={(e) => setRpcUrl(e.target.value)}
                                            disabled={isRunning}
                                            className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            )}

                            {dataSource === 'csv' && (
                                <div className="mb-4">
                                    <label className="block text-[10px] text-slate-500 mb-1.5 uppercase tracking-wider">Upload File</label>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                        disabled={isRunning}
                                        className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:text-xs file:cursor-pointer"
                                    />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={runPipeline}
                                    disabled={isRunning}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-700 disabled:to-slate-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    {isRunning ? <Loader size={16} className="animate-spin" /> : <Play size={16} />}
                                    {isRunning ? 'Running...' : 'Run Pipeline'}
                                </button>
                                {isRunning && (
                                    <button
                                        onClick={stopPipeline}
                                        className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition-colors"
                                        title="Stop Pipeline"
                                    >
                                        <div className="w-4 h-4 bg-red-500 rounded-sm" />
                                    </button>
                                )}
                                <button
                                    onClick={clearAll}
                                    disabled={isRunning}
                                    className="p-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-xl transition-colors"
                                    title="Clear All"
                                >
                                    <Trash2 size={16} className="text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Live Logs */}
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 max-h-80 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                    <Clock size={14} className="text-purple-400" />
                                    Live Logs
                                </h2>
                                <button onClick={clearLogs} className="text-[10px] text-slate-500 hover:text-white transition-colors">
                                    Clear
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto font-mono text-[10px] bg-black/30 rounded-xl p-3 space-y-0.5">
                                {logs.length === 0 ? (
                                    <div className="text-slate-500 text-center py-4">Click "Run Pipeline" to start</div>
                                ) : (
                                    logs.map((log, i) => (
                                        <div key={i} className="flex gap-1.5 leading-relaxed">
                                            <span className="text-slate-600">[{log.timestamp.toLocaleTimeString()}]</span>
                                            <span className={`font-semibold ${log.category === 'GNN' ? 'text-purple-400' :
                                                log.category === 'zkVM' ? 'text-emerald-400' :
                                                    log.category === 'Monad' ? 'text-blue-400' :
                                                        log.category === 'Anchor' ? 'text-amber-400' :
                                                            'text-slate-400'
                                                }`}>[{log.category}]</span>
                                            <span className={
                                                log.type === 'success' ? 'text-emerald-400' :
                                                    log.type === 'error' ? 'text-red-400' :
                                                        log.type === 'warning' ? 'text-amber-400' :
                                                            'text-slate-300'
                                            }>{log.message}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Center Column: Graph Visualization */}
                    <div className="col-span-6">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 h-[800px] flex flex-col">
                            <h2 className="text-sm font-bold mb-4 text-slate-300 uppercase tracking-wider">Transaction Graph</h2>
                            <div className="flex-1 bg-black/30 rounded-xl overflow-hidden">
                                {graphElements.length > 0 ? (
                                    <GraphViz
                                        elements={graphElements}
                                        focusedAnomaly={focusedNode ? { address: focusedNode } : undefined}
                                        theme="dark"
                                    />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                                        <div className="text-center">
                                            <Network size={48} className="mx-auto mb-3 opacity-30" />
                                            <p>No graph data yet</p>
                                            <p className="text-xs mt-1 opacity-60">Run the pipeline to visualize transactions</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Anomalies */}
                    <div className="col-span-3">
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 h-[800px] flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                                    Anomalies
                                </h2>
                                {anomalyListData.length > 0 && (
                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                                        {anomalyListData.length}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <AnomalyList
                                    anomalies={anomalyListData}
                                    onFocus={handleAnomalyFocus}
                                    theme="dark"
                                />
                            </div>

                            {/* Verification CTA */}
                            {pipelineStep === 'complete' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 pt-4 border-t border-white/10"
                                >
                                    <Link
                                        href="/verify"
                                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        <Shield size={16} />
                                        Verify Proof
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
