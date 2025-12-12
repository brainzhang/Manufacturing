import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Button, message, Badge, Tag, Tabs, Tooltip as AntdTooltip } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChartOutlined, BarChartOutlined, AlertOutlined, DownloadOutlined, FileTextOutlined, CarOutlined, BulbOutlined, SearchOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';

// 导入子组件（稍后创建）
import ComplianceRing from '../components/ComplianceRing';
import ComplianceTree from '../components/ComplianceTree';
import ComplianceGapTable from '../components/ComplianceGapTable';
import ComplianceDetailDrawer from '../components/ComplianceDetailDrawer';
import ComplianceWarningDrawer from '../components/ComplianceWarningDrawer';
// 临时 mock 数据与钩子，待后端接口就绪后替换为真实实现
const useComplianceDashboard = () => {
  const [complianceData] = useState({
    compliantParts: 120,
    missingParts: 30,
    expiringCertificates: 5,
    missingCertifications: 8,
    lowComplianceSuppliers: 3
  });
  const [trendTabKey, setTrendTabKey] = useState('product');
  
  // 生成模拟的合规率趋势数据
  const generateMockTrendData = () => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    
    // 产品族趋势 - 稳定上升
    const productRates = [75, 78, 82, 80, 85, 88, 90, 88, 92, 94, 95, 96];
    
    // 供应商趋势 - 波动上升
    const supplierRates = [70, 75, 72, 78, 76, 80, 82, 85, 83, 87, 89, 91];
    
    // 认证类型趋势 - 先升后降再升
    const certRates = [80, 83, 85, 87, 86, 84, 85, 88, 89, 91, 92, 94];
    
    return months.map((month, index) => ({
      month,
      product: productRates[index],
      supplier: supplierRates[index],
      cert: certRates[index]
    }));
  };
  
  // 生成不同类型的趋势数据
  const [dashboardTrendData] = useState(generateMockTrendData());
  
  // 使用正确的数据结构初始化状态
  const [currentTrendData, setCurrentTrendData] = useState(
    dashboardTrendData.map(item => ({ month: item.month, value: item.product }))
  );
  const [activeTab, setActiveTab] = useState('产品族');
  const [selectedPart, setSelectedPart] = useState<any>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [aiWarningDrawerVisible, setAIWarningDrawerVisible] = useState(false);
  const [selectedAlertType, setSelectedAlertType] = useState<string | null>(null);
  const [compareCart, setCompareCart] = useState<any[]>([]);
  const [showCompareView, setShowCompareView] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAnalysisResult, setShowAnalysisResult] = useState(false);
  const [loading, setLoading] = useState(false);
  // 当前选中的表格行
  const [selectedGapRow, setSelectedGapRow] = useState<any>(null);
  
  // 事件处理函数
  const handlePartSelect = (part: any) => {
    console.log('Tree node clicked:', part);
    setSelectedPart(part);
    
    // 1. 滚动到表格对应行
    if (part && part.position) {
      // 获取表格行元素 - 假设表格行有一个data-position属性
      const tableRow = document.querySelector(`tr[data-position="${part.position}"]`);
      if (tableRow) {
        tableRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 高亮显示该行
        tableRow.classList.add('highlight-row');
        setTimeout(() => {
          tableRow.classList.remove('highlight-row');
        }, 2000); // 2秒后移除高亮
      }
    }
    
    // 2. 如果是叶子节点且状态为缺失或即将到期，自动打开详情抽屉
    if ((part.status === 'missing' || part.status === 'expiring') && !part.children) {
      setSelectedPart(part);
      setDetailDrawerVisible(true);
    }
  };
  
  // 处理合规树节点右键点击 - 打开整改抽屉
  const handlePartRightClick = (part: any) => {
    console.log('Tree node right clicked:', part);
    
    // 打开整改抽屉
    setSelectedPart(part);
    handleGenerateRemediation();
    handleOpenAIWarningDrawer();
  };
  
  const handleOpenDetailDrawer = () => setDetailDrawerVisible(true);
  const handleCloseDetailDrawer = () => setDetailDrawerVisible(false);
  
  const handleOpenAIWarningDrawer = (alertType?: string) => {
    if (alertType) {
      setSelectedAlertType(alertType);
    }
    setAIWarningDrawerVisible(true);
  };
  const handleCloseAIWarningDrawer = () => setAIWarningDrawerVisible(false);
  
  // 处理采纳AI建议
  const handleAdoptSuggestion = (suggestionType: string, suggestionData: any) => {
    console.log('采纳建议类型:', suggestionType);
    console.log('建议数据:', suggestionData);
    message.success('正在生成ECN草稿...');
    // 实际项目中应该调用API生成ECN草稿
  };

  // 处理忽略AI建议
  const handleIgnoreSuggestion = () => {
    message.info('建议已忽略');
    setSelectedAlertType(null);
    setAIWarningDrawerVisible(false);
  };
  
  const handleAddToCompareCart = (item: any) => {
    if (compareCart.length < 4 && !compareCart.some(cartItem => cartItem.partId === item.partId)) {
      setCompareCart(prev => [...prev, item]);
    }
  };
  
  // 处理整改按钮点击
  const handleRemediation = (record: any) => {
    console.log('整改按钮点击:', record);
    // 保存选中的记录
    setSelectedPart(record);
    // 打开AI合规预警抽屉，提供整改建议
    handleOpenAIWarningDrawer();
  };
  
  // 处理替换按钮点击
  const handleReplace = (record: any) => {
    console.log('替换按钮点击:', record);
    // 保存选中的记录
    setSelectedPart(record);
    // 打开AI合规预警抽屉，提供替代料建议
    handleOpenAIWarningDrawer();
  };
  
  const handleRemoveCompareItem = (index: number) =>
    setCompareCart(prev => prev.filter((_, i) => i !== index));
  
  const handleClearCompareCart = () => setCompareCart([]);
  const handleToggleCompareView = () => setShowCompareView(prev => !prev);
  
  // 批量添加到对比车
  const handleBatchAddToCompareCart = () => {
    // 批量添加到对比车
    const remainingSlots = 4 - compareCart.length;
    if (selectedRows.length === 0) {
      message.warning('请选择要添加的项目');
      return;
    }
    
    const itemsToAdd = selectedRows.slice(0, remainingSlots).map(row => ({
      ...row,
      partId: row.id,
      name: row.partName
    }));
    
    itemsToAdd.forEach(item => {
      if (!compareCart.some(cartItem => cartItem.partId === item.partId)) {
        setCompareCart(prev => [...prev, item]);
      }
    });
    
    // 只显示成功消息，不打开抽屉
    message.success(`已添加${itemsToAdd.length}个项目到对比车`);
  };
  
  // 导出缺口表（Excel）
  const handleExportGapTable = () => {
    message.success('缺口表导出中，请稍候...');
    console.log('导出缺口表数据:', selectedRows);
  };
  
  // 生成整改单（AI生成ECN草稿）
  const handleGenerateRemediation = () => {
    message.success('正在生成整改单，请稍候...');
    console.log('为以下零件生成整改单:', selectedRows);
    handleOpenAIWarningDrawer();
  };
  
  const handleComplianceUpdated = () => console.log('合规更新');
  const handleCertRenewed = (certId?: string) => console.log('证书续期:', certId);
  const handleExportRequested = (type?: string, data?: any) => console.log('导出请求:', type, data);
  
  // 返回所有状态和方法
  return {
    loading,
    complianceData,
    selectedPart,
    selectedRows,
    setSelectedRows,
    detailDrawerVisible,
    aiWarningDrawerVisible,
    selectedAlertType,
    setSelectedAlertType,
    compareCart,
    showCompareView,
    dashboardTrendData,
    currentTrendData,
    setCurrentTrendData,
    trendTabKey,
    setTrendTabKey,
    handlePartSelect,
    handlePartRightClick,
    handleOpenDetailDrawer,
    handleCloseDetailDrawer,
    handleOpenAIWarningDrawer,
    handleCloseAIWarningDrawer,
    handleAddToCompareCart,
    handleRemoveCompareItem,
    handleClearCompareCart,
    handleToggleCompareView,
    handleRemediation,
    handleReplace,
    handleBatchAddToCompareCart,
    handleExportGapTable,
    handleGenerateRemediation,
    handleComplianceUpdated,
    handleCertRenewed,
    handleExportRequested,
    handleAdoptSuggestion,
    handleIgnoreSuggestion
  };
}

const { Header, Content, Sider } = Layout;
const { Meta } = Card;

const ComplianceDashboardPage: React.FC = () => {
  // 使用自定义Hook管理状态和事件
  const {
    complianceData,
    selectedPart,
    selectedRows,
    setSelectedRows,
    detailDrawerVisible,
    aiWarningDrawerVisible,
    selectedAlertType,
    compareCart,
    showCompareView,
    dashboardTrendData,
    currentTrendData,
    setCurrentTrendData,
    trendTabKey,
    setTrendTabKey,
    handlePartSelect,
    handlePartRightClick,
    handleOpenDetailDrawer,
    handleCloseDetailDrawer,
    handleOpenAIWarningDrawer,
    handleCloseAIWarningDrawer,
    handleAddToCompareCart,
    handleRemoveCompareItem,
    handleClearCompareCart,
    handleToggleCompareView,
    handleRemediation,
    handleReplace,
    handleBatchAddToCompareCart,
    handleExportGapTable,
    handleGenerateRemediation,
    handleComplianceUpdated,
    handleCertRenewed,
    handleExportRequested,
    handleAdoptSuggestion,
    handleIgnoreSuggestion,
    loading
  } = useComplianceDashboard();

  // 获取趋势图配置
  const getTrendConfig = () => {
    switch (trendTabKey) {
      case 'product':
        return { color: '#1890ff', name: '产品族合规率' };
      case 'supplier':
        return { color: '#52c41a', name: '供应商合规率' };
      case 'cert':
        return { color: '#faad14', name: '认证类型合规率' };
      default:
        return { color: '#1890ff', name: '合规率' };
    }
  };

  // 计算合规率数据
  const compliantCount = complianceData?.compliantParts || 0;
  const missingCount = complianceData?.missingParts || 0;
  const totalCount = compliantCount + missingCount;
  const compliantRate = totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0;

  // 预警数据
  const alerts = [
    { type: 'certificate-expiring', title: '证书即将到期', count: complianceData?.expiringCertificates || 0, color: 'orange', threshold: '≤90天' },
    { type: 'missing-cert', title: '缺失认证', count: complianceData?.missingCertifications || 0, color: 'red', threshold: '>0' },
    { type: 'supplier-compliance', title: '供应商合规率', count: complianceData?.lowComplianceSuppliers || 0, color: 'yellow', threshold: '<80%' }
  ];



  // 处理导出缺口表
  const handleExport = () => {
    handleExportGapTable();
    message.success('缺口表导出成功');
  };

  // 处理生成整改单 - 使用从hook中获取的handleRemediation函数

  // 处理合规预警下钻功能
  const handleAlertDrillDown = (alertType: string) => {
    // 打开AI合规预警抽屉并传递预警类型
    handleOpenAIWarningDrawer(alertType);
    
    // 根据不同的预警类型显示相应的提示信息
    switch (alertType) {
      case 'certificate-expiring':
        message.info('查看证书到期详情');
        break;
      case 'missing-cert':
        message.info('查看缺失认证详情');
        break;
      case 'supplier-compliance':
        message.info('查看供应商合规率详情');
        break;
      default:
        break;
    }
  };
  
  // 包装函数，用于onClick事件
  const handleAlertClick = (alertType: string) => () => {
    handleAlertDrillDown(alertType);
  };
  
  // 处理开始对比分析
  const handleStartCompareAnalysis = () => {
    if (compareCart.length < 2) {
      message.warning('请至少选择2个项目进行对比');
      return;
    }
    
    // 模拟对比分析过程
    // 使用解构出来的 loading 状态，无需手动 setLoading
    // 如果需要加载状态，请从 useComplianceDashboard 中返回 setLoading 并在内部调用
    
    // 这里应该调用API进行实际的对比分析
    // 暂时使用模拟数据和延迟来演示
    setTimeout(() => {
      // 生成对比分析结果
      const result = {
        items: compareCart,
        differences: generateCompareDifferences(compareCart),
        similarities: generateCompareSimilarities(compareCart),
        summary: {
          totalDifferences: Math.floor(Math.random() * 5) + 1,
          totalSimilarities: Math.floor(Math.random() * 8) + 3,
          criticalIssues: Math.floor(Math.random() * 2)
        }
      };
      
      console.log('对比分析结果:', result);
      // setAnalysisResult(result); // 已从 hook 中解构出，无需再调用
      // 无需手动设置 showAnalysisResult，由 hook 内部管理
      // 无需手动设置 loading，由 useComplianceDashboard 内部管理
      message.success('对比分析完成');
    }, 1500);
  };
  
  // 处理导出对比报告
  const handleExportCompareReport = () => {
    if (compareCart.length === 0) {
      message.warning('对比车为空，无法导出报告');
      return;
    }
    
    // 模拟导出过程
    message.loading('报告导出中...', 1);
    
    // 这里应该调用API进行实际的报告导出
    setTimeout(() => {
      message.success('对比报告导出成功');
    }, 1000);
  };
  
  // 生成对比差异数据
  const generateCompareDifferences = (items: any[]) => {
    const differences = [];
    // 示例：比较认证差异
    const certSets = items.map(item => new Set(item.missingCerts || []));
    const allCerts = new Set(certSets.flatMap(set => Array.from(set)));
    
    allCerts.forEach(cert => {
      const itemDifferences = [];
      items.forEach((item, index) => {
        const hasCert = item.missingCerts?.includes(cert);
        itemDifferences.push({
          itemIndex: index,
          itemName: item.partName,
          hasMissingCert: hasCert
        });
      });
      
      // 只有当不是所有项目都有相同的缺失认证时才添加为差异
      const hasDifferentStatus = itemDifferences.some(d => d.hasMissingCert) !== itemDifferences.every(d => d.hasMissingCert);
      if (hasDifferentStatus) {
        differences.push({
          type: 'certificate',
          certName: cert,
          details: itemDifferences
        });
      }
    });
    
    // 示例：比较生命周期差异
    const lifecycleValues = [...new Set(items.map(item => item.lifecycle || ''))];
    if (lifecycleValues.length > 1) {
      differences.push({
        type: 'lifecycle',
        details: items.map((item, index) => ({
          itemIndex: index,
          itemName: item.partName,
          lifecycle: item.lifecycle || '未知'
        }))
      });
    }
    
    return differences;
  };
  
  // 生成对比相似数据
  const generateCompareSimilarities = (items: any[]) => {
    const similarities = [];
    
    // 示例：相同供应商
    const firstSupplier = items[0]?.supplier;
    if (firstSupplier && items.every(item => item.supplier === firstSupplier)) {
      similarities.push({
        type: 'supplier',
        message: `所有项目供应商相同: ${firstSupplier}`
      });
    }
    
    // 示例：相同生命周期
    const firstLifecycle = items[0]?.lifecycle;
    if (firstLifecycle && items.every(item => item.lifecycle === firstLifecycle)) {
      similarities.push({
        type: 'lifecycle',
        message: `所有项目生命周期相同: ${firstLifecycle}`
      });
    }
    
    return similarities;
  };

  return (
    <Layout className="min-h-screen">
      <Content className="p-6">
        {/* 已删除合规看板标题和描述 */}

        {/* 顶部合规KPI看板 */}
        <Row gutter={[16, 16]} className="mb-6">
          {/* 总体合规率圆环图 */}
          <Col xs={24} md={8}>
            <Card title="总体合规率" variant="outlined" className="h-full">
              <div className="flex justify-center">
                <ComplianceRing 
                  compliantCount={compliantCount}
                  missingCount={missingCount}
                  compliantRate={compliantRate}
                />
              </div>
              <div className="-mt-6 text-center">
                <Tag color="success">合规零件: {compliantCount}</Tag>
                <Tag color="error" className="ml-2">缺失零件: {missingCount}</Tag>
              </div>
            </Card>
          </Col>

          {/* 趋势卡片 */}
          <Col xs={24} md={8}>
            <Card 
              title="近12个月合规率趋势" 
              variant="outlined" 
              className="h-full"
              extra={
                <Tabs 
                  activeKey={trendTabKey}
                  onChange={(key) => {
                    setTrendTabKey(key);
                    // 根据选择的标签更新趋势数据
                    const dataMap = {
                      'product': dashboardTrendData.map(item => ({ month: item.month, value: item.product })),
                      'supplier': dashboardTrendData.map(item => ({ month: item.month, value: item.supplier })),
                      'cert': dashboardTrendData.map(item => ({ month: item.month, value: item.cert }))
                    };
                    if (dataMap[key]) {
                      setCurrentTrendData(dataMap[key]);
                    }
                  }}
                  size="small"
                  items={[
                    { key: 'product', label: '产品族' },
                    { key: 'supplier', label: '供应商' },
                    { key: 'cert', label: '认证类型' }
                  ]}
                />
              }
            >
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis 
                      domain={[60, 100]} 
                      tickFormatter={(value) => `${value}%`}
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, getTrendConfig().name]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value"
                      stroke={getTrendConfig().color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* 预警卡片 */}
          <Col xs={24} md={8}>
            <Card title="合规预警" variant="outlined" className="h-full">
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <div 
                    key={index} 
                    className="p-3 rounded-lg border flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={handleAlertClick(alert.type)}
                  >
                    <div>
                      <span className="font-medium">{alert.title}</span>
                      <span className="ml-2 text-gray-500">({alert.threshold})</span>
                    </div>
                    <Badge 
                      count={alert.count} 
                      style={{ backgroundColor: alert.color === 'orange' ? '#fa8c16' : alert.color === 'red' ? '#f5222d' : '#faad14' }}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 主内容区域 */}
        <Row gutter={[16, 16]}>
          {/* 左侧合规树 */}
          <Col xs={24} lg={6}>
            <Card title="合规BOM树" variant="outlined" className="h-[600px]">
              <div className="h-[520px] overflow-auto">
                <ComplianceTree 
                  onNodeClick={handlePartSelect}
                  onNodeRightClick={handlePartRightClick}
                  onRowSelect={(rows) => setSelectedRows(rows)}
                  loading={loading}
                />
              </div>
            </Card>
          </Col>

          {/* 中部合规缺口表格 */}
          <Col xs={24} lg={18}>
            <Card 
              title="合规缺口表格" 
              variant="outlined" 
              className="h-[600px]"
              extra={
                <div className="flex items-center">
                  <Button size="small" icon={<SearchOutlined />}>筛选</Button>
                </div>
              }
            >
              <div className="h-[440px] overflow-auto">
                <ComplianceGapTable 
                  onPartClick={handleOpenDetailDrawer}
                  onAddToComparison={(record) => {
                    // 确保GapRecord正确添加到对比车中
                    // 创建包含必要字段的对象
                    const compareItem = {
                      ...record,
                      partId: record.id, // 使用id作为partId
                      name: record.partName // 确保有name字段
                    };
                    handleAddToCompareCart(compareItem);
                    // 只显示消息提示，不打开抽屉
                    message.success('已加入对比车');
                  }}
                  onRemediation={handleRemediation}
                  onReplace={handleReplace}
                  onRowSelect={(rows) => setSelectedRows(rows)}
                  loading={loading}
                />
              </div>
              
              {/* 批量操作栏 */}
              <div className="mt-4 pt-4 border-t">
                <Row justify="space-between" align="middle">
                  <div className="flex space-x-2">
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />}
                      onClick={handleExportGapTable}
                      disabled={selectedRows.length === 0}
                    >
                      导出缺口表
                    </Button>
                    <Button 
                      type="default" 
                      icon={<FileTextOutlined />}
                      onClick={handleGenerateRemediation}
                      disabled={selectedRows.length === 0}
                    >
                      生成整改单
                    </Button>
                    <Button 
                      type="default" 
                      icon={<CarOutlined />}
                      onClick={handleBatchAddToCompareCart}
                      disabled={selectedRows.length === 0 || compareCart.length >= 4}
                    >
                      批量加入对比车
                    </Button>
                    <Button 
                      type="default" 
                      icon={<CarOutlined />}
                      onClick={handleToggleCompareView}
                      disabled={compareCart.length === 0}
                    >
                      查看对比车 ({compareCart.length}/4)
                    </Button>
                  </div>
                  <AntdTooltip title="AI合规建议">
                    <Button 
                      type="text" 
                      icon={<BulbOutlined style={{ fontSize: '20px', color: '#faad14' }} />}
                      onClick={() => handleOpenAIWarningDrawer()}
                    />
                  </AntdTooltip>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 合规详情抽屉 */}
        <ComplianceDetailDrawer 
          visible={detailDrawerVisible}
          partData={selectedPart}
          onClose={handleCloseDetailDrawer}
          onRenewCert={(certId) => {
            console.log('续期证书:', certId);
            handleCertRenewed(certId);
          }}
          onReplaceCert={(certId) => console.log('替换证书:', certId)}
          onExportCert={(certId) => console.log('导出证书:', certId)}
          onRenewAllCertificates={() => console.log('续期所有证书')}
          onReplaceWithCompliant={() => handleOpenAIWarningDrawer()}
          onExportAllCertificates={() => handleExportRequested('pdf', selectedPart)}
        />

        {/* AI合规预警抽屉 */}
        <ComplianceWarningDrawer
          visible={aiWarningDrawerVisible}
          onClose={handleCloseAIWarningDrawer}
          onAdoptSuggestion={handleAdoptSuggestion}
          onIgnoreSuggestion={handleIgnoreSuggestion}
          selectedParts={selectedRows.length > 0 ? selectedRows : undefined}
          alertType={selectedAlertType}
        />

        {/* 对比车视图（增强版） */}
        {showCompareView && compareCart.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-normal">对比车 ({compareCart.length}/4)</h3>
              <div>
                <Button size="small" onClick={handleClearCompareCart}>清空</Button>
                <Button size="small" type="default" className="ml-2" onClick={handleToggleCompareView}>关闭</Button>
              </div>
            </div>
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2">对比项目详情</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-1 px-2 text-left">位号</th>
                      <th className="py-1 px-2 text-left">零件名称</th>
                      <th className="py-1 px-2 text-left">缺失认证</th>
                      <th className="py-1 px-2 text-left">证书到期</th>
                      <th className="py-1 px-2 text-left">供应商</th>
                      <th className="py-1 px-2 text-left">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareCart.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-1 px-2">{item.position}</td>
                        <td className="py-1 px-2">{item.partName}</td>
                        <td className="py-1 px-2">
                          <div className="flex flex-wrap gap-1">
                            {item.missingCerts?.map((cert: string, certIndex: number) => (
                              <Tag key={certIndex} color="blue">{cert}</Tag>
                            ))}
                          </div>
                        </td>
                        <td className="py-1 px-2">{item.expireDate}</td>
                        <td className="py-1 px-2">{item.supplier}</td>
                        <td className="py-1 px-2">
                          <Button 
                            size="small" 
                            danger 
                            onClick={() => handleRemoveCompareItem(index)}
                          >
                            移除
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button type="primary" size="small" disabled={compareCart.length < 2} onClick={handleStartCompareAnalysis}>
                开始对比分析
              </Button>
              <Button size="small" onClick={handleExportCompareReport}>
                导出对比报告
              </Button>
              <div className="flex-1 text-right text-sm text-gray-500">
                最多可添加4个项目进行对比
              </div>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default ComplianceDashboardPage;