# Cambios: Persistencia de tema por usuario

## Problema detectado

La paleta del frontend se estaba guardando en una clave global de `localStorage`:

- `userPalette`

Eso provocaba este comportamiento:

1. Un usuario entraba a `ProfilePage` y cambiaba el color.
2. Cerraba sesión.
3. Otro usuario entraba después.
4. El sistema seguía usando la última paleta global guardada.

En otras palabras, el tema quedaba pegado entre sesiones y no estaba aislado por usuario.

## Causa raíz

El problema estaba en:

- [frontend/src/contexts/ThemeContext.js](/home/aldo/Descargas/Dagon_Project/Dagon-Project/frontend/src/contexts/ThemeContext.js)

La paleta se inicializaba y persistía con una sola clave global, sin tomar en cuenta `idUsuario`.

## Solución implementada

Se cambió la persistencia del tema para que sea por usuario autenticado.

### Ajustes realizados

1. `ThemeContext` ahora consume `useAuth()` para conocer el usuario actual.
2. La paleta ya no depende solo de `userPalette`.
3. Se usa una clave por usuario:

```text
userPalette:<idUsuario>
```

4. Si no hay sesión iniciada:
   - el tema vuelve a `dagon`
   - así el login ya no hereda el color del usuario anterior

5. Si existe el valor antiguo global:
   - se migra automáticamente al usuario autenticado
   - esto evita perder la preferencia ya guardada

### Flujo nuevo

- Sin login: tema `dagon`
- Login usuario A: carga `userPalette:<idUsuarioA>`
- Login usuario B: carga `userPalette:<idUsuarioB>`
- Logout: vuelve a `dagon`

## Archivos modificados

- [frontend/src/contexts/ThemeContext.js](/home/aldo/Descargas/Dagon_Project/Dagon-Project/frontend/src/contexts/ThemeContext.js)

## Backend

Se revisó el backend de autenticación y perfil:

- [frontend/src/contexts/AuthContext.js](/home/aldo/Descargas/Dagon_Project/Dagon-Project/frontend/src/contexts/AuthContext.js)
- [backend/src/main/java/com/dagon/backend/controller/UsuarioController.java](/home/aldo/Descargas/Dagon_Project/Dagon-Project/backend/src/main/java/com/dagon/backend/controller/UsuarioController.java)

No fue necesario hacer cambios backend para resolver este bug.

Motivo:

- El backend ya entrega `user.idUsuario` al hacer login
- eso es suficiente para que el frontend persista el tema por usuario

## Pruebas ejecutadas

### Frontend

Comando ejecutado:

```bash
cd frontend && yarn build
```

Resultado:

- compilación exitosa
- sin errores de build
- solo warnings previos de hooks `useEffect`

### Backend

Comando ejecutado:

```bash
cd backend && ./mvnw test
```

Resultado:

- `BUILD SUCCESS`
- `Tests run: 1, Failures: 0, Errors: 0, Skipped: 0`

## Impacto esperado

Después de este cambio:

- el tema ya no debe quedarse con el color del usuario anterior
- cada usuario conserva su propia paleta
- el login no debería abrir con una paleta ajena si no hay sesión activa

## Nota final

Este cambio corrige la persistencia del tema entre usuarios. No modifica la base de datos ni agrega nuevas columnas de preferencias en backend.
