import { Contract } from '@/types/contract';
import { formatDate } from '../utils/helpers';

export function generateNDAHTML(contract: Contract): string {
  // 契約大臣スタイルの秘密保持契約書
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
        margin: 15mm;
      }
      
      body {
        font-family: 'Noto Sans JP', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
        font-size: 10.5pt;
        line-height: 1.7;
        color: #000;
        background: white;
        padding: 15px;
      }
      
      .nda-container {
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
      
      .nda-intro {
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
      
      .term-content ol {
        padding-left: 30px;
        margin: 8px 0;
      }
      
      .term-content ol li {
        margin-bottom: 5px;
      }
      
      .sub-items {
        padding-left: 20px;
        margin: 5px 0;
      }
      
      .sub-items p {
        margin-bottom: 3px;
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
      
      .footer-signature {
        margin-top: 50px;
        text-align: left;
        font-size: 10pt;
        line-height: 1.8;
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
        .nda-container {
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
          <td class="label-cell">締結日</td>
          <td class="value-cell">${formatDate(contract.createdAt)}</td>
        </tr>
        <tr>
          <td class="label-cell">特記事項</td>
          <td class="value-cell">${contract.description || '特になし'}</td>
        </tr>
      </table>
    `;
  };

  // NDA契約条項の生成
  const generateNDATerms = () => {
    return `
      <div class="contract-terms">
        <div class="term-item">
          <div class="term-title">第１条（目的）</div>
          <div class="term-content">
            <p>甲は乙に対し、秘密情報を提供し、乙は、かかる秘密情報の機密性を保持し、甲及び乙の現行または将来の取引関係の良好な構築を目的とする。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第２条（秘密情報の定義）</div>
          <div class="term-content">
            <p>1. 本契約において秘密情報とは、直接・間接的であるかを問わず、本目的のために開示される情報をいう。なお、情報開示の方法は、書面、口頭その他方法を問わず、甲から乙に開示された、開示者の営業上、技術上その他業務上の一切の情報をいい（以下、例示情報を示すがこれに限られるものではない）、本契約書発行後に限らず、本契約日以前に提供された情報も含む。</p>
            <div class="sub-items">
              <p>(1) 甲の事業に関わる、ソフトウェア、サービス、知的財産権、技術、サンプル、レポート、その他資料、顧客（潜在顧客も含む）、事業計画、サプライヤー、販促活動、金融情報</p>
              <p>(2) (1)の外、秘密であると分類されたもの、あるいは秘密であると受領者が認識しているもの、または秘密であると合理的に推認されるもの</p>
              <p>(3) 乙の認識する第三者に属する情報、または甲が守秘義務を負っていると合理的に推認されるもの</p>
            </div>
            <p>2. 前項の規定にかかわらず、次の各号の一に該当するものは秘密情報に該当しない。</p>
            <div class="sub-items">
              <p>(1) 甲から開示される以前に公知であったもの</p>
              <p>(2) 甲から開示された後に、自らの責めによらず、公知となったもの</p>
              <p>(3) 甲から開示される以前から自ら保有していたことを書面によって証明できるもの</p>
              <p>(4) 正当な権限を有する第三者から秘密保持義務を負わずに知得したもの</p>
              <p>(5) 甲から開示された秘密情報によることなく、独自に開発したことを書面によって証明できるもの</p>
            </div>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第３条（目的外使用の禁止）</div>
          <div class="term-content">
            <p>乙は、甲から提供された秘密情報を第１条で規定する目的以外に使用してはならない。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第４条（管理義務）</div>
          <div class="term-content">
            <p>1. 乙は、甲から開示された秘密情報を厳重に保管・管理するものとする。</p>
            <p>2. 乙は、事前に甲から書面による承諾を得た場合を除き、秘密情報を第三者に開示又は漏洩しない。ただし、裁判所からの命令、その他法令に基づき開示が義務付けられる場合はこの限りでない。</p>
            <p>3. 乙は、前項但し書きに基づき、秘密情報を第三者に開示する場合は、事前に甲に通知するものとする。</p>
            <p>4. 甲は、秘密情報の管理状況について、乙の社屋等に立入調査を行うことができるものとする。ただし、甲が乙の社屋等に立入調査を行う場合には、乙の事業運営に配慮をはかるものとする。</p>
          </div>
        </div>

        <div class="page-break"></div>

        <div class="term-item">
          <div class="term-title">第５条（複製）</div>
          <div class="term-content">
            <p>乙は、事前に甲から書面による承諾を得た場合を除き、秘密情報を複製しない。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第６条（開示の範囲）</div>
          <div class="term-content">
            <p>乙は、甲から開示された秘密情報を、自己の役員又は従業員に開示する場合には、秘密情報を知る必要がある者に限り、その必要な範囲内でのみ開示するものとする。なお、この場合乙は、当該役員又は従業員に対して本契約による自己と同等の義務を遵守させるものとし、かつ、当該役員又は従業員の行為について全責任を負う。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第７条（秘密情報の帰属）</div>
          <div class="term-content">
            <p>全ての秘密情報に関しては甲に独占的に帰属するものである。甲による秘密情報の開示は、乙に対して明示的にも黙示的にも、特許権、商標権、著作権、トレードシークレット、その他のいかなる知的財産権も譲渡されるものではなく、また、使用許諾その他いかなる権限も与えられるものではない。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第８条（秘密情報の返還）</div>
          <div class="term-content">
            <p>乙は、甲からの書面による要請があった場合、甲の指示に従い、速やかに秘密情報を記載・記録した全ての有体媒体（あらゆる形態のものを含み、また秘密情報の要約、複製及び抜粋等を含むがこれらに限らない。）を返却又は破棄するものとする。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第９条（損害賠償義務）</div>
          <div class="term-content">
            <p>乙は、本契約に違反して、甲に損害を与えた場合には、甲に対し、損害（甲の弁護士費用を含む。）の賠償をしなければならない。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第１０条（有効期限）</div>
          <div class="term-content">
            <p>本契約の有効期限は、解約を申し出た日の翌月末日までとする。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第１１条（競業禁止等）</div>
          <div class="term-content">
            <p>本契約の有効期間中及び本契約の終了後1年間、乙は、本契約に基づき甲を通じて行うものを除き、直接又は間接を問わず、下記の事項を行わないものとする。</p>
            <div class="sub-items">
              <p>(1) 甲の従業員の勧誘行為</p>
              <p>(2) 日本国内で甲と同一ないし類似の事業</p>
              <p>(3) 甲の顧客又は顧客であった者に対する営業活動</p>
              <p>(4) 甲及びその製品、サービス、役員、スタッフに対する誹謗中傷</p>
              <p>(5) 甲から提供を受けた情報を用いた甲と同一ないし類似の事業へのサービス提供</p>
            </div>
          </div>
        </div>

        <div class="page-break"></div>

        <div class="term-item">
          <div class="term-title">第１２条（雑則）</div>
          <div class="term-content">
            <p>本契約は、ここに規定する当事者間において協議された事項に関する完全な合意を構成し、当事者間の相互の書面による合意によらない限り、修正、改訂、又は放棄されない。</p>
            <p>乙は甲の書面による合意なしに、本契約を譲渡しないものとする。本契約のある条項が、適用される法令に基づいて無効とされる場合であっても、本契約の他の条項には何ら影響のないものとし、本契約は当該無効とされた条項を除き効力を生ずるものとする。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第１３条（合意管轄）</div>
          <div class="term-content">
            <p>本契約に関し、甲乙間に紛争が生じた場合は、甲又は乙の本店所在地を管轄する地方（簡易）裁判所を第一審の専属的合意管轄裁判所とする。</p>
          </div>
        </div>

        <div class="term-item">
          <div class="term-title">第１４条（協議）</div>
          <div class="term-content">
            <p>本契約に定めのない事項又は本契約に関して疑義が生じた場合は、甲乙誠意を持って協議し、その解決にあたるものとする。</p>
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
      <title>秘密保持契約書 - ${contract.contractId}</title>
      ${styles}
    </head>
    <body>
      <div class="nda-container">
        <!-- ヘッダー -->
        <div class="header">
          <h1>秘密保持契約書</h1>
          <div class="nda-intro">
            各当事者は、甲乙間において取引を行う又は取引を検討する目的（以下、「本件目的」という。）として、甲又は乙が相手方に開示する秘密情報の取扱いについて、以下のとおりの秘密保持契約（以下「本契約」という。）を締結する。
          </div>
        </div>

        <!-- 当事者情報 -->
        ${generatePartiesInfo()}

        <!-- 契約内容テーブル -->
        ${generateContractTable()}

        <!-- 契約条項 -->
        ${generateNDATerms()}

        <!-- フッター署名 -->
        <div class="footer-signature">
          <p>以上のとおり契約が成立したので、その成立を証するため本契約書の電磁的記録を作成し、双方の合意後電子署名を施し、各自その電磁的記録を保管する。</p>
        </div>

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