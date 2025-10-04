package listranap

import (
	"gorm.io/gorm"
)

type PasienRepository interface {
	GetPasienRawatInapByDokter(kdDokter string) ([]PasienRawatInap, error)
	GetPasienDetail(noRawat string, kdDokter string) (*PasienRawatInap, error)
	GetDokterProfile(kdDokter string) (*DokterProfile, error)
}

type pasienRepository struct {
	db *gorm.DB
}

func NewPasienRepository(db *gorm.DB) PasienRepository {
	return &pasienRepository{
		db: db,
	}
}

// ✅ SELALU filter by kode dokter (tidak optional lagi)
func (r *pasienRepository) GetPasienRawatInapByDokter(kdDokter string) ([]PasienRawatInap, error) {
	var pasienList []PasienRawatInap

	// ✅ Query SELALU filter by kode dokter
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
        WHERE ki.stts_pulang = '-' AND d.kd_dokter = ?
        ORDER BY b.nm_bangsal, k.kd_kamar, ki.tgl_masuk
    `

	err := r.db.Raw(query, kdDokter).Scan(&pasienList).Error
	if err != nil {
		return nil, err
	}

	return pasienList, nil
}

// ✅ Detail pasien hanya jika dokter yang login adalah DPJP-nya
func (r *pasienRepository) GetPasienDetail(noRawat string, kdDokter string) (*PasienRawatInap, error) {
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
        WHERE ki.stts_pulang = '-' 
        AND ki.no_rawat = ? 
        AND d.kd_dokter = ?
    `

	err := r.db.Raw(query, noRawat, kdDokter).Scan(&pasien).Error
	if err != nil {
		return nil, err
	}

	// Check if found
	if pasien.NoRawat == "" {
		return nil, gorm.ErrRecordNotFound
	}

	return &pasien, nil
}

// ✅ Get profile dokter yang login
func (r *pasienRepository) GetDokterProfile(kdDokter string) (*DokterProfile, error) {
	var dokter DokterProfile

	query := `
        SELECT kd_dokter, nm_dokter, no_telp, spesialisasi
        FROM dokter 
        WHERE kd_dokter = ?
    `

	err := r.db.Raw(query, kdDokter).Scan(&dokter).Error
	if err != nil {
		return nil, err
	}

	if dokter.KodeDokter == "" {
		return nil, gorm.ErrRecordNotFound
	}

	return &dokter, nil
}
