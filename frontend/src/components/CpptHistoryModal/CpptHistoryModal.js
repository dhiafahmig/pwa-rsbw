// src/components/CpptHistoryModal/CpptHistoryModal.js
import React, { useState, useMemo } from 'react'; // ✨ Import useState & useMemo
import './CpptHistoryModal.css';

// ... (fungsi formatDateTime, VitalsGrid, SoapNote tetap sama) ...
const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return 'Waktu tidak valid';
  try {
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

const VitalsGrid = ({ item }) => {
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
  ].filter(v => v.value && v.value.trim() !== "" && v.value.trim() !== "0"); 

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

const SoapNote = ({ letter, title, content }) => {
  if (!content || content.trim() === "") {
    return null;
  }

  return (
    <div className="soap-note">
      <div className="soap-letter">{letter}</div>
      <div className="soap-content">
        <div className="soap-title">{title}</div>
        <pre className="soap-text">{content.trim()}</pre>
      </div>
    </div>
  );
};


/**
 * ✨ Komponen Modal Utama Diperbarui
 */
const CpptHistoryModal = ({ isOpen, onClose, patient, history = [], loading }) => {
  // ✨ 1. Tambahkan state untuk tab yang aktif, default-nya 'ranap'
  const [activeTab, setActiveTab] = useState('ranap');

  // ✨ 2. Pisahkan riwayat berdasarkan 'sumber_data'
  // useMemo digunakan agar tidak perlu filter ulang setiap re-render
  const ranapHistory = useMemo(
    () => history.filter(item => item.sumber_data === 'ranap'),
    [history]
  );
  
  const ralanHistory = useMemo(
    () => history.filter(item => item.sumber_data === 'ralan'),
    [history]
  );

  // ✨ 3. Tentukan riwayat mana yang akan ditampilkan
  const currentHistory = activeTab === 'ranap' ? ranapHistory : ralanHistory;

  if (!isOpen) {
    return null;
  }
  
  const handleOverlayClick = () => {
    onClose();
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // ✨ Komponen kecil untuk menampilkan list atau pesan kosong
  const HistoryTabContent = ({ items }) => {
    if (items.length === 0) {
      return (
        <div className="modal-empty-tab">
          <span className="empty-icon-tab">📂</span>
          <p>Tidak ada data CPPT ditemukan.</p>
        </div>
      );
    }

    return (
      <div className="history-list">
        {items.map((item, index) => (
          <div className="history-item" key={`${item.sumber_data}-${index}`}>
            <div className="history-item-header">
              <span className="history-pegawai">
                {item.nama_pegawai ? item.nama_pegawai.trim() : 'N/A'}
              </span>
              <span className="history-time">
                {formatDateTime(item.tgl_perawatan, item.jam_rawat)}
              </span>
            </div>
            
            <div className="history-item-body">
              <VitalsGrid item={item} />
              <div className="soap-list">
                <SoapNote letter="S" title="Subjective (Keluhan)" content={item.keluhan} />
                <SoapNote letter="O" title="Objective (Pemeriksaan)" content={item.pemeriksaan} />
                <SoapNote letter="A" title="Assessment (Penilaian)" content={item.penilaian} />
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
    );
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={handleContentClick}>
        
        <div className="modal-header">
          <div className="modal-header-text">
            <h3 className="modal-title">Riwayat CPPT Pasien</h3>
            <p className="modal-subtitle">
              {patient?.nm_pasien} (RM: {patient?.no_rkm_medis})
            </p>
          </div>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <div className="spinner"></div>
              <p>Memuat riwayat CPPT...</p>
            </div>
          ) : (
            <>
              {/* ✨ 4. Tambahkan Tombol Tab di sini */}
              <div className="modal-tabs">
                <button
                  className={`modal-tab ${activeTab === 'ranap' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ranap')}
                >
                  Rawat Inap ({ranapHistory.length})
                </button>
                <button
                  className={`modal-tab ${activeTab === 'ralan' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ralan')}
                >
                  Rawat Jalan/IGD ({ralanHistory.length})
                </button>
              </div>

              {/* ✨ 5. Tampilkan konten tab yang aktif */}
              <div className="modal-tab-content">
                <HistoryTabContent items={currentHistory} />
              </div>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default CpptHistoryModal;