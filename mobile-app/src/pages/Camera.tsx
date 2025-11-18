import { Camera as CameraIcon, Upload, X, CheckCircle } from 'lucide-react';
import { useState, useRef } from 'react';

export default function CameraPage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!capturedImage) return;

    setUploading(true);
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setUploading(false);
    setUploaded(true);

    // Reset after 2 seconds
    setTimeout(() => {
      setCapturedImage(null);
      setUploaded(false);
    }, 2000);
  };

  const handleReset = () => {
    setCapturedImage(null);
    setUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <header style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Capture Photo
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Prenez une photo du rayonnage pour vérification
        </p>
      </header>

      {/* Camera Preview / Captured Image */}
      <div style={{ marginBottom: '1.5rem' }}>
        {capturedImage ? (
          <div style={{ position: 'relative' }}>
            <img 
              src={capturedImage} 
              alt="Captured" 
              style={{ 
                width: '100%', 
                borderRadius: '12px',
                aspectRatio: '4/3',
                objectFit: 'cover'
              }} 
            />
            {!uploaded && (
              <button
                onClick={handleReset}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            )}
            {uploaded && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(16, 185, 129, 0.95)',
                color: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle size={48} />
                <span style={{ fontWeight: 'bold' }}>Photo envoyée !</span>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="camera-preview"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#1e293b',
              color: 'white'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <CameraIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ opacity: 0.7 }}>Appuyez sur le bouton pour prendre une photo</p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions Card */}
      {!capturedImage && (
        <div className="card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#065f46' }}>
            Instructions
          </h3>
          <ul style={{ fontSize: '0.875rem', color: '#047857', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
            <li>Assurez-vous que le rayonnage est bien éclairé</li>
            <li>Prenez la photo de face, à hauteur des yeux</li>
            <li>Incluez tous les produits du planogramme</li>
            <li>Évitez les reflets et les ombres</li>
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {!capturedImage ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
              style={{ display: 'none' }}
              id="camera-input"
            />
            <label htmlFor="camera-input" className="btn btn-primary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <CameraIcon size={20} />
              Prendre une photo
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleCapture}
              style={{ display: 'none' }}
              id="gallery-input"
            />
            <label htmlFor="gallery-input" className="btn" style={{ 
              cursor: 'pointer', 
              background: 'white', 
              color: '#64748b',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <Upload size={20} />
              Choisir depuis la galerie
            </label>
          </>
        ) : !uploaded && (
          <>
            <button 
              className="btn btn-primary" 
              onClick={handleUpload}
              disabled={uploading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {uploading ? (
                <>
                  <div className="spinner" style={{ width: '20px', height: '20px', margin: 0, border: '2px solid white', borderTopColor: 'transparent' }} />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Upload size={20} />
                  Envoyer la photo
                </>
              )}
            </button>
            <button 
              className="btn" 
              onClick={handleReset}
              style={{ 
                background: 'white', 
                color: '#64748b',
                border: '1px solid #e2e8f0'
              }}
            >
              Reprendre
            </button>
          </>
        )}
      </div>

      {/* Recent Photos */}
      {!capturedImage && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Photos récentes
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i}
                style={{
                  aspectRatio: '1',
                  background: '#e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '0.75rem'
                }}
              >
                Photo {i}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
