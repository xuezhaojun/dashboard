package main

import (
	"context"
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

// ClusterStatus represents a simplified cluster status
type ClusterStatus struct {
	Available  bool        `json:"available"`
	Joined     bool        `json:"joined"`
	Conditions []Condition `json:"conditions,omitempty"`
}

// Cluster represents a simplified OCM ManagedCluster
type Cluster struct {
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	Status     string            `json:"status"` // "Online", "Offline", etc.
	Version    string            `json:"version,omitempty"`
	Nodes      int               `json:"nodes,omitempty"`
	Labels     map[string]string `json:"labels,omitempty"`
	Conditions []Condition       `json:"conditions,omitempty"`
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
		// creates the out-of-cluster config
		config, err = clientcmd.BuildConfigFromFlags("", *kubeconfig)
		if err != nil {
			log.Fatalf("Error building kubeconfig: %v", err)
		}
		log.Println("Using kubeconfig from:", *kubeconfig)
	}

	// Create dynamic client
	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		log.Fatalf("Error creating dynamic client: %v", err)
	}

	// Create a context
	ctx := context.Background()

	// Set up Gin router
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
			// List managed clusters
			list, err := dynamicClient.Resource(managedClusterResource).List(ctx, metav1.ListOptions{})
			if err != nil {
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

				// Extract version from labels or annotations
				if version, ok := item.GetLabels()["version"]; ok {
					cluster.Version = version
				}

				// Extract status
				status, found, err := unstructured.NestedMap(item.Object, "status")
				if err == nil && found {
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
						}
					}
				}

				clusters = append(clusters, cluster)
			}

			c.JSON(http.StatusOK, clusters)
		})

		// Get a specific cluster
		api.GET("/clusters/:name", authMiddleware, func(c *gin.Context) {
			name := c.Param("name")

			// Get the cluster
			item, err := dynamicClient.Resource(managedClusterResource).Get(ctx, name, metav1.GetOptions{})
			if err != nil {
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

			// Extract version from labels or annotations
			if version, ok := item.GetLabels()["version"]; ok {
				cluster.Version = version
			}

			// Extract status
			status, found, err := unstructured.NestedMap(item.Object, "status")
			if err == nil && found {
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
					}
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

			// Create informer for ManagedCluster events
			// This is just a placeholder - in a real implementation we would use an informer
			// to watch for changes to ManagedClusters

			// For now, just send a heartbeat every 10 seconds to keep the connection alive
			ticker := time.NewTicker(10 * time.Second)
			defer ticker.Stop()

			for {
				select {
				case <-ticker.C:
					// Send heartbeat
					fmt.Fprintf(c.Writer, "event: heartbeat\ndata: %s\n\n", time.Now().Format(time.RFC3339))
					c.Writer.Flush()
				case <-done:
					// Client disconnected
					return
				}
			}
		})
	}

	// Start the server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
