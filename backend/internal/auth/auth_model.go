package auth

import (
	"github.com/golang-jwt/jwt/v5"
)

// User model sesuai table user + dokter info
type User struct {
	IDUser     string `json:"id_user" gorm:"column:id_user;primaryKey"`
	Password   string `json:"-" gorm:"column:password"`          // Hidden dari JSON response
	KodeDokter string `json:"kd_dokter" gorm:"column:kd_dokter"` // ✅ Kode dokter
	NamaDokter string `json:"nm_dokter" gorm:"column:nm_dokter"` // ✅ TAMBAH: Nama dokter
}

// Request login
type LoginRequest struct {
	IDUser   string `json:"id_user" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Response login
type LoginResponse struct {
	Token      string `json:"token"`
	IDUser     string `json:"id_user"`
	KodeDokter string `json:"kd_dokter"` // ✅ Include kode dokter di response
	NamaDokter string `json:"nm_dokter"` // ✅ TAMBAH: Include nama dokter di response
	ExpiresAt  int64  `json:"expires_at"`
}

// JWT Claims - tambah nama dokter
type JWTClaims struct {
	IDUser     string `json:"id_user"`
	KodeDokter string `json:"kd_dokter"` // ✅ Kode dokter
	NamaDokter string `json:"nm_dokter"` // ✅ TAMBAH: Nama dokter
	jwt.RegisteredClaims
}

// Specify table name untuk GORM
func (User) TableName() string {
	return "user"
}
