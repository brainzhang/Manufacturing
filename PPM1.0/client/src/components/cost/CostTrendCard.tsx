import React, { useState } from 'react';
import { Card, Typography, Radio } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const { Title } = Typography;

interface CostTrendCardProps {
  trendData: {
    trendType?: 'product' | 'main' | 'alternative';
    onTrendTypeChange?: React.Dispatch<React.SetStateAction<'product' | 'main' | 'alternative'>>;
    costTrend: {
      month: string;
      cost: number;
    }[];
  };
}

const CostTrendCard: React.FC<CostTrendCardProps> = ({ trendData }) => {
  const { trendType = 'product', onTrendTypeChange, costTrend } = trendData;
  // 根据trendType获取对应的配置
  const getTrendConfig = () => {
    switch (trendType) {
      case 'product':
        return { color: '#1890ff', name: '产品族' };
      case 'main':
        return { color: '#52c41a', name: '主料' };
      case 'alternative':
        return { color: '#faad14', name: '替代料' };
    }
  };

  const trendConfig = getTrendConfig();

  return (
    <Card className="mb-4">
      <div className="flex justify-between items-center mb-4">
        <Title level={5} style={{ margin: 0 }}>近12个月成本趋势</Title>
        {onTrendTypeChange && (
          <Radio.Group 
            value={trendType} 
            onChange={(e) => onTrendTypeChange(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="product">产品族</Radio.Button>
            <Radio.Button value="main">主料</Radio.Button>
            <Radio.Button value="alternative">替代料</Radio.Button>
          </Radio.Group>
        )}
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={costTrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis 
            tickFormatter={(value) => `¥${value.toLocaleString()}`}
          />
          <Tooltip 
            formatter={(value: number) => [`¥${value.toLocaleString()}`, trendConfig.name]}
            labelFormatter={(label) => `${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="cost"
            stroke={trendConfig.color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

// 默认的模拟数据
export const defaultTrendData = [
  { month: '1月', productFamily: 120000, mainMaterial: 80000, alternativeMaterial: 40000 },
  { month: '2月', productFamily: 130000, mainMaterial: 85000, alternativeMaterial: 45000 },
  { month: '3月', productFamily: 145000, mainMaterial: 95000, alternativeMaterial: 50000 },
  { month: '4月', productFamily: 135000, mainMaterial: 90000, alternativeMaterial: 45000 },
  { month: '5月', productFamily: 150000, mainMaterial: 100000, alternativeMaterial: 50000 },
  { month: '6月', productFamily: 155000, mainMaterial: 105000, alternativeMaterial: 50000 },
  { month: '7月', productFamily: 160000, mainMaterial: 110000, alternativeMaterial: 50000 },
  { month: '8月', productFamily: 158000, mainMaterial: 108000, alternativeMaterial: 50000 },
  { month: '9月', productFamily: 165000, mainMaterial: 112000, alternativeMaterial: 53000 },
  { month: '10月', productFamily: 170000, mainMaterial: 115000, alternativeMaterial: 55000 },
  { month: '11月', productFamily: 175000, mainMaterial: 120000, alternativeMaterial: 55000 },
  { month: '12月', productFamily: 180000, mainMaterial: 125000, alternativeMaterial: 55000 },
];

export default CostTrendCard;