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
];