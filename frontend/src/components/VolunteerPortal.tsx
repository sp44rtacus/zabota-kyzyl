import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  MapPin, 
  Clock, 
  Phone, 
  Upload, 
  Send, 
  FileText, 
  Award, 
  Star, 
  AlertTriangle, 
  MessageSquare, 
  CheckCircle, 
  Filter, 
  CheckCircle2, 
  Calendar,
  Gift,
  Bus,
  Dumbbell,
  GraduationCap,
  Wallet,
  QrCode,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Application, TaskAssignment, TaskMessage, Certificate, District, User } from '../types';
import { api } from '../api/client';

interface VolunteerPortalProps {
  currentUser: User | null;
  onRefreshUser: () => void;
}

export const VolunteerPortal: React.FC<VolunteerPortalProps> = ({ currentUser, onRefreshUser }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'my-tasks' | 'benefits' | 'profile'>('feed');

  // Данные ленты
  const [feedTasks, setFeedTasks] = useState<Application[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<number | undefined>(undefined);
  const [alongMyRoutes, setAlongMyRoutes] = useState(false);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Мои задачи
  const [myTasks, setMyTasks] = useState<TaskAssignment[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null);

  // Чат
  const [chatMessages, setChatMessages] = useState<TaskMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Отправка отчета фото "До/После"
  const [photoBefore, setPhotoBefore] = useState<File | null>(null);
  const [photoAfter, setPhotoAfter] = useState<File | null>(null);
  const [volunteerComment, setVolunteerComment] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Грамоты
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Модалка QR-кода льготы
  const [activePassModal, setActivePassModal] = useState<{ title: string; desc: string; type: string } | null>(null);

  // Загрузка справочников и ленты
  useEffect(() => {
    api.getDistricts().then(setDistricts).catch(console.error);
    loadFeed();
    loadMyTasks();
    loadCertificates();
  }, [selectedDistrict, alongMyRoutes, emergencyOnly]);

  const loadFeed = async () => {
    setLoadingFeed(true);
    try {
      const data = await api.getVolunteerFeed({
        district_id: selectedDistrict,
        along_my_routes: alongMyRoutes,
        emergency_only: emergencyOnly
      });
      setFeedTasks(data);
    } catch (err) {
      console.error("Ошибка загрузки ленты:", err);
    } finally {
      setLoadingFeed(false);
    }
  };

  const loadMyTasks = async () => {
    try {
      const data = await api.getMyTasks();
      setMyTasks(data);
      if (data.length > 0 && !selectedTask) {
        setSelectedTask(data[0]);
        loadChat(data[0].application.id);
      }
    } catch (err) {
      console.error("Ошибка загрузки задач волонтера:", err);
    }
  };

  const loadChat = async (appId: number) => {
    try {
      const msgs = await api.getChat(appId);
      setChatMessages(msgs);
    } catch (err) {
      console.error("Ошибка чата:", err);
    }
  };

  const loadCertificates = async () => {
    try {
      const certs = await api.getCertificates();
      setCertificates(certs);
    } catch (err) {
      console.error("Ошибка наград:", err);
    }
  };

  const handleAcceptTask = async (applicationId: number) => {
    try {
      await api.acceptTask(applicationId);
      alert("Вы успешно откликнулись на задачу! Она добавлена в раздел «Мои задачи».");
      confetti({ particleCount: 50, spread: 60 });
      loadFeed();
      loadMyTasks();
      setActiveTab('my-tasks');
    } catch (err: any) {
      alert(err.message || "Ошибка при взятии задачи");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim() || !selectedTask) return;

    setSendingMsg(true);
    try {
      await api.sendMessage(selectedTask.application.id, newChatMessage.trim());
      setNewChatMessage('');
      loadChat(selectedTask.application.id);
    } catch (err) {
      console.error("Ошибка отправки сообщения:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !volunteerComment.trim()) {
      alert("Пожалуйста, заполните комментарий о проделанной работе.");
      return;
    }

    setSubmittingReport(true);
    try {
      const formData = new FormData();
      formData.append('volunteer_comment', volunteerComment.trim());
      if (photoBefore) formData.append('photo_before', photoBefore);
      if (photoAfter) formData.append('photo_after', photoAfter);

      await api.submitReport(selectedTask.assignment_id, formData);
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      alert("Фотоотчет успешно отправлен инспекции соцзащиты на утверждение!");
      setVolunteerComment('');
      setPhotoBefore(null);
      setPhotoAfter(null);
      loadMyTasks();
      onRefreshUser();
    } catch (err: any) {
      alert(err.message || "Ошибка отправки отчета");
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleDownloadPracticePdf = async () => {
    setDownloadingPdf(true);
    try {
      const blob = await api.downloadPracticePdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Spravka_Praktika_${currentUser?.full_name || 'vol'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Ошибка при формировании PDF-справки");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCertPdf = async (certId: number) => {
    try {
      const blob = await api.downloadCertificatePdf(certId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Gramota_Kyzyl_${certId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Ошибка скачивания грамоты");
    }
  };

  const hours = currentUser?.volunteer_hours || 48;

  // Определение уровня волонтера
  let currentTier = {
    level: 1,
    title: 'Волонтер-новичок',
    min: 0,
    max: 15,
    next: 'Городской активист (16 ч.)'
  };
  if (hours >= 60) {
    currentTier = {
      level: 4,
      title: 'Почетный волонтер Кызыла',
      min: 60,
      max: 100,
      next: 'Максимальный статус достигнут'
    };
  } else if (hours >= 36) {
    currentTier = {
      level: 3,
      title: 'Мастер добрых дел',
      min: 36,
      max: 60,
      next: 'Почетный волонтер (+10 баллов к ЕГЭ) через ' + (60 - hours) + ' ч.'
    };
  } else if (hours >= 16) {
    currentTier = {
      level: 2,
      title: 'Городской активист',
      min: 16,
      max: 35,
      next: 'Мастер добрых дел (спорткомплекс и стипендия) через ' + (36 - hours) + ' ч.'
    };
  }

  const progressPercent = Math.min(100, Math.round((hours / 60) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Шапка кабинета волонтера */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-municipal-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-700/60 text-emerald-200 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Официальный статус: {currentTier.title} (Уровень {currentTier.level})</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Личный кабинет: {currentUser?.full_name || 'Ондар Чингис Артурович'}
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
            Координация выездов, начисление часов практики, доступ к муниципальным льготам и электронным проездным г. Кызыла.
          </p>
        </div>

        {/* Счетчики часов и рейтинга */}
        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/15 shrink-0">
          <div className="text-center px-4 py-1 border-r border-white/20">
            <div className="text-2xl font-black text-amber-300">
              {hours} ч.
            </div>
            <div className="text-[11px] text-emerald-100 font-semibold uppercase">Практика</div>
          </div>
          <div className="text-center px-4 py-1">
            <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>{currentUser?.rating || 4.9}</span>
            </div>
            <div className="text-[11px] text-emerald-100 font-semibold uppercase">Рейтинг</div>
          </div>
        </div>
      </div>

      {/* Переключатель вкладок волонтера */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2 sm:gap-6">
        <button
          onClick={() => setActiveTab('feed')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'feed'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Лента заявок ({feedTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my-tasks')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'my-tasks'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Мои задания ({myTasks.length})</span>
        </button>

        {/* НОВАЯ ВКЛАДКА: ЛЬГОТЫ, МОТИВАЦИЯ И ПОСОБИЯ */}
        <button
          onClick={() => setActiveTab('benefits')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'benefits'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-4 h-4 text-amber-500" />
          <span>Льготы и мотивация волонтера</span>
          <span className="text-[10px] bg-amber-400 text-slate-900 font-black px-1.5 py-0.2 rounded-full">
            Бонусы
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Справка о практике (PDF) и Грамоты</span>
        </button>
      </div>

      {/* ВКЛАДКА: МОТИВАЦИЯ, ЛЬГОТЫ И ПОСОБИЯ ВОЛОНТЕРА */}
      {activeTab === 'benefits' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Прогресс-бар мотивации */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Программа мотивации волонтеров Мэрии г. Кызыла
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Ваш прогресс: {hours} из 60 часов до Почетного волонтера
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-500">Следующая цель:</span>
                <div className="text-xs font-bold text-municipal-700">{currentTier.next}</div>
              </div>
            </div>

            {/* Шкала */}
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden p-0.5 border border-slate-200">
              <div 
                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 h-full rounded-full transition-all duration-1000 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Метки уровней */}
            <div className="grid grid-cols-4 text-center text-xs pt-1">
              <div className="space-y-1">
                <div className="font-bold text-slate-800">0 ч. Новичок</div>
                <div className="text-[10px] text-slate-400">Книжка, бейдж</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-emerald-700">16 ч. Активист</div>
                <div className="text-[10px] text-slate-500">🚌 Бесплатный проезд</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-blue-700">36 ч. Мастер</div>
                <div className="text-[10px] text-slate-500">🏋️ Спорткомплекс + Стипендия</div>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-amber-700">60 ч. Почетный</div>
                <div className="text-[10px] text-slate-500">🎓 +10 баллов к ЕГЭ</div>
              </div>
            </div>
          </div>

          {/* Карточки доступных льгот и пособий */}
          <div>
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Муниципальные меры поддержки и льготы волонтера</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Льгота 1: Бесплатный проезд */}
              <div className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 shadow-sm transition ${
                hours >= 16 
                  ? 'bg-white border-emerald-300 ring-2 ring-emerald-100' 
                  : 'bg-slate-50 border-slate-200 opacity-70'
              }`}>
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 text-sm">Бесплатный проезд</h4>
                    {hours >= 16 && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Активна
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Электронный проездной билет на все муниципальные маршруты автобусов г. Кызыла (МУП «Кызылгортранс»).
                  </p>
                </div>

                {hours >= 16 ? (
                  <button
                    onClick={() => setActivePassModal({
                      title: 'Электронный проездной волонтера г. Кызыла',
                      desc: `Владелец: ${currentUser?.full_name || 'Ондар Чингис Артурович'}. Предоставляет право бесплатного проезда на муниципальных маршрутах Кызыла.`,
                      type: 'bus'
                    })}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Показать QR-проездной</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-400 font-medium text-center bg-slate-100 py-2 rounded-xl">
                    Доступно с 16 часов (еще {16 - hours} ч.)
                  </div>
                )}
              </div>

              {/* Льгота 2: Спорткомплекс Субедей */}
              <div className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 shadow-sm transition ${
                hours >= 36 
                  ? 'bg-white border-emerald-300 ring-2 ring-emerald-100' 
                  : 'bg-slate-50 border-slate-200 opacity-70'
              }`}>
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 text-sm">Абонемент «Субедей»</h4>
                    {hours >= 36 && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Активна
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Безлимитный абонемент в тренажерный зал и бассейн универсального спортивного комплекса «Субедей».
                  </p>
                </div>

                {hours >= 36 ? (
                  <button
                    onClick={() => setActivePassModal({
                      title: 'Абонемент в УСК «Субедей»',
                      desc: `Владелец: ${currentUser?.full_name || 'Ондар Чингис Артурович'}. Пропуск в тренажерный зал и плавательный бассейн за активную социальную практику.`,
                      type: 'gym'
                    })}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Абонемент (QR-код)</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-400 font-medium text-center bg-slate-100 py-2 rounded-xl">
                    Доступно с 36 часов (еще {36 - hours} ч.)
                  </div>
                )}
              </div>

              {/* Льгота 3: Социальная стипендия Мэрии */}
              <div className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 shadow-sm transition ${
                hours >= 36 
                  ? 'bg-white border-emerald-300 ring-2 ring-emerald-100' 
                  : 'bg-slate-50 border-slate-200 opacity-70'
              }`}>
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 text-sm">Стипендия 5 000 ₽</h4>
                    {hours >= 36 && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Начислено
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Ежемесячная денежная выплата от Департамента соцполитики Мэрии за отработку 35+ часов помощи в месяц.
                  </p>
                </div>

                {hours >= 36 ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 font-bold text-xs text-center border border-emerald-200">
                    💳 Карта МИР подключена
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 font-medium text-center bg-slate-100 py-2 rounded-xl">
                    Требуется 36 часов практики
                  </div>
                )}
              </div>

              {/* Льгота 4: +10 баллов к поступлению */}
              <div className={`p-5 rounded-3xl border flex flex-col justify-between space-y-4 shadow-sm transition ${
                hours >= 60 
                  ? 'bg-white border-emerald-300 ring-2 ring-emerald-100' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 text-sm">+10 баллов к ЕГЭ</h4>
                    {hours >= 60 ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Получено
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                        Осталось {60 - hours} ч.
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Дополнительные индивидуальные баллы при поступлении в ТувГУ и ссузы Республики Тыва по ходатайству Мэрии.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold text-[11px] text-center">
                  {hours >= 60 ? 'Ходатайство прикреплено к справке' : `Выполните еще ${Math.max(1, Math.ceil((60 - hours) / 2))} выезда`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ВКЛАДКА 1: ЛЕНТА ДОСТУПНЫХ ЗАЯВОК */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase">Фильтры:</span>
              
              <select
                value={selectedDistrict || ''}
                onChange={(e) => setSelectedDistrict(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-medium focus:outline-none"
              >
                <option value="">Все микрорайоны Кызыла</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={alongMyRoutes}
                  onChange={(e) => setAlongMyRoutes(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>По пути (мой район)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={emergencyOnly}
                  onChange={(e) => setEmergencyOnly(e.target.checked)}
                  className="rounded text-red-600"
                />
                <span>Только срочные (SOS)</span>
              </label>
            </div>

            <button
              onClick={loadFeed}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Обновить ленту
            </button>
          </div>

          {loadingFeed ? (
            <div className="p-12 text-center text-slate-400">Загрузка заявок...</div>
          ) : feedTasks.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
              По выбранным фильтрам нет свободных задач. Попробуйте сбросить фильтры.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {feedTasks.map(task => (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                    task.is_emergency ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold bg-blue-100 text-municipal-800 px-2.5 py-0.5 rounded-full">
                        {task.category_title}
                      </span>
                      {task.is_emergency && (
                        <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          SOS
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{task.district_name}</span>
                    </h3>

                    <div className="text-xs text-slate-500 mb-3 font-medium">
                      Адрес: <b>{task.address}</b> (номер квартиры доступен после взятия)
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 line-clamp-3">
                      {task.description}
                    </div>

                    <div className="text-[11px] text-slate-400 mb-4 flex items-center justify-between">
                      <span>Льгота: <b>{task.benefit_category}</b></span>
                      <span>Волонтеры: <b>{task.assigned_count || 0}/{task.required_volunteers}</b></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptTask(task.id)}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Откликнуться / Взять задачу</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ВКЛАДКА 2: МОИ ЗАДАЧИ И ЧАТ С ИНСПЕКТОРОМ */}
      {activeTab === 'my-tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Закрепленные за вами задания:
            </h3>
            {myTasks.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                У вас пока нет активных задач. Перейдите во вкладку «Лента» и откликнитесь на заявку.
              </div>
            ) : (
              myTasks.map(t => (
                <div
                  key={t.assignment_id}
                  onClick={() => {
                    setSelectedTask(t);
                    loadChat(t.application.id);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
                    selectedTask?.assignment_id === t.assignment_id
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-slate-900">{t.application.uin}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                      t.status === 'submitted' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {t.status === 'verified' && 'Утверждено (+часы)'}
                      {t.status === 'submitted' && 'На проверке'}
                      {t.status === 'accepted' && 'В работе'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 font-semibold line-clamp-1">
                    {t.application.category_title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{t.application.address}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            {selectedTask ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs text-slate-400 font-semibold uppercase">Заявитель:</span>
                      <h4 className="text-base font-bold text-slate-900">{selectedTask.application.applicant_name}</h4>
                    </div>
                    <a
                      href={`tel:${selectedTask.application.phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-sm transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selectedTask.application.phone}</span>
                    </a>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div><b>Адрес:</b> {selectedTask.application.address} ({selectedTask.application.district_name})</div>
                    <div><b>Категория:</b> {selectedTask.application.benefit_category}</div>
                    <div className="p-2.5 rounded bg-white border border-slate-200 text-slate-700 mt-2">
                      <b>Суть проблемы:</b> {selectedTask.application.description}
                    </div>
                  </div>
                </div>

                {selectedTask.status === 'accepted' ? (
                  <form onSubmit={handleSubmitReport} className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span>Форма отправки фотоотчета о выполненной работе</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          1. Снимок «Фото ДО»
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPhotoBefore(e.target.files ? e.target.files[0] : null)}
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase">
                          2. Снимок «Фото ПОСЛЕ»
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPhotoAfter(e.target.files ? e.target.files[0] : null)}
                          className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Комментарий волонтера к отчету
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={volunteerComment}
                        onChange={(e) => setVolunteerComment(e.target.value)}
                        placeholder="Опишите, что было сделано..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReport}
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submittingReport ? 'Отправка отчета...' : 'Отправить фотоотчет на проверку инспектору'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Отчет по заявке передан инспекции соцзащиты</span>
                    </div>
                    {selectedTask.photo_before_url && selectedTask.photo_after_url && (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 mb-1">Фото ДО:</div>
                          <img src={selectedTask.photo_before_url} alt="До" className="rounded-lg h-32 w-full object-cover border" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 mb-1">Фото ПОСЛЕ:</div>
                          <img src={selectedTask.photo_after_url} alt="После" className="rounded-lg h-32 w-full object-cover border" />
                        </div>
                      </div>
                    )}
                    {selectedTask.inspector_comment && (
                      <div className="p-2.5 rounded bg-emerald-100 text-emerald-900 font-medium text-xs mt-2">
                        Резолюция инспектора: {selectedTask.inspector_comment}
                      </div>
                    )}
                  </div>
                )}

                {/* Интерактивный чат с инспектором */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>Чат координации с дежурным инспектором соцзащиты</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Заявка: {selectedTask.application.uin}</span>
                  </div>

                  <div className="p-4 h-56 overflow-y-auto space-y-3 bg-slate-50/50">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-8">
                        Здесь можно уточнить детали у инспектора или запросить доп. инвентарь.
                      </div>
                    ) : (
                      chatMessages.map(msg => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-xl max-w-md text-xs shadow-sm ${
                            msg.sender_role === 'volunteer'
                              ? 'ml-auto bg-emerald-600 text-white rounded-br-none'
                              : 'mr-auto bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          <div className="text-[10px] font-semibold opacity-75 mb-1 flex items-center justify-between gap-3">
                            <span>{msg.sender_name} ({msg.sender_role})</span>
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div>{msg.message}</div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
                    <input
                      type="text"
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      placeholder="Напишите сообщение инспектору..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-municipal-600"
                    />
                    <button
                      type="submit"
                      disabled={sendingMsg}
                      className="px-4 py-2 rounded-lg bg-municipal-700 hover:bg-municipal-800 text-white text-xs font-bold"
                    >
                      Отправить
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                Выберите задачу из списка слева для просмотра контактов и отправки отчета
              </div>
            )}
          </div>
        </div>
      )}

      {/* ВКЛАДКА 4: ДНЕВНИК ПРАКТИКИ И ГРАМОТЫ */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 to-municipal-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
            <div>
              <div className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
                Официальный документ с гербовой печатью Мэрии Кызыла
              </div>
              <h3 className="text-xl font-black">
                Справка о прохождении социальной практики
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Выписка выполненных заданий с подтверждением наработанных часов практики ({hours} ч.). Принимается деканатами и аттестационными комиссиями.
              </p>
            </div>

            <button
              onClick={handleDownloadPracticePdf}
              disabled={downloadingPdf}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-6 py-3.5 rounded-xl text-xs sm:text-sm shadow-lg transition shrink-0 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{downloadingPdf ? 'Формирование PDF...' : 'Скачать Справку о практике (PDF)'}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-municipal-700" />
              <span>Журнал учета социальной практики</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b">
                  <tr>
                    <th className="py-3 px-4">УИН заявки</th>
                    <th className="py-3 px-4">Вид помощи</th>
                    <th className="py-3 px-4">Адрес выполнения</th>
                    <th className="py-3 px-4">Статус верификации</th>
                    <th className="py-3 px-4 text-right">Зачтено часов</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myTasks.map(t => (
                    <tr key={t.assignment_id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{t.application.uin}</td>
                      <td className="py-3 px-4">{t.application.category_title}</td>
                      <td className="py-3 px-4 text-slate-500">{t.application.address}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          t.status === 'verified' ? 'text-emerald-700' : 'text-blue-700'
                        }`}>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t.status === 'verified' ? 'Подтверждено Мэрией' : 'В обработке'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 text-sm">
                        +{t.hours_awarded} ч.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Награды и Почетные грамоты Мэрии города Кызыла</span>
            </h3>

            {certificates.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Грамоты будут выданы после наработки 30+ часов практики инспекцией соцзащиты.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certificates.map(cert => (
                  <div key={cert.id} className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/40 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                        Почетная грамота Мэрии • {cert.certificate_code}
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900">{cert.title}</h4>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {cert.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDownloadCertPdf(cert.id)}
                      className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <Award className="w-4 h-4" />
                      <span>Скачать грамоту в PDF</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ЦИФРОВОГО QR-ПРОПУСКА / ПРОЕЗДНОГО */}
      {activePassModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <QrCode className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Мэрия города Кызыла • Единый пропуск
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">
                {activePassModal.title}
              </h3>
            </div>

            {/* Имитация красивого QR-кода */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 inline-block mx-auto">
              <div className="w-44 h-44 bg-white p-2 rounded-xl border shadow-inner flex flex-col items-center justify-center relative">
                <div className="grid grid-cols-6 gap-1 w-full h-full opacity-80">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`rounded-sm ${
                        (i % 2 === 0 || i % 7 === 0) ? 'bg-slate-900' : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-md">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-2 font-bold">
                ID: VOL-KYZ-2026-{currentUser?.id || 1}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {activePassModal.desc}
            </p>

            <button
              onClick={() => setActivePassModal(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
