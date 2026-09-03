import React, { useState } from 'react';
import { Accessory, CompanyConfig } from '../types';
import { Sparkles, ShoppingBag, Send, Tag, Phone, ShieldCheck, Check, MessageCircle } from 'lucide-react';

interface AccessoriesSectionProps {
  accessories: Accessory[];
  config: CompanyConfig;
}

export const AccessoriesSection: React.FC<AccessoriesSectionProps> = ({ accessories, config }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [cart, setCart] = useState<Accessory[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  const isAccConsultPrice = (acc: Accessory) => {
    return Boolean(config?.consultPriceOnly || acc.consultPrice || acc.price <= 0);
  };

  const categories = [
    { id: 'todas', label: 'Todos' },
    { id: 'luces', label: 'Luces LED RGB' },
    { id: 'cobertores', label: 'Cobertores' },
    { id: 'seguridad', label: 'Cercos Seguridad' },
    { id: 'climatizacion', label: 'Climatización' },
    { id: 'cascadas', label: 'Cascadas' },
    { id: 'mantenimiento', label: 'Kits Mantenimiento' },
    { id: 'quimicos', label: 'Químicos Agua' }
  ];

  const filteredAccessories = accessories.filter(a => {
    if (selectedCategory === 'todas') return true;
    return a.category === selectedCategory;
  });

  const handleAddToCart = (acc: Accessory) => {
    if (cart.some(item => item.id === acc.id)) {
      setCart(cart.filter(item => item.id !== acc.id));
    } else {
      setCart([...cart, acc]);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (isAccConsultPrice(item) ? 0 : item.price), 0);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  const handleDirectConsultAccessory = (acc: Accessory) => {
    const msg = `*CONSULTA DE ACCESORIO - PISCINAS BRUZZONE*\n----------------------------------------\nHola Piscinas Bruzzone! Quisiera consultar el precio, disponibilidad y opciones de entrega del producto: *${acc.name}*.\n\nDescripción: ${acc.description || 'Accesorio para piscina'}\n\n¡Muchas gracias!`;
    const waUrl = `https://wa.me/${config.whatsappPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const handleSendAccessoryOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !clientName || !clientPhone) return;

    const chosenNames = cart.map(item => item.name);
    const total = calculateTotal();

    // 1. Save in Server database
    try {
      await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
          poolModelCode: 'ACCESORIOS',
          poolModelName: 'Pedido de Accesorios de Temporada',
          accessoriesSelected: chosenNames,
          totalPrice: total,
          notes: 'Pedido realizado desde la Solapa de Accesorios de Temporada'
        })
      });
    } catch (err) {
      console.error('Error saving accessory order on server:', err);
    }

    // 2. Open WhatsApp link
    let msg = `*PEDIDO DE ACCESORIOS DE TEMPORADA - PISCINAS BRUZZONE*\n`;
    msg += `----------------------------------------\n`;
    msg += `👤 *Cliente:* ${clientName}\n`;
    msg += `📱 *Teléfono:* ${clientPhone}\n`;
    msg += `🛍️ *Productos Seleccionados:*\n`;
    cart.forEach(item => {
      const priceText = isAccConsultPrice(item) ? 'Precio a consultar' : formatCurrency(item.price);
      msg += `  • ${item.name} (${priceText})\n`;
    });
    msg += `----------------------------------------\n`;
    if (total > 0) {
      msg += `💰 *TOTAL ESTIMADO:* ${formatCurrency(total)}\n`;
    } else {
      msg += `💰 *PRECIO:* Solicito cotización por los accesorios seleccionados.\n`;
    }
    msg += `Solicito envío/disponibilidad para retiro. ¡Gracias!`;

    const waUrl = `https://wa.me/${config.whatsappPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    setIsOrderModalOpen(false);
    setCart([]);
    setClientName('');
    setClientPhone('');
  };

  return (
    <div className="py-6 px-4 container mx-auto max-w-6xl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-cyan-900 text-white rounded-3xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black text-[11px] px-3 py-1 rounded-full uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Solapa de Temporada 2026
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Accesorios & Equipamiento de Primavera / Verano
          </h2>
          <p className="text-sky-200 text-xs sm:text-sm mt-2">
            Equipá tu piscina con luces LED RGB recargables, cobertores de protección, cascadas decorativas, cercos de seguridad y kits completos de mantenimiento.
          </p>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-sky-600 text-white shadow-md scale-105'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Cart Quick Drawer Bar if items selected */}
      {cart.length > 0 && (
        <div className="sticky top-20 z-30 bg-slate-900 text-white p-4 rounded-2xl mb-6 shadow-xl flex items-center justify-between border border-sky-500/30">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 p-2 rounded-xl text-white font-bold text-xs">
              {cart.length}
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Mi Selección de Accesorios</span>
              <span className="text-lg font-black text-emerald-400">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs shadow-md flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Encargar por WhatsApp</span>
          </button>
        </div>
      )}

      {/* Accessories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAccessories.map(acc => {
          const inCart = cart.some(item => item.id === acc.id);
          return (
            <div
              key={acc.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col ${
                inCart ? 'border-sky-500 ring-2 ring-sky-500/20 shadow-md' : 'border-slate-200/80 hover:shadow-lg'
              }`}
            >
              <div className="relative h-44 bg-slate-100">
                <img
                  src={acc.imageUrl}
                  alt={acc.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80';
                  }}
                  className="w-full h-full object-cover"
                />
                {acc.badge && (
                  <span className="absolute top-3 left-3 bg-amber-400 text-slate-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-xs">
                    {acc.badge}
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{acc.name}</h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{acc.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      {isAccConsultPrice(acc) ? 'Condición' : 'Precio Oficial'}
                    </span>
                    {isAccConsultPrice(acc) ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                        <MessageCircle className="w-3.5 h-3.5 text-sky-600" />
                        Consultar Precio
                      </span>
                    ) : (
                      <span className="text-lg font-extrabold text-slate-900">{formatCurrency(acc.price)}</span>
                    )}
                  </div>

                  {isAccConsultPrice(acc) ? (
                    <button
                      onClick={() => handleDirectConsultAccessory(acc)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Consultar</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(acc)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        inCart
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-sky-600 hover:bg-sky-700 text-white'
                      }`}
                    >
                      {inCart ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Agregado</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Direct Modal */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              <span>Confirmar Pedido de Accesorios</span>
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Guardaremos tu selección en el servidor y te dirigiremos al WhatsApp oficial para coordinar el retiro o envío.
            </p>

            <form onSubmit={handleSendAccessoryOrder} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Ej: María José"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="Ej: +54 9 11 9988-7766"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl max-h-36 overflow-y-auto space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 block border-b pb-1">Resumen del Carrito ({cart.length}):</span>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-slate-600">
                    <span className="truncate pr-2">• {item.name}</span>
                    <span className="font-bold">{formatCurrency(item.price)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between font-extrabold text-emerald-700 text-sm">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
