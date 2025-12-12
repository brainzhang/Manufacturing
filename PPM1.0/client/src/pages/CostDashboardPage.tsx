import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Row, Col, Card, Button, Drawer, Typography, Space, Badge, List, message, Table, Tag, Empty } from 'antd';
import * as XLSX from 'xlsx';
import { DownloadOutlined, BarChartOutlined, BulbOutlined, FileExcelOutlined, ExclamationCircleOutlined, DeleteOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, PieChartOutlined, CarOutlined } from '@ant-design/icons';
import { Line, Pie } from '@ant-design/plots';

// 导入子组件
import CostTree from '../components/cost/CostTree';
import CostDriftTable from '../components/cost/CostDriftTable';
// 移除导入
import CostDownDrawer from '../components/cost/CostDownDrawer';
import CostRingChart from '../components/cost/CostRingChart';
import CostTrendCard from '../components/cost/CostTrendCard';

// 导入状态管理hooks和mock数据
import { useCostDashboard, CostDriftData } from '../hooks/useCostDashboard';
import { mockDashboardData, generateMockCostDownSuggestions, generateMockPartDetail } from '../components/cost/mockData';

// 成本趋势卡片组件 - 直接使用我们创建的组件

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const CostDashboardPage = () => {
  // 1. 首先声明所有的状态
  const [trendType, setTrendType] = useState<'product' | 'main' | 'alternative'>('product');
  const [comparisonParts, setComparisonParts] = useState<any[]>([]);
  const [selectedRowsForAIAnalysis, setSelectedRowsForAIAnalysis] = useState<any[]>([]);
  const [AICostDownDrawerVisible, setAICostDownDrawerVisible] = useState(false);
  // 存储对比车中的零件
  const [comparisonCart, setComparisonCart] = useState<CostDriftData[]>([]);
  // 对比车抽屉状态
  const [comparisonDrawerVisible, setComparisonDrawerVisible] = useState(false);


  // 2. 然后使用自定义hooks，从hook中获取所有需要的状态和方法
  const { 
    state, 
    emit,
    on,
    updateCostData,
    selectPart,
    updateSelectedRows,
    openCostDownDrawer,
    closeCostDownDrawer,
    updateCostDownSuggestions
  } = useCostDashboard();

  // 状态监听 - 增强版
  useEffect(() => {
    console.log('%c📊 状态监听更新 📊', 'background: #222; color: #bada55; padding: 2px 6px; border-radius: 4px;');
    console.log('- detailDrawerVisible:', state.detailDrawerVisible);
    console.log('- selectedPart:', state.selectedPart ? { id: state.selectedPart.id, partName: state.selectedPart.partName } : null);
    // 添加时间戳以确认状态更新的时序
    console.log('- 时间戳:', new Date().toLocaleTimeString());
  }, [state.detailDrawerVisible, state.selectedPart]);
  
  // 从state中解构需要的状态，避免重复声明
  const { detailDrawerVisible, costDownDrawerVisible, selectedRows, selectedPart } = state;

  // 3. 最后使用useEffect，确保Hooks调用顺序一致
  useEffect(() => {
    // 初始化成本数据
    console.log('组件加载，准备更新成本数据');
    updateCostData(mockDashboardData.currentCost, mockDashboardData.targetCost);
    console.log('成本数据更新完成');
    

  }, [updateCostData, selectPart, state.detailDrawerVisible, state.selectedPart]); // 增加依赖项以确保测试效果
  
  // 监听降本建议采纳事件
  useEffect(() => {
    const handleCostDownApplied = () => {
      // 更新成本数据
      const newCurrentCost = mockDashboardData.currentCost * 0.95;
      updateCostData(newCurrentCost, mockDashboardData.targetCost);
      // 触发成本更新事件，传递正确的数据结构
      emit('costUpdated', { currentCost: newCurrentCost, targetCost: mockDashboardData.targetCost });
    };
    
    // 使用on方法注册事件监听
    const cleanup = on('costDownApplied', handleCostDownApplied);
    
    return () => {
      // 清理事件监听
      cleanup();
    };
  }, [on, emit, updateCostData]);

  // 打开成本详情抽屉 - 增强调试
    const handleOpenDetail = (part: any) => {
     try {
      console.log('%c🗂️ handleOpenDetail被调用 🗂️', 'background: #9b59b6; color: white; padding: 2px 6px; border-radius: 4px;');
      console.log('- 零件数据:', part);
      console.log('- selectPart函数存在:', typeof selectPart === 'function');
      console.log('- 调用前state.detailDrawerVisible:', state.detailDrawerVisible);
      
      if (part) {
       console.log('%c▶️ part参数存在，尝试调用selectPart ▶️', 'background: #27ae60; color: white; padding: 2px 6px; border-radius: 4px;');
       
       // 使用generateMockPartDetail生成更真实的零件详情数据
       const partId = part.id || `PART-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
       const partPosition = part.position || '';
       const partName = part.partName || '未知零件';
       
       // 生成更真实的零件详情数据
       const mockPartDetail = generateMockPartDetail(partId, partPosition, partName);
       
       // 创建一个标准化的零件数据对象，使用真实业务值
       const normalizedPart = {
         ...mockPartDetail,
         id: partId,
         position: partPosition,
         partName: partName,
         currentCost: part.currentCost || mockPartDetail.currentCost,
         targetCost: part.targetCost || part.baselineCost || mockPartDetail.targetCost,
         lifecycle: part.lifecycle || mockPartDetail.lifecycle,
         supplier: part.supplier || mockPartDetail.supplier,
         description: mockPartDetail.description,
         material: mockPartDetail.material
       };
       console.log('- 标准化后的零件数据:', normalizedPart);
       
       try {
         console.log('%c▶️ 调用selectPart方法，零件数据存在 ▶️', 'background: #27ae60; color: white; padding: 2px 6px; border-radius: 4px;');
          selectPart(normalizedPart as unknown as CostDriftData); // 使用hook提供的方法来控制抽屉显示
         console.log('%c✅ selectPart调用完成 ✅', 'background: #27ae60; color: white; padding: 2px 6px; border-radius: 4px;');
         // 在下一个渲染周期检查状态变化
         setTimeout(() => {
           console.log('- selectPart调用后state.detailDrawerVisible:', state.detailDrawerVisible);
         }, 0);
       } catch (error) {
         console.error('%c❌ selectPart调用出错 ❌', 'background: #e74c3c; color: white; padding: 2px 6px; border-radius: 4px;');
         console.error('- 错误详情:', error);
       }
      } else {
        console.warn('%c⚠️ 警告: 尝试打开详情抽屉，但零件数据为空 ⚠️', 'background: #f39c12; color: white; padding: 2px 6px; border-radius: 4px;');
      }
     } catch (error) {
       console.error('%c❌ 打开详情抽屉失败 ❌', 'background: #e74c3c; color: white; padding: 2px 6px; border-radius: 4px;');
       console.error('- 错误堆栈:', error);
     }
  };
  
  // 打开降本抽屉
  const handleOpenCostDown = (part) => {
    if (part) {
      console.log('打开降本抽屉:', part.partName);
      selectPart(part); // 先选中零件以确保有选中状态
      openCostDownDrawer(part.partName); // 使用hook提供的方法，传入零件名称
      
      // 同时更新AICostDownDrawerVisible状态，确保降本抽屉能正确显示
      setSelectedRowsForAIAnalysis([part]);
      
      // 为该零件生成降本建议数据
      if (typeof updateCostDownSuggestions === 'function') {
        const mockSuggestions = generateMockCostDownSuggestions(part.partName || '零件');
        updateCostDownSuggestions(mockSuggestions);
      }
      
      setAICostDownDrawerVisible(true);
    } else {
      console.log('尝试打开降本抽屉，但没有选择零件');
    }
  };
  


  // 处理替换操作 - 打开降本抽屉（灯泡抽屉）
  const handleReplacePart = (part) => {
    console.log('替换按钮点击事件触发，零件信息:', part);
    if (part) {
      console.log('处理替换零件:', part.partName);
      // 实现与降本建议按钮相同的逻辑，打开灯泡抽屉
      selectPart(part); // 先选中零件以确保有选中状态
      openCostDownDrawer(part.partName); // 使用hook提供的方法，传入零件名称
      
      // 同时更新AICostDownDrawerVisible状态，确保降本抽屉能正确显示
      setSelectedRowsForAIAnalysis([part]);
      
      // 为该零件生成降本建议数据
      if (typeof updateCostDownSuggestions === 'function') {
        const mockSuggestions = generateMockCostDownSuggestions(part.partName || '零件');
        updateCostDownSuggestions(mockSuggestions);
      }
      
      setAICostDownDrawerVisible(true);
    } else {
      console.log('尝试处理替换零件，但没有提供零件信息');
    }
  };

  // 导出漂移表 (Excel格式) - 支持批量导出
  const handleExportDriftTable = useCallback((rows?: any[]) => {
    try {
      // 决定要导出的行：如果传入了特定行，则导出这些行；否则导出所有选中的行
      const rowsToExport = rows && rows.length > 0 ? rows : selectedRows;
      
      // 检查是否有数据可导出
      if (!rowsToExport || rowsToExport.length === 0) {
        message.warning(rows ? '没有可导出的数据' : '请先选择要导出的数据行');
        return;
      }
      
      // XLSX库已在文件顶部导入
      
      // 使用xlsx库创建工作簿和工作表
      const wb = XLSX.utils.book_new();
      
      // 准备导出数据，只包含需要的字段
      const exportData = rowsToExport.map(row => ({
        '零件编号': row.partNumber || row.id || '',
        '零件名称': row.partName || '',
        '位号': row.position || '',
        '供应商': row.supplier || '',
        '当前成本': row.currentCost || 0,
        '目标成本': row.targetCost || 0,
        '成本差异': (row.currentCost || 0) - (row.targetCost || 0),
        '生命周期': row.lifecycle || ''
      }));
      
      // 创建工作表
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // 设置列宽
      const colWidths = [
        { wch: 15 }, // 零件编号
        { wch: 25 }, // 零件名称
        { wch: 10 }, // 位号
        { wch: 20 }, // 供应商
        { wch: 12 }, // 当前成本
        { wch: 12 }, // 目标成本
        { wch: 12 }, // 成本差异
        { wch: 12 }  // 生命周期
      ];
      ws['!cols'] = colWidths;
      
      // 添加工作表到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '成本漂移数据');
      
      // 生成文件名 - 避免中文路径问题
      const timestamp = new Date().getTime();
      const fileName = `cost_drift_export_${timestamp}.xlsx`;
      
      // 导出文件
      XLSX.writeFile(wb, fileName);
      
      // 显示成功消息
      message.success(`成功导出${rowsToExport.length}条数据`);
      
      console.log('导出漂移表Excel', rowsToExport);
      emit('exportRequested', { type: 'drift', rows: rowsToExport });
    } catch (error) {
      console.error('导出数据失败', error);
      message.error('导出失败，请稍后重试');
    }
  }, [emit, selectedRows]);

  // 导出完整的成本报表
  const handleExportFullReport = useCallback(async () => {
    console.log('导出完整成本报表');
    try {
      // XLSX库已在文件顶部导入
      
      // 确保成本漂移数据存在
      if (!mockDashboardData.costDriftData || mockDashboardData.costDriftData.length === 0) {
        message.warning('暂无数据可导出');
        return;
      }
      
      // 创建工作簿
      const wb = XLSX.utils.book_new();
      
      // 1. 创建成本概览工作表
      const overviewData = [
        ['成本概览', '', '', '', '', ''],
        ['当前总成本', '¥' + mockDashboardData.currentCost.toFixed(2), '', '', '', ''],
        ['目标成本', '¥' + mockDashboardData.targetCost.toFixed(2), '', '', '', ''],
        ['成本差异', '¥' + (mockDashboardData.currentCost - mockDashboardData.targetCost).toFixed(2), '', '', '', ''],
        ['差异百分比', ((mockDashboardData.currentCost - mockDashboardData.targetCost) / mockDashboardData.targetCost * 100).toFixed(2) + '%', '', '', '', ''],
        ['', '', '', '', '', ''],
        ['生成时间', new Date().toLocaleString('zh-CN'), '', '', '', '']
      ];
      const overviewWs = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, overviewWs, '成本概览');
      
      // 2. 创建成本漂移工作表
      const driftData = mockDashboardData.costDriftData.map(item => ({
        '零件编号': item.id || '',
        '零件名称': item.partName || '',
        '位号': item.position || '',
        '当前成本': item.currentCost || 0,
        '目标成本': item.targetCost || 0,
        '成本差异': (item.currentCost || 0) - (item.targetCost || 0),
        '差异百分比': (((item.currentCost || 0) - (item.targetCost || 0)) / (item.targetCost || 1) * 100).toFixed(2) + '%',
        '生命周期': item.lifecycle || '',
        '供应商': item.supplier || ''
      }));
      const driftWs = XLSX.utils.json_to_sheet(driftData);
      
      // 设置列宽
      const driftColWidths = [
        { wch: 12 }, // 零件编号
        { wch: 20 }, // 零件名称
        { wch: 10 }, // 位号
        { wch: 12 }, // 当前成本
        { wch: 12 }, // 目标成本
        { wch: 12 }, // 成本差异
        { wch: 15 }, // 差异百分比
        { wch: 15 }, // 生命周期
        { wch: 15 }  // 供应商
      ];
      driftWs['!cols'] = driftColWidths;
      
      XLSX.utils.book_append_sheet(wb, driftWs, '成本漂移数据');
      
      // 3. 创建成本趋势工作表（如果有数据）
      if (mockDashboardData.costTrend && mockDashboardData.costTrend.length > 0) {
        const trendData = mockDashboardData.costTrend.map(item => ({
          '月份': item.month || '',
          '成本': item.cost || 0
        }));
        const trendWs = XLSX.utils.json_to_sheet(trendData);
        
        // 设置列宽
        const trendColWidths = [
          { wch: 15 }, // 月份
          { wch: 15 }  // 成本
        ];
        trendWs['!cols'] = trendColWidths;
        
        XLSX.utils.book_append_sheet(wb, trendWs, '成本趋势');
      }
      
      // 生成文件名，避免中文路径问题
      const fileName = `cost_report_${Date.now()}.xlsx`;
      
      // 下载文件
      XLSX.writeFile(wb, fileName);
      
      // 显示成功消息
      message.success('成本报表导出成功');
      
      // 触发导出事件
      emit('exportRequested', { type: 'fullReport', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('导出报表出错:', error);
      // 提供更详细的错误信息
      if (error.message.includes('Cannot find module')) {
        message.error('导出模块加载失败，请检查依赖');
      } else {
        message.error(`导出失败: ${error.message}`);
      }
    }
  }, [emit]);

  // 生成降本建议 (AI生成ECN草稿)
  const handleGenerateCostDownSuggestions = useCallback((rows?: CostDriftData[]) => {
    // 如果传入了rows参数，使用传入的rows，否则使用组件中的selectedRows
    const targetRows = rows && rows.length > 0 ? rows : selectedRows;
    console.log('为选中的零件生成降本建议', targetRows);
    setSelectedRowsForAIAnalysis(targetRows);
    
    // 为每个选中的零件生成对应的降本建议数据
    const partName = targetRows[0]?.partName || '';
    if (partName && typeof updateCostDownSuggestions === 'function') {
      // 生成降本建议数据
      const mockSuggestions = generateMockCostDownSuggestions(partName);
      
      // 确保生成的数据完整且格式正确
      const alternatives = mockSuggestions.alternatives || [];
      const priceNegotiations = mockSuggestions.priceNegotiations || [];
      const lifecycleWarnings = mockSuggestions.lifecycleWarnings || [];
      
      // 更新降本建议数据，确保数据结构与接口定义一致
      updateCostDownSuggestions({
        alternatives: alternatives.map((alt: any) => ({
          id: alt.id || `alt-${Math.random().toString(36).substr(2, 9)}`,
          name: alt.name || '替代料',
          currentCost: alt.currentCost || 0,
          alternativeCost: alt.alternativeCost || 0,
          saving: (alt.currentCost || 0) - (alt.alternativeCost || 0),
          feasibility: alt.compatibility || 'high'
        })),
        priceNegotiations: priceNegotiations.map((pn: any) => ({
          id: `pn-${pn.supplier || Math.random().toString(36).substr(2, 9)}`,
          supplier: pn.supplier || '未知供应商',
          currentPrice: pn.currentPrice || 0,
          negotiationPrice: pn.historicalLow || 0,
          saving: (pn.currentPrice || 0) - (pn.historicalLow || 0),
          confidence: 'medium'
        })),
        lifecycleWarnings: lifecycleWarnings.map((lw: any) => ({
          id: lw.partId || `lw-${Math.random().toString(36).substr(2, 9)}`,
          message: lw.suggestion || '生命周期风险警告',
          riskLevel: lw.riskLevel || 'medium',
          recommendation: lw.suggestion || '建议尽快评估替代方案'
        }))
      });
      
      console.log('降本建议数据已更新，准备显示抽屉');
    }
    
    setAICostDownDrawerVisible(true);
    emit('exportRequested', { type: 'suggestion', rows: targetRows });
    
  
  }, [emit, selectedRows, setSelectedRowsForAIAnalysis, updateCostDownSuggestions]);

  // 对比车状态管理
  const [compareCart, setCompareCart] = useState<CostDriftData[]>([]);
  const [showCompareView, setShowCompareView] = useState(false);
  const [selectedCompareItems, setSelectedCompareItems] = useState<React.Key[]>([]);
  
  // 处理加入对比车
  const handleAddToCompareCart = useCallback((rows?: CostDriftData[]) => {
    console.log('将选中的零件加入对比车', rows || selectedRows);
    
    // 使用传入的行或组件内部的selectedRows
    const rowsToAdd = rows || selectedRows;
    
    // 检查是否有要添加的零件
    if (!rowsToAdd || rowsToAdd.length === 0) {
      console.warn('没有选中的零件');
      message.warning('请先选择要加入对比车的零件');
      return;
    }
    
    // 检查对比车容量限制
    if (compareCart.length >= 4) {
      message.warning('对比车最多只能添加4个零件');
      return;
    }
    
    // 添加新选中的零件到对比车，避免重复
    const newCompareCart = [...compareCart];
    let addedCount = 0;
    
    rowsToAdd.forEach(row => {
      // 确保row和row.id存在，并且对比车未满，并且不重复
      if (row && row.id && newCompareCart.length < 4 && !newCompareCart.some(item => item.id === row.id)) {
        newCompareCart.push(row);
        addedCount++;
      }
    });
    
    // 更新对比车
    setCompareCart(newCompareCart);
    
    // 显示提示，使用实际添加的数量
    if (addedCount > 0) {
      message.success(`已将${addedCount}个零件加入对比车，对比车中共有${newCompareCart.length}/4个零件`);
    } else {
      message.warning('所选零件已在对比车中或对比车已满');
    }
  }, [selectedRows, compareCart]);

  // 清除对比车
  const handleClearCompareCart = useCallback(() => {
    setCompareCart([]);
    setSelectedCompareItems([]);
    message.success('已清空对比车');
  }, []);

  // 移除选中的对比项
  const handleRemoveSelectedCompareItems = useCallback(() => {
    if (selectedCompareItems.length === 0) {
      message.warning('请先选择要移除的零件');
      return;
    }
    const newCompareCart = compareCart.filter(item => !selectedCompareItems.includes(item.id));
    setCompareCart(newCompareCart);
    setSelectedCompareItems([]);
    message.success(`已移除${selectedCompareItems.length}个零件`);
  }, [compareCart, selectedCompareItems]);

  // 切换对比车视图
  const toggleCompareView = useCallback(() => {
    setShowCompareView(!showCompareView);
    setSelectedCompareItems([]);
  }, [showCompareView]);

  // 对比车项选择变化
  const handleCompareItemSelectionChange = useCallback((keys: React.Key[]) => {
    setSelectedCompareItems(keys);
  }, []);

  // 取消选择
  const handleCancelSelection = useCallback(() => {
    updateSelectedRows([], []);
    updateSelectedRows([], []);
  }, [updateSelectedRows]);

  // 表格行选择处理
  const handleRowSelect = (rows) => {
    console.log('选中的行:', rows);
    // 只调用一次updateSelectedRows方法，避免重复调用导致状态混乱
    updateSelectedRows([], rows); // 第一个参数为rowKeys（此处不需要），第二个参数是选中的行数据
    setSelectedRowsForAIAnalysis(rows);
  };

  // 添加到对比车
  const handleAddToComparison = useCallback((selectedRows: CostDriftData[]) => {
    console.log('添加到对比车:', selectedRows.length);
    // 去重添加零件到对比车
    setComparisonCart(prevCart => {
      const existingIds = new Set(prevCart.map(item => item.id));
      const newItems = selectedRows.filter(item => !existingIds.has(item.id));
      return [...prevCart, ...newItems];
    });
    emit('addToComparison', selectedRows);
    message.success(`成功添加${selectedRows.length}个零件到对比车`);
  }, [emit]);

  // 查看详细对比
  const handleViewComparison = useCallback(() => {
    console.log('查看详细对比:', comparisonCart.length);
    setComparisonDrawerVisible(true);
  }, [comparisonCart]);

  // 从对比车移除零件
  const handleRemoveFromComparison = useCallback((id: string) => {
    setComparisonCart(prevCart => prevCart.filter(item => item.id !== id));
  }, []);

  // 清空对比车
  const handleClearComparison = useCallback(() => {
    setComparisonCart([]);
  }, []);

  return (
    <Layout className="min-h-screen">

      
      <Header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <Title level={4} className="mb-0"></Title>
        </div>
        <div>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportFullReport}>导出报表</Button>
        </div>
      </Header>

      <Content className="p-6">
        {/* 顶部KPI看板区域 */}
        <div className="mb-6">
          <Row gutter={[16, 16]}>
            {/* 成本圆环图 - 使用我们的自定义组件 */}
            <Col xs={24} sm={8}>
              <Card className="h-full">
                <CostRingChart 
                  currentCost={mockDashboardData.currentCost} 
                  targetCost={mockDashboardData.targetCost} 
                />
              </Card>
            </Col>

            {/* 趋势卡片 - 使用我们的自定义组件 */}
            <Col xs={24} sm={8}>
              <CostTrendCard
                trendData={{
                  trendType,
                  onTrendTypeChange: setTrendType,
                  // 根据trendType动态选择对应的趋势数据
                  costTrend: trendType === 'product' ? mockDashboardData.productFamilyTrend : 
                             trendType === 'main' ? mockDashboardData.mainMaterialTrend : 
                             mockDashboardData.alternativeMaterialTrend
                }}
              />
            </Col>

            {/* 预警卡片 */}
            <Col xs={24} sm={8}>
              <Card title="预警信息" className="h-full">
                {mockDashboardData.warnings && mockDashboardData.warnings.length > 0 ? (
                  <List
                    className="mb-0"
                    dataSource={mockDashboardData.warnings}
                    renderItem={(warning, index) => {
                      // 创建一个统一的下钻处理函数 - 增强调试
                      const handleDrillDown = () => {
                        try {
                          console.log('%c🔽 handleDrillDown被调用 🔽', 'background: #3498db; color: white; padding: 2px 6px; border-radius: 4px;');
                          console.log('- 预警类型:', warning.type);
                          console.log('- 预警数据:', warning);
                          // 确保有成本漂移数据
                          if (mockDashboardData.costDriftData && mockDashboardData.costDriftData.length > 0) {
                            console.log('%c▶️ 调用handleOpenDetail，使用第一个零件数据 ▶️', 'background: #27ae60; color: white; padding: 2px 6px; border-radius: 4px;');
                            handleOpenDetail(mockDashboardData.costDriftData[0]);
                          } else {
                            console.warn('⚠️ 无成本漂移数据，无法打开详情 ⚠️');
                          }
                        } catch (error) {
                          console.error('%c❌ 下钻处理出错 ❌', 'background: #e74c3c; color: white; padding: 2px 6px; border-radius: 4px;');
                          console.error('- 错误详情:', error);
                        }
                      };
                      
                      return (
                        <List.Item
                          key={index}
                          actions={[
                            <Button 
                              key="view" 
                              type="link" 
                              size="small"
                              onClick={handleDrillDown}
                            >
                              下钻
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <div 
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px 0' }}
                                onClick={handleDrillDown}
                              >
                                <Badge 
                                  status={warning.level === 'high' ? 'error' : warning.level === 'medium' ? 'warning' : 'default'} 
                                  text={warning.message}
                                />
                              </div>
                            }
                            description={
                              <div 
                                style={{ cursor: 'pointer', padding: '4px 0' }}
                                onClick={handleDrillDown}
                              >
                                数量: {warning.count}
                              </div>
                            }
                          />
                        </List.Item>
                      );
                    }}
                  />
                ) : (
                  <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
                    <Text>暂无预警信息</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </div>

        {/* 对比车区域 - 始终显示 */}
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="对比车" className="mb-4">
                {comparisonCart.length > 0 ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Space>
                        <Text>已添加 {comparisonCart.length} 个零件</Text>
                        <Badge count={comparisonCart.length} showZero style={{ backgroundColor: '#1890ff' }}>
                          零件数量
                        </Badge>
                      </Space>
                      <Space>
                        <Button onClick={handleClearComparison}>
                          清空
                        </Button>
                        <Button type="primary" onClick={handleViewComparison}>
                          查看详细对比
                        </Button>
                      </Space>
                    </div>
                    <List
                      size="small"
                      bordered
                      dataSource={comparisonCart}
                      renderItem={(item) => (
                        <List.Item
                          actions={[
                            <Button
                              size="small"
                              danger
                              onClick={() => handleRemoveFromComparison(item.id)}
                            >
                              移除
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <Space>
                                <span>{item.partName}</span>
                                <Tag>{item.position}</Tag>
                              </Space>
                            }
                            description={
                              <Space>
                                <Text>当前成本: ¥{item.currentCost?.toLocaleString() || 'N/A'}</Text>
                                <Text>目标成本: ¥{item.targetCost?.toLocaleString() || 'N/A'}</Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center py-6">
                    <Space direction="vertical" align="center">
                      <CarOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                      <Text>对比车为空，请从成本漂移列表中添加零件</Text>
                    </Space>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

        {/* 主内容区域 */}
        <Row gutter={[16, 16]}>
          {/* 左侧成本树 */}
          <Col xs={24} md={5}>
            <Card title="成本树" className="h-full">
              <div className="h-[600px] overflow-auto">
                <CostTree 
                  treeData={mockDashboardData.costTreeData} 
                  onNodeClick={handleOpenDetail}
                  onNodeRightClick={handleOpenCostDown}
                />
              </div>
            </Card>
          </Col>

          {/* 中部漂移表格 */}
          <Col xs={24} md={19}>
            <Card title="成本漂移TOP排名" className="h-full">
              <CostDriftTable 
                data={mockDashboardData.costDriftData} 
                onRowClick={handleOpenDetail}
                onSelectionChange={(keys, rows) => handleRowSelect(rows)}
                onCostDownClick={handleOpenCostDown}
                onReplaceClick={handleReplacePart} // 使用独立的替换处理函数
                onExportDriftTable={handleExportDriftTable}
                onAddToComparison={handleAddToComparison}
                onGenerateCostSuggestions={(selectedRows) => {
                  console.log('生成降本建议:', selectedRows.length);
                  setAICostDownDrawerVisible(true);
                }}
              />
            </Card>
          </Col>
        </Row>

        {/* 批量操作栏 */}
        {selectedRows.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded shadow-sm border border-gray-200">
            <Space>
              <Text strong>已选择 {selectedRows.length} 项</Text>
              <Button type="primary" icon={<FileExcelOutlined />} onClick={() => handleExportDriftTable()}>
                导出漂移表
              </Button>
              <Button icon={<BarChartOutlined />} onClick={() => handleGenerateCostDownSuggestions()}>
                生成降本建议
              </Button>

              <Button 
                icon={<CarOutlined />} 
                onClick={() => handleAddToCompareCart()}
                disabled={compareCart.length >= 4}
              >
                加入对比车 ({compareCart.length}/4)
              </Button>
              <Button danger type="default" onClick={handleCancelSelection}>
                取消选择
              </Button>
              {compareCart.length > 0 && (
                <div className="ant-space css-dev-only-do-not-override-11mmrso ant-space-horizontal ant-space-align-center ant-space-gap-row-large ant-space-gap-col-large w-full">
                  <div className="ant-space-item">
                    <span className="ant-badge css-dev-only-do-not-override-11mmrso">
                      <span className="ant-typography css-dev-only-do-not-override-11mmrso">
                        <strong>已选择 {compareCart.length} 个零件</strong>
                      </span>
                      <sup data-show="true" className="ant-scroll-number ant-badge-count" title={String(compareCart.length)} style={{backgroundColor: 'rgb(24, 144, 255)'}}>
                        <bdi>
                          <span className="ant-scroll-number-only" style={{transition: 'none'}}>
                            <span className="ant-scroll-number-only-unit current">{compareCart.length}</span>
                          </span>
                        </bdi>
                      </sup>
                    </span>
                  </div>
                  <div className="ant-space-item">
                    <div className="ml-auto">
                      <div className="ant-space css-dev-only-do-not-override-11mmrso ant-space-horizontal ant-space-align-center ant-space-gap-row-middle ant-space-gap-col-middle">
                        <div className="ant-space-item">
                          <Button 
                            type="default" 
                            icon={<BulbOutlined />} 
                            onClick={() => handleGenerateCostDownSuggestions()}
                          >
                            生成降本建议
                          </Button>
                        </div>
                        <div className="ant-space-item">
                          <Button 
                            icon={<CarOutlined />} 
                            onClick={() => handleAddToCompareCart()}
                            disabled={compareCart.length >= 4}
                          >
                            加入对比车
                          </Button>
                        </div>
                        <div className="ant-space-item">
                          <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={toggleCompareView}
                          >
                            查看对比
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Space>
          </div>
        )}
        

      </Content>

      {/* AI降本抽屉 - 常驻浮动 */}
        <CostDownDrawer
          visible={AICostDownDrawerVisible}
          partName={selectedRowsForAIAnalysis.length > 0 ? 
            `${selectedRowsForAIAnalysis.length}个零件` : 
            selectedPart?.partName || '零件'
          }
          suggestions={mockDashboardData.costDownSuggestions || { alternatives: [], priceNegotiations: [], lifecycleWarnings: [] }}
          onClose={() => setAICostDownDrawerVisible(false)}
          onOpen={() => setAICostDownDrawerVisible(true)}
          onAcceptSuggestion={useCallback((suggestionType, suggestionId) => {
            console.log('采纳降本建议:', suggestionType, suggestionId);
            emit('costDownApplied', { suggestionType, suggestionId });
          }, [emit])}
          onIgnoreSuggestion={(type, id) => console.log('忽略建议:', type, id)}
        />

        {/* 对比车详细抽屉 */}
        <Drawer
          title="零件对比详情"
          width={800}
          placement="right"
          onClose={() => setComparisonDrawerVisible(false)}
          open={comparisonDrawerVisible}
          footer={
            <Space className="w-full justify-end">
              <Button onClick={() => setComparisonDrawerVisible(false)}>
                关闭
              </Button>
              <Button type="primary">
                导出对比报告
              </Button>
            </Space>
          }
        >
          {/* 分析结果区域 */}
          {comparisonCart.length > 0 && (
            <div className="mb-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium mb-3">分析结果</h3>
                
                <Row gutter={[16, 16]}>
                  {/* 总成本差异分析 */}
                  <Col xs={24} sm={12}>
                    <Card size="small" title="总成本差异分析" className="h-full">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">总成本合计：</span>
                          <span className="font-semibold">¥{(comparisonCart.reduce((sum, item) => sum + (item.currentCost || 0), 0)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">目标成本合计：</span>
                          <span className="font-semibold">¥{(comparisonCart.reduce((sum, item) => sum + (item.targetCost || 0), 0)).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-sm text-gray-600">总差异：</span>
                          <span className={`font-bold ${(comparisonCart.reduce((sum, item) => sum + ((item.currentCost || 0) - (item.targetCost || 0)), 0)) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {((comparisonCart.reduce((sum, item) => sum + ((item.currentCost || 0) - (item.targetCost || 0)), 0)) > 0 ? '+' : '')}¥{(comparisonCart.reduce((sum, item) => sum + ((item.currentCost || 0) - (item.targetCost || 0)), 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  
                  {/* 生命周期风险分析 */}
                  <Col xs={24} sm={12}>
                    <Card size="small" title="生命周期风险分析" className="h-full">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">正常生命周期：</span>
                          <span>{comparisonCart.filter(item => item.lifecycle !== 'PhaseOut' && item.lifecycle !== 'Discontinued').length}个</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">淘汰风险：</span>
                          <span className="text-red-500">{comparisonCart.filter(item => item.lifecycle === 'PhaseOut').length}个</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">已停产：</span>
                          <span className="text-orange-500">{comparisonCart.filter(item => item.lifecycle === 'Discontinued').length}个</span>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  
                  {/* 成本节约建议 */}
                  <Col xs={24} sm={12}>
                    <Card size="small" title="成本节约建议" className="h-full">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">有降本空间的零件：</span>
                          <span>{comparisonCart.filter(item => (item.currentCost || 0) > (item.targetCost || 0)).length}个</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">潜在降本总额：</span>
                          <span className="text-green-500">¥{(comparisonCart.reduce((sum, item) => sum + Math.max(0, (item.currentCost || 0) - (item.targetCost || 0)), 0)).toLocaleString()}</span>
                        </div>
                      </div>
                    </Card>
                  </Col>
                  
                  {/* 供应商多样性分析 */}
                  <Col xs={24} sm={12}>
                    <Card size="small" title="供应商多样性分析" className="h-full">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">供应商数量：</span>
                          <span>{new Set(comparisonCart.map(item => item.supplier)).size}个</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">单一供应商零件：</span>
                          <span>{comparisonCart.filter(item => !item.hasAlternatives).length}个</span>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </div>
            </div>
          )}
          
          <Table
            columns={[
              {
                title: '零件名称',
                dataIndex: 'partName',
                key: 'partName',
              },
              {
                title: '位号',
                dataIndex: 'position',
                key: 'position',
              },
              {
                title: '当前成本',
                dataIndex: 'currentCost',
                key: 'currentCost',
                render: (value) => value ? `¥${value.toLocaleString()}` : '-',
              },
              {
                title: '目标成本',
                dataIndex: 'targetCost',
                key: 'targetCost',
                render: (value) => value ? `¥${value.toLocaleString()}` : '-',
              },
              {
                title: '成本差异',
                key: 'costDiff',
                render: (record) => {
                  const diff = (record.currentCost || 0) - (record.targetCost || 0);
                  return (
                    <span className={diff > 0 ? 'text-red-500' : 'text-green-500'}>
                      {diff > 0 ? '+' : ''}¥{diff.toLocaleString()}
                    </span>
                  );
                },
              },
              {
                title: '生命周期',
                dataIndex: 'lifecycle',
                key: 'lifecycle',
              },
              {
                title: '供应商',
                dataIndex: 'supplier',
                key: 'supplier',
              },
            ]}
            dataSource={comparisonCart}
            rowKey="id"
          />
        </Drawer>

        {/* 成本详情抽屉 */}
      <Drawer
        title={selectedPart ? `${selectedPart.position || ''} - ${selectedPart.partName || ''}` : "成本详情"}
        width={360} // 减少40%，从600px调整为360px
        placement="right"
        onClose={() => {
          try {
            // 使用更长的延迟时间确保React的事件循环完成
            setTimeout(() => {
              if (selectPart && typeof selectPart === 'function') {
                selectPart(null);
              }
            }, 100);
          } catch (error) {
            console.error('关闭抽屉出错:', error);
          }
        }}
        open={state.detailDrawerVisible}
        destroyOnClose
        className="cost-detail-drawer"
      >
        {selectedPart ? (
          <div className="p-4 space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-xs font-normal mb-1">{selectedPart.partName}</h3>
              <p className="text-sm text-gray-500">{selectedPart.position}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">零件ID</span>
                <span className="font-medium">{selectedPart.id}</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">当前成本</span>
                  <span className="font-semibold">¥{selectedPart.currentCost}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">目标成本</span>
                  <span className="font-semibold">¥{selectedPart.targetCost}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">成本差异</span>
                  <span className={`font-semibold ${selectedPart.currentCost > selectedPart.targetCost ? 'text-red-500' : 'text-green-500'}`}>
                    {selectedPart.currentCost > selectedPart.targetCost ? '+' : ''}{selectedPart.currentCost - selectedPart.targetCost}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">生命周期</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${selectedPart.lifecycle === 'PhaseOut' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {selectedPart.lifecycle}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">供应商</span>
                <span>{selectedPart.supplier}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">描述</span>
                <span>{selectedPart.description || '暂无描述'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">材料</span>
                <span>{selectedPart.material || 'N/A'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">重量</span>
                <span>{selectedPart.weight} {selectedPart.unit || 'g'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">交期</span>
                <span>{selectedPart.leadTime} 天</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">最小起订量</span>
                <span>{selectedPart.moq} 件</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">暂无零件详情</div>
        )}
      </Drawer>
      
      <CostDownDrawer
          visible={costDownDrawerVisible}
          partName={selectedPart?.partName || ''}
          suggestions={mockDashboardData.costDownSuggestions || { alternatives: [], priceNegotiations: [], lifecycleWarnings: [] }}
          onClose={closeCostDownDrawer}
          onAcceptSuggestion={useCallback((suggestionType, suggestionId) => {
            console.log('采纳降本建议:', suggestionType, suggestionId);
            emit('costDownApplied', { suggestionType, suggestionId });
          }, [emit])}
          onIgnoreSuggestion={(type, id) => console.log('忽略建议:', type, id)}
        />
        

        
        {/* 对比车抽屉 */}
        <Drawer
          title={`零件对比 (${compareCart.length})`}
          width={800}
          placement="right"
          onClose={toggleCompareView}
          open={showCompareView}
        >
          {compareCart.length > 0 ? (
            <div>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>已选择 {compareCart.length} 个零件进行对比</Text>
                <Button danger icon={<DeleteOutlined />} onClick={handleClearCompareCart}>
                  清空对比车
                </Button>
              </div>
              <Table
                dataSource={compareCart}
                rowKey="id"
                rowSelection={{
                  selectedRowKeys: selectedCompareItems,
                  onChange: handleCompareItemSelectionChange,
                }}
                columns={[
                  {
                    title: '零件名称',
                    dataIndex: 'partName',
                    key: 'partName',
                  },
                  {
                    title: '当前成本',
                    dataIndex: 'currentCost',
                    key: 'currentCost',
                    render: (value) => `¥${value}`,
                  },
                  {
                    title: '目标成本',
                    dataIndex: 'targetCost',
                    key: 'targetCost',
                    render: (value) => `¥${value}`,
                  },
                  {
                    title: '成本漂移',
                    dataIndex: 'driftAmount',
                    key: 'driftAmount',
                    render: (value) => (
                      <span className={value > 0 ? 'text-red-500' : 'text-green-500'}>
                        {value > 0 ? '+' : ''}{value}
                      </span>
                    ),
                  },
                  {
                    title: '漂移率',
                    dataIndex: 'driftPercentage',
                    key: 'driftPercentage',
                    render: (value) => (
                      <span className={value > 0 ? 'text-red-500' : 'text-green-500'}>
                        {value > 0 ? '+' : ''}{value}%
                      </span>
                    ),
                  },
                  {
                    title: '供应商',
                    dataIndex: 'supplier',
                    key: 'supplier',
                  },
                  {
                    title: '生命周期',
                    dataIndex: 'lifecycle',
                    key: 'lifecycle',
                    render: (value) => (
                      <Tag color={value === 'PhaseOut' ? 'red' : 'green'}>
                        {value}
                      </Tag>
                    ),
                  },
                ]}
                pagination={false}
                scroll={{ y: 400 }}
              />
              {selectedCompareItems.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button danger onClick={handleRemoveSelectedCompareItems}>
                    移除选中项
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Empty description="对比车为空" />
          )}
        </Drawer>
    </Layout>
  );
};

// 辅助函数：获取预警样式类
const getAlertBorderClass = (type) => {
  switch (type) {
    case 'overBudget':
      return 'border-red-500';
    case 'lifeCycle':
      return 'border-orange-500';
    case 'supplier':
      return 'border-yellow-500';
    default:
      return 'border-gray-300';
  }
};

const getAlertTextClass = (type) => {
  switch (type) {
    case 'overBudget':
      return 'text-red-600';
    case 'lifeCycle':
      return 'text-orange-600';
    case 'supplier':
      return 'text-yellow-600';
    default:
      return '';
  }
};

const getAlertButtonType = (type) => {
  switch (type) {
    case 'overBudget':
      return 'primary';
    case 'lifeCycle':
      return 'default';
    case 'supplier':
      return 'default';
    default:
      return 'default';
  }
};

export default CostDashboardPage;