import { 
  User, 
  IncomeItem, 
  ExpenseItem, 
  CategoryBudget, 
  SavingsGoal, 
  AIInsightsData, 
  MonthlySummaryData, 
  WhatIfScenarioInput, 
  WhatIfResult,
  CompanionChatResponse 
} from '../types';

const TOKEN_KEY = 'pfab_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }

  return data as T;
}

export const api = {
  // Auth
  async signup(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async demoLogin(): Promise<{ token: string; user: User }> {
    const res = await request<{ token: string; user: User }>('/api/auth/demo', {
      method: 'POST',
    });
    setStoredToken(res.token);
    return res;
  },

  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      removeStoredToken();
    }
  },

  // Onboarding
  async submitOnboarding(data: { monthlyIncome: number; savingFor: string; spendingHabit: string }): Promise<{ user: User }> {
    return request<{ user: User }>('/api/user/onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Profile
  async updateProfile(data: { name?: string; monthlyIncome?: number; savingsGoalTarget?: number; password?: string }): Promise<{ user: User }> {
    return request<{ user: User }>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async resetDemoData(): Promise<void> {
    await request('/api/user/reset-demo', { method: 'POST' });
  },

  // Financial Data
  async getAllData(): Promise<{
    incomes: IncomeItem[];
    expenses: ExpenseItem[];
    budgets: CategoryBudget[];
    goal: SavingsGoal | null;
  }> {
    return request('/api/data');
  },

  // Income
  async addIncome(item: { source: string; amount: number; date: string; notes?: string }): Promise<{ item: IncomeItem }> {
    return request('/api/income', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async editIncome(id: string, item: Partial<IncomeItem>): Promise<{ item: IncomeItem }> {
    return request(`/api/income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },

  async deleteIncome(id: string): Promise<void> {
    await request(`/api/income/${id}`, { method: 'DELETE' });
  },

  // Expenses
  async addExpense(item: { amount: number; category: string; date: string; note?: string }): Promise<{ item: ExpenseItem }> {
    return request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async editExpense(id: string, item: Partial<ExpenseItem>): Promise<{ item: ExpenseItem }> {
    return request(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  },

  async deleteExpense(id: string): Promise<void> {
    await request(`/api/expenses/${id}`, { method: 'DELETE' });
  },

  // Budgets
  async saveBudgets(budgets: CategoryBudget[]): Promise<{ budgets: CategoryBudget[] }> {
    return request('/api/budget', {
      method: 'POST',
      body: JSON.stringify({ budgets }),
    });
  },

  // Savings
  async saveGoal(goal: { name: string; targetAmount: number; savedAmount?: number }): Promise<{ goal: SavingsGoal }> {
    return request('/api/savings/goal', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
  },

  async addSavings(amount: number): Promise<{ goal: SavingsGoal }> {
    return request('/api/savings/add', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  // Gemini AI calls
  async generateAIBudget(): Promise<{ message: string; budgets: CategoryBudget[]; plannedSavings: number; note?: string }> {
    return request('/api/gemini/budget', { method: 'POST' });
  },

  async getAIInsights(): Promise<AIInsightsData> {
    return request('/api/gemini/insights', { method: 'POST' });
  },

  async getMonthlySummary(): Promise<MonthlySummaryData> {
    return request('/api/gemini/monthly-summary', { method: 'POST' });
  },

  async simulateWhatIf(input: WhatIfScenarioInput): Promise<WhatIfResult> {
    return request('/api/gemini/what-if', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // Finance Companion Chat
  async sendCompanionMessage(message: string, history: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<CompanionChatResponse> {
    return request('/api/companion/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  },
};
