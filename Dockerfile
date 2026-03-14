FROM rust:1.80-slim-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev build-essential

# We will build the entire workspace to ensure dependencies are resolved correctly
WORKDIR /usr/src/app
COPY . .

# Build the API
WORKDIR /usr/src/app/services/api
RUN cargo build --release

# Final minimal runtime image
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates libssl-dev curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the actual api binary from the builder
COPY --from=builder /usr/src/app/target/release/chainmerge-api /app/chainmerge-api

# Create directory for SQLite DB
RUN mkdir -p /app/data

# Persist the data directory
VOLUME /app/data

# Default env vars
ENV HOST=0.0.0.0
ENV PORT=8080
ENV INDEX_DB_PATH=/app/data/chainindex.db

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["./chainmerge-api"]
