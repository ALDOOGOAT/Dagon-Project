# Backend Dagon (Spring Boot 4, Java 21). Railway: Root Directory = backend.
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src src
RUN ./mvnw -q -B -DskipTests package && cp target/*.jar app.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 1001 dagon && mkdir -p /data/uploads && chown -R dagon /data /app
COPY --from=build /app/app.jar app.jar
USER dagon
ENV DAGON_UPLOADS_DIR=/data/uploads \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
