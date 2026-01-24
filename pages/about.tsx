import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Zap, Network, Shield, Database, Check, ExternalLink, Github, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function About() {
    return (
        <>
            <Head>
                <title>About | PoEC v3</title>
            </Head>

            <div className="px-6 pb-20">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-4xl font-bold mb-4">About PoEC</h1>
                        <p className="text-xl text-slate-400">
                            Proof of Economic Computation — Trust Infrastructure for Monad's Agent Economy
                        </p>
                    </motion.div>

                    {/* Architecture Diagram */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 mb-8"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Network size={20} className="text-blue-400" />
                            System Architecture
                        </h2>

                        {/* Visual Architecture */}
                        <div className="relative">
                            {/* Flow */}
                            <div className="grid grid-cols-5 gap-4 mb-8">
                                {[
                                    { label: 'Monad RPC', sub: 'Data Layer', color: 'blue' },
                                    { label: 'GNN Engine', sub: 'Analysis', color: 'purple' },
                                    { label: 'Risc0 zkVM', sub: 'Proof Gen', color: 'emerald' },
                                    { label: 'Merkle Tree', sub: 'Integrity', color: 'amber' },
                                    { label: 'On-Chain', sub: 'Anchor', color: 'cyan' }
                                ].map((item, i) => (
                                    <div key={i} className="relative">
                                        <div className={`p-4 rounded-xl bg-${item.color}-500/10 border border-${item.color}-500/20 text-center`}>
                                            <div className={`text-${item.color}-400 font-bold text-sm mb-1`}>{item.label}</div>
                                            <div className="text-xs text-slate-500">{item.sub}</div>
                                        </div>
                                        {i < 4 && (
                                            <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                                                <ArrowRight size={14} className="text-slate-600" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Stack Details */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <h4 className="font-bold text-sm mb-2 text-blue-400">Frontend</h4>
                                    <ul className="text-xs text-slate-400 space-y-1">
                                        <li>• Next.js 14</li>
                                        <li>• React + TypeScript</li>
                                        <li>• Tailwind CSS</li>
                                        <li>• Cytoscape.js (graphs)</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <h4 className="font-bold text-sm mb-2 text-purple-400">Backend</h4>
                                    <ul className="text-xs text-slate-400 space-y-1">
                                        <li>• FastAPI (Python)</li>
                                        <li>• PyTorch GNN</li>
                                        <li>• Risc0 zkVM</li>
                                        <li>• Web3.py</li>
                                    </ul>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <h4 className="font-bold text-sm mb-2 text-emerald-400">Contracts</h4>
                                    <ul className="text-xs text-slate-400 space-y-1">
                                        <li>• ResultAnchor.sol</li>
                                        <li>• ReputationOracle.sol</li>
                                        <li>• AgentRegistry.sol</li>
                                        <li>• Groth16Verifier.sol</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Comparison Table */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 mb-8"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Shield size={20} className="text-purple-400" />
                            Why PoEC Matters
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 text-slate-400 font-medium">Feature</th>
                                        <th className="text-center py-3 text-red-400 font-medium">Monad Today</th>
                                        <th className="text-center py-3 text-emerald-400 font-medium">Monad + PoEC</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { feature: 'Agent Trust Verification', today: 'Manual / None', poec: 'ZK-Verified' },
                                        { feature: 'Risk Detection', today: 'None', poec: 'GNN AI Analysis' },
                                        { feature: 'On-Chain Reputation', today: 'Not Available', poec: 'Anchored Proofs' },
                                        { feature: 'M2M Decision Making', today: 'Trust-Based', poec: 'Verifiable' },
                                        { feature: 'Fraud Prevention', today: 'Reactive', poec: 'Proactive AI' },
                                        { feature: 'x402 Integration', today: 'Basic', poec: 'Full Support' }
                                    ].map((row, i) => (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="py-3 text-slate-300">{row.feature}</td>
                                            <td className="py-3 text-center text-red-400/70">{row.today}</td>
                                            <td className="py-3 text-center text-emerald-400 flex items-center justify-center gap-1">
                                                <Check size={14} /> {row.poec}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                    {/* How It Works */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 mb-8"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Zap size={20} className="text-amber-400" />
                            How It Works
                        </h2>

                        <div className="space-y-6">
                            {[
                                {
                                    step: 1,
                                    title: 'Fetch Real Monad Data',
                                    desc: 'Connect to Monad RPC (public or your Alchemy endpoint) and fetch real transaction data for any agent address.'
                                },
                                {
                                    step: 2,
                                    title: 'Build Behavior Graph',
                                    desc: 'Construct a transaction graph where nodes are addresses and edges are value transfers, capturing the agent\'s economic behavior.'
                                },
                                {
                                    step: 3,
                                    title: 'GNN Risk Analysis',
                                    desc: 'Run a Graph Neural Network to detect anomalous patterns: circular trading, wash trading, rapid movement, structuring, etc.'
                                },
                                {
                                    step: 4,
                                    title: 'Generate ZK Proof',
                                    desc: 'Use Risc0 zkVM to generate a zero-knowledge proof that the GNN computation was performed correctly on the input data.'
                                },
                                {
                                    step: 5,
                                    title: 'Anchor to Monad',
                                    desc: 'Write the Merkle root and proof commitment to the ResultAnchor contract on Monad, making results immutable and verifiable.'
                                }
                            ].map((item) => (
                                <div key={item.step} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {item.step}
                                    </div>
                                    <div>
                                        <h4 className="font-bold mb-1">{item.title}</h4>
                                        <p className="text-sm text-slate-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Why PoEC - Differentiation */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                        className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-8 mb-8"
                    >
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="text-2xl">🤔</span>
                            Why PoEC, Not Arkham?
                        </h2>

                        <p className="text-slate-400 text-sm mb-6">
                            "Why not just use Arkham Entity Intelligence like Ethereum has?"
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                {
                                    title: 'Monad Has Nothing',
                                    desc: 'Arkham doesn\'t support Monad. We\'re building what Arkham is for Ethereum, but for Monad\'s agent economy.',
                                    icon: '🔴'
                                },
                                {
                                    title: 'Agent-to-Agent',
                                    desc: 'Arkham is for human analysts. PoEC is for autonomous agents making real-time M2M decisions.',
                                    icon: '🤖'
                                },
                                {
                                    title: 'On-Chain Verifiable',
                                    desc: 'Arkham gives you a score to trust. PoEC anchors proofs on-chain — smart contracts can verify.',
                                    icon: '⛓️'
                                },
                                {
                                    title: 'ZK Provable',
                                    desc: 'We don\'t just tell you the score. We prove we computed it correctly with zero-knowledge proofs.',
                                    icon: '🔐'
                                }
                            ].map((item, i) => (
                                <div key={i} className="p-4 rounded-xl bg-black/30 border border-white/5">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-lg">{item.icon}</span>
                                        <h4 className="font-bold text-sm">{item.title}</h4>
                                    </div>
                                    <p className="text-xs text-slate-400">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-sm text-emerald-400 font-medium">
                                💡 TL;DR: Arkham is entity intelligence for Ethereum humans. PoEC is <strong>provable trust infrastructure</strong> for Monad's x402 agent economy — on-chain verifiable, ZK-proven, and x402-native.
                            </p>
                        </div>
                    </motion.div>

                    {/* Links */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <a
                            href="https://github.com/kapish505/PoEC-v3"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-colors"
                        >
                            <Github size={18} />
                            View on GitHub
                        </a>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-medium transition-all"
                        >
                            <Zap size={18} />
                            Try It Now
                            <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </>
    );
}
