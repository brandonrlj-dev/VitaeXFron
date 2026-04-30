# Prompt para el Desarrollador Backend - Implementación de Nuevas Encuestas

## Objetivo
Implementar un sistema de encuestas dinámico que entregue reactivos específicos basados en la carrera del egresado y calcule los puntajes siguiendo una nueva fórmula ponderada.

## Estructura de las Encuestas
Existen 4 categorías (dimensiones) para cada carrera:
1. **Psicométrica** (Personalidad laboral)
2. **Cognitiva** (Potencial de aprendizaje)
3. **Técnica** (Conocimientos específicos)
4. **Proyectiva / SJT** (Juicio situacional)

### Carreras Iniciales
- **Tecnologías de la Información**
- **Procesos Alimentarios**

## Reglas de Negocio

### 1. Reactivos y Escalas
- Todas las encuestas constan de **10 reactivos** cada una.
- Se utiliza una escala **Likert del 1 al 5** para todas las respuestas.
- El puntaje máximo por categoría es de **50 puntos** (10 preguntas × 5 puntos).

### 2. Fórmulas de Cálculo

**Puntaje por Categoría (0-100):**
`Puntaje_Cat = (Puntos_Obtenidos / 50) × 100`

**Puntaje Global (Ponderado):**
`Global = Psicometrica(0.25) + Cognitiva(0.25) + Técnica(0.30) + Proyectiva(0.20)`

### 3. Niveles de Interpretación
| Puntaje Final | Nivel |
| :--- | :--- |
| 90–100 | Muy superior |
| 75–89 | Superior |
| 50–74 | Promedio |
| 25–49 | Bajo |
| 0–24 | Muy bajo |

## Requerimientos del API
1. **Endpoint de Preguntas:** Debe recibir el ID del egresado o su carrera y devolver el set de preguntas correspondiente a la dimensión solicitada.
2. **Persistencia:** Guardar los resultados individuales de cada dimensión y el cálculo del score global.
3. **Validación:** Asegurar que un egresado solo pueda realizar cada evaluación una vez (a menos que se habilite un reset).

## Ejemplo de JSON de Pregunta (Sugerido)
```json
{
  "id": "ti_ps1",
  "texto": "Entrego mis actividades en la fecha establecida.",
  "dimension": "psicometrica",
  "carrera": "Tecnologías de la Información",
  "opciones": [
    {"valor": 1, "texto": "Totalmente en desacuerdo"},
    {"valor": 2, "texto": "En desacuerdo"},
    {"valor": 3, "texto": "Neutral"},
    {"valor": 4, "texto": "De acuerdo"},
    {"valor": 5, "texto": "Totalmente de acuerdo"}
  ]
}
```
