package com.dagon.backend.repository;

import com.dagon.backend.model.EjercicioPractico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface EjercicioPracticoRepository extends JpaRepository<EjercicioPractico, Integer> {

    List<EjercicioPractico> findByIdModuloOrderByOrdenAsc(Integer idModulo);

    @Query(value = """
        SELECT ep.*
        FROM lms_core.ejercicios_practicos ep
        WHERE ep.id_modulo = :idModulo
          AND (
                COALESCE(ep.visibilidad, 'GLOBAL') = 'GLOBAL'

                OR (
                    COALESCE(ep.visibilidad, 'GLOBAL') = 'GRUPO'
                    AND (
                        ep.creado_por = CAST(COALESCE(:usuarioId, '00000000-0000-0000-0000-000000000000') AS uuid)
                        OR ep.id_grupo IN (
                            SELECT ga.id_grupo
                            FROM lms_core.grupo_alumnos ga
                            WHERE ga.id_alumno = CAST(COALESCE(:usuarioId, '00000000-0000-0000-0000-000000000000') AS uuid)
                              AND ga.activo = true
                        )
                    )
                )

                OR (
                    COALESCE(ep.visibilidad, 'GLOBAL') = 'DOCENTE'
                    AND ep.creado_por = CAST(COALESCE(:usuarioId, '00000000-0000-0000-0000-000000000000') AS uuid)
                )
          )
        ORDER BY ep.orden ASC
        """, nativeQuery = true)
    List<EjercicioPractico> findDisponiblesPorModulo(
            @Param("idModulo") Integer idModulo,
            @Param("usuarioId") String usuarioId
    );
}