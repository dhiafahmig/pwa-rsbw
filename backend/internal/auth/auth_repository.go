package auth

import (
	"gorm.io/gorm"
)

type AuthRepository interface {
	GetUserByCredentials(idUser, password string) (*User, error)
}

type authRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) AuthRepository {
	return &authRepository{
		db: db,
	}
}

func (r *authRepository) GetUserByCredentials(idUser, password string) (*User, error) {
	var user User

	// Raw query sama persis seperti PHP
	err := r.db.Raw(`
        SELECT id_user, password 
        FROM user 
        WHERE AES_DECRYPT(id_user, 'nur') = ? 
        AND AES_DECRYPT(password, 'windi') = ?
    `, idUser, password).Scan(&user).Error

	if err != nil {
		return nil, err
	}

	// Check if user found
	if user.IDUser == "" {
		return nil, gorm.ErrRecordNotFound
	}

	return &user, nil
}
