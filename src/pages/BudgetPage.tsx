import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CategoryBudget, ExpenseCategory } from '../types';
import { formatCurrency } from '../utils/format';
import { Sparkles, PieChart, Check, Plus, Edit2, AlertCircle } from 'lucide-react';

export const BudgetPage: React.FC = () => {
  const { user, incomes, expenses, budgets, refreshData, showNotification } = useAuth();

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiProposal, setAiProposal] = useState<{
    message: string;
    budgets: CategoryBudget[];
    plannedSavings: number;
    note?: string;
  } | null>(null);

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customBudgets, setCustomBudgets] = useState<CategoryBudget[]>([]);

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0) || user?.monthlyIncome || 0;

  // Calculate actual spending by category
  const expenseMap: Record<string, number> = {};
  expenses.forEach((e) => {
    expenseMap[e.category] = (expenseMap[e.category] || 0) + e.amount;
  });

  const plannedSpending = budgets.reduce((sum, b) => sum + b.limit, 0);
  const plannedSavings = Math.max(0, totalIncome - plannedSpending);

  // Call Gemini API for personalized budget
  const handleGenerateBudget = async () => {
    setIsGenerating(true);
    try {
      const response = await api.generateAIBudget();
      setAiProposal(response);
      showNotification('New budget plan suggested!');
    } catch (err: any) {
      showNotification(err.message || "Your financial data is safe. We couldn't generate your suggestion right now.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAiProposal = async () => {
    if (!aiProposal) return;
    try {
      await api.saveBudgets(aiProposal.budgets);
      await refreshData();
      showNotification('Budget plan applied successfully!');
      setAiProposal(null);
    } catch {
      showNotification('Something went wrong saving the budget. Please try again.');
    }
  };

  const handleStartCustomizing = () => {
    const allCategories: ExpenseCategory[] = [
      'Food',
      'Rent',
      'Transport',
      'Bills',
      'Entertainment',
      'Shopping',
      'Education',
      'Healthcare',
      'Other',
    ];

    const currentMap = new Map<ExpenseCategory, number>(budgets.map((b) => [b.category, b.limit]));
    const initialList: CategoryBudget[] = allCategories.map((c) => ({
      category: c,
      limit: currentMap.get(c) ?? 0,
    }));

    setCustomBudgets(initialList);
    setIsCustomizing(true);
  };

  const handleSaveCustomBudgets = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const filtered = customBudgets.filter((b) => b.limit > 0);
      await api.saveBudgets(filtered);
      await refreshData();
      showNotification('Budget updated successfully.');
      setIsCustomizing(false);
    } catch {
      showNotification('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Your monthly budget
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Plan your spending and save with simple limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="budget-create-ai-btn"
            onClick={handleGenerateBudget}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs sm:text-sm font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>{isGenerating ? 'Planning with AI...' : 'Create my budget'}</span>
          </button>

          <button
            id="budget-customize-btn"
            onClick={handleStartCustomizing}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Monthly income</div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total expected for the month</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Planned spending</div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(plannedSpending)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Across all category limits</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Planned savings</div>
          <div className="text-2xl font-bold text-emerald-800">
            {formatCurrency(plannedSavings)}
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1">
            {totalIncome > 0 ? `${Math.round((plannedSavings / totalIncome) * 100)}% of your income` : ''}
          </div>
        </div>
      </div>

      {/* AI Proposed Budget Banner */}
      {aiProposal && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-xs animate-fade-in space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Personalized Money Plan</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {aiProposal.message}
              </h2>
              <p className="text-sm text-slate-600">
                Here is a balanced breakdown tailored to your ₹{totalIncome.toLocaleString('en-IN')} income and everyday habits.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="budget-apply-proposal-btn"
                onClick={handleApplyAiProposal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-medium shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Apply this budget</span>
              </button>
              <button
                id="budget-dismiss-proposal-btn"
                onClick={() => setAiProposal(null)}
                className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-medium cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* AI Category Breakdown List */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {aiProposal.budgets.map((b) => (
              <div
                key={b.category}
                className="p-3 bg-white rounded-xl border border-emerald-100 flex items-center justify-between"
              >
                <span className="text-sm font-medium text-slate-800">{b.category}</span>
                <span className="text-sm font-bold text-slate-900">{formatCurrency(b.limit)}</span>
              </div>
            ))}
            <div className="p-3 bg-emerald-100/70 rounded-xl border border-emerald-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-emerald-900">Savings</span>
              <span className="text-sm font-bold text-emerald-900">
                {formatCurrency(aiProposal.plannedSavings)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Budget Limits Form Modal/Inline */}
      {isCustomizing && (
        <div className="bg-white rounded-2xl border border-slate-300 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Set Category Limits
            </h2>
            <button
              onClick={() => setIsCustomizing(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSaveCustomBudgets} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {customBudgets.map((b, index) => (
                <div key={b.category} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {b.category}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={b.limit === 0 ? '' : b.limit}
                      placeholder="0"
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        const copy = [...customBudgets];
                        copy[index].limit = val;
                        setCustomBudgets(copy);
                      }}
                      className="w-full pl-7 pr-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                id="budget-cancel-limits-btn"
                type="button"
                onClick={() => setIsCustomizing(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="budget-save-limits-btn"
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium shadow-xs cursor-pointer"
              >
                Save Limits
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Budgets with Progress Bars */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-6">
        <h2 className="text-base font-bold text-slate-900">
          Category Progress
        </h2>

        {budgets.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <PieChart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-medium text-slate-800">You don't have category budgets yet.</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Let our friendly assistant build a simple spending plan for you with one click.
            </p>
            <button
              onClick={handleGenerateBudget}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Create my budget</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {budgets.map((b) => {
              const spent = expenseMap[b.category] || 0;
              const isOver = spent > b.limit;
              const percent = b.limit > 0 ? Math.min(100, Math.round((spent / b.limit) * 100)) : 0;

              return (
                <div key={b.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{b.category}</span>
                    <span className="text-slate-600 text-xs sm:text-sm">
                      <strong className={isOver ? 'text-amber-700' : 'text-slate-900'}>
                        {formatCurrency(spent)}
                      </strong>{' '}
                      of {formatCurrency(b.limit)}
                    </span>
                  </div>

                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isOver ? 'text-amber-800 font-medium' : 'text-slate-400'}>
                      {isOver
                        ? `${b.category} is a little above your planned amount.`
                        : `${formatCurrency(Math.max(0, b.limit - spent))} remaining`}
                    </span>
                    <span className="text-slate-400">{percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
