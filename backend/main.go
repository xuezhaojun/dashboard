package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
	"k8s.io/client-go/util/homedir"
)

// Main resource to work with - ManagedCluster from OCM
var managedClusterResource = schema.GroupVersionResource{
	Group:    "cluster.open-cluster-management.io",
	Version:  "v1",
	Resource: "managedclusters",
}

// Condition represents the status condition of a cluster
type Condition struct {
	Type               string `json:"type"`
	Status             string `json:"status"`
	LastTransitionTime string `json:"lastTransitionTime,omitempty"`
	Reason             string `json:"reason,omitempty"`
	Message            string `json:"message,omitempty"`
}

// ClusterClaim represents a claim from the managed cluster
type ClusterClaim struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// Taint represents a taint on the managed cluster
type Taint struct {
	Key    string `json:"key"`
	Value  string `json:"value,omitempty"`
	Effect string `json:"effect"`
}

// ClusterStatus represents a simplified cluster status
type ClusterStatus struct {
	Available  bool        `json:"available"`
	Joined     bool        `json:"joined"`
	Conditions []Condition `json:"conditions,omitempty"`
}

// ManagedClusterClientConfig represents the client configuration for a managed cluster
type ManagedClusterClientConfig struct {
	URL      string `json:"url"`
	CABundle string `json:"caBundle,omitempty"`
}

// Cluster represents a simplified OCM ManagedCluster
type Cluster struct {
	ID                          string                       `json:"id"`
	Name                        string                       `json:"name"`
	Status                      string                       `json:"status"` // "Online", "Offline", etc.
	Version                     string                       `json:"version,omitempty"`
	Labels                      map[string]string            `json:"labels,omitempty"`
	Conditions                  []Condition                  `json:"conditions,omitempty"`
	HubAccepted                 bool                         `json:"hubAccepted"`
	Capacity                    map[string]string            `json:"capacity,omitempty"`
	Allocatable                 map[string]string            `json:"allocatable,omitempty"`
	ClusterClaims               []ClusterClaim               `json:"clusterClaims,omitempty"`
	Taints                      []Taint                      `json:"taints,omitempty"`
	ManagedClusterClientConfigs []ManagedClusterClientConfig `json:"managedClusterClientConfigs,omitempty"`
	CreationTimestamp           string                       `json:"creationTimestamp,omitempty"`
}

func main() {
	// Check if using mock data
	useMockData := os.Getenv("DASHBOARD_USE_MOCK") == "true"
	debugMode := os.Getenv("DASHBOARD_DEBUG") == "true"

	var dynamicClient dynamic.Interface

	// Only create the Kubernetes client if not using mock data
	if !useMockData {
		// Get kubeconfig
		var kubeconfig *string

		// Check if running in-cluster
		_, inClusterErr := rest.InClusterConfig()
		inCluster := inClusterErr == nil

		if !inCluster {
			if home := homedir.HomeDir(); home != "" {
				kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "(optional) absolute path to the kubeconfig file")
			} else {
				kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
			}
			flag.Parse()
		}

		// Create kubernetes client
		var config *rest.Config
		var err error
		if inCluster {
			// creates the in-cluster config
			config, err = rest.InClusterConfig()
			if err != nil {
				log.Fatalf("Error creating in-cluster config: %v", err)
			}
			log.Println("Using in-cluster configuration")
		} else {
			// First try to use the KUBECONFIG environment variable
			kubeconfigEnv := os.Getenv("KUBECONFIG")
			if kubeconfigEnv != "" {
				log.Printf("Using KUBECONFIG from environment: %s", kubeconfigEnv)
				config, err = clientcmd.BuildConfigFromFlags("", kubeconfigEnv)
				if err != nil {
					log.Printf("Error building kubeconfig from KUBECONFIG env: %v", err)
					// Fall back to command line flag or default
				}
			}

			// If KUBECONFIG env var didn't work, try the flag or default path
			if config == nil {
				log.Printf("Using kubeconfig from flag or default: %s", *kubeconfig)
				config, err = clientcmd.BuildConfigFromFlags("", *kubeconfig)
				if err != nil {
					// Try the load rules (will check multiple locations)
					log.Printf("Trying default client config loading rules")
					loadingRules := clientcmd.NewDefaultClientConfigLoadingRules()
					configOverrides := &clientcmd.ConfigOverrides{ClusterDefaults: clientcmdapi.Cluster{Server: ""}}
					kubeConfig := clientcmd.NewNonInteractiveDeferredLoadingClientConfig(loadingRules, configOverrides)
					config, err = kubeConfig.ClientConfig()
					if err != nil {
						log.Fatalf("Error building kubeconfig using defaults: %v", err)
					}
				}
			}
		}

		// Create dynamic client
		dynamicClient, err = dynamic.NewForConfig(config)
		if err != nil {
			log.Fatalf("Error creating dynamic client: %v", err)
		}

		// Debug message to verify connection
		log.Println("Successfully created Kubernetes client")
	} else if debugMode {
		log.Println("Mock mode enabled, skipping Kubernetes client creation")
	}

	// Create a context
	ctx := context.Background()

	// Check if debug mode is enabled
	if debugMode {
		log.Println("Debug mode enabled")
	}

	// Set up Gin router
	if debugMode {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// API routes
	api := r.Group("/api")
	{
		// Authorization middleware - would validate token against TokenReview API
		// For now, we'll bypass it in development mode
		authMiddleware := func(c *gin.Context) {
			if os.Getenv("DASHBOARD_BYPASS_AUTH") == "true" {
				c.Next()
				return
			}

			authHeader := c.GetHeader("Authorization")
			if authHeader == "" {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
				c.Abort()
				return
			}

			// TODO: Implement TokenReview validation

			c.Next()
		}

		// API endpoints
		api.GET("/clusters", authMiddleware, func(c *gin.Context) {
			// Check if using mock data
			if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
				// Return mock data
				mockClusters := []Cluster{
					{
						ID:                "mock-cluster-1",
						Name:              "mock-cluster-1",
						Status:            "Online",
						Version:           "4.12.0",
						CreationTimestamp: time.Now().AddDate(0, -1, 0).Format(time.RFC3339),
						Labels: map[string]string{
							"vendor": "OpenShift",
							"region": "us-east-1",
							"env":    "development",
						},
						ManagedClusterClientConfigs: []ManagedClusterClientConfig{
							{
								URL:      "https://cluster1-control-plane:6443",
								CABundle: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURCVENDQWUyZ0F3SUJBZ0lJWEZtWkR0bjdXM2N3RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2EzVmlaWEp1WlhSbGN6QWVGdzB5TlRBMU1UUXdPVEk1TWpoYUZ3MHpOVEExTVRJd09UTTBNamhhTUJVeApFekFSQmdOVkJBTVRDbXQxWW1WeWJtVjBaWE13Z2dFaU1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLCkFvSUJBUUM2N0FXYSt2b1FQaE8xd05xUXdncjZxT0tuWW1hOWNTT0NCMHFTVW1VQUh0T29wSG1LWXArNzFMR1kKT0RXODB3M1FnMUJkTWw5Y0h1UVBjK043MTJsbzQwVVJMcDVCOEhoR2ZiZWlZOVhlWWZIYkRMdWpaV2tSaHI0agpOckNUcWRCN1JUYmhSY1NPKyszVVlGRG8ybVpSdmVBbGFyc25ldXJFNW5LL2RITU1Xb0hYL1VUcXBhc2RaTTZaCkVJaVNseldGUVYxWnpjTVBNVmZ4WjhlT1FWZjVqdHY4NnNhOTc1aFFhOG1WYXh6QTdjTzdiNTJYM200cXhuUWwKK1Voa1dTSC9GWXlEdE9vd3NFSDYvd25LRWY1Y3NiWFpJK2RGQ3EwWjU1b0JrbGcyMDlhSEJPOGUzYm1lZWE1dwpYQ1NBd2JpWm1wM0p1a203ODN5dkRyUWZodTRGQWdNQkFBR2pXVEJYTUE0R0ExVWREd0VCL3dRRUF3SUNwREFQCkJnTlZIUk1CQWY4RUJUQURBUUgvTUIwR0ExVWREZ1FXQkJSd3NlVXh4cHNvOE1qNlZ4Wnl4RDUyYVU5K1pEQVYKQmdOVkhSRUVEakFNZ2dwcmRXSmxjbTVsZEdWek1BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQVVYZFFPN2NSMQpJWUhXVkxEZ0JFUTdJRUJqcjYrSS9MbCt0bzF1STZiQ3o0dmxmMEJ6ZnBaQllCQmFxdzM5dERtaGcwUys5ZnEvClFyL1ZMUHlLeUpuOC9zdmQzbjUzRy9pNC9HM2JGcVc4azc3M3hSK3hkV21TcnAybEFnRGFEU0cxZVlUUEZFN3UKZTQ4T01WcGNRaHNEbmRZY2ExNnJ6LzZ5WlpONkxiY0dXbUV6bEtxN1EyamVsaGNwZnpSWjlqMGJxRTRNSmg1Rgo5cEY2encyMnNKd2pvanhVQzMyVHNGczN4bndMMDRuUDREcHM2TkJBbTFXWmlxbTJJSDJHWHh4SVVFbVpOUWZmCmxET3hIdGJONU5yR2xRVUdrWDJQdUpyOXdFS0lOSWtYaHlYS0tvRngzUFg3d2VSWnB6TWZOR2UrU0JUVkFjTmkKbi9IMjdRODF0L3orCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K",
							},
						},
						Conditions: []Condition{
							{
								Type:               "ManagedClusterConditionAvailable",
								Status:             "True",
								LastTransitionTime: time.Now().Format(time.RFC3339),
								Reason:             "ClusterAvailable",
								Message:            "Cluster is available",
							},
						},
					},
					{
						ID:                "mock-cluster-2",
						Name:              "mock-cluster-2",
						Status:            "Offline",
						Version:           "4.11.0",
						CreationTimestamp: time.Now().AddDate(0, -2, 0).Format(time.RFC3339),
						Labels: map[string]string{
							"vendor": "OpenShift",
							"region": "us-west-1",
							"env":    "staging",
						},
						ManagedClusterClientConfigs: []ManagedClusterClientConfig{
							{
								URL:      "https://cluster2-control-plane:6443",
								CABundle: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURCVENDQWUyZ0F3SUJBZ0lJWnhLblFMVFovaG93RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2EzVmlaWEp1WlhSbGN6QWVGdzB5TlRBMU1UUXdPVEk1TXpsYUZ3MHpOVEExTVRJd09UTTBNemxhTUJVeApFekFSQmdOVkJBTVRDbXQxWW1WeWJtVjBaWE13Z2dFaU1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLCkFvSUJBUURndFVaM0JTT3pNWGZWZ3hZM3dpSGh5UGlqVU1Jb3JvYmRaY2FldDlLTnBqcU9RRHloQ05tTzAya1QKeGFkT1RtY0dJMmtPeDNvUE9PRGorWkd3cndXNjdtV0dTeTVHTGI5SlJJc1VydWZ4Rkt3cHk1L291dzBZU3lUVwphMkVNTmp1TS9TYmxHdE5lZHRaRkRVYXY5K015ejU2ZjBEZm1XdlRGNlNudEJLOGNLNEdYUXlPOGFzaC8xL1hOClRYQ2IxbjJldmllUlRiclp3aTR0d2kyQmFBVlc0dTArWmU0TWJaU3h1U01rL2t1UG02TXhVZUdHSXpUY1F2RXUKdjBzSDVPejRqeXRLbGsyR2Z1SXVwSXNQbGVrVWN5dS9wZnpvY0hmZlNpMVpla3YyNW1CMzlWN256TXZONWRjNAo2VXhPbjBjZGIvMU1xenhCVENjL0dDSGR1OHJaQWdNQkFBR2pXVEJYTUE0R0ExVWREd0VCL3dRRUF3SUNwREFQCkJnTlZIUk1CQWY4RUJUQURBUUgvTUIwR0ExVWREZ1FXQkJTSDNmVWdXdG9UTEhYK2ZKUmZScnhuNVViUFd6QVYKQmdOVkhSRUVEakFNZ2dwcmRXSmxjbTVsZEdWek1BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQ1hHd1Fzcjdpbgo3aXlqL3VCZTVPOTR6NVJMck0vZWR4U1M4ZkFIMzJrR2t6d0lzOFdoZUZJVHZuTC96UzBUY0Q4cll0Z3dmSThvCkE2WE1PaGxFVlJML0trQldFR2xLN0dyV0gva2orcjdpRjdTN2FoMzdRQUFSeTlCcGhPc1U1eERyaFAzN2gyMlYKeUVnQjhiWDJJcHJXdEwxZDhTeEVVRHFPMlV3a1VaVmIyK1RtV0lCMnpsT01CU0hjQ016VVNESWx4WTdPSzZXNgpTQ3djSmdtek1uWDFnMUQyZXRGM0p4eW5PU2k4VEoyejRLbFlZQk9tQ01uTHovaWIwVjNHMTNkRVVZamt0YXdxCmp2bHJuM2x5OVNDUThsZUdzNmVLTW4xYUNZZ2dpeUl6MllMbW45bEhHSUhJNU05Y0o1Z2lXcDlPVHM5MUt6d3EKb3FFcVRxaFBHZnhxCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K",
							},
						},
						Conditions: []Condition{
							{
								Type:               "ManagedClusterConditionAvailable",
								Status:             "False",
								LastTransitionTime: time.Now().Format(time.RFC3339),
								Reason:             "ClusterOffline",
								Message:            "Cluster is not responding",
							},
						},
					},
				}
				c.JSON(http.StatusOK, mockClusters)
				return
			}

			// Ensure we have a client before proceeding
			if dynamicClient == nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
				return
			}

			// Normal processing - list real managed clusters
			list, err := dynamicClient.Resource(managedClusterResource).List(ctx, metav1.ListOptions{})
			if err != nil {
				if debugMode {
					log.Printf("Error listing clusters: %v", err)
				}
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Convert to our simplified Cluster format
			clusters := make([]Cluster, 0, len(list.Items))
			for _, item := range list.Items {
				// Extract the basic metadata
				cluster := Cluster{
					ID:                string(item.GetUID()),
					Name:              item.GetName(),
					Status:            "Unknown",
					Labels:            item.GetLabels(),
					CreationTimestamp: item.GetCreationTimestamp().Format(time.RFC3339),
				}

				// Extract version from status field
				status, found, err := unstructured.NestedMap(item.Object, "status")
				if err == nil && found {
					// Extract kubernetes version
					if version, found, _ := unstructured.NestedMap(status, "version"); found {
						if k8sVersion, found, _ := unstructured.NestedString(version, "kubernetes"); found {
							cluster.Version = k8sVersion
						}
					}

					// Extract capacity
					if capacity, found, _ := unstructured.NestedMap(status, "capacity"); found {
						resourceMap := make(map[string]string)
						for k, v := range capacity {
							resourceMap[k] = fmt.Sprintf("%v", v)
						}
						cluster.Capacity = resourceMap
					}

					// Extract allocatable
					if allocatable, found, _ := unstructured.NestedMap(status, "allocatable"); found {
						resourceMap := make(map[string]string)
						for k, v := range allocatable {
							resourceMap[k] = fmt.Sprintf("%v", v)
						}
						cluster.Allocatable = resourceMap
					}

					// Extract clusterClaims
					if clusterClaims, found, _ := unstructured.NestedSlice(status, "clusterClaims"); found {
						claims := make([]ClusterClaim, 0, len(clusterClaims))
						for _, c := range clusterClaims {
							claimMap, ok := c.(map[string]interface{})
							if !ok {
								continue
							}

							claim := ClusterClaim{}
							if name, found, _ := unstructured.NestedString(claimMap, "name"); found {
								claim.Name = name
							}
							if value, found, _ := unstructured.NestedString(claimMap, "value"); found {
								claim.Value = value
							}
							claims = append(claims, claim)
						}
						cluster.ClusterClaims = claims
					}

					// Convert conditions
					if conditions, found, _ := unstructured.NestedSlice(status, "conditions"); found {
						for _, c := range conditions {
							condMap, ok := c.(map[string]interface{})
							if !ok {
								continue
							}

							condition := Condition{}

							if t, found, _ := unstructured.NestedString(condMap, "type"); found {
								condition.Type = t
							}

							if s, found, _ := unstructured.NestedString(condMap, "status"); found {
								condition.Status = s
							}

							if r, found, _ := unstructured.NestedString(condMap, "reason"); found {
								condition.Reason = r
							}

							if m, found, _ := unstructured.NestedString(condMap, "message"); found {
								condition.Message = m
							}

							if lt, found, _ := unstructured.NestedString(condMap, "lastTransitionTime"); found {
								condition.LastTransitionTime = lt
							}

							cluster.Conditions = append(cluster.Conditions, condition)

							// Update status based on ManagedClusterConditionAvailable condition
							if condition.Type == "ManagedClusterConditionAvailable" && condition.Status == "True" {
								cluster.Status = "Online"
							} else if condition.Type == "ManagedClusterConditionAvailable" && condition.Status != "True" {
								cluster.Status = "Offline"
							}

							// Check for hub acceptance
							if condition.Type == "HubAcceptedManagedCluster" && condition.Status == "True" {
								cluster.HubAccepted = true
							}
						}
					}
				}

				// Extract spec for additional details
				spec, found, err := unstructured.NestedMap(item.Object, "spec")
				if err == nil && found {
					// Extract hubAcceptsClient
					if hubAccepts, found, _ := unstructured.NestedBool(spec, "hubAcceptsClient"); found {
						cluster.HubAccepted = hubAccepts
					}

					// Extract managedClusterClientConfigs
					if configs, found, _ := unstructured.NestedSlice(spec, "managedClusterClientConfigs"); found {
						clientConfigs := make([]ManagedClusterClientConfig, 0, len(configs))
						for _, c := range configs {
							configMap, ok := c.(map[string]interface{})
							if !ok {
								continue
							}

							config := ManagedClusterClientConfig{}
							if url, found, _ := unstructured.NestedString(configMap, "url"); found {
								config.URL = url
							}
							if caBundle, found, _ := unstructured.NestedString(configMap, "caBundle"); found {
								config.CABundle = caBundle
							}
							clientConfigs = append(clientConfigs, config)
						}
						cluster.ManagedClusterClientConfigs = clientConfigs
					}

					// Extract taints
					if taints, found, _ := unstructured.NestedSlice(spec, "taints"); found {
						clusterTaints := make([]Taint, 0, len(taints))
						for _, t := range taints {
							taintMap, ok := t.(map[string]interface{})
							if !ok {
								continue
							}

							taint := Taint{}
							if key, found, _ := unstructured.NestedString(taintMap, "key"); found {
								taint.Key = key
							}
							if value, found, _ := unstructured.NestedString(taintMap, "value"); found {
								taint.Value = value
							}
							if effect, found, _ := unstructured.NestedString(taintMap, "effect"); found {
								taint.Effect = effect
							}
							clusterTaints = append(clusterTaints, taint)
						}
						cluster.Taints = clusterTaints
					}
				}

				clusters = append(clusters, cluster)
			}

			c.JSON(http.StatusOK, clusters)
		})

		// Get a specific cluster
		api.GET("/clusters/:name", authMiddleware, func(c *gin.Context) {
			name := c.Param("name")

			// Check if using mock data
			if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
				// Mock a single cluster based on name
				if name == "mock-cluster-1" {
					mockCluster := Cluster{
						ID:                "mock-cluster-1",
						Name:              "mock-cluster-1",
						Status:            "Online",
						Version:           "4.12.0",
						CreationTimestamp: time.Now().AddDate(0, -1, 0).Format(time.RFC3339),
						Labels: map[string]string{
							"vendor": "OpenShift",
							"region": "us-east-1",
							"env":    "development",
							"tier":   "gold",
						},
						Conditions: []Condition{
							{
								Type:               "ManagedClusterConditionAvailable",
								Status:             "True",
								LastTransitionTime: time.Now().Format(time.RFC3339),
								Reason:             "ClusterAvailable",
								Message:            "Cluster is available",
							},
							{
								Type:               "ManagedClusterConditionJoined",
								Status:             "True",
								LastTransitionTime: time.Now().AddDate(0, 0, -5).Format(time.RFC3339),
								Reason:             "ClusterJoined",
								Message:            "Cluster has joined the hub",
							},
						},
					}
					c.JSON(http.StatusOK, mockCluster)
					return
				} else if name == "mock-cluster-2" {
					mockCluster := Cluster{
						ID:                "mock-cluster-2",
						Name:              "mock-cluster-2",
						Status:            "Offline",
						Version:           "4.11.0",
						CreationTimestamp: time.Now().AddDate(0, -2, 0).Format(time.RFC3339),
						Labels: map[string]string{
							"vendor": "OpenShift",
							"region": "us-west-1",
							"env":    "staging",
							"tier":   "silver",
						},
						Conditions: []Condition{
							{
								Type:               "ManagedClusterConditionAvailable",
								Status:             "False",
								LastTransitionTime: time.Now().AddDate(0, 0, -1).Format(time.RFC3339),
								Reason:             "ClusterOffline",
								Message:            "Cluster is not responding",
							},
							{
								Type:               "ManagedClusterConditionJoined",
								Status:             "True",
								LastTransitionTime: time.Now().AddDate(0, -1, 0).Format(time.RFC3339),
								Reason:             "ClusterJoined",
								Message:            "Cluster has joined the hub",
							},
						},
					}
					c.JSON(http.StatusOK, mockCluster)
					return
				} else {
					c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Mock cluster %s not found", name)})
					return
				}
			}

			// Ensure we have a client before proceeding
			if dynamicClient == nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
				return
			}

			// Get the real cluster
			item, err := dynamicClient.Resource(managedClusterResource).Get(ctx, name, metav1.GetOptions{})
			if err != nil {
				if debugMode {
					log.Printf("Error getting cluster %s: %v", name, err)
				}
				c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Cluster %s not found", name)})
				return
			}

			// Convert to our simplified Cluster format
			cluster := Cluster{
				ID:                string(item.GetUID()),
				Name:              item.GetName(),
				Status:            "Unknown",
				Labels:            item.GetLabels(),
				CreationTimestamp: item.GetCreationTimestamp().Format(time.RFC3339),
			}

			// Extract version from status field
			status, found, err := unstructured.NestedMap(item.Object, "status")
			if err == nil && found {
				// Extract kubernetes version
				if version, found, _ := unstructured.NestedMap(status, "version"); found {
					if k8sVersion, found, _ := unstructured.NestedString(version, "kubernetes"); found {
						cluster.Version = k8sVersion
					}
				}

				// Extract capacity
				if capacity, found, _ := unstructured.NestedMap(status, "capacity"); found {
					resourceMap := make(map[string]string)
					for k, v := range capacity {
						resourceMap[k] = fmt.Sprintf("%v", v)
					}
					cluster.Capacity = resourceMap
				}

				// Extract allocatable
				if allocatable, found, _ := unstructured.NestedMap(status, "allocatable"); found {
					resourceMap := make(map[string]string)
					for k, v := range allocatable {
						resourceMap[k] = fmt.Sprintf("%v", v)
					}
					cluster.Allocatable = resourceMap
				}

				// Extract clusterClaims
				if clusterClaims, found, _ := unstructured.NestedSlice(status, "clusterClaims"); found {
					claims := make([]ClusterClaim, 0, len(clusterClaims))
					for _, c := range clusterClaims {
						claimMap, ok := c.(map[string]interface{})
						if !ok {
							continue
						}

						claim := ClusterClaim{}
						if name, found, _ := unstructured.NestedString(claimMap, "name"); found {
							claim.Name = name
						}
						if value, found, _ := unstructured.NestedString(claimMap, "value"); found {
							claim.Value = value
						}
						claims = append(claims, claim)
					}
					cluster.ClusterClaims = claims
				}

				// Convert conditions
				if conditions, found, _ := unstructured.NestedSlice(status, "conditions"); found {
					for _, c := range conditions {
						condMap, ok := c.(map[string]interface{})
						if !ok {
							continue
						}

						condition := Condition{}

						if t, found, _ := unstructured.NestedString(condMap, "type"); found {
							condition.Type = t
						}

						if s, found, _ := unstructured.NestedString(condMap, "status"); found {
							condition.Status = s
						}

						if r, found, _ := unstructured.NestedString(condMap, "reason"); found {
							condition.Reason = r
						}

						if m, found, _ := unstructured.NestedString(condMap, "message"); found {
							condition.Message = m
						}

						if lt, found, _ := unstructured.NestedString(condMap, "lastTransitionTime"); found {
							condition.LastTransitionTime = lt
						}

						cluster.Conditions = append(cluster.Conditions, condition)

						// Update status based on ManagedClusterConditionAvailable condition
						if condition.Type == "ManagedClusterConditionAvailable" && condition.Status == "True" {
							cluster.Status = "Online"
						} else if condition.Type == "ManagedClusterConditionAvailable" && condition.Status != "True" {
							cluster.Status = "Offline"
						}

						// Check for hub acceptance
						if condition.Type == "HubAcceptedManagedCluster" && condition.Status == "True" {
							cluster.HubAccepted = true
						}
					}
				}
			}

			// Extract spec for additional details
			spec, found, err := unstructured.NestedMap(item.Object, "spec")
			if err == nil && found {
				// Extract hubAcceptsClient
				if hubAccepts, found, _ := unstructured.NestedBool(spec, "hubAcceptsClient"); found {
					cluster.HubAccepted = hubAccepts
				}

				// Extract managedClusterClientConfigs
				if configs, found, _ := unstructured.NestedSlice(spec, "managedClusterClientConfigs"); found {
					clientConfigs := make([]ManagedClusterClientConfig, 0, len(configs))
					for _, c := range configs {
						configMap, ok := c.(map[string]interface{})
						if !ok {
							continue
						}

						config := ManagedClusterClientConfig{}
						if url, found, _ := unstructured.NestedString(configMap, "url"); found {
							config.URL = url
						}
						if caBundle, found, _ := unstructured.NestedString(configMap, "caBundle"); found {
							config.CABundle = caBundle
						}
						clientConfigs = append(clientConfigs, config)
					}
					cluster.ManagedClusterClientConfigs = clientConfigs
				}

				// Extract taints
				if taints, found, _ := unstructured.NestedSlice(spec, "taints"); found {
					clusterTaints := make([]Taint, 0, len(taints))
					for _, t := range taints {
						taintMap, ok := t.(map[string]interface{})
						if !ok {
							continue
						}

						taint := Taint{}
						if key, found, _ := unstructured.NestedString(taintMap, "key"); found {
							taint.Key = key
						}
						if value, found, _ := unstructured.NestedString(taintMap, "value"); found {
							taint.Value = value
						}
						if effect, found, _ := unstructured.NestedString(taintMap, "effect"); found {
							taint.Effect = effect
						}
						clusterTaints = append(clusterTaints, taint)
					}
					cluster.Taints = clusterTaints
				}
			}

			c.JSON(http.StatusOK, cluster)
		})

		// Stream clusters with Server-Sent Events (SSE)
		api.GET("/stream/clusters", authMiddleware, func(c *gin.Context) {
			// Set headers for SSE
			c.Writer.Header().Set("Content-Type", "text/event-stream")
			c.Writer.Header().Set("Cache-Control", "no-cache")
			c.Writer.Header().Set("Connection", "keep-alive")
			c.Writer.Header().Set("Transfer-Encoding", "chunked")
			c.Writer.Flush()

			// Create a channel for done signal
			done := make(chan struct{})

			// Close the channel when client disconnects
			go func() {
				<-c.Request.Context().Done()
				close(done)
			}()

			// Check if using mock data
			useMock := os.Getenv("DASHBOARD_USE_MOCK") == "true"
			if useMock && debugMode {
				log.Println("Using mock data for SSE endpoint")
			}

			// For mock data, send simulated cluster updates
			if useMock {
				// Initial set of mock clusters
				mockClusters := []Cluster{
					{
						ID:      "mock-cluster-1",
						Name:    "mock-cluster-1",
						Status:  "Online",
						Version: "4.12.0",
					},
					{
						ID:      "mock-cluster-2",
						Name:    "mock-cluster-2",
						Status:  "Offline",
						Version: "4.11.0",
					},
				}

				// Send initial clusters as ADDED events
				for _, cluster := range mockClusters {
					clusterJSON, _ := json.Marshal(cluster)
					fmt.Fprintf(c.Writer, "event: ADDED\ndata: %s\n\n", string(clusterJSON))
					c.Writer.Flush()
				}

				// Every 10 seconds, toggle the status of one cluster
				ticker := time.NewTicker(10 * time.Second)
				heartbeat := time.NewTicker(5 * time.Second)
				toggleIndex := 0

				defer ticker.Stop()
				defer heartbeat.Stop()

				for {
					select {
					case <-ticker.C:
						// Toggle status for one cluster
						toggleCluster := mockClusters[toggleIndex]
						if toggleCluster.Status == "Online" {
							toggleCluster.Status = "Offline"
						} else {
							toggleCluster.Status = "Online"
						}
						mockClusters[toggleIndex] = toggleCluster

						// Send the MODIFIED event
						clusterJSON, _ := json.Marshal(toggleCluster)
						fmt.Fprintf(c.Writer, "event: MODIFIED\ndata: %s\n\n", string(clusterJSON))
						c.Writer.Flush()

						// Alternate between clusters
						toggleIndex = (toggleIndex + 1) % len(mockClusters)
					case <-heartbeat.C:
						// Send heartbeat
						fmt.Fprintf(c.Writer, "event: heartbeat\ndata: %s\n\n", time.Now().Format(time.RFC3339))
						c.Writer.Flush()
					case <-done:
						// Client disconnected
						if debugMode {
							log.Println("SSE client disconnected")
						}
						return
					}
				}
			}

			// Create informer for ManagedCluster events (for real data)
			// This is just a placeholder - in a real implementation we would use an informer
			// to watch for changes to ManagedClusters

			// For now, just send a heartbeat every 10 seconds to keep the connection alive
			ticker := time.NewTicker(10 * time.Second)
			defer ticker.Stop()

			if debugMode {
				log.Println("Starting real SSE stream with heartbeat")
			}

			for {
				select {
				case <-ticker.C:
					// Send heartbeat
					fmt.Fprintf(c.Writer, "event: heartbeat\ndata: %s\n\n", time.Now().Format(time.RFC3339))
					c.Writer.Flush()
				case <-done:
					// Client disconnected
					if debugMode {
						log.Println("SSE client disconnected")
					}
					return
				}
			}
		})
	}

	// Add static file handling
	r.Static("/static", "./static")

	// Add a root handler to redirect to frontend
	r.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/static/index.html")
	})

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
