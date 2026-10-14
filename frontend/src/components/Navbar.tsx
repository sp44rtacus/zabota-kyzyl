import React, { useState } from 'react';
import { 
  HeartHandshake, 
  Eye, 
  UserCheck, 
  LogOut, 
  LogIn, 
  MapPin, 
  Search, 
  FileText, 
  BarChart3, 
  LayoutDashboard,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { User, Role } from '../types';

interface NavbarProps {
  currentUser: User | null;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onQuickLogin: (role: Role) => void;
  onLogout: () => void;
  isAccessibilityMode: boolean;
  setIsAccessibilityMode: (val: boolean) => void;
  isHighContrast: boolean;
  setIsHighContrast: (val: boolean) => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentTab,
  setCurrentTab,
  onQuickLogin,
  onLogout,
  isAccessibilityMode,
  setIsAccessibilityMode,
  isHighContrast,
  setIsHighContrast,
  onOpenLoginModal
}) => {
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm transition-colors">
      {/* Верхняя плашка для слабовидящих и демо-переключателя */}
      <div className="bg-municipal-800 text-white text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-4">
          <span className="font-medium tracking-wide flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Официальный портал Мэрии города Кызыла
          </span>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-slate-200 hidden sm:inline">Горячая линия соцподдержки: <b>+7 (39422) 2-12-34</b></span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Кнопка доступности по ГОСТ */}
          <button
            onClick={() => {
              setIsAccessibilityMode(!isAccessibilityMode);
              document.body.classList.toggle('accessibility-mode');
            }}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 text-xs font-semibold transition ${
              isAccessibilityMode ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
            title="Режим для слабовидящих по ГОСТ Р 52872-2019"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Версия для слабовидящих</span>
          </button>

          {isAccessibilityMode && (
            <button
              onClick={() => {
                setIsHighContrast(!isHighContrast);
                document.body.classList.toggle('accessibility-contrast');
              }}
              className="px-2 py-0.5 rounded text-xs bg-black border border-white text-white hover:bg-slate-900"
            >
              {isHighContrast ? 'Обычный контраст' : 'Высокий контраст'}
            </button>
          )}

          {/* Быстрый переключатель ролей для защиты */}
          <div className="relative">
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded flex items-center gap-1.5 shadow-sm text-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Демо: Сменить роль</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showDemoMenu && (
              <div 
                className="absolute right-0 mt-1 w-64 bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setShowDemoMenu(false)}
              >
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Быстрый вход для комиссии (1 клик):
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setCurrentTab('public');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800">1. Житель города (Гость)</span>
                  <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600">Публично</span>
                </button>
                <button
                  onClick={() => {
                    onQuickLogin('volunteer');
                    setCurrentTab('volunteer');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-emerald-700">2. Волонтер (Ондар Ч.)</div>
                    <div className="text-[10px] text-slate-500">48 ч. практики, рейтинг 4.9★</div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">Волонтер</span>
                </button>
                <button
                  onClick={() => {
                    onQuickLogin('inspector');
                    setCurrentTab('admin');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-blue-700">3. Инспектор (Куулар А.)</div>
                    <div className="text-[10px] text-slate-500">Канбан, проверка отчетов</div>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium">Инспектор</span>
                </button>
                <button
                  onClick={() => {
                    onQuickLogin('director');
                    setCurrentTab('analytics');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-purple-700">4. Директор (Монгуш Б.)</div>
                    <div className="text-[10px] text-slate-500">Тепловая карта, Excel, аналитика</div>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium">Руководство</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Основная навигация */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setCurrentTab('public')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-municipal-700 to-blue-600 flex items-center justify-center text-white shadow-md">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-municipal-800">АИС «ЗАБОТА»</span>
                <span className="text-[10px] font-bold bg-blue-100 text-municipal-700 px-2 py-0.5 rounded-full uppercase">
                  Кызыл
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Мэрия города Кызыла • Департамент соцполитики
              </p>
            </div>
          </div>

          {/* Вкладки навигации */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('public')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                currentTab === 'public' 
                  ? 'bg-blue-50 text-municipal-700 font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Портал жителей</span>
            </button>

            <button
              onClick={() => setCurrentTab('warming-map')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                currentTab === 'warming-map' 
                  ? 'bg-blue-50 text-municipal-700 font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Пункты обогрева</span>
            </button>

            <button
              onClick={() => setCurrentTab('track')}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                currentTab === 'track' 
                  ? 'bg-blue-50 text-municipal-700 font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Проверить заявку</span>
            </button>

            {/* Вкладка волонтера */}
            <button
              onClick={() => {
                if (!currentUser) onQuickLogin('volunteer');
                setCurrentTab('volunteer');
              }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                currentTab === 'volunteer' 
                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' 
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Кабинет Волонтера</span>
              {currentUser?.role === 'volunteer' && (
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full">
                  {currentUser.volunteer_hours} ч.
                </span>
              )}
            </button>

            {/* Вкладка инспектора / Канбан */}
            <button
              onClick={() => {
                if (!currentUser || currentUser.role === 'volunteer') onQuickLogin('inspector');
                setCurrentTab('admin');
              }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                currentTab === 'admin' 
                  ? 'bg-blue-50 text-municipal-800 font-bold border border-blue-200' 
                  : 'text-slate-600 hover:text-blue-800 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>Канбан Инспектора</span>
            </button>

            {/* Вкладка аналитики / Директор */}
            <button
              onClick={() => {
                if (!currentUser || currentUser.role !== 'director') onQuickLogin('director');
                setCurrentTab('analytics');
              }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                currentTab === 'analytics' 
                  ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200' 
                  : 'text-slate-600 hover:text-purple-800 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>Аналитика Мэрии</span>
            </button>
          </nav>

          {/* Правая часть: статус пользователя */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-800">{currentUser.full_name}</div>
                  <div className="text-[11px] text-slate-500 font-medium capitalize">
                    {currentUser.role === 'director' && 'Руководитель департамента'}
                    {currentUser.role === 'inspector' && 'Инспектор соцзащиты'}
                    {currentUser.role === 'volunteer' && `Волонтер (${currentUser.volunteer_hours} ч.)`}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Выйти из системы"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="bg-municipal-700 hover:bg-municipal-800 text-white font-semibold text-xs px-3.5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition"
              >
                <LogIn className="w-4 h-4" />
                <span>Войти</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
