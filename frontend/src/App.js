import React, { useState } from 'react';
import './App.css';
import { PDFProcessor } from './utils/pdfProcessor';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setExtractedText('');
      setAnalysisResults(null);
      setError(null);
      console.log('PDF seçildi:', file.name);
    } else {
      alert('Lütfen bir PDF dosyası seçin');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert('Lütfen önce bir PDF dosyası seçin');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);
    
    try {
      setProcessingStage('PDF okunuyor...');
      setProcessingProgress(20);
      
      const extractionResult = await PDFProcessor.extractText(selectedFile);
      
      if (!extractionResult.success) {
        throw new Error(extractionResult.error || 'PDF okunamadı');
      }
      
      setProcessingProgress(50);
      setExtractedText(extractionResult.text);
      
      setProcessingStage('Metin çıkarıldı!');
      setProcessingProgress(70);
      
      setProcessingStage('Claude ile analiz ediliyor...');
      setProcessingProgress(90);
      
      try {
        const analysisResult = await PDFProcessor.analyzeWithClaude(
          extractionResult.text, 
          selectedFile.name
        );
        
        if (analysisResult.success) {
          setAnalysisResults({
            ...analysisResult.analysis,
            extractedText: extractionResult.text,
            metadata: extractionResult.metadata,
            fileName: selectedFile.name,
            analyzedAt: analysisResult.analyzedAt
          });
          
          setProcessingProgress(100);
          setProcessingStage('Analiz tamamlandı!');
        } else {
          throw new Error('Analiz başarısız oldu');
        }
      } catch (analysisError) {
        console.warn('Claude analizi başarısız, yerel analiz kullanılıyor:', analysisError);
        
        const localAnalysis = {
          ozet: 'PDF başarıyla işlendi. Metin çıkarma tamamlandı.',
          anaKonular: ['Metin çıkarıldı', 'İstatistikler hesaplandı'],
          onemligular: [`${extractionResult.metadata.wordCount} kelime bulundu`],
          anahtarKelimeler: extractionResult.text.split(/\s+/)
            .filter(word => word.length > 5)
            .slice(0, 10),
          oneriler: ['Claude API bağlantısı kontrol edilmeli'],
          guvenSeviyesi: 'Düşük'
        };
        
        setAnalysisResults({
          ...localAnalysis,
          extractedText: extractionResult.text,
          metadata: extractionResult.metadata,
          fileName: selectedFile.name,
          localAnalysis: true
        });
        
        setProcessingProgress(100);
        setProcessingStage('Yerel analiz tamamlandı');
      }
      
      setIsProcessing(false);
      
    } catch (error) {
      console.error('PDF işleme hatası:', error);
      setError({
        message: 'PDF işlenirken bir hata oluştu',
        detail: error.message
      });
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractedText('');
    setAnalysisResults(null);
    setError(null);
    setProcessingProgress(0);
    setProcessingStage('');
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
            disabled={isProcessing}
          />
          
          {selectedFile && !analysisResults && (
            <div className="file-info">
              <div className="file-details">
                <p><strong>Dosya:</strong> {selectedFile.name}</p>
                <p><strong>Boyut:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>Tür:</strong> {selectedFile.type}</p>
              </div>
              <button 
                onClick={handleAnalyze}
                disabled={isProcessing}
              >
                {isProcessing ? 'İşleniyor...' : 'PDF\'yi Analiz Et'}
              </button>
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="processing-status">
            <div className="stage-indicator">{processingStage}</div>
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
              <span className="progress-text">{processingProgress}%</span>
            </div>
            <p className="processing-detail">
              PDF'iniz işleniyor, lütfen bekleyin...
            </p>
          </div>
        )}

        {error && (
          <div className="error-display">
            <h3>Hata Oluştu</h3>
            <p>{error.message}</p>
            {error.detail && <p><small>{error.detail}</small></p>}
            <button onClick={handleReset}>Yeniden Dene</button>
          </div>
        )}

        {analysisResults && (
          <div className="analysis-results">
            <div className="result-header">
              <h3>Analiz Sonuçları</h3>
              <div className="method-info">
                <span>Analiz: {analysisResults.localAnalysis ? 'Yerel' : 'Claude AI'}</span>
                <span className="confidence-badge" style={{
                  backgroundColor: analysisResults.guvenSeviyesi === 'Yüksek' ? '#10b981' : 
                                 analysisResults.guvenSeviyesi === 'Orta' ? '#f59e0b' : '#ef4444'
                }}>
                  {analysisResults.guvenSeviyesi} Güven
                </span>
              </div>
            </div>
            
            <div className="result-stats">
              <div className="stat">
                <span className="stat-label">Sayfa Sayısı</span>
                <span className="stat-value">{analysisResults.metadata.totalPages}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Kelime Sayısı</span>
                <span className="stat-value">{analysisResults.metadata.wordCount.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Karakter Sayısı</span>
                <span className="stat-value">{analysisResults.metadata.characterCount.toLocaleString()}</span>
              </div>
            </div>
            
            {analysisResults.ozet && (
              <div className="analysis-section">
                <h4>📄 Özet</h4>
                <p>{analysisResults.ozet}</p>
              </div>
            )}
            
            {analysisResults.anaKonular && analysisResults.anaKonular.length > 0 && (
              <div className="analysis-section">
                <h4>🎯 Ana Konular</h4>
                <ul>
                  {analysisResults.anaKonular.map((konu, index) => (
                    <li key={index}>{konu}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisResults.onemligular && analysisResults.onemligular.length > 0 && (
              <div className="analysis-section">
                <h4>💡 Önemli Bulgular</h4>
                <ul>
                  {analysisResults.onemligular.map((bulgu, index) => (
                    <li key={index}>{bulgu}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysisResults.anahtarKelimeler && analysisResults.anahtarKelimeler.length > 0 && (
              <div className="analysis-section">
                <h4>🔑 Anahtar Kelimeler</h4>
                <div className="keyword-tags">
                  {analysisResults.anahtarKelimeler.map((kelime, index) => (
                    <span key={index} className="keyword-tag">{kelime}</span>
                  ))}
                </div>
              </div>
            )}
            
            {analysisResults.oneriler && analysisResults.oneriler.length > 0 && (
              <div className="analysis-section">
                <h4>💭 Öneriler</h4>
                <ul>
                  {analysisResults.oneriler.map((oneri, index) => (
                    <li key={index}>{oneri}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="extracted-text">
              <h4>Çıkarılan Metin:</h4>
              <div className="text-content">
                {analysisResults.extractedText.substring(0, 1000)}
                {analysisResults.extractedText.length > 1000 && (
                  <span className="text-truncated">
                    ... (Metin kısaltıldı - Toplam {analysisResults.extractedText.length} karakter)
                  </span>
                )}
              </div>
            </div>
            
            <div className="result-actions">
              <button onClick={handleReset}>Yeni PDF Analiz Et</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;