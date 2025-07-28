import { Contract } from '@/types/contract';
import { formatDate } from '../utils/helpers';

export function generateContractHTML(contract: Contract, includeSignatures: boolean = true): string {
  // 日本語フォント対応のCSS
  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #333;
        background: white;
        padding: 20mm;
      }
      
      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 20px;
      }
      
      .header h1 {
        font-size: 24px;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 10px;
      }
      
      .contract-meta {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        padding: 15px;
        background: #f8fafc;
        border-radius: 5px;
        border-left: 4px solid #2563eb;
      }
      
      .contract-meta div {
        font-size: 10px;
        color: #64748b;
      }
      
      .contract-title {
        font-size: 18px;
        font-weight: 600;
        text-align: center;
        margin: 30px 0;
        color: #1e293b;
      }
      
      .parties-section {
        margin: 30px 0;
        padding: 20px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #fafafa;
      }
      
      .parties-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 15px;
        color: #374151;
        border-bottom: 1px solid #d1d5db;
        padding-bottom: 5px;
      }
      
      .party {
        margin: 15px 0;
        padding: 10px;
        background: white;
        border-radius: 5px;
        border-left: 3px solid #10b981;
      }
      
      .party-role {
        font-weight: 600;
        color: #059669;
        margin-bottom: 5px;
      }
      
      .party-info {
        font-size: 11px;
        color: #6b7280;
        line-height: 1.4;
      }
      
      .content-section {
        margin: 30px 0;
        line-height: 1.8;
      }
      
      .content-section h3 {
        font-size: 14px;
        font-weight: 600;
        margin: 20px 0 10px 0;
        color: #374151;
      }
      
      .contract-content {
        background: white;
        padding: 20px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        white-space: pre-wrap;
        font-size: 11px;
        line-height: 1.7;
      }
      
      .signatures-section {
        margin: 40px 0 20px 0;
        page-break-inside: avoid;
      }
      
      .signature-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-top: 20px;
      }
      
      .signature-box {
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 20px;
        background: #fefefe;
        min-height: 120px;
      }
      
      .signature-header {
        font-weight: 600;
        color: #374151;
        margin-bottom: 10px;
        font-size: 12px;
      }
      
      .signature-info {
        font-size: 10px;
        color: #6b7280;
        line-height: 1.4;
      }
      
      .signature-status {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 9px;
        font-weight: 500;
        margin-top: 8px;
      }
      
      .signed {
        background: #dcfce7;
        color: #166534;
      }
      
      .pending {
        background: #fef3c7;
        color: #92400e;
      }
      
      .footer {
        margin-top: 50px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 10px;
        color: #9ca3af;
      }
      
      .compliance-note {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 5px;
        padding: 15px;
        margin: 20px 0;
        font-size: 10px;
        color: #1e40af;
      }
      
      @media print {
        body {
          padding: 10mm;
        }
        .header {
          margin-bottom: 20px;
        }
        .signature-box {
          break-inside: avoid;
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
          <div class="signature-header">${party.role || party.name}</div>
          <div class="signature-info">
            <div><strong>名前:</strong> ${party.name}</div>
            <div><strong>会社:</strong> ${party.company || 'N/A'}</div>
            <div><strong>メール:</strong> ${party.email}</div>
            ${isSigned ? `
              <div><strong>署名日時:</strong> ${formatDate(signature.signedAt)}</div>
              <div><strong>IPアドレス:</strong> ${signature.ipAddress}</div>
            ` : ''}
          </div>
          <div class="signature-status ${isSigned ? 'signed' : 'pending'}">
            ${isSigned ? '✓ 署名済み' : '○ 署名待ち'}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="signatures-section">
        <h3>電子署名情報</h3>
        <div class="signature-grid">
          ${signatureBoxes}
        </div>
      </div>
    `;
  };

  // 契約当事者情報の生成
  const generatePartiesSection = () => {
    if (!contract.parties || contract.parties.length === 0) return '';

    const partiesHTML = contract.parties.map((party, index) => {
      const roleLabel = party.type === 'contractor' ? '甲（委託者）' : '乙（受託者）';
      
      return `
        <div class="party">
          <div class="party-role">${roleLabel}</div>
          <div class="party-info">
            <div><strong>名前:</strong> ${party.name}</div>
            <div><strong>会社:</strong> ${party.company || 'N/A'}</div>
            <div><strong>役職:</strong> ${party.role || 'N/A'}</div>
            <div><strong>メールアドレス:</strong> ${party.email}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="parties-section">
        <div class="parties-title">契約当事者</div>
        ${partiesHTML}
      </div>
    `;
  };

  // メインHTML構造
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${contract.title}</title>
      ${styles}
    </head>
    <body>
      <div class="header">
        <h1>電子契約書</h1>
      </div>
      
      <div class="contract-meta">
        <div>
          <strong>契約書ID:</strong> ${contract.contractId}<br>
          <strong>契約種別:</strong> ${contract.type}
        </div>
        <div>
          <strong>作成日:</strong> ${formatDate(contract.createdAt)}<br>
          <strong>更新日:</strong> ${formatDate(contract.updatedAt)}
        </div>
      </div>
      
      <div class="contract-title">${contract.title}</div>
      
      ${contract.description ? `
        <div style="margin: 20px 0; padding: 15px; background: #f1f5f9; border-radius: 5px; font-size: 11px; color: #475569;">
          <strong>契約概要:</strong> ${contract.description}
        </div>
      ` : ''}
      
      ${generatePartiesSection()}
      
      <div class="content-section">
        <h3>契約内容</h3>
        <div class="contract-content">
${contract.content}
        </div>
      </div>
      
      ${generateSignatureSection()}
      
      <div class="compliance-note">
        <strong>電子帳簿保存法対応:</strong> 本契約書は電子帳簿保存法に準拠した形式で作成・保存されています。
        タイムスタンプ: ${new Date().toISOString()}
      </div>
      
      <div class="footer">
        電子契約管理システム | 生成日時: ${formatDate(new Date())}
      </div>
    </body>
    </html>
  `;
}