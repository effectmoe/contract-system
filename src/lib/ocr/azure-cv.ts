import { kvCache, CacheKeys, CacheDurations } from '@/lib/db/kv';
import { config } from '../config/env';

// Azure Computer Vision configuration
const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT!;
const apiKey = process.env.AZURE_COMPUTER_VISION_KEY!;

// 動的インポート用の型
type ComputerVisionClient = any;
type ApiKeyCredentials = any;

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
  private async getClient(): Promise<ComputerVisionClient> {
    // デモモードの場合はnullを返す
    if (config.ai.azure.isDemo || config.isDemo) {
      throw new Error('Demo mode - OCR not available');
    }

    // 動的インポート
    const [{ ComputerVisionClient }, { ApiKeyCredentials }] = await Promise.all([
      import('@azure/cognitiveservices-computervision'),
      import('@azure/ms-rest-js')
    ]);

    return new ComputerVisionClient(
      new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': apiKey } }),
      endpoint
    );
  }

  /**
   * Perform OCR on an image URL
   */
  async extractTextFromUrl(imageUrl: string): Promise<OCRResult> {
    // デモモードの場合はデモ結果を返す
    if (config.ai.azure.isDemo || config.isDemo) {
      return this.getDemoOCRResult('URL画像のデモテキスト');
    }

    // Check cache first
    const cacheKey = CacheKeys.ocrResult(this.hashUrl(imageUrl));
    const cached = await kvCache.get<OCRResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const computerVisionClient = await this.getClient();
      
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
    // デモモードの場合はデモ結果を返す
    if (config.ai.azure.isDemo || config.isDemo) {
      return this.getDemoOCRResult('Base64画像のデモテキスト');
    }

    // Check cache first
    const cacheKey = CacheKeys.ocrResult(this.hashString(base64Data));
    const cached = await kvCache.get<OCRResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const computerVisionClient = await this.getClient();
      
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

  private getDemoOCRResult(demoText: string): OCRResult {
    return {
      text: `${demoText}\n\nこれはデモモードです。\n実際の環境では画像から文字を認識します。\n\n契約書のサンプルテキスト：\n契約書\n甲：サンプル会社\n乙：テスト太郎\n\n第1条（目的）\n本契約は、デモ用の契約です。\n\n令和6年1月1日`,
      lines: [
        {
          text: demoText,
          boundingBox: [0, 0, 100, 20],
          words: [
            {
              text: demoText,
              boundingBox: [0, 0, 100, 20],
              confidence: 0.95
            }
          ]
        }
      ],
      language: 'ja',
      confidence: 0.95
    };
  }
}

// Export singleton instance
export const azureComputerVision = new AzureComputerVisionService();