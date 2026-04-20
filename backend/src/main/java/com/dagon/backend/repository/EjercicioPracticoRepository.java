package com.dagon.backend.repository;

import com.dagon.backend.model.EjercicioPractico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EjercicioPracticoRepository extends JpaRepository<EjercicioPractico, Integer> {
    // ¡NUEVA LÍNEA! Spring Boot creará el query SQL automáticamente solo con leer el nombre.
    List<EjercicioPractico> findByIdModuloOrderByOrdenAsc(Integer idModulo);
}