// backend/internal/notifications/notifications_model.go
package notifications

import (
	"database/sql"
	"time"
)

// FCMToken merepresentasikan data lengkap dari tabel token Anda.
type FCMToken struct {
	ID         int64          `json:"id"`
	Token      string         `json:"token"`
	UserID     sql.NullString `json:"user_id"`
	KdDokter   sql.NullString `json:"kd_dokter"`
	DeviceType sql.NullString `json:"device_type"`
	UserAgent  sql.NullString `json:"user_agent"`
	Platform   sql.NullString `json:"platform"`
	Active     bool           `json:"active"`
	LastUsed   sql.NullTime   `json:"last_used"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  sql.NullTime   `json:"updated_at"`
}

// RegisterTokenRequest tetap sama karena hanya berisi data dari frontend.
type RegisterTokenRequest struct {
	Token      string `json:"token"`
	UserID     string `json:"user_id"`
	KdDokter   string `json:"kd_dokter"`
	DeviceType string `json:"device_type"`
	UserAgent  string `json:"user_agent"`
	Platform   string `json:"platform"`
	Timestamp  string `json:"timestamp"`
}
