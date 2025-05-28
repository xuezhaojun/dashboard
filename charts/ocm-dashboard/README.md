# OCM Dashboard Helm Chart

This Helm chart deploys the OCM Dashboard on a Kubernetes cluster using the Helm package manager.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- OCM (Open Cluster Management) installed on the cluster

## Installing the Chart

To install the chart with the release name `ocm-dashboard`:

```bash
helm repo add ocm https://open-cluster-management.io/helm-charts
helm repo update
helm install ocm-dashboard ocm/ocm-dashboard --namespace ocm-dashboard --create-namespace
```

## Uninstalling the Chart

To uninstall/delete the `ocm-dashboard` deployment:

```bash
helm uninstall ocm-dashboard --namespace ocm-dashboard
```

## Configuration

The following table lists the configurable parameters of the OCM Dashboard chart and their default values.

| Parameter                           | Description                              | Default                                 |
| ----------------------------------- | ---------------------------------------- | --------------------------------------- |
| `replicaCount`                      | Number of replicas                       | `2`                                     |
| `image.registry`                    | Image registry                           | `quay.io`                               |
| `image.repository`                  | Image repository                         | `open-cluster-management/ocm-dashboard` |
| `image.tag`                         | Image tag (defaults to chart appVersion) | `""`                                    |
| `image.pullPolicy`                  | Image pull policy                        | `IfNotPresent`                          |
| `imagePullSecrets`                  | Image pull secrets                       | `[]`                                    |
| `nameOverride`                      | Override the name of the chart           | `""`                                    |
| `fullnameOverride`                  | Override the fullname of the chart       | `""`                                    |
| `serviceAccount.create`             | Create service account                   | `true`                                  |
| `serviceAccount.annotations`        | Service account annotations              | `{}`                                    |
| `serviceAccount.name`               | Service account name                     | `""`                                    |
| `podAnnotations`                    | Pod annotations                          | `{}`                                    |
| `podSecurityContext`                | Pod security context                     | See `values.yaml`                       |
| `securityContext`                   | Container security context               | See `values.yaml`                       |
| `service.type`                      | Service type                             | `ClusterIP`                             |
| `service.port`                      | Service port                             | `80`                                    |
| `ingress.enabled`                   | Enable ingress                           | `false`                                 |
| `ingress.className`                 | Ingress class name                       | `""`                                    |
| `ingress.annotations`               | Ingress annotations                      | `{}`                                    |
| `ingress.hosts`                     | Ingress hosts                            | See `values.yaml`                       |
| `ingress.tls`                       | Ingress TLS configuration                | `[]`                                    |
| `resources`                         | Resource requests and limits             | See `values.yaml`                       |
| `autoscaling.enabled`               | Enable HPA                               | `false`                                 |
| `nodeSelector`                      | Node selector                            | `{"kubernetes.io/os": "linux"}`         |
| `tolerations`                       | Tolerations                              | `[]`                                    |
| `affinity`                          | Affinity rules                           | See `values.yaml`                       |
| `dashboard.env`                     | Dashboard environment variables          | See `values.yaml`                       |
| `dashboard.extraEnv`                | Extra environment variables              | `[]`                                    |
| `rbac.create`                       | Create RBAC resources                    | `true`                                  |
| `monitoring.serviceMonitor.enabled` | Create ServiceMonitor for Prometheus     | `false`                                 |

### Dashboard Configuration

| Parameter                             | Description           | Default     |
| ------------------------------------- | --------------------- | ----------- |
| `dashboard.env.GIN_MODE`              | Gin framework mode    | `"release"` |
| `dashboard.env.DASHBOARD_DEBUG`       | Enable debug logging  | `"false"`   |
| `dashboard.env.DASHBOARD_USE_MOCK`    | Use mock data         | `"false"`   |
| `dashboard.env.DASHBOARD_BYPASS_AUTH` | Bypass authentication | `"false"`   |
| `dashboard.env.PORT`                  | Server port           | `"8080"`    |

## Examples

### Install with custom values

```bash
helm install ocm-dashboard ocm/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace \
  --set image.tag=v1.0.0 \
  --set replicaCount=3 \
  --set dashboard.env.DASHBOARD_BYPASS_AUTH=true
```

### Install with Ingress enabled

```bash
helm install ocm-dashboard ocm/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=ocm-dashboard.example.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix
```

### Install with resource limits

```bash
helm install ocm-dashboard ocm/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace \
  --set resources.requests.memory=128Mi \
  --set resources.requests.cpu=100m \
  --set resources.limits.memory=256Mi \
  --set resources.limits.cpu=200m
```

### Install with custom environment variables

Create a `values.yaml` file:

```yaml
dashboard:
  env:
    DASHBOARD_BYPASS_AUTH: "true"
    DASHBOARD_DEBUG: "true"
  extraEnv:
    - name: CUSTOM_VAR
      value: "custom-value"
    - name: SECRET_VAR
      valueFrom:
        secretKeyRef:
          name: my-secret
          key: secret-key
```

Then install:

```bash
helm install ocm-dashboard ocm/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace \
  --values values.yaml
```

## Upgrading

To upgrade an existing release:

```bash
helm upgrade ocm-dashboard ocm/ocm-dashboard \
  --namespace ocm-dashboard \
  --set image.tag=v1.1.0
```

## Development

To install from local chart during development:

```bash
helm install ocm-dashboard ./charts/ocm-dashboard \
  --namespace ocm-dashboard \
  --create-namespace \
  --set dashboard.env.DASHBOARD_USE_MOCK=true
```
