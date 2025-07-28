import { Contract } from '@/types/contract';
import { formatDate } from '../utils/helpers';

export function generateContractHTML(contract: Contract, includeSignatures: boolean = true): string {
  // 契約大臣風のフォーマルなデザイン - 1ページに収まるコンパクト版
  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&family=Noto+Sans+JP:wght@300;400;500;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      @page {
        size: A4;
        margin: 15mm;
      }
      
      body {
        font-family: 'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        font-size: 10pt;
        line-height: 1.6;
        color: #000;
        background: white;
        padding: 5mm;
      }
      
      .contract-container {
        max-width: 190mm;
        margin: 0 auto;
      }
      
      /* ヘッダー部分 */
      .header {
        text-align: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 3px double #000;
      }
      
      .header h1 {
        font-size: 18pt;
        font-weight: 900;
        color: #000;
        letter-spacing: 0.2em;
        margin-bottom: 3px;
      }
      
      .contract-id {
        font-size: 9pt;
        color: #333;
        font-family: 'Noto Sans JP', sans-serif;
      }
      
      /* 契約メタ情報 */
      .contract-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding: 5px 0;
        border-top: 1px solid #666;
        border-bottom: 1px solid #666;
      }
      
      .contract-meta div {
        font-size: 9pt;
        color: #333;
        font-family: 'Noto Sans JP', sans-serif;
      }
      
      /* 契約タイトル */
      .contract-title {
        font-size: 14pt;
        font-weight: 700;
        text-align: center;
        margin: 15px 0;
        color: #000;
        letter-spacing: 0.1em;
      }
      
      /* 当事者情報 */
      .parties-section {
        margin-bottom: 15px;
        padding: 8px;
        background: #f8f8f8;
        border: 1px solid #666;
      }
      
      .parties-title {
        font-size: 11pt;
        font-weight: 700;
        margin-bottom: 8px;
        text-align: center;
        letter-spacing: 0.1em;
      }
      
      .parties-grid {
        display: flex;
        gap: 15px;
      }
      
      .party-box {
        flex: 1;
        padding: 8px;
        background: white;
        border: 1px solid #999;
      }
      
      .party-role {
        font-size: 10pt;
        font-weight: 700;
        color: white;
        background: #333;
        padding: 2px 0;
        text-align: center;
        margin-bottom: 5px;
      }
      
      .party-info {
        font-size: 9pt;
        line-height: 1.4;
      }
      
      .party-info > div {
        margin-bottom: 2px;
      }
      
      /* 契約内容 */
      .content-section {
        margin-bottom: 15px;
      }
      
      .content-header {
        font-size: 11pt;
        font-weight: 700;
        margin-bottom: 5px;
        padding: 3px 0;
        border-bottom: 1px solid #000;
        letter-spacing: 0.05em;
      }
      
      .contract-content {
        padding: 8px;
        border: 1px solid #666;
        font-size: 9pt;
        line-height: 1.5;
        text-align: justify;
        white-space: pre-wrap;
        max-height: 200px;
        overflow: hidden;
      }
      
      /* 署名欄 */
      .signatures-section {
        margin-top: 15px;
        padding-top: 10px;
        border-top: 2px solid #000;
      }
      
      .signatures-title {
        font-size: 11pt;
        font-weight: 700;
        text-align: center;
        margin-bottom: 10px;
        letter-spacing: 0.1em;
      }
      
      .signature-grid {
        display: flex;
        gap: 20px;
      }
      
      .signature-box {
        flex: 1;
        padding: 8px;
        border: 2px solid #000;
        min-height: 80px;
        background: white;
      }
      
      .signature-header {
        font-size: 10pt;
        font-weight: 700;
        text-align: center;
        margin-bottom: 5px;
        padding-bottom: 3px;
        border-bottom: 1px solid #666;
      }
      
      .signature-info {
        font-size: 8pt;
        line-height: 1.4;
        font-family: 'Noto Sans JP', sans-serif;
      }
      
      .signature-status {
        text-align: center;
        margin-top: 5px;
        font-weight: 700;
      }
      
      .signed {
        color: #006600;
      }
      
      .pending {
        color: #CC0000;
      }
      
      /* 法的準拠表示 */
      .legal-footer {
        margin-top: 15px;
        padding: 5px;
        background: #f0f0f0;
        border: 1px solid #999;
        text-align: center;
        font-size: 8pt;
        color: #666;
        font-family: 'Noto Sans JP', sans-serif;
      }
      
      /* 印刷用最適化 */
      @media print {
        body {
          padding: 0;
        }
        .contract-container {
          max-width: 100%;
        }
      }
    </style>
  `;

  // 署名情報の生成
  const generateSignatureSection = () => {
    if (!includeSignatures || !contract.parties) return '';

    const signatureBoxes = contract.parties.map(party => {
      const signature = contract.signatures?.find(sig => sig.partyId === party.id);
      const isSigned = signature && signature.signedAt;
      
      return `
        <div class="signature-box">
          <div class="signature-header">${party.type === 'contractor' ? '甲' : '乙'}（${party.role || party.name}）</div>
          <div class="signature-info">
            <div><strong>氏名:</strong> ${party.name}</div>
            ${party.company ? `<div><strong>会社名:</strong> ${party.company}</div>` : ''}
            ${isSigned ? `
              <div><strong>署名日時:</strong> ${formatDate(signature.signedAt)}</div>
            ` : ''}
          </div>
          <div class="signature-status ${isSigned ? 'signed' : 'pending'}">
            ${isSigned ? '【署名済】' : '【未署名】'}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="signatures-section">
        <div class="signatures-title">署名欄</div>
        <div class="signature-grid">
          ${signatureBoxes}
        </div>
      </div>
    `;
  };

  // 契約当事者情報の生成
  const generatePartiesSection = () => {
    if (!contract.parties || contract.parties.length === 0) return '';

    const partiesHTML = contract.parties.map((party) => {
      const roleLabel = party.type === 'contractor' ? '甲（委託者）' : '乙（受託者）';
      
      return `
        <div class="party-box">
          <div class="party-role">${roleLabel}</div>
          <div class="party-info">
            <div><strong>名称:</strong> ${party.name}</div>
            ${party.company ? `<div><strong>会社:</strong> ${party.company}</div>` : ''}
            <div><strong>連絡先:</strong> ${party.email}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="parties-section">
        <div class="parties-title">契約当事者</div>
        <div class="parties-grid">
          ${partiesHTML}
        </div>
      </div>
    `;
  };

  // HTMLの組み立て
  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${contract.title}</title>
      ${styles}
    </head>
    <body>
      <div class="contract-container">
        <!-- ヘッダー -->
        <div class="header">
          <h1>契約書</h1>
          <div class="contract-id">契約書番号: ${contract.contractId}</div>
        </div>

        <!-- メタ情報 -->
        <div class="contract-meta">
          <div>作成日: ${formatDate(contract.createdAt)}</div>
          <div>更新日: ${formatDate(contract.updatedAt)}</div>
          <div>状態: ${contract.status === 'draft' ? '下書き' : contract.status === 'signed' ? '署名済' : '有効'}</div>
        </div>

        <!-- 契約タイトル -->
        <div class="contract-title">${contract.title}</div>

        <!-- 契約当事者 -->
        ${generatePartiesSection()}

        <!-- 契約内容 -->
        <div class="content-section">
          <div class="content-header">契約条項</div>
          <div class="contract-content">${contract.content}</div>
        </div>

        <!-- 署名欄 -->
        ${generateSignatureSection()}

        <!-- 法的準拠 -->
        <div class="legal-footer">
          本契約書は電子帳簿保存法及び電子署名法に準拠して作成されています
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}