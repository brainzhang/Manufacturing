import React, { useState } from 'react';
import { Drawer, Descriptions, Tabs, Button, Tag, message } from 'antd';
import { CheckCircleOutlined, StarFilled, BarChartOutlined } from '@ant-design/icons';

interface AltNode {
  id: string;
  parentId: string;
  group: 'A' | 'B' | 'C';
  partId: string;
  partName: string;
  qty: number;
  cost: number;
  lifecycle: 'Active' | 'PhaseOut' | 'Obs';
  compliance: string[];
  fffScore: number;
  isDefault: boolean;
  status: 'Active' | 'Deprecated';
}

interface AltDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  altData: AltNode | null;
  onSetDefault: () => void;
  onDeprecate: () => void;
  onAddToBOM: () => void;
}

const AltDetailDrawer: React.FC<AltDetailDrawerProps> = ({
  open,
  onClose,
  altData,
  onSetDefault,
  onDeprecate,
  onAddToBOM
}) => {
  const [activeTabKey, setActiveTabKey] = useState<string>('overview');

  // 模拟成本曲线数据
  const costHistory = [
    { month: '1月', cost: 3400 },
    { month: '2月', cost: 3350 },
    { month: '3月', cost: 3300 },
    { month: '4月', cost: 3250 },
    { month: '5月', cost: 3200 },
    { month: '6月', cost: 3150 },
    { month: '7月', cost: 3200 },
    { month: '8月', cost: 3180 },
    { month: '9月', cost: 3220 },
    { month: '10月', cost: 3190 },
    { month: '11月', cost: 3210 },
    { month: '12月', cost: 3200 }
  ];

  // 模拟主料成本数据
  const mainPartCost = 3500;

  if (!altData) return null;

  // 获取缺失的认证
  const missingCertifications = ['RoHS', 'CE', 'FCC', 'UL'].filter(
    cert => !altData.compliance.includes(cert)
  );

  // 按照BOM树结构重构成本分析视图
  const renderCostAnalysis = () => {
    // 计算成本差异百分比
    const calculateCostDiff = (currentCost: number, targetCost: number): number => {
      if (targetCost === 0) return 0;
      return ((currentCost - targetCost) / targetCost) * 100;
    };

    // 获取差异标签颜色
    const getDiffTagColor = (currentCost: number, targetCost: number): string => {
      const diffPercent = calculateCostDiff(currentCost, targetCost);
      if (diffPercent <= -5) return 'green';
      if (diffPercent < 5) return 'orange';
      return 'red';
    };

    // 获取差异百分比文本
    const getDiffText = (currentCost: number, targetCost: number): string => {
      const diffPercent = calculateCostDiff(currentCost, targetCost);
      const prefix = diffPercent >= 0 ? '+' : '';
      return `${prefix}${diffPercent.toFixed(1)}%`;
    };

    const costDiff = calculateCostDiff(altData.cost, mainPartCost);
    const diffTagColor = getDiffTagColor(altData.cost, mainPartCost);
    const diffText = getDiffText(altData.cost, mainPartCost);

    return (
      <div className="h-64 bg-gray-50 p-4 rounded">
        <h4 className="text-xs font-normal mb-3">近12个月滚动成本趋势</h4>
        
        {/* 成本概览 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">替代料成本</span>
            <span className="text-xs font-normal">¥{altData.cost.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">主料成本</span>
            <span className="text-xs font-normal">¥{mainPartCost.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">成本差异</span>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-normal ${costDiff < 0 ? 'text-green-600' : 'text-red-600'}`}>
                ¥{(costDiff < 0 ? '-' : '+')}{Math.abs(mainPartCost - altData.cost).toFixed(2)}
              </span>
              <Tag color={diffTagColor} className="text-xs">
                {diffText}
              </Tag>
            </div>
          </div>
        </div>

        {/* 成本趋势图表占位 */}
        <div className="text-center text-gray-400 py-4">
          <BarChartOutlined style={{ fontSize: '32px' }} />
          <div className="mt-2 text-xs">成本趋势图表</div>
        </div>

        {/* BOM层级成本分析 */}
        <div className="mt-2">
          <h5 className="text-xs font-normal mb-1">BOM层级成本分析</h5>
          <div className="text-xs text-gray-500">
            适用于L6-L7层级物料替代
          </div>
        </div>
      </div>
    );
  };

  return (
    <Drawer
      title={`替代料详情 - ${altData.partName}`}
      placement="right"
      onClose={onClose}
      open={open}
      width={450}
    >
      <Tabs
        activeKey={activeTabKey}
        onChange={setActiveTabKey}
        items={[
          {
            key: 'overview',
            label: '概览',
            children: (
              <div>
                {/* 顶部大图占位 */}
                <div className="h-32 bg-gray-100 rounded mb-4 flex items-center justify-center">
                  <img 
                    src={`/placeholder-part-${altData.partId}.jpg`} 
                    alt={altData.partName}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=UTF-8,%3csvg xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22 width%3d%2280%22 height%3d%2280%22 viewBox%3d%220 0 80 80%22%3e%3cpath fill%3d%22%23CCCCCC%22 d%3d%22M0 0h80v80H0z%22%2f%3e%3cpath fill%3d%22%23666666%22 d%3d%22M35 30h10v20h-10z%22%2f%3e%3c%2fsvg%3e';
                    }}
                    style={{ maxHeight: '100%', maxWidth: '100%' }}
                  />
                </div>
                
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="位号">{altData.partId}</Descriptions.Item>
                  <Descriptions.Item label="零件名称">{altData.partName}</Descriptions.Item>
                  <Descriptions.Item label="替代组">{altData.group}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    <Tag color={altData.status === 'Active' ? 'green' : 'red'}>
                      {altData.status}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="成本">¥{altData.cost}</Descriptions.Item>
                  <Descriptions.Item label="用量">{altData.qty}</Descriptions.Item>
                  <Descriptions.Item label="生命周期">
                    <Tag color={
                      altData.lifecycle === 'Active' ? 'green' :
                      altData.lifecycle === 'PhaseOut' ? 'orange' : 'red'
                    }>
                      {altData.lifecycle}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="默认">
                    {altData.isDefault ? (
                      <StarFilled className="text-yellow-500" />
                    ) : '否'}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )
          },
          {
            key: 'cost',
            label: '成本分析',
            children: renderCostAnalysis()
          },
          {
            key: 'compliance',
            label: '合规信息',
            children: (
              <div>
                <h4 className="text-sm font-medium mb-2">已认证</h4>
                <div className="flex flex-wrap gap-1 mb-4">
                  {altData.compliance.map((cert, index) => (
                    <Tag key={index} color="green" icon={<CheckCircleOutlined />}>
                      {cert}
                    </Tag>
                  ))}
                </div>
                
                {missingCertifications.length > 0 && (
                  <>
                    <h4 className="text-sm font-medium mb-2 text-red-600">缺失认证</h4>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {missingCertifications.map((cert, index) => (
                        <Tag key={index} color="red">
                          {cert}
                        </Tag>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          }
        ]}
      />
      
      <div className="mt-6 flex justify-between">
        <Button type="primary" onClick={onSetDefault} disabled={altData.isDefault}>
          设为默认
        </Button>
        <Button danger onClick={onDeprecate} disabled={altData.status === 'Deprecated'}>
          弃用
        </Button>
        <Button onClick={onAddToBOM}>
          加入BOM
        </Button>
      </div>
    </Drawer>
  );
};

export default AltDetailDrawer;