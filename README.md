# 📊 Management Finance (LedgerAI Dashboard)

A robust, AI-powered financial dashboard designed to provide real-time analytics, cashflow forecasting, and anomaly detection. This project bridges the simplicity of spreadsheet data entry with enterprise-grade system architecture.

![Dashboard Preview](gallery/image.png)

---

## 🎯 Concept & Architecture

The LedgerAI Dashboard is built on a multi-tier microservices architecture. It abstracts the database layer (Google Sheets) behind a secure C# proxy, ensuring sensitive URLs and data logic are never exposed to the client.

### Stack Overview

1.  **Frontend (Next.js 14+ & React):**
    A high-fidelity, responsive UI built with Tailwind CSS, Framer Motion, and Recharts. It provides interactive charts, KPI cards (Cash Runway, Burn Rate), and a clean presentation of financial data.
2.  **API Gateway & Backend (C# ASP.NET Core):**
    Acts as the secure middleman. It fetches data from the raw data source, parses it natively, caches responses to improve performance, and implements Rate Limiting & CORS. **All sensitive endpoint URLs and tokens are securely managed here and completely hidden from the public frontend.**
3.  **AI Engine (Python FastAPI):**
    A dedicated microservice for machine learning tasks. It utilizes `Scikit-learn` and `Pandas` to process transactional data securely pulled from the C# backend.
    *   **Isolation Forest:** Detects anomalous/suspicious out-of-pattern expenses.
    *   **Linear Regression:** Predicts future cashflow and runway based on historical burn rates.

---

## 📸 Gallery

Here is a look at the various features and modules within the dashboard:

### Main Dashboard Overview
![Dashboard](gallery/dashboard.png)

### Buku Kas (Transactions)
![Buku Kas](gallery/bukuKas.png)

### Manajemen Piutang (Accounts Receivable)
![Piutang](gallery/piutang.png)

### AI-Powered Notifications & Anomalies
![Notifikasi AI](gallery/notifikasi.png)

---

## 🔒 Security & Privacy

This architecture was designed with security as a primary focus:
*   **Zero Client-Side Secrets:** The Next.js frontend never communicates directly with the database or external Google APIs. All requests go through the internal ASP.NET proxy.
*   **Data Masking:** Internal paths, Apps Script URLs, and spreadsheet IDs are strictly contained within backend environment configurations.
*   **DDoS Protection:** The C# backend implements strict Rate Limiting (`100 requests / 10s`) queueing.
*   **Caching:** In-memory caching mitigates redundant hits to the database layer, protecting API quotas while serving data instantly.

---

## 🚀 Getting Started (Local Development)

To run this project locally, you will need to start all three services perfectly. 

### Prerequisites
- Node.js (v18+)
- .NET 8.0 SDK
- Python 3.10+

### 1. Start the C# Backend
The C# backend acts as the main data provider on port `5000`.
```bash
cd backend
dotnet run
```

### 2. Start the Python AI Engine
The AI engine runs on port `8080` and communicates with the C# backend.
```bash
cd ai
# Ensure virtual environment is activated and dependencies (pandas, scikit-learn, fastapi) are installed
source venv/bin/activate
python main.py
```

### 3. Start the Next.js Frontend
The frontend runs on port `3000` and consumes both the `5000` and `8080` APIs.
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to view the application in action.
