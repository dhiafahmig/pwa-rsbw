package listranap

import (
	"gorm.io/gorm"
)

type PasienRepository interface {
	GetDokterDPJPWithActivePatients() ([]DokterDPJP, error)
	GetPasienRawatInapAktif(kdDokter string) ([]PasienRawatInap, error)
	GetPasienDetail(noRawat string) (*PasienRawatInap, error)
}

type pasienRepository struct {
	db *gorm.DB
}

func NewPasienRepository(db *gorm.DB) PasienRepository {
	return &pasienRepository{
		db: db,
	}
}

func (r *pasienRepository) GetDokterDPJPWithActivePatients() ([]DokterDPJP, error) {
	var dokterList []DokterDPJP

	// Query sama seperti PHP untuk dapat dokter yang punya pasien aktif
	query := `
        SELECT DISTINCT d.kd_dokter, d.nm_dokter, d.no_telp
        FROM dokter d 
        JOIN dpjp_ranap dr ON d.kd_dokter = dr.kd_dokter
        JOIN kamar_inap ki ON dr.no_rawat = ki.no_rawat
        WHERE ki.stts_pulang = '-'
        ORDER BY d.nm_dokter
    `

	err := r.db.Raw(query).Scan(&dokterList).Error
	if err != nil {
		return nil, err
	}

	return dokterList, nil
}

func (r *pasienRepository) GetPasienRawatInapAktif(kdDokter string) ([]PasienRawatInap, error) {
	var pasienList []PasienRawatInap

	// Query utama sama persis seperti PHP
	query := `
        SELECT
            ki.no_rawat,
            p.no_rkm_medis,
            p.nm_pasien,
            COALESCE(pj.png_jawab, 'N/A') as penanggung_jawab,
            k.kd_kamar,
            b.nm_bangsal,
            ki.diagnosa_awal,
            ki.tgl_masuk,
            d.nm_dokter,
            d.kd_dokter,
            d.no_telp
        FROM kamar_inap ki
        JOIN reg_periksa rp ON ki.no_rawat = rp.no_rawat
        JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
        JOIN dpjp_ranap dr ON ki.no_rawat = dr.no_rawat
        JOIN dokter d ON dr.kd_dokter = d.kd_dokter
        JOIN kamar k ON ki.kd_kamar = k.kd_kamar
        JOIN bangsal b ON k.kd_bangsal = b.kd_bangsal
        LEFT JOIN penjab pj ON rp.kd_pj = pj.kd_pj
        WHERE ki.stts_pulang = '-'
    `

	// Tambahkan filter DPJP jika ada
	if kdDokter != "" {
		query += " AND d.kd_dokter = ?"
		query += " ORDER BY b.nm_bangsal, k.kd_kamar, ki.tgl_masuk"

		err := r.db.Raw(query, kdDokter).Scan(&pasienList).Error
		return pasienList, err
	} else {
		query += " ORDER BY b.nm_bangsal, k.kd_kamar, ki.tgl_masuk"

		err := r.db.Raw(query).Scan(&pasienList).Error
		return pasienList, err
	}
}

func (r *pasienRepository) GetPasienDetail(noRawat string) (*PasienRawatInap, error) {
	var pasien PasienRawatInap

	query := `
        SELECT
            ki.no_rawat,
            p.no_rkm_medis,
            p.nm_pasien,
            COALESCE(pj.png_jawab, 'N/A') as penanggung_jawab,
            k.kd_kamar,
            b.nm_bangsal,
            ki.diagnosa_awal,
            ki.tgl_masuk,
            d.nm_dokter,
            d.kd_dokter,
            d.no_telp
        FROM kamar_inap ki
        JOIN reg_periksa rp ON ki.no_rawat = rp.no_rawat
        JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
        JOIN dpjp_ranap dr ON ki.no_rawat = dr.no_rawat
        JOIN dokter d ON dr.kd_dokter = d.kd_dokter
        JOIN kamar k ON ki.kd_kamar = k.kd_kamar
        JOIN bangsal b ON k.kd_bangsal = b.kd_bangsal
        LEFT JOIN penjab pj ON rp.kd_pj = pj.kd_pj
        WHERE ki.stts_pulang = '-' AND ki.no_rawat = ?
    `

	err := r.db.Raw(query, noRawat).Scan(&pasien).Error
	if err != nil {
		return nil, err
	}

	return &pasien, nil
}
