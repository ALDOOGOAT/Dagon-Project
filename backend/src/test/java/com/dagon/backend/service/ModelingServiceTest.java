package com.dagon.backend.service;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ModelingServiceTest {

    private final ModelingService service = new ModelingService();

    @Test
    void convierteDdlConForeignKeyEnErd() {
        Map<String, Object> erd = service.construirErdDesdeDdl("""
                CREATE TABLE clientes (
                    id_cliente INTEGER PRIMARY KEY,
                    nombre TEXT NOT NULL
                );

                CREATE TABLE pedidos (
                    id_pedido INTEGER PRIMARY KEY,
                    id_cliente INTEGER REFERENCES clientes(id_cliente),
                    total NUMERIC(10,2)
                );
                """);

        List<Map<String, Object>> nodes = castList(erd.get("nodes"));
        List<Map<String, Object>> edges = castList(erd.get("edges"));

        assertThat(nodes).hasSize(2);
        assertThat(edges).hasSize(1);
        assertThat(String.valueOf(erd.get("ddl")))
                .contains("CREATE TABLE clientes")
                .contains("CREATE TABLE pedidos")
                .contains("FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)");
    }

    @Test
    void generaDdlDesdeDiagrama() {
        List<Map<String, Object>> nodes = List.of(
                table("clientes", "id_cliente", "pk"),
                table("pedidos", "id_cliente", "fk")
        );
        List<Map<String, Object>> edges = List.of(Map.of(
                "source", "table-pedidos",
                "target", "table-clientes"
        ));

        String ddl = service.generarDdlDesdeDiagrama(nodes, edges);

        assertThat(ddl)
                .contains("CREATE TABLE clientes")
                .contains("CREATE TABLE pedidos")
                .contains("ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_clientes FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente);");
    }

    private Map<String, Object> table(String name, String column, String role) {
        return Map.of(
                "id", "table-" + name,
                "data", Map.of(
                        "label", name,
                        "columns", List.of(Map.of("name", column, "role", role, "type", "INTEGER"))
                )
        );
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> castList(Object value) {
        return (List<Map<String, Object>>) value;
    }
}
