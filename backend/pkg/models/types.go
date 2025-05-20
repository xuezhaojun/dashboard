package models

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

// LabelSelector represents a Kubernetes label selector
type LabelSelector struct {
	MatchLabels map[string]string `json:"matchLabels,omitempty"`
}

// ClusterSelector represents the selector for clusters in a ManagedClusterSet
type ClusterSelector struct {
	SelectorType  string         `json:"selectorType"`
	LabelSelector *LabelSelector `json:"labelSelector,omitempty"`
}

// ClusterSetSpec represents the spec of a ManagedClusterSet
type ClusterSetSpec struct {
	ClusterSelector ClusterSelector `json:"clusterSelector"`
}

// ClusterSetStatus represents the status of a ManagedClusterSet
type ClusterSetStatus struct {
	Conditions []Condition `json:"conditions,omitempty"`
}

// ClusterSet represents a simplified OCM ManagedClusterSet
type ClusterSet struct {
	ID                string            `json:"id"`
	Name              string            `json:"name"`
	ClusterCount      int               `json:"clusterCount"`
	Labels            map[string]string `json:"labels,omitempty"`
	Spec              ClusterSetSpec    `json:"spec,omitempty"`
	Status            ClusterSetStatus  `json:"status,omitempty"`
	CreationTimestamp string            `json:"creationTimestamp,omitempty"`
}

// AddonRegistrationSubject represents the subject of a registration for an addon
type AddonRegistrationSubject struct {
	Groups []string `json:"groups"`
	User   string   `json:"user"`
}

// AddonRegistration represents the registration information for an addon
type AddonRegistration struct {
	SignerName string                   `json:"signerName"`
	Subject    AddonRegistrationSubject `json:"subject"`
}

// AddonSupportedConfig represents a supported configuration for an addon
type AddonSupportedConfig struct {
	Group    string `json:"group"`
	Resource string `json:"resource"`
}

// ManagedClusterAddon represents a simplified OCM ManagedClusterAddOn
type ManagedClusterAddon struct {
	ID                string                 `json:"id"`
	Name              string                 `json:"name"`
	Namespace         string                 `json:"namespace"`
	InstallNamespace  string                 `json:"installNamespace"`
	CreationTimestamp string                 `json:"creationTimestamp,omitempty"`
	Conditions        []Condition            `json:"conditions,omitempty"`
	Registrations     []AddonRegistration    `json:"registrations,omitempty"`
	SupportedConfigs  []AddonSupportedConfig `json:"supportedConfigs,omitempty"`
}

// MatchExpression represents a label/claim expression for a Placement
type MatchExpression struct {
	Key      string   `json:"key"`
	Operator string   `json:"operator"`
	Values   []string `json:"values,omitempty"`
}

// LabelSelectorWithExpressions represents a label selector with expressions
type LabelSelectorWithExpressions struct {
	MatchLabels      map[string]string `json:"matchLabels,omitempty"`
	MatchExpressions []MatchExpression `json:"matchExpressions,omitempty"`
}

// ClaimSelectorWithExpressions represents a claim selector with expressions
type ClaimSelectorWithExpressions struct {
	MatchExpressions []MatchExpression `json:"matchExpressions,omitempty"`
}

// CelSelectorWithExpressions represents a CEL selector with expressions
type CelSelectorWithExpressions struct {
	CelExpressions []string `json:"celExpressions,omitempty"`
}

// RequiredClusterSelector represents required cluster selector
type RequiredClusterSelector struct {
	LabelSelector *LabelSelectorWithExpressions `json:"labelSelector,omitempty"`
	ClaimSelector *ClaimSelectorWithExpressions `json:"claimSelector,omitempty"`
	CelSelector   *CelSelectorWithExpressions   `json:"celSelector,omitempty"`
}

// Predicate represents a placement predicate
type Predicate struct {
	RequiredClusterSelector *RequiredClusterSelector `json:"requiredClusterSelector,omitempty"`
}

// AddOnScore represents addon score configuration
type AddOnScore struct {
	ResourceName string `json:"resourceName"`
	ScoreName    string `json:"scoreName"`
}

// ScoreCoordinate represents score coordinate
type ScoreCoordinate struct {
	Type    string      `json:"type,omitempty"`
	BuiltIn string      `json:"builtIn,omitempty"`
	AddOn   *AddOnScore `json:"addOn,omitempty"`
}

// PrioritizerConfig represents the configuration of a prioritizer
type PrioritizerConfig struct {
	ScoreCoordinate *ScoreCoordinate `json:"scoreCoordinate,omitempty"`
	Weight          int32            `json:"weight,omitempty"`
}

// PrioritizerPolicy represents prioritizer policy
type PrioritizerPolicy struct {
	Mode           string              `json:"mode,omitempty"`
	Configurations []PrioritizerConfig `json:"configurations,omitempty"`
}

// GroupClusterSelector represents a selector for a group of clusters
type GroupClusterSelector struct {
	LabelSelector *LabelSelectorWithExpressions `json:"labelSelector,omitempty"`
}

// DecisionGroup represents a group in decision strategy
type DecisionGroup struct {
	GroupName            string               `json:"groupName,omitempty"`
	GroupClusterSelector GroupClusterSelector `json:"groupClusterSelector,omitempty"`
}

// GroupStrategy represents group strategy for decisions
type GroupStrategy struct {
	DecisionGroups           []DecisionGroup `json:"decisionGroups,omitempty"`
	ClustersPerDecisionGroup string          `json:"clustersPerDecisionGroup,omitempty"`
}

// DecisionStrategy represents strategy for placement decisions
type DecisionStrategy struct {
	GroupStrategy GroupStrategy `json:"groupStrategy,omitempty"`
}

// PlacementToleration represents a toleration for placement
type PlacementToleration struct {
	Key               string `json:"key,omitempty"`
	Operator          string `json:"operator,omitempty"`
	Value             string `json:"value,omitempty"`
	Effect            string `json:"effect,omitempty"`
	TolerationSeconds *int64 `json:"tolerationSeconds,omitempty"`
}

// DecisionGroupStatus represents status of a decision group
type DecisionGroupStatus struct {
	DecisionGroupIndex int32    `json:"decisionGroupIndex"`
	DecisionGroupName  string   `json:"decisionGroupName,omitempty"`
	Decisions          []string `json:"decisions,omitempty"`
	ClusterCount       int32    `json:"clusterCount"`
}

// Placement represents a simplified OCM Placement
type Placement struct {
	ID                       string                `json:"id"`
	Name                     string                `json:"name"`
	Namespace                string                `json:"namespace"`
	CreationTimestamp        string                `json:"creationTimestamp,omitempty"`
	ClusterSets              []string              `json:"clusterSets,omitempty"`
	NumberOfClusters         *int32                `json:"numberOfClusters,omitempty"`
	Predicates               []Predicate           `json:"predicates,omitempty"`
	PrioritizerPolicy        *PrioritizerPolicy    `json:"prioritizerPolicy,omitempty"`
	Tolerations              []PlacementToleration `json:"tolerations,omitempty"`
	DecisionStrategy         *DecisionStrategy     `json:"decisionStrategy,omitempty"`
	NumberOfSelectedClusters int32                 `json:"numberOfSelectedClusters"`
	DecisionGroups           []DecisionGroupStatus `json:"decisionGroups,omitempty"`
	Conditions               []Condition           `json:"conditions,omitempty"`
	Satisfied                bool                  `json:"satisfied"`
	ReasonMessage            string                `json:"reasonMessage,omitempty"`
}

// ClusterDecision represents a single cluster decision
type ClusterDecision struct {
	ClusterName string `json:"clusterName"`
	Reason      string `json:"reason"`
}

// PlacementDecision represents a simplified OCM PlacementDecision
type PlacementDecision struct {
	ID        string            `json:"id"`
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Decisions []ClusterDecision `json:"decisions,omitempty"`
}

// Helper function to create a pointer to an int32
func IntPtr(i int32) *int32 {
	return &i
}
