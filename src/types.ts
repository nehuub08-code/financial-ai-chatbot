export type NavigationTab = 
  | 'landing'
  | 'login'
  | 'signup'
  | 'onboarding'
  | 'dashboard'
  | 'income'
  | 'expenses'
  | 'budget'
  | 'savings'
  | 'insights'
  | 'summary'
  | 'what-if'
  | 'profile';

export interface User {
  id: string;
  name: string;
  email: string;
  monthlyIncome: number;
  savingsGoalTarget: number;
  savingFor?: string;
  spendingHabit?: 'Mostly essentials' | 'A mix of essentials and wants' | 'Mostly flexible spending';
  isOnboarded: boolean;
  createdAt: string;
}

export type IncomeSource = 'Salary' | 'Freelance' | 'Allowance' | 'Business' | 'Other';

export interface IncomeItem {
  id: string;
  userId: string;
  source: IncomeSource;
  amount: number;
  date: string;
  notes?: string;
}

export type ExpenseCategory = 
  | 'Food'
  | 'Rent'
  | 'Transport'
  | 'Education'
  | 'Shopping'
  | 'Entertainment'
  | 'Healthcare'
  | 'Bills'
  | 'Other';

export interface ExpenseItem {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  note?: string;
}

export interface CategoryBudget {
  category: ExpenseCategory;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  updatedAt: string;
}

export interface AIInsightsData {
  whatsGoingWell: string;
  keepAnEyeOn: string;
  oneThingToTry: string;
  nextGoal: string;
  oneQuickSuggestion?: string;
  isAiGenerated?: boolean;
}

export interface MonthlySummaryData {
  income: number;
  spent: number;
  saved: number;
  remaining: number;
  topCategories: { category: ExpenseCategory; amount: number; percentage: number }[];
  naturalLanguageSummary: string;
  nextMonthSuggestions: string[];
}

export interface WhatIfScenarioInput {
  question: string;
  amount?: number;
  category?: ExpenseCategory | 'Other';
  decisionType?: 'expense' | 'income_change';
}

export interface WhatIfResult {
  question: string;
  decisionType: 'expense' | 'income_change';
  hypotheticalAmount: number;
  category: ExpenseCategory | string;
  currentMonthlyIncome: number;
  currentTotalExpenses: number;
  currentMonthlySavings: number;
  possibleTotalExpenses: number;
  possibleMonthlySavings: number;
  savingsGoal?: {
    name: string;
    targetAmount: number;
    savedAmount: number;
  } | null;
  categoryBudget?: {
    category: string;
    currentSpent: number;
    limit: number;
    possibleSpent: number;
    wouldExceed: boolean;
  } | null;
  friendlyExplanation: string;
  simpleAlternative: string;
  isAiGenerated: boolean;
}

export interface CompanionWhatIfPayload {
  question: string;
  hypotheticalAmount: number;
  category: string;
  currentSavings: number;
  possibleRemaining: number;
  explanation: string;
  alternative: string;
  canAddAsExpense: boolean;
}

export interface CompanionChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  whatIf?: CompanionWhatIfPayload;
}

export interface CompanionChatResponse {
  reply: string;
  whatIf?: CompanionWhatIfPayload;
  quickSuggestions?: string[];
}

