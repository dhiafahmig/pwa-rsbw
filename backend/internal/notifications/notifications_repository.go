// backend/internal/notifications/notifications_repository.go
package notifications

import (
	"database/sql"
	"log"
	"time" // <-- TAMBAHAN
)

// Struct Notifikasi Sederhana (sesuai tabel notification_queue Anda)
type NotifikasiPending struct {
	ID       int64
	KdDokter string
	Judul    string
	Isi      string
	NoRawat  string
}

// Repository menangani semua query database untuk notifikasi.
type Repository struct {
	DB *sql.DB
}

// NewRepository membuat instance Repository baru.
func NewRepository(db *sql.DB) *Repository {
	return &Repository{DB: db}
}

// GetPendingNotifications mengambil notifikasi yang belum terkirim
func (r *Repository) GetPendingNotifications() ([]NotifikasiPending, error) {
	query := `
		SELECT id, kd_dokter, title, body, no_rawat
		FROM notification_queue 
		WHERE status = 'pending'
		ORDER BY created_at ASC
		LIMIT 10
	`
	//

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifikasiList []NotifikasiPending
	for rows.Next() {
		var n NotifikasiPending
		if err := rows.Scan(&n.ID, &n.KdDokter, &n.Judul, &n.Isi, &n.NoRawat); err != nil {
			log.Printf("ERROR (Repo): Gagal memindai notifikasi: %v", err)
			continue
		}
		notifikasiList = append(notifikasiList, n)
	}
	return notifikasiList, nil
}

// UpdateNotificationStatus mengubah status notifikasi (misal: 'pending' -> 'sent')
func (r *Repository) UpdateNotificationStatus(id int64, status string, responseMsg string) error {
	var query string
	var err error

	//  Query disesuaikan agar mengisi 'sent_at' dan 'error_message'
	if status == "sent" {
		query = "UPDATE notification_queue SET status = ?, error_message = ?, sent_at = ? WHERE id = ?"
		_, err = r.DB.Exec(query, status, responseMsg, time.Now(), id)
	} else {
		query = "UPDATE notification_queue SET status = ?, error_message = ? WHERE id = ?"
		_, err = r.DB.Exec(query, status, responseMsg, id)
	}
	//

	return err
}
