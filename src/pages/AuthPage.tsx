import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup, demoLogin, setActiveTab } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'signup' && !name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password should be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-12">
      {/* Back to Home */}
      <button
        id="auth-back-btn"
        onClick={() => setActiveTab('landing')}
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to home</span>
      </button>

      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white mx-auto mb-3 shadow-xs">
            <Wallet className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {mode === 'signup'
              ? 'Start tracking your income and expenses with simple friendly guidance.'
              : 'Sign in to see your money plan and monthly progress.'}
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            id="auth-error-alert"
            className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="auth-name">
                Name
              </label>
              <input
                id="auth-name"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="auth-email">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
            />
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-medium rounded-xl shadow-xs transition-all text-sm cursor-pointer"
          >
            {isSubmitting
              ? 'Please wait...'
              : mode === 'signup'
              ? 'Sign Up'
              : 'Sign In'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 text-center text-sm text-slate-500">
          {mode === 'signup' ? (
            <span>
              Already have an account?{' '}
              <button
                id="toggle-to-login"
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode('login');
                }}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <button
                id="toggle-to-signup"
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setMode('signup');
                }}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </span>
          )}
        </div>

        {/* Demo Login shortcut */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-2">Want to try it out immediately?</p>
          <button
            id="auth-demo-shortcut-btn"
            type="button"
            onClick={demoLogin}
            className="w-full py-2 px-3 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200/80 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>1-Click Demo Login (Rahul's ₹30,000 profile)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
