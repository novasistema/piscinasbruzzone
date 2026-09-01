import { CompanyConfig, PoolModel, Accessory, ProjectPhoto, Testimonial, MasterUser, QuoteOrder, MaintenanceVisit } from './types';

export const initialCompanyConfig: CompanyConfig = {
  companyName: 'Piscinas Bruzzone',
  tagline: 'Viví el Verano con la Mejor Calidad y Garantía Escrita',
  whatsappPhone: '5491130005500',
  whatsappFormatted: '+54 9 11 3000-5500',
  email: 'contacto@piscinasbruzzone.com.ar',
  address: 'Av. Las Gardenias 2450, Colectora Oeste, Buenos Aires',
  businessHours: 'Lunes a Sábados de 8:00 a 19:00 hs',
  instagram: '@piscinas.bruzzone',
  facebook: 'PiscinasBruzzoneOficial',
  warrantyYears: 5,
  installationTerms: `El proceso de instalación incluye:
• EXCAVACIÓN en terreno plano natural, de tierra, no rocoso, no arcilloso, sin desniveles ni napas subterráneas altas.
• COLOCACIÓN y nivelación de casco de fibra.
• COLOCACIÓN y nivelación de casilla de fibra para equipo de filtrado.
• INSTALACIÓN y conexión de equipo de filtrado y circulación de agua (bomba-filtro-skimmer-retornos(2)-cañería VULCANO).
• CONSTRUCCIÓN de carpeta asfáltica perimetral, de 0,50 cm de ancho.
• INSTALACIÓN de hilera perimetral de losetas atérmicas anti-deslizantes de 0.50x0.50 mts.
• PRIMERA LIMPIEZA BONIFICADA: ¡Te regalamos la primera limpieza y puesta a punto del agua!
• PLAZO DE EJECUCIÓN: Entre 2 y 3 días corridos.`,
  notIncludedTerms: `No está incluido dentro del proceso de instalación:
• MATERIALES ÁRIDOS necesarios para instalación (cemento, arena, hercal, pastina, granza, malla sima).
• AGUA para el llenado de la piscina (provista por el cliente mediante cisterna o tanque).
• Pasado de casco por techo, tapia o lugares de acceso complicado.
• Excavaciones en terrenos con tosca, piedra, escombros o raíces.
• Extracción de árboles y obras civiles adicionales.
• Conexión eléctrica requerida (se recomienda electricista matriculado).
• Muros de contención y parquización posterior.`,
  popup: {
    enabled: true,
    badge: '¡OFERTA DE TEMPORADA!',
    title: '¡Aprovechá la Promoción Especial de Verano!',
    message: 'Instalá tu piscina de fibra en solo 3 días corridos. Llevate un 15% de descuento en la Línea Solarium + Kit de Luces LED RGB Bonificado.',
    imageUrl: 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=800&q=80',
    ctaText: 'Consultar Promoción por WhatsApp',
    ctaAction: 'whatsapp'
  }
};

export const initialModels: PoolModel[] = [
  {
    id: 'c4000',
    code: 'C4000',
    name: 'Línea Clásica C4000',
    line: 'clasica',
    length: 4.00,
    width: 3.00,
    depth: 1.40,
    capacity: 15000,
    costPrice: 2750000,
    profitMargin: 40,
    price: 3850000,
    imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
    isPopular: false,
    includes: [
      'Equipo de filtrado completo VULCANO',
      'Casilla de fibra p/equipo de filtrado',
      'Skimmer VULCANO',
      '2 Retornos orientables VULCANO',
      'Losetas atérmicas (1 vuelta perimetral)',
      'Instalación en terreno natural de tierra',
      'Garantía de fábrica por 5 años'
    ],
    clientMaterials: [
      '12 bolsas de cemento',
      '3 bolsas de hercal',
      '2 m³ de arena gruesa',
      '15.000 litros de agua para llenado',
      '1/4 de granza de 1 al 3',
      '15 kg de pastina atérmica',
      '1 malla sima'
    ],
    description: 'Diseño compacto y eficiente, ideal para jardines urbanos o espacios acotados sin renunciar al máximo confort.'
  },
  {
    id: 's5000',
    code: 'S5000',
    name: 'Línea Solarium S5000',
    line: 'solarium',
    length: 5.00,
    width: 3.00,
    depth: 1.40,
    capacity: 18000,
    costPrice: 3250000,
    profitMargin: 40,
    price: 4550000,
    solariumWidth: 0.90,
    imageUrl: 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
    includes: [
      'Solarium incorporado de 0.90 m de profundidad reducida para relax y niños',
      'Equipo de filtrado completo VULCANO',
      'Casilla de fibra reforzada',
      'Skimmer + 2 Retornos VULCANO',
      'Losetas atérmicas anti-deslizantes',
      'Conexión de cañerías y prueba hidráulica',
      'Garantía de 5 años'
    ],
    clientMaterials: [
      '12 bolsas de cemento',
      '3 bolsas de hercal',
      '2 m³ de arena gruesa',
      '18.000 litros de agua',
      '1/4 de granza de 1 al 3',
      '15 kg de pastina atérmica',
      '1 malla sima'
    ],
    description: 'Incorpora un solarium húmedo de 0.90m perfecto para reposeras dentro del agua y juegos seguros de niños.'
  },
  {
    id: 'c5000',
    code: 'C5000',
    name: 'Línea Clásica C5000',
    line: 'clasica',
    length: 5.00,
    width: 3.00,
    depth: 1.40,
    capacity: 18000,
    costPrice: 3142857,
    profitMargin: 40,
    price: 4400000,
    imageUrl: 'https://images.unsplash.com/photo-1562778612-e1e0cda9915c?auto=format&fit=crop&w=800&q=80',
    includes: [
      'Equipo de filtrado completo VULCANO',
      'Casilla de fibra p/equipo de filt.',
      'Skimmer VULCANO + 2 Retornos',
      'Losetas atérmicas (1 vuelta)',
      'Garantía escrita 5 años'
    ],
    clientMaterials: [
      '12 bolsas de cemento',
      '3 bolsas de hercal',
      '2 m³ de arena gruesa',
      '18.000 litros de agua',
      '1/4 de granza 1 al 3',
      '15 kg de pastina atérmica',
      '1 malla sima'
    ],
    description: 'Excelente balance dimensional. El modelo preferido por familias pequeñas que buscan profundidad y comodidad.'
  },
  {
    id: 'c6000',
    code: 'C6000',
    name: 'Línea Clásica C6000',
    line: 'clasica',
    length: 6.30,
    width: 3.00,
    depth: 1.40,
    capacity: 21000,
    costPrice: 3821428,
    profitMargin: 40,
    price: 5350000,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
    includes: [
      'Equipo de filtrado VULCANO de alta potencia',
      'Casilla de fibra reforzada',
      'Skimmer VULCANO + 2 Retornos',
      'Losetas atérmicas 0.50x0.50m',
      'Colocación y nivelación de casco',
      'Garantía de 5 años'
    ],
    clientMaterials: [
      '14 bolsas de cemento',
      '4 bolsas de hercal',
      '3 m³ de arena gruesa',
      '21.000 litros de agua',
      '1/4 de granza de 1 al 3',
      '20 kg de pastina atérmica',
      '2 mallas sima'
    ],
    description: 'Más de 6 metros de largo para disfrutar la natación y revalorizar el valor del patio o quinta.'
  },
  {
    id: 's7000',
    code: 'S7000',
    name: 'Línea Solarium S7000',
    line: 'solarium',
    length: 7.00,
    width: 3.00,
    depth: 1.40,
    capacity: 23000,
    costPrice: 4428571,
    profitMargin: 40,
    price: 6200000,
    solariumWidth: 0.90,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    includes: [
      'Solarium integrador de 0.90 m',
      'Escalinata de fácil acceso',
      'Equipo de filtrado completo VULCANO',
      'Casilla de fibra + Skimmer + 2 Retornos',
      'Losetas atérmicas (1 vuelta)',
      'Garantía por 5 años'
    ],
    clientMaterials: [
      '16 bolsas de cemento',
      '4 bolsas de hercal',
      '3 m³ de arena gruesa',
      '23.000 litros de agua',
      '1/4 de granza de 1 al 3',
      '20 kg de pastina atérmica',
      '2 mallas sima'
    ],
    description: 'El modelo premium con solarium extenso. Amplio volumen de agua para reuniones familiares y amigos.'
  },
  {
    id: 'c7500',
    code: 'C7500',
    name: 'Línea Clásica C7500',
    line: 'clasica',
    length: 7.50,
    width: 3.15,
    depth: 1.40,
    capacity: 25000,
    costPrice: 4928571,
    profitMargin: 40,
    price: 6900000,
    imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80',
    includes: [
      'El modelo clásico de mayor envergadura',
      'Equipo de filtrado VULCANO profesional',
      'Casilla de fibra + Skimmer + 2 Retornos',
      'Losetas atérmicas 0.50x0.50m',
      'Garantía total de 5 años'
    ],
    clientMaterials: [
      '18 bolsas de cemento',
      '4 bolsas de hercal',
      '3 m³ de arena gruesa',
      '25.000 litros de agua',
      '1/4 de granza de 1 al 3',
      '20 kg de pastina atérmica',
      '2 mallas sima'
    ],
    description: 'Modelo insignia de 7.50m de longitud y 3.15m de ancho. Máximo nivel de exclusividad y resistencia.'
  },
  {
    id: 'm280',
    code: 'M280',
    name: 'Mini Piscina Serena 280',
    line: 'mini',
    length: 2.80,
    width: 2.25,
    depth: 0.75,
    capacity: 4500,
    costPrice: 1950000,
    profitMargin: 40,
    price: 2750000,
    imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
    isPopular: true,
    includes: [
      'Formato compacto ideal para patios pequeños, terrazas o quintas',
      'Bomba y equipo de filtrado completo VULCANO',
      'Skimmer y retornos de hidromasaje',
      'Losetas atérmicas perimetrales',
      'Garantía escrita de 5 años'
    ],
    clientMaterials: [
      '8 bolsas de cemento',
      '2 bolsas de hercal',
      '1 m³ de arena gruesa',
      '4.500 litros de agua',
      '10 kg de pastina atérmica'
    ],
    description: 'Mini piscina y spa de fibra de vidrio de alta resistencia. Máximo relax en espacios reducidos con bajo costo de mantenimiento.'
  },
  {
    id: 'm390',
    code: 'M390',
    name: 'Mini Piscina Serena 390',
    line: 'mini',
    length: 3.90,
    width: 2.15,
    depth: 0.65,
    capacity: 5500,
    costPrice: 2250000,
    profitMargin: 40,
    price: 3150000,
    imageUrl: 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=800&q=80',
    includes: [
      'Línea Mini Piscina / Hidro con asientos y descanso',
      'Equipo de filtrado VULCANO completo',
      'Casilla de fibra reforzada',
      'Losetas perimetrales atérmicas',
      'Garantía de 5 años'
    ],
    clientMaterials: [
      '10 bolsas de cemento',
      '2 bolsas de hercal',
      '1.5 m³ de arena gruesa',
      '5.500 litros de agua',
      '12 kg de pastina'
    ],
    description: 'Diseño anatómico con bancos de relax para disfrutar en familia. Rápida instalación y climatización económica.'
  }
];

export const initialAccessories: Accessory[] = [
  {
    id: 'acc-luces-led',
    name: 'Luces LED Recargables RGB',
    category: 'luces',
    price: 185000,
    description: 'Sistema innovador con fijación sin perforar el casco. De colores RGB con control remoto inalámbrico para regular intensidad y efectos.',
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80',
    isSeasonal: true,
    badge: 'Popular de Temporada',
    stockStatus: 'in_stock'
  },
  {
    id: 'acc-solarium-ext',
    name: 'Módulo Solarium Extendido',
    category: 'climatizacion',
    price: 260000,
    description: 'Extiende el perímetro de losetas de la piscina. Ideal para ampliar espacio de circulación y reposeras brindando máximo confort.',
    imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    isSeasonal: true,
    stockStatus: 'in_stock'
  },
  {
    id: 'acc-cobertor',
    name: 'Cobertor Térmico y Anti-Hojas',
    category: 'cobertores',
    price: 230000,
    description: 'Protege la piscina de hojas, polvo y basura. Práctico, fácil instalación y conservación de temperatura. Seguro para niños y mascotas.',
    imageUrl: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80',
    isSeasonal: true,
    badge: 'Imprescindible',
    stockStatus: 'in_stock'
  },
  {
    id: 'acc-cerco',
    name: 'Cerco Perimetral de Seguridad',
    category: 'seguridad',
    price: 390000,
    description: 'Garantiza tranquilidad absoluta y evita accidentes. Permite disfrutar el jardín todo el año con niños y mascotas sin riesgos.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    stockStatus: 'in_stock'
  },
  {
    id: 'acc-caneria-clima',
    name: 'Pre-Instalación Cañería para Climatización',
    category: 'climatizacion',
    price: 155000,
    description: 'Prolonga la temporada de uso. Cañería adicional sobre el lateral para anexar fácilmente bomba de calor o paneles solares.',
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80',
    isSeasonal: true,
    stockStatus: 'in_stock'
  },
  {
    id: 'acc-cascada',
    name: 'Cascada de Agua Sensorial',
    category: 'cascadas',
    price: 310000,
    description: 'Elegante caída de agua que genera un sonido relajante e imponente impacto visual en la piscina.',
    imageUrl: 'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?auto=format&fit=crop&w=600&q=80',
    stockStatus: 'in_stock'
  },
  {
    id: 'acc-kit-mantenimiento',
    name: 'Kit de Mantenimiento Completo Vulcano',
    category: 'mantenimiento',
    price: 125000,
    description: 'Incluye limpiafondo medialuna, mango telescópico extensible 3.60m, manguera 38mm, boya dosificadora, sacahojas y tapa skimmer.',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    isSeasonal: true,
    badge: 'Combo Oferta',
    stockStatus: 'in_stock'
  },
  {
    id: 'acc-quimicos',
    name: 'Combo Químicos de Inicio (Cloro + Alguicida)',
    category: 'quimicos',
    price: 68000,
    description: 'Pastillas triple acción (5u), alguicida concentrado, clarificante y medidor de pH/cloro para el mantenimiento ideal del agua.',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
    isSeasonal: true,
    stockStatus: 'in_stock'
  }
];

export const initialProjects: ProjectPhoto[] = [
  {
    id: 'proj-1',
    title: 'Instalación Residencial S5000',
    location: 'Nordelta, Tigre',
    poolModel: 'S5000 Solarium',
    imageUrl: 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=800&q=80',
    description: 'Piscina instalada con solarium húmedo, luces RGB perimetrales y revestimiento de losetas baldosón atérimico blanco.',
    date: 'Enero 2026'
  },
  {
    id: 'proj-2',
    title: 'Quinta Familiar C6000',
    location: 'Pilar, Buenos Aires',
    poolModel: 'C6000 Clásica',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    description: 'Obra terminada en 3 días hábiles con cerco de seguridad y sistema de filtrado automatizado en casilla subterránea.',
    date: 'Diciembre 2025'
  },
  {
    id: 'proj-3',
    title: 'Piscina con Cascada C7500',
    location: 'Canning, Ezeiza',
    poolModel: 'C7500 Clásica',
    imageUrl: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80',
    description: 'Gran piscina con cascada de agua en acero inoxidable, pre-instalación de climatización y área de descanso amplio.',
    date: 'Febrero 2026'
  }
];

export const initialTestimonials: Testimonial[] = [
  {
    id: 'test-1',
    clientName: 'Carlos M. Rossi',
    location: 'Escobar, B.A.',
    poolModel: 'S5000 Solarium',
    rating: 5,
    comment: '¡Súper recomendables! Cumplieron los tiempos exactos de 3 días. La calidad del casco y el filtrado Vulcano es excelente. El solarium es la estrella del verano.',
    date: '10 de Enero 2026'
  },
  {
    id: 'test-2',
    clientName: 'Mariana & Lucas',
    location: 'Maschwitz',
    poolModel: 'C6000 Clásica',
    rating: 5,
    comment: 'Coticé por WhatsApp, vinieron a revisar el terreno y en la misma semana ya estábamos llenando la pileta. Muy profesionales y atentos en la postventa.',
    date: '28 de Diciembre 2025'
  },
  {
    id: 'test-3',
    clientName: 'Esteban Fernandez',
    location: 'Moreno',
    poolModel: 'C4000 Clásica',
    rating: 5,
    comment: 'Excelente atención de todo el equipo de Piscinas Bruzzone. El agendamiento de mantenimientos por la app funciona de diez.',
    date: '2 de Febrero 2026'
  }
];

export const initialMasterUsers: MasterUser[] = [
  {
    id: 'user-1',
    username: 'admin',
    fullName: 'Administrador Maestro Bruzzone',
    role: 'Administrador General',
    email: 'admin@piscinasbruzzone.com.ar',
    phone: '+54 9 11 3000-5500',
    active: true,
    createdAt: '2026-01-01'
  },
  {
    id: 'user-2',
    username: 'ventas',
    fullName: 'Agente Comercial WhatsApp',
    role: 'Agente Comercial',
    email: 'ventas@piscinasbruzzone.com.ar',
    phone: '+54 9 11 3000-5501',
    active: true,
    createdAt: '2026-01-15'
  },
  {
    id: 'user-3',
    username: 'tecnico',
    fullName: 'Supervisora Técnica de Mantenimiento',
    role: 'Supervisora Técnica',
    email: 'tecnico@piscinasbruzzone.com.ar',
    phone: '+54 9 11 3000-5502',
    active: true,
    createdAt: '2026-02-01'
  }
];

export const initialQuotes: QuoteOrder[] = [
  {
    id: 'COT-8921',
    createdAt: new Date().toISOString(),
    clientName: 'Roberto Gómez',
    clientPhone: '+54 9 11 5544-3322',
    clientEmail: 'roberto@example.com',
    clientAddress: 'Calle Las Acacias 120, Pilar',
    city: 'Pilar',
    poolModelCode: 'S5000',
    poolModelName: 'Línea Solarium S5000',
    accessoriesSelected: ['Luces LED Recargables RGB', 'Cobertor Térmico'],
    totalPrice: 4965000,
    notes: 'Terreno natural de tierra libre de raíces. Quiere cotizar instalación de luces LED extra.',
    status: 'pendiente'
  },
  {
    id: 'COT-8922',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    clientName: 'Silvia Albarracín',
    clientPhone: '+54 9 11 6677-8899',
    clientAddress: 'Barrio El Casco, Lote 45',
    city: 'Ezeiza',
    poolModelCode: 'C6000',
    poolModelName: 'Línea Clásica C6000',
    accessoriesSelected: ['Kit de Mantenimiento Completo Vulcano', 'Cascada de Agua Sensorial'],
    totalPrice: 5785000,
    status: 'contactado'
  }
];

export const initialMaintenances: MaintenanceVisit[] = [
  {
    id: 'MNT-101',
    createdAt: new Date().toISOString(),
    clientName: 'Daniela Benítez',
    clientPhone: '+54 9 11 4433-2211',
    address: 'Calle Los Tilos 840, Tigre',
    poolType: 'Piscinas Bruzzone S5000',
    serviceType: 'limpieza_completa',
    scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    timeSlot: 'mañana',
    status: 'confirmado',
    notes: 'Agendado automáticamente desde la app. Controlar nivel de cloro.',
    assignedTechnician: 'Martín Tech'
  },
  {
    id: 'MNT-102',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    clientName: 'Gonzalo Varela',
    clientPhone: '+54 9 11 9988-7766',
    address: 'Av. Libertador 4500, San Isidro',
    poolType: 'Piscina de Fibra C7500',
    serviceType: 'service_bomba_filtro',
    scheduledDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    timeSlot: 'tarde',
    status: 'pendiente',
    notes: 'Revisión de fuga en manómetro de filtro Vulcano.'
  }
];
