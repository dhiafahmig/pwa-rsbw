package listranap

import (
	"fmt"
	"time"
)

type PasienService interface {
	GetDokterDPJP() (*DokterListResponse, error)
	GetPasienAktif(kdDokter string) (*PasienListResponse, error)
	GetDetailPasien(noRawat string) (*PasienRawatInap, error)
}

type pasienService struct {
	pasienRepo PasienRepository
}

func NewPasienService(pasienRepo PasienRepository) PasienService {
	return &pasienService{
		pasienRepo: pasienRepo,
	}
}

func (s *pasienService) GetDokterDPJP() (*DokterListResponse, error) {
	fmt.Println("🔍 Getting DPJP list...")

	dokterList, err := s.pasienRepo.GetDokterDPJPWithActivePatients()
	if err != nil {
		fmt.Printf("❌ Error getting DPJP: %v\n", err)
		return nil, err
	}

	fmt.Printf("✅ Found %d DPJP with active patients\n", len(dokterList))

	return &DokterListResponse{
		Status:  "success",
		Message: "DPJP list retrieved successfully",
		Data:    dokterList,
	}, nil
}

func (s *pasienService) GetPasienAktif(kdDokter string) (*PasienListResponse, error) {
	fmt.Printf("🔍 Getting active patients for DPJP: %s\n", kdDokter)

	pasienList, err := s.pasienRepo.GetPasienRawatInapAktif(kdDokter)
	if err != nil {
		fmt.Printf("❌ Error getting patients: %v\n", err)
		return nil, err
	}

	filterInfo := FilterInfo{
		DPJP:        kdDokter,
		TanggalList: time.Now().Format("02-01-2006 15:04:05") + " WIB",
	}

	// Set nama dokter jika ada data
	if len(pasienList) > 0 {
		filterInfo.NamaDokter = pasienList[0].NamaDokter
	}

	message := fmt.Sprintf("Found %d active patients", len(pasienList))
	if kdDokter != "" {
		message += " for selected DPJP"
	}

	fmt.Printf("✅ %s\n", message)

	return &PasienListResponse{
		Status:  "success",
		Message: message,
		Total:   len(pasienList),
		Data:    pasienList,
		Filter:  filterInfo,
	}, nil
}

func (s *pasienService) GetDetailPasien(noRawat string) (*PasienRawatInap, error) {
	fmt.Printf("🔍 Getting patient detail for: %s\n", noRawat)

	pasien, err := s.pasienRepo.GetPasienDetail(noRawat)
	if err != nil {
		fmt.Printf("❌ Patient not found: %v\n", err)
		return nil, err
	}

	fmt.Printf("✅ Patient detail found: %s\n", pasien.NamaPasien)
	return pasien, nil
}
