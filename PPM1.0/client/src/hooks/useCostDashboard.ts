import { useState, useCallback, useEffect, useRef } from 'react';

// 定义所有需要的类型
interface CostTreeNode {
  id: string;
  name: string;
  value: number;
  targetValue?: number;
  type: 'assembly' | 'part' | 'material';
  children?: CostTreeNode[];
  percentage?: number;
  drift?: number;
}

export interface CostDriftData {
  id: string;
  partName: string;
  partType: string;
  position: string;
  baselineCost: number;
  currentCost: number;
  driftAmount: number;
  driftPercentage: number;
  lifecycle: string;
  supplier: string;
  [key: string]: any;
}
interface PartDetail {
  id: string;
  position: string;
  partName: string;
  currentCost: number;
  targetCost: number;
  lifecycle: string;
  supplier: string;
  thumbnailUrl: string;
  description: string;
  material: string;
  weight: number;
  unit: string;
  leadTime: number;
  moq: number;
}

interface CostHistoryData {
  month: string;
  cost: number;
}

interface SupplierData {
  name: string;
  value: number;
  percentage: number;
}

interface CostDownSuggestion {
  alternatives: Array<{
    id: string;
    name: string;
    currentCost: number;
    alternativeCost: number;
    saving: number;
    feasibility: string;
  }>;
  priceNegotiations: Array<{
    id: string;
    supplier: string;
    currentPrice: number;
    negotiationPrice: number;
    saving: number;
    confidence: string;
  }>;
  lifecycleWarnings: Array<{
    id: string;
    message: string;
    riskLevel: string;
    recommendation: string;
  }>;
}

// 事件类型定义
type EventType = 'costUpdated' | 'costDownApplied' | 'exportRequested' | 'partSelected' | 'refreshData' | 'addToComparison';

type EventHandler = (...args: any[]) => void;

// 事件总线类
class EventBus {
  private handlers: Map<EventType, Set<EventHandler>> = new Map();

  // 注册事件监听
  on(event: EventType, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  // 移除事件监听
  off(event: EventType, handler: EventHandler): void {
    if (this.handlers.has(event)) {
      this.handlers.get(event)!.delete(handler);
    }
  }

  // 触发事件
  emit(event: EventType, ...args: any[]): void {
    if (this.handlers.has(event)) {
      this.handlers.get(event)!.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // 清理所有事件
  clear(): void {
    this.handlers.clear();
  }
}

// 移除全局事件总线实例，每个组件将使用自己的事件总线实例

// 定义状态类型
interface CostDashboardState {
  // 成本概览数据
  currentCost: number;
  targetCost: number;
  costTrend: Array<{ month: string; cost: number }>;
  
  // 预警数据
  warnings: Array<{
    type: 'overTarget' | 'lifecycleRisk' | 'supplierConcentration';
    level: 'high' | 'medium' | 'low';
    message: string;
    count: number;
  }>;
  
  // 成本树数据
  costTreeData: CostTreeNode[];
  
  // 成本漂移数据
  costDriftData: CostDriftData[];
  
  // 选中的数据
  selectedPart: PartDetail | null;
  selectedRowKeys: React.Key[];
  selectedRows: CostDriftData[];
  
  // 抽屉状态
  detailDrawerVisible: boolean;
  costDownDrawerVisible: boolean;
  costDownPartName: string;
  
  // 成本详情数据
  costHistoryData: CostHistoryData[];
  supplierData: SupplierData[];
  
  // 降本建议数据
  costDownSuggestions: CostDownSuggestion;
  
  // 加载状态
  loading: boolean;
  error: string | null;
}

// 初始状态
const initialState: CostDashboardState = {
  currentCost: 0,
  targetCost: 0,
  costTrend: [],
  warnings: [],
  costTreeData: [],
  costDriftData: [],
  selectedPart: null,
  selectedRowKeys: [],
  selectedRows: [],
  detailDrawerVisible: false,
  costDownDrawerVisible: false,
  costDownPartName: '',
  costHistoryData: [],
  supplierData: [],
  costDownSuggestions: {
    alternatives: [],
    priceNegotiations: [],
    lifecycleWarnings: []
  },
  loading: false,
  error: null
};

// 状态管理Hook
export const useCostDashboard = () => {
  const [state, setState] = useState<CostDashboardState>(initialState);
  const eventBusRef = useRef<EventBus>(new EventBus());
  const isMountedRef = useRef(true);

  // 确保组件卸载时清理事件监听
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      eventBusRef.current.clear();
    };
  }, []);

  // 状态更新方法
  const updateState = useCallback((updates: Partial<CostDashboardState>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // 事件监听方法 - 使用组件独立的事件总线
  const on = useCallback(<T extends EventType>(
    event: T,
    handler: EventHandler
  ) => {
    // 仅为当前组件实例注册事件监听
    eventBusRef.current.on(event, handler);
    
    // 返回清理函数
    return () => {
      eventBusRef.current.off(event, handler);
    };
  }, []);

  // 事件触发方法 - 使用组件独立的事件总线
  const emit = useCallback(<T extends EventType>(
    event: T,
    ...args: any[]
  ) => {
    // 仅触发当前组件实例的事件
    eventBusRef.current.emit(event, ...args);
    
    // 记录事件触发日志（便于调试）
    // 使用安全的环境检测方式
    if (typeof window !== 'undefined' && !window.location.href.includes('production')) {
      console.debug(`Event emitted: ${event}`, args);
    }
  }, []);

  // 辅助方法：一次性事件监听
  const once = useCallback(<T extends EventType>(
    event: T,
    handler: EventHandler
  ) => {
    const onceHandler = (...args: any[]) => {
      handler(...args);
      // 自动取消监听
      eventBusRef.current.off(event, onceHandler);
    };
    
    // 注册事件
    eventBusRef.current.on(event, onceHandler);
    
    // 返回清理函数
    return () => {
      eventBusRef.current.off(event, onceHandler);
    };
  }, []);

  // 成本数据更新方法
  const updateCostData = useCallback((currentCost: number, targetCost: number) => {
    updateState({ currentCost, targetCost });
    emit('costUpdated', { currentCost, targetCost });
  }, [updateState, emit]);

  // 选择零件方法 - 支持部分属性的对象类型
  const selectPart = useCallback((part: Partial<CostDriftData> | Partial<PartDetail> | null) => {
    console.log('🔍 selectPart函数被调用，参数类型:', typeof part, '参数内容:', part);
    
    try {
      // 关闭抽屉逻辑 - 直接设置状态，不触发任何事件
      if (!part) {
        console.log('🚫 selectPart: 空参数，关闭抽屉');
        setState({
          ...state,
          selectedPart: null,
          detailDrawerVisible: false
        });
        return;
      }
      
      // 创建一个完整的PartDetail对象
      const partDetail: PartDetail = {
        id: part.id || 'test-id',
        position: part.position || 'TEST-POS',
        partName: part.partName || 'Test Part',
        currentCost: part.currentCost || 100,
        targetCost: 'targetCost' in part && part.targetCost !== undefined ? part.targetCost : ('baselineCost' in part && part.baselineCost !== undefined ? part.baselineCost : 90),
        lifecycle: part.lifecycle || 'Active',
        supplier: part.supplier || 'Test Supplier',
        thumbnailUrl: '',
        description: '',
        material: '',
        weight: 0,
        unit: '',
        leadTime: 0,
        moq: 0
      };
      
      console.log('📋 转换后的partDetail:', partDetail);
      
      // 直接更新状态，不使用函数式更新以避免闭包问题
      setState({
        ...state,
        selectedPart: partDetail,
        detailDrawerVisible: true
      });
      
      console.log('✅ 状态更新完成，抽屉已打开');
      
      // 只在打开抽屉时触发事件，避免事件循环
      console.log('📢 触发partSelected事件');
      emit('partSelected', partDetail);
      
    } catch (error) {
      console.error('❌ selectPart函数执行出错:', error);
      console.error('❌ 错误堆栈:', error.stack);
      // 出错时重置状态
      setState({
        ...state,
        selectedPart: null,
        detailDrawerVisible: false
      });
    }
  }, [state, emit]); // 直接依赖state，避免函数式更新的闭包问题

  // 打开降本建议抽屉
  const openCostDownDrawer = useCallback((partName: string, triggerSource: 'bulb' | 'button' = 'bulb') => {
    updateState({ 
      costDownDrawerVisible: true, 
      costDownPartName: partName 
    });
      // 记录触发来源，便于后续统计或功能扩展
  }, [updateState]);

  // 关闭降本建议抽屉
  const closeCostDownDrawer = useCallback(() => {
    updateState({ costDownDrawerVisible: false });
  }, [updateState]);

  // 采纳降本建议
  const acceptCostDownSuggestion = useCallback((suggestionType: 'alternative' | 'priceNegotiation' | 'lifecycleWarning', suggestionId: string) => {
    if (suggestionType === 'alternative') {
      const alternative = state.costDownSuggestions.alternatives.find(a => a.id === suggestionId);
      if (alternative) {
        // 1. 计算新成本
        const costReduction = alternative.currentCost - alternative.alternativeCost;
        const newCost = state.currentCost - costReduction;
        
        // 2. 更新BOM结构和零件数据
        const updateTreeNode = (node: CostTreeNode): CostTreeNode => {
          if (node.children) {
            return {
              ...node,
              children: node.children.map(updateTreeNode),
              value: node.children.reduce((sum, child) => sum + child.value, 0)
            };
          }
          return node;
        };
        
        // 更新成本树数据
        const updatedCostTreeData = state.costTreeData.map(updateTreeNode);
        
        // 3. 更新成本漂移数据 - 完全替换零件信息
        const updatedCostDriftData = state.costDriftData.map(drift => {
          if (drift.partName === state.costDownPartName) {
            // 完全替换零件信息，保留必要的原始字段，同时更新所有替代料相关字段
            return {
              ...drift,
              // 更新成本相关字段
              currentCost: alternative.alternativeCost,
              driftAmount: alternative.alternativeCost - drift.baselineCost,
              driftPercentage: ((alternative.alternativeCost - drift.baselineCost) / drift.baselineCost) * 100,
              // 更新零件标识字段
              partName: alternative.name,
              // 如果替代料有供应商和生命周期信息，也进行更新
              // 替代料对象没有 supplier 字段，保持原值即可
              supplier: drift.supplier,
              // 替代料对象没有 lifecycle 字段，保持原值
              lifecycle: drift.lifecycle,
              // 添加标记表明这是替代料
              isAlternative: true,
              originalPartName: drift.partName,
              alternativeId: alternative.id
            };
          }
          return drift;
        });
        
        // 4. 更新选中零件信息（如果有）
        const updatedSelectedPart = state.selectedPart && state.selectedPart.partName === state.costDownPartName
          ? {
              ...state.selectedPart,
              // 完全更新选中零件的信息
              currentCost: alternative.alternativeCost,
              partName: alternative.name,
              // 如果有其他字段，也进行更新
              supplier: state.selectedPart.supplier,
              lifecycle: state.selectedPart.lifecycle
            }
          : state.selectedPart;
        
        // 5. 更新成本趋势数据
        const updatedCostTrend = [...state.costTrend];
        if (updatedCostTrend.length > 0) {
          updatedCostTrend[updatedCostTrend.length - 1] = {
            ...updatedCostTrend[updatedCostTrend.length - 1],
            cost: newCost
          };
        }
        
        // 6. 更新成本历史数据
        const updatedCostHistoryData = [...state.costHistoryData];
        if (updatedCostHistoryData.length > 0) {
          // 添加新的成本历史记录点
          const currentMonth = new Date().toISOString().slice(0, 7);
          const lastEntry = updatedCostHistoryData[updatedCostHistoryData.length - 1];
          if (lastEntry.month === currentMonth) {
            // 如果当月已有记录，更新它
            updatedCostHistoryData[updatedCostHistoryData.length - 1] = {
              ...lastEntry,
              cost: newCost
            };
          } else {
            // 否则添加新记录
            updatedCostHistoryData.push({ month: currentMonth, cost: newCost });
          }
        }
        
        // 一次性更新所有相关状态
        updateState({
          currentCost: newCost,
          targetCost: state.targetCost, // 保持目标成本不变
          costTreeData: updatedCostTreeData,
          costDriftData: updatedCostDriftData,
          selectedPart: updatedSelectedPart,
          costTrend: updatedCostTrend,
          costHistoryData: updatedCostHistoryData,
          // 更新成本降本零件名称为替代料名称
          costDownPartName: alternative.name
        });
        
        // 7. 触发成本更新事件，包含更多详细信息
        emit('costUpdated', { 
          newCost, 
          suggestionId, 
          alternativePartName: alternative.name,
          costReduction,
          partName: state.costDownPartName,
          replacedWith: alternative.name
        });
        
        // 8. 触发成本降本应用事件
        emit('costDownApplied', { 
          suggestionType, 
          suggestionId,
          partName: state.costDownPartName,
          alternativePartName: alternative.name,
          costReduction
        });
        
        // 9. 触发刷新数据事件，确保所有组件获取最新数据
        setTimeout(() => {
          emit('refreshData');
        }, 100);
      }
    }
  }, [state, emit, updateState]);

  // 更新选中行
  const updateSelectedRows = useCallback((rowKeys: React.Key[], rows: CostDriftData[]) => {
    updateState({ selectedRowKeys: rowKeys, selectedRows: rows });
  }, [updateState]);

  // 刷新数据
  const refreshData = useCallback(() => {
    updateState({ loading: true, error: null });
    emit('refreshData');
    // 模拟数据刷新完成
    setTimeout(() => {
      if (isMountedRef.current) {
        updateState({ loading: false });
      }
    }, 1000);
  }, [updateState, emit]);

  // 导出数据
  const exportData = useCallback((exportType: 'drift' | 'detail' | 'suggestion') => {
    emit('exportRequested', { type: exportType });
  }, [emit]);

  // 加载成本详情数据
  const loadPartDetail = useCallback(async (partId: string) => {
    updateState({ loading: true });
    try {
      // 这里应该是实际的API调用，现在模拟异步操作并返回完整的PartDetail对象
      // const response = await api.getPartDetail(partId);
      // updateState({ ...response, loading: false });
      
      // 模拟加载完成并设置完整的零件详情
      setTimeout(() => {
        if (isMountedRef.current) {
          // 模拟完整的零件详情数据
          const mockPartDetail: PartDetail = {
            id: partId,
            position: '位置示例',
            partName: '零件名称示例',
            currentCost: 1000,
            targetCost: 900,
            lifecycle: '量产',
            supplier: '供应商示例',
            thumbnailUrl: '', // 空字符串作为默认值
            description: '零件描述示例',
            material: '材料示例',
            weight: 5.5,
            unit: 'kg',
            leadTime: 15,
            moq: 100
          };
          
          // 模拟成本历史数据
          const mockCostHistoryData: CostHistoryData[] = [
            { month: '2023-01', cost: 1000 },
            { month: '2023-02', cost: 1050 },
            { month: '2023-03', cost: 1020 },
            { month: '2023-04', cost: 1000 },
            { month: '2023-05', cost: 980 },
            { month: '2023-06', cost: 1000 }
          ];
          
          // 模拟供应商数据
          const mockSupplierData: SupplierData[] = [
            { name: '供应商A', value: 600, percentage: 60 },
            { name: '供应商B', value: 300, percentage: 30 },
            { name: '供应商C', value: 100, percentage: 10 }
          ];
          
          updateState({ 
            loading: false,
            selectedPart: mockPartDetail,
            costHistoryData: mockCostHistoryData,
            supplierData: mockSupplierData
          });
        }
      }, 500);
    } catch (error) {
      if (isMountedRef.current) {
        updateState({ 
          loading: false, 
          error: error instanceof Error ? error.message : '加载失败' 
        });
      }
    }
  }, [updateState]);

  // 获取当前成本状态
  const getCostStatus = useCallback(() => {
    const { currentCost, targetCost } = state;
    const diffPercent = targetCost > 0 ? ((currentCost - targetCost) / targetCost) * 100 : 0;
    
    if (diffPercent > 5) {
      return { status: 'over', percent: diffPercent, color: 'red' };
    } else if (diffPercent < -5) {
      return { status: 'under', percent: Math.abs(diffPercent), color: 'green' };
    } else {
      return { status: 'normal', percent: Math.abs(diffPercent), color: 'orange' };
    }
  }, [state.currentCost, state.targetCost]);

  // 暴露的状态和方法
  return {
    // 状态
    state,
    
    // 事件相关
    on,
    emit,
    
    // 数据更新方法
    updateCostData,
    selectPart,
    updateSelectedRows,
    refreshData,
    
    // 抽屉控制
    openCostDownDrawer,
    closeCostDownDrawer,
    
    // 降本建议
    acceptCostDownSuggestion,
    // 更新降本建议数据
    updateCostDownSuggestions: useCallback((suggestions: CostDownSuggestion) => {
      updateState({ costDownSuggestions: suggestions });
    }, [updateState]),
    
    // 数据加载
    loadPartDetail,
    
    // 导出
    exportData,
    
    // 辅助方法
    getCostStatus,
  };
};

// 导出事件类型供其他组件使用
export type { EventType, EventHandler };