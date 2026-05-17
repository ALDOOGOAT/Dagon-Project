package com.dagon.backend.service;

import com.dagon.backend.dto.UsuarioResponseDTO;
import com.dagon.backend.model.Usuario;
import com.dagon.backend.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

    // --- FUNCION 1: REGISTRO ---
    public Usuario registrarUsuario(Usuario nuevoUsuario, String rol) {
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

        Integer idRol = resolverIdRol(rol);
        nuevoUsuario.setIdRol(idRol);
        nuevoUsuario.setPasswordHash(passwordEncoder.encode(nuevoUsuario.getPasswordHash()));

        return usuarioRepository.save(nuevoUsuario);
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
            java.time.LocalDate hoy = java.time.LocalDate.now();

            String sqlUltimaPractica = "SELECT ultima_practica FROM lms_core.usuarios WHERE id_usuario = ?::uuid";
            java.sql.Date ultimaPractica = jdbcTemplate.queryForObject(sqlUltimaPractica, java.sql.Date.class, usuarioId);

            if (ultimaPractica == null) {
                String updateSql = "UPDATE lms_core.usuarios SET racha_actual = 1, mejor_racha = 1, ultima_practica = ?::date WHERE id_usuario = ?::uuid";
                jdbcTemplate.update(updateSql, hoy.toString(), usuarioId);
                return;
            }

            java.time.LocalDate ultFecha = ultimaPractica.toLocalDate();

            if (ultFecha.equals(hoy)) {
                return;
            } else if (ultFecha.equals(hoy.minusDays(1))) {
                String sqlUpdate = "UPDATE lms_core.usuarios SET racha_actual = racha_actual + 1, ultima_practica = ?::date WHERE id_usuario = ?::uuid";
                jdbcTemplate.update(sqlUpdate, hoy.toString(), usuarioId);

                String sqlCheck = "SELECT racha_actual FROM lms_core.usuarios WHERE id_usuario = ?::uuid";
                int rachaActual = jdbcTemplate.queryForObject(sqlCheck, Integer.class, usuarioId);

                String sqlMejor = "UPDATE lms_core.usuarios SET mejor_racha = ? WHERE id_usuario = ?::uuid AND mejor_racha < ?";
                jdbcTemplate.update(sqlMejor, rachaActual, usuarioId, rachaActual);
            } else {
                String updateSql = "UPDATE lms_core.usuarios SET racha_actual = 1, ultima_practica = ?::date WHERE id_usuario = ?::uuid";
                jdbcTemplate.update(updateSql, hoy.toString(), usuarioId);
            }

            logger.debug("Practica diaria registrada para el usuario con ID: {}", usuarioId);
        } catch (Exception e) {
            logger.warn("Error al registrar practica diaria: {}", e.getMessage());
        }
    }

    public Optional<UsuarioResponseDTO> obtenerPerfilSeguro(String id) {
        return usuarioRepository.findById(UUID.fromString(id)).map(UsuarioResponseDTO::from);
    }

    public Map<String, Object> obtenerEstadisticas(String id) {
        Map<String, Object> stats = new HashMap<>();

        try {
            String sqlXP = "SELECT COALESCE(SUM(e.dificultad * 10), 0) " +
                    "FROM (SELECT DISTINCT id_ejercicio FROM lms_core.intentos WHERE id_usuario = ?::uuid AND es_correcto = true) as unicos " +
                    "JOIN lms_core.ejercicios_practicos e ON unicos.id_ejercicio = e.id_ejercicio";
            stats.put("xp", jdbcTemplate.queryForObject(sqlXP, Integer.class, id));

            String sqlRank = "SELECT posicion FROM (" +
                    "  SELECT id_usuario, RANK() OVER (ORDER BY xp_total DESC) as posicion " +
                    "  FROM lms_core.v_ranking_alumnos" +
                    ") ranking_tabla WHERE id_usuario = ?::uuid";
            try {
                stats.put("posicion", jdbcTemplate.queryForObject(sqlRank, Integer.class, id));
            } catch (Exception noRank) {
                stats.put("posicion", "-");
            }

            String sqlConsultas = "SELECT COUNT(*) FROM lms_core.intentos WHERE id_usuario = ?::uuid";
            stats.put("consultas_totales", jdbcTemplate.queryForObject(sqlConsultas, Integer.class, id));

            String sqlCompletados = "SELECT COUNT(DISTINCT id_ejercicio) FROM lms_core.intentos WHERE id_usuario = ?::uuid AND es_correcto = true";
            stats.put("ejercicios_completados", jdbcTemplate.queryForObject(sqlCompletados, Integer.class, id));

            String sqlRacha = "SELECT racha_actual, mejor_racha FROM lms_core.usuarios WHERE id_usuario = ?::uuid";
            Map<String, Object> rachaData = jdbcTemplate.queryForMap(sqlRacha, id);
            int rachaActual = ((Number) rachaData.get("racha_actual")).intValue();
            int mejorRacha = ((Number) rachaData.get("mejor_racha")).intValue();

            stats.put("racha", rachaActual);
            stats.put("mejor_racha", mejorRacha);

            String sqlFechas = "SELECT DISTINCT DATE(fecha_intento) as fecha_actividad " +
                    "FROM lms_core.intentos WHERE id_usuario = ?::uuid ORDER BY fecha_actividad DESC";
            java.util.List<java.sql.Date> fechas = jdbcTemplate.queryForList(sqlFechas, java.sql.Date.class, id);
            java.util.List<String> fechasStr = new java.util.ArrayList<>();
            for (java.sql.Date f : fechas) {
                fechasStr.add(f.toString());
            }
            stats.put("fechas_actividad", fechasStr);

            String sqlDistribucion = "SELECT e.dificultad, SUM(e.dificultad * 10) as xp_ganada " +
                    "FROM (SELECT DISTINCT id_ejercicio FROM lms_core.intentos WHERE id_usuario = ?::uuid AND es_correcto = true) as unicos " +
                    "JOIN lms_core.ejercicios_practicos e ON unicos.id_ejercicio = e.id_ejercicio " +
                    "GROUP BY e.dificultad " +
                    "ORDER BY e.dificultad";
            try {
                java.util.List<Map<String, Object>> distribucion = jdbcTemplate.queryForList(sqlDistribucion, id);
                stats.put("distribucion_xp", distribucion);
            } catch (Exception e) {
                stats.put("distribucion_xp", new java.util.ArrayList<>());
            }

            java.util.List<Map<String, Object>> dominioConceptos = obtenerDominioConceptos(id);
            stats.put("dominio_conceptos", dominioConceptos);
            stats.put("recomendaciones_aprendizaje", construirRecomendacionesAprendizaje(dominioConceptos));

            stats.put("success", true);
        } catch (Exception e) {
            logger.warn("Error al obtener estadisticas del usuario {}: {}", id, e.getMessage());
            stats.put("success", false);
        }

        return stats;
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
