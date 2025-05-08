FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod ./
COPY go.sum ./

# Download all dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o ocm-dashboard .

# Use a smaller image for the final stage
FROM alpine:latest

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/ocm-dashboard .

# Copy frontend static files (will be populated during build)
COPY ./static/ ./static/

# Expose port 8080
EXPOSE 8080

# Run the application
CMD ["./ocm-dashboard"]