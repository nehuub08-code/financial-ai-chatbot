import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatCurrency } from '../utils/format';
import { PiggyBank, Plus, CheckCircle2, Target, TrendingUp, Sparkles, Edit2, ArrowRight } from 'lucide-react';

export const SavingsPage: React.FC = () => {
  const { user, incomes, expenses, goal, refreshData, showNotification } = useAuth();

  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalName, setGoalName] = useState(goal?.name || 'Emergency Fund');
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount ? goal.targetAmount.toString() : (user?.savingsGoalTarget || 50000).toString());
  const [savedAmount, setSavedAmount] = useState(goal?.savedAmount !== undefined ? goal.savedAmount.toString() : '0');

  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0) || user?.monthlyIncome || 30000;
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const savedThisMonth = Math.max(0, totalIncome - totalSpent);

  const currentSaved = goal?.savedAmount ?? 0;
  const currentTarget = goal?.targetAmount ?? user?.savingsGoalTarget ?? 50000;
  const remainingTowardGoal = Math.max(0, currentTarget - currentSaved);
  const percentComplete = currentTarget > 0 ? Math.min(100, Math.round((currentSaved / currentTarget) * 100)) : 0;

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = Number(targetAmount);
    const saved = Number(savedAmount);

    if (!goalName.trim() || isNaN(target) || target <= 0) {
      showNotification('Please enter a goal name and target amount.');
      return;
    }

    try {
      await api.saveGoal({
        name: goalName.trim(),
        targetAmount: target,
        savedAmount: isNaN(saved) ? 0 : saved,
      });
      await refreshData();
      showNotification('Savings goal updated!');
      setIsEditingGoal(false);
    } catch {
      showNotification('Something went wrong. Please try again.');
    }
  };

  const handleAddSavings = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(depositAmount);
    if (isNaN(num) || num <= 0) {
      showNotification('Please enter a valid amount.');
      return;
    }

    try {
      await api.addSavings(num);
      await refreshData();
      showNotification(`Added ${formatCurrency(num)} to your savings!`);
      setDepositAmount('');
      setIsAddingFunds(false);
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
            Your savings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Build your safety net and work toward what matters to you.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="savings-add-funds-btn"
            onClick={() => setIsAddingFunds(!isAddingFunds)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add to savings</span>
          </button>

          <button
            id="savings-edit-goal-btn"
            onClick={() => {
              if (goal) {
                setGoalName(goal.name);
                setTargetAmount(goal.targetAmount.toString());
                setSavedAmount(goal.savedAmount.toString());
              }
              setIsEditingGoal(!isEditingGoal);
            }}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{goal ? 'Edit goal' : 'Create a goal'}</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs sm:text-sm font-medium">Saved this month</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-800">
            {formatCurrency(savedThisMonth)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Income minus expenses this month
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs sm:text-sm font-medium">Savings goal</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">
            {formatCurrency(currentTarget)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Target for {goal?.name || 'Emergency Fund'}
          </div>
        </div>
      </div>

      {/* Quick Deposit Box */}
      {isAddingFunds && (
        <div className="bg-white rounded-2xl border border-emerald-300 p-5 shadow-xs animate-fade-in">
          <h2 className="text-base font-bold text-slate-900 mb-3">
            Add money to savings
          </h2>
          <form onSubmit={handleAddSavings} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
                ₹
              </span>
              <input
                type="number"
                min="100"
                step="500"
                placeholder="e.g. 2000"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>
            <button
              id="savings-submit-deposit-btn"
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium cursor-pointer"
            >
              Add now
            </button>
            <button
              id="savings-cancel-deposit-btn"
              type="button"
              onClick={() => setIsAddingFunds(false)}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm cursor-pointer"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Edit / Create Goal Form */}
      {isEditingGoal && (
        <div className="bg-white rounded-2xl border border-slate-300 p-6 shadow-xs animate-fade-in space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            {goal ? 'Edit your goal' : 'Set a new savings goal'}
          </h2>

          <form onSubmit={handleSaveGoal} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Goal name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Fund"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target amount (₹)
                </label>
                <input
                  type="number"
                  placeholder="50000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Already saved (₹)
                </label>
                <input
                  type="number"
                  placeholder="20000"
                  value={savedAmount}
                  onChange={(e) => setSavedAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                id="savings-cancel-goal-btn"
                type="button"
                onClick={() => setIsEditingGoal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="savings-save-goal-btn"
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium shadow-xs cursor-pointer"
              >
                Save goal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Goal Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Goal
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
              {goal?.name || 'Emergency Fund'}
            </h2>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-slate-900">
              {percentComplete}%
            </span>
            <span className="text-xs text-slate-500 block">completed</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              style={{ width: `${percentComplete}%` }}
              className="h-full bg-emerald-600 rounded-full transition-all duration-500"
            />
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600 pt-1">
            <span>
              Saved: <strong className="text-slate-900">{formatCurrency(currentSaved)}</strong>
            </span>
            <span>
              Target: <strong className="text-slate-900">{formatCurrency(currentTarget)}</strong>
            </span>
          </div>
        </div>

        {/* Detail Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block">Goal</span>
            <span className="text-sm font-semibold text-slate-900 mt-0.5 block truncate">
              {goal?.name || 'Emergency Fund'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 block">Saved</span>
            <span className="text-sm font-semibold text-emerald-800 mt-0.5 block">
              {formatCurrency(currentSaved)}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-500 block">Remaining</span>
            <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
              {formatCurrency(remainingTowardGoal)}
            </span>
          </div>
        </div>

        {/* Supportive friendly message */}
        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/70 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-900 font-medium">
            You're making progress. Keep going.
          </p>
        </div>
      </div>
    </div>
  );
};
