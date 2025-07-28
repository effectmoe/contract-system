import { Contract, AIAnalysis, Risk } from '@/types/contract';
import { kvCache, CacheKeys, CacheDurations } from '@/lib/db/kv';
import { config } from '../config/env';

// 動的インポート用の型
type OpenAI = any;

export class DeepSeekService {
  private model: string = 'deepseek-chat';

  private async getClient(): Promise<OpenAI> {
    // デモモードの場合はnullを返す
    if (config.ai.deepseek.isDemo || config.isDemo) {
      throw new Error('Demo mode - AI analysis not available');
    }

    // 動的インポート
    const { default: OpenAI } = await import('openai');
    
    return new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    });
  }

  /**
   * Analyze contract content and extract key information
   */
  async analyzeContract(contract: Contract): Promise<AIAnalysis> {
    // デモモードの場合はデモ分析を返す
    if (config.ai.deepseek.isDemo || config.isDemo) {
      return this.getDemoAnalysis(contract);
    }

    const cacheKey = CacheKeys.aiResponse(`analyze_${contract.contractId}`);
    
    // Check cache first
    const cached = await kvCache.get<AIAnalysis>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const deepseek = await this.getClient();
      const prompt = this.buildAnalysisPrompt(contract);
      
      const response = await deepseek.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'あなたは法律に詳しいAIアシスタントです。契約書を分析し、重要な条項、リスク、推奨事項を日本語で提供してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const analysisText = response.choices[0]?.message?.content || '';
      const analysis = this.parseAnalysisResponse(analysisText);

      // Cache the result
      await kvCache.set(cacheKey, analysis, { ex: CacheDurations.aiResponse });

      return analysis;
    } catch (error) {
      console.error('DeepSeek analysis error:', error);
      throw new Error('契約分析に失敗しました');
    }
  }

  /**
   * Generate contract summary
   */
  async summarizeContract(contract: Contract): Promise<string> {
    const cacheKey = CacheKeys.aiResponse(`summary_${contract.contractId}`);
    
    // Check cache first
    const cached = await kvCache.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const deepseek = await this.getClient();
      const response = await deepseek.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '契約書の内容を簡潔に要約してください。重要なポイントを箇条書きで示してください。'
          },
          {
            role: 'user',
            content: `以下の契約書を要約してください:\n\nタイトル: ${contract.title}\n\n内容:\n${contract.content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const summary = response.choices[0]?.message?.content || '';

      // Cache the result
      await kvCache.set(cacheKey, summary, { ex: CacheDurations.aiResponse });

      return summary;
    } catch (error) {
      console.error('DeepSeek summarization error:', error);
      throw new Error('要約の生成に失敗しました');
    }
  }

  /**
   * Chat with AI about contract
   */
  async chat(contractId: string, message: string, context?: string): Promise<string> {
    // デモモードの場合はデモ応答を返す
    if (config.ai.deepseek.isDemo || config.isDemo) {
      return this.getDemoChatResponse(message, context);
    }

    try {
      const systemPrompt = context 
        ? `あなたは契約書に関する質問に答えるAIアシスタントです。以下の契約内容に基づいて回答してください:\n\n${context}`
        : 'あなたは契約書に関する質問に答えるAIアシスタントです。';

      const deepseek = await this.getClient();
      const response = await deepseek.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('DeepSeek chat error:', error);
      throw new Error('チャットの処理に失敗しました');
    }
  }

  /**
   * Extract specific clauses from contract
   */
  async extractClauses(content: string, clauseTypes: string[]): Promise<Record<string, string>> {
    try {
      const clauseList = clauseTypes.join('、');
      const deepseek = await this.getClient();
      
      const response = await deepseek.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '契約書から指定された条項を抽出してください。各条項の内容を正確に抜き出してください。'
          },
          {
            role: 'user',
            content: `以下の契約書から次の条項を抽出してください: ${clauseList}\n\n契約内容:\n${content}`
          }
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      const extractedText = response.choices[0]?.message?.content || '';
      return this.parseClausesResponse(extractedText, clauseTypes);
    } catch (error) {
      console.error('DeepSeek clause extraction error:', error);
      throw new Error('条項の抽出に失敗しました');
    }
  }

  /**
   * Compare two contracts
   */
  async compareContracts(contract1: Contract, contract2: Contract): Promise<{
    similarities: string[];
    differences: string[];
    recommendation: string;
  }> {
    try {
      const deepseek = await this.getClient();
      const response = await deepseek.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '2つの契約書を比較し、共通点と相違点を分析してください。'
          },
          {
            role: 'user',
            content: `以下の2つの契約書を比較してください:\n\n契約1: ${contract1.title}\n${contract1.content}\n\n契約2: ${contract2.title}\n${contract2.content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const comparisonText = response.choices[0]?.message?.content || '';
      return this.parseComparisonResponse(comparisonText);
    } catch (error) {
      console.error('DeepSeek comparison error:', error);
      throw new Error('契約書の比較に失敗しました');
    }
  }

  /**
   * Generate contract suggestions based on type
   */
  async generateSuggestions(contractType: string, context: Record<string, any>): Promise<string[]> {
    // デモモードの場合はデモ提案を返す
    if (config.ai.deepseek.isDemo || config.isDemo) {
      return [
        'デモモード：実際の環境では具体的な提案が生成されます',
        '契約条項の明確化を検討してください',
        '当事者の権利と義務を詳細に記載してください',
        '契約期間と更新条件を明確にしてください',
        '紛争解決条項を追加することを推奨します'
      ];
    }

    try {
      const deepseek = await this.getClient();
      const response = await deepseek.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: '契約書の作成に関する具体的な提案を提供してください。'
          },
          {
            role: 'user',
            content: `${contractType}の契約書を作成する際の重要な条項や注意点を提案してください。コンテキスト: ${JSON.stringify(context)}`
          }
        ],
        temperature: 0.4,
        max_tokens: 1000,
      });

      const suggestionsText = response.choices[0]?.message?.content || '';
      return this.parseSuggestionsResponse(suggestionsText);
    } catch (error) {
      console.error('DeepSeek suggestions error:', error);
      throw new Error('提案の生成に失敗しました');
    }
  }

  // Private helper methods

  private buildAnalysisPrompt(contract: Contract): string {
    return `
以下の契約書を分析してください:

タイトル: ${contract.title}
種類: ${contract.type}
作成日: ${contract.createdAt}

契約当事者:
${contract.parties.map(p => `- ${p.role}: ${p.name} (${p.company || 'N/A'})`).join('\n')}

契約内容:
${contract.content}

以下の点について分析してください:
1. 契約の要約（3-5文）
2. 重要な条項（キーターム）
3. 潜在的なリスク（低・中・高のレベルで評価）
4. 改善のための推奨事項
5. 契約の推定価値（もしあれば）
`;
  }

  private parseAnalysisResponse(text: string): AIAnalysis {
    // Simple parsing logic - in production, use more sophisticated parsing
    const sections = text.split(/\n\n/);
    
    const summary = sections.find(s => s.includes('要約'))?.replace(/.*要約[:：]\s*/i, '') || '';
    const keyTermsSection = sections.find(s => s.includes('条項') || s.includes('キーターム')) || '';
    const risksSection = sections.find(s => s.includes('リスク')) || '';
    const recommendationsSection = sections.find(s => s.includes('推奨') || s.includes('提案')) || '';

    const keyTerms = this.extractListItems(keyTermsSection);
    const risks = this.parseRisks(risksSection);
    const recommendations = this.extractListItems(recommendationsSection);

    return {
      summary,
      keyTerms,
      risks,
      recommendations,
      contractType: 'general', // This could be extracted from the analysis
      analyzedAt: new Date(),
    };
  }

  private parseRisks(text: string): Risk[] {
    const risks: Risk[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
      let level: Risk['level'] = 'low';
      let description = line;

      if (line.includes('高') || line.includes('High')) {
        level = 'high';
      } else if (line.includes('中') || line.includes('Medium')) {
        level = 'medium';
      }

      // Clean up the description
      description = description.replace(/^[-・*]\s*/, '').replace(/[(（].*?[)）]/g, '').trim();

      if (description) {
        risks.push({ level, description });
      }
    }

    return risks;
  }

  private extractListItems(text: string): string[] {
    return text
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-・*\d.]\s*/, '').trim())
      .filter(item => item.length > 0);
  }

  private parseClausesResponse(text: string, clauseTypes: string[]): Record<string, string> {
    const clauses: Record<string, string> = {};
    
    for (const clauseType of clauseTypes) {
      const regex = new RegExp(`${clauseType}[：:](.*?)(?=\\n\\n|$)`, 's');
      const match = text.match(regex);
      if (match) {
        clauses[clauseType] = match[1].trim();
      }
    }

    return clauses;
  }

  private parseComparisonResponse(text: string): {
    similarities: string[];
    differences: string[];
    recommendation: string;
  } {
    const similaritiesSection = text.match(/共通点[：:]?(.*?)(?=相違点|$)/s)?.[1] || '';
    const differencesSection = text.match(/相違点[：:]?(.*?)(?=推奨|結論|$)/s)?.[1] || '';
    const recommendationSection = text.match(/(?:推奨|結論|まとめ)[：:]?(.*?)$/s)?.[1] || '';

    return {
      similarities: this.extractListItems(similaritiesSection),
      differences: this.extractListItems(differencesSection),
      recommendation: recommendationSection.trim(),
    };
  }

  private parseSuggestionsResponse(text: string): string[] {
    return this.extractListItems(text);
  }

  private getDemoAnalysis(contract: Contract): AIAnalysis {
    return {
      summary: `この${contract.title}は、${contract.parties.length}者間の契約であり、${contract.type}に関する内容が含まれています。デモモードで表示されています。実際の環境では、AIによる詳細な分析が実行されます。`,
      keyTerms: [
        '契約期間：明確に定義されています',
        '当事者の権利と義務：詳細に記載',
        '報酬・対価：具体的な金額設定',
        '契約解除条件：適切に設定',
        '守秘義務：含まれています'
      ],
      risks: [
        {
          level: 'low',
          description: 'デモモードでは詳細なリスク分析は行われません。実際の環境では、契約内容に基づいた具体的なリスク評価が提供されます。'
        },
        {
          level: 'medium',
          description: '一般的な契約リスクとして、曖昧な表現や不完全な条項がある可能性があります。'
        }
      ],
      recommendations: [
        '実際の環境でのAI分析をご利用ください',
        '法的専門家による最終確認を推奨します',
        '契約条項の明確化を検討してください',
        '定期的な契約見直しを実施してください'
      ],
      contractType: contract.type,
      analyzedAt: new Date(),
    };
  }

  private getDemoChatResponse(message: string, context?: string): string {
    // 契約書の内容から関連情報を抽出
    let contractInfo = '';
    if (context) {
      // 契約書タイトルを抽出
      const titleMatch = context.match(/契約書タイトル:\s*([^\n]+)/);
      const title = titleMatch ? titleMatch[1] : '契約書';
      
      // 契約内容から重要な情報を抽出
      const contentMatch = context.match(/契約内容:\s*([\s\S]*?)(?=\n\n|$)/);
      const content = contentMatch ? contentMatch[1].substring(0, 200) : '';
      
      contractInfo = `「${title}」について、`;
    }

    // 質問の内容に応じてデモ応答を生成
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('消費税') || lowerMessage.includes('税')) {
      return `${contractInfo}消費税に関するご質問ですね。

この契約書では、商品名「サンプル製品A」、数量1000個、単価5,000円の売買契約において、総額5,000,000円という記載があります。

消費税の取り扱いについて：
• 総額5,000,000円が税込み価格か税抜き価格か明確にする必要があります
• 一般的に、消費税は別途表示されることが推奨されます
• 現在の消費税率10%を適用する場合、税抜き4,545,455円＋消費税454,545円となります

**デモモード**：実際の環境では、契約書の具体的な記載内容に基づいて、より詳細な法的分析を提供いたします。重要な税務事項については税理士にご相談ください。`;
    }
    
    if (lowerMessage.includes('期間') || lowerMessage.includes('期限')) {
      return `${contractInfo}契約期間に関するご質問ですね。

この契約書では「甲は2024年3月31日までに商品を納入する」という記載があります。

期間に関する法的ポイント：
• 納期の明確な設定により、双方の義務が明確になっています
• 2024年3月31日が確定日付として設定されています
• 遅延時の責任や損害賠償についても検討が必要です

**デモモード**：実際の環境では、契約書の具体的な期間条項を詳細に分析し、関連する民法上の規定や判例に基づいた専門的なアドバイスを提供いたします。`;
    }
    
    if (lowerMessage.includes('リスク') || lowerMessage.includes('問題')) {
      return `${contractInfo}契約上のリスクについてご質問いただきました。

この売買契約における主なリスク要因：

**納期リスク**
• 2024年3月31日までの納入義務が設定されています
• 遅延時の損害賠償条項の確認が必要です

**品質リスク**
• 商品の品質基準や検査方法の明記が重要です
• 不良品の場合の責任分担を明確にすべきです

**支払いリスク**
• 代金支払い条件の詳細確認が必要です
• 分割支払いや前払いの条件があれば注意が必要です

**デモモード**：実際の環境では、契約書全体を精査し、民法・商法の規定に照らして具体的なリスク評価と対策を提案いたします。`;
    }

    // 一般的な応答
    return `${contractInfo}ご質問いただきありがとうございます。

この契約書「ABC商事との売買契約」についてお答えいたします。

**契約の概要**
• 売主：株式会社サンプル（甲）
• 買主：ABC商事株式会社（乙）
• 商品：サンプル製品A 1000個
• 単価：5,000円
• 総額：5,000,000円
• 納期：2024年3月31日まで

**デモモードでの制限事項**
現在デモモードで動作しているため、実際のAI分析機能は制限されています。本番環境では以下の機能をご利用いただけます：

• 契約書の詳細な法的分析
• 関連法令・判例の自動参照
• リスク評価と対策提案
• コンプライアンスチェック
• 印紙税等の税務計算

より具体的なご質問がございましたら、お気軽にお聞かせください。重要な法的判断については、必ず法律専門家にご相談いただくことをお勧めします。`;
  }
}

// Export singleton instance
export const deepSeekService = new DeepSeekService();