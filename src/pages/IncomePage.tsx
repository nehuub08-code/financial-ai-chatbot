import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { IncomeItem, IncomeSource } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { Plus, ArrowDownLeft, Trash2, Edit2, Check, X, Calendar, Wallet } from 'lucide-react';

export const IncomePage: React.FC = () => {
  const { incomes, refreshData, showNotification } = useAuth();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Form fields
  const [source, setSource] = useState<IncomeSource>('Salary');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sources: IncomeSource[] = ['Salary', 'Freelance', 'Allowance', 'Business', 'Other'];

  const totalThisMonth = incomes.reduce((sum, i) => sum + i.amount, 0);

  const resetForm = () => {
    setSource('Salary');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (item: IncomeItem) => {
    setEditingId(item.id);
    setSource(item.source);
    setAmount(item.amount.toString());
    setDate(item.date);
    setNotes(item.notes || '');
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
        await api.editIncome(editingId, {
          source,
          amount: num,
          date,
          notes,
        });
        showNotification('Income updated successfully.');
      } else {
        await api.addIncome({
          source,
          amount: num,
          date,
          notes,
        });
        showNotification('Income added successfully.');
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
      await api.deleteIncome(id);
      await refreshData();
      showNotification('Income entry removed.');
      setItemToDelete(null);
    } catch {
      showNotification('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header & Monthly Total */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Your income
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track all money coming in each month.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200/90 shadow-xs">
          <div>
            <div className="text-xs font-medium text-slate-500">This month</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-800">
              {formatCurrency(totalThisMonth)}
            </div>
          </div>
          <button
            id="income-add-toggle-btn"
            onClick={() => {
              if (isAdding) resetForm();
              else setIsAdding(true);
            }}
            className="ml-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isAdding ? 'Cancel' : 'Add income'}</span>
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl border border-emerald-200 p-5 sm:p-6 shadow-xs animate-fade-in">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            {editingId ? 'Edit income' : 'Add new income'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="income-amount">
                  Amount (₹)
                </label>
                <input
                  id="income-amount"
                  type="number"
                  step="100"
                  placeholder="e.g. 25000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="income-source">
                  Source
                </label>
                <select
                  id="income-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value as IncomeSource)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="income-date">
                  Date
                </label>
                <input
                  id="income-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Short note */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="income-notes">
                Short note (optional)
              </label>
              <input
                id="income-notes"
                type="text"
                placeholder="e.g. Monthly salary from company"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                {isSubmitting ? 'Saving...' : editingId ? 'Update income' : 'Save income'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Income List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Recorded Income
          </h2>
          <span className="text-xs text-slate-400">
            {incomes.length} {incomes.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {incomes.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <ArrowDownLeft className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-medium text-slate-800">No income logged yet.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add your monthly income to start planning your budget and tracking your savings.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-medium cursor-pointer"
            >
              Add your first income
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {incomes.map((item) => (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <span>{item.source}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                        {formatDate(item.date)}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base sm:text-lg font-bold text-emerald-800">
                    +{formatCurrency(item.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    {itemToDelete === item.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                        <span className="text-[11px] text-rose-700 font-medium mr-1">Delete?</span>
                        <button
                          id={`income-confirm-delete-${item.id}`}
                          onClick={() => handleDelete(item.id)}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Yes
                        </button>
                        <button
                          id={`income-cancel-delete-${item.id}`}
                          onClick={() => setItemToDelete(null)}
                          className="px-2 py-0.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded text-[11px] transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          id={`income-edit-${item.id}`}
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          id={`income-delete-${item.id}`}
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
