import type { DashboardSummary, Transaction, Invoice, Budget } from '@/types/models';

const API_BASE = 'http://localhost:5050/api/dashboard';
const AI_BASE = 'http://localhost:8000/api/ai';
const SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx_jknYHASzCySSghMhlCqMOjjSokju1OotS2QWVT_rdSCP9r3kewqNMJKXLpHCIzQfLQ/exec';

async function fetchJson<T>(endpoint: string | Response, base: string = API_BASE): Promise<T> {
    let res: Response;
    if (typeof endpoint === 'string') {
        res = await fetch(`${base}/${endpoint}`);
    } else {
        res = endpoint; // Assume endpoint is already a Response object
    }

    if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

export const api = {
    // C# Backend Calls (Reads)
    getSummary: () => fetchJson<DashboardSummary>('summary'),
    getTransactions: () => fetchJson<Transaction[]>('transactions'),
    getInvoices: () => fetchJson<Invoice[]>('invoices'),
    getBudgets: () => fetchJson<Budget[]>('budgets'),

    // Python AI Calls
    getForecast: (days = 30) => fetchJson<any>(`forecast?days=${days}`, AI_BASE),
    getAnomalies: () => fetchJson<any>('anomalies', AI_BASE),

    // Backend API Calls (Writes/Mutations via Proxy)
    mutateSheet: async (action: 'create' | 'update' | 'delete', sheetName: string, data?: any, rowIndex?: number) => {
        const payload = { action, sheet: sheetName, rowIndex, data };
        const res = await fetch(`${API_BASE}/mutate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await fetchJson<any>(res);
    }
};
