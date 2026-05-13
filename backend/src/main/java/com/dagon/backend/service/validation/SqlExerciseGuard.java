package com.dagon.backend.service.validation;

import com.dagon.backend.model.EjercicioPractico;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SqlExerciseGuard {

    private static final Set<String> CONTROL_TRANSACCION = Set.of("BEGIN", "COMMIT", "ROLLBACK", "SAVEPOINT");
    private static final Set<String> OPERACIONES_MUTACION = Set.of(
            "INSERT", "UPDATE", "DELETE",
            "CREATE_TABLE", "ALTER_TABLE", "DROP_TABLE",
            "CREATE_VIEW", "DROP_VIEW",
            "CREATE_FUNCTION", "DROP_FUNCTION",
            "CREATE_TRIGGER", "DROP_TRIGGER"
    );
    private static final Pattern IDENTIFICADOR = Pattern.compile("[a-zA-Z_][a-zA-Z0-9_]*|\"[^\"]+\"|`[^`]+`");
    private static final Pattern REFERENCIA_TABLAS = Pattern.compile("(?i)\\b(?:FROM|JOIN)\\s+(?!ONLY\\b)([\"`]?[a-zA-Z_][a-zA-Z0-9_]*(?:[.]\\s*[\"`]?[a-zA-Z_][a-zA-Z0-9_]*[\"`]?)?[\"`]?)");
    private static final Pattern[] PATRONES_PROHIBIDOS = new Pattern[] {
            Pattern.compile("(?i)\\bTRUNCATE\\b"),
            Pattern.compile("(?i)\\bDROP\\s+DATABASE\\b"),
            Pattern.compile("(?i)\\bDROP\\s+SCHEMA\\b"),
            Pattern.compile("(?i)\\bCREATE\\s+SCHEMA\\b"),
            Pattern.compile("(?i)\\bALTER\\s+SCHEMA\\b"),
            Pattern.compile("(?i)\\bCREATE\\s+ROLE\\b"),
            Pattern.compile("(?i)\\bALTER\\s+ROLE\\b"),
            Pattern.compile("(?i)\\bDROP\\s+ROLE\\b"),
            Pattern.compile("(?i)\\bGRANT\\b"),
            Pattern.compile("(?i)\\bREVOKE\\b"),
            Pattern.compile("(?i)\\bCOPY\\b"),
            Pattern.compile("(?i)\\bVACUUM\\b"),
            Pattern.compile("(?i)\\bREINDEX\\b"),
            Pattern.compile("(?i)\\bCLUSTER\\b"),
            Pattern.compile("(?i)\\bCREATE\\s+EXTENSION\\b"),
            Pattern.compile("(?i)\\bALTER\\s+SYSTEM\\b"),
            Pattern.compile("(?i)\\bSET\\s+ROLE\\b"),
            Pattern.compile("(?i)\\bRESET\\s+ROLE\\b"),
            Pattern.compile("(?i)\\bSET\\s+search_path\\b"),
            Pattern.compile("(?i)\\bSECURITY\\s+DEFINER\\b"),
            Pattern.compile("(?i)\\bDO\\s+(?:\\$|'|LANGUAGE)"),
            Pattern.compile("(?i)\\bpg_sleep\\s*\\("),
            Pattern.compile("(?i)\\bdblink\\s*\\("),
            Pattern.compile("(?i)\\blo_import\\s*\\("),
            Pattern.compile("(?i)\\blo_export\\s*\\("),
            Pattern.compile("(?i)\\bPROGRAM\\b")
    };

    public Optional<Map<String, Object>> prevalidar(ContextoValidacionEjercicio contexto) {
        if (contexto.tipo() == TipoValidacionEjercicio.DIAGRAMA
                || contexto.tipo() == TipoValidacionEjercicio.TEXTUAL) {
            return Optional.empty();
        }

        EjercicioPractico ejercicio = contexto.ejercicio();
        String queryMaestra = ejercicio != null ? ejercicio.getQueryMaestra() : null;
        if (queryMaestra == null || queryMaestra.trim().isEmpty()) {
            return Optional.of(error(
                    "Este ejercicio no tiene una consulta maestra configurada. No se puede validar de forma segura.",
                    contexto,
                    "Falta query_maestra para construir el contrato de seguridad del ejercicio."
            ));
        }

        ResultadoAnalisis esperado = analizar(queryMaestra);
        ResultadoAnalisis alumno = analizar(contexto.queryUsuario());

        if (alumno.error() != null) {
            return Optional.of(error(
                    "No pude leer tu SQL de forma segura. Revisa comillas, bloques y punto y coma.",
                    contexto,
                    alumno.error()
            ));
        }

        if (esperado.error() != null) {
            return Optional.of(error(
                    "La consulta maestra de este ejercicio necesita revisión antes de validar alumnos.",
                    contexto,
                    esperado.error()
            ));
        }

        Optional<String> comandoProhibido = detectarComandoProhibido(alumno.sqlSinComentarios());
        if (comandoProhibido.isPresent()) {
            return Optional.of(error(
                    "Comando bloqueado: esa instrucción no pertenece al permiso de este nivel.",
                    contexto,
                    comandoProhibido.get()
            ));
        }

        if (!permiteMultiplesSentencias(esperado, contexto.tipo()) && alumno.sentencias().size() > 1) {
            return Optional.of(error(
                    "Este ejercicio solo permite una sentencia SQL. Evita encadenar comandos.",
                    contexto,
                    "El alumno envió " + alumno.sentencias().size() + " sentencias cuando el contrato esperaba una."
            ));
        }

        Optional<String> errorOperacion = validarOperaciones(esperado, alumno, contexto.tipo());
        if (errorOperacion.isPresent()) {
            return Optional.of(error(
                    "La operación enviada no corresponde a lo que pide este nivel.",
                    contexto,
                    errorOperacion.get()
            ));
        }

        Optional<String> errorObjetos = validarObjetosPermitidos(esperado, alumno, contexto.tipo());
        if (errorObjetos.isPresent()) {
            return Optional.of(error(
                    "La consulta intenta tocar tablas u objetos fuera del contexto del ejercicio.",
                    contexto,
                    errorObjetos.get()
            ));
        }

        Optional<String> errorEsquema = validarEsquemasInternos(esperado, alumno);
        if (errorEsquema.isPresent()) {
            return Optional.of(error(
                    "No puedes consultar ni modificar zonas internas de Dagon en este ejercicio.",
                    contexto,
                    errorEsquema.get()
            ));
        }

        return Optional.empty();
    }

    private Optional<String> validarOperaciones(ResultadoAnalisis esperado,
                                                ResultadoAnalisis alumno,
                                                TipoValidacionEjercicio tipo) {
        Set<String> operacionesPermitidas = new LinkedHashSet<>(esperado.operaciones());
        operacionesPermitidas.addAll(esperado.operacionesInternas());

        if (tipo == TipoValidacionEjercicio.SELECT || tipo == TipoValidacionEjercicio.PRACTICA_RAPIDA) {
            if (esperado.esSoloLectura()) {
                operacionesPermitidas = Set.of("SELECT");
            }
        }

        if (tipo == TipoValidacionEjercicio.TRANSACCION) {
            operacionesPermitidas = new LinkedHashSet<>(esperado.operaciones());
            operacionesPermitidas.addAll(esperado.operacionesInternas());
            operacionesPermitidas.addAll(CONTROL_TRANSACCION);
        }

        for (SentenciaAnalizada sentencia : alumno.sentencias()) {
            if (!operacionesPermitidas.contains(sentencia.operacion())) {
                return Optional.of("Operación recibida: " + sentencia.operacion()
                        + ". Operaciones permitidas: " + operacionesPermitidas + ".");
            }
            for (String operacionInterna : sentencia.operacionesInternas()) {
                if (!operacionesPermitidas.contains(operacionInterna)) {
                    return Optional.of("Operación interna recibida: " + operacionInterna
                            + ". Operaciones permitidas: " + operacionesPermitidas + ".");
                }
            }
            if ("SELECT".equals(sentencia.operacion()) && contieneMutacionEmbebida(sentencia.sqlSinComentarios())) {
                return Optional.of("Un SELECT no puede esconder INSERT, UPDATE, DELETE, CREATE, ALTER o DROP.");
            }
        }

        return Optional.empty();
    }

    private Optional<String> validarObjetosPermitidos(ResultadoAnalisis esperado,
                                                      ResultadoAnalisis alumno,
                                                      TipoValidacionEjercicio tipo) {
        for (SentenciaAnalizada sentencia : alumno.sentencias()) {
            if (esOperacionDdl(sentencia.operacion())) {
                Set<String> targetsPermitidos = esperado.targetsPorOperacion()
                        .getOrDefault(sentencia.operacion(), Set.of());
                if (!targetsPermitidos.isEmpty() && sentencia.target() != null
                        && !targetsPermitidos.contains(sentencia.target())) {
                    return Optional.of("Objeto DDL recibido: " + sentencia.target()
                            + ". Objetos permitidos para " + sentencia.operacion() + ": " + targetsPermitidos + ".");
                }
            }

            if (esOperacionDml(sentencia.operacion())) {
                Set<String> tablasPermitidas = esperado.tablasMutadas();
                if (!tablasPermitidas.isEmpty() && !tablasPermitidas.contains(sentencia.target())) {
                    return Optional.of("Tabla DML recibida: " + sentencia.target()
                            + ". Tablas permitidas: " + tablasPermitidas + ".");
                }
            }
        }

        Set<String> tablasLeidasAlumno = new LinkedHashSet<>(alumno.tablasLeidas());
        Set<String> tablasPermitidasLectura = new LinkedHashSet<>(esperado.tablasLeidas());
        tablasPermitidasLectura.addAll(esperado.tablasMutadas());
        if ((tipo == TipoValidacionEjercicio.SELECT || tipo == TipoValidacionEjercicio.PRACTICA_RAPIDA)
                && esperado.esSoloLectura()
                && !tablasPermitidasLectura.isEmpty()) {
            tablasLeidasAlumno.removeAll(tablasPermitidasLectura);
            if (!tablasLeidasAlumno.isEmpty()) {
                return Optional.of("Tablas leídas fuera del ejercicio: " + tablasLeidasAlumno
                        + ". Tablas permitidas: " + tablasPermitidasLectura + ".");
            }
        }

        Set<String> tablasMutadasAlumno = new LinkedHashSet<>(alumno.tablasMutadas());
        Set<String> tablasPermitidasMutacion = new LinkedHashSet<>(esperado.tablasMutadas());
        tablasPermitidasMutacion.addAll(esperado.tablasLeidas());
        if (tablasPermitidasMutacion.isEmpty() && !tablasMutadasAlumno.isEmpty()) {
            return Optional.of("Este ejercicio no esperaba modificar tablas, pero se intentó modificar: "
                    + tablasMutadasAlumno + ".");
        }
        tablasMutadasAlumno.removeAll(tablasPermitidasMutacion);
        if (!tablasMutadasAlumno.isEmpty()) {
            return Optional.of("Tablas modificadas fuera del ejercicio: " + tablasMutadasAlumno
                    + ". Tablas permitidas: " + tablasPermitidasMutacion + ".");
        }

        return Optional.empty();
    }

    private Optional<String> validarEsquemasInternos(ResultadoAnalisis esperado, ResultadoAnalisis alumno) {
        if (!alumno.esquemasInternosReferenciados().isEmpty()) {
            Set<String> esquemasNoEsperados = new LinkedHashSet<>(alumno.esquemasInternosReferenciados());
            esquemasNoEsperados.removeAll(esperado.esquemasInternosReferenciados());
            if (!esquemasNoEsperados.isEmpty()) {
                return Optional.of("Esquemas internos no esperados: " + esquemasNoEsperados + ".");
            }
        }

        for (SentenciaAnalizada sentencia : alumno.sentencias()) {
            if (sentencia.mutacion() && !sentencia.esquemasInternos().isEmpty()) {
                return Optional.of("Intento de mutación sobre esquemas internos: " + sentencia.esquemasInternos() + ".");
            }
        }
        return Optional.empty();
    }

    private boolean permiteMultiplesSentencias(ResultadoAnalisis esperado, TipoValidacionEjercicio tipo) {
        return esperado.sentencias().size() > 1 || tipo == TipoValidacionEjercicio.TRANSACCION;
    }

    private ResultadoAnalisis analizar(String sql) {
        List<String> sentenciasSeparadas;
        try {
            sentenciasSeparadas = separarSentencias(sql);
        } catch (IllegalArgumentException ex) {
            return ResultadoAnalisis.conError(ex.getMessage());
        }

        if (sentenciasSeparadas.isEmpty()) {
            return ResultadoAnalisis.conError("La consulta no contiene sentencias ejecutables.");
        }

        List<SentenciaAnalizada> sentencias = new ArrayList<>();
        StringBuilder sqlSinComentarios = new StringBuilder();
        for (String sentencia : sentenciasSeparadas) {
            String limpia = quitarComentarios(sentencia).trim();
            if (limpia.isEmpty()) {
                continue;
            }
            sqlSinComentarios.append(limpia).append(";\n");
            sentencias.add(analizarSentencia(sentencia, limpia));
        }

        if (sentencias.isEmpty()) {
            return ResultadoAnalisis.conError("La consulta solo contiene comentarios o espacios.");
        }

        return ResultadoAnalisis.desde(sentencias, sqlSinComentarios.toString());
    }

    private SentenciaAnalizada analizarSentencia(String sqlOriginal, String sqlSinComentarios) {
        String upper = sqlSinComentarios.trim().toUpperCase(Locale.ROOT);
        String operacion = clasificarOperacion(upper);
        String target = extraerTarget(operacion, sqlSinComentarios);
        Set<String> tablasLeidas = extraerTablasLeidas(sqlSinComentarios);
        Set<String> tablasMutadas = extraerTablasMutadas(operacion, target, sqlSinComentarios);
        Set<String> operacionesInternas = extraerOperacionesInternas(sqlSinComentarios);
        Set<String> esquemasInternos = extraerEsquemasInternos(sqlSinComentarios);
        boolean mutacion = OPERACIONES_MUTACION.contains(operacion);

        return new SentenciaAnalizada(
                sqlOriginal,
                sqlSinComentarios,
                operacion,
                target,
                tablasLeidas,
                tablasMutadas,
                operacionesInternas,
                esquemasInternos,
                mutacion
        );
    }

    private String clasificarOperacion(String upper) {
        if (upper.matches("^\\s*WITH\\b[\\s\\S]*") || upper.matches("^\\s*SELECT\\b[\\s\\S]*")) {
            return "SELECT";
        }
        if (upper.matches("^\\s*INSERT\\b[\\s\\S]*")) {
            return "INSERT";
        }
        if (upper.matches("^\\s*UPDATE\\b[\\s\\S]*")) {
            return "UPDATE";
        }
        if (upper.matches("^\\s*DELETE\\b[\\s\\S]*")) {
            return "DELETE";
        }
        if (upper.matches("^\\s*CREATE\\s+(OR\\s+REPLACE\\s+)?TABLE\\b[\\s\\S]*")) {
            return "CREATE_TABLE";
        }
        if (upper.matches("^\\s*ALTER\\s+TABLE\\b[\\s\\S]*")) {
            return "ALTER_TABLE";
        }
        if (upper.matches("^\\s*DROP\\s+TABLE\\b[\\s\\S]*")) {
            return "DROP_TABLE";
        }
        if (upper.matches("^\\s*CREATE\\s+(OR\\s+REPLACE\\s+)?VIEW\\b[\\s\\S]*")) {
            return "CREATE_VIEW";
        }
        if (upper.matches("^\\s*DROP\\s+VIEW\\b[\\s\\S]*")) {
            return "DROP_VIEW";
        }
        if (upper.matches("^\\s*CREATE\\s+(OR\\s+REPLACE\\s+)?FUNCTION\\b[\\s\\S]*")) {
            return "CREATE_FUNCTION";
        }
        if (upper.matches("^\\s*DROP\\s+FUNCTION\\b[\\s\\S]*")) {
            return "DROP_FUNCTION";
        }
        if (upper.matches("^\\s*CREATE\\s+TRIGGER\\b[\\s\\S]*")) {
            return "CREATE_TRIGGER";
        }
        if (upper.matches("^\\s*DROP\\s+TRIGGER\\b[\\s\\S]*")) {
            return "DROP_TRIGGER";
        }
        if (upper.matches("^\\s*BEGIN\\b[\\s\\S]*")) {
            return "BEGIN";
        }
        if (upper.matches("^\\s*COMMIT\\b[\\s\\S]*")) {
            return "COMMIT";
        }
        if (upper.matches("^\\s*ROLLBACK\\b[\\s\\S]*")) {
            return "ROLLBACK";
        }
        if (upper.matches("^\\s*SAVEPOINT\\b[\\s\\S]*")) {
            return "SAVEPOINT";
        }
        return "OTHER";
    }

    private String extraerTarget(String operacion, String sql) {
        return switch (operacion) {
            case "INSERT" -> capturar(sql, "(?i)\\bINSERT\\s+INTO\\s+([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
            case "UPDATE" -> capturar(sql, "(?i)\\bUPDATE\\s+(?:ONLY\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
            case "DELETE" -> capturar(sql, "(?i)\\bDELETE\\s+FROM\\s+(?:ONLY\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
            case "CREATE_TABLE" -> capturar(sql, "(?i)\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
            case "ALTER_TABLE" -> capturar(sql, "(?i)\\bALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
            case "DROP_TABLE" -> capturar(sql, "(?i)\\bDROP\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
            case "CREATE_VIEW" -> capturar(sql, "(?i)\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?VIEW\\s+([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
            case "DROP_VIEW" -> capturar(sql, "(?i)\\bDROP\\s+VIEW\\s+(?:IF\\s+EXISTS\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
            case "CREATE_FUNCTION" -> capturar(sql, "(?i)\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
            case "DROP_FUNCTION" -> capturar(sql, "(?i)\\bDROP\\s+FUNCTION\\s+(?:IF\\s+EXISTS\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
            case "CREATE_TRIGGER" -> capturar(sql, "(?i)\\bCREATE\\s+TRIGGER\\s+([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
            case "DROP_TRIGGER" -> capturar(sql, "(?i)\\bDROP\\s+TRIGGER\\s+(?:IF\\s+EXISTS\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
            default -> null;
        };
    }

    private String capturar(String sql, String regex) {
        Matcher matcher = Pattern.compile(regex).matcher(sql);
        if (!matcher.find()) {
            return null;
        }
        return normalizarIdentificador(matcher.group(1));
    }

    private Set<String> extraerTablasLeidas(String sql) {
        Set<String> tablas = new LinkedHashSet<>();
        Matcher matcher = REFERENCIA_TABLAS.matcher(sql);
        while (matcher.find()) {
            String tabla = normalizarIdentificador(matcher.group(1));
            if (tabla != null && !tabla.isBlank()) {
                tablas.add(tabla);
            }
        }
        return tablas;
    }

    private Set<String> extraerTablasMutadas(String operacion, String target, String sql) {
        Set<String> tablas = new LinkedHashSet<>();
        if (esOperacionDml(operacion) && target != null) {
            tablas.add(target);
        }
        if ("CREATE_TABLE".equals(operacion) || "ALTER_TABLE".equals(operacion) || "DROP_TABLE".equals(operacion)) {
            if (target != null) {
                tablas.add(target);
            }
        }

        agregarTargets(sql, tablas, "(?i)\\bINSERT\\s+INTO\\s+([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
        agregarTargets(sql, tablas, "(?i)\\bUPDATE\\s+(?:ONLY\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
        agregarTargets(sql, tablas, "(?i)\\bDELETE\\s+FROM\\s+(?:ONLY\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
        agregarTargets(sql, tablas, "(?i)\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
        agregarTargets(sql, tablas, "(?i)\\bALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
        agregarTargets(sql, tablas, "(?i)\\bDROP\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
        agregarTargets(sql, tablas, "(?i)\\b(?:CREATE|DROP)\\s+TRIGGER\\s+(?:IF\\s+EXISTS\\s+)?[\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?\\s+[\\s\\S]*?\\bON\\s+([\"`]?[a-zA-Z_][a-zA-Z0-9_.]*[\"`]?)");
        return tablas;
    }

    private Set<String> extraerOperacionesInternas(String sql) {
        Map<String, Pattern> patrones = new LinkedHashMap<>();
        patrones.put("INSERT", Pattern.compile("(?i)\\bINSERT\\s+INTO\\b"));
        patrones.put("UPDATE", Pattern.compile("(?i)\\bUPDATE\\s+(?:ONLY\\s+)?[\"`]?[a-zA-Z_]"));
        patrones.put("DELETE", Pattern.compile("(?i)\\bDELETE\\s+FROM\\b"));
        patrones.put("CREATE_TABLE", Pattern.compile("(?i)\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?TABLE\\b"));
        patrones.put("ALTER_TABLE", Pattern.compile("(?i)\\bALTER\\s+TABLE\\b"));
        patrones.put("DROP_TABLE", Pattern.compile("(?i)\\bDROP\\s+TABLE\\b"));
        patrones.put("CREATE_VIEW", Pattern.compile("(?i)\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?VIEW\\b"));
        patrones.put("DROP_VIEW", Pattern.compile("(?i)\\bDROP\\s+VIEW\\b"));
        patrones.put("CREATE_FUNCTION", Pattern.compile("(?i)\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\b"));
        patrones.put("DROP_FUNCTION", Pattern.compile("(?i)\\bDROP\\s+FUNCTION\\b"));
        patrones.put("CREATE_TRIGGER", Pattern.compile("(?i)\\bCREATE\\s+TRIGGER\\b"));
        patrones.put("DROP_TRIGGER", Pattern.compile("(?i)\\bDROP\\s+TRIGGER\\b"));

        Set<String> operaciones = new LinkedHashSet<>();
        for (Map.Entry<String, Pattern> entry : patrones.entrySet()) {
            if (entry.getValue().matcher(sql).find()) {
                operaciones.add(entry.getKey());
            }
        }
        return operaciones;
    }

    private void agregarTargets(String sql, Set<String> tablas, String regex) {
        Matcher matcher = Pattern.compile(regex).matcher(sql);
        while (matcher.find()) {
            String tabla = normalizarIdentificador(matcher.group(1));
            if (tabla != null && !tabla.isBlank()) {
                tablas.add(tabla);
            }
        }
    }

    private Set<String> extraerEsquemasInternos(String sql) {
        Set<String> esquemas = new LinkedHashSet<>();
        Matcher matcher = Pattern.compile("(?i)\\b(lms_core|information_schema|pg_catalog)\\s*\\.").matcher(sql);
        while (matcher.find()) {
            esquemas.add(matcher.group(1).toLowerCase(Locale.ROOT));
        }
        return esquemas;
    }

    private Optional<String> detectarComandoProhibido(String sqlSinComentarios) {
        for (Pattern patron : PATRONES_PROHIBIDOS) {
            Matcher matcher = patron.matcher(sqlSinComentarios);
            if (matcher.find()) {
                return Optional.of("Patrón prohibido detectado: " + matcher.group() + ".");
            }
        }
        return Optional.empty();
    }

    private boolean contieneMutacionEmbebida(String sql) {
        String upper = sql.toUpperCase(Locale.ROOT);
        if (!upper.matches("^\\s*WITH\\b[\\s\\S]*")) {
            return false;
        }
        return upper.matches("[\\s\\S]*\\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE)\\b[\\s\\S]*");
    }

    private List<String> separarSentencias(String sql) {
        List<String> sentencias = new ArrayList<>();
        if (sql == null) {
            return sentencias;
        }

        StringBuilder actual = new StringBuilder();
        boolean enSimple = false;
        boolean enDoble = false;
        boolean enLineaComentario = false;
        boolean enBloqueComentario = false;
        String etiquetaDolar = null;

        for (int i = 0; i < sql.length(); i++) {
            char c = sql.charAt(i);
            char siguiente = i + 1 < sql.length() ? sql.charAt(i + 1) : '\0';

            if (enLineaComentario) {
                actual.append(c);
                if (c == '\n') {
                    enLineaComentario = false;
                }
                continue;
            }

            if (enBloqueComentario) {
                actual.append(c);
                if (c == '*' && siguiente == '/') {
                    actual.append(siguiente);
                    i++;
                    enBloqueComentario = false;
                }
                continue;
            }

            if (etiquetaDolar != null) {
                if (sql.startsWith(etiquetaDolar, i)) {
                    actual.append(etiquetaDolar);
                    i += etiquetaDolar.length() - 1;
                    etiquetaDolar = null;
                } else {
                    actual.append(c);
                }
                continue;
            }

            if (!enSimple && !enDoble && c == '-' && siguiente == '-') {
                actual.append(c).append(siguiente);
                i++;
                enLineaComentario = true;
                continue;
            }

            if (!enSimple && !enDoble && c == '/' && siguiente == '*') {
                actual.append(c).append(siguiente);
                i++;
                enBloqueComentario = true;
                continue;
            }

            if (!enSimple && !enDoble && c == '$') {
                String etiqueta = leerEtiquetaDolar(sql, i);
                if (etiqueta != null) {
                    actual.append(etiqueta);
                    i += etiqueta.length() - 1;
                    etiquetaDolar = etiqueta;
                    continue;
                }
            }

            if (!enDoble && c == '\'') {
                actual.append(c);
                if (enSimple && siguiente == '\'') {
                    actual.append(siguiente);
                    i++;
                } else {
                    enSimple = !enSimple;
                }
                continue;
            }

            if (!enSimple && c == '"') {
                actual.append(c);
                enDoble = !enDoble;
                continue;
            }

            if (!enSimple && !enDoble && c == ';') {
                String sentencia = actual.toString().trim();
                if (!sentencia.isEmpty()) {
                    sentencias.add(sentencia);
                }
                actual.setLength(0);
                continue;
            }

            actual.append(c);
        }

        String restante = actual.toString().trim();
        if (!restante.isEmpty()) {
            throw new IllegalArgumentException("La sentencia final no está cerrada con punto y coma.");
        }
        if (enSimple || enDoble || etiquetaDolar != null || enBloqueComentario) {
            throw new IllegalArgumentException("Hay comillas, bloques o comentarios sin cerrar.");
        }

        return sentencias;
    }

    private String leerEtiquetaDolar(String sql, int inicio) {
        int fin = sql.indexOf('$', inicio + 1);
        if (fin <= inicio) {
            return null;
        }
        String etiqueta = sql.substring(inicio, fin + 1);
        if ("$$".equals(etiqueta)) {
            return etiqueta;
        }
        String contenido = etiqueta.substring(1, etiqueta.length() - 1);
        return IDENTIFICADOR.matcher(contenido).matches() ? etiqueta : null;
    }

    private String quitarComentarios(String sql) {
        StringBuilder limpio = new StringBuilder();
        boolean enSimple = false;
        boolean enDoble = false;
        boolean enLineaComentario = false;
        boolean enBloqueComentario = false;
        String etiquetaDolar = null;

        for (int i = 0; i < sql.length(); i++) {
            char c = sql.charAt(i);
            char siguiente = i + 1 < sql.length() ? sql.charAt(i + 1) : '\0';

            if (enLineaComentario) {
                if (c == '\n') {
                    limpio.append(' ');
                    enLineaComentario = false;
                }
                continue;
            }

            if (enBloqueComentario) {
                if (c == '*' && siguiente == '/') {
                    i++;
                    enBloqueComentario = false;
                }
                continue;
            }

            if (etiquetaDolar != null) {
                if (sql.startsWith(etiquetaDolar, i)) {
                    limpio.append(etiquetaDolar);
                    i += etiquetaDolar.length() - 1;
                    etiquetaDolar = null;
                } else {
                    limpio.append(c);
                }
                continue;
            }

            if (!enSimple && !enDoble && c == '-' && siguiente == '-') {
                i++;
                enLineaComentario = true;
                continue;
            }

            if (!enSimple && !enDoble && c == '/' && siguiente == '*') {
                i++;
                enBloqueComentario = true;
                continue;
            }

            if (!enSimple && !enDoble && c == '$') {
                String etiqueta = leerEtiquetaDolar(sql, i);
                if (etiqueta != null) {
                    limpio.append(etiqueta);
                    i += etiqueta.length() - 1;
                    etiquetaDolar = etiqueta;
                    continue;
                }
            }

            if (!enDoble && c == '\'') {
                limpio.append(c);
                if (enSimple && siguiente == '\'') {
                    limpio.append(siguiente);
                    i++;
                } else {
                    enSimple = !enSimple;
                }
                continue;
            }

            if (!enSimple && c == '"') {
                limpio.append(c);
                enDoble = !enDoble;
                continue;
            }

            limpio.append(c);
        }

        return limpio.toString();
    }

    private String normalizarIdentificador(String identificador) {
        if (identificador == null) {
            return null;
        }
        String limpio = identificador.trim()
                .replaceAll("[;(),]+$", "")
                .replace("`", "")
                .replace("\"", "")
                .replaceAll("\\s+", "");
        int punto = limpio.lastIndexOf('.');
        if (punto >= 0 && punto + 1 < limpio.length()) {
            limpio = limpio.substring(punto + 1);
        }
        return limpio.toLowerCase(Locale.ROOT);
    }

    private boolean esOperacionDml(String operacion) {
        return "INSERT".equals(operacion) || "UPDATE".equals(operacion) || "DELETE".equals(operacion);
    }

    private boolean esOperacionDdl(String operacion) {
        return operacion != null && (operacion.startsWith("CREATE_")
                || operacion.startsWith("ALTER_")
                || operacion.startsWith("DROP_"));
    }

    private Map<String, Object> error(String message, ContextoValidacionEjercicio contexto, String errorDb) {
        return RespuestasValidacion.error(message, contexto.ejercicio(), contexto.queryUsuario(), errorDb);
    }

    private record SentenciaAnalizada(
            String sqlOriginal,
            String sqlSinComentarios,
            String operacion,
            String target,
            Set<String> tablasLeidas,
            Set<String> tablasMutadas,
            Set<String> operacionesInternas,
            Set<String> esquemasInternos,
            boolean mutacion
    ) {
    }

    private record ResultadoAnalisis(
            List<SentenciaAnalizada> sentencias,
            String sqlSinComentarios,
            String error
    ) {
        static ResultadoAnalisis conError(String error) {
            return new ResultadoAnalisis(List.of(), "", error);
        }

        static ResultadoAnalisis desde(List<SentenciaAnalizada> sentencias, String sqlSinComentarios) {
            return new ResultadoAnalisis(sentencias, sqlSinComentarios, null);
        }

        Set<String> operaciones() {
            Set<String> operaciones = new LinkedHashSet<>();
            for (SentenciaAnalizada sentencia : sentencias) {
                operaciones.add(sentencia.operacion());
            }
            return operaciones;
        }

        Set<String> operacionesInternas() {
            Set<String> operaciones = new LinkedHashSet<>();
            for (SentenciaAnalizada sentencia : sentencias) {
                operaciones.addAll(sentencia.operacionesInternas());
            }
            return operaciones;
        }

        boolean esSoloLectura() {
            return sentencias.stream().allMatch(sentencia -> "SELECT".equals(sentencia.operacion()));
        }

        Set<String> tablasLeidas() {
            Set<String> tablas = new LinkedHashSet<>();
            for (SentenciaAnalizada sentencia : sentencias) {
                tablas.addAll(sentencia.tablasLeidas());
            }
            return tablas;
        }

        Set<String> tablasMutadas() {
            Set<String> tablas = new LinkedHashSet<>();
            for (SentenciaAnalizada sentencia : sentencias) {
                tablas.addAll(sentencia.tablasMutadas());
            }
            return tablas;
        }

        Set<String> esquemasInternosReferenciados() {
            Set<String> esquemas = new LinkedHashSet<>();
            for (SentenciaAnalizada sentencia : sentencias) {
                esquemas.addAll(sentencia.esquemasInternos());
            }
            return esquemas;
        }

        Map<String, Set<String>> targetsPorOperacion() {
            Map<String, Set<String>> targets = new LinkedHashMap<>();
            for (SentenciaAnalizada sentencia : sentencias) {
                if (sentencia.target() == null || sentencia.target().isBlank()) {
                    continue;
                }
                targets.computeIfAbsent(sentencia.operacion(), ignored -> new LinkedHashSet<>())
                        .add(sentencia.target());
            }
            return targets;
        }
    }
}
