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
  HelpCircle,
  User as UserIcon,
  CalendarDays
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { user, activeTab, setActiveTab } = useAuth();

  if (!user || activeTab === 'landing' || activeTab === 'login' || activeTab === 'signup' || activeTab === 'onboarding') {
    return null;
  }

  const items: { tab: NavigationTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { tab: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { tab: 'income', label: 'Income', icon: ArrowDownLeft },
    { tab: 'expenses', label: 'Expenses', icon: ArrowUpRight },
    { tab: 'budget', label: 'Budget', icon: PieChart },
    { tab: 'what-if', label: 'What-If', icon: HelpCircle },
    { tab: 'savings', label: 'Savings', icon: PiggyBank },
    { tab: 'insights', label: 'Insights', icon: Sparkles },
    { tab: 'summary', label: 'Summary', icon: CalendarDays },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-2 py-1.5 flex justify-around items-center"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.tab;
        return (
          <button
            key={item.tab}
            id={`mobile-nav-${item.tab}`}
            onClick={() => setActiveTab(item.tab)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
              isActive ? 'text-emerald-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
