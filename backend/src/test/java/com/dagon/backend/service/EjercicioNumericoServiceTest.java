package com.dagon.backend.service;

import com.dagon.backend.model.EjercicioPractico;
import com.dagon.backend.repository.EjercicioPracticoRepository;
import com.dagon.backend.service.validation.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class EjercicioNumericoServiceTest {
    private final EjercicioService service = new EjercicioService();
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final EjercicioPracticoRepository repository = mock(EjercicioPracticoRepository.class);
    private final RewardService rewards = mock(RewardService.class);
    private final UsuarioService usuarios = mock(UsuarioService.class);
    private final EjercicioPractico ejercicio = new EjercicioPractico();
    private static final String USUARIO = "11111111-1111-1111-1111-111111111111";

    @BeforeEach void preparar() {
        ReflectionTestUtils.setField(service, "jdbcTemplate", jdbc);
        ReflectionTestUtils.setField(service, "repository", repository);
        ReflectionTestUtils.setField(service, "rewardService", rewards);
        ReflectionTestUtils.setField(service, "usuarioService", usuarios);
        ReflectionTestUtils.setField(service, "validationRouter",
                new EjercicioValidationRouter(List.of(new ValidadorNumerico()), new SqlExerciseGuard()));
        ejercicio.setIdEjercicio(20); ejercicio.setIdModulo(30); ejercicio.setDificultad(2);
        ejercicio.setConfiguracionExtra("{\"tipo_validacion\":\"NUMERICO\",\"respuestas\":{\"z\":36},\"campos\":[{\"clave\":\"z\",\"tipo\":\"numero\"}]}");
        when(jdbc.queryForObject(contains("SELECT id_rol"), eq(Integer.class), anyString(), anyString())).thenReturn(1);
        when(jdbc.queryForMap(contains("xp_requerida"), eq(30))).thenReturn(Map.of("xp_requerida", 0, "materia_slug", "io"));
        when(jdbc.queryForObject(contains("v_xp_por_materia"), eq(Number.class), anyString(), anyString(), eq("io"))).thenReturn(0);
        when(repository.findById(20)).thenReturn(Optional.of(ejercicio));
    }

    @Test void aciertoRepetidoRegistraUnIntentoPeroNoDaXpNueva() {
        when(jdbc.queryForObject(contains("COUNT(*) FROM lms_core.intentos"), eq(Integer.class), eq(USUARIO), eq(20))).thenReturn(1);
        var respuesta = service.validarConsulta(20, "{\"z\":36}", USUARIO);
        assertThat(respuesta).containsEntry("success", true).containsEntry("xp_gained", 0);
        verify(rewards).registrarIntento(eq(USUARIO), eq(20), eq("{\"z\":36}"), eq(true), any(), isNull());
        verify(jdbc).queryForList(contains("pg_advisory_xact_lock"), eq(USUARIO + ":20"));
    }

    @Test void respuestaIncorrectaNoFiltraLasSoluciones() {
        var respuesta = service.validarConsulta(20, "{\"z\":99}", USUARIO);
        assertThat(respuesta).containsEntry("success", false).containsEntry("xp_gained", 0);
        assertThat(respuesta).doesNotContainKeys("respuestas", "queryMaestra", "expectedQuery");
        assertThat(respuesta.get("campos")).isEqualTo(Map.of("z", false));
    }

    @Test void sinCuerpoEsFalloRegistradoSinExcepcion() {
        assertThat(service.validarConsulta(20, null, USUARIO)).containsEntry("success", false);
        verify(rewards).registrarIntento(eq(USUARIO), eq(20), eq(""), eq(false), any(), isNull());
    }

    @Test void noConfirmaXpSiNoSePuedePersistirElIntento() {
        doThrow(new IllegalStateException("No se pudo guardar")).when(rewards)
                .registrarIntento(eq(USUARIO), eq(20), anyString(), eq(true), any(), isNull());
        assertThatThrownBy(() -> service.validarConsulta(20, "{\"z\":36}", USUARIO)).isInstanceOf(IllegalStateException.class);
    }

    @Test void moduloBloqueadoNoPermiteEnviarIntentosNiLeerEjercicios() {
        when(jdbc.queryForMap(contains("xp_requerida"), eq(30))).thenReturn(Map.of("xp_requerida", 100, "materia_slug", "io"));
        assertThat(service.validarConsulta(20, "{\"z\":36}", USUARIO)).containsEntry("success", false);
        verifyNoInteractions(rewards, usuarios);
        assertThatThrownBy(() -> service.obtenerEjerciciosPorModulo(30, USUARIO))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class);
    }

    @Test void dtoYPanelPedagogicoNoIncluyenRespuestas() {
        when(repository.findDisponiblesPorModulo(30, USUARIO)).thenReturn(List.of(ejercicio));
        var dto = service.obtenerEjerciciosPorModulo(30, USUARIO).get(0);
        assertThat(dto.getType()).isEqualTo("numerico");
        assertThat(dto.getExpectedQuery()).isNull();
        assertThat(dto.getPedagogia()).doesNotContainKey("respuestas");
        assertThat(dto.getCampos()).hasSize(1);
    }
}
