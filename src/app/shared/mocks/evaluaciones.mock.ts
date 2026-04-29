import { Pregunta } from '../../core/models';

export const PREGUNTAS_PSICOMETRICA: Pregunta[] = [
  {
    id: 'ps1',
    dimension: 'psicometrica',
    texto: '¿Cómo reaccionas generalmente cuando te enfrentas a un plazo de entrega muy ajustado?',
    opciones: [
      { id: 'a', texto: 'Me organizo inmediatamente y divido el trabajo en partes manejables', valor: 4 },
      { id: 'b', texto: 'Me estreso pero finalmente encuentro una solución', valor: 3 },
      { id: 'c', texto: 'Pido ayuda a mis compañeros para distribuir la carga', valor: 2 },
      { id: 'd', texto: 'Trabajo bajo presión sin mayor planificación', valor: 1 },
    ],
  },
  {
    id: 'ps2',
    dimension: 'psicometrica',
    texto: 'En un equipo de trabajo, ¿qué rol asumes naturalmente?',
    opciones: [
      { id: 'a', texto: 'Líder: tomo la iniciativa y coordino al equipo', valor: 4 },
      { id: 'b', texto: 'Colaborador: apoyo activamente las decisiones del grupo', valor: 3 },
      { id: 'c', texto: 'Especialista: me enfoco en mis responsabilidades específicas', valor: 2 },
      { id: 'd', texto: 'Mediador: resuelvo conflictos entre los miembros', valor: 3 },
    ],
  },
  {
    id: 'ps3',
    dimension: 'psicometrica',
    texto: 'Cuando cometes un error significativo en el trabajo, ¿cuál es tu primera reacción?',
    opciones: [
      { id: 'a', texto: 'Analizo la causa, tomo responsabilidad y propongo una solución', valor: 4 },
      { id: 'b', texto: 'Me disculpo con los involucrados y corrijo lo antes posible', valor: 3 },
      { id: 'c', texto: 'Siento frustración pero me recupero rápido', valor: 2 },
      { id: 'd', texto: 'Me preocupo mucho y necesito tiempo para retomar el ritmo', valor: 1 },
    ],
  },
  {
    id: 'ps4',
    dimension: 'psicometrica',
    texto: '¿Con qué frecuencia buscas aprender nuevas habilidades fuera de tu área de trabajo?',
    opciones: [
      { id: 'a', texto: 'Constantemente: dedico tiempo semanal a aprender algo nuevo', valor: 4 },
      { id: 'b', texto: 'Con frecuencia: cuando hay oportunidades disponibles', valor: 3 },
      { id: 'c', texto: 'Ocasionalmente: cuando el trabajo me lo exige', valor: 2 },
      { id: 'd', texto: 'Rara vez: prefiero dominar lo que ya sé', valor: 1 },
    ],
  },
  {
    id: 'ps5',
    dimension: 'psicometrica',
    texto: 'Ante un cambio importante en los procedimientos de tu trabajo, ¿cómo respondes?',
    opciones: [
      { id: 'a', texto: 'Lo acepto con apertura y me adapto con entusiasmo', valor: 4 },
      { id: 'b', texto: 'Lo acepto aunque al principio me genera incertidumbre', valor: 3 },
      { id: 'c', texto: 'Lo analizo antes de decidir si lo acepto', valor: 2 },
      { id: 'd', texto: 'Me resulta difícil cambiar mis rutinas de trabajo', valor: 1 },
    ],
  },
];

export const PREGUNTAS_COGNITIVA: Pregunta[] = [
  {
    id: 'cg1',
    dimension: 'cognitiva',
    texto: 'Si una serie sigue el patrón: 2, 6, 18, 54, ___. ¿Cuál es el siguiente número?',
    opciones: [
      { id: 'a', texto: '108', valor: 1 },
      { id: 'b', texto: '162', valor: 4 },
      { id: 'c', texto: '216', valor: 1 },
      { id: 'd', texto: '144', valor: 1 },
    ],
  },
  {
    id: 'cg2',
    dimension: 'cognitiva',
    texto: 'Un proyecto requiere 8 trabajadores para completarse en 12 días. ¿Cuántos días tardarán 6 trabajadores en completarlo?',
    opciones: [
      { id: 'a', texto: '14 días', valor: 1 },
      { id: 'b', texto: '16 días', valor: 4 },
      { id: 'c', texto: '18 días', valor: 1 },
      { id: 'd', texto: '10 días', valor: 1 },
    ],
  },
  {
    id: 'cg3',
    dimension: 'cognitiva',
    texto: '¿Qué figura completa lógicamente la secuencia? ○ △ □ ○ △ ___',
    opciones: [
      { id: 'a', texto: '○ (círculo)', valor: 1 },
      { id: 'b', texto: '△ (triángulo)', valor: 1 },
      { id: 'c', texto: '□ (cuadrado)', valor: 4 },
      { id: 'd', texto: '◇ (rombo)', valor: 1 },
    ],
  },
  {
    id: 'cg4',
    dimension: 'cognitiva',
    texto: 'Si todos los programadores conocen Python y María conoce Python, ¿cuál es la conclusión correcta?',
    opciones: [
      { id: 'a', texto: 'María es programadora', valor: 1 },
      { id: 'b', texto: 'María puede ser o no programadora', valor: 4 },
      { id: 'c', texto: 'María no es programadora', valor: 1 },
      { id: 'd', texto: 'No se puede determinar nada sobre María', valor: 1 },
    ],
  },
  {
    id: 'cg5',
    dimension: 'cognitiva',
    texto: 'Un servidor procesa 450 solicitudes por minuto. ¿Cuántas solicitudes procesará en 2.5 horas?',
    opciones: [
      { id: 'a', texto: '56,250', valor: 1 },
      { id: 'b', texto: '67,500', valor: 4 },
      { id: 'c', texto: '45,000', valor: 1 },
      { id: 'd', texto: '112,500', valor: 1 },
    ],
  },
];

export const PREGUNTAS_TECNICA: Pregunta[] = [
  {
    id: 'tc1',
    dimension: 'tecnica',
    texto: '¿Cuál de los siguientes es un principio fundamental de la programación orientada a objetos?',
    opciones: [
      { id: 'a', texto: 'Compilación estática', valor: 1 },
      { id: 'b', texto: 'Encapsulamiento', valor: 4 },
      { id: 'c', texto: 'Tipado dinámico', valor: 1 },
      { id: 'd', texto: 'Iteración lineal', valor: 1 },
    ],
  },
  {
    id: 'tc2',
    dimension: 'tecnica',
    texto: 'En una base de datos relacional, ¿qué garantiza la normalización en tercera forma normal (3FN)?',
    opciones: [
      { id: 'a', texto: 'Eliminar duplicados en todas las columnas', valor: 1 },
      { id: 'b', texto: 'Que los atributos no clave dependan únicamente de la clave primaria', valor: 4 },
      { id: 'c', texto: 'Que todas las tablas tengan exactamente una clave foránea', valor: 1 },
      { id: 'd', texto: 'Minimizar el número de tablas', valor: 1 },
    ],
  },
  {
    id: 'tc3',
    dimension: 'tecnica',
    texto: '¿Cuál es la complejidad temporal del algoritmo de búsqueda binaria?',
    opciones: [
      { id: 'a', texto: 'O(n)', valor: 1 },
      { id: 'b', texto: 'O(n²)', valor: 1 },
      { id: 'c', texto: 'O(log n)', valor: 4 },
      { id: 'd', texto: 'O(1)', valor: 1 },
    ],
  },
  {
    id: 'tc4',
    dimension: 'tecnica',
    texto: '¿Qué protocolo se utiliza principalmente para la transferencia segura de datos en la web?',
    opciones: [
      { id: 'a', texto: 'FTP', valor: 1 },
      { id: 'b', texto: 'HTTP', valor: 1 },
      { id: 'c', texto: 'HTTPS/TLS', valor: 4 },
      { id: 'd', texto: 'SMTP', valor: 1 },
    ],
  },
  {
    id: 'tc5',
    dimension: 'tecnica',
    texto: 'En el contexto de APIs REST, ¿qué código HTTP indica que un recurso fue creado exitosamente?',
    opciones: [
      { id: 'a', texto: '200 OK', valor: 1 },
      { id: 'b', texto: '201 Created', valor: 4 },
      { id: 'c', texto: '204 No Content', valor: 1 },
      { id: 'd', texto: '302 Found', valor: 1 },
    ],
  },
];

export const PREGUNTAS_PROYECTIVA: Pregunta[] = [
  {
    id: 'pr1',
    dimension: 'proyectiva',
    texto: '¿Dónde te visualizas profesionalmente en los próximos 5 años?',
    opciones: [
      { id: 'a', texto: 'Liderando un equipo técnico o un área dentro de una empresa consolidada', valor: 4 },
      { id: 'b', texto: 'Emprendiendo mi propio negocio o startup tecnológica', valor: 4 },
      { id: 'c', texto: 'Especializándome con posgrado o certificaciones internacionales', valor: 3 },
      { id: 'd', texto: 'Aún no tengo una visión clara de mi trayectoria', valor: 1 },
    ],
  },
  {
    id: 'pr2',
    dimension: 'proyectiva',
    texto: '¿Cuál es tu mayor motivación para trabajar?',
    opciones: [
      { id: 'a', texto: 'Generar impacto positivo en la comunidad y el entorno', valor: 4 },
      { id: 'b', texto: 'Crecer profesionalmente y alcanzar reconocimiento', valor: 3 },
      { id: 'c', texto: 'Obtener estabilidad económica y seguridad laboral', valor: 2 },
      { id: 'd', texto: 'Cumplir con mis obligaciones cotidianas', valor: 1 },
    ],
  },
  {
    id: 'pr3',
    dimension: 'proyectiva',
    texto: 'Si tuvieras recursos ilimitados, ¿qué problema resolvería tu proyecto ideal?',
    opciones: [
      { id: 'a', texto: 'Un problema social o ambiental con tecnología escalable', valor: 4 },
      { id: 'b', texto: 'Un proceso ineficiente en la industria que conozco', valor: 3 },
      { id: 'c', texto: 'Crear un producto innovador con potencial de mercado', valor: 3 },
      { id: 'd', texto: 'Aún no he reflexionado sobre este tipo de proyecto', valor: 1 },
    ],
  },
  {
    id: 'pr4',
    dimension: 'proyectiva',
    texto: '¿Cómo describes tu actitud hacia la mejora continua personal?',
    opciones: [
      { id: 'a', texto: 'Fundamental: constantemente busco retroalimentación y formas de mejorar', valor: 4 },
      { id: 'b', texto: 'Importante: la busco cuando identifico áreas de oportunidad', valor: 3 },
      { id: 'c', texto: 'Moderada: la aplico cuando me lo exige el trabajo', valor: 2 },
      { id: 'd', texto: 'Limitada: me siento satisfecho con lo que ya domino', valor: 1 },
    ],
  },
  {
    id: 'pr5',
    dimension: 'proyectiva',
    texto: '¿Qué legado profesional quieres dejar en la región de Nayarit?',
    opciones: [
      { id: 'a', texto: 'Contribuir a la transformación digital de empresas locales', valor: 4 },
      { id: 'b', texto: 'Generar empleos de calidad y desarrollo económico regional', valor: 4 },
      { id: 'c', texto: 'Ser referente en mi área de especialización en el estado', valor: 3 },
      { id: 'd', texto: 'No he pensado en un legado específico aún', valor: 1 },
    ],
  },
];

export const BANCO_PREGUNTAS: Record<string, Pregunta[]> = {
  psicometrica: PREGUNTAS_PSICOMETRICA,
  cognitiva:    PREGUNTAS_COGNITIVA,
  tecnica:      PREGUNTAS_TECNICA,
  proyectiva:   PREGUNTAS_PROYECTIVA,
};
