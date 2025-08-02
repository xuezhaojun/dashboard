# Testing

This document describes how to run tests for the OCM Dashboard project.

## Running Tests

### All Tests

```bash
# Run all tests (frontend, API server, and UI server)
make test
```

### Component-Specific Tests

```bash
# Run frontend tests only
make test-ui

# Run API server tests only
make test-apiserver

# Run UI server tests only
make test-uiserver
```

### Linting

```bash
# Run linting for all components
make lint
```

This will run:
- ESLint for the frontend TypeScript/React code
- `go vet` for both API server and UI server Go code

## Test Structure

### Frontend Tests
- Located in `src/` directory alongside component files
- Uses Vitest as the test runner
- Tests React components, hooks, and utilities

### Backend Tests
- **API Server**: Tests in `apiserver/` directory with `*_test.go` files
- **UI Server**: Tests in `uiserver/` directory with `*_test.go` files
- Uses Go's built-in testing framework

## Continuous Integration

All tests are automatically run in CI/CD pipelines. Make sure all tests pass before submitting pull requests.

## Test Coverage

To check test coverage:

```bash
# Frontend coverage (if configured)
npm run test:coverage

# Go test coverage
cd apiserver && go test -cover ./...
cd uiserver && go test -cover ./...
```

## Writing Tests

### Frontend Tests
- Follow React Testing Library best practices
- Test user interactions and component behavior
- Mock API calls appropriately

### Backend Tests
- Write unit tests for handlers and business logic
- Use table-driven tests for multiple test cases
- Mock external dependencies (Kubernetes API, etc.)

For a complete list of all available Make targets, see the [Make Targets reference](make-targets.md).
