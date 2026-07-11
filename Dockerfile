# =============================================================================
# Multi-stage Dockerfile for Gym Tracker
# Build context: repo ROOT — both frontend/ and backend/ needed
#
# On Render:
#   - Dockerfile Path: Dockerfile
#   - Build context:   . (repo root, the default)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: BUILD
# Maven builds everything:
#   1. frontend-maven-plugin downloads Node v20
#   2. Runs npm install + npm run build → outputs to backend/src/main/resources/static
#   3. Maven compiles Java and packages a fat JAR
# -----------------------------------------------------------------------------
FROM maven:3.9.6-eclipse-temurin-17 AS build

WORKDIR /app

# Copy frontend source (needed by frontend-maven-plugin via ../frontend)
COPY frontend/ ./frontend/

# Copy backend — pom.xml first so Maven dependency layer is cached separately
COPY backend/pom.xml ./backend/pom.xml

# Download all Maven dependencies (cached unless pom.xml changes)
WORKDIR /app/backend
RUN mvn dependency:go-offline -q

# Now copy the rest of the backend source
COPY backend/src/ ./backend/src/

# Build: downloads Node, builds React, compiles Java, packages fat JAR
RUN mvn clean package -DskipTests

# -----------------------------------------------------------------------------
# Stage 2: RUNTIME
# Minimal JRE image — no Maven, no Node, no source code
# The fat JAR contains the React bundle inside BOOT-INF/classes/static/
# -----------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copy only the fat JAR from the build stage
COPY --from=build /app/backend/target/gym-tracker-backend-*.jar app.jar

# Render injects PORT env var; application.yml reads it via ${PORT:8080}
EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "app.jar"]
