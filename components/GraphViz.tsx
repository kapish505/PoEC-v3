import React, { useEffect, useRef, useState, useCallback } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import {
    Maximize,
    RefreshCw,
    Grid,
    Circle,
    Share2,
    Search,
    XCircle
} from 'lucide-react';

const STYLES = [
    {
        selector: 'node',
        style: {
            'background-color': '#3b82f6', // blue-500
            'label': 'data(label)',
            'color': '#64748b', // slate-500
            'font-size': '10px',
            'text-valign': 'bottom' as const,
            'text-halign': 'center' as const,
            'width': '30px',
            'height': '30px',
            'border-width': 1,
            'border-color': '#fff'
        }
    },
    {
        selector: ':selected',
        style: {
            'background-color': '#ef4444', // red-500
            'border-width': 2,
            'border-color': '#111827' // gray-900
        }
    },
    {
        selector: '.focus-pulse',
        style: {
            'border-width': 4,
            'border-color': '#f43f5e', // rose-500
            'background-color': '#fbbf24', // amber-400
            'width': '40px',
            'height': '40px',
            'transition-property': 'width, height, background-color, border-width',
            'transition-duration': 500
        }
    },
    {
        selector: '.highlighted',
        style: {
            'background-color': '#10b981', // emerald-500
            'transition-property': 'background-color, width, height',
            'transition-duration': 300 // ms number
        }
    },
    {
        selector: '.dimmed',
        style: {
            'opacity': 0.2
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 1,
            'line-color': '#cbd5e1', // slate-300
            'target-arrow-color': '#cbd5e1',
            'target-arrow-shape': 'triangle' as const,
            'curve-style': 'bezier' as const,
            'arrow-scale': 0.8
        }
    },
    {
        selector: 'edge.highlighted',
        style: {
            'line-color': '#10b981',
            'target-arrow-color': '#10b981',
            'width': 2
        }
    }
];

export default function GraphViz({ elements, focusedAnomaly, theme = 'light' }: { elements: any[], focusedAnomaly?: any, theme?: 'light' | 'dark' }) {
    const cyRef = useRef<cytoscape.Core | null>(null);
    const [layout, setLayout] = useState('circle');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    interface EdgeInfo {
        source: string;
        target: string;
        score: number;
        amount?: number;
        types?: string[];
        dates?: string[];
    }
    const [selectedEdge, setSelectedEdge] = useState<EdgeInfo | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false); // New

    // Initial Data Load
    // elements prop is used directly now

    // Toggle Full Screen
    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
        // Resize after short delay to allow transition
        setTimeout(() => {
            if (cyRef.current) cyRef.current.resize();
        }, 100);
    };

    // Focus Anomaly Effect
    useEffect(() => {
        if (!cyRef.current || !focusedAnomaly) return;

        console.log("GraphViz: Focusing anomaly:", focusedAnomaly.anomaly_id);
        const cy = cyRef.current;
        const entities = focusedAnomaly.entities_involved || [];

        console.log("GraphViz: Target entities:", entities);

        // Reset first
        cy.elements().removeClass('highlighted dimmed focus-pulse');

        if (entities.length === 0) return;

        // Dim all
        cy.elements().addClass('dimmed');

        // Find and highlight entities with robust matching
        const collection = cy.collection();

        entities.forEach((rawId: string) => {
            const id = String(rawId).trim();
            // Try exact match
            let node = cy.getElementById(id);

            // If not found, try stripping spaces or case
            if (node.length === 0) {
                // Fallback: search by data label if ID doesn't match
                node = cy.nodes().filter((n: any) => n.data('label') === id || n.id() === id);
            }

            if (node.length > 0) {
                console.log("GraphViz: Found node:", id);
                node.removeClass('dimmed').addClass('highlighted focus-pulse');
                collection.merge(node);

                // Highlight edges between them if relevant
                node.connectedEdges().forEach(edge => {
                    const src = edge.source().id();
                    const tgt = edge.target().id();
                    if (entities.includes(src) && entities.includes(tgt)) {
                        edge.removeClass('dimmed').addClass('highlighted');
                        collection.merge(edge);
                    }
                });
            } else {
                console.warn("GraphViz: Node NOT found:", id);
            }
        });

        if (collection.length > 0) {
            console.log("GraphViz: Zooming to collection size:", collection.length);
            cy.animate({
                fit: {
                    eles: collection,
                    padding: 50
                },
                duration: 800,
                easing: 'ease-out-cubic'
            });
        } else {
            console.warn("GraphViz: No entities found in graph for this anomaly.");
        }

    }, [focusedAnomaly]);

    // Layout Management
    const runLayout = useCallback((layoutName: string) => {
        if (!cyRef.current) return;

        setLayout(layoutName);
        const l = cyRef.current.layout({
            name: layoutName,
            animate: true,
            animationDuration: 500,
            padding: 50
        } as any); // Cast to any to avoid strict layout type issues
        l.run();
    }, []);

    // Reset View
    const handleReset = () => {
        if (!cyRef.current) return;
        cyRef.current.fit();
        cyRef.current.center();

        // Reset styles
        cyRef.current.elements().removeClass('highlighted dimmed focus-pulse');
        setSelectedNode(null);
        setSelectedEdge(null);
    };

    // Search / Filter
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cyRef.current || !searchTerm) return;

        const target = cyRef.current.getElementById(searchTerm);
        if (target.length > 0) {
            cyRef.current.elements().removeClass('highlighted');
            cyRef.current.elements().addClass('dimmed');
            target.removeClass('dimmed').addClass('highlighted');
            target.neighborhood().removeClass('dimmed').addClass('highlighted');

            cyRef.current.fit(target.union(target.neighborhood()), 50);
            setSelectedNode(searchTerm);
        } else {
            alert("Node not found");
        }
    };

    // Node/Edge Interaction
    useEffect(() => {
        if (!cyRef.current) return;
        const cy = cyRef.current;

        const onTap = (evt: any) => {
            const target = evt.target;

            // Clear previous Highlight
            cy.elements().removeClass('highlighted dimmed');

            if (target === cy) {
                // Background tap = clear
                setSelectedNode(null);
                setSelectedEdge(null);
                return;
            }

            if (target.isNode()) {
                const id = target.id();
                setSelectedNode(id);
                setSelectedEdge(null);

                // Highlight interactions
                cy.elements().addClass('dimmed');
                target.removeClass('dimmed').addClass('highlighted');
                target.neighborhood().removeClass('dimmed').addClass('highlighted');
            } else if (target.isEdge()) {
                const data = target.data();
                setSelectedEdge({
                    source: data.source,
                    target: data.target,
                    score: data.gnn_score,
                    amount: data.amount,
                    types: data.types,
                    dates: data.dates
                });
                setSelectedNode(null);

                // Highlight just this edge and nodes
                cy.elements().addClass('dimmed');
                target.removeClass('dimmed').addClass('highlighted');
                target.source().removeClass('dimmed').addClass('highlighted');
                target.target().removeClass('dimmed').addClass('highlighted');
            }
        };

        cy.on('tap', onTap);

        return () => {
            cy.off('tap', onTap);
        };
    }, []);

    // Re-run layout on data change
    useEffect(() => {
        if (cyRef.current && elements.length > 0) {
            runLayout(layout);
        }
    }, [elements.length, layout, runLayout]);

    if (elements.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                <Share2 size={32} className="opacity-20" />
                <p className="text-sm">Graph visualization empty</p>
            </div>
        );
    }

    return (
        <div className={`transition-all duration-300 bg-slate-50 ${isFullScreen ? 'fixed inset-0 z-[9999] w-screen h-screen' : 'relative w-full h-full'}`}>
            {/* Toolbar Overlay */}
            <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
                {/* Search Bar */}
                <form onSubmit={handleSearch} className="flex bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden w-48 transition-all focus-within:w-64 focus-within:ring-2 focus-within:ring-blue-100">
                    <input
                        type="text"
                        placeholder="Find Entity..."
                        className="w-full px-3 py-1.5 text-xs outline-none text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="px-2 text-slate-400 hover:text-blue-600 bg-slate-50 border-l border-slate-100">
                        <Search size={14} />
                    </button>
                    {selectedNode && (
                        <button type="button" onClick={() => { setSearchTerm(''); handleReset(); }} className="px-2 text-rose-400 hover:text-rose-600 bg-slate-50 border-l border-slate-100">
                            <XCircle size={14} />
                        </button>
                    )}
                </form>

                {/* Controls */}
                <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1 gap-1 self-end">
                    <button type="button" onClick={toggleFullScreen} title={isFullScreen ? "Exit Full Screen" : "Full Screen"} className={`p-2 rounded transition-colors ${isFullScreen ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`}>
                        <Maximize size={16} />
                    </button>
                    <div className="w-px bg-slate-200 my-1"></div>
                    <button type="button" onClick={handleReset} title="Reset View" className="p-2 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600 transition-colors">
                        <RefreshCw size={16} /> {/* Using Refresh for Reset view, Maximize for Fullscreen */}
                    </button>
                    <button type="button" onClick={() => runLayout('circle')} title="Circle Layout" className={`p-2 rounded transition-colors ${layout === 'circle' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`}>
                        <Circle size={16} />
                    </button>
                    <button type="button" onClick={() => runLayout('grid')} title="Grid Layout" className={`p-2 rounded transition-colors ${layout === 'grid' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`}>
                        <Grid size={16} />
                    </button>
                    <button type="button" onClick={() => runLayout('breadthfirst')} title="Tree/Hierarchy" className={`p-2 rounded transition-colors ${layout === 'breadthfirst' ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-600'}`}>
                        <Share2 size={16} />
                    </button>
                </div>
            </div>

            {/* Selection Info Overlay */}
            {(selectedNode || selectedEdge) && (
                <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur rounded-lg shadow-lg border border-slate-200 p-4 text-xs w-72 animate-in slide-in-from-bottom-2 fade-in">
                    {selectedNode && (
                        <>
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-semibold text-slate-700">Selected Entity</span>
                                <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{selectedNode}</span>
                            </div>
                            <div className="text-slate-500">
                                Click background to reset selection.
                            </div>
                        </>
                    )}
                    {selectedEdge && (
                        <>
                            <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                                <span className="font-semibold text-slate-700">Connection Details</span>
                                <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${(selectedEdge.score || 0) > 0.6
                                    ? 'bg-red-100 text-red-600 border border-red-200'
                                    : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                                    }`}>
                                    {(selectedEdge.score || 0) > 0.6 ? 'Anomaly' : 'Normal'}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400">Source</span>
                                        <span className="font-mono font-bold text-slate-700 truncate" title={selectedEdge.source}>{selectedEdge.source}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] text-slate-400">Target</span>
                                        <span className="font-mono font-bold text-slate-700 truncate" title={selectedEdge.target}>{selectedEdge.target}</span>
                                    </div>
                                </div>

                                {selectedEdge.amount !== undefined && (
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Total Volume</span>
                                            <span className="font-mono font-bold text-slate-800">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedEdge.amount)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {selectedEdge.dates && selectedEdge.dates.length > 0 && (
                                    <div className="flex justify-between text-[10px] text-slate-500">
                                        <span>First: {selectedEdge.dates[0]}</span>
                                        <span>Last: {selectedEdge.dates[selectedEdge.dates.length - 1]}</span>
                                    </div>
                                )}

                                <div className="bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-slate-600">GNN Anomaly Score</span>
                                        <span className="font-mono font-bold text-slate-800">{(selectedEdge.score || 0).toFixed(4)}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${(selectedEdge.score || 0) > 0.6 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min((selectedEdge.score || 0) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            <CytoscapeComponent
                elements={elements}
                style={{ width: '100%', height: '100%' }}
                stylesheet={STYLES}
                cy={(cy) => { cyRef.current = cy; }}
                wheelSensitivity={0.1}
                layout={{ name: layout }}
            />
        </div>
    );
}
