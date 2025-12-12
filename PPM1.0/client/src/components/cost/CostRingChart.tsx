import React from 'react';
import { Card, Progress, Typography } from 'antd';

const { Title } = Typography;

interface CostRingChartProps {
  currentCost: number;
  targetCost: number;
}

const CostRingChart: React.FC<CostRingChartProps> = ({ currentCost, targetCost }) => {
  // 计算完成百分比
  const percent = targetCost > 0 ? Math.min((currentCost / targetCost) * 100, 100) : 0;
  
  // 判断是否超支
  const isOverBudget = currentCost > targetCost;
  
  // 根据是否超支设置颜色
  const progressColor = isOverBudget ? '#ff4d4f' : '#52c41a';

  return (
    <Card className="mb-4">
      <div style={{ position: 'relative', padding: '10px 0 20px' }}>
        <Progress
          type="circle"
          percent={percent}
          strokeColor={progressColor}
          strokeLinecap="round"
          size={180}
          strokeWidth={12}
          format={() => (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', width: '100%' }}>
              <Title level={3} style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                当前成本: ¥{currentCost.toLocaleString()}
              </Title>
              <Title level={5} style={{ margin: '0', color: isOverBudget ? '#ff4d4f' : '#52c41a' }}>
                {isOverBudget ? '超支' : '剩余'} ¥{Math.abs(targetCost - currentCost).toLocaleString()}
              </Title>
            </div>
          )}
        />
      </div>
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <Typography.Text type="secondary">
          目标成本: ¥{targetCost.toLocaleString()}
        </Typography.Text>
      </div>
    </Card>
  );
};

export default CostRingChart;