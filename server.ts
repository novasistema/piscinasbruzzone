import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { 
  initialCompanyConfig, 
  initialModels, 
  initialAccessories, 
  initialProjects, 
  initialTestimonials, 
  initialMasterUsers,
  initialQuotes,
  initialMaintenances
} from './src/initialData.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Anti-cache middleware for all API endpoints to guarantee instant multi-device synchronization
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// File storage directory
const DB_FILE = path.join(process.cwd(), 'data', 'db.json');

function ensureDatabase() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      config: initialCompanyConfig,
      models: initialModels,
      accessories: initialAccessories,
      projects: initialProjects,
      testimonials: initialTestimonials,
      masterUsers: initialMasterUsers,
      quotes: initialQuotes,
      maintenances: initialMaintenances,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  }
}

function readDb() {
  ensureDatabase();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      config: parsed.config ? { ...initialCompanyConfig, ...parsed.config } : initialCompanyConfig,
      models: Array.isArray(parsed.models) ? parsed.models : initialModels,
      accessories: Array.isArray(parsed.accessories) ? parsed.accessories : initialAccessories,
      projects: Array.isArray(parsed.projects) ? parsed.projects : initialProjects,
      testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : initialTestimonials,
      masterUsers: Array.isArray(parsed.masterUsers) ? parsed.masterUsers : initialMasterUsers,
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : initialQuotes,
      maintenances: Array.isArray(parsed.maintenances) ? parsed.maintenances : initialMaintenances,
      updatedAt: parsed.updatedAt || new Date().toISOString()
    };
  } catch (err) {
    console.error('Error reading DB, using initial data:', err);
    return {
      config: initialCompanyConfig,
      models: initialModels,
      accessories: initialAccessories,
      projects: initialProjects,
      testimonials: initialTestimonials,
      masterUsers: initialMasterUsers,
      quotes: initialQuotes,
      maintenances: initialMaintenances,
      updatedAt: new Date().toISOString()
    };
  }
}

function writeDb(dbData: any) {
  ensureDatabase();
  dbData.updatedAt = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
}

// REST API Endpoints

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET Unified All Data endpoint (Synchronizes entire application across all devices in 1 request)
app.get('/api/all-data', (req, res) => {
  const db = readDb();
  res.json({
    config: db.config,
    models: db.models,
    accessories: db.accessories,
    projects: db.projects,
    testimonials: db.testimonials,
    quotes: db.quotes,
    maintenances: db.maintenances,
    updatedAt: db.updatedAt
  });
});

// GET Company Config & Public Data
app.get('/api/config', (req, res) => {
  const db = readDb();
  res.json(db.config || initialCompanyConfig);
});

app.put('/api/config', (req, res) => {
  const db = readDb();
  db.config = { ...db.config, ...req.body };
  writeDb(db);
  res.json({ success: true, config: db.config });
});

// Pool Models API
app.get('/api/models', (req, res) => {
  const db = readDb();
  res.json(db.models || initialModels);
});

app.post('/api/models', (req, res) => {
  const db = readDb();
  const newModel = { id: 'mod-' + Date.now(), ...req.body };
  db.models = [newModel, ...db.models];
  writeDb(db);
  res.json({ success: true, model: newModel });
});

app.put('/api/models/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.models = db.models.map((m: any) => (m.id === id ? { ...m, ...req.body } : m));
  writeDb(db);
  res.json({ success: true });
});

app.delete('/api/models/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.models = db.models.filter((m: any) => m.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// Mass Price Update API
app.post('/api/prices/update-mass', (req, res) => {
  const { modelPercent, accessoryPercent } = req.body;
  const db = readDb();

  if (typeof modelPercent === 'number' && modelPercent !== 0) {
    db.models = db.models.map((m: any) => ({
      ...m,
      price: Math.round(m.price * (1 + modelPercent / 100))
    }));
  }

  if (typeof accessoryPercent === 'number' && accessoryPercent !== 0) {
    db.accessories = db.accessories.map((a: any) => ({
      ...a,
      price: Math.round(a.price * (1 + accessoryPercent / 100))
    }));
  }

  writeDb(db);
  res.json({ success: true, modelsCount: db.models.length, accessoriesCount: db.accessories.length });
});

// Accessories API
app.get('/api/accessories', (req, res) => {
  const db = readDb();
  res.json(db.accessories || initialAccessories);
});

app.post('/api/accessories', (req, res) => {
  const db = readDb();
  const newAcc = { id: 'acc-' + Date.now(), ...req.body };
  db.accessories = [newAcc, ...db.accessories];
  writeDb(db);
  res.json({ success: true, accessory: newAcc });
});

app.put('/api/accessories/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.accessories = db.accessories.map((a: any) => (a.id === id ? { ...a, ...req.body } : a));
  writeDb(db);
  res.json({ success: true });
});

app.delete('/api/accessories/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.accessories = db.accessories.filter((a: any) => a.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// Quotes / Orders API
app.get('/api/quotes', (req, res) => {
  const db = readDb();
  res.json(db.quotes || initialQuotes);
});

app.post('/api/quotes', (req, res) => {
  const db = readDb();
  const newQuote = {
    id: 'COT-' + Math.floor(1000 + Math.random() * 9000),
    createdAt: new Date().toISOString(),
    status: 'pendiente',
    ...req.body
  };
  db.quotes = [newQuote, ...(db.quotes || [])];
  writeDb(db);
  res.json({ success: true, quote: newQuote });
});

app.put('/api/quotes/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.quotes = db.quotes.map((q: any) => (q.id === id ? { ...q, ...req.body } : q));
  writeDb(db);
  res.json({ success: true });
});

app.delete('/api/quotes/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.quotes = db.quotes.filter((q: any) => q.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// Maintenance Visits API
app.get('/api/maintenances', (req, res) => {
  const db = readDb();
  res.json(db.maintenances || initialMaintenances);
});

app.post('/api/maintenances', (req, res) => {
  const db = readDb();
  const newVisit = {
    id: 'MNT-' + Math.floor(100 + Math.random() * 900),
    createdAt: new Date().toISOString(),
    status: 'pendiente',
    ...req.body
  };
  db.maintenances = [newVisit, ...(db.maintenances || [])];
  writeDb(db);
  res.json({ success: true, visit: newVisit });
});

app.put('/api/maintenances/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.maintenances = db.maintenances.map((m: any) => (m.id === id ? { ...m, ...req.body } : m));
  writeDb(db);
  res.json({ success: true });
});

app.delete('/api/maintenances/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.maintenances = db.maintenances.filter((m: any) => m.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// Projects Portfolio API
app.get('/api/projects', (req, res) => {
  const db = readDb();
  res.json(db.projects || initialProjects);
});

app.post('/api/projects', (req, res) => {
  const db = readDb();
  const newProj = { id: 'proj-' + Date.now(), date: new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }), ...req.body };
  db.projects = [newProj, ...(db.projects || [])];
  writeDb(db);
  res.json({ success: true, project: newProj });
});

app.delete('/api/projects/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.projects = db.projects.filter((p: any) => p.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// Testimonials API
app.get('/api/testimonials', (req, res) => {
  const db = readDb();
  res.json(db.testimonials || initialTestimonials);
});

app.post('/api/testimonials', (req, res) => {
  const db = readDb();
  const newTest = { id: 'test-' + Date.now(), date: 'Hoy', ...req.body };
  db.testimonials = [newTest, ...(db.testimonials || [])];
  writeDb(db);
  res.json({ success: true, testimonial: newTest });
});

app.delete('/api/testimonials/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.testimonials = db.testimonials.filter((t: any) => t.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// Master Users API
app.get('/api/master-users', (req, res) => {
  const db = readDb();
  res.json(db.masterUsers || initialMasterUsers);
});

app.post('/api/master-users', (req, res) => {
  const db = readDb();
  const newUser = {
    id: 'user-' + Date.now(),
    createdAt: new Date().toISOString().split('T')[0],
    active: true,
    ...req.body
  };
  db.masterUsers = [newUser, ...(db.masterUsers || [])];
  writeDb(db);
  res.json({ success: true, masterUser: newUser });
});

app.put('/api/master-users/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.masterUsers = db.masterUsers.map((u: any) => (u.id === id ? { ...u, ...req.body } : u));
  writeDb(db);
  res.json({ success: true });
});

app.delete('/api/master-users/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.masterUsers = db.masterUsers.filter((u: any) => u.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// Backup & Restore API
app.get('/api/backup/export', (req, res) => {
  const db = readDb();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="piscinas-bruzzone-backup-${new Date().toISOString().split('T')[0]}.json"`);
  res.json(db);
});

app.post('/api/backup/restore', (req, res) => {
  try {
    const backupData = req.body;
    if (!backupData || typeof backupData !== 'object') {
      return res.status(400).json({ error: 'Datos de respaldo inválidos' });
    }

    const currentDb = readDb();
    const newDb = {
      config: backupData.config || currentDb.config,
      models: Array.isArray(backupData.models) ? backupData.models : currentDb.models,
      accessories: Array.isArray(backupData.accessories) ? backupData.accessories : currentDb.accessories,
      projects: Array.isArray(backupData.projects) ? backupData.projects : currentDb.projects,
      testimonials: Array.isArray(backupData.testimonials) ? backupData.testimonials : currentDb.testimonials,
      masterUsers: Array.isArray(backupData.masterUsers) ? backupData.masterUsers : currentDb.masterUsers,
      quotes: Array.isArray(backupData.quotes) ? backupData.quotes : currentDb.quotes,
      maintenances: Array.isArray(backupData.maintenances) ? backupData.maintenances : currentDb.maintenances,
      updatedAt: new Date().toISOString()
    };

    writeDb(newDb);
    res.json({ success: true, message: 'Copia de seguridad restaurada correctamente', data: newDb });
  } catch (err) {
    console.error('Error restaurando backup:', err);
    res.status(500).json({ error: 'Error al restaurar copia de seguridad' });
  }
});

// Admin Auth check API
app.post('/api/admin/login', (req, res) => {
  const { password, username } = req.body;
  const db = readDb();
  const masterUsers = db.masterUsers || [];
  const customAdminPassword = db.config?.adminPassword?.trim();
  const customAdminUsername = db.config?.adminUsername?.trim();

  // Check master user list
  const matchedUser = masterUsers.find((u: any) => u.username.toLowerCase() === (username || '').toLowerCase() && u.active);
  if (matchedUser && matchedUser.password && matchedUser.password === password) {
    return res.json({
      success: true,
      user: matchedUser
    });
  }

  // Check custom admin username/password if configured
  const reqUsername = (username || '').trim().toLowerCase();
  const expectedUsername = (customAdminUsername || 'admin').toLowerCase();

  if (customAdminPassword) {
    // Custom password is active: ONLY accept the custom password
    if (password === customAdminPassword && (reqUsername === expectedUsername || reqUsername === 'admin')) {
      return res.json({
        success: true,
        user: matchedUser || {
          id: 'admin-master',
          username: customAdminUsername || 'admin',
          fullName: 'Administrador Maestro Bruzzone',
          role: 'Administrador General'
        }
      });
    } else {
      return res.status(401).json({ success: false, error: 'Contraseña o usuario incorrecto' });
    }
  }

  // Default fallback password if no custom password has been defined yet
  if (password === 'bruzzone2026' || password === 'bruone2026' || password === 'admin') {
    res.json({
      success: true,
      user: matchedUser || {
        id: 'admin-master',
        username: username || 'admin',
        fullName: 'Administrador Maestro Bruzzone',
        role: 'Administrador General'
      }
    });
  } else {
    res.status(401).json({ success: false, error: 'Contraseña o usuario incorrecto' });
  }
});

// Admin Change Password API
app.post('/api/admin/change-password', (req, res) => {
  const { currentPassword, newPassword, newUsername } = req.body;
  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres.' });
  }

  const db = readDb();
  const existingPassword = db.config?.adminPassword?.trim();

  // If there was an existing password, verify it if currentPassword provided
  if (existingPassword && currentPassword && existingPassword !== currentPassword && currentPassword !== 'bruzzone2026') {
    return res.status(403).json({ error: 'La contraseña actual ingresada es incorrecta.' });
  }

  if (!db.config) db.config = initialCompanyConfig;
  db.config.adminPassword = newPassword.trim();
  if (newUsername && newUsername.trim()) {
    db.config.adminUsername = newUsername.trim();
  }

  writeDb(db);
  res.json({
    success: true,
    message: 'Contraseña de administrador actualizada correctamente',
    username: db.config.adminUsername || 'admin'
  });
});

// Vite / Static setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Piscinas Bruzzone server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
