import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Activity, BarChart3, Shield, Info, Zap, Circle, Loader } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================================================
// Backend Status Hook
// ============================================================================

function useBackendStatus() {
    const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking');

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/health`, { method: 'GET' });
                setStatus(res.ok ? 'online' : 'offline');
            } catch {
                setStatus('offline');
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    return status;
}

// ============================================================================
// Navbar Component
// ============================================================================

interface NavLinkProps {
    href: string;
    icon: ReactNode;
    label: string;
    isActive: boolean;
}

function NavLink({ href, icon, label, isActive }: NavLinkProps) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive
                    ? 'bg-white/10 text-white shadow-lg shadow-blue-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}

function StatusIndicator({ status }: { status: 'online' | 'offline' | 'checking' }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 border border-white/10">
            {status === 'checking' ? (
                <Loader size={12} className="animate-spin text-slate-400" />
            ) : (
                <Circle
                    size={8}
                    fill={status === 'online' ? '#10b981' : '#ef4444'}
                    className={status === 'online' ? 'text-emerald-500' : 'text-red-500'}
                />
            )}
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {status === 'checking' ? 'Checking' : status === 'online' ? 'Online' : 'Offline'}
            </span>
        </div>
    );
}

// ============================================================================
// Layout Component
// ============================================================================

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const router = useRouter();
    const backendStatus = useBackendStatus();
    const currentPath = router.pathname;

    const navItems = [
        { href: '/dashboard', icon: <BarChart3 size={16} />, label: 'Dashboard' },
        { href: '/verify', icon: <Shield size={16} />, label: 'Verify' },
        { href: '/about', icon: <Info size={16} />, label: 'About' },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Premium Floating Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between h-14 px-6 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                                <Zap size={18} className="text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-white tracking-tight">PoEC</span>
                                <span className="text-[9px] text-slate-500 font-medium uppercase tracking-widest">
                                    Proof of Economic Computation
                                </span>
                            </div>
                        </Link>

                        {/* Navigation Links */}
                        <div className="flex items-center gap-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.href}
                                    href={item.href}
                                    icon={item.icon}
                                    label={item.label}
                                    isActive={currentPath === item.href}
                                />
                            ))}
                        </div>

                        {/* Status Indicator */}
                        <StatusIndicator status={backendStatus} />
                    </div>
                </div>
            </nav>

            {/* Page Content with padding for navbar */}
            <main className="pt-24">
                {children}
            </main>

            {/* Subtle gradient background effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
            </div>
        </div>
    );
}
