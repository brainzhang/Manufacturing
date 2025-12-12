import { useState, useCallback } from 'react';

// 替代料节点数据结构
export interface AltNode {
  id: string;               // UUID
  parentId: string;         // L6主料ID
  group: 'A' | 'B' | 'C';   // 替代组
  partId: string;           // 替代料PN
  partName: string;         // 零件名称
  qty: number;              // 用量（默认=主料）
  cost: number;             // 当前成本
  lifecycle: 'Active' | 'PhaseOut' | 'Obs';
  compliance: string[];     // RoHS/CE/FCC…
  fffScore: number;         // Form-Fit-Function 匹配度(0-100)
  isDefault: boolean;       // 是否默认首选
  status: 'Active' | 'Deprecated'; // 业务状态
}

// 主料节点数据结构
export interface MainPart {
  id: string;
  partNumber: string;
  name: string;
  cost: number;
  altCount: number;
}

// KPI数据结构
interface KPI {
  totalAltParts: number;
  defaultRate: number;
  avgCostReduction: number;
  complianceRiskCount: number;
  trends: {
    totalAltParts: string;
    defaultRate: string;
    avgCostReduction: string;
    complianceRiskCount: string;
  };
}

// 简单的事件处理器，避免直接操作事件总线实例
class EventHandler {
  private static listeners: Map<string, Set<Function>> = new Map();

  static subscribe(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  static emit(event: string, data: any): void {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.forEach(callback => callback(data));
  }

  static unsubscribe(event: string, callback: Function): void {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.delete(callback);
  }
}

const useAltLogic = () => {
  const [altParts, setAltParts] = useState<AltNode[]>([]);
  const [selectedMainPart, setSelectedMainPart] = useState<MainPart | null>(null);
  const [selectedRows, setSelectedRows] = useState<AltNode[]>([]);
  const [loading, setLoading] = useState(false);

  // 初始化模拟数据
  const initializeMockData = useCallback(() => {
    console.log('开始初始化模拟替代料数据...');
    
    // 模拟替代料数据（与MainTree中的主料ID匹配）
    const mockAltParts: AltNode[] = [
      // CPU-MAIN-001的替代料
      {
        id: 'alt-001',
        parentId: 'main-001',
        group: 'A',
        partId: 'U1A',
        partName: 'i5-1335U',
        qty: 1,
        cost: 3200,
        lifecycle: 'Active',
        compliance: ['RoHS', 'CE', 'FCC'],
        fffScore: 98,
        isDefault: true,
        status: 'Active'
      },
      {
        id: 'alt-002',
        parentId: 'main-001',
        group: 'A',
        partId: 'U1B',
        partName: 'i5-1245U',
        qty: 1,
        cost: 2800,
        lifecycle: 'Active',
        compliance: ['RoHS', 'CE'],
        fffScore: 95,
        isDefault: false,
        status: 'Active'
      },
      {
        id: 'alt-003',
        parentId: 'main-001',
        group: 'A',
        partId: 'U1C',
        partName: 'i3-1315U',
        qty: 1,
        cost: 2400,
        lifecycle: 'PhaseOut',
        compliance: ['RoHS'],
        fffScore: 88,
        isDefault: false,
        status: 'Active'
      },
      // RAM-MAIN-001的替代料
      {
        id: 'alt-004',
        parentId: 'main-002',
        group: 'A',
        partId: 'R1A',
        partName: '16GB DDR4-3200',
        qty: 1,
        cost: 750,
        lifecycle: 'Active',
        compliance: ['RoHS'],
        fffScore: 100,
        isDefault: true,
        status: 'Active'
      },
      {
        id: 'alt-005',
        parentId: 'main-002',
        group: 'A',
        partId: 'R1B',
        partName: '16GB DDR4-2666',
        qty: 1,
        cost: 650,
        lifecycle: 'Active',
        compliance: ['RoHS'],
        fffScore: 95,
        isDefault: false,
        status: 'Active'
      },
      // SSD-MAIN-001的替代料
      {
        id: 'alt-006',
        parentId: 'main-003',
        group: 'A',
        partId: 'S1A',
        partName: '512GB NVMe Gen4',
        qty: 1,
        cost: 420,
        lifecycle: 'Active',
        compliance: ['RoHS'],
        fffScore: 100,
        isDefault: true,
        status: 'Active'
      }
    ];
    
    console.log('生成的模拟替代料数据:', mockAltParts);
    console.log('替代料总数:', mockAltParts.length);
    
    // 按主料ID分组统计替代料数量
    const altCountByMain = mockAltParts.reduce((acc, alt) => {
      acc[alt.parentId] = (acc[alt.parentId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('各主料替代料数量:', altCountByMain);
    
    setAltParts(mockAltParts);
    console.log('替代料数据设置成功');
  }, []);

  // 设置默认替代料
  const setDefault = useCallback((altId: string) => {
    setLoading(true);
    
    try {
      // 1. 查找当前替代料
      const currentAlt = altParts.find(part => part.id === altId);
      if (!currentAlt) {
        throw new Error('替代料不存在');
      }

      // 2. 更新替代料状态
      const updatedAltParts = altParts.map(part => {
        // 同组其他行 isDefault = false
        if (part.parentId === currentAlt.parentId && part.group === currentAlt.group) {
          return { ...part, isDefault: part.id === altId };
        }
        return part;
      });
      
      setAltParts(updatedAltParts);
      
      // 3. 触发成本更新事件
      EventHandler.emit('costUpdated', {
        parentId: currentAlt.parentId,
        newCost: currentAlt.cost
      });
      
      console.log(`已将 ${currentAlt.partName} 设为默认替代料`);
      
    } catch (error) {
      console.error('设置默认替代料失败:', error);
    } finally {
      setLoading(false);
    }
  }, [altParts]);

  // 弃用替代料
  const deprecateAlt = useCallback((altId: string) => {
    setLoading(true);
    
    try {
      // 1. 查找要弃用的替代料
      const altToDeprecate = altParts.find(part => part.id === altId);
      if (!altToDeprecate) {
        throw new Error('替代料不存在');
      }

      // 2. 更新替代料状态（逻辑删除）
      const updatedAltParts = altParts.map(part => {
        if (part.id === altId) {
          return { ...part, status: 'Deprecated', qty: 0 };
        }
        return part;
      });
      
      setAltParts(updatedAltParts as AltNode[]);
      
      // 3. 推送SAP更新Usage
      console.log('推送SAP更新:', {
        partId: altToDeprecate.partId,
        usage: 0
      });
      
      // 4. 触发用量更新事件
      EventHandler.emit('usageUpdated', {
        partId: altToDeprecate.partId,
        usage: 0
      });
      
      // 5. 如果被弃用的是默认替代料，自动提升下一个Active为默认
      if (altToDeprecate.isDefault) {
        const nextActiveAlt = updatedAltParts.find(part => 
          part.parentId === altToDeprecate.parentId && 
          part.group === altToDeprecate.group && 
          part.status === 'Active' && 
          part.id !== altId
        );
        
        if (nextActiveAlt) {
          setDefault(nextActiveAlt.id);
        }
      }
      
      console.log(`已弃用替代料: ${altToDeprecate.partName}`);
      
    } catch (error) {
      console.error('弃用替代料失败:', error);
    } finally {
      setLoading(false);
    }
  }, [altParts, setDefault]);

  // 加入BOM
  const addToBOM = useCallback((altId: string, targetBomId: string, qty: number = 1) => {
    setLoading(true);
    
    try {
      // 1. 查找要加入的替代料
      const altToAdd = altParts.find(part => part.id === altId);
      if (!altToAdd) {
        throw new Error('替代料不存在');
      }
      
      // 2. 创建L7替代料行
      const newBOMItem = {
        bomId: targetBomId,
        altNode: altToAdd,
        qty,
        position: `${selectedMainPart?.partNumber || ''}-${altToAdd.group}`
      };
      
      // 3. 模拟API调用
      console.log('调用API加入BOM:', newBOMItem);
      
      // 4. 触发项目添加事件
      EventHandler.emit('itemAdded', newBOMItem);
      
      console.log(`已将 ${altToAdd.partName} 加入BOM: ${targetBomId}`);
      
      return true;
      
    } catch (error) {
      console.error('加入BOM失败:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [altParts, selectedMainPart]);

  // 批量操作
  const batchSetDefault = useCallback((altIds: string[]) => {
    if (altIds.length > 0) {
      setDefault(altIds[0]);
    }
  }, [setDefault]);

  const batchDeprecate = useCallback((altIds: string[]) => {
    setLoading(true);
    
    try {
      // 直接更新状态，避免多次调用setState导致的类型问题
      const updatedAltParts = altParts.map(part => {
        if (altIds.includes(part.id)) {
          return { ...part, status: 'Deprecated' as const, qty: 0 };
        }
        return part;
      });
      
      setAltParts(updatedAltParts);
      
      // 处理默认替代料的自动提升
      altIds.forEach(altId => {
        const deprecatedAlt = altParts.find(p => p.id === altId);
        if (deprecatedAlt && deprecatedAlt.isDefault) {
          const nextActiveAlt = updatedAltParts.find(part => 
            part.parentId === deprecatedAlt.parentId && 
            part.group === deprecatedAlt.group && 
            part.status === 'Active' && 
            !altIds.includes(part.id)
          );
          
          if (nextActiveAlt) {
            setTimeout(() => setDefault(nextActiveAlt.id), 0);
          }
        }
      });
      
      console.log(`已批量弃用 ${altIds.length} 个替代料`);
    } catch (error) {
      console.error('批量弃用替代料失败:', error);
    } finally {
      setLoading(false);
    }
  }, [altParts, setDefault]);

  const batchAddToBOM = useCallback((altIds: string[], targetBomId: string, qty: number = 1) => {
    const results = altIds.map(altId => addToBOM(altId, targetBomId, qty));
    return results.every(result => result === true);
  }, [addToBOM]);

  // 选择行管理
  const handleSelectRow = useCallback((altPart: AltNode, selected: boolean) => {
    setSelectedRows(prev => {
      if (selected) {
        return [...prev, altPart];
      } else {
        return prev.filter(part => part.id !== altPart.id);
      }
    });
  }, []);

  // 获取KPI数据
  const getKPI = useCallback((): KPI => {
    return {
      totalAltParts: 12450,
      defaultRate: 78,
      avgCostReduction: -320,
      complianceRiskCount: 23,
      trends: {
        totalAltParts: '+5%',
        defaultRate: '+2%',
        avgCostReduction: '-8%',
        complianceRiskCount: '-3'
      }
    };
  }, []);

  // 事件订阅管理
  const subscribeToEvents = useCallback((eventHandlers: { [key: string]: Function }) => {
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      EventHandler.subscribe(event, handler);
    });

    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        EventHandler.unsubscribe(event, handler);
      });
    };
  }, []);

  return {
    // 状态
    altParts,
    selectedMainPart,
    setSelectedMainPart,
    selectedRows,
    setSelectedRows,
    loading,
    
    // 初始化
    initializeMockData,
    
    // 核心功能
    setDefault,
    deprecateAlt,
    addToBOM,
    
    // 批量操作
    batchSetDefault,
    batchDeprecate,
    batchAddToBOM,
    
    // 行选择
    handleSelectRow,
    
    // 数据获取
    getKPI,
    
    // 事件管理
    subscribeToEvents
  };
};

export default useAltLogic;