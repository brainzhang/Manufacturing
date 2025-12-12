import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Slider, Select, Typography, Badge, Tooltip } from 'antd';
import { useCostDashboard, CostDriftData } from '../../hooks/useCostDashboard';
import { FilterOutlined, DownOutlined, BulbOutlined, DownloadOutlined, DatabaseOutlined, CarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;
const { Option } = Select;

interface CostDriftTableProps {
  data: CostDriftData[];
  onRowClick: (record: CostDriftData) => void;
  onCostDownClick: (record: CostDriftData) => void;
  onReplaceClick: (record: CostDriftData) => void;
  onSelectionChange: (selectedRowKeys: React.Key[], selectedRows: CostDriftData[]) => void;
  onExportDriftTable?: (selectedRows: CostDriftData[]) => void;
  onGenerateCostSuggestions?: (selectedRows: CostDriftData[]) => void;
  onAddToComparison?: (selectedRows: CostDriftData[]) => void;
}

// 添加全局样式确保表格内容左对齐
const style = document.createElement('style');
style.textContent = `
  .table-content-left .ant-table-cell {
    text-align: left !important;
  }
  .table-content-left .ant-tag {
    margin: 0;
    text-align: left;
  }
  .table-content-left .ant-btn {
    margin-right: 8px;
  }
`;
document.head.appendChild(style);

const CostDriftTable: React.FC<CostDriftTableProps> = (props) => {
  const { 
    data: propDataSource, 
    onRowClick, 
    onCostDownClick, 
    onReplaceClick, 
    onSelectionChange,
    onExportDriftTable,
    onGenerateCostSuggestions,
    onAddToComparison
  } = props;
  const { on } = useCostDashboard();
  
  // 使用state管理表格数据，支持props初始值和事件更新
  const [dataSource, setDataSource] = useState(propDataSource);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filters, setFilters] = useState({
    lifecycle: [],
    supplier: [],
    deltaPercentRange: [0, 100]
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // 监听成本更新事件
  useEffect(() => {
    const handleCostUpdated = (updatedData: any) => {
      if (updatedData.costDriftData) {
        setDataSource(updatedData.costDriftData);
      }
    };
    
    const cleanup = on('costUpdated', handleCostUpdated);
    
    return () => cleanup();
  }, [on]);
  
  // 监听props变化，支持外部直接更新
  useEffect(() => {
    setDataSource(propDataSource);
  }, [propDataSource]);

  // 计算成本差异
  const calculateDelta = (currentCost: number, targetCost: number): { value: number; percent: number } => {
    const deltaValue = currentCost - targetCost;
    const deltaPercent = targetCost === 0 ? 0 : (deltaValue / targetCost) * 100;
    return { value: deltaValue, percent: deltaPercent };
  };

  // 获取差异颜色 - 严格按照需求：Δ%>+10%：红色，Δ%<−10%：绿色，其余：默认
  const getDeltaColor = (deltaPercent: number): string => {
    if (deltaPercent > 10) return 'red';
    if (deltaPercent < -10) return 'green';
    return 'default';
  };

  // 获取生命周期标签颜色
  const getLifecycleColor = (lifecycle: string): string => {
    switch (lifecycle) {
      case 'PhaseIn': return 'green';
      case 'Production': return 'blue';
      case 'PhaseOut': return 'orange';
      case 'Discontinued': return 'red';
      default: return 'default';
    }
  };

  // 表格列配置
  const columns: ColumnsType<CostDriftData & { deltaValue: number; deltaPercent: number }> = [
    {
      title: '位号',
      dataIndex: 'position',
      key: 'position',
      width: 80,
      align: 'left',
      render: (position) => <Text strong style={{margin: 0, display: 'inline-block'}}>{position}</Text>
    },
    {
      title: '零件名称',
      dataIndex: 'partName',
      key: 'partName',
      ellipsis: true,
      align: 'left',
      render: (partName) => <Text ellipsis={{ tooltip: partName }} style={{margin: 0, display: 'inline-block'}}>{partName}</Text>
    },
    {
      title: '当前成本',
      dataIndex: 'currentCost',
      key: 'currentCost',
      width: 100,
      align: 'left',
      render: (cost) => <Text style={{margin: 0, display: 'inline-block'}}>¥{cost.toLocaleString()}</Text>
    },
    {
      title: '目标成本',
      dataIndex: 'targetCost',
      key: 'targetCost',
      width: 100,
      align: 'left',
      render: (cost) => <Text type="secondary" style={{margin: 0, display: 'inline-block'}}>¥{cost.toLocaleString()}</Text>
    },
    {
      title: 'Δ成本',
      dataIndex: 'deltaValue',
      key: 'deltaValue',
      width: 100,
      align: 'left',
      render: (delta) => {
        const prefix = delta >= 0 ? '+' : '';
        const color = delta > 0 ? 'red' : delta < 0 ? 'green' : 'default';
        return <Text style={{ color: color === 'red' ? '#ff4d4f' : color === 'green' ? '#52c41a' : undefined, margin: 0, display: 'inline-block' }}>{prefix}¥{Math.abs(delta).toLocaleString()}</Text>;
      }
    },
    {
      title: 'Δ%',
      dataIndex: 'deltaPercent',
      key: 'deltaPercent',
      width: 80,
      align: 'left',
      sorter: (a, b) => a.deltaPercent - b.deltaPercent,
      defaultSortOrder: 'descend',
      render: (percent) => {
        const prefix = percent >= 0 ? '+' : '';
        const color = getDeltaColor(percent);
        return (
          <Tag color={color} style={{margin: 0, textAlign: 'left'}}>
            {prefix}{percent.toFixed(1)}%
          </Tag>
        );
      }
    },
    {
      title: '生命周期',
      dataIndex: 'lifecycle',
      key: 'lifecycle',
      width: 120,
      align: 'left',
      filters: [
        { text: 'PhaseIn', value: 'PhaseIn' },
        { text: 'Production', value: 'Production' },
        { text: 'PhaseOut', value: 'PhaseOut' },
        { text: 'Discontinued', value: 'Discontinued' },
      ],
      filteredValue: filters.lifecycle,
      onFilter: (value, record) => record.lifecycle === value,
      render: (lifecycle) => (
        <Tag color={getLifecycleColor(lifecycle)} style={{margin: 0, textAlign: 'left'}}>
          {lifecycle}
        </Tag>
      )
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 100,
      align: 'left',
      filters: [
        ...Array.from(new Set(dataSource.map(item => item.supplier))).map(supplier => ({
          text: supplier,
          value: supplier
        }))
      ],
      filteredValue: filters.supplier,
      onFilter: (value, record) => record.supplier === value,
      render: (supplier) => <Text style={{margin: 0, display: 'inline-block'}}>{supplier}</Text>
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      align: 'left',
      render: (_, record) => (
        <Space size={[4, 0]}>
            <Tooltip title="替换">
              <Button
                type="primary"
                size="small"
                icon={<DatabaseOutlined />}
                onClick={(e) => {
                  e.stopPropagation(); // 阻止事件冒泡到行点击
                  console.log('替换按钮点击:', record.partName);
                  onReplaceClick(record);
                }}
              />
            </Tooltip>
          <Tooltip title="加入对比车">
            <Button
              size="small"
              icon={<CarOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                console.log('加入对比车按钮点击:', record.partName);
                if (onAddToComparison) {
                  onAddToComparison([record]);
                }
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 处理选择变化
  const handleSelectionChange = (newSelectedRowKeys: React.Key[], selectedRows: any[]) => {
    console.log('批量选择变化:', { newSelectedRowKeys, selectedRows: selectedRows.length });
    setSelectedRowKeys(newSelectedRowKeys);
    // 确保传递正确的格式给父组件，包含CostDriftData接口要求的所有必要属性
    const formattedRows = selectedRows.map(row => ({
      id: row.id,
      position: row.position,
      partName: row.partName,
      partType: row.partType || '',
      baselineCost: row.baselineCost || 0,
      currentCost: row.currentCost,
      driftAmount: row.driftAmount || 0,
      driftPercentage: row.driftPercentage || 0,
      lifecycle: row.lifecycle,
      supplier: row.supplier,
      // 保留targetCost但不作为CostDriftData的必要属性
      targetCost: row.targetCost
    }));
    console.log('传递给父组件的选中行:', formattedRows.length);
    onSelectionChange(newSelectedRowKeys, formattedRows);
  };

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: handleSelectionChange,
    // 支持全选功能
    onSelectAll: (selected, selectedRows, changeRows) => {
      console.log('全选操作:', { selected, selectedRows: selectedRows.length, changeRows: changeRows.length });
      // 确保onChange也会被调用，不需要在这里额外处理
    },
    // 修复列宽问题，使用columns中的配置
    // 移除width属性，这不是rowSelection的标准属性
  };

  // 确保columns数组中第一个元素是复选框列的配置
  // 根据需求，将复选框列宽度缩小40%（从40缩小到24）
  const columnsWithSelection = [
    {
      title: '',
      dataIndex: 'selection',
      key: 'selection',
      width: 10, // 再次减少50%后的宽度（24 * 0.5 = 12）
      align: 'left'
    },
    ...columns
  ];

  // 处理行点击
  const handleRowClick = (record: CostDriftData & { deltaValue: number; deltaPercent: number }) => {
    onRowClick(record);
  };

  // 应用过滤器
  const applyFilters = () => {
    setShowFilters(false);
  };

  // 重置过滤器
  const resetFilters = () => {
    setFilters({
      lifecycle: [],
      supplier: [],
      deltaPercentRange: [0, 100]
    });
  };

  // 根据过滤条件过滤数据
  const getFilteredData = () => {
    return dataSource.filter(item => {
      const { value, percent } = calculateDelta(item.currentCost, item.targetCost);
      
      // 生命周期过滤
      if (filters.lifecycle.length > 0 && !filters.lifecycle.includes(item.lifecycle)) {
        return false;
      }
      
      // 供应商过滤
      if (filters.supplier.length > 0 && !filters.supplier.includes(item.supplier)) {
        return false;
      }
      
      // Δ%区间过滤
      if (percent < filters.deltaPercentRange[0] || percent > filters.deltaPercentRange[1]) {
        return false;
      }
      
      return true;
    });
  };

  // 准备表格数据，计算差异值并应用过滤
  const tableData = getFilteredData().map(item => {
    const { value, percent } = calculateDelta(item.currentCost, item.targetCost);
    return {
      ...item,
      key: item.id,
      deltaValue: value,
      deltaPercent: percent
    };
  });

  return (
    <div className="cost-drift-table-container" style={{textAlign: 'left'}}>
      {/* 过滤区域 */}
      <div className="mb-4">
        <Space>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
          >
            筛选 {showFilters && <DownOutlined />}
          </Button>
          <Badge count={selectedRowKeys.length} showZero>
            <span className="px-2 py-1 bg-gray-100 rounded">已选择</span>
          </Badge>
        </Space>

        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <Space direction="vertical" className="w-full">
              <Space>
                <Text strong>生命周期：</Text>
                <Select
                  mode="multiple"
                  placeholder="选择生命周期"
                  style={{ width: 200 }}
                  value={filters.lifecycle}
                  onChange={(values) => setFilters({ ...filters, lifecycle: values })}
                >
                  <Option value="PhaseIn">PhaseIn</Option>
                  <Option value="Production">Production</Option>
                  <Option value="PhaseOut">PhaseOut</Option>
                  <Option value="Discontinued">Discontinued</Option>
                </Select>
              </Space>
              
              <Space>
                <Text strong>供应商：</Text>
                <Select
                  mode="multiple"
                  placeholder="选择供应商"
                  style={{ width: 200 }}
                  value={filters.supplier}
                  onChange={(values) => setFilters({ ...filters, supplier: values })}
                >
                  {Array.from(new Set(dataSource.map(item => item.supplier))).map(supplier => (
                    <Option key={supplier} value={supplier}>{supplier}</Option>
                  ))}
                </Select>
              </Space>
              
              <Space align="center">
                <Text strong>Δ% 区间：</Text>
                <Slider
                  range
                  min={-50}
                  max={100}
                  value={filters.deltaPercentRange}
                  onChange={(values) => setFilters({ ...filters, deltaPercentRange: values })}
                  style={{ width: 300 }}
                />
                <Text>{filters.deltaPercentRange[0]}% - {filters.deltaPercentRange[1]}%</Text>
              </Space>
              
              <Space className="justify-end w-full">
                <Button onClick={resetFilters}>重置</Button>
                <Button type="primary" onClick={applyFilters}>应用</Button>
              </Space>
            </Space>
          </div>
        )}
      </div>

      {/* 表格 */}
      <Table
        rowSelection={rowSelection}
        columns={columnsWithSelection as ColumnsType<any>}
        dataSource={tableData}
        rowKey="id"
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          className: 'cursor-pointer hover:bg-gray-50'
        })}
        // 启用虚拟滚动，支持大数据量渲染
        virtual
        // 优化虚拟滚动性能
        scroll={{ x: 1200, y: 600 }}
        // 确保表格内容左对齐
        className="table-content-left"

        // 大数据量下建议使用服务器端分页
        pagination={{ 
          pageSize: 50, 
          showSizeChanger: true,
          pageSizeOptions: ['50', '100', '200', '500'],
          showQuickJumper: true
        }}
        locale={{
          emptyText: '暂无成本漂移数据'
        }}
      />
      
      {/* 批量操作栏 - 选中≥1行时显示 */}
      {selectedRowKeys.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <Space size="large" className="w-full">
            <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#1890ff' }}>
              <Text strong>已选择 {selectedRowKeys.length} 个零件</Text>
            </Badge>
            
            <div className="ml-auto">
              <Space size="middle">
                
                <Button
                  icon={<BulbOutlined />}
                  onClick={() => {
                    const selectedRows = tableData.filter(row => selectedRowKeys.includes(row.id));
                    if (onGenerateCostSuggestions) onGenerateCostSuggestions(selectedRows);
                  }}
                  disabled={!onGenerateCostSuggestions}
                >
                  生成降本建议
                </Button>
                
                <Button
                  type="primary"
                  icon={<CarOutlined />}
                  onClick={() => {
                    const selectedRows = tableData.filter(row => selectedRowKeys.includes(row.id));
                    if (onAddToComparison) onAddToComparison(selectedRows);
                  }}
                  disabled={!onAddToComparison}
                >
                  加入对比车
                </Button>
              </Space>
            </div>
          </Space>
        </div>
      )}
    </div>
  );
};

export default CostDriftTable;