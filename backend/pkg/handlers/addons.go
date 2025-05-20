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

// GetClusterAddons handles retrieving all addons for a specific cluster
func GetClusterAddons(c *gin.Context, dynamicClient dynamic.Interface, ctx context.Context, debugMode bool) {
	clusterName := c.Param("name")

	// Check if using mock data
	if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
		// Return mock data for addons
		mockAddons := []models.ManagedClusterAddon{
			{
				ID:                clusterName + "-managed-serviceaccount",
				Name:              "managed-serviceaccount",
				Namespace:         clusterName,
				InstallNamespace:  "open-cluster-management-agent-addon",
				CreationTimestamp: "2025-05-20T08:52:35Z",
				Conditions: []models.Condition{
					{
						Type:               "Progressing",
						Status:             "False",
						Reason:             "Completed",
						Message:            "completed with no errors.",
						LastTransitionTime: "2025-05-20T08:52:35Z",
					},
					{
						Type:               "Configured",
						Status:             "True",
						Reason:             "ConfigurationsConfigured",
						Message:            "Configurations configured",
						LastTransitionTime: "2025-05-20T08:52:35Z",
					},
					{
						Type:               "Available",
						Status:             "True",
						Reason:             "ManagedClusterAddOnLeaseUpdated",
						Message:            "managed-serviceaccount add-on is available.",
						LastTransitionTime: "2025-05-20T08:53:15Z",
					},
					{
						Type:               "RegistrationApplied",
						Status:             "True",
						Reason:             "SetPermissionApplied",
						Message:            "Registration of the addon agent is configured",
						LastTransitionTime: "2025-05-20T08:52:59Z",
					},
					{
						Type:               "ClusterCertificateRotated",
						Status:             "True",
						Reason:             "ClientCertificateUpdated",
						Message:            "client certificate rotated starting from 2025-05-20 08:47:59 +0000 UTC to 2026-05-20 08:47:59 +0000 UTC",
						LastTransitionTime: "2025-05-20T08:52:59Z",
					},
					{
						Type:               "ManifestApplied",
						Status:             "True",
						Reason:             "AddonManifestApplied",
						Message:            "manifests of addon are applied successfully",
						LastTransitionTime: "2025-05-20T08:52:59Z",
					},
				},
				Registrations: []models.AddonRegistration{
					{
						SignerName: "kubernetes.io/kube-apiserver-client",
						Subject: models.AddonRegistrationSubject{
							Groups: []string{
								"system:open-cluster-management:cluster:" + clusterName + ":addon:managed-serviceaccount",
								"system:open-cluster-management:addon:managed-serviceaccount",
								"system:authenticated",
							},
							User: "system:open-cluster-management:cluster:" + clusterName + ":addon:managed-serviceaccount:agent:addon-agent",
						},
					},
				},
				SupportedConfigs: []models.AddonSupportedConfig{
					{
						Group:    "addon.open-cluster-management.io",
						Resource: "addondeploymentconfigs",
					},
				},
			},
			{
				ID:                clusterName + "-application-manager",
				Name:              "application-manager",
				Namespace:         clusterName,
				InstallNamespace:  "open-cluster-management-agent-addon",
				CreationTimestamp: "2025-05-20T08:52:35Z",
				Conditions: []models.Condition{
					{
						Type:               "Available",
						Status:             "True",
						Reason:             "ManagedClusterAddOnLeaseUpdated",
						Message:            "application-manager add-on is available.",
						LastTransitionTime: "2025-05-20T08:53:15Z",
					},
				},
			},
			{
				ID:                clusterName + "-cert-policy-controller",
				Name:              "cert-policy-controller",
				Namespace:         clusterName,
				InstallNamespace:  "open-cluster-management-agent-addon",
				CreationTimestamp: "2025-05-20T08:52:35Z",
				Conditions: []models.Condition{
					{
						Type:               "Available",
						Status:             "True",
						Reason:             "ManagedClusterAddOnLeaseUpdated",
						Message:            "cert-policy-controller add-on is available.",
						LastTransitionTime: "2025-05-20T08:53:15Z",
					},
				},
			},
		}
		c.JSON(http.StatusOK, mockAddons)
		return
	}

	// Ensure we have a client before proceeding
	if dynamicClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
		return
	}

	// List real managed cluster addons for the specific namespace (cluster name)
	list, err := dynamicClient.Resource(client.ManagedClusterAddonResource).Namespace(clusterName).List(ctx, metav1.ListOptions{})
	if err != nil {
		if debugMode {
			log.Printf("Error listing addons for cluster %s: %v", clusterName, err)
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Convert to our simplified ManagedClusterAddon format
	addons := make([]models.ManagedClusterAddon, 0, len(list.Items))
	for _, item := range list.Items {
		// Extract the basic metadata
		addon := models.ManagedClusterAddon{
			ID:                string(item.GetUID()),
			Name:              item.GetName(),
			Namespace:         item.GetNamespace(),
			CreationTimestamp: item.GetCreationTimestamp().Format(time.RFC3339),
		}

		// Extract spec
		spec, found, err := unstructured.NestedMap(item.Object, "spec")
		if err == nil && found {
			// Extract installNamespace
			if installNamespace, found, _ := unstructured.NestedString(spec, "installNamespace"); found {
				addon.InstallNamespace = installNamespace
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

					addon.Conditions = append(addon.Conditions, condition)
				}
			}

			// Extract registrations
			if registrations, found, _ := unstructured.NestedSlice(status, "registrations"); found {
				for _, r := range registrations {
					regMap, ok := r.(map[string]interface{})
					if !ok {
						continue
					}

					registration := models.AddonRegistration{}

					if signerName, found, _ := unstructured.NestedString(regMap, "signerName"); found {
						registration.SignerName = signerName
					}

					// Extract subject
					if subject, found, _ := unstructured.NestedMap(regMap, "subject"); found {
						// Extract groups
						if groups, found, _ := unstructured.NestedStringSlice(subject, "groups"); found {
							registration.Subject.Groups = groups
						}

						// Extract user
						if user, found, _ := unstructured.NestedString(subject, "user"); found {
							registration.Subject.User = user
						}
					}

					addon.Registrations = append(addon.Registrations, registration)
				}
			}

			// Extract supportedConfigs
			if supportedConfigs, found, _ := unstructured.NestedSlice(status, "supportedConfigs"); found {
				for _, sc := range supportedConfigs {
					scMap, ok := sc.(map[string]interface{})
					if !ok {
						continue
					}

					supportedConfig := models.AddonSupportedConfig{}

					if group, found, _ := unstructured.NestedString(scMap, "group"); found {
						supportedConfig.Group = group
					}

					if resource, found, _ := unstructured.NestedString(scMap, "resource"); found {
						supportedConfig.Resource = resource
					}

					addon.SupportedConfigs = append(addon.SupportedConfigs, supportedConfig)
				}
			}
		}

		addons = append(addons, addon)
	}

	c.JSON(http.StatusOK, addons)
}

// GetClusterAddon handles retrieving a specific addon for a specific cluster
func GetClusterAddon(c *gin.Context, dynamicClient dynamic.Interface, ctx context.Context, debugMode bool) {
	clusterName := c.Param("name")
	addonName := c.Param("addonName")

	// Check if using mock data
	if os.Getenv("DASHBOARD_USE_MOCK") == "true" {
		// Return mock data for the specific addon
		if addonName == "managed-serviceaccount" {
			mockAddon := models.ManagedClusterAddon{
				ID:                clusterName + "-managed-serviceaccount",
				Name:              "managed-serviceaccount",
				Namespace:         clusterName,
				InstallNamespace:  "open-cluster-management-agent-addon",
				CreationTimestamp: "2025-05-20T08:52:35Z",
				Conditions: []models.Condition{
					{
						Type:               "Progressing",
						Status:             "False",
						Reason:             "Completed",
						Message:            "completed with no errors.",
						LastTransitionTime: "2025-05-20T08:52:35Z",
					},
					{
						Type:               "Available",
						Status:             "True",
						Reason:             "ManagedClusterAddOnLeaseUpdated",
						Message:            "managed-serviceaccount add-on is available.",
						LastTransitionTime: "2025-05-20T08:53:15Z",
					},
				},
				Registrations: []models.AddonRegistration{
					{
						SignerName: "kubernetes.io/kube-apiserver-client",
						Subject: models.AddonRegistrationSubject{
							Groups: []string{
								"system:open-cluster-management:cluster:" + clusterName + ":addon:managed-serviceaccount",
								"system:open-cluster-management:addon:managed-serviceaccount",
								"system:authenticated",
							},
							User: "system:open-cluster-management:cluster:" + clusterName + ":addon:managed-serviceaccount:agent:addon-agent",
						},
					},
				},
			}
			c.JSON(http.StatusOK, mockAddon)
			return
		} else if addonName == "application-manager" || addonName == "cert-policy-controller" {
			mockAddon := models.ManagedClusterAddon{
				ID:                clusterName + "-" + addonName,
				Name:              addonName,
				Namespace:         clusterName,
				InstallNamespace:  "open-cluster-management-agent-addon",
				CreationTimestamp: "2025-05-20T08:52:35Z",
				Conditions: []models.Condition{
					{
						Type:               "Available",
						Status:             "True",
						Reason:             "ManagedClusterAddOnLeaseUpdated",
						Message:            addonName + " add-on is available.",
						LastTransitionTime: "2025-05-20T08:53:15Z",
					},
				},
			}
			c.JSON(http.StatusOK, mockAddon)
			return
		} else {
			c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Mock addon %s not found for cluster %s", addonName, clusterName)})
			return
		}
	}

	// Ensure we have a client before proceeding
	if dynamicClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes client not initialized"})
		return
	}

	// Get the real managed cluster addon
	item, err := dynamicClient.Resource(client.ManagedClusterAddonResource).Namespace(clusterName).Get(ctx, addonName, metav1.GetOptions{})
	if err != nil {
		if debugMode {
			log.Printf("Error getting addon %s for cluster %s: %v", addonName, clusterName, err)
		}
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Addon %s not found for cluster %s", addonName, clusterName)})
		return
	}

	// Extract the basic metadata
	addon := models.ManagedClusterAddon{
		ID:                string(item.GetUID()),
		Name:              item.GetName(),
		Namespace:         item.GetNamespace(),
		CreationTimestamp: item.GetCreationTimestamp().Format(time.RFC3339),
	}

	// Extract spec
	spec, found, err := unstructured.NestedMap(item.Object, "spec")
	if err == nil && found {
		// Extract installNamespace
		if installNamespace, found, _ := unstructured.NestedString(spec, "installNamespace"); found {
			addon.InstallNamespace = installNamespace
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

				addon.Conditions = append(addon.Conditions, condition)
			}
		}

		// Extract registrations
		if registrations, found, _ := unstructured.NestedSlice(status, "registrations"); found {
			for _, r := range registrations {
				regMap, ok := r.(map[string]interface{})
				if !ok {
					continue
				}

				registration := models.AddonRegistration{}

				if signerName, found, _ := unstructured.NestedString(regMap, "signerName"); found {
					registration.SignerName = signerName
				}

				// Extract subject
				if subject, found, _ := unstructured.NestedMap(regMap, "subject"); found {
					// Extract groups
					if groups, found, _ := unstructured.NestedStringSlice(subject, "groups"); found {
						registration.Subject.Groups = groups
					}

					// Extract user
					if user, found, _ := unstructured.NestedString(subject, "user"); found {
						registration.Subject.User = user
					}
				}

				addon.Registrations = append(addon.Registrations, registration)
			}
		}

		// Extract supportedConfigs
		if supportedConfigs, found, _ := unstructured.NestedSlice(status, "supportedConfigs"); found {
			for _, sc := range supportedConfigs {
				scMap, ok := sc.(map[string]interface{})
				if !ok {
					continue
				}

				supportedConfig := models.AddonSupportedConfig{}

				if group, found, _ := unstructured.NestedString(scMap, "group"); found {
					supportedConfig.Group = group
				}

				if resource, found, _ := unstructured.NestedString(scMap, "resource"); found {
					supportedConfig.Resource = resource
				}

				addon.SupportedConfigs = append(addon.SupportedConfigs, supportedConfig)
			}
		}
	}

	c.JSON(http.StatusOK, addon)
}
