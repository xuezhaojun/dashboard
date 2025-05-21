package handlers

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	clusterv1 "open-cluster-management.io/api/cluster/v1"

	"github.com/xuezhaojun/ocm-dashboard/backend/pkg/client"
	"github.com/xuezhaojun/ocm-dashboard/backend/pkg/models"
)

// GetClusters handles retrieving all clusters
func GetClusters(c *gin.Context, ocmClient *client.OCMClient, ctx context.Context, debugMode bool) {
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
	if ocmClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
		return
	}

	// Use the OCM typed client to list ManagedClusters
	clusterList, err := ocmClient.ClusterClient.ClusterV1().ManagedClusters().List(ctx, metav1.ListOptions{})
	if err != nil {
		if debugMode {
			log.Printf("Error listing clusters: %v", err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to our simplified Cluster format
	clusters := make([]models.Cluster, 0, len(clusterList.Items))
	for _, item := range clusterList.Items {
		// Create a cluster object from the ManagedCluster
		cluster := convertManagedClusterToCluster(item)
		clusters = append(clusters, cluster)
	}

	c.JSON(http.StatusOK, clusters)
}

// GetCluster handles retrieving a specific cluster by name
func GetCluster(c *gin.Context, ocmClient *client.OCMClient, ctx context.Context, debugMode bool) {
	name := c.Param("name")

	// Check if using mock data
	if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
		// Just return one of our mock clusters
		mockCluster := models.Cluster{
			ID:                name,
			Name:              name,
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
		}
		c.JSON(http.StatusOK, mockCluster)
		return
	}

	// Ensure we have a client before proceeding
	if ocmClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
		return
	}

	// Use the OCM typed client to get a specific ManagedCluster
	managedCluster, err := ocmClient.ClusterClient.ClusterV1().ManagedClusters().Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		if debugMode {
			log.Printf("Error getting cluster %s: %v", name, err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to our simplified Cluster format
	cluster := convertManagedClusterToCluster(*managedCluster)

	c.JSON(http.StatusOK, cluster)
}

// Helper function to convert a ManagedCluster to our simplified Cluster model
func convertManagedClusterToCluster(managedCluster clusterv1.ManagedCluster) models.Cluster {
	cluster := models.Cluster{
		ID:                string(managedCluster.ObjectMeta.UID),
		Name:              managedCluster.ObjectMeta.Name,
		Labels:            managedCluster.ObjectMeta.Labels,
		CreationTimestamp: managedCluster.ObjectMeta.CreationTimestamp.Format(time.RFC3339),
		Status:            "Unknown",
	}

	// Extract Kubernetes version
	if managedCluster.Status.Version.Kubernetes != "" {
		cluster.Version = managedCluster.Status.Version.Kubernetes
	}

	// Extract capacity and allocatable resources
	if len(managedCluster.Status.Capacity) > 0 {
		resourceMap := make(map[string]string)
		for k, v := range managedCluster.Status.Capacity {
			resourceMap[string(k)] = v.String()
		}
		cluster.Capacity = resourceMap
	}

	if len(managedCluster.Status.Allocatable) > 0 {
		resourceMap := make(map[string]string)
		for k, v := range managedCluster.Status.Allocatable {
			resourceMap[string(k)] = v.String()
		}
		cluster.Allocatable = resourceMap
	}

	// Convert cluster claims
	if len(managedCluster.Status.ClusterClaims) > 0 {
		claims := make([]models.ClusterClaim, 0, len(managedCluster.Status.ClusterClaims))
		for _, c := range managedCluster.Status.ClusterClaims {
			claims = append(claims, models.ClusterClaim{
				Name:  c.Name,
				Value: c.Value,
			})
		}
		cluster.ClusterClaims = claims
	}

	// Convert conditions
	if len(managedCluster.Status.Conditions) > 0 {
		conditions := make([]models.Condition, 0, len(managedCluster.Status.Conditions))
		for _, c := range managedCluster.Status.Conditions {
			conditions = append(conditions, models.Condition{
				Type:               string(c.Type),
				Status:             string(c.Status),
				LastTransitionTime: c.LastTransitionTime.Format(time.RFC3339),
				Reason:             c.Reason,
				Message:            c.Message,
			})

			// Update status based on ManagedClusterConditionAvailable condition
			if c.Type == clusterv1.ManagedClusterConditionAvailable && c.Status == metav1.ConditionTrue {
				cluster.Status = "Online"
			} else if c.Type == clusterv1.ManagedClusterConditionAvailable && c.Status != metav1.ConditionTrue {
				cluster.Status = "Offline"
			}
		}
		cluster.Conditions = conditions
	}

	// Add cluster client configs
	if len(managedCluster.Spec.ManagedClusterClientConfigs) > 0 {
		configs := make([]models.ManagedClusterClientConfig, 0, len(managedCluster.Spec.ManagedClusterClientConfigs))
		for _, cc := range managedCluster.Spec.ManagedClusterClientConfigs {
			configs = append(configs, models.ManagedClusterClientConfig{
				URL:      cc.URL,
				CABundle: string(cc.CABundle),
			})
		}
		cluster.ManagedClusterClientConfigs = configs
	}

	return cluster
}
