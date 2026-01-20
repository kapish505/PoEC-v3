
import React, { useState } from 'react';
import { useBackend } from './BackendContext';
import { Activity, CheckCircle, XCircle, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalStatus() {
    const { status, reconnect } = useBackend();
    const [isExpanded, setIsExpanded] = useState(false);

    // Don't show anything if we haven't even started checking (should be rare)
    if (!status) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        className="mb-3 p-4 bg-[#111] border border-white/10 rounded-xl shadow-2xl w-72 backdrop-blur-md"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Activity size={16} className="text-blue-400" />
                                Analysis Engine
                            </h3>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="text-slate-500 hover:text-white transition-colors"
                            >
                                <Minimize2 size={14} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">Status</span>
                                <span className={`font-mono font-bold ${status === 'online' ? 'text-emerald-400' :
                                    status === 'checking' ? 'text-yellow-400' : 'text-red-400'
                                    }`}>
                                    {status.toUpperCase()}
                                </span>
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed">
                                {status === 'online' && "The backend analysis engine is active and ready to process transaction graphs."}
                                {status === 'checking' && "Waking up the Render node. This may take 30-50 seconds for a cold start."}
                                {status === 'offline' && (
                                    <span className="flex flex-col gap-2">
                                        <span>Connection lost. The server may be sleeping.</span>
                                        <button
                                            onClick={() => reconnect()}
                                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors w-full"
                                        >
                                            RETRY CONNECTION
                                        </button>
                                    </span>
                                )}
                            </p>

                            {status === 'checking' && (
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-400 animate-progress-indeterminate"></div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md transition-all
                    ${status === 'online'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                        : status === 'checking'
                            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
                            : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                    }
                `}
            >
                {status === 'online' && <CheckCircle size={16} />}
                {status === 'checking' && <Loader2 size={16} className="animate-spin" />}
                {status === 'offline' && <XCircle size={16} />}

                <span className="text-xs font-bold uppercase tracking-wider">
                    {status === 'online' ? 'System Online' : status === 'checking' ? 'Waking Server...' : 'Offline'}
                </span>

                {!isExpanded && <Maximize2 size={12} className="opacity-50 ml-1" />}
            </motion.button>
        </div>
    );
}
