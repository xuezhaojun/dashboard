import type { Cluster } from './clusterService';

export interface PlacementDecision {
  name: string;
  namespace: string;
  decisions: {
    clusterName: string;
    reason: string;
  }[];
}

export interface Placement {
  id: string;
  name: string;
  namespace: string;
  creationTimestamp?: string;

  // Spec fields
  clusterSets: string[];
  numberOfClusters?: number;
  prioritizerPolicy?: {
    mode: string;
    configurations: {
      scoreCoordinate: {
        type: string;
        builtIn?: string;
        addOn?: {
          resourceName: string;
          scoreName: string;
        }
      };
      weight: number;
    }[];
  };
  predicates?: {
    requiredClusterSelector?: {
      labelSelector?: {
        matchLabels?: Record<string, string>;
        matchExpressions?: {
          key: string;
          operator: string;
          values: string[];
        }[];
      };
      claimSelector?: {
        matchExpressions?: {
          key: string;
          operator: string;
          values: string[];
        }[];
      };
      celSelector?: {
        celExpressions?: string[];
      };
    };
  }[];
  tolerations?: {
    key?: string;
    operator?: string;
    value?: string;
    effect?: string;
    tolerationSeconds?: number;
  }[];
  decisionStrategy?: {
    groupStrategy?: {
      decisionGroups?: {
        groupName: string;
        groupClusterSelector: {
          labelSelector?: {
            matchLabels?: Record<string, string>;
            matchExpressions?: {
              key: string;
              operator: string;
              values: string[];
            }[];
          };
        };
      }[];
      clustersPerDecisionGroup?: string;
    };
  };

  // Status fields
  numberOfSelectedClusters: number;
  decisionGroups?: {
    decisionGroupIndex: number;
    decisionGroupName: string;
    decisions: string[];
    clusterCount: number;
  }[];
  conditions?: {
    type: string;
    status: string;
    reason?: string;
    message?: string;
    lastTransitionTime?: string;
  }[];

  // Calculated fields
  satisfied: boolean;
  reasonMessage?: string;
  selectedClusters?: Cluster[];
  decisions?: PlacementDecision[];
}

// Backend API base URL - will be configurable for production
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

// Function to fetch the auth token - can be replaced with a proper auth system later
const getAuthToken = (): string => {
  return localStorage.getItem('authToken') || '';
};

// Helper to create headers with authorization
const createHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// Fetch all placements
export const fetchPlacements = async (): Promise<Placement[]> => {
  // Use mock data in development mode unless specifically requested to use real API
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: "placement-1",
            name: "placement-1",
            namespace: "default",
            creationTimestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            clusterSets: ["global"],
            numberOfClusters: 3,
            numberOfSelectedClusters: 3,
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchLabels: {
                      "env": "production"
                    }
                  }
                }
              }
            ],
            prioritizerPolicy: {
              mode: "Additive",
              configurations: [
                {
                  scoreCoordinate: {
                    type: "BuiltIn",
                    builtIn: "ResourceAllocatableMemory",
                  },
                  weight: 2
                }
              ]
            },
            decisionGroups: [
              {
                decisionGroupIndex: 0,
                decisionGroupName: "",
                decisions: ["placement-1-decision-1"],
                clusterCount: 3
              }
            ],
            conditions: [
              {
                type: "PlacementSatisfied",
                status: "True",
                reason: "PlacementSatisfied",
                message: "Placement requirements are satisfied",
                lastTransitionTime: new Date().toISOString()
              }
            ],
            satisfied: true
          },
          {
            id: "placement-2",
            name: "placement-2",
            namespace: "default",
            creationTimestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            clusterSets: ["east", "west"],
            numberOfClusters: 2,
            numberOfSelectedClusters: 1,
            predicates: [
              {
                requiredClusterSelector: {
                  claimSelector: {
                    matchExpressions: [
                      {
                        key: "platform.open-cluster-management.io",
                        operator: "In",
                        values: ["AWS"]
                      }
                    ]
                  }
                }
              }
            ],
            decisionGroups: [
              {
                decisionGroupIndex: 0,
                decisionGroupName: "",
                decisions: ["placement-2-decision-1"],
                clusterCount: 1
              }
            ],
            conditions: [
              {
                type: "PlacementSatisfied",
                status: "False",
                reason: "NotEnoughClusters",
                message: "Not enough clusters match the placement requirements",
                lastTransitionTime: new Date().toISOString()
              }
            ],
            satisfied: false,
            reasonMessage: "Not enough clusters match the placement requirements"
          },
          {
            id: "placement-3",
            name: "placement-3",
            namespace: "app-team-1",
            creationTimestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            clusterSets: ["global"],
            numberOfSelectedClusters: 2,
            predicates: [
              {
                requiredClusterSelector: {
                  celSelector: {
                    celExpressions: [
                      "managedCluster.status.version.kubernetes == \"v1.31.0\""
                    ]
                  }
                }
              }
            ],
            tolerations: [
              {
                key: "gpu",
                value: "true",
                operator: "Equal"
              }
            ],
            decisionStrategy: {
              groupStrategy: {
                decisionGroups: [
                  {
                    groupName: "canary",
                    groupClusterSelector: {
                      labelSelector: {
                        matchLabels: {
                          "canary": "true"
                        }
                      }
                    }
                  }
                ],
                clustersPerDecisionGroup: "50%"
              }
            },
            decisionGroups: [
              {
                decisionGroupIndex: 0,
                decisionGroupName: "canary",
                decisions: ["placement-3-decision-1"],
                clusterCount: 1
              },
              {
                decisionGroupIndex: 1,
                decisionGroupName: "",
                decisions: ["placement-3-decision-2"],
                clusterCount: 1
              }
            ],
            conditions: [
              {
                type: "PlacementSatisfied",
                status: "True",
                reason: "PlacementSatisfied",
                message: "Placement requirements are satisfied",
                lastTransitionTime: new Date().toISOString()
              }
            ],
            satisfied: true
          }
        ]);
      }, 800);
    });
  }

  try {
    const response = await fetch(`${API_BASE}/api/placements`, {
      headers: createHeaders()
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching placements:', error);
    return [];
  }
};

// Fetch a single placement by namespace and name
export const fetchPlacementByName = async (
  namespace: string,
  name: string
): Promise<Placement | null> => {
  // Use mock data in development mode unless specifically requested to use real API
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (name === "placement-1" && namespace === "default") {
          resolve({
            id: "placement-1",
            name: "placement-1",
            namespace: "default",
            creationTimestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            clusterSets: ["global"],
            numberOfClusters: 3,
            numberOfSelectedClusters: 3,
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchLabels: {
                      "env": "production"
                    }
                  }
                }
              }
            ],
            prioritizerPolicy: {
              mode: "Additive",
              configurations: [
                {
                  scoreCoordinate: {
                    type: "BuiltIn",
                    builtIn: "ResourceAllocatableMemory",
                  },
                  weight: 2
                }
              ]
            },
            decisionGroups: [
              {
                decisionGroupIndex: 0,
                decisionGroupName: "",
                decisions: ["placement-1-decision-1"],
                clusterCount: 3
              }
            ],
            conditions: [
              {
                type: "PlacementSatisfied",
                status: "True",
                reason: "PlacementSatisfied",
                message: "Placement requirements are satisfied",
                lastTransitionTime: new Date().toISOString()
              }
            ],
            satisfied: true,
            selectedClusters: [
              {
                id: "mock-cluster-1",
                name: "mock-cluster-1",
                status: "Online",
              },
              {
                id: "mock-cluster-2",
                name: "mock-cluster-2",
                status: "Offline",
              },
              {
                id: "mock-cluster-3",
                name: "mock-cluster-3",
                status: "Online",
              }
            ],
            decisions: [
              {
                name: "placement-1-decision-1",
                namespace: "default",
                decisions: [
                  {
                    clusterName: "mock-cluster-1",
                    reason: "Selected by placement"
                  },
                  {
                    clusterName: "mock-cluster-2",
                    reason: "Selected by placement"
                  },
                  {
                    clusterName: "mock-cluster-3",
                    reason: "Selected by placement"
                  }
                ]
              }
            ]
          });
        } else if (name === "placement-2" && namespace === "default") {
          resolve({
            id: "placement-2",
            name: "placement-2",
            namespace: "default",
            creationTimestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            clusterSets: ["east", "west"],
            numberOfClusters: 2,
            numberOfSelectedClusters: 1,
            predicates: [
              {
                requiredClusterSelector: {
                  claimSelector: {
                    matchExpressions: [
                      {
                        key: "platform.open-cluster-management.io",
                        operator: "In",
                        values: ["AWS"]
                      }
                    ]
                  }
                }
              }
            ],
            decisionGroups: [
              {
                decisionGroupIndex: 0,
                decisionGroupName: "",
                decisions: ["placement-2-decision-1"],
                clusterCount: 1
              }
            ],
            conditions: [
              {
                type: "PlacementSatisfied",
                status: "False",
                reason: "NotEnoughClusters",
                message: "Not enough clusters match the placement requirements",
                lastTransitionTime: new Date().toISOString()
              }
            ],
            satisfied: false,
            reasonMessage: "Not enough clusters match the placement requirements",
            selectedClusters: [
              {
                id: "mock-cluster-1",
                name: "mock-cluster-1",
                status: "Online",
              }
            ],
            decisions: [
              {
                name: "placement-2-decision-1",
                namespace: "default",
                decisions: [
                  {
                    clusterName: "mock-cluster-1",
                    reason: "Selected by placement"
                  }
                ]
              }
            ]
          });
        } else if (name === "placement-3" && namespace === "app-team-1") {
          resolve({
            id: "placement-3",
            name: "placement-3",
            namespace: "app-team-1",
            creationTimestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            clusterSets: ["global"],
            numberOfSelectedClusters: 2,
            predicates: [
              {
                requiredClusterSelector: {
                  celSelector: {
                    celExpressions: [
                      "managedCluster.status.version.kubernetes == \"v1.31.0\""
                    ]
                  }
                }
              }
            ],
            tolerations: [
              {
                key: "gpu",
                value: "true",
                operator: "Equal"
              }
            ],
            decisionStrategy: {
              groupStrategy: {
                decisionGroups: [
                  {
                    groupName: "canary",
                    groupClusterSelector: {
                      labelSelector: {
                        matchLabels: {
                          "canary": "true"
                        }
                      }
                    }
                  }
                ],
                clustersPerDecisionGroup: "50%"
              }
            },
            decisionGroups: [
              {
                decisionGroupIndex: 0,
                decisionGroupName: "canary",
                decisions: ["placement-3-decision-1"],
                clusterCount: 1
              },
              {
                decisionGroupIndex: 1,
                decisionGroupName: "",
                decisions: ["placement-3-decision-2"],
                clusterCount: 1
              }
            ],
            conditions: [
              {
                type: "PlacementSatisfied",
                status: "True",
                reason: "PlacementSatisfied",
                message: "Placement requirements are satisfied",
                lastTransitionTime: new Date().toISOString()
              }
            ],
            satisfied: true,
            selectedClusters: [
              {
                id: "mock-cluster-3",
                name: "mock-cluster-3",
                status: "Online",
              },
              {
                id: "mock-cluster-4",
                name: "mock-cluster-4",
                status: "Online",
              }
            ],
            decisions: [
              {
                name: "placement-3-decision-1",
                namespace: "app-team-1",
                decisions: [
                  {
                    clusterName: "mock-cluster-3",
                    reason: "Selected by placement (canary group)"
                  }
                ]
              },
              {
                name: "placement-3-decision-2",
                namespace: "app-team-1",
                decisions: [
                  {
                    clusterName: "mock-cluster-4",
                    reason: "Selected by placement"
                  }
                ]
              }
            ]
          });
        } else {
          resolve(null);
        }
      }, 800);
    });
  }

  try {
    const response = await fetch(`${API_BASE}/api/namespaces/${namespace}/placements/${name}`, {
      headers: createHeaders()
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching placement ${namespace}/${name}:`, error);
    return null;
  }
};

// Fetch placement decisions for a placement
export const fetchPlacementDecisions = async (
  namespace: string,
  placementName: string
): Promise<PlacementDecision[]> => {
  // Use mock data in development mode unless specifically requested to use real API
  if (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (placementName === "placement-1" && namespace === "default") {
          resolve([
            {
              name: "placement-1-decision-1",
              namespace: "default",
              decisions: [
                {
                  clusterName: "mock-cluster-1",
                  reason: "Selected by placement"
                },
                {
                  clusterName: "mock-cluster-2",
                  reason: "Selected by placement"
                },
                {
                  clusterName: "mock-cluster-3",
                  reason: "Selected by placement"
                }
              ]
            }
          ]);
        } else if (placementName === "placement-2" && namespace === "default") {
          resolve([
            {
              name: "placement-2-decision-1",
              namespace: "default",
              decisions: [
                {
                  clusterName: "mock-cluster-1",
                  reason: "Selected by placement"
                }
              ]
            }
          ]);
        } else if (placementName === "placement-3" && namespace === "app-team-1") {
          resolve([
            {
              name: "placement-3-decision-1",
              namespace: "app-team-1",
              decisions: [
                {
                  clusterName: "mock-cluster-3",
                  reason: "Selected by placement (canary group)"
                }
              ]
            },
            {
              name: "placement-3-decision-2",
              namespace: "app-team-1",
              decisions: [
                {
                  clusterName: "mock-cluster-4",
                  reason: "Selected by placement"
                }
              ]
            }
          ]);
        } else {
          resolve([]);
        }
      }, 800);
    });
  }

  try {
    const response = await fetch(`${API_BASE}/api/namespaces/${namespace}/placements/${placementName}/decisions`, {
      headers: createHeaders()
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching placement decisions for ${namespace}/${placementName}:`, error);
    return [];
  }
};