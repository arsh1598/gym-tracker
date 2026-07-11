# Use official OpenJDK base image
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy the specific JAR file into the container
COPY backend/target/gym-tracker-backend-1.0.0-SNAPSHOT.jar app.jar

# Expose the port your app runs on
EXPOSE 5000

# Command to run the application
ENTRYPOINT ["java", "-jar", "app.jar"]