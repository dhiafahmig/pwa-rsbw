package listranap

import (
	"net/http"

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

// ✅ ENHANCED: Support filter parameter untuk CPPT
func (h *PasienHandler) GetPasienRawatInapAktif(c *gin.Context) {
	kdDokter := c.GetString("kd_dokter")
	if kdDokter == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Doctor code not found in token",
		})
		return
	}

	// ✅ TAMBAH: Get filter parameter
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
	noRawat := c.Param("no_rawat")
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
