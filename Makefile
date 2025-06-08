# Default values
IMAGE_NAME ?= ocm-dashboard
IMAGE_TAG ?= latest
REGISTRY ?= quay.io/open-cluster-management
PLATFORMS ?= linux/amd64,linux/arm64

# Full image name
FULL_IMAGE_NAME = $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)

.PHONY: dev-frontend dev-backend dev-backend-real build-frontend build-backend build docker-build docker-push docker-build-push clean

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

# Docker build targets
docker-build:
	@echo "Building Docker image: $(FULL_IMAGE_NAME)"
	docker buildx build \
		--platform $(PLATFORMS) \
		-t $(FULL_IMAGE_NAME) \
		--load \
		.

docker-push:
	@echo "Pushing Docker image: $(FULL_IMAGE_NAME)"
	docker push $(FULL_IMAGE_NAME)

docker-build-push:
	@echo "Building and pushing multi-arch Docker image: $(FULL_IMAGE_NAME)"
	docker buildx build \
		--platform $(PLATFORMS) \
		-t $(FULL_IMAGE_NAME) \
		--push \
		.

# Build for local development (single arch)
docker-build-local:
	@echo "Building local Docker image: $(IMAGE_NAME):$(IMAGE_TAG)"
	docker buildx build \
		-t $(IMAGE_NAME):$(IMAGE_TAG) \
		--load \
		.

# Legacy docker target for backward compatibility
docker: docker-build-local

# Clean up
clean:
	rm -rf dist
	rm -rf backend/static
	rm -f backend/ocm-dashboard

# Add target to use debug script
debug-backend:
	cd backend && chmod +x debug.sh && ./debug.sh

# Setup buildx builder for multi-arch builds
setup-buildx:
	docker buildx create --name ocm-builder --use || docker buildx use ocm-builder
	docker buildx inspect --bootstrap

# Default target
all: build

# Help target
help:
	@echo "OCM Dashboard Makefile"
	@echo ""
	@echo "Usage: make [target] [VARIABLE=value]"
	@echo ""
	@echo "Variables:"
	@echo "  IMAGE_NAME    Docker image name (default: ocm-dashboard)"
	@echo "  IMAGE_TAG     Docker image tag (default: latest)"
	@echo "  REGISTRY      Docker registry (default: quay.io/open-cluster-management)"
	@echo "  PLATFORMS     Target platforms (default: linux/amd64,linux/arm64)"
	@echo ""
	@echo "Targets:"
	@echo "  dev-frontend        Run frontend in development mode"
	@echo "  dev-backend         Run backend with mock data"
	@echo "  dev-backend-real    Run backend with real Kubernetes connection"
	@echo "  build               Build both frontend and backend"
	@echo "  docker-build        Build multi-arch Docker image (local)"
	@echo "  docker-push         Push Docker image to registry"
	@echo "  docker-build-push   Build and push multi-arch Docker image"
	@echo "  docker-build-local  Build single-arch Docker image for local use"
	@echo "  setup-buildx        Setup Docker buildx for multi-arch builds"
	@echo "  clean               Clean build artifacts"
	@echo "  help                Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make docker-build-local"
	@echo "  make docker-build-push IMAGE_TAG=v1.0.0"
	@echo "  make docker-build-push REGISTRY=myregistry.io/myorg IMAGE_TAG=dev"


test-frontend:
	npm run test

test-backend:
	cd backend && go test ./...

test: test-frontend test-backend
	@echo "All tests passed!"

lint:
	npm run lint
	cd backend && go vet ./...