package com.dagon.backend.service;

import com.dagon.backend.dto.UsuarioResponseDTO;
import com.dagon.backend.model.Usuario;
import com.dagon.backend.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class UsuarioService {

    private static final Logger logger = LoggerFactory.getLogger(UsuarioService.class);
    private static final long MAX_PROFILE_IMAGE_BYTES = 2L * 1024L * 1024L;
    private static final String PROFILE_IMAGE_PATTERN = "perfil_[a-fA-F0-9]{32}(_[a-fA-F0-9-]{36})?\\.(png|jpg|jpeg|webp)";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${dagon.streak.zone:America/Mexico_City}")
    private String streakZone;

    @Value("${dagon.docente.registration-code:}")
    private String docenteRegistrationCode;

    // --- FUNCION 1: REGISTRO ---
    @Transactional
    public Usuario registrarUsuario(Usuario nuevoUsuario, String rol) {
        return registrarUsuario(nuevoUsuario, rol, null, null);
    }

    @Transactional
    public Usuario registrarUsuario(Usuario nuevoUsuario, String rol, String codigoDocente, String codigoGrupo) {
        if (nuevoUsuario.getEmail() == null || nuevoUsuario.getEmail().isBlank()) {
            throw new RuntimeException("Error: El correo es obligatorio.");
        }
        if (nuevoUsuario.getPasswordHash() == null || nuevoUsuario.getPasswordHash().length() < 8) {
            throw new RuntimeException("Error: La contraseña debe tener al menos 8 caracteres.");
        }

        nuevoUsuario.setEmail(nuevoUsuario.getEmail().trim().toLowerCase());
        Optional<Usuario> usuarioExistente = usuarioRepository.findByEmailIgnoreCase(nuevoUsuario.getEmail());
        if (usuarioExistente.isPresent()) {
            throw new RuntimeException("Error: Este correo ya está registrado en Dagon.");
        }
        if (nuevoUsuario.getActivo() == null) {
            nuevoUsuario.setActivo(true);
        }

        String rolNormalizado = normalizarRolRegistro(rol);
        if ("docente".equals(rolNormalizado)) {
            validarCodigoRegistroDocente(codigoDocente);
        }

        Integer idRol = resolverIdRol(rolNormalizado);
        nuevoUsuario.setIdRol(idRol);
        nuevoUsuario.setPasswordHash(passwordEncoder.encode(nuevoUsuario.getPasswordHash()));

        Usuario guardado = usuarioRepository.save(nuevoUsuario);
        if ("alumno".equals(rolNormalizado) && codigoGrupo != null && !codigoGrupo.isBlank()) {
            inscribirAlumnoPorCodigoGrupo(guardado.getIdUsuario().toString(), codigoGrupo);
        }

        return guardado;
    }

    public Usuario registrarUsuario(Usuario nuevoUsuario) {
        return registrarUsuario(nuevoUsuario, "alumno");
    }

    private Integer resolverIdRol(String rol) {
        if (rol == null || rol.isBlank()) rol = "alumno";
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id_rol FROM lms_core.roles WHERE nombre = ?",
                    Integer.class, rol.toLowerCase().trim());
        } catch (Exception e) {
            logger.warn("Rol '{}' no encontrado, asignando alumno por defecto", rol);
            return 1;
        }
    }

    private String normalizarRolRegistro(String rol) {
        if (rol == null || rol.isBlank()) return "alumno";
        String normalizado = rol.trim().toLowerCase();
        if (normalizado.equals("docente")) return "docente";
        return "alumno";
    }

    private void validarCodigoRegistroDocente(String codigoDocente) {
        if (docenteRegistrationCode == null || docenteRegistrationCode.isBlank()) {
            throw new RuntimeException("Error: El registro docente no esta habilitado. Define DAGON_DOCENTE_REGISTRATION_CODE.");
        }
        if (codigoDocente == null || codigoDocente.isBlank()) {
            throw new RuntimeException("Error: Ingresa la clave institucional docente.");
        }

        byte[] esperado = docenteRegistrationCode.trim().getBytes(StandardCharsets.UTF_8);
        byte[] recibido = codigoDocente.trim().getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(esperado, recibido)) {
            throw new RuntimeException("Error: La clave institucional docente no es valida.");
        }
    }

    private void inscribirAlumnoPorCodigoGrupo(String alumnoId, String codigoGrupo) {
        String codigoNormalizado = codigoGrupo.trim().toUpperCase();
        Long idGrupo;
        try {
            idGrupo = jdbcTemplate.queryForObject(
                    "SELECT id_grupo FROM lms_core.grupos_docente " +
                            "WHERE UPPER(codigo_acceso) = ? AND activo = true",
                    Long.class,
                    codigoNormalizado
            );
        } catch (Exception e) {
            throw new RuntimeException("Error: El codigo de grupo no existe o ya no esta activo.");
        }

        jdbcTemplate.update(
                "INSERT INTO lms_core.grupo_alumnos (id_grupo, id_alumno, activo) " +
                        "VALUES (?, ?::uuid, true) " +
                        "ON CONFLICT (id_grupo, id_alumno) DO UPDATE SET activo = true, fecha_asignacion = now()",
                idGrupo,
                alumnoId
        );
    }

    // --- FUNCION 2: LOGIN ---
    public Usuario iniciarSesion(String email, String password) {
        if (email == null || password == null) {
            throw new RuntimeException("Correo o contraseña incorrectos.");
        }
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmailIgnoreCase(email.trim().toLowerCase());
        if (usuarioOpt.isPresent()) {
            Usuario usuarioBaseDatos = usuarioOpt.get();
            String hashGuardado = usuarioBaseDatos.getPasswordHash();
            if (passwordEncoder.matches(password, hashGuardado)) {
                return asegurarRolAlumnoSiFalta(usuarioBaseDatos);
            }

            // Compatibilidad temporal: migra cuentas antiguas que estaban en texto plano.
            if (hashGuardado != null && !pareceHashBCrypt(hashGuardado) && hashGuardado.equals(password)) {
                usuarioBaseDatos.setPasswordHash(passwordEncoder.encode(password));
                return asegurarRolAlumnoSiFalta(usuarioBaseDatos);
            }
        }
        throw new RuntimeException("Correo o contraseña incorrectos.");
    }

    private Usuario asegurarRolAlumnoSiFalta(Usuario usuario) {
        if (usuario.getIdRol() == null) {
            usuario.setIdRol(resolverIdRol("alumno"));
            return usuarioRepository.save(usuario);
        }
        return usuario;
    }

    private boolean pareceHashBCrypt(String valor) {
        return valor != null && valor.matches("^\\$2[aby]\\$.{56}$");
    }

    // --- FUNCION 3: REGISTRAR PRACTICA (RACHAS) ---
    public void registrarPracticaDiaria(String usuarioId) {
        try {
            LocalDate hoy = hoyRacha();
            RachaSnapshot racha = obtenerRachaSnapshot(usuarioId, hoy);

            if (racha.ultimaPractica() != null && racha.ultimaPractica().equals(hoy)) {
                return;
            }

            int nuevaRacha = racha.ultimaPractica() != null && racha.ultimaPractica().equals(hoy.minusDays(1))
                    ? Math.max(0, racha.rachaActual()) + 1
                    : 1;
            int nuevaMejorRacha = Math.max(racha.mejorRacha(), nuevaRacha);

            String updateSql = "UPDATE lms_core.usuarios " +
                    "SET racha_actual = ?, mejor_racha = ?, ultima_practica = ?::date " +
                    "WHERE id_usuario = ?::uuid";
            jdbcTemplate.update(updateSql, nuevaRacha, nuevaMejorRacha, hoy.toString(), usuarioId);

            logger.debug("Practica diaria registrada para el usuario con ID: {}", usuarioId);
        } catch (Exception e) {
            logger.warn("Error al registrar practica diaria: {}", e.getMessage());
        }
    }

    public Optional<UsuarioResponseDTO> obtenerPerfilSeguro(String id) {
        if (id == null || id.isBlank()) {
            return Optional.empty();
        }

        try {
            return usuarioRepository.findById(UUID.fromString(id)).map(UsuarioResponseDTO::from);
        } catch (IllegalArgumentException e) {
            return usuarioRepository.findByEmailIgnoreCase(id.trim().toLowerCase()).map(UsuarioResponseDTO::from);
        }
    }

    private Optional<String> resolverUsuarioId(String identificador) {
        if (identificador == null || identificador.isBlank()) {
            return Optional.empty();
        }

        String limpio = identificador.trim();
        try {
            UUID.fromString(limpio);
            return Optional.of(limpio);
        } catch (IllegalArgumentException ignored) {
            try {
                String usuarioId = jdbcTemplate.queryForObject(
                        "SELECT id_usuario::varchar FROM lms_core.usuarios WHERE LOWER(email) = LOWER(?)",
                        String.class,
                        limpio
                );
                return Optional.ofNullable(usuarioId);
            } catch (Exception e) {
                return Optional.empty();
            }
        }
    }

    public Map<String, Object> obtenerEstadisticasResumen(String id) {
        String usuarioId = resolverUsuarioId(id).orElse(id);
        Map<String, Object> stats = new HashMap<>();

        try {
            String sqlBase = "WITH historia AS ( " +
                    "  SELECT COALESCE(SUM(e.dificultad * 10), 0) AS xp " +
                    "  FROM ( " +
                    "    SELECT DISTINCT i.id_ejercicio " +
                    "    FROM lms_core.intentos i " +
                    "    JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = i.id_ejercicio " +
                    "    WHERE i.id_usuario = ?::uuid " +
                    "      AND i.es_correcto = true " +
                    "      AND COALESCE(e.tipo_mision, 'HISTORIA') <> 'RAPIDA' " +
                    "  ) unicos " +
                    "  JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = unicos.id_ejercicio " +
                    "), rapida_ordenada AS ( " +
                    "  SELECT ROW_NUMBER() OVER (PARTITION BY DATE(i.fecha_intento) ORDER BY i.fecha_intento, i.id_intento) AS rn " +
                    "  FROM lms_core.intentos i " +
                    "  JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = i.id_ejercicio " +
                    "  WHERE i.id_usuario = ?::uuid " +
                    "    AND i.es_correcto = true " +
                    "    AND e.tipo_mision = 'RAPIDA' " +
                    "), xp_actual AS ( " +
                    "  SELECT (SELECT xp FROM historia) + COALESCE((SELECT COUNT(*) * 5 FROM rapida_ordenada WHERE rn <= 5), 0) AS xp " +
                    "), ranking AS ( " +
                    "  SELECT id_usuario, RANK() OVER (ORDER BY xp_total DESC, ejercicios_resueltos DESC, nombre ASC) AS posicion " +
                    "  FROM lms_core.v_ranking_alumnos " +
                    ") " +
                    "SELECT " +
                    "  COALESCE((SELECT xp FROM xp_actual), 0) AS xp, " +
                    "  COALESCE((SELECT posicion FROM ranking WHERE id_usuario = ?::uuid), 0) AS posicion, " +
                    "  (SELECT COUNT(*) FROM lms_core.intentos WHERE id_usuario = ?::uuid) AS consultas_totales, " +
                    "  (SELECT COUNT(DISTINCT id_ejercicio) FROM lms_core.intentos WHERE id_usuario = ?::uuid AND es_correcto = true) AS ejercicios_completados";

            Map<String, Object> base = jdbcTemplate.queryForMap(sqlBase, usuarioId, usuarioId, usuarioId, usuarioId, usuarioId);
            stats.put("xp", ((Number) base.get("xp")).intValue());
            int posicion = ((Number) base.get("posicion")).intValue();
            stats.put("posicion", posicion > 0 ? posicion : "-");
            stats.put("consultas_totales", ((Number) base.get("consultas_totales")).intValue());
            stats.put("ejercicios_completados", ((Number) base.get("ejercicios_completados")).intValue());

            RachaSnapshot racha = normalizarRachaParaStats(usuarioId);
            stats.put("racha", racha.rachaActual());
            stats.put("mejor_racha", racha.mejorRacha());
            stats.put("ultima_practica", racha.ultimaPractica() != null ? racha.ultimaPractica().toString() : null);
            stats.put("racha_estado", racha.estado());
            stats.put("actividad_hoy", racha.actividadHoy());
            stats.put("racha_en_riesgo", racha.enRiesgo());
            stats.put("racha_expirada", racha.expirada());
            stats.put("racha_protegida_hoy", racha.protegidaHoy());
            stats.put("racha_expira_en_horas", racha.expiraEnHoras());
            stats.put("dias_desde_ultima_practica", racha.diasDesdeUltimaPractica());
            stats.put("success", true);
        } catch (Exception e) {
            logger.warn("Error al obtener resumen de estadisticas del usuario {}: {}", id, e.getMessage());
            stats.put("success", false);
        }

        return stats;
    }

    public Map<String, Object> obtenerEstadisticas(String id) {
        String usuarioId = resolverUsuarioId(id).orElse(id);
        Map<String, Object> stats = new HashMap<>(obtenerEstadisticasResumen(usuarioId));

        try {
            if (Boolean.FALSE.equals(stats.get("success"))) {
                return stats;
            }

            String sqlFechas = "SELECT DISTINCT DATE(fecha_intento) as fecha_actividad " +
                    "FROM lms_core.intentos WHERE id_usuario = ?::uuid ORDER BY fecha_actividad DESC";
            java.util.List<java.sql.Date> fechas = jdbcTemplate.queryForList(sqlFechas, java.sql.Date.class, usuarioId);
            java.util.List<String> fechasStr = new java.util.ArrayList<>();
            for (java.sql.Date f : fechas) {
                fechasStr.add(f.toString());
            }
            stats.put("fechas_actividad", fechasStr);

            String sqlDistribucion = "WITH historia AS ( " +
                    "  SELECT e.dificultad, SUM(e.dificultad * 10) AS xp_ganada " +
                    "  FROM ( " +
                    "    SELECT DISTINCT i.id_ejercicio " +
                    "    FROM lms_core.intentos i " +
                    "    JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = i.id_ejercicio " +
                    "    WHERE i.id_usuario = ?::uuid " +
                    "      AND i.es_correcto = true " +
                    "      AND COALESCE(e.tipo_mision, 'HISTORIA') <> 'RAPIDA' " +
                    "  ) unicos " +
                    "  JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = unicos.id_ejercicio " +
                    "  GROUP BY e.dificultad " +
                    "), rapida_ordenada AS ( " +
                    "  SELECT e.dificultad, ROW_NUMBER() OVER (PARTITION BY DATE(i.fecha_intento) ORDER BY i.fecha_intento, i.id_intento) AS rn " +
                    "  FROM lms_core.intentos i " +
                    "  JOIN lms_core.ejercicios_practicos e ON e.id_ejercicio = i.id_ejercicio " +
                    "  WHERE i.id_usuario = ?::uuid " +
                    "    AND i.es_correcto = true " +
                    "    AND e.tipo_mision = 'RAPIDA' " +
                    "), rapida AS ( " +
                    "  SELECT dificultad, COUNT(*) * 5 AS xp_ganada " +
                    "  FROM rapida_ordenada WHERE rn <= 5 GROUP BY dificultad " +
                    ") SELECT dificultad, SUM(xp_ganada) AS xp_ganada " +
                    "FROM (SELECT * FROM historia UNION ALL SELECT * FROM rapida) base " +
                    "GROUP BY dificultad ORDER BY dificultad";
            try {
                java.util.List<Map<String, Object>> distribucion = jdbcTemplate.queryForList(sqlDistribucion, usuarioId, usuarioId);
                stats.put("distribucion_xp", distribucion);
            } catch (Exception e) {
                stats.put("distribucion_xp", new java.util.ArrayList<>());
            }

            java.util.List<Map<String, Object>> dominioConceptos = obtenerDominioConceptos(usuarioId);
            stats.put("dominio_conceptos", dominioConceptos);
            stats.put("recomendaciones_aprendizaje", construirRecomendacionesAprendizaje(dominioConceptos));

            stats.put("success", true);
        } catch (Exception e) {
            logger.warn("Error al obtener estadisticas del usuario {}: {}", id, e.getMessage());
            stats.put("success", false);
        }

        return stats;
    }

    private RachaSnapshot normalizarRachaParaStats(String usuarioId) {
        LocalDate hoy = hoyRacha();
        RachaSnapshot racha = obtenerRachaSnapshot(usuarioId, hoy);

        if (racha.expirada() && racha.rachaActual() > 0) {
            jdbcTemplate.update(
                    "UPDATE lms_core.usuarios SET racha_actual = 0 WHERE id_usuario = ?::uuid AND racha_actual <> 0",
                    usuarioId
            );
            return racha.conRachaActual(0);
        }

        return racha;
    }

    private RachaSnapshot obtenerRachaSnapshot(String usuarioId, LocalDate hoy) {
        String sql = "SELECT COALESCE(racha_actual, 0) AS racha_actual, " +
                "COALESCE(mejor_racha, 0) AS mejor_racha, ultima_practica " +
                "FROM lms_core.usuarios WHERE id_usuario = ?::uuid";
        Map<String, Object> row = jdbcTemplate.queryForMap(sql, usuarioId);
        int rachaActual = ((Number) row.get("racha_actual")).intValue();
        int mejorRacha = ((Number) row.get("mejor_racha")).intValue();
        Object ultimaRaw = row.get("ultima_practica");
        LocalDate ultimaPractica = null;
        if (ultimaRaw instanceof java.sql.Date fechaSql) {
            ultimaPractica = fechaSql.toLocalDate();
        } else if (ultimaRaw instanceof LocalDate fechaLocal) {
            ultimaPractica = fechaLocal;
        }

        if (ultimaPractica == null || rachaActual <= 0) {
            return new RachaSnapshot(0, mejorRacha, ultimaPractica, "sin_racha", false, false, false, false, null, null);
        }

        long diasDesdeUltimaPractica = ChronoUnit.DAYS.between(ultimaPractica, hoy);
        boolean actividadHoy = diasDesdeUltimaPractica <= 0;
        boolean enRiesgo = diasDesdeUltimaPractica == 1;
        boolean expirada = diasDesdeUltimaPractica > 1;
        String estado = expirada ? "expirada" : enRiesgo ? "en_riesgo" : "protegida";
        Integer expiraEnHoras = enRiesgo ? horasRestantesDelDia() : null;

        return new RachaSnapshot(
                rachaActual,
                mejorRacha,
                ultimaPractica,
                estado,
                actividadHoy,
                enRiesgo,
                expirada,
                actividadHoy,
                expiraEnHoras,
                Math.max(0, diasDesdeUltimaPractica)
        );
    }

    private LocalDate hoyRacha() {
        try {
            return LocalDate.now(ZoneId.of(streakZone));
        } catch (Exception e) {
            logger.warn("Zona horaria de racha invalida '{}', usando zona del servidor", streakZone);
            return LocalDate.now();
        }
    }

    private int horasRestantesDelDia() {
        try {
            ZoneId zone = ZoneId.of(streakZone);
            java.time.ZonedDateTime ahora = java.time.ZonedDateTime.now(zone);
            java.time.ZonedDateTime medianoche = ahora.toLocalDate().plusDays(1).atStartOfDay(zone);
            return Math.max(0, (int) ChronoUnit.HOURS.between(ahora, medianoche));
        } catch (Exception e) {
            return 0;
        }
    }

    private record RachaSnapshot(
            int rachaActual,
            int mejorRacha,
            LocalDate ultimaPractica,
            String estado,
            boolean actividadHoy,
            boolean enRiesgo,
            boolean expirada,
            boolean protegidaHoy,
            Integer expiraEnHoras,
            Long diasDesdeUltimaPractica
    ) {
        RachaSnapshot conRachaActual(int nuevaRacha) {
            return new RachaSnapshot(
                    nuevaRacha,
                    mejorRacha,
                    ultimaPractica,
                    estado,
                    actividadHoy,
                    enRiesgo,
                    expirada,
                    protegidaHoy,
                    expiraEnHoras,
                    diasDesdeUltimaPractica
            );
        }
    }

    private java.util.List<Map<String, Object>> obtenerDominioConceptos(String id) {
        String sql = "SELECT concepto, COUNT(*) AS intentos, " +
                "SUM(CASE WHEN es_correcto THEN 1 ELSE 0 END) AS aciertos, " +
                "COUNT(DISTINCT CASE WHEN es_correcto THEN id_ejercicio END) AS ejercicios_dominados, " +
                "MAX(fecha_intento) AS ultima_practica " +
                "FROM (" +
                "  SELECT i.id_ejercicio, i.es_correcto, i.fecha_intento, " +
                "  CASE " +
                "    WHEN m.id_modulo IN (15, 16) OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%ROLLBACK%' OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%COMMIT%' THEN 'Transacciones' " +
                "    WHEN m.id_modulo IN (5, 6, 7, 9, 10, 12, 13, 14, 18, 19) OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%CREATE%' OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%ALTER%' OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%CONSTRAINT%' THEN 'DDL' " +
                "    WHEN m.id_modulo = 2 OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%INSERT%' OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%UPDATE%' OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%DELETE%' THEN 'DML' " +
                "    WHEN m.id_modulo IN (3, 4) OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%JOIN%' THEN 'JOIN' " +
                "    WHEN m.id_modulo = 20 OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%GROUP BY%' OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%COUNT%' OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%SUM%' OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%AVG%' OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%HAVING%' THEN 'Agregaciones' " +
                "    WHEN m.id_modulo IN (8, 11) OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%WHERE%' OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%LIKE%' OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%BETWEEN%' OR UPPER(COALESCE(e.query_maestra, '')) LIKE '%IS NULL%' THEN 'Filtros' " +
                "    ELSE 'SELECT' " +
                "  END AS concepto " +
                "  FROM lms_core.intentos i " +
                "  JOIN lms_core.ejercicios_practicos e ON i.id_ejercicio = e.id_ejercicio " +
                "  JOIN lms_core.modulos m ON e.id_modulo = m.id_modulo " +
                "  WHERE i.id_usuario = ?::uuid" +
                ") base GROUP BY concepto ORDER BY concepto";

        try {
            java.util.List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, id);
            java.util.List<Map<String, Object>> dominio = new java.util.ArrayList<>();

            for (Map<String, Object> row : rows) {
                int intentos = ((Number) row.get("intentos")).intValue();
                int aciertos = ((Number) row.get("aciertos")).intValue();
                int ejerciciosDominados = ((Number) row.get("ejercicios_dominados")).intValue();
                int porcentaje = intentos > 0 ? (int) Math.round((aciertos * 100.0) / intentos) : 0;

                Map<String, Object> item = new HashMap<>();
                item.put("concepto", row.get("concepto"));
                item.put("intentos", intentos);
                item.put("aciertos", aciertos);
                item.put("ejercicios_dominados", ejerciciosDominados);
                item.put("dominio", porcentaje);
                item.put("insignia_desbloqueada", porcentaje >= 70 && ejerciciosDominados >= 2);
                item.put("ultima_practica", row.get("ultima_practica") != null ? row.get("ultima_practica").toString() : null);
                dominio.add(item);
            }

            return dominio;
        } catch (Exception e) {
            logger.warn("No se pudo calcular dominio por concepto para {}: {}", id, e.getMessage());
            return new java.util.ArrayList<>();
        }
    }

    private java.util.List<String> construirRecomendacionesAprendizaje(java.util.List<Map<String, Object>> dominioConceptos) {
        java.util.List<String> recomendaciones = new java.util.ArrayList<>();

        for (Map<String, Object> concepto : dominioConceptos) {
            int intentos = ((Number) concepto.getOrDefault("intentos", 0)).intValue();
            int dominio = ((Number) concepto.getOrDefault("dominio", 0)).intValue();
            if (intentos >= 2 && dominio < 60) {
                recomendaciones.add("Refuerza " + concepto.get("concepto") + ": repite ejercicios cortos y revisa el error antes de validar otra vez.");
            }
        }

        if (recomendaciones.isEmpty()) {
            recomendaciones.add("Mantén una práctica diaria corta para conservar la racha y consolidar conceptos.");
        }

        return recomendaciones;
    }

    public String guardarFotoPerfil(String id, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Archivo vacío");
        }
        if (file.getSize() > MAX_PROFILE_IMAGE_BYTES) {
            throw new ResponseStatusException(HttpStatus.valueOf(413), "La imagen no debe superar 2 MB");
        }

        byte[] bytes = file.getBytes();
        String ext = detectarExtensionImagen(bytes);
        String filename = "perfil_" + id.replace("-", "") + "_" + UUID.randomUUID() + "." + ext;
        Path imgPath = resolverRutaImagen(filename);
        Files.write(imgPath, bytes);
        return "/api/usuarios/imagen/" + filename;
    }

    public String obtenerFotoPerfil(String id) {
        Path uploadsDir = obtenerDirectorioUploads();
        String uid = id.replace("-", "");
        File dir = uploadsDir.toFile();
        File[] files = dir.listFiles((d, name) -> name.startsWith("perfil_" + uid));

        if (files != null && files.length > 0) {
            Arrays.sort(files, (a, b) -> Long.compare(b.lastModified(), a.lastModified()));
            return "/api/usuarios/imagen/" + files[0].getName();
        }
        return "";
    }

    public ImagenPerfil cargarImagenPerfil(String filename) throws IOException {
        Path path = resolverRutaImagen(filename);
        if (!Files.exists(path)) {
            return null;
        }

        String contentType = filename.endsWith(".png") ? "image/png" :
                filename.endsWith(".webp") ? "image/webp" : "image/jpeg";
        return new ImagenPerfil(contentType, Files.readAllBytes(path));
    }

    private String detectarExtensionImagen(byte[] bytes) {
        if (bytes.length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "webp";
        }
        if (bytes.length >= 8
                && (bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                && (bytes[4] & 0xFF) == 0x0D && (bytes[5] & 0xFF) == 0x0A && (bytes[6] & 0xFF) == 0x1A && (bytes[7] & 0xFF) == 0x0A) {
            return "png";
        }
        if (bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        throw new IllegalArgumentException("Solo se permiten imagenes JPG, PNG o WEBP validas");
    }

    private Path obtenerDirectorioUploads() {
        try {
            Path uploadsDir = Paths.get(System.getProperty("user.dir"), "uploads").toAbsolutePath().normalize();
            Files.createDirectories(uploadsDir);
            return uploadsDir;
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo preparar el directorio de imagenes", e);
        }
    }

    private Path resolverRutaImagen(String filename) {
        if (filename == null || !filename.matches(PROFILE_IMAGE_PATTERN)) {
            throw new IllegalArgumentException("Nombre de imagen invalido");
        }
        Path uploadsDir = obtenerDirectorioUploads();
        Path path = uploadsDir.resolve(filename).normalize();
        if (!path.startsWith(uploadsDir)) {
            throw new IllegalArgumentException("Ruta de imagen invalida");
        }
        return path;
    }

    public record ImagenPerfil(String contentType, byte[] bytes) {}
}
