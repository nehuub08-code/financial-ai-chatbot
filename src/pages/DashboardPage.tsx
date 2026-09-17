import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/format';
import { FinanceCompanionModal } from '../components/FinanceCompanionModal';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  PiggyBank, 
  Wallet, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  AlertCircle,
  TrendingDown,
  CheckCircle2,
  HelpCircle,
  Bot
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, incomes, expenses, budgets, goal, setActiveTab } = useAuth();
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);

  // Dynamic greeting based on current time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = user?.name ? user.name.split(' ')[0] : 'friend';

  // Calculate totals
  const totalIncome = useMemo(() => {
    const sum = incomes.reduce((acc, i) => acc + i.amount, 0);
    return sum > 0 ? sum : user?.monthlyIncome || 0;
  }, [incomes, user?.monthlyIncome]);

  const totalSpent = useMemo(() => {
    return expenses.reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  const totalSaved = Math.max(0, totalIncome - totalSpent);
  const remaining = totalSaved;

  // Group expenses by category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });

    return Object.entries(map)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalSpent]);

  // Compare budgets vs expenses
  const budgetComparison = useMemo(() => {
    const expenseMap: Record<string, number> = {};
    expenses.forEach((e) => {
      expenseMap[e.category] = (expenseMap[e.category] || 0) + e.amount;
    });

    return budgets.map((b) => {
      const spent = expenseMap[b.category] || 0;
      const isOver = spent > b.limit;
      const percent = b.limit > 0 ? Math.min(100, Math.round((spent / b.limit) * 100)) : 0;
      return {
        category: b.category,
        spent,
        limit: b.limit,
        isOver,
        percent,
      };
    });
  }, [budgets, expenses]);

  // Find any category over budget for the natural explanation
  const overBudgetCategory = useMemo(() => {
    return budgetComparison.find((b) => b.isOver);
  }, [budgetComparison]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {greeting}, {displayName}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Here's a quick look at your money this month.
          </p>
        </div>

        {/* Quick entry buttons */}
        <div className="flex items-center gap-2.5">
          <button
            id="dash-add-expense-btn"
            onClick={() => setActiveTab('expenses')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
          <button
            id="dash-add-income-btn"
            onClick={() => setActiveTab('income')}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs sm:text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Add Income</span>
          </button>
        </div>
      </div>

      {/* Main summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Income */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs sm:text-sm font-medium">Income</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {incomes.length} {incomes.length === 1 ? 'source' : 'sources'} this month
          </div>
        </div>

        {/* Spent */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs sm:text-sm font-medium">Spent</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatCurrency(totalSpent)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'} logged
          </div>
        </div>

        {/* Saved */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs sm:text-sm font-medium">Saved</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatCurrency(totalSaved)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {totalIncome > 0 ? `${Math.round((totalSaved / totalIncome) * 100)}% of income` : '0% of income'}
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs sm:text-sm font-medium">Remaining</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900">
            {formatCurrency(remaining)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Available for the month
          </div>
        </div>
      </div>

      {/* Think before you spend - Money What-If card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Think before you spend
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              See how a money decision could affect your budget.
            </p>
          </div>
        </div>

        <button
          id="dash-try-what-if-btn"
          onClick={() => setActiveTab('what-if')}
          className="shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-center"
        >
          <span>Try a What-If</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Small AI Section: One suggestion for you */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>One suggestion for you</span>
            </div>
            <p className="text-slate-800 text-sm sm:text-base font-normal leading-relaxed">
              {overBudgetCategory
                ? `You're spending a little more on ${overBudgetCategory.category.toLowerCase()} this month. Reducing it by around ₹500 could help you stay closer to your savings goal.`
                : totalSpent > 0
                ? "You're doing well keeping your spending balanced. Setting aside your savings at the beginning of the month can help make it automatic."
                : "Add your first expense or explore your budget to receive personalized suggestions."}
            </p>
          </div>

          <button
            id="dash-see-more-insights-btn"
            onClick={() => setActiveTab('insights')}
            className="shrink-0 px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 text-xs sm:text-sm font-medium rounded-xl border border-emerald-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>See more insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Where your money went & Your budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Where your money went */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Where your money went
              </h2>
              <button
                onClick={() => setActiveTab('expenses')}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {categoryBreakdown.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-500 mb-3">You haven't added any expenses yet.</p>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Add your first expense
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Visual distribution bar */}
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  {categoryBreakdown.map((item, idx) => {
                    const colors = [
                      'bg-emerald-500',
                      'bg-blue-500',
                      'bg-amber-500',
                      'bg-purple-500',
                      'bg-rose-400',
                      'bg-cyan-500',
                      'bg-slate-400',
                    ];
                    return (
                      <div
                        key={item.category}
                        style={{ width: `${item.percentage}%` }}
                        className={`${colors[idx % colors.length]}`}
                        title={`${item.category}: ${formatCurrency(item.amount)} (${item.percentage}%)`}
                      />
                    );
                  })}
                </div>

                {/* Categories List */}
                <div className="space-y-2.5 pt-2">
                  {categoryBreakdown.slice(0, 5).map((item) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{item.category}</span>
                        <span className="text-xs text-slate-400">({item.percentage}%)</span>
                      </div>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Total spending this month</span>
            <span className="font-semibold text-slate-800">{formatCurrency(totalSpent)}</span>
          </div>
        </div>

        {/* Your budget */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Your budget
              </h2>
              <button
                onClick={() => setActiveTab('budget')}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Manage budget</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {budgetComparison.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm text-slate-500 mb-3">You don't have a budget plan yet.</p>
                <button
                  onClick={() => setActiveTab('budget')}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Create my budget
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {budgetComparison.slice(0, 4).map((b) => (
                  <div key={b.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium text-slate-800">{b.category}</span>
                      <span className="text-slate-600">
                        <strong className={b.isOver ? 'text-amber-700 font-bold' : 'text-slate-900'}>
                          {formatCurrency(b.spent)}
                        </strong>{' '}
                        of {formatCurrency(b.limit)}
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (b.spent / (b.limit || 1)) * 100)}%` }}
                        className={`h-full rounded-full transition-all ${
                          b.isOver ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>

                    {b.isOver && (
                      <p className="text-[11px] text-amber-800 font-medium">
                        {b.category} is a little above your planned amount.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Simple summary note at bottom */}
          {overBudgetCategory && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{overBudgetCategory.category} is a little above your planned amount.</span>
            </div>
          )}
        </div>
      </div>

      {/* Savings Goal Quick Peek */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <PiggyBank className="w-4 h-4 text-blue-600" />
            <span>Your Savings Goal</span>
          </div>
          {goal ? (
            <div>
              <h3 className="text-lg font-bold text-slate-900">{goal.name}</h3>
              <p className="text-sm text-slate-600">
                You've saved <strong className="text-slate-900">{formatCurrency(goal.savedAmount)}</strong> toward your {formatCurrency(goal.targetAmount)} goal.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-semibold text-slate-900">Set a savings goal and start tracking your progress.</h3>
              <p className="text-xs text-slate-500">Having a clear target helps you stay motivated.</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveTab('savings')}
          className="shrink-0 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-medium rounded-xl transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
        >
          <span>{goal ? 'View Savings' : 'Create a goal'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Button: "Ask your Finance Companion" */}
      <div className="fixed bottom-20 md:bottom-8 right-4 sm:right-6 z-30">
        <button
          id="dash-floating-companion-btn"
          onClick={() => setIsCompanionOpen(true)}
          className="px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2.5 text-xs sm:text-sm font-semibold border border-emerald-600/50 cursor-pointer group"
          aria-label="Ask your Finance Companion"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
            <Bot className="w-4 h-4" />
          </div>
          <span>Ask your Finance Companion</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
        </button>
      </div>

      {/* Finance Companion Modal */}
      <FinanceCompanionModal
        isOpen={isCompanionOpen}
        onClose={() => setIsCompanionOpen(false)}
      />
    </div>
  );
};
