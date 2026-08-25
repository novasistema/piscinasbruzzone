import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CatalogSection } from './components/CatalogSection';
import { AccessoriesSection } from './components/AccessoriesSection';
import { MaintenanceScheduler } from './components/MaintenanceScheduler';
import { ProjectsPortfolio } from './components/ProjectsPortfolio';
import { CompanyInfoSection } from './components/CompanyInfoSection';
import { AdminPanel } from './components/AdminPanel';
import { AnnouncementModal } from './components/AnnouncementModal';
import { PoolModel, Accessory, ProjectPhoto, Testimonial, CompanyConfig, MaintenanceVisit } from './types';
import { initialCompanyConfig, initialModels, initialAccessories, initialProjects, initialTestimonials, initialMaintenances } from './initialData';
import { subscribeToCloudData, getCloudData, syncDataToCloud } from './firebase';
import { Phone, Shield, MapPin, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('modelos');
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // App Data from backend REST server with localStorage & default fallbacks
  const [config, setConfig] = useState<CompanyConfig>(() => {
    try {
      const stored = localStorage.getItem('bruone_config');
      return stored ? JSON.parse(stored) : initialCompanyConfig;
    } catch (e) { return initialCompanyConfig; }
  });
  const [models, setModels] = useState<PoolModel[]>(() => {
    try {
      const stored = localStorage.getItem('bruone_models');
      return stored ? JSON.parse(stored) : initialModels;
    } catch (e) { return initialModels; }
  });
  const [accessories, setAccessories] = useState<Accessory[]>(() => {
    try {
      const stored = localStorage.getItem('bruone_accessories');
      return stored ? JSON.parse(stored) : initialAccessories;
    } catch (e) { return initialAccessories; }
  });
  const [projects, setProjects] = useState<ProjectPhoto[]>(() => {
    try {
      const stored = localStorage.getItem('bruone_projects');
      return stored ? JSON.parse(stored) : initialProjects;
    } catch (e) { return initialProjects; }
  });
  const [testimonials, setTestimonials] = useState<Testimonial[]>(() => {
    try {
      const stored = localStorage.getItem('bruone_testimonials');
      return stored ? JSON.parse(stored) : initialTestimonials;
    } catch (e) { return initialTestimonials; }
  });
  const [maintenances, setMaintenances] = useState<MaintenanceVisit[]>(initialMaintenances);

  const fetchAppData = async () => {
    try {
      // 1. Try Cloud Firestore first (ensures cross-device & cloud configuration is never overwritten by defaults)
      const cloudData = await getCloudData().catch(() => null);
      if (cloudData) {
        if (cloudData.config) {
          setConfig(cloudData.config);
          try { localStorage.setItem('bruone_config', JSON.stringify(cloudData.config)); } catch (e) {}
        }
        if (Array.isArray(cloudData.models) && cloudData.models.length > 0) {
          setModels(cloudData.models);
          try { localStorage.setItem('bruone_models', JSON.stringify(cloudData.models)); } catch (e) {}
        }
        if (Array.isArray(cloudData.accessories) && cloudData.accessories.length > 0) {
          setAccessories(cloudData.accessories);
          try { localStorage.setItem('bruone_accessories', JSON.stringify(cloudData.accessories)); } catch (e) {}
        }
        if (Array.isArray(cloudData.projects) && cloudData.projects.length > 0) {
          setProjects(cloudData.projects);
          try { localStorage.setItem('bruone_projects', JSON.stringify(cloudData.projects)); } catch (e) {}
        }
        if (Array.isArray(cloudData.testimonials) && cloudData.testimonials.length > 0) {
          setTestimonials(cloudData.testimonials);
          try { localStorage.setItem('bruone_testimonials', JSON.stringify(cloudData.testimonials)); } catch (e) {}
        }
        if (Array.isArray(cloudData.maintenances)) {
          setMaintenances(cloudData.maintenances);
        }
        return;
      }

      const timestamp = Date.now();
      // Try unified all-data endpoint first for fast atomic sync
      const res = await fetch(`/api/all-data?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
          try { localStorage.setItem('bruone_config', JSON.stringify(data.config)); } catch (e) {}
        }
        if (Array.isArray(data.models)) {
          setModels(data.models);
          try { localStorage.setItem('bruone_models', JSON.stringify(data.models)); } catch (e) {}
        }
        if (Array.isArray(data.accessories)) {
          setAccessories(data.accessories);
          try { localStorage.setItem('bruone_accessories', JSON.stringify(data.accessories)); } catch (e) {}
        }
        if (Array.isArray(data.projects)) {
          setProjects(data.projects);
          try { localStorage.setItem('bruone_projects', JSON.stringify(data.projects)); } catch (e) {}
        }
        if (Array.isArray(data.testimonials)) {
          setTestimonials(data.testimonials);
          try { localStorage.setItem('bruone_testimonials', JSON.stringify(data.testimonials)); } catch (e) {}
        }
        if (Array.isArray(data.maintenances)) {
          setMaintenances(data.maintenances);
        }
        return;
      }

      // Fallback: Individual endpoints if /api/all-data is unavailable
      const [cRes, mRes, aRes, pRes, tRes, mntRes] = await Promise.all([
        fetch(`/api/config?t=${timestamp}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/models?t=${timestamp}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/accessories?t=${timestamp}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/projects?t=${timestamp}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/testimonials?t=${timestamp}`, { cache: 'no-store' }).catch(() => null),
        fetch(`/api/maintenances?t=${timestamp}`, { cache: 'no-store' }).catch(() => null)
      ]);

      if (cRes && cRes.ok) {
        const data = await cRes.json();
        setConfig(data);
        try { localStorage.setItem('bruone_config', JSON.stringify(data)); } catch (e) {}
      }
      if (mRes && mRes.ok) {
        const data = await mRes.json();
        if (Array.isArray(data)) {
          setModels(data);
          try { localStorage.setItem('bruone_models', JSON.stringify(data)); } catch (e) {}
        }
      }
      if (aRes && aRes.ok) {
        const data = await aRes.json();
        if (Array.isArray(data)) {
          setAccessories(data);
          try { localStorage.setItem('bruone_accessories', JSON.stringify(data)); } catch (e) {}
        }
      }
      if (pRes && pRes.ok) {
        const data = await pRes.json();
        if (Array.isArray(data)) {
          setProjects(data);
          try { localStorage.setItem('bruone_projects', JSON.stringify(data)); } catch (e) {}
        }
      }
      if (tRes && tRes.ok) {
        const data = await tRes.json();
        if (Array.isArray(data)) {
          setTestimonials(data);
          try { localStorage.setItem('bruone_testimonials', JSON.stringify(data)); } catch (e) {}
        }
      }
      if (mntRes && mntRes.ok) {
        const data = await mntRes.json();
        if (Array.isArray(data)) setMaintenances(data);
      }
    } catch (err) {
      console.log('Using local data fallback:', err);
    }
  };

  useEffect(() => {
    // 1. Subscribe to Real-Time Cloud Firestore database (instantly syncs Incognito, Vercel, Mobile, Desktops)
    const unsubscribeCloud = subscribeToCloudData((cloudData) => {
      if (cloudData) {
        if (cloudData.config) {
          setConfig(cloudData.config);
          try { localStorage.setItem('bruone_config', JSON.stringify(cloudData.config)); } catch (e) {}
        }
        if (Array.isArray(cloudData.models) && cloudData.models.length > 0) {
          setModels(cloudData.models);
          try { localStorage.setItem('bruone_models', JSON.stringify(cloudData.models)); } catch (e) {}
        }
        if (Array.isArray(cloudData.accessories) && cloudData.accessories.length > 0) {
          setAccessories(cloudData.accessories);
          try { localStorage.setItem('bruone_accessories', JSON.stringify(cloudData.accessories)); } catch (e) {}
        }
        if (Array.isArray(cloudData.projects) && cloudData.projects.length > 0) {
          setProjects(cloudData.projects);
          try { localStorage.setItem('bruone_projects', JSON.stringify(cloudData.projects)); } catch (e) {}
        }
        if (Array.isArray(cloudData.testimonials) && cloudData.testimonials.length > 0) {
          setTestimonials(cloudData.testimonials);
          try { localStorage.setItem('bruone_testimonials', JSON.stringify(cloudData.testimonials)); } catch (e) {}
        }
        if (Array.isArray(cloudData.maintenances)) {
          setMaintenances(cloudData.maintenances);
        }
      }
    });

    // 2. Initial fetch on mount from REST server
    fetchAppData();

    // Auto-polling sync every 6 seconds as dual fallback
    const pollInterval = setInterval(() => {
      fetchAppData();
    }, 6000);

    // Sync immediately when user switches tabs or focuses the window/app
    const handleFocus = () => fetchAppData();
    const handleVisibility = () => {
      if (!document.hidden) fetchAppData();
    };
    const handleOnline = () => fetchAppData();

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribeCloud();
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-800 flex flex-col font-sans antialiased selection:bg-[#0ea5e9] selection:text-white">
      {/* Header Navigation */}
      <Header
        config={config}
        onOpenAdmin={() => setIsAdminOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'modelos' && (
          <CatalogSection
            models={models}
            accessories={accessories}
            config={config}
            onQuoteSubmitted={fetchAppData}
          />
        )}

        {activeTab === 'accesorios' && (
          <AccessoriesSection
            accessories={accessories}
            config={config}
          />
        )}

        {activeTab === 'mantenimiento' && (
          <MaintenanceScheduler
            config={config}
            maintenances={maintenances}
            onVisitScheduled={fetchAppData}
          />
        )}

        {activeTab === 'proyectos' && (
          <ProjectsPortfolio
            projects={projects}
            testimonials={testimonials}
          />
        )}

        {activeTab === 'empresa' && (
          <CompanyInfoSection
            config={config}
          />
        )}
      </main>

      {/* Floating Sticky Mobile WhatsApp Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <a
          href={`https://wa.me/${config.whatsappPhone}?text=${encodeURIComponent('Hola Piscinas Bruzzone! Quisiera consultar por modelos y asesoramiento.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#25D366] hover:bg-emerald-600 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-xs transition-transform hover:scale-105 active:scale-95"
          title="Consulta Inmediata WhatsApp"
        >
          <Phone className="w-5 h-5 fill-white" />
          <span className="hidden sm:inline">¿Dudas? Chateá con nosotros</span>
        </a>
      </div>

      {/* Footer */}
      <footer className="bg-[#0c4a6e] text-slate-200 py-8 px-4 border-t border-[#0e7490] text-xs">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-white font-black text-sm uppercase tracking-wider block">{config.companyName}</span>
            <p className="text-slate-300">{config.tagline}</p>
            <p className="text-slate-400 text-[11px]">{config.address}</p>
          </div>

          <div className="flex items-center gap-4 text-slate-200 font-semibold">
            <button onClick={() => setActiveTab('modelos')} className="hover:text-[#38bdf8] transition-colors">
              Modelos
            </button>
            <button onClick={() => setActiveTab('accesorios')} className="hover:text-[#38bdf8] transition-colors">
              Accesorios
            </button>
            <button onClick={() => setActiveTab('mantenimiento')} className="hover:text-[#38bdf8] transition-colors">
              Visitas
            </button>

            <button onClick={() => setIsAdminOpen(true)} className="text-[#38bdf8] hover:underline font-bold">
              Acceso Admin
            </button>
          </div>

          <div className="text-center sm:text-right text-[11px] text-slate-400">
            © {new Date().getFullYear()} Piscinas Bruzzone. Todos los derechos reservados.
          </div>
        </div>
      </footer>

      {/* Announcement Pop-up for Visitors */}
      <AnnouncementModal
        popup={config.popup}
        whatsappPhone={config.whatsappPhone}
        onNavigateToCatalog={() => setActiveTab('modelos')}
      />

      {/* Admin Panel Modal */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        config={config}
        onRefreshData={fetchAppData}
      />
    </div>
  );
}
