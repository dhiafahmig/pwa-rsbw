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

	// ✅ Query dengan JOIN ke tabel dokter untuk get kode dokter DAN nama dokter
	err := r.db.Raw(`
		SELECT 
			u.id_user,
			u.password,
			COALESCE(d.kd_dokter, '') as kd_dokter,
			COALESCE(d.nm_dokter, '') as nm_dokter
		FROM user u
		LEFT JOIN dokter d ON AES_DECRYPT(u.id_user, 'nur') = d.kd_dokter
		WHERE AES_DECRYPT(u.id_user, 'nur') = ?
		AND AES_DECRYPT(u.password, 'windi') = ?
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
