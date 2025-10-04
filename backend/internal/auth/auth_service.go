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

	// Get user using AES decrypt query (sama seperti PHP)
	_, err := s.authRepo.GetUserByCredentials(idUser, password)
	if err != nil {
		fmt.Printf("❌ Login failed: %v\n", err)
		return nil, errors.New("invalid credentials")
	}

	fmt.Printf("✅ Login successful for user: %s\n", idUser)

	// Generate JWT token
	expirationTime := time.Now().Add(30 * time.Minute) // 30 minutes
	claims := &JWTClaims{
		IDUser: idUser, // Use plain text id_user untuk JWT
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
		Token:     tokenString,
		IDUser:    idUser,
		ExpiresAt: expirationTime.Unix(),
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
