import React, { useState, useEffect } from 'react';
import { Card, Typography, Row, Col } from 'antd';
import { useCostDashboard } from '../../hooks/useCostDashboard';
import { Pie } from '@ant-design/plots';

const { Title, Text } = Typography;

interface CostRingProps {
  currentCost: number;
  targetCost: number;
}

const CostRing: React.FC<CostRingProps> = (props) => {
  const { currentCost: propCurrentCost, targetCost: propTargetCost } = props;
  const { on } = useCostDashboard();
  
  // 使用state管理成本数据，支持props初始值和事件更新
  const [currentCost, setCurrentCost] = useState(propCurrentCost);
  const [targetCost, setTargetCost] = useState(propTargetCost);
  
  // 监听成本更新事件
  useEffect(() => {
    const handleCostUpdated = (updatedData: any) => {
      if (updatedData.currentCost !== undefined) {
        setCurrentCost(updatedData.currentCost);
      }
      if (updatedData.targetCost !== undefined) {
        setTargetCost(updatedData.targetCost);
      }
    };
    
    const cleanup = on('costUpdated', handleCostUpdated);
    
    return () => cleanup();
  }, [on]);
  
  // 监听props变化，支持外部直接更新
  useEffect(() => {
    setCurrentCost(propCurrentCost);
  }, [propCurrentCost]);
  
  useEffect(() => {
    setTargetCost(propTargetCost);
  }, [propTargetCost]);
  // 计算剩余预算或超支金额
  const remainingBudget = Math.max(0, targetCost - currentCost);
  const overBudget = Math.max(0, currentCost - targetCost);
  
  // 计算完成百分比
  const completionRate = targetCost > 0 ? (currentCost / targetCost) * 100 : 0;
  
  // 准备圆环图数据
  const ringData = [];
  
  // 添加当前成本
  if (currentCost > 0) {
    ringData.push({
      item: '当前成本',
      value: currentCost,
      type: 'current'
    });
  }
  
  // 添加剩余预算或超支
  if (remainingBudget > 0) {
    ringData.push({
      item: '剩余预算',
      value: remainingBudget,
      type: 'remaining'
    });
  }
  
  // 如果超支，当前成本颜色为红色
  const isOverBudget = overBudget > 0;
  
  // 配置圆环图
  const config = {
    data: ringData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    minWidth: 200,
    minHeight: 200,
    color: ({ type }: { type: string }) => {
      if (type === 'current') {
        return isOverBudget ? '#ff4d4f' : '#1890ff';
      }
      return '#52c41a';
    },
    label: {
      type: 'inner',
      offset: '-50%',
      content: () => '', // 内部不显示标签
    },
    interactions: [
      {
        type: 'element-selected',
      },
      {
        type: 'element-active',
      },
    ],
  };

  return (
    <div className="cost-ring-container">
      <Row gutter={[16, 16]} align="middle">
        <Col span={24} className="text-center">
          <Title level={5}>当前成本 vs 目标成本</Title>
        </Col>
        <Col span={24}>
          <div className="relative h-64 min-w-[200px]" style={{ width: '100%', height: '64px', minWidth: '200px' }}>
            {/* 圆环图 */}
            <Pie {...config} />
            
            {/* 中心文字覆盖层 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <Text className="text-lg">
                ¥{currentCost.toLocaleString()}
              </Text>
              <Text type="secondary" className="mt-2">
                目标: ¥{targetCost.toLocaleString()}
              </Text>
              <Text 
                className={`mt-1 ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}
              >
                {isOverBudget 
                  ? `超支: ¥${overBudget.toLocaleString()}` 
                  : `剩余: ¥${remainingBudget.toLocaleString()}`}
              </Text>
              <Text type="secondary" className="mt-1">
                {completionRate.toFixed(1)}%
              </Text>
            </div>
          </div>
        </Col>
      </Row>
      
      {/* 详细信息 */}
      <Row gutter={[16, 8]} className="mt-4">
        <Col xs={12}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            <Text>当前成本</Text>
          </div>
          <Text className="text-lg font-medium">¥{currentCost.toLocaleString()}</Text>
        </Col>
        <Col xs={12}>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
            <Text>目标成本</Text>
          </div>
          <Text className="text-lg font-medium">¥{targetCost.toLocaleString()}</Text>
        </Col>
      </Row>
    </div>
  );
};

export default CostRing;