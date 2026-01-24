import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface LogEntry {
    timestamp: Date;
    category: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

export interface Anomaly {
    id: string;
    entity: string;
    score: number;
    type: string;
    description: string;
    txHashes: string[];
}

export interface GraphNode {
    id: string;
    label: string;
    balance?: number;
    txCount?: number;
    isAnomaly?: boolean;
    anomalyScore?: number;
}

export interface GraphEdge {
    source: string;
    target: string;
    amount: number;
    hash: string;
    timestamp: string;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
    centerAddress?: string;
}

export interface ProofBundle {
    task_id: string;
    merkle_root: string;
    zk_commitment: string;
    proof_system: 'risc0' | 'hash_commitment';
    anomaly_count: number;
    timestamp: string;
    proof_size_kb: number;
}

export interface AnalysisState {
    // Data Source
    dataSource: 'monad_rpc' | 'csv' | 'preseeded';
    rpcUrl: string;

    // Input
    file: File | null;

    // Graph Data
    graphData: GraphData | null;

    // Analysis Results
    anomalies: Anomaly[];
    riskScore: number;

    // Hashes
    dataHash: string | null;
    modelHash: string | null;
    resultsHash: string | null;

    // Proofs
    proofBundle: ProofBundle | null;
    merkleRoot: string | null;

    // On-chain
    anchorTx: string | null;
    blockNumber: number | null;

    // Logs
    logs: LogEntry[];

    // UI State
    selectedAnomaly: string | null;
    focusedNode: string | null;
    pipelineStep: 'idle' | 'fetching' | 'building' | 'analyzing' | 'proving' | 'anchoring' | 'complete';
}

interface AnalysisContextType extends AnalysisState {
    // Setters
    setDataSource: (source: AnalysisState['dataSource']) => void;
    setRpcUrl: (url: string) => void;
    setFile: (file: File | null) => void;
    setGraphData: (data: GraphData | null) => void;
    setAnomalies: (anomalies: Anomaly[]) => void;
    setRiskScore: (score: number) => void;
    setHashes: (data: { dataHash: string; modelHash: string; resultsHash: string }) => void;
    setProofBundle: (bundle: ProofBundle | null) => void;
    setMerkleRoot: (root: string | null) => void;
    setAnchorTx: (tx: string | null, blockNumber?: number | null) => void;
    setSelectedAnomaly: (id: string | null) => void;
    setFocusedNode: (id: string | null) => void;
    setPipelineStep: (step: AnalysisState['pipelineStep']) => void;

    // Log management
    addLog: (category: string, message: string, type?: LogEntry['type']) => void;
    clearLogs: () => void;

    // Full state management
    clearAll: () => void;
}

const defaultState: AnalysisState = {
    dataSource: 'monad_rpc',
    rpcUrl: 'https://testnet-rpc.monad.xyz',
    file: null,
    graphData: null,
    anomalies: [],
    riskScore: 0,
    dataHash: null,
    modelHash: null,
    resultsHash: null,
    proofBundle: null,
    merkleRoot: null,
    anchorTx: null,
    blockNumber: null,
    logs: [],
    selectedAnomaly: null,
    focusedNode: null,
    pipelineStep: 'idle',
};

const STORAGE_KEY = 'poec_analysis_state';

// Serialize state for localStorage (exclude File objects)
function serializeState(state: AnalysisState): string {
    const { file, ...rest } = state;
    return JSON.stringify({
        ...rest,
        // Convert Date objects in logs
        logs: rest.logs.map(log => ({
            ...log,
            timestamp: log.timestamp.toISOString(),
        })),
    });
}

// Deserialize state from localStorage
function deserializeState(json: string): Partial<AnalysisState> {
    try {
        const parsed = JSON.parse(json);
        return {
            ...parsed,
            file: null, // Can't persist File objects
            logs: (parsed.logs || []).map((log: any) => ({
                ...log,
                timestamp: new Date(log.timestamp),
            })),
        };
    } catch {
        return {};
    }
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const useAnalysis = () => {
    const context = useContext(AnalysisContext);
    if (!context) {
        throw new Error('useAnalysis must be used within an AnalysisProvider');
    }
    return context;
};

export const AnalysisProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<AnalysisState>(defaultState);
    const [hydrated, setHydrated] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const restored = deserializeState(saved);
            setState(prev => ({ ...prev, ...restored }));
        }
        setHydrated(true);
    }, []);

    // Save to localStorage on state change
    useEffect(() => {
        if (hydrated) {
            localStorage.setItem(STORAGE_KEY, serializeState(state));
        }
    }, [state, hydrated]);

    // Setters
    const setDataSource = (dataSource: AnalysisState['dataSource']) =>
        setState(prev => ({ ...prev, dataSource }));

    const setRpcUrl = (rpcUrl: string) =>
        setState(prev => ({ ...prev, rpcUrl }));

    const setFile = (file: File | null) =>
        setState(prev => ({ ...prev, file }));

    const setGraphData = (graphData: GraphData | null) =>
        setState(prev => ({ ...prev, graphData }));

    const setAnomalies = (anomalies: Anomaly[]) =>
        setState(prev => ({ ...prev, anomalies }));

    const setRiskScore = (riskScore: number) =>
        setState(prev => ({ ...prev, riskScore }));

    const setHashes = (data: { dataHash: string; modelHash: string; resultsHash: string }) =>
        setState(prev => ({ ...prev, ...data }));

    const setProofBundle = (proofBundle: ProofBundle | null) =>
        setState(prev => ({ ...prev, proofBundle }));

    const setMerkleRoot = (merkleRoot: string | null) =>
        setState(prev => ({ ...prev, merkleRoot }));

    const setAnchorTx = (anchorTx: string | null, blockNumber: number | null = null) =>
        setState(prev => ({ ...prev, anchorTx, blockNumber }));

    const setSelectedAnomaly = (selectedAnomaly: string | null) =>
        setState(prev => ({ ...prev, selectedAnomaly }));

    const setFocusedNode = (focusedNode: string | null) =>
        setState(prev => ({ ...prev, focusedNode }));

    const setPipelineStep = (pipelineStep: AnalysisState['pipelineStep']) =>
        setState(prev => ({ ...prev, pipelineStep }));

    // Log management
    const addLog = (category: string, message: string, type: LogEntry['type'] = 'info') => {
        setState(prev => ({
            ...prev,
            logs: [...prev.logs, { timestamp: new Date(), category, message, type }],
        }));
    };

    const clearLogs = () => setState(prev => ({ ...prev, logs: [] }));

    // Full state management
    const clearAll = () => {
        localStorage.removeItem(STORAGE_KEY);
        setState(defaultState);
    };

    return (
        <AnalysisContext.Provider value={{
            ...state,
            setDataSource,
            setRpcUrl,
            setFile,
            setGraphData,
            setAnomalies,
            setRiskScore,
            setHashes,
            setProofBundle,
            setMerkleRoot,
            setAnchorTx,
            setSelectedAnomaly,
            setFocusedNode,
            setPipelineStep,
            addLog,
            clearLogs,
            clearAll,
        }}>
            {children}
        </AnalysisContext.Provider>
    );
};
