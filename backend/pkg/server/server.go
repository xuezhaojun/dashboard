package server

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/xuezhaojun/ocm-dashboard/backend/pkg/client"
	"github.com/xuezhaojun/ocm-dashboard/backend/pkg/handlers"
)

// SetupServer initializes the HTTP server with all required routes
func SetupServer(ocmClient *client.OCMClient, ctx context.Context, debugMode bool) *gin.Engine {
	// Check if debug mode is enabled
	if debugMode {
		log.Println("Debug mode enabled")
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

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

		// Register cluster routes
		api.GET("/clusters", authMiddleware, func(c *gin.Context) {
			handlers.GetClusters(c, ocmClient, ctx)
		})

		api.GET("/clusters/:name", authMiddleware, func(c *gin.Context) {
			handlers.GetCluster(c, ocmClient, ctx)
		})

		// Register cluster addon routes
		api.GET("/clusters/:name/addons", authMiddleware, func(c *gin.Context) {
			handlers.GetClusterAddons(c, ocmClient, ctx)
		})

		api.GET("/clusters/:name/addons/:addonName", authMiddleware, func(c *gin.Context) {
			handlers.GetClusterAddon(c, ocmClient, ctx)
		})

		// Register clusterset routes
		api.GET("/clustersets", authMiddleware, func(c *gin.Context) {
			handlers.GetClusterSets(c, ocmClient, ctx)
		})

		api.GET("/clustersets/:name", authMiddleware, func(c *gin.Context) {
			handlers.GetClusterSet(c, ocmClient, ctx)
		})

		// Register clustersetbinding routes
		api.GET("/clustersetbindings", authMiddleware, func(c *gin.Context) {
			handlers.GetAllClusterSetBindings(c, ocmClient, ctx)
		})

		api.GET("/namespaces/:namespace/clustersetbindings", authMiddleware, func(c *gin.Context) {
			handlers.GetClusterSetBindings(c, ocmClient, ctx)
		})

		api.GET("/namespaces/:namespace/clustersetbindings/:name", authMiddleware, func(c *gin.Context) {
			handlers.GetClusterSetBinding(c, ocmClient, ctx)
		})

		// Register manifestwork routes
		api.GET("/namespaces/:namespace/manifestworks", authMiddleware, func(c *gin.Context) {
			handlers.GetManifestWorks(c, ocmClient, ctx)
		})

		api.GET("/namespaces/:namespace/manifestworks/:name", authMiddleware, func(c *gin.Context) {
			handlers.GetManifestWork(c, ocmClient, ctx)
		})

		// Register placement routes
		api.GET("/placements", authMiddleware, func(c *gin.Context) {
			handlers.GetPlacements(c, ocmClient, ctx)
		})

		api.GET("/namespaces/:namespace/placements", authMiddleware, func(c *gin.Context) {
			handlers.GetPlacementsByNamespace(c, ocmClient, ctx)
		})

		api.GET("/namespaces/:namespace/placements/:name", authMiddleware, func(c *gin.Context) {
			handlers.GetPlacement(c, ocmClient, ctx)
		})

		api.GET("/namespaces/:namespace/placements/:name/decisions", authMiddleware, func(c *gin.Context) {
			handlers.GetPlacementDecisions(c, ocmClient, ctx)
		})

		// Register placementdecision routes
		api.GET("/placementdecisions", authMiddleware, func(c *gin.Context) {
			handlers.GetAllPlacementDecisions(c, ocmClient, ctx)
		})

		api.GET("/namespaces/:namespace/placementdecisions", authMiddleware, func(c *gin.Context) {
			handlers.GetPlacementDecisionsByNamespace(c, ocmClient, ctx)
		})

		api.GET("/namespaces/:namespace/placementdecisions/:name", authMiddleware, func(c *gin.Context) {
			handlers.GetPlacementDecision(c, ocmClient, ctx)
		})

		api.GET("/namespaces/:namespace/placements/:name/placementdecisions", authMiddleware, func(c *gin.Context) {
			handlers.GetPlacementDecisionsByPlacement(c, ocmClient, ctx)
		})

		// Register streaming routes
		api.GET("/stream/clusters", authMiddleware, func(c *gin.Context) {
			handlers.StreamClusters(c, ocmClient.Interface, ctx)
		})
	}

	// Add static file handling
	r.Static("/static", "./static")

	// Add a root handler to redirect to frontend
	r.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/static/index.html")
	})

	return r
}

// RunServer starts the HTTP server on the specified port
func RunServer(r *gin.Engine) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	r.Run(":" + port)
}
