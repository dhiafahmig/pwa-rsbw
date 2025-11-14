// backend/internal/notifications/notifications_service.go
package notifications

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// Service berisi logika bisnis untuk notifikasi.
type Service struct {
	repo            *Repository
	httpClient      *http.Client
	oneSignalAppID  string
	oneSignalAPIKey string
	frontendURL     string
}

// NewService membuat instance Service baru.
func NewService(repo *Repository, appID string, apiKey string, frontendURL string) *Service {
	return &Service{
		repo:            repo,
		oneSignalAppID:  appID,
		oneSignalAPIKey: apiKey,
		frontendURL:     frontendURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// StartWorker memulai proses background untuk mengirim notifikasi
func (s *Service) StartWorker(interval time.Duration) {
	log.Printf("✅ Notification Worker dimulai (cek DB setiap %v).", interval)
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	// Gunakan 'for range' yang lebih idiomatik
	for range ticker.C {
		err := s.processPendingNotifications()
		if err != nil {
			log.Printf("ERROR (Worker): %v", err)
		}
	}
}

// processPendingNotifications mengambil dan mengirim notifikasi
func (s *Service) processPendingNotifications() error {
	notifikasiList, err := s.repo.GetPendingNotifications() //
	if err != nil {
		return fmt.Errorf("gagal mengambil notifikasi pending: %v", err)
	}

	if len(notifikasiList) > 0 {
		log.Printf("INFO (Worker): Ditemukan %d notifikasi untuk dikirim.", len(notifikasiList))
	}

	for _, notif := range notifikasiList {
		err := s.sendNotificationToOneSignal(notif)
		if err != nil {
			log.Printf("ERROR (Worker): Gagal mengirim notifikasi (ID: %d): %v", notif.ID, err)
			s.repo.UpdateNotificationStatus(notif.ID, "failed", err.Error()) //
		} else {
			log.Printf("INFO (Worker): Sukses mengirim notifikasi (ID: %d) ke kd_dokter %s", notif.ID, notif.KdDokter)
			s.repo.UpdateNotificationStatus(notif.ID, "sent", "Success") //
		}
	}
	return nil
}

// sendNotificationToOneSignal mengirim notifikasi ke API OneSignal
func (s *Service) sendNotificationToOneSignal(notif NotifikasiPending) error {

	webUrl := fmt.Sprintf("%s/patients/%s", s.frontendURL, notif.NoRawat)

	// Buat payload JSON untuk OneSignal
	payload := map[string]interface{}{
		"app_id":                    s.oneSignalAppID,
		"include_external_user_ids": []string{notif.KdDokter},
		"headings": map[string]string{
			"en": notif.Judul,
		},
		"contents": map[string]string{
			"en": notif.Isi,
		},
		"web_url": webUrl, // <-- Menggunakan URL yang sudah lengkap
	}

	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("gagal marshal payload: %v", err)
	}

	// Buat HTTP Request
	url := "https://onesignal.com/api/v1/notifications"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return fmt.Errorf("gagal membuat request: %v", err)
	}

	// Tambahkan header
	req.Header.Set("Content-Type", "application/json; charset=utf-8")
	req.Header.Set("Authorization", "Basic "+s.oneSignalAPIKey)

	// Kirim request
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("gagal mengirim request ke onesignal: %v", err)
	}
	defer resp.Body.Close()

	// Cek response
	if resp.StatusCode != http.StatusOK {
		var errResp map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errResp)
		return fmt.Errorf("onesignal merespons dengan %s: %v", resp.Status, errResp)
	}

	return nil
}
