package listranap

import (
	"net/http"
	"strings" // ✨ 1. IMPOR "strings"

	"github.com/gin-gonic/gin"
)

type PasienHandler struct {
	pasienService PasienService
}

func NewPasienHandler(pasienService PasienService) *PasienHandler {
	return &PasienHandler{
		pasienService: pasienService,
	}
}

// Support filter parameter untuk CPPT
func (h *PasienHandler) GetPasienRawatInapAktif(c *gin.Context) {
	kdDokter := c.GetString("kd_dokter")
	if kdDokter == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Doctor code not found in token",
		})
		return
	}

	// Get filter parameter
	filter := c.DefaultQuery("filter", "all") // "all", "sudah_cppt", "belum_cppt"

	response, err := h.pasienService.GetPasienAktifByDokterWithFilter(kdDokter, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get patient list",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// Detail pasien dengan CPPT info
func (h *PasienHandler) GetPasienDetail(c *gin.Context) {
	// ✨ 2. AMBIL PARAMETER DAN BERSIHKAN
	noRawat := c.Param("no_rawat")
	noRawat = strings.TrimPrefix(noRawat, "/") // Hapus / di awal

	if noRawat == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Missing 'no_rawat' parameter",
		})
		return
	}

	kdDokter := c.GetString("kd_dokter")
	if kdDokter == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Doctor code not found in token",
		})
		return
	}

	pasien, err := h.pasienService.GetDetailPasien(noRawat, kdDokter)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Patient not found or not your DPJP",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   pasien,
	})
}

// Profile dokter yang login
func (h *PasienHandler) GetDokterProfile(c *gin.Context) {
	kdDokter := c.GetString("kd_dokter")
	if kdDokter == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Doctor code not found in token",
		})
		return
	}

	response, err := h.pasienService.GetDokterProfile(kdDokter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get doctor profile",
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// ==========================================================
// ✨ Handler untuk mengambil riwayat CPPT
// ==========================================================
func (h *PasienHandler) GetCpptHistory(c *gin.Context) {
	// ✨ 3. AMBIL PARAMETER DAN BERSIHKAN
	noRawat := c.Param("no_rawat")
	noRawat = strings.TrimPrefix(noRawat, "/") // Hapus / di awal

	if noRawat == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Missing 'no_rawat' parameter",
		})
		return
	}

	// Ambil kd_dokter dari token (didapat dari middleware auth)
	kdDokter := c.GetString("kd_dokter")
	if kdDokter == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Doctor code not found in token",
		})
		return
	}

	// Panggil service
	response, err := h.pasienService.GetCpptHistory(noRawat, kdDokter)
	if err != nil {
		// Jika error-nya adalah "tidak ditemukan" atau "bukan DPJP"
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	// Sukses
	c.JSON(http.StatusOK, response)
}
