import React from 'react';
import { CompanyConfig } from '../types';
import { ShieldCheck, CheckCircle2, AlertTriangle, MapPin, Phone, Mail, Clock, Sparkles, Gift, Waves } from 'lucide-react';

interface CompanyInfoSectionProps {
  config: CompanyConfig;
}

export const CompanyInfoSection: React.FC<CompanyInfoSectionProps> = ({ config }) => {
  return (
    <div className="py-6 px-4 container mx-auto max-w-4xl space-y-6">
      {/* Company Intro & Contact */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center sm:text-left">
          Información Institucional <span className="text-sky-600">{config.companyName}</span>
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm mt-1 text-center sm:text-left">
          {config.tagline}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl">
            <MapPin className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Planta & Showroom</span>
              <span className="text-xs text-slate-600">{config.address}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl">
            <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">WhatsApp Comercial</span>
              <span className="text-xs text-slate-600 font-semibold">{config.whatsappFormatted}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl">
            <Mail className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Correo Electrónico</span>
              <span className="text-xs text-slate-600">{config.email}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl">
            <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">Horario de Atención</span>
              <span className="text-xs text-slate-600">{config.businessHours}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gift First Cleaning Promotional Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-5 sm:p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center gap-4 sm:gap-5 border border-emerald-400/30">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
          <Gift className="w-8 h-8 text-amber-300 animate-bounce" />
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-slate-950 font-black text-[11px] rounded-full uppercase tracking-wider mb-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Beneficio Exclusivo</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
            ¡Te Regalamos la Primera Limpieza!
          </h3>
          <p className="text-emerald-50 text-xs sm:text-sm mt-0.5 max-w-xl">
            Con la compra e instalación de tu piscina, nuestro equipo técnico realiza la <strong className="text-white underline decoration-amber-300 decoration-2">primera limpieza profunda y puesta a punto del agua sin cargo</strong> para que disfrutes desde el primer minuto.
          </p>
        </div>
        <div className="shrink-0">
          <a
            href={`https://wa.me/${config.whatsappPhone}?text=${encodeURIComponent('Hola Piscinas Bruzzone! Quisiera consultar por la promo de la piscina con la primera limpieza de regalo.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md active:scale-95"
          >
            <Waves className="w-4 h-4 text-emerald-600" />
            <span>Aprovechar Promo</span>
          </a>
        </div>
      </div>

      {/* Warranty Banner */}
      <div className="bg-gradient-to-r from-sky-600 to-cyan-600 text-white p-6 rounded-3xl shadow-lg flex items-center gap-4">
        <ShieldCheck className="w-12 h-12 text-cyan-200 shrink-0" />
        <div>
          <h3 className="text-lg font-black">Garantía de Fábrica por {config.warrantyYears} Años</h3>
          <p className="text-sky-100 text-xs mt-1">
            Todos los cascos de fibra de vidrio están respaldados por certificación de resistencia estructural y prueba hidráulica post-instalación.
          </p>
        </div>
      </div>

      {/* Complete Installation Terms & Conditions (Page 10 of PDF) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Incluye */}
        <div className="bg-white rounded-3xl border border-emerald-200 p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2 border-b border-emerald-100 pb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Instalación Completa Incluye</span>
          </h3>
          <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-normal">
            {config.installationTerms}
          </p>
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center gap-2 text-emerald-800 text-xs font-bold mt-2">
            <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>🎁 ¡Incluye primera limpieza y puesta a punto de regalo!</span>
          </div>
        </div>

        {/* No Incluye */}
        <div className="bg-white rounded-3xl border border-rose-200 p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-black text-rose-800 uppercase tracking-wider flex items-center gap-2 border-b border-rose-100 pb-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>No Incluido en el Servicio</span>
          </h3>
          <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed font-normal">
            {config.notIncludedTerms}
          </p>
        </div>
      </div>
    </div>
  );
};
