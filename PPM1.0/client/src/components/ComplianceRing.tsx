import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ComplianceRingProps {
  compliantCount: number;
  missingCount: number;
  compliantRate: number;
}

const ComplianceRing: React.FC<ComplianceRingProps> = ({
  compliantCount,
  missingCount,
  compliantRate
}) => {
  // 准备圆环图数据
  const data = [
    { name: '合规零件', value: compliantCount },
    { name: '缺失零件', value: missingCount }
  ];

  // 颜色配置
  const COLORS = ['#52c41a', '#ff4d4f'];

  // 自定义标签内容
  const renderCustomizedLabel = ({ cx, cy }: any) => {
    return (
      <text x={cx} y={cy} fill="#333" fontSize="16" fontWeight="bold" textAnchor="middle">
        {compliantRate}%
      </text>
    );
  };

  // 自定义提示框
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-medium">{payload[0].name}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  // 如果没有数据，显示提示
  if (compliantCount === 0 && missingCount === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <div className="text-gray-400">暂无合规数据</div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: '100%', aspectRatio: 1, maxHeight: 256 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius="80%"
            innerRadius="55%"
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center" style={{ position: 'absolute', top: '65%', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <div className="text-xs text-gray-500">合规率</div>
      </div>
    </div>
  );
};

export default ComplianceRing;