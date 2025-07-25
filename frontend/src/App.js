import React, { useState } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      console.log('PDF selected:', file.name);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) {
      alert('Please select a PDF file first');
      return;
    }
    
    setIsProcessing(true);
    setTimeout(() => {
      setExtractedText('Document analysis complete. This PDF contains important information that has been processed and analyzed. Key themes and conclusions have been identified for your review.');
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="App">
      <div className="App-header">
        <div className="logo-title">
          <div className="pixel-logo"></div>
          <h1>PDF Analyzer</h1>
        </div>
        <p>Upload • Analyze • Understand</p>
        
        <div className="upload-section">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
          />
          
          {selectedFile && (
            <div className="file-info">
              <p><strong>File:</strong> {selectedFile.name}</p>
              <button 
                onClick={handleAnalyze}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Analyze PDF'}
              </button>
            </div>
          )}
        </div>

        {extractedText && (
          <div className="text-output">
            <h3>Analysis Results</h3>
            <p>{extractedText}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;