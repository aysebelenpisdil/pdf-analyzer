export class PDFProcessor {
  static async extractText(file) {
    try {
      if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF.js kütüphanesi yüklenmedi. Lütfen sayfayı yenileyin.');
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      const metadata = {
        totalPages: pdf.numPages,
        extractedPages: 0,
        wordCount: 0,
        characterCount: 0
      };
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + '\n\n';
        metadata.extractedPages++;
      }
      
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