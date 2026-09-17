import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank, Sparkles, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActiveTab, demoLogin } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-12 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Hero section */}
      <div className="text-center pt-8 pb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Simple, friendly personal finance</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto">
          Take control of your money, one month at a time.
        </h1>

        <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Track your income and expenses, plan your budget, and get simple suggestions to help you save.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <button
            id="landing-get-started-btn"
            onClick={() => setActiveTab('signup')}
            className="w-full sm:w-auto px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="landing-sign-in-btn"
            onClick={() => setActiveTab('login')}
            className="w-full sm:w-auto px-7 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 transition-all text-base cursor-pointer"
          >
            <span>Sign In</span>
          </button>

          <button
            id="landing-demo-btn"
            onClick={demoLogin}
            className="w-full sm:w-auto px-5 py-3 text-emerald-800 hover:bg-emerald-50 rounded-xl font-medium transition-all text-sm border border-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Explore Demo Mode</span>
          </button>
        </div>
      </div>

      {/* Simple visual representation: Income → Expenses → Savings */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs my-8">
        <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-slate-500 mb-8">
          How your money flows
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* 1. Income */}
          <div className="flex flex-col items-center text-center p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">1. Income</h3>
            <p className="text-sm text-slate-500 mt-1">
              Know exactly how much money comes in each month from all your sources.
            </p>
            <div className="mt-4 px-3 py-1 bg-white rounded-lg border border-slate-200 text-xs font-medium text-emerald-700">
              e.g. ₹30,000 / month
            </div>
          </div>

          {/* 2. Expenses */}
          <div className="flex flex-col items-center text-center p-5 bg-slate-50 rounded-xl border border-slate-100 relative">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">2. Expenses</h3>
            <p className="text-sm text-slate-500 mt-1">
              See where every rupee went with clear, natural categories that make sense.
            </p>
            <div className="mt-4 px-3 py-1 bg-white rounded-lg border border-slate-200 text-xs font-medium text-amber-700">
              e.g. ₹22,000 spent
            </div>
          </div>

          {/* 3. Savings */}
          <div className="flex flex-col items-center text-center p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <PiggyBank className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">3. Savings</h3>
            <p className="text-sm text-slate-500 mt-1">
              Build your safety cushion and reach your goals without feeling restricted.
            </p>
            <div className="mt-4 px-3 py-1 bg-white rounded-lg border border-slate-200 text-xs font-medium text-blue-700">
              e.g. ₹8,000 saved
            </div>
          </div>
        </div>

        {/* Supportive Human Note */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-600 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>No confusing spreadsheets or complex finance jargon. Just simple, friendly guidance.</span>
        </div>
      </div>

      {/* Footer / Trust note */}
      <div className="text-center py-4 text-xs text-slate-400">
        Personal Finance Advisor Bot • Private, secure, and built for your everyday peace of mind.
      </div>
    </div>
  );
};
