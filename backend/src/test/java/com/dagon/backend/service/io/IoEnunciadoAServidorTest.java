package com.dagon.backend.service.io;

import com.dagon.backend.service.io.solver.IoSolverService;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.TestFactory;
import java.util.stream.Stream;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

/** Sin IA: cada enunciado que el intérprete del servidor entiende debe salir resuelto y con óptimo por el pipeline completo. */
class IoEnunciadoAServidorTest {
    private final IoInterpretacionService servicio = new IoInterpretacionService(new IoParserLocal(), mock(IoProveedorClient.class), new IoModeloValidator());

    @TestFactory
    Stream<DynamicTest> enunciadoTextoAsolucionDelServidor() {
        return IoParserCorpusTest.todos().filter(c -> c.estado().equals("listo")).map(c -> DynamicTest.dynamicTest(c.nombre(), () -> {
            var r = servicio.resolver(c.texto());
            assertThat(r.interpretacion().fuente()).isEqualTo("local");
            assertThat(r.solucion()).as(c.nombre() + ": " + r.errorSolucion()).isNotNull();
            assertThat(IoSolverService.sospechoso(r.solucion())).as(c.nombre() + " sin óptimo: " + r.solucion().estado()).isFalse();
            assertThat(r.solucion().tipo()).isEqualTo(c.tipo());
        }));
    }
}
