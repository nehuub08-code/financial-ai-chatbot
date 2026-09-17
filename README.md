# Personal Finance Advisor Bot 🪙

A friendly, modern, and privacy-conscious personal finance companion built to help individuals, freelancers, students, and families track income, understand spending, set realistic budgets, and make confident daily spending decisions without stress or complex financial jargon.

---

## ✨ Key Features

### 1. 📊 Holistic Financial Dashboard
- **Real-Time Balance Overview**: Instant visibility into total income, monthly expenses, current savings rate, and disposable comfort cushion.
- **Budget Health Tracking**: Visual progress bars and status badges (Safe, Approaching Limit, Exceeded) for each spending category.
- **Recent Activity Ledger**: Quick overview of recent transactions with category badges and contextual notes.

### 2. 💬 Interactive AI Finance Companion
- **Conversational Queries**: Ask natural questions like:
  - *"How much did I spend on food this month?"*
  - *"Am I saving enough for my emergency fund?"*
  - *"Where is most of my money going?"*
- **Voice Input & Speech Output**: Integrated Web Speech API for hands-free voice dictation and warm audio read-aloud responses.
- **Hybrid Intelligence**: Powered by Google Gemini (`gemini-2.5-flash`) with deterministic rule-based heuristic fallbacks ensuring 100% uptime even if offline or unauthenticated.

### 3. 🔮 "What-If" Purchase Simulator
- Test hypothetical purchases *before* spending (e.g., *"Can I spend ₹3,500 on a jacket?"*).
- Calculates the exact impact on your monthly savings cushion and category budget.
- Delivers a 3-part constructive breakdown:
  1. **Direct Answer**: Safe, tight, or over-budget assessment.
  2. **Financial Impact**: Real rupee change to your savings.
  3. **Actionable Alternative**: Practical trade-offs to keep you on track.
- **One-Click Commitment**: Directly convert the simulated purchase into a real tracked expense with a single tap.

### 4. 💰 Income & Expense Management
- **Multi-Source Income**: Track monthly salary, freelance gigs, investments, and side hustles.
- **Categorized Expenses**: Tag expenses across Rent, Food, Transport, Bills, Entertainment, Shopping, Healthcare, and Education.
- **Full CRUD Support**: Add, view, edit, and delete transactions with immediate balance recalculations.

### 5. 🎯 Smart Budgeting & Savings Goals
- **Adaptive 50/30/20 Framework**: Automatically generates a balanced budget tailored to your declared income and spending habits.
- **Customizable Envelopes**: Adjust category limits with real-time feedback on your remaining buffer.
- **Dedicated Goal Progress**: Set target amounts and deposit funds incrementally toward an Emergency Fund, Travel, or Major Purchase.

### 6. 📅 Monthly Summary & Actionable Insights
- **Plain-Language Recaps**: Human-readable narrative summarizing where your money went, top spending drivers, and month-over-month savings.
- **Tailored Recommendations**: 3 targeted, actionable tips refreshed each month to improve financial health.

---

## 🛠️ Tech Stack

- **Frontend**:
  - React 18 (Functional components with Hooks)
  - Vite (Fast development and optimized production bundling)
  - Tailwind CSS (Modern responsive utility styling with Plus Jakarta Sans typography)
  - Lucide React (Clean vector iconography)
  - Web Speech API (SpeechRecognition & SpeechSynthesis for voice interaction)
- **Backend**:
  - Node.js & Express (TypeScript)
  - esbuild (Compiles server to standalone CommonJS bundle `dist/server.cjs`)
  - Google Gemini API (`@google/genai` TypeScript SDK)
  - Local JSON persistence store (`data_store.json`) with in-memory fallback
- **Security & Architecture**:
  - Full-stack client/server isolation (API keys never exposed to browser)
  - Session token bearer authentication
  - Container-ready setup bound to `0.0.0.0:3000`

---

## 📁 Project Structure

```text
├── BRAIN.md                 # Intelligence specifications, financial heuristics & companion architecture
├── README.md                # Project documentation, quickstart & API overview
├── index.html               # Main HTML entry point with metadata & fonts
├── metadata.json            # AI Studio applet configuration & permissions
├── package.json             # NPM dependencies, dev, build, and start scripts
├── server.ts                # Express API server, Gemini client, heuristics & persistence
├── tsconfig.json            # TypeScript compiler configuration
├── vite.config.ts           # Vite frontend configuration
└── src/
    ├── App.tsx              # Main routing and global layout container
    ├── main.tsx             # React DOM mounting entry point
    ├── index.css            # Tailwind CSS imports & global design tokens
    ├── types.ts             # Shared TypeScript models (User, Expense, Income, Budget, Goal)
    ├── context/
    │   └── AuthContext.tsx  # Authentication, transaction state, notifications, and active session
    ├── services/
    │   └── api.ts           # Type-safe client-side HTTP communication layer
    ├── components/
    │   ├── Navbar.tsx       # Responsive top navigation with status indicators
    │   └── FinanceCompanionModal.tsx # Full-featured voice & text companion modal
    └── pages/
        ├── AuthPage.tsx     # Sign In, Registration & 1-Click Demo Login
        ├── OnboardingPage.tsx # 3-step conversational financial intake questionnaire
        ├── DashboardPage.tsx # Core financial overview & category gauges
        ├── IncomePage.tsx   # Income sources ledger & modal editor
        ├── ExpensesPage.tsx # Transaction history, filtering & categorization
        ├── BudgetPage.tsx   # Category limits & budget adjustment tools
        ├── SavingsPage.tsx  # Savings goal progress & deposit calculator
        ├── WhatIfPage.tsx   # Interactive hypothetical purchase simulator
        ├── InsightsPage.tsx # AI-generated financial health assessment
        ├── MonthlySummaryPage.tsx # Plain-language month-in-review report
        └── ProfilePage.tsx  # User preferences, currency settings & export options
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed on your machine.
- (Optional) A Google Gemini API key if you wish to enable custom generative responses. (The app functions with full capabilities using deterministic heuristic algorithms if no key is provided).

### 1. Installation
Clone or open the project directory and install dependencies:
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory (based on `.env.example`):
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Development Mode
Run the development server with live reload:
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### 4. Production Build & Start
To test the production artifact locally:
```bash
npm run build
npm start
```

---

## 🔑 Quick Demo Login

For instant evaluation without creating an account:
1. Navigate to the login screen.
2. Click **"Explore Demo Account"**.
3. Instantly load pre-configured data for **Rahul Sharma** (Income: ₹30,000, 6 categorized expenses, budget envelopes, and an Emergency Fund goal).

---

## 🔌 API Reference Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Container health probe (`{ status: "ok" }`) |
| `/api/auth/demo` | `POST` | Generates session token for demo user |
| `/api/auth/signup` | `POST` | Registers new user account |
| `/api/auth/login` | `POST` | Authenticates existing user |
| `/api/auth/me` | `GET` | Retrieves profile of currently authenticated user |
| `/api/data` | `GET` | Fetches user's incomes, expenses, budgets, and goals |
| `/api/income` | `POST` | Records a new income source |
| `/api/income/:id` | `PUT` / `DELETE` | Updates or deletes an income entry |
| `/api/expenses` | `POST` | Records a new expense |
| `/api/expenses/:id` | `PUT` / `DELETE` | Updates or deletes an expense entry |
| `/api/budget` | `POST` | Saves custom category budget limits |
| `/api/savings/goal` | `POST` | Configures target amount and current savings |
| `/api/savings/add` | `POST` | Deposits incremental funds into savings |
| `/api/companion/chat` | `POST` | Companion conversational query + What-If routing |
| `/api/gemini/budget-plan` | `POST` | Generates intelligent AI budget recommendations |
| `/api/gemini/insights` | `POST` | Generates high-level personalized financial tips |
| `/api/gemini/what-if` | `POST` | Analyzes hypothetical purchase impact |

---

## 🔒 Privacy & Safety
- **No Unsolicited Speculation**: The bot never promotes high-risk stocks, crypto speculation, or predatory financial products.
- **Client Key Security**: Gemini API keys and secrets stay exclusively on the Node.js server.
- **No External Leakage**: Data remains isolated to the user's active session and local storage.
