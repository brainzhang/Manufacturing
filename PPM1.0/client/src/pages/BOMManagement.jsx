import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Eye, Edit, RefreshCw, Link, CheckCircle, AlertCircle, XCircle, Download, Upload, Rocket, Copy, CloudUpload, X } from 'lucide-react';
import { fetchBOMs, createBOM, updateBOM, performAlignment, importBOMs } from '../services/bomService';
import * as XLSX from 'xlsx';

// Utility functions - all functions handle undefined/null values
const costFmt = (v) => {
  if (v === undefined || v === null || v === '' || isNaN(Number(v))) return '¥0.00';
  try {
    const num = Number(v);
    if (isNaN(num)) return '¥0.00';
    return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
  } catch (e) {
    console.error('Cost formatting error:', e, 'Value:', v);
    return '¥0.00';
  }
};

const dateFmt = (d) => {
  if (!d) return '';
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return '';
  }
};

const badgeMap = {
  DRAFT: {color: 'blue', text: '草稿'},
  PENDING_APPROVAL: {color: 'orange', text: '待审'},
  APPROVED: {color: 'green', text: '已批准'},
  SYNCED: {color: 'purple', text: '已同步'},
  REJECTED: {color: 'red', text: '已驳回'},
  OBSOLETED: {color: 'default', text: '已作废'},
  // 审批状态
  '已批准': {color: 'green', text: '已批准'},
  '审批中': {color: 'orange', text: '审批中'},
  '已驳回': {color: 'red', text: '已驳回'},
  // 状态值
  '激活': {color: 'green', text: '激活'},
  '未激活': {color: 'orange', text: '未激活'},
  '已作废': {color: 'default', text: '已作废'},
  // 兼容英文状态值
  '草稿': {color: 'blue', text: '草稿'},
  '待审': {color: 'orange', text: '待审'},
  '已同步': {color: 'purple', text: '已同步'}
};

const syncIconMap = {
  SYNCED: {icon: <CheckCircle size={16} />, color: 'green', text: '已同步'},
  PENDING_SYNC: {icon: <RefreshCw size={16} />, color: 'orange', text: '待同步'},
  CONFLICT: {icon: <AlertCircle size={16} />, color: 'gold', text: '冲突'},
  SYNC_FAILED: {icon: <XCircle size={16} />, color: 'red', text: '同步失败'},
  // 兼容英文同步状态值
  '已同步': {icon: <CheckCircle size={16} />, color: 'green', text: '已同步'},
  '待同步': {icon: <RefreshCw size={16} />, color: 'orange', text: '待同步'},
  '冲突': {icon: <AlertCircle size={16} />, color: 'gold', text: '冲突'},
  '同步失败': {icon: <XCircle size={16} />, color: 'red', text: '同步失败'}
};

const levelColorMap = {
  NONE: {color: 'green', text: '无'},
  LOW: {color: 'blue', text: '低'},
  MEDIUM: {color: 'yellow', text: '中'},
  HIGH: {color: 'orange', text: '高'},
  CRITICAL: {color: 'red', text: '严重'},
  // 兼容英文对齐级别值
  'NONE_EN': {color: 'green', text: '无'},
  'LOW_EN': {color: 'blue', text: '低'},
  'MEDIUM_EN': {color: 'yellow', text: '中'},
  'HIGH_EN': {color: 'orange', text: '高'},
  'CRITICAL_EN': {color: 'red', text: '严重'}
};

const levelColor = (lv) => {
  if (!lv) return 'gray';
  const map = { NONE: 'green', LOW: 'blue', MEDIUM: 'yellow', HIGH: 'orange', CRITICAL: 'red' };
  return map[lv] || 'gray';
};

  // Load/save preferences from localStorage
const getPreferences = () => {
  try {
    const saved = localStorage.getItem('bom-list-preferences');
    if (!saved) return {
      sortField: 'lastModified',
      sortOrder: 'desc',
      pageSize: 25,
      hiddenColumns: [],
      filters: {}
    };
    const parsed = JSON.parse(saved);
    return {
      sortField: parsed.sortField || 'lastModified',
      sortOrder: parsed.sortOrder || 'desc',
      pageSize: parsed.pageSize || 25,
      hiddenColumns: Array.isArray(parsed.hiddenColumns) ? parsed.hiddenColumns : [],
      filters: parsed.filters || {}
    };
  } catch (e) {
    return {
      sortField: 'lastModified',
      sortOrder: 'desc',
      pageSize: 25,
      hiddenColumns: [],
      filters: {}
    };
  }
};

// 辅助函数：格式化显示多个值的字段
const formatMultiValue = (values) => {
  if (!values || !Array.isArray(values)) return values || '';
  if (values.length === 0) return '';
  if (values.length === 1) return values[0];
  
  // 对于长列表，只显示前2个并用"..."表示更多
  if (values.length > 3) {
    return `${values.slice(0, 2).join('; ')}... (${values.length})`;
  }
  return values.join('; ');
};

const savePreferences = (prefs) => {
  try {
    localStorage.setItem('bom-list-preferences', JSON.stringify(prefs));
  } catch (e) {
    console.warn('Unable to save preferences:', e);
  }
};

// Validation function for BOM data
const validateBOMData = (data) => {
  if (!data || data.length < 2) {
    return { isValid: false, errorMessage: '文件为空或没有数据行' };
  }
  
  // Expected headers (case-insensitive)
  const expectedHeaders = ['BOM名称', '产品型号', '产品序列号', 'BOM版本', 
                         '层级', '物料数', '差异', '对齐', 
                         '状态', '总成本', '同步状态', '修改时间', '修改人', 'SAP BOM ID'];
  
  // Get the actual headers from the first row
  const actualHeaders = data[0].map(header => String(header || '').trim());
  
  // Check if required headers exist (allowing case differences)
  const requiredHeaders = ['BOM名称', '产品型号', '状态'];
  const missingHeaders = [];
  
  requiredHeaders.forEach(requiredHeader => {
    const found = actualHeaders.some(actualHeader => 
      actualHeader.toLowerCase() === requiredHeader.toLowerCase()
    );
    if (!found) {
      missingHeaders.push(requiredHeader);
    }
  });
  
  if (missingHeaders.length > 0) {
    return { 
      isValid: false, 
      errorMessage: `缺少必需列: ${missingHeaders.join(', ')}` 
    };
  }
  
  // Validate data rows
  let errorMessages = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Skip empty rows
    if (!row || row.every(cell => cell === '' || cell === null || cell === undefined)) {
      continue;
    }
    
    // Check for required fields in each row
    const bomName = row[actualHeaders.findIndex(header => 
      header.toLowerCase() === 'bom名称'.toLowerCase()
    )];
    
    const productModel = row[actualHeaders.findIndex(header => 
      header.toLowerCase() === '产品型号'.toLowerCase()
    )];
    
    const status = row[actualHeaders.findIndex(header => 
      header.toLowerCase() === '状态'.toLowerCase()
    )];
    
    if (!bomName || String(bomName).trim() === '') {
      errorMessages.push(`第${i + 1}行: BOM名称是必需的`);
    }
    
    if (!productModel || String(productModel).trim() === '') {
      errorMessages.push(`第${i + 1}行: 产品型号是必需的`);
    }
    
    if (status) {
      const validStatuses = ['草稿', '待审', '已批准', '已驳回', '已作废', 'SYNCED', 'REJECTED', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'OBSOLETED', '已同步'];
      if (!validStatuses.includes(String(status))) {
        errorMessages.push(`第${i + 1}行: 无效状态"${status}". 有效值为: ${validStatuses.join(', ')}`);
      }
    }
    
    // Validate Total Cost if provided
    const costIndex = actualHeaders.findIndex(header => 
      header.toLowerCase() === '总成本'.toLowerCase()
    );
    if (costIndex >= 0 && row[costIndex] !== undefined && row[costIndex] !== null && row[costIndex] !== '') {
      const cost = parseFloat(row[costIndex]);
      if (isNaN(cost) || cost < 0) {
        errorMessages.push(`第${i + 1}行: 总成本必须是正数`);
      }
    }
  }
  
  if (errorMessages.length > 0) {
    return { 
      isValid: false, 
      errorMessage: errorMessages.slice(0, 5).join('; ') + (errorMessages.length > 5 ? '...' : '') 
    };
  }
  
  return { 
    isValid: true, 
    rowCount: data.length,
    actualHeaders: actualHeaders
  };
};

const BOMManagement = () => {
  const navigate = useNavigate();
  const [boms, setBOMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBOMs, setSelectedBOMs] = useState([]);
  const [preferences, setPreferences] = useState(getPreferences());
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // 每页显示20个item
  
  // RBAC state
  const [userRole, setUserRole] = useState('研发工程师'); // Default role
  
  // Handle role change with notification
  const handleRoleChange = (newRole) => {
    setUserRole(newRole);
    // Clear selected BOMs when role changes
    setSelectedBOMs([]);
  };
  
  // State for difference drawer
  const [showDifferenceDrawer, setShowDifferenceDrawer] = useState(false);
  const [selectedBOMForDifference, setSelectedBOMForDifference] = useState(null);
  
  // State for confirmation modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    action: '',
    message: '',
    requiresInput: false,
    inputLabel: '',
    inputPattern: '',
    inputValue: '',
    bomId: null
  });
  
  // State for operation feedback
  const [operationFeedback, setOperationFeedback] = useState({
    show: false,
    action: '',
    taskId: null,
    status: '', // 'pending', 'success', 'error'
    message: '',
    progress: 0
  });
  
  // Import functionality states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [importMode, setImportMode] = useState('merge');
  const [showImportOptions, setShowImportOptions] = useState(false);
  
  // State for BOM detail modal
  const [showBOMDetailModal, setShowBOMDetailModal] = useState(false);
  const [selectedBOMForDetail, setSelectedBOMForDetail] = useState(null);
  const [bomMaterialTree, setBomMaterialTree] = useState([]);

  // Responsive handling
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadBOMs();
  }, []);

  const loadBOMs = async () => {
    try {
      setLoading(true);
      
      // 先尝试从本地存储加载数据
      const savedBOMs = localStorage.getItem('bomData');
      if (savedBOMs) {
        setBOMs(JSON.parse(savedBOMs));
        setLoading(false);
        return;
      }
      
      // 如果没有本地数据，使用默认数据
      const data = [
        {
          id: 1,
          bomName: 'ThinkPad X1 Carbon BOM-Gen11',
          productModels: ['ThinkPad X1 Carbon-2023款', 'ThinkPad X1 Carbon Gen11'],
          productSerials: ['SN-TP-X1-2023-001', 'SN-TP-X1-2023-002', 'SN-TP-X1-2023-003'],
          bomVersion: 'V11.3',
          hierarchyDepth: 5,
          totalItems: 128,
          uniqueItems: 126,
          alternativeCount: 2,
          differencesCount: 2,
          alignmentLevel: 'MEDIUM',
          status: '激活',
          totalCost: 12999.00,
          approvalStatus: '已批准',
          syncStatus: 'SYNCED',
          lastModified: new Date().toISOString(),
          modifier: '张工程师',
          sapBomId: 'SAP-BOM-TP-X1-20230815'
        },
        {
          id: 2,
          bomName: 'ThinkPad T14 BOM-Gen3',
          productModels: ['ThinkPad T14-2023款', 'ThinkPad T14 Gen3'],
          productSerials: ['SN-TP-T14-2023-001', 'SN-TP-T14-2023-002', 'SN-TP-T14-2023-003'],
          bomVersion: 'V3.5',
          hierarchyDepth: 4,
          totalItems: 95,
          uniqueItems: 92,
          alternativeCount: 3,
          differencesCount: 1,
          alignmentLevel: 'LOW',
          status: '激活',
          totalCost: 8799.00,
          approvalStatus: '已批准',
          syncStatus: 'SYNCED',
          lastModified: new Date().toISOString(),
          modifier: '李工程师',
          sapBomId: 'SAP-BOM-TP-T14-20230822'
        },
        {
          id: 3,
          bomName: 'ThinkBook 16p BOM-Gen2',
          productModels: ['ThinkBook 16p-2023款', 'ThinkBook 16p Gen2'],
          productSerials: ['SN-TB-16p-2023-001', 'SN-TB-16p-2023-002'],
          bomVersion: 'V2.3',
          hierarchyDepth: 4,
          totalItems: 88,
          uniqueItems: 86,
          alternativeCount: 2,
          differencesCount: 0,
          alignmentLevel: 'NONE',
          status: '未激活',
          totalCost: 7499.00,
          approvalStatus: '已驳回',
          syncStatus: 'SYNCED',
          lastModified: new Date().toISOString(),
          modifier: '王工程师',
          sapBomId: 'SAP-BOM-TB-16p-20230830'
        },
        {
          id: 4,
          bomName: 'ThinkPad X1 Carbon BOM-Gen10',
          productModels: ['ThinkPad X1 Carbon-2022款', 'ThinkPad X1 Carbon Gen10'],
          productSerials: ['SN-TP-X1-2022-001', 'SN-TP-X1-2022-002'],
          bomVersion: 'V10.8',
          hierarchyDepth: 5,
          totalItems: 124,
          uniqueItems: 121,
          alternativeCount: 3,
          differencesCount: 0,
          alignmentLevel: 'NONE',
          status: '已作废',
          totalCost: 12800.00,
          approvalStatus: '已批准',
          syncStatus: 'PENDING_SYNC',
          lastModified: new Date().toISOString(),
          modifier: '赵工程师',
          sapBomId: 'SAP-BOM-TP-X1-20221105'
        },
        {
          id: 5,
          bomName: 'ThinkPad T14 BOM-Gen2',
          productModels: ['ThinkPad T14-2022款', 'ThinkPad T14 Gen2'],
          productSerials: ['SN-TP-T14-2022-001', 'SN-TP-T14-2022-002'],
          bomVersion: 'V2.9',
          hierarchyDepth: 4,
          totalItems: 92,
          uniqueItems: 89,
          alternativeCount: 3,
          differencesCount: 3,
          alignmentLevel: 'MEDIUM',
          status: '激活',
          totalCost: 8499.00,
          approvalStatus: '审批中',
          syncStatus: 'PENDING_SYNC',
          lastModified: new Date().toISOString(),
          modifier: '钱工程师',
          sapBomId: 'SAP-BOM-TP-T14-20221210'
        },
        {
          id: 6,
          bomName: 'ThinkBook 16p BOM-Gen1',
          productModels: ['ThinkBook 16p-2022款', 'ThinkBook 16p Gen1'],
          productSerials: ['SN-TB-16p-2022-001', 'SN-TB-16p-2022-002'],
          bomVersion: 'V1.8',
          hierarchyDepth: 4,
          totalItems: 84,
          uniqueItems: 82,
          alternativeCount: 2,
          differencesCount: 0,
          alignmentLevel: 'NONE',
          status: '草稿',
          totalCost: 7199.00,
          approvalStatus: '已驳回',
          syncStatus: 'SYNCED',
          lastModified: new Date().toISOString(),
          modifier: '孙工程师',
          sapBomId: 'SAP-BOM-TB-16p-20221122'
        },
        {
          id: 7,
          bomName: 'ThinkPad T14 BOM-Gen2',
          productModels: ['ThinkPad T14-2022款', 'ThinkPad T14 Gen2'],
          productSerials: ['SN-TP-T14-2022-003', 'SN-TP-T14-2022-004'],
          bomVersion: 'V2.7',
          hierarchyDepth: 4,
          totalItems: 91,
          uniqueItems: 89,
          alternativeCount: 2,
          differencesCount: 0,
          alignmentLevel: 'NONE',
          status: '草稿',
          totalCost: 8299.00,
          approvalStatus: '已批准',
          syncStatus: 'PENDING_SYNC',
          lastModified: new Date().toISOString(),
          modifier: '李工程师',
          sapBomId: 'SAP-BOM-TP-T14-20220718'
        }
      ];
      
      const bomArray = Array.isArray(data) ? data : [];
      setBOMs(bomArray);
    } catch (error) {
      console.error('Failed to load BOM list:', error);
      setBOMs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBOMs = useMemo(() => {
    let result = Array.isArray(boms) ? [...boms] : [];
    
    // Normalize BOM data
    result = result.map(bom => ({
      id: bom.id || '',
      bomName: bom.bomName || '',
      productModels: Array.isArray(bom.productModels) ? bom.productModels : 
                    (bom.productModel ? [bom.productModel] : []),
      productSerials: Array.isArray(bom.productSerials) ? bom.productSerials : 
                      (bom.productSerial ? [bom.productSerial] : []),
      bomVersion: bom.bomVersion || '',
      hierarchyDepth: bom.hierarchyDepth || 0,
      totalItems: bom.totalItems || 0,
      uniqueItems: bom.uniqueItems || 0,
      alternativeCount: bom.alternativeCount || 0,
      differencesCount: bom.differencesCount || 0,
      alignmentLevel: bom.alignmentLevel || 'NONE',
      status: bom.status || '草稿',
      totalCost: bom.totalCost || 0,
      approvalStatus: bom.approvalStatus || '已批准',
      syncStatus: bom.syncStatus || 'PENDING_SYNC',
      lastModified: bom.lastModified || '',
      modifier: bom.modifier || '',
      sapBomId: bom.sapBomId || ''
    }));
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(bom => {
        if (!bom) return false;
        
        // Check single-value fields
        const singleFieldMatch = 
          (bom.bomName && bom.bomName.toLowerCase().includes(term)) ||
          (bom.bomVersion && bom.bomVersion.toLowerCase().includes(term)) ||
          (bom.hierarchyDepth && bom.hierarchyDepth.toString().toLowerCase().includes(term)) ||
          (bom.totalItems && bom.totalItems.toString().toLowerCase().includes(term)) ||
          (bom.alternativeCount && bom.alternativeCount.toString().toLowerCase().includes(term)) ||
          (bom.differencesCount && bom.differencesCount.toString().toLowerCase().includes(term)) ||
          (bom.alignmentLevel && bom.alignmentLevel.toString().toLowerCase().includes(term)) ||
          (bom.sapBomId && bom.sapBomId.toLowerCase().includes(term)) ||
          (bom.modifier && bom.modifier.toLowerCase().includes(term));
          
        if (singleFieldMatch) return true;
        
        // Check multi-value fields
        const productModelsMatch = bom.productModels && 
          bom.productModels.some(model => model && model.toLowerCase().includes(term));
          
        const productSerialsMatch = bom.productSerials && 
          bom.productSerials.some(serial => serial && serial.toLowerCase().includes(term));
          
        return productModelsMatch || productSerialsMatch;
      });
    }
    
    // Apply other filters
    Object.entries(preferences.filters || {}).forEach(([key, value]) => {
      if (value && value.length > 0) {
        result = result.filter(bom => {
          if (!bom) return false;
          if (Array.isArray(value)) {
            return value.includes(bom[key]);
          }
          return bom[key] === value;
        });
      }
    });
    
    // Sorting
    const { sortField, sortOrder } = preferences;
    if (sortField) {
      result.sort((a, b) => {
        if (!a || !b) return 0;
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        // Handle undefined/null values
        if (aVal === undefined || aVal === null) aVal = '';
        if (bVal === undefined || bVal === null) bVal = '';
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return result;
  }, [boms, searchTerm, preferences]);

  // 分页数据计算
  const totalPages = Math.ceil(filteredBOMs.length / itemsPerPage);
  const paginatedBOMs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBOMs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBOMs, currentPage, itemsPerPage]);

  // 计算统计信息
  const statistics = useMemo(() => {
    const totalDifferences = filteredBOMs.reduce((sum, bom) => sum + (bom.differencesCount || 0), 0);
    const rejectedCount = filteredBOMs.filter(bom => 
      (bom.status === 'REJECTED' || bom.status === '已驳回')
    ).length;
    const syncedCount = filteredBOMs.filter(bom => 
      (bom.syncStatus === 'SYNCED' || bom.syncStatus === '已同步')
    ).length;
    const pendingSyncCount = filteredBOMs.filter(bom => 
      (bom.syncStatus === 'PENDING_SYNC' || bom.syncStatus === '待同步')
    ).length;
    
    return {
      totalDifferences,
      rejectedCount,
      syncedCount,
      pendingSyncCount
    };
  }, [filteredBOMs]);

  // Column configuration - based on business field grouping
  const allColumns = [
    // 主标识列 - 固定最左
    { title: 'BOM名称', dataIndex: 'bomName', width: 200, pinned: 'left', keyType: 'primary' },
    { title: '产品型号', dataIndex: 'productModels', width: 150, keyType: 'primary', tooltip: '多个产品型号用分号分隔' },
    
    // 可选精确键 - 可折叠
    { title: '产品序列号', dataIndex: 'productSerials', width: 150, keyType: 'primary', collapsible: true, tooltip: '每个型号对应多个序列号，用分号分隔' },
    
    // 结构快照列
    { title: '版本', dataIndex: 'bomVersion', width: 100, keyType: 'structure' },
    { title: '层级', dataIndex: 'hierarchyDepth', width: 120, sortable: true, keyType: 'structure' },
    { title: '物料数', dataIndex: 'totalItems', width: 150, sortable: true, keyType: 'structure' },
    { title: '替代料数量', dataIndex: 'alternativeCount', width: 120, sortable: true, keyType: 'structure' },
    
    // 质量风险列
    { title: '差异', dataIndex: 'differencesCount', width: 100, sortable: true, keyType: 'quality' },
    { title: '对齐', dataIndex: 'alignmentLevel', width: 100, sortable: true, keyType: 'quality' },
    
    // 流程状态列 - 总成本紧挨状态
    { title: '总成本', dataIndex: 'totalCost', width: 120, sortable: true, keyType: 'process' },
    { title: '状态', dataIndex: 'status', width: 100, keyType: 'process' },
    { title: '审批状态', dataIndex: 'approvalStatus', width: 120, sortable: true, keyType: 'process' },
    { title: '同步状态', dataIndex: 'syncStatus', width: 120, keyType: 'process' },
    
    // 时效追溯列
    { title: '修改时间', dataIndex: 'lastModified', width: 150, sortable: true, keyType: 'time' },
    { title: '修改人', dataIndex: 'modifier', width: 100, keyType: 'time' },
    
    // 外部映射 - 放最后
    { title: 'SAP BOM ID', dataIndex: 'sapBomId', width: 150, keyType: 'integration' },
    
    // 操作入口 - 固定最右
    { title: '操作', dataIndex: 'actions', width: 240, pinned: 'right', keyType: 'action' }
  ];

  // Visible columns based on screen width and user preferences
  const visibleColumns = useMemo(() => {
    let columns = [...allColumns];
    
    // Responsive column hiding
    if (viewportWidth < 1200) {
      columns = columns.filter(col => 
        !['productSerial', 'alternativeCount', 'sapBomId', 'modifier'].includes(col.dataIndex)
      );
    }
    
    if (viewportWidth < 800) {
      columns = columns.filter(col => 
        !['bomVersion', 'totalCost', 'lastModified'].includes(col.dataIndex)
      );
    }
    
    // Apply user hidden columns
    const hiddenColumns = preferences.hiddenColumns || [];
    columns = columns.filter(col => !hiddenColumns.includes(col.dataIndex));
    
    return columns;
  }, [viewportWidth, preferences.hiddenColumns]);

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectedBOMs(checked ? filteredBOMs.map(bom => bom.id) : []);
  };

  const handleSelectBOM = (id, checked) => {
    setSelectedBOMs(prev => 
      checked ? [...prev, id] : prev.filter(bomId => bomId !== id)
    );
  };

  const handleSort = (field) => {
    setPreferences(prev => {
      const newSortField = prev.sortField === field && prev.sortOrder === 'asc' ? field : field;
      const newSortOrder = prev.sortField === field && prev.sortOrder === 'asc' ? 'desc' : 'asc';
      const updated = { ...prev, sortField: newSortField, sortOrder: newSortOrder };
      savePreferences(updated);
      return updated;
    });
  };

  // 分页UI组件
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 添加第一页按钮
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className="px-3 py-1 mx-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis-start" className="px-2 text-gray-500">
            ...
          </span>
        );
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 mx-1 rounded ${
            i === currentPage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // 添加最后一页按钮
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis-end" className="px-2 text-gray-500">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className="px-3 py-1 mx-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          {totalPages}
        </button>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center mt-4 space-y-3">
        <div className="flex items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 mx-1 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
            &laquo; 上一页
          </button>
          
          {pages}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 mx-1 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
            下一页 &raquo;
          </button>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600 font-medium">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <span className="text-gray-500">
            总计 {filteredBOMs.length} 条记录，每页显示 {itemsPerPage} 条
          </span>
        </div>
        
        {totalPages > 10 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">跳转到页面:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }}
              className="w-16 px-2 py-1 border rounded text-sm"
            />
          </div>
        )}
      </div>
    );
  };

  const handleFilter = (key, value) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        filters: {
          ...prev.filters,
          [key]: value
        }
      };
      savePreferences(updated);
      return updated;
    });
    // 重置页码为第一页
    setCurrentPage(1);
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  // 下载模板函数
  const handleDownloadTemplate = () => {
    // 联想电脑BOM模板数据
    const bomTemplate = [
      // 表头
      [
        'BOM名称',
        '产品型号',
        '产品序列号',
        'BOM版本',
        '层级',
        '物料数',
        '差异',
        '对齐',
        '状态',
        '总成本',
        '同步状态',
        '修改时间',
        '修改人',
        'SAP BOM ID'
      ],
      // ThinkPad X1 Carbon BOM数据 - 5条
      [
        'ThinkPad X1 Carbon BOM-Gen11',
        'ThinkPad X1 Carbon-2023款; ThinkPad X1 Carbon Gen11',
        'SN-TP-X1-2023-001; SN-TP-X1-2023-002; SN-TP-X1-2023-003',
        'V11.3',
        5,
        128,
        2,
        'HIGH',
        '已批准',
        12999.00,
        '已同步',
        '2023-08-15 14:30',
        '张工程师',
        'SAP-BOM-TP-X1-20230815'
      ],
      [
        'ThinkPad X1 Carbon BOM-Gen10',
        'ThinkPad X1 Carbon-2022款; ThinkPad X1 Carbon Gen10',
        'SN-TP-X1-2022-001; SN-TP-X1-2022-002; SN-TP-X1-2022-003',
        'V10.8',
        5,
        124,
        0,
        'NONE',
        '草稿',
        12800.00,
        '待同步',
        '2023-06-18 09:20',
        '赵工程师',
        'SAP-BOM-TP-X1-20230618'
      ],
      [
        'ThinkPad X1 Carbon BOM-Gen9',
        'ThinkPad X1 Carbon-2021款; ThinkPad X1 Carbon Gen9',
        'SN-TP-X1-2021-001; SN-TP-X1-2021-002',
        'V9.5',
        5,
        120,
        0,
        'NONE',
        '已作废',
        12600.00,
        '已同步',
        '2021-12-10 11:25',
        '吴工程师',
        'SAP-BOM-TP-X1-20211210'
      ],
      // ThinkPad T14 BOM数据 - 4条
      [
        'ThinkPad T14 BOM-Gen3',
        'ThinkPad T14-2023款; ThinkPad T14 Gen3',
        'SN-TP-T14-2023-001; SN-TP-T14-2023-002; SN-TP-T14-2023-003',
        'V3.5',
        4,
        95,
        1,
        'LOW',
        '已批准',
        8799.00,
        '已同步',
        '2023-08-22 11:45',
        '吴工程师',
        'SAP-BOM-TP-T14-20230822'
      ],
      [
        'ThinkPad T14 BOM-Gen2',
        'ThinkPad T14-2022款; ThinkPad T14 Gen2',
        'SN-TP-T14-2022-001; SN-TP-T14-2022-002',
        'V2.9',
        4,
        92,
        4,
        'MEDIUM',
        '已批准',
        8499.00,
        '待同步',
        '2022-12-10 10:20',
        '钱工程师',
        'SAP-BOM-TP-T14-20221210'
      ],
      [
        'ThinkPad T14 BOM-Gen2',
        'ThinkPad T14-2022款; ThinkPad T14 Gen2',
        'SN-TP-T14-2022-003; SN-TP-T14-2022-004',
        'V2.8',
        4,
        91,
        0,
        'NONE',
        '已驳回',
        8399.00,
        '待同步',
        '2022-10-08 16:40',
        '孙工程师',
        'SAP-BOM-TP-T14-20221008'
      ],
      // ThinkBook 16p BOM数据 - 3条
      [
        'ThinkBook 16p BOM-Gen2',
        'ThinkBook 16p-2023款; ThinkBook 16p Gen2',
        'SN-TB-16p-2023-001; SN-TB-16p-2023-002',
        'V2.3',
        4,
        88,
        0,
        'NONE',
        'SYNCED',
        7499.00,
        '已同步',
        '2023-08-30 14:20',
        '陈工程师',
        'SAP-BOM-TB-16p-20230830'
      ],
      [
        'ThinkBook 16p BOM-Gen1',
        'ThinkBook 16p-2022款; ThinkBook 16p Gen1',
        'SN-TB-16p-2022-001; SN-TB-16p-2022-002',
        'V1.8',
        4,
        84,
        2,
        'LOW',
        '已批准',
        7199.00,
        '已同步',
        '2022-11-22 11:15',
        '林工程师',
        'SAP-BOM-TB-16p-20221122'
      ],
      // ThinkPad P系列 移动端 - 3条
      [
        'ThinkPad P1 BOM-Gen3',
        'ThinkPad P1-2023款; ThinkPad P1 Gen3; 移动工作站',
        'SN-TP-P1-2023-001; SN-TP-P1-2023-002; SN-TP-P1-2023-003',
        'V3.2',
        5,
        142,
        1,
        'LOW',
        '已批准',
        15999.00,
        '已同步',
        '2023-07-18 10:30',
        '周工程师',
        'SAP-BOM-TP-P1-20230718'
      ],
      [
        'ThinkPad P1 BOM-Gen2',
        'ThinkPad P1-2022款; ThinkPad P1 Gen2; 移动工作站',
        'SN-TP-P1-2022-001; SN-TP-P1-2022-002',
        'V2.7',
        5,
        138,
        3,
        'MEDIUM',
        '已批准',
        14999.00,
        '待同步',
        '2022-09-15 14:25',
        '吴工程师',
        'SAP-BOM-TP-P1-20220915'
      ],
      [
        'ThinkPad P52 BOM-Gen1',
        'ThinkPad P52-2021款; ThinkPad P52 Gen1; 移动工作站',
        'SN-TP-P52-2021-001; SN-TP-P52-2021-002',
        'V1.9',
        5,
        135,
        0,
        'NONE',
        '已作废',
        13999.00,
        '已同步',
        '2021-11-30 09:45',
        '郑工程师',
        'SAP-BOM-TP-P52-20211130'
      ],
      // ThinkPad E系列 入门级 - 3条
      [
        'ThinkPad E14 BOM-Gen3',
        'ThinkPad E14-2023款; ThinkPad E14 Gen3; 入门商务本',
        'SN-TP-E14-2023-001; SN-TP-E14-2023-002; SN-TP-E14-2023-003',
        'V3.1',
        3,
        78,
        2,
        'LOW',
        '草稿',
        5499.00,
        '待同步',
        '2023-06-22 11:15',
        '王工程师',
        'SAP-BOM-TP-E14-20230622'
      ],
      [
        'ThinkPad E15 BOM-Gen3',
        'ThinkPad E15-2023款; ThinkPad E15 Gen3; 入门商务本',
        'SN-TP-E15-2023-001; SN-TP-E15-2023-002',
        'V3.1',
        3,
        82,
        0,
        'NONE',
        '已批准',
        5799.00,
        '已同步',
        '2023-08-05 16:30',
        '孙工程师',
        'SAP-BOM-TP-E15-20230805'
      ],
      [
        'ThinkPad E16 BOM-Gen1',
        'ThinkPad E16-2022款; ThinkPad E16 Gen1; 入门商务本',
        'SN-TP-E16-2022-001; SN-TP-E16-2022-002',
        'V1.5',
        3,
        85,
        1,
        'LOW',
        '已批准',
        6299.00,
        '已同步',
        '2022-10-18 13:45',
        '李工程师',
        'SAP-BOM-TP-E16-20221018'
      ],
      // Legion游戏本系列 - 3条
      [
        'Legion 5 Pro BOM-Gen2',
        'Legion 5 Pro-2023款; Legion 5 Pro Gen2; 游戏本',
        'SN-LG-5P-2023-001; SN-LG-5P-2023-002',
        'V2.4',
        4,
        96,
        3,
        'MEDIUM',
        '已批准',
        9999.00,
        '已同步',
        '2023-07-28 15:20',
        '张工程师',
        'SAP-BOM-LG-5P-20230728'
      ],
      [
        'Legion 7 BOM-Gen2',
        'Legion 7-2023款; Legion 7 Gen2; 高端游戏本',
        'SN-LG-7-2023-001; SN-LG-7-2023-002',
        'V2.2',
        4,
        102,
        2,
        'MEDIUM',
        '已批准',
        12999.00,
        '已同步',
        '2023-09-12 10:45',
        '赵工程师',
        'SAP-BOM-LG-7-20230912'
      ],
      [
        'Legion Slim 7 BOM-Gen1',
        'Legion Slim 7-2023款; Legion Slim 7 Gen1; 轻薄游戏本',
        'SN-LG-S7-2023-001; SN-LG-S7-2023-002',
        'V1.8',
        4,
        98,
        0,
        'NONE',
        'SYNCED',
        11999.00,
        '已同步',
        '2023-08-15 14:30',
        '钱工程师',
        'SAP-BOM-LG-S7-20230815'
      ],
      // ThinkStation工作站系列 - 3条
      [
        'ThinkStation P360 BOM-Gen1',
        'ThinkStation P360-2023款; ThinkStation P360 Gen1; 台式工作站',
        'SN-TS-P360-2023-001; SN-TS-P360-2023-002',
        'V1.6',
        6,
        156,
        1,
        'LOW',
        '已批准',
        18999.00,
        '已同步',
        '2023-05-17 09:30',
        '陈工程师',
        'SAP-BOM-TS-P360-20230517'
      ],
      [
        'ThinkStation P360 Ultra BOM-Gen1',
        'ThinkStation P360 Ultra-2023款; ThinkStation P360 Ultra Gen1; 高端工作站',
        'SN-TS-P360U-2023-001; SN-TS-P360U-2023-002',
        'V1.3',
        6,
        168,
        0,
        'NONE',
        'SYNCED',
        24999.00,
        '已同步',
        '2023-07-25 11:45',
        '杨工程师',
        'SAP-BOM-TS-P360U-20230725'
      ],
      [
        'ThinkStation P340 BOM-Gen2',
        'ThinkStation P340-2022款; ThinkStation P340 Gen2; 入门工作站',
        'SN-TS-P340-2022-001; SN-TS-P340-2022-002',
        'V2.5',
        6,
        145,
        2,
        'LOW',
        '已批准',
        15999.00,
        '待同步',
        '2022-11-08 16:20',
        '黄工程师',
        'SAP-BOM-TS-P340-20221108'
      ],
      // ThinkPad L系列 轻薄本 - 2条
      [
        'ThinkPad L13 BOM-Gen3',
        'ThinkPad L13-2023款; ThinkPad L13 Gen3; 轻薄商务本',
        'SN-TP-L13-2023-001; SN-TP-L13-2023-002',
        'V3.0',
        3,
        72,
        0,
        'NONE',
        'SYNCED',
        6999.00,
        '已同步',
        '2023-06-10 14:15',
        '林工程师',
        'SAP-BOM-TP-L13-20230610'
      ],
      [
        'ThinkPad L14 BOM-Gen2',
        'ThinkPad L14-2022款; ThinkPad L14 Gen2; 轻薄商务本',
        'SN-TP-L14-2022-001; SN-TP-L14-2022-002',
        'V2.3',
        3,
        75,
        1,
        'LOW',
        '已批准',
        6499.00,
        '已同步',
        '2022-08-17 10:30',
        '周工程师',
        'SAP-BOM-TP-L14-20220817'
      ],
      // ThinkPad X1 Fold 掌上端/折叠屏 - 1条
      [
        'ThinkPad X1 Fold BOM-Gen1',
        'ThinkPad X1 Fold-2022款; ThinkPad X1 Fold Gen1; 折叠屏笔记本',
        'SN-TP-X1F-2022-001; SN-TP-X1F-2022-002',
        'V1.4',
        4,
        85,
        4,
        'HIGH',
        '已批准',
        24999.00,
        '已同步',
        '2022-09-05 15:45',
        '吴工程师',
        'SAP-BOM-TP-X1F-20220905'
      ],
      // ThinkSystem服务器系列 - 2条
      [
        'ThinkSystem SR670 BOM-Gen2',
        'ThinkSystem SR670-2023款; ThinkSystem SR670 Gen2; 机架服务器',
        'SN-TS-SR670-2023-001; SN-TS-SR670-2023-002',
        'V2.6',
        7,
        195,
        2,
        'MEDIUM',
        '已批准',
        35999.00,
        '已同步',
        '2023-04-12 09:20',
        '郑工程师',
        'SAP-BOM-TS-SR670-20230412'
      ],
      [
        'ThinkSystem ST250 BOM-Gen3',
        'ThinkSystem ST250-2023款; ThinkSystem ST250 Gen3; 塔式服务器',
        'SN-TS-ST250-2023-001; SN-TS-ST250-2023-002',
        'V3.1',
        7,
        178,
        0,
        'NONE',
        'SYNCED',
        28999.00,
        '已同步',
        '2023-06-28 13:55',
        '孙工程师',
        'SAP-BOM-TS-ST250-20230628'
      ]
    ];

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(bomTemplate);

    // 设置列宽
    const colWidths = [
      { wch: 30 }, // BOM名称
      { wch: 35 }, // 产品型号（加宽以支持多型号）
      { wch: 40 }, // 产品序列号（加宽以支持多序列号）
      { wch: 10 }, // BOM版本
      { wch: 8 },  // 层级
      { wch: 8 },  // 物料数
      { wch: 8 },  // 差异
      { wch: 8 },  // 对齐
      { wch: 10 }, // 状态
      { wch: 10 }, // 总成本
      { wch: 10 }, // 同步状态
      { wch: 20 }, // 修改时间
      { wch: 10 }, // 修改人
      { wch: 20 }  // SAP BOM ID
    ];
    ws['!cols'] = colWidths;

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "联想产品BOM导入模板");

    // 写入文件
    const fileName = '联想产品BOM导入模板.xlsx';
    XLSX.writeFile(wb, fileName);
    
    console.log(`已生成 ${fileName} 文件，包含${bomTemplate.length - 1}条BOM数据`);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');
      
      if (!isExcel) {
        setImportStatus('error');
        setImportMessage('Invalid file type. Please upload a CSV, XLS, or XLSX file.');
        return;
      }
      
      setImportFile(file);
      setImportStatus('validating');
      setImportMessage('Validating file structure and data...');
      
      // Read and validate the file
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          let workbook;
          
          if (fileName.endsWith('.csv')) {
            // For CSV files, use XLSX to parse
            workbook = XLSX.read(bstr, { type: 'binary', raw: false });
          } else {
            // For Excel files
            workbook = XLSX.read(bstr, { type: 'binary' });
          }
          
          // Get the first worksheet
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          // Validate the data structure
          const validationResult = validateBOMData(jsonData);
          
          if (validationResult.isValid) {
            setImportStatus('success');
            setImportMessage(`File validated successfully. Found ${validationResult.rowCount - 1} BOM records.`);
          } else {
            setImportStatus('error');
            setImportMessage(`Validation failed: ${validationResult.errorMessage}`);
          }
        } catch (error) {
          setImportStatus('error');
          setImportMessage(`Error reading file: ${error.message}`);
        }
      };
      
      reader.onerror = () => {
        setImportStatus('error');
        setImportMessage('Error reading the file');
      };
      
      reader.readAsBinaryString(file);
    }
  };

  const handleImportSubmit = async () => {
    if (!importFile) return;
    
    setImportStatus('processing');
    setImportMessage('Processing import...');
    
    try {
      // Read the file again to extract data
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target.result;
          let workbook;
          const fileName = importFile.name.toLowerCase();
          
          if (fileName.endsWith('.csv')) {
            workbook = XLSX.read(bstr, { type: 'binary', raw: false });
          } else {
            workbook = XLSX.read(bstr, { type: 'binary' });
          }
          
          // Get the first worksheet
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          
          // Process the data according to the actual headers
          const processedBOMs = jsonData.map(row => {
            // Helper function to parse multi-value fields
            const parseMultiValue = (value) => {
              if (!value) return [];
              return String(value).split(';').map(v => v.trim()).filter(v => v);
            };
            
            // Convert keys to match our schema
            const bomItem = {
              id: Math.random().toString(36).substring(2, 9), // Generate a temporary ID
              bomName: row['BOM名称'] || row['BOM Name'] || row['bom名称'] || row['bom name'] || '',
              productModels: parseMultiValue(row['产品型号'] || row['Product Model'] || row['产品型号'] || row['product model']),
              productSerials: parseMultiValue(row['产品序列号'] || row['Product Serial'] || row['产品序列号'] || row['product serial']),
              bomVersion: row['版本'] || row['BOM Version'] || row['版本'] || row['bom version'] || '',
              hierarchyDepth: parseInt(row['层级'] || row['Hierarchy Level'] || row['层级'] || row['hierarchy level']) || 0,
              totalItems: parseInt(row['物料数'] || row['Material Count'] || row['物料数'] || row['material count']) || 0,
              alternativeCount: parseInt(row['替代料数量'] || row['Alternative Count'] || row['替代料数量'] || row['alternative count']) || 0,
              differencesCount: parseInt(row['差异'] || row['Differences'] || row['差异'] || row['differences']) || 0,
              alignmentLevel: row['对齐'] || row['Alignment'] || row['对齐'] || row['alignment'] || 'NONE',
              status: row['状态'] || row['Status'] || row['状态'] || row['status'] || '草稿',
              totalCost: parseFloat(row['总成本'] || row['Total Cost'] || row['总成本'] || row['total cost']) || 0,
              syncStatus: row['同步状态'] || row['Sync Status'] || row['同步状态'] || row['sync status'] || '待同步',
              lastModified: new Date().toISOString(),
              modifier: row['修改人'] || row['Modifier'] || row['修改人'] || row['modifier'] || '导入',
              sapBomId: row['SAP BOM ID'] || row['SAP BOM ID'] || row['SAP BOM ID'] || row['sap bom id'] || ''
            };
            
            return bomItem;
          });
          
          // In a real app, you'd call the importBOMs service
          let finalBOMs;
          if (importMode === 'replace') {
            // Replace all BOMs
            setBOMs(processedBOMs);
            finalBOMs = processedBOMs;
          } else {
            // Merge with existing BOMs
            setBOMs(prev => {
              const merged = [...prev, ...processedBOMs];
              finalBOMs = merged;
              return merged;
            });
          }
          
          // 保存到本地存储
          if (finalBOMs) {
            localStorage.setItem('bomData', JSON.stringify(finalBOMs));
          }
          
          setImportStatus('success');
          setImportMessage(`成功导入${processedBOMs.length}个BOM`);
          setShowImportModal(false);
          setImportFile(null);
        } catch (error) {
          setImportStatus('error');
          setImportMessage('Error processing file: ' + error.message);
        }
      };
      
      reader.onerror = () => {
        setImportStatus('error');
        setImportMessage('Error reading file');
      };
      
      reader.readAsBinaryString(importFile);
    } catch (error) {
      setImportStatus('error');
      setImportMessage('Import failed: ' + error.message);
    }
  };

  // 生成模拟BOM物料树数据
  const generateMockMaterialTree = (bomId, bomName) => {
    // 查找对应的BOM对象，获取其层级深度
    const bom = boms.find(b => b.id === bomId);
    const hierarchyDepth = bom?.hierarchyDepth || 4; // 默认4层
    
    // 使用时间戳作为唯一标识基础，确保每次生成的树结构都不同
    const timestamp = Date.now();
    
    // 生成与BOM层级数对应的物料树结构
    const generateTreeByLevel = (currentLevel, maxLevel, parentId = '', uniqueKey = 0, path = '') => {
      if (currentLevel > maxLevel) return null;
      
      // 构建完整路径用于生成唯一标识
      const currentPath = path ? `${path}.${String.fromCharCode(65 + uniqueKey - 1)}` : 'M1';
      
      // 使用唯一ID避免重复，结合路径、时间戳和唯一键
      const nodeId = `${currentLevel}_${currentPath}_${timestamp}_${uniqueKey}`;
      const nodeName = getLevelNodeName(currentLevel, bomName, uniqueKey, currentPath);
      const nodeCost = calculateLevelCost(currentLevel, maxLevel);
      
      const node = {
        id: nodeId,
        name: nodeName,
        level: currentLevel,
        quantity: 1,
        cost: nodeCost,
        lifecycle: 'ACTIVE',
        path: currentPath // 保存路径信息，用于生成位号
      };
      
      // 如果不是最低层级，添加子节点
      if (currentLevel < maxLevel) {
        node.children = [];
        // 控制子节点数量，避免过度生成导致的冗余
        const childCount = currentLevel === 1 ? 2 : currentLevel === 2 ? 3 : 2;
        
        for (let i = 1; i <= childCount; i++) {
          const child = generateTreeByLevel(currentLevel + 1, maxLevel, nodeId, i, currentPath);
          if (child) {
            node.children.push(child);
          }
        }
      } else {
        // 最低层级添加零件信息，确保partId唯一
        // 使用路径、层级和唯一键生成完全唯一的零件ID
        node.partId = `${bomName.replace(/\s+/g, '-').toUpperCase()}-PART-${currentLevel}_${currentPath.replace(/\./g, '-')}_${timestamp}`;
        node.partName = getPartName(currentLevel, bomName, uniqueKey, currentPath);
      }
      
      return node;
    };
    
    // 根据层级获取节点名称，添加路径和唯一键确保唯一性
    const getLevelNodeName = (level, bomName, uniqueKey, currentPath) => {
      // 使用路径信息生成更具辨识度的节点名称
      const pathSuffix = currentPath.length > 2 ? `-${currentPath.split('.').pop()}` : '';
      
      const baseNames = {
        1: `${bomName} 主机`,
        2: `核心组件${pathSuffix}`,
        3: [
          `主板组件${pathSuffix}`, 
          `显示屏组件${pathSuffix}`, 
          `电源组件${pathSuffix}`
        ][uniqueKey - 1] || `功能组件${pathSuffix}-${uniqueKey}`,
        4: [
          `CPU子组件${pathSuffix}`, 
          `内存子组件${pathSuffix}`, 
          `存储子组件${pathSuffix}`
        ][uniqueKey - 1] || `子组件${pathSuffix}-${uniqueKey}`,
        5: [
          `处理器单元${pathSuffix}`, 
          `内存模块${pathSuffix}`, 
          `存储单元${pathSuffix}`
        ][uniqueKey - 1] || `单元${pathSuffix}-${uniqueKey}`,
        6: [
          `CPU${pathSuffix}`, 
          `内存${pathSuffix}`, 
          `SSD${pathSuffix}`, 
          `显示屏${pathSuffix}`, 
          `键盘${pathSuffix}`
        ][uniqueKey - 1] || `零件${pathSuffix}-${uniqueKey}`,
        7: [
          `替代CPU${pathSuffix}`, 
          `替代内存${pathSuffix}`, 
          `替代SSD${pathSuffix}`
        ][uniqueKey - 1] || `替代零件${pathSuffix}-${uniqueKey}`
      };
      return baseNames[level] || `${level}级节点${pathSuffix}-${uniqueKey}`;
    };
    
    // 根据层级获取零件名称，添加路径和唯一键确保唯一性
    const getPartName = (level, bomName, uniqueKey, currentPath) => {
      // 为不同层级和路径生成不同的零件名称集
      const partNameSets = {
        3: [
          ['Intel Core i7处理器', 'DDR5内存', 'PCIe SSD'],
          ['AMD Ryzen 7处理器', 'DDR5-5200内存', 'NVMe SSD'],
          ['Intel Core i9处理器', 'DDR5-4800内存', 'PCIe 5.0 SSD']
        ],
        4: [
          ['Intel Core i5处理器', 'DDR4内存', 'SATA SSD'],
          ['AMD Ryzen 5处理器', 'DDR4-3600内存', 'M.2 SSD'],
          ['Intel Core i3处理器', 'DDR4-3200内存', '2.5" SSD']
        ],
        5: [
          ['Intel Core i3处理器', 'LPDDR5内存', 'NVMe SSD'],
          ['AMD Athlon处理器', 'LPDDR4X内存', 'SATA SSD'],
          ['Intel Pentium处理器', 'DDR4内存', 'eMMC存储']
        ],
        6: [
          ['AMD Ryzen 7处理器', 'DDR5-4800内存', 'PCIe 4.0 SSD'],
          ['Intel Core i7-13700处理器', 'DDR5-5600内存', 'PCIe 4.0 NVMe SSD'],
          ['AMD Ryzen 9处理器', 'DDR5-6000内存', 'PCIe 5.0 NVMe SSD']
        ],
        7: [
          ['AMD Ryzen 5处理器', 'DDR5-4400内存', 'PCIe 3.0 SSD'],
          ['Intel Core i5-13600处理器', 'DDR5-5200内存', 'PCIe 3.0 NVMe SSD'],
          ['AMD Ryzen 3处理器', 'DDR4-3600内存', 'SATA 3 SSD']
        ]
      };
      
      // 根据路径选择不同的零件名称集，避免重复
      const pathIndex = path.split('.').length - 1; // 基于路径深度选择不同的名称集
      const levelSets = partNameSets[level] || [['通用零件', '标准组件', '基础元件']];
      const selectedSet = levelSets[pathIndex % levelSets.length];
      const partName = selectedSet[(uniqueKey - 1) % selectedSet.length];
      
      // 添加路径后缀确保零件名称唯一
      const pathSuffix = currentPath.length > 2 ? `-${currentPath.split('.').pop()}` : '';
      return `${partName}${pathSuffix}`;
    };
    
    // 计算层级成本
    const calculateLevelCost = (level, maxLevel) => {
      const baseCost = maxLevel > 5 ? 15000 : maxLevel > 3 ? 10000 : 5000;
      const levelFactor = Math.pow(0.6, level - 1);
      return Math.round(baseCost * levelFactor);
    };
    
    // 生成单一物料树结构，避免数组中重复元素
    const materialTree = [generateTreeByLevel(1, hierarchyDepth)];
    
    return materialTree;
  };


  const handleViewBOM = (id) => {
    // 查找选中的BOM
    const selectedBOM = boms.find(bom => bom.id === id);
    if (selectedBOM) {
      // 清空之前的物料树数据，避免重复累积
      setBomMaterialTree([]);
      
      // 生成新的物料树数据
      const materialTree = generateMockMaterialTree(id, selectedBOM.bomName);
      setBomMaterialTree(materialTree);
      
      // 设置选中的BOM并显示详情模态框
      setSelectedBOMForDetail(selectedBOM);
      setShowBOMDetailModal(true);
    }
  };

  const handleEditBOM = (id) => {
    navigate(`/bom/editor/${id}`);
  };

  const handleCreateBOM = () => {
    navigate('/boms/create-wizard');
  };

  const handleAlignBOM = async (id) => {
    try {
      // In a real app, you'd call the performAlignment service
      alert('BOM对齐已启动');
    } catch (error) {
      console.error('Failed to align BOM:', error);
      alert('BOM对齐失败: ' + error.message);
    }
  };

  const handleOneClickAdopt = () => {
    if (!selectedBOMForDifference) return;
    
    // 模拟一键采纳操作
    const bomId = selectedBOMForDifference.id;
    
    // 关闭差异抽屉
    setShowDifferenceDrawer(false);
    
    // 显示操作反馈
    const taskId = `align-${Date.now()}`;
    setOperationFeedback({
      show: true,
      action: 'ALIGN',
      taskId,
      status: 'pending',
      message: '正在采纳最新变更...',
      progress: 0
    });
    
    // 模拟进度更新
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 40;
      if (progress > 95) {
        progress = 95;
      }
      
      setOperationFeedback(prev => ({
        ...prev,
        progress: Math.min(progress, 95)
      }));
    }, 250);
    
    // 模拟完成
    setTimeout(() => {
      clearInterval(interval);
      setOperationFeedback({
        show: true,
        action: 'ALIGN',
        taskId,
        status: 'success',
        message: `BOM "${selectedBOMForDifference.bomName}" 已采纳最新变更`,
        progress: 100
      });
      
      // 刷新行数据 - 设置差异数量为0
      setBOMs(prev => prev.map(b => 
        b.id === bomId ? { 
          ...b, 
          differencesCount: 0,
          alignmentLevel: 'NONE'
        } : b
      ));
      
      // 3秒后隐藏反馈
      setTimeout(() => {
        setOperationFeedback(prev => ({ ...prev, show: false }));
      }, 3000);
    }, 1000);
  };

  const handleSyncBOM = async (id) => {
    const bom = filteredBOMs.find(b => b.id === id);
    showConfirmation('SYNC', id, bom.bomName);
  };

  const handleReleaseBOM = async (id) => {
    const bom = filteredBOMs.find(b => b.id === id);
    showConfirmation('RELEASE', id, bom.bomName);
  };

  const handleObsoleteBOM = async (id) => {
    const bom = filteredBOMs.find(b => b.id === id);
    showConfirmation('OBSOLETE', id, bom.bomName);
  };

  const handleCloneBOM = async (id) => {
    try {
      // In a real app, you'd call the cloneBOM service
      alert('BOM克隆已启动');
    } catch (error) {
      console.error('Failed to clone BOM:', error);
      alert('BOM克隆失败: ' + error.message);
    }
  };

  const handleExportBOM = async (id) => {
    try {
      // 查找选中的BOM
      const selectedBOM = boms.find(bom => bom.id === id);
      if (!selectedBOM) {
        alert('未找到指定的BOM数据');
        return;
      }
      
      // 生成物料树数据
      const materialTree = generateMockMaterialTree(id, selectedBOM.bomName);
      
      // 准备导出数据
      const exportData = [];
      
      // 添加BOM基本信息
      exportData.push([
        'BOM ID:', selectedBOM.id,
        'BOM名称:', selectedBOM.bomName
      ]);
      exportData.push([
        '产品型号:', selectedBOM.productModels.join('; '),
        '版本:', selectedBOM.bomVersion
      ]);
      exportData.push([
        '状态:', selectedBOM.status,
        '总成本:', costFmt(selectedBOM.totalCost)
      ]);
      exportData.push(['']); // 空行
      
      // 添加物料树表头
      exportData.push([
        '层级', '物料ID', '物料名称', '位号', '数量', '成本', '生命周期'
      ]);
      
      // 递归函数：将物料树转换为导出数据
          const flattenMaterialTree = (nodes, parentPath = '') => {
            nodes.forEach((node, index) => {
              // 根据层级生成有意义的位号：M1, U1, M1.U1等
              let position;
              if (parentPath) {
                position = `${parentPath}.${String.fromCharCode(65 + index)}`; // A, B, C...
              } else {
                // 第一层使用M前缀（Module）
                position = `M${index + 1}`;
              }
              
              // 添加当前节点数据
              exportData.push([
                node.level,
                node.partId || '',
                node.name,
                position,
                node.quantity,
                node.cost,
                node.lifecycle
              ]);
              
              // 处理子节点
              if (node.children && node.children.length > 0) {
                node.children.forEach((child, childIndex) => {
                  const childPosition = `${position}.${String.fromCharCode(65 + childIndex)}`;
                  // 创建子节点的临时数组并递归处理
                  flattenMaterialTree([child], childPosition);
                });
              }
            });
          };
      
      // 转换物料树数据
      flattenMaterialTree(materialTree);
      
      // 创建工作簿和工作表
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      
      // 设置列宽
      ws['!cols'] = [
        {wch: 10},  // 层级
        {wch: 20},  // 物料ID
        {wch: 30},  // 物料名称
        {wch: 15},  // 位号
        {wch: 10},  // 数量
        {wch: 15},  // 成本
        {wch: 15}   // 生命周期
      ];
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, 'BOM物料清单');
      
      // 导出文件
      XLSX.writeFile(wb, `${selectedBOM.bomName}_BOM物料清单.xlsx`);
      
      // 显示成功消息
      setOperationFeedback({
        show: true,
        action: 'EXPORT',
        status: 'success',
        message: `BOM "${selectedBOM.bomName}" 导出成功`,
        progress: 100
      });
      
      // 3秒后隐藏反馈
      setTimeout(() => {
        setOperationFeedback(prev => ({ ...prev, show: false }));
      }, 3000);
      
    } catch (error) {
      console.error('导出BOM失败:', error);
      alert('BOM导出失败: ' + error.message);
    }
  };

  // RBAC permission check functions
  const hasPermission = (action, bomStatus = null, differencesCount = null, syncStatus = null) => {
    switch (userRole) {
      case '研发工程师':
        // 研发工程师: 禁用OBSOLETE，额外EXPORT（总是可见）
        if (action === 'OBSOLETE') return false;
        if (action === 'EXPORT') return true;
        // 其他操作根据状态机决定
        break;
        
      case '数据管理员':
        // 数据管理员: 禁用RELEASE/OBSOLETE，额外ALIGN（总是可见）
        if (action === 'RELEASE' || action === 'OBSOLETE') return false;
        if (action === 'ALIGN') return true;
        break;
        
      case '项目经理':
        // 项目经理: 禁用DELETE/OBSOLETE，额外RELEASE（主按钮）
        if (action === 'DELETE' || action === 'OBSOLETE') return false;
        if (action === 'RELEASE') return true;
        break;
        
      case '财务/审计':
        // 财务/审计: 禁用EDIT/DELETE/SYNC，只有VIEW/EXPORT
        if (action === 'EDIT' || action === 'DELETE' || action === 'SYNC') return false;
        if (action === 'VIEW' || action === 'EXPORT') return true;
        return false;
        
      case '供应商/只读':
        // 供应商/只读: 除VIEW/EXPORT外全部隐藏
        if (action === 'VIEW' || action === 'EXPORT') return true;
        return false;
        
      default:
        return true;
    }
    
    // Default state machine permissions for roles not overridden above
    if (bomStatus === null) return true;
    
    // 状态为草稿，审批状态和同步状态以及操作都是禁用的
    if (bomStatus === '草稿' || bomStatus === 'DRAFT') {
      return false;
    }
    
    // 状态为未激活，审批状态只能是已驳回，同步状态只能是待同步
    // 操作只能是查看，编辑，删除，导出，成本分析和合规分析
    if (bomStatus === '未激活') {
      if (action === 'VIEW' || action === 'EDIT' || action === 'DELETE' || action === 'EXPORT' || action === 'COST_ANALYSIS' || action === 'COMPLIANCE_ANALYSIS') {
        return true;
      }
      return false;
    }
    
    // 状态为已作废
    // 审批状态可以是已批准/批准中/已驳回，同步状态可以是已同步/待同步
    // 操作可以是查看，编辑，克隆，导出，发布
    if (bomStatus === '已作废' || bomStatus === 'OBSOLETED') {
      if (action === 'VIEW' || action === 'EDIT' || action === 'CLONE' || action === 'EXPORT' || action === 'RELEASE') {
        return true;
      }
      return false;
    }
    
    // 状态为激活
    // 审批状态为已批准，同步状态可以是已同步/待同步
    // 操作可以是查看，编辑，克隆，导出，发布
    if (bomStatus === '激活') {
      if (action === 'VIEW' || action === 'EDIT' || action === 'CLONE' || action === 'EXPORT' || action === 'RELEASE') {
        return true;
      }
      return false;
    }
    
    // 兼容旧状态值
    // State machine logic for REJECTED status
    if (bomStatus === 'REJECTED' || bomStatus === '已驳回') {
      if (action === 'VIEW' || action === 'EDIT' || action === 'CLONE' || action === 'RELEASE' || action === 'DELETE' || action === 'EXPORT' || action === 'COST_ANALYSIS' || action === 'COMPLIANCE_ANALYSIS') {
        return true;
      }
      return false;
    }
    
    // State machine logic for PENDING_APPROVAL status
    if (bomStatus === '待审' || bomStatus === 'PENDING_APPROVAL') {
      if (action === 'VIEW' || action === 'CLONE' || action === 'EXPORT') {
        return true;
      }
      return false;
    }
    
    // State machine logic for APPROVED status
    if (bomStatus === '已批准' || bomStatus === 'APPROVED') {
      if (action === 'VIEW' || action === 'ALIGN' || action === 'CLONE' || action === 'EXPORT' || action === 'COST_ANALYSIS' || action === 'COMPLIANCE_ANALYSIS') {
        return true;
      }
      // 根据syncStatus显示/隐藏同步按钮
      if (action === 'SYNC') {
        // 同步状态为"待同步"时显示，"已同步"时隐藏
        if (syncStatus === '待同步' || syncStatus === 'PENDING_SYNC') return true;
        if (syncStatus === '已同步' || syncStatus === 'SYNCED') return false;
        // 其他情况根据差异数决定
        return differencesCount === 0;
      }
      return false;
    }
    
    // State machine logic for SYNCED status
    if (bomStatus === 'SYNCED' || bomStatus === '已同步') {
      if (action === 'VIEW' || action === 'ALIGN' || action === 'CLONE' || action === 'EXPORT' || action === 'COST_ANALYSIS' || action === 'COMPLIANCE_ANALYSIS') {
        return true;
      }
      // 根据syncStatus显示/隐藏同步按钮
      if (action === 'SYNC') {
        // 同步状态为"待同步"时显示，"已同步"时隐藏
        if (syncStatus === '待同步' || syncStatus === 'PENDING_SYNC') return true;
        if (syncStatus === '已同步' || syncStatus === 'SYNCED') return false;
        return false;
      }
      if (action === 'OBSOLETE' && differencesCount === 0) return true;
      return false;
    }
    
    return false;
  };

  const getButtonVariant = (action, isPrimary = false) => {
    if (!isPrimary) return 'default'; // Standard button
    
    // Primary button variants based on role and action
    if (userRole === '项目经理' && action === 'RELEASE') return 'primary-blue';
    if (userRole === '数据管理员' && action === 'ALIGN') return 'primary-orange';
    if (action === 'SYNC') return 'primary-green';
    if (action === 'CLONE') return 'primary-purple';
    
    return 'default';
  };

  // Determine the primary action for a BOM based on state machine and role
  const getPrimaryAction = (bom) => {
    const status = bom.status;
    const differencesCount = bom.differencesCount;
    
    // 规则①：主按钮=矩阵中第一个允许操作
    // 根据状态机和角色权限确定主按钮
    if ((status === '草稿' || status === 'DRAFT') || status === 'REJECTED') {
      if (hasPermission('RELEASE', status)) return 'RELEASE';
      if (hasPermission('EDIT', status)) return 'EDIT';
      if (hasPermission('CLONE', status)) return 'CLONE';
    }
    
    if (status === '待审' || status === 'PENDING_APPROVAL') {
      if (hasPermission('VIEW', status)) return 'VIEW';
      if (hasPermission('CLONE', status)) return 'CLONE';
      if (hasPermission('EXPORT', status)) return 'EXPORT';
    }
    
    if (status === '已批准' || status === 'APPROVED') {
      // 规则②：差异>0红色提醒
      if (differencesCount > 0 && hasPermission('ALIGN', status)) return 'ALIGN';
      if (differencesCount === 0 && hasPermission('SYNC', status)) return 'SYNC';
      if (hasPermission('ALIGN', status)) return 'ALIGN';
      if (hasPermission('VIEW', status)) return 'VIEW';
    }
    
    if (status === 'SYNCED' || status === '已同步') {
      if (differencesCount > 0 && hasPermission('ALIGN', status)) return 'ALIGN';
      if (differencesCount === 0 && hasPermission('CLONE', status)) return 'CLONE';
      if (hasPermission('VIEW', status)) return 'VIEW';
    }
    
    if (status === '已作废' || status === 'OBSOLETED') {
      if (hasPermission('VIEW', status)) return 'VIEW';
      if (hasPermission('CLONE', status)) return 'CLONE';
      if (hasPermission('EXPORT', status)) return 'EXPORT';
    }
    
    return null;
  };

  // Handle difference drawer
  const handleShowDifferences = (bom) => {
    // 确保差异数量不为零，以便显示差异内容
    if (bom.differencesCount === 0) {
      // 创建一个新的对象，避免直接修改原始数据
      const bomWithDifferences = { ...bom, differencesCount: 2 };
      setSelectedBOMForDifference(bomWithDifferences);
    } else {
      setSelectedBOMForDifference(bom);
    }
    setShowDifferenceDrawer(true);
  };

  // Handle batch operations
  const handleBatchRelease = () => {
    if (window.confirm(`确定要批量发布选中的 ${selectedBOMs.length} 个BOM吗？`)) {
      // 实现批量发布逻辑
      alert(`已批量发布 ${selectedBOMs.length} 个BOM`);
      setSelectedBOMs([]);
    }
  };

  const handleBatchDelete = () => {
    if (window.confirm(`确定要批量删除选中的 ${selectedBOMs.length} 个BOM吗？此操作不可恢复。`)) {
      // 实现批量删除逻辑
      alert(`已批量删除 ${selectedBOMs.length} 个BOM`);
      setSelectedBOMs([]);
    }
  };

  const handleBatchSync = () => {
    if (window.confirm(`确定要批量同步选中的 ${selectedBOMs.length} 个BOM吗？`)) {
      // 实现批量同步逻辑
      alert(`已批量同步 ${selectedBOMs.length} 个BOM`);
      setSelectedBOMs([]);
    }
  };

  const handleBatchExport = () => {
    // 实现批量导出逻辑
    alert(`已批量导出 ${selectedBOMs.length} 个BOM`);
    setSelectedBOMs([]);
  };

  // Handle confirmation modals
  const showConfirmation = (action, bomId, bomName) => {
    let config = { action, bomId };
    
    switch (action) {
      case 'RELEASE':
        config.message = '发布后将无法编辑，是否继续？';
        config.requiresInput = false;
        break;
        
      case 'SYNC':
        config.message = '同步后SAP将以当前版本为准，继续？';
        config.requiresInput = true;
        config.inputLabel = '请输入BOM名称首字母';
        if (bomName) {
          config.inputPattern = bomName.charAt(0).toUpperCase();
        }
        break;
        
      case 'OBSOLETE':
        config.message = '作废后不可恢复，是否继续？';
        config.requiresInput = true;
        config.inputLabel = '请输入"OBSOLETE"以确认';
        config.inputPattern = 'OBSOLETE';
        break;
        
      default:
        return;
    }
    
    config.inputValue = '';
    setConfirmConfig(config);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    const { action, bomId, requiresInput, inputPattern, inputValue } = confirmConfig;
    
    // 验证输入
    if (requiresInput) {
      if (!inputValue || inputValue.toUpperCase() !== inputPattern) {
        alert(`输入错误，请输入"${inputPattern}"以确认操作`);
        return;
      }
    }
    
    setShowConfirmModal(false);
    
    // 执行相应操作
    switch (action) {
      case 'RELEASE':
        executeRelease(bomId);
        break;
      case 'SYNC':
        executeSync(bomId);
        break;
      case 'OBSOLETE':
        executeObsolete(bomId);
        break;
    }
  };

  // Execute operations with feedback
  const executeRelease = (bomId) => {
    const bom = filteredBOMs.find(b => b.id === bomId);
    // 模拟后端返回taskId
    const taskId = `release-${Date.now()}`;
    
    setOperationFeedback({
      show: true,
      action: 'RELEASE',
      taskId,
      status: 'pending',
      message: '正在发布BOM...',
      progress: 0
    });
    
    // 模拟进度更新
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress > 90) {
        progress = 90;
      }
      
      setOperationFeedback(prev => ({
        ...prev,
        progress: Math.min(progress, 90)
      }));
    }, 300);
    
    // 模拟完成
    setTimeout(() => {
      clearInterval(interval);
      setOperationFeedback({
        show: true,
        action: 'RELEASE',
        taskId,
        status: 'success',
        message: `BOM "${bom.bomName}" 发布成功`,
        progress: 100
      });
      
      // 更新BOM状态
      setBOMs(prev => prev.map(b => 
        b.id === bomId ? { ...b, status: 'PENDING_APPROVAL' } : b
      ));
      
      // 3秒后隐藏反馈
      setTimeout(() => {
        setOperationFeedback(prev => ({ ...prev, show: false }));
      }, 3000);
    }, 1500);
  };

  const executeSync = (bomId) => {
    const bom = filteredBOMs.find(b => b.id === bomId);
    // 模拟后端返回taskId
    const taskId = `sync-${Date.now()}`;
    
    setOperationFeedback({
      show: true,
      action: 'SYNC',
      taskId,
      status: 'pending',
      message: '正在同步BOM到SAP...',
      progress: 0
    });
    
    // 模拟进度更新
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25;
      if (progress > 80) {
        progress = 80;
      }
      
      setOperationFeedback(prev => ({
        ...prev,
        progress: Math.min(progress, 80)
      }));
    }, 300);
    
    // 模拟完成
    setTimeout(() => {
      clearInterval(interval);
      setOperationFeedback({
        show: true,
        action: 'SYNC',
        taskId,
        status: 'success',
        message: `BOM "${bom.bomName}" 同步到SAP成功`,
        progress: 100
      });
      
      // 更新BOM状态
      setBOMs(prev => prev.map(b => 
        b.id === bomId ? { ...b, status: 'SYNCED', syncStatus: 'SYNCED' } : b
      ));
      
      // 3秒后隐藏反馈
      setTimeout(() => {
        setOperationFeedback(prev => ({ ...prev, show: false }));
      }, 3000);
    }, 1800);
  };

  const executeObsolete = (bomId) => {
    const bom = filteredBOMs.find(b => b.id === bomId);
    // 模拟后端返回taskId
    const taskId = `obsolete-${Date.now()}`;
    
    setOperationFeedback({
      show: true,
      action: 'OBSOLETE',
      taskId,
      status: 'pending',
      message: '正在作废BOM...',
      progress: 0
    });
    
    // 模拟进度更新
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 35;
      if (progress > 85) {
        progress = 85;
      }
      
      setOperationFeedback(prev => ({
        ...prev,
        progress: Math.min(progress, 85)
      }));
    }, 300);
    
    // 模拟完成
    setTimeout(() => {
      clearInterval(interval);
      setOperationFeedback({
        show: true,
        action: 'OBSOLETE',
        taskId,
        status: 'success',
        message: `BOM "${bom.bomName}" 已作废并归档`,
        progress: 100
      });
      
      // 更新BOM状态
      setBOMs(prev => prev.map(b => 
        b.id === bomId ? { ...b, status: 'OBSOLETED' } : b
      ));
      
      // 3秒后隐藏反馈
      setTimeout(() => {
        setOperationFeedback(prev => ({ ...prev, show: false }));
      }, 3000);
    }, 1200);
  };

  // Determine batch operations based on selected BOMs
  const getBatchOperations = () => {
    if (selectedBOMs.length < 2) return [];
    
    const selectedBOMData = filteredBOMs.filter(bom => selectedBOMs.includes(bom.id));
    const statuses = [...new Set(selectedBOMData.map(bom => bom.status))];
    
    // 规则③：批量操作栏逻辑
    // 若所有行状态=DRAFT → 显示【批量发布】【批量删除】
    if (statuses.length === 1 && (statuses[0] === '草稿' || statuses[0] === 'DRAFT')) {
      return hasPermission('RELEASE', 'DRAFT') && hasPermission('DELETE', 'DRAFT')
        ? ['release', 'delete']
        : hasPermission('RELEASE', 'DRAFT')
        ? ['release']
        : hasPermission('DELETE', 'DRAFT')
        ? ['delete']
        : [];
    }
    
    // 若所有行状态=APPROVED且差异=0 → 显示【批量同步】
    if (
      statuses.length === 1 && 
      (statuses[0] === '已批准' || statuses[0] === 'APPROVED') &&
      selectedBOMData.every(bom => bom.differencesCount === 0)
    ) {
      return hasPermission('SYNC', 'APPROVED') ? ['sync'] : [];
    }
    
    // 混合状态→只显示【批量导出】
    return hasPermission('EXPORT') ? ['export'] : [];
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">BOM管理</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleCreateBOM}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            新建BOM
          </button>

          <button
            onClick={handleImport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Upload size={16} className="mr-2" />
            导入BOM
          </button>
        </div>
      </div>

      {/* Role Selector and Search/Filter Bar */}
      <div className="flex space-x-4 mb-6">
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">当前角色</label>
          <select
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={userRole}
            onChange={(e) => handleRoleChange(e.target.value)}
          >
            <option value="研发工程师">研发工程师</option>
            <option value="数据管理员">数据管理员</option>
            <option value="项目经理">项目经理</option>
            <option value="财务/审计">财务/审计</option>
            <option value="供应商/只读">供应商/只读</option>
          </select>
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索BOM..."
            className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // 搜索时重置页码为第一页
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center px-4 py-2 border rounded-md ${showFilters ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-100'}`}
        >
          <Filter size={18} className="mr-2" />
          筛选
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white p-4 border rounded-md mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={preferences.filters.status || ''}
                onChange={(e) => handleFilter('status', e.target.value)}
              >
                <option value="">全部</option>
                <option value="DRAFT">草稿</option>
                <option value="PENDING_APPROVAL">待审</option>
                <option value="APPROVED">已批准</option>
                <option value="SYNCED">已同步</option>
                <option value="REJECTED">已驳回</option>
                <option value="OBSOLETED">已作废</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">同步状态</label>
              <select
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={preferences.filters.syncStatus || ''}
                onChange={(e) => handleFilter('syncStatus', e.target.value)}
              >
                <option value="">全部</option>
                <option value="SYNCED">已同步</option>
                <option value="PENDING_SYNC">待同步</option>
                <option value="CONFLICT">冲突</option>
                <option value="SYNC_FAILED">同步失败</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">对齐级别</label>
              <select
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={preferences.filters.alignmentLevel || ''}
                onChange={(e) => handleFilter('alignmentLevel', e.target.value)}
              >
                <option value="">全部</option>
                <option value="NONE">无</option>
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
                <option value="CRITICAL">严重</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 统计模块 */}
      <div className="bg-white border border-gray-200 rounded-md p-4 mb-6 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 mb-3">BOM统计信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-600">物料总差异数</p>
                <p className="text-xl font-bold text-yellow-800">{statistics.totalDifferences}</p>
              </div>
              <AlertCircle size={24} className="text-yellow-500" />
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-600">已驳回总数</p>
                <p className="text-xl font-bold text-red-800">{statistics.rejectedCount}</p>
              </div>
              <XCircle size={24} className="text-red-500" />
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600">同步SAP总数\待同步SAP总数</p>
                <p className="text-xl font-bold text-green-800">{statistics.syncedCount}\{statistics.pendingSyncCount}</p>
              </div>
              <CheckCircle size={24} className="text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Role Permission Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h3 className="text-sm font-medium text-blue-800 mb-2">当前角色权限说明</h3>
        <div className="text-xs text-blue-700">
          {userRole === '研发工程师' && (
            <p>研发工程师：可编辑、发布、克隆、导出BOM，但不能作废BOM。导出按钮总是可见。</p>
          )}
          {userRole === '数据管理员' && (
            <p>数据管理员：可对齐、克隆、导出BOM，但不能发布或作废BOM。对齐按钮总是可见。</p>
          )}
          {userRole === '项目经理' && (
            <p>项目经理：可发布、克隆、导出BOM，但不能删除或作废BOM。发布按钮为主按钮。</p>
          )}
          {userRole === '财务/审计' && (
            <p>财务/审计：仅可查看和导出BOM，不能编辑、删除或同步BOM。</p>
          )}
          {userRole === '供应商/只读' && (
            <p>供应商/只读：仅可查看和导出BOM，其他操作均不可用。</p>
          )}
        </div>
      </div>

      {/* Batch Operations Bar */}
      {selectedBOMs.length >= 2 && getBatchOperations().length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6 flex items-center justify-between">
          <div className="text-sm text-blue-800">
            已选择 <span className="font-medium">{selectedBOMs.length}</span> 个BOM
          </div>
          <div className="flex space-x-2">
            {getBatchOperations().includes('release') && (
              <button
                onClick={handleBatchRelease}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                批量发布
              </button>
            )}
            {getBatchOperations().includes('delete') && (
              <button
                onClick={handleBatchDelete}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                批量删除
              </button>
            )}
            {getBatchOperations().includes('sync') && (
              <button
                onClick={handleBatchSync}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                批量同步
              </button>
            )}
            {getBatchOperations().includes('export') && (
              <button
                onClick={handleBatchExport}
                className="px-3 py-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm"
              >
                批量导出
              </button>
            )}
          </div>
        </div>
      )}

      {/* BOM Table */}
      <div className="overflow-x-auto bg-white border rounded-md shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={selectedBOMs.length === filteredBOMs.length && filteredBOMs.length > 0}
                  className="rounded"
                />
              </th>
              {visibleColumns.map(col => (
                <th
                  key={col.dataIndex}
                  className="p-2 text-left font-medium text-gray-700 whitespace-nowrap"
                  style={{ width: col.width }}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.dataIndex)}
                      className="flex items-center space-x-1 hover:text-blue-600"
                    >
                      <span>{col.title}</span>
                      {preferences.sortField === col.dataIndex && (
                        <span className="text-blue-600">
                          {preferences.sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ) : (
                    col.title
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-4 text-center">
                  加载中...
                </td>
              </tr>
            ) : filteredBOMs.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="p-4 text-center">
                  未找到BOM
                </td>
              </tr>
            ) : (
              paginatedBOMs.map((bom, index) => (
                <tr key={bom.id || `bom-${index}`} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedBOMs.includes(bom.id)}
                      onChange={(e) => handleSelectBOM(bom.id, e.target.checked)}
                      className="rounded"
                    />
                  </td>
                  {visibleColumns.map(col => {
                    if (col.dataIndex === 'actions') {
                      return (
                        <td key={col.dataIndex} className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {/* 获取当前BOM的主操作 */}
                            {(() => {
                              const primaryAction = getPrimaryAction(bom);
                              
                              // 规则②：差异>0红色提醒 - 当differencesCount>0且状态=APPROVED/SYNCED时
                              const hasDifferencesAndShouldAlign = 
                                bom.differencesCount > 0 && 
                                ((bom.status === '已批准' || bom.status === 'APPROVED') || 
                                 (bom.status === 'SYNCED' || bom.status === '已同步'));
                              
                              return (
                                <>
                                  {/* VIEW按钮 - 根据角色显示 */}
                                  {hasPermission('VIEW', bom.status) && (
                                    <button
                                      onClick={() => handleViewBOM(bom.id)}
                                      className={`p-1 rounded ${
                                        primaryAction === 'VIEW' || 
                                        (bom.status === '待审' || bom.status === 'PENDING_APPROVAL' || 
                                         bom.status === '已作废' || bom.status === 'OBSOLETED') 
                                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                          : 'hover:bg-gray-100'
                                      }`}
                                      title="查看"
                                    >
                                      <Eye size={16} />
                                    </button>
                                  )}
                                  
                                  {/* EDIT按钮 - 根据角色和状态显示 */}
                                  {hasPermission('EDIT', bom.status) && (
                                    <button
                                      onClick={() => handleEditBOM(bom.id)}
                                      className={`p-1 rounded ${
                                        primaryAction === 'EDIT' 
                                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                          : 'hover:bg-gray-100'
                                      }`}
                                      title="编辑"
                                    >
                                      <Edit size={16} />
                                    </button>
                                  )}
                                  
                                  {/* CLONE按钮 - 根据角色和状态显示，可能是主按钮 */}
                                  {hasPermission('CLONE', bom.status) && (
                                    <button
                                      onClick={() => handleCloneBOM(bom.id)}
                                      className={`p-1 rounded ${
                                        primaryAction === 'CLONE' 
                                          ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                          : 'hover:bg-gray-100'
                                      }`}
                                      title="克隆"
                                    >
                                      <Copy size={16} />
                                    </button>
                                  )}
                                  
                                  {/* RELEASE按钮 - 根据角色和状态显示，可能是主按钮 */}
                                  {hasPermission('RELEASE', bom.status) && (
                                    <button
                                      onClick={() => handleReleaseBOM(bom.id)}
                                      className={`p-1 rounded ${
                                        primaryAction === 'RELEASE' || userRole === '项目经理'
                                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                          : 'hover:bg-gray-100'
                                      }`}
                                      title="发布"
                                    >
                                      <Rocket size={16} />
                                    </button>
                                  )}
                                  
                                  {/* DELETE按钮 - 根据角色和状态显示 */}
                                  {hasPermission('DELETE', bom.status) && (
                                    <button
                                      onClick={() => handleObsoleteBOM(bom.id)}
                                      className="p-1 rounded hover:bg-gray-100 text-red-600"
                                      title="删除"
                                    >
                                      <X size={16} />
                                    </button>
                                  )}
                                  
                                  {/* ALIGN按钮 - 根据角色和状态显示，可能是主按钮 */}
                                  {hasPermission('ALIGN', bom.status) && (
                                    <button
                                      onClick={() => {
                                        // 直接检查当前BOM是否有差异且应该显示差异
                                        const currentHasDifferences = bom.differencesCount > 0 && ((bom.status === '已批准' || bom.status === 'APPROVED') || (bom.status === 'SYNCED' || bom.status === '已同步'));
                                        if (currentHasDifferences) {
                                          handleShowDifferences(bom);
                                        } else {
                                          handleAlignBOM(bom.id);
                                        }
                                      }}
                                      className={`p-1 rounded ${
                                        primaryAction === 'ALIGN' || 
                                        (bom.differencesCount > 0 && ((bom.status === '已批准' || bom.status === 'APPROVED') || (bom.status === 'SYNCED' || bom.status === '已同步'))) || 
                                        userRole === '数据管理员'
                                          ? 'bg-red-600 text-white hover:bg-red-700' 
                                          : 'hover:bg-gray-100'
                                      }`}
                                      title={(bom.differencesCount > 0 && ((bom.status === '已批准' || bom.status === 'APPROVED') || (bom.status === 'SYNCED' || bom.status === '已同步'))) ? "查看差异" : "对齐"}
                                    >
                                      <Link size={16} />
                                    </button>
                                  )}
                                  
                                  {/* SYNC按钮 - 根据角色、状态和同步状态显示，可能是主按钮 */}
                                  {hasPermission('SYNC', bom.status, bom.differencesCount, bom.syncStatus) && (
                                    <button
                                      onClick={() => handleSyncBOM(bom.id)}
                                      className={`p-1 rounded ${
                                        primaryAction === 'SYNC' 
                                          ? 'bg-green-600 text-white hover:bg-green-700' 
                                          : 'hover:bg-gray-100'
                                      }`}
                                      title={hasDifferencesAndShouldAlign ? "请先对齐差异" : "同步"}
                                      disabled={hasDifferencesAndShouldAlign}
                                    >
                                      <CloudUpload size={16} />
                                    </button>
                                  )}
                                  
                                  {/* EXPORT按钮 - 根据角色显示，可能是额外按钮 */}
                                  {hasPermission('EXPORT', bom.status) && (
                                    <button
                                      onClick={() => handleExportBOM(bom.id)}
                                      className={`p-1 rounded ${
                                        userRole === '研发工程师' || userRole === '财务/审计'
                                          ? 'bg-teal-600 text-white hover:bg-teal-700' 
                                          : 'hover:bg-gray-100'
                                      }`}
                                      title="导出"
                                    >
                                      <Download size={16} />
                                    </button>
                                  )}
                                  
                                  {/* 成本分析按钮 - 只显示图标 */}
                                  {hasPermission('COST_ANALYSIS', bom.status) && (
                                    <button
                                      onClick={() => navigate(`/reports/cost?bomId=${bom.id}`)}
                                      className="p-1 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                                      title="成本分析"
                                    >
                                      <CheckCircle size={16} />
                                    </button>
                                  )}
                                  
                                  {/* 合规分析按钮 - 只显示图标 */}
                                  {hasPermission('COMPLIANCE_ANALYSIS', bom.status) && (
                                    <button
                                      onClick={() => navigate(`/reports/compliance?bomId=${bom.id}`)}
                                      className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                                      title="合规分析"
                                    >
                                      <AlertCircle size={16} />
                                    </button>
                                  )}
                                  
                                  {/* OBSOLETE按钮 - 根据角色和状态显示 */}
                                  {hasPermission('OBSOLETE', bom.status, bom.differencesCount) && (
                                    <button
                                      onClick={() => handleObsoleteBOM(bom.id)}
                                      className="p-1 rounded hover:bg-gray-100 text-gray-600"
                                      title="作废"
                                    >
                                      <X size={16} />
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                      );
                    } else if (col.dataIndex === 'status') {
                      return (
                        <td key={col.dataIndex} className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            bom.status === 'DRAFT' || bom.status === '草稿' ? 'bg-blue-100 text-blue-800' :
                            bom.status === 'PENDING_APPROVAL' || bom.status === '待审' ? 'bg-orange-100 text-orange-800' :
                            bom.status === 'APPROVED' || bom.status === '已批准' ? 'bg-green-100 text-green-800' :
                            bom.status === 'SYNCED' || bom.status === '已同步' ? 'bg-purple-100 text-purple-800' :
                            bom.status === 'REJECTED' || bom.status === '已驳回' ? 'bg-red-100 text-red-800' :
                            bom.status === 'OBSOLETED' || bom.status === '已作废' ? 'bg-gray-100 text-gray-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {badgeMap[bom.status]?.text || badgeMap[`${bom.status}_EN`]?.text || bom.status}
                          </span>
                        </td>
                      );
                    } else if (col.dataIndex === 'approvalStatus') {
                      return (
                        <td key={col.dataIndex} className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${bom.approvalStatus === '已批准' ? 'bg-green-100 text-green-800' : bom.approvalStatus === '审批中' ? 'bg-orange-100 text-orange-800' : bom.approvalStatus === '已驳回' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                            {bom.approvalStatus}
                          </span>
                        </td>
                      );
                    } else if (col.dataIndex === 'syncStatus') {
                      return (
                        <td key={col.dataIndex} className="p-2">
                          <div className="flex items-center">
                            {syncIconMap[bom.syncStatus]?.icon || syncIconMap[`${bom.syncStatus}_EN`]?.icon}
                            <span className="ml-1">
                              {syncIconMap[bom.syncStatus]?.text || syncIconMap[`${bom.syncStatus}_EN`]?.text || bom.syncStatus?.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                      );
                    } else if (col.dataIndex === 'alignmentLevel') {
                      return (
                        <td key={col.dataIndex} className="p-2">
                          <span className={`px-2 py-1 rounded text-xs text-white bg-${levelColor(bom[col.dataIndex])}-500`}>
                            {levelColorMap[bom[col.dataIndex]]?.text || levelColorMap[`${bom[col.dataIndex]}_EN`]?.text || bom[col.dataIndex]}
                          </span>
                        </td>
                      );
                    } else if (col.dataIndex === 'totalCost') {
                      return (
                        <td key={col.dataIndex} className="p-2">
                          {costFmt(bom[col.dataIndex])}
                        </td>
                      );
                    } else if (col.dataIndex === 'totalItems') {
                      return (
                        <td key={col.dataIndex} className="p-2">
                          {bom[col.dataIndex]}/{bom.uniqueItems || 0}
                        </td>
                      );
                    } else if (col.dataIndex === 'lastModified') {
                      return (
                        <td key={col.dataIndex} className="p-2">
                          {dateFmt(bom[col.dataIndex])}
                        </td>
                      );
                    } else if (col.dataIndex === 'productModels' || col.dataIndex === 'productSerials') {
                      return (
                        <td key={col.dataIndex} className="p-2" title={formatMultiValue(bom[col.dataIndex])}>
                          <div className="max-w-xs truncate">
                            {formatMultiValue(bom[col.dataIndex])}
                          </div>
                        </td>
                      );
                    } else {
                      return (
                        <td key={col.dataIndex} className="p-2">
                          {bom[col.dataIndex]}
                        </td>
                      );
                    }
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页组件 */}
      {renderPagination()}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">导入BOM</h2>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center px-3 py-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm"
              >
                <Download size={14} className="mr-1" />
                下载模板
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">导入模式</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={(e) => setImportMode(e.target.value)}
                    className="mr-2"
                  />
                  与现有BOM合并
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={(e) => setImportMode(e.target.value)}
                    className="mr-2"
                  />
                  替换所有BOM
                </label>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">选择文件</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border rounded-md"
              />
              <p className="mt-1 text-sm text-gray-500">
                支持格式: CSV, XLS, XLSX。首次使用请先下载模板查看格式要求。
              </p>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 mb-2">模板说明</h3>
              <p className="text-xs text-gray-600">
                下载的模板包含31条联想产品BOM示例数据，支持一对多关系：一个BOM对应多个产品型号，每个产品型号对应多个产品序列号。
              </p>
              <p className="text-xs text-gray-600 mb-2">
                <strong>包含产品类型：</strong>
              </p>
              <ul className="text-xs text-gray-600 mb-2 list-disc list-inside">
                <li><strong>商务本：</strong>ThinkPad X1 Carbon, ThinkPad T14</li>
                <li><strong>移动工作站：</strong>ThinkPad P1, ThinkPad P52</li>
                <li><strong>入门商务本：</strong>ThinkPad E14, ThinkPad E15, ThinkPad E16</li>
                <li><strong>轻薄商务本：</strong>ThinkBook 16p, ThinkPad L13, ThinkPad L14</li>
                <li><strong>游戏本：</strong>Legion 5 Pro, Legion 7, Legion Slim 7</li>
                <li><strong>折叠屏笔记本：</strong>ThinkPad X1 Fold</li>
                <li><strong>台式工作站：</strong>ThinkStation P360, ThinkStation P360 Ultra, ThinkStation P340</li>
                <li><strong>服务器：</strong>ThinkSystem SR670, ThinkSystem ST250</li>
              </ul>
              <ul className="text-xs text-gray-600 mt-1 list-disc list-inside">
                <li>BOM名称（必需）：标识BOM的唯一名称</li>
                <li>产品型号（必需）：支持多个型号，用分号(;)分隔</li>
                <li>产品序列号（必需）：支持多个序列号，用分号(;)分隔</li>
                <li>状态（必需）：草稿、已批准、已驳回、已作废、SYNCED</li>
                <li>BOM版本、层级（可选）</li>
                <li>物料数、差异（可选）</li>
                <li>对齐（可选）：NONE、LOW、MEDIUM、HIGH、CRITICAL</li>
                <li>总成本（可选，必须是正数）</li>
                <li>同步状态、修改时间、修改人、SAP BOM ID（可选）</li>
              </ul>
              <p className="text-xs text-gray-600 mt-2">
                <strong>示例格式：</strong>产品型号 "ThinkPad X1 Carbon-2023款; ThinkPad X1 Carbon Gen11" 表示一个BOM同时支持两个型号
              </p>
              <p className="text-xs text-gray-600">
                <strong>提示：</strong>导入时系统会自动验证数据格式和必填字段。
              </p>
            </div>
            
            {importMessage && (
              <div className={`mb-4 p-2 rounded ${
                importStatus === 'error' ? 'bg-red-100 text-red-800' :
                importStatus === 'success' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {importMessage}
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleImportSubmit}
                disabled={!importFile || importStatus === 'processing'}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {importStatus === 'processing' ? '处理中...' : '导入'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Difference Drawer */}
      {showDifferenceDrawer && selectedBOMForDifference && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-2xl h-full shadow-xl p-6 overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">BOM差异详情</h2>
              <button
                onClick={() => setShowDifferenceDrawer(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-500">BOM名称</span>
                  <p className="font-medium">{selectedBOMForDifference.bomName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">产品型号</span>
                  <p className="font-medium">{selectedBOMForDifference.productModel}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">当前状态</span>
                  <p className="font-medium">{selectedBOMForDifference.status}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">差异数量</span>
                  <p className="font-medium text-red-600">{selectedBOMForDifference.differencesCount}</p>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">差异列表</h3>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left">物料编码</th>
                      <th className="p-2 text-left">物料名称</th>
                      <th className="p-2 text-left">当前版本</th>
                      <th className="p-2 text-left">最新版本</th>
                      <th className="p-2 text-left">差异类型</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 模拟差异数据 - 根据当前BOM类型定制 */}
                    {selectedBOMForDifference.productModel?.includes('ThinkPad X1') && (
                      <>
                        <tr className="border-b">
                          <td className="p-2">X1-CPU-001</td>
                          <td className="p-2">Intel Core i7-1365U</td>
                          <td className="p-2">10核</td>
                          <td className="p-2 text-red-600">12核</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">规格升级</span>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">X1-RAM-002</td>
                          <td className="p-2">DDR5-4800MHz</td>
                          <td className="p-2">16GB</td>
                          <td className="p-2 text-red-600">32GB</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">容量变更</span>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">X1-SSD-005</td>
                          <td className="p-2">固态硬盘</td>
                          <td className="p-2">1TB PCIe 4.0</td>
                          <td className="p-2 text-red-600">2TB PCIe 4.0</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">容量扩容</span>
                          </td>
                        </tr>
                      </>
                    )}
                    {selectedBOMForDifference.productModel?.includes('ThinkPad T14') && (
                      <>
                        <tr className="border-b">
                          <td className="p-2">T14-CPU-001</td>
                          <td className="p-2">Intel Core i5-1335U</td>
                          <td className="p-2">10核</td>
                          <td className="p-2 text-red-600">12核</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">规格升级</span>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">T14-DISP-003</td>
                          <td className="p-2">显示屏</td>
                          <td className="p-2">14英寸 FHD</td>
                          <td className="p-2 text-red-600">14英寸 2.8K</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">分辨率提升</span>
                          </td>
                        </tr>
                      </>
                    )}
                    {selectedBOMForDifference.productModel?.includes('ThinkBook 16p') && (
                      <>
                        <tr className="border-b">
                          <td className="p-2">TB16-GPU-001</td>
                          <td className="p-2">独立显卡</td>
                          <td className="p-2">AMD Radeon RX 6500M</td>
                          <td className="p-2 text-red-600">AMD Radeon RX 6600M</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">性能升级</span>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">TB16-BAT-004</td>
                          <td className="p-2">电池</td>
                          <td className="p-2">71Wh</td>
                          <td className="p-2 text-red-600">86Wh</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">容量提升</span>
                          </td>
                        </tr>
                      </>
                    )}
                    {selectedBOMForDifference.productModel?.includes('CPU') && (
                      <>
                        <tr className="border-b">
                          <td className="p-2">CPU-UP-001</td>
                          <td className="p-2">处理器</td>
                          <td className="p-2">Intel Core i7-1365U</td>
                          <td className="p-2 text-red-600">Intel Core i7-1370U</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">型号升级</span>
                          </td>
                        </tr>
                      </>
                    )}
                    {selectedBOMForDifference.productModel?.includes('RAM') && (
                      <>
                        <tr className="border-b">
                          <td className="p-2">RAM-UP-001</td>
                          <td className="p-2">内存条</td>
                          <td className="p-2">三星 DDR5-4800MHz</td>
                          <td className="p-2 text-red-600">三星 DDR5-5600MHz</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">频率提升</span>
                          </td>
                        </tr>
                      </>
                    )}
                    {selectedBOMForDifference.productModel?.includes('SSD') && (
                      <>
                        <tr className="border-b">
                          <td className="p-2">SSD-UP-001</td>
                          <td className="p-2">固态硬盘</td>
                          <td className="p-2">三星 980 PRO 1TB</td>
                          <td className="p-2 text-red-600">三星 990 PRO 2TB</td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">容量翻倍</span>
                          </td>
                        </tr>
                      </>
                    )}
                    {/* 如果没有匹配的产品型号，显示通用差异数据 */}
                    {!selectedBOMForDifference.productModel || [
                      'ThinkPad X1', 'ThinkPad T14', 'ThinkBook 16p',
                      'CPU', 'RAM', 'SSD'
                    ].every(keyword => !selectedBOMForDifference.productModel.includes(keyword)) && (
                      <tr className="border-b">
                        <td className="p-2">GEN-001</td>
                        <td className="p-2">通用组件</td>
                        <td className="p-2">当前版本</td>
                        <td className="p-2 text-red-600">最新版本</td>
                        <td className="p-2">
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">版本更新</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleOneClickAdopt}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                一键采纳
              </button>
              <button
                onClick={() => handleAlignBOM(selectedBOMForDifference.id)}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                执行对齐
              </button>
              <button
                onClick={() => setShowDifferenceDrawer(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">操作确认</h2>
            <p className="mb-6">{confirmConfig.message}</p>
            
            {confirmConfig.requiresInput && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {confirmConfig.inputLabel}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={confirmConfig.inputValue}
                  onChange={(e) => setConfirmConfig(prev => ({
                    ...prev,
                    inputValue: e.target.value
                  }))}
                  placeholder={`请输入: ${confirmConfig.inputPattern}`}
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={confirmConfig.requiresInput && !confirmConfig.inputValue}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOM Detail Modal */}
      {showBOMDetailModal && selectedBOMForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">BOM详情</h2>
              <button
                onClick={() => setShowBOMDetailModal(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              {/* BOM基本信息 */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">BOM名称</span>
                    <p className="font-medium">{selectedBOMForDetail.bomName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">产品型号</span>
                    <p className="font-medium">{selectedBOMForDetail.productModels.join('; ')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">BOM版本</span>
                    <p className="font-medium">{selectedBOMForDetail.bomVersion}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">状态</span>
                    <div className="flex items-center">
                      <p className={`font-medium ${badgeMap[selectedBOMForDetail.status]?.color === 'green' ? 'text-green-600' : badgeMap[selectedBOMForDetail.status]?.color === 'blue' ? 'text-blue-600' : badgeMap[selectedBOMForDetail.status]?.color === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>
                        {selectedBOMForDetail.status}
                      </p>
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                        {selectedBOMForDetail.status === '草稿' && '可编辑、删除'}
                        {selectedBOMForDetail.status === '待审' && '等待审批'}
                        {selectedBOMForDetail.status === '已批准' && '已通过审批'}
                        {selectedBOMForDetail.status === '已同步' && '与SAP同步'}
                        {selectedBOMForDetail.status === '已驳回' && '审批未通过'}
                        {selectedBOMForDetail.status === '已作废' && '已停止使用'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">总成本</span>
                    <p className="font-medium">{costFmt(selectedBOMForDetail.totalCost)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedBOMForDetail.totalCost > 10000 ? '高成本BOM' : selectedBOMForDetail.totalCost > 5000 ? '中等成本BOM' : '低成本BOM'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">同步状态</span>
                    <div className="flex items-center">
                      <p className={`font-medium flex items-center`}>
                        {syncIconMap[selectedBOMForDetail.syncStatus]?.icon}
                        <span className={`ml-1 ${syncIconMap[selectedBOMForDetail.syncStatus]?.color === 'green' ? 'text-green-600' : syncIconMap[selectedBOMForDetail.syncStatus]?.color === 'orange' ? 'text-orange-600' : syncIconMap[selectedBOMForDetail.syncStatus]?.color === 'gold' ? 'text-yellow-600' : 'text-red-600'}`}>
                          {selectedBOMForDetail.syncStatus}
                        </span>
                      </p>
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                        {selectedBOMForDetail.syncStatus === '已同步' && '数据一致'}
                        {selectedBOMForDetail.syncStatus === '待同步' && '等待推送'}
                        {selectedBOMForDetail.syncStatus === '冲突' && '需要解决冲突'}
                        {selectedBOMForDetail.syncStatus === '同步失败' && '同步异常'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">物料总数</span>
                    <p className="font-medium">{selectedBOMForDetail.totalItems}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedBOMForDetail.totalItems > 200 ? '复杂物料结构' : selectedBOMForDetail.totalItems > 100 ? '中等复杂度' : '简单物料结构'}
                      {selectedBOMForDetail.differencesCount > 0 && ` | ${selectedBOMForDetail.differencesCount}处差异`}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">差异数量</span>
                    <p className="font-medium text-red-600">{selectedBOMForDetail.differencesCount}</p>
                  </div>
                </div>
              </div>
              
              {/* 物料树结构 */}
              <div>
                <h3 className="text-lg font-medium mb-3">物料树结构</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-2 text-left">层级</th>
                        <th className="p-2 text-left">物料ID</th>
                        <th className="p-2 text-left">物料名称</th>
                        <th className="p-2 text-left">位号</th>
                        <th className="p-2 text-left">数量</th>
                        <th className="p-2 text-left">成本</th>
                        <th className="p-2 text-left">生命周期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* 递归渲染物料树 */}
                      {bomMaterialTree.length > 0 && bomMaterialTree.map((node) => {
                          const renderNode = (nodeItem) => {
                            // 使用节点自身保存的路径信息作为位号，确保唯一性
                            const position = nodeItem.path;
                            const indent = (nodeItem.level - 1) * 20;
                            
                            return (
                              <React.Fragment key={nodeItem.id}>
                                <tr className="border-b">
                                  <td className="p-2">{nodeItem.level}</td>
                                  <td className="p-2">{nodeItem.partId || '-'}</td>
                                  <td className="p-2 pl-2" style={{ paddingLeft: `${indent}px` }}>
                                    <span className="font-medium">{nodeItem.name}</span>
                                  </td>
                                  <td className="p-2">{position}</td>
                                  <td className="p-2">{nodeItem.quantity}</td>
                                  <td className="p-2">{costFmt(nodeItem.cost)}</td>
                                  <td className="p-2">
                                    <span className={`px-2 py-1 rounded text-xs ${nodeItem.lifecycle === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                      {nodeItem.lifecycle}
                                    </span>
                                  </td>
                                </tr>
                                {/* 递归渲染子节点 */}
                                {nodeItem.children && nodeItem.children.length > 0 && 
                                  nodeItem.children.map((child) => {
                                    // 直接递归调用，不再需要传递路径和索引
                                    return renderNode(child);
                                  })
                                }
                              </React.Fragment>
                            );
                          };
                        
                        return renderNode(node);
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t flex justify-end space-x-2 bg-gray-50">
              <button
                onClick={() => setShowBOMDetailModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                关闭
              </button>
              <button
                onClick={() => handleExportBOM(selectedBOMForDetail.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                导出
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Operation Feedback */}
      {operationFeedback.show && (
        <div className="fixed top-4 right-4 w-full max-w-md z-50">
          <div className={`rounded-lg shadow-lg p-4 ${
            operationFeedback.status === 'pending' ? 'bg-blue-50 border border-blue-200' :
            operationFeedback.status === 'success' ? 'bg-green-50 border border-green-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                operationFeedback.status === 'pending' ? 'bg-blue-100' :
                operationFeedback.status === 'success' ? 'bg-green-100' :
                'bg-red-100'
              }`}>
                {operationFeedback.action === 'RELEASE' && <Rocket size={20} />}
                {operationFeedback.action === 'SYNC' && <CloudUpload size={20} />}
                {operationFeedback.action === 'OBSOLETE' && <X size={20} />}
                {operationFeedback.action === 'ALIGN' && <Link size={20} />}
                {operationFeedback.action === 'EXPORT' && <Download size={20} />}
              </div>
              <div>
                <p className={`font-medium ${
                  operationFeedback.status === 'pending' ? 'text-blue-800' :
                  operationFeedback.status === 'success' ? 'text-green-800' :
                  'text-red-800'
                }`}>
                  {operationFeedback.message}
                </p>
                {operationFeedback.taskId && (
                  <p className="text-xs text-gray-500">任务ID: {operationFeedback.taskId}</p>
                )}
              </div>
            </div>
            
            {operationFeedback.status === 'pending' && (
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>进度</span>
                  <span>{operationFeedback.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${operationFeedback.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BOMManagement;