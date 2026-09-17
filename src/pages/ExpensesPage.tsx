import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ExpenseItem, ExpenseCategory } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { Plus, ArrowUpRight, Trash2, Edit2, X, Filter } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { expenses, refreshData, showNotification } = useAuth();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories: ExpenseCategory[] = [
    'Food',
    'Rent',
    'Transport',
    'Education',
    'Shopping',
    'Entertainment',
    'Healthcare',
    'Bills',
    'Other',
  ];

  const resetForm = () => {
    setAmount('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (item: ExpenseItem) => {
    setEditingId(item.id);
    setAmount(item.amount.toString());
    setCategory(item.category);
    setDate(item.date);
    setNote(item.note || '');
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      showNotification('Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.editExpense(editingId, {
          amount: num,
          category,
          date,
          note,
        });
        showNotification('Expense updated.');
      } else {
        await api.addExpense({
          amount: num,
          category,
          date,
          note,
        });
        showNotification('Expense added.');
      }
      await refreshData();
      resetForm();
    } catch (err: any) {
      showNotification(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteExpense(id);
      await refreshData();
      showNotification('Expense deleted.');
      setItemToDelete(null);
    } catch {
      showNotification('Something went wrong. Please try again.');
    }
  };

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = selectedCategory === 'All'
    ? expenses
    : expenses.filter((e) => e.category === selectedCategory);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header & Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Where did you spend your money?
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Keep track of everyday purchases and bills.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="text-xs font-medium text-slate-500">Total spent</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-800">
              {formatCurrency(totalSpent)}
            </div>
          </div>
          <button
            id="expenses-add-toggle-btn"
            onClick={() => {
              if (isAdding) resetForm();
              else setIsAdding(true);
            }}
            className="ml-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isAdding ? 'Cancel' : 'Add Expense'}</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Simple Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 sm:p-6 shadow-xs animate-fade-in">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            {editingId ? 'Edit expense' : 'Record an expense'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="expense-amount">
                  Amount (₹)
                </label>
                <input
                  id="expense-amount"
                  type="number"
                  step="1"
                  placeholder="e.g. 250"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="expense-category">
                  Category
                </label>
                <select
                  id="expense-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="expense-date">
                  Date
                </label>
                <input
                  id="expense-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Short note */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="expense-note">
                Short note (optional)
              </label>
              <input
                id="expense-note"
                type="text"
                placeholder="e.g. Lunch with colleagues or groceries"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-medium shadow-xs transition-all cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : editingId ? 'Update expense' : 'Save expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Recent Expenses
          </h2>
          <span className="text-xs text-slate-400">
            {filteredExpenses.length} {filteredExpenses.length === 1 ? 'expense' : 'expenses'}
          </span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <ArrowUpRight className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-800">
              {selectedCategory === 'All'
                ? "You haven't added any expenses yet."
                : `No expenses logged under "${selectedCategory}".`}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add small everyday expenses as they happen to keep your monthly plan accurate.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium cursor-pointer"
            >
              Add your first expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredExpenses.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <span>{item.category}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                        {formatDate(item.date)}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-xs text-slate-500 mt-0.5">{item.note}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    {formatCurrency(item.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    {itemToDelete === item.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                        <span className="text-[11px] text-rose-700 font-medium mr-1">Delete?</span>
                        <button
                          id={`expense-confirm-delete-${item.id}`}
                          onClick={() => handleDelete(item.id)}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          id={`expense-cancel-delete-${item.id}`}
                          onClick={() => setItemToDelete(null)}
                          className="px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded text-[11px] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          id={`expense-edit-${item.id}`}
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`expense-delete-${item.id}`}
                          onClick={() => setItemToDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
