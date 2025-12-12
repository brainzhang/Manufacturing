import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout,
  Card,
  Select,
  Checkbox,
  Radio,
  Button,
  Table,
  Drawer,
  Row,
  Col,
  Empty,
  Spin,
  Tag,
  message,
  Modal
} from 'antd';
import {
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Footer } = Layout;
const { Option } = Select;

// 模拟BOM数据
const mockBOMs = [
  { id: 'BOM-001', name: 'ThinkPad X1 Carbon Gen11 BOM', product: 'ThinkPad X1 Carbon', version: 'V1.2' },
  { id: 'BOM-002', name: 'ThinkPad X1 Carbon Gen11 BOM V2', product: 'ThinkPad X1 Carbon', version: 'V2.0' },
  { id: 'BOM-003', name: 'ThinkPad X1 Yoga Gen7 BOM', product: 'ThinkPad X1 Yoga', version: 'V1.0' },
  { id: 'BOM-004', name: 'ThinkBook 14 G4 BOM', product: 'ThinkBook 14', version: 'V3.0' },
  { id: 'BOM-005', name: 'ThinkPad P16 Mobile Workstation BOM', product: 'ThinkPad P16', version: 'V1.0' },
  { id: 'BOM-006', name: 'ThinkCentre M90a AIO BOM', product: 'ThinkCentre M90a', version: 'V2.1' }
];

// 模拟差异数据
const generateMockDiffData = () => {
  return {
    baselineBomId: 'BOM-001',
    compareBomIds: ['BOM-002'],
    differences: [
      {
        id: 'diff-1',
        position: '1.1.1.1.1',
        partId: 'CPU-I7-1555U',
        partName: 'Intel Core i7-1555U',
        type: 'MODIFIED',
        baseline: { qty: 1, cost: 4500, lifecycle: 'Active' },
        compare: { qty: 1, cost: 4200, lifecycle: 'Active' },
        deltaCost: -300,
        deltaQty: 0,
        missingCompliance: []
      },
      {
        id: 'diff-2',
        position: '1.1.2.1.1',
        partId: 'RAM-16GB-LPDDR5',
        partName: '16GB LPDDR5-5200内存',
        type: 'MODIFIED',
        baseline: { qty: 1, cost: 699, lifecycle: 'Active' },
        compare: { qty: 1, cost: 599, lifecycle: 'Active' },
        deltaCost: -100,
        deltaQty: 0,
        missingCompliance: []
      },
      {
        id: 'diff-3',
        position: '1.2.1.1.1',
        partId: 'SSD-1TB-NVMe',
        partName: '1TB NVMe SSD',
        type: 'MODIFIED',
        baseline: { qty: 1, cost: 899, lifecycle: 'Active' },
        compare: { qty: 1, cost: 799, lifecycle: 'Active' },
        deltaCost: -100,
        deltaQty: 0,
        missingCompliance: []
      },
      {
        id: 'diff-4',
        position: '1.3.1.1.1',
        partId: 'WIFI-6E',
        partName: 'Intel Wi-Fi 6E',
        type: 'LIFE_CYCLE',
        baseline: { qty: 1, cost: 99, lifecycle: 'Active' },
        compare: { qty: 1, cost: 99, lifecycle: 'Phase Out' },
        deltaCost: 0,
        deltaQty: 0,
        missingCompliance: []
      },
      {
        id: 'diff-5',
        position: '1.4.1.1.1',
        partId: 'BATTERY-57WH',
        partName: '57WH锂电池',
        type: 'DELETED',
        baseline: { qty: 1, cost: 350, lifecycle: 'Active' },
        compare: { qty: 0, cost: 0, lifecycle: '' },
        deltaCost: -350,
        deltaQty: -1,
        missingCompliance: []
      },
      {
        id: 'diff-6',
        position: '1.4.1.1.1',
        partId: 'BATTERY-68WH',
        partName: '68WH锂电池',
        type: 'ADDED',
        baseline: { qty: 0, cost: 0, lifecycle: '' },
        compare: { qty: 1, cost: 450, lifecycle: 'Active' },
        deltaCost: 450,
        deltaQty: 1,
        missingCompliance: []
      },
      {
        id: 'diff-7',
        position: '1.5.1.1.1',
        partId: 'DISPLAY-14-FHD',
        partName: '14英寸FHD显示屏',
        type: 'COMPLIANCE',
        baseline: { qty: 1, cost: 799, lifecycle: 'Active' },
        compare: { qty: 1, cost: 799, lifecycle: 'Active' },
        deltaCost: 0,
        deltaQty: 0,
        missingCompliance: ['EnergyStar']
      }
    ]
  };
};

// 成本预测模拟数据
const costForecastData = [
  { month: '2024-01', baseline: 7347, compare: 7047 },
  { month: '2024-02', baseline: 7347, compare: 7047 },
  { month: '2024-03', baseline: 7347, compare: 7047 },
  { month: '2024-04', baseline: 7347, compare: 7047 },
  { month: '2024-05', baseline: 7347, compare: 7047 },
  { month: '2024-06', baseline: 7347, compare: 7047 },
];

const BOMBatchCompare = () => {
  const navigate = useNavigate();
  const [selectedBOMs, setSelectedBOMs] = useState([]);
  const [compareDimensions, setCompareDimensions] = useState(['structure', 'cost']);
  const [baselineIndex, setBaselineIndex] = useState(0);
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState(null);
  const [isECNGenerated, setIsECNGenerated] = useState(false);
  const [ecnId, setEcnId] = useState(null);

  // 计算总成本差异
  const totalCostDelta = useMemo(() => {
    if (!diffData || !diffData.differences) return 0;
    return diffData.differences.reduce((sum, diff) => sum + diff.deltaCost, 0);
  }, [diffData]);

  // 处理BOM选择
  const handleBOMSelect = (value) => {
    if (value.length > 6) {
      message.warning('最多选择6个BOM进行比对');
      return;
    }
    setSelectedBOMs(value);
    setBaselineIndex(0);
  };

  // 处理维度选择
  const handleDimensionChange = (checkedValues) => {
    setCompareDimensions(checkedValues);
  };

  // 处理基线设定
  const handleBaselineChange = (e) => {
    setBaselineIndex(e.target.value);
  };

  // 计算差异
  const handleCalculateDiff = async () => {
    if (selectedBOMs.length < 2) {
      message.warning('请至少选择2个BOM进行比对');
      return;
    }
    
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 使用模拟数据
      const mockDiff = generateMockDiffData();
      setDiffData(mockDiff);
      setIsECNGenerated(false);
      setEcnId(null);
      setSelectedRows([]);
      
      message.success('差异计算完成');
    } catch (error) {
      message.error('差异计算失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 处理选择行
  const handleSelectRow = (selectedRowKeys, selectedRows) => {
    setSelectedRows(selectedRows);
  };

  // 处理详情抽屉
  const showDetailDrawer = (record) => {
    setSelectedDiff(record);
    setDetailDrawerVisible(true);
  };

  // 处理采纳
  const handleAdopt = (row) => {
    Modal.confirm({
      title: '采纳差异',
      content: `确定要采纳 ${row.partName} 的差异吗？这将生成ECN草稿。`,
      onOk: () => {
        // 模拟API调用
        setTimeout(() => {
          message.success('采纳成功');
          const updatedDiffs = diffData.differences.map(diff => 
            diff.id === row.id ? { ...diff, status: 'ADOPTED' } : diff
          );
          setDiffData({ ...diffData, differences: updatedDiffs });
          setDetailDrawerVisible(false);
        }, 500);
      }
    });
  };

  // 处理忽略
  const handleIgnore = (row) => {
    Modal.confirm({
      title: '忽略差异',
      content: `确定要忽略 ${row.partName} 的差异吗？`,
      onOk: () => {
        // 模拟API调用
        setTimeout(() => {
          message.success('忽略成功');
          const updatedDiffs = diffData.differences.map(diff => 
            diff.id === row.id ? { ...diff, status: 'IGNORED' } : diff
          );
          setDiffData({ ...diffData, differences: updatedDiffs });
          setDetailDrawerVisible(false);
        }, 500);
      }
    });
  };

  // 批量采纳
  const handleBatchAdopt = () => {
    Modal.confirm({
      title: '批量采纳',
      content: `确定要采纳选中的 ${selectedRows.length} 项变更吗？`,
      onOk: () => {
        // 模拟API调用
        setTimeout(() => {
          message.success(`已批量采纳 ${selectedRows.length} 项变更`);
          const updatedDiffs = diffData.differences.map(diff => {
            if (selectedRows.some(row => row.id === diff.id) && diff.status !== 'ADOPTED' && diff.status !== 'IGNORED') {
              return { ...diff, status: 'ADOPTED' };
            }
            return diff;
          });
          setDiffData({ ...diffData, differences: updatedDiffs });
          setSelectedRows([]);
        }, 500);
      }
    });
  };

  // 批量忽略
  const handleBatchIgnore = () => {
    Modal.confirm({
      title: '批量忽略',
      content: `确定要忽略选中的 ${selectedRows.length} 项差异吗？`,
      onOk: () => {
        // 模拟API调用
        setTimeout(() => {
          message.success(`已批量忽略 ${selectedRows.length} 项差异`);
          const updatedDiffs = diffData.differences.map(diff => {
            if (selectedRows.some(row => row.id === diff.id) && diff.status !== 'ADOPTED' && diff.status !== 'IGNORED') {
              return { ...diff, status: 'IGNORED' };
            }
            return diff;
          });
          setDiffData({ ...diffData, differences: updatedDiffs });
          setSelectedRows([]);
        }, 500);
      }
    });
  };

  // 生成ECN
  const handleCreateECN = () => {
    Modal.confirm({
      title: '生成ECN',
      content: '确定要生成变更单吗？',
      onOk: () => {
        // 模拟API调用
        setTimeout(() => {
          const mockEcnId = 'ECN-' + Date.now().toString().slice(-6);
          setEcnId(mockEcnId);
          setIsECNGenerated(true);
          message.success(`ECN ${mockEcnId} 生成成功`);
        }, 1000);
      }
    });
  };

  // 导出Excel
  const handleExportExcel = () => {
    // 模拟导出
    setTimeout(() => {
      message.success('Excel导出成功');
    }, 1000);
  };

  // 下载ECN
  const handleDownloadECN = () => {
    // 模拟下载
    setTimeout(() => {
      message.success('ECN下载成功');
    }, 1000);
  };

  // 查看变更单
  const handleViewECN = () => {
    navigate(`/ecn/detail/${ecnId}`);
  };

  // 表格列配置
  const columns = [
    {
      title: '位号',
      dataIndex: 'position',
      key: 'position',
      width: 100
    },
    {
      title: '零件名称',
      dataIndex: 'partName',
      key: 'partName',
      width: 200
    },
    {
      title: '基线用量',
      dataIndex: ['baseline', 'qty'],
      key: 'baselineQty',
      width: 80,
      align: 'center'
    },
    {
      title: '对比用量',
      dataIndex: ['compare', 'qty'],
      key: 'compareQty',
      width: 80,
      align: 'center'
    },
    {
      title: '用量Δ',
      key: 'deltaQty',
      width: 80,
      align: 'center',
      render: (_, record) => {
        const color = record.deltaQty > 0 ? 'red' : record.deltaQty < 0 ? 'green' : 'default';
        const prefix = record.deltaQty > 0 ? '+' : '';
        return <span style={{ color }}>{prefix}{record.deltaQty}🔴</span>;
      }
    },
    {
      title: '基线成本',
      dataIndex: ['baseline', 'cost'],
      key: 'baselineCost',
      width: 100,
      align: 'right',
      render: (text) => text > 0 ? `¥${text}` : '-'
    },
    {
      title: '对比成本',
      dataIndex: ['compare', 'cost'],
      key: 'compareCost',
      width: 100,
      align: 'right',
      render: (text) => text > 0 ? `¥${text}` : '-'
    },
    {
      title: '成本Δ',
      key: 'deltaCost',
      width: 100,
      align: 'right',
      render: (_, record) => {
        const color = record.deltaCost > 0 ? 'red' : record.deltaCost < 0 ? 'green' : 'default';
        const prefix = record.deltaCost > 0 ? '+' : '';
        return <span style={{ color }}>{prefix}¥{record.deltaCost}🔴</span>;
      }
    },
    {
      title: '生命周期Δ',
      key: 'lifecycleDelta',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (record.type === 'LIFE_CYCLE') {
          return (
            <Tag color="red">
              {record.baseline.lifecycle} → {record.compare.lifecycle}🔴
            </Tag>
          );
        }
        return '-';
      }
    },
    {
      title: '合规Δ',
      key: 'complianceDelta',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (record.type === 'COMPLIANCE' && record.missingCompliance.length > 0) {
          return (
            <Tag color="orange">
              {record.missingCompliance[0]}缺失🔴
            </Tag>
          );
        }
        return '-';
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (record.status === 'ADOPTED') {
          return <Tag color="green">已采纳</Tag>;
        }
        if (record.status === 'IGNORED') {
          return <Tag color="gray">已忽略</Tag>;
        }
        return (
          <>
            <Button size="small" type="link" onClick={() => showDetailDrawer(record)}>
              详情
            </Button>
            <Button size="small" type="link" onClick={() => handleAdopt(record)} disabled={record.status === 'ADOPTED' || record.status === 'IGNORED'}>
              采纳
            </Button>
            <Button size="small" type="link" onClick={() => handleReplace(record)} disabled={record.status === 'ADOPTED' || record.status === 'IGNORED' || record.type === 'DELETED'}>
              替换
            </Button>
          </>
        );
      }
    }
  ];

  // 行样式
  const getRowClassName = (record) => {
    if (record.status === 'ADOPTED') return 'text-gray-500';
    if (record.status === 'IGNORED') return 'text-gray-400';
    
    switch (record.type) {
      case 'ADDED':
        return 'diff-added';
      case 'DELETED':
        return 'diff-deleted';
      case 'MODIFIED':
        return 'diff-modified';
      case 'LIFE_CYCLE':
      case 'COMPLIANCE':
        return 'diff-compliance';
      default:
        return '';
    }
  };

  // 替换为备选
  const handleReplace = (row) => {
    Modal.confirm({
      title: '替换为备选',
      content: `确定要将 ${row.partName} 替换为备选零件吗？`,
      onOk: () => {
        // 模拟API调用
        setTimeout(() => {
          message.success('已打开替代料选择抽屉');
          // 这里可以实现替代料选择逻辑
        }, 500);
      }
    });
  };

  return (
    <Layout className="min-h-screen">
      {/* 顶部工具栏 */}
      <Header className="bg-white border-b border-gray-200 p-0 h-auto">
        <Card className="m-4 shadow-sm">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <div className="mb-2 font-medium">BOM选择器</div>
              <Select
                mode="multiple"
                placeholder="请选择2-6个BOM进行比对"
                style={{ width: '100%' }}
                value={selectedBOMs}
                onChange={handleBOMSelect}
                maxTagCount="responsive"
              >
                {mockBOMs.map(bom => (
                  <Option key={bom.id} value={bom.id}>
                    {bom.name} ({bom.product} {bom.version})
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <div className="mb-2 font-medium">对比维度</div>
              <Checkbox.Group 
                className="w-full"
                value={compareDimensions} 
                onChange={handleDimensionChange}
              >
                <Row gutter={8}>
                  <Col span={12}><Checkbox value="structure">结构</Checkbox></Col>
                  <Col span={12}><Checkbox value="cost">成本</Checkbox></Col>
                  <Col span={12}><Checkbox value="compliance">合规</Checkbox></Col>
                  <Col span={12}><Checkbox value="lifecycle">生命周期</Checkbox></Col>
                </Row>
              </Checkbox.Group>
            </Col>
            <Col xs={24} md={8}>
              <div className="mb-2 font-medium">基线设定</div>
              <Radio.Group value={baselineIndex} onChange={handleBaselineChange}>
                <Radio value={0}>以第一个为基线</Radio>
              </Radio.Group>
            </Col>
          </Row>
          <div className="mt-4 text-right">
            <Button
              type="primary"
              size="large"
              onClick={handleCalculateDiff}
              disabled={selectedBOMs.length < 2 || compareDimensions.length === 0}
              loading={loading}
            >
              计算差异
            </Button>
          </div>
        </Card>
      </Header>

      {/* 主内容区 */}
      <Content className="p-4">
        <Layout className="min-h-[60vh]">
          {/* 左侧差异看板 */}
          <Content className="p-4 bg-white rounded-l-lg border border-gray-200">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spin size="large" tip="正在计算差异..." />
              </div>
            ) : diffData ? (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">差异看板</h2>
                  <div className="flex gap-2">
                    <Tag color="blue">基线: {mockBOMs.find(b => b.id === diffData.baselineBomId)?.name}</Tag>
                    <Tag color="purple">对比项: {diffData.compareBomIds.length}个</Tag>
                    <Tag color={totalCostDelta >= 0 ? "red" : "green"}>
                      总成本Δ: {totalCostDelta >= 0 ? '+' : ''}¥{totalCostDelta}
                    </Tag>
                  </div>
                </div>
                <Table
                  columns={columns}
                  dataSource={diffData.differences}
                  rowKey="id"
                  rowClassName={getRowClassName}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条差异`
                  }}
                  rowSelection={{
                    onChange: handleSelectRow,
                    selectedRowKeys: selectedRows.map(row => row.id),
                    getCheckboxProps: (record) => ({
                      disabled: record.status === 'ADOPTED' || record.status === 'IGNORED'
                    })
                  }}
                />
              </>
            ) : (
              <Empty 
                description="请选择BOM并点击计算差异" 
                className="my-12"
              />
            )}
          </Content>

          {/* 右侧差异详情抽屉 */}
          <Drawer
            title="差异详情"
            placement="right"
            onClose={() => setDetailDrawerVisible(false)}
            open={detailDrawerVisible}
            width={450}
          >
            {selectedDiff && (
              <div>
                <Card title="差异快照" className="mb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>零件名称:</span>
                      <span className="font-medium">{selectedDiff.partName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>零件ID:</span>
                      <span>{selectedDiff.partId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>位号:</span>
                      <span>{selectedDiff.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>差异类型:</span>
                      <Tag color={
                        selectedDiff.type === 'ADDED' ? 'green' :
                        selectedDiff.type === 'DELETED' ? 'red' :
                        selectedDiff.type === 'MODIFIED' ? 'orange' :
                        selectedDiff.type === 'LIFE_CYCLE' || selectedDiff.type === 'COMPLIANCE' ? 'purple' : 'blue'
                      }>
                        {{
                          'ADDED': '新增',
                          'DELETED': '删除',
                          'MODIFIED': '修改',
                          'LIFE_CYCLE': '生命周期变更',
                          'COMPLIANCE': '合规变更'
                        }[selectedDiff.type]}
                      </Tag>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between mb-2">
                        <span>基线用量:</span>
                        <span>{selectedDiff.baseline.qty}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>对比用量:</span>
                        <span>{selectedDiff.compare.qty}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>用量变化:</span>
                        <span style={{ color: selectedDiff.deltaQty > 0 ? 'red' : selectedDiff.deltaQty < 0 ? 'green' : 'default' }}>
                          {selectedDiff.deltaQty > 0 ? '+' : ''}{selectedDiff.deltaQty}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between mb-2">
                        <span>基线成本:</span>
                        <span>¥{selectedDiff.baseline.cost}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>对比成本:</span>
                        <span>¥{selectedDiff.compare.cost}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>成本变化:</span>
                        <span style={{ color: selectedDiff.deltaCost > 0 ? 'red' : selectedDiff.deltaCost < 0 ? 'green' : 'default' }}>
                          {selectedDiff.deltaCost > 0 ? '+' : ''}¥{selectedDiff.deltaCost}
                        </span>
                      </div>
                    </div>
                    {selectedDiff.type === 'LIFE_CYCLE' && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between">
                          <span>生命周期变化:</span>
                          <span className="text-red-500">
                            {selectedDiff.baseline.lifecycle} → {selectedDiff.compare.lifecycle}
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedDiff.type === 'COMPLIANCE' && selectedDiff.missingCompliance.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between">
                          <span>缺失合规项:</span>
                          <span className="text-orange-500">{selectedDiff.missingCompliance.join(', ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
                
                <Card title="成本影响曲线" className="mb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={costForecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `¥${value}`} />
                      <Legend />
                      <Line type="monotone" dataKey="baseline" stroke="#8884d8" name="基线成本" />
                      <Line type="monotone" dataKey="compare" stroke="#82ca9d" name="对比成本" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <div className="flex justify-between">
                  <Button size="large" onClick={() => handleIgnore(selectedDiff)} disabled={selectedDiff.status === 'ADOPTED' || selectedDiff.status === 'IGNORED'}>
                    忽略
                  </Button>
                  <Button type="default" size="large" onClick={() => handleReplace(selectedDiff)} disabled={selectedDiff.status === 'ADOPTED' || selectedDiff.status === 'IGNORED' || selectedDiff.type === 'DELETED'}>
                    替换为备选
                  </Button>
                  <Button type="primary" size="large" onClick={() => handleAdopt(selectedDiff)} disabled={selectedDiff.status === 'ADOPTED' || selectedDiff.status === 'IGNORED'}>
                    采纳当前
                  </Button>
                </div>
              </div>
            )}
          </Drawer>
        </Layout>
      </Content>

      {/* 底部批量操作栏 */}
      {diffData && (
        <Footer className="bg-white border-t border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div>
              {!isECNGenerated ? (
                <>
                  <Button 
                    type="default" 
                    disabled={diffData.differences.length === 0} 
                    onClick={() => {
                      const allUnprocessed = diffData.differences.filter(d => d.status !== 'ADOPTED' && d.status !== 'IGNORED');
                      setSelectedRows(allUnprocessed);
                    }}
                  >
                    全选
                  </Button>
                  <Button 
                    type="default" 
                    disabled={diffData.differences.length === 0} 
                    onClick={handleExportExcel}
                    className="ml-2"
                  >
                    <DownloadOutlined /> 导出Excel
                  </Button>
                  <Button 
                    type="primary" 
                    disabled={diffData.differences.length === 0} 
                    onClick={handleCreateECN}
                    className="ml-2"
                  >
                    生成ECN
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    type="default" 
                    onClick={handleDownloadECN}
                  >
                    <DownloadOutlined /> 下载ECN
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={handleViewECN}
                    className="ml-2"
                  >
                    <EyeOutlined /> 查看变更单
                  </Button>
                </>
              )}
            </div>
            <div>
        {selectedRows.length > 0 && !isECNGenerated && (
          <>
            <Button 
              type="default" 
              onClick={handleBatchIgnore}
              disabled={selectedRows.some(row => row.status === 'ADOPTED' || row.status === 'IGNORED')}
            >
              批量忽略
            </Button>
            <Button 
              type="primary" 
              onClick={handleBatchAdopt}
              disabled={selectedRows.some(row => row.status === 'ADOPTED' || row.status === 'IGNORED')}
              className="ml-2"
            >
              批量采纳
            </Button>
          </>
        )}
      </div>
          </div>
        </Footer>
      )}

      {/* 样式 */}
      <style>{`
        .diff-added {
          border-left: 4px solid #52c41a;
        }
        .diff-deleted {
          text-decoration: line-through;
          opacity: 0.6;
          border-left: 4px solid #ff4d4f;
        }
        .diff-modified {
          border-left: 4px solid #faad14;
        }
        .diff-compliance {
          border-left: 4px solid #722ed1;
        }
        .text-gray-500 {
          color: #8c8c8c;
        }
        .text-gray-400 {
          color: #bfbfbf;
        }
        /* 替代料差异标记 */
        .ant-table-tbody tr {
          position: relative;
        }
        .ant-table-tbody tr:not(.text-gray-500):not(.text-gray-400) td:last-child {
          position: relative;
        }
        .ant-table-tbody tr:not(.text-gray-500):not(.text-gray-400) {
          background-image: radial-gradient(circle at calc(100% - 10px) 50%, orange 4px, transparent 0);
        }
      `}</style>
    </Layout>
  );
};

export default BOMBatchCompare;