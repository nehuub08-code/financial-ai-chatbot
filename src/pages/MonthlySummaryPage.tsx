import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { MonthlySummaryData } from '../types';
import { formatCurrency } from '../utils/format';
import { CalendarDays, ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet, Sparkles, Check } from 'lucide-react';

export const MonthlySummaryPage: React.FC = () => {
  const { user, incomes, expenses, showNotification } = useAuth();

  const [summaryData, setSummaryData] = useState<MonthlySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Dynamic calculations from user records
  const calculatedIncome = incomes.reduce((sum, i) => sum + i.amount, 0) || user?.monthlyIncome || 0;
  const calculatedSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const calculatedSaved = Math.max(0, calculatedIncome - calculatedSpent);

  useEffect(() => {
    async function loadSummary() {
      setIsLoading(true);
      try {
        const data = await api.getMonthlySummary();
        setSummaryData(data);
      } catch (err: any) {
        showNotification("Could not load monthly summary. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    loadSummary();
  }, [incomes, expenses]);

  const currentMonthName = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium mb-1">
            <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
            <span>{currentMonthName}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Your month in review
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            A quick, clear look at how you did this month.
          </p>
        </div>
      </div>

      {/* Main Figures: Income, Total spending, Savings, Remaining */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Income</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 block">
            {formatCurrency(summaryData?.income ?? calculatedIncome)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Total money in</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Total spending</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 block">
            {formatCurrency(summaryData?.spent ?? calculatedSpent)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Everyday expenses</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Savings</span>
          <span className="text-xl sm:text-2xl font-bold text-emerald-800 block">
            {formatCurrency(summaryData?.saved ?? calculatedSaved)}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">Saved this month</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block mb-1">Remaining amount</span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 block">
            {formatCurrency(summaryData?.remaining ?? calculatedSaved)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Comfort cushion</span>
        </div>
      </div>

      {/* How you did this month (Natural language summary) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-3">
        <h2 className="text-base font-bold text-slate-900">
          How you did this month
        </h2>
        <p className="text-base sm:text-lg text-slate-800 font-normal leading-relaxed">
          {summaryData?.naturalLanguageSummary ||
            (calculatedSpent > 0
              ? `You earned ${formatCurrency(calculatedIncome)} and spent ${formatCurrency(calculatedSpent)}. You saved ${formatCurrency(calculatedSaved)}, which puts you on track.`
              : `You have ${formatCurrency(calculatedIncome)} in income available. Start logging expenses or set a budget to track your progress.`)}
        </p>
      </div>

      {/* Where you spent the most */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Where you spent the most
        </h2>

        {!summaryData || summaryData.topCategories.length === 0 ? (
          <p className="text-sm text-slate-500">No expenses recorded for this month.</p>
        ) : (
          <div className="space-y-3">
            {summaryData.topCategories.slice(0, 4).map((cat, idx) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800">
                    {idx + 1}. {cat.category}
                  </span>
                  <span className="text-slate-700 font-bold">
                    {formatCurrency(cat.amount)}{' '}
                    <span className="text-xs font-normal text-slate-400">({cat.percentage}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className="h-full bg-slate-700 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next month - Simple suggestions */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Next month</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Simple focus areas for next month
        </h2>

        <div className="space-y-2.5">
          {(summaryData?.nextMonthSuggestions || [
            'Keep setting aside savings as soon as your primary income arrives.',
            'Check if dining out or entertainment can be kept around your planned target.',
            'Celebrate keeping your living and transport essentials within budget!',
          ]).map((suggestion, index) => (
            <div key={index} className="flex items-start gap-2.5 text-sm text-slate-700">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3" />
              </div>
              <span className="leading-relaxed">{suggestion}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
