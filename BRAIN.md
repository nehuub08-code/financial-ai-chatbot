# Personal Finance Advisor Bot — Cognitive Architecture & Decision Engine (BRAIN) 🧠

This document outlines the cognitive models, mathematical heuristics, system prompts, intent classification pathways, and behavioral guardrails that power the **Personal Finance Advisor Bot**.

---

## 1. Core Philosophy & Persona

The bot is designed around **empathy-first, non-judgmental personal finance**. Most people avoid budgeting because traditional apps make them feel guilty or overwhelm them with complex financial jargon. 

### Core Tenets:
1. **Warm & Judgment-Free**: Never shame users for discretionary spending. Instead, objectively present trade-offs and options.
2. **Jargon-Free Simplicity**: Prohibit terms like *"algorithmic asset allocation"*, *"portfolio hedging"*, *"beta"*, or *"amortization"*. Use everyday concepts like *"cushion"*, *"comfortable margin"*, *"savings buffer"*, and *"planned limits"*.
3. **Actionable Over Abstract**: Provide specific numbers in local currency (₹ INR) rather than vague percentages whenever referencing user data.
4. **Empowering Autonomy**: Guide users to make informed decisions rather than giving rigid commands (e.g., *"You can afford this if you're comfortable trimming dinner outings by ₹500"* instead of *"Do not buy this"*).

---

## 2. Dual-Layer Cognitive Engine

To guarantee 100% availability, instant responses, and high reliability, the system operates on a **Dual-Layer Architecture**:

```
                  ┌───────────────────────────────┐
                  │      User Voice or Text       │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │    Intent & Entity Extractor  │
                  └──────────────┬────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
       [Live Network & Key]             [Offline / Fallback]
  ┌─────────────────────────────┐   ┌─────────────────────────────┐
  │ Layer 1: Generative Brain   │   │ Layer 2: Deterministic Math │
  │ Google Gemini 2.5 Flash     │   │ Exact Arithmetic Engine     │
  │ Context-Aware Grounding     │   │ Zero-Latency Rule-Based     │
  └──────────────┬──────────────┘   └──────────────┬──────────────┘
                 │                                 │
                 └───────────────┬─────────────────┘
                                 ▼
                  ┌───────────────────────────────┐
                  │    Safe Response Sanitizer    │
                  │    (Markdown/JSON Stripping)  │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │  Client TTS & Voice Playback  │
                  └───────────────────────────────┘
```

### Layer 1: Generative Brain (Google Gemini 2.5 Flash)
- Receives dynamic context injection containing the user's live financial state (income, all expenses grouped by category, active budget limits, and savings goal).
- Generates natural, human-like summaries, answers follow-up inquiries, and evaluates contextual nuance.

### Layer 2: Deterministic Heuristic Engine
- Always active in parallel as a fallback. If the Gemini API key is missing, network is offline, or rate limits occur, the app computes exact answers using pure arithmetic rules.
- Guarantees that users never receive an empty error screen or broken response.

---

## 3. Real-Time Financial State Injection

Before evaluating any query, the backend synthesizes the user's financial profile into a structured context snapshot:

```typescript
interface FinancialStateSnapshot {
  user: {
    name: string;
    monthlyIncome: number;
    savingFor: string;
    spendingHabit: string;
  };
  metrics: {
    totalIncome: number;
    totalSpent: number;
    currentSavings: number;
    savingsRatePercentage: number;
  };
  categoryBreakdown: Record<string, number>; // e.g., { "Food": 5000, "Rent": 8000 }
  budgets: Record<string, number>;           // e.g., { "Food": 6000, "Rent": 8000 }
  savingsGoal: {
    name: string;
    targetAmount: number;
    savedAmount: number;
    remaining: number;
    percentComplete: number;
  };
}
```

---

## 4. Intent Classification & Routing

Every conversational message received at `/api/companion/chat` is evaluated through the following priority pipeline:

| Priority | Intent | Trigger Pattern / Semantic Match | Action Handler |
| :---: | :--- | :--- | :--- |
| **P0** | **What-If Purchase Simulation** | Contains *"can I buy"*, *"can I spend"*, *"should I get"*, or contains explicit amounts with items (e.g., *"₹2000 on shoes"*). | Runs What-If Decision Engine (Section 5) and returns structured analysis with single-click expense commitment. |
| **P1** | **Category Spending Deep-Dive** | Mentions a known category (*Food*, *Rent*, *Transport*, *Bills*, *Entertainment*, *Shopping*, *Health*, *Education*) + spending keywords (*"how much"*, *"spent on"*, *"cost"*). | Computes total spent in that specific category, compares against budget ceiling, and returns remaining category allowance. |
| **P2** | **Total Spending Query** | Queries like *"how much did I spend"*, *"where did my money go"*, *"total spending"*. | Returns aggregate monthly expenditure, top spending category, and compares against declared income. |
| **P3** | **Savings & Goal Progress** | Queries like *"savings"*, *"how much have I saved"*, *"emergency fund"*, *"goal progress"*. | Summarizes current balance in goal, progress percentage, and estimated months to completion. |
| **P4** | **Budget Status & Overspending Check** | Queries like *"am I over budget"*, *"how is my budget"*, *"how much left"*. | Audits all categories for overages and reports total comfortable remaining buffer. |
| **P5** | **General / Contextual Conversation** | Open-ended queries (e.g., *"Is that good?"*, *"Give me advice"*, *"How can I save more?"*). | Dispatches to Gemini with conversation history or provides tailored 50/30/20 heuristic guidance. |

---

## 5. The "What-If" Simulation Algorithm

When a user asks whether they can afford a hypothetical purchase:

### Mathematical Formulas:
$$\text{Projected Savings} = \max(0, \text{Current Savings} - \text{Purchase Amount})$$

$$\text{Category Impact} = \text{Category Spent} + \text{Purchase Amount}$$

$$\text{Category Variance} = \text{Category Budget} - \text{Category Impact}$$

### Decision Thresholds:
1. **Safe (`positive_cushion`)**:
   - $\text{Projected Savings} \ge 0.10 \times \text{Total Income}$ AND $\text{Category Variance} \ge 0$.
   - **Verdict**: *"Yes, comfortably affordable without disturbing your savings plan."*
2. **Tight Margin (`moderate_strain`)**:
   - $\text{Projected Savings} > 0$, but reduces savings below 10% of monthly income OR causes a minor category breach ($< ₹1,000$).
   - **Verdict**: *"Possible, but it will leave a tighter cushion for the rest of the month."*
3. **Over Budget (`deficit_risk`)**:
   - Purchase exceeds available remaining savings ($\text{Current Savings} - \text{Purchase Amount} < 0$) OR causes a significant category budget breach.
   - **Verdict**: *"This would exceed your planned monthly limits and dip into past savings."*

### 3-Part Constructive Response Schema:
Every What-If analysis presents:
1. **Direct Answer**: Clear, plain-language assessment of safety.
2. **Financial Impact**: Concrete rupee numbers indicating new savings buffer and category balance.
3. **Painless Alternative / Trade-off**: Suggested adjustment (e.g., *"Wait until next month's cycle"* or *"Trim dining/entertainment by ₹500 over the next 2 weeks to offset this purchase"*).

---

## 6. Response Sanitization & Natural Voice Delivery

To prevent user confusion and maintain an authentic human interaction:

1. **JSON & Markdown Stripping**:
   - When Gemini returns responses, any accidental markdown formatting (` ```json ... ``` `) or raw key-value braces are automatically extracted and converted into warm, readable text.
2. **Voice Synthesis (TTS) Optimization**:
   - Formats rupee symbols (`₹`) and numbers so the browser's `SpeechSynthesis` engine pronounces them naturally as *"rupees"* rather than stumbling over ASCII symbols.
   - Truncates repetitive boilerplate so spoken answers remain concise and pleasant to listen to.

---

## 7. Safety, Compliance & Guardrails

To protect users and maintain high advisory standards:
- 🚫 **No High-Risk Financial Advice**: The system is strictly prohibited from recommending individual equities, options, crypto tokens, or leveraged instruments.
- 🚫 **No Guarantees**: Prohibited from promising guaranteed investment returns.
- 🔒 **Data Privacy**: No financial records are stored across multi-tenant accounts. All transactions are scoped strictly to the authenticated user's session token.
- 🛡️ **Session Integrity**: In-memory and local file stores ensure test data can be reset safely at any time.
