import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link, X, Image as ImageIcon, Check, RefreshCw, Globe, ArrowRight } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helpText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Imagen de Ilustración / Foto',
  helpText = 'Podés subir una foto desde tu computadora o pegar una dirección web de imagen.'
}) => {
  // Auto-detect mode based on current value type or default to 'upload'
  const isDataUrl = value && value.startsWith('data:');
  const isWebUrl = value && (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/'));

  const [mode, setMode] = useState<'upload' | 'url'>(isWebUrl ? 'url' : 'upload');
  const [urlInput, setUrlInput] = useState(isWebUrl ? value : '');
  const [isCompressing, setIsCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync urlInput when external value changes to a web URL
  useEffect(() => {
    if (value && !value.startsWith('data:')) {
      setUrlInput(value);
    } else if (!value) {
      setUrlInput('');
    }
  }, [value]);

  // Helper to convert URLs to direct image URLs
  const sanitizeImageUrl = (raw: string): string => {
    let clean = raw.trim();
    if (!clean) return '';

    // Handle Google Image search redirect URLs
    if (clean.includes('google.com/imgres') || clean.includes('google.com/url')) {
      try {
        const urlObj = new URL(clean);
        const imgUrlParam = urlObj.searchParams.get('imgurl') || urlObj.searchParams.get('url');
        if (imgUrlParam) {
          clean = decodeURIComponent(imgUrlParam);
        }
      } catch (e) {}
    }

    // Handle Google Drive share links
    if (clean.includes('drive.google.com/file/d/')) {
      const match = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }

    // Handle Dropbox share links
    if (clean.includes('dropbox.com')) {
      clean = clean.replace('dl=0', 'raw=1');
    }

    return clean;
  };

  // Compress & resize image client-side via HTML5 Canvas
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor seleccioná un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimension 960px for great quality & fast lightweight storage (~60-120KB)
        const MAX_DIM = 960;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.78 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78);
          onChange(compressedDataUrl);
        } else {
          onChange(e.target?.result as string);
        }
        setIsCompressing(false);
      };

      img.onerror = () => {
        alert('Error al procesar la imagen seleccionada.');
        setIsCompressing(false);
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrlInput(newUrl);
    const cleaned = sanitizeImageUrl(newUrl);
    onChange(cleaned);
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
  };

  return (
    <div className="space-y-2.5">
      {/* Header and Switch Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-200">{label}</label>
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              mode === 'upload'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Mi PC / Celular</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
              mode === 'url'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Enlace URL</span>
          </button>
        </div>
      </div>

      {/* MODE 1: Subir desde PC / Celular (cuando no hay imagen o cuando se quiere cargar una nueva) */}
      {mode === 'upload' && !value && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              dragOver
                ? 'border-cyan-400 bg-cyan-950/40'
                : 'border-slate-700 hover:border-cyan-500 bg-slate-900/70 hover:bg-slate-900'
            }`}
          >
            {isCompressing ? (
              <div className="flex flex-col items-center gap-2 text-cyan-400 py-2">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-xs font-bold">Procesando y optimizando imagen...</span>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-white">Hacé clic para seleccionar una foto de tu PC / Celular</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">o arrastrá la imagen hasta acá (JPG, PNG, WEBP)</p>
                </div>
                <span className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-[11px] px-3.5 py-1.5 rounded-lg mt-1 transition-all shadow">
                  Buscar Archivo...
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: Enlace URL / Dirección Web de la imagen */}
      {mode === 'url' && (
        <div className="space-y-1.5 bg-slate-900/90 p-3 rounded-xl border border-cyan-500/30">
          <label className="block text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pegar dirección web de la imagen (URL):</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="https://ejemplo.com/foto-piscina.jpg"
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full p-2.5 pl-8 pr-8 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none font-mono"
            />
            <Link className="w-4 h-4 text-cyan-400 absolute left-2.5 top-3 pointer-events-none" />
            {urlInput && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-rose-400 transition-colors p-0.5"
                title="Borrar enlace"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-[10px] text-slate-400">
            Podés copiar la dirección de cualquier imagen de internet y pegarla aquí.
          </p>
        </div>
      )}

      {/* Preview Box if image exists */}
      {value && (
        <div className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-52 flex items-center justify-center p-2">
          <img
            src={value}
            alt="Vista previa"
            className="max-h-48 w-auto max-w-full object-contain rounded-lg shadow-md"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-wrap items-center justify-center gap-2 p-2">
            <button
              type="button"
              onClick={() => {
                setMode('upload');
                setTimeout(() => fileInputRef.current?.click(), 50);
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 shadow-md transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Cambiar desde PC</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <Link className="w-3.5 h-3.5" />
              <span>Editar URL</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          </div>
          <div className="absolute top-2 left-2 bg-emerald-500/95 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            <Check className="w-3 h-3" />
            <span>{isDataUrl ? 'Foto Subida (PC)' : 'Enlace Web Activo'}</span>
          </div>
        </div>
      )}

      {/* Hidden file input for "Cambiar Foto" when value exists */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />

      <p className="text-[10px] text-slate-400 italic">{helpText}</p>
    </div>
  );
};
