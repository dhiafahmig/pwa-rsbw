package main

import (
	"log"
	"pwa-rsbw/internal/auth"
	"pwa-rsbw/internal/config"
	"pwa-rsbw/internal/database"
	"pwa-rsbw/internal/listranap"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Set Gin mode based on environment
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Setup database connection
	db := database.Connect(cfg)

	// Setup auth dependencies
	authRepo := auth.NewAuthRepository(db)
	authService := auth.NewAuthService(authRepo, cfg.JWTSecret)
	authHandler := auth.NewAuthHandler(authService)

	// ✅ Setup list-ranap dependencies
	listRanapRepo := listranap.NewPasienRepository(db)
	listRanapService := listranap.NewPasienService(listRanapRepo)
	listRanapHandler := listranap.NewPasienHandler(listRanapService)

	// Setup router
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":      "ok",
			"environment": cfg.Environment,
			"message":     "PWA Hospital API is running",
		})
	})

	// Auth routes
	authRoutes := r.Group("/api/v1/auth")
	{
		authRoutes.POST("/login", authHandler.Login)
	}

	// Protected routes
	protectedRoutes := r.Group("/api/v1")
	protectedRoutes.Use(authHandler.JWTMiddleware())
	{
		// ✅ Profile dengan info dokter
		protectedRoutes.GET("/profile", func(c *gin.Context) {
			idUser := c.GetString("id_user")
			kdDokter := c.GetString("kd_dokter")
			c.JSON(200, gin.H{
				"status": "success",
				"data": gin.H{
					"id_user":   idUser,
					"kd_dokter": kdDokter,
					"message":   "This is protected route",
				},
			})
		})
	}

	// ✅ List-ranap routes (auto-filter by logged doctor)
	ranapRoutes := protectedRoutes.Group("/ranap")
	{
		ranapRoutes.GET("/profile", listRanapHandler.GetDokterProfile)         // Profile dokter
		ranapRoutes.GET("/pasien", listRanapHandler.GetPasienRawatInapAktif)   // My patients only
		ranapRoutes.GET("/pasien/:no_rawat", listRanapHandler.GetPasienDetail) // Patient detail if my DPJP
	}

	log.Printf("🚀 Server starting on port %s", cfg.ServerPort)
	log.Printf("🌍 Environment: %s", cfg.Environment)
	log.Printf("🔗 Health check: http://localhost:%s/health", cfg.ServerPort)
	log.Printf("🔐 Login endpoint: http://localhost:%s/api/v1/auth/login", cfg.ServerPort)
	log.Printf("👨‍⚕️ Doctor profile: http://localhost:%s/api/v1/ranap/profile", cfg.ServerPort)
	log.Printf("👥 My patients: http://localhost:%s/api/v1/ranap/pasien", cfg.ServerPort)

	r.Run(":" + cfg.ServerPort)
}
