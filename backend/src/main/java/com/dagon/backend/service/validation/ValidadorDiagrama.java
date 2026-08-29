package com.dagon.backend.service.validation;

import com.dagon.backend.model.EjercicioPractico;
import com.dagon.backend.service.ModelingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Evalua los ejercicios de diagrama Entidad-Relacion (formato = "diagram").
 *
 * El lienzo (MerDiagramBuilder) envia {"nodes":[...], "edges":[...]}, donde cada nodo trae
 * data.label (nombre de la entidad) y data.columns [{name, role: pk|fk|normal}], y cada arista
 * trae data.cardinality (1:1, 1:N, M:N).
 *
 * Las reglas salen de configuracion_extra del ejercicio:
 *   min_entidades              (int, def. 2)
 *   min_relaciones             (int, def. 1)
 *   min_atributos              (int, def. 0)  total sumando todas las entidades
 *   min_atributos_por_entidad  (int, def. 0)  cada entidad por separado
 *   requiere_pk                (bool, def. false) cada entidad necesita una columna PK
 *   entidades_requeridas       [["huesped","cliente"], ...] cada grupo = al menos un sinonimo
 *   relaciones_requeridas      [{"source":"aventurero","target":"gremio","cardinality":"1:N"}]
 *   mensaje_error / mensaje_relaciones  textos a medida
 *
 * A diferencia de la version anterior, devuelve TODOS los problemas de una vez (el alumno ve
 * la lista completa en vez de descubrirlos de uno en uno) y nunca revienta con un JSON raro.
 */
@Component
public class ValidadorDiagrama implements ValidadorEjercicio {

    private final ObjectMapper mapper = new ObjectMapper();
    private final ModelingService modelingService;

    public ValidadorDiagrama(ModelingService modelingService) {
        this.modelingService = modelingService;
    }

    /** Resultado del analisis: problemas pendientes y un resumen para pintar en la UI. */
    public record ResultadoDiagrama(List<String> problemas, Map<String, Object> resumen) {
        public boolean esValido() {
            return problemas.isEmpty();
        }
    }

    @Override
    public boolean soporta(TipoValidacionEjercicio tipo) {
        return tipo == TipoValidacionEjercicio.DIAGRAMA;
    }

    @Override
    public Optional<Map<String, Object>> prevalidar(ContextoValidacionEjercicio contexto) {
        try {
            JsonNode root = mapper.readTree(contexto.queryUsuario());
            JsonNode nodes = root.get("nodes");
            JsonNode edges = root.get("edges");
            if ((nodes != null && !nodes.isArray()) || (edges != null && !edges.isArray())) {
                return Optional.of(RespuestasValidacion.error(
                        "El diagrama no tiene una estructura válida.",
                        contexto.ejercicio(),
                        contexto.queryUsuario(),
                        "Los campos nodes y edges deben ser arreglos."
                ));
            }
            return Optional.empty();
        } catch (Exception e) {
            return Optional.of(RespuestasValidacion.error(
                    "El diagrama no se pudo leer. Revisa que la estructura visual sea válida.",
                    contexto.ejercicio(),
                    contexto.queryUsuario(),
                    "JSON de diagrama inválido: " + e.getMessage()
            ));
        }
    }

    public ResultadoDiagrama analizar(EjercicioPractico ejercicio, String queryUsuario) {
        List<String> problemas = new ArrayList<>();
        Map<String, Object> resumen = new LinkedHashMap<>();

        JsonNode root;
        try {
            root = mapper.readTree(queryUsuario);
        } catch (Exception e) {
            problemas.add("El diagrama no se pudo leer. Vuelve a dibujarlo.");
            return new ResultadoDiagrama(problemas, resumen);
        }

        List<Entidad> entidades = leerEntidades(root.get("nodes"));
        List<Relacion> relaciones = leerRelaciones(root.get("edges"), entidades);
        JsonNode config = configuracionEfectiva(ejercicio);

        int minEntidades = entero(config, "min_entidades", 2);
        int minRelaciones = entero(config, "min_relaciones", 1);
        int minAtributos = entero(config, "min_atributos", 0);
        int minAtributosPorEntidad = entero(config, "min_atributos_por_entidad", 0);
        boolean requierePk = config.path("requiere_pk").asBoolean(false);

        int totalAtributos = entidades.stream().mapToInt(e -> e.columnas().size()).sum();
        resumen.put("entidades", entidades.size());
        resumen.put("relaciones", relaciones.size());
        resumen.put("atributos", totalAtributos);
        resumen.put("clavesPrimarias", entidades.stream().filter(Entidad::tienePk).count());
        resumen.put("nombres", entidades.stream().map(Entidad::nombre).toList());

        // --- Entidades sin nombre: cualquier otra regla sobre nombres seria ruido ---
        long sinNombre = entidades.stream().filter(e -> e.nombre().isEmpty()).count();
        if (sinNombre > 0) {
            problemas.add(sinNombre == 1
                    ? "Hay una entidad sin nombre. Ponle un nombre para poder evaluarla."
                    : "Hay " + sinNombre + " entidades sin nombre. Ponles un nombre para poder evaluarlas.");
        }

        // --- Conteos minimos ---
        if (entidades.size() < minEntidades) {
            String base = texto(config, "mensaje_error", "El diagrama está incompleto.");
            problemas.add(base + " Necesitas al menos " + minEntidades + " entidad(es) y llevas "
                    + entidades.size() + ".");
        }
        if (relaciones.size() < minRelaciones) {
            String base = texto(config, "mensaje_relaciones", "Necesitas conectar las entidades con relaciones.");
            problemas.add(base + " Necesitas al menos " + minRelaciones + " relación(es) y llevas "
                    + relaciones.size() + ".");
        }
        if (minAtributos > 0 && totalAtributos < minAtributos) {
            problemas.add("Faltan atributos: necesitas " + minAtributos + " en total y llevas " + totalAtributos + ".");
        }

        // --- Reglas por entidad: atributos propios y clave primaria ---
        if (minAtributosPorEntidad > 0) {
            List<String> pobres = entidades.stream()
                    .filter(e -> !e.nombre().isEmpty() && e.columnas().size() < minAtributosPorEntidad)
                    .map(Entidad::nombre)
                    .toList();
            if (!pobres.isEmpty()) {
                problemas.add("Cada entidad necesita al menos " + minAtributosPorEntidad
                        + " atributo(s). Les falta a: " + String.join(", ", pobres) + ".");
            }
        }
        if (requierePk) {
            List<String> sinPk = entidades.stream()
                    .filter(e -> !e.nombre().isEmpty() && !e.tienePk())
                    .map(Entidad::nombre)
                    .toList();
            if (!sinPk.isEmpty()) {
                problemas.add("Cada entidad necesita una clave primaria (marca una columna como PK). "
                        + "Sin PK: " + String.join(", ", sinPk) + ".");
            }
        }

        // --- Entidades requeridas: cada grupo es una lista de sinonimos aceptados ---
        for (List<String> sinonimos : gruposRequeridos(config, "entidades_requeridas")) {
            boolean encontrada = entidades.stream().anyMatch(e -> coincideAlguno(e.nombre(), sinonimos));
            if (!encontrada) {
                problemas.add("Falta la entidad " + sinonimos.get(0) + ".");
            }
        }

        // --- Relaciones requeridas, con cardinalidad opcional ---
        for (JsonNode relReq : config.path("relaciones_requeridas")) {
            List<String> origen = sinonimosDe(relReq.path("source"));
            List<String> destino = sinonimosDe(relReq.path("target"));
            if (origen.isEmpty() || destino.isEmpty()) {
                continue;
            }
            String cardinalidadPedida = relReq.hasNonNull("cardinality") ? relReq.get("cardinality").asText() : null;

            boolean paresConectados = relaciones.stream().anyMatch(r -> conecta(r, origen, destino));
            if (!paresConectados) {
                problemas.add("Falta conectar " + origen.get(0) + " con " + destino.get(0) + ".");
                continue;
            }
            if (cardinalidadPedida != null) {
                boolean cardinalidadOk = relaciones.stream()
                        .filter(r -> conecta(r, origen, destino))
                        .anyMatch(r -> cardinalidadEquivalente(r, origen, destino, cardinalidadPedida));
                if (!cardinalidadOk) {
                    problemas.add("La relación entre " + origen.get(0) + " y " + destino.get(0)
                            + " debe ser " + cardinalidadPedida + ".");
                }
            }
        }

        return new ResultadoDiagrama(problemas, resumen);
    }

    // ---------------------------------------------------------------- lectura del lienzo

    private record Entidad(String id, String nombre, List<String> columnas, boolean tienePk) {
    }

    /** source/target ya resueltos a nombres de entidad, no a ids opacos. */
    private record Relacion(String origen, String destino, String cardinalidad) {
    }

    private List<Entidad> leerEntidades(JsonNode nodes) {
        List<Entidad> entidades = new ArrayList<>();
        if (nodes == null || !nodes.isArray()) {
            return entidades;
        }
        for (JsonNode node : nodes) {
            JsonNode data = node.path("data");
            String nombre = normalizar(data.path("label").asText(""));
            List<String> columnas = new ArrayList<>();
            boolean tienePk = false;
            for (JsonNode columna : data.path("columns")) {
                String nombreColumna = columna.path("name").asText("").trim();
                if (nombreColumna.isEmpty()) {
                    continue; // una fila vacia no es un atributo
                }
                columnas.add(nombreColumna);
                if ("pk".equalsIgnoreCase(columna.path("role").asText(""))) {
                    tienePk = true;
                }
            }
            entidades.add(new Entidad(node.path("id").asText(""), nombre, columnas, tienePk));
        }
        return entidades;
    }

    private List<Relacion> leerRelaciones(JsonNode edges, List<Entidad> entidades) {
        List<Relacion> relaciones = new ArrayList<>();
        if (edges == null || !edges.isArray()) {
            return relaciones;
        }
        for (JsonNode edge : edges) {
            String origen = nombrePorId(entidades, edge.path("source").asText(""));
            String destino = nombrePorId(entidades, edge.path("target").asText(""));
            String cardinalidad = edge.path("data").path("cardinality").asText("1:N");
            relaciones.add(new Relacion(origen, destino, cardinalidad));
        }
        return relaciones;
    }

    private String nombrePorId(List<Entidad> entidades, String id) {
        return entidades.stream()
                .filter(e -> e.id().equals(id))
                .map(Entidad::nombre)
                .findFirst()
                .orElse("");
    }

    // ---------------------------------------------------------------- reglas y comparaciones

    /**
     * Devuelve las reglas del ejercicio. Si el docente no escribio ninguna pero la query maestra
     * es DDL real (el caso de los ejercicios creados desde el panel docente), las deducimos de
     * ese DDL: sus tablas son las entidades exigidas, sus FKs las relaciones, y si todas sus
     * tablas declaran PK, se exige PK. Sin esto, cualquier diagrama con dos cajas y una linea
     * aprobaba un ejercicio cuyo enunciado pedia entidades concretas.
     */
    private JsonNode configuracionEfectiva(EjercicioPractico ejercicio) {
        JsonNode config = leerConfig(ejercicio);
        boolean traeReglas = config.has("min_entidades") || config.has("min_relaciones")
                || config.has("entidades_requeridas") || config.has("relaciones_requeridas")
                || config.has("min_atributos") || config.has("min_atributos_por_entidad");
        if (traeReglas) {
            return config;
        }
        return deducirDesdeDdlMaestro(ejercicio, config);
    }

    private JsonNode deducirDesdeDdlMaestro(EjercicioPractico ejercicio, JsonNode base) {
        String ddl = ejercicio != null ? ejercicio.getQueryMaestra() : null;
        if (ddl == null || !ddl.toUpperCase(Locale.ROOT).contains("CREATE TABLE")) {
            return base;
        }

        try {
            Map<String, Object> erd = modelingService.construirErdDesdeDdl(ddl);
            JsonNode maestro = mapper.valueToTree(erd);
            List<Entidad> entidadesMaestras = leerEntidades(maestro.get("nodes"));
            List<Relacion> relacionesMaestras = leerRelaciones(maestro.get("edges"), entidadesMaestras);
            if (entidadesMaestras.isEmpty()) {
                return base;
            }

            ObjectNode derivada = base.isObject() ? ((ObjectNode) base).deepCopy() : mapper.createObjectNode();
            derivada.put("min_entidades", entidadesMaestras.size());
            derivada.put("min_relaciones", relacionesMaestras.size());
            derivada.put("requiere_pk", entidadesMaestras.stream().allMatch(Entidad::tienePk));

            ArrayNode entidades = derivada.putArray("entidades_requeridas");
            for (Entidad entidad : entidadesMaestras) {
                if (!entidad.nombre().isEmpty()) {
                    entidades.addArray().add(entidad.nombre());
                }
            }

            ArrayNode relaciones = derivada.putArray("relaciones_requeridas");
            for (Relacion relacion : relacionesMaestras) {
                if (relacion.origen().isEmpty() || relacion.destino().isEmpty()) {
                    continue;
                }
                // Solo exigimos el par conectado: deducir 1:N de una FK castigaria a quien
                // modelo bien pero arrastro la linea en el otro sentido.
                ObjectNode requerida = relaciones.addObject();
                requerida.put("source", relacion.origen());
                requerida.put("target", relacion.destino());
            }

            return derivada;
        } catch (Exception e) {
            return base;
        }
    }

    private JsonNode leerConfig(EjercicioPractico ejercicio) {
        String configExtra = ejercicio != null ? ejercicio.getConfiguracionExtra() : null;
        if (configExtra == null || configExtra.trim().isEmpty()) {
            return mapper.createObjectNode();
        }
        try {
            JsonNode config = mapper.readTree(configExtra);
            return config != null && config.isObject() ? config : mapper.createObjectNode();
        } catch (Exception e) {
            return mapper.createObjectNode();
        }
    }

    private List<List<String>> gruposRequeridos(JsonNode config, String campo) {
        List<List<String>> grupos = new ArrayList<>();
        for (JsonNode grupo : config.path(campo)) {
            List<String> sinonimos = sinonimosDe(grupo);
            if (!sinonimos.isEmpty()) {
                grupos.add(sinonimos);
            }
        }
        return grupos;
    }

    private List<String> sinonimosDe(JsonNode nodo) {
        List<String> sinonimos = new ArrayList<>();
        if (nodo == null || nodo.isMissingNode() || nodo.isNull()) {
            return sinonimos;
        }
        if (nodo.isArray()) {
            for (JsonNode opcion : nodo) {
                String valor = normalizar(opcion.asText(""));
                if (!valor.isEmpty()) {
                    sinonimos.add(valor);
                }
            }
        } else {
            String valor = normalizar(nodo.asText(""));
            if (!valor.isEmpty()) {
                sinonimos.add(valor);
            }
        }
        return sinonimos;
    }

    private boolean coincideAlguno(String nombreEntidad, List<String> sinonimos) {
        if (nombreEntidad.isEmpty()) {
            return false;
        }
        return sinonimos.stream().anyMatch(sinonimo -> nombreEntidad.contains(sinonimo)
                || sinonimo.contains(nombreEntidad));
    }

    private boolean conecta(Relacion relacion, List<String> origen, List<String> destino) {
        // Aceptamos el par en cualquier direccion: al alumno se le evalua el modelo,
        // no desde que lado arrastro la linea.
        return (coincideAlguno(relacion.origen(), origen) && coincideAlguno(relacion.destino(), destino))
                || (coincideAlguno(relacion.origen(), destino) && coincideAlguno(relacion.destino(), origen));
    }

    private boolean cardinalidadEquivalente(Relacion relacion, List<String> origen, List<String> destino,
                                            String pedida) {
        String actual = relacion.cardinalidad() == null ? "" : relacion.cardinalidad().trim().toUpperCase(Locale.ROOT);
        String esperada = pedida.trim().toUpperCase(Locale.ROOT);
        if (actual.equals(esperada)) {
            return true;
        }
        // Si dibujo la relacion al reves, 1:N y N:1 describen el mismo modelo.
        boolean invertida = coincideAlguno(relacion.origen(), destino) && coincideAlguno(relacion.destino(), origen);
        return invertida && actual.equals(invertir(esperada));
    }

    private String invertir(String cardinalidad) {
        return switch (cardinalidad) {
            case "1:N" -> "N:1";
            case "N:1" -> "1:N";
            default -> cardinalidad; // 1:1 y M:N son simetricas
        };
    }

    /** minusculas y sin acentos: "Habitación" y "habitacion" son la misma entidad. */
    private String normalizar(String valor) {
        if (valor == null) {
            return "";
        }
        String sinAcentos = Normalizer.normalize(valor.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return sinAcentos.toLowerCase(Locale.ROOT);
    }

    private int entero(JsonNode config, String campo, int porDefecto) {
        return config.path(campo).isInt() || config.path(campo).isNumber()
                ? config.path(campo).asInt(porDefecto)
                : porDefecto;
    }

    private String texto(JsonNode config, String campo, String porDefecto) {
        String valor = config.path(campo).asText("");
        return valor.isEmpty() ? porDefecto : valor;
    }
}
