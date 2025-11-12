package main

import (
	"log"
	"pwa-rsbw/internal/auth"
	"pwa-rsbw/internal/config"
	"pwa-rsbw/internal/database"
	"pwa-rsbw/internal/listranap"
	"pwa-rsbw/internal/notifications"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Muat file .env
	if err := godotenv.Load(); err != nil {
		log.Printf("⚠️ No .env file found, using system environment variables")
	} else {
		log.Printf("✅ .env file loaded successfully")
	}

	// Muat konfigurasi
	cfg := config.Load()

	// Atur mode Gin
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// KONEKSI DATABASE TUNGGAL
	db, sqlDB_worker := database.Connect(cfg)

	// --- DEPENDENCY INJECTION (Merakit semua lapisan) ---
	authRepo := auth.NewAuthRepository(db)
	listRanapRepo := listranap.NewPasienRepository(db)
	notificationRepo := notifications.NewRepository(sqlDB_worker)

	// Inisialisasi Service dan Handler
	authService := auth.NewAuthService(authRepo, cfg.JWTSecret)
	authHandler := auth.NewAuthHandler(authService)

	listRanapService := listranap.NewPasienService(listRanapRepo)
	listRanapHandler := listranap.NewPasienHandler(listRanapService)

	// ✅ PERBAIKAN: Berikan AppID, APIKey, dan FrontendURL ke Service
	notificationService := notifications.NewService(
		notificationRepo,
		cfg.OneSignalAppID,
		cfg.OneSignalAPIKey,
		cfg.FrontendURL, // <-- TAMBAHKAN INI
	)

	// --- AKHIR DARI DEPENDENCY INJECTION ---

	// Setup router Gin
	r := gin.Default()

	// Middleware untuk CORS
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-CSRF-Token, X-Requested-With, Origin, ngrok-skip-browser-warning")
		c.Header("Access-Control-Allow-Credentials", "false")
		c.Header("Access-Control-Max-Age", "86400")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// --- ROUTING ---
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service": "RS Bumi Waras - DPJP API",
			"status":  "running",
			"time":    time.Now().Format("2006-01-02 15:04:05"),
		})
	})

	apiV1 := r.Group("/api/v1")
	apiV1.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "success", "message": "API is running"})
	})

	// Rute Auth (Publik dan Dilindungi)
	authRoutes := apiV1.Group("/auth")
	{
		authRoutes.POST("/login", authHandler.Login)
		authProtected := authRoutes.Group("")
		authProtected.Use(authHandler.JWTMiddleware())
		{
			authProtected.GET("/validate", authHandler.Validate)
		}
	}

	// Rute yang Dilindungi (Membutuhkan JWT)
	protectedRoutes := apiV1.Group("/")
	protectedRoutes.Use(authHandler.JWTMiddleware())
	{
		protectedRoutes.GET("/profile", func(c *gin.Context) {
			idUser := c.GetString("id_user")
			kdDokter := c.GetString("kd_dokter")
			c.JSON(200, gin.H{
				"status": "success",
				"data": gin.H{
					"id_user":   idUser,
					"kd_dokter": kdDokter,
				},
			})
		})

		// Rute Ranap (Rawat Inap)
		ranapRoutes := protectedRoutes.Group("/ranap")
		{
			ranapRoutes.GET("/profile", listRanapHandler.GetDokterProfile)
			ranapRoutes.GET("/pasien", listRanapHandler.GetPasienRawatInapAktif)
			ranapRoutes.GET("/pasien/:no_rat", listRanapHandler.GetPasienDetail)
		}
	}
	// --- AKHIR DARI ROUTING ---

	// --- TAMBAHAN: JALANKAN WORKER ---
	go notificationService.StartWorker(5 * time.Second)

	// Jalankan Server
	serverAddr := "0.0.0.0:" + cfg.ServerPort
	log.Printf("🚀 Starting server on %s", serverAddr)
	log.Printf("✅ Notification Worker (OneSignal) dimulai (cek DB setiap 5 detik).")

	if err := r.Run(serverAddr); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}
