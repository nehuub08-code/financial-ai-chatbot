import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2 } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { notification } = useAuth();

  if (!notification) return null;

  return (
    <div
      id="notification-toast"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-xl shadow-lg transition-all animate-fade-in"
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{notification}</span>
    </div>
  );
};
