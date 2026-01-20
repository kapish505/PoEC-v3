
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type BackendStatus = 'checking' | 'online' | 'offline';

interface BackendContextType {
    status: BackendStatus;
    checkStatus: () => Promise<void>;
    reconnect: () => void;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

export const useBackend = () => {
    const context = useContext(BackendContext);
    if (!context) {
        throw new Error('useBackend must be used within a BackendProvider');
    }
    return context;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const BackendProvider = ({ children }: { children: ReactNode }) => {
    const [status, setStatus] = useState<BackendStatus>('checking');
    const [attempts, setAttempts] = useState(0);

    const checkStatus = useCallback(async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s ping timeout

            const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                setStatus('online');
                return;
            } else {
                throw new Error("Server not ready");
            }
        } catch (e) {
            console.log(`Backend ping failed (Attempt ${attempts + 1})`);

            if (status !== 'online') {
                if (attempts < 20) {
                    setAttempts(prev => prev + 1);
                } else {
                    setStatus('offline');
                }
            }
        }
    }, [attempts, status]);

    useEffect(() => {
        // Initial Check
        checkStatus();
    }, [checkStatus]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (status === 'checking' && attempts < 20) {
            // Adaptive Polling: Burst mode (1s) for first 5 tries, then 5s
            const interval = attempts < 5 ? 1000 : 5000;
            timer = setTimeout(checkStatus, interval);
        }
        return () => clearTimeout(timer);
    }, [status, attempts, checkStatus]);

    const reconnect = useCallback(() => {
        setAttempts(0);
        setStatus('checking');
    }, []);

    return (
        <BackendContext.Provider value={{ status, checkStatus, reconnect }}>
            {children}
        </BackendContext.Provider>
    );
};
