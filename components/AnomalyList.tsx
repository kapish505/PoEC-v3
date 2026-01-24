interface Anomaly {
    anomaly_id: string;
    anomaly_type: string;
    severity: number;
    description: string;
    confidence?: string; // New
    detection_method?: string; // New
    explanation_metadata?: any; // New
    entities_involved: string[];
    evidence_data: any;
}

// Tooltip Component


interface AnomalyListProps {
    anomalies: Anomaly[];
    onSelect?: (anomaly: Anomaly) => void;
    onFocus?: (anomaly: Anomaly) => void; // New
    theme?: 'light' | 'dark'; // Add theme support
}

import React from 'react';
import { Activity, Eye } from 'lucide-react';

export default function AnomalyList({ anomalies, onSelect, onFocus, theme = 'light' }: AnomalyListProps) {
    const [expandedId, setExpandedId] = React.useState<string | null>(null);

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        // Prevent triggering if clicking specific controls
        e.stopPropagation();
        setExpandedId(expandedId === id ? null : id);
        if (onSelect) {
            const anomaly = anomalies.find(a => a.anomaly_id === id);
            if (anomaly) onSelect(anomaly);
        }
    };

    if (anomalies.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400 text-sm">
                No anomalies detected. System running within normal parameters.
            </div>
        );
    }

    return (
        <div className="space-y-3 pr-2 pb-20">
            {anomalies.map((anomaly) => {
                const isExpanded = expandedId === anomaly.anomaly_id;

                return (
                    <div
                        key={anomaly.anomaly_id}
                        onClick={(e) => toggleExpand(anomaly.anomaly_id, e)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer group relative overflow-hidden
                        ${theme === 'dark'
                                ? 'bg-white/5 border-white/5 hover:border-blue-500/30 hover:bg-white/10'
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                            } ${isExpanded ? 'ring-1 ring-blue-500/50' : ''}`}
                    >
                        {/* Header: Title + Eye */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className={`font-bold text-sm leading-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                                {anomaly.anomaly_type.replace(/_/g, " ")}
                            </h4>

                            <div className="flex gap-2">
                                {onFocus && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFocus(anomaly);
                                        }}
                                        className={`flex-none p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-blue-50 text-slate-400 hover:text-blue-600'}`}
                                        title="Visualize in Graph"
                                    >
                                        <Eye size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Metadata Badges Row */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            {/* Type Badge */}
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${anomaly.detection_method === 'LEARNED'
                                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                {anomaly.detection_method || 'UNKNOWN'}
                            </span>

                            {/* Confidence */}
                            {anomaly.confidence && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${anomaly.confidence === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                    }`}>
                                    {anomaly.confidence} Conf.
                                </span>
                            )}

                            {/* Score */}
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${anomaly.severity > 0.8 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                }`}>
                                Score: {anomaly.severity.toFixed(2)}
                            </span>
                        </div>

                        {/* Description */}
                        <p className={`text-xs mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {anomaly.description}
                        </p>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
                                {/* Evidence Data */}
                                <div>
                                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Evidence</h5>
                                    <div className={`rounded p-2 text-[10px] font-mono break-all ${theme === 'dark' ? 'bg-black/30 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                                        {JSON.stringify(anomaly.evidence_data, null, 2)}
                                    </div>
                                </div>

                                {/* Involves */}
                                <div>
                                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Endpoints</h5>
                                    <div className="flex flex-wrap gap-1">
                                        {anomaly.entities_involved.map((entity, i) => (
                                            <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                                                {entity}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Footer: Entities & CTA */}
                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-white/10">
                            <div className="flex -space-x-1">
                                {anomaly.entities_involved.slice(0, 3).map((_, i) => (
                                    <div key={i} className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-white text-slate-500'}`}>
                                        {i + 1}
                                    </div>
                                ))}
                                {anomaly.entities_involved.length > 3 && (
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-white text-slate-500'}`}>
                                        +
                                    </div>
                                )}
                            </div>
                            <span className="text-[9px] font-medium text-blue-500 flex items-center gap-0.5 group-hover:gap-1 transition-all">
                                {isExpanded ? 'Show Less' : 'Deep Dive'} <ArrowRight size={10} />
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Helper for icon
function ArrowRight({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
}
