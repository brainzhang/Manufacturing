import React, { useState, useEffect, useRef } from 'react';
import { Layout, Card, Row, Col, Table, Button, message, Empty, Spin, Typography, Tabs, Badge, Space, Tag } from 'antd';
import { PieChartOutlined, AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, FileSearchOutlined, ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined, FilterOutlined, AppstoreOutlined } from '@ant-design/icons';
import ComplianceTree from '../components/ComplianceTree';
import ComplianceRemediationDrawer from '../components/ComplianceRemediationDrawer';
import ComplianceDetailDrawer from '../components/ComplianceDetailDrawer';
import { complianceBOMTreeData, complianceTableData, complianceWarnings, complianceTrendData } from '../data/complianceMockData';
import type { ComplianceTreeNode } from '../data/complianceMockData';
import type { RemediationRecord } from '../types/compliance';
import '../styles/ComplianceStyles.css';

const { Header, Sider, Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

interface TableRowData {
  key: string;
  position: string;
  partName: string;
  quantity: number;
  unit: string;
  cost: number;
  supplier: string;
  difference: number;
  lifecycle: string;
  status: string;
  certificateExpiry?: string;
  operation: string[];
}

const ComplianceDashboard: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<ComplianceTreeNode | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [remediationDrawerVisible, setRemediationDrawerVisible] = useState(false);
  const [selectedRemediationNode, setSelectedRemediationNode] = useState<ComplianceTreeNode | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedDetailNode, setSelectedDetailNode] = useState<ComplianceTreeNode | null>(null);
  const [compareCart, setCompareCart] = useState<ComplianceTreeNode[]>([]);
  const [tableData, setTableData] = useState<TableRowData[]>(complianceTableData);
  const [loading, setLoading] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('1');
  const [sortConfig, setSortConfig] = useState<{ key: string; order: 'ascend' | 'descend' } | null>(null);
  
  const tableRef = useRef<any>(null);
  
  // 统计数据 - 修复类型安全问题
  const stats = {
    total: complianceTableData.length,
    compliant: complianceTableData.filter((item): boolean => item.status === 'compliant').length,
    expiring: complianceTableData.filter((item): boolean => item.status === 'expiring').length,
    missing: complianceTableData.filter((item): boolean => item.status === 'missing').length
  };
  
  // 确保stats中的值都是数字类型
  const safeStats = {
    total: Number(stats.total) || 0,
    compliant: Number(stats.compliant) || 0,
    expiring: Number(stats.expiring) || 0,
    missing: Number(stats.missing) || 0
  };

  // 处理节点点击
  const handleNodeClick = (node: ComplianceTreeNode) => {
    setSelectedNode(node);
    setSelectedDetailNode(node);
    setDetailDrawerVisible(true);
    // 滚动到表格对应行
    if (tableRef.current) {
      const rowElement = document.getElementById(`row-${node.position}`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 高亮显示选中行
        rowElement.classList.add('highlight-row');
        setTimeout(() => {
          rowElement.classList.remove('highlight-row');
        }, 2000);
      }
    }
  };

  // 处理整改证书
  const handleRenewCert = (certId: string) => {
    message.success('证书整改操作已提交');
    setDetailDrawerVisible(false);
    // 在实际应用中，这里应该调用API进行整改操作
  };

  // 处理替换证书
  const handleReplaceCert = (certId: string) => {
    message.success('证书替换操作已提交');
    setDetailDrawerVisible(false);
    // 在实际应用中，这里应该调用API进行替换操作
  };

  // 处理合规整改
  const handleRemediation = (node: ComplianceTreeNode) => {
    setSelectedRemediationNode(node);
    setRemediationDrawerVisible(true);
  };

  // 处理加入对比车
  const handleAddToCompare = (node: ComplianceTreeNode) => {
    setCompareCart(prev => {
      // 检查是否已在对比车中
      if (prev.some(item => item.position === node.position)) {
        message.warning('该零件已在对比车中');
        return prev;
      }
      const newCart = [...prev, node];
      message.success(`已将 ${node.name} 添加到对比车`);
      return newCart;
    });
  };

  // 处理从对比车移除
  const handleRemoveFromCompare = (position: string) => {
    setCompareCart(prev => prev.filter(item => item.position !== position));
    message.success('已从对比车移除');
  };

  // 查看对比车
  const handleViewCompareCart = () => {
    if (compareCart.length === 0) {
      message.warning('对比车为空');
      return;
    }
    // 在实际应用中，这里应该跳转到对比页面或显示对比弹窗
    message.info(`对比车中有 ${compareCart.length} 个零件`);
    console.log('对比车内容:', compareCart);
  };

  // 原有的右键菜单整改功能已合并到上方新定义的函数中

  // 处理整改提交
  const handleRemediationSubmit = (record: RemediationRecord) => {
    console.log('整改记录提交:', record);
    // 模拟更新节点状态
    if (selectedRemediationNode) {
      // 更新表格数据中的状态
      setTableData(prev => prev.map(item => 
        item.position === selectedRemediationNode.position 
          ? { ...item, status: 'compliant' } 
          : item
      ));
      message.success('合规整改已提交，节点状态已更新');
    }
  };

  // 处理表格排序
  const handleTableChange = (_pagination: any, _filters: any, sorter: any) => {
    if (sorter.field && sorter.order) {
      setSortConfig({ key: sorter.field, order: sorter.order });
      const sortedData = [...tableData].sort((a, b) => {
        if (a[sorter.field as keyof TableRowData] > b[sorter.field as keyof TableRowData]) {
          return sorter.order === 'ascend' ? 1 : -1;
        }
        if (a[sorter.field as keyof TableRowData] < b[sorter.field as keyof TableRowData]) {
          return sorter.order === 'ascend' ? -1 : 1;
        }
        return 0;
      });
      setTableData(sortedData);
    }
  };

  // 处理警告卡片点击
  const handleWarningClick = (warningType: string) => {
    // 根据警告类型筛选表格数据
    if (warningType === 'certificate-expiring') {
      setTableData(complianceTableData.filter(item => item.status === 'expiring'));
    } else if (warningType === 'missing-cert') {
      setTableData(complianceTableData.filter(item => item.status === 'missing'));
    } else {
      setTableData(complianceTableData);
    }
    message.info(`已筛选显示 ${warningType} 相关数据`);
  };

  // 重置筛选
  const handleResetFilter = () => {
    setTableData(complianceTableData);
    setSortConfig(null);
    message.info('已重置所有筛选');
  };

  // 表格列配置
  const columns = [
    {
      title: '位号',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      sorter: true,
      render: (text: string) => (
        <span id={`row-${text}`} className="position-cell">{text}</span>
      )
    },
    {
      title: '零件名称',
      dataIndex: 'partName',
      key: 'partName',
      sorter: true
    },
    {
      title: '合规状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        let tagColor = '';
        let tagText = '';
        
        switch (status) {
          case 'compliant':
            tagColor = 'success';
            tagText = '合规';
            break;
          case 'expiring':
            tagColor = 'warning';
            tagText = '即将到期';
            break;
          case 'missing':
            tagColor = 'error';
            tagText = '缺失';
            break;
          default:
            tagColor = 'default';
            tagText = status;
        }
        
        return <Tag color={tagColor} className="status-tag">{tagText}</Tag>;
      }
    },
    {
      title: '证书到期',
      dataIndex: 'certificateExpiry',
      key: 'certificateExpiry',
      width: 120,
      sorter: true,
      render: (date?: string) => date || '-'
    },
    {
      title: '用量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      sorter: true
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 60
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      sorter: true,
      render: (cost: number) => `¥${cost}`
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      sorter: true
    },
    {
      title: '生命周期',
      dataIndex: 'lifecycle',
      key: 'lifecycle',
      width: 100,
      sorter: true
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: string[], record: TableRowData) => {
        // 查找对应的树节点
        const node = findTreeNodeByPosition(complianceBOMTreeData, record.position);
        
        return (
            <Space size="small">
              <Button 
                type="primary" 
                size="small"
                danger={record.status !== 'compliant'}
                onClick={() => {
                  if (node) {
                    handleRemediation(node);
                  }
                }}
                className="btn-remediation"
              >
                合规整改
              </Button>
              <Button 
                size="small"
                onClick={() => {
                  if (node) {
                    handleNodeClick(node);
                    message.success('已定位到BOM树节点');
                  }
                }}
                className="btn-locate"
              >
                定位
              </Button>
              <Button 
                size="small"
                icon={<AppstoreOutlined />}
                onClick={() => {
                  if (node) {
                    handleAddToCompare(node);
                  }
                }}
              >
                加入对比
              </Button>
            </Space>
          );
      }
    }
  ];

  // 根据位号查找树节点
  const findTreeNodeByPosition = (nodes: ComplianceTreeNode[], position: string): ComplianceTreeNode | null => {
    for (const node of nodes) {
      if (node.position === position) {
        return node;
      }
      if (node.children) {
        const found = findTreeNodeByPosition(node.children, position);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  // 监听滚动事件
  useEffect(() => {
    const handleScrollToRow = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.position && tableRef.current) {
        const rowId = `row-${customEvent.detail.position}`;
        const rowElement = document.getElementById(rowId);
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 高亮显示
          rowElement.classList.add('highlight-row');
          setTimeout(() => {
            rowElement.classList.remove('highlight-row');
          }, 2000);
        }
      }
    };

    window.addEventListener('scrollToRow', handleScrollToRow as EventListener);
    return () => {
      window.removeEventListener('scrollToRow', handleScrollToRow as EventListener);
    };
  }, []);

  // 展开所有节点
  useEffect(() => {
    const expandAllNodes = (nodes: ComplianceTreeNode[], keys: React.Key[] = []): React.Key[] => {
      nodes.forEach(node => {
        keys.push(node.id);
        if (node.children && node.children.length > 0) {
          expandAllNodes(node.children, keys);
        }
      });
      return keys;
    };
    
    setExpandedKeys(expandAllNodes(complianceBOMTreeData));
  }, []);

  // 刷新数据
  const handleRefresh = () => {
    setLoading(true);
    // 模拟数据刷新
    setTimeout(() => {
      setTableData([...complianceTableData]);
      setLoading(false);
      message.success('数据已刷新');
    }, 800);
  };

  // 导出数据
  const handleExportData = () => {
    message.info('数据导出功能已启动');
    // 实际项目中这里会实现数据导出功能
  };

  // 计算合规率
  const complianceRate = stats.total > 0 ? ((stats.compliant / stats.total) * 100).toFixed(1) : '0';
  
  return (
    <Layout className="compliance-dashboard fade-in" style={{ minHeight: '100vh' }}>
      <Header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <PieChartOutlined className="header-icon" />
            <Title level={4} style={{ color: 'white', margin: 0, marginLeft: 10 }}>合规管理仪表盘</Title>
          </div>
          <div className="header-right">
            <Space size="middle">
              <span className="compliance-rate">
                合规率: <strong>{complianceRate}%</strong>
              </span>
              <Button type="primary" danger size="small" onClick={handleExportData}>
                导出数据
              </Button>
              <Button icon={<ReloadOutlined />} size="small" onClick={handleRefresh}>
                刷新
              </Button>
              <Button type="primary" icon={<FileSearchOutlined />}>
                生成合规报告
              </Button>
            </Space>
          </div>
        </div>
      </Header>
      
      <Layout>
        <Sider width={300} theme="light" className="compliance-tree-sider">
          <Card 
            title={
              <div className="card-title-with-icon">
                <PieChartOutlined style={{ marginRight: 8 }} />
                合规BOM树
              </div>
            } 
            bordered={true}
            className="tree-card fade-in"
            extra={
              <Space size="small">
                <Button 
                  type="text" 
                  icon={<FilterOutlined />} 
                  onClick={handleRefresh}
                  size="small"
                >
                  刷新
                </Button>
              </Space>
            }
          >
            <div className="sider-stats">
              <div className="stat-item">
                <Text type="success">合规: {safeStats.compliant}</Text>
              </div>
              <div className="stat-item">
                <Text type="warning">即将到期: {safeStats.expiring}</Text>
              </div>
              <div className="stat-item">
                <Text type="danger">缺失: {safeStats.missing}</Text>
              </div>
            </div>
            
            {loading ? (
              <div className="loading-container">
                <Spin size="large" tip="加载中..." />
              </div>
            ) : (
              <ComplianceTree
                onNodeClick={handleNodeClick}
                onRemediation={handleRemediation}
                data={complianceBOMTreeData}
                selectedNodeId={selectedNode?.id}
                onRowSelect={(selected) => console.log('选中的行:', selected)}
              />)}
          </Card>
        </Sider>
        
        <Content className="dashboard-content">
        <div className="content-wrapper">
          {/* 优化后的统计卡片 */}
          {/* 警告卡片 */}
            <div className="warning-cards">
              {complianceWarnings.map(warning => (
                <Card
                  key={warning.type}
                  className={`warning-card warning-${warning.type} hover-effect`}
                  hoverable
                  onClick={() => handleWarningClick(warning.type)}
                  bodyStyle={{ padding: '16px' }}
                >
                  <div className="warning-content">
                    <div className="warning-icon">
                      {warning.type === 'certificate-expiring' ? (
                        <ClockCircleOutlined style={{ color: '#faad14', fontSize: 24 }} />
                      ) : warning.type === 'missing-cert' ? (
                        <ExclamationCircleOutlined style={{ color: '#f5222d', fontSize: 24 }} />
                      ) : (
                        <AlertOutlined style={{ color: '#1890ff', fontSize: 24 }} />
                      )}
                    </div>
                    <div className="warning-info">
                      <h4 className="warning-title">{warning.title}</h4>
                      <Badge count={warning.count} style={{ backgroundColor: warning.type === 'missing-cert' ? '#f5222d' : warning.type === 'certificate-expiring' ? '#faad14' : '#1890ff' }} />
                      <p className="warning-desc">{warning.description}</p>
                    </div>
                    <div className="warning-action">
                      <ArrowDownOutlined />
                    </div>
                  </div>
                </Card>
              ))}
              <Button 
                className="reset-filter-btn"
                onClick={handleResetFilter}
                icon={<ArrowUpOutlined />}
              >
                重置筛选
              </Button>
            </div>
            
            {/* 主内容区域 */}
            <Tabs 
              activeKey={activeTabKey} 
              onChange={setActiveTabKey}
              className="main-tabs fade-in"
            >
              <TabPane 
                tab={
                  <div className="tab-title-with-badge">
                    <span>合规明细</span>
                    <Badge count={tableData.length} style={{ marginLeft: 8 }} />
                  </div>
                } 
                key="1"
              >
                <Card
                  bordered={true}
                  className="table-card"
                  extra={
                    <Space size="small">
                      <Button 
                        size="small"
                        onClick={handleExportData}
                      >
                        导出
                      </Button>
                    </Space>
                  }
                >
                {tableData.length > 0 ? (
                  <Table
                    ref={tableRef}
                    columns={columns}
                    dataSource={tableData}
                    rowKey="key"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `共 ${total} 条记录`,
                      showQuickJumper: true
                    }}
                    onChange={handleTableChange}
                    rowClassName={(record) => {
                      if (selectedNode && record.position === selectedNode.position) {
                        return 'selected-row table-row-selected';
                      }
                      return 'table-row-normal';
                    }}
                    onRow={(record) => ({
                      onClick: () => {
                        // 查找对应的树节点并触发点击
                        const node = findTreeNodeByPosition(complianceBOMTreeData, record.position);
                        if (node) {
                          handleNodeClick(node);
                        }
                      },
                      onMouseEnter: () => {
                        const element = document.getElementById(`row-${record.position}`);
                        if (element) {
                          element.style.backgroundColor = '#f5f5f5';
                        }
                      },
                      onMouseLeave: () => {
                        const element = document.getElementById(`row-${record.position}`);
                        if (element && record.position !== selectedNode?.position) {
                          element.style.backgroundColor = '';
                        }
                      }
                    })}
                    className="compliance-table table-with-shadow"
                    scroll={{ y: 600, x: 'max-content' }}
                  />
                ) : (
                  <Empty 
                    description="暂无数据" 
                    className="empty-data"
                  />
                )}
                </Card>
              </TabPane>
              
              <TabPane tab="合规趋势" key="2">
                <Card>
                  <Paragraph>合规趋势分析功能开发中...</Paragraph>
                </Card>
              </TabPane>
              
              <TabPane tab="整改记录" key="3">
                <Card>
                  <Paragraph>合规整改记录功能开发中...</Paragraph>
                </Card>
              </TabPane>
            </Tabs>
          </div>
        </Content>
      </Layout>
      
      {/* 合规整改抽屉 */}
      {selectedRemediationNode && (
        <ComplianceRemediationDrawer
          visible={remediationDrawerVisible}
          onClose={() => setRemediationDrawerVisible(false)}
          node={selectedRemediationNode}
          onSubmit={handleRemediationSubmit}
          loading={loading}
        />
      )}
      
      <ComplianceDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        partData={selectedDetailNode ? {
          id: selectedDetailNode.id || '',
          position: selectedDetailNode.position,
          name: selectedDetailNode.name,
          supplier: (selectedDetailNode as any).supplier || '',
          cost: (selectedDetailNode as any).cost || 0,
          lifecycle: (selectedDetailNode as any).lifecycle || '',
          imageUrl: (selectedDetailNode as any).imageUrl,
          certificates: (selectedDetailNode as any).certificates || []
        } : undefined}
        onRenewCert={handleRenewCert}
        onReplaceCert={handleReplaceCert}
      />
      
      {/* 对比车按钮 */}
      {compareCart.length > 0 && (
        <Button
          type="primary"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000
          }}
          onClick={handleViewCompareCart}
        >
          对比车 ({compareCart.length})
        </Button>
      )}
      
      <style>{`
        .compliance-dashboard .dashboard-header {
          background: #1890ff;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
        }
        
        .header-content {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .compliance-tree-sider {
          overflow-y: auto;
          padding: 16px;
          border-right: 1px solid #f0f0f0;
        }
        
        .sider-header {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .sider-header h3 {
          margin: 0 0 8px 0;
        }
        
        .sider-stats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .stat-item {
          padding: 4px 8px;
          background: #f5f5f5;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .dashboard-content {
          padding: 24px;
          background: #f5f5f5;
        }
        
        .content-wrapper {
          background: white;
          padding: 24px;
          border-radius: 8px;
          min-height: 80vh;
        }
        
        .warning-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .warning-card {
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .warning-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .warning-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .warning-info {
          flex: 1;
        }
        
        .warning-title {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .warning-count {
          margin: 0 0 4px 0;
          font-size: 24px;
          font-weight: bold;
          color: #1890ff;
        }
        
        .warning-desc {
          margin: 0;
          font-size: 12px;
          color: #666;
        }
        
        .reset-filter-btn {
          align-self: center;
        }
        
        .main-tabs {
          margin-top: 24px;
        }
        
        .ant-table-tbody .selected-row {
          background-color: #e6f7ff !important;
        }
        
        .ant-table-tbody .highlight-row {
          animation: highlight 2s ease-in-out;
        }
        
        @keyframes highlight {
          0% { background-color: #fff7e6; }
          50% { background-color: #ffecb3; }
          100% { background-color: transparent; }
        }
        
        .position-cell {
          font-weight: 600;
          color: #1890ff;
        }
        
        .status-success {
          color: #52c41a;
        }
        
        .status-warning {
          color: #faad14;
        }
        
        .status-error {
          color: #f5222d;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 400px;
        }
        
        .empty-data {
          padding: 60px 0;
        }
        
        @media (max-width: 768px) {
          .compliance-tree-sider {
            width: 100% !important;
            height: auto;
          }
          
          .warning-cards {
            grid-template-columns: 1fr;
          }
          
          .content-wrapper {
            padding: 16px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default ComplianceDashboard;