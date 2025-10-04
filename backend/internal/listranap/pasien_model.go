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
}

// Response structure
type PasienListResponse struct {
	Status  string            `json:"status"`
	Message string            `json:"message"`
	Total   int               `json:"total"`
	Data    []PasienRawatInap `json:"data"`
	Filter  FilterInfo        `json:"filter"`
}

type FilterInfo struct {
	DPJP        string `json:"dpjp"`
	NamaDokter  string `json:"nama_dokter"`
	TanggalList string `json:"tanggal_list"`
}

// Dokter DPJP list
type DokterDPJP struct {
	KodeDokter string `json:"kd_dokter" gorm:"column:kd_dokter"`
	NamaDokter string `json:"nm_dokter" gorm:"column:nm_dokter"`
	NoTelp     string `json:"no_telp" gorm:"column:no_telp"`
}

type DokterListResponse struct {
	Status  string       `json:"status"`
	Message string       `json:"message"`
	Data    []DokterDPJP `json:"data"`
}
