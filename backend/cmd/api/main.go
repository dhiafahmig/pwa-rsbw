package main

import (
	"log"
	"pwa-rsbw/internal/auth"
	"pwa-rsbw/internal/config"
	"pwa-rsbw/internal/database"
	"pwa-rsbw/internal/listranap"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// ✅ Load .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("⚠️ No .env file found, using system environment variables")
	} else {
		log.Printf("✅ .env file loaded successfully")
	}

	// Load configuration
	cfg := config.Load()

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Setup database connection
	db := database.Connect(cfg)

	// Setup dependencies
	authRepo := auth.NewAuthRepository(db)
	authService := auth.NewAuthService(authRepo, cfg.JWTSecret)
	authHandler := auth.NewAuthHandler(authService)

	listRanapRepo := listranap.NewPasienRepository(db)
	listRanapService := listranap.NewPasienService(listRanapRepo)
	listRanapHandler := listranap.NewPasienHandler(listRanapService)

	// Setup router
	r := gin.Default()

	// ✅ FIXED CORS - Include ngrok-skip-browser-warning
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		method := c.Request.Method

		log.Printf("🔄 %s %s from Origin: [%s]", method, c.Request.URL.Path, origin)

		// ✅ Allow all origins and include ngrok header
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token, X-Requested-With, Origin, ngrok-skip-browser-warning")
		c.Header("Access-Control-Allow-Credentials", "false")
		c.Header("Access-Control-Max-Age", "86400")

		log.Printf("✅ CORS Headers Set (with ngrok support)")

		if method == "OPTIONS" {
			log.Printf("✅ OPTIONS preflight handled for: %s", c.Request.URL.Path)
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// ✅ Root endpoint
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service": "RS Bumi Waras - DPJP API",
			"version": "1.0.0",
			"status":  "running",
			"time":    time.Now().Format("2006-01-02 15:04:05"),
		})
	})

	// ✅ Health check endpoints
	r.GET("/health", func(c *gin.Context) {
		log.Printf("💓 Health check accessed")
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "API is running",
			"time":    time.Now().Format("2006-01-02 15:04:05"),
		})
	})

	r.GET("/api/v1/health", func(c *gin.Context) {
		log.Printf("💓 API v1 health check accessed")
		c.JSON(200, gin.H{
			"status":  "success",
			"service": "DPJP API",
			"message": "Backend running successfully",
			"version": "1.0.0",
			"time":    time.Now().Format("2006-01-02 15:04:05"),
		})
	})

	// ✅ Test endpoint
	r.GET("/api/v1/test", func(c *gin.Context) {
		log.Printf("🧪 Test endpoint accessed")
		c.JSON(200, gin.H{
			"message":   "✅ Backend connection successful!",
			"timestamp": time.Now().Format("2006-01-02 15:04:05"),
			"origin":    c.Request.Header.Get("Origin"),
			"headers":   c.Request.Header,
		})
	})

	// ✅ Auth routes
	authRoutes := r.Group("/api/v1/auth")
	{
		authRoutes.POST("/login", func(c *gin.Context) {
			log.Printf("🔐 Login attempt from: %s", c.ClientIP())
			authHandler.Login(c)
		})
	}

	// ✅ Protected routes
	protectedRoutes := r.Group("/api/v1")
	protectedRoutes.Use(func(c *gin.Context) {
		log.Printf("🔒 Protected route access: %s %s from %s",
			c.Request.Method, c.Request.URL.Path, c.ClientIP())
		authHandler.JWTMiddleware()(c)
	})
	{
		protectedRoutes.GET("/profile", func(c *gin.Context) {
			idUser := c.GetString("id_user")
			kdDokter := c.GetString("kd_dokter")
			c.JSON(200, gin.H{
				"status": "success",
				"data": gin.H{
					"id_user":   idUser,
					"kd_dokter": kdDokter,
					"message":   "Profile accessed successfully",
					"timestamp": time.Now().Format("2006-01-02 15:04:05"),
				},
			})
		})
	}

	// ✅ Ranap routes (protected)
	ranapRoutes := protectedRoutes.Group("/ranap")
	{
		ranapRoutes.GET("/profile", func(c *gin.Context) {
			kdDokter := c.GetString("kd_dokter")
			log.Printf("👨‍⚕️ Doctor profile requested by: %s", kdDokter)
			listRanapHandler.GetDokterProfile(c)
		})

		ranapRoutes.GET("/pasien", func(c *gin.Context) {
			kdDokter := c.GetString("kd_dokter")
			log.Printf("👥 Patients list requested by dokter: %s", kdDokter)
			listRanapHandler.GetPasienRawatInapAktif(c)
		})

		ranapRoutes.GET("/pasien/:no_rawat", func(c *gin.Context) {
			kdDokter := c.GetString("kd_dokter")
			noRawat := c.Param("no_rawat")
			log.Printf("👤 Patient detail requested: %s by dokter: %s", noRawat, kdDokter)
			listRanapHandler.GetPasienDetail(c)
		})
	}

	// ✅ Server startup
	serverAddr := "0.0.0.0:" + cfg.ServerPort

	log.Printf("🚀 Starting server on %s", serverAddr)
	log.Printf("📋 Available endpoints:")
	log.Printf("   GET  /health")
	log.Printf("   GET  /api/v1/health")
	log.Printf("   GET  /api/v1/test")
	log.Printf("   POST /api/v1/auth/login")
	log.Printf("   GET  /api/v1/profile (protected)")
	log.Printf("   GET  /api/v1/ranap/pasien (protected)")
	log.Printf("✅ CORS configured for ngrok support")
	log.Printf("")

	if err := r.Run(serverAddr); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}
