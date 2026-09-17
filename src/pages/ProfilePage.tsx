import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatCurrency } from '../utils/format';
import { User, LogOut, KeyRound, Edit2, RotateCcw, Check, Sparkles } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, logout, refreshData, showNotification } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome?.toString() || '30000');
  const [savingsGoalTarget, setSavingsGoalTarget] = useState(user?.savingsGoalTarget?.toString() || '50000');

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.updateProfile({
        name: name.trim(),
        monthlyIncome: Number(monthlyIncome),
        savingsGoalTarget: Number(savingsGoalTarget),
      });
      updateUser(res.user);
      await refreshData();
      showNotification('Profile updated successfully.');
      setIsEditing(false);
    } catch {
      showNotification('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showNotification('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateProfile({ password: newPassword });
      showNotification('Password updated successfully.');
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      showNotification('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      await api.resetDemoData();
      const me = await api.getMe();
      updateUser(me.user);
      await refreshData();
      showNotification('Demo data reset successfully.');
      setShowResetConfirm(false);
    } catch {
      showNotification('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Your Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details and account settings.
        </p>
      </div>

      {/* Main Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        {/* User Identity Banner */}
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-2xl flex items-center justify-center">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        {/* Read-Only Details */}
        {!isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">Monthly income</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                {formatCurrency(user.monthlyIncome)}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">Savings goal target</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                {formatCurrency(user.savingsGoalTarget)}
              </span>
            </div>

            {user.savingFor && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block">Primary savings goal</span>
                <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                  {user.savingFor}
                </span>
              </div>
            )}

            {user.spendingHabit && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs text-slate-500 block">Spending style</span>
                <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                  {user.spendingHabit}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Edit Profile Form */}
        {isEditing && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Income (₹)
                </label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Savings Goal Target (₹)
                </label>
                <input
                  type="number"
                  value={savingsGoalTarget}
                  onChange={(e) => setSavingsGoalTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium shadow-xs cursor-pointer"
              >
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        )}

        {/* Change Password Form */}
        {isChangingPassword && (
          <form onSubmit={handleChangePassword} className="space-y-4 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium shadow-xs cursor-pointer"
              >
                Update password
              </button>
            </div>
          </form>
        )}

        {/* Action Buttons */}
        <div className="border-t border-slate-100 pt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                id="profile-edit-btn"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-4 h-4 text-emerald-600" />
                <span>Edit Profile</span>
              </button>
            )}

            {!isChangingPassword && (
              <button
                id="profile-change-pw-btn"
                onClick={() => setIsChangingPassword(true)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-slate-500" />
                <span>Change Password</span>
              </button>
            )}
          </div>

          <button
            id="profile-logout-btn"
            onClick={logout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Demo helper card */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Reset to Sample Data
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Reload the benchmark ₹30,000 monthly income and realistic expenses for testing.
          </p>
        </div>
        {showResetConfirm ? (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-rose-700 font-medium">Reset sample data?</span>
            <button
              id="profile-confirm-reset-btn"
              onClick={handleResetDemo}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Yes, reset
            </button>
            <button
              id="profile-cancel-reset-btn"
              onClick={() => setShowResetConfirm(false)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            id="profile-reset-demo-btn"
            onClick={() => setShowResetConfirm(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Demo</span>
          </button>
        )}
      </div>
    </div>
  );
};
