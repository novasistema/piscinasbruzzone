import React, { useState } from 'react';
import { MaintenanceVisit, CompanyConfig } from '../types';
import { Calendar, Clock, Wrench, Send, CheckCircle, Phone, MapPin, Search } from 'lucide-react';

interface MaintenanceSchedulerProps {
  config: CompanyConfig;
  maintenances: MaintenanceVisit[];
  onVisitScheduled?: () => void;
}

export const MaintenanceScheduler: React.FC<MaintenanceSchedulerProps> = ({ config, maintenances }) => {
  const [activeSubTab, setActiveSubTab] = useState<'agendar' | 'mis_visitas'>('agendar');

  // Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [poolType, setPoolType] = useState('Piscinas Bruzzone - Fibra');
  const [serviceType, setServiceType] = useState<'limpieza_completa' | 'control_ph_cloro' | 'service_bomba_filtro' | 'puesta_a_punto_temporada' | 'mantenimiento_mensual'>('limpieza_completa');
  
  // Date selector - default tomorrow
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [scheduledDate, setScheduledDate] = useState(tomorrowStr);
  const [timeSlot, setTimeSlot] = useState<'mañana' | 'tarde'>('mañana');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successVisit, setSuccessVisit] = useState<MaintenanceVisit | null>(null);

  // Search visits
  const [searchPhone, setSearchPhone] = useState('');

  const serviceLabels = {
    limpieza_completa: 'Limpieza Completa & Aspirado de Fondo',
    control_ph_cloro: 'Balance de pH, Cloro & Alguicida',
    service_bomba_filtro: 'Service de Bomba, Filtro Vulcano & Retornos',
    puesta_a_punto_temporada: 'Puesta a Punto Completa de Temporada',
    mantenimiento_mensual: 'Abono Mensual de Mantenimiento'
  };

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !address || !scheduledDate) return;

    setIsSubmitting(true);

    const payload = {
      clientName,
      clientPhone,
      address,
      poolType,
      serviceType,
      scheduledDate,
      timeSlot,
      notes
    };

    try {
      const res = await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.visit) {
        setSuccessVisit(data.visit);
      }
    } catch (err) {
      console.error('Error scheduling maintenance visit:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const myVisits = maintenances.filter(m => {
    if (!searchPhone) return true;
    return m.clientPhone.includes(searchPhone) || m.clientName.toLowerCase().includes(searchPhone.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Confirmado</span>;
      case 'realizado':
        return <span className="bg-sky-100 text-sky-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Realizado</span>;
      case 'cancelado':
        return <span className="bg-rose-100 text-rose-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Cancelado</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">Pendiente de Confirmación</span>;
    }
  };

  return (
    <div className="py-6 px-4 container mx-auto max-w-4xl">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          Agendamiento Automático de <span className="text-sky-600">Mantenimiento</span>
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-lg mx-auto">
          Programá la visita técnica para tu piscina. El sistema registra tu turno automáticamente en el servidor y te confirma la fecha por WhatsApp.
        </p>

        {/* Subtabs */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setActiveSubTab('agendar')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'agendar'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🗓️ Agendar Nueva Visita
          </button>
          <button
            onClick={() => setActiveSubTab('mis_visitas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'mis_visitas'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📋 Consultar Estado de Visitas
          </button>
        </div>
      </div>

      {activeSubTab === 'agendar' ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-8">
          {successVisit ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">¡Visita Registrada con Éxito!</h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Tu solicitud N° <span className="font-bold text-sky-600">{successVisit.id}</span> quedó guardada en el servidor central. Nos pondremos en contacto para la confirmación técnica.
              </p>

              <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl max-w-md mx-auto text-left text-xs space-y-2">
                <div><b>Cliente:</b> {successVisit.clientName}</div>
                <div><b>Fecha Solicitada:</b> {successVisit.scheduledDate} ({successVisit.timeSlot})</div>
                <div><b>Dirección:</b> {successVisit.address}</div>
                <div><b>Servicio:</b> {serviceLabels[successVisit.serviceType]}</div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/${config.whatsappPhone}?text=${encodeURIComponent(
                    `Hola Piscinas Bruzzone! Acabo de solicitar la visita de mantenimiento N° ${successVisit.id} para el ${successVisit.scheduledDate} (${successVisit.timeSlot}) en ${successVisit.address}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-6 py-3 rounded-2xl text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Enviar Confirmación por WhatsApp</span>
                </a>

                <button
                  onClick={() => setSuccessVisit(null)}
                  className="text-xs text-slate-500 font-bold hover:underline"
                >
                  Agendar otra visita
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleScheduleVisit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo del Titular *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ej: Laura D'Angelo"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="Ej: +54 9 11 4433-2211"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Dirección del Domicilio / Barrio Privado *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Ej: Barrio Los Alisos Lote 82, Nordelta, Tigre"
                    className="w-full text-xs p-3 pl-9 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Modelo o Tipo de Piscina</label>
                  <input
                    type="text"
                    value={poolType}
                    onChange={e => setPoolType(e.target.value)}
                    placeholder="Ej: S5000 Solarium / Piscina de fibra"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Servicio Requerido *</label>
                  <select
                    value={serviceType}
                    onChange={e => setServiceType(e.target.value as any)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none font-medium bg-white"
                  >
                    <option value="limpieza_completa">Limpieza Completa & Aspirado de Fondo</option>
                    <option value="control_ph_cloro">Balance de pH, Cloro & Tratamiento Químico</option>
                    <option value="service_bomba_filtro">Service de Bomba, Filtro Vulcano & Retornos</option>
                    <option value="puesta_a_punto_temporada">Puesta a Punto de Temporada</option>
                    <option value="mantenimiento_mensual">Abono Mensual de Mantenimiento</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-sky-600" />
                    <span>Fecha Sugerida para la Visita *</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={tomorrowStr}
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-sky-600" />
                    <span>Turno Preferido</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTimeSlot('mañana')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        timeSlot === 'mañana'
                          ? 'bg-sky-50 border-sky-500 text-sky-700'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Mañana (8:00 - 13:00)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeSlot('tarde')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        timeSlot === 'tarde'
                          ? 'bg-sky-50 border-sky-500 text-sky-700'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Tarde (13:00 - 18:00)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notas o Indicaciones de Acceso</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: Dejar ingreso autorizado en la guardia a nombre de la empresa."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-3.5 rounded-2xl text-sm shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Wrench className="w-4 h-4" />
                <span>{isSubmitting ? 'Guardando turno en servidor...' : 'Agendar Visita de Mantenimiento'}</span>
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Mis Visitas / Tracker tab */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                placeholder="Buscar por teléfono o cliente..."
                className="w-full text-xs p-2.5 pl-9 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            {myVisits.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs font-medium">
                No se encontraron visitas registradas con ese criterio.
              </p>
            ) : (
              myVisits.map(visit => (
                <div key={visit.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-800 text-sm">{visit.clientName}</span>
                      <span className="text-xs text-slate-400">({visit.id})</span>
                      {getStatusBadge(visit.status)}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      📍 {visit.address} | 🏊 {visit.poolType}
                    </p>
                    <p className="text-xs text-sky-700 font-semibold mt-0.5">
                      📅 Fecha: {visit.scheduledDate} (Turno {visit.timeSlot})
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/${config.whatsappPhone}?text=${encodeURIComponent(
                      `Hola Piscinas Bruzzone, quisiera consultar por la visita N° ${visit.id} del ${visit.scheduledDate}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start sm:self-center bg-emerald-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs hover:bg-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
