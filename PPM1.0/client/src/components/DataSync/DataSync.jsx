import React, { useState, useEffect } from 'react';
import { Tabs, Card, Row, Col, Button, Space, Input, Select, DatePicker, Statistic, message, Typography } from 'antd';
import { ReloadOutlined, CloudSyncOutlined, BarChartOutlined, FileSearchOutlined, CheckOutlined } from '@ant-design/icons';
import SAPSyncManager from './SAPSyncManager';
import AlignmentSync from './AlignmentSync';
import AlignmentChart from '../AlignmentChart';
import { fetchAlignments } from '../../services/alignmentService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

/**
 * 数据同步与差异对齐模块主组件
 * 整合SAP同步、差异对齐、同步报表等功能
 */
const DataSync = () => {
  const [activeTabKey, setActiveTabKey] = useState('sync');
  const [syncStats, setSyncStats] = useState({
    totalSynced: 0,
    pendingSync: 0,
    syncFailed: 0,
    lastSyncTime: null,
  });
  const [alignmentStats, setAlignmentStats] = useState({
    totalAligned: 0,
    totalDifferences: 0,
    criticalDifferences: 0,
    highDifferences: 0,
    mediumDifferences: 0,
    lowDifferences: 0,
  });
  const [loading, setLoading] = useState(false);
  const [alignmentData, setAlignmentData] = useState([]);

  // 加载对齐数据
  useEffect(() => {
    loadAlignmentData();
  }, []);

  const loadAlignmentData = async () => {
    try {
      setLoading(true);
      const data = await fetchAlignments({ limit: 100 });
      
      // 统计数据
      const stats = {
        totalAligned: data.filter(item => item.status === 'ALIGNED').length,
        totalDifferences: data.filter(item => item.status !== 'ALIGNED').length,
        criticalDifferences: data.filter(item => item.alignmentLevel === 'CRITICAL').length,
        highDifferences: data.filter(item => item.alignmentLevel === 'HIGH').length,
        mediumDifferences: data.filter(item => item.alignmentLevel === 'MEDIUM').length,
        lowDifferences: data.filter(item => item.alignmentLevel === 'LOW').length,
      };
      
      setAlignmentStats(stats);
      setAlignmentData(data);
      
      // 模拟同步统计数据
      setSyncStats({
        totalSynced: 156,
        pendingSync: 8,
        syncFailed: 2,
        lastSyncTime: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to load alignment data:', error);
      message.error('加载对齐数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理刷新数据
  const handleRefresh = () => {
    loadAlignmentData();
    message.success('数据已刷新');
  };

  // 渲染统计卡片
  const renderStatCards = () => (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <Card>
          <Statistic
            title="已同步项目"
            value={syncStats.totalSynced}
            prefix={<CheckOutlined />}
            suffix="个"
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="待同步项目"
            value={syncStats.pendingSync}
            prefix={<ReloadOutlined />}
            suffix="个"
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="同步失败"
            value={syncStats.syncFailed}
            prefix={<CloudSyncOutlined />}
            suffix="个"
            valueStyle={{ color: '#f5222d' }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="差异总数"
            value={alignmentStats.totalDifferences}
            prefix={<FileSearchOutlined />}
            suffix="个"
          />
        </Card>
      </Col>
    </Row>
  );

  // 渲染差异级别统计
  const renderDifferenceStats = () => (
    <Card title="差异级别分布" style={{ marginBottom: 24 }}>
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="严重差异"
            value={alignmentStats.criticalDifferences}
            valueStyle={{ color: '#f5222d' }}
            suffix="个"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="高优先级差异"
            value={alignmentStats.highDifferences}
            valueStyle={{ color: '#fa541c' }}
            suffix="个"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="中优先级差异"
            value={alignmentStats.mediumDifferences}
            valueStyle={{ color: '#faad14' }}
            suffix="个"
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="低优先级差异"
            value={alignmentStats.lowDifferences}
            valueStyle={{ color: '#1890ff' }}
            suffix="个"
          />
        </Col>
      </Row>
    </Card>
  );

  return (
    <div className="data-sync-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4}>数据同步与差异对齐中心</Title>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={loading}
        >
          刷新数据
        </Button>
      </div>

      {/* 统计信息 */}
      {renderStatCards()}
      {renderDifferenceStats()}

      {/* 内容区域 */}
      <Tabs 
        activeKey={activeTabKey} 
        onChange={setActiveTabKey}
        tabBarExtraContent={
          <Space>
            <Text>
              上次同步时间: {syncStats.lastSyncTime ? new Date(syncStats.lastSyncTime).toLocaleString() : '无'}
            </Text>
          </Space>
        }
      >
        <TabPane tab="数据同步" key="sync">
          <SAPSyncManager />
        </TabPane>
        <TabPane tab="差异对齐" key="alignment">
          <AlignmentSync />
        </TabPane>
        <TabPane tab="同步报表" key="report">
          <Card>
            <Title level={5}>对齐趋势分析</Title>
            <AlignmentChart data={[
              { month: '1月', aligned: 120, misaligned: 15 },
              { month: '2月', aligned: 135, misaligned: 10 },
              { month: '3月', aligned: 148, misaligned: 8 },
              { month: '4月', aligned: 156, misaligned: 5 },
              { month: '5月', aligned: 160, misaligned: 3 },
              { month: '6月', aligned: 165, misaligned: 2 },
            ]} />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default DataSync;