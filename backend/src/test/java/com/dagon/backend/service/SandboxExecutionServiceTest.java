package com.dagon.backend.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SandboxExecutionServiceTest {

    private final SandboxExecutionService service = new SandboxExecutionService();

    @Test
    void extraeNombreDeTablaEnCreateTable() {
        String sql = "CREATE TABLE clientes (id INTEGER PRIMARY KEY);";
        assertThat(service.extraerNombreTablaDDL(sql.toUpperCase(), sql)).isEqualTo("clientes");
    }

    @Test
    void extraeNombreDeTablaEnAlterTable() {
        String sql = "ALTER TABLE clientes ADD COLUMN nombre TEXT;";
        assertThat(service.extraerNombreTablaDDL(sql.toUpperCase(), sql)).isEqualTo("clientes");
    }

    @Test
    void extraeNombreDeTablaEnDropTable() {
        String sql = "DROP TABLE clientes;";
        assertThat(service.extraerNombreTablaDDL(sql.toUpperCase(), sql)).isEqualTo("clientes");
    }

    @Test
    void ignoraElIfExistsOpcional() {
        // El nombre se reinyecta en SELECT * FROM "<tabla>": si se colara "IF" o el ';'
        // esa consulta falla en silencio y el alumno se queda sin panel de datos.
        String drop = "DROP TABLE IF EXISTS clientes;";
        assertThat(service.extraerNombreTablaDDL(drop.toUpperCase(), drop)).isEqualTo("clientes");

        String create = "CREATE TABLE IF NOT EXISTS clientes (id INTEGER);";
        assertThat(service.extraerNombreTablaDDL(create.toUpperCase(), create)).isEqualTo("clientes");
    }

    @Test
    void devuelveNuloSiNoEsUnaSentenciaDeTabla() {
        String sql = "SELECT * FROM clientes;";
        assertThat(service.extraerNombreTablaDDL(sql.toUpperCase(), sql)).isNull();
    }
}
