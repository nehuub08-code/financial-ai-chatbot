import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory + persistent store
interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  monthlyIncome: number;
  savingsGoalTarget: number;
  savingFor?: string;
  spendingHabit?: 'Mostly essentials' | 'A mix of essentials and wants' | 'Mostly flexible spending';
  isOnboarded: boolean;
  createdAt: string;
}

interface StoredIncome {
  id: string;
  userId: string;
  source: string;
  amount: number;
  date: string;
  notes?: string;
}

interface StoredExpense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
}

interface StoredBudget {
  userId: string;
  category: string;
  limit: number;
}

interface StoredGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  updatedAt: string;
}

interface DB {
  users: StoredUser[];
  incomes: StoredIncome[];
  expenses: StoredExpense[];
  budgets: StoredBudget[];
  goals: StoredGoal[];
}

const DB_PATH = path.join(process.cwd(), 'data_store.json');

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_salt_pfab_2026').digest('hex');
}

function getInitialDB(): DB {
  const demoUserId = 'demo-user-rahul';
  const demoUser: StoredUser = {
    id: demoUserId,
    name: 'Rahul',
    email: 'rahul@example.com',
    passwordHash: hashPassword('password123'),
    monthlyIncome: 30000,
    savingsGoalTarget: 50000,
    savingFor: 'Emergency fund',
    spendingHabit: 'A mix of essentials and wants',
    isOnboarded: true,
    createdAt: new Date().toISOString(),
  };

  const today = new Date().toISOString().split('T')[0];

  const demoIncomes: StoredIncome[] = [
    { id: 'inc-1', userId: demoUserId, source: 'Salary', amount: 25000, date: today, notes: 'Monthly primary job salary' },
    { id: 'inc-2', userId: demoUserId, source: 'Freelance', amount: 5000, date: today, notes: 'Design consulting' },
  ];

  const demoExpenses: StoredExpense[] = [
    { id: 'exp-1', userId: demoUserId, amount: 8000, category: 'Rent', date: today, note: 'Monthly apartment rent' },
    { id: 'exp-2', userId: demoUserId, amount: 5000, category: 'Food', date: today, note: 'Groceries and dining' },
    { id: 'exp-3', userId: demoUserId, amount: 2000, category: 'Transport', date: today, note: 'Metro pass and auto' },
    { id: 'exp-4', userId: demoUserId, amount: 3000, category: 'Entertainment', date: today, note: 'Weekend movies & outings' },
    { id: 'exp-5', userId: demoUserId, amount: 2500, category: 'Bills', date: today, note: 'Electricity and mobile wifi' },
    { id: 'exp-6', userId: demoUserId, amount: 1500, category: 'Shopping', date: today, note: 'Clothes and essentials' },
  ];

  const demoBudgets: StoredBudget[] = [
    { userId: demoUserId, category: 'Rent', limit: 8000 },
    { userId: demoUserId, category: 'Food', limit: 6000 },
    { userId: demoUserId, category: 'Transport', limit: 3000 },
    { userId: demoUserId, category: 'Entertainment', limit: 2000 },
    { userId: demoUserId, category: 'Bills', limit: 3000 },
    { userId: demoUserId, category: 'Shopping', limit: 2000 },
  ];

  const demoGoals: StoredGoal[] = [
    {
      id: 'goal-1',
      userId: demoUserId,
      name: 'Emergency Fund',
      targetAmount: 50000,
      savedAmount: 20000,
      updatedAt: new Date().toISOString(),
    },
  ];

  return {
    users: [demoUser],
    incomes: demoIncomes,
    expenses: demoExpenses,
    budgets: demoBudgets,
    goals: demoGoals,
  };
}

let db: DB = getInitialDB();

// Try loading from file
try {
  if (fs.existsSync(DB_PATH)) {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    db = JSON.parse(data);
  } else {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }
} catch (e) {
  console.warn('Could not load local DB file, using in-memory store:', e);
}

function saveDB() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.warn('Failed to persist DB to file:', e);
  }
}

// Token generator & map
const sessionTokens = new Map<string, string>(); // token -> userId

function authenticate(req: Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  const userId = sessionTokens.get(token);
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) || null;
}

// Lazy Gemini AI initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (e) {
    console.error('Error initializing Gemini client:', e);
    return null;
  }
}

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

async function callGemini(prompt: string): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  // Supported model cascade: try primary gemini-3.8-flash; if experiencing 503 high demand or 429 rate limit, fallback to gemini-3.1-flash-lite or gemini-flash-latest
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text?.trim();
      if (text) {
        return cleanJsonString(text);
      }
    } catch (err: any) {
      // If temporary overload (503, 429, UNAVAILABLE, etc.), try next model in cascade
      const isTransient =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.status === 500 ||
        err?.message?.includes('503') ||
        err?.message?.includes('429') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('RESOURCE_EXHAUSTED');

      if (isTransient) {
        continue;
      }
      break;
    }
  }

  return null;
}

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Auth: Sign Up / Register
app.post(['/api/auth/signup', '/api/auth/register'], (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please check the information you entered.' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (db.users.some((u) => u.email === normalizedEmail)) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const newUser: StoredUser = {
      id: 'user-' + crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      monthlyIncome: 0,
      savingsGoalTarget: 0,
      isOnboarded: false,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDB();

    const token = 'tok-' + crypto.randomUUID();
    sessionTokens.set(token, newUser.id);

    const safeUser = { ...newUser };
    delete (safeUser as any).passwordHash;

    return res.json({ token, user: safeUser });
  } catch (e) {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Auth: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please check the information you entered.' });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = db.users.find((u) => u.email === normalizedEmail);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(400).json({ error: 'Incorrect email or password. Please try again.' });
    }

    const token = 'tok-' + crypto.randomUUID();
    sessionTokens.set(token, user.id);

    const safeUser = { ...user };
    delete (safeUser as any).passwordHash;

    return res.json({ token, user: safeUser });
  } catch (e) {
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Auth: Demo Login (Immediate testing with realistic numbers)
app.post('/api/auth/demo', (req: Request, res: Response) => {
  let demoUser = db.users.find((u) => u.id === 'demo-user-rahul');
  if (!demoUser) {
    const initial = getInitialDB();
    db = initial;
    saveDB();
    demoUser = db.users[0];
  }

  const token = 'tok-demo-' + crypto.randomUUID();
  sessionTokens.set(token, demoUser.id);

  const safeUser = { ...demoUser };
  delete (safeUser as any).passwordHash;

  return res.json({ token, user: safeUser });
});

// Auth: Me
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }
  const safeUser = { ...user };
  delete (safeUser as any).passwordHash;
  return res.json({ user: safeUser });
});

// Auth: Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    sessionTokens.delete(token);
  }
  return res.json({ success: true });
});

// Onboarding
app.post(['/api/user/onboarding', '/api/onboarding'], (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const { monthlyIncome, savingFor, spendingHabit } = req.body;
  user.monthlyIncome = Number(monthlyIncome) || 0;
  user.savingFor = savingFor || 'Emergency fund';
  user.spendingHabit = spendingHabit || 'A mix of essentials and wants';
  user.isOnboarded = true;

  // Auto-create initial default budget breakdown based on income if none exists
  const existingBudgets = db.budgets.filter((b) => b.userId === user.id);
  if (existingBudgets.length === 0 && user.monthlyIncome > 0) {
    const inc = user.monthlyIncome;
    db.budgets.push(
      { userId: user.id, category: 'Food', limit: Math.round(inc * 0.2) },
      { userId: user.id, category: 'Rent', limit: Math.round(inc * 0.3) },
      { userId: user.id, category: 'Transport', limit: Math.round(inc * 0.1) },
      { userId: user.id, category: 'Bills', limit: Math.round(inc * 0.1) },
      { userId: user.id, category: 'Entertainment', limit: Math.round(inc * 0.08) },
      { userId: user.id, category: 'Shopping', limit: Math.round(inc * 0.07) },
    );
  }

  // Create initial savings goal if none exists
  const existingGoal = db.goals.find((g) => g.userId === user.id);
  if (!existingGoal && user.monthlyIncome > 0) {
    const target = user.monthlyIncome * 3;
    db.goals.push({
      id: 'goal-' + crypto.randomUUID(),
      userId: user.id,
      name: user.savingFor || 'Emergency fund',
      targetAmount: target,
      savedAmount: 0,
      updatedAt: new Date().toISOString(),
    });
    user.savingsGoalTarget = target;
  }

  saveDB();

  const safeUser = { ...user };
  delete (safeUser as any).passwordHash;
  return res.json({ success: true, user: safeUser });
});

// Profile update
app.put('/api/user/profile', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const { name, monthlyIncome, savingsGoalTarget, password } = req.body;
  if (name) user.name = name.trim();
  if (monthlyIncome !== undefined) user.monthlyIncome = Number(monthlyIncome) || 0;
  if (savingsGoalTarget !== undefined) user.savingsGoalTarget = Number(savingsGoalTarget) || 0;
  if (password) user.passwordHash = hashPassword(password);

  saveDB();
  const safeUser = { ...user };
  delete (safeUser as any).passwordHash;
  return res.json({ success: true, user: safeUser });
});

// Reset user to demo data
app.post('/api/user/reset-demo', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  // Clear user data
  db.incomes = db.incomes.filter((i) => i.userId !== user.id);
  db.expenses = db.expenses.filter((e) => e.userId !== user.id);
  db.budgets = db.budgets.filter((b) => b.userId !== user.id);
  db.goals = db.goals.filter((g) => g.userId !== user.id);

  const today = new Date().toISOString().split('T')[0];
  user.monthlyIncome = 30000;
  user.savingsGoalTarget = 50000;
  user.isOnboarded = true;

  db.incomes.push(
    { id: 'inc-' + crypto.randomUUID(), userId: user.id, source: 'Salary', amount: 25000, date: today, notes: 'Monthly salary' },
    { id: 'inc-' + crypto.randomUUID(), userId: user.id, source: 'Freelance', amount: 5000, date: today, notes: 'Consulting' },
  );

  db.expenses.push(
    { id: 'exp-' + crypto.randomUUID(), userId: user.id, amount: 8000, category: 'Rent', date: today, note: 'Apartment rent' },
    { id: 'exp-' + crypto.randomUUID(), userId: user.id, amount: 5000, category: 'Food', date: today, note: 'Groceries & meals' },
    { id: 'exp-' + crypto.randomUUID(), userId: user.id, amount: 2000, category: 'Transport', date: today, note: 'Metro & travel' },
    { id: 'exp-' + crypto.randomUUID(), userId: user.id, amount: 3000, category: 'Entertainment', date: today, note: 'Outing with friends' },
    { id: 'exp-' + crypto.randomUUID(), userId: user.id, amount: 2500, category: 'Bills', date: today, note: 'Utilities & wifi' },
    { id: 'exp-' + crypto.randomUUID(), userId: user.id, amount: 1500, category: 'Shopping', date: today, note: 'Home items' },
  );

  db.budgets.push(
    { userId: user.id, category: 'Rent', limit: 8000 },
    { userId: user.id, category: 'Food', limit: 6000 },
    { userId: user.id, category: 'Transport', limit: 3000 },
    { userId: user.id, category: 'Entertainment', limit: 2000 },
    { userId: user.id, category: 'Bills', limit: 3000 },
    { userId: user.id, category: 'Shopping', limit: 2000 },
  );

  db.goals.push({
    id: 'goal-' + crypto.randomUUID(),
    userId: user.id,
    name: 'Emergency Fund',
    targetAmount: 50000,
    savedAmount: 20000,
    updatedAt: new Date().toISOString(),
  });

  saveDB();
  return res.json({ success: true });
});

// All financial data for current user
app.get('/api/data', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const userIncomes = db.incomes.filter((i) => i.userId === user.id);
  const userExpenses = db.expenses.filter((e) => e.userId === user.id);
  const userBudgets = db.budgets.filter((b) => b.userId === user.id);
  const userGoal = db.goals.find((g) => g.userId === user.id) || null;

  return res.json({
    incomes: userIncomes,
    expenses: userExpenses,
    budgets: userBudgets,
    goal: userGoal,
  });
});

// --- INCOME CRUD ---
app.post('/api/income', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const { source, amount, date, notes } = req.body;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Please enter a valid amount.' });
  }

  const newIncome: StoredIncome = {
    id: 'inc-' + crypto.randomUUID(),
    userId: user.id,
    source: source || 'Salary',
    amount: Math.round(Number(amount)),
    date: date || new Date().toISOString().split('T')[0],
    notes: notes ? notes.trim() : '',
  };

  db.incomes.unshift(newIncome);
  saveDB();
  return res.json({ success: true, item: newIncome });
});

app.put('/api/income/:id', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const item = db.incomes.find((i) => i.id === req.params.id && i.userId === user.id);
  if (!item) return res.status(404).json({ error: 'Income entry not found.' });

  const { source, amount, date, notes } = req.body;
  if (source) item.source = source;
  if (amount) item.amount = Math.round(Number(amount));
  if (date) item.date = date;
  if (notes !== undefined) item.notes = notes.trim();

  saveDB();
  return res.json({ success: true, item });
});

app.delete('/api/income/:id', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  db.incomes = db.incomes.filter((i) => !(i.id === req.params.id && i.userId === user.id));
  saveDB();
  return res.json({ success: true });
});

// --- EXPENSES CRUD ---
app.post('/api/expenses', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const { amount, category, date, note } = req.body;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Please enter a valid amount.' });
  }

  const newExpense: StoredExpense = {
    id: 'exp-' + crypto.randomUUID(),
    userId: user.id,
    amount: Math.round(Number(amount)),
    category: category || 'Other',
    date: date || new Date().toISOString().split('T')[0],
    note: note ? note.trim() : '',
  };

  db.expenses.unshift(newExpense);
  saveDB();
  return res.json({ success: true, item: newExpense });
});

app.put('/api/expenses/:id', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const item = db.expenses.find((e) => e.id === req.params.id && e.userId === user.id);
  if (!item) return res.status(404).json({ error: 'Expense entry not found.' });

  const { amount, category, date, note } = req.body;
  if (amount) item.amount = Math.round(Number(amount));
  if (category) item.category = category;
  if (date) item.date = date;
  if (note !== undefined) item.note = note.trim();

  saveDB();
  return res.json({ success: true, item });
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  db.expenses = db.expenses.filter((e) => !(e.id === req.params.id && e.userId === user.id));
  saveDB();
  return res.json({ success: true });
});

// --- BUDGETS CRUD ---
app.post('/api/budget', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const { budgets } = req.body; // array of { category, limit }
  if (!Array.isArray(budgets)) {
    return res.status(400).json({ error: 'Please provide valid budget categories.' });
  }

  // Remove existing budgets for this user
  db.budgets = db.budgets.filter((b) => b.userId !== user.id);

  for (const b of budgets) {
    if (b.category && b.limit !== undefined) {
      db.budgets.push({
        userId: user.id,
        category: b.category,
        limit: Math.max(0, Math.round(Number(b.limit))),
      });
    }
  }

  saveDB();
  return res.json({ success: true, budgets: db.budgets.filter((b) => b.userId === user.id) });
});

// --- SAVINGS GOAL CRUD ---
app.post('/api/savings/goal', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const { name, targetAmount, savedAmount } = req.body;
  if (!name || targetAmount === undefined) {
    return res.status(400).json({ error: 'Please enter a goal name and target amount.' });
  }

  let goal = db.goals.find((g) => g.userId === user.id);
  if (!goal) {
    goal = {
      id: 'goal-' + crypto.randomUUID(),
      userId: user.id,
      name: name.trim(),
      targetAmount: Math.round(Number(targetAmount)),
      savedAmount: savedAmount !== undefined ? Math.round(Number(savedAmount)) : 0,
      updatedAt: new Date().toISOString(),
    };
    db.goals.push(goal);
  } else {
    goal.name = name.trim();
    goal.targetAmount = Math.round(Number(targetAmount));
    if (savedAmount !== undefined) goal.savedAmount = Math.round(Number(savedAmount));
    goal.updatedAt = new Date().toISOString();
  }

  user.savingsGoalTarget = goal.targetAmount;
  saveDB();
  return res.json({ success: true, goal });
});

app.post('/api/savings/add', (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const { amount } = req.body;
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Please enter a valid amount to save.' });
  }

  let goal = db.goals.find((g) => g.userId === user.id);
  if (!goal) {
    goal = {
      id: 'goal-' + crypto.randomUUID(),
      userId: user.id,
      name: user.savingFor || 'Emergency Fund',
      targetAmount: user.savingsGoalTarget || 50000,
      savedAmount: 0,
      updatedAt: new Date().toISOString(),
    };
    db.goals.push(goal);
  }

  goal.savedAmount += Math.round(Number(amount));
  goal.updatedAt = new Date().toISOString();
  saveDB();

  return res.json({ success: true, goal });
});

// --- GEMINI AI FEATURES ---

// 1. AI Budget Generation
app.post('/api/gemini/budget', async (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const userIncomes = db.incomes.filter((i) => i.userId === user.id);
  const userExpenses = db.expenses.filter((e) => e.userId === user.id);

  const totalIncome = userIncomes.reduce((s, i) => s + i.amount, 0) || user.monthlyIncome || 30000;
  const expenseByCategory: Record<string, number> = {};
  userExpenses.forEach((e) => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
  });

  const prompt = `You are a warm, simple, supportive personal finance assistant for ordinary people (students, freelancers, salaried workers, families).
The user earns a monthly income of ₹${totalIncome.toLocaleString('en-IN')}.
Their current spending by category: ${JSON.stringify(expenseByCategory)}.
Their savings priority: "${user.savingFor || 'Emergency fund'}".
Their spending style: "${user.spendingHabit || 'A mix of essentials and wants'}".

Create a simple, realistic, balanced monthly budget plan.
Rules:
- Simple human language only. NO jargon (no "portfolio optimization", no "algorithmic allocation").
- Categories should be from: Food, Rent, Transport, Bills, Entertainment, Shopping, Education, Healthcare, Other.
- Allocate a healthy portion (around 20-30%) for savings.
- Ensure total planned spending + savings equals or closely matches the total income of ₹${totalIncome}.
- Return ONLY valid JSON with this exact schema:
{
  "message": "Based on what you usually spend, here's a simple plan for this month.",
  "budgets": [
    {"category": "Food", "limit": 5000},
    {"category": "Rent", "limit": 8000},
    {"category": "Transport", "limit": 2000},
    {"category": "Bills", "limit": 3000},
    {"category": "Entertainment", "limit": 2000},
    {"category": "Shopping", "limit": 2000}
  ],
  "plannedSavings": 8000
}`;

  const rawText = await callGemini(prompt);
  if (rawText) {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed && parsed.budgets && Array.isArray(parsed.budgets)) {
        return res.json(parsed);
      }
    } catch {
      // Gracefully continue to heuristic calculation
    }
  }

  // Graceful rule-based fallback based on user's exact numbers
  const savingsAmount = Math.round(totalIncome * 0.25);
  const remainingForExpenses = totalIncome - savingsAmount;
  const rent = expenseByCategory['Rent'] || Math.round(remainingForExpenses * 0.35);
  const food = expenseByCategory['Food'] || Math.round(remainingForExpenses * 0.25);
  const transport = expenseByCategory['Transport'] || Math.round(remainingForExpenses * 0.1);
  const bills = expenseByCategory['Bills'] || Math.round(remainingForExpenses * 0.12);
  const entertainment = Math.round(remainingForExpenses * 0.09);
  const shopping = Math.round(remainingForExpenses * 0.09);

  return res.json({
    message: "Based on what you usually spend, here's a simple plan for this month.",
    budgets: [
      { category: 'Rent', limit: rent },
      { category: 'Food', limit: food },
      { category: 'Bills', limit: bills },
      { category: 'Transport', limit: transport },
      { category: 'Entertainment', limit: entertainment },
      { category: 'Shopping', limit: shopping },
    ],
    plannedSavings: savingsAmount,
    note: 'Your financial data is safe. This plan was tailored to your current income and spending.',
  });
});

// 2. AI Insights
app.post('/api/gemini/insights', async (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const userIncomes = db.incomes.filter((i) => i.userId === user.id);
  const userExpenses = db.expenses.filter((e) => e.userId === user.id);
  const userBudgets = db.budgets.filter((b) => b.userId === user.id);
  const userGoal = db.goals.find((g) => g.userId === user.id);

  const totalIncome = userIncomes.reduce((s, i) => s + i.amount, 0) || user.monthlyIncome || 30000;
  const totalSpent = userExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSaved = Math.max(0, totalIncome - totalSpent);

  const expensesByCategory: Record<string, number> = {};
  userExpenses.forEach((e) => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });

  const budgetsByCategory: Record<string, number> = {};
  userBudgets.forEach((b) => {
    budgetsByCategory[b.category] = b.limit;
  });

  const prompt = `You are a supportive, friendly financial advisor speaking to a real person.
User's financial summary:
- Monthly Income: ₹${totalIncome}
- Total Spent: ₹${totalSpent}
- Total Saved: ₹${totalSaved}
- Spending by category: ${JSON.stringify(expensesByCategory)}
- Planned Budgets: ${JSON.stringify(budgetsByCategory)}
- Savings Goal: ${userGoal ? `${userGoal.name} (Saved: ₹${userGoal.savedAmount}, Target: ₹${userGoal.targetAmount})` : 'Not set yet'}

Generate 4 friendly, supportive, short insights in simple human language.
Tone guidelines:
- Supportive and friendly, never judgmental or robotic.
- Avoid technical jargon (no "variance", "financial health score", "analytics").
- Instead of "You overspent by 32%", say "Entertainment is a little above your planned amount."
- Keep each message to 1-2 short sentences.

Return ONLY valid JSON matching this schema:
{
  "whatsGoingWell": "You've kept your transport spending within your planned amount.",
  "keepAnEyeOn": "Entertainment is slightly higher than planned this month.",
  "oneThingToTry": "Try setting aside your planned savings right on payday.",
  "nextGoal": "Try to save ₹1,000 more next month.",
  "oneQuickSuggestion": "You're spending a little more on entertainment this month. Reducing it by around ₹500 could help you stay closer to your savings goal."
}`;

  const rawText = await callGemini(prompt);
  if (rawText) {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed && parsed.whatsGoingWell) {
        parsed.isAiGenerated = true;
        return res.json(parsed);
      }
    } catch {
      // Gracefully continue to heuristic calculation
    }
  }

  // Friendly heuristic fallback matching prompt examples
  let wellCategory = 'transport';
  let highCategory = 'entertainment';

  for (const cat of Object.keys(expensesByCategory)) {
    const spent = expensesByCategory[cat] || 0;
    const limit = budgetsByCategory[cat] || 0;
    if (limit > 0 && spent <= limit) {
      wellCategory = cat.toLowerCase();
    }
    if (limit > 0 && spent > limit) {
      highCategory = cat.toLowerCase();
    }
  }

  return res.json({
    whatsGoingWell: `You've kept your ${wellCategory} spending within your planned amount.`,
    keepAnEyeOn: `${highCategory.charAt(0).toUpperCase() + highCategory.slice(1)} spending is slightly higher than your usual amount.`,
    oneThingToTry: 'Try setting aside your savings at the beginning of the month.',
    nextGoal: 'Try to save ₹1,000 more next month.',
    oneQuickSuggestion: `You're spending a little more on ${highCategory} this month. Reducing it by around ₹500 could help you stay closer to your savings goal.`,
    isAiGenerated: false,
  });
});

// 3. Monthly Summary
app.post('/api/gemini/monthly-summary', async (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const userIncomes = db.incomes.filter((i) => i.userId === user.id);
  const userExpenses = db.expenses.filter((e) => e.userId === user.id);

  const totalIncome = userIncomes.reduce((s, i) => s + i.amount, 0) || user.monthlyIncome || 30000;
  const totalSpent = userExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSaved = Math.max(0, totalIncome - totalSpent);
  const remaining = totalSaved;

  const expensesByCategory: Record<string, number> = {};
  userExpenses.forEach((e) => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({
      category: category as any,
      amount,
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const prompt = `You are a friendly personal finance friend.
User's Month in Review:
- Earned: ₹${totalIncome}
- Spent: ₹${totalSpent}
- Saved: ₹${totalSaved}
- Top spending: ${JSON.stringify(sortedCategories)}
- User Goal: ${user.savingFor || 'Emergency fund'}

Generate:
1. "naturalLanguageSummary": A 1-2 sentence warm human summary (e.g. "You earned ₹30,000 and spent ₹22,000. You saved ₹8,000, which puts you on track with your current savings goal.")
2. "nextMonthSuggestions": An array of 3 short, friendly, practical bullet points for next month.

Return ONLY valid JSON:
{
  "naturalLanguageSummary": "...",
  "nextMonthSuggestions": ["...", "...", "..."]
}`;

  const rawText = await callGemini(prompt);
  if (rawText) {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed && parsed.naturalLanguageSummary) {
        return res.json({
          income: totalIncome,
          spent: totalSpent,
          saved: totalSaved,
          remaining,
          topCategories: sortedCategories,
          naturalLanguageSummary: parsed.naturalLanguageSummary,
          nextMonthSuggestions: parsed.nextMonthSuggestions || [],
        });
      }
    } catch {
      // Gracefully continue to heuristic calculation
    }
  }

  // Friendly natural language heuristic fallback
  return res.json({
    income: totalIncome,
    spent: totalSpent,
    saved: totalSaved,
    remaining,
    topCategories: sortedCategories,
    naturalLanguageSummary: `You earned ₹${totalIncome.toLocaleString('en-IN')} and spent ₹${totalSpent.toLocaleString('en-IN')}. You saved ₹${totalSaved.toLocaleString('en-IN')}, which puts you on track with your current savings goal.`,
    nextMonthSuggestions: [
      'Keep setting aside savings as soon as your primary income arrives.',
      'Check if small recurring subscriptions or dining out can be trimmed by ₹500.',
      'Review your progress mid-month to stay comfortably within your plan.',
    ],
  });
});

// 4. Money What-If Simulation
app.post('/api/gemini/what-if', async (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const { question, amount, category, decisionType } = req.body;
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Please enter a what-if question or decision.' });
  }

  const trimmedQuestion = question.trim();

  // User financial records
  const userIncomes = db.incomes.filter((i) => i.userId === user.id);
  const userExpenses = db.expenses.filter((e) => e.userId === user.id);
  const userBudgets = db.budgets.filter((b) => b.userId === user.id);
  const userGoal = db.goals.find((g) => g.userId === user.id);

  const totalIncome = userIncomes.reduce((s, i) => s + i.amount, 0) || user.monthlyIncome || 30000;
  const totalSpent = userExpenses.reduce((s, e) => s + e.amount, 0);
  const currentMonthlySavings = Math.max(0, totalIncome - totalSpent);

  // Extract or validate amount
  let parsedAmount = Number(amount);
  if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
    const match = trimmedQuestion.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*)/i);
    if (match && match[1]) {
      parsedAmount = parseInt(match[1].replace(/,/g, ''), 10);
    }
    if (!parsedAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      parsedAmount = 2000;
    }
  }
  const hypotheticalAmount = Math.round(parsedAmount);

  // Detect decision type
  let detectedType = decisionType || 'expense';
  const qLower = trimmedQuestion.toLowerCase();
  if (!decisionType) {
    if (qLower.includes('income is') || qLower.includes('earn less') || qLower.includes('lower income') || qLower.includes('salary cut') || qLower.includes('less salary')) {
      detectedType = 'income_change';
    }
  }

  // Detect category if not provided or 'Other'
  let detectedCategory = category || 'Other';
  if (!category || category === 'Other') {
    if (qLower.includes('shop') || qLower.includes('clothes') || qLower.includes('phone') || qLower.includes('laptop') || qLower.includes('gadget') || qLower.includes('shoes') || qLower.includes('buy')) {
      detectedCategory = 'Shopping';
    } else if (qLower.includes('trip') || qLower.includes('travel') || qLower.includes('vacation') || qLower.includes('flight') || qLower.includes('cab') || qLower.includes('metro') || qLower.includes('petrol') || qLower.includes('fuel')) {
      detectedCategory = 'Transport';
    } else if (qLower.includes('food') || qLower.includes('dinner') || qLower.includes('lunch') || qLower.includes('zomato') || qLower.includes('swiggy') || qLower.includes('grocery') || qLower.includes('restaurant') || qLower.includes('cafe')) {
      detectedCategory = 'Food';
    } else if (qLower.includes('movie') || qLower.includes('concert') || qLower.includes('game') || qLower.includes('netflix') || qLower.includes('party')) {
      detectedCategory = 'Entertainment';
    } else if (qLower.includes('rent') || qLower.includes('flat') || qLower.includes('pg') || qLower.includes('hostel')) {
      detectedCategory = 'Rent';
    } else if (qLower.includes('bill') || qLower.includes('electricity') || qLower.includes('wifi') || qLower.includes('recharge')) {
      detectedCategory = 'Bills';
    } else if (qLower.includes('doctor') || qLower.includes('medicine') || qLower.includes('health') || qLower.includes('hospital')) {
      detectedCategory = 'Healthcare';
    } else if (qLower.includes('course') || qLower.includes('book') || qLower.includes('exam') || qLower.includes('tution') || qLower.includes('school') || qLower.includes('college')) {
      detectedCategory = 'Education';
    }
  }

  // Calculations
  let possibleTotalExpenses = totalSpent;
  let possibleMonthlySavings = currentMonthlySavings;

  if (detectedType === 'income_change') {
    const possibleIncome = Math.max(0, totalIncome - hypotheticalAmount);
    possibleMonthlySavings = Math.max(0, possibleIncome - totalSpent);
  } else {
    possibleTotalExpenses = totalSpent + hypotheticalAmount;
    possibleMonthlySavings = totalIncome - possibleTotalExpenses;
  }

  // Category budget impact
  const matchingBudget = userBudgets.find((b) => b.category.toLowerCase() === detectedCategory.toLowerCase());
  let categoryBudget = null;
  if (matchingBudget) {
    const currentSpentInCat = userExpenses
      .filter((e) => e.category.toLowerCase() === detectedCategory.toLowerCase())
      .reduce((s, e) => s + e.amount, 0);
    const possibleSpentInCat = currentSpentInCat + (detectedType === 'expense' ? hypotheticalAmount : 0);
    categoryBudget = {
      category: matchingBudget.category,
      currentSpent: currentSpentInCat,
      limit: matchingBudget.limit,
      possibleSpent: possibleSpentInCat,
      wouldExceed: possibleSpentInCat > matchingBudget.limit,
    };
  }

  const savingsGoal = userGoal
    ? {
        name: userGoal.name,
        targetAmount: userGoal.targetAmount,
        savedAmount: userGoal.savedAmount,
      }
    : null;

  // Gemini AI generation
  const prompt = `You are a warm, simple, supportive personal finance friend.
A person is asking a "What-If" decision question before making a financial choice:
"${trimmedQuestion}"

User's actual current financial information:
- Monthly Income: ₹${totalIncome}
- Current Spent This Month: ₹${totalSpent}
- Current Monthly Savings: ₹${currentMonthlySavings}
- Existing Savings Goal: ${userGoal ? `${userGoal.name} (Target: ₹${userGoal.targetAmount}, Saved: ₹${userGoal.savedAmount})` : 'None'}
- Category: ${detectedCategory}
- Hypothetical Amount: ₹${hypotheticalAmount}
- Decision Type: ${detectedType}

Calculated Possible Impact (this is a simulation to help them plan, not a prediction or guarantee):
- Possible new spending: ₹${possibleTotalExpenses}
- Possible remaining monthly savings: ₹${possibleMonthlySavings}
${categoryBudget ? `- ${categoryBudget.category} budget limit: ₹${categoryBudget.limit}, possible spent: ₹${categoryBudget.possibleSpent} (${categoryBudget.wouldExceed ? 'would exceed planned budget' : 'within planned budget'})` : ''}

Generate:
1. "friendlyExplanation": A simple 1-2 sentence human explanation of the possible impact. (e.g. "If you make this purchase, your planned savings for this month could decrease by about ₹${hypotheticalAmount.toLocaleString('en-IN')}.")
2. "simpleAlternative": A practical, friendly alternative or suggestion to help balance this decision. (e.g. "If reaching your ${userGoal ? userGoal.name : 'savings'} goal is important, you could reduce another flexible expense by around ₹${hypotheticalAmount.toLocaleString('en-IN')}.")

CRITICAL INSTRUCTIONS:
- Never use technical jargon (NO "Scenario Engine", NO "Predictive Financial Model", NO "Simulation Algorithm", NO "Financial Forecasting Engine", NO "variance", NO "algorithmic allocation").
- Speak in natural, everyday human language: supportive, clear, practical.
- Frame results clearly as possible impact, never a certain future prediction.
- Keep each message to 1-2 concise sentences.

Return ONLY valid JSON matching this schema:
{
  "friendlyExplanation": "If you make this purchase, your planned savings for this month could decrease by about ₹3,000.",
  "simpleAlternative": "If reaching your ₹10,000 savings goal is important, you could reduce another flexible expense by around ₹3,000."
}`;

  const rawText = await callGemini(prompt);
  let friendlyExplanation = '';
  let simpleAlternative = '';
  let isAiGenerated = false;

  if (rawText) {
    try {
      const parsed = JSON.parse(rawText);
      if (parsed && parsed.friendlyExplanation && parsed.simpleAlternative) {
        friendlyExplanation = parsed.friendlyExplanation;
        simpleAlternative = parsed.simpleAlternative;
        isAiGenerated = true;
      }
    } catch {
      // Gracefully continue to fallback
    }
  }

  if (!isAiGenerated) {
    if (detectedType === 'income_change') {
      friendlyExplanation = `If your income is ₹${hypotheticalAmount.toLocaleString('en-IN')} lower next month, your monthly savings could decrease to about ₹${Math.max(0, possibleMonthlySavings).toLocaleString('en-IN')}.`;
      simpleAlternative = `You could temporarily adjust flexible spending categories like shopping or entertainment by around ₹${Math.round(hypotheticalAmount * 0.5).toLocaleString('en-IN')} to protect your essential savings.`;
    } else {
      friendlyExplanation = `If you make this purchase, your planned savings for this month could decrease by about ₹${hypotheticalAmount.toLocaleString('en-IN')}, leaving possible savings of ₹${Math.max(0, possibleMonthlySavings).toLocaleString('en-IN')}.`;
      simpleAlternative = `If reaching your ${userGoal?.name || 'savings'} goal is important, you could reduce another flexible expense by around ₹${hypotheticalAmount.toLocaleString('en-IN')} to balance it.`;
    }
  }

  return res.json({
    question: trimmedQuestion,
    decisionType: detectedType,
    hypotheticalAmount,
    category: detectedCategory,
    currentMonthlyIncome: totalIncome,
    currentTotalExpenses: totalSpent,
    currentMonthlySavings,
    possibleTotalExpenses,
    possibleMonthlySavings,
    savingsGoal,
    categoryBudget,
    friendlyExplanation,
    simpleAlternative,
    isAiGenerated,
  });
});

// 5. Finance Companion Chatbot
app.post('/api/companion/chat', async (req: Request, res: Response) => {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ error: 'Please sign in to continue.' });

  const { message, history } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Please enter a message.' });
  }

  const query = message.trim();
  const queryLower = query.toLowerCase();

  // Retrieve authenticated user's exact financial records
  const userIncomes = db.incomes.filter((i) => i.userId === user.id);
  const userExpenses = db.expenses.filter((e) => e.userId === user.id);
  const userBudgets = db.budgets.filter((b) => b.userId === user.id);
  const userGoal = db.goals.find((g) => g.userId === user.id);

  // Accurate backend calculations
  const totalIncome = userIncomes.reduce((s, i) => s + i.amount, 0) || user.monthlyIncome || 0;
  const totalSpent = userExpenses.reduce((s, e) => s + e.amount, 0);
  const totalSaved = Math.max(0, totalIncome - totalSpent);
  const remaining = totalSaved;

  // Breakdown by category
  const categorySpentMap: Record<string, number> = {};
  userExpenses.forEach((e) => {
    categorySpentMap[e.category] = (categorySpentMap[e.category] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categorySpentMap)
    .map(([cat, amt]) => ({ category: cat, amount: amt, percent: totalSpent > 0 ? Math.round((amt / totalSpent) * 100) : 0 }))
    .sort((a, b) => b.amount - a.amount);

  const topExpense = sortedCategories[0] || null;

  // Budget status calculations
  const budgetStatuses = userBudgets.map((b) => {
    const spent = categorySpentMap[b.category] || 0;
    const isOver = spent > b.limit;
    const diff = spent - b.limit;
    return { category: b.category, spent, limit: b.limit, isOver, diff };
  });
  const overBudgetCategories = budgetStatuses.filter((b) => b.isOver);

  // Check if financial data is completely empty
  if (totalIncome === 0 && userExpenses.length === 0) {
    if (queryLower.includes('how much') || queryLower.includes('budget') || queryLower.includes('spend') || queryLower.includes('save')) {
      return res.json({
        reply: "I don't have enough information about your income or expenses yet. Add your monthly income or log your first expense, and I'll help you understand your money.",
        quickSuggestions: ['Add income', 'Add expense', 'Create budget'],
      });
    }
  }

  // --- TYPE 3: WHAT-IF SCENARIO QUESTION ---
  const isWhatIfQuestion =
    queryLower.startsWith('can i spend') ||
    queryLower.startsWith('can i afford') ||
    queryLower.startsWith('can i buy') ||
    queryLower.startsWith('what if i spend') ||
    queryLower.startsWith('what happens if i spend') ||
    queryLower.startsWith('what if i buy') ||
    queryLower.startsWith('what happens if i buy') ||
    (queryLower.includes('what if') && (queryLower.includes('spend') || queryLower.includes('buy') || queryLower.includes('income')));

  if (isWhatIfQuestion) {
    // Extract hypothetical amount
    let hypAmount = 0;
    const numMatch = query.match(/(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*)/i);
    if (numMatch && numMatch[1]) {
      hypAmount = parseInt(numMatch[1].replace(/,/g, ''), 10);
    }
    if (!hypAmount || isNaN(hypAmount)) {
      hypAmount = 2000;
    }

    // Detect category
    let hypCategory = 'Shopping';
    if (queryLower.includes('food') || queryLower.includes('dinner') || queryLower.includes('lunch') || queryLower.includes('cafe') || queryLower.includes('restaurant')) {
      hypCategory = 'Food';
    } else if (queryLower.includes('trip') || queryLower.includes('travel') || queryLower.includes('flight') || queryLower.includes('cab') || queryLower.includes('fuel')) {
      hypCategory = 'Transport';
    } else if (queryLower.includes('movie') || queryLower.includes('party') || queryLower.includes('concert') || queryLower.includes('game')) {
      hypCategory = 'Entertainment';
    } else if (queryLower.includes('phone') || queryLower.includes('bag') || queryLower.includes('shoes') || queryLower.includes('clothes') || queryLower.includes('watch') || queryLower.includes('laptop')) {
      hypCategory = 'Shopping';
    } else if (queryLower.includes('bill') || queryLower.includes('recharge')) {
      hypCategory = 'Bills';
    }

    const currentSavingsNumber = totalSaved;
    const possibleRemaining = currentSavingsNumber - hypAmount;
    const matchingBudget = userBudgets.find((b) => b.category.toLowerCase() === hypCategory.toLowerCase());
    const currentCatSpent = categorySpentMap[hypCategory] || 0;
    const possibleCatSpent = currentCatSpent + hypAmount;

    let explanation = `If you make this purchase, your planned savings for this month could decrease by about ₹${hypAmount.toLocaleString('en-IN')}, leaving possible savings of ₹${Math.max(0, possibleRemaining).toLocaleString('en-IN')}.`;
    if (matchingBudget && possibleCatSpent > matchingBudget.limit) {
      explanation += ` Note that this would put your ${hypCategory} spending ₹${(possibleCatSpent - matchingBudget.limit).toLocaleString('en-IN')} over your planned limit.`;
    }

    const alternative = userGoal
      ? `If reaching your ${userGoal.name} savings goal is important, you could reduce another flexible expense by around ₹${hypAmount.toLocaleString('en-IN')}.`
      : `You could trim a little from another flexible spending category to balance it.`;

    return res.json({
      reply: explanation + ' ' + alternative,
      whatIf: {
        question: query,
        hypotheticalAmount: hypAmount,
        category: hypCategory,
        currentSavings: currentSavingsNumber,
        possibleRemaining: Math.max(0, possibleRemaining),
        explanation,
        alternative,
        canAddAsExpense: true,
      },
    });
  }

  // --- TYPE 1: FINANCIAL DATA QUESTIONS (Exact Backend Calculation) ---
  // A. Specific category spending (e.g., "how much did I spend on food?")
  const categoriesList = ['Food', 'Rent', 'Transport', 'Education', 'Shopping', 'Entertainment', 'Healthcare', 'Bills', 'Other'];
  const mentionedCat = categoriesList.find((c) => queryLower.includes(c.toLowerCase()));
  if (
    mentionedCat &&
    (queryLower.includes('how much') || queryLower.includes('spend') || queryLower.includes('spent') || queryLower.includes('cost') || queryLower.includes('money'))
  ) {
    const spentInCat = categorySpentMap[mentionedCat] || 0;
    const catBudget = userBudgets.find((b) => b.category.toLowerCase() === mentionedCat.toLowerCase());

    if (spentInCat === 0) {
      return res.json({
        reply: `You haven't spent anything on ${mentionedCat} this month.${catBudget ? ` You have a planned limit of ₹${catBudget.limit.toLocaleString('en-IN')}.` : ''}`,
      });
    }

    let reply = `You spent ₹${spentInCat.toLocaleString('en-IN')} on ${mentionedCat} this month.`;
    if (catBudget) {
      if (spentInCat > catBudget.limit) {
        reply += ` This is ₹${(spentInCat - catBudget.limit).toLocaleString('en-IN')} above your planned limit of ₹${catBudget.limit.toLocaleString('en-IN')}.`;
      } else {
        reply += ` That's within your planned budget limit of ₹${catBudget.limit.toLocaleString('en-IN')}, with ₹${(catBudget.limit - spentInCat).toLocaleString('en-IN')} remaining.`;
      }
    }
    return res.json({ reply });
  }

  // B. Total spent
  if (
    queryLower === 'where did my money go?' ||
    queryLower.includes('where did my money go') ||
    queryLower.includes('how much did i spend this month') ||
    queryLower.includes('how much have i spent') ||
    queryLower.includes('how much did i spend') ||
    queryLower.includes('total spending') ||
    queryLower.includes('total expenses')
  ) {
    if (userExpenses.length === 0) {
      return res.json({
        reply: `You haven't recorded any expenses yet this month. Your income is ₹${totalIncome.toLocaleString('en-IN')}, so you currently have all of it available.`,
      });
    }

    let reply = `You spent ₹${totalSpent.toLocaleString('en-IN')} this month across ${userExpenses.length} ${userExpenses.length === 1 ? 'expense' : 'expenses'}.`;
    if (topExpense) {
      reply += ` Your biggest category is ${topExpense.category} at ₹${topExpense.amount.toLocaleString('en-IN')} (${topExpense.percent}% of spending).`;
    }
    reply += ` You currently have ₹${totalSaved.toLocaleString('en-IN')} remaining in savings.`;

    return res.json({ reply });
  }

  // C. Biggest expense
  if (
    queryLower.includes('biggest expense') ||
    queryLower.includes('largest expense') ||
    queryLower.includes('most expensive') ||
    queryLower.includes('highest spending')
  ) {
    if (!topExpense) {
      return res.json({
        reply: "You haven't recorded any expenses yet this month.",
      });
    }
    return res.json({
      reply: `Your biggest expense category this month is ${topExpense.category}, where you've spent ₹${topExpense.amount.toLocaleString('en-IN')} (${topExpense.percent}% of your total spending).`,
    });
  }

  // D. Savings / remaining money
  if (
    queryLower === 'how much did i save?' ||
    queryLower.includes('how much have i saved') ||
    queryLower.includes('how much did i save') ||
    queryLower.includes('how much money do i have left') ||
    queryLower.includes('money left') ||
    queryLower.includes('my savings') ||
    queryLower.includes('current savings')
  ) {
    let reply = `You currently have ₹${totalSaved.toLocaleString('en-IN')} saved/remaining from your income this month.`;
    if (userGoal) {
      reply += ` For your "${userGoal.name}" goal, you've saved ₹${userGoal.savedAmount.toLocaleString('en-IN')} towards your ₹${userGoal.targetAmount.toLocaleString('en-IN')} target.`;
    }
    return res.json({ reply });
  }

  // E. Budget check
  if (
    queryLower === 'check my budget' ||
    queryLower.includes('check my budget') ||
    queryLower.includes('am i within my budget') ||
    queryLower.includes('am i over budget') ||
    queryLower.includes('how is my budget') ||
    queryLower.includes('budget status')
  ) {
    if (userBudgets.length === 0) {
      return res.json({
        reply: "You haven't set up budget limits yet. You can visit the Budget tab to set planned limits for your categories.",
      });
    }

    if (overBudgetCategories.length > 0) {
      const overNames = overBudgetCategories.map((b) => `${b.category} (₹${b.diff.toLocaleString('en-IN')} over limit)`).join(', ');
      return res.json({
        reply: `You're currently a little over budget in: ${overNames}. Your other categories are comfortably within your planned amounts.`,
      });
    }

    return res.json({
      reply: `Good news! All of your expense categories are within your planned budget limits this month. You have ₹${totalSaved.toLocaleString('en-IN')} remaining.`,
    });
  }

  // --- TYPE 2: FINANCIAL GUIDANCE QUESTIONS (Gemini AI with user financial facts) ---
  // Minimal necessary financial facts
  const financialSummaryContext = {
    monthlyIncome: totalIncome,
    totalSpent,
    totalSaved,
    topCategories: sortedCategories.slice(0, 3),
    overBudgetCategories: overBudgetCategories.map((b) => b.category),
    savingsGoal: userGoal ? { name: userGoal.name, target: userGoal.targetAmount, saved: userGoal.savedAmount } : null,
  };

  const isInvestmentQuery =
    queryLower.includes('invest') ||
    queryLower.includes('stocks') ||
    queryLower.includes('mutual fund') ||
    queryLower.includes('crypto') ||
    queryLower.includes('shares');

  // Build prompt for Gemini
  const prompt = `You are "Finance Companion", a friendly, warm, supportive personal money friend inside the Personal Finance Advisor Bot.
You are talking to ${user.name ? user.name.split(' ')[0] : 'a friend'}.

User's exact real financial numbers:
${JSON.stringify(financialSummaryContext)}

Recent conversation context:
${Array.isArray(history) ? history.slice(-4).map((h: any) => `${h.role === 'user' ? 'User' : 'Companion'}: ${h.content}`).join('\n') : 'None'}

User's current question:
"${query}"

Instructions:
1. Speak in human, warm, simple language. Never sound like a robotic institution or generic ChatGPT clone.
2. Provide a short, practical, non-judgmental answer (maximum 2 to 3 concise sentences).
3. Do NOT use complicated financial jargon (NO "expenditure variance", NO "asset allocation matrix", NO "portfolio optimization").
4. If they ask "Is that too much?" or follow up on a previous category, look at the recent conversation context and answer directly.
5. If the user asks about investments, give general educational information and include: "This is general information, not professional financial advice."
6. If critical info is missing to answer the query, say: "I don't have enough information about that yet." and gently tell them what to add.

Return ONLY a direct, natural text reply.`;

  const rawAiReply = await callGemini(prompt);
  if (rawAiReply && rawAiReply.trim()) {
    let cleanReply = rawAiReply.trim();
    // If Gemini formatted as markdown code block or JSON object
    if (cleanReply.startsWith('```')) {
      cleanReply = cleanReply.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    }
    if (cleanReply.startsWith('{') && cleanReply.endsWith('}')) {
      try {
        const parsed = JSON.parse(cleanReply);
        cleanReply = parsed.reply || parsed.message || parsed.response || parsed.answer || cleanReply;
      } catch {
        // use cleanReply as is
      }
    }
    if (cleanReply.startsWith('"') && cleanReply.endsWith('"')) {
      cleanReply = cleanReply.slice(1, -1);
    }
    return res.json({ reply: cleanReply });
  }

  // Heuristic guidance fallback
  let fallbackReply = "You're making steady progress. Keeping an eye on flexible spending like shopping and dining out is usually the easiest way to save a little extra each month.";
  if (queryLower === 'help me save' || queryLower.includes('help me save') || queryLower.includes('how can i save more')) {
    if (topExpense) {
      fallbackReply = `Since your highest spending is currently in ${topExpense.category} (₹${topExpense.amount.toLocaleString('en-IN')}), trimming even 10% from that category could add around ₹${Math.round(topExpense.amount * 0.1).toLocaleString('en-IN')} to your savings.`;
    } else {
      fallbackReply = "Setting aside your savings at the beginning of the month as soon as your income arrives is the most reliable way to build your savings habit.";
    }
  } else if (queryLower.includes('why am i spending so much')) {
    if (sortedCategories.length > 0) {
      const topCats = sortedCategories.slice(0, 2).map((c) => c.category.toLowerCase()).join(' and ');
      fallbackReply = `Your spending is higher mainly because ${topCats} expenses were higher this month. Reducing flexible purchases there could help you get back on track.`;
    } else {
      fallbackReply = "Your spending records look balanced right now. Logging every small transaction helps pinpoint where any unexpected costs come from.";
    }
  }

  if (isInvestmentQuery) {
    fallbackReply += " (Note: This is general information, not professional financial advice.)";
  }

  return res.json({ reply: fallbackReply });
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Personal Finance Advisor Bot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
