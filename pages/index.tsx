import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Network, Activity, ArrowRight, Database, Lock, Search, AlertTriangle, Check, GitMerge, FileSearch, Cpu, Zap, Eye, Target } from 'lucide-react';
import { useBackend } from '../components/BackendContext';

export default function Home() {
    const { status: serverStatus } = useBackend();
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    const fadeInUp = {
        hidden: { opacity: 0, y: 60 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 overflow-x-hidden font-sans">
            <Head>
                <title>PoEC | AI-Powered Financial Forensics with Cryptographic Proof</title>
            </Head>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/10 bg-black/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold tracking-tighter text-xl">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">P</div>
                        <span>PoEC</span>
                    </div>
                    <div className="flex gap-6 text-sm font-medium text-slate-400">
                        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                        <Link href="/verify" className="hover:text-white transition-colors">Verify</Link>
                        <Link href="/agent_sim" className="hover:text-white transition-colors">Agent Sim</Link>
                        <Link href="/about" className="hover:text-white transition-colors">About</Link>
                    </div>
                    <Link href="/dashboard" className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-full hover:bg-slate-200 transition-colors">
                        Launch App
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Dynamic Background */}
                <div className="absolute inset-0 bg-grid-pattern opacity-20 z-0"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none z-0" />

                <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono mb-6 transition-colors
                            ${serverStatus === 'online'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}>
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${serverStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${serverStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                            </span>
                            {serverStatus === 'online' ? 'GNN Engine Online • Sepolia Connected' : 'Connecting to Neural Core...'}
                        </div>
                    </motion.div>

                    <motion.h1
                        className="text-6xl md:text-8xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        Proof of <br />Economic Crime
                    </motion.h1>

                    <motion.p
                        className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        <strong className="text-white">Detect financial fraud with AI. Prove it with cryptography.</strong><br />
                        PoEC combines <span className="text-blue-400">Graph Neural Networks</span> with <span className="text-emerald-400">Blockchain Proof Anchoring</span> to detect, analyze, and mathematically verify financial anomalies — creating court-admissible digital evidence.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex justify-center gap-4 relative z-30"
                    >
                        <Link href="/dashboard" className="group px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                            Start Analysis <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/about" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-semibold transition-all backdrop-blur-sm">
                            Technical Deep Dive
                        </Link>
                    </motion.div>
                </div>

                {/* Parallax Elements (Lower z-index to prevent overlay issues) */}
                <motion.div style={{ y: y1 }} className="absolute bottom-20 left-20 opacity-20 hidden md:block z-0 pointer-events-none">
                    <Network size={120} />
                </motion.div>
                <motion.div style={{ y: y2 }} className="absolute top-40 right-20 opacity-20 hidden md:block z-0 pointer-events-none">
                    <ShieldCheck size={120} />
                </motion.div>
            </header>

            {/* THE PROBLEM */}
            <section className="py-24 relative overflow-hidden border-t border-white/5">
                <div className="absolute inset-0 bg-[#0a0a0a] z-0"></div>
                <div className="absolute left-0 top-20 w-[600px] h-[600px] bg-red-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                    >
                        <span className="text-red-500 font-bold tracking-widest uppercase text-xs mb-4 block">The Problem</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">$4.7 Trillion Lost Annually to Financial Crime</h2>
                        <div className="max-w-3xl mx-auto text-lg text-slate-400 leading-relaxed space-y-6">
                            <p>
                                Traditional forensic tools rely on <strong className="text-white">static rules</strong> like "Flag if amount &gt; $10,000".<br />
                                Sophisticated criminals easily bypass these with techniques like:
                            </p>
                        </div>
                    </motion.div>
                </div>

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-2xl">
                        <div className="mb-6 p-4 bg-red-500/10 w-fit rounded-xl text-red-400">
                            <GitMerge size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Smurfing / Structuring</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Breaking large sums into many small transactions below reporting thresholds. Each transaction looks innocent in isolation.
                        </p>
                    </div>

                    <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-2xl">
                        <div className="mb-6 p-4 bg-red-500/10 w-fit rounded-xl text-red-400">
                            <Activity size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Circular Trading</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Moving money A→B→C→A to create fake volume, manipulate markets, or launder funds through seemingly legitimate trades.
                        </p>
                    </div>

                    <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-2xl">
                        <div className="mb-6 p-4 bg-red-500/10 w-fit rounded-xl text-red-400">
                            <Network size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Collusion Networks</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Groups of entities trading exclusively with each other to create artificial economic activity or evade taxes.
                        </p>
                    </div>
                </div>
            </section>

            {/* THE SOLUTION */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#0F0F0F] z-0"></div>
                <div className="absolute right-0 top-20 w-[600px] h-[600px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                    >
                        <span className="text-blue-500 font-bold tracking-widest uppercase text-xs mb-4 block">Our Solution</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">See the Forest, Not Just the Trees</h2>
                        <div className="max-w-3xl mx-auto text-lg text-slate-400 leading-relaxed space-y-6">
                            <p>
                                <strong className="text-white">PoEC changes the paradigm.</strong> Instead of looking at individual transactions,<br />
                                we analyze the <span className="text-blue-400 font-bold">shape of the entire economy</span> using Graph Neural Networks.
                            </p>
                        </div>
                    </motion.div>
                </div>

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    <div className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                        <div className="mb-6 p-4 bg-blue-500/10 w-fit rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
                            <Network size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Graph-Based Intelligence</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            We convert flat CSV ledgers into <strong>directed graphs</strong> where entities become nodes and transactions become edges. This reveals hidden patterns that spreadsheets can never show.
                        </p>
                    </div>

                    <div className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                        <div className="mb-6 p-4 bg-purple-500/10 w-fit rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
                            <Cpu size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">GNN Anomaly Detection</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            Our <strong>Graph Neural Network</strong> learns what "normal" looks like without labeled data. It mathematically isolates structural deviations using <strong>GraphSAGE</strong> neighbor aggregation.
                        </p>
                    </div>

                    <div className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                        <div className="mb-6 p-4 bg-emerald-500/10 w-fit rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
                            <ShieldCheck size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Cryptographic Proof</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            We don't just find crime — we <strong>prove it</strong>. Every detection is bundled into Merkle trees and anchored on <strong>Ethereum (Sepolia)</strong> for tamper-proof chain of custody.
                        </p>
                    </div>
                </div>
            </section>

            {/* SYSTEM ARCHITECTURE FLOWCHART */}
            <section className="py-32 bg-[#0a0a0a] relative overflow-hidden border-y border-white/5">
                <div className="absolute top-0 right-0 p-32 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: false, amount: 0.3 }}
                        variants={fadeInUp}
                        className="text-center mb-20"
                    >
                        <span className="text-purple-400 font-mono text-sm tracking-widest uppercase mb-4 block">System Architecture</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">End-to-End Evidence Pipeline</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                            From raw transaction data to blockchain-anchored proof in 4 automated steps.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0 z-0"></div>

                        {[
                            {
                                step: "01",
                                title: "Data Ingestion",
                                desc: "Upload CSV transaction logs. System normalizes data, extracts entities, and builds a directed graph where nodes = accounts and edges = money flow.",
                                icon: <Database />,
                                color: "blue"
                            },
                            {
                                step: "02",
                                title: "GNN Analysis",
                                desc: "Graph Neural Network (SAGEConv) scans topology. Computes 5D node features and calculates anomaly scores using μ+2σ threshold detection.",
                                icon: <Activity />,
                                color: "purple"
                            },
                            {
                                step: "03",
                                title: "Proof Generation",
                                desc: "Detected anomalies are hashed and bundled into Merkle trees. Each detection gets a cryptographic proof path. Bundle stored on IPFS (Pinata).",
                                icon: <Lock />,
                                color: "violet"
                            },
                            {
                                step: "04",
                                title: "Chain Anchoring",
                                desc: "Merkle root, data hash, and model hash anchored to Ethereum Sepolia via ResultAnchor smart contract. Creates immutable audit trail.",
                                icon: <ShieldCheck />,
                                color: "emerald"
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: false, amount: 0.3 }}
                                transition={{ delay: i * 0.2 }}
                                className="relative z-10 bg-[#151515] p-8 rounded-2xl border border-white/10 hover:border-blue-500/50 transition-colors"
                            >
                                <div className="w-12 h-12 bg-blue-900/20 text-blue-400 rounded-lg flex items-center justify-center mb-6 font-bold shadow-lg shadow-blue-900/10">
                                    {item.icon}
                                </div>
                                <span className="absolute top-8 right-8 text-4xl font-bold text-white/5 font-mono pointer-events-none">{item.step}</span>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* KEY DIFFERENTIATORS */}
            <section className="py-24 bg-[#0F0F0F] relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: false, amount: 0.3 }}
                        className="text-center mb-16"
                    >
                        <span className="text-emerald-400 font-mono text-sm tracking-widest uppercase mb-4 block">Why PoEC Wins</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Key Differentiators</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                                    <Eye size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Unsupervised Detection</h3>
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                No need for labeled fraud datasets. Our GNN learns normal patterns from the graph structure itself and flags statistical outliers automatically.
                            </p>
                        </div>

                        <div className="p-8 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
                                    <Target size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Multi-Pattern Detection</h3>
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                Detects Circular Trading, Wash Trading, Structuring (Smurfing), Rapid Movement, and Collusion Clusters in a single analysis pass.
                            </p>
                        </div>

                        <div className="p-8 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
                                    <ShieldCheck size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Legally Admissible Proofs</h3>
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                Every detection generates a Merkle proof anchored on Ethereum. This creates a cryptographic chain of custody that can be verified in court.
                            </p>
                        </div>

                        <div className="p-8 bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400">
                                    <Zap size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Autonomous Agent Runtime</h3>
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                x402-style agent can run continuously — acquiring data, running analysis, generating proofs, and anchoring to blockchain without human intervention.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tech Specs Marquee / Grid */}
            <section className="py-20 border-y border-white/10 bg-[#0a0a0a]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-10">
                        <span className="text-slate-500 font-mono text-xs tracking-widest uppercase">Technology Stack</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 font-mono text-sm uppercase tracking-widest flex-wrap gap-8">
                        <span className="flex items-center gap-2"><Cpu size={16} /> PyTorch Geometric</span>
                        <span className="flex items-center gap-2"><Database size={16} /> FastAPI + PostgreSQL</span>
                        <span className="flex items-center gap-2"><Lock size={16} /> Solidity + Hardhat</span>
                        <span className="flex items-center gap-2"><Network size={16} /> Cytoscape.js</span>
                        <span className="flex items-center gap-2"><ShieldCheck size={16} /> Next.js 14</span>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 text-center bg-black relative">
                <div className="absolute inset-0 bg-blue-600/5 blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-3xl mx-auto px-6">
                    <h2 className="text-4xl font-bold mb-6">Ready to Investigate?</h2>
                    <p className="text-slate-400 mb-10 text-lg">
                        Upload your transaction data, let the GNN detect anomalies, and anchor proof to the blockchain — all in one seamless flow.
                    </p>
                    <Link href="/dashboard" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black rounded-full font-bold uppercase tracking-wide hover:bg-slate-200 transition-colors">
                        Launch Dashboard <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-black border-t border-white/10 text-center text-slate-600 text-sm">
                <p>© 2026 PoEC — Built for x402 Hackathon</p>
            </footer>
        </div>
    );
}
