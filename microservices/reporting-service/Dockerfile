FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
COPY discovery-service/pom.xml ./discovery-service/
COPY gateway-service/pom.xml ./gateway-service/
COPY customer-service/pom.xml ./customer-service/
COPY account-service/pom.xml ./account-service/
COPY transaction-service/pom.xml ./transaction-service/
COPY reporting-service/pom.xml ./reporting-service/

RUN mvn -pl reporting-service -am dependency:resolve -B 2>/dev/null || true

COPY reporting-service/src ./reporting-service/src
RUN mvn -pl reporting-service -am package -DskipTests -B -q

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S spring && adduser -S spring -G spring
RUN mkdir -p /app/data && chown spring:spring /app/data
USER spring
COPY --from=build /app/reporting-service/target/reporting-service-*.jar /app/app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-jar", "/app/app.jar"]
