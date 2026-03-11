package com.dagon.backend.repository;

import com.dagon.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    // Spring Boot es tan inteligente que solo con leer el nombre de este metodo
    // crea automáticamente el SQL: "SELECT * FROM usuarios WHERE email = ?"
    Optional<Usuario> findByEmail(String email);

}