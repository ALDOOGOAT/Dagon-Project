# Cambios: corrección final del tema por usuarioo

## Problema real detectado

El fallo no era solo una persistencia global antigua. También había un problema de inicialización:

1. El tema dependía de `user.idUsuario`.
2. Al recargar o volver a entrar, primero existía el `token`, pero el objeto `user` todavía no estaba hidratado.
3. Durante ese lapso, `ThemeContext` caía al tema por defecto.
4. El resultado visual era que la app reaparecía en oscuro o en otra paleta previa y no siempre recuperaba a tiempo la seleccionada por el usuario.

Eso explica el comportamiento reportado de volver a ver la interfaz oscura o azul al reingresar.

## Causa raíz

La lógica estaba concentrada en:

- [frontend/src/contexts/ThemeContext.js](/home/aldo/Descargas/Dagon_Project/Dagon-Project/frontend/src/contexts/ThemeContext.js)

La restauración de la paleta esperaba a que `useAuth()` ya tuviera `user` completo. Si la sesión todavía estaba validándose, el tema arrancaba con el default.

## Solución implementada

Se endureció la resolución del tema para que use la identidad del usuario incluso antes de que el perfil termine de cargar.

### Ajustes realizados

1. `ThemeContext` ahora usa `user.idUsuario` y, si todavía no existe, extrae el `sub` directamente del JWT.
2. La lectura inicial del tema ya no espera al fetch del perfil.
3. La persistencia sigue siendo por usuario:

```text
userPalette:<idUsuario>
```

4. `changePalette()` ahora persiste y aplica la paleta inmediatamente, reduciendo carreras entre navegación, render y escritura en `localStorage`.
5. Si no hay un usuario autenticado resoluble, el sistema usa `dagon` como fallback controlado.

### Flujo final

- Sin sesión: tema `dagon`
- Con sesión y token válido: se resuelve el `idUsuario` desde `user` o desde el JWT
- Con ese `idUsuario`: se carga `userPalette:<idUsuario>`
- Al cambiar color en perfil: se guarda y aplica inmediatamente
- Al volver a entrar: la paleta se restaura sin depender de que `/profile` termine antes

## Archivos modificados

- [frontend/src/contexts/ThemeContext.js](/home/aldo/Descargas/Dagon_Project/Dagon-Project/frontend/src/contexts/ThemeContext.js)
- [frontend/src/contexts/AuthContext.js](/home/aldo/Descargas/Dagon_Project/Dagon-Project/frontend/src/contexts/AuthContext.js)

## Backend

Se revisó el flujo backend relacionado:

- [backend/src/main/java/com/dagon/backend/controller/UsuarioController.java](/home/aldo/Descargas/Dagon_Project/Dagon-Project/backend/src/main/java/com/dagon/backend/controller/UsuarioController.java)

No fue necesario cambiar backend.

Motivo:

- el login ya devuelve `token`
- el JWT ya contiene el `sub` con el identificador del usuario
- eso permite que el frontend recupere la paleta correcta antes de que el perfil termine de hidratarse

## Pruebas ejecutadas

### Frontend

Comando ejecutado:

```bash
cd frontend && yarn build
```

Resultado esperado de validación:

- compilación exitosa
- sin errores de build
- pueden seguir apareciendo warnings previos de hooks, pero no bloquean deploy

### Backend

No hubo cambios backend en esta corrección final. La revisión fue de contrato y flujo de autenticación.

## Impacto esperado

Después de este ajuste:

- el tema ya no debe quedarse pegado en oscuro o azul al reingresar
- la paleta del usuario debe restaurarse desde el primer montaje útil de sesión
- la experiencia deja de depender del tiempo que tarde en resolverse `user`

## Nota final

Esta corrección mantiene la solución en frontend y no modifica la base de datos ni agrega columnas nuevas de preferencias.
