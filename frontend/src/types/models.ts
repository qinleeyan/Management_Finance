// TypeScript models mirroring C# backend models + Google Sheets row index

export interface DashboardSummary {
    totalCash: number;
    totalReceivables: number;
    arClientCount: number;
    burnRate: number;
    cashRunwayMonths: number;
    budgetUsedPercentage: number;
}

export interface Transaction {
    tanggal: string;
    keterangan: string;
    kategori: string;
    tipe: string;          // "Masuk" | "Keluar"
    nominal: number;
    _rowIndex?: number;    // For update/delete via Apps Script
}

export interface Invoice {
    id: string;
    namaKlien: string;
    nilaiInvoice: number;
    tanggalTagihan: string;
    tanggalJatuhTempo: string;
    statusPembayaran: string;
    kontakKlien?: string;
    keterangan?: string;
    _rowIndex?: number;
}

export interface Budget {
    departemen: string;
    kategori: string;
    anggaranBulanan: number;
    terpakai: number;
    persentaseTerpakai?: string;
    keterangan?: string;
    _rowIndex?: number;
}

// Computed types for charts
export interface CashFlowDataPoint {
    date: string;
    masuk: number;
    keluar: number;
    saldo: number;
}

export interface ARAgingBucket {
    name: string;
    value: number;
    color: string;
}

export interface BudgetUsageItem {
    name: string;
    used: number;
    limit: number;
    percent: number;
}
