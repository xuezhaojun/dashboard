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

// GetClusterSets handles retrieving all cluster sets
func GetClusterSets(c *gin.Context, dynamicClient dynamic.Interface, ctx context.Context, debugMode bool) {
	// Check if using mock data
	if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
		// Return mock data
		mockClusterSets := []models.ClusterSet{
			{
				ID:                "mock-clusterset-1",
				Name:              "global",
				ClusterCount:      3,
				CreationTimestamp: time.Now().AddDate(0, -1, 0).Format(time.RFC3339),
				Labels: map[string]string{
					"vendor": "OpenShift",
				},
				Spec: models.ClusterSetSpec{
					ClusterSelector: models.ClusterSelector{
						SelectorType: "LabelSelector",
						LabelSelector: &models.LabelSelector{
							MatchLabels: map[string]string{
								"vendor": "OpenShift",
							},
						},
					},
				},
				Status: models.ClusterSetStatus{
					Conditions: []models.Condition{
						{
							Type:               "ClusterSetBound",
							Status:             "True",
							LastTransitionTime: time.Now().Format(time.RFC3339),
							Reason:             "ClustersSelected",
							Message:            "Cluster selector is configured",
						},
					},
				},
			},
			{
				ID:                "mock-clusterset-2",
				Name:              "production",
				ClusterCount:      2,
				CreationTimestamp: time.Now().AddDate(0, -2, 0).Format(time.RFC3339),
				Labels: map[string]string{
					"environment": "production",
				},
				Spec: models.ClusterSetSpec{
					ClusterSelector: models.ClusterSelector{
						SelectorType: "LabelSelector",
						LabelSelector: &models.LabelSelector{
							MatchLabels: map[string]string{
								"env": "production",
							},
						},
					},
				},
				Status: models.ClusterSetStatus{
					Conditions: []models.Condition{
						{
							Type:               "ClusterSetBound",
							Status:             "True",
							LastTransitionTime: time.Now().Format(time.RFC3339),
							Reason:             "ClustersSelected",
							Message:            "Cluster selector is configured",
						},
					},
				},
			},
		}
		c.JSON(http.StatusOK, mockClusterSets)
		return
	}

	// Ensure we have a client before proceeding
	if dynamicClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
		return
	}

	// Normal processing - list real managed cluster sets
	list, err := dynamicClient.Resource(client.ManagedClusterSetResource).List(ctx, metav1.ListOptions{})
	if err != nil {
		if debugMode {
			log.Printf("Error listing cluster sets: %v", err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to our simplified ClusterSet format
	clusterSets := make([]models.ClusterSet, 0, len(list.Items))
	for _, item := range list.Items {
		// Extract the basic metadata
		clusterSet := models.ClusterSet{
			ID:                string(item.GetUID()),
			Name:              item.GetName(),
			Labels:            item.GetLabels(),
			CreationTimestamp: item.GetCreationTimestamp().Format(time.RFC3339),
		}

		// Extract spec
		spec, found, err := unstructured.NestedMap(item.Object, "spec")
		if err == nil && found {
			// Extract cluster selector
			if clusterSelector, found, _ := unstructured.NestedMap(spec, "clusterSelector"); found {
				selectorType, found, _ := unstructured.NestedString(clusterSelector, "selectorType")
				if found {
					clusterSet.Spec.ClusterSelector.SelectorType = selectorType
				}

				// Extract label selector
				if labelSelector, found, _ := unstructured.NestedMap(clusterSelector, "labelSelector"); found {
					clusterSet.Spec.ClusterSelector.LabelSelector = &models.LabelSelector{}

					// Extract match labels
					if matchLabels, found, _ := unstructured.NestedMap(labelSelector, "matchLabels"); found {
						clusterSet.Spec.ClusterSelector.LabelSelector.MatchLabels = make(map[string]string)
						for k, v := range matchLabels {
							if strValue, ok := v.(string); ok {
								clusterSet.Spec.ClusterSelector.LabelSelector.MatchLabels[k] = strValue
							}
						}
					}
				}
			}
		}

		// Extract status
		status, found, err := unstructured.NestedMap(item.Object, "status")
		if err == nil && found {
			// Extract conditions
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

					clusterSet.Status.Conditions = append(clusterSet.Status.Conditions, condition)
				}
			}

			// Extract cluster count
			if countMap, found, _ := unstructured.NestedMap(status, "clusterSets"); found {
				clusterSet.ClusterCount = len(countMap)
			} else {
				// If no specific count is available, set to 0
				clusterSet.ClusterCount = 0
			}
		}

		clusterSets = append(clusterSets, clusterSet)
	}

	c.JSON(http.StatusOK, clusterSets)
}

// GetClusterSet handles retrieving a specific cluster set
func GetClusterSet(c *gin.Context, dynamicClient dynamic.Interface, ctx context.Context, debugMode bool) {
	name := c.Param("name")

	// Check if using mock data
	if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
		// Mock a single cluster set based on name
		if name == "global" {
			mockClusterSet := models.ClusterSet{
				ID:                "mock-clusterset-1",
				Name:              "global",
				ClusterCount:      3,
				CreationTimestamp: time.Now().AddDate(0, -1, 0).Format(time.RFC3339),
				Labels: map[string]string{
					"vendor": "OpenShift",
				},
				Spec: models.ClusterSetSpec{
					ClusterSelector: models.ClusterSelector{
						SelectorType: "LabelSelector",
						LabelSelector: &models.LabelSelector{
							MatchLabels: map[string]string{
								"vendor": "OpenShift",
							},
						},
					},
				},
				Status: models.ClusterSetStatus{
					Conditions: []models.Condition{
						{
							Type:               "ClusterSetBound",
							Status:             "True",
							LastTransitionTime: time.Now().Format(time.RFC3339),
							Reason:             "ClustersSelected",
							Message:            "Cluster selector is configured",
						},
					},
				},
			}
			c.JSON(http.StatusOK, mockClusterSet)
			return
		} else if name == "production" {
			mockClusterSet := models.ClusterSet{
				ID:                "mock-clusterset-2",
				Name:              "production",
				ClusterCount:      2,
				CreationTimestamp: time.Now().AddDate(0, -2, 0).Format(time.RFC3339),
				Labels: map[string]string{
					"environment": "production",
				},
				Spec: models.ClusterSetSpec{
					ClusterSelector: models.ClusterSelector{
						SelectorType: "LabelSelector",
						LabelSelector: &models.LabelSelector{
							MatchLabels: map[string]string{
								"env": "production",
							},
						},
					},
				},
				Status: models.ClusterSetStatus{
					Conditions: []models.Condition{
						{
							Type:               "ClusterSetBound",
							Status:             "True",
							LastTransitionTime: time.Now().Format(time.RFC3339),
							Reason:             "ClustersSelected",
							Message:            "Cluster selector is configured",
						},
					},
				},
			}
			c.JSON(http.StatusOK, mockClusterSet)
			return
		} else {
			c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Mock cluster set %s not found", name)})
			return
		}
	}

	// Ensure we have a client before proceeding
	if dynamicClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
		return
	}

	// Get the real cluster set
	item, err := dynamicClient.Resource(client.ManagedClusterSetResource).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		if debugMode {
			log.Printf("Error getting cluster set %s: %v", name, err)
		}
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Cluster set %s not found", name)})
		return
	}

	// Extract the basic metadata
	clusterSet := models.ClusterSet{
		ID:                string(item.GetUID()),
		Name:              item.GetName(),
		Labels:            item.GetLabels(),
		CreationTimestamp: item.GetCreationTimestamp().Format(time.RFC3339),
	}

	// Extract spec
	spec, found, err := unstructured.NestedMap(item.Object, "spec")
	if err == nil && found {
		// Extract cluster selector
		if clusterSelector, found, _ := unstructured.NestedMap(spec, "clusterSelector"); found {
			selectorType, found, _ := unstructured.NestedString(clusterSelector, "selectorType")
			if found {
				clusterSet.Spec.ClusterSelector.SelectorType = selectorType
			}

			// Extract label selector
			if labelSelector, found, _ := unstructured.NestedMap(clusterSelector, "labelSelector"); found {
				clusterSet.Spec.ClusterSelector.LabelSelector = &models.LabelSelector{}

				// Extract match labels
				if matchLabels, found, _ := unstructured.NestedMap(labelSelector, "matchLabels"); found {
					clusterSet.Spec.ClusterSelector.LabelSelector.MatchLabels = make(map[string]string)
					for k, v := range matchLabels {
						if strValue, ok := v.(string); ok {
							clusterSet.Spec.ClusterSelector.LabelSelector.MatchLabels[k] = strValue
						}
					}
				}
			}
		}
	}

	// Extract status
	status, found, err := unstructured.NestedMap(item.Object, "status")
	if err == nil && found {
		// Extract conditions
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

				clusterSet.Status.Conditions = append(clusterSet.Status.Conditions, condition)
			}
		}

		// Extract cluster count
		if countMap, found, _ := unstructured.NestedMap(status, "clusterSets"); found {
			clusterSet.ClusterCount = len(countMap)
		} else {
			// If no specific count is available, set to 0
			clusterSet.ClusterCount = 0
		}
	}

	c.JSON(http.StatusOK, clusterSet)
}
