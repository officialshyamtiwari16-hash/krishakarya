# 🌾 Krishakarya (कृषककार्य)

> **The Unified Digital Agriculture Ecosystem for Modern Farmers Across Bharat**

Krishakarya is a production-ready agricultural web application and platform designed to empower Indian farmers, farm laborers (Sahyogis), and agricultural machinery owners. It connects the agricultural community with on-demand farm labor, tractor and equipment rentals, a digital financial ledger (Kisan Khatabook), real-time hyper-local weather advisories, and an AI-powered agronomy advisor (Krishak A.I).

---

## ✨ Core Features

- 🚜 **On-Demand Machinery Rentals**: Rent or list tractors, combine harvesters, rotavators, drone sprayers, laser land levelers, and seed drills with hourly, daily, and acreage pricing models.
- 🧑‍🌾 **Sahyogi Farm Labor Directory**: Find verified agricultural workers and specialists (transplanting, weeding, harvesting, spraying, machinery operators) with transparent wage rates.
- 📖 **Kisan Khatabook (Digital Farm Ledger)**: Track farm expenses, crop sales income, labor wages, machinery rental costs, and diesel expenses with real-time financial balances and summaries.
- 🌦️ **Live Weather & Crop Advisory**: Hyper-local GPS & IP-based weather forecasts, agricultural decision alerts (spraying windows, irrigation recommendations, harvesting safety), and voice narration.
- 🤖 **Krishak A.I & Modern Diagnostics**: AI-powered crop advisory providing tailored solutions for seed calculations, fertilizer dosage (Urea, DAP, NPK, Nano Urea), crop pathology, pest control, and government subsidies.
- 📅 **Farm Calendar & Bookings Manager**: Schedule operations, accept or decline rental requests, and automatically sync completed work with the Kisan Khatabook.
- 🔒 **Zero-Trust Security & Firebase Sync**: End-to-end synchronization with Cloud Firestore with strict document security rules and client-side fallback persistence.
- 📱 **Progressive Web App (PWA) & Chrome Shortcut**: Installable directly on Android and desktop with offline support and custom icon branding.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (animations), Lucide React (icons), Recharts (data visualization)
- **Backend**: Node.js, Express, TypeScript (`tsx`), `esbuild`
- **Database & Auth**: Firebase Firestore & Firebase Authentication
- **AI Engine**: Google Gen AI SDK (`@google/genai` - Gemini 3.7 Flash)
- **Tooling**: Vite 6, Sharp (icon generation)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) (bundled with Node.js)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/krishakarya.git
   cd krishakarya
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Provide your Gemini API key (optional for local fallback mode):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 📦 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the full-stack Express + Vite development server |
| `npm run build` | Generates icons, builds the Vite production frontend, and bundles the Express server with esbuild |
| `npm start` | Launches the compiled production server (`dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run preview` | Previews the built production frontend |

---

## 🔐 Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for live AI agronomy chat and crop diagnostics. (If unset, intelligent local agricultural fallbacks are used) |
| `APP_URL` | Optional | The base URL where the application is deployed |

---

## 📄 License

This project is licensed under the MIT License.
