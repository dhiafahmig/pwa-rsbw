// backend/internal/notifications/notifications_handler.go
package notifications

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Handler sekarang hanya bergantung pada Service.
type Handler struct {
	service *Service
}

// NewHandler membuat instance Handler baru.
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// RegisterToken adalah handler HTTP yang sudah disesuaikan untuk Gin.
func (h *Handler) RegisterToken(c *gin.Context) {
	// Ambil ID Dokter dari context Gin yang sudah diisi oleh middleware JWT
	kdDokter, exists := c.Get("kd_dokter")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized", "message": "Informasi dokter tidak ditemukan di token"})
		return
	}

	// Decode body JSON dari request ke dalam struct
	var req RegisterTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request", "message": "Body JSON tidak valid"})
		return
	}

	// Panggil service untuk memproses logika
	err := h.service.RegisterToken(req)
	if err != nil {
		log.Printf("ERROR: Gagal mendaftarkan token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error", "message": "Gagal menyimpan token"})
		return
	}

	log.Printf("INFO: Berhasil mendaftarkan token untuk kd_dokter %s", kdDokter)

	// Kirim respons sukses
	c.JSON(http.StatusOK, gin.H{
		"status":  "sukses",
		"message": "Token berhasil didaftarkan",
	})
}
