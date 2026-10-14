import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Phone, Clock, Users, ShieldAlert } from 'lucide-react';
import { WarmingPoint } from '../types';
import { api } from '../api/client';

// Фикс иконок маркеров Leaflet в Vite
const warmingIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Компонент для программного перемещения центра карты
const MapFlyTo: React.FC<{ coords: [number, number] | null }> = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, 14, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
};

export const WarmingMap: React.FC = () => {
  const [points, setPoints] = useState<WarmingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
  const [activePointId, setActivePointId] = useState<number | null>(null);

  useEffect(() => {
    api.getWarmingPoints()
      .then(data => {
        setPoints(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Ошибка загрузки пунктов обогрева:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Заголовок страницы */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
          <ShieldAlert className="w-4 h-4" />
          Муниципальная сеть экстренной поддержки
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Пункты обогрева и гуманитарной помощи в Кызыле
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Официальные пункты Мэрии города Кызыла и МЧС для временного обогрева, получения горячего чая, питания и теплой одежды в период низких температур и перебоев отопления.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список пунктов (левая колонка) */}
        <div className="space-y-4 order-2 lg:order-1 max-h-[600px] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Загрузка пунктов помощи...</div>
          ) : points.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Пункты не найдены</div>
          ) : (
            points.map(pt => (
              <div
                key={pt.id}
                onClick={() => {
                  setSelectedCoords([pt.lat, pt.lng]);
                  setActivePointId(pt.id);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition shadow-sm ${
                  activePointId === pt.id
                    ? 'border-red-500 bg-red-50/50 ring-2 ring-red-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-sm">{pt.name}</h3>
                  <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                    {pt.district_name}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{pt.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Режим: <b>{pt.operating_hours}</b></span>
                  </div>
                  {pt.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{pt.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Вместимость: до {pt.capacity} чел.</span>
                  </div>
                </div>

                {pt.description && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
                    {pt.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Интерактивная карта (правая колонка) */}
        <div className="lg:col-span-2 order-1 lg:order-2 h-[450px] lg:h-[600px] rounded-2xl overflow-hidden border border-slate-200 shadow-md">
          <MapContainer
            center={[51.7197, 94.4378]}
            zoom={12}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapFlyTo coords={selectedCoords} />

            {points.map(pt => (
              <Marker
                key={pt.id}
                position={[pt.lat, pt.lng]}
                icon={warmingIcon}
                eventHandlers={{
                  click: () => setActivePointId(pt.id)
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-slate-800">
                    <div className="font-bold text-sm text-red-700">{pt.name}</div>
                    <div className="text-xs text-slate-600">{pt.address}</div>
                    <div className="text-xs font-medium text-emerald-700">🕒 {pt.operating_hours}</div>
                    {pt.phone && <div className="text-xs font-medium">📞 {pt.phone}</div>}
                    <div className="text-[11px] text-slate-500 pt-1 border-t mt-1">
                      {pt.description}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
