package com.dagon.backend.service.clawbot;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Filtro inteligente previo a la IA.
 *
 * La inmensa mayoria de los errores de un alumno son deterministas (un nombre mal escrito,
 * una coma de mas, un GROUP BY faltante). Para esos casos no hace falta gastar tokens de
 * Gemini o Groq: el error de PostgreSQL ya dice exactamente que paso y donde.
 *
 * Este resolutor devuelve un diagnostico socratico solo cuando esta seguro. Si el fallo es
 * de logica ("tu resultado no coincide") devuelve vacio y deja pasar la consulta a la IA,
 * que es donde el token si vale la pena.
 */
@Component
public class ClawbotLocalResolver {

    /** Diagnostico local listo para ser formateado con el mismo estilo que la respuesta de la IA. */
    public record Diagnostico(String errorType, String concepto, String pista, String cierre) {
    }

    private record Regla(Pattern patron, String errorType, String concepto, String pista, String cierre) {
    }

    private static final String COMODIN = "esa parte de tu consulta";

    /**
     * Los patrones cubren ingles y espanol: PostgreSQL traduce sus mensajes segun lc_messages
     * (en local la base responde en es_ES, en Railway puede responder en ingles) y el frontend
     * a veces recibe el texto ya humanizado. Las comillas pueden ser "..." o «...».
     */
    private static final String Q = "[\"'«]";
    private static final String CIERRE_Q = "[\"'»]";

    private static Pattern regla(String cuerpo) {
        return Pattern.compile("(?i)" + cuerpo);
    }

    private static final List<Regla> REGLAS = List.of(
            new Regla(
                    regla("(?:syntax error at or near|error de sintaxis (?:en o )?cerca de)\\s*" + Q + "?([^\"'«».\\n]{1,40})"),
                    "syntax",
                    "PostgreSQL leyo tu consulta de izquierda a derecha y se detuvo justo en «%s»: hasta ahi la instruccion tenia sentido, desde ahi ya no.",
                    "No mires «%s» en si, mira lo que va inmediatamente ANTES. Casi siempre falta una coma, sobra una coma, quedo un parentesis o una comilla sin cerrar, o una palabra clave esta mal escrita.",
                    "¿Que esperaba encontrar el motor en el lugar de «%s»?"),

            new Regla(
                    regla("syntax error at end of input|error de sintaxis al final de la entrada"),
                    "syntax",
                    "Tu consulta termina antes de estar completa: la ultima clausula quedo a medias.",
                    "Lee la ultima palabra que escribiste y preguntate que le falta detras. Un WHERE necesita su condicion, un FROM su tabla y un parentesis abierto su cierre.",
                    "¿Que le falta a la ultima clausula de tu consulta?"),

            new Regla(
                    regla("unterminated quoted|cadena de caracteres entre comillas está inconclusa|comilla sin cerrar"),
                    "syntax",
                    "Abriste una comilla de texto y nunca la cerraste, asi que el motor considera que el resto de la consulta es parte de esa cadena.",
                    "Cuenta las comillas simples de tu consulta: deben ser un numero par. Si el texto contiene un apostrofe, se escribe duplicado ('D''Angelo').",
                    "¿Cuantas comillas simples tiene tu consulta?"),

            new Regla(
                    regla("relation\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "\\s+does not exist|no existe la relación\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "|la tabla\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "\\s+no existe"),
                    "table",
                    "El objeto «%s» no existe en tu sandbox. El motor busco ese nombre exacto y no encontro ninguna tabla ni vista.",
                    "Revisa tres cosas en «%s»: la ortografia, el singular/plural y si el nombre lleva guion bajo. Si el ejercicio te pide crearla, el CREATE TABLE va primero.",
                    "¿El nombre que escribiste coincide letra por letra con el del enunciado?"),

            new Regla(
                    regla("relation\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "\\s+already exists|la relación\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "\\s+ya existe"),
                    "table",
                    "La tabla «%s» ya existe: un CREATE TABLE no puede pisar un objeto que ya esta creado.",
                    "O usas CREATE TABLE IF NOT EXISTS, o eliminas la anterior con DROP TABLE antes de recrearla. Si ya la creaste en un intento previo, quiza solo falte reiniciar tu sandbox.",
                    "¿Necesitas crearla de nuevo o basta con modificarla con ALTER TABLE?"),

            new Regla(
                    regla("column\\s+" + Q + "?([\\w.]+)" + CIERRE_Q + "?\\s+does not exist|no existe la columna\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "|la columna\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "\\s+no existe"),
                    "column",
                    "La columna «%s» no existe en las tablas que pusiste en el FROM.",
                    "Dos causas tipicas: el nombre esta mal escrito, o la columna vive en otra tabla que todavia no incluiste en el FROM o el JOIN. Si el error trae una linea HINT, ahi te esta sugiriendo el nombre real.",
                    "¿La columna que buscas pertenece a alguna de las tablas que ya trajiste?"),

            new Regla(
                    regla("missing FROM-clause entry for table\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "|falta una entrada para la tabla\\s+" + Q + "([^\"'»]+)" + CIERRE_Q),
                    "join",
                    "Usaste «%s» como si fuera una tabla o un alias declarado, pero nunca aparece en el FROM ni en un JOIN.",
                    "Cada prefijo que escribes antes de un punto (por ejemplo «%s».columna) tiene que estar declarado antes en el FROM. Si le pusiste alias a la tabla, usa el alias, no el nombre completo.",
                    "¿Que tabla deberia aportar ese dato y esta declarada en tu FROM?"),

            new Regla(
                    regla("column\\s+" + Q + "?([\\w.]+)" + CIERRE_Q + "?\\s+must appear in the group by|la columna\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "\\s+debe aparecer en la cláusula GROUP BY|must appear in the group by|debe aparecer en la cláusula GROUP BY"),
                    "grouping",
                    "Mezclaste columnas resumidas (COUNT, SUM, AVG) con una columna suelta: «%s». PostgreSQL no sabe cual de los muchos valores de esa columna mostrar por grupo.",
                    "Regla practica: toda columna del SELECT que no este dentro de una funcion de agregacion debe repetirse en el GROUP BY.",
                    "¿Que columna define tus grupos y cual es solo un resumen de cada grupo?"),

            new Regla(
                    regla("aggregate functions? (?:are|is) not allowed in where|no se permiten funciones de agregación en WHERE"),
                    "grouping",
                    "Pusiste un COUNT, SUM o AVG dentro del WHERE. El WHERE se evalua fila por fila, antes de que existan los grupos, asi que ahi todavia no hay nada que resumir.",
                    "Filtra los valores individuales con WHERE y filtra los resultados de la agregacion con HAVING, que se ejecuta despues del GROUP BY.",
                    "¿Tu condicion se aplica a cada fila o al resultado del grupo?"),

            new Regla(
                    regla("operator does not exist:\\s*([^\\n]{1,60})|el operador no existe:\\s*([^\\n]{1,60})"),
                    "types",
                    "No existe una operacion valida para «%s»: estas comparando o combinando dos tipos de dato incompatibles, por ejemplo un texto con un numero.",
                    "Revisa el tipo real de cada lado de la comparacion. Un valor de texto va entre comillas simples, un numero no, y una fecha se compara con fecha (o con un CAST explicito).",
                    "¿De que tipo es cada lado de esa comparacion?"),

            new Regla(
                    regla("la columna\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "\\s+es de tipo|column\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "\\s+is of type"),
                    "types",
                    "La columna «%s» espera un tipo de dato y le estas entregando otro.",
                    "Comprueba el tipo declarado de la columna y el del valor que envias. Si de verdad hacen falta tipos distintos, la conversion se pide explicita con CAST(valor AS tipo).",
                    "¿Que tipo declara esa columna en el CREATE TABLE?"),

            new Regla(
                    regla("invalid input syntax for (?:type )?([\\w ]+)|la sintaxis de entrada no es válida para (?:el )?tipo\\s+([\\w ]+)"),
                    "types",
                    "Le entregaste a un valor de tipo %s algo que no puede convertirse a ese tipo.",
                    "Revisa el formato del valor: los numeros no llevan comillas ni separador de miles, las fechas van como 'AAAA-MM-DD' y un texto vacio no es lo mismo que NULL.",
                    "¿El valor que escribiste respeta el formato que espera esa columna?"),

            new Regla(
                    regla("duplicate key value violates unique|llave duplicada viola restricción de unicidad|ya existe un registro con ese valor"),
                    "constraint",
                    "Una restriccion UNIQUE o PRIMARY KEY esta haciendo su trabajo: el valor que intentas insertar ya existe en la tabla.",
                    "Consulta primero con un SELECT si el registro ya esta, y decide si corresponde INSERT (nuevo) o UPDATE (existente).",
                    "¿Estas creando un registro nuevo o actualizando uno que ya existia?"),

            new Regla(
                    regla("null value in column\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "[^\\n]*not-null|el valor nulo en la columna\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "|el campo\\s+" + Q + "([^\"'»]+)" + CIERRE_Q + "\\s+no puede quedar"),
                    "constraint",
                    "La columna «%s» esta declarada NOT NULL: la tabla exige un valor y tu INSERT o UPDATE lo dejo vacio.",
                    "Revisa que el orden de tus columnas y el de tus valores coincida uno a uno. Un desfase de una posicion suele dejar una columna obligatoria sin dato.",
                    "¿Cada columna de tu lista tiene su valor en la misma posicion?"),

            new Regla(
                    regla("violates foreign key constraint|viola la llave foránea|no unique constraint matching|no hay restricción unique que coincida"),
                    "constraint",
                    "Una clave foranea protege la coherencia entre dos tablas: estas apuntando a un registro padre que no existe, o borrando un padre que todavia tiene hijos.",
                    "Comprueba con un SELECT que el valor referenciado exista en la tabla padre antes de insertarlo en la hija. Para borrar, elimina primero los hijos.",
                    "¿Que tabla manda y que tabla depende en esa relacion?"),

            new Regla(
                    regla("check constraint|viola la restricción .?check"),
                    "constraint",
                    "Un CHECK rechazo el valor: la tabla tiene una regla de negocio que ese dato no cumple.",
                    "Busca la condicion del CHECK en la definicion de la tabla y compara que valor estas enviando contra lo que esa condicion permite.",
                    "¿Que rango o conjunto de valores acepta esa columna?"),

            new Regla(
                    regla("division by zero|división por cero|dividiendo entre cero"),
                    "logic",
                    "Alguna fila tiene un divisor igual a cero, y en matematicas eso no esta definido.",
                    "Protege la division: NULLIF(divisor, 0) convierte el cero en NULL y evita el error, o excluye esas filas desde el WHERE.",
                    "¿Que deberia mostrar tu consulta cuando el divisor vale cero?"),

            new Regla(
                    regla("permission denied|permiso denegado|no tienes permisos"),
                    "permission",
                    "Tu sandbox tiene permisos limitados a proposito: solo puedes trabajar sobre tu propio esquema.",
                    "Verifica que no estes anteponiendo otro esquema al nombre de la tabla y que la operacion corresponda al ejercicio.",
                    "¿La tabla que nombras vive dentro de tu sandbox?"),

            new Regla(
                    regla("each union query must have the same number of columns|cada consulta UNION debe tener el mismo número de columnas|must have the same number of columns"),
                    "set_ops",
                    "UNION, INTERSECT y EXCEPT apilan resultados verticalmente, asi que ambos lados deben tener la misma cantidad de columnas y en tipos compatibles.",
                    "Cuenta las columnas del SELECT de arriba y las del de abajo. Deben coincidir en numero, en orden y en tipo.",
                    "¿Cuantas columnas devuelve cada lado de tu operacion de conjuntos?"),

            new Regla(
                    regla("more than one row returned by a subquery|subquery (?:has too many|used as an expression)|una subconsulta utilizada como expresión retornó más de un registro"),
                    "subquery",
                    "Usaste una subconsulta en un lugar donde solo cabe un valor, pero devolvio varias filas.",
                    "O acotas la subconsulta para que devuelva una sola fila, o cambias el operador: en vez de = usa IN, que si acepta una lista.",
                    "¿Tu subconsulta debe devolver un unico valor o un conjunto de valores?"),

            new Regla(
                    regla("canceling statement due to (?:statement )?timeout|cancelando consulta por exceder el tiempo de espera|deadlock detected|deadlock detectado"),
                    "performance",
                    "Tu consulta tardo mas de lo permitido o se quedo bloqueada esperando a otra transaccion.",
                    "Suele deberse a un JOIN sin condicion ON (producto cartesiano) o a una transaccion abierta sin COMMIT ni ROLLBACK. Revisa que cada JOIN tenga su ON.",
                    "¿Todos tus JOIN declaran por que columna se relacionan las tablas?"),

            new Regla(
                    regla("cannot insert multiple commands|multiple statements|no se pueden insertar múltiples órdenes"),
                    "syntax",
                    "Enviaste mas de una instruccion en un envio que solo admite una.",
                    "Deja un unico statement y borra los puntos y coma intermedios; ejecuta el resto por separado.",
                    "¿Cual de esas instrucciones es la que responde al enunciado?")
    );

    /** Comparaciones contra NULL: el error no salta, pero el resultado siempre viene vacio. */
    private static final Pattern NULL_MAL_COMPARADO = Pattern.compile("(?i)(?:=|<>|!=)\\s*null");

    private static final Pattern SALUDO = Pattern.compile(
            "(?i)^\\W*(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal|qué tal|holi)\\W*$");
    private static final Pattern AGRADECIMIENTO = Pattern.compile(
            "(?i)^\\W*(gracias|muchas gracias|ok gracias|listo gracias|thanks|ty|perfecto|entendido|ya entendi|ya entendí|vale)\\W*$");
    private static final Pattern DESPEDIDA = Pattern.compile(
            "(?i)^\\W*(adios|adiós|chao|hasta luego|bye|nos vemos)\\W*$");
    private static final Pattern IDENTIDAD = Pattern.compile(
            "(?i)(quien eres|quién eres|como te llamas|cómo te llamas|que eres|qué eres|eres una ia|eres un bot|que puedes hacer|qué puedes hacer|para que sirves|para qué sirves)");

    /**
     * Diagnostica localmente el fallo del alumno. Vacio = no hay certeza, que responda la IA.
     */
    public Optional<Diagnostico> diagnosticar(String errorDb, String queryAlumno) {
        String error = errorDb == null ? "" : errorDb;

        for (Regla regla : REGLAS) {
            Matcher matcher = regla.patron().matcher(error);
            if (matcher.find()) {
                String detalle = primerGrupoNoVacio(matcher);
                return Optional.of(new Diagnostico(
                        regla.errorType(),
                        aplicar(regla.concepto(), detalle),
                        aplicar(regla.pista(), detalle),
                        aplicar(regla.cierre(), detalle)));
            }
        }

        if (queryAlumno != null && NULL_MAL_COMPARADO.matcher(queryAlumno).find()) {
            return Optional.of(new Diagnostico(
                    "nulls",
                    "NULL no es un valor, es la ausencia de valor, y por eso ninguna comparacion con = o <> contra NULL es nunca verdadera: tu filtro descarta todas las filas en silencio.",
                    "Para preguntar por la ausencia de dato se usa IS NULL, y para lo contrario IS NOT NULL. Son los unicos operadores que entienden NULL.",
                    "¿Buscas las filas donde falta el dato o las filas donde si lo hay?"));
        }

        return Optional.empty();
    }

    /**
     * Preguntas de cortesia o de identidad. No aportan aprendizaje y no deberian costar tokens.
     */
    public Optional<String> responderChat(String mensaje) {
        String texto = mensaje == null ? "" : mensaje.trim().toLowerCase(Locale.ROOT);
        if (texto.isEmpty()) {
            return Optional.empty();
        }

        if (SALUDO.matcher(texto).matches()) {
            return Optional.of("""
                    IDEA: Hola, soy Clawbot, tu tutor de SQL dentro de Dagon.
                    PISTA: No te doy la consulta resuelta, te ayudo a llegar a ella. Cuentame en que parte te trabaste: la tabla, las columnas, el filtro, la relacion entre tablas o el resultado.
                    CIERRE: ¿Sobre que ejercicio estas trabajando ahora?""");
        }
        if (AGRADECIMIENTO.matcher(texto).matches()) {
            return Optional.of("""
                    IDEA: A la orden. Cuando algo te encaje, intenta explicarlo con tus palabras: ahi es donde se fija.
                    CIERRE: ¿Seguimos con el siguiente ejercicio o quieres repasar esta clausula?""");
        }
        if (DESPEDIDA.matcher(texto).matches()) {
            return Optional.of("""
                    IDEA: Hasta la proxima. Tu racha sigue viva mientras practiques hoy.
                    CIERRE: ¿Vuelves manana con el siguiente modulo?""");
        }
        if (IDENTIDAD.matcher(texto).find() && texto.length() < 90) {
            return Optional.of("""
                    IDEA: Soy Clawbot, el tutor socratico de Dagon. Acompano tu practica de SQL y PostgreSQL.
                    PISTA: Puedo explicarte un concepto, leer el error que te devolvio la base y darte un miniejemplo con huecos. Lo que no hago es entregarte la solucion del ejercicio evaluado.
                    CIERRE: ¿Que clausula quieres entender mejor: SELECT, FROM, WHERE, JOIN, GROUP BY, DML, DDL o transacciones?""");
        }

        return Optional.empty();
    }

    private String primerGrupoNoVacio(Matcher matcher) {
        for (int i = 1; i <= matcher.groupCount(); i++) {
            String grupo = matcher.group(i);
            if (grupo != null && !grupo.isBlank()) {
                return grupo.trim();
            }
        }
        return null;
    }

    private String aplicar(String plantilla, String detalle) {
        return plantilla.replace("%s", detalle == null || detalle.isBlank() ? COMODIN : detalle);
    }
}
