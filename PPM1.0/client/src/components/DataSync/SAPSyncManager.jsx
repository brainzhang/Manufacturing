import React, { useState, useCallback } from 'react';
import { Card, Button, Radio, Space, Table, Tag, Progress, message, Modal, Form, Input, Select, DatePicker, Divider } from 'antd';
import { CloudUploadOutlined, CloudSyncOutlined, FileTextOutlined, StopOutlined, ReloadOutlined, CheckOutlined, ClockCircleOutlined, AlertCircleOutlined } from '@ant-design/icons';
import { performAlignment } from '../../services/alignmentService';

const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * SAP同步管理器组件
 * 负责与SAP系统的数据同步功能，支持增量同步和全量同步
 */
const SAPSyncManager = () => {
  const [syncMode, setSyncMode] = useState('incremental');
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, completed, failed
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncHistory, setSyncHistory] = useState([
    {
      id: 1,
      timestamp: '2024-11-14 15:30:00',
      mode: '全量',
      status: '成功',
      totalItems: 256,
      syncedItems: 256,
      failedItems: 0,
      duration: '00:05:32'
    },
    {
      id: 2,
      timestamp: '2024-11-14 10:15:00',
      mode: '增量',
      status: '部分成功',
      totalItems: 45,
      syncedItems: 43,
      failedItems: 2,
      duration: '00:01:20'
    },
    {
      id: 3,
      timestamp: '2024-11-13 18:45:00',
      mode: '增量',
      status: '失败',
      totalItems: 32,
      syncedItems: 0,
      failedItems: 32,
      duration: '00:00:45'
    }
  ]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncConfig, setSyncConfig] = useState({
    syncType: 'all', // all, bom, parts, products
    includeHistory: false,
    startDate: null,
    endDate: null,
  });

  // 模拟同步过程
  const simulateSync = () => {
    setSyncStatus('syncing');
    setSyncProgress(0);
    
    let progress = 0;
    const totalSteps = 20;
    const interval = setInterval(() => {
      progress += 5;
      setSyncProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setSyncStatus(Math.random() > 0.2 ? 'completed' : 'failed');
        
        // 记录同步历史
        const newHistory = {
          id: Date.now(),
          timestamp: new Date().toLocaleString(),
          mode: syncMode === 'incremental' ? '增量' : '全量',
          status: Math.random() > 0.2 ? '成功' : '失败',
          totalItems: Math.floor(Math.random() * 100) + 50,
          syncedItems: Math.random() > 0.2 ? Math.floor(Math.random() * 100) + 50 : 0,
          failedItems: Math.random() > 0.2 ? 0 : Math.floor(Math.random() * 5) + 1,
          duration: `00:0${Math.floor(Math.random() * 5)}:${Math.floor(Math.random() * 50) + 10}`
        };
        
        setSyncHistory([newHistory, ...syncHistory]);
        
        if (Math.random() > 0.2) {
          message.success('数据同步成功');
        } else {
          message.error('数据同步失败，请查看日志');
        }
      }
    }, 200);
  };

  // 处理同步操作
  const handleSync = useCallback(() => {
    if (syncStatus === 'syncing') {
      message.warning('同步正在进行中，请稍候...');
      return;
    }
    
    simulateSync();
  }, [syncStatus, syncMode]);

  // 处理取消同步
  const handleCancelSync = useCallback(() => {
    if (syncStatus === 'syncing') {
      setSyncStatus('idle');
      setSyncProgress(0);
      message.info('同步已取消');
    }
  }, [syncStatus]);

  // 处理配置同步
  const handleConfigSync = () => {
    setShowSyncModal(false);
    simulateSync();
  };

  // 渲染同步状态
  const renderSyncStatus = () => {
    const statusMap = {
      idle: { text: '空闲', icon: <ClockCircleOutlined />, color: '#999' },
      syncing: { text: '同步中', icon: <CloudSyncOutlined spin />, color: '#1890ff' },
      completed: { text: '同步完成', icon: <CheckOutlined />, color: '#52c41a' },
      failed: { text: '同步失败', icon: <AlertCircleOutlined />, color: '#f5222d' }
    };
    
    const status = statusMap[syncStatus];
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: status.color, fontSize: 16 }}>{status.icon}</span>
        <span style={{ color: status.color }}>{status.text}</span>
      </div>
    );
  };

  // 同步历史表格列配置
  const historyColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180
    },
    {
      title: '同步类型',
      dataIndex: 'mode',
      key: 'mode',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => (
        <Tag color={text === '成功' ? 'success' : text === '部分成功' ? 'warning' : 'error'}>
          {text}
        </Tag>
      )
    },
    {
      title: '总项目数',
      dataIndex: 'totalItems',
      key: 'totalItems',
      width: 100
    },
    {
      title: '成功数',
      dataIndex: 'syncedItems',
      key: 'syncedItems',
      width: 100
    },
    {
      title: '失败数',
      dataIndex: 'failedItems',
      key: 'failedItems',
      width: 100
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 100
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" icon={<FileTextOutlined />} size="small">
          详情
        </Button>
      )
    }
  ];

  return (
    <div className="sap-sync-manager">
      <Card title="SAP数据同步">
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Space>
              <Radio.Group value={syncMode} onChange={(e) => setSyncMode(e.target.value)}>
                <Radio.Button value="incremental">增量同步</Radio.Button>
                <Radio.Button value="full">全量同步</Radio.Button>
              </Radio.Group>
              
              <Button 
                type="primary" 
                icon={<CloudUploadOutlined />} 
                onClick={handleSync}
                disabled={syncStatus === 'syncing'}
              >
                {syncMode === 'incremental' ? '执行增量同步' : '执行全量同步'}
              </Button>
              
              <Button 
                danger 
                icon={<StopOutlined />} 
                onClick={handleCancelSync}
                disabled={syncStatus !== 'syncing'}
              >
                取消同步
              </Button>
              
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => setShowSyncModal(true)}
                disabled={syncStatus === 'syncing'}
              >
                高级配置
              </Button>
            </Space>
            <div>
              {renderSyncStatus()}
            </div>
          </div>
          
          {syncStatus === 'syncing' && (
            <Progress 
              percent={syncProgress} 
              status="active" 
              showInfo 
              strokeColor="#1890ff"
              format={(percent) => `${percent}% (${Math.floor(percent / 5)} / 20 步)`}
            />
          )}
        </div>

        <Divider>同步历史</Divider>
        
        <Table 
          columns={historyColumns} 
          dataSource={syncHistory} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 同步配置模态框 */}
      <Modal
        title="同步配置"
        open={showSyncModal}
        onCancel={() => setShowSyncModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowSyncModal(false)}>
            取消
          </Button>,
          <Button key="sync" type="primary" onClick={handleConfigSync}>
            开始同步
          </Button>
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="同步内容">
            <Select 
              value={syncConfig.syncType}
              onChange={(value) => setSyncConfig({...syncConfig, syncType: value})}
              style={{ width: '100%' }}
            >
              <Option value="all">全部数据</Option>
              <Option value="bom">BOM数据</Option>
              <Option value="parts">零件数据</Option>
              <Option value="products">产品数据</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="同步时间范围">
            <RangePicker 
              onChange={(dates) => {
                if (dates) {
                  setSyncConfig({
                    ...syncConfig,
                    startDate: dates[0],
                    endDate: dates[1]
                  });
                }
              }}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            label="包含历史版本"
            valuePropName="checked"
          >
            <Switch
              checked={syncConfig.includeHistory}
              onChange={(checked) => setSyncConfig({...syncConfig, includeHistory: checked})}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// 为了避免编译错误，定义一个简单的Switch组件
const Switch = ({ checked, onChange }) => (
  <span onClick={onChange}>
    {checked ? '✅ 是' : '❌ 否'}
  </span>
);

export default SAPSyncManager;