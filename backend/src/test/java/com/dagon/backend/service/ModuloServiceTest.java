package com.dagon.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ModuloServiceTest {

    private JdbcTemplate jdbc;
    private ModuloService service;

    @BeforeEach
    void setUp() {
        jdbc = mock(JdbcTemplate.class);
        service = new ModuloService();
        ReflectionTestUtils.setField(service, "jdbcTemplate", jdbc);
    }

    private void stubRol(Integer rol) {
        when(jdbc.queryForObject(contains("id_rol"), eq(Integer.class), any(), any())).thenReturn(rol);
    }

    private void stubXp(String materia, Number xp) {
        when(jdbc.queryForObject(contains("v_xp_por_materia"), eq(Number.class), any(), any(), eq(materia))).thenReturn(xp);
    }

    private void stubCatalogo(String materia) {
        when(jdbc.queryForList(startsWith("SELECT id_curso, titulo, materia_slug"), eq(materia)))
                .thenReturn(List.of(Map.of("id_curso", 7, "titulo", "Curso " + materia, "materia_slug", materia)));
        when(jdbc.queryForList(startsWith("SELECT id_modulo, id_curso")))
                .thenReturn(List.of(
                        Map.of("id_modulo", 1, "id_curso", 7, "titulo", "M1", "orden", 1, "xp_requerida", 0),
                        Map.of("id_modulo", 2, "id_curso", 7, "titulo", "M2", "orden", 2, "xp_requerida", 20),
                        Map.of("id_modulo", 3, "id_curso", 7, "titulo", "M3", "orden", 3, "xp_requerida", 50),
                        Map.of("id_modulo", 4, "id_curso", 99, "titulo", "Otro curso", "orden", 1, "xp_requerida", 0)));
    }

    @Test
    void modulosSeFiltranPorMateriaYSeBloqueanConLaXpDeEsaMateria() {
        stubRol(1);
        stubCatalogo("io");
        stubXp("io", 25);

        List<Map<String, Object>> cursos = service.obtenerModulosConEstado("u1", "io");

        assertThat(cursos).hasSize(1);
        assertThat(cursos.get(0)).containsEntry("id_curso", 7).containsEntry("materia_slug", "io");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> modulos = (List<Map<String, Object>>) cursos.get(0).get("modulos");
        assertThat(modulos).extracting(m -> m.get("id_modulo")).containsExactly(1, 2, 3);
        assertThat(modulos).extracting(m -> m.get("bloqueado")).containsExactly(false, false, true);
        verify(jdbc).queryForList(startsWith("SELECT id_curso, titulo, materia_slug"), eq("io"));
    }

    @Test
    void sinMateriaSeUsaSql() {
        stubRol(1);
        stubCatalogo("sql");
        stubXp("sql", 0);

        List<Map<String, Object>> cursos = service.obtenerModulosConEstado("u1", null);

        assertThat(cursos).hasSize(1);
        assertThat(cursos.get(0)).containsEntry("materia_slug", "sql");
        verify(jdbc).queryForList(startsWith("SELECT id_curso, titulo, materia_slug"), eq("sql"));
    }

    @Test
    void docentesYAdminTienenTodoDesbloqueado() {
        stubRol(2);
        stubCatalogo("io");
        stubXp("io", 0);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> modulos = (List<Map<String, Object>>)
                service.obtenerModulosConEstado("docente", "io").get(0).get("modulos");

        assertThat(modulos).extracting(m -> m.get("bloqueado")).containsOnly(false);
        assertThat(modulos).extracting(m -> m.get("desbloqueado_por_rol")).containsOnly(true);
    }

    @Test
    void sinFilaDeXpEnLaMateriaElAlumnoEmpiezaEnCero() {
        stubRol(1);
        stubCatalogo("io");
        // sin stub de XP: el mock devuelve null

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> modulos = (List<Map<String, Object>>)
                service.obtenerModulosConEstado("u1", "io").get(0).get("modulos");

        assertThat(modulos).extracting(m -> m.get("bloqueado")).containsExactly(false, true, true);
    }

    @Test
    void resetUsaFuncionRestringidaConUuidParametrizado() {
        String id = "11111111-1111-1111-1111-111111111111";
        service.reiniciarDatosUsuario(id);
        verify(jdbc).queryForList("SELECT lms_core.fn_provisionar_sandbox(?::uuid, true)", id);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.reiniciarDatosUsuario("x; DROP SCHEMA lms_core"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void moduloSoloSeCompletaCuandoSeResuelvenTodasLasMisionesOficiales() {
        when(jdbc.queryForList(anyString(), anyString(), anyString())).thenReturn(List.of(Map.of("id_modulo", 30)));
        assertThat(service.obtenerModulosCompletados("u1")).containsExactly(30);
        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbc).queryForList(sql.capture(), eq("u1"), eq("u1"));
        assertThat(sql.getValue()).contains("COUNT(DISTINCT e.id_ejercicio) = COUNT(DISTINCT i.id_ejercicio)")
                .contains("COALESCE(e.visibilidad, 'GLOBAL') = 'GLOBAL'").contains("<> 'RAPIDA'");
    }

    @Test
    void cursosCompletadosSoloContabilizanMisionesGlobalesNoRapidas() {
        when(jdbc.queryForList(anyString(), anyString(), anyString())).thenReturn(List.of());

        service.obtenerCursosCompletados("u1");

        ArgumentCaptor<String> sql = ArgumentCaptor.forClass(String.class);
        verify(jdbc).queryForList(sql.capture(), anyString(), anyString());
        // el filtro debe estar tanto en lo que el alumno resolvio como en el total que se le exige
        assertThat(sql.getValue().split("COALESCE\\(e\\.visibilidad, 'GLOBAL'\\) = 'GLOBAL'", -1)).hasSize(3);
        assertThat(sql.getValue().split("<> 'RAPIDA'", -1)).hasSize(3);
    }

    @Test
    void certificadoIgnoraMisionesPrivadasYRapidasEnTotalYCompletadas() {
        when(jdbc.queryForMap(contains("FROM lms_core.usuarios"), any(), any()))
                .thenReturn(Map.of("nombre", "Ana", "email", "ana@x.com"));
        when(jdbc.queryForMap(contains("FROM lms_core.cursos"), eq(7))).thenReturn(Map.of("titulo", "IO I"));
        when(jdbc.queryForObject(contains("COUNT(*) FROM lms_core.ejercicios_practicos"), eq(Integer.class), eq(7))).thenReturn(5);
        when(jdbc.queryForObject(contains("COUNT(DISTINCT i.id_ejercicio)"), eq(Integer.class), any(), any(), eq(7))).thenReturn(5);

        Map<String, Object> certificado = service.generarCertificado("u1", 7);

        assertThat(certificado).containsEntry("curso", "IO I").containsEntry("ejerciciosCompletados", 5);
        ArgumentCaptor<String> total = ArgumentCaptor.forClass(String.class);
        verify(jdbc).queryForObject(total.capture(), eq(Integer.class), eq(7));
        assertThat(total.getValue()).contains("COALESCE(e.visibilidad, 'GLOBAL') = 'GLOBAL'").contains("<> 'RAPIDA'");
        ArgumentCaptor<String> hechos = ArgumentCaptor.forClass(String.class);
        verify(jdbc).queryForObject(hechos.capture(), eq(Integer.class), any(), any(), eq(7));
        assertThat(hechos.getValue()).contains("COALESCE(e.visibilidad, 'GLOBAL') = 'GLOBAL'").contains("<> 'RAPIDA'");
    }

    @Test
    void certificadoSeNiegaSiFaltanMisionesOSiElCursoNoTieneNinguna() {
        when(jdbc.queryForMap(contains("FROM lms_core.usuarios"), any(), any()))
                .thenReturn(Map.of("nombre", "Ana", "email", "ana@x.com"));
        when(jdbc.queryForMap(contains("FROM lms_core.cursos"), eq(7))).thenReturn(Map.of("titulo", "IO I"));
        when(jdbc.queryForObject(contains("COUNT(*) FROM lms_core.ejercicios_practicos"), eq(Integer.class), eq(7))).thenReturn(5);
        when(jdbc.queryForObject(contains("COUNT(DISTINCT i.id_ejercicio)"), eq(Integer.class), any(), any(), eq(7))).thenReturn(4);

        assertThat(service.generarCertificado("u1", 7)).isNull();

        // curso sin misiones oficiales: 0 de 0 no cuenta como curso completado
        when(jdbc.queryForObject(contains("COUNT(*) FROM lms_core.ejercicios_practicos"), eq(Integer.class), eq(7))).thenReturn(0);
        when(jdbc.queryForObject(contains("COUNT(DISTINCT i.id_ejercicio)"), eq(Integer.class), any(), any(), eq(7))).thenReturn(0);
        assertThat(service.generarCertificado("u1", 7)).isNull();
    }

    @Test
    void materiasDevuelveCatalogoConXpYProgresoPorMateria() {
        when(jdbc.queryForList(contains("FROM lms_core.materias"))).thenReturn(List.of(
                Map.of("slug", "sql", "nombre", "Bases de Datos SQL", "descripcion", "d1", "orden", 1),
                Map.of("slug", "io", "nombre", "Investigación de Operaciones", "descripcion", "d2", "orden", 2)));
        when(jdbc.queryForList(contains("v_xp_por_materia"), anyString(), anyString()))
                .thenReturn(List.of(Map.of("materia_slug", "io", "xp", 70L)));
        when(jdbc.queryForList(contains("modulos_completados"), anyString(), anyString())).thenReturn(List.of(
                Map.of("materia_slug", "sql", "modulos_total", 10L, "modulos_completados", 4L),
                Map.of("materia_slug", "io", "modulos_total", 15L, "modulos_completados", 2L)));

        List<Map<String, Object>> materias = service.obtenerMateriasConProgreso("u1");

        assertThat(materias).hasSize(2);
        assertThat(materias.get(0)).containsExactly(
                Map.entry("slug", "sql"), Map.entry("nombre", "Bases de Datos SQL"), Map.entry("descripcion", "d1"),
                Map.entry("orden", 1), Map.entry("xp", 0), Map.entry("modulosTotal", 10), Map.entry("modulosCompletados", 4));
        assertThat(materias.get(1)).containsEntry("slug", "io").containsEntry("xp", 70)
                .containsEntry("modulosTotal", 15).containsEntry("modulosCompletados", 2);
    }

    @Test
    void materiaSinCursosAparecePeroConProgresoEnCero() {
        when(jdbc.queryForList(contains("FROM lms_core.materias"))).thenReturn(List.of(
                Map.of("slug", "io", "nombre", "IO", "descripcion", "d", "orden", 2)));
        when(jdbc.queryForList(anyString(), anyString(), anyString())).thenReturn(List.of());

        assertThat(service.obtenerMateriasConProgreso("u1").get(0))
                .containsEntry("xp", 0).containsEntry("modulosTotal", 0).containsEntry("modulosCompletados", 0);
    }
}
