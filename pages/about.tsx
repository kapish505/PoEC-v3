import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Cpu, Database, Link as LinkIcon, Layers, Network, ShieldCheck, Activity, FileSearch, Share2 } from 'lucide-react';

export default function About() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-stone-200 font-sans selection:bg-purple-500/30">
            <Head>
                <title>About PoEC | Technical Deep Dive</title>
            </Head>

            <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/10 bg-black/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest hidden md:block">
                        Technical Whitepaper
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
                    <span className="text-purple-400 font-mono text-xs uppercase tracking-widest mb-4 block">System Architecture</span>
                    <h1 className="text-4xl md:text-6xl font-bold mb-8 text-white">The Hybrid Neuro-Cryptographic Engine.</h1>
                    <p className="text-xl text-slate-400 leading-relaxed">
                        PoEC (Proof of Economic Crime) bridges the gap between opaque Deep Learning models and rigid legacy rule engines.
                        It employs a multi-layer detection and verification strategy to maximize recall while maintaining cryptographic provability.
                    </p>
                </motion.div>


                <div className="space-y-24">

                    {/* Workflow in a Nutshell */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-white/5 rounded-lg text-white border border-white/10">
                                <Activity size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Workflow in a Nutshell</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-[2.5rem] left-0 w-full h-0.5 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 -z-10"></div>

                            {[
                                { title: "1. Ingest", desc: "CSV parsing & Normalization", color: "blue" },
                                { title: "2. Vectorize", desc: "Node Feature Extraction", color: "indigo" },
                                { title: "3. Detect", desc: "GNN Inference", color: "purple" },
                                { title: "4. Prove", desc: "Merkle Tree Generation", color: "violet" },
                                { title: "5. Anchor", desc: "Blockchain Notarization", color: "emerald" }
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


                    {/* Section 1: The Math */}
                    <section className="group">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                                <Cpu size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">1. Geometric Deep Learning</h2>
                        </div>
                        <div className="pl-4 border-l-2 border-purple-500/20 space-y-6">
                            <p className="text-slate-400 leading-7">
                                At the core of PoEC is a <strong>Graph Autoencoder (GAE)</strong> built on PyTorch Geometric.
                                Unlike tabular models (Random Forest, XGBoost) that treat transactions as isolated rows, GAE understands the <em>topology</em> of the network.
                            </p>

                            <div className="bg-[#111] p-6 rounded-xl border border-white/10 my-8 font-mono text-sm text-slate-300">
                                <p className="mb-2 text-purple-400">{'// The Encoder'}</p>
                                <p className="mb-4">Z = GCN(X, A)</p>
                                <p className="mb-2 text-purple-400">{'// The Decoder'}</p>
                                <p>Â = σ(Z Z^T)</p>
                            </div>

                            <p className="text-slate-400 leading-7">
                                The model learns a low-dimensional embedding <code>Z</code> for every node. It then attempts to reconstruct the adjacency matrix <code>A</code>.
                                Financial crimes like <strong>Smurfing</strong> and <strong>Circular Trading</strong> create unnatural geometric distortions that are hard to compress.
                                The model fails to reconstruct these specific edges effectively, resulting in a high <strong>Reconstruction Error</strong>. This error becomes the "Anomaly Score".
                            </p>
                        </div>
                    </section>

                    {/* Section 2: Patterns */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                <Network size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">2. Detectable Topologies</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-blue-500/20">
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/50 transition-colors">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Activity size={16} className="text-blue-400" /> Circular Trading</h3>
                                <p className="text-sm text-slate-400">
                                    Funds moving A &rarr; B &rarr; C &rarr; A. This creates artificial volume to manipulate market sentiment or launder money without net value transfer.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/50 transition-colors">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Network size={16} className="text-blue-400" /> Dense Clusters</h3>
                                <p className="text-sm text-slate-400">
                                    Unnaturally high connectivity within a subgroup (Cliques). Often indicates botnets or collusion rings where members trade primarily with each other.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/50 transition-colors">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2"><Layers size={16} className="text-blue-400" /> Structuring (Smurfing)</h3>
                                <p className="text-sm text-slate-400">
                                    Fan-out / Fan-in patterns where large sums are split into micro-transactions to evade reporting thresholds, then consolidated later.
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
                                Machine Learning findings are statistically probabilistic. PoEC transforms them into <strong>verifiable cryptographic proofs</strong> using Merkle trees.
                            </p>
                            <p className="text-slate-400 leading-7">
                                Each anomaly is hashed and becomes a leaf in the Merkle tree. The tree structure allows anyone to verify that a specific anomaly was part of the original analysis without revealing the entire dataset.
                            </p>
                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-white font-bold mb-3">Proof Bundle Components:</h3>
                                <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                                    <li><strong>Merkle Root:</strong> 32-byte cryptographic fingerprint of all anomalies</li>
                                    <li><strong>Proof Paths:</strong> Individual verification paths for each anomaly</li>
                                    <li><strong>Dataset Hash:</strong> SHA-256 of input data for integrity</li>
                                    <li><strong>Model Hash:</strong> SHA-256 of GNN weights for reproducibility</li>
                                    <li><strong>Metadata:</strong> Timestamps, execution context, and task identifiers</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Agent Orchestration */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                                <Share2 size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">4. Autonomous Agent Workflow</h2>
                        </div>
                        <div className="pl-4 border-l-2 border-emerald-500/20 space-y-6">
                            <p className="text-slate-400 leading-7">
                                PoEC includes an <strong>x402-style agent runtime</strong> that automates the entire detection-to-anchoring pipeline without human intervention.
                            </p>
                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-white font-bold mb-3">Agent Capabilities:</h3>
                                <ol className="list-decimal list-inside text-slate-400 space-y-2 ml-4">
                                    <li>Acquire data from file systems or APIs</li>
                                    <li>Upload to PoEC backend and trigger analysis</li>
                                    <li>Build cryptographic proof bundles automatically</li>
                                    <li>Sign bundles with agent private keys</li>
                                    <li>Anchor Merkle roots to blockchain (Hardhat/Sepolia)</li>
                                    <li>Verify on-chain anchoring success</li>
                                </ol>
                            </div>
                            <p className="text-slate-400 leading-7">
                                This enables <strong>continuous monitoring</strong> where agents can process new transaction batches, generate proofs, and maintain an immutable audit trail without manual oversight.
                            </p>
                        </div>
                    </section>

                    {/* Section 5: Blockchain Anchoring */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
                                <LinkIcon size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">5. On-Chain Anchoring</h2>
                        </div>
                        <div className="pl-4 border-l-2 border-amber-500/20 space-y-6">
                            <p className="text-slate-400 leading-7">
                                The final step is anchoring the proof to an immutable ledger. PoEC uses the <strong>ResultAnchor</strong> smart contract to store:
                            </p>
                            <ul className="list-disc list-inside text-slate-400 space-y-2 ml-4">
                                <li><strong>Merkle Root:</strong> Fingerprint of all detected anomalies</li>
                                <li><strong>Dataset Hash:</strong> Input data integrity verification</li>
                                <li><strong>Model Hash:</strong> GNN version used for detection</li>
                                <li><strong>Bundle CID:</strong> IPFS or local storage reference</li>
                                <li><strong>Submitter Address:</strong> Agent or auditor identity</li>
                            </ul>
                            <p className="text-slate-400 leading-7">
                                This creates a mathematically impossible to tamper with audit trail. Any attempt to alter the evidence or logs will break the cryptographic chain.
                            </p>
                        </div>
                    </section>

                    {/* Section 6: Stack */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-slate-800 rounded-lg text-slate-400">
                                <Database size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">6. Technology Stack</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                ["Frontend", "Next.js 14", "React", "TailwindCSS"],
                                ["Visualization", "Cytoscape.js", "WebGL", "Framer Motion"],
                                ["Backend", "FastAPI", "Python 3.13", "NetworkX"],
                                ["AI Core", "PyTorch Geometric", "Pandas", "Scikit-Learn"],
                                ["Database", "SQLite/PostgreSQL", "SQLAlchemy", "Alembic"],
                                ["Blockchain", "Solidity", "Hardhat", "Ethers.js v6"],
                                ["Agent Runtime", "TypeScript", "Node.js", "Axios"],
                                ["Cryptography", "MerkleTools", "SHA-256", "ECDSA Signing"]
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

                    {/* Section 7: Use Cases */}
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                                <FileSearch size={24} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">7. Real-World Applications</h2>
                        </div>
                        <div className="pl-4 border-l-2 border-indigo-500/20 space-y-8">

                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-2">Tax Fraud Detection</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                    Analyze GST/VAT invoice networks to detect circular trading schemes, fake invoicing, and input tax credit fraud.
                                    Generate cryptographic proofs admissible in tax tribunals.
                                </p>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-500 border border-white/5">Government Audit</span>
                                    <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-500 border border-white/5">Compliance</span>
                                </div>
                            </div>

                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-2">DeFi Exploit Prevention</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Monitor on-chain transaction graphs in real-time to detect flash loan attacks, front-running,
                                    and wash trading before they materialize. Anchor detection events on-chain for dispute resolution.
                                </p>
                            </div>

                            <div className="bg-[#111] p-6 rounded-xl border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-2">Supply Chain Integrity</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Verify authenticity of supply chain transaction flows. Detect phantom vendors, circular procurement,
                                    and invoice duplication using graph topology analysis.
                                </p>
                            </div>

                        </div>
                    </section>
                </div>

                <div className="mt-20 pt-10 border-t border-white/10 text-center">
                    <h3 className="text-2xl font-bold text-white mb-6">Ready to deploy?</h3>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-purple-500/25">
                        Launch Dashboard <ArrowRight size={18} />
                    </Link>
                </div>
            </main>
        </div>
    );
}
