/**
 * 数据同步与差异对齐模块类型定义
 */

// 差异级别枚举
export enum AlignmentLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

// 差异状态枚举
export enum AlignmentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  INCONSISTENT = 'INCONSISTENT'
}

// 同步类型枚举
export enum SyncType {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL'
}

// 源系统枚举
export enum SourceSystem {
  SAP = 'SAP',
  PLM = 'PLM'
}

// 同步状态枚举
export enum SyncStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// 差异对齐记录接口
export interface AlignmentRecord {
  recordId: string;
  partId: string;
  sapValue: string | number;
  localValue: string | number;
  status: AlignmentStatus;
  alignmentLevel: AlignmentLevel;
  resolution?: string | number;
  createdTime: string;
  updatedTime: string;
  processedBy?: string;
  partDescription?: string;
  attributeName?: string;
  differenceAmount?: number;
}

// 同步操作参数接口
export interface SyncParams {
  syncType: SyncType;
  sourceSystem: SourceSystem;
  bomIds?: string[];
  includeAllBoms?: boolean;
}

// 同步日志接口
export interface SyncLog {
  syncId: string;
  syncType: SyncType;
  sourceSystem: SourceSystem;
  startTime: string;
  endTime?: string;
  status: SyncStatus;
  totalRecords: number;
  successCount: number;
  failedCount: number;
  diffCount: number;
  createdBy: string;
  errorMessage?: string;
}

// 同步状态接口
export interface SyncStatusData {
  syncId: string;
  status: SyncStatus;
  progress: number;
  totalRecords: number;
  processedRecords: number;
  currentOperation?: string;
  estimatedTimeRemaining?: number;
}

// 差异统计信息接口
export interface AlignmentStatistics {
  totalRecords: number;
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  inconsistentCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  lastSyncTime?: string;
  syncSuccessRate?: number;
}

// 分页响应接口
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 差异过滤参数接口
export interface AlignmentFilters {
  partId?: string;
  status?: AlignmentStatus;
  alignmentLevel?: AlignmentLevel;
  startDate?: string;
  endDate?: string;
  attributeName?: string;
  page?: number;
  pageSize?: number;
}

// 同步日志过滤参数接口
export interface SyncLogFilters {
  syncType?: SyncType;
  syncStatus?: SyncStatus;
  sourceSystem?: SourceSystem;
  startDate?: string;
  endDate?: string;
  createdBy?: string;
  page?: number;
  pageSize?: number;
}

// 导出参数接口
export interface ExportParams {
  format: 'EXCEL' | 'CSV';
  filters: Record<string, any>;
}

// 差异详情接口（用于显示差异详情弹窗）
export interface AlignmentDetail extends AlignmentRecord {
  partName?: string;
  sapDescription?: string;
  localDescription?: string;
  recommendation?: string;
  affectedBoms?: { bomId: string; bomName: string }[];
  history?: {
    timestamp: string;
    operation: string;
    performedBy: string;
    details: string;
  }[];
}

// 批量对齐参数接口
export interface BatchAlignmentParams {
  alignmentIds: string[];
  resolutionStrategy?: 'USE_SAP' | 'USE_LOCAL' | 'MANUAL';
  manualResolution?: any;
}

// BOM同步状态接口
export interface BomSyncStatus {
  bomId: string;
  bomName: string;
  lastSyncTime?: string;
  syncStatus: SyncStatus;
  diffCount: number;
  criticalDiffCount: number;
  highDiffCount: number;
  isHealthy: boolean;
}