# Responsividad móvil en Dagon

## Objetivo

Hacer que la interfaz funcione bien en smartphone sin romper la experiencia actual en desktop. La prioridad de esta iteración fue el flujo de ejercicios, especialmente los niveles `drag_drop`, y después los componentes globales y páginas con layouts más rígidos.

## Estrategia aplicada

1. Mantener desktop como baseline.
2. Introducir ajustes `mobile-first` con Tailwind antes de los breakpoints `sm`, `md` y `lg`.
3. Evitar rediseños grandes o cambios de contrato con backend.
4. Reutilizar la estética existente (`glass-card`, `glass-card-apple`, gradientes, tipografías y animaciones).

## Cambios base

- Se agregó control global de overflow horizontal en `frontend/src/index.css`.
- Se añadieron utilidades reutilizables:
  - `touch-drag-none`: desactiva gestos que compiten con el drag táctil.
  - `mobile-safe-bottom`: agrega espacio seguro inferior para paneles fijos.
  - `mobile-safe-top`: reservado para futuros overlays con notch o barras del sistema.

## Pantallas ajustadas

### 1. `ExercisePage`

- Header reorganizado para móvil:
  - controles apilados,
  - navegación horizontal de misiones con scroll,
  - XP/combo sin forzar overflow.
- Tarjeta de instrucciones:
  - layout vertical en móvil,
  - mejor lectura del texto y estados.
- Arena de trabajo:
  - botón de ejecutar a ancho completo en móvil,
  - alturas adaptativas para editor y diagrama,
  - padding y jerarquía visual más compactos.
- Drag and drop móvil:
  - targets más grandes,
  - zonas de drop más altas,
  - `touchAction: none` y `user-select: none` para reducir interferencia táctil,
  - guía visible para arrastrar con press-and-drag en teléfono.
- Resultados:
  - encabezados y CTA de avance preparados para una sola columna.

### 2. `Clawbot`

- El panel dejó de depender de un tamaño fijo de desktop en móvil.
- Ahora usa:
  - backdrop para cerrar tocando fuera,
  - panel expandido entre márgenes laterales,
  - altura adaptativa con espacio seguro inferior,
  - header, mensajes y composer compactos para pantallas pequeñas.
- El FAB también se redujo levemente en móvil.

### 3. Páginas principales

- `LoginPage`: padding, tipografías y card principal ajustados para entrada cómoda en teléfono.
- `DashboardPage`: hero y acciones superiores con wrap correcto; timeline de módulos más estable en móvil.
- `ProfilePage`: hero centrado en móvil, resumen en una o dos columnas y sidebar sticky solo en desktop.
- `LeaderboardPage`: filas con mejor compresión horizontal y metadatos visibles en móvil.
- `StreakPage`: hero y cabecera del calendario adaptados para pantallas estrechas.
- `CreditsPage`: hero, tarjetas y CTA con tamaños fluidos.

## Reglas a seguir para nuevos cambios

- Empezar por `w-full`, `min-w-0`, `flex-wrap` y colapso a una columna antes de usar anchos fijos.
- Si un panel es flotante o `fixed`, validar su comportamiento en `360x800` y `390x844`.
- Si un componente requiere drag táctil:
  - usar targets de al menos `52px` de alto,
  - evitar competir con scroll horizontal,
  - agregar feedback visual claro al arrastrar.
- Evitar títulos hero con solo `text-6xl` o `text-7xl`; usar variantes escalonadas por breakpoint.
- Cualquier sticky lateral debe activarse solo desde `lg` en adelante salvo justificación fuerte.

## Checklist manual sugerido

- Login usable sin zoom horizontal.
- Dashboard sin desbordes en header y tarjetas.
- Ejercicio `drag_drop` resoluble desde teléfono.
- Editor SQL visible y operable sin cortar botones.
- Clawbot abrible, escribible y cerrable en móvil.
- Leaderboard, perfil, racha y créditos sin solapes.
- Desktop sigue viéndose igual o mejor.
