import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { PublicPortal } from './components/PublicPortal';
import { WarmingMap } from './components/WarmingMap';
import { TrackApplication } from './components/TrackApplication';
import { VolunteerPortal } from './components/VolunteerPortal';
import { AdminPortal } from './components/AdminPortal';
import { AnalyticsPortal } from './components/AnalyticsPortal';
import { LoginModal } from './components/LoginModal';
import { api } from './api/client';
import { User, Role } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('public');
  const [isAccessibilityMode, setIsAccessibilityMode] = useState<boolean>(false);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Проверка сохраненной сессии
    if (api.getToken()) {
      api.getMe()
        .then(user => setCurrentUser(user))
        .catch(() => api.logout());
    }
  }, []);

  const handleQuickLogin = async (role: Role) => {
    try {
      const res = await api.quickLogin(role);
      const user = await api.getMe();
      setCurrentUser(user);
    } catch (err: any) {
      alert(err.message || 'Ошибка быстрого входа');
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleRefreshUser = async () => {
    try {
      if (api.getToken()) {
        const u = await api.getMe();
        setCurrentUser(u);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      <Navbar
        currentUser={currentUser}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onQuickLogin={handleQuickLogin}
        onLogout={handleLogout}
        isAccessibilityMode={isAccessibilityMode}
        setIsAccessibilityMode={setIsAccessibilityMode}
        isHighContrast={isHighContrast}
        setIsHighContrast={setIsHighContrast}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      <main className="flex-1">
        {currentTab === 'public' && (
          <PublicPortal
            onGoToTrack={() => setCurrentTab('track')}
            onGoToWarmingMap={() => setCurrentTab('warming-map')}
          />
        )}

        {currentTab === 'warming-map' && <WarmingMap />}

        {currentTab === 'track' && <TrackApplication />}

        {currentTab === 'volunteer' && (
          <VolunteerPortal
            currentUser={currentUser}
            onRefreshUser={handleRefreshUser}
          />
        )}

        {currentTab === 'admin' && <AdminPortal />}

        {currentTab === 'analytics' && <AnalyticsPortal />}
      </main>

      <Footer />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleRefreshUser}
        onQuickLogin={handleQuickLogin}
      />
    </div>
  );
};

export default App;
