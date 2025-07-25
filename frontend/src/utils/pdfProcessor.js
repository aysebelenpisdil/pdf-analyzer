import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Worker'ı ayarla
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export class PDFProcessor {
  static async extractText(file) {
    try {
      // PDF dosyasını ArrayBuffer olarak oku
      const arrayBuffer = await file.arrayBuffer();
      
      // PDF.js ile dosyayı yükle
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const metadata = {
        totalPages: pdf.numPages,
        extractedPages: 0,
        wordCount: 0,
        characterCount: 0
      };
      
      // Her sayfayı işle
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Sayfa metnini birleştir
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + '\n\n';
        metadata.extractedPages++;
      }
      
      // İstatistikleri hesapla
      metadata.wordCount = fullText.split(/\s+/).filter(word => word.length > 0).length;
      metadata.characterCount = fullText.length;
      
      return {
        text: fullText,
        metadata: metadata,
        success: true
      };
      
    } catch (error) {
      console.error('PDF işleme hatası:', error);
      return {
        text: '',
        metadata: null,
        success: false,
        error: error.message
      };
    }
  }
  
  static async analyzeWithClaude(text, fileName) {
    try {
      // Backend API'ye istek gönder
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          fileName: fileName
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API çağrısı başarısız');
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('Claude analiz hatası:', error);
      throw error;
    }
  }
}