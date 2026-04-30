import {
  CompetenciaDemandada,
  DimensionScores,
  DimensionType,
  Educacion,
  Egresado,
  Empresa,
  ExperienciaLaboral,
  InsercionCarrera,
  KpiDashboard,
  Mensaje,
  OpcionRespuesta,
  Postulacion,
  Pregunta,
  SolicitudConvenio,
  Vacante,
  VacanteNacional,
} from '../models';

const DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];

function id(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boolFromEstado(estado: unknown): boolean {
  return ['activo', 'publicada', true].includes(estado as any);
}

function fecha(value: unknown): string {
  if (!value) return '';
  return String(value).split('T')[0];
}

function initials(text: string): string {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase())
    .join('')
    .slice(0, 4);
}

function zonaFrontend(zona: unknown): 'norte' | 'centro' | 'sur' {
  return zona === 'norte_nayarit' || zona === 'norte' ? 'norte' : 'centro';
}

function zonaBackend(zona: unknown): boolean {
  return zona === 'norte_nayarit' || zona === 'norte';
}

function carreraClave(row: any): string {
  return row.abreviatura_carrera
    ?? row.clave_oficial
    ?? initials(row.carrera ?? row.nombre_carrera ?? '');
}

function salario(minimo: unknown, maximo: unknown): string | undefined {
  const min = num(minimo);
  const max = num(maximo);
  if (!min && !max) return undefined;
  if (min && max) return `$${min.toLocaleString('es-MX')} - $${max.toLocaleString('es-MX')} MXN`;
  return `$${(min || max).toLocaleString('es-MX')} MXN`;
}

export function mapScores(row: any): DimensionScores {
  return {
    psicometrica: num(row?.puntaje_psicometrica),
    cognitiva: num(row?.puntaje_cognitiva),
    tecnica: num(row?.puntaje_tecnica),
    proyectiva: num(row?.puntaje_proyectiva),
  };
}

export function mapCompleted(row: any): DimensionType[] {
  return DIMS.filter(dim => row?.[`puntaje_${dim}`] !== null && row?.[`puntaje_${dim}`] !== undefined);
}

export function mapTrayectoria(row: any): Educacion {
  const inicio = row.fecha_inicio ? String(row.fecha_inicio).slice(0, 7) : '';
  const fin = row.fecha_fin ? String(row.fecha_fin).slice(0, 7) : 'Actualidad';
  return {
    id: id(row.cve_trayectoria_academica ?? row.id),
    institucion: row.institucion ?? '',
    programa: row.programa,
    grado: row.grado ?? '',
    periodo: inicio ? `${inicio} — ${fin}` : (row.periodo ?? ''),
    fecha_inicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin,
    promedio: row.promedio != null ? Number(row.promedio) : undefined,
    descripcion: row.descripcion,
  };
}

export function mapExperiencia(row: any): ExperienciaLaboral {
  return {
    empresa: row.empresa ?? '',
    puesto: row.puesto ?? row.cargo ?? '',
    descripcion: row.descripcion,
    fecha_inicio: row.fecha_inicio ?? '',
    fecha_fin: row.fecha_fin,
    trabajo_actual: Boolean(row.trabajo_actual ?? !row.fecha_fin),
  };
}

export function mapMensaje(row: any): Mensaje {
  return {
    id: id(row.cve_mensaje ?? row.id),
    postulacion_id: id(row.cve_postulacion ?? row.postulacion_id),
    tipo_emisor: row.tipo_emisor ?? 'empresa',
    mensaje: row.mensaje ?? '',
    leido: Boolean(row.leido),
    fecha_envio: row.fecha_envio ?? '',
    vacante: row.vacante,
    nombre_contacto: [row.nombre, row.primer_apellido, row.segundo_apellido].filter(Boolean).join(' ') || undefined,
    cve_vacante: row.cve_vacante ? id(row.cve_vacante) : undefined,
  };
}

export function mapEgresado(row: any): Egresado {
  const scores = mapScores(row);
  return {
    id: id(row.cve_egresado ?? row.id),
    cve_alumno: id(row.cve_alumno_externa ?? row.cve_alumno ?? row.matricula),
    matricula: id(row.matricula),
    nombre: row.nombre ?? '',
    apellido_paterno: row.primer_apellido ?? row.apellido_paterno ?? '',
    apellido_materno: row.segundo_apellido ?? row.apellido_materno ?? '',
    carrera: row.carrera ?? row.nombre_carrera ?? '',
    abreviatura_carrera: carreraClave(row),
    periodo_egreso: row.periodo_egreso ?? (row.anio_egreso ? String(row.anio_egreso) : ''),
    email: row.correo_personal ?? row.correo_institucional ?? row.email,
    telefono: row.telefono,
    scores,
    evaluaciones_completadas: mapCompleted(row),
    cv_url: row.url_cv ?? row.cv_url,
    certificados: (row.certificados ?? []).map(mapCertificado),
    datos_confirmados: row.datos_confirmados ?? true,
    foto_url: row.url_foto ?? row.foto_url,
    trayectoria: (row.trayectoria ?? []).map(mapTrayectoria),
    experiencia_laboral: (row.experiencia_laboral ?? []).map(mapExperiencia),
  };
}

export function mapCertificado(row: any) {
  return {
    id: id(row.cve_documento_egresado ?? row.id),
    nombre: row.nombre_archivo ?? row.nombre ?? 'Documento',
    url: row.url_documento ?? row.url ?? '',
    verificado: Boolean(row.verificado),
  };
}

export function mapVacante(row: any): Vacante {
  const empresaNombre = row.nombre_comercial || row.razon_social || row.empresa_nombre || row.empresa || '';
  return {
    id: id(row.cve_vacante ?? row.id),
    empresa_id: id(row.cve_empresa ?? row.empresa_id),
    empresa_nombre: empresaNombre,
    empresa_logo: row.url_foto_empresa ?? row.empresa_logo,
    puesto: row.titulo ?? row.puesto ?? '',
    descripcion: row.descripcion ?? '',
    area: row.area ?? '',
    ubicacion: [row.localidad, row.municipio, row.estado_ubicacion].filter(Boolean).join(', ') || row.ubicacion || 'Mexico',
    zona_norte: zonaBackend(row.zona),
    perfil_ideal: {
      psicometrica: num(row.peso_psicometrica ?? row.puntaje_psicometrica, 25),
      cognitiva: num(row.peso_cognitiva ?? row.puntaje_cognitiva, 25),
      tecnica: num(row.peso_tecnica ?? row.puntaje_tecnica, 25),
      proyectiva: num(row.peso_proyectiva ?? row.puntaje_proyectiva, 25),
    },
    fecha_publicacion: fecha(row.fecha_publicacion),
    fecha_cierre: fecha(row.fecha_cierre),
    activa: row.activa ?? row.estado === 'publicada',
    salario_rango: row.salario_rango ?? salario(row.salario_minimo, row.salario_maximo),
    modalidad: row.modalidad ?? 'presencial',
    coincidencia: row.porcentaje_coincidencia !== undefined ? num(row.porcentaje_coincidencia) : undefined,
    postulaciones_count: num(row.postulaciones_count ?? row.total_postulaciones ?? row.total_postulacion),
    contratados_count: num(row.contratados_count ?? row.total_contratados ?? row.total_contratado),
    cobertura_dias: num(row.cobertura_dias ?? row.tiempo_promedio_cobertura_dias ?? row.dias_promedio_cobertura),
    preguntas_tecnicas: row.preguntas_tecnicas ?? row.preguntas ?? [],
  };
}

export function vacanteToApi(vacante: Partial<Vacante>): any {
  return {
    cve_empresa: vacante.empresa_id,
    titulo: vacante.puesto,
    descripcion: vacante.descripcion,
    area: vacante.area,
    ubicacion: vacante.ubicacion,
    modalidad: vacante.modalidad,
    salario_rango: vacante.salario_rango,
    fecha_cierre: vacante.fecha_cierre,
    estado: vacante.activa === false ? 'cancelada' : 'publicada',
    perfil_idoneo: vacante.perfil_ideal ? perfilToApi(vacante.perfil_ideal) : undefined,
    preguntas_tecnicas: vacante.preguntas_tecnicas,
  };
}

export function perfilToApi(scores: DimensionScores): any {
  return {
    puntaje_psicometrica: scores.psicometrica,
    puntaje_cognitiva: scores.cognitiva,
    puntaje_tecnica: scores.tecnica,
    puntaje_proyectiva: scores.proyectiva,
    peso_psicometrica: scores.psicometrica,
    peso_cognitiva: scores.cognitiva,
    peso_tecnica: scores.tecnica,
    peso_proyectiva: scores.proyectiva,
  };
}

export function mapVacanteNacional(row: any): VacanteNacional {
  const rawUrl = row.url_original ?? row.url_externa ?? '';
  const url = rawUrl === '' || rawUrl === '#'
    ? '#'
    : rawUrl.startsWith('http') ? rawUrl : 'https://' + rawUrl;

  return {
    id: id(row.cve_vacante_api ?? row.id),
    puesto: row.titulo ?? row.puesto ?? '',
    empresa: row.empresa_externa ?? row.empresa ?? '',
    empresa_logo: row.empresa_logo,
    ubicacion: row.ubicacion_texto ?? row.ubicacion ?? 'México',
    salario: row.salario ?? salario(row.salario_minimo, row.salario_maximo),
    fuente: row.fuente ?? row.fuente_nombre ?? 'Vacante externa',
    url_externa: url,
    descripcion: row.descripcion ?? '',
    fecha_publicacion: fecha(row.fecha_publicacion ?? row.fecha_obtencion),
  };
}

export function mapEmpresa(row: any): Empresa {
  return {
    id: id(row.cve_empresa ?? row.id),
    nombre: row.nombre_comercial || row.razon_social || row.nombre || '',
    rfc: row.rfc ?? '',
    zona: zonaFrontend(row.zona),
    tipo_convenio: row.tipo_convenio ?? (zonaBackend(row.zona) ? 'automatico' : 'ninguno'),
    estatus_convenio: row.estatus_convenio ?? 'pendiente',
    contacto_nombre: row.contacto_nombre ?? row.nombre_contacto ?? '',
    contacto_email: row.contacto_email ?? row.correo_general ?? '',
    contacto_telefono: row.contacto_telefono ?? row.telefono_general,
    fecha_convenio: fecha(row.fecha_convenio),
    logo_url: row.url_foto ?? row.logo_url,
    giro: row.sector ?? row.giro,
  };
}

export function mapSolicitud(row: any): SolicitudConvenio {
  const estadoMap: Record<string, string> = {
    en_revision: 'en_proceso',
    formalizada: 'formalizada',
    aprobada:    'aprobada',
    rechazada:   'rechazada',
    pendiente:   'pendiente',
  };
  const estatus = estadoMap[row.estado ?? ''] ?? (row.estado ?? 'pendiente');
  return {
    id: id(row.cve_solicitud_convenio ?? row.id),
    empresa_nombre: row.empresa_nombre ?? row.razon_social ?? '',
    rfc: row.rfc ?? '',
    contacto_nombre: row.contacto_nombre ?? '',
    contacto_email: row.contacto_email ?? '',
    contacto_telefono: row.contacto_telefono ?? '',
    zona: zonaFrontend(row.zona),
    giro: row.giro ?? row.sector ?? '',
    sector: row.sector,
    municipio: row.municipio,
    estado: row.estado_ubicacion ?? row.estado_entidad ?? row.estado,
    mensaje: row.mensaje,
    fecha_solicitud: fecha(row.fecha_solicitud),
    estatus: estatus as any,
    motivo: row.motivo ?? row.observacion,
  };
}

export function solicitudToApi(solicitud: Partial<SolicitudConvenio>): any {
  return {
    ...solicitud,
    zona: solicitud.zona === 'norte' ? 'norte_nayarit' : 'nacional',
    estado: solicitud.estatus === 'en_proceso' ? 'en_revision' : (solicitud.estatus ?? 'pendiente'),
    sector: solicitud.sector,
    municipio: solicitud.municipio,
    estado_ubicacion: solicitud.estado,
    mensaje: solicitud.mensaje,
  };
}

export function mapPostulacion(row: any): Postulacion {
  const nombre = [row.nombre, row.primer_apellido, row.segundo_apellido].filter(Boolean).join(' ');
  const estatusMap: Record<string, Postulacion['estatus']> = {
    postulado: 'enviada',
    en_revision: 'en_revision',
    seleccionado: 'aceptada',
    rechazado: 'rechazada',
    contratado: 'contratado',
  };
  const estado = row.estado ?? row.estatus ?? 'postulado';
  return {
    id: id(row.cve_postulacion ?? row.id),
    egresado_id: id(row.cve_egresado ?? row.egresado_id),
    egresado_nombre: row.egresado_nombre ?? nombre,
    vacante_id: id(row.cve_vacante ?? row.vacante_id),
    empresa_nombre: row.nombre_comercial || row.empresa || row.razon_social || row.empresa_nombre || '',
    puesto: row.vacante ?? row.titulo ?? row.puesto ?? '',
    fecha_postulacion: fecha(row.fecha_postulacion),
    estatus: estatusMap[estado] ?? estado,
    coincidencia: num(row.porcentaje_coincidencia ?? row.coincidencia),
  };
}

export function mapPregunta(row: any, dimension: DimensionType): Pregunta {
  const opcionesRaw = typeof row.opciones === 'string' ? JSON.parse(row.opciones) : (row.opciones ?? []);
  return {
    id: id(row.cve_pregunta ?? row.id),
    dimension,
    texto: row.texto ?? '',
    opciones: opcionesRaw.map((opcion: any): OpcionRespuesta => ({
      id: id(opcion.cve_opcion_respuesta ?? opcion.id),
      texto: opcion.texto ?? '',
      valor: opcion.valor !== undefined && opcion.valor !== null ? num(opcion.valor) : undefined,
    })),
    carrera: row.carrera,
    prueba_id: row.cve_prueba ? id(row.cve_prueba) : undefined,
  };
}

export function mapInsercion(row: any): InsercionCarrera {
  return {
    carrera: row.carrera ?? '',
    abreviatura: carreraClave({ carrera: row.carrera, abreviatura_carrera: row.abreviatura }),
    total_egresados: num(row.total_egresado_registrado ?? row.total_egresados),
    insertados: num(row.total_contratado ?? row.insertados),
    tasa: num(row.porcentaje_insercion_laboral ?? row.tasa),
  };
}

export function mapCompetencia(row: any): CompetenciaDemandada {
  return {
    dimension: (row.dimension ?? row.tipo) as DimensionType,
    label: row.label ?? row.nombre ?? '',
    demanda: num(row.demanda ?? row.total_vacante_solicita),
    promedio: num(row.promedio ?? row.promedio_nivel_requerido),
  };
}

export function buildKpis(args: {
  egresados: Egresado[];
  empresas: Empresa[];
  vacantes: Vacante[];
  insercion: InsercionCarrera[];
}): KpiDashboard {
  const totalEgresados = args.egresados.length;
  const tasaInsercion = args.insercion.length
    ? Math.round(args.insercion.reduce((sum, item) => sum + item.tasa, 0) / args.insercion.length)
    : 0;

  return {
    egresados_registrados: totalEgresados,
    tasa_insercion: tasaInsercion,
    empresas_convenio: args.empresas.filter(e => e.estatus_convenio === 'activo' || e.estatus_convenio === 'por_vencer').length,
    vacantes_activas: args.vacantes.filter(v => v.activa).length,
  };
}
