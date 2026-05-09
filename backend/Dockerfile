# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Maven wrapper and POM first to leverage Docker layer caching
COPY mvnw ./
COPY .mvn .mvn
COPY pom.xml ./

# Download dependencies (cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline -B

# Copy source and build the fat JAR, skipping tests for faster builds
COPY src ./src
RUN ./mvnw package -DskipTests -B

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy only the built JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose the default Spring Boot port
EXPOSE 8080

# JVM flags tuned for the Railway Hobby plan (1 GB RAM limit):
#   -Xms256m              – start with 256 MB heap so the JVM doesn't over-reserve
#   -Xmx512m              – cap heap at 512 MB, leaving ~512 MB for OS + metaspace
#   -XX:+UseG1GC          – G1 garbage collector (low-pause, efficient on small heaps)
#   -XX:MaxGCPauseMillis=200 – target max GC pause of 200 ms
#   -XX:+UseContainerSupport – respect cgroup memory limits (on by default in JDK 11+, explicit here for clarity)
#   -XX:+ExitOnOutOfMemoryError – crash fast instead of limping along after OOM
ENTRYPOINT ["java", \
  "-Xms256m", \
  "-Xmx512m", \
  "-XX:+UseG1GC", \
  "-XX:MaxGCPauseMillis=200", \
  "-XX:+UseContainerSupport", \
  "-XX:+ExitOnOutOfMemoryError", \
  "-jar", "app.jar"]
