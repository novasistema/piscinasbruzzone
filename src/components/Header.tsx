import React from 'react';
import { Logo } from './Logo';
import { CompanyConfig } from '../types';
import { Phone, ShieldCheck, Lock, Sparkles } from 'lucide-react';

interface HeaderProps {
  config: CompanyConfig;
  onOpenAdmin: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ config, onOpenAdmin, activeTab, setActiveTab }) => {
  const whatsappUrl = `https://wa.me/${config.whatsappPhone}?text=${encodeURIComponent('Hola Piscinas Bruzzone! Quisiera más información sobre los modelos de piscinas y cotizaciones.')}`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner Bar in Sleek #0c4a6e with #0e7490 border */}
      <div className="bg-[#0c4a6e] text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-between border-b border-[#0e7490]">
        <div className="container mx-auto flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
            <span className="tracking-tight">Fábrica e Instalación con <b className="text-[#38bdf8]">{config.warrantyYears} años de Garantía</b> Escrita</span>
            <span className="hidden md:inline-block ml-3 px-2 py-0.5 bg-[#0e7490] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
              ONLINE 2026
            </span>
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-slate-200 text-[11px] font-medium">{config.businessHours}</span>
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 bg-[#0e7490] hover:bg-[#075985] px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border border-cyan-400/30 text-white shadow-xs"
              title="Acceso Administrador Maestro"
            >
              <Lock className="w-3 h-3 text-[#38bdf8]" />
              <span>Admin Panel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Nav */}
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('modelos')}>
          <Logo size="md" />
        </div>

        {/* Status Badges & WhatsApp Call to Action */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2">
            <span className="px-3 py-1 bg-green-100 text-green-800 text-[10px] font-bold rounded-full border border-green-200 uppercase tracking-wider">
              ESTADO: FABRICA ACTIVA
            </span>
            <span className="px-3 py-1 bg-blue-100 text-[#075985] text-[10px] font-bold rounded-full border border-blue-200 uppercase tracking-wider">
              PRECIOS ACTUALIZADOS
            </span>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366] hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-all hover:scale-102 active:scale-95"
          >
            <Phone className="w-4 h-4 fill-white" />
            <span className="hidden sm:inline">WhatsApp Venta Directa</span>
            <span className="sm:hidden font-bold">WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Navigation Tabs (Sleek interface navigation) */}
      <nav className="bg-[#f0f4f8] border-t border-slate-200 px-2 py-1.5">
        <div className="container mx-auto flex items-center justify-start sm:justify-center gap-1 overflow-x-auto no-scrollbar text-xs font-semibold">
          <button
            onClick={() => setActiveTab('modelos')}
            className={`py-2 px-4 rounded-md flex items-center gap-2 transition-all whitespace-nowrap text-sm ${
              activeTab === 'modelos' 
                ? 'bg-[#0e7490] text-white shadow-sm font-bold' 
                : 'text-slate-700 hover:bg-[#0e7490]/10 hover:text-[#0c4a6e]'
            }`}
          >
            <span>🏊 Modelos & Cotizador</span>
          </button>

          <button
            onClick={() => setActiveTab('accesorios')}
            className={`py-2 px-4 rounded-md flex items-center gap-2 transition-all whitespace-nowrap text-sm ${
              activeTab === 'accesorios' 
                ? 'bg-[#0e7490] text-white shadow-sm font-bold' 
                : 'text-slate-700 hover:bg-[#0e7490]/10 hover:text-[#0c4a6e]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Accesorios Temporada</span>
          </button>

          <button
            onClick={() => setActiveTab('mantenimiento')}
            className={`py-2 px-4 rounded-md flex items-center gap-2 transition-all whitespace-nowrap text-sm ${
              activeTab === 'mantenimiento' 
                ? 'bg-[#0e7490] text-white shadow-sm font-bold' 
                : 'text-slate-700 hover:bg-[#0e7490]/10 hover:text-[#0c4a6e]'
            }`}
          >
            <span>📅 Agenda de Visitas</span>
          </button>

          <button
            onClick={() => setActiveTab('proyectos')}
            className={`py-2 px-4 rounded-md flex items-center gap-2 transition-all whitespace-nowrap text-sm ${
              activeTab === 'proyectos' 
                ? 'bg-[#0e7490] text-white shadow-sm font-bold' 
                : 'text-slate-700 hover:bg-[#0e7490]/10 hover:text-[#0c4a6e]'
            }`}
          >
            <span>🖼️ Obras & Opiniones</span>
          </button>

          <button
            onClick={() => setActiveTab('empresa')}
            className={`py-2 px-4 rounded-md flex items-center gap-2 transition-all whitespace-nowrap text-sm ${
              activeTab === 'empresa' 
                ? 'bg-[#0e7490] text-white shadow-sm font-bold' 
                : 'text-slate-700 hover:bg-[#0e7490]/10 hover:text-[#0c4a6e]'
            }`}
          >
            <span>🏢 Ajustes & Garantía</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
