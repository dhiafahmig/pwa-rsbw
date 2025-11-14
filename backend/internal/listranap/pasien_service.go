package listranap

import (
	"fmt"
	"time"
)

type PasienService interface {
	GetPasienAktifByDokter(kdDokter string) (*PasienListResponse, error)
	GetPasienAktifByDokterWithFilter(kdDokter string, filter string) (*PasienListResponse, error)
	GetDetailPasien(noRawat string, kdDokter string) (*PasienRawatInap, error)
	GetDokterProfile(kdDokter string) (*DokterProfileResponse, error)
}

type pasienService struct {
	pasienRepo PasienRepository
}

func NewPasienService(pasienRepo PasienRepository) PasienService {
	return &pasienService{
		pasienRepo: pasienRepo,
	}
}

func (s *pasienService) GetPasienAktifByDokter(kdDokter string) (*PasienListResponse, error) {
	return s.GetPasienAktifByDokterWithFilter(kdDokter, "all")
}

func (s *pasienService) GetPasienAktifByDokterWithFilter(kdDokter string, filter string) (*PasienListResponse, error) {
	fmt.Printf("🔍 Getting active patients for doctor: %s with filter: %s\n", kdDokter, filter)

	if kdDokter == "" {
		return nil, fmt.Errorf("kode dokter not found")
	}

	//  Saat panggil service, summary HARUS dihitung dari filter "all"
	// 1. Ambil data pasien sesuai filter
	pasienList, err := s.pasienRepo.GetPasienRawatInapByDokterWithCppt(kdDokter, filter)
	if err != nil {
		fmt.Printf("❌ Error getting patients (filtered): %v\n", err)
		return nil, err
	}

	// 2. Ambil data "all" HANYA untuk menghitung summary
	// Ini penting agar summary di dashboard selalu konsisten, apapun filternya
	allPasienList, err := s.pasienRepo.GetPasienRawatInapByDokterWithCppt(kdDokter, "all")
	if err != nil {
		fmt.Printf("❌ Error getting patients (all for summary): %v\n", err)
		return nil, err
	}
	cpptSummary := s.calculateCpptSummary(allPasienList) // Hitung summary dari "all"

	// 3. Bangun sisa response
	dokterInfo := DokterInfo{
		KodeDokter:  kdDokter,
		TanggalList: time.Now().Format("02-01-2006 15:04:05") + " WIB",
	}

	if len(allPasienList) > 0 { // Ambil info dokter dari list "all"
		dokterInfo.NamaDokter = allPasienList[0].NamaDokter
		dokterInfo.NoTelp = allPasienList[0].NoTelp
	}

	// 4. Buat pesan berdasarkan list yang difilter
	var message string
	totalFiltered := len(pasienList)

	switch filter {
	case "sudah_cppt":
		message = fmt.Sprintf("Found %d patients with CPPT today (Done)", totalFiltered)
	case "belum_cppt":
		message = fmt.Sprintf("Found %d patients requiring CPPT (Pending)", totalFiltered)
	case "pasien_baru":
		message = fmt.Sprintf("Found %d new patients today", totalFiltered)
	default: // "all"
		message = fmt.Sprintf("Found %d active patients (%d Done, %d Pending, %d New)",
			totalFiltered, cpptSummary.SudahCpptHariIni, cpptSummary.BelumCpptHariIni, cpptSummary.PasienBaruHariIni)
	}

	fmt.Printf("✅ %s\n", message)

	return &PasienListResponse{
		Status:      "success",
		Message:     message,
		Total:       totalFiltered, // Total data di list ini
		Data:        pasienList,    // Data yang sudah difilter
		DokterInfo:  dokterInfo,
		CpptSummary: cpptSummary, // Summary dari "all"
	}, nil
}

// Menghitung 3 status (done, pending, new)
func (s *pasienService) calculateCpptSummary(pasienList []PasienRawatInap) CpptSummary {
	total := len(pasienList)
	sudahCppt := 0
	belumCppt := 0
	pasienBaru := 0

	for _, pasien := range pasienList {
		switch pasien.CpptStatus {
		case "done":
			sudahCppt++
		case "pending":
			belumCppt++
		case "new":
			pasienBaru++
		}
	}

	// Persentase CPPT: (Done) / (Total Pasien Lama)
	totalPasienLama := sudahCppt + belumCppt
	persentase := 0.0
	if totalPasienLama > 0 {
		persentase = float64(sudahCppt) / float64(totalPasienLama) * 100
	}

	return CpptSummary{
		TotalPasien:       total,
		SudahCpptHariIni:  sudahCppt,
		BelumCpptHariIni:  belumCppt,
		PasienBaruHariIni: pasienBaru,
		PersentaseCppt:    persentase,
	}
}

func (s *pasienService) GetDetailPasien(noRawat string, kdDokter string) (*PasienRawatInap, error) {
	fmt.Printf("🔍 Getting patient detail for: %s by doctor: %s\n", noRawat, kdDokter)
	pasien, err := s.pasienRepo.GetPasienDetail(noRawat, kdDokter)
	if err != nil {
		fmt.Printf("❌ Patient not found or not your DPJP: %v\n", err)
		return nil, err
	}

	fmt.Printf("✅ Patient detail found: %s (CPPT status: %s)\n", pasien.NamaPasien, pasien.CpptStatus)
	return pasien, nil
}

func (s *pasienService) GetDokterProfile(kdDokter string) (*DokterProfileResponse, error) {
	fmt.Printf("🔍 Getting doctor profile: %s\n", kdDokter)
	dokter, err := s.pasienRepo.GetDokterProfile(kdDokter)
	if err != nil {
		fmt.Printf("❌ Doctor not found: %v\n", err)
		return nil, err
	}

	fmt.Printf("✅ Doctor profile found: %s\n", dokter.NamaDokter)
	return &DokterProfileResponse{
		Status:  "success",
		Message: "Doctor profile retrieved successfully",
		Data:    *dokter,
	}, nil
}
