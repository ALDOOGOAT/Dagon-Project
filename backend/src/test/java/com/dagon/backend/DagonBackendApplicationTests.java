package com.dagon.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:postgresql://127.0.0.1:1/dagon_test",
		"spring.datasource.username=test",
		"spring.datasource.password=test",
		"dagon.sandbox.url=jdbc:postgresql://127.0.0.1:1/dagon_test",
		"dagon.sandbox.username=app_sandbox_user",
		"dagon.sandbox.password=test",
		"spring.datasource.hikari.initialization-fail-timeout=-1",
		"dagon.sandbox.pool.initialization-fail-timeout-ms=-1",
		"spring.sql.init.mode=never",
		"spring.jpa.properties.hibernate.boot.allow_jdbc_metadata_access=false",
		"spring.jpa.properties.hibernate.temp.use_jdbc_metadata_defaults=false"
})
class DagonBackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
