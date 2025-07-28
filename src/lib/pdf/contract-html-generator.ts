import { Contract } from '@/types/contract';
import { formatDate } from '../utils/helpers';

export function generateContractHTML(contract: Contract, includeSignatures: boolean = true): string {
  // 契約大臣スタイルの業務委託契約書
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
        font-size: 10.5pt;
        line-height: 1.7;
        color: #000;
        background: white;
        padding: 15px;
      }
      
      .contract-container {
        max-width: 170mm;
        margin: 0 auto;
        padding: 10px;
      }
      
      /* ヘッダー */
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .header h1 {
        font-size: 18pt;
        font-weight: 700;
        color: #000;
        letter-spacing: 0.1em;
        margin-bottom: 20px;
      }
      
      .contract-intro {
        text-align: left;
        margin-bottom: 30px;
        font-size: 10.5pt;
        line-height: 1.8;
      }
      
      /* 当事者情報セクション */
      .parties-info {
        margin-bottom: 25px;
      }
      
      .party-section {
        margin-bottom: 20px;
      }
      
      .party-label {
        font-size: 14pt;
        font-weight: 700;
        margin-bottom: 10px;
      }
      
      .party-info {
        padding-left: 20px;
        margin-bottom: 8px;
      }
      
      .party-row {
        display: flex;
        margin-bottom: 5px;
      }
      
      .party-field-label {
        width: 80px;
        font-weight: 500;
      }
      
      .party-field-value {
        flex: 1;
      }
      
      /* 契約内容テーブル */
      .contract-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
        page-break-inside: avoid;
      }
      
      .contract-table td {
        border: 1px solid #000;
        padding: 10px;
        vertical-align: top;
      }
      
      .contract-table .label-cell {
        width: 25%;
        background-color: #f5f5f5;
        font-weight: 500;
        text-align: center;
      }
      
      .contract-table .value-cell {
        width: 75%;
        padding: 12px;
        line-height: 1.6;
      }
      
      /* 契約条項 */
      .contract-terms {
        margin-top: 30px;
        page-break-inside: avoid;
      }
      
      .term-item {
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      
      .term-title {
        font-weight: 700;
        margin-bottom: 8px;
      }
      
      .term-content {
        line-height: 1.8;
        text-align: justify;
      }
      
      .term-content p {
        margin-bottom: 8px;
      }
      
      .term-list {
        padding-left: 20px;
        margin: 8px 0;
      }
      
      .term-list li {
        margin-bottom: 5px;
      }
      
      /* フッター */
      .footer {
        margin-top: 40px;
        text-align: right;
        font-size: 9pt;
        color: #666;
      }
      
      .footer-id {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #ccc;
        font-size: 8pt;
      }
      
      /* ページブレイク制御 */
      .page-break {
        page-break-before: always;
      }
      
      .avoid-break {
        page-break-inside: avoid;
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

  // 当事者情報の生成
  const generatePartiesInfo = () => {
    if (!contract.parties || contract.parties.length === 0) return '';

    const contractor = contract.parties.find(p => p.type === 'contractor');
    const client = contract.parties.find(p => p.type === 'client');

    return `
      <div class="parties-info">
        ${contractor ? `
          <div class="party-section">
            <div class="party-label">甲</div>
            <div class="party-info">
              ${contractor.address ? `<div class="party-row">
                <span class="party-field-label">住所 ：</span>
                <span class="party-field-value">${contractor.address}</span>
              </div>` : ''}
              <div class="party-row">
                <span class="party-field-label">会社名 ：</span>
                <span class="party-field-value">${contractor.company || contractor.name}</span>
              </div>
              <div class="party-row">
                <span class="party-field-label">代表者名 ：</span>
                <span class="party-field-value">${contractor.name}</span>
              </div>
            </div>
          </div>
        ` : ''}
        
        ${client ? `
          <div class="party-section">
            <div class="party-label">乙</div>
            <div class="party-info">
              ${client.address ? `<div class="party-row">
                <span class="party-field-label">住所 ：</span>
                <span class="party-field-value">${client.address}</span>
              </div>` : ''}
              <div class="party-row">
                <span class="party-field-label">会社名 ：</span>
                <span class="party-field-value">${client.company || client.name}</span>
              </div>
              <div class="party-row">
                <span class="party-field-label">代表者名 ：</span>
                <span class="party-field-value">${client.name}</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  // 契約内容テーブルの生成
  const generateContractTable = () => {
    return `
      <table class="contract-table">
        <tr>
          <td class="label-cell">業務内容</td>
          <td class="value-cell">${contract.description || contract.content.substring(0, 200)}</td>
        </tr>
        <tr>
          <td class="label-cell">取引金額</td>
          <td class="value-cell">要相談</td>
        </tr>
        <tr>
          <td class="label-cell">締結日</td>
          <td class="value-cell">${formatDate(contract.createdAt)}</td>
        </tr>
        <tr>
          <td class="label-cell">契約締結期間</td>
          <td class="value-cell">締結日より1年間</td>
        </tr>
        <tr>
          <td class="label-cell">更新</td>
          <td class="value-cell">自動更新（1年毎）</td>
        </tr>
        <tr>
          <td class="label-cell">特記事項</td>
          <td class="value-cell">別途協議の上決定</td>
        </tr>
      </table>
    `;
  };

  // 契約条項の生成
  const generateContractTerms = () => {
    // 標準的な業務委託契約の条項
    return `
      <div class="contract-terms">
        <div class="term-item">
          <div class="term-title">第1条（委託業務）</div>
          <div class="term-content">
            <p>甲が乙に対し委託する業務（以下「本業務」という）は、甲の業務に対して付帯する管理システムの制作業務とする。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第2条（委託期間）</div>
          <div class="term-content">
            <p>委託業務の期間は締結日より1年間とする。期間満了の1ヶ月前までに甲乙いずれかから書面による申し出がない限り、同一条件で1年間自動更新されるものとする。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第3条（委託料とその支払い）</div>
          <div class="term-content">
            <p>甲が乙に対し支払う委託料は別途定めるものとする。</p>
            <p>支払い方法は銀行振込とする。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第4条（秘密保持、成果物の権利帰属）</div>
          <div class="term-content">
            <ol class="term-list">
              <li>委託業務により製作された成果物に関する無体財産権及び有体物に関する一切の権利は、乙に帰属する。</li>
              <li>甲は、乙から示された前項の秘密情報の秘密性を保全しなければならない。</li>
              <li>甲と乙は、本業務に付帯する秘密情報を第三者に一切漏洩させてはならない。</li>
              <li>甲は、乙から提供された成果物、及びサービスを複製してはならない。</li>
              <li>甲は、乙から提供された成果物、及び専門的な知識・技術やその蓄積、技術競争において有利に働く技術・経験、及びこれらに付帯する情報を第三者に一切提供してはならない。</li>
            </ol>
          </div>
        </div>

        <div class="page-break"></div>

        <div class="term-item">
          <div class="term-title">第5条（報告義務）</div>
          <div class="term-content">
            <p>乙は、甲の求めがあるときは、委託業務に関する情報をすみやかに報告しなければならない。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第6条（契約解除）</div>
          <div class="term-content">
            <p>第2条に定めた委託期間中に契約解除の申し出があった場合、または、契約当事者の一方が本契約の条項に違反した時は、当事者は何らの催告をせず、直ちに本契約を解除し、また被った損害の賠償を請求することができる。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第7条（契約終了後の効果）</div>
          <div class="term-content">
            <p>期間の満了、解除又は解約を問わず、本契約が終了した場合であっても、本契約終了時において現に存在する個別契約に対し、本契約の効力は失われないものとする。</p>
            <p>また、本契約が期間満了又は解除により終了した場合、甲は乙から提供を受けた成果物を原則として継続利用することはできない。ただし、乙が容認するものに対してはその限りでは無い。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第8条（協議）</div>
          <div class="term-content">
            <p>本契約に定めない事項については、甲乙協議の上、定めるものとする。</p>
          </div>
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
      <title>${contract.title} - ${contract.contractId}</title>
      ${styles}
    </head>
    <body>
      <div class="contract-container">
        <!-- ヘッダー -->
        <div class="header">
          <h1>${contract.title}</h1>
          <div class="contract-intro">
            各当事者は、業務の委託等に関する事項について、次の通り業務委託契約書（以下「本契約」）を締結する。
          </div>
        </div>

        <!-- 当事者情報 -->
        ${generatePartiesInfo()}

        <!-- 契約内容テーブル -->
        ${generateContractTable()}

        <!-- 契約条項 -->
        ${generateContractTerms()}

        <!-- フッター -->
        <div class="footer">
          <div class="footer-id">
            KeiyakuDaijin ID: ${contract.contractId}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}