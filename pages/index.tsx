import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, Zap, Network, Shield, AlertTriangle, Check, X, ChevronDown, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
    return (
        <>
            <Head>
                <title>PoEC | Trust Infrastructure for Monad's Agent Economy</title>
                <meta name="description" content="Zero-knowledge verified agent reputation for autonomous M2M transactions on Monad" />
            </Head>

            <div className="min-h-screen">
                {/* Hero Section */}
                <section className="relative py-20 px-6 overflow-hidden">
                    {/* Background gradients */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
                    </div>

                    <div className="max-w-5xl mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
                                <Zap size={14} />
                                For x402 Agent Economy
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                                <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                                    Trust Infrastructure
                                </span>
                                <br />
                                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                    for Monad
                                </span>
                            </h1>

                            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                                When autonomous agents make financial decisions, how do they verify trust?
                                <br />
                                <span className="text-white font-medium">PoEC provides ZK-verified reputation scoring for M2M transactions.</span>
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/dashboard"
                                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold text-lg flex items-center gap-2 transition-all shadow-xl shadow-blue-500/25"
                                >
                                    Launch Dashboard
                                    <ArrowRight size={20} />
                                </Link>
                                <Link
                                    href="/about"
                                    className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-lg transition-all"
                                >
                                    How It Works
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* The Problem Section */}
                <section className="py-20 px-6 border-t border-white/5">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <span className="text-red-400 text-sm font-bold uppercase tracking-widest">The Problem</span>
                            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
                                No Trust Layer for the Agent Economy
                            </h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                Monad's emerging x402 agent ecosystem lacks native infrastructure for verifying autonomous counterparty risk.
                            </p>
                        </motion.div>

                        {/* Scenario Flowchart */}
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 md:p-12">
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Step 1 */}
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <Network size={28} className="text-blue-400" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Agent A Finds Agent B</h3>
                                    <p className="text-sm text-slate-400">
                                        "I want to pay Agent B 50 MON for this service"
                                    </p>
                                </div>

                                {/* Arrow */}
                                <div className="hidden md:flex items-center justify-center">
                                    <ChevronDown size={32} className="text-slate-600 rotate-[-90deg]" />
                                </div>

                                {/* Step 2 */}
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                        <AlertTriangle size={28} className="text-amber-400" />
                                    </div>
                                    <h3 className="font-bold text-lg mb-2">Trust Verification?</h3>
                                    <p className="text-sm text-slate-400">
                                        "Traditional tools like Arkham don't support autonomous agent flows."
                                    </p>
                                </div>
                            </div>

                            {/* Comparison */}
                            <div className="mt-12 grid md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Check size={20} className="text-emerald-400" />
                                        <span className="font-bold text-emerald-400">Human-Centric Analytics</span>
                                    </div>
                                    <div className="space-y-2 text-sm text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <ExternalLink size={14} className="text-slate-500" />
                                            Designed for human analysts
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ExternalLink size={14} className="text-slate-500" />
                                            Reactive (after-the-fact)
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ExternalLink size={14} className="text-slate-500" />
                                            No automated API for agents
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
                                    <div className="flex items-center gap-3 mb-4">
                                        <X size={20} className="text-red-400" />
                                        <span className="font-bold text-red-400">Missing on Monad</span>
                                    </div>
                                    <div className="space-y-2 text-sm text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={14} className="text-red-400" />
                                            No x402-native verification
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={14} className="text-red-400" />
                                            No real-time GNN risk scoring
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={14} className="text-red-400" />
                                            No on-chain proof of reputation
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* The Solution Section */}
                <section className="py-20 px-6 border-t border-white/5 bg-gradient-to-b from-transparent to-blue-500/5">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <span className="text-blue-400 text-sm font-bold uppercase tracking-widest">The Solution</span>
                            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
                                PoEC: Proof of Economic Computation
                            </h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                AI-powered risk analysis with zero-knowledge proofs, anchored immutably to Monad.
                            </p>
                        </motion.div>

                        {/* Pipeline Flowchart */}
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 md:p-12">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { icon: <Network size={24} className="text-blue-400" />, label: 'Monad RPC', desc: 'Real transaction data' },
                                    { icon: <span className="text-2xl">🧠</span>, label: 'GNN Analysis', desc: 'Neural risk detection' },
                                    { icon: <Shield size={24} className="text-blue-400" />, label: 'zkVM Proof', desc: 'Verifiable computation' },
                                    { icon: <span className="text-2xl">🌳</span>, label: 'Merkle Tree', desc: 'Data integrity' },
                                    { icon: <Zap size={24} className="text-blue-400" />, label: 'On-Chain', desc: 'Immutable anchor' }
                                ].map((step, i) => (
                                    <div key={i} className="relative">
                                        <div className="text-center p-4 rounded-xl bg-white/5 border border-white/10">
                                            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                                {step.icon}
                                            </div>
                                            <h4 className="font-bold text-sm mb-1">{step.label}</h4>
                                            <p className="text-[10px] text-slate-500">{step.desc}</p>
                                        </div>
                                        {i < 4 && (
                                            <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2">
                                                <ArrowRight size={16} className="text-slate-600" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Result */}
                            <div className="mt-8 p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                                <div className="flex items-center justify-center gap-3 mb-2">
                                    <Check size={24} className="text-emerald-400" />
                                    <span className="font-bold text-lg text-emerald-400">Verifiable Trust Score</span>
                                </div>
                                <p className="text-sm text-slate-400">
                                    Agent A can now verify Agent B's reputation with cryptographic proof
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Monad Needs This */}
                <section className="py-20 px-6 border-t border-white/5">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <span className="text-purple-400 text-sm font-bold uppercase tracking-widest">Why Monad Needs This</span>
                            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4">
                                Infrastructure for the Agent Economy
                            </h2>
                        </motion.div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Without PoEC */}
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
                                <h3 className="font-bold text-lg mb-6 text-red-400 flex items-center gap-2">
                                    <X size={20} />
                                    Monad Today
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        'No on-chain verification',
                                        'Agents must blindly trust',
                                        'High fraud risk for M2M',
                                        'No reputation infrastructure'
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-slate-400">
                                            <X size={16} className="text-red-400/60" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* With PoEC */}
                            <div className="bg-[#0a0a0a] border border-emerald-500/20 rounded-2xl p-8">
                                <h3 className="font-bold text-lg mb-6 text-emerald-400 flex items-center gap-2">
                                    <Check size={20} />
                                    Monad + PoEC
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        'ZK-verified reputation',
                                        'Trustless M2M decisions',
                                        'AI-powered risk detection',
                                        'Immutable proof anchoring'
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-slate-200">
                                            <Check size={16} className="text-emerald-400" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-20 px-6 border-t border-white/5">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            Ready to Try It?
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Run a real analysis on Monad testnet data and see PoEC in action.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold text-lg transition-all shadow-xl shadow-blue-500/25"
                        >
                            <Zap size={20} />
                            Launch Dashboard
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 px-6 border-t border-white/5">
                    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Zap size={12} className="text-white" />
                            </div>
                            <span>PoEC v3 — Proof of Economic Computation</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <a href="https://github.com/kapish505/PoEC-v3" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                GitHub
                            </a>
                            <Link href="/about" className="hover:text-white transition-colors">
                                About
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
