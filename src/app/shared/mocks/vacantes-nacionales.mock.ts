import { VacanteNacional } from '../../core/models';

export const VACANTES_NACIONALES_MOCK: VacanteNacional[] = [
  {
    id: 'vn1',
    puesto: 'Desarrollador Java Senior',
    empresa: 'Global Tech Solutions',
    empresa_logo: 'https://cdn-icons-png.flaticon.com/512/2702/2702602.png',
    ubicacion: 'Ciudad de México (Remoto)',
    salario: '$45,000 - $60,000 MXN',
    fuente: 'Portal del Empleo',
    url_externa: 'https://www.empleo.gob.mx/vacante/12345',
    descripcion: 'Buscamos desarrollador Java con 5 años de experiencia en Spring Boot y microservicios. Trabajo 100% remoto con prestaciones superiores a las de ley.',
    fecha_publicacion: '2024-03-12'
  },
  {
    id: 'vn2',
    puesto: 'Analista de Datos Jr',
    empresa: 'Data Insights Corp',
    ubicacion: 'Guadalajara, Jalisco',
    salario: '$22,000 - $28,000 MXN',
    fuente: 'Bolsa de Trabajo Nacional',
    url_externa: 'https://www.empleo.gob.mx/vacante/67890',
    descripcion: 'Oportunidad para egresados de TI o Matemáticas. Manejo de SQL y Python básico. Esquema híbrido en zona financiera de Guadalajara.',
    fecha_publicacion: '2024-03-14'
  },
  {
    id: 'vn3',
    puesto: 'Ingeniero de Procesos',
    empresa: 'Manufacturas del Norte',
    ubicacion: 'Monterrey, Nuevo León',
    salario: '$30,000 - $35,000 MXN',
    fuente: 'LinkedIn (vía API)',
    url_externa: 'https://www.linkedin.com/jobs/view/999',
    descripcion: 'Ingeniero Industrial o Mecatrónico para optimización de líneas de producción en planta automotriz. Inglés avanzado necesario.',
    fecha_publicacion: '2024-03-10'
  },
  {
    id: 'vn4',
    puesto: 'Project Manager TI',
    empresa: 'SoftServe México',
    ubicacion: 'Querétaro, Qro.',
    salario: '$40,000 MXN',
    fuente: 'Portal del Empleo',
    url_externa: 'https://www.empleo.gob.mx/vacante/4455',
    descripcion: 'Gestión de proyectos ágiles. Certificación PMP o Scrum Master deseable. Coordinación de equipos multiculturales.',
    fecha_publicacion: '2024-03-15'
  }
];
