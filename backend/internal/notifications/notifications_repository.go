// backend/internal/notifications/notifications_repository.go
package notifications

import (
	"database/sql"
)

// Repository menangani semua query database untuk notifikasi.
type Repository struct {
	DB *sql.DB
}

// NewRepository membuat instance Repository baru.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{DB: db}
}

// SaveOrUpdateToken menyimpan atau memperbarui token di database.
// Menggunakan "INSERT ... ON DUPLICATE KEY UPDATE" untuk efisiensi.
func (r *Repository) SaveOrUpdateToken(req RegisterTokenRequest) error {
	// PENTING: Pastikan tabel Anda memiliki UNIQUE index pada kolom `token`
	// agar ON DUPLICATE KEY UPDATE berfungsi. Jalankan SQL ini sekali:
	// ALTER TABLE fcm_tokens ADD UNIQUE (token(191));
	query := `
		INSERT INTO fcm_tokens (
			token, user_id, kd_dokter, device_type, user_agent, 
			platform, active, last_used, created_at, updated_at
		) 
		VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW()) 
		ON DUPLICATE KEY UPDATE 
			user_id = VALUES(user_id), 
			kd_dokter = VALUES(kd_dokter),
			active = 1,
			last_used = NOW(),
			updated_at = NOW()
	`
	_, err := r.DB.Exec(
		query,
		req.Token, req.UserID, req.KdDokter, req.DeviceType, req.UserAgent, req.Platform,
	)
	return err
}
