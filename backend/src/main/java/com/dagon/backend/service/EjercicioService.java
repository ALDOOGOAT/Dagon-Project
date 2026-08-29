package com.dagon.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.dagon.backend.dto.EjercicioDTO;
import com.dagon.backend.dto.NivelDTO;
import com.dagon.backend.model.EjercicioPractico;
import com.dagon.backend.repository.EjercicioPracticoRepository;
import com.dagon.backend.service.validation.EjercicioValidationRouter;
import com.dagon.backend.service.validation.ValidadorDiagrama;
import com.dagon.backend.service.validation.SandboxSqlPolicy;
import com.dagon.backend.service.validation.TipoValidacionEjercicio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.*;

@Service
public class EjercicioService {
    private static final int PRACTICA_RAPIDA_XP = 5;
    private static final int PRACTICA_RAPIDA_XP_DIARIA_MAX = 25;
    private static final int PRACTICA_RAPIDA_ACIERTOS_DIARIOS_CON_XP = PRACTICA_RAPIDA_XP_DIARIA_MAX / PRACTICA_RAPIDA_XP;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private EjercicioPracticoRepository repository;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private EjercicioValidationRouter validationRouter;

    @Autowired
    private ValidadorDiagrama validadorDiagrama;

    @Autowired
    private SandboxSqlPolicy sandboxSqlPolicy;

    @Autowired
    private SqlPerformanceService sqlPerformanceService;

    @Autowired
    private LeaderboardService leaderboardService;

    @Autowired
    private SandboxExecutionService sandboxExecutionService;

    @Autowired
    private RewardService rewardService;

    @Value("${dagon.sandbox.url}")
    private String sandboxUrl;

    @Value("${dagon.sandbox.username}")
    private String sandboxUser;

    @Value("${dagon.sandbox.password}")
    private String sandboxPassword;

    public List<NivelDTO> obtenerTodosLosNiveles() {
        return obtenerTodosLosNiveles(null);
    }

    public List<NivelDTO> obtenerTodosLosNiveles(String usuarioId) {
        Integer xpUsuario = obtenerXpUsuario(usuarioId);
        boolean accesoDocente = usuarioEsDocenteOAdmin(usuarioId);

        String sql = "SELECT id_modulo, titulo, descripcion, xp_requerida " +
                "FROM lms_core.modulos ORDER BY id_curso ASC, orden ASC, id_modulo ASC";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        List<NivelDTO> modulos = new ArrayList<>();

        for (Map<String, Object> row : rows) {
            NivelDTO modulo = new NivelDTO();
            modulo.setId(obtenerEntero(row.get("id_modulo"), null));
            modulo.setName(Objects.toString(row.get("titulo"), "Modulo SQL"));
            modulo.setDescription(Objects.toString(row.get("descripcion"), ""));

            int xpRequerida = obtenerEntero(row.get("xp_requerida"), 0);
            modulo.setLocked(!accesoDocente && xpUsuario < xpRequerida);
            modulos.add(modulo);
        }

        return modulos;
    }

    private Integer obtenerXpUsuario(String usuarioId) {
        if (usuarioId == null || usuarioId.isBlank()) return 0;
        try {
            Number xp = jdbcTemplate.queryForObject(
                    "SELECT xp_total FROM lms_core.v_ranking_alumnos WHERE id_usuario::varchar = ? OR email = ?",
                    Number.class,
                    usuarioId,
                    usuarioId
            );
            return xp != null ? xp.intValue() : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private boolean usuarioEsDocenteOAdmin(String usuarioId) {
        Integer rol = obtenerRolUsuario(usuarioId);
        return rol != null && (rol == 2 || rol == 3);
    }
    public List<EjercicioDTO> obtenerEjerciciosPorModulo(Integer moduloId) {
        return obtenerEjerciciosPorModulo(moduloId, null);
    }
    public List<EjercicioDTO> obtenerEjerciciosPorModulo(Integer moduloId, String usuarioId) {
        List<EjercicioPractico> crudos = repository.findDisponiblesPorModulo(moduloId, usuarioId);
        List<EjercicioDTO> dtos = new ArrayList<>();
        boolean mostrarRespuestaEsperada = usuarioPuedeVerSoluciones(usuarioId);

        int contador = 1;
        for(EjercicioPractico ej : crudos) {
            EjercicioDTO dto = new EjercicioDTO();
            dto.setId(ej.getIdEjercicio());
            dto.setTitle(ej.getTitulo() != null ? ej.getTitulo() : "Misión " + contador);
            dto.setDescription(ej.getEnunciado());
            dto.setOrden(ej.getOrden() != null ? ej.getOrden() : contador);
            dto.setIdModulo(ej.getIdModulo());
            dto.setDifficulty(ej.getDificultad() != null ? ej.getDificultad() : 1);
            dto.setXpReward("RAPIDA".equals(ej.getTipoMision()) ? PRACTICA_RAPIDA_XP : dto.getDifficulty() * 10);
            dto.setTimeLimitSeconds(calcularTiempoPractica(ej.getQueryMaestra(), dto.getDifficulty()));
            dto.setConcept(construirConceptoPractica(ej.getQueryMaestra(), ej.getIdModulo()));
            dto.setVisibilidad(ej.getVisibilidad() != null ? ej.getVisibilidad() : "GLOBAL");
            dto.setIdGrupo(ej.getIdGrupo());
            dto.setRecursoDocente(!"GLOBAL".equalsIgnoreCase(dto.getVisibilidad()));
            if (mostrarRespuestaEsperada) {
                dto.setExpectedQuery(ej.getQueryMaestra());
            }

            String formato = ej.getFormato();

            if (formato == null || formato.isEmpty()) {
                boolean usarDragAndDrop = false;
                if (moduloId == 1) {
                    usarDragAndDrop = true;
                } else if (moduloId == 2) {
                    usarDragAndDrop = (contador == 1 || contador == 3);
                } else {
                    usarDragAndDrop = (contador == 2);
                }
                formato = usarDragAndDrop ? "drag_drop" : "editor";
            }

            dto.setType(formato);

            if ("drag_drop".equals(formato)) {
                dto.setHint("Pista: Arrastra las palabras azules al área de armado. No olvides el punto y coma (;)");
                String queryReal = ej.getQueryMaestra();
                    if (queryReal != null) {
                        List<String> bancoPalabras = new ArrayList<>();

                        for (String palabra : queryReal.replaceAll(";", " ;").split("\\s+")) {
                            if (palabra != null && !palabra.trim().isEmpty()) {
                                bancoPalabras.add(palabra.trim());
                            }
                        }

                        bancoPalabras.addAll(Arrays.asList(
                            "WHERE", "JOIN", "ON", "COUNT", "*", "roles", "cursos", "INSERT", "equipamiento"
                        ));

                        if (moduloId == 1) {
                            bancoPalabras.addAll(Arrays.asList(
                                "aventureros", "DELETE", "UPDATE", "GROUP", "BY", "HAVING",
                                "ASC", "LIMIT", "ORDER", "LIKE", "DESC", "nombre", "nivel", "clase"
                            ));
                        }

                        Collections.shuffle(bancoPalabras);
                        dto.setWordBank(bancoPalabras);
                    }
            } else if ("diagram".equals(formato)) {
                dto.setHint("Pista: Arrastra una nueva entidad, ponle nombre y conéctala arrastrando desde el punto cyan hasta el fucsia.");
                dto.setStarterCode("");
            } else {
                dto.setStarterCode("-- Escribe tu consulta SQL aquí\n");
                dto.setHint("Pista: Recuerda usar la sintaxis correcta y terminar con punto y coma (;).");
            }

            dto.setPedagogia(construirPedagogiaEjercicio(ej));
            dtos.add(dto);
            contador++;
        }
        return dtos;
    }

    private boolean usuarioPuedeVerSoluciones(String usuarioId) {
        Integer rol = obtenerRolUsuario(usuarioId);
        return rol != null && (rol == 2 || rol == 3);
    }

    private boolean usuarioEsAdmin(String usuarioId) {
        Integer rol = obtenerRolUsuario(usuarioId);
        return rol != null && rol == 3;
    }

    private Integer obtenerRolUsuario(String usuarioId) {
        if (usuarioId == null || usuarioId.isBlank()) return null;
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT id_rol FROM lms_core.usuarios " +
                            "WHERE (id_usuario::varchar = ? OR LOWER(email) = LOWER(?)) AND activo = true",
                    Integer.class,
                    usuarioId,
                    usuarioId
            );
        } catch (Exception e) {
            return null;
        }
    }

    private boolean usuarioPuedeAccederEjercicio(EjercicioPractico ejercicio, String usuarioId) {
        if (ejercicio == null) return false;
        String visibilidad = ejercicio.getVisibilidad() != null ? ejercicio.getVisibilidad().trim().toUpperCase(Locale.ROOT) : "GLOBAL";
        if ("GLOBAL".equals(visibilidad)) return true;
        if (usuarioId == null || usuarioId.isBlank()) return false;
        if (usuarioEsAdmin(usuarioId)) return true;

        if (ejercicio.getCreadoPor() != null && ejercicio.getCreadoPor().toString().equals(usuarioId)) {
            return true;
        }

        if ("GRUPO".equals(visibilidad) && ejercicio.getIdGrupo() != null) {
            Integer total = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM lms_core.grupo_alumnos " +
                            "WHERE id_grupo = ? AND id_alumno = ?::uuid AND activo = true",
                    Integer.class,
                    ejercicio.getIdGrupo(),
                    usuarioId
            );
            return total != null && total > 0;
        }

        return false;
    }

    public Map<String, Object> obtenerMetadataModulo(Integer moduloId) {
        String sql = "SELECT id_modulo, id_curso, titulo, descripcion, orden, xp_requerida, " +
                "objetivos::text AS objetivos, prerequisitos::text AS prerequisitos, " +
                "errores_comunes::text AS errores_comunes, cinematica_config::text AS cinematica_config " +
                "FROM lms_core.modulos WHERE id_modulo = ?";

        try {
            Map<String, Object> row = jdbcTemplate.queryForMap(sql, moduloId);
            return construirMetadataModulo(row);
        } catch (Exception e) {
            String fallbackSql = "SELECT id_modulo, id_curso, titulo, descripcion, orden, xp_requerida " +
                    "FROM lms_core.modulos WHERE id_modulo = ?";
            try {
                Map<String, Object> row = jdbcTemplate.queryForMap(fallbackSql, moduloId);
                return construirMetadataModulo(row);
            } catch (Exception ignored) {
                return Map.of("id_modulo", moduloId);
            }
        }
    }

    private Map<String, Object> construirMetadataModulo(Map<String, Object> row) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("id_modulo", row.get("id_modulo"));
        metadata.put("id_curso", row.get("id_curso"));
        metadata.put("titulo", row.get("titulo"));
        metadata.put("descripcion", row.get("descripcion"));
        metadata.put("orden", row.get("orden"));
        metadata.put("xp_requerida", row.get("xp_requerida"));
        metadata.put("objetivos", parseJsonColumn(row.get("objetivos"), List.of()));
        metadata.put("prerequisitos", parseJsonColumn(row.get("prerequisitos"), List.of()));
        metadata.put("errores_comunes", parseJsonColumn(row.get("errores_comunes"), List.of()));
        metadata.put("cinematica_config", parseJsonColumn(row.get("cinematica_config"), Map.of()));
        return metadata;
    }

    private Object parseJsonColumn(Object rawValue, Object fallback) {
        if (rawValue == null) return fallback;

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(rawValue.toString());
            return mapper.convertValue(node, Object.class);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    public List<EjercicioDTO> obtenerEjerciciosPracticaRapida() {
        return obtenerEjerciciosPracticaRapida("mixto", 3, null);
    }

    public List<EjercicioDTO> obtenerEjerciciosPracticaRapida(String nivel, int limite, String usuarioId) {
        int limiteSeguro = Math.max(3, Math.min(limite, 12));
        String nivelNormalizado = nivel != null ? nivel.trim().toLowerCase(Locale.ROOT) : "mixto";
        int[] rango = resolverRangoComplejidadPractica(nivelNormalizado);
        boolean permitirMutaciones = permiteMutacionesEnPractica(nivelNormalizado);
        String seleccionBase = construirSelectBasePracticaRapida();

        String sqlConUsuario = seleccionBase +
                "WHERE q.complejidad_rapida BETWEEN ? AND ? " +
                "AND (? OR q.select_seguro = true) " +
                "ORDER BY CASE WHEN EXISTS ( " +
                "    SELECT 1 FROM lms_core.intentos i " +
                "    WHERE i.id_usuario = ?::uuid " +
                "      AND i.id_ejercicio = q.id_ejercicio " +
                "      AND i.es_correcto = true " +
                "      AND DATE(i.fecha_intento) = CURRENT_DATE " +
                ") THEN 1 ELSE 0 END, q.complejidad_rapida, RANDOM() " +
                "LIMIT ?";

        String sqlSinUsuario = seleccionBase +
                "WHERE q.complejidad_rapida BETWEEN ? AND ? " +
                "AND (? OR q.select_seguro = true) " +
                "ORDER BY q.complejidad_rapida, RANDOM() " +
                "LIMIT ?";

        List<Map<String, Object>> crudos;
        if (usuarioId != null && !usuarioId.trim().isEmpty()) {
            crudos = jdbcTemplate.queryForList(sqlConUsuario, rango[0], rango[1], permitirMutaciones, usuarioId, limiteSeguro);
        } else {
            crudos = jdbcTemplate.queryForList(sqlSinUsuario, rango[0], rango[1], permitirMutaciones, limiteSeguro);
        }

        if (crudos.isEmpty()) {
            String fallbackSql = seleccionBase +
                    "WHERE (? OR q.select_seguro = true) " +
                    "ORDER BY ABS(q.complejidad_rapida - ?), q.complejidad_rapida, RANDOM() LIMIT ?";
            crudos = jdbcTemplate.queryForList(fallbackSql, permitirMutaciones, rango[0], limiteSeguro);
        }

        List<EjercicioDTO> dtos = new ArrayList<>();
        int contador = 1;
        for (Map<String, Object> ejMap : crudos) {
            dtos.add(construirDtoPracticaRapida(ejMap, contador++));
        }
        return dtos;
    }

    private EjercicioDTO construirDtoPracticaRapida(Map<String, Object> ejMap, int contador) {
        EjercicioDTO dto = new EjercicioDTO();
        Integer dificultad = obtenerEntero(ejMap.get("complejidad_rapida"), obtenerEntero(ejMap.get("dificultad"), 1));
        String queryReal = (String) ejMap.get("query_maestra");
        String titulo = (String) ejMap.get("titulo");

        dto.setId(obtenerEntero(ejMap.get("id_ejercicio"), null));
        dto.setIdModulo(obtenerEntero(ejMap.get("id_modulo"), null));
        dto.setTitle(titulo != null && !titulo.isBlank() ? titulo : "Misión Relámpago " + contador);
        dto.setDescription((String) ejMap.get("enunciado"));
        dto.setType("drag_drop");
        dto.setHint("Arma la consulta por bloques. Si el tiempo presiona, identifica primero SELECT, FROM y la condicion central.");
        dto.setOrden(obtenerEntero(ejMap.get("orden"), contador));
        dto.setDifficulty(dificultad);
        dto.setXpReward(PRACTICA_RAPIDA_XP);
        dto.setTimeLimitSeconds(calcularTiempoPractica(queryReal, dificultad));
        dto.setConcept(construirConceptoPractica(queryReal, dto.getIdModulo()));
        dto.setWordBank(construirBancoPalabrasPractica(queryReal));
        return dto;
    }

    private String construirSelectBasePracticaRapida() {
        return "SELECT q.* FROM (" +
                "SELECT e.*, " +
                sqlComplejidadPracticaRapida() + " AS complejidad_rapida, " +
                sqlSelectSeguroPracticaRapida() + " AS select_seguro " +
                "FROM lms_core.ejercicios_practicos e " +
                "WHERE e.tipo_mision = 'RAPIDA'" +
                ") q ";
    }

    private String sqlComplejidadPracticaRapida() {
        String q = "UPPER(TRIM(COALESCE(e.query_maestra, '')))";
        return "CASE " +
                "WHEN " + q + " LIKE 'BEGIN%' OR " + q + " LIKE 'COMMIT%' OR " + q + " LIKE 'ROLLBACK%' " +
                "OR " + q + " LIKE 'CREATE%' OR " + q + " LIKE 'ALTER%' OR " + q + " LIKE 'DROP%' " +
                "OR " + q + " LIKE 'INSERT%' OR " + q + " LIKE 'UPDATE%' OR " + q + " LIKE 'DELETE%' THEN 5 " +
                "WHEN " + q + " LIKE '% JOIN %' AND (" + q + " LIKE '% GROUP BY%' OR " + q + " LIKE '% HAVING%') THEN 4 " +
                "WHEN " + q + " LIKE 'WITH %' OR " + q + " LIKE '% IN ( SELECT%' OR " + q + " LIKE '% NOT IN ( SELECT%' THEN 4 " +
                "WHEN " + q + " LIKE '% JOIN %' OR " + q + " LIKE '% GROUP BY%' OR " + q + " LIKE '% HAVING%' OR " + q + " LIKE '%NEXTVAL%' OR " + q + " LIKE '%CURRVAL%' " +
                "OR " + q + " LIKE '%COUNT(%' OR " + q + " LIKE '%COUNT(*)%' OR " + q + " LIKE '%AVG(%' OR " + q + " LIKE '%SUM(%' OR " + q + " LIKE '%MIN(%' OR " + q + " LIKE '%MAX(%' THEN 3 " +
                "WHEN " + q + " LIKE '% WHERE %' OR " + q + " LIKE '% BETWEEN %' OR " + q + " LIKE '% IS NULL%' OR " + q + " LIKE '% ORDER BY%' " +
                "THEN 2 " +
                "ELSE 1 END";
    }

    private String sqlSelectSeguroPracticaRapida() {
        String q = "UPPER(TRIM(COALESCE(e.query_maestra, '')))";
        return "(" + q + " LIKE 'SELECT%' " +
                "AND " + q + " NOT LIKE '%NEXTVAL%' " +
                "AND " + q + " NOT LIKE '%CURRVAL%' " +
                "AND " + q + " NOT LIKE '%SETVAL%' " +
                "AND " + q + " NOT LIKE '%; INSERT%' " +
                "AND " + q + " NOT LIKE '%; UPDATE%' " +
                "AND " + q + " NOT LIKE '%; DELETE%' " +
                "AND " + q + " NOT LIKE '%; CREATE%' " +
                "AND " + q + " NOT LIKE '%; ALTER%' " +
                "AND " + q + " NOT LIKE '%; DROP%')";
    }

    private int[] resolverRangoComplejidadPractica(String nivel) {
        return switch (nivel) {
            case "nivel-0", "basico-inicial" -> new int[]{1, 1};
            case "basico" -> new int[]{2, 2};
            case "medio", "intermedio" -> new int[]{3, 3};
            case "avanzado" -> new int[]{4, 4};
            case "experto" -> new int[]{5, 5};
            default -> new int[]{1, 5};
        };
    }

    private boolean permiteMutacionesEnPractica(String nivel) {
        return "avanzado".equals(nivel) || "experto".equals(nivel) || "mixto".equals(nivel) || "libre".equals(nivel);
    }

    private Integer obtenerEntero(Object valor, Integer fallback) {
        if (valor instanceof Number numero) {
            return numero.intValue();
        }
        if (valor != null) {
            try {
                return Integer.parseInt(valor.toString());
            } catch (NumberFormatException ignored) {}
        }
        return fallback;
    }

    private List<String> construirBancoPalabrasPractica(String queryReal) {
        LinkedHashSet<String> bancoPalabras = new LinkedHashSet<>();

        if (queryReal != null) {
            for (String palabra : queryReal.replaceAll(";", " ;").split("\\s+")) {
                if (palabra != null && !palabra.trim().isEmpty()) {
                    bancoPalabras.add(palabra.trim());
                }
            }
        }

        bancoPalabras.addAll(Arrays.asList(
                "SELECT", "FROM", "WHERE", "GROUP", "BY", "HAVING", "ORDER", "ASC", "DESC",
                "COUNT(*)", "MAX(nivel)", "MIN(precio)", "AVG(nivel)",
                "aventureros", "equipamiento", "nombre", "clase", "nivel", "item", "precio"
        ));

        List<String> mezclado = new ArrayList<>(bancoPalabras);
        Collections.shuffle(mezclado);
        return mezclado;
    }

    private int calcularTiempoPractica(String queryReal, int dificultad) {
        int palabras = queryReal != null ? Math.max(4, queryReal.replaceAll(";", " ;").trim().split("\\s+").length) : 8;
        int segundos = 24 + palabras + (Math.max(1, dificultad) * 6);

        if (queryReal != null) {
            String upper = queryReal.toUpperCase(Locale.ROOT);
            if (upper.contains("JOIN") || upper.contains("GROUP BY") || upper.contains("HAVING")) {
                segundos += 8;
            }
            if (upper.matches("^[\\s\\S]*(CREATE|ALTER|INSERT|UPDATE|DELETE|BEGIN|COMMIT|ROLLBACK)[\\s\\S]*$")) {
                segundos += 10;
            }
        }

        return Math.max(28, Math.min(segundos, 85));
    }

    private String construirConceptoPractica(String queryReal, Integer idModulo) {
        String upper = queryReal != null ? queryReal.trim().toUpperCase(Locale.ROOT) : "";

        if ((idModulo != null && (idModulo == 15 || idModulo == 16)) || upper.contains("BEGIN") || upper.contains("COMMIT") || upper.contains("ROLLBACK")) {
            return "Transacciones";
        }
        if (upper.contains("NEXTVAL") || upper.contains("CURRVAL") || upper.contains("SETVAL")) {
            return "Secuencias";
        }
        if (upper.startsWith("CREATE") || upper.startsWith("ALTER") || upper.startsWith("DROP") || upper.contains("CONSTRAINT")) {
            return "DDL y reglas";
        }
        if (upper.startsWith("INSERT") || upper.startsWith("UPDATE") || upper.startsWith("DELETE")) {
            return "Cambios controlados";
        }
        if (upper.contains("JOIN")) {
            return "Relaciones entre tablas";
        }
        if (upper.contains("GROUP BY") || upper.contains("COUNT") || upper.contains("AVG") || upper.contains("SUM") || upper.contains("MAX") || upper.contains("MIN") || upper.contains("HAVING")) {
            return "Agregaciones";
        }
        if (upper.contains("WHERE") || upper.contains("BETWEEN") || upper.contains("LIKE") || upper.contains(" IS NULL") || upper.contains(" IN ")) {
            return "Filtros";
        }
        return "Lectura con SELECT";
    }

    // ejecutarEnSandbox*, aplicarTimeoutSandbox y extraerNombreTablaDDL viven en
    // SandboxExecutionService (ver campo sandboxExecutionService más abajo).

    /**
     * Punto unico de entrada. Delega en ejecutarValidacion (que tiene ~16 salidas distintas)
     * y deja constancia del intento UNA sola vez, aqui. Antes cada rama era responsable de
     * llamar a registrarIntento y solo dos lo hacian: los fallos por error de SQL o por
     * rechazo del SqlExerciseGuard no se registraban, y el panel docente veia 100% de acierto.
     * Registrar fallos es puramente aditivo: XP y calificaciones se derivan de es_correcto = true.
     */
    public Map<String, Object> validarConsulta(Integer ejercicioId, String queryUsuario, String usuarioId) {
        long inicioValidacion = System.nanoTime();
        Map<String, Object> respuesta = ejecutarValidacion(ejercicioId, queryUsuario, usuarioId, inicioValidacion);
        registrarIntentoDeEsteEnvio(ejercicioId, queryUsuario, usuarioId, respuesta, inicioValidacion);
        respuesta.remove(SIN_REGISTRO);
        return respuesta;
    }

    /** Marca en la respuesta las salidas que no representan un intento del alumno. */
    private static final String SIN_REGISTRO = "__sinRegistro";

    private void registrarIntentoDeEsteEnvio(Integer ejercicioId, String queryUsuario, String usuarioId,
                                             Map<String, Object> respuesta, long inicioValidacion) {
        if (usuarioId == null || usuarioId.trim().isEmpty() || Boolean.TRUE.equals(respuesta.get(SIN_REGISTRO))) {
            return;
        }

        boolean esCorrecto = Boolean.TRUE.equals(respuesta.get("success"));

        // Si hubo EXPLAIN ANALYZE usamos sus metricas reales; si no, el tiempo de pared.
        Object perf = respuesta.get("performance");
        Double tiempoMs = null;
        Double costoEjecucion = null;
        if (perf instanceof Map<?, ?> mapaPerf) {
            tiempoMs = comoDouble(mapaPerf.get("executionTimeMs"));
            costoEjecucion = comoDouble(mapaPerf.get("totalCost"));
        }
        if (tiempoMs == null) {
            tiempoMs = rewardService.calcularTiempoMs(inicioValidacion);
        }

        try {
            rewardService.registrarIntento(usuarioId, ejercicioId, queryUsuario, esCorrecto, tiempoMs, costoEjecucion);
        } catch (Exception ignored) {}
    }

    private Double comoDouble(Object valor) {
        return valor instanceof Number numero ? numero.doubleValue() : null;
    }

private Map<String, Object> ejecutarValidacion(Integer ejercicioId, String queryUsuario, String usuarioId, long inicioValidacion) {
    Map<String, Object> respuesta = new HashMap<>();

    // --- 1. INTERCEPCIÓN ESTRATÉGICA (Antes del Escudo) ---
    EjercicioPractico ejercicioActual = repository.findById(ejercicioId).orElse(null);
    if (ejercicioActual != null && !usuarioPuedeAccederEjercicio(ejercicioActual, usuarioId)) {
        respuesta.put("success", false);
        respuesta.put("message", "No tienes permiso para resolver este ejercicio.");
        respuesta.put(SIN_REGISTRO, true);
        return respuesta;
    }

    // Verificamos si este ejercicio tiene el pase VIP (Validación Textual)
    if (ejercicioActual != null && ejercicioActual.getConfiguracionExtra() != null) {
        String configExtra = ejercicioActual.getConfiguracionExtra().toString(); // O el método que uses para leer ese JSON
        
        if (configExtra.contains("\"tipo_validacion\":\"TEXTUAL\"")) {
            // Limpiamos espacios extra para no castigar por un doble espacio accidental
            String queryMaestra = ejercicioActual.getQueryMaestra().trim().toLowerCase().replaceAll("\\s+", " ");
            String cleanUsuario = queryUsuario.trim().toLowerCase().replaceAll("\\s+", " ");

            if (cleanUsuario.equals(queryMaestra)) {
                respuesta.put("success", true);
                respuesta.put("message", "¡Excelente! Has destruido la tabla correctamente sin dañar el reino.");
                // Aquí podrías agregar la lógica de XP si la manejas en este punto
            } else {
                respuesta.put("success", false);
                respuesta.put("message", "La sintaxis no coincide con el comando destructor esperado. Revisa tu DROP.");
            }
            
            // ¡HUIDA TEMPRANA! Retornamos aquí y el Escudo de Dagon de abajo NUNCA se ejecuta.
            return respuesta; 
        }
    }// Elimina comentarios de una línea (-- ...) y saltos de línea al inicio, luego quita espacios
        String queryClean = queryUsuario.replaceAll("(?m)^--.*", "").trim().toLowerCase();
        // 2. Prevenir que intenten acceder a esquemas internos
        if (queryClean.contains("lms_core") || queryClean.contains("information_schema") || queryClean.contains("pg_catalog")) {
            if (!queryClean.startsWith("select")) { // Permitir solo lectura si es necesario para el juego
                respuesta.put("success", false);
                respuesta.put("message", "🛡️ ¡Interferencia Detectada! No tienes permiso para modificar el núcleo de Dagon.");
                // Datos para retroalimentación IA
                EjercicioPractico ejEsq = repository.findById(ejercicioId).orElse(null);
                if (ejEsq != null) {
                    respuesta.put("descripcion", ejEsq.getEnunciado());
                    respuesta.put("queryMaestra", ejEsq.getQueryMaestra());
                    respuesta.put("queryAlumno", queryUsuario);
                    respuesta.put("errorDb", "El alumno intentó acceder a esquemas internos del sistema.");
                }
                return respuesta;
            }
        }
        // -------------------------------------------

        EjercicioPractico ejercicio = repository.findById(ejercicioId).orElse(null);

        if (ejercicio == null) {
            respuesta.put("success", false);
            respuesta.put("message", "Error: Ejercicio no encontrado.");
        respuesta.put(SIN_REGISTRO, true);
            return respuesta;
        }

        Integer statementTimeoutEjercicioMs = resolverStatementTimeoutEjercicio(ejercicio);

        if (!usuarioPuedeAccederEjercicio(ejercicio, usuarioId)) {
            respuesta.put("success", false);
            respuesta.put("message", "No tienes permiso para resolver este ejercicio.");
        respuesta.put(SIN_REGISTRO, true);
            return respuesta;
        }

        Optional<Map<String, Object>> errorPrevalidacion = validationRouter.prevalidar(ejercicio, queryUsuario, usuarioId);
        if (errorPrevalidacion.isPresent()) {
            return errorPrevalidacion.get();
        }
        TipoValidacionEjercicio tipoValidacion = validationRouter.resolverTipo(ejercicio, queryUsuario);
        respuesta.put("validationType", tipoValidacion.name());

        int xpGanada = (ejercicio.getDificultad() != null ? ejercicio.getDificultad() : 1) * 10;
        String formato = ejercicio.getFormato();
        boolean esMisionTransaccional = esMisionTransaccional(ejercicio);
        boolean esCorrecto = false;
        List<Map<String, Object>> datosAlumno = new ArrayList<>();
        SqlPerformanceService.SqlPerformanceReport reporteRendimiento = null;

        try {
            if ("diagram".equals(formato)) {
                ValidadorDiagrama.ResultadoDiagrama analisis =
                        validadorDiagrama.analizar(ejercicio, queryUsuario);
                respuesta.put("diagramSummary", analisis.resumen());

                if (!analisis.esValido()) {
                    respuesta.put("success", false);
                    respuesta.put("message", analisis.problemas().get(0));
                    respuesta.put("diagramIssues", analisis.problemas());
                    respuesta.put("xp_gained", 0);
                    respuesta.put("descripcion", ejercicio.getEnunciado());
                    respuesta.put("queryMaestra", ejercicio.getQueryMaestra() != null
                            ? ejercicio.getQueryMaestra() : "Diagrama ER");
                    respuesta.put("queryAlumno", queryUsuario);
                    respuesta.put("errorDb", String.join(" ", analisis.problemas()));
                    return respuesta;
                }

                esCorrecto = true;
            } else {
                if (!queryUsuario.trim().endsWith(";")) {
                    respuesta.put("success", false);
                    respuesta.put("message", "¡Error de Sintaxis! Te faltó cerrar la instrucción con el punto y coma (;) al final.");
                    // Datos para retroalimentación IA
                    respuesta.put("descripcion", ejercicio.getEnunciado());
                    respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                    respuesta.put("queryAlumno", queryUsuario);
                    respuesta.put("errorDb", "Falta el punto y coma (;) al final de la instrucción SQL.");
                    return respuesta;
                }

                // 🌟 LEER CONFIGURACIÓN PARA VALIDACIÓN DDL/SECUENCIAS Y TEXTUAL
                boolean isDdlValidation = false;
                boolean isTextualValidation = false;
                String expectedRegex = null;
                JsonNode configValidacion = null;

                String configExtra = ejercicio.getConfiguracionExtra();
                if (configExtra != null && !configExtra.trim().isEmpty()) {
                    try {
                        ObjectMapper mapper = new ObjectMapper();
                        JsonNode config = mapper.readTree(configExtra);
                        configValidacion = config;
                        if (config.has("tipo_validacion")) {
                            String tipoVal = config.get("tipo_validacion").asText();
                            if ("ddl".equalsIgnoreCase(tipoVal)) {
                                isDdlValidation = true;
                            } else if ("TEXTUAL".equalsIgnoreCase(tipoVal)) {
                                isTextualValidation = true;
                                if (config.has("regex_esperado")) {
                                    expectedRegex = config.get("regex_esperado").asText();
                                }
                            }
                        }
                    } catch (Exception ignored) {}
                }

                // 🌟 LÓGICA DE VALIDACIÓN TEXTUAL ESTÁTICA (Para DROP/ALTER destructivos)
                if (isTextualValidation) {
                    String cleanUsuario = queryUsuario.trim().toUpperCase().replaceAll("\\s+", " ");
                    String cleanMaestra = ejercicio.getQueryMaestra() != null ? ejercicio.getQueryMaestra().trim().toUpperCase().replaceAll("\\s+", " ") : "";
                    
                    boolean match = false;
                    if (expectedRegex != null && !expectedRegex.isEmpty()) {
                        java.util.regex.Pattern p = java.util.regex.Pattern.compile(expectedRegex, java.util.regex.Pattern.CASE_INSENSITIVE);
                        match = p.matcher(queryUsuario.trim()).matches();
                    } else {
                        match = cleanUsuario.equals(cleanMaestra);
                    }
                    
                    if (match) {
                        respuesta.put("success", true);
                        respuesta.put("message", "¡Excelente! Comprendes cómo ejecutar esta instrucción de forma segura.");
                        respuesta.put("xp_gained", ejercicio.getDificultad() != null ? ejercicio.getDificultad() * 10 : 50);
                        
                        try {
                            if (usuarioId != null && !usuarioId.trim().isEmpty()) {
                                usuarioService.registrarPracticaDiaria(usuarioId);
                            }
                        } catch (Exception ignored) {}
                        
                        return respuesta;
                    } else {
                        respuesta.put("success", false);
                        respuesta.put("message", "Sintaxis incorrecta. Revisa tu instrucción con cuidado.");
                        respuesta.put("descripcion", ejercicio.getEnunciado());
                        respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                        respuesta.put("queryAlumno", queryUsuario);
                        respuesta.put("errorDb", "Validación textual fallida: La instrucción no coincide con la sintaxis esperada.");
                        return respuesta;
                    }
                }

                // Determinar si es DML (Cambio de datos) - 🌟 LÓGICA CURADA (REGEX OPTIMIZADO)
                String upperQ = queryUsuario.trim().toUpperCase();
                boolean esDML = upperQ.matches("^\\s*(INSERT|UPDATE|DELETE)\\b[\\s\\S]*");

                // 🌟 LÓGICA DE VALIDACIÓN MODIFICADA
                if (isDdlValidation) {
                    
                    // 🪄 PARCHE AUTO-SANADOR DE SECUENCIAS (v2.0 - Soporta currval y setval)
                    if (upperQ.contains("NEXTVAL") || upperQ.contains("CURRVAL") || upperQ.contains("SETVAL")) {
                        java.util.regex.Pattern seqPattern = java.util.regex.Pattern.compile("['\"]([a-zA-Z0-9_]+)['\"]");
                        java.util.regex.Matcher seqMatcher = seqPattern.matcher(queryUsuario);
                        
                        if (seqMatcher.find()) {
                            String seqName = seqMatcher.group(1);
                            try {
                                // 1. Garantizamos que la secuencia exista
                                sandboxExecutionService.ejecutarEnSandbox("CREATE SEQUENCE IF NOT EXISTS " + seqName + " START 1;", usuarioId);
                                
                                // 2. HACK DE SESIÓN: Si pide CURRVAL, forzamos un NEXTVAL previo
                                if (upperQ.contains("CURRVAL")) {
                                    sandboxExecutionService.ejecutarEnSandbox("SELECT nextval('" + seqName + "');", usuarioId);
                                }
                            } catch (Exception ignored) {}
                        }
                    }

                    // Para secuencias o DDL, ejecutamos y si no hay error de SQL, es correcto.
                    datosAlumno = sandboxExecutionService.ejecutarEnSandbox(queryUsuario, usuarioId);
                    esCorrecto = true;

                    if (configValidacion != null && configValidacion.has("indice_requerido")) {
                        esCorrecto = validarIndiceRequerido(configValidacion.get("indice_requerido"), usuarioId);
                        if (!esCorrecto) {
                            respuesta.put("success", false);
                            respuesta.put("message", "El SQL se ejecutó, pero el índice requerido no quedó creado sobre las columnas correctas.");
                            respuesta.put("xp_gained", 0);
                            respuesta.put("descripcion", ejercicio.getEnunciado());
                            respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                            respuesta.put("queryAlumno", queryUsuario);
                            respuesta.put("errorDb", "No se encontró el índice pedagógico requerido para el laboratorio de rendimiento.");
                            return respuesta;
                        }
                    }
                    
                    // 🌟 MAGIA DIDÁCTICA: Escanear y devolver las Constraints de la tabla
                    String tablaAfectada = sandboxExecutionService.extraerNombreTablaDDL(upperQ, queryUsuario);
                    if (tablaAfectada != null) {
                        String queryConstraints = "SELECT constraint_name AS nombre_regla, constraint_type AS tipo "
                            + "FROM information_schema.table_constraints "
                            + "WHERE table_name = '" + tablaAfectada + "' "
                            + "AND table_schema = current_schema() "
                            + "ORDER BY constraint_type;";
                        try {
                            List<Map<String, Object>> listaConstraints = sandboxExecutionService.ejecutarEnSandbox(queryConstraints, usuarioId);
                            respuesta.put("constraintsData", listaConstraints);
                        } catch (Exception ignored) {}
                    }
                } else if (esDML) {
                    String tablaAfectada = extraerNombreTablaDML(upperQ, queryUsuario);
                    List<Map<String, Object>> beforeData = new ArrayList<>();
                    if (tablaAfectada != null) {
                        try {
                            beforeData = sandboxExecutionService.ejecutarEnSandbox("SELECT * FROM \"" + tablaAfectada + "\" LIMIT 20;", usuarioId);
                        } catch (Exception ignored) {}
                    }

                    // 1. Obtener qué DEBERÍA pasar (Query Maestra con Rollback)
                    List<Map<String, Object>> datosMaestros = sandboxExecutionService.ejecutarEnSandboxConRollback(ejercicio.getQueryMaestra(), usuarioId);
                    
                    // 2. Ejecutar lo que el ALUMNO mandó (Persistente)
                    datosAlumno = sandboxExecutionService.ejecutarEnSandbox(queryUsuario, usuarioId);
                    
                    // 3. Comparar
                    esCorrecto = compararResultadosDML(datosAlumno, datosMaestros);

                    // 4. Capturar estado posterior
                    List<Map<String, Object>> afterData = new ArrayList<>();
                    if (tablaAfectada != null) {
                        try {
                            afterData = sandboxExecutionService.ejecutarEnSandbox("SELECT * FROM \"" + tablaAfectada + "\" LIMIT 20;", usuarioId);
                        } catch (Exception ignored) {}
                    }

                    respuesta.put("beforeData", beforeData);
                    respuesta.put("afterData", afterData);
                    respuesta.put("isDML", true);
                    respuesta.put("targetTable", tablaAfectada);
                    if (esMisionTransaccional && tablaAfectada != null) {
                        respuesta.put("isTransactionVisual", true);
                        respuesta.put("transactionOutcome", construirResumenResultadoTransaccional(queryUsuario, beforeData, afterData));
                    }
                } else {
                    // Para SELECT normal, comparamos resultados directamente
                    String tablaTransaccional = esMisionTransaccional ? extraerNombreTablaTransaccional(queryUsuario) : null;
                    if (tablaTransaccional == null && esMisionTransaccional) {
                        tablaTransaccional = extraerNombreTablaTransaccional(ejercicio.getQueryMaestra());
                    }
                    List<Map<String, Object>> beforeData = new ArrayList<>();
                    if (tablaTransaccional != null) {
                        try {
                            beforeData = sandboxExecutionService.ejecutarEnSandbox("SELECT * FROM \"" + tablaTransaccional + "\" LIMIT 20;", usuarioId);
                        } catch (Exception ignored) {}
                    }

                    datosAlumno = sandboxExecutionService.ejecutarEnSandbox(queryUsuario, usuarioId, statementTimeoutEjercicioMs);
                    List<Map<String, Object>> datosMaestros = sandboxExecutionService.ejecutarEnSandbox(ejercicio.getQueryMaestra(), usuarioId, statementTimeoutEjercicioMs);
                    esCorrecto = datosAlumno.equals(datosMaestros);

                    if (tablaTransaccional != null) {
                        List<Map<String, Object>> afterData = new ArrayList<>();
                        try {
                            afterData = sandboxExecutionService.ejecutarEnSandbox("SELECT * FROM \"" + tablaTransaccional + "\" LIMIT 20;", usuarioId);
                        } catch (Exception ignored) {}

                        respuesta.put("beforeData", beforeData);
                        respuesta.put("afterData", afterData);
                        respuesta.put("targetTable", tablaTransaccional);
                        respuesta.put("isTransactionVisual", true);
                        respuesta.put("transactionOutcome", construirResumenResultadoTransaccional(queryUsuario, beforeData, afterData));
                    } else if (esMisionTransaccional) {
                        respuesta.put("isTransactionVisual", true);
                        respuesta.put("transactionOutcome", construirResumenResultadoTransaccional(queryUsuario, Collections.emptyList(), Collections.emptyList()));
                    }
                }
            }

            boolean yaResuelto = false;
            if (esCorrecto) {
                reporteRendimiento = sqlPerformanceService
                        .analizarConsultaExitosa(ejercicio, queryUsuario, usuarioId)
                        .orElse(null);
                if (reporteRendimiento != null) {
                    respuesta.put("performance", reporteRendimiento.toResponseMap());
                }
            }

            if (usuarioId != null && !usuarioId.trim().isEmpty()) {
                String checkSql = "SELECT COUNT(*) FROM lms_core.intentos WHERE id_usuario = ?::uuid AND id_ejercicio = ? AND es_correcto = true";
                Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, usuarioId, ejercicioId);
                yaResuelto = (count != null && count > 0);
            }

            // 🌟 MAGIA DIDÁCTICA: Escanear constraints después de ejecutar la consulta del usuario
            if (esCorrecto) {
                String upperQ = queryUsuario.trim().toUpperCase();
                if (upperQ.contains("ALTER TABLE") || upperQ.contains("CREATE TABLE") || upperQ.contains("ADD CONSTRAINT") || upperQ.contains("DROP CONSTRAINT")) {
                    String tablaAfectada = sandboxExecutionService.extraerNombreTablaDDL(upperQ, queryUsuario);
                    if (tablaAfectada != null) {
                        String queryConstraints = "SELECT constraint_name AS nombre_regla, constraint_type AS tipo "
                            + "FROM information_schema.table_constraints "
                            + "WHERE table_name = '" + tablaAfectada + "' "
                            + "AND table_schema = current_schema() "
                            + "ORDER BY constraint_type;";
                        try {
                            List<Map<String, Object>> listaConstraints = sandboxExecutionService.ejecutarEnSandbox(queryConstraints, usuarioId);
                            if (listaConstraints != null && !listaConstraints.isEmpty()) {
                                respuesta.put("constraintsData", listaConstraints);
                            }
                        } catch (Exception ignored) {}
                    }
                }
            }

            if (esCorrecto) {
                respuesta.put("success", true);
                if (usuarioId != null && !usuarioId.trim().isEmpty()) {
                    usuarioService.registrarPracticaDiaria(usuarioId);
                }
                respuesta.put("exerciseLeaderboard", leaderboardService.obtenerRankingEjercicio(ejercicioId));

                String tipo = ejercicio.getTipoMision() != null ? ejercicio.getTipoMision() : "HISTORIA";
                if ("RAPIDA".equals(tipo)) {
                    // El intento actual todavia no esta en la tabla (se registra al salir), asi que
                    // lo sumamos a mano para que el cupo diario cuadre con la vista v_ranking_alumnos.
                    int aciertosRapidosHoy = rewardService.contarAciertosRapidosHoy(usuarioId) + 1;
                    int xpRapida = aciertosRapidosHoy <= PRACTICA_RAPIDA_ACIERTOS_DIARIOS_CON_XP ? PRACTICA_RAPIDA_XP : 0;
                    int xpConsumidaHoy = Math.min(aciertosRapidosHoy, PRACTICA_RAPIDA_ACIERTOS_DIARIOS_CON_XP) * PRACTICA_RAPIDA_XP;
                    int xpRestanteHoy = Math.max(0, PRACTICA_RAPIDA_XP_DIARIA_MAX - xpConsumidaHoy);

                    respuesta.put("message", xpRapida > 0
                            ? "¡Relámpago completado! Racha protegida y +" + xpRapida + " XP."
                            : "Racha protegida. Ya alcanzaste el cupo de XP relámpago de hoy.");
                    respuesta.put("xp_gained", xpRapida);
                    respuesta.put("quick_practice", true);
                    respuesta.put("streak_saved", true);
                    respuesta.put("daily_quick_xp_cap", PRACTICA_RAPIDA_XP_DIARIA_MAX);
                    respuesta.put("daily_quick_xp_remaining", xpRestanteHoy);
                    respuesta.put("daily_quick_successes", aciertosRapidosHoy);
                } else if (yaResuelto) {
                    respuesta.put("message", "¡Perfecto! (Pero ya habías resuelto esta misión. 0 extra)");
                    respuesta.put("xp_gained", 0);
                } else {
                    respuesta.put("message", "¡Excelente! Has dominado esta misión.");
                    respuesta.put("xp_gained", xpGanada);
                }
            } else {
                if (usuarioId != null && !usuarioId.trim().isEmpty()) {
                    usuarioService.registrarPracticaDiaria(usuarioId);
                }
                respuesta.put("success", false);
                respuesta.put("message", "La consulta corrió sin errores, pero los datos no coinciden. Revisa tu lógica.");
                respuesta.put("xp_gained", 0);
                respuesta.put("constancy_reward", "Practica diaria registrada aunque la respuesta necesite correccion.");
                respuesta.put("descripcion", ejercicio.getEnunciado());
                respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                respuesta.put("queryAlumno", queryUsuario);
                respuesta.put("errorDb", "Los datos obtenidos no son los esperados.");
            }
            respuesta.put("mockData", datosAlumno);
            if (esMisionTransaccional) {
                anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
            }

        } catch (java.sql.SQLException e) {
            String sqlError = e.getMessage();

            if (esTimeoutSql(e)) {
                respuesta.put("success", false);
                respuesta.put("message", "La consulta superó el límite del laboratorio. Reduce filas antes de procesar o crea el índice que pide la investigación.");
                respuesta.put("xp_gained", 0);
                respuesta.put("descripcion", ejercicio.getEnunciado());
                respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                respuesta.put("queryAlumno", queryUsuario);
                respuesta.put("errorDb", "Timeout del sandbox: " + sqlError);
                respuesta.put("performanceTimeout", true);
                if (esMisionTransaccional) {
                    anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                }
                return respuesta;
            }
            
            // === INTERVENCIÓN PEDAGÓGICA: Primary Key Duplicada ===
            if (sqlError != null && sqlError.toLowerCase().contains("multiple primary keys")) {
                String upperQ = queryUsuario.trim().toUpperCase();
                String tablaObj = sandboxExecutionService.extraerNombreTablaDDL(upperQ, queryUsuario);
                String tablaNombre = tablaObj != null ? tablaObj : "la tabla";
                
                // Extraer nombre de columna de la query del usuario
                String columnaPK = "";
                try {
                    java.util.regex.Pattern colPattern = java.util.regex.Pattern.compile(
                        "PRIMARY\\s+KEY\\s*\\(\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\)",
                        java.util.regex.Pattern.CASE_INSENSITIVE
                    );
                    java.util.regex.Matcher colMatcher = colPattern.matcher(queryUsuario);
                    if (colMatcher.find()) {
                        columnaPK = colMatcher.group(1);
                    }
                } catch (Exception ignored) {}
                
                // Construir query de DROP (nombre default de PostgreSQL)
                String dropConstraint = "ALTER TABLE " + tablaNombre + " DROP CONSTRAINT " + tablaNombre + "_pkey;";
                
                // Ejecutar el DROP en secreto para arreglar la base de datos
                try {
                    sandboxExecutionService.ejecutarEnSandbox(dropConstraint, usuarioId);
                } catch (Exception dropEx) {
                    // Ignorar errores del DROP - podría no existir la constraint
                }
                
                // Devolver signal de intervención pedagógica
                respuesta.put("success", true);
                respuesta.put("isPedagogicalIntervention", true);
                respuesta.put("interventionType", "pk_exists");
                respuesta.put("message", "¡Espera! 👀");
                respuesta.put("dagonMessage", "¡Tu código es PERFECTO! Pero la tabla «" + tablaNombre + "» ya tiene una Primary Key. En SQL, ¡una tabla solo puede tener un rey!");
                respuesta.put("dagonExplanation", "Las Primary Keys son como el DNI de cada fila. No puedes tener dos personas con el mismo DNI, ¿verdad? Por eso primero debemos eliminar la anterior antes de crear la nueva.");
                respuesta.put("dagonActionQuery", dropConstraint);
                respuesta.put("dagonPostMessage", "¡Puf! 💨 He eliminado la llave vieja. Ahora ejecuta tu consulta original y verás que funciona perfectamente.");
                respuesta.put("userOriginalQuery", queryUsuario);
                respuesta.put("xp_gained", 0);
                
                // Obtener datos actuales de la tabla
                try {
                    String consultaDatos = "SELECT * FROM \"" + tablaNombre + "\" LIMIT 10;";
                    datosAlumno = sandboxExecutionService.ejecutarEnSandbox(consultaDatos, usuarioId);
                    respuesta.put("mockData", datosAlumno);
                    
                    // 🌟 MAGIA DIDÁCTICA: Escanear constraints después de DROP
                    String queryConstraints = "SELECT constraint_name AS nombre_regla, constraint_type AS tipo "
                        + "FROM information_schema.table_constraints "
                        + "WHERE table_name = '" + tablaNombre + "' "
                        + "AND table_schema = current_schema() "
                        + "ORDER BY constraint_type;";
                    List<Map<String, Object>> listaConstraints = sandboxExecutionService.ejecutarEnSandbox(queryConstraints, usuarioId);
                    respuesta.put("constraintsData", listaConstraints);
                } catch (Exception ignored) {}
                
                if (esMisionTransaccional) {
                    anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                }
                return respuesta;
            }
            // =============================================================
            
            // Detectar si es error de relación o constraint que ya existe (no es error crítico)
            boolean yaExiste = sqlError != null && (
                sqlError.toLowerCase().contains("relation") && sqlError.toLowerCase().contains("already exists") ||
                sqlError.toLowerCase().contains("table") && sqlError.toLowerCase().contains("already exists") ||
                sqlError.toLowerCase().contains("duplicate") && sqlError.toLowerCase().contains("key") ||
                sqlError.toLowerCase().contains("constraint") && sqlError.toLowerCase().contains("already exists") ||
                sqlError.toLowerCase().contains("multiple primary keys")
            );
            
            if (yaExiste) {
                // Es un warning, no error - intentar mostrar lo que hay en la tabla
                String upperQ = queryUsuario.trim().toUpperCase();
                respuesta.put("success", true);
                respuesta.put("isWarning", true);
                respuesta.put("message", "⚠️ Ya existe esa relación. Mostrando su estructura actual.");
                respuesta.put("warningType", "already_exists");
                
                // Intentar obtener los datos y estructura de todos modos
                try {
                    String tablaExtraida = sandboxExecutionService.extraerNombreTablaDDL(upperQ, queryUsuario);
                    if (tablaExtraida != null) {
                        // Primero ver si hay datos
                        String consultaDatos = "SELECT * FROM \"" + tablaExtraida + "\" LIMIT 100;";
                        datosAlumno = sandboxExecutionService.ejecutarEnSandbox(consultaDatos, usuarioId);
                        
                        // Si no hay datos, mostrar la estructura de la tabla
                        if (datosAlumno.isEmpty()) {
                            String consultaEstructura = "SELECT column_name, data_type, is_nullable "
                                + "FROM information_schema.columns "
                                + "WHERE table_name = '" + tablaExtraida + "' "
                                + "AND table_schema = current_schema() "
                                + "ORDER BY ordinal_position;";
                            datosAlumno = sandboxExecutionService.ejecutarEnSandbox(consultaEstructura, usuarioId);
                            
                            // Añadir flag para saber que es estructura
                            respuesta.put("isStructure", true);
                        }
                    }
                } catch (Exception ignored) {
                    datosAlumno = new ArrayList<>();
                }
                
                // Marcar como correcto para permitir avanzar
                esCorrecto = true;
                respuesta.put("mockData", datosAlumno);
                respuesta.put("xp_gained", 0);
                if (esMisionTransaccional) {
                    anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                }
            } else {
                String mensajeAmigable = humanizarErrorSql(sqlError);
                respuesta.put("success", false);
                respuesta.put("message", "Error de SQL: " + mensajeAmigable);
                respuesta.put("xp_gained", 0);
                respuesta.put("descripcion", ejercicio.getEnunciado());
                respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                respuesta.put("queryAlumno", queryUsuario);
                respuesta.put("errorDb", mensajeAmigable);
                if (esMisionTransaccional) {
                    anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                }
            }
        } catch (Exception e) {
            String errMsg = e.getMessage();
            
            // Detectar error de paréntesis desbalanceados
            if (errMsg != null && errMsg.contains("Unmatched closing")) {
                // Intentar ejecutar la query directamente y obtener resultados
                try {
                    datosAlumno = sandboxExecutionService.ejecutarEnSandbox(queryUsuario, usuarioId);
                    if (!datosAlumno.isEmpty()) {
                        respuesta.put("success", true);
                        respuesta.put("message", "¡Consulta ejecutada! Pero los datos no coinciden con lo esperado.");
                        respuesta.put("mockData", datosAlumno);
                        respuesta.put("xp_gained", 0);
                        if (esMisionTransaccional) {
                            anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                        }
                        return respuesta;
                    }
                } catch (Exception ignored) {}
                
                String mensajeAmigable = humanizarErrorSql(errMsg);
                respuesta.put("success", false);
                respuesta.put("message", "Revisa los paréntesis. " + mensajeAmigable);
                respuesta.put("xp_gained", 0);
                respuesta.put("descripcion", ejercicio.getEnunciado());
                respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                respuesta.put("queryAlumno", queryUsuario);
                respuesta.put("errorDb", mensajeAmigable);
                if (esMisionTransaccional) {
                    anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                }
            } else {
                String mensajeAmigable = humanizarErrorSql(errMsg);
                respuesta.put("success", false);
                respuesta.put("message", "Error al procesar la respuesta: " + mensajeAmigable);
                respuesta.put("xp_gained", 0);
                respuesta.put("descripcion", ejercicio.getEnunciado());
                respuesta.put("queryMaestra", ejercicio.getQueryMaestra());
                respuesta.put("queryAlumno", queryUsuario);
                respuesta.put("errorDb", mensajeAmigable);
                if (esMisionTransaccional) {
                    anexarSimulacionTransaccional(respuesta, ejercicio, queryUsuario, usuarioId);
                }
            }
        }
        return respuesta;
    }

    // registrarIntento, calcularTiempoMs y contarAciertosRapidosHoy viven en
    // RewardService (ver campo rewardService más abajo).

    private Optional<Map<String, Object>> prepararDatasetDetectiveSiAplica(
            EjercicioPractico ejercicio,
            String queryUsuario,
            String usuarioId
    ) {
        if (!requiereDatasetDetective(ejercicio)) {
            return Optional.empty();
        }

        try {
            prepararDatasetFraudeBancario(usuarioId);
            return Optional.empty();
        } catch (Exception e) {
            return Optional.of(RespuestasDatasetDetective.error(
                    ejercicio,
                    queryUsuario,
                    "No fue posible preparar el dataset masivo del misterio: " + e.getMessage()
            ));
        }
    }

    private boolean requiereDatasetDetective(EjercicioPractico ejercicio) {
        JsonNode config = leerConfiguracionExtra(ejercicio);
        return config != null
                && config.has("dataset_detective")
                && "FRAUDE_BANCARIO".equalsIgnoreCase(config.get("dataset_detective").asText());
    }

    private void prepararDatasetFraudeBancario(String usuarioId) {
        String esquema = sandboxSqlPolicy.resolverSearchPath(usuarioId);
        String schemaSql = quoteIdentifier(esquema);
        String tableSql = schemaSql + ".transferencias_misteriosas";

        jdbcTemplate.execute("CREATE SCHEMA IF NOT EXISTS " + schemaSql);
        jdbcTemplate.execute("GRANT USAGE, CREATE ON SCHEMA " + schemaSql + " TO app_sandbox_user");
        jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS " + tableSql + " (" +
                "id_evento BIGINT PRIMARY KEY, " +
                "cuenta_origen VARCHAR(32) NOT NULL, " +
                "cuenta_destino VARCHAR(32) NOT NULL, " +
                "monto NUMERIC(12,2) NOT NULL, " +
                "canal VARCHAR(32) NOT NULL, " +
                "ciudad VARCHAR(64) NOT NULL, " +
                "fecha_evento TIMESTAMP NOT NULL, " +
                "riesgo INTEGER NOT NULL, " +
                "es_fraude BOOLEAN NOT NULL" +
                ")");
        jdbcTemplate.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON " + tableSql + " TO app_sandbox_user");

        String seedSql = "INSERT INTO " + tableSql + " " +
                "(id_evento, cuenta_origen, cuenta_destino, monto, canal, ciudad, fecha_evento, riesgo, es_fraude) " +
                "SELECT gs, " +
                "'CTA-' || lpad((gs % 50000)::text, 5, '0'), " +
                "'CTA-' || lpad(((gs * 37) % 50000)::text, 5, '0'), " +
                "CASE WHEN gs % 997 = 0 THEN 9900 + (gs % 89) ELSE 20 + (gs % 1500) END, " +
                "CASE WHEN gs % 5 = 0 THEN 'app' WHEN gs % 5 = 1 THEN 'web' WHEN gs % 5 = 2 THEN 'atm' WHEN gs % 5 = 3 THEN 'sucursal' ELSE 'api' END, " +
                "CASE WHEN gs % 7 = 0 THEN 'Zacatecas' WHEN gs % 7 = 1 THEN 'Guadalajara' WHEN gs % 7 = 2 THEN 'Monterrey' WHEN gs % 7 = 3 THEN 'CDMX' WHEN gs % 7 = 4 THEN 'Tijuana' WHEN gs % 7 = 5 THEN 'Merida' ELSE 'Queretaro' END, " +
                "TIMESTAMP '2026-01-01' + ((gs % 180) * INTERVAL '1 day') + ((gs % 86400) * INTERVAL '1 second'), " +
                "CASE WHEN gs % 997 = 0 THEN 99 WHEN gs % 89 = 0 THEN 87 ELSE (gs % 70) END, " +
                "(gs % 997 = 0) " +
                "FROM generate_series(1, 1000000) AS gs " +
                "WHERE NOT EXISTS (SELECT 1 FROM " + tableSql + " LIMIT 1)";
        jdbcTemplate.execute(seedSql);
        try {
            jdbcTemplate.execute("ALTER TABLE " + tableSql + " OWNER TO app_sandbox_user");
        } catch (Exception ignored) {}
    }

    private Integer resolverStatementTimeoutEjercicio(EjercicioPractico ejercicio) {
        JsonNode config = leerConfiguracionExtra(ejercicio);
        if (config == null) {
            return null;
        }
        if (config.has("detective_timeout_ms")) {
            return Math.max(250, config.get("detective_timeout_ms").asInt());
        }
        if (config.has("statement_timeout_ms")) {
            return Math.max(250, config.get("statement_timeout_ms").asInt());
        }
        return null;
    }

    private boolean validarIndiceRequerido(JsonNode indiceConfig, String usuarioId) {
        if (indiceConfig == null || !indiceConfig.has("tabla") || !indiceConfig.has("columnas")) {
            return true;
        }

        String tabla = indiceConfig.get("tabla").asText();
        List<String> columnas = new ArrayList<>();
        for (JsonNode columna : indiceConfig.get("columnas")) {
            columnas.add(columna.asText().toLowerCase(Locale.ROOT));
        }

        try {
            String sql = "SELECT indexdef FROM pg_indexes WHERE schemaname = ? AND tablename = ?";
            List<String> definiciones = jdbcTemplate.queryForList(
                    sql,
                    String.class,
                    sandboxSqlPolicy.resolverSearchPath(usuarioId),
                    tabla
            );

            for (String def : definiciones) {
                String normalizada = def != null ? def.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ") : "";
                boolean contieneTodas = true;
                for (String columna : columnas) {
                    if (!normalizada.contains(columna.toLowerCase(Locale.ROOT))) {
                        contieneTodas = false;
                        break;
                    }
                }
                if (contieneTodas) {
                    return true;
                }
            }
        } catch (Exception ignored) {}

        return false;
    }

    private JsonNode leerConfiguracionExtra(EjercicioPractico ejercicio) {
        if (ejercicio == null || ejercicio.getConfiguracionExtra() == null || ejercicio.getConfiguracionExtra().trim().isEmpty()) {
            return null;
        }
        try {
            return new ObjectMapper().readTree(ejercicio.getConfiguracionExtra());
        } catch (Exception ignored) {
            return null;
        }
    }

    private boolean esTimeoutSql(java.sql.SQLException error) {
        String message = error.getMessage() != null ? error.getMessage().toLowerCase(Locale.ROOT) : "";
        return "57014".equals(error.getSQLState())
                || message.contains("statement timeout")
                || message.contains("canceling statement due to");
    }

    private static final java.util.regex.Pattern PATRON_SINTAXIS =
            java.util.regex.Pattern.compile("syntax error at or near \"(.+?)\"");
    private static final java.util.regex.Pattern PATRON_TABLA_INEXISTENTE =
            java.util.regex.Pattern.compile("relation \"(.+?)\" does not exist");
    private static final java.util.regex.Pattern PATRON_COLUMNA_INEXISTENTE =
            java.util.regex.Pattern.compile("column \"(.+?)\" does not exist");
    private static final java.util.regex.Pattern PATRON_NOT_NULL =
            java.util.regex.Pattern.compile("null value in column \"(.+?)\"");

    /**
     * Traduce el mensaje crudo de Postgres (con "ERROR:" y "Position:" incluidos)
     * a una frase corta que un alumno pueda entender sin leer el stacktrace.
     */
    String humanizarErrorSql(String rawError) {
        if (rawError == null || rawError.trim().isEmpty()) {
            return "Ocurrió un error al ejecutar la consulta.";
        }
        String limpio = rawError.replaceFirst("(?i)^ERROR:\\s*", "").split("\\r?\\n")[0].trim();
        String lower = limpio.toLowerCase(Locale.ROOT);
        java.util.regex.Matcher m;

        if ((m = PATRON_SINTAXIS.matcher(limpio)).find()) {
            return "Error de sintaxis cerca de \"" + m.group(1) + "\". Revisa comas, paréntesis o palabras clave.";
        }
        if ((m = PATRON_TABLA_INEXISTENTE.matcher(limpio)).find()) {
            return "La tabla \"" + m.group(1) + "\" no existe. Verifica el nombre o si aún no la creaste.";
        }
        if ((m = PATRON_COLUMNA_INEXISTENTE.matcher(limpio)).find()) {
            return "La columna \"" + m.group(1) + "\" no existe en esa tabla. Revisa el nombre.";
        }
        if ((m = PATRON_NOT_NULL.matcher(limpio)).find()) {
            return "El campo \"" + m.group(1) + "\" no puede quedar vacío (restricción NOT NULL).";
        }
        if (lower.contains("duplicate key value violates unique constraint")) {
            return "Ya existe un registro con ese valor único. No puedes repetirlo.";
        }
        if (lower.contains("permission denied")) {
            return "No tienes permisos para esa operación en el sandbox.";
        }
        if (lower.contains("division by zero")) {
            return "Estás dividiendo entre cero en la consulta.";
        }
        return limpio;
    }

    private String quoteIdentifier(String identifier) {
        return "\"" + identifier.replace("\"", "\"\"") + "\"";
    }

    private static class RespuestasDatasetDetective {
        private static Map<String, Object> error(EjercicioPractico ejercicio, String queryUsuario, String errorDb) {
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("success", false);
            respuesta.put("message", "El laboratorio de datos masivos no pudo inicializarse.");
            respuesta.put("xp_gained", 0);
            respuesta.put("descripcion", ejercicio != null ? ejercicio.getEnunciado() : "");
            respuesta.put("queryMaestra", ejercicio != null ? ejercicio.getQueryMaestra() : "");
            respuesta.put("queryAlumno", queryUsuario);
            respuesta.put("errorDb", errorDb);
            return respuesta;
        }
    }
    
    private String extraerNombreTablaDML(String upperQuery, String queryOriginal) {
        try {
            java.util.regex.Pattern pattern;
            if (upperQuery.contains("DELETE")) {
                pattern = java.util.regex.Pattern.compile("(?i)DELETE\\s+FROM\\s+[\"]?([\\w\\.]+)", java.util.regex.Pattern.CASE_INSENSITIVE);
            } else if (upperQuery.contains("UPDATE")) {
                pattern = java.util.regex.Pattern.compile("(?i)UPDATE\\s+[\"]?([\\w\\.]+)", java.util.regex.Pattern.CASE_INSENSITIVE);
            } else if (upperQuery.contains("INSERT")) {
                pattern = java.util.regex.Pattern.compile("(?i)INSERT\\s+INTO\\s+[\"]?([\\w\\.]+)", java.util.regex.Pattern.CASE_INSENSITIVE);
            } else {
                return null;
            }

            java.util.regex.Matcher matcher = pattern.matcher(queryOriginal);
            if (matcher.find()) {
                return matcher.group(1).replaceAll("[\"`;]", "").trim();
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    private boolean compararResultadosDML(List<Map<String, Object>> r1, List<Map<String, Object>> r2) {
        if (r1.size() != r2.size()) return false;
        for (int i = 0; i < r1.size(); i++) {
            Map<String, String> m1 = new HashMap<>();
            Map<String, String> m2 = new HashMap<>();
            
            // Normalizar m1: ignorar IDs y poner llaves en minúsculas
            for (Map.Entry<String, Object> entry : r1.get(i).entrySet()) {
                String key = entry.getKey().toLowerCase();
                if (!key.startsWith("id_")) {
                    m1.put(key, entry.getValue() != null ? entry.getValue().toString() : null);
                }
            }
            
            // Normalizar m2
            for (Map.Entry<String, Object> entry : r2.get(i).entrySet()) {
                String key = entry.getKey().toLowerCase();
                if (!key.startsWith("id_")) {
                    m2.put(key, entry.getValue() != null ? entry.getValue().toString() : null);
                }
            }
            
            if (!m1.equals(m2)) return false;
        }
        return true;
    }

    private Map<String, Object> construirPedagogiaEjercicio(EjercicioPractico ejercicio) {
        Map<String, Object> pedagogia = new LinkedHashMap<>();

        if (ejercicio.getConfiguracionExtra() != null && !ejercicio.getConfiguracionExtra().trim().isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                JsonNode config = mapper.readTree(ejercicio.getConfiguracionExtra());
                pedagogia.putAll(mapper.convertValue(config, LinkedHashMap.class));
            } catch (Exception ignored) {}
        }

        if (esMisionTransaccional(ejercicio)) {
            pedagogia.putIfAbsent("modo", "terminal_transaccional");
            pedagogia.putIfAbsent("terminal_prompt_base", "dagon=#");
            pedagogia.putIfAbsent("terminal_prompt_tx", "dagon=*#");
            pedagogia.putIfAbsent("paneles", Arrays.asList("sesion_a", "sesion_b", "linea_tiempo", "aislamiento"));
            pedagogia.putIfAbsent("foco", Arrays.asList("BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT", "visibilidad"));
            pedagogia.putIfAbsent("sesiones_paralelas", true);
            pedagogia.putIfAbsent("mensaje_terminal", "Esta misión se enseña como un laboratorio de terminal PostgreSQL con dos sesiones en paralelo.");
        }

        return pedagogia;
    }

    private boolean esMisionTransaccional(EjercicioPractico ejercicio) {
        if (ejercicio == null) {
            return false;
        }

        if (Integer.valueOf(15).equals(ejercicio.getIdModulo())) {
            return true;
        }

        String configExtra = ejercicio.getConfiguracionExtra();
        if (configExtra == null || configExtra.trim().isEmpty()) {
            return false;
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode config = mapper.readTree(configExtra);

            if (config.has("tipo_validacion") && "transaccion".equalsIgnoreCase(config.get("tipo_validacion").asText())) {
                return true;
            }

            return config.has("modo") && "terminal_transaccional".equalsIgnoreCase(config.get("modo").asText());
        } catch (Exception ignored) {
            return false;
        }
    }

    private void anexarSimulacionTransaccional(Map<String, Object> respuesta, EjercicioPractico ejercicio, String queryUsuario, String usuarioId) {
        try {
            respuesta.put("transactionSimulation", construirSimulacionTransaccional(ejercicio, queryUsuario, usuarioId));
        } catch (Exception e) {
            Map<String, Object> fallback = new LinkedHashMap<>();
            fallback.put("mode", "postgres_transaction_lab");
            fallback.put("available", false);
            fallback.put("message", "No fue posible generar la simulación paralela completa, pero el módulo sigue marcado como laboratorio transaccional.");
            fallback.put("error", e.getMessage());
            fallback.put("timeline", construirLineaTiempoBasica(queryUsuario));
            respuesta.put("transactionSimulation", fallback);
        }
    }

    private Map<String, Object> construirSimulacionTransaccional(EjercicioPractico ejercicio, String queryUsuario, String usuarioId) throws java.sql.SQLException {
        Map<String, Object> simulacion = new LinkedHashMap<>();
        List<Map<String, Object>> timeline = new ArrayList<>();
        List<String> sentencias = separarSentenciasSql(queryUsuario);
        String demoTable = "tx_demo_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);

        simulacion.put("mode", "postgres_transaction_lab");
        simulacion.put("available", true);
        simulacion.put("headline", "Laboratorio de dos sesiones");
        simulacion.put("basePrompt", "dagon=#");
        simulacion.put("txPrompt", "dagon=*#");
        simulacion.put("demoTable", demoTable);
        simulacion.put("timeline", timeline);
        simulacion.put("focus", Arrays.asList(
            "La Sesión A puede acumular cambios sin confirmarlos",
            "La Sesión B representa a otro cliente leyendo al mismo tiempo",
            "COMMIT publica el cambio; ROLLBACK lo borra del presente"
        ));

        if (sentencias.isEmpty()) {
            simulacion.put("available", false);
            simulacion.put("message", "No se detectaron sentencias para construir la simulación transaccional.");
            return simulacion;
        }

        String url = sandboxUrl;
        String user = sandboxUser;
        String password = sandboxPassword;

        try (Connection sesionA = DriverManager.getConnection(url, user, password);
             Connection sesionB = DriverManager.getConnection(url, user, password);
             Statement adminA = sesionA.createStatement();
             Statement adminB = sesionB.createStatement()) {

            prepararSearchPath(adminA, usuarioId);
            prepararSearchPath(adminB, usuarioId);

            adminA.execute("CREATE TABLE \"" + demoTable + "\" (id SERIAL PRIMARY KEY, etiqueta VARCHAR(80), saldo INTEGER NOT NULL);");
            adminA.execute("INSERT INTO \"" + demoTable + "\" (etiqueta, saldo) VALUES ('origen', 100), ('reserva', 200);");

            boolean transaccionAbierta = false;
            int step = 1;

            for (String sentencia : sentencias) {
                String normalizada = sentencia.trim();
                if (normalizada.isEmpty()) {
                    continue;
                }

                String upper = normalizada.toUpperCase(Locale.ROOT);
                Map<String, Object> evento = new LinkedHashMap<>();
                evento.put("step", step++);
                evento.put("statement", normalizada.endsWith(";") ? normalizada : normalizada + ";");
                evento.put("prompt", transaccionAbierta ? "dagon=*#" : "dagon=#");
                evento.put("session", "Sesión A");
                evento.put("parallelSession", "Sesión B");
                evento.put("concept", describirConceptoTransaccional(upper));

                if (upper.startsWith("BEGIN")) {
                    sesionA.setAutoCommit(false);
                    transaccionAbierta = true;
                    evento.put("effect", "La sesión A abre una transacción y a partir de aquí trabaja en un presente privado.");
                } else if (upper.startsWith("SAVEPOINT")) {
                    if (!transaccionAbierta) {
                        sesionA.setAutoCommit(false);
                        transaccionAbierta = true;
                    }
                    adminA.execute(normalizada);
                    evento.put("effect", "Se colocó un punto de retorno intermedio para deshacer solo una parte del trabajo.");
                } else if (upper.startsWith("ROLLBACK TO")) {
                    adminA.execute(normalizada);
                    evento.put("effect", "La sesión A volvió al savepoint sin destruir toda la transacción.");
                } else if (upper.startsWith("ROLLBACK")) {
                    if (transaccionAbierta) {
                        sesionA.rollback();
                    }
                    sesionA.setAutoCommit(true);
                    transaccionAbierta = false;
                    evento.put("effect", "Todo lo pendiente desaparece; la sesión B nunca llega a ver esos cambios.");
                } else if (upper.startsWith("COMMIT")) {
                    if (transaccionAbierta) {
                        sesionA.commit();
                    }
                    sesionA.setAutoCommit(true);
                    transaccionAbierta = false;
                    evento.put("effect", "Los cambios salen del estado privado y se publican para todas las sesiones.");
                } else if (upper.startsWith("INSERT")) {
                    if (!transaccionAbierta) {
                        sesionA.setAutoCommit(false);
                        transaccionAbierta = true;
                    }
                    adminA.execute("INSERT INTO \"" + demoTable + "\" (etiqueta, saldo) VALUES ('pendiente_" + step + "', " + (90 + step) + ");");
                    evento.put("effect", "Sesión A agregó una fila nueva en su burbuja transaccional.");
                } else if (upper.startsWith("UPDATE")) {
                    if (!transaccionAbierta) {
                        sesionA.setAutoCommit(false);
                        transaccionAbierta = true;
                    }
                    adminA.execute("UPDATE \"" + demoTable + "\" SET saldo = saldo + 25 WHERE id = 1;");
                    evento.put("effect", "Sesión A modificó una fila existente, pero el cambio aún no es público.");
                } else if (upper.startsWith("DELETE")) {
                    if (!transaccionAbierta) {
                        sesionA.setAutoCommit(false);
                        transaccionAbierta = true;
                    }
                    adminA.execute("DELETE FROM \"" + demoTable + "\" WHERE id = 2;");
                    evento.put("effect", "Sesión A retiró una fila del laboratorio; la otra sesión sigue viendo el estado confirmado.");
                } else if (upper.startsWith("SELECT")) {
                    evento.put("effect", "La consulta observa el estado visible en ese instante y ayuda a comparar lo que ve cada sesión.");
                } else {
                    evento.put("effect", "La sentencia se interpreta como parte del flujo transaccional y se explica sin tocar el sandbox real del ejercicio.");
                }

                evento.put("sessionAVisibleRows", contarFilas(adminA, demoTable));
                evento.put("sessionBVisibleRows", contarFilas(adminB, demoTable));
                evento.put("visibilityHint", construirHintVisibilidad(transaccionAbierta, evento.get("sessionAVisibleRows"), evento.get("sessionBVisibleRows")));
                timeline.add(evento);
            }

            if (transaccionAbierta) {
                sesionA.rollback();
                sesionA.setAutoCommit(true);
            }

            adminA.execute("DROP TABLE IF EXISTS \"" + demoTable + "\";");
        }

        simulacion.put("summary", "La simulación usa dos conexiones JDBC contra una tabla efímera para hacer visible el aislamiento entre sesiones.");
        return simulacion;
    }

    private void prepararSearchPath(Statement stmt, String usuarioId) throws java.sql.SQLException {
        sandboxSqlPolicy.validarRolSandbox(sandboxUser);
        if (usuarioId != null && !usuarioId.trim().isEmpty()) {
            String searchPath = sandboxSqlPolicy.resolverSearchPath(usuarioId);
            try {
                stmt.execute("CREATE SCHEMA IF NOT EXISTS \"" + searchPath + "\";");
                stmt.execute("GRANT ALL ON SCHEMA \"" + searchPath + "\" TO app_sandbox_user;");
            } catch (Exception ignored) {}
        }
        stmt.execute(sandboxSqlPolicy.sentenciaSearchPath(usuarioId));
    }

    private List<Map<String, Object>> construirLineaTiempoBasica(String queryUsuario) {
        List<Map<String, Object>> timeline = new ArrayList<>();
        int step = 1;
        for (String sentencia : separarSentenciasSql(queryUsuario)) {
            String upper = sentencia.trim().toUpperCase(Locale.ROOT);
            Map<String, Object> evento = new LinkedHashMap<>();
            evento.put("step", step++);
            evento.put("statement", sentencia.endsWith(";") ? sentencia : sentencia + ";");
            evento.put("prompt", upper.startsWith("BEGIN") ? "dagon=#" : "dagon=*#");
            evento.put("concept", describirConceptoTransaccional(upper));
            evento.put("effect", "Traza pedagógica disponible aunque la simulación completa no haya podido ejecutarse.");
            timeline.add(evento);
        }
        return timeline;
    }

    private List<String> separarSentenciasSql(String queryUsuario) {
        List<String> sentencias = new ArrayList<>();
        if (queryUsuario == null || queryUsuario.trim().isEmpty()) {
            return sentencias;
        }

        StringBuilder actual = new StringBuilder();
        boolean enComillaSimple = false;
        boolean enComillaDoble = false;

        for (int i = 0; i < queryUsuario.length(); i++) {
            char c = queryUsuario.charAt(i);

            if (c == '\'' && !enComillaDoble) {
                enComillaSimple = !enComillaSimple;
            } else if (c == '"' && !enComillaSimple) {
                enComillaDoble = !enComillaDoble;
            }

            if (c == ';' && !enComillaSimple && !enComillaDoble) {
                String stmt = actual.toString().trim();
                if (!stmt.isEmpty()) {
                    sentencias.add(stmt + ";");
                }
                actual.setLength(0);
            } else {
                actual.append(c);
            }
        }

        String restante = actual.toString().trim();
        if (!restante.isEmpty()) {
            sentencias.add(restante);
        }

        return sentencias;
    }

    private String extraerNombreTablaTransaccional(String queryUsuario) {
        for (String sentencia : separarSentenciasSql(queryUsuario)) {
            String upper = sentencia.trim().toUpperCase(Locale.ROOT);
            if (upper.startsWith("INSERT") || upper.startsWith("UPDATE") || upper.startsWith("DELETE")) {
                String tabla = extraerNombreTablaDML(upper, sentencia);
                if (tabla != null && !tabla.isBlank()) {
                    return tabla;
                }
            }
        }
        return null;
    }

    private Map<String, Object> construirResumenResultadoTransaccional(String queryUsuario, List<Map<String, Object>> beforeData, List<Map<String, Object>> afterData) {
        Map<String, Object> resumen = new LinkedHashMap<>();
        String upper = queryUsuario != null ? queryUsuario.toUpperCase(Locale.ROOT) : "";

        String outcomeType = "commit";
        String headline = "Cambios confirmados";
        String explanation = "La transacción publicó sus cambios y ahora forman parte del estado confirmado de la tabla.";

        if (upper.contains("ROLLBACK TO")) {
            outcomeType = "savepoint";
            headline = "Rollback parcial aplicado";
            explanation = "La transacción conservó la parte anterior al savepoint y deshizo solo el tramo posterior.";
        } else if (upper.contains("ROLLBACK")) {
            outcomeType = "rollback";
            headline = "Cambios revertidos";
            explanation = "El estado final volvió al último COMMIT visible; nada de lo pendiente quedó publicado.";
        } else if (upper.contains("COMMIT")) {
            outcomeType = "commit";
            headline = "Cambios confirmados";
            explanation = "La transacción publicó sus cambios y ahora forman parte del estado confirmado de la tabla.";
        }

        resumen.put("type", outcomeType);
        resumen.put("headline", headline);
        resumen.put("explanation", explanation);
        resumen.put("beforeCount", beforeData != null ? beforeData.size() : 0);
        resumen.put("afterCount", afterData != null ? afterData.size() : 0);
        resumen.put("changed", !Objects.equals(beforeData, afterData));
        resumen.put("queryPattern", construirPlantillaTransaccional(queryUsuario));

        return resumen;
    }

    private String construirPlantillaTransaccional(String queryUsuario) {
        List<String> piezas = new ArrayList<>();
        for (String sentencia : separarSentenciasSql(queryUsuario)) {
            String upper = sentencia.trim().toUpperCase(Locale.ROOT);
            if (upper.startsWith("BEGIN")) {
                piezas.add("BEGIN;");
            } else if (upper.startsWith("INSERT")) {
                piezas.add("INSERT INTO ____ VALUES (...);");
            } else if (upper.startsWith("UPDATE")) {
                piezas.add("UPDATE ____ SET ____ WHERE ____;");
            } else if (upper.startsWith("DELETE")) {
                piezas.add("DELETE FROM ____ WHERE ____;");
            } else if (upper.startsWith("SAVEPOINT")) {
                piezas.add("SAVEPOINT ____;");
            } else if (upper.startsWith("ROLLBACK TO")) {
                piezas.add("ROLLBACK TO SAVEPOINT ____;");
            } else if (upper.startsWith("ROLLBACK")) {
                piezas.add("ROLLBACK;");
            } else if (upper.startsWith("COMMIT")) {
                piezas.add("COMMIT;");
            } else if (upper.startsWith("SELECT")) {
                piezas.add("SELECT ____ FROM ____;");
            }
        }

        return piezas.isEmpty() ? "BEGIN; ... COMMIT;" : String.join("  ", piezas);
    }

    private String describirConceptoTransaccional(String upper) {
        if (upper.startsWith("BEGIN")) {
            return "Apertura de transacción";
        }
        if (upper.startsWith("COMMIT")) {
            return "Confirmación global";
        }
        if (upper.startsWith("ROLLBACK TO")) {
            return "Deshacer parcial";
        }
        if (upper.startsWith("ROLLBACK")) {
            return "Deshacer total";
        }
        if (upper.startsWith("SAVEPOINT")) {
            return "Punto de guardado";
        }
        if (upper.startsWith("INSERT")) {
            return "Cambio pendiente";
        }
        if (upper.startsWith("UPDATE")) {
            return "Actualización pendiente";
        }
        if (upper.startsWith("DELETE")) {
            return "Eliminación pendiente";
        }
        if (upper.startsWith("SELECT")) {
            return "Lectura de visibilidad";
        }
        return "Sentencia avanzada";
    }

    private String construirHintVisibilidad(boolean transaccionAbierta, Object sessionAVisibleRows, Object sessionBVisibleRows) {
        if (!transaccionAbierta) {
            return "Ambas sesiones ya comparten el mismo estado confirmado.";
        }

        if (!Objects.equals(sessionAVisibleRows, sessionBVisibleRows)) {
            return "La Sesión A ya ve su cambio, pero la Sesión B sigue atrapada en el último COMMIT confirmado.";
        }

        return "Aunque el conteo coincida, el punto clave es que la transacción sigue abierta y aislada.";
    }

    private int contarFilas(Statement stmt, String tabla) throws java.sql.SQLException {
        try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) AS total FROM \"" + tabla + "\"")) {
            if (rs.next()) {
                return rs.getInt("total");
            }
        }
        return 0;
    }
}
