import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';

// 定义事件类型
export type EventType = 'complianceUpdated' | 'certRenewed' | 'exportRequested';

// 定义事件监听器类型
type EventListener = (...args: any[]) => void;

// 定义合规状态类型
export interface ComplianceStatus {
  compliantCount: number;
  missingCount: number;
  compliantRate: number;
}

// 定义缺口表格数据类型
export interface GapRecord {
  id: string;
  position: string;
  partName: string;
  missingCerts: string[];
  expireDate: string;
  supplier: string;
  status: 'compliant' | 'expiring' | 'missing';
}

// 定义对比车项目类型
export interface CompareCartItem {
  id: string;
  position: string;
  partName: string;
  expireDate: string;
}

// 事件总线类
class EventBus {
  private listeners: Map<EventType, Set<EventListener>>;

  constructor() {
    this.listeners = new Map();
  }

  // 注册事件监听器
  on(event: EventType, listener: EventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // 返回取消订阅函数
    return () => {
      this.off(event, listener);
    };
  }

  // 移除事件监听器
  off(event: EventType, listener: EventListener): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(listener);
      if (this.listeners.get(event)!.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // 触发事件
  emit(event: EventType, ...args: any[]): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }
}

// 创建状态机和事件总线Hook
export const useComplianceDashboard = () => {
  // 创建新的事件总线实例
  const eventBusRef = useRef(new EventBus());
  
  // 状态定义
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus>({
    compliantCount: 0,
    missingCount: 0,
    compliantRate: 0
  });
  
  const [gapRecords, setGapRecords] = useState<GapRecord[]>([]);
  const [selectedPart, setSelectedPart] = useState<GapRecord | null>(null);
  const [compareCart, setCompareCart] = useState<CompareCartItem[]>([]);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [warningDrawerVisible, setWarningDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // 初始化数据
  const initializeData = useCallback(async () => {
    setLoading(true);
    try {
      // 这里应该从API获取实际数据，现在使用模拟数据
      // 模拟合规状态数据
      const mockComplianceStatus: ComplianceStatus = {
        compliantCount: 850,
        missingCount: 150,
        compliantRate: 85
      };
      setComplianceStatus(mockComplianceStatus);

      // 模拟缺口表格数据
      const mockGapRecords: GapRecord[] = [
        {
          id: 'gap-1',
          position: 'U1',
          partName: 'i7-1555U处理器',
          missingCerts: ['RoHS', 'CE'],
          expireDate: '2025-08-01',
          supplier: 'Intel',
          status: 'missing'
        },
        {
          id: 'gap-2',
          position: 'PCB-001',
          partName: 'PCB主板',
          missingCerts: ['CE'],
          expireDate: '2025-08-01',
          supplier: 'Foxconn',
          status: 'missing'
        },
        {
          id: 'gap-3',
          position: 'PWR-001',
          partName: '电源模块',
          missingCerts: ['CE'],
          expireDate: '2025-05-15',
          supplier: 'Delta',
          status: 'expiring'
        },
        {
          id: 'gap-4',
          position: 'MEM-001',
          partName: '内存模块',
          missingCerts: ['REACH'],
          expireDate: '2024-10-15',
          supplier: 'Samsung',
          status: 'expiring'
        }
      ];
      setGapRecords(mockGapRecords);

      // 触发合规更新事件
      eventBusRef.current.emit('complianceUpdated', mockComplianceStatus, mockGapRecords);
    } catch (error) {
      console.error('Failed to initialize data:', error);
      message.error('初始化数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件挂载时初始化数据
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // 注册事件监听的方法
  const registerEventListener = useCallback((event: EventType, listener: EventListener) => {
    return eventBusRef.current.on(event, listener);
  }, []);

  // 处理零件选择
  const handlePartSelect = useCallback((part: GapRecord) => {
    setSelectedPart(part);
    setDetailDrawerVisible(true);
  }, []);

  // 处理详情抽屉开关
  const handleDetailDrawerClose = useCallback(() => {
    setDetailDrawerVisible(false);
    setSelectedPart(null);
  }, []);

  // 处理添加到对比车
  const handleAddToCompareCart = useCallback((item: CompareCartItem) => {
    setCompareCart(prev => {
      // 检查是否已存在
      const exists = prev.some(i => i.id === item.id);
      if (exists) {
        message.info('该零件已在对比车中');
        return prev;
      }
      
      // 检查对比车容量
      if (prev.length >= 4) {
        message.warning('对比车最多只能添加4个零件');
        return prev;
      }
      
      const newCart = [...prev, item];
      message.success('零件已添加到对比车');
      return newCart;
    });
  }, []);

  // 处理从对比车移除
  const handleRemoveFromCompareCart = useCallback((id: string) => {
    setCompareCart(prev => prev.filter(item => item.id !== id));
    message.success('零件已从对比车移除');
  }, []);

  // 处理导出请求
  const handleExportRequested = useCallback((exportType: 'excel' | 'pdf', data?: any) => {
    setLoading(true);
    try {
      // 模拟导出操作
      console.log(`Exporting ${exportType} with data:`, data);
      
      // 触发导出事件
      eventBusRef.current.emit('exportRequested', exportType, data);
      
      // 模拟异步导出过程
      setTimeout(() => {
        message.success(`${exportType === 'excel' ? 'Excel' : 'PDF'} 导出成功`);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      message.error('导出失败');
      setLoading(false);
    }
  }, []);

  // 处理证书续期
  const handleCertificateRenew = useCallback((certId: string, newExpireDate: string) => {
    setLoading(true);
    try {
      // 更新缺口表格中的证书到期日期
      setGapRecords(prev => prev.map(record => {
        if (record.id === certId) {
          return {
            ...record,
            expireDate: newExpireDate,
            status: 'compliant'
          };
        }
        return record;
      }));

      // 更新合规状态
      setComplianceStatus(prev => {
        const newMissingCount = prev.missingCount - 1;
        const newCompliantCount = prev.compliantCount + 1;
        const total = newCompliantCount + newMissingCount;
        return {
          compliantCount: newCompliantCount,
          missingCount: newMissingCount,
          compliantRate: Math.round((newCompliantCount / total) * 100)
        };
      });

      // 触发证书续期事件
      eventBusRef.current.emit('certRenewed', certId, newExpireDate);
      
      message.success('证书续期成功');
    } catch (error) {
      console.error('Certificate renewal failed:', error);
      message.error('证书续期失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 生成整改单
  const generateCorrectiveAction = useCallback(() => {
    setLoading(true);
    try {
      // 这里应该调用AI服务生成整改单草稿
      console.log('Generating corrective action for gaps:', gapRecords);
      
      // 打开预警抽屉
      setWarningDrawerVisible(true);
      
      message.success('整改单生成成功');
    } catch (error) {
      console.error('Failed to generate corrective action:', error);
      message.error('生成整改单失败');
    } finally {
      setLoading(false);
    }
  }, [gapRecords]);

  // 重置状态
  const resetState = useCallback(() => {
    setSelectedPart(null);
    setDetailDrawerVisible(false);
    setWarningDrawerVisible(false);
    setCompareCart([]);
  }, []);

  // 返回所有状态和方法
  return {
    // 状态
    complianceStatus,
    gapRecords,
    selectedPart,
    compareCart,
    detailDrawerVisible,
    warningDrawerVisible,
    loading,
    
    // 方法
    initializeData,
    registerEventListener,
    handlePartSelect,
    handleDetailDrawerClose,
    handleAddToCompareCart,
    handleRemoveFromCompareCart,
    handleExportRequested,
    handleCertificateRenew,
    generateCorrectiveAction,
    resetState
  };
};

export default useComplianceDashboard;