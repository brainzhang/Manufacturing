import React, { useState, useEffect } from 'react';
import { Card, Table, Button, DatePicker, Select, Input, Tag, Space, Tooltip, Badge, Divider, message } from 'antd';
import { SyncOutlined, FilterOutlined, SearchOutlined, DownloadOutlined, ClearOutlined } from '@ant-design/icons';
import { format } from 'date-fns';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

/**
 * 同步日志组件
 * 用于展示数据同步的历史记录、状态和详情
 */
const SyncLog = () => {
  const [syncLogs, setSyncLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    syncType: 'all',
    syncStatus: 'all',
    dateRange: null,
    searchTerm: ''
  });

  // 模拟同步日志数据
  const mockSyncLogs = [
    {
      logId: 'SYNC-20241115-001',
      syncType: 'FULL',
      startTime: '2024-11-15 10:30:00',
      endTime: '2024-11-15 10:45:30',
      duration: '15分30秒',
      status: 'SUCCESS',
      syncedItems: 1256,
      failedItems: 0,
      differencesFound: 12,
      alignedItems: 0,
      syncBy: 'SYSTEM',
      description: '每日全量同步',
      details: '同步了1256个BOM项目，发现12处差异'
    },
    {
      logId: 'SYNC-20241115-002',
      syncType: 'INCREMENTAL',
      startTime: '2024-11-15 08:15:00',
      endTime: '2024-11-15 08:16:45',
      duration: '1分45秒',
      status: 'SUCCESS',
      syncedItems: 45,
      failedItems: 0,
      differencesFound: 2,
      alignedItems: 0,
      syncBy: 'SYSTEM',
      description: '增量同步',
      details: '同步了45个BOM项目，发现2处差异'
    },
    {
      logId: 'SYNC-20241114-003',
      syncType: 'MANUAL',
      startTime: '2024-11-14 16:45:00',
      endTime: '2024-11-14 16:47:20',
      duration: '2分20秒',
      status: 'PARTIAL_SUCCESS',
      syncedItems: 8,
      failedItems: 1,
      differencesFound: 0,
      alignedItems: 3,
      syncBy: 'zhangsan',
      description: '手动触发同步 ThinkPad X1 Carbon BOM',
      details: '同步8个项目，1个失败，3个差异已对齐'
    },
    {
      logId: 'SYNC-20241114-002',
      syncType: 'FULL',
      startTime: '2024-11-14 10:30:00',
      endTime: '2024-11-14 10:48:12',
      duration: '18分12秒',
      status: 'SUCCESS',
      syncedItems: 1250,
      failedItems: 0,
      differencesFound: 8,
      alignedItems: 0,
      syncBy: 'SYSTEM',
      description: '每日全量同步',
      details: '同步了1250个BOM项目，发现8处差异'
    },
    {
      logId: 'SYNC-20241113-001',
      syncType: 'FULL',
      startTime: '2024-11-13 10:30:00',
      endTime: '2024-11-13 10:31:05',
      duration: '1分05秒',
      status: 'FAILED',
      syncedItems: 0,
      failedItems: 0,
      differencesFound: 0,
      alignedItems: 0,
      syncBy: 'SYSTEM',
      description: '每日全量同步',
      details: 'SAP连接失败，请检查网络连接'
    }
  ];

  // 加载同步日志
  useEffect(() => {
    loadSyncLogs();
  }, []);

  // 应用过滤条件
  useEffect(() => {
    applyFilters();
  }, [syncLogs, filters]);

  const loadSyncLogs = () => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setSyncLogs(mockSyncLogs);
      setLoading(false);
    }, 500);
  };

  const applyFilters = () => {
    let filtered = [...syncLogs];
    
    // 按同步类型过滤
    if (filters.syncType !== 'all') {
      filtered = filtered.filter(log => log.syncType === filters.syncType);
    }
    
    // 按状态过滤
    if (filters.syncStatus !== 'all') {
      filtered = filtered.filter(log => log.status === filters.syncStatus);
    }
    
    // 按日期范围过滤
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(log => {
        const logDate = new Date(log.startTime);
        return logDate >= start && logDate <= end;
      });
    }
    
    // 按搜索词过滤
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.logId.toLowerCase().includes(term) ||
        log.syncBy.toLowerCase().includes(term) ||
        log.description.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term)
      );
    }
    
    setFilteredLogs(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleClearFilters = () => {
    setFilters({
      syncType: 'all',
      syncStatus: 'all',
      dateRange: null,
      searchTerm: ''
    });
  };

  const handleDownloadLogs = () => {
    message.success('导出日志成功');
  };

  // 获取状态标签配置
  const getStatusTag = (status) => {
    const statusConfig = {
      SUCCESS: { color: 'green', text: '成功', icon: <CheckOutlined /> },
      PARTIAL_SUCCESS: { color: 'orange', text: '部分成功', icon: <AlertCircleOutlined /> },
      FAILED: { color: 'red', text: '失败', icon: <AlertCircleOutlined /> }
    };
    const config = statusConfig[status] || { color: 'default', text: '未知', icon: null };
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // 获取同步类型标签配置
  const getSyncTypeTag = (type) => {
    const typeConfig = {
      FULL: { color: 'blue', text: '全量' },
      INCREMENTAL: { color: 'cyan', text: '增量' },
      MANUAL: { color: 'purple', text: '手动' }
    };
    const config = typeConfig[type] || { color: 'default', text: '未知' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 计算统计信息
  const getStatistics = () => {
    const total = filteredLogs.length;
    const success = filteredLogs.filter(log => log.status === 'SUCCESS').length;
    const partial = filteredLogs.filter(log => log.status === 'PARTIAL_SUCCESS').length;
    const failed = filteredLogs.filter(log => log.status === 'FAILED').length;
    const totalSynced = filteredLogs.reduce((sum, log) => sum + log.syncedItems, 0);
    const totalDifferences = filteredLogs.reduce((sum, log) => sum + log.differencesFound, 0);
    const totalAligned = filteredLogs.reduce((sum, log) => sum + log.alignedItems, 0);

    return {
      total,
      success,
      partial,
      failed,
      totalSynced,
      totalDifferences,
      totalAligned
    };
  };

  const stats = getStatistics();

  // 表格列配置
  const columns = [
    {
      title: '同步ID',
      dataIndex: 'logId',
      key: 'logId',
      width: 180
    },
    {
      title: '同步类型',
      dataIndex: 'syncType',
      key: 'syncType',
      width: 100,
      render: (type) => getSyncTypeTag(type)
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status)
    },
    {
      title: '同步项数',
      dataIndex: 'syncedItems',
      key: 'syncedItems',
      width: 100
    },
    {
      title: '失败项数',
      dataIndex: 'failedItems',
      key: 'failedItems',
      width: 100,
      render: (count) => count > 0 ? <Tag color="red">{count}</Tag> : count
    },
    {
      title: '发现差异',
      dataIndex: 'differencesFound',
      key: 'differencesFound',
      width: 100,
      render: (count) => count > 0 ? <Tag color="orange">{count}</Tag> : count
    },
    {
      title: '已对齐',
      dataIndex: 'alignedItems',
      key: 'alignedItems',
      width: 100,
      render: (count) => count > 0 ? <Tag color="green">{count}</Tag> : count
    },
    {
      title: '操作人',
      dataIndex: 'syncBy',
      key: 'syncBy',
      width: 100
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span style={{ cursor: 'help' }}>查看</span>
        </Tooltip>
      )
    }
  ];

  return (
    <div className="sync-log">
      <Card title="同步日志">
        {/* 统计信息 */}
        <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
          <Space size={32}>
            <div>
              <div style={{ fontWeight: 'bold' }}>总记录: {stats.total}</div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#52c41a' }}>成功: {stats.success}</div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#fa8c16' }}>部分成功: {stats.partial}</div>
            </div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#f5222d' }}>失败: {stats.failed}</div>
            </div>
            <Divider type="vertical" />
            <div>
              <div>总同步项: {stats.totalSynced}</div>
            </div>
            <div>
              <div>总差异: {stats.totalDifferences}</div>
            </div>
            <div>
              <div>已对齐: {stats.totalAligned}</div>
            </div>
          </Space>
        </div>

        {/* 过滤条件 */}
        <div style={{ marginBottom: 16, padding: 16, background: '#fff', border: '1px solid #d9d9d9', borderRadius: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <FilterOutlined style={{ marginRight: 8 }} />
            <span style={{ fontWeight: 'bold' }}>过滤条件</span>
            <Button 
              type="text" 
              danger 
              icon={<ClearOutlined />} 
              style={{ marginLeft: 'auto' }}
              onClick={handleClearFilters}
            >
              清除所有过滤
            </Button>
          </div>
          
          <Space wrap style={{ width: '100%' }}>
            <Select 
              placeholder="同步类型"
              value={filters.syncType}
              onChange={(value) => handleFilterChange('syncType', value)}
              style={{ width: 150 }}
            >
              <Option value="all">所有类型</Option>
              <Option value="FULL">全量</Option>
              <Option value="INCREMENTAL">增量</Option>
              <Option value="MANUAL">手动</Option>
            </Select>
            
            <Select 
              placeholder="同步状态"
              value={filters.syncStatus}
              onChange={(value) => handleFilterChange('syncStatus', value)}
              style={{ width: 150 }}
            >
              <Option value="all">所有状态</Option>
              <Option value="SUCCESS">成功</Option>
              <Option value="PARTIAL_SUCCESS">部分成功</Option>
              <Option value="FAILED">失败</Option>
            </Select>
            
            <RangePicker 
              value={filters.dateRange}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
              placeholder={['开始日期', '结束日期']}
              style={{ width: 320 }}
            />
            
            <Search
              placeholder="搜索ID/描述/详情"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
            
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={handleDownloadLogs}
            >
              导出日志
            </Button>
          </Space>
        </div>

        {/* 日志表格 */}
        <Table 
          columns={columns} 
          dataSource={filteredLogs} 
          rowKey="logId"
          pagination={{ pageSize: 10 }}
          loading={loading}
          scroll={{ x: 1500 }}
        />
      </Card>
    </div>
  );
};

export default SyncLog;