import React, { useState } from 'react';
import { PoolModel, Accessory, CompanyConfig } from '../types';
import { Send, CheckCircle2, Shield, Droplets, Ruler, Info, Plus, Sparkles, Phone, X, MessageCircle } from 'lucide-react';

interface CatalogSectionProps {
  models: PoolModel[];
  accessories: Accessory[];
  config: CompanyConfig;
  onQuoteSubmitted?: () => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({ models, accessories, config }) => {
  const [lineFilter, setLineFilter] = useState<'todas' | 'clasica' | 'solarium' | 'mini'>('todas');
  const [selectedModel, setSelectedModel] = useState<PoolModel | null>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // Client Quote Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const isModelConsultPrice = (model: PoolModel) => {
    return Boolean(config?.consultPriceOnly || model.consultPrice || model.price <= 0);
  };

  const isAccessoryConsultPrice = (acc: Accessory) => {
    return Boolean(config?.consultPriceOnly || acc.consultPrice || acc.price <= 0);
  };

  const filteredModels = models.filter(m => {
    if (lineFilter === 'todas') return true;
    return m.line === lineFilter;
  });

  const handleOpenModel = (model: PoolModel) => {
    setSelectedModel(model);
    setSelectedAccessories([]);
    setIsModalOpen(true);
  };

  const handleToggleAccessory = (accId: string) => {
    if (selectedAccessories.includes(accId)) {
      setSelectedAccessories(selectedAccessories.filter(id => id !== accId));
    } else {
      setSelectedAccessories([...selectedAccessories, accId]);
    }
  };

  const calculateTotal = () => {
    if (!selectedModel) return 0;
    let accTotal = 0;
    selectedAccessories.forEach(id => {
      const acc = accessories.find(a => a.id === id);
      if (acc && !isAccessoryConsultPrice(acc)) accTotal += acc.price;
    });
    return (isModelConsultPrice(selectedModel) ? 0 : selectedModel.price) + accTotal;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  const handleSendWhatsAppQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel || !clientName || !clientPhone) return;

    setIsSending(true);

    const chosenAccs = selectedAccessories
      .map(id => accessories.find(a => a.id === id)?.name)
      .filter(Boolean);

    const isConsult = isModelConsultPrice(selectedModel);
    const total = calculateTotal();

    // 1. Save quote in backend server DB
    try {
      await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
          city: clientCity,
          poolModelCode: selectedModel.code,
          poolModelName: selectedModel.name,
          accessoriesSelected: chosenAccs,
          totalPrice: isConsult ? 0 : total,
          notes: isConsult ? `[CONSULTAR PRECIO] ${clientNotes || ''}` : clientNotes
        })
      });
    } catch (err) {
      console.error('Error saving quote on server:', err);
    }

    // 2. Format WhatsApp Message
    let msg = `*SOLICITUD DE COTIZACIÓN - PISCINAS BRUZZONE*\n`;
    msg += `----------------------------------------\n`;
    msg += `👤 *Cliente:* ${clientName}\n`;
    msg += `📱 *Teléfono:* ${clientPhone}\n`;
    if (clientCity) msg += `📍 *Ubicación:* ${clientCity}\n`;
    msg += `🏊 *Modelo:* ${selectedModel.name} (${selectedModel.code})\n`;
    msg += `🏷️ *Línea:* ${selectedModel.line === 'mini' ? 'Mini Piscina / Hidromasaje' : selectedModel.line === 'solarium' ? 'Línea Solárium Húmedo' : 'Línea Clásica Rectangular'}\n`;
    msg += `📏 *Medidas:* ${selectedModel.length}m x ${selectedModel.width}m (Prof. ${selectedModel.depth}m)\n`;
    msg += `💧 *Capacidad:* ${selectedModel.capacity.toLocaleString('es-AR')} Litros\n`;
    
    if (chosenAccs.length > 0) {
      msg += `✨ *Accesorios adicionales seleccionados:*\n`;
      chosenAccs.forEach(acc => {
        msg += `  • ${acc}\n`;
      });
    }

    if (isConsult) {
      msg += `💰 *Precio:* Solicito precio actualizado, opciones de pago y disponibilidad de instalación.\n`;
    } else {
      msg += `💰 *Presupuesto Estimado:* ${formatCurrency(total)}\n`;
    }
    
    if (clientNotes) msg += `📝 *Observaciones:* ${clientNotes}\n`;
    msg += `----------------------------------------\n`;
    msg += `Aguardo asesoramiento. ¡Muchas gracias!`;

    const waUrl = `https://wa.me/${config.whatsappPhone}?text=${encodeURIComponent(msg)}`;

    setIsSending(false);
    setSendSuccess(true);

    setTimeout(() => {
      window.open(waUrl, '_blank');
      setIsQuoteModalOpen(false);
      setIsModalOpen(false);
      setSendSuccess(false);
      setClientName('');
      setClientPhone('');
      setClientCity('');
      setClientNotes('');
    }, 1000);
  };

  return (
    <div className="py-6 px-4 container mx-auto max-w-6xl">
      {/* Title & Filters */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          Catálogo Oficial de <span className="text-sky-600">Piscinas BRUZZONE</span>
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-xl mx-auto">
          Modelos de fibra de alta resistencia fabricados con estándares premium. Cotizá en vivo y enviá tu pedido directo por WhatsApp.
        </p>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setLineFilter('todas')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              lineFilter === 'todas'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos los Modelos
          </button>
          <button
            onClick={() => setLineFilter('clasica')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              lineFilter === 'clasica'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Línea Clásica (C)
          </button>
          <button
            onClick={() => setLineFilter('solarium')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              lineFilter === 'solarium'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Línea Solarium (S)
          </button>
          <button
            onClick={() => setLineFilter('mini')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              lineFilter === 'mini'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Mini Piscinas (M)
          </button>
        </div>
      </div>

      {/* Grid of Pool Models */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map(model => (
          <div
            key={model.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all overflow-hidden flex flex-col group relative"
          >
            {/* Image Container with Perfectly Centered and Uncut Pool Photos */}
            <div className="relative h-52 sm:h-60 bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-100/90 border-b border-slate-100 flex items-center justify-center p-3.5 overflow-hidden">
              <img
                src={model.imageUrl}
                alt={model.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80';
                }}
                className="max-h-full max-w-full w-auto h-auto object-contain object-center drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                <span className="bg-slate-900/90 text-cyan-300 font-extrabold text-xs px-2.5 py-1 rounded-md shadow-sm border border-slate-800/60 backdrop-blur-xs">
                  {model.code}
                </span>
                {model.line === 'mini' ? (
                  <span className="bg-violet-600 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-xs">
                    Mini Piscina
                  </span>
                ) : model.line === 'solarium' ? (
                  <span className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded shadow-xs">
                    {model.solariumWidth ? `Solarium ${model.solariumWidth}m` : 'Línea Solarium'}
                  </span>
                ) : (
                  <span className="bg-sky-600 text-white font-bold text-[10px] px-2 py-0.5 rounded shadow-xs">
                    Línea Clásica
                  </span>
                )}
              </div>
              {model.isPopular && (
                <span className="absolute top-3 right-3 bg-rose-500 text-white font-semibold text-[11px] px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-10">
                  <Sparkles className="w-3 h-3 text-amber-200" />
                  Más Elegido
                </span>
              )}
            </div>

            {/* Model Info */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{model.name}</h3>
                <p className="text-slate-500 text-xs mt-1 line-clamp-2">{model.description}</p>

                {/* Technical Specs Grid */}
                <div className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Largo x Ancho</span>
                    <span className="font-bold text-slate-700">{model.length}m x {model.width}m</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Profundidad</span>
                    <span className="font-bold text-slate-700">{model.depth}m</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Capacidad</span>
                    <span className="font-bold text-sky-600">{model.capacity.toLocaleString('es-AR')} L</span>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    {isModelConsultPrice(model) ? 'Cotización' : 'Valor Modelo Base'}
                  </span>
                  {isModelConsultPrice(model) ? (
                    <span className="inline-flex items-center gap-1 text-xs font-black text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                      <MessageCircle className="w-3.5 h-3.5 text-sky-600" />
                      Consultar Precio
                    </span>
                  ) : (
                    <span className="text-lg font-extrabold text-slate-900">{formatCurrency(model.price)}</span>
                  )}
                </div>
                <button
                  onClick={() => handleOpenModel(model)}
                  className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>{isModelConsultPrice(model) ? 'Consultar' : 'Ver Detalle'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Model Details & Custom Quote Modal */}
      {isModalOpen && selectedModel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-100">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full transition-colors z-20 shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Banner Header with Centered Image */}
            <div className="relative h-64 sm:h-72 bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 flex items-center justify-center p-4 overflow-hidden border-b border-slate-800">
              <img
                src={selectedModel.imageUrl}
                alt={selectedModel.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80';
                }}
                className="max-h-full max-w-full w-auto h-auto object-contain object-center drop-shadow-md z-0"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-5 z-10 flex items-end justify-between">
                <div className="text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-sky-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-md inline-block">
                      {selectedModel.code}
                    </span>
                    <span className="bg-slate-800/90 text-cyan-300 text-[11px] font-bold px-2 py-0.5 rounded border border-slate-700">
                      {selectedModel.line === 'mini' ? 'Mini Piscina / Hidromasaje' : selectedModel.line === 'solarium' ? 'Línea Solárium' : 'Línea Clásica'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black">{selectedModel.name}</h3>
                  <p className="text-sky-200 text-xs mt-0.5">{selectedModel.description}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              {/* Technical Specifications */}
              <div>
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                  <Ruler className="w-4 h-4 text-sky-600" />
                  Ficha Técnica de Dimensiones
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-sky-50/60 p-3 rounded-2xl text-center">
                  <div className="bg-white p-2 rounded-xl shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Largo</span>
                    <span className="text-sm font-black text-slate-800">{selectedModel.length} Mts</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Ancho</span>
                    <span className="text-sm font-black text-slate-800">{selectedModel.width} Mts</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Profundidad</span>
                    <span className="text-sm font-black text-slate-800">{selectedModel.depth} Mts</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Capacidad</span>
                    <span className="text-sm font-black text-sky-600">{selectedModel.capacity.toLocaleString('es-AR')} L</span>
                  </div>
                </div>
              </div>

              {/* Includes */}
              {selectedModel.includes && selectedModel.includes.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Equipamiento & Adicionales Incluidos de Serie
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                    {selectedModel.includes.map((inc, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Client Materials Required */}
              {selectedModel.clientMaterials && selectedModel.clientMaterials.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                    <Droplets className="w-4 h-4 text-amber-500" />
                    Materiales Necesarios (A cargo del cliente en obra)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-600 bg-amber-50/50 p-3 rounded-2xl border border-amber-200/60">
                    {selectedModel.clientMaterials.map((mat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span>{mat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Seasonal Accessories to Quote */}
              <div>
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Agregar Accesorios de Temporada a la Cotización
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {accessories.map(acc => {
                    const isSelected = selectedAccessories.includes(acc.id);
                    return (
                      <div
                        key={acc.id}
                        onClick={() => handleToggleAccessory(acc.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50 shadow-2xs font-semibold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-sky-600 focus:ring-sky-500"
                          />
                          <div>
                            <span className="text-slate-800 block font-medium">{acc.name}</span>
                            <span className="text-slate-500 text-[10px]">
                              {isAccessoryConsultPrice(acc) ? 'Consultar precio' : formatCurrency(acc.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Summary & Quote Action */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3 rounded-2xl flex items-center gap-3 text-xs text-emerald-900">
                <span className="text-xl">🎁</span>
                <div>
                  <strong className="block font-black text-emerald-800">¡Beneficio Exclusivo con tu Compra!</strong>
                  <span>Te regalamos la primera limpieza y puesta a punto del agua sin cargo.</span>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-slate-400 text-xs block">
                    {isModelConsultPrice(selectedModel) ? 'Condición Comercial:' : 'Presupuesto Estimado Final:'}
                  </span>
                  {isModelConsultPrice(selectedModel) ? (
                    <span className="text-xl font-black text-sky-400">Precio a Consultar</span>
                  ) : (
                    <span className="text-2xl font-black text-emerald-400">{formatCurrency(calculateTotal())}</span>
                  )}
                  <span className="text-[10px] text-slate-400 block">
                    {isModelConsultPrice(selectedModel) ? 'Asesoramiento personalizado inmediato por WhatsApp' : 'Incluye casco + equipos + accesorios seleccionados'}
                  </span>
                </div>
                <button
                  onClick={() => setIsQuoteModalOpen(true)}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 py-3 rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isModelConsultPrice(selectedModel) ? 'Consultar Precio por WhatsApp' : 'Solicitar Cotización WhatsApp'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Contact Form Modal */}
      {isQuoteModalOpen && selectedModel && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setIsQuoteModalOpen(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              <span>{isModelConsultPrice(selectedModel) ? 'Consultar Precio y Disponibilidad' : 'Enviar Pedido a WhatsApp'}</span>
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              {isModelConsultPrice(selectedModel) 
                ? 'Completá tus datos para que nuestro equipo comercial te envíe el valor oficial y opciones de pago vía WhatsApp.'
                : 'Completá tus datos para que guardemos tu cotización en el servidor y te abra el chat directo de WhatsApp con nuestro equipo comercial.'}
            </p>

            <form onSubmit={handleSendWhatsAppQuote} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp / Teléfono *</label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="Ej: +54 9 11 1234-5678"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Ciudad / Localidad de Instalación</label>
                <input
                  type="text"
                  value={clientCity}
                  onChange={e => setClientCity(e.target.value)}
                  placeholder="Ej: Pilar, Buenos Aires"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Comentarios u Observaciones del terreno</label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={e => setClientNotes(e.target.value)}
                  placeholder="Ej: Terreno natural sin napas. Tengo portón lateral de 2m."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="p-3 bg-sky-50 rounded-xl text-[11px] text-sky-800 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Modelo:</span>
                  <span>{selectedModel.name}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>{isModelConsultPrice(selectedModel) ? 'Precio:' : 'Total Estimado:'}</span>
                  <span>{isModelConsultPrice(selectedModel) ? 'Consultar' : formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSending || sendSuccess}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {sendSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                    <span>¡Guardado! Abriendo WhatsApp...</span>
                  </>
                ) : isSending ? (
                  <span>Procesando...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{isModelConsultPrice(selectedModel) ? 'Consultar Precio por WhatsApp' : 'Confirmar y Enviar por WhatsApp'}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
