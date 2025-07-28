import { Contract } from '@/types/contract';
import { formatDate } from '../utils/helpers';

export function generateContractHTML(contract: Contract, includeSignatures: boolean = true): string {
  // 契約大臣スタイルの合意締結証明書
  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      @page {
        size: A4;
        margin: 20mm;
      }
      
      body {
        font-family: 'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
        font-size: 11pt;
        line-height: 1.8;
        color: #333;
        background: white;
        padding: 20px;
      }
      
      .certificate-container {
        max-width: 170mm;
        margin: 0 auto;
      }
      
      /* ヘッダー */
      .header {
        text-align: center;
        margin-bottom: 40px;
      }
      
      .header h1 {
        font-size: 24pt;
        font-weight: 700;
        color: #000;
        letter-spacing: 0.2em;
        margin-bottom: 30px;
      }
      
      /* 契約書情報セクション */
      .contract-info-section {
        margin-bottom: 40px;
      }
      
      .section-title {
        font-size: 16pt;
        font-weight: 700;
        color: #000;
        margin-bottom: 20px;
        padding-bottom: 5px;
        border-bottom: 2px solid #000;
      }
      
      .info-table {
        width: 100%;
        margin-bottom: 20px;
      }
      
      .info-row {
        display: flex;
        margin-bottom: 12px;
        align-items: flex-start;
      }
      
      .info-label {
        width: 140px;
        font-weight: 500;
        color: #000;
        flex-shrink: 0;
      }
      
      .info-value {
        flex: 1;
        color: #333;
        padding-left: 20px;
      }
      
      /* 合意締結当事者セクション */
      .parties-section {
        margin-bottom: 40px;
      }
      
      .party-container {
        margin-bottom: 30px;
      }
      
      .party-type {
        font-size: 14pt;
        font-weight: 700;
        color: #000;
        margin-bottom: 15px;
      }
      
      .party-box {
        background: #f8f8f8;
        padding: 20px;
        border-left: 4px solid #333;
        margin-bottom: 20px;
      }
      
      .party-name {
        font-size: 12pt;
        font-weight: 500;
        margin-bottom: 8px;
      }
      
      .party-details {
        font-size: 10pt;
        color: #555;
        line-height: 1.6;
      }
      
      .party-details div {
        margin-bottom: 3px;
      }
      
      /* 2列レイアウト用 */
      .two-column {
        display: flex;
        gap: 30px;
        margin-bottom: 20px;
      }
      
      .column {
        flex: 1;
      }
      
      .column-title {
        font-weight: 700;
        margin-bottom: 10px;
        padding: 5px;
        background: #333;
        color: white;
        text-align: center;
      }
      
      /* フッター */
      .footer {
        margin-top: 60px;
        padding-top: 20px;
        border-top: 1px solid #ccc;
        text-align: center;
        font-size: 9pt;
        color: #666;
      }
      
      .footer-note {
        margin-bottom: 20px;
        font-size: 10pt;
        color: #333;
      }
      
      .footer-timestamp {
        margin-bottom: 5px;
      }
      
      /* ロゴエリア（プレースホルダー） */
      .logo-area {
        display: inline-block;
        width: 60px;
        height: 60px;
        border: 2px solid #ccc;
        border-radius: 50%;
        line-height: 56px;
        text-align: center;
        font-weight: 700;
        color: #666;
        margin-bottom: 10px;
      }
      
      /* ステータスバッジ */
      .status-badge {
        display: inline-block;
        padding: 3px 10px;
        background: #4CAF50;
        color: white;
        border-radius: 3px;
        font-size: 9pt;
        font-weight: 500;
      }
      
      .status-badge.pending {
        background: #FF9800;
      }
      
      @media print {
        body {
          padding: 0;
        }
        .certificate-container {
          max-width: 100%;
        }
      }
    </style>
  `;

  // 署名情報の生成
  const generatePartiesInfo = () => {
    if (!contract.parties || contract.parties.length === 0) return '';

    const parties = contract.parties.map(party => {
      const signature = contract.signatures?.find(sig => sig.partyId === party.id);
      const isSigned = signature && signature.signedAt;
      const partyType = party.type === 'contractor' ? '送信者' : '受信者';

      return `
        <div class="party-container">
          <div class="party-type">${partyType}</div>
          ${party.type === 'contractor' ? 
            // 送信者の情報
            `<div class="party-box">
              <div class="party-name">${party.company || party.name}</div>
              <div class="party-details">
                <div>${party.name}　${party.email}</div>
                <div>Eメール認証</div>
                <div>${isSigned ? formatDate(signature.signedAt, true) : '未署名'}</div>
              </div>
            </div>` :
            // 受信者の情報（2列レイアウト）
            `<div class="two-column">
              <div class="column">
                <div class="column-title">【契約者情報】</div>
                <div class="party-box">
                  <div class="party-details">
                    <div>${party.name}</div>
                    <div>${party.email}</div>
                    <div>${party.company || ''}</div>
                    <div>${isSigned ? formatDate(signature.signedAt, true) : '未署名'}</div>
                  </div>
                </div>
              </div>
              <div class="column">
                <div class="column-title">【合意者入力情報】</div>
                <div class="party-box">
                  <div class="party-details">
                    <div>${party.name}</div>
                    <div>${party.address || '住所未入力'}</div>
                    <div>${party.company || ''}</div>
                  </div>
                </div>
              </div>
            </div>`
          }
        </div>
      `;
    }).join('');

    return parties;
  };

  // HTMLの組み立て
  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>合意締結証明書 - ${contract.contractId}</title>
      ${styles}
    </head>
    <body>
      <div class="certificate-container">
        <!-- ヘッダー -->
        <div class="header">
          <div class="logo-area">契</div>
          <h1>合意締結証明書</h1>
        </div>

        <!-- 契約書情報 -->
        <div class="contract-info-section">
          <h2 class="section-title">契約書情報</h2>
          <div class="info-table">
            <div class="info-row">
              <div class="info-label">契約書名</div>
              <div class="info-value">${contract.title}</div>
            </div>
            <div class="info-row">
              <div class="info-label">契約書管理番号</div>
              <div class="info-value">${contract.contractId}</div>
            </div>
            <div class="info-row">
              <div class="info-label">署名タイプ</div>
              <div class="info-value">電子サイン</div>
            </div>
            <div class="info-row">
              <div class="info-label">受信者認証タイプ</div>
              <div class="info-value">Eメール認証</div>
            </div>
            <div class="info-row">
              <div class="info-label">タイムスタンプ日時</div>
              <div class="info-value">
                ${contract.signatures && contract.signatures.length > 0 
                  ? formatDate(new Date(Math.max(...contract.signatures.map(s => new Date(s.signedAt).getTime()))), true)
                  : formatDate(contract.updatedAt, true)}
              </div>
            </div>
          </div>
        </div>

        <!-- 合意締結当事者 -->
        <div class="parties-section">
          <h2 class="section-title">合意締結当事者</h2>
          ${generatePartiesInfo()}
        </div>

        <!-- フッター -->
        <div class="footer">
          <div class="footer-note">
            ※本証明書は、送信者及び、受領者の合意日時を証明する書面です。
          </div>
          <div class="footer-timestamp">
            ${formatDate(new Date(), true)}　証明書発行： 電子契約システム
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}