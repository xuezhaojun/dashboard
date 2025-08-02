# Basic variables
GOOS ?= $(shell go env GOOS)
GOARCH ?= $(shell go env GOARCH)
VERSION ?= latest

# Docker image related variables
REGISTRY ?= quay.io/open-cluster-management
API_IMAGE_NAME ?= dashboard-api
UI_IMAGE_NAME ?= dashboard-ui
PLATFORMS ?= linux/amd64,linux/arm64

# Full image names
API_FULL_IMAGE_NAME = $(REGISTRY)/$(API_IMAGE_NAME):$(VERSION)
UI_FULL_IMAGE_NAME = $(REGISTRY)/$(UI_IMAGE_NAME):$(VERSION)

# Default target when just running 'make'
.DEFAULT_GOAL := all

# Build targets
TARGETS := apiserver uiserver ui

###################
# Build Targets   #
###################

# Build all (alias for build)
.PHONY: all
all: build

# Build all components
.PHONY: build
build: $(TARGETS)

# Build specific components
.PHONY: $(TARGETS)
apiserver:
	cd apiserver && go build -o apiserver

uiserver:
	cd uiserver && go build -o uiserver

ui:
	npm run build

###################
# Development     #
###################

# Run frontend development server
.PHONY: dev
dev:
	npm run dev

# Run UI server (with built frontend)
.PHONY: run-uiserver
run-uiserver: ui
	@echo "Starting UI server..."
	cd uiserver && go run uiserver.go

# Run API server (mock mode)
.PHONY: run-apiserver
run-apiserver:
	cd apiserver && chmod +x run-dev.sh && ./run-dev.sh

# Run API server (real mode)
.PHONY: run-apiserver-real
run-apiserver-real:
	cd apiserver && go run main.go

# Debug API server
.PHONY: debug-apiserver
debug-apiserver:
	cd apiserver && chmod +x debug.sh && ./debug.sh

###################
# Dependencies    #
###################

# Install Go dependencies
.PHONY: install-deps
install-deps:
	cd apiserver && go mod tidy
	cd uiserver && go mod tidy

# Install UI dependencies
.PHONY: install-ui-deps
install-ui-deps:
	npm install

# Install all dependencies
.PHONY: install
install: install-deps install-ui-deps

###################
# Docker Images   #
###################

# Build Docker images for local development
.PHONY: docker-build-local
docker-build-local:
	@echo "Building local API Docker image: $(API_IMAGE_NAME):$(VERSION)"
	docker buildx build -f Dockerfile.api -t $(API_IMAGE_NAME):$(VERSION) --load .
	@echo "Building local UI Docker image: $(UI_IMAGE_NAME):$(VERSION)"
	docker buildx build -f Dockerfile.ui -t $(UI_IMAGE_NAME):$(VERSION) --load .

# Build multi-arch Docker images
.PHONY: docker-build
docker-build:
	@echo "Building multi-arch API Docker image: $(API_FULL_IMAGE_NAME)"
	docker buildx build --platform $(PLATFORMS) -f Dockerfile.api -t $(API_FULL_IMAGE_NAME) .
	@echo "Building multi-arch UI Docker image: $(UI_FULL_IMAGE_NAME)"
	docker buildx build --platform $(PLATFORMS) -f Dockerfile.ui -t $(UI_FULL_IMAGE_NAME) .

# Build and push Docker images
.PHONY: docker-push
docker-push:
	@echo "Building and pushing multi-arch API Docker image: $(API_FULL_IMAGE_NAME)"
	docker buildx build --platform $(PLATFORMS) -f Dockerfile.api -t $(API_FULL_IMAGE_NAME) --push .
	@echo "Building and pushing multi-arch UI Docker image: $(UI_FULL_IMAGE_NAME)"
	docker buildx build --platform $(PLATFORMS) -f Dockerfile.ui -t $(UI_FULL_IMAGE_NAME) --push .

# Setup buildx builder for multi-arch builds
.PHONY: setup-buildx
setup-buildx:
	docker buildx create --name ocm-builder --use || docker buildx use ocm-builder
	docker buildx inspect --bootstrap

# Legacy docker target for backward compatibility
.PHONY: docker
docker: docker-build-local

###################
# Testing         #
###################

# Run frontend tests
.PHONY: test-ui
test-ui:
	npm run test

# Run API server tests
.PHONY: test-apiserver
test-apiserver:
	cd apiserver && go test ./...

# Run UI server tests
.PHONY: test-uiserver
test-uiserver:
	cd uiserver && go test ./...

# Run all tests
.PHONY: test
test: test-ui test-apiserver test-uiserver
	@echo "All tests passed!"

# Run linting
.PHONY: lint
lint:
	npm run lint
	cd apiserver && go vet ./...
	cd uiserver && go vet ./...

###################
# Cleanup         #
###################

# Clean up build artifacts
.PHONY: clean
clean:
	rm -rf dist
	rm -rf apiserver/static
	rm -f apiserver/apiserver
	rm -f uiserver/uiserver

###################
# Help            #
###################

# Show help
.PHONY: help
help:
	@echo "OCM Dashboard Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make              - Build all components (same as 'make all')"
	@echo "  make all          - Build all components"
	@echo "  make install      - Install all dependencies"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev          - Run frontend development server"
	@echo "  make run-uiserver - Run UI server (with built frontend)"
	@echo "  make run-apiserver - Run API server (mock mode)"
	@echo "  make run-apiserver-real - Run API server (real mode)"
	@echo "  make debug-apiserver - Debug API server"
	@echo ""
	@echo "Build Commands:"
	@echo "  make build        - Build all components"
	@echo "  make ui           - Build frontend only"
	@echo "  make apiserver    - Build API server only"
	@echo "  make uiserver     - Build UI server only"
	@echo ""
	@echo "Docker Commands:"
	@echo "  make docker-build-local - Build Docker images for local development"
	@echo "  make docker-build - Build multi-arch Docker images"
	@echo "  make docker-push  - Build and push multi-arch Docker images"
	@echo "  make setup-buildx - Setup buildx builder for multi-arch builds"
	@echo ""
	@echo "Testing Commands:"
	@echo "  make test         - Run all tests"
	@echo "  make test-ui      - Run frontend tests"
	@echo "  make test-apiserver - Run API server tests"
	@echo "  make test-uiserver - Run UI server tests"
	@echo "  make lint         - Run linting"
	@echo ""
	@echo "Cleanup Commands:"
	@echo "  make clean        - Clean up build artifacts"
	@echo ""
	@echo "Variables:"
	@echo "  VERSION           - Image version tag (default: latest)"
	@echo "  REGISTRY          - Docker registry (default: quay.io/open-cluster-management)"
	@echo "  PLATFORMS         - Build platforms (default: linux/amd64,linux/arm64)"
	@echo "  GOOS              - Target OS for build"
	@echo "  GOARCH            - Target architecture for build"