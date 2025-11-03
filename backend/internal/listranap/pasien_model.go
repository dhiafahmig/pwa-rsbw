package listranap

import (
	"time"
)

// Main struct untuk response list pasien
type PasienRawatInap struct {
	NoRawat         string    `json:"no_rawat" gorm:"column:no_rawat"`
	NoRKMMedis      string    `json:"no_rkm_medis" gorm:"column:no_rkm_medis"`
	NamaPasien      string    `json:"nm_pasien" gorm:"column:nm_pasien"`
	PenanggungJawab string    `json:"penanggung_jawab" gorm:"column:penanggung_jawab"`
	KodeDokter      string    `json:"kd_dokter" gorm:"column:kd_dokter"`
	NamaDokter      string    `json:"nm_dokter" gorm:"column:nm_dokter"`
	NoTelp          string    `json:"no_telp" gorm:"column:no_telp"`
	KodeKamar       string    `json:"kd_kamar" gorm:"column:kd_kamar"`
	NamaBangsal     string    `json:"nm_bangsal" gorm:"column:nm_bangsal"`
	DiagnosaAwal    string    `json:"diagnosa_awal" gorm:"column:diagnosa_awal"`
	TanggalMasuk    time.Time `json:"tgl_masuk" gorm:"column:tgl_masuk"`

	// ✅ DIPERBARUI: Mengganti bool CpptHariIni dengan string CpptStatus
	CpptStatus        string     `json:"cppt_status" gorm:"column:cppt_status"`               // "done", "pending", "new"
	JumlahCpptHariIni int        `json:"jumlah_cppt_hari_ini" gorm:"column:jumlah_cppt"`      // Jumlah CPPT hari ini
	CpptTerakhir      *time.Time `json:"cppt_terakhir,omitempty" gorm:"column:cppt_terakhir"` // Tanggal CPPT terakhir
}

// Response structure
type PasienListResponse struct {
	Status      string            `json:"status"`
	Message     string            `json:"message"`
	Total       int               `json:"total"`
	Data        []PasienRawatInap `json:"data"`
	DokterInfo  DokterInfo        `json:"dokter_info"`
	CpptSummary CpptSummary       `json:"cppt_summary"`
}

// ✅ Info dokter yang login
type DokterInfo struct {
	KodeDokter  string `json:"kd_dokter"`
	NamaDokter  string `json:"nm_dokter"`
	NoTelp      string `json:"no_telp"`
	TanggalList string `json:"tanggal_list"`
}

// ✅ DIPERBARUI: CPPT Summary dengan 3 status
type CpptSummary struct {
	TotalPasien       int     `json:"total_pasien"`
	SudahCpptHariIni  int     `json:"sudah_cppt_hari_ini"`  // "done"
	BelumCpptHariIni  int     `json:"belum_cppt_hari_ini"`  // "pending"
	PasienBaruHariIni int     `json:"pasien_baru_hari_ini"` // "new"
	PersentaseCppt    float64 `json:"persentase_cppt"`      // Persentase (done / (done + pending))
}

// Dokter profile
type DokterProfile struct {
	KodeDokter   string `json:"kd_dokter" gorm:"column:kd_dokter"`
	NamaDokter   string `json:"nm_dokter" gorm:"column:nm_dokter"`
	NoTelp       string `json:"no_telp" gorm:"column:no_telp"`
	Spesialisasi string `json:"spesialisasi" gorm:"column:spesialisasi"`
}

type DokterProfileResponse struct {
	Status  string        `json:"status"`
	Message string        `json:"message"`
	Data    DokterProfile `json:"data"`
}

// ✅ DIPERBARUI: Request filter untuk frontend
type PasienFilterRequest struct {
	Filter string `json:"filter" form:"filter"` // "all", "sudah_cppt", "belum_cppt", "pasien_baru"
}
