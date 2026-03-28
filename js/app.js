/**
 * app.js - LedgerAI Frontend Logic
 * Menghubungkan UI Dashboard dengan C# Backend API
 */

const API_BASE_URL = 'http://localhost:5050/api';

async function fetchDashboardSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard/summary`);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        updateKPICards(data);
    } catch (error) {
        console.error("Gagal menarik data dari C# Backend:", error);
        document.getElementById('kpi-kas').innerText = 'Error';
    }
}

function updateKPICards(data) {
    // Format mata uang rupiah
    const formatRp = (angka) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    };

    // Update Kas & Runway
    document.getElementById('kpi-kas').innerText = formatRp(data.totalCash);
    document.getElementById('kpi-runway').innerText = data.cashRunwayMonths;

    // Update Piutang
    document.getElementById('kpi-piutang').innerText = formatRp(data.totalReceivables);
    document.getElementById('kpi-ar-count').innerText = data.arClientCount;

    // Status warning
    const arRiskBadge = document.getElementById('kpi-ar-risk');
    if (data.arClientCount > 5) {
        arRiskBadge.className = 'badge danger';
        arRiskBadge.innerText = 'High Risk';
    } else {
        arRiskBadge.className = 'badge success';
        arRiskBadge.innerText = 'Safe';
    }

    // Update Budget
    const budgetEl = document.getElementById('kpi-budget');
    const budgetStatusBadge = document.getElementById('kpi-budget-status');
    budgetEl.innerText = `${data.budgetUsedPercentage}%`;

    if (data.budgetUsedPercentage > 90) {
        budgetEl.className = 'kpi-value warning text-danger';
        budgetStatusBadge.className = 'badge danger';
        budgetStatusBadge.innerText = 'Over Budget Limit';
    } else {
        budgetEl.className = 'kpi-value text-success';
        budgetStatusBadge.className = 'badge success';
        budgetStatusBadge.innerText = 'On Track';
    }
}

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Coba hit API C# backend
    fetchDashboardSummary();
});
