import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ArrowRight, Check, HeartHandshake } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, updateUser, setActiveTab, showNotification, refreshData } = useAuth();

  const [monthlyIncome, setMonthlyIncome] = useState<string>('30000');
  const [savingFor, setSavingFor] = useState<string>('Emergency fund');
  const [spendingHabit, setSpendingHabit] = useState<'Mostly essentials' | 'A mix of essentials and wants' | 'Mostly flexible spending'>('A mix of essentials and wants');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const savingOptions = [
    'Emergency fund',
    'Education',
    'Travel',
    'Personal goal',
    'Other',
  ];

  const spendingHabitOptions: ('Mostly essentials' | 'A mix of essentials and wants' | 'Mostly flexible spending')[] = [
    'Mostly essentials',
    'A mix of essentials and wants',
    'Mostly flexible spending',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const incomeNum = Number(monthlyIncome);
    if (isNaN(incomeNum) || incomeNum <= 0) {
      setError('Please enter your usual monthly income.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.submitOnboarding({
        monthlyIncome: incomeNum,
        savingFor,
        spendingHabit,
      });
      updateUser(res.user);
      await refreshData();
      showNotification("You're all set! Welcome to your dashboard.");
      setActiveTab('dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Let's understand your money habits
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Just 3 quick questions so we can give you friendly, personalized suggestions.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question 1 */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5" htmlFor="onboarding-income">
              1. What is your usual monthly income?
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-base">
                ₹
              </span>
              <input
                id="onboarding-income"
                type="number"
                min="0"
                step="500"
                placeholder="30000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Include your salary, freelance, or regular allowance.
            </p>
          </div>

          {/* Question 2 */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              2. What are you mainly saving for?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {savingOptions.map((opt) => {
                const isSelected = savingFor === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSavingFor(opt)}
                    className={`px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3 */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              3. How would you describe your monthly spending?
            </label>
            <div className="space-y-2">
              {spendingHabitOptions.map((habit) => {
                const isSelected = spendingHabit === habit;
                return (
                  <button
                    key={habit}
                    type="button"
                    onClick={() => setSpendingHabit(habit)}
                    className={`w-full p-3 rounded-xl text-xs sm:text-sm font-medium border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                    }`}
                  >
                    <span>{habit}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            id="onboarding-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-4"
          >
            <span>{isSubmitting ? 'Setting up your space...' : 'Continue to Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
