// 合规状态类型定义
export type ComplianceStatus = 'compliant' | 'expiring' | 'missing';

// 合规整改记录接口
export interface RemediationRecord {
  id: string;
  partId: string;
  partName: string;
  position: string;
  issueType: 'missing-cert' | 'expiring-cert' | 'supplier-issue';
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  suggestedFix?: string;
  assignedTo?: string;
  status: 'open' | 'in-progress' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// 合规报告接口
export interface ComplianceReport {
  id: string;
  title: string;
  period: string;
  overallComplianceRate: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  generatedAt: string;
  generatedBy: string;
}

// 合规差异记录接口
export interface ComplianceDiffRecord {
  id: string;
  partId: string;
  partName: string;
  position: string;
  sapValue: string;
  localValue: string;
  status: 'resolved' | 'pending' | 'ignored';
  diffType: string;
  detectedAt: string;
}

// 合规检查项接口
export interface ComplianceCheckItem {
  id: string;
  name: string;
  description: string;
  standardType: string;
  isRequired: boolean;
  enabled: boolean;
  lastUpdated: string;
}

// 合规汇总数据接口
export interface ComplianceSummary {
  totalParts: number;
  compliantParts: number;
  expiringParts: number;
  missingCertParts: number;
  complianceRate: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

// 合规搜索过滤器接口
export interface ComplianceFilter {
  status?: ComplianceStatus[];
  lifecycle?: string[];
  position?: string;
  partName?: string;
  supplier?: string;
  expiryDays?: number;
  severity?: ('Critical' | 'High' | 'Medium' | 'Low')[];
}