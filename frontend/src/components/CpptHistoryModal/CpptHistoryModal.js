// src/components/CpptHistoryModal/CpptHistoryModal.js
import React from 'react';
import './CpptHistoryModal.css'; // Kita akan menggunakan file CSS yang baru di bawah

/**
 * Helper function untuk memformat tanggal dan jam
 */
const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return 'Waktu tidak valid';
  try {
    // Menggabungkan tanggal dan waktu
    const dateTimeStr = `${dateStr}T${timeStr}`;
    const date = new Date(dateTimeStr);
    
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';
  } catch (e) {
    return `${dateStr} ${timeStr}`;
  }
};

/**
 * Helper component untuk menampilkan Vitals
 */
const VitalsGrid = ({ item }) => {
  // Ambil data vitals dari 'item'
  const vitals = [
    { label: 'Tensi', value: item.tensi, unit: 'mmHg' },
    { label: 'Nadi', value: item.nadi, unit: 'x/mnt' },
    { label: 'Suhu', value: item.suhu_tubuh, unit: '°C' },
    { label: 'Respirasi', value: item.respirasi, unit: 'x/mnt' },
    { label: 'SpO2', value: item.spo2, unit: '%' },
    { label: 'GCS', value: item.gcs, unit: '' },
    { label: 'Kesadaran', value: item.kesadaran, unit: '' },
    { label: 'Berat', value: item.berat, unit: 'kg' },
    { label: 'Tinggi', value: item.tinggi, unit: 'cm' },
  ].filter(v => v.value && v.value.trim() !== "" && v.value.trim() !== "0"); // Filter data yang kosong atau "0"

  // Jika tidak ada data vital, jangan tampilkan apa-apa
  if (vitals.length === 0) {
    return null;
  }

  return (
    <div className="vitals-grid">
      {vitals.map(vital => (
        <div key={vital.label} className="vitals-item">
          <span className="vitals-label">{vital.label}</span>
          <span className="vitals-value">
            {vital.value} {vital.unit}
          </span>
        </div>
      ))}
    </div>
  );
};

/**
 * Helper component untuk menampilkan bagian SOAP
 */
const SoapNote = ({ letter, title, content }) => {
  // Jangan tampilkan jika konten kosong
  if (!content || content.trim() === "") {
    return null;
  }

  return (
    <div className="soap-note">
      <div className="soap-letter">{letter}</div>
      <div className="soap-content">
        <div className="soap-title">{title}</div>
        {/* 'content' sudah berisi newline (\n) dari database, 
            jadi <pre> akan menampilkannya dengan benar */}
        <pre className="soap-text">{content.trim()}</pre>
      </div>
    </div>
  );
};


/**
 * Komponen Modal Utama
 */
const CpptHistoryModal = ({ isOpen, onClose, patient, history = [], loading }) => {
  if (!isOpen) {
    return null;
  }
  
  // Fungsi untuk menutup modal saat overlay diklik
  const handleOverlayClick = () => {
    onClose();
  };

  // Fungsi untuk mencegah modal tertutup saat kontennya diklik
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={handleContentClick}>
        
        <div className="modal-header">
          <div className="modal-header-text">
            <h3 className="modal-title">Riwayat CPPT Pasien</h3>
            {/* Menggunakan data 'patient' dari props */}
            <p className="modal-subtitle">
              {patient?.nm_pasien} (RM: {patient?.no_rkm_medis})
            </p>
          </div>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <div className="spinner"></div> {/* (Anda perlu style untuk .spinner) */}
              <p>Memuat riwayat CPPT...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="modal-empty">
              <span className="empty-icon">📂</span>
              <p>Belum ada riwayat CPPT Ranap untuk pasien ini.</p>
            </div>
          ) : (
            <div className="history-list">
              {/* Data dari backend sudah diurutkan (DESC), 
                  jadi kita tinggal map saja */}
              {history.map((item, index) => (
                <div className="history-item" key={`${item.no_rawat}-${index}`}>
                  <div className="history-item-header">
                    {/* Menggunakan nama_pegawai, bukan NamaDokter */}
                    <span className="history-pegawai">
                      {item.nama_pegawai ? item.nama_pegawai.trim() : 'N/A'}
                    </span>
                    <span className="history-time">
                      {formatDateTime(item.tgl_perawatan, item.jam_rawat)}
                    </span>
                  </div>
                  
                  <div className="history-item-body">
                    {/* 1. Tampilkan Vitals Grid */}
                    <VitalsGrid item={item} />
                    
                    {/* 2. Tampilkan S-O-A-P-E */}
                    <div className="soap-list">
                      <SoapNote letter="S" title="Subjective (Keluhan)" content={item.keluhan} />
                      <SoapNote letter="O" title="Objective (Pemeriksaan)" content={item.pemeriksaan} />
                      <SoapNote letter="A" title="Assessment (Penilaian)" content={item.penilaian} />
                      {/* 'P' adalah gabungan dari RTL dan Instruksi */}
                      <SoapNote 
                        letter="P" 
                        title="Plan (Rencana & Instruksi)" 
                        content={`${item.rtl || ''}\n${item.instruksi || ''}`} 
                      />
                      <SoapNote letter="E" title="Evaluasi" content={item.evaluasi} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default CpptHistoryModal;