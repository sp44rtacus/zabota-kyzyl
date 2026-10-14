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
  ChevronDown,
  User as UserIcon,
  Sparkles
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
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  return (
    <header className="sticky top-0 z-[9999] bg-white border-b border-slate-200 shadow-sm transition-colors">
      {/* Верхняя государственная плашка */}
      <div className="bg-municipal-800 text-white text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-municipal-700">
        <div className="flex items-center space-x-3 overflow-hidden">
          <span className="font-semibold tracking-wide flex items-center gap-1.5 whitespace-nowrap text-[11px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Официальный портал Мэрии города Кызыла
          </span>
          <span className="text-slate-400 hidden md:inline">|</span>
          <span className="text-slate-200 hidden md:inline whitespace-nowrap text-[11px] sm:text-xs">
            Горячая линия соцподдержки: <b>+7 (39422) 2-12-34</b>
          </span>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
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
            <span className="hidden sm:inline">Версия для слабовидящих</span>
            <span className="sm:hidden">ГОСТ</span>
          </button>

          {isAccessibilityMode && (
            <button
              onClick={() => {
                setIsHighContrast(!isHighContrast);
                document.body.classList.toggle('accessibility-contrast');
              }}
              className="px-2 py-0.5 rounded text-xs bg-black border border-white text-white hover:bg-slate-900"
            >
              {isHighContrast ? 'Обычный' : 'Контраст'}
            </button>
          )}

          {/* Быстрое переключение учетных записей (для тестирования и удобства) */}
          <div className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="bg-municipal-700 hover:bg-municipal-600 text-white font-bold px-3 py-1 rounded flex items-center gap-1.5 text-xs transition border border-municipal-600 shadow-sm"
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Сменить аккаунт</span>
              <ChevronDown className="w-3 h-3 text-slate-300" />
            </button>

            {showAccountMenu && (
              <div 
                className="absolute right-0 mt-1 w-72 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-2 z-[10000] animate-in fade-in slide-in-from-top-2"
                onClick={() => setShowAccountMenu(false)}
              >
                <div className="px-3.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1.5 mb-1">
                  Выберите учетную запись:
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    setCurrentTab('public');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">Житель города Кызыла</div>
                    <div className="text-[10px] text-slate-500">Подача обращений и SOS-заявок</div>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">Гражданин</span>
                </button>

                <button
                  onClick={() => {
                    onQuickLogin('volunteer');
                    setCurrentTab('volunteer');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50/60 flex items-center justify-between text-xs border-t border-slate-100"
                >
                  <div>
                    <div className="font-bold text-emerald-800">Ондар Чингис Артурович</div>
                    <div className="text-[10px] text-slate-500">Волонтер • 48 ч. практики, 4.9★</div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Волонтер</span>
                </button>

                <button
                  onClick={() => {
                    onQuickLogin('inspector');
                    setCurrentTab('admin');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-blue-50/60 flex items-center justify-between text-xs border-t border-slate-100"
                >
                  <div>
                    <div className="font-bold text-blue-900">Куулар Аида Сергеевна</div>
                    <div className="text-[10px] text-slate-500">Инспектор соцзащиты • Канбан, чат</div>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">Инспектор</span>
                </button>

                <button
                  onClick={() => {
                    onQuickLogin('director');
                    setCurrentTab('analytics');
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-purple-50/60 flex items-center justify-between text-xs border-t border-slate-100"
                >
                  <div>
                    <div className="font-bold text-purple-900">Монгуш Буян Мергенович</div>
                    <div className="text-[10px] text-slate-500">Руководитель департамента • Аналитика, Excel</div>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">Руководство</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Основная навигационная панель */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Логотип и принадлежность ведомству */}
          <div 
            className="flex items-center space-x-2.5 cursor-pointer shrink-0"
            onClick={() => setCurrentTab('public')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-municipal-700 to-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-base sm:text-lg font-black tracking-tight text-municipal-800">
                  АИС «ЗАБОТА»
                </span>
                <span className="text-[9px] font-bold bg-blue-100 text-municipal-700 px-1.5 py-0.2 rounded uppercase">
                  г. Кызыл
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium whitespace-nowrap hidden sm:block">
                Мэрия города Кызыла • Департамент соцполитики
              </p>
            </div>
          </div>

          {/* Вкладки навигации */}
          <nav className="hidden lg:flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setCurrentTab('public')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
                currentTab === 'admin' 
                  ? 'bg-blue-50 text-municipal-800 font-bold border border-blue-200' 
                  : 'text-slate-600 hover:text-blue-800 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>Рабочий стол Инспектора</span>
            </button>

            {/* Вкладка аналитики / Директор */}
            <button
              onClick={() => {
                if (!currentUser || currentUser.role !== 'director') onQuickLogin('director');
                setCurrentTab('analytics');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 ${
                currentTab === 'analytics' 
                  ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200' 
                  : 'text-slate-600 hover:text-purple-800 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>Аналитика Мэрии</span>
            </button>
          </nav>

          {/* Правая часть: профиль пользователя */}
          <div className="flex items-center space-x-2 shrink-0">
            {currentUser ? (
              <div className="flex items-center space-x-2.5">
                <div className="text-right hidden sm:block leading-tight">
                  <div className="text-xs font-bold text-slate-800 whitespace-nowrap">{currentUser.full_name}</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {currentUser.role === 'director' && 'Руководитель департамента'}
                    {currentUser.role === 'inspector' && 'Инспектор соцзащиты'}
                    {currentUser.role === 'volunteer' && `Волонтер (${currentUser.volunteer_hours} ч.)`}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Выйти из учетной записи"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="bg-municipal-700 hover:bg-municipal-800 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Войти</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
