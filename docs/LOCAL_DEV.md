# Ejecucion local de Dagon

## Arranque normal

Backend:

```bash
cd backend
./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend
yarn start
```

URLs locales:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8080
```

## Variables locales

Para probar local, el frontend debe apuntar al backend local:

```bash
cat frontend/.env
```

Debe tener:

```env
REACT_APP_API_URL=http://localhost:8080
REACT_APP_BACKEND_URL=http://localhost:8080
```

Si cambias `frontend/.env`, reinicia `yarn start`; Craco no recarga variables de entorno en caliente.

## Base de datos publica de Railway

El backend es quien se conecta a PostgreSQL. El frontend nunca se conecta directo a la base de datos.

Para ver que BD usa el backend, revisa:

```bash
backend/src/main/resources/application.properties
backend/.env
```

Tambien puedes verlo al arrancar el backend. En consola debe aparecer una linea tipo:

```text
Database JDBC URL [jdbc:postgresql://...railway...]
```

Si aparece `localhost` ahi, el backend esta usando una BD local. Si aparece el host de Railway, esta usando la BD publica.

## Variables que acepta el backend

Puedes usar una URL completa:

```env
DATABASE_URL=postgresql://usuario:password@host:puerto/base
```

O variables separadas:

```env
PGHOST=host
PGPORT=5432
PGDATABASE=base
PGUSER=usuario
PGPASSWORD=password
```

Para el sandbox SQL, si usa otro rol:

```env
DAGON_SANDBOX_URL=postgresql://usuario_sandbox:password@host:puerto/base
DAGON_SANDBOX_USERNAME=app_sandbox_user
DAGON_SANDBOX_PASSWORD=password
```

## Pruebas rapidas

Backend vivo:

```bash
curl -i http://127.0.0.1:8080/api/modulos
```

Es normal que responda `403` sin token; significa que el backend esta vivo y la ruta esta protegida.

Login llega al backend:

```bash
curl -i -X POST http://127.0.0.1:8080/api/usuarios/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"correo@invalido.com","passwordHash":"invalid"}'
```

Si responde `Correo o contraseña incorrectos`, el backend esta respondiendo y consultando usuarios.

## Problemas comunes

- Si el navegador dice error con el servidor, revisa primero que `frontend/.env` apunte a `http://localhost:8080`.
- Si cambiaste `frontend/.env`, reinicia `yarn start`.
- Si el backend no arranca, revisa la consola de `./mvnw spring-boot:run`; ahi aparece si fallo la conexion a PostgreSQL.
- No actives `ddl-auto=update`; la base se maneja desde el SQL maestro.
