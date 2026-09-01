import React, { useState, useEffect } from 'react';
import { PoolModel, Accessory, QuoteOrder, MaintenanceVisit, ProjectPhoto, Testimonial, CompanyConfig, MasterUser } from '../types';
import { initialCompanyConfig, initialModels, initialAccessories, initialProjects, initialTestimonials, initialMasterUsers } from '../initialData';
import { syncDataToCloud, getCloudData } from '../firebase';
import { Logo } from './Logo';
import { ImageUploader } from './ImageUploader';
import { AnnouncementModal } from './AnnouncementModal';
import { AdminQuoteBuilder } from './AdminQuoteBuilder';
import { Lock, LogOut, DollarSign, Wrench, Package, Users, Settings, Plus, Trash2, Edit2, CheckCircle2, Phone, Save, Percent, Sparkles, Image, Star, Shield, RefreshCw, X, Megaphone, Eye, Check, Download, UploadCloud, Database, Cloud, KeyRound, CheckCircle, AlertCircle, Calculator, Send } from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: CompanyConfig;
  onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, config, onRefreshData }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginError, setLoginError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'quotes' | 'quote_builder' | 'maintenances' | 'models' | 'accessories' | 'projects' | 'testimonials' | 'settings' | 'master_users' | 'popup' | 'security'>('quotes');
  const [showPopupPreview, setShowPopupPreview] = useState(false);

  // Security / Change Password Form State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [newAdminUsernameInput, setNewAdminUsernameInput] = useState(config?.adminUsername || 'admin');
  const [changePasswordSuccessMsg, setChangePasswordSuccessMsg] = useState('');
  const [changePasswordErrorMsg, setChangePasswordErrorMsg] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showNewPasswordText, setShowNewPasswordText] = useState(false);

  // Data States loaded from REST API with localStorage & initialData fallbacks
  const [quotes, setQuotes] = useState<QuoteOrder[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceVisit[]>([]);
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
  const [masterUsers, setMasterUsers] = useState<MasterUser[]>(() => {
    try {
      const stored = localStorage.getItem('bruone_master_users');
      return stored ? JSON.parse(stored) : initialMasterUsers;
    } catch (e) { return initialMasterUsers; }
  });
  const [companySettings, setCompanySettings] = useState<CompanyConfig>(config || initialCompanyConfig);

  // Mass price increase modal/state
  const [isMassPriceOpen, setIsMassPriceOpen] = useState(false);
  const [massModelPercent, setMassModelPercent] = useState<number>(10);
  const [massAccPercent, setMassAccPercent] = useState<number>(10);

  // Modal forms states
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [editingModel, setEditingModel] = useState<Partial<PoolModel> | null>(null);
  const [newIncludeInput, setNewIncludeInput] = useState('');
  const [newMaterialInput, setNewMaterialInput] = useState('');

  const [isAddingAcc, setIsAddingAcc] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Partial<Accessory> | null>(null);

  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState<Partial<ProjectPhoto>>({ title: '', location: '', poolModel: 'S5000 Solarium', imageUrl: '', description: '' });

  const [isAddingTestimonial, setIsAddingTestimonial] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState<Partial<Testimonial>>({ clientName: '', location: '', poolModel: 'C6000 Clásica', rating: 5, comment: '' });

  const [isAddingMasterUser, setIsAddingMasterUser] = useState(false);
  const [newMasterUser, setNewMasterUser] = useState<Partial<MasterUser>>({ username: '', fullName: '', role: 'Agente Comercial', email: '', phone: '' });
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const backupInputRef = React.useRef<HTMLInputElement>(null);

  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        config: companySettings,
        models,
        accessories,
        projects,
        testimonials,
        quotes,
        maintenances,
        masterUsers,
        exportDate: new Date().toISOString()
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `piscinas-bruzzone-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      window.open('/api/backup/export', '_blank');
    }
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('¿Desea restaurar este archivo de copia de seguridad? Se actualizarán todos los modelos, fotos y configuraciones guardadas.')) {
      e.target.value = '';
      return;
    }

    setIsRestoringBackup(true);
    try {
      const text = await file.text();
      const backupJson = JSON.parse(text);

      // 1. Sync directly to Cloud Firestore (cross-device sync)
      await syncDataToCloud(backupJson);

      // 2. Sync to local backend server
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupJson)
      }).catch(() => null);

      alert('¡Copia de seguridad restaurada y sincronizada con la Nube correctamente! Todos los modelos y fotos se han actualizado.');
      loadAllAdminData();
    } catch (err) {
      console.error('Error parsing backup JSON:', err);
      alert('Error: No se pudo leer el archivo JSON seleccionado.');
    } finally {
      setIsRestoringBackup(false);
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadAllAdminData();
    }
  }, [isOpen, isAuthenticated]);

  const loadAllAdminData = async () => {
    try {
      const timestamp = Date.now();

      // Check Cloud Firestore first for cross-device global sync
      const cloudData = await getCloudData().catch(() => null);
      if (cloudData) {
        if (cloudData.config) {
          setCompanySettings(cloudData.config);
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

      const [allRes, uRes] = await Promise.all([
        fetch(`/api/all-data?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }).catch(() => null),
        fetch(`/api/master-users?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }).catch(() => null)
      ]);

      if (allRes && allRes.ok) {
        const data = await allRes.json();
        if (!cloudData?.config && data.config) {
          setCompanySettings(data.config);
          try { localStorage.setItem('bruone_config', JSON.stringify(data.config)); } catch (e) {}
        }
        if ((!cloudData?.models || cloudData.models.length === 0) && Array.isArray(data.models)) {
          setModels(data.models);
          try { localStorage.setItem('bruone_models', JSON.stringify(data.models)); } catch (e) {}
        }
        if ((!cloudData?.accessories || cloudData.accessories.length === 0) && Array.isArray(data.accessories)) {
          setAccessories(data.accessories);
          try { localStorage.setItem('bruone_accessories', JSON.stringify(data.accessories)); } catch (e) {}
        }
        if ((!cloudData?.projects || cloudData.projects.length === 0) && Array.isArray(data.projects)) {
          setProjects(data.projects);
          try { localStorage.setItem('bruone_projects', JSON.stringify(data.projects)); } catch (e) {}
        }
        if ((!cloudData?.testimonials || cloudData.testimonials.length === 0) && Array.isArray(data.testimonials)) {
          setTestimonials(data.testimonials);
          try { localStorage.setItem('bruone_testimonials', JSON.stringify(data.testimonials)); } catch (e) {}
        }
        if (Array.isArray(data.quotes)) {
          setQuotes(data.quotes);
        }
        if (Array.isArray(data.maintenances) && !cloudData?.maintenances) {
          setMaintenances(data.maintenances);
        }
      }

      if (uRes && uRes.ok) {
        const uData = await uRes.json();
        if (Array.isArray(uData)) {
          setMasterUsers(uData);
          try { localStorage.setItem('bruone_master_users', JSON.stringify(uData)); } catch (e) {}
        }
      }

      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsAuthenticated(true);
          setCurrentUser(data.user);
          loadAllAdminData();
          return;
        } else {
          setLoginError(data.error || 'Credenciales incorrectas');
          return;
        }
      } else {
        const errData = await res.json().catch(() => null);
        if (errData?.error) {
          setLoginError(errData.error);
          return;
        }
        throw new Error('Server status not ok');
      }
    } catch (err) {
      // Cloud Firestore & LocalStorage check
      const cloudData = await getCloudData().catch(() => null);
      const customPassword = cloudData?.config?.adminPassword?.trim() || companySettings.adminPassword?.trim() || localStorage.getItem('bruone_admin_password');
      const customUsername = cloudData?.config?.adminUsername?.trim() || companySettings.adminUsername?.trim() || 'admin';

      if (customPassword) {
        const matchUser = (loginUsername.trim().toLowerCase() === customUsername.toLowerCase() || loginUsername.trim().toLowerCase() === 'admin');
        if (loginPassword === customPassword && matchUser) {
          setIsAuthenticated(true);
          setCurrentUser({
            id: 'admin-master',
            username: customUsername,
            fullName: 'Administrador Maestro Bruzzone',
            role: 'Administrador General'
          });
          loadAllAdminData();
          return;
        } else {
          setLoginError('Contraseña o usuario incorrecto');
          return;
        }
      }

      // Default fallback if no custom password configured yet
      if (loginPassword === 'bruzzone2026' || loginPassword === 'bruone2026' || loginPassword === 'admin') {
        setIsAuthenticated(true);
        setCurrentUser({
          id: 'admin-master',
          username: loginUsername || 'admin',
          fullName: 'Administrador Maestro Bruzzone',
          role: 'Administrador General'
        });
        loadAllAdminData();
      } else {
        setLoginError('Contraseña o usuario incorrecto');
      }
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordErrorMsg('');
    setChangePasswordSuccessMsg('');

    if (!newPasswordInput || newPasswordInput.trim().length < 4) {
      setChangePasswordErrorMsg('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordErrorMsg('Las contraseñas no coinciden. Por favor verifíquelas e intente de nuevo.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const cleanNewPassword = newPasswordInput.trim();
      const cleanAdminUser = (newAdminUsernameInput || 'admin').trim();

      const updatedConfig: CompanyConfig = {
        ...companySettings,
        adminPassword: cleanNewPassword,
        adminUsername: cleanAdminUser
      };

      setCompanySettings(updatedConfig);
      try {
        localStorage.setItem('bruone_config', JSON.stringify(updatedConfig));
        localStorage.setItem('bruone_admin_password', cleanNewPassword);
      } catch (e) {}

      // 1. Save & sync immediately to Cloud Firestore
      await syncDataToCloud({ config: updatedConfig });

      // 2. Save to backend server API
      await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPasswordInput,
          newPassword: cleanNewPassword,
          newUsername: cleanAdminUser
        })
      }).catch(() => null);

      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      }).catch(() => null);

      setChangePasswordSuccessMsg('¡Contraseña y usuario maestro actualizados con éxito en la Nube y en el Servidor! Ahora tu panel está 100% blindado.');
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      loadAllAdminData();
    } catch (err) {
      console.error('Error changing admin password:', err);
      setChangePasswordErrorMsg('Hubo un inconveniente al actualizar la contraseña. Reintente por favor.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSaveQuoteFromBuilder = async (newQuote: QuoteOrder): Promise<QuoteOrder | null> => {
    try {
      const updatedQuotes = [newQuote, ...quotes.filter(q => q.id !== newQuote.id)];
      setQuotes(updatedQuotes);
      try {
        localStorage.setItem('bruone_quotes', JSON.stringify(updatedQuotes));
      } catch (e) {}
      
      // 1. Sync to Cloud Firestore
      await syncDataToCloud({ quotes: updatedQuotes });

      // 2. Post to backend server
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuote)
      }).catch(() => null);

      let finalQuote = newQuote;
      if (res && res.ok) {
        const data = await res.json();
        if (data.quote) {
          finalQuote = data.quote;
        }
      }
      loadAllAdminData();
      return finalQuote;
    } catch (err) {
      console.error('Error saving quote from builder:', err);
      return newQuote;
    }
  };

  const formatWhatsAppPhone = (phone: string): string => {
    let clean = (phone || '').replace(/\D/g, '');
    if (!clean) return '';
    if (clean.startsWith('549')) return clean;
    if (clean.startsWith('54') && clean.length >= 11) {
      if (clean[2] !== '9') return '549' + clean.slice(2);
      return clean;
    }
    if (clean.startsWith('0')) clean = clean.slice(1);
    if (clean.includes('15') && clean.length >= 11 && !clean.startsWith('54')) {
      clean = clean.replace('15', '');
    }
    if (clean.length === 10) return '549' + clean;
    if (!clean.startsWith('54') && clean.length >= 8) return '549' + clean;
    return clean;
  };

  const getQuoteWhatsAppUrl = (q: QuoteOrder): string => {
    const cleanPhone = formatWhatsAppPhone(q.clientPhone);
    const dateStr = new Date(q.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    let msg = `*PRESUPUESTO OFICIAL - PISCINAS BRUZZONE* 🏊✨\n`;
    msg += `─────────────────────────\n`;
    msg += `📋 *Presupuesto N°:* #${q.id}\n`;
    msg += `📅 *Fecha:* ${dateStr}\n`;
    msg += `👤 *Cliente:* ${q.clientName}\n`;
    if (q.city) msg += `📍 *Localidad:* ${q.city}\n`;
    if (q.clientAddress) msg += `🏡 *Domicilio / Obra:* ${q.clientAddress}\n`;
    msg += `─────────────────────────\n\n`;

    msg += `🏊 *PISCINA SELECCIONADA:*\n`;
    msg += `• *Modelo:* ${q.poolModelName} (${q.poolModelCode})\n`;
    if (q.customModelPrice) {
      msg += `• *Precio Base Casco:* ${formatCurrency(q.customModelPrice)}\n`;
    }

    if (q.accessoriesSelected && q.accessoriesSelected.length > 0) {
      msg += `\n✨ *ACCESORIOS Y EQUIPAMIENTO:*\n`;
      q.accessoriesSelected.forEach(acc => {
        msg += `• ${acc}\n`;
      });
    }

    if (q.customItems && q.customItems.length > 0) {
      msg += `\n🛠️ *SERVICIOS / ÍTEMS ADICIONALES:*\n`;
      q.customItems.forEach(item => {
        msg += `• ${item.name}: ${formatCurrency(item.price)}\n`;
      });
    }

    if (q.giftCleanPromo) {
      msg += `\n🎁 *BENEFICIO EXCLUSIVO BONIFICADO:*\n`;
      msg += `• *¡1° Limpieza Profunda y Puesta a Punto del Agua DE REGALO!*\n`;
    }

    msg += `\n─────────────────────────\n`;
    msg += `💰 *TOTAL FINAL PRESUPUESTADO:* *${formatCurrency(q.totalPrice)}*\n\n`;

    if (q.paymentMethod) msg += `💳 *Forma de Pago:* ${q.paymentMethod}\n`;
    msg += `🛡️ *Garantía:* ${companySettings.warrantyYears || 10} Años de Garantía Escrita de Fábrica\n`;
    if (q.validityDays) msg += `⏱️ *Validez de la Oferta:* ${q.validityDays} Días\n`;
    if (q.notes) msg += `\n📝 *Observaciones:* ${q.notes}\n`;

    msg += `\n─────────────────────────\n`;
    msg += `*PISCINAS BRUZZONE* — _Fábrica e Instalación Directa_\n`;
    msg += `📞 WhatsApp de Atención: ${companySettings.phone || '+54 9 358 485-2924'}\n`;
    msg += `📍 Alejandro Roca y cobertura en toda la región.\n`;
    msg += `_¡Quedamos a tu entera disposición para visitar el terreno y coordinar la obra!_`;

    const encoded = encodeURIComponent(msg);
    return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
  };

  const handleUpdateQuoteStatus = async (id: string, status: any) => {
    await fetch(`/api/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadAllAdminData();
  };

  const handleUpdateMaintenanceStatus = async (id: string, status: any, assignedTechnician?: string) => {
    await fetch(`/api/maintenances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, assignedTechnician })
    });
    loadAllAdminData();
  };

  const handleMassPriceUpdate = async () => {
    try {
      await fetch('/api/prices/update-mass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelPercent: Number(massModelPercent),
          accessoryPercent: Number(massAccPercent)
        })
      });
      setIsMassPriceOpen(false);
      loadAllAdminData();
      alert('¡Precios actualizados masivamente con éxito!');
    } catch (err) {
      alert('Error actualizando precios');
    }
  };

  const handleSyncAllToCloud = async () => {
    try {
      const ok = await syncDataToCloud({
        config: companySettings,
        models,
        accessories,
        projects,
        testimonials,
        maintenances,
        masterUsers
      });
      if (ok) {
        alert('¡Catálogo, fotos 3D y precios sincronizados exitosamente con la Nube! Ahora se verán exactamente iguales en cualquier dispositivo, móvil e incógnito.');
      } else {
        alert('Hubo un inconveniente al conectar con la Nube.');
      }
    } catch (e) {
      alert('Error al sincronizar con la nube.');
    }
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel) return;

    const cleanModel: PoolModel = {
      id: editingModel.id || ('mod-' + Date.now()),
      code: (editingModel.code || ('C' + Math.floor(1000 + Math.random() * 8000))).toUpperCase().trim(),
      name: editingModel.name || 'Nuevo Modelo de Piscina',
      line: editingModel.line || 'clasica',
      length: Number(editingModel.length) || 5.0,
      width: Number(editingModel.width) || 3.0,
      depth: Number(editingModel.depth) || 1.4,
      capacity: Number(editingModel.capacity) || Math.round((Number(editingModel.length) || 5) * (Number(editingModel.width) || 3) * (Number(editingModel.depth) || 1.4) * 850),
      solariumWidth: editingModel.solariumWidth ? Number(editingModel.solariumWidth) : undefined,
      costPrice: Number(editingModel.costPrice) || 3000000,
      profitMargin: Number(editingModel.profitMargin) || 40,
      price: Number(editingModel.price) || 4200000,
      imageUrl: editingModel.imageUrl || 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
      description: editingModel.description || 'Piscina de fibra de vidrio de alta resistencia con protección UV y acabado suave.',
      includes: Array.isArray(editingModel.includes) && editingModel.includes.length > 0
        ? editingModel.includes
        : ['Equipo de filtrado VULCANO completo (Bomba + Filtro)', 'Skimmer y retornos orientables', 'Losetas perimetrales atérmicas y antideslizantes'],
      clientMaterials: Array.isArray(editingModel.clientMaterials) && editingModel.clientMaterials.length > 0
        ? editingModel.clientMaterials
        : ['10 bolsas de cemento', '2 bolsas de hercal', '1.5 m³ de arena gruesa', 'Agua para llenado'],
      isPopular: Boolean(editingModel.isPopular),
      warrantyYears: editingModel.warrantyYears ? Number(editingModel.warrantyYears) : 5
    };

    let updatedModels = [...models];
    if (editingModel.id) {
      updatedModels = updatedModels.map(m => m.id === cleanModel.id ? cleanModel : m);
      try {
        await fetch(`/api/models/${cleanModel.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanModel)
        });
      } catch (err) { console.error('API update error:', err); }
    } else {
      updatedModels = [cleanModel, ...updatedModels];
      try {
        await fetch('/api/models', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanModel)
        });
      } catch (err) { console.error('API create error:', err); }
    }

    setModels(updatedModels);
    try { localStorage.setItem('bruone_models', JSON.stringify(updatedModels)); } catch (e) {}
    syncDataToCloud({ models: updatedModels });
    setIsAddingModel(false);
    setEditingModel(null);
    setNewIncludeInput('');
    setNewMaterialInput('');
    loadAllAdminData();
  };

  const handleSaveAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAcc) return;

    let updatedAccs = [...accessories];
    if (editingAcc.id) {
      updatedAccs = updatedAccs.map(a => a.id === editingAcc.id ? { ...a, ...editingAcc } as Accessory : a);
      try {
        await fetch(`/api/accessories/${editingAcc.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editingAcc)
        });
      } catch (err) { console.error('API update error:', err); }
    } else {
      const newA: Accessory = {
        id: 'acc-' + Date.now(),
        name: editingAcc.name || 'Nuevo Accesorio',
        category: editingAcc.category || 'luces',
        costPrice: Number(editingAcc.costPrice) || 100000,
        profitMargin: Number(editingAcc.profitMargin) || 40,
        price: Number(editingAcc.price) || 140000,
        description: editingAcc.description || 'Accesorio para piscina',
        imageUrl: editingAcc.imageUrl || 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80',
        isSeasonal: editingAcc.isSeasonal ?? true
      };
      updatedAccs = [newA, ...updatedAccs];
      try {
        await fetch('/api/accessories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newA)
        });
      } catch (err) { console.error('API create error:', err); }
    }

    setAccessories(updatedAccs);
    try { localStorage.setItem('bruone_accessories', JSON.stringify(updatedAccs)); } catch (e) {}
    syncDataToCloud({ accessories: updatedAccs });
    setIsAddingAcc(false);
    setEditingAcc(null);
    loadAllAdminData();
  };

  const handleSaveCompanyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('bruone_config', JSON.stringify(companySettings));
      syncDataToCloud({ config: companySettings });
      await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companySettings)
      });
    } catch (err) { console.error(err); }
    loadAllAdminData();
    alert('¡Ajustes de empresa guardados con éxito en la Nube y en el Servidor!');
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const newP = { id: 'proj-' + Date.now(), ...newProject } as ProjectPhoto;
    const updated = [newP, ...projects];
    setProjects(updated);
    try { localStorage.setItem('bruone_projects', JSON.stringify(updated)); } catch (e) {}
    syncDataToCloud({ projects: updated });
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      });
    } catch (err) {}
    setIsAddingProject(false);
    setNewProject({ title: '', location: '', poolModel: 'S5000 Solarium', imageUrl: '', description: '' });
    loadAllAdminData();
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    const newT = { id: 'test-' + Date.now(), ...newTestimonial } as Testimonial;
    const updated = [newT, ...testimonials];
    setTestimonials(updated);
    try { localStorage.setItem('bruone_testimonials', JSON.stringify(updated)); } catch (e) {}
    syncDataToCloud({ testimonials: updated });
    try {
      await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTestimonial)
      });
    } catch (err) {}
    setIsAddingTestimonial(false);
    setNewTestimonial({ clientName: '', location: '', poolModel: 'C6000 Clásica', rating: 5, comment: '' });
    loadAllAdminData();
  };

  const handleDeleteModel = async (id: string) => {
    if (!confirm('¿Eliminar este modelo de piscina del catálogo?')) return;
    const updatedModels = models.filter(m => m.id !== id);
    setModels(updatedModels);
    try { localStorage.setItem('bruone_models', JSON.stringify(updatedModels)); } catch (e) {}
    syncDataToCloud({ models: updatedModels });
    try {
      await fetch(`/api/models/${id}`, { method: 'DELETE' });
    } catch (err) {}
    loadAllAdminData();
  };

  const handleDeleteAccessory = async (id: string) => {
    if (!confirm('¿Eliminar este accesorio?')) return;
    const updatedAccs = accessories.filter(a => a.id !== id);
    setAccessories(updatedAccs);
    try { localStorage.setItem('bruone_accessories', JSON.stringify(updatedAccs)); } catch (e) {}
    syncDataToCloud({ accessories: updatedAccs });
    try {
      await fetch(`/api/accessories/${id}`, { method: 'DELETE' });
    } catch (err) {}
    loadAllAdminData();
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('¿Eliminar esta foto de obra de la galería?')) return;
    const updatedProjects = projects.filter(p => p.id !== id);
    setProjects(updatedProjects);
    syncDataToCloud({ projects: updatedProjects });
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    loadAllAdminData();
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('¿Eliminar este testimonio?')) return;
    const updatedTestimonials = testimonials.filter(t => t.id !== id);
    setTestimonials(updatedTestimonials);
    syncDataToCloud({ testimonials: updatedTestimonials });
    await fetch(`/api/testimonials/${id}`, { method: 'DELETE' });
    loadAllAdminData();
  };

  // Calculation handlers for Pool Models
  const handleModelCostChange = (costVal: number) => {
    const cost = Math.max(0, costVal);
    const margin = editingModel?.profitMargin ?? 40;
    const calculatedPrice = cost > 0 ? Math.round(cost * (1 + margin / 100)) : (editingModel?.price || 0);
    setEditingModel(prev => prev ? {
      ...prev,
      costPrice: cost,
      profitMargin: margin,
      price: calculatedPrice
    } : null);
  };

  const handleModelMarginChange = (marginVal: number) => {
    const margin = Math.max(0, marginVal);
    const cost = editingModel?.costPrice || 0;
    const calculatedPrice = cost > 0 ? Math.round(cost * (1 + margin / 100)) : (editingModel?.price || 0);
    setEditingModel(prev => prev ? {
      ...prev,
      profitMargin: margin,
      price: calculatedPrice
    } : null);
  };

  const handleModelSalePriceChange = (priceVal: number) => {
    const price = Math.max(0, priceVal);
    const cost = editingModel?.costPrice || 0;
    let calculatedMargin = editingModel?.profitMargin || 0;
    if (cost > 0) {
      calculatedMargin = Math.round(((price - cost) / cost) * 100);
    }
    setEditingModel(prev => prev ? {
      ...prev,
      price,
      profitMargin: calculatedMargin
    } : null);
  };

  // Calculation handlers for Accessories
  const handleAccCostChange = (costVal: number) => {
    const cost = Math.max(0, costVal);
    const margin = editingAcc?.profitMargin ?? 40;
    const calculatedPrice = cost > 0 ? Math.round(cost * (1 + margin / 100)) : (editingAcc?.price || 0);
    setEditingAcc(prev => prev ? {
      ...prev,
      costPrice: cost,
      profitMargin: margin,
      price: calculatedPrice
    } : null);
  };

  const handleAccMarginChange = (marginVal: number) => {
    const margin = Math.max(0, marginVal);
    const cost = editingAcc?.costPrice || 0;
    const calculatedPrice = cost > 0 ? Math.round(cost * (1 + margin / 100)) : (editingAcc?.price || 0);
    setEditingAcc(prev => prev ? {
      ...prev,
      profitMargin: margin,
      price: calculatedPrice
    } : null);
  };

  const handleAccSalePriceChange = (priceVal: number) => {
    const price = Math.max(0, priceVal);
    const cost = editingAcc?.costPrice || 0;
    let calculatedMargin = editingAcc?.profitMargin || 0;
    if (cost > 0) {
      calculatedMargin = Math.round(((price - cost) / cost) * 100);
    }
    setEditingAcc(prev => prev ? {
      ...prev,
      price,
      profitMargin: calculatedMargin
    } : null);
  };

  const handleSaveMasterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/master-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMasterUser)
    });
    setIsAddingMasterUser(false);
    setNewMasterUser({ username: '', fullName: '', role: 'Agente Comercial', email: '', phone: '' });
    loadAllAdminData();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-slate-800">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" whiteText />
            <span className="bg-sky-500/20 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-sky-500/30">
              Admin Control Panel
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && currentUser && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('quote_builder')}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Crear y armar presupuesto personalizado"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Presupuestar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  title="Cambiar contraseña de administrador"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Cambiar Contraseña</span>
                </button>
                <span className="text-xs text-slate-400 hidden md:inline">
                  👤 {currentUser.fullName} ({currentUser.role})
                </span>
              </>
            )}
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl text-xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {!isAuthenticated ? (
          /* LOGIN SCREEN */
          <div className="p-8 max-w-md mx-auto w-full text-center space-y-6 my-auto">
            <div className="w-16 h-16 bg-sky-500/10 text-sky-400 rounded-3xl flex items-center justify-center mx-auto border border-sky-500/20">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black">Acceso Administrador</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ingrese las credenciales maestras para gestionar pedidos, precios y mantenimientos.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Usuario Maestro</label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full text-xs p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Contraseña *</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
                {!companySettings.adminPassword ? (
                  <span className="text-[10px] text-slate-500 mt-1 block">Clave inicial por defecto: <b>bruzzone2026</b></span>
                ) : (
                  <span className="text-[10px] text-emerald-400 mt-1 block flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Panel protegido con clave personalizada
                  </span>
                )}
              </div>

              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-2.5 rounded-xl font-medium">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-black py-3 rounded-xl text-xs transition-all shadow-lg"
              >
                Ingresar al Panel
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-slate-950 p-3 border-r border-slate-800 flex flex-row md:flex-col gap-1 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setActiveTab('quote_builder')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'quote_builder' ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-1 ring-sky-400' : 'text-emerald-400 hover:bg-slate-900'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Presupuestador Admin</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] px-1.5 py-0.2 rounded font-black ml-auto">
                  NUEVO
                </span>
              </button>

              <button
                onClick={() => setActiveTab('quotes')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'quotes' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span>Pedidos y Cotizaciones ({quotes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('maintenances')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'maintenances' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Visitas Mantenimiento ({maintenances.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('models')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'models' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Modelos de Piscinas</span>
              </button>

              <button
                onClick={() => setActiveTab('accessories')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'accessories' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Accesorios Temporada</span>
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'projects' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>Proyectos y Galería</span>
              </button>

              <button
                onClick={() => setActiveTab('testimonials')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'testimonials' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Testimonios Clientes</span>
              </button>

              <button
                onClick={() => setActiveTab('popup')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'popup' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>Anuncio Pop-up Web</span>
                {companySettings.popup?.enabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-auto" title="Pop-up Activo" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'settings' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Ajustes de Empresa</span>
              </button>

              <button
                onClick={() => setActiveTab('master_users')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'master_users' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Usuarios Maestros</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'security' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Seguridad & Clave Admin</span>
                {companySettings.adminPassword ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ml-auto" title="Contraseña Personalizada Activa" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-auto" title="Se sugiere personalizar contraseña" />
                )}
              </button>

              <div className="mt-auto pt-4 border-t border-slate-900 hidden md:block">
                <button
                  onClick={() => setIsAuthenticated(false)}
                  className="w-full text-left p-2.5 text-xs text-rose-400 hover:bg-rose-950/30 rounded-xl flex items-center gap-2 font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* TAB 0: PRESUPUESTADOR DE VENTAS / COTIZADOR */}
              {activeTab === 'quote_builder' && (
                <AdminQuoteBuilder
                  models={models}
                  accessories={accessories}
                  config={companySettings}
                  onSaveQuote={handleSaveQuoteFromBuilder}
                  formatCurrency={formatCurrency}
                  onViewQuotesList={() => setActiveTab('quotes')}
                />
              )}

              {/* TAB 1: QUOTES / ORDERS */}
              {activeTab === 'quotes' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-lg font-black text-white">Gestión de Pedidos & Cotizaciones</h3>
                      <p className="text-xs text-slate-400">Solicitudes registradas y presupuestos generados.</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setActiveTab('quote_builder')}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Presupuesto</span>
                      </button>
                      <button
                        onClick={() => setIsMassPriceOpen(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5"
                      >
                        <Percent className="w-4 h-4" />
                        <span>Actualización Masiva Precios</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {quotes.map(q => (
                      <div key={q.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-sm">{q.clientName}</span>
                            <span className="text-sky-400 font-mono">({q.id})</span>
                            <span className="text-slate-500">• {new Date(q.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-slate-300">📱 {q.clientPhone} | 📍 {q.city || 'Sin especificar'}</div>
                          <div className="text-cyan-300 font-bold">🏊 {q.poolModelName} ({q.poolModelCode})</div>
                          {q.accessoriesSelected && q.accessoriesSelected.length > 0 && (
                            <div className="text-slate-400">✨ Accesorios: {q.accessoriesSelected.join(', ')}</div>
                          )}
                          <div className="text-emerald-400 font-black text-sm pt-1">Total: {formatCurrency(q.totalPrice)}</div>
                        </div>

                        <div className="flex flex-col gap-2 items-start sm:items-end justify-between">
                          <select
                            value={q.status}
                            onChange={e => handleUpdateQuoteStatus(q.id, e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white rounded-xl text-xs p-2 font-bold"
                          >
                            <option value="pendiente">⏳ Pendiente</option>
                            <option value="contactado">📞 Contactado</option>
                            <option value="presupuestado">📄 Presupuestado</option>
                            <option value="vendido">✅ Vendido</option>
                            <option value="cancelado">❌ Cancelado</option>
                          </select>

                          <a
                            href={getQuoteWhatsAppUrl(q)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                            title="Enviar presupuesto completo por WhatsApp al cliente"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Enviar Presupuesto por WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: MAINTENANCES */}
              {activeTab === 'maintenances' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <h3 className="text-lg font-black text-white">Estados de Visitas de Mantenimiento</h3>
                    <p className="text-xs text-slate-400">Panel de asignación y control de turnos de servicio técnico.</p>
                  </div>

                  <div className="space-y-3">
                    {maintenances.map(m => (
                      <div key={m.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-sm">{m.clientName}</span>
                            <span className="text-sky-400 font-mono">({m.id})</span>
                          </div>
                          <div>📱 {m.clientPhone} | 📍 {m.address}</div>
                          <div className="text-amber-300 font-bold">🛠️ {m.serviceType}</div>
                          <div className="text-sky-300">📅 Fecha: {m.scheduledDate} ({m.timeSlot})</div>
                        </div>

                        <div className="flex flex-col gap-2 items-start sm:items-end justify-between">
                          <select
                            value={m.status}
                            onChange={e => handleUpdateMaintenanceStatus(m.id, e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white rounded-xl text-xs p-2 font-bold"
                          >
                            <option value="pendiente">⏳ Pendiente</option>
                            <option value="confirmado">✅ Confirmado</option>
                            <option value="realizado">🎉 Realizado</option>
                            <option value="cancelado">❌ Cancelado</option>
                          </select>

                          <a
                            href={`https://wa.me/${m.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hola ${m.clientName}, de Piscinas Bruzzone. Confirmamos tu turno de mantenimiento N° ${m.id} para el ${m.scheduledDate}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Contactar Cliente</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: POOL MODELS MANAGEMENT */}
              {activeTab === 'models' && (
                <div className="space-y-4">
                  {/* Hidden Backup File Input */}
                  <input
                    type="file"
                    ref={backupInputRef}
                    onChange={handleFileRestore}
                    accept=".json,application/json"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-lg font-black text-white">Administración de Modelos de Piscinas</h3>
                      <p className="text-xs text-slate-400">Modificar precios, fotos, dimensiones e inclusiones.</p>
                    </div>
                    <div className="flex items-center flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleSyncAllToCloud}
                        title="Subir y sincronizar todos los modelos y fotos actuales a la Nube para que se vean en todos lados"
                        className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-700/60 transition-colors"
                      >
                        <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Sincronizar a la Nube</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportBackup}
                        title="Descargar copia de seguridad con todos los modelos, fotos y configuraciones"
                        className="bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Descargar Respaldo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => backupInputRef.current?.click()}
                        disabled={isRestoringBackup}
                        title="Restaurar copia de seguridad desde un archivo .json"
                        className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isRestoringBackup ? 'Restaurando...' : 'Restaurar Respaldo'}</span>
                      </button>

                      <button
                        onClick={() => {
                          const defaultPrice = 4500000;
                          const defaultMargin = 40;
                          const defaultCost = Math.round(defaultPrice / (1 + defaultMargin / 100));
                          setEditingModel({
                            code: 'C' + Math.floor(1000 + Math.random() * 8000),
                            name: 'Línea Clásica C' + Math.floor(1000 + Math.random() * 8000),
                            line: 'clasica',
                            length: 5.0,
                            width: 3.0,
                            depth: 1.4,
                            capacity: 18000,
                            costPrice: defaultCost,
                            profitMargin: defaultMargin,
                            price: defaultPrice,
                            imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
                            description: 'Piscina de fibra de vidrio de alta resistencia con acabado atérmico y máxima durabilidad.',
                            includes: [
                              'Equipo de filtrado VULCANO completo (Bomba + Filtro)',
                              'Skimmer y retornos orientables',
                              'Losetas perimetrales atérmicas y antideslizantes',
                              'Casilla de fibra reforzada con tapa'
                            ],
                            clientMaterials: [
                              '10 bolsas de cemento',
                              '2 bolsas de hercal',
                              '1.5 m³ de arena gruesa',
                              'Agua para llenado de piscina'
                            ],
                            warrantyYears: 5,
                            isPopular: false
                          });
                          setNewIncludeInput('');
                          setNewMaterialInput('');
                          setIsAddingModel(true);
                        }}
                        className="bg-sky-600 hover:bg-sky-500 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Modelo</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {models.map(m => {
                      const cost = m.costPrice ?? Math.round(m.price / 1.4);
                      const margin = m.profitMargin ?? Math.round(((m.price - cost) / cost) * 100);
                      const netProfit = m.price - cost;

                      return (
                        <div key={m.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between gap-3 text-xs">
                          <div className="flex gap-3 items-start">
                            <div className="w-20 h-20 bg-slate-900/90 rounded-xl border border-slate-800 shrink-0 flex items-center justify-center p-1 overflow-hidden">
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
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="bg-sky-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded text-[10px]">{m.code}</span>
                                {m.line === 'mini' ? (
                                  <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 font-bold px-2 py-0.5 rounded text-[10px]">
                                    Mini Piscina
                                  </span>
                                ) : m.line === 'solarium' ? (
                                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-2 py-0.5 rounded text-[10px]">
                                    Línea Solárium
                                  </span>
                                ) : (
                                  <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold px-2 py-0.5 rounded text-[10px]">
                                    Línea Clásica
                                  </span>
                                )}
                                {m.isPopular && (
                                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold px-1.5 py-0.2 rounded text-[9px]">
                                    ★ Más Elegido
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-white text-sm">{m.name}</h4>
                              <p className="text-slate-400">Medidas: {m.length}m x {m.width}m x {m.depth}m ({m.capacity.toLocaleString()}L)</p>
                              
                              {/* Includes and Details quick chips */}
                              <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[10px]">
                                <span className="text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                                  ✨ {m.includes?.length || 0} adicionales incluidos
                                </span>
                                <span className="text-amber-300 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded">
                                  🛡️ {m.warrantyYears || 5} años garantía
                                </span>
                              </div>

                              <div className="pt-0.5">
                                <p className="text-emerald-400 font-black text-sm">{formatCurrency(m.price)}</p>
                                <p className="text-[10px] text-slate-400">
                                  Costo: {formatCurrency(cost)} • <span className="text-emerald-300 font-bold">Ganancia: +{formatCurrency(netProfit)} ({margin}%)</span>
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditingModel({
                                  ...m,
                                  costPrice: cost,
                                  profitMargin: margin,
                                  includes: m.includes || [],
                                  clientMaterials: m.clientMaterials || []
                                });
                                setNewIncludeInput('');
                                setNewMaterialInput('');
                                setIsAddingModel(true);
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl flex items-center gap-1 text-[11px]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteModel(m.id)}
                              className="bg-rose-950/40 hover:bg-rose-900 text-rose-300 p-2 rounded-xl flex items-center gap-1 text-[11px] border border-rose-800/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Borrar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: ACCESSORIES */}
              {activeTab === 'accessories' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-lg font-black text-white">Gestión de Accesorios de Temporada</h3>
                      <p className="text-xs text-slate-400">Editar catálogo de productos de temporada.</p>
                    </div>
                    <button
                      onClick={() => {
                        const defaultPrice = 150000;
                        const defaultMargin = 40;
                        const defaultCost = Math.round(defaultPrice / (1 + defaultMargin / 100));
                        setEditingAcc({
                          name: 'Nuevo Accesorio',
                          category: 'luces',
                          costPrice: defaultCost,
                          profitMargin: defaultMargin,
                          price: defaultPrice,
                          description: 'Descripción del producto',
                          imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80',
                          isSeasonal: true
                        });
                        setIsAddingAcc(true);
                      }}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Accesorio</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accessories.map(acc => {
                      const cost = acc.costPrice ?? Math.round(acc.price / 1.4);
                      const margin = acc.profitMargin ?? Math.round(((acc.price - cost) / cost) * 100);
                      const netProfit = acc.price - cost;

                      return (
                        <div key={acc.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between gap-3 text-xs">
                          <div className="flex gap-3 items-start">
                            <img
                              src={acc.imageUrl}
                              alt={acc.name}
                              referrerPolicy="no-referrer"
                              className="w-14 h-14 object-cover rounded-xl border border-slate-800 shrink-0 bg-slate-900"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                            <div>
                              <h4 className="font-bold text-white text-sm">{acc.name}</h4>
                              <p className="text-slate-400 text-[11px]">{acc.description}</p>
                              <div className="pt-1">
                                <p className="text-emerald-400 font-black text-sm">{formatCurrency(acc.price)}</p>
                                <p className="text-[10px] text-slate-400">
                                  Costo: {formatCurrency(cost)} • <span className="text-emerald-300 font-bold">Ganancia: +{formatCurrency(netProfit)} ({margin}%)</span>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditingAcc({
                                  ...acc,
                                  costPrice: cost,
                                  profitMargin: margin
                                });
                                setIsAddingAcc(true);
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl h-fit text-[11px] flex items-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleDeleteAccessory(acc.id)}
                              className="bg-rose-950/40 hover:bg-rose-900 text-rose-300 p-2 rounded-xl h-fit text-[11px] flex items-center gap-1 border border-rose-800/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Borrar</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: PROJECTS */}
              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-lg font-black text-white">Galería de Proyectos Realizados</h3>
                      <p className="text-xs text-slate-400">Cargar fotos de obras terminadas para el catálogo.</p>
                    </div>
                    <button
                      onClick={() => setIsAddingProject(true)}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cargar Proyecto</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {projects.map(p => (
                      <div key={p.id} className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden text-xs flex flex-col justify-between">
                        <div>
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80';
                            }}
                            className="h-36 w-full object-cover bg-slate-900"
                          />
                          <div className="p-3">
                            <h4 className="font-bold text-white text-sm">{p.title}</h4>
                            <p className="text-slate-400 text-[11px]">{p.location} • {p.poolModel}</p>
                          </div>
                        </div>
                        <div className="p-3 pt-0 flex justify-end">
                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 font-bold transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar Foto</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: TESTIMONIALS */}
              {activeTab === 'testimonials' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-lg font-black text-white">Testimonios de Clientes</h3>
                      <p className="text-xs text-slate-400">Reseñas y opiniones de familias satisfechas.</p>
                    </div>
                    <button
                      onClick={() => setIsAddingTestimonial(true)}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nuevo Testimonio</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {testimonials.map(t => (
                      <div key={t.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="text-white font-bold text-sm">{t.clientName} ({t.location})</span>
                            <span className="text-amber-400 font-bold">{'★'.repeat(t.rating)}</span>
                          </div>
                          <p className="text-slate-300 italic">"{t.comment}"</p>
                        </div>
                        <button
                          onClick={() => handleDeleteTestimonial(t.id)}
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 p-2 rounded-lg text-[11px] font-bold shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: SETTINGS */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveCompanyConfig} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-lg font-black text-white">Configuración de Empresa y Contacto</h3>
                      <p className="text-xs text-slate-400">Personalizá todos los datos de contacto, teléfonos, redes sociales, garantías y textos legales.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSyncAllToCloud}
                      className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-700/60 transition-colors"
                    >
                      <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sincronizar a la Nube</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Nombre Comercial de la Empresa</label>
                      <input
                        type="text"
                        value={companySettings.companyName || ''}
                        onChange={e => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                        placeholder="Ej: Piscinas Bruzzone"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Eslogan / Frase Destacada</label>
                      <input
                        type="text"
                        value={companySettings.tagline || ''}
                        onChange={e => setCompanySettings({ ...companySettings, tagline: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        placeholder="Ej: Viví el Verano con la Mejor Calidad y Garantía Escrita"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">WhatsApp para Enlaces (Sin '+' ni guiones ni espacios)</label>
                      <input
                        type="text"
                        value={companySettings.whatsappPhone || ''}
                        onChange={e => setCompanySettings({ ...companySettings, whatsappPhone: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                        placeholder="Ej: 5491130005500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">WhatsApp Formato Visible al Público</label>
                      <input
                        type="text"
                        value={companySettings.whatsappFormatted || ''}
                        onChange={e => setCompanySettings({ ...companySettings, whatsappFormatted: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                        placeholder="Ej: +54 9 11 3000-5500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Dirección / Showroom Comercial</label>
                      <input
                        type="text"
                        value={companySettings.address || ''}
                        onChange={e => setCompanySettings({ ...companySettings, address: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        placeholder="Ej: Av. Las Gardenias 2450, Colectora Oeste"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Email Oficial de Contacto</label>
                      <input
                        type="email"
                        value={companySettings.email || ''}
                        onChange={e => setCompanySettings({ ...companySettings, email: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        placeholder="Ej: contacto@piscinasbruzzone.com.ar"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Horarios de Atención</label>
                      <input
                        type="text"
                        value={companySettings.businessHours || ''}
                        onChange={e => setCompanySettings({ ...companySettings, businessHours: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        placeholder="Ej: Lunes a Sábados de 8:00 a 19:00 hs"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Usuario de Instagram</label>
                      <input
                        type="text"
                        value={companySettings.instagram || ''}
                        onChange={e => setCompanySettings({ ...companySettings, instagram: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        placeholder="Ej: @piscinas.bruzzone"
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Años de Garantía Escrita</label>
                      <input
                        type="number"
                        value={companySettings.warrantyYears || 5}
                        onChange={e => setCompanySettings({ ...companySettings, warrantyYears: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        placeholder="Ej: 5 o 10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Términos de Instalación (Lo que INCLUYE el servicio)</label>
                      <textarea
                        rows={5}
                        value={companySettings.installationTerms || ''}
                        onChange={e => setCompanySettings({ ...companySettings, installationTerms: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        placeholder="Detalle los puntos de excavación, nivelación, filtrado..."
                      />
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Materiales y Tareas NO INCLUIDAS (A cargo del cliente)</label>
                      <textarea
                        rows={5}
                        value={companySettings.notIncludedTerms || ''}
                        onChange={e => setCompanySettings({ ...companySettings, notIncludedTerms: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        placeholder="Detalle áridos, agua para llenado, conexión eléctrica..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-6 py-3 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Ajustes en Servidor y Nube</span>
                    </button>
                  </div>

                  {/* Security Shortcut in Settings */}
                  <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-300">
                        <KeyRound className="w-4 h-4" />
                        <h4 className="font-bold text-sm text-white">Seguridad & Contraseña del Administrador</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('security')}
                        className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Ir a Cambiar Contraseña</span>
                      </button>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Cambiá la contraseña maestra para que nadie más pueda ingresar al administrador. La clave se sincroniza en tiempo real en la Nube y protege toda la información de presupuestos, modelos y costos.
                    </p>
                  </div>

                  {/* Backup & Restore Tools Section */}
                  <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <Database className="w-4 h-4" />
                      <h4 className="font-bold text-sm text-white">Copias de Seguridad y Resguardo de Catálogo</h4>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Descargá un archivo de respaldo completo (.json) con todos tus modelos de piscinas, fotos, costos, accesorios y presupuestos guardados para conservarlo en tu computadora o restaurarlo cuando quieras.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleExportBackup}
                        className="bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
                      >
                        <Download className="w-4 h-4 text-cyan-400" />
                        <span>Exportar y Descargar Respaldo JSON</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => backupInputRef.current?.click()}
                        disabled={isRestoringBackup}
                        className="bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <UploadCloud className="w-4 h-4 text-amber-400" />
                        <span>{isRestoringBackup ? 'Restaurando...' : 'Restaurar desde Respaldo JSON'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 8: MASTER USERS */}
              {activeTab === 'master_users' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-lg font-black text-white">Gestión de Usuarios Maestros</h3>
                      <p className="text-xs text-slate-400">Control de operadores y roles administrativos del sistema.</p>
                    </div>
                    <button
                      onClick={() => setIsAddingMasterUser(true)}
                      className="bg-sky-600 hover:bg-sky-500 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nuevo Usuario Maestro</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {masterUsers.map(u => (
                      <div key={u.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-between items-center text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{u.fullName}</span>
                            <span className="bg-sky-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded font-bold">{u.role}</span>
                          </div>
                          <p className="text-slate-400">Usuario: @{u.username} | Email: {u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 9: ANUNCIO POP-UP WEB */}
              {activeTab === 'popup' && (
                <form onSubmit={handleSaveCompanyConfig} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-5 text-xs">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-amber-400" />
                        <h3 className="text-lg font-black text-white">Configuración del Anuncio Pop-up / Publicidad Web</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Creá un aviso flotante emergente con foto y/o texto promocional que verán los clientes al ingresar al sitio.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPopupPreview(true)}
                      className="bg-sky-500/20 hover:bg-sky-500/30 text-cyan-300 border border-sky-500/40 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span>Ver Vista Previa del Pop-up</span>
                    </button>
                  </div>

                  {/* Toggle Activar / Desactivar */}
                  <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-white text-sm block">Estado del Anuncio Emergente</span>
                      <span className="text-slate-400 text-xs">
                        {companySettings.popup?.enabled
                          ? '🟢 El anuncio está ACTIVO y se mostrará a los visitantes al ingresar al sitio.'
                          : '🔴 El anuncio está DESACTIVADO (no se mostrará a los clientes).'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCompanySettings(prev => ({
                        ...prev,
                        popup: {
                          ...prev.popup || {
                            enabled: false,
                            title: 'Promoción Especial',
                            message: 'Texto de oferta...'
                          },
                          enabled: !prev.popup?.enabled
                        }
                      }))}
                      className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-md ${
                        companySettings.popup?.enabled
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                          : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {companySettings.popup?.enabled ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>ACTIVADO</span>
                        </>
                      ) : (
                        <span>DESACTIVADO (Clic para Activar)</span>
                      )}
                    </button>
                  </div>

                  {/* Campos del Anuncio */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Etiqueta / Badge Superior</label>
                        <input
                          type="text"
                          placeholder="Ej: ¡OFERTA DE TEMPORADA!, AVISO IMPORTANTE"
                          value={companySettings.popup?.badge || ''}
                          onChange={e => setCompanySettings(prev => ({
                            ...prev,
                            popup: { ...prev.popup || { enabled: true, title: '', message: '' }, badge: e.target.value }
                          }))}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Título Principal del Anuncio *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: ¡Aprovechá la Promoción Especial de Verano!"
                          value={companySettings.popup?.title || ''}
                          onChange={e => setCompanySettings(prev => ({
                            ...prev,
                            popup: { ...prev.popup || { enabled: true, message: '' }, title: e.target.value }
                          }))}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Mensaje / Texto Informativo *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Escribí aquí los detalles de la oferta, descuento o comunicado importante..."
                        value={companySettings.popup?.message || ''}
                        onChange={e => setCompanySettings(prev => ({
                          ...prev,
                          popup: { ...prev.popup || { enabled: true, title: '' }, message: e.target.value }
                        }))}
                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white leading-relaxed"
                      />
                    </div>

                    {/* Imagen / Foto Publicitaria */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                      <ImageUploader
                        label="Foto / Imagen del Anuncio (Opcional)"
                        helpText="Podés subir un flyer publicitario desde tu computadora o celular, o pegar un enlace web."
                        value={companySettings.popup?.imageUrl || ''}
                        onChange={url => setCompanySettings(prev => ({
                          ...prev,
                          popup: { ...prev.popup || { enabled: true, title: '', message: '' }, imageUrl: url }
                        }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Texto del Botón de Acción (CTA)</label>
                        <input
                          type="text"
                          placeholder="Ej: Consultar por WhatsApp, Ver Ofertas"
                          value={companySettings.popup?.ctaText || ''}
                          onChange={e => setCompanySettings(prev => ({
                            ...prev,
                            popup: { ...prev.popup || { enabled: true, title: '', message: '' }, ctaText: e.target.value }
                          }))}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Acción al Hacer Clic en el Botón</label>
                        <select
                          value={companySettings.popup?.ctaAction || 'whatsapp'}
                          onChange={e => setCompanySettings(prev => ({
                            ...prev,
                            popup: { ...prev.popup || { enabled: true, title: '', message: '' }, ctaAction: e.target.value as any }
                          }))}
                          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium"
                        >
                          <option value="whatsapp">📲 Abrir Chat de WhatsApp directo</option>
                          <option value="catalog">🏊 Ir al Catálogo de Modelos</option>
                          <option value="close">❌ Solo Cerrar el Anuncio</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Anuncio Publicitario</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPopupPreview(true)}
                      className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <Eye className="w-4 h-4 text-cyan-400" />
                      <span>Probar Vista Previa del Pop-up</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 10: SEGURIDAD & CAMBIO DE CONTRASEÑA */}
              {activeTab === 'security' && (
                <div className="space-y-6 text-xs max-w-2xl">
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white">Seguridad & Contraseña del Administrador</h3>
                        <p className="text-xs text-slate-400">
                          Configurá tu clave privada para que nadie ajeno a la empresa pueda ingresar al panel.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Security Status Badge */}
                  <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                    companySettings.adminPassword
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}>
                    {companySettings.adminPassword ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4 className="font-black text-white text-sm">
                        {companySettings.adminPassword
                          ? '🛡️ Panel 100% Protegido y Blindado'
                          : '⚠️ Advertencia: Clave por defecto en uso (bruzzone2026)'}
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-300">
                        {companySettings.adminPassword
                          ? 'Tu contraseña maestra personalizada está activa y sincronizada en la nube Firestore. Sólo vos y tu equipo de confianza conocen la clave de acceso.'
                          : 'El sistema está utilizando la clave inicial genérica. Por motivos de seguridad y privacidad de precios, se recomienda cambiarla a una contraseña exclusiva.'}
                      </p>
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <form onSubmit={handleChangeAdminPassword} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="font-bold text-white text-sm flex items-center gap-2">
                        <Lock className="w-4 h-4 text-cyan-400" />
                        <span>Formulario de Actualización de Clave</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNewPasswordText(!showNewPasswordText)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{showNewPasswordText ? 'Ocultar caracteres' : 'Mostrar texto de contraseña'}</span>
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-slate-300 font-bold block mb-1">Nombre de Usuario Administrador</label>
                        <input
                          type="text"
                          required
                          value={newAdminUsernameInput}
                          onChange={e => setNewAdminUsernameInput(e.target.value)}
                          placeholder="admin"
                          className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">El nombre con el que iniciás sesión en el panel.</span>
                      </div>

                      {companySettings.adminPassword && (
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Contraseña Actual (Para verificar)</label>
                          <input
                            type={showNewPasswordText ? 'text' : 'password'}
                            value={currentPasswordInput}
                            onChange={e => setCurrentPasswordInput(e.target.value)}
                            placeholder="••••••••"
                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-sky-500 outline-none"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Nueva Contraseña Segura *</label>
                          <input
                            type={showNewPasswordText ? 'text' : 'password'}
                            required
                            value={newPasswordInput}
                            onChange={e => setNewPasswordInput(e.target.value)}
                            placeholder="Mínimo 4 caracteres"
                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-slate-300 font-bold block mb-1">Repetir Nueva Contraseña *</label>
                          <input
                            type={showNewPasswordText ? 'text' : 'password'}
                            required
                            value={confirmPasswordInput}
                            onChange={e => setConfirmPasswordInput(e.target.value)}
                            placeholder="Repita la nueva clave"
                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {changePasswordErrorMsg && (
                      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{changePasswordErrorMsg}</span>
                      </div>
                    )}

                    {changePasswordSuccessMsg && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl font-medium flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
                        <span>{changePasswordSuccessMsg}</span>
                      </div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>{isChangingPassword ? 'Guardando en la Nube...' : 'Guardar y Blindar con Nueva Contraseña'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAuthenticated(false)}
                        className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Cerrar Sesión para Probar Nueva Clave</span>
                      </button>
                    </div>
                  </form>

                  {/* Information Box */}
                  <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-slate-400 space-y-2 text-[11px] leading-relaxed">
                    <span className="font-bold text-slate-200 block">ℹ️ ¿Cómo funciona la seguridad de acceso?</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-400">
                      <li>Al cambiar la contraseña, se actualiza automáticamente en Firebase Firestore y en el servidor.</li>
                      <li>Cualquier intento de ingreso desde otro celular o computadora exigirá la nueva contraseña.</li>
                      <li>La clave anterior (incluyendo la clave inicial por defecto) queda automáticamente anulada e inhabilitada.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mass Price Update Modal */}
      {isMassPriceOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-black flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-400" />
              <span>Actualización Masiva de Precios</span>
            </h3>
            <p className="text-xs text-slate-400">
              Aplica un porcentaje de incremento masivo sobre todos los modelos de piscinas y accesorios registrados en la base de datos.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">% Aumento Modelos de Piscinas</label>
              <input
                type="number"
                value={massModelPercent}
                onChange={e => setMassModelPercent(Number(e.target.value))}
                className="w-full text-xs p-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">% Aumento Accesorios de Temporada</label>
              <input
                type="number"
                value={massAccPercent}
                onChange={e => setMassAccPercent(Number(e.target.value))}
                className="w-full text-xs p-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsMassPriceOpen(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleMassPriceUpdate}
                className="w-1/2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 rounded-xl text-xs"
              >
                Aplicar Aumento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Pool Model Modal */}
      {isAddingModel && editingModel && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveModel}
            className="bg-slate-900 border border-slate-700/80 text-white rounded-3xl p-5 sm:p-6 max-w-2xl w-full my-auto shadow-2xl flex flex-col max-h-[92vh] text-xs"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-3.5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {editingModel.id ? 'Editar Modelo de Piscina' : 'Crear Nuevo Modelo de Piscina'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Configurá especificaciones, descripción, adicionales incluidos y materiales de obra.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingModel(false);
                  setEditingModel(null);
                }}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="overflow-y-auto pr-1 sm:pr-2 space-y-4 flex-1 custom-scrollbar">
              
              {/* Sección 1: Identificación y Línea */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-sky-400 font-extrabold text-[11px] uppercase tracking-wider block">
                  1. Identificación y Línea de Producto
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Código del Modelo</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: C5000 / S6000 / M280"
                      value={editingModel.code || ''}
                      onChange={e => setEditingModel({ ...editingModel, code: e.target.value.toUpperCase() })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Línea / Tipo de Piscina</label>
                    <select
                      value={editingModel.line || 'clasica'}
                      onChange={e => setEditingModel({ ...editingModel, line: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="clasica">🏊 Línea Clásica (Rectangular)</option>
                      <option value="solarium">☀️ Línea Solárium (Solárium Húmedo)</option>
                      <option value="mini">🛁 Mini Piscina (Compacta / Spa / Hidro)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Años de Garantía</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      placeholder="Ej: 5 o 10"
                      value={editingModel.warrantyYears ?? 5}
                      onChange={e => setEditingModel({ ...editingModel, warrantyYears: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-bold mb-1">Nombre Comercial de la Piscina</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Piscina Clásica C5000 con Escalera Romana"
                      value={editingModel.name || ''}
                      onChange={e => setEditingModel({ ...editingModel, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      id="modelIsPopular"
                      checked={Boolean(editingModel.isPopular)}
                      onChange={e => setEditingModel({ ...editingModel, isPopular: e.target.checked })}
                      className="w-4 h-4 text-sky-600 bg-slate-800 border-slate-700 rounded focus:ring-sky-500 cursor-pointer"
                    />
                    <label htmlFor="modelIsPopular" className="text-slate-300 font-semibold cursor-pointer select-none text-[11px]">
                      🌟 Destacar como 'Más Elegido'
                    </label>
                  </div>
                </div>
              </div>

              {/* Sección 2: Dimensiones y Capacidad */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sky-400 font-extrabold text-[11px] uppercase tracking-wider">
                    2. Medidas y Capacidad
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const l = Number(editingModel.length) || 5;
                      const w = Number(editingModel.width) || 3;
                      const d = Number(editingModel.depth) || 1.4;
                      const factor = editingModel.line === 'mini' ? 800 : editingModel.line === 'solarium' ? 820 : 850;
                      const calcLitros = Math.round(l * w * d * factor);
                      setEditingModel({ ...editingModel, capacity: calcLitros });
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>⚡ Auto-calcular Capacidad</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Largo (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={editingModel.length ?? ''}
                      onChange={e => setEditingModel({ ...editingModel, length: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Ancho (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={editingModel.width ?? ''}
                      onChange={e => setEditingModel({ ...editingModel, width: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Profundidad (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={editingModel.depth ?? ''}
                      onChange={e => setEditingModel({ ...editingModel, depth: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Capacidad (Litros)</label>
                    <input
                      type="number"
                      step="100"
                      required
                      placeholder="Ej: 18000"
                      value={editingModel.capacity ?? ''}
                      onChange={e => setEditingModel({ ...editingModel, capacity: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-bold text-cyan-400"
                    />
                  </div>
                </div>

                {editingModel.line === 'solarium' && (
                  <div>
                    <label className="block text-slate-400 font-bold mb-1">Ancho del Solárium Húmedo / Playa (m)</label>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="Ej: 1.20"
                      value={editingModel.solariumWidth ?? ''}
                      onChange={e => setEditingModel({ ...editingModel, solariumWidth: Number(e.target.value) })}
                      className="w-full sm:w-1/2 p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-bold text-amber-300"
                    />
                  </div>
                )}
              </div>

              {/* Sección 3: Descripción del Modelo */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-sky-400 font-extrabold text-[11px] uppercase tracking-wider block">
                  3. Descripción Comercial y Detalles
                </span>
                <p className="text-[11px] text-slate-400">
                  Describí las sensaciones, distribución de bancos/escalones, formato o aplicaciones ideales de este modelo.
                </p>
                <textarea
                  rows={3}
                  placeholder="Ej: Piscina de líneas puras y modernas con banco perimetral para relax, ideal para patios familiares y jardines medianos..."
                  value={editingModel.description || ''}
                  onChange={e => setEditingModel({ ...editingModel, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 text-xs"
                />
              </div>

              {/* Sección 4: Equipamiento Incluido & Adicionales de Serie */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sky-400 font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>4. Adicionales y Equipamiento Incluido de Fábrica ({editingModel.includes?.length || 0})</span>
                  </span>
                </div>

                <p className="text-[11px] text-slate-400">
                  Todo lo que el cliente recibe con este modelo (equipamiento de filtrado, losetas, casillas, etc.).
                </p>

                {/* Chips de adicionales agregados */}
                <div className="flex flex-wrap gap-1.5">
                  {editingModel.includes && editingModel.includes.length > 0 ? (
                    editingModel.includes.map((inc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-sky-950/60 border border-sky-600/40 text-sky-200 px-2.5 py-1 rounded-xl text-[11px] font-medium group"
                      >
                        <span>✓ {inc}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newInc = editingModel.includes?.filter((_, i) => i !== idx) || [];
                            setEditingModel({ ...editingModel, includes: newInc });
                          }}
                          className="text-sky-400 hover:text-rose-400 transition-colors ml-1"
                          title="Eliminar este adicional"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">No hay adicionales agregados aún.</span>
                  )}
                </div>

                {/* Input para agregar nuevo adicional */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribí un adicional (ej: Luces LED RGB con control)..."
                    value={newIncludeInput}
                    onChange={e => setNewIncludeInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newIncludeInput.trim()) {
                          const current = editingModel.includes || [];
                          setEditingModel({ ...editingModel, includes: [...current, newIncludeInput.trim()] });
                          setNewIncludeInput('');
                        }
                      }
                    }}
                    className="flex-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newIncludeInput.trim()) {
                        const current = editingModel.includes || [];
                        setEditingModel({ ...editingModel, includes: [...current, newIncludeInput.trim()] });
                        setNewIncludeInput('');
                      }
                    }}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                {/* Sugerencias rápidas con 1 clic */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">⚡ Sugerencias rápidas de fábrica:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Equipo Vulcano Completo (Bomba + Filtro)',
                      'Skimmer y 2 Retornos Orientables',
                      'Losetas Atérmicas y Antideslizantes perimetrales',
                      'Casilla de Fibra Reforzada con Tapa',
                      'Banco de Relax e Hidromasaje',
                      'Solárium Húmedo / Playa Húmeda',
                      'Luces LED RGB con Control Remoto',
                      'Kit de Limpieza Vulcano con Barrefondo',
                      'Garantía Escrita de 5 Años de Fábrica'
                    ].map((sug, sIdx) => {
                      const alreadyHas = editingModel.includes?.includes(sug);
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          disabled={alreadyHas}
                          onClick={() => {
                            const current = editingModel.includes || [];
                            if (!current.includes(sug)) {
                              setEditingModel({ ...editingModel, includes: [...current, sug] });
                            }
                          }}
                          className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                            alreadyHas
                              ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
                              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-sky-500 hover:text-sky-300 hover:bg-sky-950/30'
                          }`}
                        >
                          + {sug}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sección 5: Materiales de Obra a cargo del Cliente */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-sky-400 font-extrabold text-[11px] uppercase tracking-wider block">
                  5. Materiales de Instalación a cargo del Cliente ({editingModel.clientMaterials?.length || 0})
                </span>

                <p className="text-[11px] text-slate-400">
                  Materiales que el cliente debe proveer en obra al momento de la instalación.
                </p>

                {/* Chips de materiales agregados */}
                <div className="flex flex-wrap gap-1.5">
                  {editingModel.clientMaterials && editingModel.clientMaterials.length > 0 ? (
                    editingModel.clientMaterials.map((mat, mIdx) => (
                      <span
                        key={mIdx}
                        className="inline-flex items-center gap-1.5 bg-amber-950/40 border border-amber-600/40 text-amber-200 px-2.5 py-1 rounded-xl text-[11px] font-medium"
                      >
                        <span>📦 {mat}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newMat = editingModel.clientMaterials?.filter((_, i) => i !== mIdx) || [];
                            setEditingModel({ ...editingModel, clientMaterials: newMat });
                          }}
                          className="text-amber-400 hover:text-rose-400 transition-colors ml-1"
                          title="Eliminar este material"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">No hay materiales listados.</span>
                  )}
                </div>

                {/* Input para agregar nuevo material */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Escribí un material (ej: 12 bolsas de cemento)..."
                    value={newMaterialInput}
                    onChange={e => setNewMaterialInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newMaterialInput.trim()) {
                          const current = editingModel.clientMaterials || [];
                          setEditingModel({ ...editingModel, clientMaterials: [...current, newMaterialInput.trim()] });
                          setNewMaterialInput('');
                        }
                      }
                    }}
                    className="flex-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newMaterialInput.trim()) {
                        const current = editingModel.clientMaterials || [];
                        setEditingModel({ ...editingModel, clientMaterials: [...current, newMaterialInput.trim()] });
                        setNewMaterialInput('');
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                {/* Sugerencias rápidas de materiales */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">⚡ Sugerencias de materiales comunes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      '10 bolsas de cemento',
                      '12 bolsas de cemento',
                      '2 bolsas de hercal',
                      '1.5 m³ de arena gruesa',
                      '2 m³ de arena gruesa',
                      'Agua para llenado de piscina',
                      '10 kg de pastina para losetas',
                      '2 mallas sima de 15x15'
                    ].map((matSug, mIdx) => {
                      const alreadyHas = editingModel.clientMaterials?.includes(matSug);
                      return (
                        <button
                          key={mIdx}
                          type="button"
                          disabled={alreadyHas}
                          onClick={() => {
                            const current = editingModel.clientMaterials || [];
                            if (!current.includes(matSug)) {
                              setEditingModel({ ...editingModel, clientMaterials: [...current, matSug] });
                            }
                          }}
                          className={`text-[10px] px-2 py-1 rounded-lg border transition-all ${
                            alreadyHas
                              ? 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
                              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:border-amber-500 hover:text-amber-300 hover:bg-amber-950/30'
                          }`}
                        >
                          + {matSug}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sección 6: Estructura de Costos y Ganancia */}
              <div className="bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>6. Calculadora de Precio & Margen de Ganancia</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Cálculo dinámico en vivo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1 text-[11px]">Precio Costo Fábrica (ARS)</label>
                    <input
                      type="number"
                      placeholder="Ej: 2750000"
                      value={editingModel.costPrice ?? ''}
                      onChange={e => handleModelCostChange(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-xs focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1 text-[11px]">% Margen de Ganancia</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        placeholder="Ej: 40"
                        value={editingModel.profitMargin ?? ''}
                        onChange={e => handleModelMarginChange(Number(e.target.value))}
                        className="w-full p-2.5 pr-6 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-bold text-xs focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-2.5 top-2.5 text-slate-400 font-bold text-xs">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1 text-[11px]">Precio Venta Final (ARS)</label>
                    <input
                      type="number"
                      required
                      value={editingModel.price || 0}
                      onChange={e => handleModelSalePriceChange(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-400 font-black text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Resumen de Ganancia Neta */}
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium">Ganancia Neta Estimada por Casco:</span>
                  <div className="text-right">
                    <span className="font-black text-emerald-400 text-xs">
                      {formatCurrency((editingModel.price || 0) - (editingModel.costPrice || 0))}
                    </span>
                    {editingModel.costPrice && editingModel.costPrice > 0 ? (
                      <span className="ml-1.5 bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        +{editingModel.profitMargin ?? Math.round((((editingModel.price || 0) - editingModel.costPrice) / editingModel.costPrice) * 100)}%
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Sección 7: Foto del Modelo */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-sky-400 font-extrabold text-[11px] uppercase tracking-wider block">
                  7. Foto del Modelo de Piscina
                </span>
                <ImageUploader
                  value={editingModel.imageUrl || ''}
                  onChange={url => setEditingModel({ ...editingModel, imageUrl: url })}
                  label="Imagen del Casco de Piscina"
                  helpText="Seleccioná una imagen desde tu computadora o ingresá una URL."
                />
              </div>

            </div>

            {/* Modal Footer Buttons */}
            <div className="flex gap-2.5 pt-3.5 mt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAddingModel(false);
                  setEditingModel(null);
                }}
                className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 bg-sky-600 hover:bg-sky-500 text-white font-black py-2.5 rounded-xl shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Modelo</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Accessory Modal */}
      {isAddingAcc && editingAcc && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleSaveAccessory} className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-md w-full space-y-3 text-xs">
            <h3 className="text-base font-black">Guardar / Editar Accesorio</h3>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Nombre Producto</label>
              <input
                type="text"
                required
                value={editingAcc.name || ''}
                onChange={e => setEditingAcc({ ...editingAcc, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700"
              />
            </div>

            {/* Estructura de Costos y Ganancia para Accesorios */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-sky-400">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Calculadora de Precio & Ganancia</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Cálculo en vivo</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1 text-[11px]">Costo (ARS)</label>
                  <input
                    type="number"
                    placeholder="Ej: 100000"
                    value={editingAcc.costPrice ?? ''}
                    onChange={e => handleAccCostChange(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1 text-[11px]">% Ganancia</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      placeholder="Ej: 40"
                      value={editingAcc.profitMargin ?? ''}
                      onChange={e => handleAccMarginChange(Number(e.target.value))}
                      className="w-full p-2.5 pr-6 rounded-xl bg-slate-900 border border-slate-700 text-amber-400 font-bold text-xs focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-2.5 top-2.5 text-slate-400 font-bold text-xs">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1 text-[11px]">Precio Venta</label>
                  <input
                    type="number"
                    required
                    value={editingAcc.price || 0}
                    onChange={e => handleAccSalePriceChange(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-400 font-black text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Resumen de Ganancia Neta */}
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-medium">Ganancia Neta Estimada:</span>
                <div className="text-right">
                  <span className="font-black text-emerald-400 text-xs">
                    {formatCurrency((editingAcc.price || 0) - (editingAcc.costPrice || 0))}
                  </span>
                  {editingAcc.costPrice && editingAcc.costPrice > 0 ? (
                    <span className="ml-1.5 bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      +{editingAcc.profitMargin ?? Math.round((((editingAcc.price || 0) - editingAcc.costPrice) / editingAcc.costPrice) * 100)}%
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Descripción</label>
              <textarea
                rows={2}
                value={editingAcc.description || ''}
                onChange={e => setEditingAcc({ ...editingAcc, description: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700"
              />
            </div>

            <div>
              <ImageUploader
                value={editingAcc.imageUrl || ''}
                onChange={url => setEditingAcc({ ...editingAcc, imageUrl: url })}
                label="Foto del Accesorio"
                helpText="Cargá una foto del producto desde tu PC o pegá un enlace."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingAcc(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 bg-sky-600 hover:bg-sky-500 text-white font-black py-2.5 rounded-xl"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Project Modal */}
      {isAddingProject && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProject} className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-md w-full space-y-3 text-xs">
            <h3 className="text-base font-black">Cargar Nuevo Proyecto a la Galería</h3>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Título de la Obra</label>
              <input
                type="text"
                required
                value={newProject.title || ''}
                onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Ubicación / Barrio</label>
              <input
                type="text"
                required
                value={newProject.location || ''}
                onChange={e => setNewProject({ ...newProject, location: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700"
              />
            </div>

            <div>
              <ImageUploader
                value={newProject.imageUrl || ''}
                onChange={url => setNewProject({ ...newProject, imageUrl: url })}
                label="Foto de la Obra Terminada"
                helpText="Subí una foto directamente desde tu PC o celular."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingProject(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 bg-sky-600 hover:bg-sky-500 text-white font-black py-2.5 rounded-xl"
              >
                Guardar Proyecto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Master User Modal */}
      {isAddingMasterUser && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleSaveMasterUser} className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-md w-full space-y-3 text-xs">
            <h3 className="text-base font-black">Crear Usuario Maestro</h3>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={newMasterUser.fullName || ''}
                onChange={e => setNewMasterUser({ ...newMasterUser, fullName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Usuario Login</label>
              <input
                type="text"
                required
                value={newMasterUser.username || ''}
                onChange={e => setNewMasterUser({ ...newMasterUser, username: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Contraseña de Acceso</label>
              <input
                type="password"
                placeholder="Opcional (Usa la clave maestra si está vacía)"
                value={newMasterUser.password || ''}
                onChange={e => setNewMasterUser({ ...newMasterUser, password: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Rol</label>
              <select
                value={newMasterUser.role || 'Agente Comercial'}
                onChange={e => setNewMasterUser({ ...newMasterUser, role: e.target.value as any })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              >
                <option value="Administrador General">Administrador General</option>
                <option value="Agente Comercial">Agente Comercial</option>
                <option value="Supervisora Técnica">Supervisora Técnica</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingMasterUser(false)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 bg-sky-600 hover:bg-sky-500 text-white font-black py-2.5 rounded-xl"
              >
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pop-up Preview for Admin */}
      <AnnouncementModal
        popup={companySettings.popup}
        whatsappPhone={companySettings.whatsappPhone}
        isPreview={showPopupPreview}
        onClosePreview={() => setShowPopupPreview(false)}
      />
    </div>
  );
};
