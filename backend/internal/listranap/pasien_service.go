package listranap

import (
	"fmt"
	"time"
)

type PasienService interface {
	GetPasienAktifByDokter(kdDokter string) (*PasienListResponse, error)
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

// ✅ Auto filter by dokter yang login
func (s *pasienService) GetPasienAktifByDokter(kdDokter string) (*PasienListResponse, error) {
	fmt.Printf("🔍 Getting active patients for doctor: %s\n", kdDokter)

	if kdDokter == "" {
		return nil, fmt.Errorf("kode dokter not found")
	}

	pasienList, err := s.pasienRepo.GetPasienRawatInapByDokter(kdDokter)
	if err != nil {
		fmt.Printf("❌ Error getting patients: %v\n", err)
		return nil, err
	}

	// ✅ Build dokter info from first patient (jika ada)
	dokterInfo := DokterInfo{
		KodeDokter:  kdDokter,
		TanggalList: time.Now().Format("02-01-2006 15:04:05") + " WIB",
	}

	if len(pasienList) > 0 {
		dokterInfo.NamaDokter = pasienList[0].NamaDokter
		dokterInfo.NoTelp = pasienList[0].NoTelp
	}

	message := fmt.Sprintf("Found %d active patients for your DPJP", len(pasienList))
	fmt.Printf("✅ %s\n", message)

	return &PasienListResponse{
		Status:     "success",
		Message:    message,
		Total:      len(pasienList),
		Data:       pasienList,
		DokterInfo: dokterInfo,
	}, nil
}

func (s *pasienService) GetDetailPasien(noRawat string, kdDokter string) (*PasienRawatInap, error) {
	fmt.Printf("🔍 Getting patient detail for: %s by doctor: %s\n", noRawat, kdDokter)

	pasien, err := s.pasienRepo.GetPasienDetail(noRawat, kdDokter)
	if err != nil {
		fmt.Printf("❌ Patient not found or not your DPJP: %v\n", err)
		return nil, err
	}

	fmt.Printf("✅ Patient detail found: %s\n", pasien.NamaPasien)
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
