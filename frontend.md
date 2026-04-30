# VitaeX — Documentación de Diseño Frontend

> Plataforma universitaria de vinculación laboral · Universidad Tecnológica de la Costa, Nayarit  
> Angular 17 Standalone · PrimeNG 17 · Chart.js · SCSS con Custom Properties

---

## 1. Visión general

VitaeX conecta tres actores: **egresados** que buscan empleo, **empresas** con convenio activo, y el **administrador** institucional de la UT de la Costa. Cada actor accede a un espacio propio con navegación, datos y funcionalidades completamente distintos; el router protege cada sección mediante guardias de autenticación y de rol.

La aplicación corre actualmente sobre mocks estáticos. El backend (REST con snake\_case) todavía no existe; cuando se integre, los servicios en `core/services/` son el único punto de cambio.

---

## 2. Stack y decisiones de arquitectura

| Capa | Tecnología | Decisión clave |
|---|---|---|
| Framework | Angular 17 (standalone API) | Sin NgModules. Cada componente declara sus propios imports. |
| UI Library | PrimeNG 17 | Componentes individuales importados; sin `BrowserAnimationsModule`. |
| Estado | Angular Signals | `signal()` y `computed()` en servicios. Sin NgRx ni BehaviorSubject. |
| Estilos | SCSS + CSS Custom Properties | Un solo archivo global (`styles.scss`); los componentes solo sobreescriben lo mínimo. |
| Visualización | Chart.js (integración directa) | Sin wrapper de terceros; los componentes de Chart instancian `Chart` manualmente. |
| HTTP | `HttpClient` + interceptor funcional | `jwtInterceptor` agrega el header `Authorization` en cada request autenticado. |
| Persistencia de sesión | `localStorage` | Tres claves: `vtx_token`, `vtx_user`, `vtx_rol`. |

### Lazy loading

Todas las rutas usan `loadComponent()`. No hay módulos de feature. El bundle inicial carga únicamente el componente de login.

```
/login              → LoginComponent
/login/2fa          → TwoFaComponent
/login/confirmar-datos → ConfirmarDatosComponent   [authGuard + roleGuard('egresado')]
/egresado/**        → EgresadoLayoutComponent      [authGuard + roleGuard('egresado')]
/empresa/**         → EmpresaLayoutComponent       [authGuard + roleGuard('empresa')]
/admin/**           → AdminLayoutComponent         [authGuard + roleGuard('admin')]
**                  → redirect /login
```

---

## 3. Sistema de diseño

### 3.1 Tokens CSS (`src/styles.scss`)

Todos los valores visuales viven como custom properties en `:root`. Los componentes no hardcodean colores ni tamaños.

#### Paleta principal

| Token | Valor | Uso |
|---|---|---|
| `--color-primary` | `#03837b` | Botones, links activos, acentos |
| `--color-dark` | `#033d3c` | Navbar, hover de botón primario |
| `--color-bg` | `#f4f6f8` | Fondo de página |
| `--color-surface` | `#ffffff` | Cards, paneles |
| `--color-danger` | `#ef4444` | Acciones destructivas, badges de rechazo |
| `--color-warning` | `#f59e0b` | Alertas, badges pendiente |
| `--color-info` | `#3b82f6` | Información secundaria |

#### Dimensiones de evaluación (4 colores semánticos)

Cada dimensión de evaluación tiene un color propio que se propaga a badges, gráficas de radar y sliders de perfil ideal.

| Dimensión | Token | Color |
|---|---|---|
| Psicométrica | `--color-psicometrica` | `#0d9488` (teal) |
| Cognitiva | `--color-cognitiva` | `#3b82f6` (azul) |
| Técnica | `--color-tecnica` | `#8b5cf6` (violeta) |
| Proyectiva | `--color-proyectiva` | `#f97316` (naranja) |

#### Layout

```
--navbar-height:  64px
--sidebar-width:  240px
```

#### Cards

```
--card-shadow:      0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)
--card-shadow-hover: 0 4px 12px rgba(0,0,0,0.10), 0 8px 28px rgba(0,0,0,0.07)
--card-radius:      12px
--card-padding:     24px
```

### 3.2 Tipografía

Fuente base: **Inter** (Google Fonts, pesos 300–800). Tamaño raíz: `14px`.

| Clase / Tag | Tamaño | Peso | Uso |
|---|---|---|---|
| `h1` | 1.75 rem | 700 | Título de página |
| `h2` | 1.375 rem | 600 | Título de sección |
| `h3` | 1.125 rem | 600 | Subtítulo de card |
| `.metric` | 2 rem | 800 | KPIs numéricos en dashboard |
| `.label` | 11 px | 600 / uppercase | Etiquetas de campo |
| `.caption` | 12 px | 400 | Texto auxiliar, metadata |

### 3.3 Utilitarios globales

`styles.scss` expone un conjunto de clases auxiliares de composición (no un framework completo):

- **Flexbox**: `.flex`, `.flex-col`, `.items-center`, `.justify-between`, `.flex-1`, `.flex-wrap`
- **Grid**: `.grid-2`, `.grid-3`, `.grid-4` (colapsan en breakpoints)
- **Gap**: `.gap-4` → `.gap-32` (en pasos de 4/8 px)
- **Margin**: `.mt-8` → `.mt-32`, `.mb-8` → `.mb-32`
- **Página**: `.page-container` (max-width 1280 px, padding 32/24 px), `.page-header`, `.section-title`

### 3.4 Badges de estado

Un mixin SCSS genera todas las variantes de badge sin duplicar código. Están declaradas en global para usarse en cualquier template con solo la clase CSS.

```
.badge-pendiente   .badge-completada  .badge-activo
.badge-aceptada    .badge-rechazada   .badge-inactivo
.badge-en_revision .badge-entrevista  .badge-enviada
.badge-por_vencer  .badge-en_proceso  .badge-aprobada
.badge-norte       .badge-sur         .badge-centro
```

### 3.5 Animaciones

Declaradas como `@keyframes` globales con clases de helper:

| Clase | Animación | Duración |
|---|---|---|
| `.animate-fade-slide` | Entrada desde abajo | 400 ms |
| `.animate-fade-slide-right` | Entrada desde la derecha | 350 ms |
| `.animate-scale-in` | Escala 0.92 → 1 | 300 ms |
| `.animate-pulse` | Opacidad 1 → 0.5 | 2 s infinito |
| `.delay-1` … `.delay-8` | Delay escalonado | 60 ms × N |

---

## 4. Flujo de autenticación

```
/login  ──────────────────────── split-screen: izquierda institucional / derecha formulario
   │  credenciales correctas
   ▼
/login/2fa  ───────────────────── input de 6 dígitos (cualquier número válido en demo)
   │  código aceptado
   ▼
   ├── rol = egresado ──────────▶  /login/confirmar-datos  (revisar datos SIEst)  ──▶  /egresado/dashboard
   ├── rol = empresa ───────────▶  /empresa/dashboard
   └── rol = admin ─────────────▶  /admin/dashboard
```

**`AuthService`** construye un JWT mock firmado con `btoa` y lo persiste en `localStorage`. Al inicializar la app, `restoreSession()` rehidrata el signal de estado sin hacer ningún request.

**Guardias**:
- `authGuard`: verifica `isAuthenticated()`. Redirige a `/login` si false.
- `roleGuard(roles[])`: factory funcional que acepta un arreglo de roles permitidos. Se compone con `authGuard` en las rutas protegidas.

**Credenciales de demostración**:

| Usuario | Contraseña | Rol |
|---|---|---|
| `hackaton-2026` | `testing2026` | Egresado |
| `empresa-demo` | `empresa2026` | Empresa |
| `admin-utc` | `admin2026` | Admin |

---

## 5. Estructura de layouts

Cada rol tiene su propio layout component que actúa como shell. Los hijos se insertan vía `<router-outlet>`.

```
EgresadoLayoutComponent
  ├── <app-navbar>     (top bar 64 px)
  ├── <app-sidebar>    (left rail 240 px, colapsable)
  └── <router-outlet>  (área de contenido)

EmpresaLayoutComponent   (mismo patrón)
AdminLayoutComponent     (mismo patrón)
```

`SidebarComponent` y `NavbarComponent` son compartidos (`shared/components/`) pero reciben la configuración de menú según el rol activo mediante inputs o lectura directa del `AuthService`.

---

## 6. Módulo de evaluaciones — el modelo de 4 dimensiones

El corazón del sistema de empleabilidad de VitaeX es un modelo propio de cuatro dimensiones. Cada dimensión tiene su configuración centralizada en `DIMENSION_CONFIG` (`core/models/index.ts`):

```typescript
DIMENSION_CONFIG = {
  psicometrica: { label, color, icon: 'pi pi-heart',      description },
  cognitiva:    { label, color, icon: 'pi pi-bolt',       description },
  tecnica:      { label, color, icon: 'pi pi-cog',        description },
  proyectiva:   { label, color, icon: 'pi pi-chart-bar',  description },
}
```

`DimensionScores` es un objeto `{ psicometrica, cognitiva, tecnica, proyectiva }` donde cada valor es un entero 0–100. Este tipo aparece en:

- `Egresado.scores` — resultado real del egresado
- `Vacante.perfil_ideal` — perfil objetivo definido por la empresa
- `CompetenciaDemandada[]` — estadísticas del admin

### 6.1 Flujo de evaluación (egresado)

1. El egresado entra a `/egresado/evaluaciones`.
2. Selecciona una dimensión no completada.
3. La vista entra en **focus mode** (pantalla completa, sin sidebar) mostrando las preguntas en secuencia.
4. Al terminar, el `puntaje_obtenido` se persiste en el mock de la sesión y la dimensión se marca como `completada`.
5. Los scores acumulados se usan para calcular `coincidencia` con las vacantes.

### 6.2 Cálculo de coincidencia

La coincidencia egresado–vacante es un porcentaje calculado comparando `egresado.scores` con `vacante.perfil_ideal`. Actualmente se realiza en el frontend sobre mocks; cuando exista backend, este cálculo se delegará al servicio.

---

## 7. Flujos por rol

### 7.1 Egresado (`/egresado/*`)

| Ruta | Vista | Descripción |
|---|---|---|
| `dashboard` | `EgresadoDashboardComponent` | Resumen de scores, progreso de evaluaciones, vacantes recomendadas |
| `evaluaciones` | `EvaluacionesComponent` | Lista de dimensiones + focus mode para responder |
| `vacantes` | `VacantesComponent` | Catálogo con filtros (área, modalidad, zona) |
| `vacantes/:id` | `VacanteDetalleComponent` | Detalle con gráfica radar del egresado superpuesta sobre el perfil ideal |
| `perfil` | `PerfilComponent` | Datos personales, CV, subida de foto (obligatoria para postularse) |
| `postulaciones` | `PostulacionesComponent` | Historial de postulaciones con estatus badge |

**Regla de negocio clave**: un egresado no puede postularse a ninguna vacante sin haber subido una foto de perfil. La validación la realiza `ProfilePhotoService.fotoEgresado()` (signal reactivo).

### 7.2 Empresa (`/empresa/*`)

| Ruta | Vista | Descripción |
|---|---|---|
| `dashboard` | `EmpresaDashboardComponent` | Lista de candidatos idóneos con score de coincidencia |
| `vacantes` | `EmpresaVacantesComponent` | CRUD de vacantes; sliders para definir el perfil ideal en las 4 dimensiones |
| `talento` | `TalentoComponent` | Búsqueda libre de egresados con filtros por carrera, zona y scores mínimos |
| `comunicacion` | `ComunicacionComponent` | Mensajería interna con egresados postulados |

### 7.3 Admin (`/admin/*`)

| Ruta | Vista | Descripción |
|---|---|---|
| `dashboard` | `AdminDashboardComponent` | KPIs institucionales + gráficas Chart.js (inserción por carrera, competencias demandadas) |
| `convenios` | `ConveniosComponent` | Gestión de convenios por empresa: tipo, zona, estatus, vigencia |
| `solicitudes` | `SolicitudesComponent` | Flujo aprobar / rechazar / crear cuenta para nuevas empresas |
| `reportes` | `ReportesComponent` | Reportes exportables de inserción laboral y evaluaciones |

---

## 8. Componentes compartidos (`shared/components/`)

### `ScoreCircleComponent`

SVG inline que dibuja un arco de progreso circular. Acepta `score` (0–100), `color` (hex), `size` (px string) y `strokeWidth`. Usa `[attr.*]` para todos los atributos SVG dinámicos — requisito de Angular para elementos SVG.

```html
<app-score-circle [score]="78" color="#8b5cf6" size="80px" />
```

Implementa `OnChanges` para recalcular `circumference` y `dashOffset` cada vez que cambia el score. La transición CSS del arco es de 800 ms con easing `cubic-bezier(0.4, 0, 0.2, 1)`.

### `SpiderChartComponent`

Gráfica de radar (telaraña) que superpone el perfil del egresado sobre el perfil ideal de la vacante. Usada en `VacanteDetalleComponent`.

### `DimensionPillComponent`

Badge compacto que muestra el ícono, color y nombre de una dimensión. Reutilizado en tarjetas de evaluación y resultados.

### `NavbarComponent` / `SidebarComponent`

Componentes de chrome de la aplicación. El sidebar muestra el avatar del usuario y, en el caso del admin, el logo institucional subido vía `ProfilePhotoService`.

---

## 9. Capa de servicios (`core/services/`)

| Servicio | Responsabilidad |
|---|---|
| `AuthService` | Login, 2FA, logout, rehidratación de sesión. Estado en `signal<AuthState>()`. |
| `EgresadoService` | CRUD mock del perfil y scores del egresado. |
| `EmpresaService` | Consulta de candidatos y gestión de vacantes de la empresa. |
| `AdminService` | KPIs, convenios, solicitudes, reportes. |
| `VacanteService` | Catálogo de vacantes, filtros, cálculo de coincidencia. |
| `ProfilePhotoService` | Foto del egresado y logo del admin. Persiste data-URLs en `localStorage`. Valida tipo (`image/*`) y tamaño (≤ 3 MB). |

---

## 10. Modelos de datos (`core/models/index.ts`)

Todos los tipos están en un único barrel. Los nombres siguen snake\_case para alinearse con la convención del futuro backend.

```
SiestTokenPayload   AuthState   RolUsuario
DimensionType       DimensionScores
Egresado            Vacante
Empresa             Postulacion
SolicitudConvenio   SesionEvaluacion   Pregunta   OpcionRespuesta
KpiDashboard        InsercionCarrera   CompetenciaDemandada
TipoConvenio        EstatusConvenio    ZonaEmpresa
EstatusPostulacion  EstatusSolicitud
```

Helper exportado: `egresadoNombreCompleto(e: Egresado): string` — concatena nombre + apellidos.

---

## 11. Overrides de PrimeNG

`styles.scss` redefine exhaustivamente los tokens de PrimeNG para que el componente library use el design system de VitaeX sin tener que pasar `styleClass` en cada uso. Los componentes afectados son:

`p-button` · `p-card` · `p-inputtext` · `p-password` · `p-dropdown` · `p-multiselect` · `p-inputnumber` · `p-progressbar` · `p-tag` · `p-badge` · `p-dialog` · `p-datatable` · `p-menubar` · `p-panelmenu` · `p-slider` · `p-radiobutton` · `p-toast` · `p-fileupload`

Todos los overrides usan `!important` de forma contenida para ganar especificidad sobre los estilos encapsulados de PrimeNG sin romper la cascada local de los componentes.

---

## 12. Mocks (`shared/mocks/`)

| Archivo | Contenido |
|---|---|
| `egresados.mock.ts` | Array de `Egresado[]` con scores y evaluaciones variadas |
| `vacantes.mock.ts` | Array de `Vacante[]` con `perfil_ideal` y `coincidencia` precalculada |
| `empresas.mock.ts` | Array de `Empresa[]` con convenios en distintos estados |
| `evaluaciones.mock.ts` | `Pregunta[]` por dimensión |
| `convenios.mock.ts` | `SolicitudConvenio[]` con distintos estatus |
| `reportes.mock.ts` | `InsercionCarrera[]` y `CompetenciaDemandada[]` para gráficas |

Cuando se integre el backend, los servicios reemplazarán `of(mock)` por `this.http.get<T>(url)`. Los tipos ya están alineados con snake\_case.

---

## 13. Responsividad

Breakpoints definidos en `styles.scss`:

| Breakpoint | Cambio |
|---|---|
| ≤ 1024 px | `.grid-4` colapsa a 2 columnas |
| ≤ 768 px | `.grid-3` y `.grid-4` → 2 col; `.grid-2` → 1 col; padding de página reducido |
| ≤ 480 px | Todos los grids → 1 columna |

---

## 14. Convenciones de desarrollo

- **`@for` siempre con `track $index` o `track item.id`** — `track $_` no existe en Angular 17 y causa error de compilación.
- **Atributos SVG dinámicos con `[attr.nombre]`** — Angular no reconoce `[transform]` como property binding en SVG.
- **Áreas de texto con `<textarea>` nativo** — `InputTextareaModule` y `TextareaModule` no existen en PrimeNG 17 standalone; se usa `<textarea pInputText>` o estilos inline.
- **Nuevos componentes** importan solo lo que necesitan; no existe un módulo compartido.
- **Colores siempre desde tokens CSS**; no hardcodear hexadecimales en SCSS de componentes.
- Los mocks viven en `shared/mocks/`; los servicios son el único lugar que los consume.
