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

// Cluster represents a simplified OCM ManagedCluster
type Cluster struct {
	ID            string            `json:"id"`
	Name          string            `json:"name"`
	Status        string            `json:"status"` // "Online", "Offline", etc.
	Version       string            `json:"version,omitempty"`
	Nodes         int               `json:"nodes,omitempty"`
	Labels        map[string]string `json:"labels,omitempty"`
	Conditions    []Condition       `json:"conditions,omitempty"`
	HubAccepted   bool              `json:"hubAccepted"`
	Capacity      map[string]string `json:"capacity,omitempty"`
	Allocatable   map[string]string `json:"allocatable,omitempty"`
	ClusterClaims []ClusterClaim    `json:"clusterClaims,omitempty"`
	Taints        []Taint           `json:"taints,omitempty"`
}

func main() {
	// Get kubeconfig
	var kubeconfig *string

	// Check if running in-cluster
	_, err := rest.InClusterConfig()
	inCluster := err == nil

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
	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		log.Fatalf("Error creating dynamic client: %v", err)
	}

	// Debug message to verify connection
	log.Println("Successfully created Kubernetes client")

	// Create a context
	ctx := context.Background()

	// Check if debug mode is enabled
	debugMode := os.Getenv("DASHBOARD_DEBUG") == "true"
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
						ID:      "mock-cluster-1",
						Name:    "mock-cluster-1",
						Status:  "Online",
						Version: "4.12.0",
						Nodes:   3,
						Labels: map[string]string{
							"vendor": "OpenShift",
							"region": "us-east-1",
							"env":    "development",
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
						ID:      "mock-cluster-2",
						Name:    "mock-cluster-2",
						Status:  "Offline",
						Version: "4.11.0",
						Nodes:   5,
						Labels: map[string]string{
							"vendor": "OpenShift",
							"region": "us-west-1",
							"env":    "staging",
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
					ID:     string(item.GetUID()),
					Name:   item.GetName(),
					Status: "Unknown",
					Labels: item.GetLabels(),
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
						ID:      "mock-cluster-1",
						Name:    "mock-cluster-1",
						Status:  "Online",
						Version: "4.12.0",
						Nodes:   3,
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
						ID:      "mock-cluster-2",
						Name:    "mock-cluster-2",
						Status:  "Offline",
						Version: "4.11.0",
						Nodes:   5,
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
				ID:     string(item.GetUID()),
				Name:   item.GetName(),
				Status: "Unknown",
				Labels: item.GetLabels(),
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
						Nodes:   3,
					},
					{
						ID:      "mock-cluster-2",
						Name:    "mock-cluster-2",
						Status:  "Offline",
						Version: "4.11.0",
						Nodes:   5,
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
