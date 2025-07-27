import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { kvCache, CacheKeys, CacheDurations } from '@/lib/db/kv';

// Azure Computer Vision configuration
const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT!;
const apiKey = process.env.AZURE_COMPUTER_VISION_KEY!;

// Initialize client
const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': apiKey } }),
  endpoint
);

export interface OCRResult {
  text: string;
  lines: OCRLine[];
  language: string;
  confidence: number;
}

export interface OCRLine {
  text: string;
  boundingBox: number[];
  words: OCRWord[];
}

export interface OCRWord {
  text: string;
  boundingBox: number[];
  confidence: number;
}

export class AzureComputerVisionService {
  /**
   * Perform OCR on an image URL
   */
  async extractTextFromUrl(imageUrl: string): Promise<OCRResult> {
    // Check cache first
    const cacheKey = CacheKeys.ocrResult(this.hashUrl(imageUrl));
    const cached = await kvCache.get<OCRResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Start the OCR operation
      const operation = await computerVisionClient.read(imageUrl);
      const operationId = this.extractOperationId(operation.operationLocation);

      // Wait for the operation to complete
      let result = await computerVisionClient.getReadResult(operationId);
      let count = 0;
      const maxRetries = 10;

      while (result.status !== 'succeeded' && count < maxRetries) {
        await this.delay(1000);
        result = await computerVisionClient.getReadResult(operationId);
        count++;
      }

      if (result.status !== 'succeeded') {
        throw new Error('OCR operation failed or timed out');
      }

      // Process the results
      const ocrResult = this.processReadResults(result);

      // Cache the result
      await kvCache.set(cacheKey, ocrResult, { ex: CacheDurations.ocrResult });

      return ocrResult;
    } catch (error) {
      console.error('Azure Computer Vision OCR error:', error);
      throw new Error('OCRの処理に失敗しました');
    }
  }

  /**
   * Perform OCR on a base64 encoded image
   */
  async extractTextFromBase64(base64Data: string): Promise<OCRResult> {
    // Check cache first
    const cacheKey = CacheKeys.ocrResult(this.hashString(base64Data));
    const cached = await kvCache.get<OCRResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');

      // Start the OCR operation
      const operation = await computerVisionClient.readInStream(buffer);
      const operationId = this.extractOperationId(operation.operationLocation);

      // Wait for the operation to complete
      let result = await computerVisionClient.getReadResult(operationId);
      let count = 0;
      const maxRetries = 10;

      while (result.status !== 'succeeded' && count < maxRetries) {
        await this.delay(1000);
        result = await computerVisionClient.getReadResult(operationId);
        count++;
      }

      if (result.status !== 'succeeded') {
        throw new Error('OCR operation failed or timed out');
      }

      // Process the results
      const ocrResult = this.processReadResults(result);

      // Cache the result
      await kvCache.set(cacheKey, ocrResult, { ex: CacheDurations.ocrResult });

      return ocrResult;
    } catch (error) {
      console.error('Azure Computer Vision OCR error:', error);
      throw new Error('OCRの処理に失敗しました');
    }
  }

  /**
   * Extract handwritten text specifically
   */
  async extractHandwrittenText(imageData: string | Buffer): Promise<string> {
    try {
      let result: OCRResult;

      if (typeof imageData === 'string') {
        // Assume it's base64 if it's a string
        result = await this.extractTextFromBase64(imageData);
      } else {
        // Convert buffer to base64
        const base64 = imageData.toString('base64');
        result = await this.extractTextFromBase64(base64);
      }

      // Filter for handwritten text (Azure CV detects this automatically)
      return result.text;
    } catch (error) {
      console.error('Handwritten text extraction error:', error);
      throw new Error('手書きテキストの抽出に失敗しました');
    }
  }

  /**
   * Analyze document structure (forms, tables, etc.)
   */
  async analyzeDocument(documentUrl: string): Promise<{
    text: string;
    tables: any[];
    keyValuePairs: Record<string, string>;
  }> {
    try {
      // This would use Form Recognizer for better results
      // For now, use standard OCR and parse structure
      const ocrResult = await this.extractTextFromUrl(documentUrl);
      
      // Simple key-value extraction
      const keyValuePairs = this.extractKeyValuePairs(ocrResult.text);

      return {
        text: ocrResult.text,
        tables: [], // Would need Form Recognizer for proper table extraction
        keyValuePairs,
      };
    } catch (error) {
      console.error('Document analysis error:', error);
      throw new Error('文書分析に失敗しました');
    }
  }

  // Private helper methods

  private extractOperationId(operationLocation: string): string {
    const parts = operationLocation.split('/');
    return parts[parts.length - 1];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private processReadResults(result: any): OCRResult {
    const analyzeResult = result.analyzeResult;
    const lines: OCRLine[] = [];
    let fullText = '';
    let totalConfidence = 0;
    let wordCount = 0;

    for (const readResult of analyzeResult.readResults) {
      for (const line of readResult.lines) {
        const words: OCRWord[] = [];
        
        for (const word of line.words) {
          words.push({
            text: word.text,
            boundingBox: word.boundingBox,
            confidence: word.confidence || 0.9,
          });
          
          totalConfidence += word.confidence || 0.9;
          wordCount++;
        }

        lines.push({
          text: line.text,
          boundingBox: line.boundingBox,
          words,
        });

        fullText += line.text + '\n';
      }
    }

    return {
      text: fullText.trim(),
      lines,
      language: analyzeResult.language || 'ja',
      confidence: wordCount > 0 ? totalConfidence / wordCount : 0,
    };
  }

  private extractKeyValuePairs(text: string): Record<string, string> {
    const pairs: Record<string, string> = {};
    const lines = text.split('\n');

    for (const line of lines) {
      // Look for common patterns like "Key: Value" or "Key：Value"
      const match = line.match(/^(.+?)[：:]\s*(.+)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        pairs[key] = value;
      }
    }

    return pairs;
  }

  private hashUrl(url: string): string {
    return this.hashString(url);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// Export singleton instance
export const azureComputerVision = new AzureComputerVisionService();