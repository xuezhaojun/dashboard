.PHONY: dev-frontend dev-backend dev-backend-real build-frontend build-backend build docker

# Development targets
dev-frontend:
	cd . && npm run dev

dev-backend:
	cd backend && chmod +x run-dev.sh && ./run-dev.sh

dev-backend-real:
	cd backend && go run main.go

# Build targets
build-frontend:
	cd . && npm run build

build-backend:
	cd backend && go build -o ocm-dashboard

build: build-frontend build-backend

# Docker build
docker:
	# Create static directory in backend
	mkdir -p backend/static
	# Copy frontend build to backend static directory
	cp -r dist/* backend/static/
	# Build docker image
	docker build -t ocm-dashboard:latest -f backend/Dockerfile backend/

# Clean up
clean:
	rm -rf dist
	rm -rf backend/static
	rm -f backend/ocm-dashboard

# Add target to use debug script
debug-backend:
	cd backend && chmod +x debug.sh && ./debug.sh

# Default target
all: build