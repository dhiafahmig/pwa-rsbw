package main

import (
	"log"
	"pwa-rsbw/internal/auth"
	"pwa-rsbw/internal/config"
	"pwa-rsbw/internal/database"
	"pwa-rsbw/internal/listranap"
	"pwa-rsbw/internal/notifications" // Impor modul notifikasi
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

	// Koneksi database menggunakan GORM (menghasilkan *gorm.DB)
	db := database.Connect(cfg)

	// --- DEPENDENCY INJECTION (Merakit semua lapisan) ---
	// ✅ FIX: Berikan setiap repository tipe DB yang benar.

	// Repository untuk Auth dan ListRanap dirancang untuk menggunakan GORM.
	// Jadi kita berikan objek 'db' (*gorm.DB) secara langsung.
	authRepo := auth.NewAuthRepository(db)
	listRanapRepo := listranap.NewPasienRepository(db)

	// Repository untuk Notifications dirancang untuk menggunakan *sql.DB standar.
	// Jadi kita ekstrak objek *sql.DB dari GORM.
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("❌ Failed to get underlying sql.DB from GORM: %v", err)
	}
	notificationRepo := notifications.NewRepository(sqlDB)

	// Inisialisasi Service dan Handler seperti biasa
	authService := auth.NewAuthService(authRepo, cfg.JWTSecret)
	authHandler := auth.NewAuthHandler(authService)

	listRanapService := listranap.NewPasienService(listRanapRepo)
	listRanapHandler := listranap.NewPasienHandler(listRanapService)

	notificationService := notifications.NewService(notificationRepo)
	notificationHandler := notifications.NewHandler(notificationService)
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
	// Root & Health check endpoints
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

	// Rute Auth (Publik)
	authRoutes := apiV1.Group("/auth")
	{
		authRoutes.POST("/login", authHandler.Login)
	}

	// Rute yang Dilindungi (Membutuhkan JWT)
	protectedRoutes := apiV1.Group("/")
	protectedRoutes.Use(authHandler.JWTMiddleware())
	{
		// Rute Profile
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
			ranapRoutes.GET("/pasien/:no_rawat", listRanapHandler.GetPasienDetail)
		}

		// Rute Notifikasi
		notificationRoutes := protectedRoutes.Group("/notifications")
		{
			notificationRoutes.POST("/register-token", notificationHandler.RegisterToken)
		}
	}
	// --- AKHIR DARI ROUTING ---

	// Jalankan Server
	serverAddr := "0.0.0.0:" + cfg.ServerPort

	log.Printf("🚀 Starting server on %s", serverAddr)
	log.Printf("📋 Available endpoints:")
	log.Printf("   GET  /api/v1/health")
	log.Printf("   POST /api/v1/auth/login")
	log.Printf("   GET  /api/v1/profile (protected)")
	log.Printf("   GET  /api/v1/ranap/pasien (protected)")
	log.Printf("   POST /api/v1/notifications/register-token (protected)")
	log.Printf("")

	if err := r.Run(serverAddr); err != nil {
		log.Fatalf("❌ Failed to start server: %v", err)
	}
}
