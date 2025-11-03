// backend/internal/notifications/notifications_service.go
package notifications

import "errors"

// Service berisi logika bisnis untuk notifikasi.
type Service struct {
	repo *Repository
}

// NewService membuat instance Service baru.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// RegisterToken adalah logika bisnis untuk mendaftarkan token.
// Di sini Anda bisa menambahkan validasi atau logika lain di masa depan.
func (s *Service) RegisterToken(req RegisterTokenRequest) error {
	// Validasi dasar
	if req.Token == "" {
		return errors.New("token tidak boleh kosong")
	}
	if req.KdDokter == "" && req.UserID == "" {
		return errors.New("user_id atau kd_dokter harus diisi")
	}

	// Panggil repository untuk menyimpan data
	return s.repo.SaveOrUpdateToken(req)
}
