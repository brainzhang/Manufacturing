/**
 * 差异同步管理钩子
 * 负责处理差异数据的状态管理、同步逻辑和事件处理
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { message } from 'antd';
import type { DiffData } from '../components/DiffTable';
import type { DiffType } from '../components/DiffTree';

// 差异节点接口
export interface DiffNode {
  key: string;
  title: string;
  diffType?: DiffType;
  level?: string;
  children?: DiffNode[];
}

// 雷达图数据点接口
export interface RadarDataPoint {
  subject: string;
  A: number; // 本地值
  B: number; // SAP值
}

// 修复建议接口
export interface FixSuggestion {
  type: string;
  description: string;
  estimatedCost: number;
  estimatedTime: number;
  riskLevel: string;
  reason: string;
}

/**
 * 同步状态类型定义
 * - idle: 空闲状态，等待操作
 * - syncing: 正在进行同步操作
 * - success: 同步操作成功完成
 * - error: 同步操作失败
 */
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/**
 * KPI统计数据接口
 * 用于展示差异管理的关键绩效指标
 */
export interface KPIStats {
  totalDiffs: number;           // 总差异数
  trend: number;               // 差异趋势（百分比）：正值表示差异增加，负值表示差异减少
  highLevel: number;           // 高优先级差异数
  mediumLevel: number;         // 中优先级差异数
  lowLevel: number;            // 低优先级差异数
  costDrift: number;           // 成本偏差总额：正值表示成本增加，负值表示成本减少
  costTrend: number;           // 成本偏差趋势（百分比）
  complianceGaps: number;      // 合规缺口数：存在合规问题的差异项数量
  complianceTrend: number;     // 合规缺口趋势（百分比）
  fixableDiffs: number;        // 可修复差异数量：可通过自动修复解决的差异数
}

/**
 * 同步进度接口
 * 跟踪同步操作的详细进度信息
 */
export interface SyncProgress {
  current: number;             // 当前进度值（0-100）
  status: SyncStatus;          // 当前状态
  message?: string;            // 状态消息
  startTime?: number;          // 开始时间戳
  endTime?: number;            // 结束时间戳
}

/**
 * 差异同步钩子返回值接口
 */
export interface UseDiffSyncReturn {
  diffData: DiffData[];                                // 差异数据列表
  treeData: DiffNode[];                                // 树形数据结构
  radarData: RadarDataPoint[];                         // 雷达图数据
  kpiStats: KPIStats;                                  // KPI统计数据
  selectedDiffIds: string[];                           // 选中的差异项ID列表
  syncStatus: SyncStatus;                              // 同步状态
  syncProgress: SyncProgress;                          // 同步进度信息
  syncableCount: number;                               // 可同步数量
  setSelectedDiffIds: (ids: string[]) => void;         // 设置选中的差异项ID
  fixDiff: (id: string) => Promise<void>;              // 修复单个差异项
  ignoreDiff: (id: string) => Promise<void>;           // 忽略单个差异项
  fixSelectedDiffs: () => Promise<void>;               // 修复选中的差异项
  ignoreSelectedDiffs: () => Promise<void>;            // 忽略选中的差异项
  oneClickSync: () => Promise<void>;                   // 一键同步功能
  getFixSuggestion: (id: string) => Promise<FixSuggestion | undefined>; // 获取修复建议
  refreshData: () => Promise<void>;                    // 刷新数据
}

/**
 * 事件总线类
 * 用于组件间通信
 */
class EventBus {
  private events: Map<string, Set<(...args: any[]) => void>>;

  constructor() {
    this.events = new Map();
  }

  /**
   * 注册事件监听器
   */
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)?.add(callback);
  }

  /**
   * 移除事件监听器
   */
  off(event: string, callback: (...args: any[]) => void): void {
    if (this.events.has(event)) {
      this.events.get(event)?.delete(callback);
      if (this.events.get(event)?.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event: string, ...args: any[]): void {
    if (this.events.has(event)) {
      this.events.get(event)?.forEach(callback => callback(...args));
    }
  }
}

/**
 * 差异同步管理钩子
 * 提供差异数据的状态管理、同步逻辑和事件处理功能
 */
const useDiffSync = (): UseDiffSyncReturn => {
  // 状态定义
  const [diffData, setDiffData] = useState<DiffData[]>([]);
  const [treeData, setTreeData] = useState<DiffNode[]>([]);
  const [radarData, setRadarData] = useState<RadarDataPoint[]>([]);
  const [kpiStats, setKpiStats] = useState<KPIStats>({
    totalDiffs: 0,
    trend: 0,
    highLevel: 0,
    mediumLevel: 0,
    lowLevel: 0,
    costDrift: 0,
    costTrend: 0,
    complianceGaps: 0,
    complianceTrend: 0,
    fixableDiffs: 0,
  });
  const [selectedDiffIds, setSelectedDiffIds] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    current: 0,
    status: 'idle',
  });
  const [syncableCount, setSyncableCount] = useState<number>(0);

  // 引用定义
  const eventBus = new EventBus();
  const eventListenersRef = useRef<Map<string, (...args: any[]) => void>>(new Map());
  const sseRef = useRef<EventSource | null>(null);

  // 初始化数据函数
  const initializeData = useCallback(() => {
    // 生成雷达图数据
    const mockRadarData: RadarDataPoint[] = [
      { subject: '结构', A: 90, B: 70 },
      { subject: '成本', A: 85, B: 60 },
      { subject: '生命周期', A: 95, B: 80 },
      { subject: '合规', A: 88, B: 85 },
    ];
    
    setRadarData(mockRadarData);

    // 生成详细的模拟差异数据
    const mockDiffData: DiffData[] = [
      {
        id: 'diff-001',
        position: '主CPU',
        partName: 'CPU散热器',
        localValue: '铝制散热器',
        sapValue: '铜制散热器',
        diffType: 'COMPLIANCE',
        level: 'HIGH',
        deltaCost: 15,
        deltaCompliance: '增加热阻测试报告, Missing EMI认证'
      },
      {
        id: 'diff-002',
        position: '电源模块',
        partName: '电源适配器',
        localValue: '65W适配器',
        sapValue: '90W适配器',
        diffType: 'COMPLIANCE',
        level: 'MEDIUM',
        deltaCost: 25,
        deltaCompliance: '符合能效标准'
      },
      {
        id: 'diff-003',
        position: '内存槽1',
        partName: '内存模块',
        localValue: '8GB DDR4-3200',
        sapValue: '16GB DDR4-3200',
        diffType: 'COMPLIANCE',
        level: 'LOW',
        deltaCost: 45,
        deltaCompliance: '符合RoHS标准'
      },
      {
        id: 'diff-004',
        position: '存储设备',
        partName: '硬盘',
        localValue: '512GB SSD',
        sapValue: '1TB SSD',
        diffType: 'COMPLIANCE',
        level: 'MEDIUM',
        deltaCost: 80,
        deltaCompliance: '符合数据安全标准'
      },
      {
        id: 'diff-005',
        position: '显示设备',
        partName: '显示屏',
        localValue: '14英寸 FHD 60Hz',
        sapValue: '15.6英寸 FHD 120Hz',
        diffType: 'COMPLIANCE',
        level: 'HIGH',
        deltaCost: 120,
        deltaCompliance: '符合视觉舒适度标准, Missing防蓝光认证'
      },
    ];

    setDiffData(mockDiffData);

    // 生成树形结构数据
    const mockTreeData: DiffNode[] = [
      {
        key: '1',
        title: '内部组件',
        children: [
          {
            key: '1.1',
            title: '处理器系统',
            children: [
              {
                key: '1.1.1',
                title: '散热系统',
                children: [
                  {
                    key: '1.1.1.1',
                    title: 'CPU散热器',
                    children: [
                      {
                        key: 'diff-001',
                        title: '铝制散热器',
                        diffType: 'COMPLIANCE',
                        level: 'HIGH'
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            key: '1.2',
            title: '电源系统',
            children: [
              {
                key: '1.2.1',
                title: '适配器',
                children: [
                  {
                    key: 'diff-002',
                    title: '65W适配器',
                    diffType: 'COMPLIANCE',
                    level: 'MEDIUM'
                  }
                ]
              }
            ]
          },
          {
            key: '1.3',
            title: '内存系统',
            children: [
              {
                key: 'diff-003',
                title: '8GB DDR4-3200',
                diffType: 'COMPLIANCE',
                level: 'LOW'
              }
            ]
          },
          {
            key: '1.4',
            title: '存储系统',
            children: [
              {
                key: 'diff-004',
                title: '512GB SSD',
                diffType: 'CAPACITY' as DiffType,
                level: 'MEDIUM'
              }
            ]
          }
        ]
      },
      {
        key: '2',
        title: '外部组件',
        children: [
          {
            key: '2.1',
            title: '显示屏',
            children: [
              {
                key: 'diff-005',
                title: '14英寸 FHD 60Hz',
                diffType: 'COMPLIANCE' as DiffType,
                level: 'HIGH'
              }
            ]
          }
        ]
      }
    ];

    setTreeData(mockTreeData);

    // 计算KPI统计
    const highCount = mockDiffData.filter(d => d.level === 'HIGH').length;
    const mediumCount = mockDiffData.filter(d => d.level === 'MEDIUM').length;
    const lowCount = mockDiffData.filter(d => d.level === 'LOW').length;
    const totalCostDrift = mockDiffData.reduce((sum, d) => sum + d.deltaCost, 0);
    const complianceGapCount = mockDiffData.filter(d => typeof d.deltaCompliance === 'string' && d.deltaCompliance.includes('Missing')).length;

    setKpiStats({
      totalDiffs: mockDiffData.length,
      trend: -12,
      highLevel: highCount,
      mediumLevel: mediumCount,
      lowLevel: lowCount,
      costDrift: totalCostDrift,
      costTrend: 3,
      complianceGaps: complianceGapCount,
      complianceTrend: -2,
      fixableDiffs: mockDiffData.filter(d => 'fixable' in d && d.fixable).length,
    });

    // 计算可同步数量（HIGH级别的差异）
    setSyncableCount(highCount);

    // 触发差异加载完成事件
    eventBus.emit('diffLoaded');
  }, [eventBus]);

  /**
   * 刷新差异数据
   * 重新获取最新的差异信息和统计数据
   */
  const refreshData = useCallback(async (): Promise<void> => {
    try {
      // 执行数据初始化
      initializeData();
      message.success('数据已刷新');
      
      // 触发数据刷新完成事件
      eventBus.emit('dataRefreshed');
    } catch (error) {
      console.error('Error refreshing data:', error);
      message.error('数据刷新失败');
    }
  }, [initializeData, eventBus]);

  /**
   * 修复单个差异项
   */
  const fixDiff = useCallback(async (id: string): Promise<void> => {
    try {
      // 更新同步状态
      setSyncStatus('syncing');
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新差异数据
      setDiffData(prev => prev.map(item => 
        item.id === id ? { ...item, fixable: false } : item
      ));
      
      // 更新同步状态
      setSyncStatus('success');
      message.success('差异项修复成功');
      
      // 触发修复完成事件
      eventBus.emit('fixApplied', { id });
    } catch (error) {
      console.error('Error fixing diff:', error);
      setSyncStatus('error');
      message.error('差异项修复失败');
    } finally {
      // 重置同步状态
      setTimeout(() => setSyncStatus('idle'), 2000);
    }
  }, [eventBus]);

  /**
   * 忽略单个差异项
   */
  const ignoreDiff = useCallback(async (id: string): Promise<void> => {
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 更新差异数据
      setDiffData(prev => prev.filter(item => item.id !== id));
      message.success('差异项已忽略');
      
      // 触发忽略完成事件
      eventBus.emit('ignoreApplied', { id });
    } catch (error) {
      console.error('Error ignoring diff:', error);
      message.error('差异项忽略失败');
    }
  }, [eventBus]);

  /**
   * 修复选中的差异项
   */
  const fixSelectedDiffs = useCallback(async (): Promise<void> => {
    try {
      if (selectedDiffIds.length === 0) {
        message.warning('请先选择要修复的差异项');
        return;
      }

      // 更新同步状态和进度
      setSyncStatus('syncing');
      setSyncProgress({
        current: 0,
        status: 'syncing',
        message: `开始修复 ${selectedDiffIds.length} 个差异项`,
        startTime: Date.now(),
      });

      // 模拟修复过程
      for (let i = 0; i < selectedDiffIds.length; i++) {
        // 模拟每个差异项的修复延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // 更新进度
        const progress = Math.round(((i + 1) / selectedDiffIds.length) * 100);
        setSyncProgress(prev => ({
          ...prev,
          current: progress,
          message: `正在修复: ${i + 1}/${selectedDiffIds.length}`,
        }));

        // 更新差异数据
        setDiffData(prev => prev.map(item => 
          item.id === selectedDiffIds[i] ? { ...item, fixable: false } : item
        ));
      }

      // 完成修复
      setSyncStatus('success');
      setSyncProgress(prev => ({
        ...prev,
        current: 100,
        status: 'success',
        message: '修复完成',
        endTime: Date.now(),
      }));

      message.success(`已成功修复 ${selectedDiffIds.length} 个差异项`);
      
      // 清除选中状态
      setSelectedDiffIds([]);
    } catch (error) {
      console.error('Error fixing selected diffs:', error);
      setSyncStatus('error');
      setSyncProgress(prev => ({
        ...prev,
        status: 'error',
        message: '修复失败',
      }));
      message.error('修复选中差异项失败');
    } finally {
      // 重置状态
      setTimeout(() => {
        setSyncStatus('idle');
        setSyncProgress({ current: 0, status: 'idle' });
      }, 3000);
    }
  }, [selectedDiffIds]);

  /**
   * 忽略选中的差异项
   */
  const ignoreSelectedDiffs = useCallback(async (): Promise<void> => {
    try {
      if (selectedDiffIds.length === 0) {
        message.warning('请先选择要忽略的差异项');
        return;
      }

      // 更新差异数据
      setDiffData(prev => prev.filter(item => !selectedDiffIds.includes(item.id)));
      message.success(`已忽略 ${selectedDiffIds.length} 个差异项`);
      
      // 清除选中状态
      setSelectedDiffIds([]);
    } catch (error) {
      console.error('Error ignoring selected diffs:', error);
      message.error('忽略选中差异项失败');
    }
  }, [selectedDiffIds]);

  /**
   * 一键同步功能
   */
  const oneClickSync = useCallback(async (): Promise<void> => {
    try {
      // 更新同步状态
      setSyncStatus('syncing');
      setSyncProgress({
        current: 0,
        status: 'syncing',
        message: '开始一键同步',
        startTime: Date.now(),
      });

      // 模拟同步过程
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setSyncProgress(prev => ({
          ...prev,
          current: progress,
          message: `同步中: ${progress}%`,
        }));
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // 完成同步
          setSyncStatus('success');
          setSyncProgress(prev => ({
            ...prev,
            current: 100,
            status: 'success',
            message: '同步完成',
            endTime: Date.now(),
          }));
          
          message.success('一键同步成功');
          
          // 刷新数据
          refreshData();
          
          // 重置状态
          setTimeout(() => {
            setSyncStatus('idle');
            setSyncProgress({ current: 0, status: 'idle' });
          }, 3000);
        }
      }, 300);
    } catch (error) {
      console.error('Error in one-click sync:', error);
      setSyncStatus('error');
      setSyncProgress({
        current: 0,
        status: 'error',
        message: '同步失败',
      });
      message.error('一键同步失败');
    }
  }, [refreshData]);

  /**
   * 获取修复建议
   */
  const getFixSuggestion = useCallback(async (id: string): Promise<FixSuggestion | undefined> => {
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // 返回模拟的修复建议
      const mockSuggestions: Record<string, FixSuggestion> = {
        'diff-001': {
          type: 'material-change',
          description: '将铜制散热器改回铝制散热器，或增加导热硅脂优化散热性能',
          estimatedCost: 15,
          estimatedTime: 0.5,
          riskLevel: 'low',
          reason: '基于材料成本和散热性能的平衡建议',
        },
        'diff-002': {
          type: 'power-adjustment',
          description: '保持65W适配器，但优化电源管理策略',
          estimatedCost: 25,
          estimatedTime: 1,
          riskLevel: 'medium',
          reason: '降低功耗同时维持系统性能',
        },
        'diff-003': {
          type: 'capacity-reduction',
          description: '保持8GB内存配置',
          estimatedCost: 45,
          estimatedTime: 0.25,
          riskLevel: 'low',
          reason: '基于历史数据和使用模式分析',
        },
        'diff-004': {
          type: 'capacity-reduction',
          description: '保持512GB SSD配置',
          estimatedCost: 80,
          estimatedTime: 0.5,
          riskLevel: 'low',
          reason: '根据存储使用数据分析',
        },
        'diff-005': {
          type: 'display-replacement',
          description: '改回14英寸60Hz显示屏',
          estimatedCost: 120,
          estimatedTime: 1.5,
          riskLevel: 'medium',
          reason: '基于历史数据和规则的修复建议',
        },
      };
      
      return mockSuggestions[id];
    } catch (error) {
      console.error('Error getting fix suggestion:', error);
      return undefined;
    }
  }, []);

  // 设置SSE连接（包含自动刷新功能）
  const setupSSEWithRefresh = useCallback(() => {
    // 这里是模拟实现，实际项目中应该连接到真实的SSE端点
    // const sse = new EventSource('/api/sync/events');
    // sseRef.current = sse;

    // 模拟定期刷新数据（每30秒）
    const refreshInterval = setInterval(() => {
      refreshData();
    }, 30000);

    // 返回清理函数
    return () => {
      // if (sseRef.current) {
      //   sseRef.current.close();
      //   sseRef.current = null;
      // }
      clearInterval(refreshInterval);
    };
  }, [refreshData]);

  // 初始化
  useEffect(() => {
    initializeData();
    
    // 注册事件监听器
    const handleFixApplied = (data: { id: string }) => {
      console.log('Fix applied to diff:', data.id);
    };
    
    const handleIgnoreApplied = (data: { id: string }) => {
      console.log('Ignore applied to diff:', data.id);
    };
    
    const handleSyncCompleted = () => {
      console.log('Sync operation completed');
      refreshData();
    };
    
    eventBus.on('fixApplied', handleFixApplied);
    eventBus.on('ignoreApplied', handleIgnoreApplied);
    eventBus.on('syncCompleted', handleSyncCompleted);
    
    // 保存事件监听器引用以便清理
    eventListenersRef.current.set('fixApplied', handleFixApplied);
    eventListenersRef.current.set('ignoreApplied', handleIgnoreApplied);
    eventListenersRef.current.set('syncCompleted', handleSyncCompleted);
    
    // 设置SSE连接
    const cleanupSSE = setupSSEWithRefresh();
    
    return () => {
      // 清理SSE连接
      cleanupSSE();
      
      // 清理事件监听器
      if (eventListenersRef.current && eventListenersRef.current.size > 0) {
        eventListenersRef.current.forEach((callback, event) => {
          eventBus.off(event, callback);
        });
        eventListenersRef.current.clear();
      }
    };
  }, [initializeData, refreshData, setupSSEWithRefresh, eventBus]);

  // 返回差异同步管理的所有状态和方法
  return {
    diffData,
    treeData,
    radarData,
    kpiStats,
    selectedDiffIds,
    syncStatus,
    syncProgress,
    syncableCount,
    setSelectedDiffIds,
    fixDiff,
    ignoreDiff,
    fixSelectedDiffs,
    ignoreSelectedDiffs,
    oneClickSync,
    getFixSuggestion,
    refreshData
  };
};

export default useDiffSync;