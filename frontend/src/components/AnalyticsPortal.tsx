import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  MapPin, 
  Flame, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Download
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { AnalyticsDashboard } from '../types';
import { api } from '../api/client';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AnalyticsPortal: React.FC = () => {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getDashboard(),
      api.getHeatmapPoints()
    ]).then(([dash, points]) => {
      setData(dash);
      setHeatmapPoints(points);
      setLoading(false);
    }).catch(err => {
      console.error("Ошибка аналитики:", err);
      setLoading(false);
    });
  }, []);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const blob = await api.exportExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Otchet_Zabota_Kyzyl_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Ошибка экспорта в Excel");
    } finally {
      setExporting(false);
    }
  };

  if (loading || !data) {
    return <div className="p-16 text-center text-slate-400">Загрузка аналитических сводок Мэрии...</div>;
  }

  // Данные для графика динамики (Line Chart)
  const lineChartData = {
    labels: data.dynamics.map(d => d.date),
    datasets: [
      {
        label: 'Всего обращений',
        data: data.dynamics.map(d => d.total),
        borderColor: '#1E3A8A',
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
      },
      {
        label: 'Выполнено',
        data: data.dynamics.map(d => d.completed),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
      },
      {
        label: 'SOS Экстренные',
        data: data.dynamics.map(d => d.emergency),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.3,
        borderWidth: 2,
      }
    ]
  };

  // Данные для столбчатой диаграммы по районам (Bar Chart)
  const barChartData = {
    labels: data.district_stats.map(d => d.district_name.replace(' микрорайон', '').replace(' район', '')),
    datasets: [
      {
        label: 'Количество заявок',
        data: data.district_stats.map(d => d.total_applications),
        backgroundColor: '#2563EB',
        borderRadius: 8,
      },
      {
        label: 'Выполнено',
        data: data.district_stats.map(d => d.completed_applications),
        backgroundColor: '#10B981',
        borderRadius: 8,
      }
    ]
  };

  // Данные для круговой диаграммы льготников (Doughnut)
  const doughnutData = {
    labels: data.benefit_stats.map(b => b.category),
    datasets: [
      {
        data: data.benefit_stats.map(b => b.count),
        backgroundColor: [
          '#1E3A8A',
          '#D97706',
          '#10B981',
          '#EF4444',
          '#8B5CF6',
          '#06B6D4',
          '#F59E0B'
        ],
        borderWidth: 1,
      }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Шапка аналитики директора */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-municipal-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-purple-800/60 text-purple-200 text-xs font-bold px-3 py-1 rounded-full mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Панель руководителя • Мэрия г. Кызыла</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Сводная аналитика и тепловая карта спроса
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Комплексный мониторинг эффективности волонтерских сил, районов концентрации заявок и экспорта отчетности.
          </p>
        </div>

        {/* Кнопка экспорта в Excel по ТЗ 5.3 */}
        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3.5 rounded-xl text-xs sm:text-sm shadow-lg transition flex items-center gap-2 shrink-0"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>{exporting ? 'Генерация отчета...' : 'Экспорт сводки в Excel (.xlsx)'}</span>
        </button>
      </div>

      {/* KPI КАРТОЧКИ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Всего обращений</div>
          <div className="text-3xl font-black text-slate-900 mt-2">{data.summary.total_applications}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{data.summary.completed_applications} успешно закрыто</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Экстренные вызовы (SOS)</div>
          <div className="text-3xl font-black text-red-600 mt-2">{data.summary.emergency_applications}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Приоритет: замерзание, отопление
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Часы соцпрактики</div>
          <div className="text-3xl font-black text-municipal-700 mt-2">{data.summary.total_volunteer_hours} ч.</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Наработано волонтерами Кызыла
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Охват микрорайонов</div>
          <div className="text-3xl font-black text-purple-700 mt-2">{data.summary.districts_covered} из 10</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Включая дачные общества ЛДО/ПДО
          </div>
        </div>
      </div>

      {/* ТЕПЛОВАЯ КАРТА СПРОСА ПО РАЙОНАМ КЫЗЫЛА ПО ТЗ 5.3 */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600" />
              <span>Тепловая карта концентрации заявок по микрорайонам Кызыла</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Цветовая индикация плотности потребностей граждан: красные и оранжевые зоны указывают на районы с наибольшей нагрузкой.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-3 h-3 rounded-full bg-red-600"></span> Высокий спрос / SOS
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Средний
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> Умеренный
            </span>
          </div>
        </div>

        <div className="h-[450px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0 isolate">
          <MapContainer
            center={[51.7250, 94.4378]}
            zoom={12}
            scrollWheelZoom={false}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {heatmapPoints.map((pt, idx) => {
              const radius = pt.is_emergency ? 24 : 16;
              const fillColor = pt.is_emergency ? '#DC2626' : (pt.weight > 0.6 ? '#F59E0B' : '#3B82F6');

              return (
                <CircleMarker
                  key={idx}
                  center={[pt.lat, pt.lng]}
                  radius={radius}
                  pathOptions={{
                    color: fillColor,
                    fillColor: fillColor,
                    fillOpacity: 0.6,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-slate-900">{pt.uin}</div>
                      <div><b>Район:</b> {pt.district}</div>
                      <div><b>Адрес:</b> {pt.address}</div>
                      <div><b>Категория:</b> {pt.category}</div>
                      {pt.is_emergency && (
                        <div className="text-red-700 font-black">🚨 Экстренная SOS помощь!</div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* ГРАФИКИ CHART.JS ПО ТЗ 5.3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График 1: Динамика обращений */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-municipal-700" />
            <span>Динамика обращений за период (Линейный график)</span>
          </h4>
          <div className="h-64">
            <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* График 2: Распределение по льготникам */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>Распределение по категориям льготников</span>
          </h4>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* График 3: Статистика по микрорайонам Кызыла */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-purple-700" />
            <span>Сравнительная статистика нагрузки по районам города</span>
          </h4>
          <div className="h-72">
            <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>
    </div>
  );
};
