package auth

import (
	"github.com/golang-jwt/jwt/v5"
)

// User model sesuai table user
type User struct {
	IDUser   string `json:"id_user" gorm:"column:id_user;primaryKey"`
	Password string `json:"-" gorm:"column:password"` // Hidden dari JSON response
	// Tambahkan field lain jika diperlukan
}

// Request login
type LoginRequest struct {
	IDUser   string `json:"id_user" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Response login
type LoginResponse struct {
	Token     string `json:"token"`
	IDUser    string `json:"id_user"`
	ExpiresAt int64  `json:"expires_at"`
}

// JWT Claims
type JWTClaims struct {
	IDUser string `json:"id_user"`
	jwt.RegisteredClaims
}

// Specify table name untuk GORM
func (User) TableName() string {
	return "user"
}
