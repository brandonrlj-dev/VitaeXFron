import { Pregunta } from '../../core/models';

const ESCALA_PSICOMETRICA = [
  { id: '1', texto: 'Totalmente en desacuerdo', valor: 1 },
  { id: '2', texto: 'En desacuerdo', valor: 2 },
  { id: '3', texto: 'Neutral', valor: 3 },
  { id: '4', texto: 'De acuerdo', valor: 4 },
  { id: '5', texto: 'Totalmente de acuerdo', valor: 5 },
];

const ESCALA_COGNITIVA = [
  { id: '1', texto: 'Muy bajo', valor: 1 },
  { id: '2', texto: 'Bajo', valor: 2 },
  { id: '3', texto: 'Medio', valor: 3 },
  { id: '4', texto: 'Alto', valor: 4 },
  { id: '5', texto: 'Muy alto', valor: 5 },
];

const ESCALA_TECNICA = [
  { id: '1', texto: 'No lo domino', valor: 1 },
  { id: '2', texto: 'Nivel bajo', valor: 2 },
  { id: '3', texto: 'Nivel medio', valor: 3 },
  { id: '4', texto: 'Nivel alto', valor: 4 },
  { id: '5', texto: 'Nivel avanzado', valor: 5 },
];

const ESCALA_SJT = [
  { id: '1', texto: 'Muy inadecuada', valor: 1 },
  { id: '2', texto: 'Inadecuada', valor: 2 },
  { id: '3', texto: 'Regular', valor: 3 },
  { id: '4', texto: 'Adecuada', valor: 4 },
  { id: '5', texto: 'Muy adecuada', valor: 5 },
];

export const BANCO_PREGUNTAS: Record<string, any> = {
  'Tecnologías de la Información': {
    psicometrica: [
      { id: 'ti_ps1', dimension: 'psicometrica', texto: 'Entrego mis actividades en la fecha establecida.', opciones: ESCALA_PSICOMETRICA },
      { id: 'ti_ps2', dimension: 'psicometrica', texto: 'Reviso cuidadosamente mi trabajo antes de entregarlo.', opciones: ESCALA_PSICOMETRICA },
      { id: 'ti_ps3', dimension: 'psicometrica', texto: 'Me adapto fácilmente a nuevas herramientas tecnológicas.', opciones: ESCALA_PSICOMETRICA },
      { id: 'ti_ps4', dimension: 'psicometrica', texto: 'Mantengo la calma cuando un sistema presenta errores.', opciones: ESCALA_PSICOMETRICA },
      { id: 'ti_ps5', dimension: 'psicometrica', texto: 'Acepto retroalimentación para mejorar mi trabajo.', opciones: ESCALA_PSICOMETRICA },
      { id: 'ti_ps6', dimension: 'psicometrica', texto: 'Me gusta colaborar con otras personas en proyectos.', opciones: ESCALA_PSICOMETRICA },
      { id: 'ti_ps7', dimension: 'psicometrica', texto: 'Puedo comunicar mis ideas técnicas de manera clara.', opciones: ESCALA_PSICOMETRICA },
      { id: 'ti_ps8', dimension: 'psicometrica', texto: 'Me organizo bien cuando tengo varias tareas pendientes.', opciones: ESCALA_PSICOMETRICA },
      { id: 'ti_ps9', dimension: 'psicometrica', texto: 'Busco soluciones creativas ante problemas técnicos.', opciones: ESCALA_PSICOMETRICA },
      { id: 'ti_ps10', dimension: 'psicometrica', texto: 'Mantengo una actitud profesional cuando trabajo bajo presión.', opciones: ESCALA_PSICOMETRICA },
    ],
    cognitiva: [
      { id: 'ti_cg1', dimension: 'cognitiva', texto: 'Identifico patrones en problemas lógicos.', opciones: ESCALA_COGNITIVA },
      { id: 'ti_cg2', dimension: 'cognitiva', texto: 'Puedo resolver problemas nuevos sin recibir instrucciones completas.', opciones: ESCALA_COGNITIVA },
      { id: 'ti_cg3', dimension: 'cognitiva', texto: 'Comprendo diagramas, tablas o estructuras de información.', opciones: ESCALA_COGNITIVA },
      { id: 'ti_cg4', dimension: 'cognitiva', texto: 'Aprendo rápidamente el funcionamiento de una nueva plataforma.', opciones: ESCALA_COGNITIVA },
      { id: 'ti_cg5', dimension: 'cognitiva', texto: 'Puedo analizar varias posibles soluciones antes de decidir.', opciones: ESCALA_COGNITIVA },
      { id: 'ti_cg6', dimension: 'cognitiva', texto: 'Se me facilita interpretar instrucciones técnicas.', opciones: ESCALA_COGNITIVA },
      { id: 'ti_cg7', dimension: 'cognitiva', texto: 'Puedo detectar errores en una secuencia de pasos.', opciones: ESCALA_COGNITIVA },
      { id: 'ti_cg8', dimension: 'cognitiva', texto: 'Comprendo textos técnicos relacionados con software o sistemas.', opciones: ESCALA_COGNITIVA },
      { id: 'ti_cg9', dimension: 'cognitiva', texto: 'Puedo resolver problemas básicos de lógica matemática.', opciones: ESCALA_COGNITIVA },
      { id: 'ti_cg10', dimension: 'cognitiva', texto: 'Trabajo bien cuando tengo poco tiempo para resolver un problema.', opciones: ESCALA_COGNITIVA },
    ],
    tecnica: [
      { id: 'ti_tc1', dimension: 'tecnica', texto: 'Programación básica.', opciones: ESCALA_TECNICA },
      { id: 'ti_tc2', dimension: 'tecnica', texto: 'Desarrollo web.', opciones: ESCALA_TECNICA },
      { id: 'ti_tc3', dimension: 'tecnica', texto: 'Manejo de bases de datos.', opciones: ESCALA_TECNICA },
      { id: 'ti_tc4', dimension: 'tecnica', texto: 'Uso de Git o GitHub.', opciones: ESCALA_TECNICA },
      { id: 'ti_tc5', dimension: 'tecnica', texto: 'Consumo de APIs.', opciones: ESCALA_TECNICA },
      { id: 'ti_tc6', dimension: 'tecnica', texto: 'Resolución de errores de software.', opciones: ESCALA_TECNICA },
      { id: 'ti_tc7', dimension: 'tecnica', texto: 'Seguridad informática básica.', opciones: ESCALA_TECNICA },
      { id: 'ti_tc8', dimension: 'tecnica', texto: 'Diseño de interfaces de usuario.', opciones: ESCALA_TECNICA },
      { id: 'ti_tc9', dimension: 'tecnica', texto: 'Documentación técnica.', opciones: ESCALA_TECNICA },
      { id: 'ti_tc10', dimension: 'tecnica', texto: 'Análisis de requerimientos de software.', opciones: ESCALA_TECNICA },
    ],
    proyectiva: [
      { id: 'ti_pr1', dimension: 'proyectiva', texto: 'Si mi código falla antes de una entrega, reviso el error, identifico la causa y documento la solución.', opciones: ESCALA_SJT },
      { id: 'ti_pr2', dimension: 'proyectiva', texto: 'Si no entiendo un requerimiento, pregunto antes de desarrollar algo incorrecto.', opciones: ESCALA_SJT },
      { id: 'ti_pr3', dimension: 'proyectiva', texto: 'Si un compañero comete un error en el proyecto, lo apoyo y revisamos juntos la solución.', opciones: ESCALA_SJT },
      { id: 'ti_pr4', dimension: 'proyectiva', texto: 'Si encuentro una vulnerabilidad en el sistema, la reporto al responsable.', opciones: ESCALA_SJT },
      { id: 'ti_pr5', dimension: 'proyectiva', texto: 'Si el proyecto se atrasa, ayudo a priorizar las funciones más importantes.', opciones: ESCALA_SJT },
      { id: 'ti_pr6', dimension: 'proyectiva', texto: 'Si recibo una crítica sobre mi trabajo, la tomo como oportunidad de mejora.', opciones: ESCALA_SJT },
      { id: 'ti_pr7', dimension: 'proyectiva', texto: 'Si una tarea es urgente, mantengo la calma y organizo los pasos a seguir.', opciones: ESCALA_SJT },
      { id: 'ti_pr8', dimension: 'proyectiva', texto: 'Si un usuario reporta un problema, escucho, registro el caso y busco una solución.', opciones: ESCALA_SJT },
      { id: 'ti_pr9', dimension: 'proyectiva', texto: 'Si detecto información sensible expuesta, evito compartirla y aviso al equipo.', opciones: ESCALA_SJT },
      { id: 'ti_pr10', dimension: 'proyectiva', texto: 'Si tengo dudas sobre una tecnología, investigo antes de improvisar.', opciones: ESCALA_SJT },
    ],
  },
  'Procesos Alimentarios': {
    psicometrica: [
      { id: 'pa_ps1', dimension: 'psicometrica', texto: 'Sigo instrucciones de producción con cuidado.', opciones: ESCALA_PSICOMETRICA },
      { id: 'pa_ps2', dimension: 'psicometrica', texto: 'Mantengo limpia y ordenada mi área de trabajo.', opciones: ESCALA_PSICOMETRICA },
      { id: 'pa_ps3', dimension: 'psicometrica', texto: 'Cumplo con los tiempos establecidos en mis actividades.', opciones: ESCALA_PSICOMETRICA },
      { id: 'pa_ps4', dimension: 'psicometrica', texto: 'Me adapto fácilmente a nuevos procesos alimentarios.', opciones: ESCALA_PSICOMETRICA },
      { id: 'pa_ps5', dimension: 'psicometrica', texto: 'Mantengo la calma cuando hay presión en producción.', opciones: ESCALA_PSICOMETRICA },
      { id: 'pa_ps6', dimension: 'psicometrica', texto: 'Trabajo bien con otras personas.', opciones: ESCALA_PSICOMETRICA },
      { id: 'pa_ps7', dimension: 'psicometrica', texto: 'Acepto correcciones para mejorar mi desempeño.', opciones: ESCALA_PSICOMETRICA },
      { id: 'pa_ps8', dimension: 'psicometrica', texto: 'Respeto las normas de higiene y seguridad.', opciones: ESCALA_PSICOMETRICA },
      { id: 'pa_ps9', dimension: 'psicometrica', texto: 'Soy cuidadoso al revisar la calidad de un producto.', opciones: ESCALA_PSICOMETRICA },
      { id: 'pa_ps10', dimension: 'psicometrica', texto: 'Mantengo una actitud responsable al manipular alimentos.', opciones: ESCALA_PSICOMETRICA },
    ],
    cognitiva: [
      { id: 'pa_cg1', dimension: 'cognitiva', texto: 'Comprendo instrucciones técnicas relacionadas con procesos alimentarios.', opciones: ESCALA_COGNITIVA },
      { id: 'pa_cg2', dimension: 'cognitiva', texto: 'Puedo identificar errores en una secuencia de producción.', opciones: ESCALA_COGNITIVA },
      { id: 'pa_cg3', dimension: 'cognitiva', texto: 'Se me facilita aprender nuevos procedimientos de trabajo.', opciones: ESCALA_COGNITIVA },
      { id: 'pa_cg4', dimension: 'cognitiva', texto: 'Puedo analizar la causa de un producto defectuoso.', opciones: ESCALA_COGNITIVA },
      { id: 'pa_cg5', dimension: 'cognitiva', texto: 'Comprendo tablas de temperatura, tiempo o cantidades.', opciones: ESCALA_COGNITIVA },
      { id: 'pa_cg6', dimension: 'cognitiva', texto: 'Puedo resolver problemas básicos de cálculo de ingredientes.', opciones: ESCALA_COGNITIVA },
      { id: 'pa_cg7', dimension: 'cognitiva', texto: 'Identifico patrones en fallas de producción.', opciones: ESCALA_COGNITIVA },
      { id: 'pa_cg8', dimension: 'cognitiva', texto: 'Puedo tomar decisiones rápidas ante un problema de calidad.', opciones: ESCALA_COGNITIVA },
      { id: 'pa_cg9', dimension: 'cognitiva', texto: 'Comprendo normas básicas de higiene e inocuidad.', opciones: ESCALA_COGNITIVA },
      { id: 'pa_cg10', dimension: 'cognitiva', texto: 'Puedo explicar un procedimiento alimentario de forma clara.', opciones: ESCALA_COGNITIVA },
    ],
    tecnica: [
      { id: 'pa_tc1', dimension: 'tecnica', texto: 'Buenas prácticas de higiene.', opciones: ESCALA_TECNICA },
      { id: 'pa_tc2', dimension: 'tecnica', texto: 'Manejo seguro de alimentos.', opciones: ESCALA_TECNICA },
      { id: 'pa_tc3', dimension: 'tecnica', texto: 'Control de temperaturas.', opciones: ESCALA_TECNICA },
      { id: 'pa_tc4', dimension: 'tecnica', texto: 'Limpieza y sanitización de áreas.', opciones: ESCALA_TECNICA },
      { id: 'pa_tc5', dimension: 'tecnica', texto: 'Uso correcto de equipo de producción.', opciones: ESCALA_TECNICA },
      { id: 'pa_tc6', dimension: 'tecnica', texto: 'Manejo de materia prima.', opciones: ESCALA_TECNICA },
      { id: 'pa_tc7', dimension: 'tecnica', texto: 'Control de calidad del producto.', opciones: ESCALA_TECNICA },
      { id: 'pa_tc8', dimension: 'tecnica', texto: 'Identificación de riesgos de contaminación.', opciones: ESCALA_TECNICA },
      { id: 'pa_tc9', dimension: 'tecnica', texto: 'Registro de tiempos, cantidades y temperaturas.', opciones: ESCALA_TECNICA },
      { id: 'pa_tc10', dimension: 'tecnica', texto: 'Elaboración de reportes de producción.', opciones: ESCALA_TECNICA },
    ],
    proyectiva: [
      { id: 'pa_pr1', dimension: 'proyectiva', texto: 'Si un alimento estuvo fuera de temperatura segura, lo reporto y evito usarlo hasta verificar su estado.', opciones: ESCALA_SJT },
      { id: 'pa_pr2', dimension: 'proyectiva', texto: 'Si un producto tiene olor, color o textura diferente, reviso materia prima, proceso y almacenamiento.', opciones: ESCALA_SJT },
      { id: 'pa_pr3', dimension: 'proyectiva', texto: 'Si un compañero no sigue una norma de higiene, lo corrijo de forma respetuosa.', opciones: ESCALA_SJT },
      { id: 'pa_pr4', dimension: 'proyectiva', texto: 'Si una máquina presenta fallas, detengo su uso si representa riesgo y aviso al responsable.', opciones: ESCALA_SJT },
      { id: 'pa_pr5', dimension: 'proyectiva', texto: 'Si hay mucha merma en una producción, registro el problema y reviso posibles causas.', opciones: ESCALA_SJT },
      { id: 'pa_pr6', dimension: 'proyectiva', texto: 'Si recibo una corrección sobre mi técnica, la aplico para mejorar la calidad del producto.', opciones: ESCALA_SJT },
      { id: 'pa_pr7', dimension: 'proyectiva', texto: 'Si falta materia prima, aviso antes de alterar la fórmula o receta.', opciones: ESCALA_SJT },
      { id: 'pa_pr8', dimension: 'proyectiva', texto: 'Si detecto contaminación cruzada, detengo el proceso y reporto la situación.', opciones: ESCALA_SJT },
      { id: 'pa_pr9', dimension: 'proyectiva', texto: 'Si hay presión por terminar rápido, mantengo las normas de higiene aunque tome más tiempo.', opciones: ESCALA_SJT },
      { id: 'pa_pr10', dimension: 'proyectiva', texto: 'Si un lote no cumple con la calidad esperada, evito liberarlo sin autorización.', opciones: ESCALA_SJT },
    ],
  }
};
