import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Spin, Statistic, Select, DatePicker, Empty } from 'antd';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { getAlignmentStatistics } from '@/services/alignmentService';
import { AlignmentLevel, AlignmentStatus } from '@/types/dataSync';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 颜色配置
const COLORS = {
  // 状态颜色
  [AlignmentStatus.PENDING]: '#1890ff',
  [AlignmentStatus.PROCESSING]: '#faad14',
  [AlignmentStatus.COMPLETED]: '#52c41a',
  [AlignmentStatus.FAILED]: '#f5222d',
  [AlignmentStatus.INCONSISTENT]: '#fa541c',
  // 差异级别颜色
  [AlignmentLevel.CRITICAL]: '#f5222d',
  [AlignmentLevel.HIGH]: '#fa541c',
  [AlignmentLevel.MEDIUM]: '#faad14',
  [AlignmentLevel.LOW]: '#1890ff',
};

/**
 * 差异对齐可视化组件
 * 提供数据差异的统计图表展示
 */
const AlignmentChart = () => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [chartType, setChartType] = useState('pie'); // pie | bar
  const [category, setCategory] = useState('status'); // status | level

  // 加载统计数据
  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const params = dateRange ? {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      } : {};
      
      const data = await getAlignmentStatistics(params);
      setStatistics(data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 准备图表数据
  const prepareChartData = () => {
    if (!statistics) return [];

    if (category === 'status') {
      return [
        { name: '待处理', value: statistics.pendingCount || 0, status: AlignmentStatus.PENDING },
        { name: '处理中', value: statistics.processingCount || 0, status: AlignmentStatus.PROCESSING },
        { name: '已完成', value: statistics.completedCount || 0, status: AlignmentStatus.COMPLETED },
        { name: '失败', value: statistics.failedCount || 0, status: AlignmentStatus.FAILED },
        { name: '不一致', value: statistics.inconsistentCount || 0, status: AlignmentStatus.INCONSISTENT },
      ].filter(item => item.value > 0);
    } else {
      return [
        { name: '严重', value: statistics.criticalCount || 0, level: AlignmentLevel.CRITICAL },
        { name: '高', value: statistics.highCount || 0, level: AlignmentLevel.HIGH },
        { name: '中', value: statistics.mediumCount || 0, level: AlignmentLevel.MEDIUM },
        { name: '低', value: statistics.lowCount || 0, level: AlignmentLevel.LOW },
      ].filter(item => item.value > 0);
    }
  };

  // 自定义饼图标签
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ fontSize: '12px', fontWeight: 'bold' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // 渲染图表
  const renderChart = () => {
    const chartData = prepareChartData();
    
    if (chartData.length === 0) {
      return <Empty description="暂无数据" />;
    }

    if (chartType === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart margin={{ top: 5, right: 30, left: 20, bottom: 30 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.status || entry.level] || '#8884d8'} 
                />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} 条`, '数量']} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ paddingTop: '20px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} 条`, '数量']} />
            <Legend />
            <Bar dataKey="value" name="数量">
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.status || entry.level] || '#8884d8'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Card title="差异对齐统计图表" className="alignment-chart">
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Statistic 
            title="总差异数" 
            value={statistics?.totalRecords || 0} 
            suffix="条"
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic 
            title="待处理" 
            value={statistics?.pendingCount || 0} 
            suffix="条"
            valueStyle={{ color: COLORS[AlignmentStatus.PENDING] }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Statistic 
            title="成功率" 
            value={(statistics?.syncSuccessRate * 100) || 0} 
            precision={2}
            suffix="%"
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Select 
            placeholder="选择分类" 
            style={{ width: '100%' }}
            value={category}
            onChange={setCategory}
          >
            <Option value="status">按状态分类</Option>
            <Option value="level">按差异级别</Option>
          </Select>
        </Col>
        <Col xs={24} sm={8}>
          <Select 
            placeholder="图表类型" 
            style={{ width: '100%' }}
            value={chartType}
            onChange={setChartType}
          >
            <Option value="pie">饼图</Option>
            <Option value="bar">柱状图</Option>
          </Select>
        </Col>
        <Col xs={24} sm={8}>
          <RangePicker 
            onChange={setDateRange}
            placeholder={['开始日期', '结束日期']}
            style={{ width: '100%' }}
          />
        </Col>
      </Row>

      <Spin spinning={loading}>
        {renderChart()}
      </Spin>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col xs={24} sm={6}>
          <Statistic 
            title="严重差异" 
            value={statistics?.criticalCount || 0} 
            suffix="条"
            valueStyle={{ color: COLORS[AlignmentLevel.CRITICAL] }}
          />
        </Col>
        <Col xs={24} sm={6}>
          <Statistic 
            title="高优先级" 
            value={statistics?.highCount || 0} 
            suffix="条"
            valueStyle={{ color: COLORS[AlignmentLevel.HIGH] }}
          />
        </Col>
        <Col xs={24} sm={6}>
          <Statistic 
            title="中等优先级" 
            value={statistics?.mediumCount || 0} 
            suffix="条"
            valueStyle={{ color: COLORS[AlignmentLevel.MEDIUM] }}
          />
        </Col>
        <Col xs={24} sm={6}>
          <Statistic 
            title="低优先级" 
            value={statistics?.lowCount || 0} 
            suffix="条"
            valueStyle={{ color: COLORS[AlignmentLevel.LOW] }}
          />
        </Col>
      </Row>

      {statistics?.lastSyncTime && (
        <div style={{ marginTop: 16, textAlign: 'right', color: '#666' }}>
          最后同步时间: {new Date(statistics.lastSyncTime).toLocaleString()}
        </div>
      )}
    </Card>
  );
};

export default AlignmentChart;