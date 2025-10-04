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

func (h *PasienHandler) GetDokterDPJP(c *gin.Context) {
	response, err := h.pasienService.GetDokterDPJP()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Failed to get DPJP list",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *PasienHandler) GetPasienRawatInapAktif(c *gin.Context) {
	kdDokter := c.Query("dpjp") // Query parameter: ?dpjp=DR001

	response, err := h.pasienService.GetPasienAktif(kdDokter)
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

func (h *PasienHandler) GetPasienDetail(c *gin.Context) {
	noRawat := c.Param("no_rawat")

	pasien, err := h.pasienService.GetDetailPasien(noRawat)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"status":  "error",
			"message": "Patient not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   pasien,
	})
}
