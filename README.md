# OCM Dashboard

![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-green)
![Go](https://img.shields.io/badge/go-%3E%3D1.23-blue)
![License](https://img.shields.io/badge/license-Apache%202.0-blue)

---

## Project Overview

A dashboard for displaying and monitoring Open Cluster Management (OCM) clusters, placements, cluster sets, manifest works, and addons.

![OCM Dashboard](./public/images/demo.gif)

---

## Quick Start

Deploy OCM Dashboard using the local Helm chart:

```bash
# Install from local chart
helm install ocm-dashboard ./charts/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace

# Access via port-forward
kubectl port-forward -n ocm-dashboard service/ocm-dashboard 3000:80
```

Open your browser at http://localhost:3000

---

## Documentation

- [Architecture](docs/architecture.md) - System architecture and components
- [Development](docs/development.md) - Development setup and workflows
- [Deployment](docs/deployment.md) - Production deployment guide
- [Configuration](docs/configuration.md) - Environment variables and settings
- [Testing](docs/testing.md) - Running tests and test structure
- [Make Targets](docs/make-targets.md) - Complete list of available make commands
- [API Reference](docs/api-reference.md) - REST API documentation
