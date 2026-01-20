import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import {
    Upload, Play, AlertTriangle, CheckCircle, Clock, Shield, Search,
    Menu, Sun, Moon, ArrowLeft, MoreHorizontal, User, Layers, Filter,
    Link as LinkIcon, Lock, Check, FileJson, Table, Settings as SettingsIcon,
    ChevronDown, ChevronUp, Download, Eye, X, HelpCircle
} from 'lucide-react';
import AnomalyList from '../components/AnomalyList';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

// Dynamically import GraphViz
const GraphViz = dynamic(() => import('../components/GraphViz'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center text-slate-400 animate-pulse font-mono text-xs">INITIALIZING KERNEL...</div>
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

import { useBackend } from '../components/BackendContext';


export default function Dashboard() {
    // --- Global Context ---
    const { status: serverStatus } = useBackend();

    // --- Core State ---
    const [activeTab, setActiveTab] = useState<'analysis' | 'forensics'>('analysis');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    // --- Context State ---
    const [contexts, setContexts] = useState<any>({});
    const [activeContext, setActiveContext] = useState("global");

    // --- Data State ---
    const [file, setFile] = useState<File | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [ingestStatus, setIngestStatus] = useState<string | null>(null);
    const [anomalies, setAnomalies] = useState<any[]>([]);
    const [graphData, setGraphData] = useState<any>(null);
    const [snapshot, setSnapshot] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]); // For Forensics
    const [logs, setLogs] = useState<string[]>([]);

    // --- Interaction State ---
    const [selectedAnomaly, setSelectedAnomaly] = useState<any | null>(null);
    const [focusedAnomaly, setFocusedAnomaly] = useState<any | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(true);

    // --- Settings State ---
    const [minConfidence, setMinConfidence] = useState<'All' | 'High' | 'Medium'>('All');
    const [autoAnchor, setAutoAnchor] = useState(false);

    // --- Anchor State ---
    const [anchoring, setAnchoring] = useState(false);
    const [anchorData, setAnchorData] = useState<any | null>(null);
    const [verifyStatus, setVerifyStatus] = useState<any | null>(null);

    // --- Forensics State ---
    const [searchTerm, setSearchTerm] = useState("");

    const [web3Status, setWeb3Status] = useState<any>(null);
    const [isWeb3Open, setIsWeb3Open] = useState(false);


    useEffect(() => {
        if (serverStatus === 'online') {
            fetch(`${API_URL}/api/v1/anchor/status`)
                .then(res => res.json())
                .then(data => setWeb3Status(data))
                .catch(err => console.error("Failed to load blockchain status", err));
        }
    }, [serverStatus]);

    useEffect(() => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    // Fetch Contexts on Load
    useEffect(() => {
        fetch(`${API_URL}/api/v1/context`)
            .then(res => res.json())
            .then(data => {
                setContexts(data.available);
                setActiveContext(data.active.context_id);
            })
            .catch(err => console.error("Failed to load contexts", err));
    }, []);

    const switchContext = async (id: string) => {
        try {
            await fetch(`${API_URL}/api/v1/context?context_id=${id}`, { method: 'POST' });
            setActiveContext(id);
            addLog(`Economic Context switched to: ${contexts[id]}`);

            // Re-run analysis if we have data
            if (file) {
                setTimeout(() => runAnalysis(), 500);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const validateCsvFormat = (file: File): Promise<{ valid: boolean, error?: string }> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            // Read first 5KB to ensure we get the full header line even if it's long
            reader.readAsText(file.slice(0, 5120));
            reader.onload = (e) => {
                const text = e.target?.result as string;
                if (!text) return resolve({ valid: false, error: "Empty file" });

                const lines = text.split('\n');
                if (lines.length < 1) return resolve({ valid: false, error: "Empty CSV" });

                // Simple comma split (robust enough for headers usually)
                let headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));

                // Normalization Map (Must match Backend ingest.py)
                const map: any = {
                    "entity_id": "source_entity", "counterparty_id": "target_entity",
                    "sender": "source_entity", "receiver": "target_entity",
                    "source": "source_entity", "target": "target_entity",
                    "value": "amount",
                    "date": "timestamp", "time": "timestamp", "datetime": "timestamp", "txn_date": "timestamp"
                };

                // Apply mapping
                headers = headers.map(h => map[h] || h);

                const required = ["source_entity", "target_entity", "amount", "timestamp"];
                const missing = required.filter(r => !headers.includes(r));

                if (missing.length > 0) {
                    return resolve({ valid: false, error: `Missing required columns: ${missing.join(', ')}.\nfound: ${headers.join(', ')}` });
                }

                return resolve({ valid: true });
            };
            reader.onerror = () => resolve({ valid: false, error: "Failed to read file" });
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];

            // 1. Client-Side Validation
            addLog(`Validating structure: ${f.name}...`);
            const validation = await validateCsvFormat(f);

            if (!validation.valid) {
                addLog(`❌ REJECTED: ${validation.error}`);
                alert(`CSV Format Error:\n${validation.error}\n\nPlease check the help guide.`);
                e.target.value = ""; // Reset input
                setFile(null);
                return;
            }

            setFile(f);
            addLog(`✅ Verified: ${f.name}`);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await fetch(`${API_URL}/api/v1/transactions?limit=1000`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (e) {
            console.error("Failed to fetch transactions", e);
        }
    }

    const runAnalysis = async () => {
        if (!file) return;
        setAnalyzing(true);
        setAnomalies([]);
        setGraphData(null);
        setLogs([]);
        setAnchorData(null);
        setVerifyStatus(null);
        setTransactions([]);

        addLog("Initializing Neural Pipeline...");

        try {
            // 1. Ingest
            const formData = new FormData();
            formData.append("file", file);
            addLog("Ingesting structured data...");
            const ingestRes = await fetch(`${API_URL}/api/v1/ingest`, { method: "POST", body: formData });
            if (!ingestRes.ok) {
                const errData = await ingestRes.json().catch(() => ({ detail: "Unknown server error" }));
                throw new Error(`Ingest Failed: ${errData.detail}`);
            }
            const ingestJson = await ingestRes.json();
            setIngestStatus(ingestJson.batch_id);
            addLog("Data vectorized. Generating topology...");

            // 2. Analyze
            addLog("Executing GNN Inference (PoEC v1.0)...");
            const analyzeRes = await fetch(`${API_URL}/api/v1/analyze`, { method: "POST" });
            if (!analyzeRes.ok) throw new Error("Analysis failed");
            const analyzeJson = await analyzeRes.json();

            setAnomalies(analyzeJson.anomalies);
            setGraphData(analyzeJson.graph_data);
            setSnapshot(analyzeJson.snapshot);
            setAnchorData({
                data_hash: analyzeJson.snapshot.data_hash,
                model_hash: analyzeJson.model_hash,
                result_hash: analyzeJson.results_hash
            });

            addLog("Acquiring forensic ledger...");
            await fetchTransactions();

            addLog(`Cycle complete. ${analyzeJson.anomalies.length} anomalies detected.`);

            if (autoAnchor) {
                setTimeout(() => handleAnchor(analyzeJson), 1000);
            }

        } catch (err: any) {
            addLog(`CRITICAL: ${err.message}`);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAnchor = async (data = anchorData) => {
        if (!data) return;
        setAnchoring(true);
        addLog("Syncing with Ethereum Mainnet...");
        try {
            const res = await fetch(`${API_URL}/api/v1/anchor`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.detail);

            if (json.status === "already_anchored") {
                addLog("Hash collision: Evidence already on-chain.");
            } else {
                addLog(`Anchored: Block ${json.block_number}`);
            }
            handleVerify();
        } catch (err: any) {
            addLog(`Anchor Failed: ${err.message}`);
        } finally {
            setAnchoring(false);
        }
    };

    const handleVerify = async () => {
        if (!anchorData?.result_hash) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/verify/${anchorData.result_hash}`);
            const json = await res.json();
            setVerifyStatus(json);
        } catch (err) { }
    };

    // Filter Anomalies based on Settings
    const filteredAnomalies = useMemo(() => {
        if (minConfidence === 'All') return anomalies;
        return anomalies.filter(a => a.confidence === minConfidence || a.confidence === 'High');
    }, [anomalies, minConfidence]);

    // Filter Transactions for Forensics
    const filteredTransactions = useMemo(() => {
        if (!searchTerm) return transactions;
        const lower = searchTerm.toLowerCase();
        return transactions.filter(t =>
            t.source.toLowerCase().includes(lower) ||
            t.target.toLowerCase().includes(lower) ||
            t.transaction_id.toLowerCase().includes(lower)
        );
    }, [transactions, searchTerm]);

    // --- RENDER HELPERS ---
    return (
        <div className={`h-screen flex flex-col font-sans overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-800'}`}>
            <Head>
                <title>PoEC | Neural Forensics</title>
            </Head>

            {/* --- PREMIUM HEADER --- */}
            <div className="absolute top-6 left-6 right-6 h-16 z-50 pointer-events-none flex justify-center">
                <header className={`pointer-events-auto h-full px-6 flex items-center justify-between gap-12 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${isDarkMode ? 'bg-[#111]/80 border-white/10 shadow-black/50' : 'bg-white/80 border-slate-200 shadow-slate-200'} max-w-7xl w-full`}>

                    {/* Brand */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg ${isDarkMode ? 'bg-blue-600' : 'bg-blue-600'} text-white shadow-lg shadow-blue-500/30`}>
                                P
                            </div>
                            <div className="absolute inset-0 bg-blue-400 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                        </div>
                        <div className="flex flex-col">
                            <span className={`font-bold tracking-tight text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>PoEC Console</span>
                            <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">v1.1.0 • Enterprise</span>
                        </div>
                    </Link>

                    {/* Navigation Tabs */}
                    <nav className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-black/50 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                        <button
                            onClick={() => setActiveTab('analysis')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2
                                ${activeTab === 'analysis'
                                    ? (isDarkMode ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                                    : 'text-slate-500 hover:text-slate-400'}`}
                        >
                            <Layers size={12} /> Analysis
                        </button>
                        <button
                            onClick={() => setActiveTab('forensics')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2
                                ${activeTab === 'forensics'
                                    ? (isDarkMode ? 'bg-white/10 text-white shadow-sm' : 'bg-white text-slate-900 shadow-sm')
                                    : 'text-slate-500 hover:text-slate-400'}`}
                        >
                            <Table size={12} /> Forensics
                            {transactions.length > 0 && <span className="text-[9px] opacity-50 bg-current px-1 rounded-full text-black">{transactions.length}</span>}
                        </button>
                        <Link href="/verify" className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 text-slate-500 hover:text-slate-400`}>
                            <Shield size={12} /> Verify
                        </Link>
                        <Link href="/agent_sim" className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 text-slate-500 hover:text-slate-400`}>
                            <User size={12} /> Agent Sim
                        </Link>
                    </nav>

                    {/* Action Area */}
                    <div className="flex items-center gap-4">
                        {/* Web3 Status */}
                        <button
                            onClick={() => setIsWeb3Open(true)}
                            className={`
                        flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-wider
                        ${web3Status?.status === 'connected'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                    : 'bg-slate-800 border-white/10 text-slate-400 hover:bg-slate-700'}
                    `}
                        >
                            {web3Status?.status === 'connected' ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                    {web3Status.network || 'Unknown'}
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    No Wallet
                                </>
                            )}
                        </button>

                        <div className={`h-6 w-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />

                        <button onClick={() => setIsSettingsOpen(true)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
                            <SettingsIcon size={16} />
                        </button>

                        {/* Context Badge (Click to open settings) */}
                        <button onClick={() => setIsSettingsOpen(true)} className={`hidden md:flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${isDarkMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                            {contexts[activeContext] || activeContext}
                        </button>

                        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-yellow-400' : 'hover:bg-slate-100 text-slate-600'}`}>
                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 ring-2 ring-white/10 flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:ring-white/30 transition-all">
                            AD
                        </div>
                    </div>
                </header>
            </div>

            {/* --- MAIN CONTENT SWITCHER --- */}
            <main className="flex-1 flex overflow-hidden pt-24 pb-6 px-6 gap-6">

                {/* 1. ANALYSIS VIEW */}
                {activeTab === 'analysis' && (
                    <>
                        {/* LEFT: Operations & Logs */}
                        <div className={`w-72 flex flex-col gap-4 rounded-2xl p-1 transition-all`}>
                            {/* Ingest Card */}
                            <div className={`relative overflow-hidden group p-5 rounded-2xl border transition-all ${isDarkMode ? 'bg-[#111] border-white/10 hover:border-white/20' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-50" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center justify-between">
                                    Data Source
                                    <button onClick={() => setIsHelpOpen(true)} className="text-slate-400 hover:text-blue-500 transition-colors" title="CSV Format Guide">
                                        <HelpCircle size={14} />
                                    </button>
                                </h3>

                                <label className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed transition-all cursor-pointer mb-4
                                    ${file
                                        ? (isDarkMode ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-emerald-500 bg-emerald-50')
                                        : (isDarkMode ? 'border-white/10 hover:border-blue-500/50 hover:bg-white/5' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50')
                                    }`}>
                                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                                    {file ? <CheckCircle className="text-emerald-500" size={20} /> : <Upload className="text-slate-400" size={20} />}
                                    <span className="text-xs font-medium mt-2 max-w-[150px] truncate">{file ? file.name : "Upload CSV"}</span>
                                </label>

                                <button
                                    onClick={runAnalysis}
                                    disabled={!file || analyzing}
                                    className={`w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all
                                        ${!file || analyzing
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20'
                                        }`}
                                >
                                    {analyzing ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={12} fill="currentColor" />}
                                    Run Engine
                                </button>
                            </div>

                            {/* Console Log */}
                            <div className={`flex-1 rounded-2xl border p-4 font-mono text-[10px] overflow-auto custom-scrollbar flex flex-col ${isDarkMode ? 'bg-black border-white/10 text-slate-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/5">
                                    <span className="font-bold text-slate-500">SYSTEM LOG</span>
                                    <span className="text-emerald-500 animate-pulse">●</span>
                                </div>
                                <div className="space-y-1">
                                    {logs.length === 0 && <span className="opacity-20 italic"> Ready...</span>}
                                    {logs.map((l, i) => <div key={i} className="opacity-80">{l}</div>)}
                                </div>
                            </div>

                            {/* blockchain Status (Mini) */}
                            {anchorData && (
                                <div className={`p-4 rounded-xl border flex flex-col gap-3 ${verifyStatus?.verified ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/10 bg-[#111]'}`}>
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
                                            <LinkIcon size={10} /> Chain of Custody
                                        </h4>
                                        {verifyStatus?.verified && <Lock size={10} className="text-emerald-500" />}
                                    </div>

                                    {/* Hash Triplet Visualization */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[9px] font-mono">
                                            <span className="text-slate-500">Data Hash</span>
                                            <span className="text-slate-400" title={anchorData.data_hash}>{anchorData.data_hash.substring(0, 8)}...</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-mono">
                                            <span className="text-slate-500">Model Ver</span>
                                            <span className="text-slate-400" title={anchorData.model_hash}>{anchorData.model_hash.substring(0, 8)}...</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-mono relative">
                                            <div className="absolute -left-2 top-0 bottom-0 w-0.5 bg-slate-700 rounded-full"></div>
                                            <span className="text-slate-300 font-bold ml-1">Result Root</span>
                                            <span className="text-blue-400 font-bold" title={anchorData.result_hash}>{anchorData.result_hash.substring(0, 8)}...</span>
                                        </div>
                                    </div>

                                    {!verifyStatus?.verified ? (
                                        <button onClick={() => handleAnchor()} disabled={anchoring} className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg text-[10px] font-bold text-white transition-all shadow-lg shadow-blue-900/20">
                                            {anchoring ? 'Anchoring...' : 'Anchor Proof to Sepolia'}
                                        </button>
                                    ) : (
                                        <div className="text-[9px] text-center text-emerald-500/70 font-mono mt-1">
                                            <a href={`https://sepolia.etherscan.io/tx/${verifyStatus.on_chain_hash}`} target="_blank" rel="noreferrer" className="underline hover:text-emerald-400">
                                                Verified • Block {verifyStatus?.timestamp || "Latest"}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* CENTER: Graph */}
                        <div className={`flex-1 rounded-3xl border overflow-hidden relative shadow-2xl ${isDarkMode ? 'bg-[#09090b] border-white/10' : 'bg-white border-slate-200'}`}>
                            {graphData ? (
                                <GraphViz
                                    key={isDarkMode ? 'dark' : 'light'}
                                    elements={graphData.elements}
                                    focusedAnomaly={focusedAnomaly}
                                    theme={isDarkMode ? 'dark' : 'light'}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
                                    <div className="w-64 h-64 border border-dashed rounded-full flex items-center justify-center animate-[spin_60s_linear_infinite]">
                                        <div className="w-48 h-48 border border-dashed rounded-full flex items-center justify-center animate-[spin_40s_linear_infinite_reverse]">
                                            <div className="w-32 h-32 border border-dashed rounded-full" />
                                        </div>
                                    </div>
                                    <p className="mt-8 font-mono text-xs tracking-widest">AWAITING INPUT DATA</p>
                                </div>
                            )}

                            {/* Overlay Controls */}
                            <div className="absolute top-6 left-6 flex gap-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md ${isDarkMode ? 'bg-black/50 border-white/10' : 'bg-white/80 border-slate-200'}`}>
                                    Topology View
                                </span>
                            </div>
                        </div>

                        {/* RIGHT: Anomaly List */}
                        <div className={`w-80 flex flex-col rounded-2xl border overflow-hidden transition-all ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'}`}>
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Detected Anomalies</h2>
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">{filteredAnomalies.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                <AnomalyList
                                    anomalies={filteredAnomalies}
                                    onSelect={setSelectedAnomaly}
                                    onFocus={setFocusedAnomaly}
                                    theme={isDarkMode ? 'dark' : 'light'}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* 2. FORENSICS VIEW (Full Width) */}
                {activeTab === 'forensics' && (
                    <div className={`flex-1 rounded-3xl border overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#111] border-white/10' : 'bg-white border-slate-200'}`}>
                        {/* Toolbar */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h2 className="text-sm font-bold flex items-center gap-2">
                                <Table size={16} className="text-blue-500" /> Raw Transaction Ledger
                            </h2>
                            <div className="flex gap-2">
                                <div className={`flex items-center px-3 py-1.5 rounded-lg border ${isDarkMode ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                    <Search size={14} className="text-slate-500 mr-2" />
                                    <input
                                        type="text"
                                        placeholder="Search TX ID or Entity..."
                                        className="bg-transparent border-none outline-none text-xs w-48"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5">
                                    <Download size={16} className="text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Data Grid */}
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-[#18181b]' : 'bg-slate-50'}`}>
                                    <tr>
                                        <th className="p-3 font-semibold text-slate-500 border-b border-white/5">Transaction ID</th>
                                        <th className="p-3 font-semibold text-slate-500 border-b border-white/5">Timestamp</th>
                                        <th className="p-3 font-semibold text-slate-500 border-b border-white/5">Source</th>
                                        <th className="p-3 font-semibold text-slate-500 border-b border-white/5">Target</th>
                                        <th className="p-3 font-semibold text-slate-500 border-b border-white/5 text-right">Amount</th>
                                        <th className="p-3 font-semibold text-slate-500 border-b border-white/5">Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.slice(0, 100).map((tx, i) => (
                                        <tr key={i} className={`border-b border-white/5 transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                            <td className="p-3 font-mono opacity-70">{tx.transaction_id.substring(0, 12)}...</td>
                                            <td className="p-3 text-slate-400">{new Date(tx.timestamp).toLocaleString()}</td>
                                            <td className="p-3 font-mono">{tx.source}</td>
                                            <td className="p-3 font-mono">{tx.target}</td>
                                            <td className="p-3 text-right font-mono text-emerald-500 font-bold">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount)}
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${tx.type === 'TRANSFER' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-slate-500 italic">No transactions found matching verification criteria.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* --- WEB3 STATUS MODAL --- */}
            <AnimatePresence>
                {isWeb3Open && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" onClick={() => setIsWeb3Open(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                            className={`fixed top-1/2 left-1/2 w-[500px] rounded-2xl shadow-2xl z-[70] p-6 border ${isDarkMode ? 'bg-[#18181b] border-white/10' : 'bg-white border-slate-200'}`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-sm font-bold flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                    PoEC Chain Node Status
                                </h2>
                                <button onClick={() => setIsWeb3Open(false)}><X size={20} className="text-slate-500" /></button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-black/30 border border-white/5 font-mono text-xs space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Network</span>
                                        <span className="text-emerald-400 font-bold">{web3Status?.network || 'Connecting...'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Status</span>
                                        <span className="text-emerald-500">{web3Status?.status?.toUpperCase()}</span>
                                    </div>
                                    <div className="h-px bg-white/5 my-2"></div>
                                    <div>
                                        <div className="text-slate-500 mb-1">Node Wallet (Anchor Authority)</div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-300 bg-white/5 p-2 rounded break-all">
                                            {web3Status?.wallet_address || 'Loading...'}
                                            <a href={`https://sepolia.etherscan.io/address/${web3Status?.wallet_address}`} target="_blank" rel="noreferrer" className="ml-auto text-blue-500 hover:text-blue-400">
                                                <LinkIcon size={12} />
                                            </a>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 mb-1">Anchor Contract</div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-300 bg-white/5 p-2 rounded break-all">
                                            {web3Status?.contract_address || 'Loading...'}
                                            <a href={`https://sepolia.etherscan.io/address/${web3Status?.contract_address}`} target="_blank" rel="noreferrer" className="ml-auto text-blue-500 hover:text-blue-400">
                                                <LinkIcon size={12} />
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-[10px] text-slate-500 bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
                                    <strong className="text-blue-400 block mb-1">Architecture Note:</strong>
                                    PoEC uses a server-managed "Anchor Authority" wallet to commit proof-hashes to Ethereum. This ensures zero gas fees for end-users while maintaining immutable audit trails.
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- SETTINGS MODAL --- */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
                            className={`fixed top-1/2 left-1/2 w-96 rounded-2xl shadow-2xl z-[70] p-6 border ${isDarkMode ? 'bg-[#18181b] border-white/10' : 'bg-white border-slate-200'}`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold">Console Settings</h2>
                                <button onClick={() => setIsSettingsOpen(false)}><X size={20} className="text-slate-500" /></button>
                            </div>

                            <div className="space-y-6">
                                {/* Economic Context Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500">Economic Context Model</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(contexts).map(([id, name]: any) => (
                                            <button
                                                key={id}
                                                onClick={() => switchContext(id)}
                                                className={`py-2 px-3 rounded-lg text-xs font-bold text-left transition-all border ${activeContext === id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 border-white/5 text-slate-400 hover:border-white/20'}`}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed mt-2 bg-white/5 p-2 rounded border border-white/5">
                                        <AlertTriangle size={10} className="inline mr-1 text-amber-500" />
                                        PoEC does not encode tax law or compliance logic. Economic Context adjusts statistical expectations. GST/VAT data is used only to contextualize structural anomalies detected independently.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-slate-500">Anomaly Threshold</label>
                                    <div className="flex gap-2">
                                        {['All', 'Medium', 'High'].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setMinConfidence(opt as any)}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${minConfidence === opt ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">Auto-Anchoring</span>
                                        <span className="text-xs text-slate-500">Automatically anchor all results to Sepolia</span>
                                    </div>
                                    <button
                                        onClick={() => setAutoAnchor(!autoAnchor)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${autoAnchor ? 'bg-blue-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoAnchor ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>

                                <div className="pt-4 border-t border-white/5 text-center text-xs text-slate-500">
                                    PoEC Node ID: <span className="font-mono text-slate-300">
                                        {web3Status?.wallet_address
                                            ? `${web3Status.wallet_address.substring(0, 6)}...${web3Status.wallet_address.substring(38)}`
                                            : "Locating..."}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- ANOMALY DETAILS MODAL (Reused/Refined) --- */}
            <AnimatePresence>
                {selectedAnomaly && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setSelectedAnomaly(null)}>
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border p-8 relative ${isDarkMode ? 'bg-[#09090b] border-white/10 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button onClick={() => setSelectedAnomaly(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>

                            {/* Header */}
                            <div className="flex items-start gap-6 mb-8">
                                <div className={`p-5 rounded-2xl ${selectedAnomaly.confidence === "High" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"}`}>
                                    <AlertTriangle size={36} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedAnomaly.confidence === "High" ? "bg-red-500 text-white" : "bg-amber-500 text-black"}`}>
                                            {selectedAnomaly.confidence} CONFIDENCE
                                        </span>
                                        <span className="text-xs font-mono text-slate-500">ID: {selectedAnomaly.anomaly_id.substring(0, 18)}</span>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-2">{selectedAnomaly.type || selectedAnomaly.anomaly_type.replace(/_/g, ' ')}</h2>
                                    <p className="text-slate-400 text-sm">Detected via {selectedAnomaly.detection_method} • {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Explanation */}
                            <div className="prose prose-invert max-w-none mb-8">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5 mb-6">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Executive Summary</h3>
                                    <p className="text-lg leading-relaxed text-slate-200 m-0">
                                        {selectedAnomaly.description}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {selectedAnomaly.explanation_metadata?.factors?.map((f: any, i: number) => (
                                        <div key={i} className="flex flex-col p-4 rounded-xl border border-white/5 bg-black/20">
                                            <span className="text-xs text-slate-500 mb-1">{f.name}</span>
                                            <span className="font-mono text-lg font-bold text-blue-400">{f.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* --- CSV HELP MODAL --- */}
            <AnimatePresence>
                {isHelpOpen && (
                    <>
                        {/* No Backdrop - Non-blocking Side Panel */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 50 }}
                            className={`fixed top-24 right-6 w-[400px] max-h-[calc(100vh-120px)] rounded-2xl shadow-2xl z-[60] flex flex-col border backdrop-blur-md ${isDarkMode ? 'bg-[#18181b]/95 border-white/10' : 'bg-white/95 border-slate-200'}`}
                        >
                            <div className="flex justify-between items-center p-5 border-b border-white/5">
                                <h2 className="text-sm font-bold flex items-center gap-2">
                                    <FileJson className="text-emerald-500" size={18} /> CSV Schema Guide
                                </h2>
                                <button onClick={() => setIsHelpOpen(false)} className="p-1 hover:bg-white/10 rounded-md transition-colors"><X size={18} className="text-slate-500" /></button>
                            </div>


                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

                                {/* 1. Base Format */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-bold uppercase text-slate-500">1. Required Base Format</h3>
                                        <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded font-mono">Global</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mb-2">Every CSV must contain these core structural columns.</p>
                                    <div className={`p-3 rounded-lg border font-mono text-[10px] overflow-x-auto whitespace-pre ${isDarkMode ? 'bg-black/30 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                        <div className="select-all">
                                            <span className="text-blue-400">source_entity</span>, <span className="text-blue-400">target_entity</span>, <span className="text-blue-400">amount</span>, <span className="text-blue-400">timestamp</span><br />
                                            user_01, user_02, 5000.00, 2024-01-01<br />
                                            user_02, user_03, 1200.50, 2024-01-02
                                        </div>
                                    </div>
                                </div>

                                {/* 2. India Context */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-bold uppercase text-slate-500">2. India (GST Overlay)</h3>
                                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-mono">Optional</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mb-2">Add <code className="bg-white/10 px-1 rounded">input_tax_credit</code> to enable ITC flow analysis.</p>
                                    <div className={`p-3 rounded-lg border font-mono text-[10px] overflow-x-auto whitespace-pre ${isDarkMode ? 'bg-black/30 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                        <div className="select-all">
                                            source, target, amount, timestamp, <span className="text-emerald-400">tax_type</span>, <span className="text-emerald-400">input_tax_credit</span><br />
                                            IN_01, IN_02, 10000, 2024-01-01, <span className="text-emerald-400">GST</span>, <span className="text-emerald-400">1800.00</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. EU Context */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-bold uppercase text-slate-500">3. EU (VAT Overlay)</h3>
                                        <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded font-mono">Optional</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mb-2">Add <code className="bg-white/10 px-1 rounded">tax_rate</code> to detect VAT carousel asymmetry.</p>
                                    <div className={`p-3 rounded-lg border font-mono text-[10px] overflow-x-auto whitespace-pre ${isDarkMode ? 'bg-black/30 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                        <div className="select-all">
                                            source, target, amount, timestamp, <span className="text-indigo-400">tax_type</span>, <span className="text-indigo-400">tax_rate</span><br />
                                            DE_01, FR_01, 5000, 2024-01-01, <span className="text-indigo-400">VAT</span>, <span className="text-indigo-400">0.0</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg flex gap-3 items-start">
                                    <AlertTriangle className="text-amber-500 flex-shrink-0" size={14} />
                                    <p className="text-[10px] text-amber-500/80 leading-relaxed">
                                        Files missing core columns will be strictly rejected. Tax columns are purely optional for context.
                                    </p>
                                </div>
                            </div>

                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div >
    )
}
