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

// GetPlacements handles retrieving all placements across namespaces
func GetPlacements(c *gin.Context, dynamicClient dynamic.Interface, ctx context.Context, debugMode bool) {
	// Check if using mock data
	if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
		// Return mock data
		mockPlacements := []models.Placement{
			{
				ID:                       "mock-placement-1",
				Name:                     "placement-1",
				Namespace:                "default",
				CreationTimestamp:        time.Now().AddDate(0, -1, 0).Format(time.RFC3339),
				ClusterSets:              []string{"global"},
				NumberOfClusters:         models.IntPtr(3),
				Satisfied:                true,
				NumberOfSelectedClusters: 3,
				DecisionGroups: []models.DecisionGroupStatus{
					{
						DecisionGroupIndex: 0,
						DecisionGroupName:  "group1",
						Decisions:          []string{"cluster1", "cluster2", "cluster3"},
						ClusterCount:       3,
					},
				},
				Conditions: []models.Condition{
					{
						Type:               "PlacementSatisfied",
						Status:             "True",
						LastTransitionTime: time.Now().Format(time.RFC3339),
						Reason:             "PlacementSatisfied",
						Message:            "Placement requirements satisfied",
					},
				},
			},
			{
				ID:                       "mock-placement-2",
				Name:                     "placement-2",
				Namespace:                "openshift-monitoring",
				CreationTimestamp:        time.Now().AddDate(0, -2, 0).Format(time.RFC3339),
				ClusterSets:              []string{"production"},
				NumberOfClusters:         models.IntPtr(2),
				Satisfied:                true,
				NumberOfSelectedClusters: 2,
				DecisionGroups: []models.DecisionGroupStatus{
					{
						DecisionGroupIndex: 0,
						DecisionGroupName:  "group1",
						Decisions:          []string{"cluster4", "cluster5"},
						ClusterCount:       2,
					},
				},
				Conditions: []models.Condition{
					{
						Type:               "PlacementSatisfied",
						Status:             "True",
						LastTransitionTime: time.Now().Format(time.RFC3339),
						Reason:             "Placement requirements satisfied",
						Message:            "Placement requirements satisfied",
					},
				},
			},
		}
		c.JSON(http.StatusOK, mockPlacements)
		return
	}

	// Ensure we have a client before proceeding
	if dynamicClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
		return
	}

	// Normal processing - list real placements across all namespaces
	list, err := dynamicClient.Resource(client.PlacementResource).List(ctx, metav1.ListOptions{})
	if err != nil {
		if debugMode {
			log.Printf("Error listing placements: %v", err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to our simplified Placement format
	placements := make([]models.Placement, 0, len(list.Items))
	for _, item := range list.Items {
		placement := convertUnstructuredToPlacement(item, debugMode)
		placements = append(placements, placement)
	}

	c.JSON(http.StatusOK, placements)
}

// GetPlacementsByNamespace handles retrieving placements for a specific namespace
func GetPlacementsByNamespace(c *gin.Context, dynamicClient dynamic.Interface, ctx context.Context, debugMode bool) {
	namespace := c.Param("namespace")

	// Check if using mock data
	if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
		// Return mock data filtered for the namespace
		if namespace == "default" {
			mockPlacement := models.Placement{
				ID:                       "mock-placement-1",
				Name:                     "placement-1",
				Namespace:                "default",
				CreationTimestamp:        time.Now().AddDate(0, -1, 0).Format(time.RFC3339),
				ClusterSets:              []string{"global"},
				NumberOfClusters:         models.IntPtr(3),
				Satisfied:                true,
				NumberOfSelectedClusters: 3,
				DecisionGroups: []models.DecisionGroupStatus{
					{
						DecisionGroupIndex: 0,
						DecisionGroupName:  "group1",
						Decisions:          []string{"cluster1", "cluster2", "cluster3"},
						ClusterCount:       3,
					},
				},
				Conditions: []models.Condition{
					{
						Type:               "PlacementSatisfied",
						Status:             "True",
						LastTransitionTime: time.Now().Format(time.RFC3339),
						Reason:             "Placement requirements satisfied",
						Message:            "Placement requirements satisfied",
					},
				},
			}
			c.JSON(http.StatusOK, []models.Placement{mockPlacement})
		} else if namespace == "openshift-monitoring" {
			mockPlacement := models.Placement{
				ID:                       "mock-placement-2",
				Name:                     "placement-2",
				Namespace:                "openshift-monitoring",
				CreationTimestamp:        time.Now().AddDate(0, -2, 0).Format(time.RFC3339),
				ClusterSets:              []string{"production"},
				NumberOfClusters:         models.IntPtr(2),
				Satisfied:                true,
				NumberOfSelectedClusters: 2,
				DecisionGroups: []models.DecisionGroupStatus{
					{
						DecisionGroupIndex: 0,
						DecisionGroupName:  "group1",
						Decisions:          []string{"cluster4", "cluster5"},
						ClusterCount:       2,
					},
				},
				Conditions: []models.Condition{
					{
						Type:               "PlacementSatisfied",
						Status:             "True",
						LastTransitionTime: time.Now().Format(time.RFC3339),
						Reason:             "Placement requirements satisfied",
						Message:            "Placement requirements satisfied",
					},
				},
			}
			c.JSON(http.StatusOK, []models.Placement{mockPlacement})
		} else {
			c.JSON(http.StatusOK, []models.Placement{})
		}
		return
	}

	// Ensure we have a client before proceeding
	if dynamicClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
		return
	}

	// List real placements for the specified namespace
	list, err := dynamicClient.Resource(client.PlacementResource).Namespace(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		if debugMode {
			log.Printf("Error listing placements in namespace %s: %v", namespace, err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to our simplified Placement format
	placements := make([]models.Placement, 0, len(list.Items))
	for _, item := range list.Items {
		placement := convertUnstructuredToPlacement(item, debugMode)
		placements = append(placements, placement)
	}

	c.JSON(http.StatusOK, placements)
}

// GetPlacement handles retrieving a specific placement
func GetPlacement(c *gin.Context, dynamicClient dynamic.Interface, ctx context.Context, debugMode bool) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	// Check if using mock data
	if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
		// Return mock data for the specific placement
		if namespace == "default" && name == "placement-1" {
			mockPlacement := models.Placement{
				ID:                       "mock-placement-1",
				Name:                     "placement-1",
				Namespace:                "default",
				CreationTimestamp:        time.Now().AddDate(0, -1, 0).Format(time.RFC3339),
				ClusterSets:              []string{"global"},
				NumberOfClusters:         models.IntPtr(3),
				Satisfied:                true,
				NumberOfSelectedClusters: 3,
				Predicates: []models.Predicate{
					{
						RequiredClusterSelector: &models.RequiredClusterSelector{
							LabelSelector: &models.LabelSelectorWithExpressions{
								MatchLabels: map[string]string{
									"vendor": "OpenShift",
								},
							},
						},
					},
				},
				DecisionGroups: []models.DecisionGroupStatus{
					{
						DecisionGroupIndex: 0,
						DecisionGroupName:  "group1",
						Decisions:          []string{"cluster1", "cluster2", "cluster3"},
						ClusterCount:       3,
					},
				},
				Conditions: []models.Condition{
					{
						Type:               "PlacementSatisfied",
						Status:             "True",
						LastTransitionTime: time.Now().Format(time.RFC3339),
						Reason:             "PlacementSatisfied",
						Message:            "Placement requirements satisfied",
					},
				},
			}
			c.JSON(http.StatusOK, mockPlacement)
		} else if namespace == "openshift-monitoring" && name == "placement-2" {
			mockPlacement := models.Placement{
				ID:                       "mock-placement-2",
				Name:                     "placement-2",
				Namespace:                "openshift-monitoring",
				CreationTimestamp:        time.Now().AddDate(0, -2, 0).Format(time.RFC3339),
				ClusterSets:              []string{"production"},
				NumberOfClusters:         models.IntPtr(2),
				Satisfied:                true,
				NumberOfSelectedClusters: 2,
				Predicates: []models.Predicate{
					{
						RequiredClusterSelector: &models.RequiredClusterSelector{
							LabelSelector: &models.LabelSelectorWithExpressions{
								MatchLabels: map[string]string{
									"env": "production",
								},
							},
						},
					},
				},
				DecisionGroups: []models.DecisionGroupStatus{
					{
						DecisionGroupIndex: 0,
						DecisionGroupName:  "group1",
						Decisions:          []string{"cluster4", "cluster5"},
						ClusterCount:       2,
					},
				},
				Conditions: []models.Condition{
					{
						Type:               "PlacementSatisfied",
						Status:             "True",
						LastTransitionTime: time.Now().Format(time.RFC3339),
						Reason:             "PlacementSatisfied",
						Message:            "Placement requirements satisfied",
					},
				},
			}
			c.JSON(http.StatusOK, mockPlacement)
		} else {
			c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Mock placement %s not found in namespace %s", name, namespace)})
		}
		return
	}

	// Ensure we have a client before proceeding
	if dynamicClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
		return
	}

	// Get the real placement
	item, err := dynamicClient.Resource(client.PlacementResource).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		if debugMode {
			log.Printf("Error getting placement %s in namespace %s: %v", name, namespace, err)
		}
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Placement %s not found in namespace %s", name, namespace)})
		return
	}

	// Convert to our simplified Placement format
	placement := convertUnstructuredToPlacement(*item, debugMode)
	c.JSON(http.StatusOK, placement)
}

// GetPlacementDecisions handles retrieving decisions for a placement
func GetPlacementDecisions(c *gin.Context, dynamicClient dynamic.Interface, ctx context.Context, debugMode bool) {
	namespace := c.Param("namespace")
	placementName := c.Param("name")

	// Check if using mock data
	if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
		// Return mock data for the specific placement decisions
		if namespace == "default" && placementName == "placement-1" {
			mockDecisions := []models.PlacementDecision{
				{
					ID:        "mock-decision-1",
					Name:      placementName + "-decision-1",
					Namespace: namespace,
					Decisions: []models.ClusterDecision{
						{
							ClusterName: "cluster1",
							Reason:      "Selected by placement",
						},
						{
							ClusterName: "cluster2",
							Reason:      "Selected by placement",
						},
						{
							ClusterName: "cluster3",
							Reason:      "Selected by placement",
						},
					},
				},
			}
			c.JSON(http.StatusOK, mockDecisions)
		} else if namespace == "openshift-monitoring" && placementName == "placement-2" {
			mockDecisions := []models.PlacementDecision{
				{
					ID:        "mock-decision-2",
					Name:      placementName + "-decision-1",
					Namespace: namespace,
					Decisions: []models.ClusterDecision{
						{
							ClusterName: "cluster4",
							Reason:      "Selected by placement",
						},
						{
							ClusterName: "cluster5",
							Reason:      "Selected by placement",
						},
					},
				},
			}
			c.JSON(http.StatusOK, mockDecisions)
		} else {
			c.JSON(http.StatusOK, []models.PlacementDecision{})
		}
		return
	}

	// Ensure we have a client before proceeding
	if dynamicClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
		return
	}

	// List placement decisions for this placement
	// We need to use a label selector to find decisions related to this placement
	listOptions := metav1.ListOptions{
		LabelSelector: fmt.Sprintf("cluster.open-cluster-management.io/placement=%s", placementName),
	}

	list, err := dynamicClient.Resource(client.PlacementDecisionResource).Namespace(namespace).List(ctx, listOptions)
	if err != nil {
		if debugMode {
			log.Printf("Error listing placement decisions for placement %s in namespace %s: %v", placementName, namespace, err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to our simplified PlacementDecision format
	decisions := make([]models.PlacementDecision, 0, len(list.Items))
	for _, item := range list.Items {
		decision := models.PlacementDecision{
			ID:        string(item.GetUID()),
			Name:      item.GetName(),
			Namespace: item.GetNamespace(),
		}

		// Extract status for the decisions
		status, found, err := unstructured.NestedMap(item.Object, "status")
		if err == nil && found {
			// Extract decisions
			if decisionItems, found, _ := unstructured.NestedSlice(status, "decisions"); found {
				for _, d := range decisionItems {
					decisionMap, ok := d.(map[string]interface{})
					if !ok {
						continue
					}

					clusterDecision := models.ClusterDecision{}

					if clusterName, found, _ := unstructured.NestedString(decisionMap, "clusterName"); found {
						clusterDecision.ClusterName = clusterName
					}

					if reason, found, _ := unstructured.NestedString(decisionMap, "reason"); found {
						clusterDecision.Reason = reason
					} else {
						clusterDecision.Reason = "Selected by placement"
					}

					decision.Decisions = append(decision.Decisions, clusterDecision)
				}
			}
		}

		decisions = append(decisions, decision)
	}

	c.JSON(http.StatusOK, decisions)
}

// Helper function to convert unstructured.Unstructured to models.Placement
func convertUnstructuredToPlacement(item unstructured.Unstructured, debugMode bool) models.Placement {
	// Extract the basic metadata
	placement := models.Placement{
		ID:                string(item.GetUID()),
		Name:              item.GetName(),
		Namespace:         item.GetNamespace(),
		CreationTimestamp: item.GetCreationTimestamp().Format(time.RFC3339),
		Satisfied:         false, // Default to false, will update if the PlacementSatisfied condition is True
	}

	// Extract spec
	spec, found, err := unstructured.NestedMap(item.Object, "spec")
	if err == nil && found {
		// Extract clusterSets
		if clusterSets, found, _ := unstructured.NestedStringSlice(spec, "clusterSets"); found {
			placement.ClusterSets = clusterSets
		}

		// Extract numberOfClusters
		if numberOfClusters, found, _ := unstructured.NestedInt64(spec, "numberOfClusters"); found {
			val := int32(numberOfClusters)
			placement.NumberOfClusters = &val
		}

		// Extract predicates
		if predicates, found, _ := unstructured.NestedSlice(spec, "predicates"); found {
			for _, p := range predicates {
				predMap, ok := p.(map[string]interface{})
				if !ok {
					continue
				}

				predicate := models.Predicate{}

				// Extract requiredClusterSelector
				if requiredSelector, found, _ := unstructured.NestedMap(predMap, "requiredClusterSelector"); found {
					predicate.RequiredClusterSelector = &models.RequiredClusterSelector{}

					// Extract labelSelector
					if labelSelector, found, _ := unstructured.NestedMap(requiredSelector, "labelSelector"); found {
						predicate.RequiredClusterSelector.LabelSelector = &models.LabelSelectorWithExpressions{}

						// Extract matchLabels
						if matchLabels, found, _ := unstructured.NestedMap(labelSelector, "matchLabels"); found {
							predicate.RequiredClusterSelector.LabelSelector.MatchLabels = make(map[string]string)
							for k, v := range matchLabels {
								if strValue, ok := v.(string); ok {
									predicate.RequiredClusterSelector.LabelSelector.MatchLabels[k] = strValue
								}
							}
						}

						// Extract matchExpressions
						if matchExpressions, found, _ := unstructured.NestedSlice(labelSelector, "matchExpressions"); found {
							for _, me := range matchExpressions {
								exprMap, ok := me.(map[string]interface{})
								if !ok {
									continue
								}

								expr := models.MatchExpression{}

								if key, found, _ := unstructured.NestedString(exprMap, "key"); found {
									expr.Key = key
								}

								if operator, found, _ := unstructured.NestedString(exprMap, "operator"); found {
									expr.Operator = operator
								}

								if values, found, _ := unstructured.NestedStringSlice(exprMap, "values"); found {
									expr.Values = values
								}

								predicate.RequiredClusterSelector.LabelSelector.MatchExpressions = append(
									predicate.RequiredClusterSelector.LabelSelector.MatchExpressions, expr)
							}
						}
					}

					// Extract claimSelector
					if claimSelector, found, _ := unstructured.NestedMap(requiredSelector, "claimSelector"); found {
						predicate.RequiredClusterSelector.ClaimSelector = &models.ClaimSelectorWithExpressions{}

						// Extract matchExpressions
						if matchExpressions, found, _ := unstructured.NestedSlice(claimSelector, "matchExpressions"); found {
							for _, me := range matchExpressions {
								exprMap, ok := me.(map[string]interface{})
								if !ok {
									continue
								}

								expr := models.MatchExpression{}

								if key, found, _ := unstructured.NestedString(exprMap, "key"); found {
									expr.Key = key
								}

								if operator, found, _ := unstructured.NestedString(exprMap, "operator"); found {
									expr.Operator = operator
								}

								if values, found, _ := unstructured.NestedStringSlice(exprMap, "values"); found {
									expr.Values = values
								}

								predicate.RequiredClusterSelector.ClaimSelector.MatchExpressions = append(
									predicate.RequiredClusterSelector.ClaimSelector.MatchExpressions, expr)
							}
						}
					}

					// Extract celSelector
					if celSelector, found, _ := unstructured.NestedMap(requiredSelector, "celSelector"); found {
						predicate.RequiredClusterSelector.CelSelector = &models.CelSelectorWithExpressions{}

						// Extract celExpressions
						if celExpressions, found, _ := unstructured.NestedStringSlice(celSelector, "celExpressions"); found {
							predicate.RequiredClusterSelector.CelSelector.CelExpressions = celExpressions
						}
					}
				}

				placement.Predicates = append(placement.Predicates, predicate)
			}
		}

		// Extract prioritizerPolicy
		if prioritizerPolicy, found, _ := unstructured.NestedMap(spec, "prioritizerPolicy"); found {
			placement.PrioritizerPolicy = &models.PrioritizerPolicy{}

			// Extract mode
			if mode, found, _ := unstructured.NestedString(prioritizerPolicy, "mode"); found {
				placement.PrioritizerPolicy.Mode = mode
			}

			// Extract configurations
			if configs, found, _ := unstructured.NestedSlice(prioritizerPolicy, "configurations"); found {
				for _, c := range configs {
					configMap, ok := c.(map[string]interface{})
					if !ok {
						continue
					}

					config := models.PrioritizerConfig{}

					// Extract weight
					if weight, found, _ := unstructured.NestedInt64(configMap, "weight"); found {
						config.Weight = int32(weight)
					}

					// Extract scoreCoordinate
					if scoreCoord, found, _ := unstructured.NestedMap(configMap, "scoreCoordinate"); found {
						config.ScoreCoordinate = &models.ScoreCoordinate{}

						if coordType, found, _ := unstructured.NestedString(scoreCoord, "type"); found {
							config.ScoreCoordinate.Type = coordType
						}

						if builtIn, found, _ := unstructured.NestedString(scoreCoord, "builtIn"); found {
							config.ScoreCoordinate.BuiltIn = builtIn
						}

						// Extract addOn
						if addOn, found, _ := unstructured.NestedMap(scoreCoord, "addOn"); found {
							config.ScoreCoordinate.AddOn = &models.AddOnScore{}

							if resourceName, found, _ := unstructured.NestedString(addOn, "resourceName"); found {
								config.ScoreCoordinate.AddOn.ResourceName = resourceName
							}

							if scoreName, found, _ := unstructured.NestedString(addOn, "scoreName"); found {
								config.ScoreCoordinate.AddOn.ScoreName = scoreName
							}
						}
					}

					placement.PrioritizerPolicy.Configurations = append(placement.PrioritizerPolicy.Configurations, config)
				}
			}
		}

		// Extract decisionStrategy
		if decisionStrategy, found, _ := unstructured.NestedMap(spec, "decisionStrategy"); found {
			placement.DecisionStrategy = &models.DecisionStrategy{}

			// Extract groupStrategy
			if groupStrategy, found, _ := unstructured.NestedMap(decisionStrategy, "groupStrategy"); found {
				// Extract clustersPerDecisionGroup
				if cpd, found, _ := unstructured.NestedString(groupStrategy, "clustersPerDecisionGroup"); found {
					placement.DecisionStrategy.GroupStrategy.ClustersPerDecisionGroup = cpd
				}

				// Extract decisionGroups
				if groups, found, _ := unstructured.NestedSlice(groupStrategy, "decisionGroups"); found {
					for _, g := range groups {
						groupMap, ok := g.(map[string]interface{})
						if !ok {
							continue
						}

						group := models.DecisionGroup{}

						if name, found, _ := unstructured.NestedString(groupMap, "groupName"); found {
							group.GroupName = name
						}

						// Extract groupClusterSelector
						if selector, found, _ := unstructured.NestedMap(groupMap, "groupClusterSelector"); found {
							// Extract labelSelector
							if labelSelector, found, _ := unstructured.NestedMap(selector, "labelSelector"); found {
								group.GroupClusterSelector.LabelSelector = &models.LabelSelectorWithExpressions{}

								// Extract matchLabels
								if matchLabels, found, _ := unstructured.NestedMap(labelSelector, "matchLabels"); found {
									group.GroupClusterSelector.LabelSelector.MatchLabels = make(map[string]string)
									for k, v := range matchLabels {
										if strValue, ok := v.(string); ok {
											group.GroupClusterSelector.LabelSelector.MatchLabels[k] = strValue
										}
									}
								}

								// Extract matchExpressions
								if matchExpressions, found, _ := unstructured.NestedSlice(labelSelector, "matchExpressions"); found {
									for _, me := range matchExpressions {
										exprMap, ok := me.(map[string]interface{})
										if !ok {
											continue
										}

										expr := models.MatchExpression{}

										if key, found, _ := unstructured.NestedString(exprMap, "key"); found {
											expr.Key = key
										}

										if operator, found, _ := unstructured.NestedString(exprMap, "operator"); found {
											expr.Operator = operator
										}

										if values, found, _ := unstructured.NestedStringSlice(exprMap, "values"); found {
											expr.Values = values
										}

										group.GroupClusterSelector.LabelSelector.MatchExpressions = append(
											group.GroupClusterSelector.LabelSelector.MatchExpressions, expr)
									}
								}
							}
						}

						placement.DecisionStrategy.GroupStrategy.DecisionGroups = append(
							placement.DecisionStrategy.GroupStrategy.DecisionGroups, group)
					}
				}
			}
		}

		// Extract tolerations
		if tolerations, found, _ := unstructured.NestedSlice(spec, "tolerations"); found {
			for _, t := range tolerations {
				tolMap, ok := t.(map[string]interface{})
				if !ok {
					continue
				}

				toleration := models.PlacementToleration{}

				if key, found, _ := unstructured.NestedString(tolMap, "key"); found {
					toleration.Key = key
				}

				if operator, found, _ := unstructured.NestedString(tolMap, "operator"); found {
					toleration.Operator = operator
				}

				if value, found, _ := unstructured.NestedString(tolMap, "value"); found {
					toleration.Value = value
				}

				if effect, found, _ := unstructured.NestedString(tolMap, "effect"); found {
					toleration.Effect = effect
				}

				if seconds, found, _ := unstructured.NestedInt64(tolMap, "tolerationSeconds"); found {
					toleration.TolerationSeconds = &seconds
				}

				placement.Tolerations = append(placement.Tolerations, toleration)
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

				placement.Conditions = append(placement.Conditions, condition)

				// Update the satisfied field based on the PlacementSatisfied condition
				if condition.Type == "PlacementSatisfied" && condition.Status == "True" {
					placement.Satisfied = true
				}
			}
		}

		// Extract numberOfSelectedClusters
		if numSelected, found, _ := unstructured.NestedInt64(status, "numberOfSelectedClusters"); found {
			placement.NumberOfSelectedClusters = int32(numSelected)
		}

		// Extract decisionGroups
		if decisionGroups, found, _ := unstructured.NestedSlice(status, "decisionGroups"); found {
			for _, dg := range decisionGroups {
				dgMap, ok := dg.(map[string]interface{})
				if !ok {
					continue
				}

				decisionGroup := models.DecisionGroupStatus{}

				if idx, found, _ := unstructured.NestedInt64(dgMap, "decisionGroupIndex"); found {
					decisionGroup.DecisionGroupIndex = int32(idx)
				}

				if name, found, _ := unstructured.NestedString(dgMap, "decisionGroupName"); found {
					decisionGroup.DecisionGroupName = name
				}

				if decisions, found, _ := unstructured.NestedStringSlice(dgMap, "decisions"); found {
					decisionGroup.Decisions = decisions
				}

				if count, found, _ := unstructured.NestedInt64(dgMap, "clusterCount"); found {
					decisionGroup.ClusterCount = int32(count)
				}

				placement.DecisionGroups = append(placement.DecisionGroups, decisionGroup)
			}
		}
	}

	return placement
}
