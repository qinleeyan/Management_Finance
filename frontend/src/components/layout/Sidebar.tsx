// src/components/layout/Sidebar.tsx
"use client";

import {
    LayoutDashboard, WalletCards, FileSpreadsheet, BarChart3,
    Settings, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const NAV = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'cashflow', icon: WalletCards, label: 'Buku Kas' },
    { id: 'invoices', icon: FileSpreadsheet, label: 'Piutang' },
    { id: 'budgets', icon: BarChart3, label: 'Anggaran' },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-[240px] h-screen border-r border-[var(--glass-border)] bg-[var(--bg-secondary)] shrink-0 relative overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-[var(--color-accent-teal)] opacity-[0.03] blur-3xl" />
                <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-[var(--color-accent-violet)] opacity-[0.03] blur-3xl" />

                {/* Logo */}
                <div className="px-6 py-6 flex items-center gap-3 relative z-10">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Zap size={18} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-extrabold tracking-tight text-white">
                            Ledger<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]">AI</span>
                        </h1>
                        <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.15em]">Enterprise</p>
                    </div>
                </div>

                {/* Nav Label */}
                <div className="px-6 pt-4 pb-2">
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em]">Menu</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 relative z-10">
                    {NAV.map(item => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 group relative overflow-hidden ${isActive
                                        ? 'text-white'
                                        : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/[0.03]'
                                    }`}
                            >
                                {/* Active background */}
                                {isActive && (
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[rgba(6,182,212,0.1)] to-[rgba(139,92,246,0.06)] border border-[rgba(6,182,212,0.12)]" />
                                )}
                                {/* Active left indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-[#06b6d4] to-[#8b5cf6]" />
                                )}
                                <Icon size={18} className={`relative z-10 ${isActive ? 'text-[#22d3ee]' : ''}`} />
                                <span className="relative z-10 font-semibold">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-3 relative z-10">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-all">
                        <Settings size={18} />
                        <span>Settings</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[var(--bg-secondary)]/95 backdrop-blur-xl border-t border-[var(--glass-border)]">
                <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
                    {NAV.map(item => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-300 ${isActive
                                        ? 'text-[#22d3ee]'
                                        : 'text-[var(--text-muted)]'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute -top-0 w-8 h-0.5 rounded-full bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]" />
                                )}
                                <Icon size={20} />
                                <span className="text-[10px] font-semibold">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
