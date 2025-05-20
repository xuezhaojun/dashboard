package main

import (
	"context"
	"os"

	"github.com/xuezhaojun/ocm-dashboard/backend/pkg/client"
	"github.com/xuezhaojun/ocm-dashboard/backend/pkg/server"
)

func main() {
	// Check if debug mode is enabled
	debugMode := os.Getenv("DASHBOARD_DEBUG") == "true"

	// Create a context
	ctx := context.Background()

	// Initialize Kubernetes client
	dynamicClient := client.CreateKubernetesClient(debugMode)

	// Set up and run the server
	r := server.SetupServer(dynamicClient, ctx, debugMode)
	server.RunServer(r)
}
