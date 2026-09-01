import React, { useState, useMemo } from 'react';
import { PoolModel, Accessory, QuoteOrder, CompanyConfig } from '../types';
import {
  Calculator,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Filter,
  Gift,
  Layers,
  MapPin,
  Minus,
  Percent,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Waves,
  X,
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Logo } from './Logo';

interface AdminQuoteBuilderProps {
  models: PoolModel[];
  accessories: Accessory[];
  config: CompanyConfig;
  onSaveQuote: (newQuote: QuoteOrder) => Promise<QuoteOrder | null>;
  formatCurrency: (val: number) => string;
  onViewQuotesList?: () => void;
}

interface CustomItem {
  id: string;
  name: string;
  price: number;
}

export const AdminQuoteBuilder: React.FC<AdminQuoteBuilderProps> = ({
  models,
  accessories,
  config,
  onSaveQuote,
  formatCurrency,
  onViewQuotesList
}) => {
  // Client Info State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [city, setCity] = useState(config.location || 'Alejandro Roca, Córdoba');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Pool Model Selection
  const [selectedModelId, setSelectedModelId] = useState<string>(models[0]?.id || '');
  const [customModelPrice, setCustomModelPrice] = useState<string>('');
  const [modelSearch, setModelSearch] = useState('');
  const [modelLineFilter, setModelLineFilter] = useState<'all' | 'clasica' | 'solarium' | 'mini'>('all');

  // Accessories Selection (Quantity map: accessoryId -> quantity)
  const [selectedAccQuantities, setSelectedAccQuantities] = useState<Record<string, number>>({});
  const [accCategoryFilter, setAccCategoryFilter] = useState<string>('all');
  const [accSearch, setAccSearch] = useState('');

  // Custom Items / Services (e.g. Flete especial, Excavación rocosa)
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomPrice, setNewCustomPrice] = useState('');

  // Commercial adjustments
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Efectivo / Contado Especial');
  const [validityDays, setValidityDays] = useState<number>(15);
  const [includeGiftPromo, setIncludeGiftPromo] = useState<boolean>(true);
  const [includeInstallation, setIncludeInstallation] = useState<boolean>(true);

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [savedQuoteData, setSavedQuoteData] = useState<QuoteOrder | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Filtered Models
  const filteredModels = useMemo(() => {
    return models.filter(m => {
      const matchesSearch =
        m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
        m.code.toLowerCase().includes(modelSearch.toLowerCase()) ||
        `${m.length}x${m.width}`.includes(modelSearch.toLowerCase());
      const matchesLine = modelLineFilter === 'all' || m.line === modelLineFilter;
      return matchesSearch && matchesLine;
    });
  }, [models, modelSearch, modelLineFilter]);

  // Filtered Accessories
  const filteredAccessories = useMemo(() => {
    return accessories.filter(a => {
      const matchesSearch =
        a.name.toLowerCase().includes(accSearch.toLowerCase()) ||
        (a.description || '').toLowerCase().includes(accSearch.toLowerCase());
      const matchesCategory = accCategoryFilter === 'all' || a.category === accCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [accessories, accSearch, accCategoryFilter]);

  // Selected Model Object
  const selectedModel = useMemo(() => {
    return models.find(m => m.id === selectedModelId) || null;
  }, [models, selectedModelId]);

  // Base Pool Price (allows admin override if specified)
  const effectiveModelPrice = useMemo(() => {
    if (!selectedModel) return 0;
    if (customModelPrice && !isNaN(Number(customModelPrice)) && Number(customModelPrice) >= 0) {
      return Number(customModelPrice);
    }
    return selectedModel.price || 0;
  }, [selectedModel, customModelPrice]);

  // Selected Accessories List with calculated items
  const selectedAccessoriesList = useMemo(() => {
    const list: { accessory: Accessory; quantity: number; subtotal: number }[] = [];
    Object.entries(selectedAccQuantities).forEach(([accId, qtyVal]) => {
      const qty = typeof qtyVal === 'number' ? qtyVal : Number(qtyVal) || 0;
      if (qty > 0) {
        const acc = accessories.find(a => a.id === accId);
        if (acc) {
          list.push({
            accessory: acc,
            quantity: qty,
            subtotal: (acc.price || 0) * qty
          });
        }
      }
    });
    return list;
  }, [accessories, selectedAccQuantities]);

  const accessoriesTotal = useMemo(() => {
    return selectedAccessoriesList.reduce((sum, item) => sum + item.subtotal, 0);
  }, [selectedAccessoriesList]);

  const customItemsTotal = useMemo(() => {
    return customItems.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [customItems]);

  const rawSubtotal = useMemo(() => {
    return effectiveModelPrice + accessoriesTotal + customItemsTotal;
  }, [effectiveModelPrice, accessoriesTotal, customItemsTotal]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return Math.round((rawSubtotal * Math.min(100, Math.max(0, discountValue))) / 100);
    }
    if (discountType === 'fixed') {
      return Math.min(rawSubtotal, Math.max(0, discountValue));
    }
    return 0;
  }, [discountType, discountValue, rawSubtotal]);

  const finalTotal = useMemo(() => {
    return Math.max(0, rawSubtotal - discountAmount);
  }, [rawSubtotal, discountAmount]);

  // Accessory quantity handlers
  const handleSetAccQuantity = (accId: string, delta: number) => {
    setSelectedAccQuantities(prev => {
      const current = prev[accId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[accId];
        return copy;
      }
      return { ...prev, [accId]: next };
    });
  };

  const handleToggleAcc = (accId: string) => {
    setSelectedAccQuantities(prev => {
      if (prev[accId]) {
        const copy = { ...prev };
        delete copy[accId];
        return copy;
      }
      return { ...prev, [accId]: 1 };
    });
  };

  // Custom Items Handlers
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomName.trim() || isNaN(Number(newCustomPrice)) || Number(newCustomPrice) <= 0) return;
    const item: CustomItem = {
      id: 'custom-' + Date.now(),
      name: newCustomName.trim(),
      price: Number(newCustomPrice)
    };
    setCustomItems([...customItems, item]);
    setNewCustomName('');
    setNewCustomPrice('');
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems(customItems.filter(i => i.id !== id));
  };

  // Robust Argentine & International phone number formatter for WhatsApp
  const formatWhatsAppPhone = (phone: string): string => {
    let clean = phone.replace(/\D/g, '');
    if (!clean) return '';
    // If already starts with 549 (Argentine mobile international), return
    if (clean.startsWith('549')) return clean;
    // If starts with 54 but not 9 (e.g. 54358...)
    if (clean.startsWith('54') && clean.length >= 11) {
      if (clean[2] !== '9') {
        return '549' + clean.slice(2);
      }
      return clean;
    }
    // If starts with 0 (e.g. 0358...)
    if (clean.startsWith('0')) {
      clean = clean.slice(1);
    }
    // Remove 15 if present in 10-11 digit local mobile number format (e.g., 358 15 4852924)
    // In Argentina area codes are 2, 3, or 4 digits followed by 15 + local number
    if (clean.includes('15') && clean.length >= 11 && !clean.startsWith('54')) {
      clean = clean.replace('15', '');
    }
    // Standard 10-digit Argentine numbers (area code + number)
    if (clean.length === 10) {
      return '549' + clean;
    }
    // If not starting with 54, add 549 by default for Argentina
    if (!clean.startsWith('54') && clean.length >= 8) {
      return '549' + clean;
    }
    return clean;
  };

  // Generate clean WhatsApp message
  const generateWhatsAppMessage = (quoteId?: string) => {
    const qCode = quoteId || savedQuoteData?.id || `COT-${Math.floor(1000 + Math.random() * 9000)}`;
    const dateStr = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    let message = `*PRESUPUESTO OFICIAL - PISCINAS BRUZZONE* 🏊✨\n`;
    message += `─────────────────────────\n`;
    message += `📋 *Presupuesto N°:* #${qCode}\n`;
    message += `📅 *Fecha de Emisión:* ${dateStr}\n`;
    message += `👤 *Cliente:* ${clientName.trim() || 'Estimado/a Cliente'}\n`;
    if (city) message += `📍 *Localidad:* ${city}\n`;
    if (clientAddress) message += `🏡 *Domicilio / Obra:* ${clientAddress}\n`;
    message += `─────────────────────────\n\n`;

    if (selectedModel) {
      message += `🏊 *PISCINA DE FIBRA DE VIDRIO:*\n`;
      message += `• *Modelo:* ${selectedModel.name} (${selectedModel.code})\n`;
      message += `• *Dimensiones:* ${selectedModel.length}m largo x ${selectedModel.width}m ancho x ${selectedModel.depth}m prof.\n`;
      message += `• *Capacidad:* ${selectedModel.capacity.toLocaleString('es-AR')} Litros\n`;
      message += `• *Línea de Diseño:* ${selectedModel.line === 'mini' ? 'Mini Piscina / Hidromasaje' : selectedModel.line === 'solarium' ? 'Solárium Húmedo / Playa incorporada' : 'Clásica Rectangular'}\n`;
      if (selectedModel.description) {
        message += `• *Detalle:* ${selectedModel.description}\n`;
      }
      if (selectedModel.includes && selectedModel.includes.length > 0) {
        message += `• *Equipamiento de Serie Incluido:* ${selectedModel.includes.join(', ')}\n`;
      }
      if (includeInstallation) {
        message += `• *Modalidad:* Llave en mano (Casco reforzado + Equipo de filtrado Vulcano + Losetas perimetrales atérmicas + Excavación e Instalación).\n`;
      }
      message += `• *Importe Base:* ${formatCurrency(effectiveModelPrice)}\n\n`;
    }

    if (selectedAccessoriesList.length > 0) {
      message += `✨ *ACCESORIOS Y EQUIPAMIENTO ADICIONAL:* \n`;
      selectedAccessoriesList.forEach(item => {
        message += `• ${item.quantity}x ${item.accessory.name}: ${formatCurrency(item.subtotal)}\n`;
      });
      message += `\n`;
    }

    if (customItems.length > 0) {
      message += `🛠️ *SERVICIOS / ÍTEMS ADICIONALES:*\n`;
      customItems.forEach(item => {
        message += `• ${item.name}: ${formatCurrency(item.price)}\n`;
      });
      message += `\n`;
    }

    if (includeGiftPromo) {
      message += `🎁 *PROMOCIÓN EXCLUSIVA BONIFICADA:*\n`;
      message += `• *¡1° Limpieza Profunda y Puesta a Punto del Agua 100% DE REGALO!*\n\n`;
    }

    message += `─────────────────────────\n`;
    message += `💰 *DESGLOSE ECONÓMICO:*\n`;
    message += `• Subtotal de la Obra: ${formatCurrency(rawSubtotal)}\n`;
    if (discountAmount > 0) {
      message += `• Bonificación Comercial: -${formatCurrency(discountAmount)} ${discountType === 'percent' ? `(${discountValue}%)` : ''}\n`;
    }
    message += `• *TOTAL FINAL PRESUPUESTADO:* *${formatCurrency(finalTotal)}*\n\n`;

    message += `💳 *Forma de Pago:* ${paymentMethod}\n`;
    message += `🛡️ *Garantía:* ${config.warrantyYears || 10} Años de Garantía Escrita de Fábrica\n`;
    message += `⏱️ *Validez de la Oferta:* ${validityDays} Días corridos\n`;

    if (notes) {
      message += `\n📝 *Observaciones:* ${notes}\n`;
    }

    message += `\n─────────────────────────\n`;
    message += `*PISCINAS BRUZZONE* — _Fábrica e Instalación Directa_\n`;
    message += `📞 WhatsApp de Atención: ${config.phone || '+54 9 358 485-2924'}\n`;
    message += `📍 Alejandro Roca y cobertura en toda la provincia de Córdoba.\n`;
    message += `_¡Quedamos a tu entera disposición para visitar el terreno y comenzar con tu proyecto!_`;

    return message;
  };

  // Copy to clipboard handler
  const handleCopyToClipboard = async () => {
    try {
      const text = generateWhatsAppMessage();
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch (e) {
      alert('Presupuesto copiado al portapapeles.');
    }
  };

  // Open WhatsApp Web/App directly with client number and message
  const handleSendWhatsApp = async () => {
    // 1. If not yet saved to database, automatically save it first
    let currentQuote = savedQuoteData;
    if (!currentQuote && clientName.trim()) {
      currentQuote = await handleSaveQuoteToSystem();
    }

    // 2. Format phone
    const formattedPhone = formatWhatsAppPhone(clientPhone);
    const text = encodeURIComponent(generateWhatsAppMessage(currentQuote?.id));
    
    if (!formattedPhone) {
      const proceed = confirm('No se ingresó un número de teléfono para el cliente. ¿Deseas abrir WhatsApp para seleccionar el destinatario manualmente?');
      if (!proceed) return;
      window.open(`https://wa.me/?text=${text}`, '_blank');
      return;
    }

    const url = `https://wa.me/${formattedPhone}?text=${text}`;
    window.open(url, '_blank');
  };

  // Save Quote to Database / Firestore
  const handleSaveQuoteToSystem = async () => {
    if (!clientName.trim()) {
      alert('Por favor ingrese el nombre del cliente para registrar la cotización.');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg('');
    try {
      const quoteId = `COT-${Math.floor(1000 + Math.random() * 9000)}`;
      const accessoriesNames: string[] = [];
      const accessoriesDetails: { id: string; name: string; price: number; quantity?: number }[] = [];

      selectedAccessoriesList.forEach(item => {
        accessoriesNames.push(`${item.quantity}x ${item.accessory.name}`);
        accessoriesDetails.push({
          id: item.accessory.id,
          name: item.accessory.name,
          price: item.accessory.price,
          quantity: item.quantity
        });
      });

      customItems.forEach(item => {
        accessoriesNames.push(`[Servicio] ${item.name}`);
        accessoriesDetails.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        });
      });

      const newQuote: QuoteOrder = {
        id: quoteId,
        createdAt: new Date().toISOString(),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || 'Sin teléfono',
        clientAddress: clientAddress.trim(),
        city: city.trim(),
        poolModelCode: selectedModel ? selectedModel.code : 'ACC-ONLY',
        poolModelName: selectedModel ? selectedModel.name : 'Solo Accesorios y Servicios',
        poolModelPrice: effectiveModelPrice,
        accessoriesSelected: accessoriesNames,
        accessoriesDetails: accessoriesDetails,
        discountAmount: discountAmount,
        discountPercent: discountType === 'percent' ? discountValue : undefined,
        paymentMethod: paymentMethod,
        totalPrice: finalTotal,
        notes: notes.trim(),
        status: 'presupuestado'
      };

      const saved = await onSaveQuote(newQuote);
      setSavedQuoteData(saved || newQuote);
      setSaveSuccessMsg(`¡Cotización #${quoteId} guardada y sincronizada con éxito en el sistema!`);
    } catch (err) {
      console.error('Error saving quote from builder:', err);
      alert('Hubo un inconveniente al guardar la cotización.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset Form
  const handleResetForm = () => {
    if (confirm('¿Desea limpiar el formulario para comenzar un nuevo presupuesto?')) {
      setClientName('');
      setClientPhone('');
      setClientAddress('');
      setNotes('');
      setSelectedAccQuantities({});
      setCustomItems([]);
      setDiscountType('none');
      setDiscountValue(0);
      setSavedQuoteData(null);
      setSaveSuccessMsg('');
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-sky-950/40 to-slate-950 p-5 rounded-2xl border border-sky-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-inner">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">Presupuestador Profesional de Piscinas</h2>
              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Ventas Admin
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Armá presupuestos al instante seleccionando modelos, accesorios y adicionales con cálculo en tiempo real y envío por WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {onViewQuotesList && (
            <button
              type="button"
              onClick={onViewQuotesList}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-4 h-4 text-sky-400" />
              <span>Ver Pedidos ({models.length} modelos)</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleResetForm}
            className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 px-3 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
            title="Limpiar campos"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Steps vs Right Live Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: BUILDER STEPS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: CLIENT DETAILS */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 text-sky-400 border-b border-slate-800/80 pb-3">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center font-black text-xs">1</div>
              <User className="w-4 h-4" />
              <h3 className="font-bold text-sm text-white">Datos del Cliente & Obra</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcelo Gómez"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="text"
                  placeholder="Ej: 3584123456 (o con 549)"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Localidad / Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej: Alejandro Roca, Río Cuarto, La Carlota"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Dirección / Barrio (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: B° Los Nogales, Lote 14"
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: POOL MODEL SELECTION */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5 text-sky-400">
                <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center font-black text-xs">2</div>
                <Waves className="w-4 h-4" />
                <h3 className="font-bold text-sm text-white">Seleccionar Modelo de Piscina</h3>
              </div>

              {/* Line Filter & Search */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex flex-wrap bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModelLineFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                      modelLineFilter === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelLineFilter('clasica')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                      modelLineFilter === 'clasica' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Clásicas
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelLineFilter('solarium')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                      modelLineFilter === 'solarium' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Solárium
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelLineFilter('mini')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-colors ${
                      modelLineFilter === 'mini' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mini Piscinas
                  </button>
                </div>

                <div className="relative flex-1 sm:w-36">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar modelo..."
                    value={modelSearch}
                    onChange={e => setModelSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Models Visual Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1 no-scrollbar">
              {filteredModels.map(m => {
                const isSelected = selectedModelId === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedModelId(m.id);
                      setCustomModelPrice('');
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2.5 relative group ${
                      isSelected
                        ? 'bg-sky-950/40 border-sky-500 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 bg-sky-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                        <Check className="w-3 h-3" /> Seleccionado
                      </span>
                    )}

                    <div className="flex gap-3 items-center">
                      <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-700/80 shrink-0 flex items-center justify-center p-1 overflow-hidden">
                        <img
                          src={m.imageUrl}
                          alt={m.name}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full w-auto h-auto object-contain object-center drop-shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-white text-xs truncate">{m.name}</span>
                          <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded border border-sky-500/20">
                            {m.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          📏 {m.length}m x {m.width}m ({m.depth}m prof.)
                        </div>
                        <div className="text-[10px] font-semibold mt-0.5">
                          {m.line === 'mini' ? (
                            <span className="text-violet-300">🛁 Mini Piscina • {m.capacity.toLocaleString('es-AR')} L</span>
                          ) : m.line === 'solarium' ? (
                            <span className="text-amber-300">☀️ Línea Solárium • {m.capacity.toLocaleString('es-AR')} L</span>
                          ) : (
                            <span className="text-cyan-400">🏊 Línea Clásica • {m.capacity.toLocaleString('es-AR')} L</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400 font-medium">Precio Base Lista:</span>
                      <span className="font-black text-emerald-400 text-xs">{formatCurrency(m.price)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Model Price Override & Details Preview */}
            {selectedModel && (
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white text-sm block">Piscina Seleccionada: {selectedModel.name} ({selectedModel.code})</span>
                    <span className="text-[10px] text-slate-400">¿Deseas ajustar el precio base del casco para esta cotización?</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-slate-400 text-xs font-bold">$</span>
                    <input
                      type="number"
                      placeholder={selectedModel.price.toString()}
                      value={customModelPrice}
                      onChange={e => setCustomModelPrice(e.target.value)}
                      className="w-36 p-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-bold text-xs outline-none"
                    />
                    {customModelPrice && (
                      <button
                        type="button"
                        onClick={() => setCustomModelPrice('')}
                        className="text-slate-500 hover:text-rose-400 text-[10px] underline"
                      >
                        Restablecer
                      </button>
                    )}
                  </div>
                </div>

                {/* Model Description and Inclusions */}
                {(selectedModel.description || (selectedModel.includes && selectedModel.includes.length > 0)) && (
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px]">
                    {selectedModel.description && (
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70">
                        <span className="text-slate-400 font-bold block mb-0.5 text-[10px] uppercase tracking-wide">📝 Descripción del Modelo:</span>
                        <p className="text-slate-300 italic">{selectedModel.description}</p>
                      </div>
                    )}
                    {selectedModel.includes && selectedModel.includes.length > 0 && (
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70">
                        <span className="text-sky-400 font-bold block mb-1 text-[10px] uppercase tracking-wide">✨ Adicionales / Equipamiento de Serie:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedModel.includes.map((inc, i) => (
                            <span key={i} className="bg-sky-950/50 text-sky-200 border border-sky-800/40 px-1.5 py-0.5 rounded text-[10px]">
                              ✓ {inc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: ACCESSORIES & ADDITIONAL UPGRADES */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5 text-sky-400">
                <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center font-black text-xs">3</div>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Accesorios y Equipamiento Adicional</h3>
              </div>

              {/* Category Filter & Search */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={accCategoryFilter}
                  onChange={e => setAccCategoryFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl text-[11px] p-1.5 font-bold outline-none"
                >
                  <option value="all">Todas las Categorías</option>
                  <option value="luces">💡 Luces LED & RGB</option>
                  <option value="cascadas">🌊 Cascadas Inoxidables</option>
                  <option value="climatizacion">🔥 Climatización</option>
                  <option value="cobertores">🛡️ Cobertores y Mantas</option>
                  <option value="seguridad">🔒 Cercos y Seguridad</option>
                  <option value="mantenimiento">🤖 Robots & Limpiafondos</option>
                  <option value="quimicos">🧪 Químicos & Cloro</option>
                </select>

                <div className="relative flex-1 sm:w-32">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={accSearch}
                    onChange={e => setAccSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Accessories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1 no-scrollbar">
              {filteredAccessories.map(acc => {
                const qty = selectedAccQuantities[acc.id] || 0;
                const isSelected = qty > 0;
                return (
                  <div
                    key={acc.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={acc.imageUrl}
                        alt={acc.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white text-xs truncate">{acc.name}</div>
                        <div className="text-[11px] text-amber-400 font-extrabold">{formatCurrency(acc.price)}</div>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSetAccQuantity(acc.id, -1)}
                        disabled={qty <= 0}
                        className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-black text-xs text-white">{qty}</span>
                      <button
                        type="button"
                        onClick={() => handleSetAccQuantity(acc.id, 1)}
                        className="w-6 h-6 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center shadow"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Extra Items Form (Fletes, excavación especial, etc) */}
            <div className="mt-4 pt-3.5 border-t border-slate-800 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-300 block">➕ Agregar Servicio / Ítem a Medida (Fletes, Tableros, etc.):</span>
              <form onSubmit={handleAddCustomItem} className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="text"
                  placeholder="Descripción (ej: Flete bonificado a 50km)"
                  value={newCustomName}
                  onChange={e => setNewCustomName(e.target.value)}
                  className="flex-1 w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="number"
                    placeholder="Monto ($)"
                    value={newCustomPrice}
                    onChange={e => setNewCustomPrice(e.target.value)}
                    className="w-28 p-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </form>

              {/* Custom Items List */}
              {customItems.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {customItems.map(item => (
                    <div key={item.id} className="bg-slate-900/90 p-2 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium">🛠️ {item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">{formatCurrency(item.price)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomItem(item.id)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* STEP 4: COMMERCIAL ADJUSTMENTS & NOTES */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 text-sky-400 border-b border-slate-800/80 pb-3">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center font-black text-xs">4</div>
              <CreditCard className="w-4 h-4" />
              <h3 className="font-bold text-sm text-white">Condiciones Comerciales, Ajustes & Garantía</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Discount / Adjustment */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Bonificación / Descuento</label>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-white rounded-xl text-xs p-2 font-bold outline-none"
                  >
                    <option value="none">Sin Descuento</option>
                    <option value="percent">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>

                  {discountType !== 'none' && (
                    <input
                      type="number"
                      placeholder={discountType === 'percent' ? '5%' : '$100000'}
                      value={discountValue || ''}
                      onChange={e => setDiscountValue(Number(e.target.value))}
                      className="w-28 p-2 rounded-xl bg-slate-900 border border-slate-700 text-rose-400 font-bold text-xs outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Condición / Forma de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl text-xs p-2 font-bold outline-none"
                >
                  <option value="Efectivo / Contado Especial">💵 Efectivo / Contado Especial</option>
                  <option value="Transferencia Bancaria">🏦 Transferencia Bancaria</option>
                  <option value="50% Anticipo + Saldo contra entrega">🤝 50% Anticipo + Saldo a la entrega</option>
                  <option value="Plan Financiado / Tarjetas Ahora">💳 Plan Financiado / Tarjetas Ahora</option>
                  <option value="Cheques Propios 0-30-60 días">📝 Cheques Propios (0-30-60)</option>
                  <option value="A convenir en visita técnica">🤝 A convenir en visita técnica</option>
                </select>
              </div>

              {/* Validity Days */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Validez del Presupuesto</label>
                <select
                  value={validityDays}
                  onChange={e => setValidityDays(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl text-xs p-2 font-bold outline-none"
                >
                  <option value={7}>7 Días corridos</option>
                  <option value={15}>15 Días corridos (Recomendado)</option>
                  <option value={30}>30 Días corridos</option>
                </select>
              </div>

              {/* Gift Clean Promo Checkbox */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl cursor-pointer hover:bg-emerald-500/20 transition-colors">
                  <input
                    type="checkbox"
                    checked={includeGiftPromo}
                    onChange={e => setIncludeGiftPromo(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span className="font-bold text-emerald-300 text-xs flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" /> ¡Incluir 1° Limpieza Bonificada de Regalo!
                  </span>
                </label>
              </div>
            </div>

            {/* Notes / Special remarks */}
            <div>
              <label className="text-slate-300 font-bold block mb-1">Observaciones para el Presupuesto (Opcional)</label>
              <textarea
                rows={2}
                placeholder="Ej: Terreno nivelado listo para excavar. Incluye flete bonificado hasta 40km."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE QUOTE SUMMARY & ACTIONS (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-950 p-5 rounded-3xl border-2 border-sky-500/40 sticky top-4 shadow-2xl space-y-5">
            {/* Summary Header */}
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest block">Resumen en Tiempo Real</span>
                <h3 className="text-base font-black text-white">Presupuesto Final</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">{new Date().toLocaleDateString('es-AR')}</span>
                <span className="text-xs font-bold text-emerald-400">Piscinas Bruzzone</span>
              </div>
            </div>

            {/* Client Pill */}
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Cliente:</span>
                <span className="font-extrabold text-white">{clientName || 'Sin asignar'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">WhatsApp:</span>
                <span className="font-bold text-emerald-400">{clientPhone || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Destino:</span>
                <span className="text-slate-300">{city}</span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 no-scrollbar text-xs">
              {/* Pool Model Item */}
              {selectedModel && (
                <div className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div>
                    <span className="font-bold text-white block">🏊 {selectedModel.name}</span>
                    <span className="text-[10px] text-slate-400">{selectedModel.code} • {selectedModel.length}x{selectedModel.width}m ({selectedModel.depth}m)</span>
                  </div>
                  <span className="font-black text-white">{formatCurrency(effectiveModelPrice)}</span>
                </div>
              )}

              {/* Selected Accessories */}
              {selectedAccessoriesList.map(item => (
                <div key={item.accessory.id} className="flex items-start justify-between gap-2 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50 text-[11px]">
                  <div>
                    <span className="text-slate-200 font-medium">✨ {item.quantity}x {item.accessory.name}</span>
                    <span className="text-[10px] text-slate-500 block">Unit: {formatCurrency(item.accessory.price)}</span>
                  </div>
                  <span className="font-bold text-amber-300">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}

              {/* Custom Extra Items */}
              {customItems.map(item => (
                <div key={item.id} className="flex items-start justify-between gap-2 p-2 rounded-xl bg-slate-900/40 border border-slate-800/50 text-[11px]">
                  <span className="text-slate-300 font-medium">🛠️ {item.name}</span>
                  <span className="font-bold text-cyan-300">{formatCurrency(item.price)}</span>
                </div>
              ))}

              {/* Gift Promo Pill */}
              {includeGiftPromo && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-300 flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-emerald-400" /> 1° Limpieza Bonificada
                  </span>
                  <span className="uppercase text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-black">
                    GRATIS
                  </span>
                </div>
              )}
            </div>

            {/* Subtotal & Discount Math */}
            <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Subtotal Bruto:</span>
                <span className="font-bold text-slate-200">{formatCurrency(rawSubtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-rose-400 font-bold">
                  <span>Bonificación / Descuento:</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              {/* TOTAL HERO BOX */}
              <div className="bg-gradient-to-r from-sky-900/60 to-emerald-950/60 p-4 rounded-2xl border border-sky-500/40 mt-2 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 block">Total Final Cotizado (ARS)</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                  {formatCurrency(finalTotal)}
                </div>
                <div className="text-[10px] text-slate-300 flex items-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>{config.warrantyYears || 10} Años de Garantía • {paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Success Message Banner */}
            {saveSuccessMsg && (
              <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl font-bold text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="space-y-2 pt-2">
              {/* Save Button */}
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveQuoteToSystem}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/30 transition-all disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>{isSaving ? 'Guardando en la Nube...' : '💾 Guardar y Registrar Cotización'}</span>
              </button>

              {/* WhatsApp Button */}
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>📲 Enviar Presupuesto por WhatsApp</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>

                {/* Print Formal Sheet Button */}
                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ficha PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINTABLE / FORMAL QUOTE MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-slate-200">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Header with Logo */}
            <div className="flex items-start justify-between border-b-2 border-sky-600 pb-4">
              <div>
                <h2 className="text-2xl font-black text-sky-900 tracking-tight">PISCINAS BRUZZONE</h2>
                <p className="text-xs text-slate-500 font-medium">Fabricación, Venta e Instalación de Piscinas de Fibra de Vidrio</p>
                <p className="text-xs text-slate-500">📍 Alejandro Roca y Región • 📞 {config.phone || '3584852924'}</p>
              </div>
              <div className="text-right">
                <span className="bg-sky-100 text-sky-800 text-xs font-black px-3 py-1 rounded-full uppercase">
                  Presupuesto Oficial
                </span>
                <p className="text-xs text-slate-400 mt-1 font-mono">#{savedQuoteData?.id || 'COT-OFICIAL'}</p>
                <p className="text-xs text-slate-500 font-bold">{new Date().toLocaleDateString('es-AR')}</p>
              </div>
            </div>

            {/* Client Info Section */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 font-bold block">Cliente:</span>
                <span className="font-black text-slate-900 text-sm">{clientName || 'Cliente Particular'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Teléfono:</span>
                <span className="font-bold text-slate-900">{clientPhone || 'No especificado'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Localidad:</span>
                <span className="font-medium text-slate-800">{city}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Dirección de Obra:</span>
                <span className="font-medium text-slate-800">{clientAddress || 'A coordinar'}</span>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="space-y-2 text-xs">
              <h4 className="font-black text-slate-800 text-sm border-b pb-1">Detalle del Equipamiento e Instalación:</h4>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                    <th className="py-1.5">Concepto</th>
                    <th className="py-1.5 text-center">Cant.</th>
                    <th className="py-1.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedModel && (
                    <tr>
                      <td className="py-2 font-bold text-slate-900">
                        Piscina {selectedModel.name} ({selectedModel.length}m x {selectedModel.width}m x {selectedModel.depth}m)
                        <span className="block text-[10px] text-slate-500 font-normal">
                          Incluye casco reforzado, equipo de filtrado Vulcano, losetas perimetrales e instalación.
                        </span>
                      </td>
                      <td className="py-2 text-center font-bold">1</td>
                      <td className="py-2 text-right font-black">{formatCurrency(effectiveModelPrice)}</td>
                    </tr>
                  )}

                  {selectedAccessoriesList.map(item => (
                    <tr key={item.accessory.id}>
                      <td className="py-2 text-slate-800">
                        {item.accessory.name}
                        <span className="block text-[10px] text-slate-500 font-normal">{item.accessory.description}</span>
                      </td>
                      <td className="py-2 text-center font-bold">{item.quantity}</td>
                      <td className="py-2 text-right font-bold text-slate-900">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}

                  {customItems.map(item => (
                    <tr key={item.id}>
                      <td className="py-2 text-slate-800">{item.name}</td>
                      <td className="py-2 text-center font-bold">1</td>
                      <td className="py-2 text-right font-bold text-slate-900">{formatCurrency(item.price)}</td>
                    </tr>
                  ))}

                  {includeGiftPromo && (
                    <tr className="bg-emerald-50">
                      <td className="py-2 font-bold text-emerald-800">
                        🎁 Beneficio: 1° Limpieza Profunda y Puesta a Punto del Agua
                      </td>
                      <td className="py-2 text-center font-bold text-emerald-700">1</td>
                      <td className="py-2 text-right font-black text-emerald-700">BONIFICADO</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Footer Box */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs block">Forma de Pago: {paymentMethod}</span>
                <span className="text-emerald-400 text-xs font-bold">🛡️ {config.warrantyYears || 10} Años de Garantía Escrita</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">TOTAL PRESUPUESTADO</span>
                <span className="text-2xl font-black text-emerald-400">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            {/* Print & Close Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ficha / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar por WhatsApp al Cliente</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="text-slate-500 hover:text-slate-800 font-bold text-xs"
              >
                Cerrar Vista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
