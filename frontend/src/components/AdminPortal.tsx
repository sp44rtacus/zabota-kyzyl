import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  UserPlus, 
  Volume2, 
  Award, 
  MapPin, 
  Check, 
  Users, 
  ShieldCheck,
  Ban,
  Clock,
  MessageSquare,
  Send,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Application, TaskMessage } from '../types';
import { api } from '../api/client';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'chats' | 'volunteers'>('kanban');

  // Данные Канбан
  const [columns, setColumns] = useState<{
    new: Application[];
    approved: Application[];
    in_progress: Application[];
    review: Application[];
    completed: Application[];
  }>({
    new: [],
    approved: [],
    in_progress: [],
    review: [],
    completed: []
  });
  const [loadingKanban, setLoadingKanban] = useState(false);

  // Сплит-экран проверки отчета
  const [selectedReviewAssignId, setSelectedReviewAssignId] = useState<number | null>(null);
  const [verificationData, setVerificationData] = useState<any | null>(null);
  const [inspectorHours, setInspectorHours] = useState(2);
  const [inspectorComment, setInspectorComment] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Назначение волонтера в 1 клик
  const [assignModalApp, setAssignModalApp] = useState<Application | null>(null);
  const [volunteersList, setVolunteersList] = useState<any[]>([]);

  // Чат инспектора с волонтером
  const [chatApp, setChatApp] = useState<Application | null>(null);
  const [chatMessages, setChatMessages] = useState<TaskMessage[]>([]);
  const [newInspectorMsg, setNewInspectorMsg] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  useEffect(() => {
    loadKanban();
    loadVolunteers();
  }, []);

  const loadKanban = async () => {
    setLoadingKanban(true);
    try {
      const data = await api.getKanban();
      setColumns(data);
    } catch (err) {
      console.error("Ошибка загрузки канбан:", err);
    } finally {
      setLoadingKanban(false);
    }
  };

  const loadVolunteers = async () => {
    try {
      const list = await api.getVolunteers();
      setVolunteersList(list);
    } catch (err) {
      console.error("Ошибка волонтеров:", err);
    }
  };

  const handleUpdateStatus = async (appId: number, status: string) => {
    try {
      await api.updateApplicationStatus(appId, status);
      loadKanban();
    } catch (err: any) {
      alert(err.message || "Ошибка смены статуса");
    }
  };

  const openVerificationModal = async (assignId: number) => {
    setSelectedReviewAssignId(assignId);
    try {
      const details = await api.getVerificationDetails(assignId);
      setVerificationData(details);
      setInspectorHours(details.hours_awarded || 2);
      // Загрузка сообщений чата по заявке в окно верификации
      const msgs = await api.getChat(details.application.id);
      setChatMessages(msgs);
    } catch (err) {
      alert("Ошибка загрузки данных верификации");
    }
  };

  const openChatModal = async (app: Application) => {
    setChatApp(app);
    try {
      const msgs = await api.getChat(app.id);
      setChatMessages(msgs);
    } catch (err) {
      console.error("Ошибка загрузки чата:", err);
    }
  };

  const handleSendInspectorMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAppId = chatApp?.id || verificationData?.application?.id;
    if (!targetAppId || !newInspectorMsg.trim()) return;

    setSendingChat(true);
    try {
      await api.sendMessage(targetAppId, newInspectorMsg.trim());
      setNewInspectorMsg('');
      const msgs = await api.getChat(targetAppId);
      setChatMessages(msgs);
    } catch (err) {
      console.error("Ошибка отправки:", err);
    } finally {
      setSendingChat(false);
    }
  };

  const handleVerify = async (action: 'approve' | 'reject') => {
    if (!selectedReviewAssignId) return;
    setVerifying(true);
    try {
      await api.verifyReport(selectedReviewAssignId, {
        action,
        hours: inspectorHours,
        inspector_comment: inspectorComment.trim() || undefined
      });
      if (action === 'approve') {
        confetti({ particleCount: 60, spread: 70 });
        alert("Отчет успешно утвержден! Волонтеру зачислены часы практики.");
      } else {
        alert("Отчет возвращен волонтеру на доработку.");
      }
      setSelectedReviewAssignId(null);
      setVerificationData(null);
      setInspectorComment('');
      loadKanban();
    } catch (err: any) {
      alert(err.message || "Ошибка верификации");
    } finally {
      setVerifying(false);
    }
  };

  const handleOneClickAssign = async (volunteerId: number) => {
    if (!assignModalApp) return;
    try {
      await api.assignVolunteer(assignModalApp.id, volunteerId);
      alert(`Волонтер назначен на заявку ${assignModalApp.uin}`);
      setAssignModalApp(null);
      loadKanban();
    } catch (err: any) {
      alert(err.message || "Ошибка назначения волонтера");
    }
  };

  const handleToggleVolunteerStatus = async (volId: number) => {
    try {
      await api.toggleVolunteerStatus(volId);
      loadVolunteers();
    } catch (err: any) {
      alert(err.message || "Ошибка смены статуса волонтера");
    }
  };

  const handleIssueCert = async (volId: number) => {
    const title = prompt("Введите наименование почетной грамоты:", "За самоотверженный труд и помощь одиноким пожилым гражданам г. Кызыла");
    if (!title) return;
    try {
      await api.issueCertificate(volId, title);
      alert("Почетная грамота успешно зарегистрирована в реестре Мэрии!");
    } catch (err: any) {
      alert(err.message || "Ошибка выдачи грамоты");
    }
  };

  // Все заявки с назначенными волонтерами для вкладки "Чаты"
  const allActiveWithVolunteers = [
    ...columns.in_progress,
    ...columns.review,
    ...columns.completed
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Шапка рабочего стола инспектора */}
      <div className="bg-gradient-to-r from-municipal-800 to-blue-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-700/60 text-blue-200 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Рабочий стол специалиста-инспектора</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Панель управления и модерации АИС «Забота»
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-1">
            Модерация новых обращений жителей, координация волонтеров в чате и сплит-проверка фотоотчетов.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'kanban' ? 'bg-white text-municipal-800 shadow' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Канбан-доска</span>
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'chats' ? 'bg-white text-municipal-800 shadow' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Чаты с волонтерами ({allActiveWithVolunteers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('volunteers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'volunteers' ? 'bg-white text-municipal-800 shadow' : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Реестр волонтеров ({volunteersList.length})</span>
          </button>
        </div>
      </div>

      {/* КАНБАН-ДОСКА */}
      {activeTab === 'kanban' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>Канбан-доска текущих обращений граждан Кызыла</span>
            <button onClick={loadKanban} className="text-municipal-700 hover:underline">
              Обновить доску
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
            {/* КОЛОНКА 1: НОВЫЕ ЗАЯВКИ */}
            <div className="bg-slate-100/90 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Новые ({columns.new.length})
                </span>
              </div>

              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                {columns.new.map(app => (
                  <div
                    key={app.id}
                    className={`bg-white p-4 rounded-xl border shadow-sm transition space-y-3 ${
                      app.is_emergency ? 'border-red-500 ring-2 ring-red-100 bg-red-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900">{app.uin}</span>
                      {app.is_emergency && (
                        <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full animate-pulse">
                          SOS
                        </span>
                      )}
                    </div>

                    <div className="text-xs space-y-1">
                      <div className="font-bold text-slate-800">{app.applicant_name}</div>
                      <div className="text-slate-500">{app.phone}</div>
                      <div className="text-emerald-700 font-medium">{app.district_name} • {app.address}</div>
                      <div className="text-slate-600 bg-slate-50 p-2 rounded text-[11px] border border-slate-100">
                        {app.description}
                      </div>
                    </div>

                    {/* Кнопки модерации */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'approved')}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Одобрить</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, 'rejected')}
                          className="py-1.5 px-2.5 bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 text-[11px] font-bold rounded-lg transition"
                          title="Отклонить"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => setAssignModalApp(app)}
                        className="w-full py-1.5 bg-municipal-700 hover:bg-municipal-800 text-white text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Назначить волонтера</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* КОЛОНКА 2: ОДОБРЕННЫЕ (В ЛЕНТЕ) */}
            <div className="bg-slate-100/90 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  В ленте ({columns.approved.length})
                </span>
              </div>

              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                {columns.approved.map(app => (
                  <div key={app.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900">{app.uin}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                        {app.category_title}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700">
                      <div className="font-semibold">{app.applicant_name}</div>
                      <div className="text-slate-500">{app.district_name} • {app.address}</div>
                    </div>

                    <button
                      onClick={() => setAssignModalApp(app)}
                      className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-municipal-700 text-[11px] font-bold rounded-lg border border-blue-200 transition flex items-center justify-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Назначить прямо</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* КОЛОНКА 3: В РАБОТЕ */}
            <div className="bg-slate-100/90 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  В работе ({columns.in_progress.length})
                </span>
              </div>

              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                {columns.in_progress.map(app => {
                  const vol = app.volunteers && app.volunteers.length > 0 ? app.volunteers[0] : null;
                  return (
                    <div key={app.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-900">{app.uin}</span>
                        <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                          Исполняется
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="font-semibold text-slate-800">{app.applicant_name}</div>
                        <div className="text-slate-500">{app.address}</div>
                        
                        {vol && (
                          <div className="p-2 rounded bg-purple-50 border border-purple-100 text-[11px] text-purple-900 mt-1">
                            <b>Волонтер:</b> {vol.full_name} ({vol.phone})
                          </div>
                        )}
                      </div>

                      {/* ПРЯМАЯ КНОПКА ЧАТА С ВОЛОНТЕРОМ */}
                      <button
                        onClick={() => openChatModal(app)}
                        className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-municipal-700 text-[11px] font-bold rounded-lg border border-blue-200 transition flex items-center justify-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>Чат с волонтером</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* КОЛОНКА 4: ПРОВЕРКА ОТЧЕТОВ */}
            <div className="bg-slate-100/90 rounded-2xl p-4 border border-amber-300 ring-2 ring-amber-100 space-y-3">
              <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-amber-900 pb-2 border-b border-amber-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Проверка фото ({columns.review.length})
                </span>
              </div>

              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                {columns.review.map(app => {
                  const firstVol = app.volunteers && app.volunteers.length > 0 ? app.volunteers[0] : null;
                  return (
                    <div key={app.id} className="bg-white p-4 rounded-xl border-2 border-amber-300 shadow-md space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-900">{app.uin}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          Ждет проверки
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="font-bold text-slate-800">{app.applicant_name}</div>
                        <div className="text-slate-500">{app.category_title} • {app.district_name}</div>
                        {firstVol && (
                          <div className="text-emerald-700 font-semibold text-[11px]">
                            Волонтер: {firstVol.full_name}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {firstVol && (
                          <button
                            onClick={() => openVerificationModal(firstVol.assignment_id)}
                            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-1.5"
                          >
                            <span>Сплит-экран проверки</span>
                          </button>
                        )}
                        <button
                          onClick={() => openChatModal(app)}
                          className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition flex items-center justify-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3 text-slate-500" />
                          <span>История переписки</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* КОЛОНКА 5: ВЫПОЛНЕННЫЕ */}
            <div className="bg-slate-100/90 rounded-2xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-200">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Выполнено ({columns.completed.length})
                </span>
              </div>

              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                {columns.completed.map(app => (
                  <div key={app.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-90 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{app.uin}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        Утверждено
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-medium">{app.applicant_name}</div>
                    <div className="text-[11px] text-slate-400">{app.category_title}</div>
                    <button
                      onClick={() => openChatModal(app)}
                      className="text-[10px] text-blue-600 hover:underline pt-1 flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Открыть архив чата</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ВКЛАДКА 2: ВСЕ ЧАТЫ С ВОЛОНТЕРАМИ */}
      {activeTab === 'chats' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>Центр оперативной связи инспекторов с волонтерами г. Кызыла</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Здесь отображаются все активные диалоги по заявкам. Инспектор может мгновенно ответить волонтеру, согласовать инвентарь или проконсультировать.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allActiveWithVolunteers.map(app => {
              const vol = app.volunteers && app.volunteers.length > 0 ? app.volunteers[0] : null;
              return (
                <div
                  key={app.id}
                  onClick={() => openChatModal(app)}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-municipal-600 hover:shadow-md cursor-pointer transition space-y-3 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-slate-900">{app.uin}</span>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      {app.status === 'in_progress' ? 'В работе' : (app.status === 'review' ? 'На проверке' : 'Завершено')}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-slate-600 font-medium">Заявитель: <b>{app.applicant_name}</b></div>
                    <div className="text-slate-500">{app.district_name} • {app.address}</div>
                    {vol && (
                      <div className="p-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
                        <span>Волонтер: {vol.full_name}</span>
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <button className="w-full py-2 bg-municipal-700 hover:bg-municipal-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Открыть диалог</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ВКЛАДКА 3: РЕЕСТР ВОЛОНТЕРОВ */}
      {activeTab === 'volunteers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-municipal-700" />
            <span>Городской реестр волонтеров и учет социальной практики</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b">
                <tr>
                  <th className="py-3 px-4">ФИО Волонтера</th>
                  <th className="py-3 px-4">Телефон</th>
                  <th className="py-3 px-4">Район проживания</th>
                  <th className="py-3 px-4">Наработано часов</th>
                  <th className="py-3 px-4">Рейтинг</th>
                  <th className="py-3 px-4">Статус</th>
                  <th className="py-3 px-4 text-right">Действия инспектора</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {volunteersList.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{v.full_name}</td>
                    <td className="py-3 px-4">{v.phone}</td>
                    <td className="py-3 px-4 text-slate-500">{v.district_name}</td>
                    <td className="py-3 px-4 font-black text-emerald-700 text-sm">
                      {v.volunteer_hours} ч.
                    </td>
                    <td className="py-3 px-4 font-bold text-amber-600">{v.rating}★</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {v.status === 'active' ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleIssueCert(v.id)}
                        className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded text-[11px] transition"
                        title="Выдать почетную грамоту Мэрии"
                      >
                        🎖️ Наградить
                      </button>
                      <button
                        onClick={() => handleToggleVolunteerStatus(v.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] transition"
                      >
                        {v.status === 'active' ? 'Заблокировать' : 'Активировать'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ЧАТА ИНСПЕКТОРА С ВОЛОНТЕРОМ */}
      {chatApp && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Оперативный чат с волонтером
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Заявка {chatApp.uin} • {chatApp.applicant_name}
                </h3>
              </div>
              <button onClick={() => setChatApp(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1">
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div><b>Адрес:</b> {chatApp.address} ({chatApp.district_name})</div>
              <div><b>Услуга:</b> {chatApp.category_title}</div>
            </div>

            {/* Окно сообщений */}
            <div className="h-64 overflow-y-auto space-y-3 p-3 bg-slate-50/70 rounded-2xl border border-slate-200">
              {chatMessages.length === 0 ? (
                <div className="text-center text-xs text-slate-400 py-12">
                  В этом чате пока нет сообщений. Напишите волонтеру первое указание.
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl max-w-sm text-xs shadow-sm ${
                      msg.sender_role === 'inspector' || msg.sender_role === 'director'
                        ? 'ml-auto bg-municipal-700 text-white rounded-br-none'
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

            {/* Форма отправки сообщения от инспектора */}
            <form onSubmit={handleSendInspectorMsg} className="flex gap-2">
              <input
                type="text"
                value={newInspectorMsg}
                onChange={(e) => setNewInspectorMsg(e.target.value)}
                placeholder="Напишите ответ волонтеру..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-municipal-600"
              />
              <button
                type="submit"
                disabled={sendingChat}
                className="px-5 py-2.5 rounded-xl bg-municipal-700 hover:bg-municipal-800 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Отправить</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* СПЛИТ-ЭКРАН ВЕРИФИКАЦИИ ФОТООТЧЕТА С ИНТЕГРИРОВАННЫМ ЧАТОМ */}
      {selectedReviewAssignId && verificationData && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Модуль верификации качества социальной помощи
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Проверка фотоотчета по заявке {verificationData.application.uin}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedReviewAssignId(null);
                  setVerificationData(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* СПЛИТ-ЭКРАН ФОТО ДО / ПОСЛЕ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Снимок «Фото ДО начала работ»:
                </div>
                {verificationData.photo_before_url ? (
                  <img
                    src={verificationData.photo_before_url}
                    alt="Фото ДО"
                    className="w-full h-56 object-cover rounded-2xl border-2 border-slate-200 shadow-inner"
                  />
                ) : (
                  <div className="w-full h-56 bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-400">
                    Снимок не прикреплен
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Снимок «Фото ПОСЛЕ завершения»:
                </div>
                {verificationData.photo_after_url ? (
                  <img
                    src={verificationData.photo_after_url}
                    alt="Фото ПОСЛЕ"
                    className="w-full h-56 object-cover rounded-2xl border-2 border-emerald-300 shadow-inner"
                  />
                ) : (
                  <div className="w-full h-56 bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-400">
                    Снимок не прикреплен
                  </div>
                )}
              </div>
            </div>

            {/* Аудиозапись заявителя */}
            {verificationData.application.audio_url && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <span>Голосовое сообщение заявителя при подаче:</span>
                </div>
                <audio src={verificationData.application.audio_url} controls className="h-8 max-w-[250px]" />
              </div>
            )}

            {/* Детали и комментарий волонтера */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div><b>Заявитель:</b> {verificationData.application.applicant_name} ({verificationData.application.phone})</div>
              <div><b>Адрес в Кызыле:</b> {verificationData.application.address}</div>
              <div><b>Волонтер-исполнитель:</b> {verificationData.volunteer.full_name}</div>
              <div className="pt-2 text-slate-700 border-t">
                <b>Комментарий волонтера:</b> {verificationData.volunteer_comment || 'Без комментария'}
              </div>
            </div>

            {/* Встроенный чат координации в модальном окне */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Переписка инспектора с волонтером по данной задаче:</span>
              </div>
              <div className="h-36 overflow-y-auto space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-4">Сообщений в чате пока нет.</div>
                ) : (
                  chatMessages.map(m => (
                    <div key={m.id} className="text-xs">
                      <span className="font-bold text-slate-800">{m.sender_name}: </span>
                      <span className="text-slate-600">{m.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Резолюция инспектора */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Начислить часов практики:
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={inspectorHours}
                  onChange={(e) => setInspectorHours(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-center"
                />
                <span className="text-xs text-slate-500">академических часа</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Замечание инспектора (при возврате на доработку):
                </label>
                <input
                  type="text"
                  value={inspectorComment}
                  onChange={(e) => setInspectorComment(e.target.value)}
                  placeholder="Например: Фото размыто, сфотографируйте калитку крупнее..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => handleVerify('approve')}
                  disabled={verifying}
                  className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Утвердить отчет (+{inspectorHours} ч. волонтеру)</span>
                </button>

                <button
                  onClick={() => handleVerify('reject')}
                  disabled={verifying}
                  className="px-6 py-3.5 bg-red-100 hover:bg-red-200 text-red-800 font-bold text-xs sm:text-sm rounded-xl transition"
                >
                  Отправить на доработку
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО НАЗНАЧЕНИЯ ВОЛОНТЕРА */}
      {assignModalApp && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-bold text-slate-900">
                Назначить волонтера на заявку {assignModalApp.uin}
              </h3>
              <button onClick={() => setAssignModalApp(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl">
              <div><b>Район:</b> {assignModalApp.district_name}</div>
              <div><b>Услуга:</b> {assignModalApp.category_title}</div>
              <div><b>Адрес:</b> {assignModalApp.address}</div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <div className="text-xs font-bold text-slate-700 uppercase">Выберите волонтера:</div>
              {volunteersList.filter(v => v.status === 'active').map(vol => (
                <div
                  key={vol.id}
                  onClick={() => handleOneClickAssign(vol.id)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-municipal-600 hover:bg-blue-50/50 cursor-pointer transition flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{vol.full_name}</div>
                    <div className="text-slate-500 text-[11px]">{vol.district_name} • {vol.volunteer_hours} ч.</div>
                  </div>
                  <button className="px-3 py-1 bg-municipal-700 text-white font-bold rounded-lg text-[11px]">
                    Назначить
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
