import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Radio, Space, Modal, Form, Input, Select, message, Badge, Collapse, Divider } from 'antd';
import { FileSearchOutlined, CheckOutlined, AlertCircleOutlined, EditOutlined, EyeOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchAlignments, performAlignment, updateAlignment } from '../../services/alignmentService';

const { Option } = Select;
const { Panel } = Collapse;

/**
 * 差异对齐组件
 * 负责检测、分类和修复本地数据与SAP系统数据之间的差异
 */
const AlignmentSync = () => {
  const [alignmentData, setAlignmentData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [actionMode, setActionMode] = useState('view'); // view, edit, fix
  const [form] = Form.useForm();

  // 模拟差异数据
  const mockDifferences = [
    {
      id: 'ALN-20241115-001',
      partId: 'X1-CPU-001',
      partName: 'Intel Core i7-1365U',
      sapValue: '12核',
      localValue: '10核',
      status: 'PENDING',
      alignmentLevel: 'CRITICAL',
      differenceType: 'spec_change',
      createdTime: '2024-11-15 10:30:00',
      lastUpdated: '2024-11-15 10:30:00',
      aiRecommendation: '建议更新本地数据以匹配SAP',
      affectedBoms: ['ThinkPad X1 Carbon BOM-Gen10', 'ThinkPad X1 Yoga BOM-Gen8']
    },
    {
      id: 'ALN-20241115-002',
      partId: 'X1-RAM-002',
      partName: 'DDR5-4800MHz',
      sapValue: '32GB',
      localValue: '16GB',
      status: 'PENDING',
      alignmentLevel: 'HIGH',
      differenceType: 'spec_change',
      createdTime: '2024-11-15 09:45:00',
      lastUpdated: '2024-11-15 09:45:00',
      aiRecommendation: '建议更新本地数据以匹配SAP',
      affectedBoms: ['ThinkPad X1 Carbon BOM-Gen10']
    },
    {
      id: 'ALN-20241114-003',
      partId: 'TB-DISPLAY-16p',
      partName: '16" 4K OLED Display',
      sapValue: 'CNY 3800',
      localValue: 'CNY 3650',
      status: 'ALIGNED',
      alignmentLevel: 'MEDIUM',
      differenceType: 'price_change',
      createdTime: '2024-11-14 16:20:00',
      lastUpdated: '2024-11-14 17:05:00',
      aiRecommendation: '价格差异在可接受范围内',
      affectedBoms: ['ThinkBook 16p BOM-Gen2']
    },
    {
      id: 'ALN-20241114-004',
      partId: 'L490-BATTERY',
      partName: '45Wh 锂电池',
      sapValue: 'Lifecycle: ACTIVE',
      localValue: 'Lifecycle: PHASE_OUT',
      status: 'PENDING',
      alignmentLevel: 'LOW',
      differenceType: 'status_change',
      createdTime: '2024-11-14 14:15:00',
      lastUpdated: '2024-11-14 14:15:00',
      aiRecommendation: '可能是SAP数据错误，建议核实',
      affectedBoms: ['ThinkPad L490 BOM']
    }
  ];

  // 加载差异数据
  useEffect(() => {
    loadDifferences();
  }, []);

  // 应用过滤条件
  useEffect(() => {
    applyFilters();
  }, [alignmentData, filterLevel, filterStatus]);

  const loadDifferences = () => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setAlignmentData(mockDifferences);
      setLoading(false);
    }, 500);
  };

  const applyFilters = () => {
    let filtered = [...alignmentData];
    
    if (filterLevel !== 'all') {
      filtered = filtered.filter(item => item.alignmentLevel === filterLevel);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }
    
    setFilteredData(filtered);
  };

  // 处理批量对齐
  const handleBatchAlign = async () => {
    if (selectedItems.length === 0) {
      message.warning('请选择要对齐的项目');
      return;
    }

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新本地状态
      const updatedData = alignmentData.map(item => 
        selectedItems.includes(item.id) ? { ...item, status: 'ALIGNED' } : item
      );
      setAlignmentData(updatedData);
      setSelectedItems([]);
      message.success(`成功对齐 ${selectedItems.length} 个项目`);
    } catch (error) {
      console.error('Batch align error:', error);
      message.error('批量对齐失败');
    } finally {
      setLoading(false);
    }
  };

  // 查看详情
  const handleViewDetail = (item) => {
    setCurrentItem(item);
    setActionMode('view');
    form.setFieldsValue({
      sapValue: item.sapValue,
      localValue: item.localValue,
      resolution: ''
    });
    setShowDetailModal(true);
  };

  // 处理对齐修复
  const handleFix = async () => {
    try {
      const values = await form.validateFields();
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const updatedItem = {
        ...currentItem,
        status: 'ALIGNED',
        localValue: values.resolution || currentItem.sapValue,
        lastUpdated: new Date().toLocaleString()
      };
      
      // 更新本地状态
      setAlignmentData(alignmentData.map(item => 
        item.id === currentItem.id ? updatedItem : item
      ));
      
      setShowDetailModal(false);
      message.success('差异已修复');
    } catch (error) {
      console.error('Fix error:', error);
      message.error('修复失败');
    }
  };

  // 获取级别标签配置
  const getLevelTag = (level) => {
    const levelConfig = {
      CRITICAL: { color: 'red', text: '严重' },
      HIGH: { color: 'orange', text: '高' },
      MEDIUM: { color: 'gold', text: '中' },
      LOW: { color: 'blue', text: '低' }
    };
    const config = levelConfig[level] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 获取状态标签配置
  const getStatusTag = (status) => {
    const statusConfig = {
      PENDING: { color: 'default', text: '待处理' },
      ALIGNED: { color: 'green', text: '已对齐' },
      IGNORED: { color: 'gray', text: '已忽略' }
    };
    const config = statusConfig[status] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列配置
  const columns = [
    {
      title: '选择',
      key: 'select',
      width: 60,
      render: (_, record) => (
        <input
          type="checkbox"
          checked={selectedItems.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedItems([...selectedItems, record.id]);
            } else {
              setSelectedItems(selectedItems.filter(id => id !== record.id));
            }
          }}
          disabled={record.status === 'ALIGNED'}
        />
      )
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 180
    },
    {
      title: '零件编码',
      dataIndex: 'partId',
      key: 'partId',
      width: 120
    },
    {
      title: '零件名称',
      dataIndex: 'partName',
      key: 'partName',
      ellipsis: true
    },
    {
      title: 'SAP值',
      dataIndex: 'sapValue',
      key: 'sapValue',
      ellipsis: true
    },
    {
      title: '本地值',
      dataIndex: 'localValue',
      key: 'localValue',
      ellipsis: true
    },
    {
      title: '差异级别',
      dataIndex: 'alignmentLevel',
      key: 'alignmentLevel',
      width: 100,
      render: (level) => getLevelTag(level)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'AI建议',
      dataIndex: 'aiRecommendation',
      key: 'aiRecommendation',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleViewDetail(record)}
          />
          {record.status === 'PENDING' && (
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => {
                setCurrentItem(record);
                setActionMode('fix');
                form.setFieldsValue({
                  sapValue: record.sapValue,
                  localValue: record.localValue,
                  resolution: ''
                });
                setShowDetailModal(true);
              }}
            >
              修复
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="alignment-sync">
      <Card title="数据差异对齐">
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Space>
              <span>过滤条件：</span>
              <Select 
                value={filterLevel}
                onChange={setFilterLevel}
                style={{ width: 120 }}
              >
                <Option value="all">所有级别</Option>
                <Option value="CRITICAL">严重</Option>
                <Option value="HIGH">高</Option>
                <Option value="MEDIUM">中</Option>
                <Option value="LOW">低</Option>
              </Select>
              
              <Select 
                value={filterStatus}
                onChange={setFilterStatus}
                style={{ width: 120 }}
              >
                <Option value="all">所有状态</Option>
                <Option value="PENDING">待处理</Option>
                <Option value="ALIGNED">已对齐</Option>
                <Option value="IGNORED">已忽略</Option>
              </Select>
              
              <Button 
                type="primary" 
                icon={<FileSearchOutlined />} 
                onClick={loadDifferences}
                loading={loading}
              >
                重新检测差异
              </Button>
              
              <Button 
                type="primary" 
                danger
                onClick={handleBatchAlign}
                disabled={selectedItems.length === 0 || loading}
              >
                批量对齐 ({selectedItems.length})
              </Button>
            </Space>
            
            <Badge count={filteredData.filter(item => item.status === 'PENDING').length} color="red">
              <span>待处理: {filteredData.filter(item => item.status === 'PENDING').length} / 总数: {filteredData.length}</span>
            </Badge>
          </div>
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
      </Card>

      {/* 差异详情模态框 */}
      <Modal
        title={`差异详情 - ${currentItem?.partName || ''}`}
        open={showDetailModal}
        width={800}
        onCancel={() => setShowDetailModal(false)}
        footer={actionMode === 'fix' ? [
          <Button key="cancel" onClick={() => setShowDetailModal(false)}>
            取消
          </Button>,
          <Button key="fix" type="primary" onClick={handleFix}>
            修复并对齐
          </Button>
        ] : null}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="差异ID">
            <Input value={currentItem?.id} disabled />
          </Form.Item>
          
          <Form.Item label="零件信息">
            <div>
              <div>编码: {currentItem?.partId}</div>
              <div>名称: {currentItem?.partName}</div>
            </div>
          </Form.Item>
          
          <Divider />
          
          <Form.Item name="sapValue" label="SAP系统值">
            <Input disabled={actionMode !== 'fix'} />
          </Form.Item>
          
          <Form.Item name="localValue" label="本地系统值">
            <Input disabled={actionMode !== 'fix'} />
          </Form.Item>
          
          {actionMode === 'fix' && (
            <Form.Item 
              name="resolution" 
              label="修正值"
              tooltip="留空则默认采用SAP值"
            >
              <Input placeholder="留空则默认采用SAP值" />
            </Form.Item>
          )}
          
          <Form.Item label="差异级别">
            <div>{currentItem && getLevelTag(currentItem.alignmentLevel)}</div>
          </Form.Item>
          
          <Form.Item label="差异类型">
            <Tag>{currentItem?.differenceType === 'spec_change' ? '规格变更' : 
                 currentItem?.differenceType === 'price_change' ? '价格变更' : '状态变更'}</Tag>
          </Form.Item>
          
          <Form.Item label="AI建议">
            <div style={{ padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
              {currentItem?.aiRecommendation}
            </div>
          </Form.Item>
          
          {currentItem?.affectedBoms && currentItem.affectedBoms.length > 0 && (
            <Form.Item label="影响的BOM">
              <div>
                {currentItem.affectedBoms.map((bom, index) => (
                  <Tag key={index} color="blue">{bom}</Tag>
                ))}
              </div>
            </Form.Item>
          )}
          
          <Form.Item label="时间信息">
            <div>
              <div>创建时间: {currentItem?.createdTime}</div>
              <div>最后更新: {currentItem?.lastUpdated}</div>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlignmentSync;