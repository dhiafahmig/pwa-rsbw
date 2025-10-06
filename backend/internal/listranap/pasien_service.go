package listranap

import (
	"fmt"
	"time"
)

type PasienService interface {
	GetPasienAktifByDokter(kdDokter string) (*PasienListResponse, error)
	GetPasienAktifByDokterWithFilter(kdDokter string, filter string) (*PasienListResponse, error) // ✅ TAMBAH
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

// ✅ Default method (backward compatibility)
func (s *pasienService) GetPasienAktifByDokter(kdDokter string) (*PasienListResponse, error) {
	return s.GetPasienAktifByDokterWithFilter(kdDokter, "all")
}

// ✅ ENHANCED: dengan CPPT filter
func (s *pasienService) GetPasienAktifByDokterWithFilter(kdDokter string, filter string) (*PasienListResponse, error) {
	fmt.Printf("🔍 Getting active patients for doctor: %s with filter: %s\n", kdDokter, filter)

	if kdDokter == "" {
		return nil, fmt.Errorf("kode dokter not found")
	}

	pasienList, err := s.pasienRepo.GetPasienRawatInapByDokterWithCppt(kdDokter, filter)
	if err != nil {
		fmt.Printf("❌ Error getting patients: %v\n", err)
		return nil, err
	}

	// ✅ Calculate CPPT summary
	cpptSummary := s.calculateCpptSummary(pasienList)

	// ✅ Build dokter info from first patient (jika ada)
	dokterInfo := DokterInfo{
		KodeDokter:  kdDokter,
		TanggalList: time.Now().Format("02-01-2006 15:04:05") + " WIB",
	}

	if len(pasienList) > 0 {
		dokterInfo.NamaDokter = pasienList[0].NamaDokter
		dokterInfo.NoTelp = pasienList[0].NoTelp
	}

	var message string
	switch filter {
	case "sudah_cppt":
		message = fmt.Sprintf("Found %d patients with CPPT today", len(pasienList))
	case "belum_cppt":
		message = fmt.Sprintf("Found %d patients without CPPT today", len(pasienList))
	default:
		message = fmt.Sprintf("Found %d active patients (%d with CPPT, %d without CPPT today)",
			len(pasienList), cpptSummary.SudahCpptHariIni, cpptSummary.BelumCpptHariIni)
	}

	fmt.Printf("✅ %s\n", message)

	return &PasienListResponse{
		Status:      "success",
		Message:     message,
		Total:       len(pasienList),
		Data:        pasienList,
		DokterInfo:  dokterInfo,
		CpptSummary: cpptSummary, // ✅ TAMBAH
	}, nil
}

// ✅ TAMBAH: Calculate CPPT summary
func (s *pasienService) calculateCpptSummary(pasienList []PasienRawatInap) CpptSummary {
	total := len(pasienList)
	sudahCppt := 0

	for _, pasien := range pasienList {
		if pasien.CpptHariIni {
			sudahCppt++
		}
	}

	belumCppt := total - sudahCppt
	persentase := 0.0
	if total > 0 {
		persentase = float64(sudahCppt) / float64(total) * 100
	}

	return CpptSummary{
		TotalPasien:      total,
		SudahCpptHariIni: sudahCppt,
		BelumCpptHariIni: belumCppt,
		PersentaseCppt:   persentase,
	}
}

func (s *pasienService) GetDetailPasien(noRawat string, kdDokter string) (*PasienRawatInap, error) {
	fmt.Printf("🔍 Getting patient detail for: %s by doctor: %s\n", noRawat, kdDokter)
	pasien, err := s.pasienRepo.GetPasienDetail(noRawat, kdDokter)
	if err != nil {
		fmt.Printf("❌ Patient not found or not your DPJP: %v\n", err)
		return nil, err
	}

	fmt.Printf("✅ Patient detail found: %s (CPPT today: %v)\n", pasien.NamaPasien, pasien.CpptHariIni)
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
