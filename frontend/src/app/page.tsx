"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { KPICard } from "@/components/dashboard/KPICard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { ARAgingChart } from "@/components/dashboard/ARAgingChart";
import { BudgetChart } from "@/components/dashboard/BudgetChart";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import { TransactionPreview } from "@/components/dashboard/TransactionPreview";
import { AIAlertToast } from "@/components/dashboard/AIAlertToast";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { InvoicesTable } from "@/components/dashboard/InvoicesTable";
import { BudgetTable } from "@/components/dashboard/BudgetTable";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import type { DashboardSummary, Transaction, Invoice, Budget } from "@/types/models";
import {
  Wallet, Building2, TrendingDown, Activity, BarChart3, BrainCircuit,
  RefreshCw, AlertTriangle, Clock
} from "lucide-react";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sum, txs, invs, budgs] = await Promise.all([
        api.getSummary(),
        api.getTransactions(),
        api.getInvoices(),
        api.getBudgets(),
      ]);
      setSummary(sum);
      setTransactions(txs);
      setInvoices(invs);
      setBudgets(budgs);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fmt = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  // Sparkline helpers
  const buildSparkline = (txs: Transaction[], type: 'Masuk' | 'Keluar' | 'all'): number[] => {
    const filtered = type === 'all' ? txs : txs.filter(t => t.tipe === type);
    const grouped: Record<string, number> = {};
    filtered.forEach(tx => {
      const d = tx.tanggal.split('T')[0];
      grouped[d] = (grouped[d] || 0) + tx.nominal;
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  };

  const totalExpenses = transactions.filter(t => t.tipe === 'Keluar').reduce((s, t) => s + t.nominal, 0);
  const totalIncome = transactions.filter(t => t.tipe === 'Masuk').reduce((s, t) => s + t.nominal, 0);
  const budgetUsageAvg = budgets.length > 0
    ? budgets.reduce((s, b) => s + (b.anggaranBulanan > 0 ? (b.terpakai / b.anggaranBulanan) * 100 : 0), 0) / budgets.length
    : 0;

  const renderDashboard = () => {
    if (loading && !summary) return <DashboardSkeleton />;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* ====== 6 KPI CARDS ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard
            title="Total Kas"
            value={summary ? fmt(summary.totalCash) : 'Rp 0'}
            icon={<Wallet size={20} />}
            accentColor="#38bdf8"
            trend={{ value: "+5.2%", isPositive: true }}
            sparklineData={buildSparkline(transactions, 'all')}
            statusColor="green"
          />
          <KPICard
            title="Total Piutang"
            value={summary ? fmt(summary.totalReceivables) : 'Rp 0'}
            icon={<Building2 size={20} />}
            accentColor="#a78bfa"
            subtitle={`${invoices.filter(i => i.statusPembayaran === 'Belum Lunas').length} belum lunas`}
            sparklineData={invoices.map(i => i.nilaiInvoice)}
            statusColor={invoices.some(i => {
              const due = new Date(i.tanggalJatuhTempo);
              return i.statusPembayaran === 'Belum Lunas' && due < new Date();
            }) ? 'amber' : 'green'}
          />
          <KPICard
            title="Total Pengeluaran"
            value={fmt(totalExpenses)}
            icon={<TrendingDown size={20} />}
            accentColor="#f87171"
            trend={{ value: "-3.1%", isPositive: true }}
            sparklineData={buildSparkline(transactions, 'Keluar')}
          />
          <KPICard
            title="Burn Rate"
            value={summary ? fmt(summary.burnRate) : 'Rp 0'}
            icon={<BarChart3 size={20} />}
            accentColor="#fb923c"
            subtitle="Rata-rata pengeluaran bulanan"
            statusColor={summary && summary.burnRate > totalIncome ? 'red' : 'green'}
          />
          <KPICard
            title="Cash Runway"
            value={summary ? `${summary.cashRunwayMonths.toFixed(1)} Bln` : '0 Bln'}
            icon={<Activity size={20} />}
            accentColor="#22d3ee"
            subtitle={summary && summary.cashRunwayMonths < 3 ? "⚠ Kritis!" : "Runway aman"}
            statusColor={summary && summary.cashRunwayMonths < 3 ? 'red' : summary && summary.cashRunwayMonths < 6 ? 'amber' : 'green'}
          />
          <KPICard
            title="Realisasi Anggaran"
            value={`${budgetUsageAvg.toFixed(0)}%`}
            icon={<BrainCircuit size={20} />}
            accentColor="#34d399"
            subtitle={`${budgets.filter(b => b.terpakai > b.anggaranBulanan).length} dept over-budget`}
            sparklineData={budgets.map(b => b.terpakai)}
            statusColor={budgetUsageAvg > 90 ? 'red' : budgetUsageAvg > 75 ? 'amber' : 'green'}
          />
        </div>

        {/* ====== REVENUE VS EXPENSE ====== */}
        <RevenueExpenseChart />

        {/* ====== CASH FLOW + AR AGING ====== */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2"><CashFlowChart /></div>
          <div className="xl:col-span-1"><ARAgingChart /></div>
        </div>

        {/* ====== BUDGET + RECENT TRANSACTIONS ====== */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <BudgetChart />
          <TransactionPreview onViewAll={() => setActiveTab('cashflow')} />
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'cashflow':
        return <TransactionsTable />;
      case 'invoices':
        return <InvoicesTable />;
      case 'budgets':
        return <BudgetTable />;
      default:
        return <div />;
    }
  };

  const titles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard Keuangan', subtitle: 'Analitik real-time dari Google Sheets — Powered by AI' },
    cashflow: { title: 'Buku Kas', subtitle: 'Riwayat transaksi dan arus kas perusahaan' },
    invoices: { title: 'Piutang Klien', subtitle: 'Manajemen tagihan dan piutang usaha' },
    budgets: { title: 'Anggaran Departemen', subtitle: 'Perencanaan dan realisasi anggaran per departemen' },
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-y-auto w-full">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* Header */}
          <header className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 lg:ml-0 ml-12">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{titles[activeTab]?.title}</h2>
              <p className="text-text-muted text-sm mt-1">{titles[activeTab]?.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && !loading && (
                <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <Clock size={12} />
                  {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {loading && (
                <div className="flex items-center gap-2 text-accent-blue bg-accent-blue/8 px-3 py-1.5 rounded-full border border-accent-blue/15">
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] font-medium">Memuat data...</span>
                </div>
              )}
              {activeTab === 'dashboard' && (
                <button onClick={fetchAll} className="btn btn-ghost btn-sm">
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
              )}
            </div>
          </header>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/8 border border-red-500/20 flex items-start gap-4 animate-fade-in">
              <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h4 className="text-red-400 font-semibold text-sm">Koneksi API Error</h4>
                <p className="text-red-300/70 text-sm mt-1">{error}</p>
                <p className="text-red-300/50 text-xs mt-2">Pastikan C# Backend (5050) & Python AI (8000) sedang berjalan.</p>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="pb-24 lg:pb-8">{renderContent()}</div>
          <AIAlertToast />
        </div>
      </main>
    </div>
  );
}
