# Axon AI – Intelligent Dashboard & Generative Video Platform

![Axon AI Banner](https://img.shields.io/badge/Axon%20AI-Platform-6C63FF?style=for-the-badge&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![NVIDIA NIM](https://img.shields.io/badge/NVIDIA%20NIM-76B900?style=for-the-badge&logo=nvidia&logoColor=white)

Axon AI is a commercial-grade, full-stack intelligence platform that connects every data source across your organization, surfaces real-time insights, monitors AI models, and automates video and report generation.

---

## ✨ Key Features

- **📊 Real-time Executive Dashboards**: Drag-and-drop dashboard builder with sub-second data refresh rates and 80+ chart visualizations.
- **🤖 AI Model Monitoring**: Real-time tracking of accuracy, model drift, latency, and token consumption across Llama 3.3 70B, DeepSeek R1, and custom neural endpoints.
- **⚡ Pipeline Orchestration**: Visual no-code & pro-code pipeline builder for ETL, ML inference, and automated webhook triggers.
- **🎥 AI Video & Multimodal Studio**: Cinematic video generation powered by NVIDIA Cosmos, custom neural voice cloning, multi-track audio mixing with auto-ducking, and kinetic subtitles.
- **💬 Natural Language Data Queries**: Ask ad-hoc business questions in plain English; Axon translates prompts into SQL queries and generates explanatory visual charts automatically.
- **🔔 Anomaly Detection**: Statistical and ML-driven alert triggers delivered straight to Slack, email, or webhooks when metrics breach custom thresholds.
- **📄 Automated PDF/HTML Reporting**: Scheduled white-label report creation with automated delivery cadences.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Space Grotesk & Inter Typography, Lucide React Icons
- **Build System**: Vite, Esbuild (CJS production bundling)
- **Backend / API**: Node.js & Express proxy server
- **AI Acceleration**: NVIDIA NIM Microservices (Llama 3.3 70B Instruct, DeepSeek R1, Cosmos Multimodal, NeMo Guardrails)
- **Deployment**: Production Docker & Cloud Run container compatible

---

## 🚀 Quickstart Guide

### Prerequisites

- Node.js `v18+` or `v20+`
- npm or bun

### 1. Clone the Repository

```bash
git clone https://github.com/Tee808-bigD/AI-dash.git
cd AI-dash
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure your NVIDIA NIM API key:
```env
NVIDIA_API_KEY=nvapi-...
```

### 4. Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 📦 Production Build & Deployment

To compile the single-page web app and CJS production server bundle:

```bash
# Build Vite client assets and esbuild server bundle
npm run build

# Launch production server
npm start
```

---

## 📁 Repository Structure

```
.
├── index.html                  # HTML entry point with Space Grotesk & Inter typography
├── metadata.json               # Platform configuration metadata
├── server.ts                   # Express server entry point & NVIDIA NIM API proxy routes
├── src/
│   ├── App.tsx                 # Main application state & view router
│   ├── index.css               # Tailwind CSS declarations & marquee keyframes
│   ├── types.ts                # TypeScript interfaces & metric definitions
│   ├── models-data.ts          # Catalog of available NVIDIA NIM models
│   └── components/
│       ├── DashboardLayout.tsx # Main Axon AI topbar, hero, feature grid, and workspace tabs
│       ├── Overview.tsx        # System status & catalog overview
│       ├── VideoStudio.tsx     # Cinematic AI video studio & timeline editor
│       ├── MultimodalHub.tsx   # Code generation & vision playground
│       ├── ModelPlayground.tsx # Real-time prompt testing & parameter tuner
│       ├── ChatAssistants.tsx  # Multi-role AI chat assistants
│       ├── AnalyticsView.tsx   # Historical telemetry logs & latency metrics
│       └── SettingsView.tsx    # API key manager & environment controls
└── README.md
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
