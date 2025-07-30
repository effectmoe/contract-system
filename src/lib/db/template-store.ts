import { ContractTemplate } from '@/types/template';

// In-memory storage for demo mode
export let demoTemplates: ContractTemplate[] = [];

// Sample templates
export const sampleTemplates: ContractTemplate[] = [
  {
    templateId: 'nda-template',
    name: '秘密保持契約書（NDA）',
    description: '標準的な秘密保持契約書のテンプレート',
    category: 'NDA',
    content: {
      title: '秘密保持契約書',
      clauses: [
        {
          id: 'clause-1',
          title: '目的',
          content: '本契約は、{{disclosingParty}}（以下「開示者」という）が{{receivingParty}}（以下「受領者」という）に対して開示する秘密情報の取り扱いについて定めることを目的とする。',
          isRequired: true,
          order: 1,
          variables: ['disclosingParty', 'receivingParty']
        },
        {
          id: 'clause-2',
          title: '秘密情報の定義',
          content: '本契約において「秘密情報」とは、開示者が受領者に対して、秘密である旨を明示して開示する情報をいう。',
          isRequired: true,
          order: 2
        },
        {
          id: 'clause-3',
          title: '秘密保持期間',
          content: '受領者は、本契約締結日から{{confidentialityPeriod}}年間、秘密情報を秘密として保持する。',
          isRequired: true,
          order: 3,
          variables: ['confidentialityPeriod']
        }
      ]
    },
    variables: [
      {
        id: 'disclosingParty',
        name: 'disclosingParty',
        displayName: '開示者',
        type: 'text',
        required: true
      },
      {
        id: 'receivingParty',
        name: 'receivingParty',
        displayName: '受領者',
        type: 'text',
        required: true
      },
      {
        id: 'confidentialityPeriod',
        name: 'confidentialityPeriod',
        displayName: '秘密保持期間（年）',
        type: 'number',
        required: true,
        defaultValue: 3,
        validation: {
          min: 1,
          max: 10
        }
      }
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['秘密保持', 'NDA', '標準']
  },
  {
    templateId: 'service-agreement-template',
    name: '業務委託契約書',
    description: '標準的な業務委託契約書のテンプレート',
    category: '業務委託',
    content: {
      title: '業務委託契約書',
      clauses: [
        {
          id: 'clause-1',
          title: '委託業務',
          content: '{{client}}（以下「委託者」という）は、{{contractor}}（以下「受託者」という）に対し、次の業務を委託し、受託者はこれを受託する。\n業務内容：{{serviceDescription}}',
          isRequired: true,
          order: 1,
          variables: ['client', 'contractor', 'serviceDescription']
        },
        {
          id: 'clause-2',
          title: '委託料',
          content: '委託者は受託者に対し、委託料として{{amount}}円（消費税別）を支払う。',
          isRequired: true,
          order: 2,
          variables: ['amount']
        },
        {
          id: 'clause-3',
          title: '契約期間',
          content: '本契約の有効期間は、{{startDate}}から{{endDate}}までとする。',
          isRequired: true,
          order: 3,
          variables: ['startDate', 'endDate']
        }
      ]
    },
    variables: [
      {
        id: 'client',
        name: 'client',
        displayName: '委託者',
        type: 'text',
        required: true
      },
      {
        id: 'contractor',
        name: 'contractor',
        displayName: '受託者',
        type: 'text',
        required: true
      },
      {
        id: 'serviceDescription',
        name: 'serviceDescription',
        displayName: '業務内容',
        type: 'text',
        required: true
      },
      {
        id: 'amount',
        name: 'amount',
        displayName: '委託料（円）',
        type: 'number',
        required: true
      },
      {
        id: 'startDate',
        name: 'startDate',
        displayName: '開始日',
        type: 'date',
        required: true
      },
      {
        id: 'endDate',
        name: 'endDate',
        displayName: '終了日',
        type: 'date',
        required: true
      }
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: ['業務委託', '標準']
  }
];