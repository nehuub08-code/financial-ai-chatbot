/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { NotificationToast } from './components/NotificationToast';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { IncomePage } from './pages/IncomePage';
import { ExpensesPage } from './pages/ExpensesPage';
import { BudgetPage } from './pages/BudgetPage';
import { SavingsPage } from './pages/SavingsPage';
import { InsightsPage } from './pages/InsightsPage';
import { MonthlySummaryPage } from './pages/MonthlySummaryPage';
import { WhatIfPage } from './pages/WhatIfPage';
import { ProfilePage } from './pages/ProfilePage';
import { Wallet } from 'lucide-react';

function AppContent() {
  const { user, isLoading, activeTab } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm animate-pulse mb-3">
          <Wallet className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-600">Personal Finance Advisor Bot</p>
        <p className="text-xs text-slate-400 mt-1">Starting up your space...</p>
      </div>
    );
  }

  // Not signed in or on public landing/auth pages
  if (!user) {
    if (activeTab === 'login') return <AuthPage initialMode="login" />;
    if (activeTab === 'signup') return <AuthPage initialMode="signup" />;
    return <LandingPage />;
  }

  // Logged in but needs onboarding
  if (!user.isOnboarded || activeTab === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <OnboardingPage />
        <NotificationToast />
      </div>
    );
  }

  // Signed in & Onboarded main app
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-20 md:pb-10">
      <Navbar />

      <main className="flex-1">
        {activeTab === 'dashboard' && <DashboardPage />}
        {activeTab === 'income' && <IncomePage />}
        {activeTab === 'expenses' && <ExpensesPage />}
        {activeTab === 'budget' && <BudgetPage />}
        {activeTab === 'savings' && <SavingsPage />}
        {activeTab === 'insights' && <InsightsPage />}
        {activeTab === 'summary' && <MonthlySummaryPage />}
        {activeTab === 'what-if' && <WhatIfPage />}
        {activeTab === 'profile' && <ProfilePage />}
        {activeTab === 'landing' && <DashboardPage />}
      </main>

      <MobileNav />
      <NotificationToast />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
