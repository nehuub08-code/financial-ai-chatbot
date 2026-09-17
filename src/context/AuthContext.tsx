import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, IncomeItem, ExpenseItem, CategoryBudget, SavingsGoal, NavigationTab } from '../types';
import { api, getStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updated: User) => void;

  // Data
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  budgets: CategoryBudget[];
  goal: SavingsGoal | null;
  refreshData: () => Promise<void>;
  isDataLoading: boolean;

  // Notification / Toast
  notification: string | null;
  showNotification: (msg: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>('landing');

  const [incomes, setIncomes] = useState<IncomeItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const refreshData = useCallback(async () => {
    if (!getStoredToken()) return;
    setIsDataLoading(true);
    try {
      const data = await api.getAllData();
      setIncomes(data.incomes || []);
      setExpenses(data.expenses || []);
      setBudgets(data.budgets || []);
      setGoal(data.goal || null);
    } catch (err) {
      console.error('Failed to load financial data:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    async function init() {
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        setUser(res.user);
        if (!res.user.isOnboarded) {
          setActiveTab('onboarding');
        } else {
          setActiveTab('dashboard');
        }
        await refreshData();
      } catch (err) {
        console.warn('Session expired or invalid:', err);
        setUser(null);
        setActiveTab('landing');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [refreshData]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    if (!res.user.isOnboarded) {
      setActiveTab('onboarding');
    } else {
      setActiveTab('dashboard');
    }
    await refreshData();
    showNotification(`Welcome back, ${res.user.name}!`);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await api.signup(name, email, password);
    setUser(res.user);
    setActiveTab('onboarding');
    await refreshData();
    showNotification(`Account created! Let's set up your profile.`);
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    setUser(res.user);
    setActiveTab('dashboard');
    await refreshData();
    showNotification(`Signed in with demo profile (Rahul).`);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    setIncomes([]);
    setExpenses([]);
    setBudgets([]);
    setGoal(null);
    setActiveTab('landing');
    showNotification('You have signed out.');
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        activeTab,
        setActiveTab,
        login,
        signup,
        demoLogin,
        logout,
        updateUser,
        incomes,
        expenses,
        budgets,
        goal,
        refreshData,
        isDataLoading,
        notification,
        showNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
