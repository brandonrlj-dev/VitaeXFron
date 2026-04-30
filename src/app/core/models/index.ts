// ─── Auth ────────────────────────────────────────────────────────────────────
export interface SiestTokenPayload {
  sub?: string;
  usuario: string;
  tipo?: 'egresado' | 'empresa' | 'admin';
  rol?: 'egresado' | 'empresa' | 'admin';
  perfil_id?: string | number | null;
  cve_persona?: string;
  cve_egresado?: string | number;
  cve_empresa?: string | number;
  cve_division?: string;
  abreviatura_division?: string;
  roles?: { id: string; nombre: string }[];
  roles_originales?: { id: string; nombre: string }[];
  nombre?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface AuthState {
  token: string | null;
  rol: RolUsuario | null;
  usuario: SiestTokenPayload | null;
  isAuthenticated: boolean;
}

export type RolUsuario = 'egresado' | 'empresa' | 'admin';

// ─── Dimensiones ─────────────────────────────────────────────────────────────
export type DimensionType = 'psicometrica' | 'cognitiva' | 'tecnica' | 'proyectiva';

export interface DimensionScores {
  psicometrica: number;
  cognitiva:    number;
  tecnica:      number;
  proyectiva:   number;
}

export const DIMENSION_CONFIG: Record<DimensionType, { label: string; color: string; icon: string; description: string }> = {
  psicometrica: {
    label: 'Psicométrica',
    color: '#0d9488',
    icon: 'pi pi-heart',
    description: 'Personalidad y comportamiento laboral'
  },
  cognitiva: {
    label: 'Cognitiva',
    color: '#3b82f6',
    icon: 'pi pi-bolt',
    description: 'Razonamiento lógico y aptitudes intelectuales'
  },
  tecnica: {
    label: 'Técnica',
    color: '#8b5cf6',
    icon: 'pi pi-cog',
    description: 'Conocimiento técnico específico de la carrera'
  },
  proyectiva: {
    label: 'Proyectiva',
    color: '#f97316',
    icon: 'pi pi-chart-bar',
    description: 'Proyección profesional y visión de carrera'
  }
};

// ─── Egresado ────────────────────────────────────────────────────────────────
export interface CertificadoEgresado {
  id?: string;
  nombre: string;
  url: string;
  verificado?: boolean;
}

export interface Educacion {
  institucion: string;
  grado:       string;
  periodo:     string;
  descripcion?: string;
}

export interface Egresado {
  id:                       string;
  cve_alumno:               string;
  matricula:                string;
  nombre:                   string;
  apellido_paterno:         string;
  apellido_materno:         string;
  carrera:                  string;
  abreviatura_carrera:      string;
  periodo_egreso:           string;
  email?:                   string;
  telefono?:                string;
  scores?:                  DimensionScores;
  evaluaciones_completadas: DimensionType[];
  cv_url?:                  string;
  certificados:             CertificadoEgresado[];
  datos_confirmados:        boolean;
  foto_url?:                string;
  trayectoria:              Educacion[];
}

export function egresadoNombreCompleto(e: Egresado): string {
  return `${e.nombre} ${e.apellido_paterno} ${e.apellido_materno}`;
}

// ─── Vacante ─────────────────────────────────────────────────────────────────
export interface Vacante {
  id:                 string;
  empresa_id:         string;
  empresa_nombre:     string;
  empresa_logo?:      string;
  puesto:             string;
  descripcion:        string;
  area:               string;
  ubicacion:          string;
  zona_norte:         boolean;
  perfil_ideal:       DimensionScores;
  fecha_publicacion:  string;
  activa:             boolean;
  salario_rango?:     string;
  modalidad:          'presencial' | 'remoto' | 'hibrido';
  coincidencia?:      number;
}

export interface VacanteNacional {
  id:                 string;
  puesto:             string;
  empresa:            string;
  empresa_logo?:      string;
  ubicacion:          string;
  salario?:           string;
  fuente:             string;
  url_externa:        string;
  descripcion:        string;
  fecha_publicacion:  string;
}

// ─── Empresa ─────────────────────────────────────────────────────────────────
export type TipoConvenio   = 'automatico' | 'contratacion' | 'solicitud' | 'ninguno';
export type EstatusConvenio = 'activo' | 'por_vencer' | 'pendiente' | 'inactivo';
export type ZonaEmpresa    = 'norte' | 'sur' | 'centro';

export interface Empresa {
  id:                  string;
  nombre:              string;
  rfc:                 string;
  zona:                ZonaEmpresa;
  tipo_convenio:       TipoConvenio;
  estatus_convenio:    EstatusConvenio;
  contacto_nombre:     string;
  contacto_email:      string;
  contacto_telefono?:  string;
  fecha_convenio?:     string;
  logo_url?:           string;
  giro?:               string;
}

// ─── Postulación ─────────────────────────────────────────────────────────────
export type EstatusPostulacion = 'enviada' | 'en_revision' | 'entrevista' | 'aceptada' | 'rechazada' | 'contratado';

export interface Postulacion {
  id:                string;
  egresado_id:       string;
  egresado_nombre?:  string;
  vacante_id:        string;
  empresa_nombre:    string;
  puesto:            string;
  fecha_postulacion: string;
  estatus:           EstatusPostulacion;
  coincidencia:      number;
}

// ─── Solicitud de Convenio ───────────────────────────────────────────────────
export type EstatusSolicitud = 'pendiente' | 'en_proceso' | 'aprobada' | 'rechazada' | 'formalizada';

export interface SolicitudConvenio {
  id:                 string;
  empresa_nombre:     string;
  rfc:                string;
  contacto_nombre:    string;
  contacto_email:     string;
  contacto_telefono:  string;
  zona:               string;
  giro:               string;
  fecha_solicitud:    string;
  estatus:            EstatusSolicitud;
  motivo?:            string;
}

// ─── Evaluación ──────────────────────────────────────────────────────────────
export interface OpcionRespuesta {
  id:    string;
  texto: string;
  valor: number;
}

export interface Pregunta {
  id:        string;
  dimension: DimensionType;
  texto:     string;
  opciones:  OpcionRespuesta[];
  carrera?:  string;
}

export interface SesionEvaluacion {
  dimension:         DimensionType;
  pregunta_actual:   number;
  respuestas:        Record<string, string>;
  completada:        boolean;
  puntaje_obtenido?: number;
}

// ─── KPIs & Reportes ─────────────────────────────────────────────────────────
export interface KpiDashboard {
  egresados_registrados: number;
  tasa_insercion:        number;
  empresas_convenio:     number;
  vacantes_activas:      number;
}

export interface InsercionCarrera {
  carrera:         string;
  abreviatura:     string;
  total_egresados: number;
  insertados:      number;
  tasa:            number;
}

export interface CompetenciaDemandada {
  dimension:  DimensionType;
  label:      string;
  demanda:    number;
  promedio:   number;
}
