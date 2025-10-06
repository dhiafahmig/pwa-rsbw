package listranap

import (
	"gorm.io/gorm"
)

type PasienRepository interface {
	GetPasienRawatInapByDokter(kdDokter string) ([]PasienRawatInap, error)
	GetPasienRawatInapByDokterWithCppt(kdDokter string, filter string) ([]PasienRawatInap, error) // ✅ TAMBAH: With CPPT filter
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

// ✅ ENHANCED: Query dengan CPPT status
func (r *pasienRepository) GetPasienRawatInapByDokter(kdDokter string) ([]PasienRawatInap, error) {
	return r.GetPasienRawatInapByDokterWithCppt(kdDokter, "all")
}

// ✅ TAMBAH: Query dengan CPPT filter
func (r *pasienRepository) GetPasienRawatInapByDokterWithCppt(kdDokter string, filter string) ([]PasienRawatInap, error) {
	var pasienList []PasienRawatInap

	// ✅ Enhanced query dengan CPPT check
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
		d.no_telp,
		-- ✅ CPPT Status untuk hari ini
		CASE 
			WHEN cppt_today.jumlah_cppt > 0 THEN 1 
			ELSE 0 
		END as cppt_hari_ini,
		COALESCE(cppt_today.jumlah_cppt, 0) as jumlah_cppt,
		cppt_last.cppt_terakhir
	FROM kamar_inap ki
	JOIN reg_periksa rp ON ki.no_rawat = rp.no_rawat
	JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
	JOIN dpjp_ranap dr ON ki.no_rawat = dr.no_rawat
	JOIN dokter d ON dr.kd_dokter = d.kd_dokter
	JOIN kamar k ON ki.kd_kamar = k.kd_kamar
	JOIN bangsal b ON k.kd_bangsal = b.kd_bangsal
	LEFT JOIN penjab pj ON rp.kd_pj = pj.kd_pj
	-- ✅ CPPT hari ini
	LEFT JOIN (
		SELECT 
			no_rawat,
			COUNT(*) as jumlah_cppt
		FROM pemeriksaan_ranap 
		WHERE DATE(tgl_perawatan) = CURDATE() 
		AND nip = ?
		GROUP BY no_rawat
	) cppt_today ON ki.no_rawat = cppt_today.no_rawat
	-- ✅ CPPT terakhir
	LEFT JOIN (
		SELECT 
			no_rawat,
			MAX(tgl_perawatan) as cppt_terakhir
		FROM pemeriksaan_ranap 
		WHERE nip = ?
		GROUP BY no_rawat
	) cppt_last ON ki.no_rawat = cppt_last.no_rawat
	WHERE ki.stts_pulang = '-' 
	AND d.kd_dokter = ?`

	// ✅ TAMBAH: Filter berdasarkan CPPT status
	switch filter {
	case "sudah_cppt":
		query += " AND cppt_today.jumlah_cppt > 0"
	case "belum_cppt":
		query += " AND (cppt_today.jumlah_cppt IS NULL OR cppt_today.jumlah_cppt = 0)"
	}

	query += " ORDER BY b.nm_bangsal, k.kd_kamar, ki.tgl_masuk"

	// ✅ Parameter: nip (untuk cppt_today), nip (untuk cppt_last), kd_dokter
	err := r.db.Raw(query, kdDokter, kdDokter, kdDokter).Scan(&pasienList).Error
	if err != nil {
		return nil, err
	}

	return pasienList, nil
}

// ✅ Detail pasien dengan CPPT info
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
		d.no_telp,
		-- ✅ CPPT Status
		CASE 
			WHEN cppt_today.jumlah_cppt > 0 THEN 1 
			ELSE 0 
		END as cppt_hari_ini,
		COALESCE(cppt_today.jumlah_cppt, 0) as jumlah_cppt,
		cppt_last.cppt_terakhir
	FROM kamar_inap ki
	JOIN reg_periksa rp ON ki.no_rawat = rp.no_rawat
	JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
	JOIN dpjp_ranap dr ON ki.no_rawat = dr.no_rawat
	JOIN dokter d ON dr.kd_dokter = d.kd_dokter
	JOIN kamar k ON ki.kd_kamar = k.kd_kamar
	JOIN bangsal b ON k.kd_bangsal = b.kd_bangsal
	LEFT JOIN penjab pj ON rp.kd_pj = pj.kd_pj
	LEFT JOIN (
		SELECT 
			no_rawat,
			COUNT(*) as jumlah_cppt
		FROM pemeriksaan_ranap 
		WHERE DATE(tgl_perawatan) = CURDATE() 
		AND nip = ?
		GROUP BY no_rawat
	) cppt_today ON ki.no_rawat = cppt_today.no_rawat
	LEFT JOIN (
		SELECT 
			no_rawat,
			MAX(tgl_perawatan) as cppt_terakhir
		FROM pemeriksaan_ranap 
		WHERE nip = ?
		GROUP BY no_rawat
	) cppt_last ON ki.no_rawat = cppt_last.no_rawat
	WHERE ki.stts_pulang = '-'
	AND ki.no_rawat = ?
	AND d.kd_dokter = ?`

	err := r.db.Raw(query, kdDokter, kdDokter, noRawat, kdDokter).Scan(&pasien).Error
	if err != nil {
		return nil, err
	}

	// Check if found
	if pasien.NoRawat == "" {
		return nil, gorm.ErrRecordNotFound
	}

	return &pasien, nil
}

// Get profile dokter yang login
func (r *pasienRepository) GetDokterProfile(kdDokter string) (*DokterProfile, error) {
	var dokter DokterProfile
	query := `
	SELECT kd_dokter, nm_dokter, no_telp, spesialisasi
	FROM dokter
	WHERE kd_dokter = ?`

	err := r.db.Raw(query, kdDokter).Scan(&dokter).Error
	if err != nil {
		return nil, err
	}

	if dokter.KodeDokter == "" {
		return nil, gorm.ErrRecordNotFound
	}

	return &dokter, nil
}
