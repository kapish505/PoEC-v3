import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Cpu, Database, Link as LinkIcon, Layers, Network, ShieldCheck, Activity, FileSearch, Share2, GitMerge, Lock, Zap, Target, Eye, Code } from 'lucide-react';

export default function About() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-stone-200 font-sans selection:bg-purple-500/30">
            <Head>
                <title>About PoEC | Technical Architecture & Methodology</title>
            </Head>

            <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/10 bg-black/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest hidden md:block">
                        Technical Documentation
                    </span>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-20"
                >
                    <span className="text-purple-400 font-mono text-xs uppercase tracking-widest mb-4 block">x402 Hackathon Submission</span>
                    <h1 className="text-4xl md:text-6xl font-bold mb-8 text-white">Proof of Economic Crime</h1>
                    <p className="text-xl text-slate-400 leading-relaxed">
                        <strong className="text-white">PoEC</strong> is an AI-powered financial forensics platform that combines <span className="text-blue-400">Graph Neural Networks</span> with <span className="text-emerald-400">Blockchain Proof Anchoring</span> to detect financial anomalies and create mathematically verifiable, court-admissible evidence.
                    </p>
                </motion.div>


                <div className="space-y-24">

                    {/* Why This Matters */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-red-500/10 rounded-lg text-red-400 border border-red-500/20">
                                <Target size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Why This Matters</h2>
                        </div>

                        <div className="pl-4 border-l-2 border-red-500/20 space-y-6">
                            <p className="text-slate-400 leading-7">
                                <strong className="text-white">$4.7 trillion</strong> is lost globally to financial crime each year. Traditional forensic tools use static rules like "flag transactions over $10,000" — but sophisticated criminals easily bypass these with techniques like:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-[#111] rounded-lg border border-white/10">
                                    <h4 className="font-bold text-white mb-2">Smurfing</h4>
                                    <p className="text-xs text-slate-400">Splitting large sums into small transactions below reporting thresholds</p>
                                </div>
                                <div className="p-4 bg-[#111] rounded-lg border border-white/10">
                                    <h4 className="font-bold text-white mb-2">Circular Trading</h4>
                                    <p className="text-xs text-slate-400">A→B→C→A patterns to create fake volume or launder funds</p>
                                </div>
                                <div className="p-4 bg-[#111] rounded-lg border border-white/10">
                                    <h4 className="font-bold text-white mb-2">Collusion Rings</h4>
                                    <p className="text-xs text-slate-400">Groups trading exclusively with each other to evade detection</p>
                                </div>
                            </div>

                            <p className="text-slate-400 leading-7">
                                <strong className="text-emerald-400">PoEC solves this</strong> by analyzing the <em>shape</em> of the entire transaction network, not individual rows.
                            </p>
                        </div>
                    </section>


                    {/* Workflow in a Nutshell */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-white/5 rounded-lg text-white border border-white/10">
                                <Activity size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">System Architecture</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-[2.5rem] left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 -z-10"></div>

                            {[
                                { title: "1. Ingest", desc: "CSV Parsing & Graph Building", color: "blue" },
                                { title: "2. Vectorize", desc: "5D Node Feature Extraction", color: "indigo" },
                                { title: "3. Detect", desc: "GNN Inference (SAGEConv)", color: "purple" },
                                { title: "4. Prove", desc: "Merkle Tree + IPFS", color: "violet" },
                                { title: "5. Anchor", desc: "Ethereum Smart Contract", color: "emerald" }
                            ].map((step, i) => (
                                <div key={i} className="relative bg-[#0F0F0F] p-6 rounded-xl border border-white/10 text-center hover:-translate-y-1 transition-transform">
                                    <div className={`w-10 h-10 mx-auto bg-${step.color}-500 rounded-full flex items-center justify-center font-bold text-black mb-4 z-20 relative ring-4 ring-[#0a0a0a]`}>
                                        {i + 1}
                                    </div>
                                    <h3 className="font-bold text-white mb-1">{step.title}</h3>
                                    <span className="text-xs text-slate-500">{step.desc}</span>
                                </div>
                            ))}
                        </div>
                    </section>


                    {/* Section 1: The GNN Math */}
                    <section className="group">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                                <Cpu size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">1. Graph Neural Network Engine</h2>
                        </div>
                        <div className="pl-4 border-l-2 border-purple-500/20 space-y-6">
                            <p className="text-slate-400 leading-7">
                                At the core of PoEC is a <strong className="text-white">Graph Neural Network (GNN)</strong> built with PyTorch Geometric.
                                Unlike tabular models (Random Forest, XGBoost) that treat transactions as isolated rows, our GNN understands the <em>topology</em> of the financial network.
                            </p>

                            <div className="bg-[#111] p-6 rounded-xl border border-white/10 my-8">
                                <h3 className="text-white font-bold mb-4">Architecture Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="p-3 bg-black/30 rounded-lg">
                                        <span className="text-purple-400 font-bold">Model:</span>
                                        <span className="text-slate-400 ml-2">2× SAGEConv Layers → ReLU → Linear</span>
                                    </div>
                                    <div className="p-3 bg-black/30 rounded-lg">
                                        <span className="text-blue-400 font-bold">Framework:</span>
                                        <span className="text-slate-400 ml-2">PyTorch Geometric 2.x</span>
                                    </div>
                                    <div className="p-3 bg-black/30 rounded-lg col-span-2">
                                        <span className="text-emerald-400 font-bold">Node Features (5D):</span>
                                        <span className="text-slate-400 ml-2 font-mono">[in_degree, out_degree, total_sent, total_recv, tx_count]</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#111] p-6 rounded-xl border border-purple-500/20 my-8 font-mono text-sm text-slate-300">
                                <p className="mb-2 text-purple-400">{'// GraphSAGE Aggregation Formula'}</p>
                                <p className="mb-4">h<sub>v</sub><sup>(k)</sup> = σ(W · MEAN({'{'}h<sub>u</sub><sup>(k-1)</sup> : u ∈ N(v){'}'}) + B · h<sub>v</sub><sup>(k-1)</sup>)</p>
                                <p className="text-xs text-slate-500">Where N(v) is the neighborhood of node v, and σ is ReLU activation</p>
                            </div>

                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-white font-bold mb-3">Anomaly Detection Logic</h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    The GNN learns to encode nodes into low-dimensional embeddings. Anomalies are detected when:
                                </p>
                                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 font-mono text-sm">
                                    <span className="text-red-400 font-bold">Threshold:</span>
                                    <span className="text-slate-300 ml-2">anomaly_score {'>'} μ + 2σ</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Nodes with scores more than 2 standard deviations above mean are flagged as anomalous
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Detection Patterns */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                <Network size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">2. Detectable Anomaly Patterns</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-blue-500/20">
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/50 transition-colors">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Activity size={16} className="text-blue-400" /> CIRCULAR_TRADING</h3>
                                <p className="text-sm text-slate-400">
                                    Funds moving A → B → C → A. Creates artificial volume to manipulate markets or launder money with no net value transfer.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/50 transition-colors">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2"><GitMerge size={16} className="text-blue-400" /> WASH_TRADING</h3>
                                <p className="text-sm text-slate-400">
                                    Same entity trading with itself via intermediaries. Creates fake liquidity and manipulates price perception.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/50 transition-colors">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Layers size={16} className="text-blue-400" /> STRUCTURING (Smurfing)</h3>
                                <p className="text-sm text-slate-400">
                                    Fan-out / Fan-in patterns where large sums are split into micro-transactions to evade reporting thresholds, then consolidated.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/50 transition-colors">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Zap size={16} className="text-blue-400" /> RAPID_MOVEMENT</h3>
                                <p className="text-sm text-slate-400">
                                    Unusually fast movement of funds through multiple accounts in a short time window, characteristic of automated laundering.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Proof Generation */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-violet-500/10 rounded-lg text-violet-400">
                                <ShieldCheck size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">3. Cryptographic Proof Generation</h2>
                        </div>
                        <div className="pl-4 border-l-2 border-violet-500/20 space-y-6">
                            <p className="text-slate-400 leading-7">
                                Machine Learning findings are probabilistic. PoEC transforms them into <strong className="text-white">verifiable cryptographic proofs</strong> using Merkle trees.
                            </p>
                            <p className="text-slate-400 leading-7">
                                Each detected anomaly is hashed (SHA-256) and becomes a leaf in the Merkle tree. The tree structure enables anyone to verify a specific anomaly was part of the original analysis — without revealing the entire dataset.
                            </p>
                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-white font-bold mb-3">Proof Bundle Contents</h3>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 mt-2 rounded-full bg-purple-500"></span>
                                        <div>
                                            <strong className="text-white">Merkle Root:</strong>
                                            <span className="text-slate-400 ml-2">32-byte fingerprint of all anomalies</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 mt-2 rounded-full bg-blue-500"></span>
                                        <div>
                                            <strong className="text-white">Dataset Hash:</strong>
                                            <span className="text-slate-400 ml-2">SHA-256 of input CSV for integrity verification</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 mt-2 rounded-full bg-emerald-500"></span>
                                        <div>
                                            <strong className="text-white">Model Hash:</strong>
                                            <span className="text-slate-400 ml-2">SHA-256 of GNN weights for reproducibility</span>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-2 h-2 mt-2 rounded-full bg-amber-500"></span>
                                        <div>
                                            <strong className="text-white">IPFS CID:</strong>
                                            <span className="text-slate-400 ml-2">Full bundle stored on Pinata for decentralized access</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Blockchain Anchoring */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
                                <LinkIcon size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">4. On-Chain Anchoring</h2>
                        </div>
                        <div className="pl-4 border-l-2 border-amber-500/20 space-y-6">
                            <p className="text-slate-400 leading-7">
                                Proofs are anchored to <strong className="text-white">Ethereum Sepolia Testnet</strong> via the <code className="bg-black/30 px-2 py-1 rounded text-amber-400">ResultAnchor</code> smart contract.
                            </p>

                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-white font-bold mb-3">Smart Contract Functions</h3>
                                <div className="space-y-3 font-mono text-sm">
                                    <div className="p-3 bg-black/30 rounded-lg">
                                        <span className="text-emerald-400">anchorProof</span>
                                        <span className="text-slate-400">(taskId, merkleRoot, datasetHash, modelHash, bundleCID)</span>
                                    </div>
                                    <div className="p-3 bg-black/30 rounded-lg">
                                        <span className="text-blue-400">verifyProof</span>
                                        <span className="text-slate-400">(taskId) → (exists, timestamp, submitter)</span>
                                    </div>
                                    <div className="p-3 bg-black/30 rounded-lg">
                                        <span className="text-purple-400">verifyIntegrity</span>
                                        <span className="text-slate-400">(taskId, datasetHash, modelHash) → bool</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-slate-400 leading-7">
                                This creates an <strong className="text-emerald-400">immutable, timestamped audit trail</strong>. Any attempt to alter the evidence will break the cryptographic chain — making PoEC proofs suitable for regulatory compliance and legal proceedings.
                            </p>
                        </div>
                    </section>

                    {/* Section 5: Autonomous Agent Runtime */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                                <Share2 size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">5. x402 Autonomous Agent Runtime</h2>
                        </div>
                        <div className="pl-4 border-l-2 border-emerald-500/20 space-y-6">
                            <p className="text-slate-400 leading-7">
                                PoEC is more than just a tool—it's an <strong>autonomous financial security agent</strong> built on the <strong className="text-white">x402 standard</strong>. It operates continuously in the background, listening to transaction streams and executing the full forensic pipeline without human intervention.
                            </p>
                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-white font-bold mb-3">Automated x402 Workflow</h3>
                                <ol className="list-decimal list-inside text-slate-400 space-y-2 ml-4">
                                    <li><strong>Listen:</strong> Agent monitors bank APIs or blockchain mempools for new batches.</li>
                                    <li><strong>Analyze:</strong> Triggers GNN inference locally to score transaction graph topology.</li>
                                    <li><strong>Prove:</strong> Automatically builds Merkle proofs for high-risk anomalies.</li>
                                    <li><strong>Sign:</strong> Signs the proof bundle using the agent's secure private key.</li>
                                    <li><strong>Anchor:</strong> Submits the root hash to the `ResultAnchor` smart contract.</li>
                                    <li><strong>Audit:</strong> Verifies on-chain finality and logs the transaction hash.</li>
                                </ol>
                            </div>
                            <p className="text-slate-400 leading-7">
                                This enables <strong className="text-emerald-400">24/7 "Sleep-at-Night" security</strong>. The x402 agent handles the complexity of cryptography and blockchain interactions, leaving investigators with a clean, immutable audit trail of already-proven financial crimes.
                            </p>
                        </div>
                    </section>

                    {/* Section 6: Technology Stack */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-slate-800 rounded-lg text-slate-400">
                                <Code size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">6. Technology Stack</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                ["Frontend", "Next.js 14", "React 18", "Framer Motion"],
                                ["Visualization", "Cytoscape.js", "WebGL", "TailwindCSS"],
                                ["Backend", "FastAPI", "Python 3.11+", "NetworkX"],
                                ["AI/ML", "PyTorch Geometric", "SAGEConv", "Scikit-Learn"],
                                ["Database", "PostgreSQL", "SQLAlchemy", "Alembic"],
                                ["Blockchain", "Solidity 0.8.20", "Hardhat", "Ethers.js v6"],
                                ["Agent", "TypeScript", "Node.js", "Axios"],
                                ["Crypto", "SHA-256", "Merkle Trees", "ECDSA"]
                            ].map((stack, i) => (
                                <div key={i} className="p-4 bg-white/5 rounded-lg border border-white/10">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">{stack[0]}</h3>
                                    <ul className="space-y-1">
                                        {stack.slice(1).map((item, j) => (
                                            <li key={j} className="text-sm text-slate-300 border-b border-white/5 pb-1 last:border-0">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Section 7: Real-World Applications */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                                <FileSearch size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">7. Real-World Applications</h2>
                        </div>
                        <div className="pl-4 border-l-2 border-indigo-500/20 space-y-8">

                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-2">🏛️ Government Tax Fraud Detection</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    Analyze GST/VAT invoice networks to detect circular trading schemes, fake invoicing, and input tax credit fraud.
                                    Generate cryptographic proofs that are admissible in tax tribunals.
                                </p>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-500 border border-white/5">Government Audit</span>
                                    <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-500 border border-white/5">Regulatory Compliance</span>
                                </div>
                            </div>

                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-2">💰 DeFi Exploit Prevention</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Monitor on-chain transaction graphs to detect flash loan attacks, front-running,
                                    and wash trading before they materialize. Anchor detection events for dispute resolution.
                                </p>
                            </div>

                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-2">📦 Supply Chain Integrity</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Verify authenticity of supply chain transaction flows. Detect phantom vendors, circular procurement,
                                    and invoice duplication using graph topology analysis.
                                </p>
                            </div>

                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-2">🏦 Bank AML Compliance</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Detect money laundering patterns like smurfing and layering that evade traditional rule-based systems.
                                    Provide auditable proof for regulatory reporting.
                                </p>
                            </div>

                        </div>
                    </section>
                </div>

                <div className="mt-20 pt-10 border-t border-white/10 text-center">
                    <h3 className="text-2xl font-bold text-white mb-6">Ready to Try It?</h3>
                    <div className="flex justify-center gap-4 flex-wrap">
                        <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-purple-500/25">
                            Launch Dashboard <ArrowRight size={18} />
                        </Link>
                        <Link href="/agent_sim" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-all border border-white/10">
                            Try Agent Simulator
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
