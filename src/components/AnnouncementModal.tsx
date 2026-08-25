import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, MessageCircle, ExternalLink, Tag, ShieldAlert } from 'lucide-react';
import { AnnouncementPopup } from '../types';

interface AnnouncementModalProps {
  popup?: AnnouncementPopup;
  whatsappPhone?: string;
  isPreview?: boolean;
  onClosePreview?: () => void;
  onNavigateToCatalog?: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  popup,
  whatsappPhone = '5491130005500',
  isPreview = false,
  onClosePreview,
  onNavigateToCatalog
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isPreview) {
      setIsOpen(true);
      return;
    }

    if (!popup || !popup.enabled) {
      setIsOpen(false);
      return;
    }

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('bruone_announcement_dismissed');
    if (!isDismissed) {
      // Small delay for smooth pop in after page load
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [popup, isPreview]);

  const handleClose = () => {
    setIsOpen(false);
    if (isPreview && onClosePreview) {
      onClosePreview();
    } else {
      sessionStorage.setItem('bruone_announcement_dismissed', 'true');
    }
  };

  const handleAction = () => {
    if (!popup) return;

    if (popup.ctaAction === 'whatsapp') {
      const text = encodeURIComponent(`¡Hola! Vengo desde el anuncio de la web: "${popup.title}". Quisiera solicitar información y cotización.`);
      window.open(`https://wa.me/${whatsappPhone}?text=${text}`, '_blank');
    } else if (popup.ctaAction === 'catalog') {
      if (onNavigateToCatalog) {
        onNavigateToCatalog();
      } else {
        const catalogEl = document.getElementById('catalog-section');
        if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
    handleClose();
  };

  if (!isOpen || (!popup && !isPreview)) return null;

  const currentPopup = popup || {
    enabled: true,
    badge: '¡ANUNCIO IMPORTANTE!',
    title: 'Promoción Especial de Temporada',
    message: 'Ingresá tu consulta hoy y obtené bonificaciones exclusivas en instalación y equipamiento Vulcano.',
    imageUrl: 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Consultar por WhatsApp',
    ctaAction: 'whatsapp' as const
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/50 overflow-hidden text-white z-10 my-auto"
        >
          {/* Top Decorative Banner line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600" />

          {/* Close Button */}
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center transition-colors shadow-lg"
            title="Cerrar anuncio"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Preview Badge Indicator if in Admin Preview */}
          {isPreview && (
            <div className="bg-amber-500/20 border-b border-amber-500/30 text-amber-300 text-[11px] font-bold py-1.5 px-4 text-center flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>VISTA PREVIA DEL POP-UP (Modo Administrador)</span>
            </div>
          )}

          {/* Image Header if present */}
          {currentPopup.imageUrl && (
            <div className="relative w-full h-48 sm:h-56 bg-slate-950 overflow-hidden">
              <img
                src={currentPopup.imageUrl}
                alt={currentPopup.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            </div>
          )}

          {/* Modal Body */}
          <div className={`p-6 sm:p-8 space-y-4 ${currentPopup.imageUrl ? '-mt-6 relative z-10' : ''}`}>
            {/* Badge */}
            {currentPopup.badge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-sky-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-black tracking-wide uppercase shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{currentPopup.badge}</span>
              </div>
            )}

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {currentPopup.title}
            </h2>

            {/* Message Body */}
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {currentPopup.message}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {currentPopup.ctaAction !== 'close' && (
                <button
                  type="button"
                  onClick={handleAction}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {currentPopup.ctaAction === 'whatsapp' ? (
                    <>
                      <MessageCircle className="w-5 h-5 text-slate-950 fill-current" />
                      <span>{currentPopup.ctaText || 'Consultar por WhatsApp'}</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-5 h-5" />
                      <span>{currentPopup.ctaText || 'Ver Promoción'}</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                className={`w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm border border-slate-700 transition-colors text-center ${
                  currentPopup.ctaAction === 'close' ? 'w-full' : ''
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
