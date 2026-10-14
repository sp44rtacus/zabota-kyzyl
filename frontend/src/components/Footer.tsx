import React from 'react';
import { HeartHandshake, Phone, MapPin, ShieldCheck, Clock, FileCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-municipal-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Колонка 1: О системе */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">АИС «ЗАБОТА»</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Единый муниципальный портал адресной социальной помощи, бытовой поддержки льготных категорий граждан и координации волонтерского движения города Кызыла.
            </p>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Защита персональных данных в соответствии с 152-ФЗ РФ</span>
            </div>
          </div>

          {/* Колонка 2: Контакты ведомства */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Контакты Департамента</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>667000, Республика Тыва, г. Кызыл, ул. Кочетова, д. 29</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Горячая линия: <b>+7 (39422) 2-12-34</b></span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Прием граждан: Пн-Пт 08:30 — 17:30</span>
              </li>
            </ul>
          </div>

          {/* Колонка 3: Экстренные службы Кызыла */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Экстренная помощь (SOS)</h4>
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/60 space-y-2 text-xs">
              <div className="font-bold text-red-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                ЕДДС г. Кызыла (Круглосуточно)
              </div>
              <p className="text-[11px] text-slate-300">
                При авариях отопления, замерзании частных домов, отключении электросетей:
              </p>
              <div className="text-sm font-black text-white">
                Тел: 112 / +7 (39422) 2-31-42
              </div>
            </div>
          </div>

          {/* Колонка 4: Правовая база и муниципальная программа */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Правовая основа</h4>
            <div className="p-3.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300 leading-tight">ФЗ № 135 «О добровольчестве (волонтерстве) в РФ»</span>
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                Муниципальная программа социальной поддержки населения и мотивации волонтеров городского округа «Город Кызыл».
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold pt-1 border-t border-slate-700">
                Официальный реестр волонтерских книжек и льгот
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <div>
            © 2025–2026 Мэрия города Кызыла. Департамент по социальной политике. Все права защищены.
          </div>
          <div className="flex items-center space-x-4 text-[11px]">
            <span>ГОСТ Р 52872-2019</span>
            <span>•</span>
            <span>АИС «Забота» v1.0.0</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Система онлайн</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
