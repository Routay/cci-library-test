import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up the PDF.js worker using unpkg to avoid Vite build issues with the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfReader({ url, zoom = 100 }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  };

  const previousPage = () => {
    if (pageNumber > 1) {
      changePage(-1);
    }
  };

  const nextPage = () => {
    if (pageNumber < numPages) {
      changePage(1);
    }
  };

  return (
    <div className="pdf-reader-container">
      <div className="pdf-document-wrapper">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex-center" style={{ height: '300px', flexDirection: 'column' }}>
              <Loader className="spinner-icon" size={48} />
              <p style={{ marginTop: '16px', color: 'var(--txt2)' }}>Chargement du document...</p>
            </div>
          }
          error={
            <div className="flex-center" style={{ height: '300px', color: '#ef4444' }}>
              <p>Erreur lors du chargement du PDF.</p>
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={zoom / 100} 
            renderTextLayer={true}
            renderAnnotationLayer={false}
            className="pdf-page-render"
          />
        </Document>
      </div>
      
      {numPages && (
        <div className="pdf-pagination">
          <button 
            disabled={pageNumber <= 1} 
            onClick={previousPage}
            className="btn btn-outline"
          >
            <ChevronLeft size={20} /> Précédent
          </button>
          
          <span className="page-indicator">
            Page {pageNumber} sur {numPages}
          </span>
          
          <button 
            disabled={pageNumber >= numPages} 
            onClick={nextPage}
            className="btn btn-outline"
          >
            Suivant <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
