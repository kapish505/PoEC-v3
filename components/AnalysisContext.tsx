import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AnalysisState {
    file: File | null;
    anomalies: any[];
    graphData: any;
    snapshot: any;
    logs: string[];
    anchorData: any | null;
    resultsHash: string | null;
    modelHash: string | null;
    dataHash: string | null;
}

interface AnalysisContextType extends AnalysisState {
    setFile: (file: File | null) => void;
    setAnomalies: (anomalies: any[]) => void;
    setGraphData: (data: any) => void;
    setSnapshot: (snapshot: any) => void;
    addLog: (msg: string) => void;
    clearLogs: () => void;
    setAnchorData: (data: any) => void;
    setHashes: (data: { resultsHash: string; modelHash: string; dataHash: string }) => void;
    clearAll: () => void;
}

const defaultState: AnalysisState = {
    file: null,
    anomalies: [],
    graphData: null,
    snapshot: null,
    logs: [],
    anchorData: null,
    resultsHash: null,
    modelHash: null,
    dataHash: null,
};

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

    const setFile = (file: File | null) => setState(prev => ({ ...prev, file }));
    const setAnomalies = (anomalies: any[]) => setState(prev => ({ ...prev, anomalies }));
    const setGraphData = (graphData: any) => setState(prev => ({ ...prev, graphData }));
    const setSnapshot = (snapshot: any) => setState(prev => ({ ...prev, snapshot }));

    const addLog = (msg: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setState(prev => ({ ...prev, logs: [...prev.logs, `[${timestamp}] ${msg}`] }));
    };

    const clearLogs = () => setState(prev => ({ ...prev, logs: [] }));

    const setAnchorData = (anchorData: any) => setState(prev => ({ ...prev, anchorData }));

    const setHashes = (data: { resultsHash: string; modelHash: string; dataHash: string }) => {
        setState(prev => ({
            ...prev,
            resultsHash: data.resultsHash,
            modelHash: data.modelHash,
            dataHash: data.dataHash,
        }));
    };

    const clearAll = () => setState(defaultState);

    return (
        <AnalysisContext.Provider value={{
            ...state,
            setFile,
            setAnomalies,
            setGraphData,
            setSnapshot,
            addLog,
            clearLogs,
            setAnchorData,
            setHashes,
            clearAll,
        }}>
            {children}
        </AnalysisContext.Provider>
    );
};
