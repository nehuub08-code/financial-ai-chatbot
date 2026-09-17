import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { WhatIfResult, ExpenseCategory } from '../types';
import { formatCurrency } from '../utils/format';
import { 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  PiggyBank, 
  Wallet, 
  TrendingDown, 
  Info,
  ChevronLeft
} from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    title: 'Shopping',
    question: 'Can I spend ₹2,000 on shopping?',
    amount: 2000,
    category: 'Shopping' as ExpenseCategory,
  },
  {
    title: 'Trip / Travel',
    question: 'What happens if I spend ₹3,000 on a trip?',
    amount: 3000,
    category: 'Transport' as ExpenseCategory,
  },
  {
    title: 'Gadget / Phone',
    question: 'Can I buy a new phone and still reach my savings goal?',
    amount: 12000,
    category: 'Shopping' as ExpenseCategory,
  },
  {
    title: 'Lower Income',
    question: 'What if my income is ₹5,000 lower next month?',
    amount: 5000,
    category: 'Other' as ExpenseCategory,
    decisionType: 'income_change' as const,
  },
];

const CATEGORIES: ExpenseCategory[] = [
  'Shopping',
  'Food',
  'Transport',
  'Entertainment',
  'Bills',
  'Rent',
  'Healthcare',
  'Education',
  'Other',
];

export const WhatIfPage: React.FC = () => {
  const { user, incomes, expenses, budgets, goal, refreshData, showNotification, setActiveTab } = useAuth();

  // Form state
  const [question, setQuestion] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Shopping');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WhatIfResult | null>(null);

  // Adding real expense state
  const [isAddingReal, setIsAddingReal] = useState(false);
  const [hasAddedReal, setHasAddedReal] = useState(false);

  // Baseline calculations
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0) || user?.monthlyIncome || 0;
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const currentSavings = Math.max(0, totalIncome - totalSpent);

  const handleSelectPreset = (preset: typeof PRESET_SCENARIOS[0]) => {
    setQuestion(preset.question);
    setAmount(preset.amount.toString());
    setCategory(preset.category);
    // Reset any previous result so user sees fresh form
    setResult(null);
    setHasAddedReal(false);
  };

  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim()) {
      showNotification('Please enter a question or decision to check.');
      return;
    }

    setIsLoading(true);
    setHasAddedReal(false);

    try {
      const parsedAmount = amount ? Math.max(0, Math.round(Number(amount))) : undefined;
      const res = await api.simulateWhatIf({
        question: question.trim(),
        amount: parsedAmount,
        category,
      });
      setResult(res);
    } catch {
      showNotification('Could not check this scenario right now. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setQuestion('');
    setAmount('');
    setCategory('Shopping');
    setHasAddedReal(false);
  };

  const handleAddAsRealExpense = async () => {
    if (!result || isAddingReal) return;
    setIsAddingReal(true);

    try {
      await api.addExpense({
        amount: result.hypotheticalAmount,
        category: (result.category as ExpenseCategory) || 'Other',
        date: new Date().toISOString().split('T')[0],
        note: `From What-If: ${result.question}`,
      });
      await refreshData();
      setHasAddedReal(true);
      showNotification(`₹${result.hypotheticalAmount.toLocaleString('en-IN')} was added to your real expenses.`);
    } catch {
      showNotification('Could not add this expense. Please try again.');
    } finally {
      setIsAddingReal(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <button
          id="whatif-back-dashboard-btn"
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 mb-3 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Money What-If
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Let me check what happens before I spend this money.
            </p>
          </div>
        </div>

        {/* Safety reassurance banner */}
        <div className="mt-4 bg-slate-100/80 border border-slate-200/90 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p>
            <strong className="font-semibold text-slate-800">Safe sandbox: </strong>
            Testing scenarios here will <em>never</em> alter your actual income, expenses, budget, or savings records unless you choose to add an expense afterwards.
          </p>
        </div>
      </div>

      {/* Screen 1: Simple Input Form (shown when no result is active) */}
      {!result && (
        <div className="space-y-6">
          {/* Quick preset chips */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
              Quick questions to try
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_SCENARIOS.map((preset, idx) => (
                <button
                  key={idx}
                  id={`whatif-preset-${idx}`}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40 transition-all shadow-xs cursor-pointer group"
                >
                  <span className="text-[11px] font-semibold text-emerald-700 block uppercase tracking-wider">
                    {preset.title}
                  </span>
                  <span className="text-sm text-slate-800 group-hover:text-emerald-950 font-medium line-clamp-1">
                    "{preset.question}"
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form container */}
          <form
            id="whatif-form"
            onSubmit={handleRunSimulation}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5"
          >
            <div>
              <label htmlFor="whatif-question" className="block text-sm font-semibold text-slate-900 mb-1">
                What money decision are you considering?
              </label>
              <input
                id="whatif-question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Can I spend ₹2,000 on shopping?"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="whatif-amount" className="block text-xs font-medium text-slate-700 mb-1">
                  Approximate amount (₹) <span className="text-slate-400 font-normal">(optional if typed in question)</span>
                </label>
                <input
                  id="whatif-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 2000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="whatif-category" className="block text-xs font-medium text-slate-700 mb-1">
                  Category <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <select
                  id="whatif-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Financial Baseline Reference */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                <span>Current monthly income: </span>
                <strong className="text-slate-800">{formatCurrency(totalIncome)}</strong>
              </div>
              <div>
                <span>Current planned savings: </span>
                <strong className="text-emerald-700 font-semibold">{formatCurrency(currentSavings)}</strong>
              </div>
            </div>

            <button
              id="whatif-submit-btn"
              type="submit"
              disabled={isLoading || !question.trim()}
              className="w-full py-3 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span>Thinking it through...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-100" />
                  <span>Check possible impact</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Screen 2: One Clear Result Screen (shown when result exists) */}
      {result && (
        <div className="space-y-6">
          {/* Main Result Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
            {/* Header with clear "Possible impact" badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>Possible impact</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  "{result.question}"
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  This is a simulation to help you plan, not a prediction or guarantee.
                </p>
              </div>

              <div className="text-right sm:self-center">
                <span className="text-xs text-slate-400 block">Hypothetical amount</span>
                <span className="text-xl font-bold text-slate-900">
                  {formatCurrency(result.hypotheticalAmount)}
                </span>
              </div>
            </div>

            {/* Calculations Grid (Clean, readable comparison) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-xs font-medium text-slate-500 block">Current savings</span>
                <span className="text-lg font-bold text-slate-800 mt-1 block">
                  {formatCurrency(result.currentMonthlySavings)}
                </span>
                <span className="text-[11px] text-slate-400">Planned for this month</span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70">
                <span className="text-xs font-medium text-amber-800 block">
                  {result.decisionType === 'income_change' ? 'Income difference' : 'Hypothetical expense'}
                </span>
                <span className="text-lg font-bold text-amber-900 mt-1 block">
                  - {formatCurrency(result.hypotheticalAmount)}
                </span>
                <span className="text-[11px] text-amber-700/80">{result.category}</span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                <span className="text-xs font-medium text-emerald-800 block">Possible remaining savings</span>
                <span className="text-lg font-bold text-emerald-900 mt-1 block">
                  {formatCurrency(Math.max(0, result.possibleMonthlySavings))}
                </span>
                <span className="text-[11px] text-emerald-700">
                  {result.possibleMonthlySavings < 0 ? 'Would draw from existing buffer' : 'Estimated buffer left'}
                </span>
              </div>
            </div>

            {/* Category Budget Note (if applicable) */}
            {result.categoryBudget && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-slate-800">
                    {result.categoryBudget.category} budget check
                  </span>
                  <span className="text-slate-600">
                    {formatCurrency(result.categoryBudget.currentSpent)} spent of {formatCurrency(result.categoryBudget.limit)} limit
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.min(100, (result.categoryBudget.possibleSpent / (result.categoryBudget.limit || 1)) * 100)}%` }}
                    className={`h-full rounded-full transition-all ${
                      result.categoryBudget.wouldExceed ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>
                <p className="text-xs text-slate-600">
                  {result.categoryBudget.wouldExceed ? (
                    <span className="text-amber-800 font-medium">
                      Adding this would bring {result.categoryBudget.category} to {formatCurrency(result.categoryBudget.possibleSpent)}, which is {formatCurrency(result.categoryBudget.possibleSpent - result.categoryBudget.limit)} above your planned limit.
                    </span>
                  ) : (
                    <span className="text-emerald-800 font-medium">
                      This purchase stays within your {formatCurrency(result.categoryBudget.limit)} monthly limit for {result.categoryBudget.category}.
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Friendly AI Explanation */}
            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>What this could mean for you</span>
              </div>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                {result.friendlyExplanation}
              </p>
            </div>

            {/* Simple Alternative */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <PiggyBank className="w-4 h-4 text-blue-600" />
                <span>A simple alternative</span>
              </div>
              <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                {result.simpleAlternative}
              </p>
            </div>

            {/* Actions: "Add this as a real expense" & "Try another What-If" */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Optional conversion button */}
              {result.decisionType === 'expense' && (
                <div>
                  {hasAddedReal ? (
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Added to your real expenses</span>
                    </div>
                  ) : (
                    <button
                      id="whatif-add-real-expense-btn"
                      type="button"
                      disabled={isAddingReal}
                      onClick={handleAddAsRealExpense}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-400" />
                      <span>{isAddingReal ? 'Adding...' : 'Add this as a real expense'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Try another scenario */}
              <div className="flex items-center gap-2">
                <button
                  id="whatif-try-another-btn"
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-slate-500" />
                  <span>Try another What-If</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
