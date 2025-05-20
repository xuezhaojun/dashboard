package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/client-go/dynamic"

	"github.com/xuezhaojun/ocm-dashboard/backend/pkg/client"
	"github.com/xuezhaojun/ocm-dashboard/backend/pkg/models"
)

// GetClusters handles retrieving all clusters
func GetClusters(c *gin.Context, dynamicClient dynamic.Interface, ctx context.Context, debugMode bool) {
	// Check if using mock data
	if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
		// Return mock data
		mockClusters := []models.Cluster{
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
				ManagedClusterClientConfigs: []models.ManagedClusterClientConfig{
					{
						URL:      "https://cluster1-control-plane:6443",
						CABundle: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURCVENDQWUyZ0F3SUJBZ0lJWEZtWkR0bjdXM2N3RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2EzVmlaWEp1WlhSbGN6QWVGdzB5TlRBMU1UUXdPVEk1TWpoYUZ3MHpOVEExTVRJd09UTTBNamhhTUJVeApFekFSQmdOVkJBTVRDbXQxWW1WeWJtVjBaWE13Z2dFaU1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLCkFvSUJBUUM2N0FXYSt2b1FQaE8xd05xUXdncjZxT0tuWW1hOWNTT0NCMHFTVW1VQUh0T29wSG1LWXArNzFMR1kKT0RXODB3M1FnMUJkTWw5Y0h1UVBjK043MTJsbzQwVVJMcDVCOEhoR2ZiZWlZOVhlWWZIYkRMdWpaV2tSaHI0agpOckNUcWRCN1JUYmhSY1NPKyszVVlGRG8ybVpSdmVBbGFyc25ldXJFNW5LL2RITU1Xb0hYL1VUcXBhc2RaTTZaCkVJaVNseldGUVYxWnpjTVBNVmZ4WjhlT1FWZjVqdHY4NnNhOTc1aFFhOG1WYXh6QTdjTzdiNTJYM200cXhuUWwKK1Voa1dTSC9GWXlEdE9vd3NFSDYvd25LRWY1Y3NiWFpJK2RGQ3EwWjU1b0JrbGcyMDlhSEJPOGUzYm1lZWE1dwpYQ1NBd2JpWm1wM0p1a203ODN5dkRyUWZodTRGQWdNQkFBR2pXVEJYTUE0R0ExVWREd0VCL3dRRUF3SUNwREFQCkJnTlZIUk1CQWY4RUJUQURBUUgvTUIwR0ExVWREZ1FXQkJSd3NlVXh4cHNvOE1qNlZ4Wnl4RDUyYVU5K1pEQVYKQmdOVkhSRUVEakFNZ2dwcmRXSmxjbTVsZEdWek1BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQVVYZFFPN2NSMQpJWUhXVkxEZ0JFUTdJRUJqcjYrSS9MbCt0bzF1STZiQ3o0dmxmMEJ6ZnBaQllCQmFxdzM5dERtaGcwUys5ZnEvClFyL1ZMUHlLeUpuOC9zdmQzbjUzRy9pNC9HM2JGcVc4azc3M3hSK3hkV21TcnAybEFnRGFEU0cxZVlUUEZFN3UKZTQ4T01WcGNRaHNEbmRZY2ExNnJ6LzZ5WlpONkxiY0dXbUV6bEtxN1EyamVsaGNwZnpSWjlqMGJxRTRNSmg1Rgo5cEY2encyMnNKd2pvanhVQzMyVHNGczN4bndMMDRuUDREcHM2TkJBbTFXWmlxbTJJSDJHWHh4SVVFbVpOUWZmCmxET3hIdGJONU5yR2xRVUdrWDJQdUpyOXdFS0lOSWtYaHlYS0tvRngzUFg3d2VSWnB6TWZOR2UrU0JUVkFjTmkKbi9IMjdRODF0L3orCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K",
					},
				},
				Conditions: []models.Condition{
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
				ManagedClusterClientConfigs: []models.ManagedClusterClientConfig{
					{
						URL:      "https://cluster2-control-plane:6443",
						CABundle: "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURCVENDQWUyZ0F3SUJBZ0lJWnhLblFMVFovaG93RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2EzVmlaWEp1WlhSbGN6QWVGdzB5TlRBMU1UUXdPVEk1TXpsYUZ3MHpOVEExTVRJd09UTTBNemxhTUJVeApFekFSQmdOVkJBTVRDbXQxWW1WeWJtVjBaWE13Z2dFaU1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLCkFvSUJBUURndFVaM0JTT3pNWGZWZ3hZM3dpSGh5UGlqVU1Jb3JvYmRaY2FldDlLTnBqcU9RRHloQ05tTzAya1QKeGFkT1RtY0dJMmtPeDNvUE9PRGorWkd3cndXNjdtV0dTeTVHTGI5SlJJc1VydWZ4Rkt3cHk1L291dzBZU3lUVwphMkVNTmp1TS9TYmxHdE5lZHRaRkRVYXY5K015ejU2ZjBEZm1XdlRGNlNudEJLOGNLNEdYUXlPOGFzaC8xL1hOClRYQ2IxbjJldmllUlRiclp3aTR0d2kyQmFBVlc0dTArWmU0TWJaU3h1U01rL2t1UG02TXhVZUdHSXpUY1F2RXUKdjBzSDVPejRqeXRLbGsyR2Z1SXVwSXNQbGVrVWN5dS9wZnpvY0hmZlNpMVpla3YyNW1CMzlWN256TXZONWRjNAo2VXhPbjBjZGIvMU1xenhCVENjL0dDSGR1OHJaQWdNQkFBR2pXVEJYTUE0R0ExVWREd0VCL3dRRUF3SUNwREFQCkJnTlZIUk1CQWY4RUJUQURBUUgvTUIwR0ExVWREZ1FXQkJTSDNmVWdXdG9UTEhYK2ZKUmZScnhuNVViUFd6QVYKQmdOVkhSRUVEakFNZ2dwcmRXSmxjbTVsZEdWek1BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQ1hHd1Fzcjdpbgo3aXlqL3VCZTVPOTR6NVJMck0vZWR4U1M4ZkFIMzJrR2t6d0lzOFdoZUZJVHZuTC96UzBUY0Q4cll0Z3dmSThvCkE2WE1PaGxFVlJML0trQldFR2xLN0dyV0gva2orcjdpRjdTN2FoMzdRQUFSeTlCcGhPc1U1eERyaFAzN2gyMlYKeUVnQjhiWDJJcHJXdEwxZDhTeEVVRHFPMlV3a1VaVmIyK1RtV0lCMnpsT01CU0hjQ016VVNESWx4WTdPSzZXNgpTQ3djSmdtek1uWDFnMUQyZXRGM0p4eW5PU2k4VEoyejRLbFlZQk9tQ01uTHovaWIwVjNHMTNkRVVZamt0YXdxCmp2bHJuM2x5OVNDUThsZUdzNmVLTW4xYUNZZ2dpeUl6MllMbW45bEhHSUhJNU05Y0o1Z2lXcDlPVHM5MUt6d3EKb3FFcVRxaFBHZnhxCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K",
					},
				},
				Conditions: []models.Condition{
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
	list, err := dynamicClient.Resource(client.ManagedClusterResource).List(ctx, metav1.ListOptions{})
	if err != nil {
		if debugMode {
			log.Printf("Error listing clusters: %v", err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to our simplified Cluster format
	clusters := make([]models.Cluster, 0, len(list.Items))
	for _, item := range list.Items {
		// Extract the basic metadata
		cluster := models.Cluster{
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
				claims := make([]models.ClusterClaim, 0, len(clusterClaims))
				for _, c := range clusterClaims {
					claimMap, ok := c.(map[string]interface{})
					if !ok {
						continue
					}

					claim := models.ClusterClaim{}
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

					condition := models.Condition{}

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
				clientConfigs := make([]models.ManagedClusterClientConfig, 0, len(configs))
				for _, c := range configs {
					configMap, ok := c.(map[string]interface{})
					if !ok {
						continue
					}

					config := models.ManagedClusterClientConfig{}
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
				clusterTaints := make([]models.Taint, 0, len(taints))
				for _, t := range taints {
					taintMap, ok := t.(map[string]interface{})
					if !ok {
						continue
					}

					taint := models.Taint{}
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
}

// GetCluster handles retrieving a specific cluster
func GetCluster(c *gin.Context, dynamicClient dynamic.Interface, ctx context.Context, debugMode bool) {
	name := c.Param("name")

	// Check if using mock data
	if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
		// Mock a single cluster based on name
		if name == "mock-cluster-1" {
			mockCluster := models.Cluster{
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
				Conditions: []models.Condition{
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
			mockCluster := models.Cluster{
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
				Conditions: []models.Condition{
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
	item, err := dynamicClient.Resource(client.ManagedClusterResource).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		if debugMode {
			log.Printf("Error getting cluster %s: %v", name, err)
		}
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Cluster %s not found", name)})
		return
	}

	// Convert to our simplified Cluster format
	cluster := models.Cluster{
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
			claims := make([]models.ClusterClaim, 0, len(clusterClaims))
			for _, c := range clusterClaims {
				claimMap, ok := c.(map[string]interface{})
				if !ok {
					continue
				}

				claim := models.ClusterClaim{}
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

				condition := models.Condition{}

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
			clientConfigs := make([]models.ManagedClusterClientConfig, 0, len(configs))
			for _, c := range configs {
				configMap, ok := c.(map[string]interface{})
				if !ok {
					continue
				}

				config := models.ManagedClusterClientConfig{}
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
			clusterTaints := make([]models.Taint, 0, len(taints))
			for _, t := range taints {
				taintMap, ok := t.(map[string]interface{})
				if !ok {
					continue
				}

				taint := models.Taint{}
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
}
