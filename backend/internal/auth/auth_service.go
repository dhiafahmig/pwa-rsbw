package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type AuthService interface {
	Login(idUser, password string) (*LoginResponse, error)
	ValidateToken(tokenString string) (*JWTClaims, error)
}

type authService struct {
	authRepo  AuthRepository
	jwtSecret []byte
}

func NewAuthService(authRepo AuthRepository, jwtSecret string) AuthService {
	return &authService{
		authRepo:  authRepo,
		jwtSecret: []byte(jwtSecret),
	}
}

func (s *authService) Login(idUser, password string) (*LoginResponse, error) {
	fmt.Printf("🔍 Login attempt - ID: %s\n", idUser)

	//  Get user dengan kode dokter DAN nama dokter
	user, err := s.authRepo.GetUserByCredentials(idUser, password)
	if err != nil {
		fmt.Printf("❌ Login failed: %v\n", err)
		return nil, errors.New("invalid credentials")
	}

	fmt.Printf("✅ Login successful for user: %s, Dokter: %s - %s\n", idUser, user.KodeDokter, user.NamaDokter)

	//  Generate JWT dengan kode dokter DAN nama dokter
	expirationTime := time.Now().Add(30 * time.Minute)
	claims := &JWTClaims{
		IDUser:     idUser,
		KodeDokter: user.KodeDokter,
		NamaDokter: user.NamaDokter,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.jwtSecret)
	if err != nil {
		fmt.Printf("❌ Failed to generate token: %v\n", err)
		return nil, errors.New("failed to generate token")
	}

	fmt.Printf("✅ JWT token generated successfully\n")
	return &LoginResponse{
		Token:      tokenString,
		IDUser:     idUser,
		KodeDokter: user.KodeDokter,
		NamaDokter: user.NamaDokter,
		ExpiresAt:  expirationTime.Unix(),
	}, nil
}

func (s *authService) ValidateToken(tokenString string) (*JWTClaims, error) {
	claims := &JWTClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return s.jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
