package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	// Database Config
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBDSN      string

	// Server Config
	ServerPort string

	// JWT Config
	JWTSecret string

	// App Config
	Environment string // development, production
}

func Load() *Config {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	config := &Config{
		// Database
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "3306"),
		DBUser:     getEnv("DB_USER", "root"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "hospital_db"),

		// Server
		ServerPort: getEnv("SERVER_PORT", "8080"),

		// JWT
		JWTSecret: getEnv("JWT_SECRET", "your-super-secret-jwt-key"),

		// Environment
		Environment: getEnv("ENVIRONMENT", "development"),
	}

	// Build DSN
	config.DBDSN = config.DBUser + ":" + config.DBPassword +
		"@tcp(" + config.DBHost + ":" + config.DBPort + ")/" +
		config.DBName + "?charset=utf8mb4&parseTime=True&loc=Local"

	return config
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
