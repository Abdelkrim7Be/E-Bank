FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy parent pom and all module poms for dependency resolution
COPY pom.xml .
COPY discovery-service/pom.xml ./discovery-service/
COPY gateway-service/pom.xml ./gateway-service/
COPY customer-service/pom.xml ./customer-service/
COPY account-service/pom.xml ./account-service/
COPY transaction-service/pom.xml ./transaction-service/
COPY reporting-service/pom.xml ./reporting-service/

# Download dependencies (cached layer)
RUN mvn -pl discovery-service -am dependency:resolve -B 2>/dev/null || true

# Copy source and build
COPY discovery-service/src ./discovery-service/src
RUN mvn -pl discovery-service -am package -DskipTests -B -q

# Runtime
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S spring && adduser -S spring -G spring
USER spring
COPY --from=build /app/discovery-service/target/discovery-service-*.jar /app/app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-jar", "/app/app.jar"]
