package com.dagon.backend.controller;

import com.dagon.backend.model.EjercicioPractico;
import com.dagon.backend.repository.EjercicioPracticoRepository;
import com.dagon.backend.service.ClawbotService;
import com.dagon.backend.service.EjercicioService;
import com.dagon.backend.service.validation.EjercicioValidationRouter;
import com.dagon.backend.service.validation.TipoValidacionEjercicio;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import java.util.Optional;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class ClawbotControllerTest {
    private final ClawbotController controller = new ClawbotController();
    private final EjercicioPracticoRepository repository = mock(EjercicioPracticoRepository.class);
    private final EjercicioValidationRouter router = mock(EjercicioValidationRouter.class);
    private final EjercicioService ejercicios = mock(EjercicioService.class);
    private final ClawbotService tutor = mock(ClawbotService.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken("alumno", "token");
    private EjercicioPractico ejercicio;

    @BeforeEach void preparar() {
        ReflectionTestUtils.setField(controller, "ejercicioRepository", repository);
        ReflectionTestUtils.setField(controller, "validationRouter", router);
        ReflectionTestUtils.setField(controller, "ejercicioService", ejercicios);
        ReflectionTestUtils.setField(controller, "clawbotService", tutor);
        ReflectionTestUtils.setField(controller, "jdbcTemplate", jdbc);
        ejercicio = new EjercicioPractico();
        ejercicio.setIdEjercicio(20); ejercicio.setIdModulo(30);
        ejercicio.setTitulo("Método gráfico"); ejercicio.setEnunciado("Modelo real");
        ejercicio.setQueryMaestra("solución privada");
        when(repository.findById(20)).thenReturn(Optional.of(ejercicio));
    }

    @Test void rechazaEjercicioAjenoAntesDeConsultarAlTutor() {
        when(ejercicios.usuarioPuedeAccederEjercicio(ejercicio, "alumno")).thenReturn(false);
        assertThatThrownBy(() -> controller.analizarError(Map.of("ejercicioId", 20), auth))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(error -> assertThat(((ResponseStatusException) error).getStatusCode().value()).isEqualTo(403));
        verifyNoInteractions(tutor, jdbc);
    }

    @Test void materiaYEnunciadoProvienenDelServidorYSolucionNumericaSeOmite() {
        when(ejercicios.usuarioPuedeAccederEjercicio(ejercicio, "alumno")).thenReturn(true);
        when(router.resolverTipo(ejercicio, null)).thenReturn(TipoValidacionEjercicio.NUMERICO);
        when(jdbc.queryForObject(anyString(), eq(String.class), eq(30))).thenReturn("io");
        controller.analizarError(Map.of("ejercicioId", 20, "materia", "sql", "descripcion", "falso",
                "queryMaestra", "filtrada", "nivelId", 1, "queryAlumno", "{\"z\":4}", "errorDb", "Revisar"), auth);
        verify(tutor).obtenerAyudaSocratica("alumno", "Modelo real", null, "{\"z\":4}", "Revisar",
                0, 30, "Método gráfico", "io");
    }
}
