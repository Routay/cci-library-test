import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2pdf from 'html2pdf.js';
import api from '../../services/api';
import { Upload, ImageIcon, FileText, Trash2, MoveLeft, MoveRight, Download, Sparkles } from 'lucide-react';
import './AdminPdfConverter.css';

export default function AdminPdfConverter() {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPages, setScannedPages] = useState([]);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    processFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    processFiles(files);
  };

  const processFiles = (files) => {
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (id) => {
    setImages(prev => {
      const imgToRemove = prev.find(img => img.id === id);
      if (imgToRemove) URL.revokeObjectURL(imgToRemove.url);
      return prev.filter(img => img.id !== id);
    });
  };

  const moveImage = (index, direction) => {
    const newImages = [...images];
    if (direction === 'left' && index > 0) {
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    } else if (direction === 'right' && index < newImages.length - 1) {
      [newImages[index + 1], newImages[index]] = [newImages[index], newImages[index + 1]];
    }
    setImages(newImages);
  };

  const generatePDF = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);

    try {
      // Create A4 PDF (210 x 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const a4Width = 210;
      const a4Height = 297;

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (i > 0) {
          pdf.addPage();
        }

        // Load image to get dimensions
        const img = new Image();
        img.src = image.url;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // Calculate aspect ratio to fit within A4
        const imgRatio = img.width / img.height;
        const a4Ratio = a4Width / a4Height;

        let renderWidth = a4Width;
        let renderHeight = a4Height;

        if (imgRatio > a4Ratio) {
          // Image is wider relative to A4
          renderHeight = a4Width / imgRatio;
        } else {
          // Image is taller relative to A4
          renderWidth = a4Height * imgRatio;
        }

        const xOffset = (a4Width - renderWidth) / 2;
        const yOffset = (a4Height - renderHeight) / 2;

        pdf.addImage(img, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);
      }

      pdf.save('livre.pdf');
    } catch (error) {
      console.error("Erreur lors de la génération du PDF", error);
      alert("Une erreur s'est produite lors de la génération du PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const scanAndGeneratePDF = async () => {
    if (images.length === 0) return;
    setIsScanning(true);
    
    try {
      const formData = new FormData();
      images.forEach((img) => {
        formData.append('pages', img.file);
      });

      const res = await api.post('/api/ai/scan-pages', formData);
      
      const htmlPages = res.data.pages;
      setScannedPages(htmlPages);
      
      // Wait for React to render the hidden container
      setTimeout(() => {
        const element = document.getElementById('scanned-pdf-container');
        if (!element) {
          setIsScanning(false);
          return;
        }
        const opt = {
          margin:       15,
          filename:     'livre_scanne.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(element).save().then(() => {
          setIsScanning(false);
          setScannedPages([]);
        });
      }, 500);

    } catch (error) {
      console.error("Erreur lors du scan IA", error);
      const errorMsg = error.response?.data?.message || error.message;
      alert("Une erreur s'est produite lors du scan par l'IA : " + errorMsg);
      setIsScanning(false);
    }
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.url));
    setImages([]);
  };

  return (
    <div className="admin-pdf-converter">
      <div className="admin-page-header">
        <div>
          <h1>Convertisseur PDF</h1>
          <p className="admin-date">Générez un document PDF à partir de photos de pages</p>
        </div>
        {images.length > 0 && (
          <button className="btn btn-outline" onClick={clearAll}>
            <Trash2 size={16} /> Tout effacer
          </button>
        )}
      </div>

      <div className="pdf-converter-content">
        <div 
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={48} className="drop-icon" />
          <h3>Glissez-déposez vos photos ici</h3>
          <p>ou cliquez pour sélectionner des fichiers (JPG, PNG)</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            accept="image/*" 
            multiple 
            style={{ display: 'none' }} 
          />
        </div>

        {images.length > 0 && (
          <div className="images-preview-section">
            <div className="preview-header">
              <h3>Pages sélectionnées ({images.length})</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-primary generate-btn" 
                  onClick={generatePDF}
                  disabled={isGenerating || isScanning}
                >
                  {isGenerating ? (
                    <>Génération...</>
                  ) : (
                    <><Download size={16} /> Images brutes</>
                  )}
                </button>
                <button 
                  className="btn btn-gold generate-btn" 
                  onClick={scanAndGeneratePDF}
                  disabled={isGenerating || isScanning}
                >
                  {isScanning ? (
                    <>Scan en cours...</>
                  ) : (
                    <><Sparkles size={16} /> Scanner le texte (IA)</>
                  )}
                </button>
              </div>
            </div>

            <div className="images-grid">
              {images.map((img, index) => (
                <div key={img.id} className="image-card">
                  <div className="image-number">{index + 1}</div>
                  <img src={img.url} alt={`Page ${index + 1}`} className="image-thumb" />
                  <div className="image-name" title={img.name}>{img.name}</div>
                  
                  <div className="image-actions">
                    <button 
                      className="img-action-btn" 
                      disabled={index === 0}
                      onClick={() => moveImage(index, 'left')}
                      title="Déplacer vers la gauche"
                    >
                      <MoveLeft size={14} />
                    </button>
                    <button 
                      className="img-action-btn img-action-del" 
                      onClick={() => removeImage(img.id)}
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button 
                      className="img-action-btn" 
                      disabled={index === images.length - 1}
                      onClick={() => moveImage(index, 'right')}
                      title="Déplacer vers la droite"
                    >
                      <MoveRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hidden container for HTML to PDF conversion */}
      {scannedPages.length > 0 && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div id="scanned-pdf-container" className="scanned-document">
            {scannedPages.map((html, idx) => (
              <div key={idx} className="scanned-page-content" style={{ pageBreakAfter: 'always' }} dangerouslySetInnerHTML={{ __html: html }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
