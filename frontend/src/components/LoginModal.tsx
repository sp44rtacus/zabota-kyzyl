import React, { useState } from 'react';
import { LogIn, Lock, Phone, UserCheck, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { Role } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onQuickLogin: (role: Role) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess, onQuickLogin }) => {
  const [phone, setPhone] = useState('+7 (999) 003-00-03');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.login(phone, password);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-municipal-700 text-white flex items-center justify-center">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Вход для сотрудников</h3>
              <p className="text-[11px] text-slate-500">Волонтеры и инспекторы Департамента</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Телефон
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-municipal-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Пароль
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-municipal-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-municipal-700 hover:bg-municipal-800 text-white font-bold text-xs shadow-md transition"
          >
            {loading ? 'Вход...' : 'Авторизоваться'}
          </button>
        </form>

        {/* Быстрые ссылки для комиссии */}
        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase text-center">
            Быстрый вход для защиты проекта:
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <button
              onClick={() => {
                onQuickLogin('volunteer');
                onClose();
              }}
              className="p-2 rounded-lg bg-emerald-50 text-emerald-800 font-bold hover:bg-emerald-100 text-center"
            >
              Волонтер
            </button>
            <button
              onClick={() => {
                onQuickLogin('inspector');
                onClose();
              }}
              className="p-2 rounded-lg bg-blue-50 text-blue-800 font-bold hover:bg-blue-100 text-center"
            >
              Инспектор
            </button>
            <button
              onClick={() => {
                onQuickLogin('director');
                onClose();
              }}
              className="p-2 rounded-lg bg-purple-50 text-purple-800 font-bold hover:bg-purple-100 text-center"
            >
              Директор
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
