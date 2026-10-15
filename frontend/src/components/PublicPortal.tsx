import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartHandshake, 
  AlertTriangle, 
  Send, 
  Mic, 
  Square, 
  Trash2, 
  CheckCircle2, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Flame, 
  Snowflake, 
  ShoppingBag, 
  Wrench, 
  HeartPulse,
  Sparkles,
  Search
} from 'lucide-react';
import { District, Category, SummaryStats } from '../types';
import { api } from '../api/client';

interface PublicPortalProps {
  onGoToTrack: () => void;
  onGoToWarmingMap: () => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ onGoToTrack, onGoToWarmingMap }) => {
  // Данные с бэкенда
  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [counters, setCounters] = useState<SummaryStats>({
    completed_count: 0,
    volunteers_count: 0,
    districts_count: 0,
    total_applications: 0
  });

  // Поля формы
  const [isThirdParty, setIsThirdParty] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [phone, setPhone] = useState('');
  const [thirdPartyInfo, setThirdPartyInfo] = useState('');
  const [benefitCategory, setBenefitCategory] = useState('Одинокий пенсионер');
  const [districtId, setDistrictId] = useState<number>(1);
  const [address, setAddress] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);

  // Запись аудио с микрофона (HTML5 MediaRecorder)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Состояние отправки
  const [submitting, setSubmitting] = useState(false);
  const [createdUin, setCreatedUin] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Загрузка справочников и счетчиков
    Promise.all([
      api.getDistricts(),
      api.getCategories(),
      api.getCounters()
    ]).then(([d, c, cnt]) => {
      setDistricts(d);
      setCategories(c);
      setCounters(cnt);
      if (d.length > 0) setDistrictId(d[0].id);
      if (c.length > 0) setCategoryId(c[0].id);
    }).catch(err => console.error("Ошибка загрузки данных:", err));
  }, []);

  // Управление записью аудио
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Не удалось получить доступ к микрофону. Проверьте разрешения браузера.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const scrollToForm = (sos = false) => {
    setIsEmergency(sos);
    if (sos) {
      // Подбираем категорию аварии
      const emergencyCat = categories.find(c => c.title.includes('SOS') || c.title.includes('авариях'));
      if (emergencyCat) setCategoryId(emergencyCat.id);
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!applicantName.trim() || !phone.trim() || !address.trim()) {
      setFormError("Пожалуйста, укажите ФИО, телефон и точный адрес.");
      return;
    }

    const finalDescription = description.trim() || (audioBlob ? "Голосовое обращение жителя" : "Требуется адресная социальная помощь");

    setSubmitting(true);
    try {
      if (audioBlob) {
        const formData = new FormData();
        formData.append('applicant_name', applicantName.trim());
        formData.append('phone', phone.trim());
        formData.append('is_third_party', isThirdParty ? 'true' : 'false');
        if (thirdPartyInfo) formData.append('third_party_info', thirdPartyInfo.trim());
        formData.append('benefit_category', benefitCategory);
        formData.append('district_id', districtId.toString());
        formData.append('address', address.trim());
        formData.append('category_id', categoryId.toString());
        formData.append('description', finalDescription);
        formData.append('is_emergency', isEmergency ? 'true' : 'false');
        formData.append('audio_file', audioBlob, 'voice_request.webm');

        const res = await api.createApplicationWithAudio(formData);
        setCreatedUin(res.uin);
      } else {
        const res = await api.createApplication({
          applicant_name: applicantName.trim(),
          phone: phone.trim(),
          is_third_party: isThirdParty,
          third_party_info: thirdPartyInfo.trim() || undefined,
          benefit_category: benefitCategory,
          district_id: districtId,
          address: address.trim(),
          category_id: categoryId,
          description: finalDescription,
          is_emergency: isEmergency
        });
        setCreatedUin(res.uin);
      }
    } catch (err: any) {
      setFormError(err.message || "Ошибка при отправке заявки. Попробуйте еще раз.");
    } finally {
      setSubmitting(false);
    }
  };

  const benefitCategoriesList = [
    "Одинокий пенсионер",
    "Семья участника СВО",
    "Ветеран труда РФ / Республики Тыва",
    "Ветеран Великой Отечественной войны",
    "Инвалид I группы (маломобильный)",
    "Инвалид II группы",
    "Многодетная семья (от 3-х детей)",
    "Семья с ребенком-инвалидом",
    "Гражданин в трудной жизненной ситуации"
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* HERO БЛОК */}
      <section className="relative bg-gradient-to-br from-municipal-800 via-municipal-700 to-blue-900 text-white overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Единая городская система социальной координации г. Кызыла</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white mb-6">
              Помощь рядом. <br />
              <span className="text-blue-200">Адресная поддержка</span> жителей столицы Тувы
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed mb-8">
              Официальный сервис мэрии Кызыла для бесплатной бытовой, гуманитарной и экстренной помощи пожилым гражданам, семьям участников СВО и людям с ограниченными возможностями здоровья.
            </p>

            {/* Две ключевые кнопки по ТЗ */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button
                onClick={() => scrollToForm(false)}
                className="bg-white hover:bg-slate-100 text-municipal-800 font-extrabold text-base px-8 py-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <HeartHandshake className="w-5 h-5 text-municipal-700" />
                <span>Подать заявку на помощь</span>
              </button>

              <button
                onClick={() => scrollToForm(true)}
                className="bg-red-600 hover:bg-red-500 text-white font-black text-base px-8 py-4 rounded-xl shadow-xl transition flex items-center justify-center gap-2.5 animate-pulse-fast ring-4 ring-red-400/30"
              >
                <AlertTriangle className="w-5 h-5 text-amber-200 animate-bounce" />
                <span>SOS: ЭКСТРЕННАЯ ПОМОЩЬ</span>
              </button>
            </div>

            {/* Быстрый переход к карте и трекеру */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
              <button
                onClick={onGoToWarmingMap}
                className="flex items-center gap-1.5 hover:text-white underline underline-offset-4"
              >
                <MapPin className="w-4 h-4 text-red-400" />
                <span>Карта пунктов обогрева Мэрии</span>
              </button>
              <span>•</span>
              <button
                onClick={onGoToTrack}
                className="flex items-center gap-1.5 hover:text-white underline underline-offset-4"
              >
                <Search className="w-4 h-4 text-blue-300" />
                <span>Проверить статус по номеру заявки</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ИНТЕРАКТИВНЫЕ ВИДЖЕТЫ: СЧЕТЧИКИ ПО ТЗ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{counters.completed_count}</div>
              <div className="text-xs text-slate-500 font-medium">Выполнено адресных заявок</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-municipal-700 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{counters.volunteers_count}</div>
              <div className="text-xs text-slate-500 font-medium">Волонтеров в реестре города</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <MapPin className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">{counters.districts_count}</div>
              <div className="text-xs text-slate-500 font-medium">Охваченных микрорайонов Кызыла</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200 flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Flame className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">4 пункта</div>
              <div className="text-xs text-slate-500 font-medium">Пункта обогрева и питания</div>
            </div>
          </div>
        </div>
      </section>

      {/* КАТЕГОРИИ ПОМОЩИ (КАРТОЧКИ) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-slate-900">Чем мы помогаем жителям Кызыла</h2>
          <p className="text-sm text-slate-600 mt-1">Все услуги оказываются бесплатно силами волонтерских отрядов и соцслужб Мэрии</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map(c => (
            <div
              key={c.id}
              onClick={() => {
                setCategoryId(c.id);
                scrollToForm(c.title.includes('SOS'));
              }}
              className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:border-municipal-500 hover:shadow-md cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-municipal-700 transition">
                {c.icon === 'Snowflake' && <Snowflake className="w-5 h-5" />}
                {c.icon === 'ShoppingBag' && <ShoppingBag className="w-5 h-5" />}
                {c.icon === 'Flame' && <Flame className="w-5 h-5 text-amber-600" />}
                {c.icon === 'Wrench' && <Wrench className="w-5 h-5" />}
                {c.icon === 'HeartPulse' && <HeartPulse className="w-5 h-5 text-red-500" />}
                {c.icon === 'AlertTriangle' && <AlertTriangle className="w-5 h-5 text-red-600" />}
              </div>
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {c.title}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ФОРМА СОЗДАНИЯ ЗАЯВКИ ПО ТЗ */}
      <section ref={formRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className={`bg-white rounded-3xl border shadow-xl overflow-hidden transition ${
          isEmergency ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-200'
        }`}>
          {/* Шапка формы */}
          <div className={`p-6 sm:p-8 text-white ${
            isEmergency 
              ? 'bg-gradient-to-r from-red-700 to-red-600' 
              : 'bg-gradient-to-r from-municipal-800 to-municipal-700'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {isEmergency ? '🚨 Экстренное обращение в Мэрию' : 'Электронная приемная Департамента по соцполитике'}
                </span>
                <h3 className="text-2xl font-black tracking-tight mt-1 text-white">
                  Форма подачи заявления на адресную помощь
                </h3>
              </div>

              {/* Переключатель SOS */}
              <label className="flex items-center gap-2 cursor-pointer bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm hover:bg-white/20 transition">
                <input
                  type="checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-xs font-bold text-white select-none">
                  Режим SOS (Срочно)
                </span>
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {formError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Переключатель: Для себя / За соседа */}
            <div className="flex rounded-xl bg-slate-100 p-1 max-w-md">
              <button
                type="button"
                onClick={() => setIsThirdParty(false)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  !isThirdParty ? 'bg-white text-municipal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Заявка для себя
              </button>
              <button
                type="button"
                onClick={() => setIsThirdParty(true)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  isThirdParty ? 'bg-white text-municipal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Подать за соседа / родственника
              </button>
            </div>

            {/* Контакты заявителя */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ФИО получателя помощи *
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="Иванова Прасковья Семеновна"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-municipal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Контактный телефон *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (913) 000-00-00"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-municipal-600"
                />
              </div>
            </div>

            {isThirdParty && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Данные того, кто подает обращение (ФИО и ваш телефон)
                </label>
                <input
                  type="text"
                  value={thirdPartyInfo}
                  onChange={(e) => setThirdPartyInfo(e.target.value)}
                  placeholder="Сосед: Бады-Сагаан Артур, тел: +7 (923) 111-22-33"
                  className="w-full px-4 py-2 rounded-lg border border-blue-300 text-xs bg-white focus:outline-none"
                />
              </div>
            )}

            {/* Категория льготы и район */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Категория льготы *
                </label>
                <select
                  value={benefitCategory}
                  onChange={(e) => setBenefitCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-municipal-600"
                >
                  {benefitCategoriesList.map((bc, idx) => (
                    <option key={idx} value={bc}>{bc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Микрорайон г. Кызыла *
                </label>
                <select
                  value={districtId}
                  onChange={(e) => setDistrictId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-municipal-600"
                >
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Адрес и категория помощи */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Точный адрес (Улица, дом, кв.) *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ул. Ленина, д. 24, кв. 15 (или линия дач)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-municipal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Требуемая помощь *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-municipal-600"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Описание ситуации + Запись аудио по ТЗ */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Описание ситуации (или надиктуйте голосом)
                </label>
                <span className="text-xs text-slate-400">необязательно, если записан голос</span>
              </div>

              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опишите, какая требуется помощь (например: не могу выйти из дома из-за сугроба у крыльца, привезти дрова, продукты)..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-municipal-600"
              />

              {/* Блок голосовой записи по ТЗ 5.1 (микрофон на JS) */}
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-3.5 py-2 rounded-lg bg-municipal-700 hover:bg-municipal-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
                    >
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <span>Записать голосовое сообщение</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-md animate-pulse transition"
                    >
                      <Square className="w-4 h-4" />
                      <span>Остановить запись ({recordingTime} сек)</span>
                    </button>
                  )}

                  {isRecording && (
                    <span className="text-xs text-red-600 font-semibold flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                      Идет запись с микрофона...
                    </span>
                  )}
                </div>

                {audioUrl && !isRecording && (
                  <div className="flex items-center gap-2">
                    <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
                    <button
                      type="button"
                      onClick={removeAudio}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Удалить запись"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Кнопка отправки */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-xl text-base font-extrabold shadow-lg transition flex items-center justify-center gap-2 text-white ${
                  isEmergency
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-municipal-700 hover:bg-municipal-800'
                }`}
              >
                <Send className="w-5 h-5" />
                <span>
                  {submitting ? 'Отправка в Департамент...' : (isEmergency ? 'ОТПРАВИТЬ СРОЧНУЮ SOS-ЗАЯВКУ' : 'Отправить заявку в Департамент соцполитики')}
                </span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* МОДАЛЬНОЕ ОКНО УСПЕШНОЙ ПОДАЧИ */}
      {createdUin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 text-center shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Заявка успешно зарегистрирована!
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Обращение передано дежурному инспектору Департамента по социальной политике мэрии г. Кызыла.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Ваш уникальный регистрационный номер (УИН):
              </div>
              <div className="text-3xl font-black text-municipal-700 tracking-wider">
                {createdUin}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Сохраните этот номер для проверки статуса на портале
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setCreatedUin(null);
                  onGoToTrack();
                }}
                className="flex-1 bg-municipal-700 hover:bg-municipal-800 text-white font-bold py-3 rounded-xl text-sm transition"
              >
                Отследить статус сейчас
              </button>
              <button
                onClick={() => {
                  setCreatedUin(null);
                  // Очистка формы
                  setApplicantName('');
                  setPhone('');
                  setAddress('');
                  setDescription('');
                  removeAudio();
                }}
                className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
