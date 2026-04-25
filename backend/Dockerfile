FROM eclipse-temurin:25-jdk-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY db ./db
RUN apk add --no-cache maven
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -Ddocker.skip=true -B

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl postgresql-client dumb-init

RUN curl -fsSL -o /usr/local/bin/dbmate https://github.com/amacneil/dbmate/releases/latest/download/dbmate-linux-amd64 \
    && chmod +x /usr/local/bin/dbmate

COPY --from=builder /app/target/ethos-backend-1.0-SNAPSHOT.jar app.jar
COPY db ./db
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/docker-entrypoint.sh"]