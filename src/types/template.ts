export interface ContractTemplate {
  _id?: string;
  templateId: string;
  name: string;
  description?: string;
  category: string;
  content: {
    title: string;
    clauses: TemplateClause[];
    defaultValues?: {
      [key: string]: any;
    };
  };
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags?: string[];
}

export interface TemplateClause {
  id: string;
  title: string;
  content: string;
  isRequired: boolean;
  order: number;
  variables?: string[]; // Variable IDs used in this clause
}

export interface TemplateVariable {
  id: string;
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select type
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}