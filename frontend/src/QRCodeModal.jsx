import { useState } from 'react';

export default function QRCodeModal({ qrCodeUrl, caseId, colors }) {
  const [showModal, setShowModal] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Fallback colors if not provided
  const defaultColors = {
    primary: '#3b82f6',
    cardBorder: '#e5e7eb',
    textMain: '#1f2937',
    textMuted: '#6b7280',
    cardBg: '#ffffff',
    bg: '#ffffff',
  };

  const col = colors || defaultColors;

  const getFullUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://127.0.0.1:8000${url}`;
  };

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      background: col.cardBg,
      padding: '30px',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      textAlign: 'center',
      maxWidth: '500px',
      position: 'relative',
      border: `1px solid ${col.cardBorder}`,
    },
    closeBtn: {
      position: 'absolute',
      top: '10px',
      right: '15px',
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: col.textMuted,
    },
    qrImage: {
      width: '100%',
      maxWidth: '400px',
      height: 'auto',
      marginTop: '10px',
      border: `2px solid ${col.cardBorder}`,
      borderRadius: '8px',
      padding: '10px',
      background: col.bg,
    },
    title: {
      marginBottom: '15px',
      color: col.textMain,
      fontSize: '1.1rem',
      fontWeight: '600',
    },
    container: {
      position: 'relative',
      display: 'inline-block',
    },
    qrImageSmall: {
      width: 60,
      height: 60,
      cursor: 'pointer',
    },
    hoverButton: {
      position: 'absolute',
      bottom: '-30px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: col.primary,
      color: 'white',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '0.8rem',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      opacity: isHovering ? 1 : 0,
      transition: 'opacity 0.2s ease',
      zIndex: 10,
    },
  };

  return (
    <>
      <div
        style={modalStyles.container}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div style={{ background: col.cardBg, padding: '5px', borderRadius: '8px', border: `1px solid ${col.cardBorder}` }}>
          <img
            src={getFullUrl(qrCodeUrl)}
            alt="QR"
            style={modalStyles.qrImageSmall}
            onClick={() => setShowModal(true)}
          />
        </div>
        <button
          style={modalStyles.hoverButton}
          onClick={() => setShowModal(true)}
        >
          🔍 Enlarge
        </button>
      </div>

      {showModal && (
        <div style={modalStyles.overlay} onClick={() => setShowModal(false)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={modalStyles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            <div style={modalStyles.title}>QR Code - {caseId}</div>
            <img
              src={getFullUrl(qrCodeUrl)}
              alt="QR Code"
              style={modalStyles.qrImage}
            />
            <div style={{ marginTop: '15px', fontSize: '0.9rem', color: col.textMuted }}>
              Click to scan or close modal
            </div>
          </div>
        </div>
      )}
    </>
  );
}
