import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Contract } from '@/types/contract';
import { config } from '@/lib/config/env';
import { demoContracts } from '@/lib/db/demo-data';

export async function POST(request: NextRequest) {
  try {
    // Demo mode - return demo contracts info
    if (config.isDemo) {
      return NextResponse.json({
        success: true,
        message: 'デモデータを作成しました！契約書一覧を確認してください。',
        insertedCount: 2,
        contractIds: ['CNT-202401-DEMO1', 'CNT-202401-DEMO2'],
        isDemo: true,
      });
    }

    const { db } = await connectToDatabase();

    // Check if demo data already exists
    const existingContracts = await db.collection('contracts').countDocuments();
    if (existingContracts > 0) {
      return NextResponse.json({
        success: true,
        message: '既にデータが存在します',
        existingCount: existingContracts,
      });
    }

    // Create demo contracts
    const demoContracts: Contract[] = [
      {
        contractId: 'DEMO-001',
        title: '業務委託契約書',
        description: 'システム開発に関する業務委託契約',
        content: `第1条（目的）
この契約は、甲と乙の間における業務委託について定めるものである。

第2条（業務内容）
乙は甲に対し、以下の業務を提供するものとする：
1. システム開発業務
2. 保守・運用業務
3. その他甲が指定する業務

第3条（契約期間）
この契約の有効期間は、2024年1月1日から2024年12月31日までとする。

第4条（報酬）
甲は乙に対し、月額500,000円の報酬を支払うものとする。

第5条（守秘義務）
両当事者は、本契約に関連して知り得た相手方の機密情報を第三者に開示してはならない。`,
        parties: [
          {
            id: 'party-1',
            type: 'contractor',
            name: '田中太郎',
            email: 'tanaka@example.com',
            company: '株式会社EFFECT',
            role: '代表取締役',
            signatureRequired: true,
            signedAt: new Date('2024-01-15T10:00:00Z'),
          },
          {
            id: 'party-2',
            type: 'client',
            name: '佐藤花子',
            email: 'sato@client.com',
            company: 'クライアント株式会社',
            role: '技術部長',
            signatureRequired: true,
            signedAt: new Date('2024-01-15T11:30:00Z'),
          },
        ],
        status: 'completed',
        type: 'service_agreement',
        signatures: [
          {
            partyId: 'party-1',
            signedAt: new Date('2024-01-15T10:00:00Z'),
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0',
            verificationHash: 'demo-hash-1',
            certificateId: 'cert-demo-1',
          },
          {
            partyId: 'party-2',
            signedAt: new Date('2024-01-15T11:30:00Z'),
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0',
            verificationHash: 'demo-hash-2',
            certificateId: 'cert-demo-2',
          },
        ],
        attachments: [],
        retentionPeriod: 7,
        searchableFields: [],
        auditLog: [],
        createdBy: 'demo-user',
        createdAt: new Date('2024-01-15T09:00:00Z'),
        updatedAt: new Date('2024-01-15T11:30:00Z'),
        completedAt: new Date('2024-01-15T11:30:00Z'),
      },
      {
        contractId: 'DEMO-002',
        title: '秘密保持契約書',
        description: '機密情報の保護に関する契約',
        content: `第1条（目的）
本契約は、両当事者間で開示される機密情報の保護について定めるものである。

第2条（機密情報の定義）
機密情報とは、技術情報、営業情報、顧客情報その他一切の情報をいう。

第3条（守秘義務）
受領者は、機密情報を第三者に開示してはならない。

第4条（契約期間）
本契約の有効期間は、2024年2月1日から2027年1月31日までとする。`,
        parties: [
          {
            id: 'party-3',
            type: 'contractor',
            name: '田中太郎',
            email: 'tanaka@example.com',
            company: '株式会社EFFECT',
            role: '代表取締役',
            signatureRequired: true,
          },
          {
            id: 'party-4',
            type: 'client',
            name: '山田次郎',
            email: 'yamada@partner.com',
            company: 'パートナー企業',
            role: '営業部長',
            signatureRequired: true,
          },
        ],
        status: 'pending_signature',
        type: 'nda',
        signatures: [],
        attachments: [],
        retentionPeriod: 10,
        searchableFields: [],
        auditLog: [],
        createdBy: 'demo-user',
        createdAt: new Date('2024-02-01T09:00:00Z'),
        updatedAt: new Date('2024-02-01T09:00:00Z'),
      },
      {
        contractId: 'DEMO-003',
        title: 'ソフトウェアライセンス契約書',
        description: 'ソフトウェアの使用許諾に関する契約',
        content: `第1条（目的）
本契約は、ソフトウェアの使用許諾について定めるものである。

第2条（使用許諾）
ライセンサーは、ライセンシーに対し、本ソフトウェアの使用を許諾する。

第3条（制限事項）
ライセンシーは、本ソフトウェアを複製、改変してはならない。

第4条（サポート）
ライセンサーは、1年間のサポートを提供する。`,
        parties: [
          {
            id: 'party-5',
            type: 'contractor',
            name: '田中太郎',
            email: 'tanaka@example.com',
            company: '株式会社EFFECT',
            role: '代表取締役',
            signatureRequired: true,
            signedAt: new Date('2024-03-01T14:00:00Z'),
          },
          {
            id: 'party-6',
            type: 'client',
            name: '鈴木一郎',
            email: 'suzuki@customer.com',
            company: '顧客システム株式会社',
            role: 'CTO',
            signatureRequired: true,
            signedAt: new Date('2024-03-01T15:30:00Z'),
          },
        ],
        status: 'completed',
        type: 'sales',
        signatures: [
          {
            partyId: 'party-5',
            signedAt: new Date('2024-03-01T14:00:00Z'),
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0',
            verificationHash: 'demo-hash-3',
            certificateId: 'cert-demo-3',
          },
          {
            partyId: 'party-6',
            signedAt: new Date('2024-03-01T15:30:00Z'),
            ipAddress: '192.168.1.103',
            userAgent: 'Mozilla/5.0',
            verificationHash: 'demo-hash-4',
            certificateId: 'cert-demo-4',
          },
        ],
        attachments: [],
        retentionPeriod: 5,
        searchableFields: [],
        auditLog: [],
        createdBy: 'demo-user',
        createdAt: new Date('2024-03-01T13:00:00Z'),
        updatedAt: new Date('2024-03-01T15:30:00Z'),
        completedAt: new Date('2024-03-01T15:30:00Z'),
      },
    ];

    // Insert demo contracts
    const result = await db.collection('contracts').insertMany(demoContracts as any);

    return NextResponse.json({
      success: true,
      message: 'デモデータを作成しました',
      insertedCount: result.insertedCount,
      contractIds: demoContracts.map(c => c.contractId),
    });
  } catch (error) {
    console.error('Demo data creation error:', error);
    return NextResponse.json(
      { error: 'デモデータの作成に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Demo mode
    if (config.isDemo) {
      return NextResponse.json({
        success: true,
        message: 'デモデータを削除しました（デモモード）',
        deletedContracts: 2,
        deletedCertificates: 0,
        isDemo: true,
      });
    }

    const { db } = await connectToDatabase();

    // Delete all demo contracts
    const contractResult = await db.collection('contracts').deleteMany({
      contractId: { $regex: /^DEMO-/ }
    });

    // Delete demo certificates
    const certificateResult = await db.collection('certificates').deleteMany({
      contractId: { $regex: /^DEMO-/ }
    });

    return NextResponse.json({
      success: true,
      message: 'デモデータを削除しました',
      deletedContracts: contractResult.deletedCount,
      deletedCertificates: certificateResult.deletedCount,
    });
  } catch (error) {
    console.error('Demo data deletion error:', error);
    return NextResponse.json(
      { error: 'デモデータの削除に失敗しました' },
      { status: 500 }
    );
  }
}