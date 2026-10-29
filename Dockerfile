# Stage 1: Build backend with Maven
FROM maven:3.9.6-eclipse-temurin-11 AS build
WORKDIR /app
COPY backend/pom.xml .
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Production JRE runtime
FROM eclipse-temurin:11-jre-jammy
WORKDIR /app
COPY --from=build /app/target/real-estate-crm-backend-1.0.0.jar app.jar
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
