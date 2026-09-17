import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { AIInsightsData } from '../types';
import { Sparkles, ThumbsUp, Eye, Compass, Target, RefreshCw, AlertCircle } from 'lucide-react';

export const InsightsPage: React.FC = () => {
  const { incomes, expenses, budgets, showNotification } = useAuth();

  const [insights, setInsights] = useState<AIInsightsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAIInsights();
      setInsights(data);
    } catch (err: any) {
      showNotification("Your financial data is safe. We couldn't generate your suggestion right now. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI-Assisted</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Simple money insights
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Personalized, friendly observations to help you stay on track.
          </p>
        </div>

        <button
          id="insights-refresh-btn"
          onClick={fetchInsights}
          disabled={isLoading}
          className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 self-start sm:self-center"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Thinking...' : 'Refresh suggestions'}</span>
        </button>
      </div>

      {/* 4 Core Insight Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 1. What's going well */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-emerald-700 font-semibold text-sm mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <ThumbsUp className="w-4 h-4 text-emerald-600" />
              </div>
              <span>What's going well</span>
            </div>
            <p className="text-slate-800 text-base font-normal leading-relaxed">
              {insights?.whatsGoingWell || "You've kept your transport spending within your planned amount."}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            Positive habit observed
          </div>
        </div>

        {/* 2. Keep an eye on */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-amber-700 font-semibold text-sm mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Eye className="w-4 h-4 text-amber-600" />
              </div>
              <span>Keep an eye on</span>
            </div>
            <p className="text-slate-800 text-base font-normal leading-relaxed">
              {insights?.keepAnEyeOn || 'Food spending is slightly higher than your usual amount.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            Gentle reminder
          </div>
        </div>

        {/* 3. One thing you can try */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-blue-700 font-semibold text-sm mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Compass className="w-4 h-4 text-blue-600" />
              </div>
              <span>One thing you can try</span>
            </div>
            <p className="text-slate-800 text-base font-normal leading-relaxed">
              {insights?.oneThingToTry || 'Try setting aside your savings at the beginning of the month.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            Practical tip
          </div>
        </div>

        {/* 4. Your next goal */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-purple-700 font-semibold text-sm mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <span>Your next goal</span>
            </div>
            <p className="text-slate-800 text-base font-normal leading-relaxed">
              {insights?.nextGoal || 'Try to save ₹1,000 more next month.'}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
            Realistic milestone
          </div>
        </div>
      </div>

      {/* Supportive callout */}
      {insights?.oneQuickSuggestion && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-xs flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              Here's a simple suggestion for you
            </span>
            <p className="text-sm text-slate-700 mt-1">
              {insights.oneQuickSuggestion}
            </p>
          </div>
        </div>
      )}

      {/* Required Disclaimer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>
          These suggestions are for general information and are not professional financial advice.
        </span>
      </div>
    </div>
  );
};
