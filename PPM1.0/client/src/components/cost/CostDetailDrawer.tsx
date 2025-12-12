import React, { useState, useMemo } from 'react';
import { Drawer, Descriptions, Empty, Button, Space, Card, Radio, Tabs, Typography } from 'antd';
import { BulbOutlined, SwapOutlined, DownloadOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import styles from './styles.module.css';

// 零件详情类型定义
interface PartDetail {
  position: string;
  partId?: string;
  partName: string;
  id?: string;
  currentCost?: number;
  targetCost?: number;
  lifecycle: string;
  supplier?: string;
  manufacturer?: string; // 新增制造商属性
  standardPrice?: number;
  averagePrice?: number;
  contractPrice?: number;
  material?: string;
  description?: string;
  partImageUrl?: string; // 新增零件图片URL
}

// 供应商数据类型
interface SupplierData {
  id: string;
  name: string;
  quota: number; // 配额百分比
  price?: number; // 供应价格
}

// 定义组件属性类型
interface CostDetailDrawerProps {
  visible: boolean;
  partDetail: PartDetail | null | undefined;
  costHistoryData?: Array<{
    month: string;
    standardPrice?: number;
    averagePrice?: number;
    contractPrice?: number;
  }>;
  supplierData?: any[];
  onClose: () => void;
  onCostDownClick?: (triggerSource: 'bulb' | 'button') => void;
  onReplaceClick?: () => void;
  onExportClick?: () => void;
  onSupplierClick?: (supplierId: string) => void;
}

const { Title, Text } = Typography;

// 最小化的组件实现，确保总是返回有效的React节点
const CostDetailDrawer: React.FC<CostDetailDrawerProps> = ({ 
  visible, 
  partDetail, 
  costHistoryData, 
  supplierData: propSupplierData, 
  onClose, 
  onCostDownClick, 
  onReplaceClick, 
  onExportClick,
  onSupplierClick
}) => {
  // 价格类型状态
  const [priceType, setPriceType] = useState<'standardPrice' | 'averagePrice' | 'contractPrice'>('standardPrice');
  // 供应商数据状态
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  
  // 生成mock图片URL，实际项目中应使用真实的图片URL
  const getPartImageUrl = (partName: string) => {
    // 这里使用占位图片服务，实际项目中应从API获取真实图片
    return `/placeholder/cost-detail.jpg`;
  };
  
  // 生成模拟的12个月成本数据
  const generateMockCostData = () => {
    const months = [];
    const now = new Date();
    
    // 生成过去12个月的数据
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
      
      // 基于零件当前成本生成随机波动的数据
      const baseCost = partDetail?.currentCost || 1000;
      const randomFactor = 0.8 + Math.random() * 0.4; // 0.8到1.2之间的随机因子
      
      months.push({
        month,
        standardPrice: parseFloat((baseCost * randomFactor).toFixed(2)),
        averagePrice: parseFloat((baseCost * randomFactor * 0.95).toFixed(2)),
        contractPrice: parseFloat((baseCost * randomFactor * 0.9).toFixed(2))
      });
    }
    
    return months;
  };
  
  // 获取成本数据（优先使用传入的数据，否则使用模拟数据）
    const costData = useMemo(() => {
      return costHistoryData && costHistoryData.length > 0 ? costHistoryData : generateMockCostData();
    }, [costHistoryData, partDetail]);
    
    // 生成模拟的供应商数据
    const generateMockSupplierData = (): SupplierData[] => {
      // 模拟供应商列表
      const suppliers = [
        { id: 'S001', name: '富士康科技集团', baseQuota: 40 },
        { id: 'S002', name: '广达电脑', baseQuota: 30 },
        { id: 'S003', name: '群光电子', baseQuota: 20 },
        { id: 'S004', name: '仁宝电脑', baseQuota: 10 }
      ];
      
      // 基于零件当前成本生成供应商价格
      const baseCost = partDetail?.currentCost || 1000;
      
      return suppliers.map(supplier => ({
        ...supplier,
        quota: supplier.baseQuota,
        price: parseFloat((baseCost * (0.95 + Math.random() * 0.1)).toFixed(2)) // 95%-105%之间的价格浮动
      }));
    };
    
    // 获取供应商数据（优先使用传入的数据，否则使用模拟数据）
    const supplierData = useMemo(() => {
      return propSupplierData && propSupplierData.length > 0 ? propSupplierData : generateMockSupplierData();
    }, [propSupplierData, partDetail]);
    
    // 处理供应商点击事件
    const handleSupplierClick = (supplierId: string) => {
      setSelectedSupplier(supplierId);
      if (onSupplierClick) {
        onSupplierClick(supplierId);
      }
    };
    
    // 重置选中的供应商
    const handleResetSelection = () => {
      setSelectedSupplier(null);
    };
    
    // 饼图颜色配置
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFF', '#FF6B6B'];

  // 简化实现，确保总是返回有效的JSX
  return (
    <Drawer
      title={partDetail ? `${partDetail.position || ''} - ${partDetail.partName || ''}` : "成本详情"}
      width={800}
      placement="right"
      onClose={onClose}
      open={visible}
      footer={partDetail ? (
        <Space className="w-full justify-end">
          <Button onClick={() => onExportClick?.()} icon={<DownloadOutlined />}>
            导出PDF
          </Button>
          <Button onClick={() => onReplaceClick?.()} icon={<SwapOutlined />}>
            替换为低价
            </Button>
            <Button type='primary' onClick={() => onCostDownClick?.('button')} icon={<BulbOutlined />}>
              降本建议
            </Button>
        </Space>
      ) : undefined}
    >
      {partDetail ? (
        <div>
          {/* 零件大图显示区域 */}
          <Card className="mb-4" variant="outlined">
            <div className="text-center">
              <img 
                src={partDetail.partImageUrl || getPartImageUrl(partDetail.partName)} 
                alt={partDetail.partName} 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '300px', 
                  objectFit: 'contain', 
                  borderRadius: '4px'
                }} 
              />
              <div className="mt-2 text-gray-500">{partDetail.partName}</div>
            </div>
          </Card>
          
          {/* 基础属性显示 */}
          <Descriptions column={2} bordered size="small" className="mb-4">
            <Descriptions.Item label="位号" span={1}>{partDetail.position || ''}</Descriptions.Item>
            <Descriptions.Item label="零件名称" span={1}>{partDetail.partName || ''}</Descriptions.Item>
            <Descriptions.Item label="零件ID" span={1}>{partDetail.partId || partDetail.id || '-'}</Descriptions.Item>
            <Descriptions.Item label="生命周期" span={1}>{partDetail.lifecycle || ''}</Descriptions.Item>
            <Descriptions.Item label="当前成本" span={1}>
              {partDetail.currentCost !== undefined ? `¥${partDetail.currentCost.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="目标成本" span={1}>
              {partDetail.targetCost !== undefined ? `¥${partDetail.targetCost.toFixed(2)}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="供应商" span={1}>{partDetail.supplier || '-'}</Descriptions.Item>
            <Descriptions.Item label="制造商" span={1}>{partDetail.manufacturer || '-'}</Descriptions.Item>
            <Descriptions.Item label="材料" span={1}>{partDetail.material || '-'}</Descriptions.Item>
            {partDetail.description && (
              <Descriptions.Item label="描述" span={2}>{partDetail.description}</Descriptions.Item>
            )}
          </Descriptions>
          
          {/* 成本曲线图表 */}
          <Card className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <Title level={5}>成本趋势（近12个月）</Title>
              <Radio.Group 
                value={priceType} 
                onChange={(e) => setPriceType(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="standardPrice">标准价</Radio.Button>
                <Radio.Button value="averagePrice">移动平均价</Radio.Button>
                <Radio.Button value="contractPrice">合同价</Radio.Button>
              </Radio.Group>
            </div>
            
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `¥${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`¥${value.toFixed(2)}`, '价格']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={priceType} 
                    stroke="#1890ff" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="价格"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          {/* 供应商占比饼图 */}
          <Card className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <Title level={5}>供应商配额占比</Title>
              {selectedSupplier && (
                <Button size="small" onClick={handleResetSelection}>
                  重置选择
                </Button>
              )}
            </div>
            
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supplierData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, quota }) => `${name}: ${quota}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quota"
                    onClick={(entry) => handleSupplierClick(entry.id)}
                    activeShape={(props) => {
                      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                      return (
                        <g onClick={(e) => e.stopPropagation()}>
                          <path
                            d={`
                              M ${cx},${cy}
                              L ${cx + innerRadius * Math.cos(-startAngle * Math.PI / 180)},${cy + innerRadius * Math.sin(-startAngle * Math.PI / 180)}
                              A ${innerRadius},${innerRadius} 0 0,1 ${cx + innerRadius * Math.cos(-endAngle * Math.PI / 180)},${cy + innerRadius * Math.sin(-endAngle * Math.PI / 180)}
                              Z
                            `}
                            fill={fill}
                          />
                          <path
                            d={`
                              M ${cx},${cy}
                              L ${cx + outerRadius * Math.cos(-startAngle * Math.PI / 180)},${cy + outerRadius * Math.sin(-startAngle * Math.PI / 180)}
                              A ${outerRadius},${outerRadius} 0 0,1 ${cx + outerRadius * Math.cos(-endAngle * Math.PI / 180)},${cy + outerRadius * Math.sin(-endAngle * Math.PI / 180)}
                              L ${cx + innerRadius * Math.cos(-endAngle * Math.PI / 180)},${cy + innerRadius * Math.sin(-endAngle * Math.PI / 180)}
                              A ${innerRadius},${innerRadius} 0 0,0 ${cx + innerRadius * Math.cos(-startAngle * Math.PI / 180)},${cy + innerRadius * Math.sin(-startAngle * Math.PI / 180)}
                              Z
                            `}
                            fill={fill}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        </g>
                      );
                    }}
                  >
                    {supplierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, '配额占比']}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* 选中供应商详情 */}
            {selectedSupplier && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <Title level={5}>供应商详情</Title>
                {supplierData.map(supplier => 
                  supplier.id === selectedSupplier && (
                    <div key={supplier.id}>
                      <div><strong>供应商名称：</strong>{supplier.name}</div>
                      <div><strong>配额占比：</strong>{supplier.quota}%</div>
                      {supplier.price && (
                        <div><strong>供应价格：</strong>¥{supplier.price.toFixed(2)}</div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </Card>
          
          {/* 操作按钮区域 */}
          <div className="flex justify-center mt-6 mb-4">
            <Space size="large">
              <Button 
                type='primary' 
                icon={<BulbOutlined />} 
                onClick={() => onCostDownClick?.('button')}
                disabled={!onCostDownClick}
              >
                降本建议
              </Button>
              <Button 
                type="default" 
                icon={<SwapOutlined />} 
                onClick={onReplaceClick}
                disabled={!onReplaceClick}
              >
                替换为低价
              </Button>
              <Button 
                type="default" 
                icon={<DownloadOutlined />} 
                onClick={onExportClick}
                disabled={!onExportClick}
              >
                导出
              </Button>
            </Space>
          </div>
        </div>
      ) : (
        <Empty description="暂无零件详情" />
      )}
    </Drawer>
  );
};

export default CostDetailDrawer;