// src/components/dashboard/AIAlertToast.tsx
"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, X, BrainCircuit } from 'lucide-react';
import { api } from '@/lib/api';

interface Anomaly {
    date: string;
    keterangan: string;
    nominal: number;
    kategori: string;
    reason: string;
}

export function AIAlertToast() {
    const [isVisible, setIsVisible] = useState(false);
    const [anomaly, setAnomaly] = useState<Anomaly | null>(null);

    useEffect(() => {
        // Fetch actual ML anomalies from Python AI service
        api.getAnomalies()
            .then((res) => {
                if (res.status === 'success' && res.anomalies.length > 0) {
                    setAnomaly(res.anomalies[0]);

                    // Show nicely after page load
                    setTimeout(() => setIsVisible(true), 2000);
                }
            })
            .catch(err => console.error("Failed to load anomalies", err));
    }, []);

    if (!isVisible || !anomaly) return null;

    return (
        <div className="fixed bottom-6 right-6 max-w-sm w-full bg-[#1c0f13] border border-accent-red/40 rounded-xl shadow-[0_10px_40px_rgba(248,113,113,0.15)] overflow-hidden z-50 transform transition-all duration-500 translate-y-0 scale-100">

            <div className="bg-gradient-to-r from-red-500/20 to-transparent p-4 flex gap-4">
                <div className="flex-shrink-0 relative">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-accent-red border border-red-500/30">
                        <AlertTriangle size={20} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-bg-secondary rounded-full flex items-center justify-center">
                        <BrainCircuit size={12} className="text-accent-pink" />
                    </div>
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white mb-1 tracking-tight">AI Anomaly Detected</h4>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-text-muted hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <p className="text-xs text-red-100/80 leading-relaxed">
                        <strong className="text-accent-red">Z-Score Alert:</strong> {anomaly.reason}
                    </p>
                    <p className="text-[10px] text-red-200/50 mt-1">
                        Date: {anomaly.date} | Transaction: {anomaly.keterangan}
                    </p>

                    <div className="mt-3 flex gap-2">
                        <button className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-accent-red border border-red-500/30 text-xs font-semibold rounded-md transition-colors">
                            Investigate
                        </button>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="px-3 py-1.5 bg-[var(--glass-bg)] hover:bg-[rgba(255,255,255,0.1)] text-text-secondary text-xs font-medium rounded-md transition-colors"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
