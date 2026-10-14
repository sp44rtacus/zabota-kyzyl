import React, { useState } from 'react';
import { Search, CheckCircle2, Clock, AlertTriangle, ShieldCheck, MapPin, Tag } from 'lucide-react';
import { api } from '../api/client';
import { TrackData } from '../types';

export const TrackApplication: React.FC = () => {
  const [uinInput, setUinInput] = useState('');
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (targetUin?: string) => {
    const query = (targetUin || uinInput).trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.trackByUin(query);
      setTrackData(data);
    } catch (err: any) {
      setError(err.message || 'Заявка не найдена');
      setTrackData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Отслеживание статуса заявки по УИН
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
          Введите уникальный номер обращения (например: <b>KZ-2026-1042</b>), выданный при подаче заявления в Департамент соцполитики г. Кызыла.
        </p>
      </div>

      {/* Поисковая строка */}
      <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={uinInput}
              onChange={(e) => setUinInput(e.target.value)}
              placeholder="Введите номер (например: KZ-2026-1042)"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-municipal-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-municipal-700 hover:bg-municipal-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition shadow flex items-center justify-center gap-2"
          >
            {loading ? 'Поиск...' : 'Проверить статус'}
          </button>
        </form>

        {/* Быстрые подсказки для защиты */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Примеры номеров для комиссии:</span>
          <button
            type="button"
            onClick={() => {
              setUinInput('KZ-2026-1042');
              handleSearch('KZ-2026-1042');
            }}
            className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-semibold hover:bg-red-200"
          >
            KZ-2026-1042 (SOS Новая)
          </button>
          <button
            type="button"
            onClick={() => {
              setUinInput('KZ-2026-1035');
              handleSearch('KZ-2026-1035');
            }}
            className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold hover:bg-blue-200"
          >
            KZ-2026-1035 (В работе)
          </button>
          <button
            type="button"
            onClick={() => {
              setUinInput('KZ-2026-1020');
              handleSearch('KZ-2026-1020');
            }}
            className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold hover:bg-emerald-200"
          >
            KZ-2026-1020 (Выполнена)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Результат трекинга */}
      {trackData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in">
          {/* Шапка карточки */}
          <div className="bg-slate-900 text-white p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                Регистрационный номер обращения
              </div>
              <div className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
                <span>{trackData.uin}</span>
                {trackData.is_emergency && (
                  <span className="text-xs font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    SOS: Экстренная
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Дата регистрации</div>
              <div className="text-sm font-semibold">
                {new Date(trackData.created_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Краткие параметры */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-municipal-600 shrink-0" />
                <div>
                  <span className="text-slate-500">Категория:</span>
                  <div className="font-bold text-slate-800">{trackData.benefit_category}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-500">Район:</span>
                  <div className="font-bold text-slate-800">{trackData.district_name} ({trackData.anonymized_address})</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-slate-500">Услуга:</span>
                  <div className="font-bold text-slate-800">{trackData.category_title}</div>
                </div>
              </div>
            </div>

            {/* Горизонтальный прогресс-бар (Stepper) */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-wider">
                Жизненный цикл исполнения заявки
              </h3>

              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {trackData.status_history.map((step, idx) => (
                    <div key={idx} className="flex md:flex-col items-center md:items-center text-left md:text-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 font-bold transition ${
                        step.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                          : 'bg-white border-slate-300 text-slate-400'
                      }`}>
                        {step.completed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className={`text-xs font-bold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>
                          {step.label}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {step.date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Безопасность */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                В соответствии с 152-ФЗ персональные данные заявителя защищены и доступны только инспекции соцзащиты и закрепленному волонтеру после проверки.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
