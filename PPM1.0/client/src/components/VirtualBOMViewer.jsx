import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Space, 
  Button, 
  Tooltip,
  Input,
  Select,
  Statistic,
  Row,
  Col,
  Progress,
  Modal,
  Empty,
  message
} from 'antd';
import { 
  SearchOutlined, 
  ExportOutlined,
  FilterOutlined,
  EyeOutlined,
  SwapOutlined,
  StopOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { calculateInitialCost } from './BOMStructureNew';

const { Option } = Select;
const { Search } = Input;

// 7层BOM结构常量
const BOM_LEVELS = {
  L1: { name: '整机', level: 1, isParent: true, canHaveParts: false },
  L2: { name: '模块', level: 2, isParent: true, canHaveParts: false },
  L3: { name: '子模块', level: 3, isParent: true, canHaveParts: false },
  L4: { name: '族', level: 4, isParent: true, canHaveParts: false },
  L5: { name: '组', level: 5, isParent: true, canHaveParts: false },
  L6: { name: '主料', level: 6, isParent: false, canHaveParts: true },
  L7: { name: '替代料', level: 7, isParent: false, canHaveParts: true }
};

// 扁平化BOM树数据
const flattenBOMTree = (nodes, parentPath = []) => {
  let result = [];
  
  const traverse = (nodeList, path) => {
    nodeList.forEach(node => {
      const currentPath = [...path, node.title];
      const row = {
        ...node,
        path: currentPath.join(' > '),
        levelName: BOM_LEVELS[`L${node.level}`].name
      };
      
      result.push(row);
      
      if (node.children && node.children.length > 0) {
        traverse(node.children, currentPath);
      }
    });
  };
  
  traverse(nodes, parentPath);
  return result;
};

// 计算BOM成本
const calculateBOMCost = (flatData) => {
  let totalCost = 0;
  const supplierSet = new Set(); // 用于去重统计供应商
  
  flatData.forEach(item => {
    // 只统计活跃状态的非替代料成本
    if (item.level === BOM_LEVELS.L6.level && item.status === 'Active') {
      const itemCost = (item.cost || 0) * (item.quantity || 1);
      totalCost += itemCost;
      
      // 统计供应商（去重）
      if (item.supplier) {
        supplierSet.add(item.supplier);
      }
    }
  });
  
  return {
    totalCost,
    supplierCount: supplierSet.size,
    totalParts: flatData.filter(item => item.level === BOM_LEVELS.L6.level).length,
    activeParts: flatData.filter(item => item.level === BOM_LEVELS.L6.level && item.status === 'Active').length,
    alternativeParts: flatData.filter(item => item.level === BOM_LEVELS.L7.level).length
  };
};

// 虚拟BOM查看器组件
const VirtualBOMViewer = ({ bomData, onAction }) => {
  const [flatData, setFlatData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statistics, setStatistics] = useState({
    totalCost: 0,
    supplierCount: 0,
    totalParts: 0,
    activeParts: 0,
    alternativeParts: 0
  });
  const [selectedRow, setSelectedRow] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 扁平化BOM树数据
  useEffect(() => {
    if (bomData && bomData.length > 0) {
      setLoading(true);
      
      // 模拟处理时间
      setTimeout(() => {
        const flat = flattenBOMTree(bomData);
        setFlatData(flat);
        setFilteredData(flat);
        
        // 计算成本统计
        const costStats = calculateBOMCost(flat);
        setStatistics(costStats);
        
        setLoading(false);
      }, 300);
    } else {
      setFlatData([]);
      setFilteredData([]);
    }
  }, [bomData]);

  // 应用过滤条件
  useEffect(() => {
    let filtered = [...flatData];
    
    // 应用文本搜索
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.position.toLowerCase().includes(searchLower) ||
        item.materialName.toLowerCase().includes(searchLower) ||
        item.supplier.toLowerCase().includes(searchLower)
      );
    }
    
    // 应用层级过滤
    if (levelFilter) {
      filtered = filtered.filter(item => item.level === parseInt(levelFilter));
    }
    
    // 应用状态过滤
    if (statusFilter) {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    setFilteredData(filtered);
  }, [flatData, searchText, levelFilter, statusFilter]);

  // 获取层级颜色
  const getLevelColor = (level) => {
    const colorMap = {
      1: 'red',
      2: 'orange',
      3: 'gold',
      4: 'green',
      5: 'blue',
      6: 'purple',
      7: 'cyan'
    };
    return colorMap[level] || 'default';
  };

  // 操作处理
  const handleAction = (action, record) => {
    if (onAction) {
      onAction(action, record);
    }
  };

  // 显示详情
  const showDetail = (record) => {
    setSelectedRow(record);
    setShowDetailModal(true);
  };

  // 导出数据
  const handleExport = () => {
    // 这里可以实现实际的导出逻辑
    message.success('导出功能开发中...');
  };

  // 表格列定义
  const columns = [
    {
      title: '位号',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      fixed: 'left',
      render: (text, record) => (
        <span>{text || '-'}</span>
      )
    },
    {
      title: '零件名称',
      dataIndex: 'materialName',
      key: 'materialName',
      width: 180,
      ellipsis: true,
      render: (text, record) => (
        <span style={{
          color: record.level === BOM_LEVELS.L7.level ? '#999' : 'inherit',
          textDecoration: record.level === BOM_LEVELS.L7.level ? 'line-through' : 'none'
        }}>
          {text || record.title || '-'}
        </span>
      )
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      filters: [
        { text: 'L1 整机', value: BOM_LEVELS.L1.level },
        { text: 'L2 模块', value: BOM_LEVELS.L2.level },
        { text: 'L3 子模块', value: BOM_LEVELS.L3.level },
        { text: 'L4 族', value: BOM_LEVELS.L4.level },
        { text: 'L5 组', value: BOM_LEVELS.L5.level },
        { text: 'L6 主料', value: BOM_LEVELS.L6.level },
        { text: 'L7 替代料', value: BOM_LEVELS.L7.level }
      ],
      render: (level) => (
        <Tag color={getLevelColor(level)}>
          L{level} {BOM_LEVELS[`L${level}`].name}
        </Tag>
      )
    },
    {
      title: '用量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'right',
      render: (text, record) => (
        <span>
          {text} {record.unit || ''}
        </span>
      )
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      align: 'right',
      render: (text) => (
        <span>¥{text}</span>
      )
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 120,
      ellipsis: true
    },
    {
      title: '差异',
      dataIndex: 'variance',
      key: 'variance',
      width: 100,
      align: 'right',
      render: (text) => (
        <span style={{ color: text < 0 ? '#f5222d' : text > 0 ? '#52c41a' : 'inherit' }}>
          {text ? `${text}%` : '-'}
        </span>
      )
    },
    {
      title: '生命周期',
      dataIndex: 'lifecycle',
      key: 'lifecycle',
      width: 120,
      filters: [
        { text: '规划中', value: '规划中' },
        { text: '开发中', value: '开发中' },
        { text: '量产', value: '量产' },
        { text: '维护期', value: '维护期' },
        { text: '已停产', value: '已停产' }
      ]
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '活跃', value: 'Active' },
        { text: '已弃用', value: 'Deprecated' },
        { text: '已替换', value: 'Replaced' }
      ],
      render: (status) => {
        const statusConfig = {
          'Active': { color: 'green', text: '活跃' },
          'Deprecated': { color: 'red', text: '已弃用' },
          'Replaced': { color: 'orange', text: '已替换' }
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.level >= BOM_LEVELS.L6.level && (
            <>
              {record.status === 'Active' ? (
                <Tooltip title="弃用">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<StopOutlined />}
                    onClick={() => handleAction('deprecate', record)}
                    style={{ color: '#ff4d4f' }}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="启用">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleAction('enable', record)}
                    style={{ color: '#52c41a' }}
                  />
                </Tooltip>
              )}
              
              <Tooltip title="替换">
                <Button 
                  type="text" 
                  size="small" 
                  icon={<SwapOutlined />}
                  onClick={() => handleAction('replace', record)}
                />
              </Tooltip>
            </>
          )}
          
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => showDetail(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Card 
      title="BOM虚拟滚动查看器" 
      loading={loading}
      extra={
        <Space>
          <Button 
            icon={<ExportOutlined />}
            onClick={handleExport}
          >
            导出
          </Button>
        </Space>
      }
    >
      {/* 筛选和搜索区域 */}
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Search
              placeholder="搜索位号、零件名称或供应商"
              allowClear
              enterButton
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onSearch={value => setSearchText(value)}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="筛选层级"
              style={{ width: '100%' }}
              allowClear
              value={levelFilter}
              onChange={value => setLevelFilter(value)}
            >
              <Option value={BOM_LEVELS.L1.level}>L1 整机</Option>
              <Option value={BOM_LEVELS.L2.level}>L2 模块</Option>
              <Option value={BOM_LEVELS.L3.level}>L3 子模块</Option>
              <Option value={BOM_LEVELS.L4.level}>L4 族</Option>
              <Option value={BOM_LEVELS.L5.level}>L5 组</Option>
              <Option value={BOM_LEVELS.L6.level}>L6 主料</Option>
              <Option value={BOM_LEVELS.L7.level}>L7 替代料</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="筛选状态"
              style={{ width: '100%' }}
              allowClear
              value={statusFilter}
              onChange={value => setStatusFilter(value)}
            >
              <Option value="Active">活跃</Option>
              <Option value="Deprecated">已弃用</Option>
              <Option value="Replaced">已替换</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Space>
              <Button icon={<FilterOutlined />} size="small">
                高级筛选
              </Button>
            </Space>
          </Col>
        </Row>
      </div>
      
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic 
              title="总成本" 
              value={calculateInitialCost(bomData)} 
              precision={2}
              prefix="¥" 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="供应商数" value={statistics.supplierCount} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="活跃零件" value={statistics.activeParts} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="替代料数" value={statistics.alternativeParts} />
          </Card>
        </Col>
      </Row>
      
      {/* 表格区域 */}
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="key"
        scroll={{ x: 1500, y: 500 }}
        pagination={{
          current: 1,
          pageSize: 50,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        rowClassName={record => 
          record.level === BOM_LEVELS.L7.level ? 'alternative-row' : ''
        }
      />
      
      {/* 详情弹窗 */}
      <Modal
        title="BOM节点详情"
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        footer={null}
        width={800}
      >
        {selectedRow && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>基本信息</div>
                  <div>节点名称: {selectedRow.title}</div>
                  <div>层级: L{selectedRow.level} - {selectedRow.levelName}</div>
                  <div>位号: {selectedRow.position || '-'}</div>
                  <div>路径: {selectedRow.path}</div>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>物料信息</div>
                  <div>零件名称: {selectedRow.materialName || '-'}</div>
                  <div>用量: {selectedRow.quantity} {selectedRow.unit || ''}</div>
                  <div>单价: ¥{selectedRow.cost}</div>
                  <div>小计: ¥{(selectedRow.cost * selectedRow.quantity).toFixed(2)}</div>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>业务信息</div>
                  <div>供应商: {selectedRow.supplier || '-'}</div>
                  <div>生命周期: {selectedRow.lifecycle || '-'}</div>
                  <div>状态: {selectedRow.status || '-'}</div>
                </div>
              </Col>
              
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8 }}>差异分析</div>
                  <div>成本差异: {selectedRow.variance ? `${selectedRow.variance}%` : '-'}</div>
                  {selectedRow.level === BOM_LEVELS.L7.level && (
                    <div style={{ color: '#999', marginTop: 8 }}>
                      注: 替代料不计入总成本核算
                    </div>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
      
      {/* 添加样式 */}
      <style jsx>{`
        .alternative-row {
          color: #999;
          text-decoration: line-through;
          background-color: #f5f5f5;
        }
      `}</style>
    </Card>
  );
};

export default VirtualBOMViewer;