// Demo mode mock data
import { Contract } from '@/types/contract';

export const demoContracts: Contract[] = [
  {
    _id: 'demo-1',
    contractId: 'CNT-202401-DEMO1',
    title: 'サンプル業務委託契約書',
    description: 'デモ用の業務委託契約書です',
    content: `業務委託契約書

甲（委託者）：株式会社サンプル
乙（受託者）：デモユーザー

第1条（業務内容）
甲は乙に対し、以下の業務を委託し、乙はこれを受託する。
・ウェブサイトの開発業務
・システムの保守管理業務

第2条（契約期間）
本契約の有効期間は、2024年1月1日から2024年12月31日までとする。

第3条（報酬）
甲は乙に対し、本業務の対価として月額500,000円を支払う。

以上、本契約の成立を証するため、本書2通を作成し、甲乙記名押印の上、各1通を保有する。`,
    parties: [
      {
        id: '1',
        type: 'contractor',
        name: '株式会社サンプル',
        email: 'contract@sample.com',
        company: '株式会社サンプル',
        role: '甲（委託者）',
        signatureRequired: true,
        signedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        type: 'client',
        name: 'デモユーザー',
        email: 'demo@example.com',
        company: 'デモ会社',
        role: '乙（受託者）',
        signatureRequired: true,
      },
    ],
    status: 'pending_signature',
    type: 'service_agreement',
    signatures: [],
    attachments: [],
    retentionPeriod: 7,
    searchableFields: [],
    auditLog: [],
    tags: ['業務委託', 'ウェブ開発', '長期契約'],
    priority: 'high',
    category: 'IT・システム',
    createdBy: 'demo-user',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    _id: 'demo-2',
    contractId: 'CNT-202401-DEMO2',
    title: 'サンプル秘密保持契約書',
    description: 'デモ用のNDA契約書です',
    content: `秘密保持契約書

甲：株式会社サンプル
乙：デモパートナー

第1条（秘密情報の定義）
本契約において「秘密情報」とは、甲乙間で開示される一切の情報をいう。

第2条（守秘義務）
甲及び乙は、相手方から開示された秘密情報を厳重に管理し、第三者に開示又は漏洩してはならない。

第3条（守秘義務期間）
本契約に基づく守秘義務は、本契約終了後も3年間継続する。`,
    parties: [
      {
        id: '1',
        type: 'contractor',
        name: '株式会社サンプル',
        email: 'contract@sample.com',
        company: '株式会社サンプル',
        role: '甲',
        signatureRequired: true,
        signedAt: new Date('2024-01-05'),
      },
      {
        id: '2',
        type: 'client',
        name: 'デモパートナー',
        email: 'partner@example.com',
        company: 'パートナー会社',
        role: '乙',
        signatureRequired: true,
        signedAt: new Date('2024-01-06'),
      },
    ],
    status: 'completed',
    type: 'nda',
    signatures: [
      {
        partyId: '1',
        signedAt: new Date('2024-01-05'),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        verificationHash: 'demo-hash-1',
        certificateId: 'CERT-DEMO1',
      },
      {
        partyId: '2',
        signedAt: new Date('2024-01-06'),
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0',
        verificationHash: 'demo-hash-2',
        certificateId: 'CERT-DEMO2',
      },
    ],
    attachments: [],
    retentionPeriod: 7,
    searchableFields: [],
    auditLog: [],
    tags: ['秘密保持', 'パートナー', '機密情報'],
    priority: 'medium',
    category: '法務・コンプライアンス',
    createdBy: 'demo-user',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-06'),
    completedAt: new Date('2024-01-06'),
    aiAnalysis: {
      summary: 'この秘密保持契約書は、両当事者間で交換される機密情報の保護を目的としています。守秘義務は契約終了後3年間継続します。',
      keyTerms: ['秘密情報の定義', '守秘義務', '守秘義務期間3年'],
      risks: [
        {
          level: 'low',
          description: '標準的なNDA条項で、特に問題となる点は見当たりません',
        },
      ],
      recommendations: [
        '例外事項（公知情報等）の条項を追加することを検討してください',
        '違反時の損害賠償条項の追加を推奨します',
      ],
      contractType: 'nda',
      analyzedAt: new Date('2024-01-05'),
    },
  },
  {
    _id: 'demo-3',
    contractId: 'CNT-202401-DEMO3',
    title: 'ABC商事との売買契約書',
    description: 'ABC商事との商品売買に関する契約',
    content: `売買契約書

甲（売主）：株式会社サンプル
乙（買主）：ABC商事株式会社

第1条（商品）
甲は乙に対し、以下の商品を販売する。
・商品名：サンプル製品A
・数量：1000個
・単価：5,000円

第2条（代金）
本契約における売買代金は、総額5,000,000円とする。

第3条（納期）
甲は2024年3月31日までに商品を納入する。`,
    parties: [
      {
        id: '1',
        type: 'contractor',
        name: '株式会社サンプル',
        email: 'contract@sample.com',
        company: '株式会社サンプル',
        role: '甲（売主）',
        signatureRequired: true,
      },
      {
        id: '2',
        type: 'client',
        name: 'ABC商事担当者',
        email: 'contact@abc-shoji.com',
        company: 'ABC商事株式会社',
        role: '乙（買主）',
        signatureRequired: true,
      },
    ],
    status: 'draft',
    type: 'sales',
    signatures: [],
    attachments: [],
    retentionPeriod: 7,
    searchableFields: [],
    auditLog: [],
    tags: ['売買', '商品取引', '製造業'],
    priority: 'high',
    category: '営業・販売',
    createdBy: 'demo-user',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    transactionAmount: 5000000,
    transactionDate: new Date('2024-03-31'),
  },
  {
    _id: 'demo-4',
    contractId: 'CNT-202401-DEMO4',
    title: 'XYZ技研との業務提携契約',
    description: 'XYZ技研との技術提携に関する契約',
    content: `業務提携契約書

甲：株式会社サンプル
乙：XYZ技研株式会社

第1条（目的）
甲乙は、相互の技術と知識を活用し、新製品の共同開発を行う。

第2条（提携期間）
本提携は2024年4月1日から2026年3月31日までの2年間とする。

第3条（共同開発）
甲乙は以下の分野で共同開発を行う。
・AI技術の応用
・IoTデバイスの開発`,
    parties: [
      {
        id: '1',
        type: 'contractor',
        name: '株式会社サンプル',
        email: 'contract@sample.com',
        company: '株式会社サンプル',
        role: '甲',
        signatureRequired: true,
      },
      {
        id: '2',
        type: 'client',
        name: 'XYZ技研担当者',
        email: 'info@xyz-giken.co.jp',
        company: 'XYZ技研株式会社',
        role: '乙',
        signatureRequired: true,
      },
    ],
    status: 'pending_review',
    type: 'partnership',
    signatures: [],
    attachments: [],
    retentionPeriod: 7,
    searchableFields: [],
    auditLog: [],
    tags: ['業務提携', '技術開発', 'AI・IoT'],
    priority: 'high',
    category: '技術開発',
    createdBy: 'demo-user',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    _id: 'demo-5',
    contractId: 'CNT-202401-DEMO5',
    title: 'デモ会社との雇用契約書',
    description: '新入社員の雇用契約',
    content: `雇用契約書

株式会社サンプル（以下「甲」という。）と田中太郎（以下「乙」という。）は、次の通り雇用契約を締結する。

甲（使用者）
会社名：株式会社サンプル
代表者名：株式会社サンプル

乙（労働者）
氏名：田中太郎

雇用条件：
職種：システムエンジニア
雇用形態：正社員
契約開始日：2024年01月20日
勤務地：東京都渋谷区サンプルビル
基本給：月額350,000円
勤務時間：9:00〜18:00（休憩1時間）
休日：土日祝日、年末年始

第1条（職種及び業務内容）
乙の職種は、システムエンジニアとし、甲の指示に従い、ソフトウェア開発及び関連業務に従事する。

第2条（勤務地）
乙の勤務地は、東京都渋谷区サンプルビルとする。ただし、業務上の都合により、甲は乙に対し勤務地の変更を命じることができる。

第3条（給与）
1. 乙の基本給は、月額350,000円とする。
2. 給与の支払いは、毎月末日締め切り、翌月25日に銀行振込により行う。
3. 給与からは、法定控除額及び労使協定に基づく控除額を差し引く。

第4条（勤務時間及び休憩）
1. 所定労働時間は、午前9時から午後6時までとし、休憩時間は午後12時から午後1時までの1時間とする。
2. 業務上の必要により、乙に時間外労働を命じることがある。

第5条（休日）
1. 休日は、土曜日、日曜日、国民の祝日、年末年始（12月29日〜1月3日）とする。
2. 業務上の必要により、乙に休日労働を命じることがある。

第6条（有給休暇）
乙の有給休暇については、労働基準法その他関係法令の定めるところによる。

第7条（服務規律）
乙は、就業規則を遵守し、甲の指示に従い、誠実に職務を遂行しなければならない。

第8条（秘密保持）
乙は、在職中及び退職後においても、職務上知り得た甲の機密を第三者に漏洩してはならない。

第9条（契約期間）
本契約は期間の定めのない雇用契約とする。

第10条（その他）
本契約に定めのない事項については、労働基準法その他関係法令及び甲の就業規則の定めるところによる。`,
    parties: [
      {
        id: '1',
        type: 'contractor',
        name: '株式会社サンプル',
        email: 'hr@sample.com',
        company: '株式会社サンプル',
        role: '甲（使用者）',
        signatureRequired: true,
        signedAt: new Date('2024-01-20'),
      },
      {
        id: '2',
        type: 'client',
        name: '田中太郎',
        email: 'tanaka@demo.com',
        company: 'デモ会社',
        role: '乙（労働者）',
        signatureRequired: true,
        signedAt: new Date('2024-01-20'),
      },
    ],
    status: 'completed',
    type: 'employment',
    signatures: [
      {
        partyId: '1',
        signedAt: new Date('2024-01-20'),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        verificationHash: 'demo-hash-3',
        certificateId: 'CERT-DEMO3',
      },
      {
        partyId: '2',
        signedAt: new Date('2024-01-20'),
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0',
        verificationHash: 'demo-hash-4',
        certificateId: 'CERT-DEMO4',
      },
    ],
    attachments: [],
    retentionPeriod: 7,
    searchableFields: [],
    auditLog: [],
    tags: ['雇用', '新入社員', 'エンジニア'],
    priority: 'medium',
    category: '人事・労務',
    createdBy: 'demo-user',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    completedAt: new Date('2024-01-20'),
  },
];