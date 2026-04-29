import { KpiDashboard, InsercionCarrera, CompetenciaDemandada } from '../../core/models';

export const REPORTE_KPI_MOCK: KpiDashboard = {
  egresados_registrados: 1247,
  tasa_insercion:        68.4,
  empresas_convenio:     43,
  vacantes_activas:      87,
};

export const INSERCION_CARRERAS_MOCK: InsercionCarrera[] = [
  { carrera: 'Ingeniería en Tecnologías de la Información', abreviatura: 'ITI',  total_egresados: 312, insertados: 241, tasa: 77.2 },
  { carrera: 'Ingeniería en Gestión Empresarial',           abreviatura: 'IGE',  total_egresados: 287, insertados: 208, tasa: 72.5 },
  { carrera: 'Ingeniería en Mantenimiento Industrial',      abreviatura: 'IMI',  total_egresados: 234, insertados: 175, tasa: 74.8 },
  { carrera: 'Ingeniería en Logística y Transporte',        abreviatura: 'ILT',  total_egresados: 198, insertados: 128, tasa: 64.6 },
  { carrera: 'Tecnología en Mecatrónica',                   abreviatura: 'TM',   total_egresados: 145, insertados: 94,  tasa: 64.8 },
  { carrera: 'Ingeniería en Agronegocios',                  abreviatura: 'IA',   total_egresados: 71,  insertados: 47,  tasa: 66.2 },
];

export const COMPETENCIAS_DEMANDADAS_MOCK: CompetenciaDemandada[] = [
  { dimension: 'tecnica',      label: 'Técnica',      demanda: 94, promedio: 78 },
  { dimension: 'cognitiva',    label: 'Cognitiva',    demanda: 87, promedio: 74 },
  { dimension: 'psicometrica', label: 'Psicométrica', demanda: 82, promedio: 76 },
  { dimension: 'proyectiva',   label: 'Proyectiva',   demanda: 75, promedio: 71 },
];

export const CONVENIOS_POR_ZONA_MOCK = {
  norte:  38,
  centro: 4,
  sur:    1,
};

export const VACANTES_POR_AREA_MOCK = [
  { area: 'TI y Software',         cantidad: 28 },
  { area: 'Manufactura Industrial', cantidad: 19 },
  { area: 'Logística',             cantidad: 14 },
  { area: 'Gestión Empresarial',   cantidad: 12 },
  { area: 'Mecatrónica',           cantidad: 9  },
  { area: 'Agronegocios',          cantidad: 5  },
];
