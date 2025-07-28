import { Contract } from '@/types/contract';
import { formatDate } from '../utils/helpers';

export function generateEmploymentHTML(contract: Contract): string {
  // 雇用契約書のスタイル
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
      
      .employment-container {
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
      
      .employment-intro {
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
      
      /* 雇用条件テーブル */
      .employment-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 30px;
        page-break-inside: avoid;
      }
      
      .employment-table td {
        border: 1px solid #000;
        padding: 10px;
        vertical-align: top;
      }
      
      .employment-table .label-cell {
        width: 25%;
        background-color: #f5f5f5;
        font-weight: 500;
        text-align: center;
      }
      
      .employment-table .value-cell {
        width: 75%;
        padding: 12px;
        line-height: 1.6;
      }
      
      /* 契約条項 */
      .employment-terms {
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
        padding: 15px;
        border: 1px solid #ddd;
        background-color: #f9f9f9;
        font-size: 9pt;
        text-align: center;
        color: #666;
      }
      
      @media print {
        body {
          padding: 0;
        }
        .employment-container {
          max-width: 100%;
        }
      }
    </style>
  `;

  // 当事者情報の生成
  const generatePartiesInfo = () => {
    if (!contract.parties || contract.parties.length === 0) return '';

    const employer = contract.parties.find(p => p.type === 'contractor');
    const employee = contract.parties.find(p => p.type === 'client');

    return `
      <div class="parties-info">
        ${employer ? `
          <div class="party-section">
            <div class="party-label">甲（使用者）</div>
            <div class="party-info">
              ${employer.address ? `<div class="party-row">
                <span class="party-field-label">住所 ：</span>
                <span class="party-field-value">${employer.address}</span>
              </div>` : ''}
              <div class="party-row">
                <span class="party-field-label">会社名 ：</span>
                <span class="party-field-value">${employer.company || employer.name}</span>
              </div>
              <div class="party-row">
                <span class="party-field-label">代表者名 ：</span>
                <span class="party-field-value">${employer.name}</span>
              </div>
            </div>
          </div>
        ` : ''}
        
        ${employee ? `
          <div class="party-section">
            <div class="party-label">乙（労働者）</div>
            <div class="party-info">
              ${employee.address ? `<div class="party-row">
                <span class="party-field-label">住所 ：</span>
                <span class="party-field-value">${employee.address}</span>
              </div>` : ''}
              <div class="party-row">
                <span class="party-field-label">氏名 ：</span>
                <span class="party-field-value">${employee.name}</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  // 雇用条件テーブルの生成
  const generateEmploymentTable = () => {
    return `
      <table class="employment-table">
        <tr>
          <td class="label-cell">職種</td>
          <td class="value-cell">システムエンジニア</td>
        </tr>
        <tr>
          <td class="label-cell">雇用形態</td>
          <td class="value-cell">正社員</td>
        </tr>
        <tr>
          <td class="label-cell">契約開始日</td>
          <td class="value-cell">${formatDate(contract.createdAt)}</td>
        </tr>
        <tr>
          <td class="label-cell">勤務地</td>
          <td class="value-cell">東京都渋谷区サンプルビル</td>
        </tr>
        <tr>
          <td class="label-cell">基本給</td>
          <td class="value-cell">月額350,000円</td>
        </tr>
        <tr>
          <td class="label-cell">勤務時間</td>
          <td class="value-cell">9:00〜18:00（休憩1時間）</td>
        </tr>
        <tr>
          <td class="label-cell">休日</td>
          <td class="value-cell">土日祝日、年末年始</td>
        </tr>
      </table>
    `;
  };

  // 雇用契約条項の生成
  const generateEmploymentTerms = () => {
    return `
      <div class="employment-terms">
        <div class="term-item">
          <div class="term-title">第1条（職種及び業務内容）</div>
          <div class="term-content">
            <p>乙の職種は、システムエンジニアとし、甲の指示に従い、ソフトウェア開発及び関連業務に従事する。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第2条（勤務地）</div>
          <div class="term-content">
            <p>乙の勤務地は、東京都渋谷区サンプルビルとする。ただし、業務上の都合により、甲は乙に対し勤務地の変更を命じることができる。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第3条（給与）</div>
          <div class="term-content">
            <p>1. 乙の基本給は、月額350,000円とする。</p>
            <p>2. 給与の支払いは、毎月末日締め切り、翌月25日に銀行振込により行う。</p>
            <p>3. 給与からは、法定控除額及び労使協定に基づく控除額を差し引く。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第4条（勤務時間及び休憩）</div>
          <div class="term-content">
            <p>1. 所定労働時間は、午前9時から午後6時までとし、休憩時間は午後12時から午後1時までの1時間とする。</p>
            <p>2. 業務上の必要により、乙に時間外労働を命じることがある。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第5条（休日）</div>
          <div class="term-content">
            <p>1. 休日は、土曜日、日曜日、国民の祝日、年末年始（12月29日〜1月3日）とする。</p>
            <p>2. 業務上の必要により、乙に休日労働を命じることがある。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第6条（有給休暇）</div>
          <div class="term-content">
            <p>乙の有給休暇については、労働基準法その他関係法令の定めるところによる。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第7条（服務規律）</div>
          <div class="term-content">
            <p>乙は、就業規則を遵守し、甲の指示に従い、誠実に職務を遂行しなければならない。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第8条（秘密保持）</div>
          <div class="term-content">
            <p>乙は、在職中及び退職後においても、職務上知り得た甲の機密を第三者に漏洩してはならない。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第9条（契約期間）</div>
          <div class="term-content">
            <p>本契約は期間の定めのない雇用契約とする。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第10条（その他）</div>
          <div class="term-content">
            <p>本契約に定めのない事項については、労働基準法その他関係法令及び甲の就業規則の定めるところによる。</p>
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
      <div class="employment-container">
        <!-- ヘッダー -->
        <div class="header">
          <h1>${contract.title}</h1>
          <div class="employment-intro">
            ${contract.parties.find(p => p.type === 'contractor')?.name || '株式会社サンプル'}（以下「甲」という。）と${contract.parties.find(p => p.type === 'client')?.name || '労働者'}（以下「乙」という。）は、次の通り雇用契約を締結する。
          </div>
        </div>

        <!-- 当事者情報 -->
        ${generatePartiesInfo()}

        <!-- 雇用条件テーブル -->
        ${generateEmploymentTable()}

        <!-- 雇用契約条項 -->
        ${generateEmploymentTerms()}

        <!-- フッター -->
        <div class="footer">
          <div class="footer-id">
            Contract System ID: ${contract.contractId}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}