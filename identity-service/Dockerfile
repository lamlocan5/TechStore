# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.war app.war

# Expose port
EXPOSE 8080

# Set environment variables with defaults
ENV SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/doan?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
ENV SPRING_DATASOURCE_USERNAME=root
ENV SPRING_DATASOURCE_PASSWORD=root
ENV JWT_SIGNER_KEY=kW3zT7pX9mN2vB5hJ8qR4yL6dF1gK0sA9cE3tH7uI2oP5wQ8xZ6nM1bV4fG7jR0k

# Run the application
ENTRYPOINT ["java", "-jar", "app.war"]

