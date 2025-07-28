import { CompletionCertificate } from '@/types/certificate';
import { formatDateForCertificate, getSignatureTypeLabel, getAuthTypeLabel } from './certificateGenerator';

export function generateCertificateHTML(certificate: CompletionCertificate): string {
  const senderParty = certificate.parties.find(p => p.type === 'sender');
  const receiverParty = certificate.parties.find(p => p.type === 'receiver');

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>合意締結証明書</title>
  <style>
    body {
      font-family: 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif;
      margin: 0;
      padding: 40px;
      background: white;
      color: #333;
      line-height: 1.6;
    }
    
    .certificate-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 2px solid #333;
      padding: 40px;
      position: relative;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    
    .logo {
      margin-bottom: 10px;
      font-size: 18px;
      color: #666;
    }
    
    .title {
      font-size: 32px;
      font-weight: bold;
      margin: 20px 0;
      letter-spacing: 2px;
    }
    
    .section {
      margin: 30px 0;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: bold;
      background: #f5f5f5;
      padding: 10px 15px;
      border-left: 4px solid #333;
      margin-bottom: 15px;
    }
    
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    .info-table th,
    .info-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    .info-table th {
      background: #f8f9fa;
      font-weight: bold;
      width: 30%;
    }
    
    .parties-section {
      display: flex;
      justify-content: space-between;
      gap: 40px;
      margin: 30px 0;
    }
    
    .party-info {
      flex: 1;
    }
    
    .party-type {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #333;
    }
    
    .party-details {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      min-height: 200px;
    }
    
    .party-field {
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    
    .party-field:last-child {
      border-bottom: none;
    }
    
    .field-label {
      font-weight: bold;
      color: #555;
      margin-bottom: 5px;
    }
    
    .field-value {
      color: #333;
    }
    
    .input-info-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
    }
    
    .input-info-title {
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
      text-align: center;
      background: #e3f2fd;
      padding: 8px;
      border-radius: 4px;
    }
    
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 14px;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
    
    .disclaimer {
      margin: 20px 0;
      font-size: 14px;
      color: #666;
    }
    
    .issuer-info {
      margin-top: 20px;
      font-size: 14px;
      color: #333;
    }
    
    .hash-info {
      margin-top: 30px;
      font-size: 12px;
      color: #888;
      word-break: break-all;
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
    }
    
    @media print {
      body { margin: 0; padding: 20px; }
      .certificate-container { border: 1px solid #333; }
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <!-- ヘッダー -->
    <div class="header">
      <div class="logo">🏛️ 電子契約システム</div>
      <div class="title">合意締結証明書</div>
    </div>

    <!-- 契約書情報 -->
    <div class="section">
      <div class="section-title">契約書情報</div>
      <table class="info-table">
        <tr>
          <th>契約書名</th>
          <td>${certificate.contractTitle}</td>
        </tr>
        <tr>
          <th>契約書管理番号</th>
          <td>${certificate.contractManagementNumber}</td>
        </tr>
        <tr>
          <th>署名タイプ</th>
          <td>${getSignatureTypeLabel(certificate.signatureType)}</td>
        </tr>
        <tr>
          <th>受信者認証タイプ</th>
          <td>${getAuthTypeLabel(certificate.authType)}</td>
        </tr>
        <tr>
          <th>タイムスタンプ日時</th>
          <td>${formatDateForCertificate(certificate.timestampDate)}</td>
        </tr>
      </table>
    </div>

    <!-- 合意締結当事者 -->
    <div class="section">
      <div class="section-title">合意締結当事者</div>
      
      <div class="parties-section">
        <!-- 送信者 -->
        ${senderParty ? `
        <div class="party-info">
          <div class="party-type">送信者</div>
          <div class="party-details">
            <div class="party-field">
              <div class="field-value">${senderParty.company || senderParty.name}</div>
            </div>
            <div class="party-field">
              <div class="field-value">${senderParty.name} ${senderParty.email}</div>
            </div>
            <div class="party-field">
              <div class="field-value">${senderParty.authMethod}</div>
            </div>
            <div class="party-field">
              <div class="field-value">${formatDateForCertificate(senderParty.signedAt)}</div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- 受信者 -->
        ${receiverParty ? `
        <div class="party-info">
          <div class="party-type">受信者</div>
          <div class="party-details">
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
              <div style="flex: 1; margin-right: 20px;">
                <div class="input-info-title">【契約者情報】</div>
                <div class="party-field">
                  <div class="field-value">${receiverParty.name}</div>
                </div>
                <div class="party-field">
                  <div class="field-value">${receiverParty.email}</div>
                </div>
                <div class="party-field">
                  <div class="field-value">${receiverParty.company || ''}</div>
                </div>
                <div class="party-field">
                  <div class="field-value">${formatDateForCertificate(receiverParty.signedAt)}</div>
                </div>
              </div>
              
              ${receiverParty.inputInfo ? `
              <div style="flex: 1;">
                <div class="input-info-title">【合意者入力情報】</div>
                <div class="party-field">
                  <div class="field-value">${receiverParty.inputInfo.name || receiverParty.name}</div>
                </div>
                <div class="party-field">
                  <div class="field-value">${receiverParty.inputInfo.address || ''}</div>
                </div>
                <div class="party-field">
                  <div class="field-value">${receiverParty.inputInfo.company || receiverParty.company || ''}</div>
                </div>
              </div>
              ` : ''}
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- フッター -->
    <div class="footer">
      <div class="disclaimer">
        ※本証明書は、送信者及び、受領者の合意日時を証明する書面です。
      </div>
      <div class="issuer-info">
        ${formatDateForCertificate(certificate.issuedAt)} 証明書発行： ${certificate.issuedBy}（運営：${certificate.issuerCompany}）
      </div>
      <div class="hash-info">
        証明書ハッシュ値: ${certificate.certificateHash}
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateCertificatePDFOptions() {
  return {
    format: 'A4' as const,
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm',
    },
    displayHeaderFooter: false,
  };
}