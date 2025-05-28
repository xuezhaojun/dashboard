# Multi-stage build for OCM Dashboard
# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend
RUN pnpm run build

# Stage 2: Build backend
FROM golang:1.24-alpine AS backend-builder

# Install git and ca-certificates (needed for go modules and HTTPS)
RUN apk add --no-cache git ca-certificates

# Set working directory
WORKDIR /app

# Copy go mod files
COPY backend/go.mod backend/go.sum ./

# Download dependencies
RUN go mod download

# Copy backend source
COPY backend/ ./

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -a -installsuffix cgo \
    -o ocm-dashboard-server \
    main.go

# Stage 3: Final runtime image
FROM gcr.io/distroless/static:nonroot

# Copy ca-certificates from builder
COPY --from=backend-builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy backend binary
COPY --from=backend-builder /app/ocm-dashboard-server /app/ocm-dashboard-server

# Copy built frontend assets
COPY --from=frontend-builder /app/dist /app/static

# Set working directory
WORKDIR /app

# Use non-root user
USER nonroot:nonroot

# Expose port
EXPOSE 8080

# Set environment variables
ENV GIN_MODE=release

# Run the application
ENTRYPOINT ["/app/ocm-dashboard-server"]