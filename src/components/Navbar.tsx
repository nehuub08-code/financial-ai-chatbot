import React from 'react';
import { useAuth } from '../context/AuthContext';
import { NavigationTab } from '../types';
import { 
  LayoutDashboard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PieChart, 
  PiggyBank, 
  Sparkles, 
  CalendarDays,
  HelpCircle,
  User as UserIcon,
  LogOut,
  Wallet
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, activeTab, setActiveTab, logout } = useAuth();

  if (!user || activeTab === 'landing' || activeTab === 'login' || activeTab === 'signup' || activeTab === 'onboarding') {
    return null;
  }

  const navItems: { tab: NavigationTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { tab: 'income', label: 'Income', icon: ArrowDownLeft },
    { tab: 'expenses', label: 'Expenses', icon: ArrowUpRight },
    { tab: 'budget', label: 'Budget', icon: PieChart },
    { tab: 'savings', label: 'Savings', icon: PiggyBank },
    { tab: 'what-if', label: 'What-If', icon: HelpCircle },
    { tab: 'insights', label: 'Insights', icon: Sparkles },
    { tab: 'summary', label: 'Summary', icon: CalendarDays },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          id="nav-brand-button"
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 tracking-tight block">
              Personal Finance Advisor
            </span>
            <span className="text-[11px] font-medium text-emerald-700 block -mt-0.5">
              Your money friend
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                id={`nav-link-${item.tab}`}
                onClick={() => setActiveTab(item.tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Profile & Logout button (Top Right) */}
        <div className="flex items-center gap-2">
          <button
            id="nav-profile-button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border transition-all text-sm font-medium ${
              activeTab === 'profile'
                ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
            title="Your Profile"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-semibold text-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
          </button>

          <button
            id="nav-logout-button"
            onClick={logout}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
