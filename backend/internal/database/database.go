// Di file: internal/database/database.go
package database

import (
	"database/sql"
	"log"
	"pwa-rsbw/internal/config"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql" // ✅ PERBAIKAN: Ini adalah baris yang salah ketik
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Connect membuat koneksi GORM UTAMA dan mengembalikan GORM DB
// dan *sql.DB mentahnya untuk worker.
func Connect(cfg *config.Config) (*gorm.DB, *sql.DB) {
	var logLevel logger.LogLevel
	if cfg.Environment == "production" {
		logLevel = logger.Silent
	} else {
		logLevel = logger.Info
	}

	// 1. Buat koneksi GORM
	db, err := gorm.Open(mysql.Open(cfg.DBDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		log.Fatalf("❌ Failed to connect to GORM database: %v", err)
	}

	// 2. Ambil *sql.DB dari GORM (ini adalah pool koneksi yang sama)
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("❌ Failed to get database instance from GORM: %v", err)
	}

	// 3. Atur koneksi pool di *sql.DB
	// Pengaturan ini akan berlaku untuk GORM DAN worker
	sqlDB.SetConnMaxLifetime(time.Minute * 3)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(20) // Naikkan sedikit untuk GORM + Worker
	sqlDB.SetConnMaxIdleTime(time.Minute * 1)

	// 4. Ping database
	if err = sqlDB.Ping(); err != nil {
		log.Fatalf("❌ Failed to ping database: %v", err)
	}

	log.Println("✅ GORM & SQL Database connected successfully (Single Pool)")
	return db, sqlDB // Kembalikan keduanya
}
