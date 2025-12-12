import React, { useState, useEffect } from 'react';
import { Drawer, Card, List, Typography, Button, Space, Tag, Divider, Badge, Empty, Checkbox, Affix } from 'antd';
import { BulbOutlined, DownOutlined, ArrowRightOutlined, AlertOutlined, DollarOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Meta } = Card;

interface AlternativePart {
  id: string;
  name: string;
  currentCost: number;
  alternativeCost: number;
  saving: number;
  feasibility: string;
  supplier?: string;
  lifecycle?: string;
}

interface PriceNegotiationSuggestion {
  id: string;
  supplier: string;
  currentPrice: number;
  negotiationPrice: number;
  saving: number;
  confidence: string;
}

interface LifecycleWarning {
  id: string;
  message: string;
  riskLevel: string;
  recommendation: string;
  partName?: string;
  currentPhase?: string;
  nextPhase?: string;
  estimatedDate?: string;
}

interface CostDownSuggestion {
  alternatives: AlternativePart[];
  priceNegotiations: PriceNegotiationSuggestion[];
  lifecycleWarnings: LifecycleWarning[];
}

interface CostDownDrawerProps {
  visible: boolean;
  partName: string;
  suggestions: CostDownSuggestion;
  onClose: () => void;
  onOpen?: (triggerSource: 'bulb' | 'button') => void;
  onAcceptSuggestion: (suggestionType: string, suggestionId: string) => void;
  onIgnoreSuggestion?: (suggestionType: string, suggestionId: string) => void;
  triggerSource?: 'bulb' | 'button'; // 添加触发来源标识
}

const CostDownDrawer: React.FC<CostDownDrawerProps> = ({
  visible,
  partName,
  suggestions,
  onClose,
  onOpen,
  onAcceptSuggestion,
  onIgnoreSuggestion
}) => {
  const [selectedAlternatives, setSelectedAlternatives] = useState<string[]>([]);
  
  // 过滤出成本降低≥10%的替代料（严格符合需求）
  const filteredAlternatives = suggestions.alternatives.filter(alt => {
    const savingPercent = ((alt.currentCost - alt.alternativeCost) / alt.currentCost) * 100;
    return savingPercent >= 10;
  });
  
  // 获取总降本机会数量，用于显示在浮动图标上
  const totalSuggestions = filteredAlternatives.length + suggestions.priceNegotiations.length + suggestions.lifecycleWarnings.length;

  // 获取风险等级标签颜色
  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  // 计算总成本节省
  const calculateTotalSaving = (): number => {
    return selectedAlternatives.reduce((total, altId) => {
      const alt = suggestions.alternatives.find(a => a.id === altId);
      if (!alt || alt.currentCost === undefined || alt.alternativeCost === undefined) {
        return total;
      }
      return total + (alt.currentCost - alt.alternativeCost);
    }, 0);
  };

  // 处理替代料选择
  const handleAlternativeSelect = (altId: string, checked: boolean) => {
    if (checked) {
      setSelectedAlternatives([...selectedAlternatives, altId]);
    } else {
      setSelectedAlternatives(selectedAlternatives.filter(id => id !== altId));
    }
    console.log('替代料选择状态更新:', selectedAlternatives);
  };

  // 采纳所有选中的替代料
  const handleAcceptAllAlternatives = () => {
    selectedAlternatives.forEach(altId => {
      onAcceptSuggestion('alternative', altId);
    });
    // 生成ECN草稿
    console.log('正在生成ECN草稿...');
    // 可以在这里显示成功提示
    alert('已成功生成ECN草稿');
    // 清空选择
    setSelectedAlternatives([]);
  };
  
  // 生成ECN草稿的处理函数
  const generateECNDraft = (suggestionType: string, suggestionId: string) => {
    // 调用接受建议的方法
    onAcceptSuggestion(suggestionType, suggestionId);
    // 记录生成ECN草稿的操作
    console.log(`为${suggestionType}类型的建议(ID: ${suggestionId})生成ECN草稿`);
    // 从选中列表中移除已采纳的替代料
    if (suggestionType === 'alternative') {
      setSelectedAlternatives(selectedAlternatives.filter(id => id !== suggestionId));
    }
  };
  
  // 安全的忽略建议方法
  const handleIgnoreSuggestion = (suggestionType: string, suggestionId: string) => {
    if (typeof onIgnoreSuggestion === 'function') {
      onIgnoreSuggestion(suggestionType, suggestionId);
    } else {
      console.log(`忽略${suggestionType}类型的建议(ID: ${suggestionId})`);
    }
  };

  // 常驻浮动灯泡按钮组件 - 优化为常驻浮动模式
  const FloatingBulbButton = () => (
    <div style={{ 
      position: 'fixed', 
      bottom: 24, 
      right: 24, 
      zIndex: 1000, // 提高z-index确保在最顶层
      cursor: 'pointer'
    }}>
      <Badge count={totalSuggestions} showZero>
        <Button 
          type="primary" 
          shape="circle" 
          size="large"
          icon={<BulbOutlined />}
          onClick={() => onOpen?.('bulb')}
          style={{ 
            backgroundColor: '#faad14', 
            borderColor: '#faad14', 
            boxShadow: '0 4px 12px rgba(250, 173, 20, 0.4)',
            transition: 'all 0.3s ease'
          }}
          title='查看AI降本建议'
        />
      </Badge>
    </div>
  );

  return (
    <>
      {/* 常驻浮动灯泡按钮 */}
      <FloatingBulbButton />
      
      {/* AI降本抽屉 - 右侧滑出 */}
      <Drawer
        title={`
          <Space>
            <BulbOutlined style={{ color: '#faad14' }} />
            <span>AI降本建议 - {partName}</span>
          </Space>
        `}
        width={600}
        placement="right"
        onClose={onClose}
        open={visible}
        footer={selectedAlternatives.length > 0 ? (
          <Space className="w-full justify-between">
            <Text type="success" strong>
              预计节省: ¥{(calculateTotalSaving() || 0).toLocaleString()}
            </Text>
            <Button type="primary" onClick={handleAcceptAllAlternatives}>
              采纳选中建议
            </Button>
          </Space>
        ) : null}
        // 样式优化，使其更符合常驻浮动抽屉的感觉
        className="ai-cost-down-drawer"
        styles={{
        content: {
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.2)',
          borderRadius: '8px 0 0 8px',
          height: '100vh',
          overflow: 'auto'
        },
        wrapper: {
          zIndex: 1001
        }
      }}
      >
      {/* 替代料推荐 */}
      <Card 
        title={
          <Space>
            <DownOutlined />
            <span>推荐替代料（成本↓≥10%）</span>
            {filteredAlternatives.length > 0 && (
              <Badge count={filteredAlternatives.length} />
            )}
          </Space>
        }
        className="mb-4"
      >
        {filteredAlternatives.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={filteredAlternatives}
            renderItem={(alternative) => (
              <List.Item
                className="border-b last:border-b-0 pb-4 last:pb-0"
                actions={[
                  <Button
                    key="accept"
                    size="small"
                    type="primary"
                    onClick={() => generateECNDraft('alternative', alternative.id)}
                  >
                    采纳建议
                  </Button>,
                  <Button
                    key="ignore"
                    size="small"
                    onClick={() => handleIgnoreSuggestion('alternative', alternative.id)}
                  >
                    忽略
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Checkbox
                      checked={selectedAlternatives.includes(alternative.id)}
                      onChange={(e) => handleAlternativeSelect(alternative.id, e.target.checked)}
                    />
                  }
                  title={
                    <Space>
                      <Text strong>{alternative.name}</Text>
                      <Tag color="green">
                        <DownOutlined />
                        {(((alternative.currentCost - alternative.alternativeCost) / alternative.currentCost) * 100).toFixed(1)}%
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Text>
                        当前成本: ¥{(alternative.currentCost || 0).toLocaleString()} → 
                        替代成本: ¥{(alternative.alternativeCost || 0).toLocaleString()}
                      </Text>
                      <Space>
                        <Tag color="blue">兼容性: {alternative.feasibility}</Tag>
                        {alternative.supplier && <Tag color="purple">供应商: {alternative.supplier}</Tag>}
                        {alternative.lifecycle && (
                          <Tag color={alternative.lifecycle === 'PhaseIn' ? 'green' : 'orange'}>
                            生命周期: {alternative.lifecycle}
                          </Tag>
                        )}
                      </Space>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无替代料建议" />
        )}
      </Card>

      {/* 供应商议价建议 */}
      <Card 
        title={
          <Space>
            <DollarOutlined />
            <span>供应商议价建议</span>
          </Space>
        }
        className="mb-4"
      >
        {suggestions.priceNegotiations.length > 0 ? (
          <List
            dataSource={suggestions.priceNegotiations}
            renderItem={(suggestion) => (
              <List.Item
                className="border-b last:border-b-0 pb-4 last:pb-0"
                actions={[
                  <Button
                    key="accept"
                    size="small"
                    type="primary"
                    onClick={() => generateECNDraft('price', suggestion.id)}
                  >
                    采纳建议
                  </Button>,
                  <Button
                    key="ignore"
                    size="small"
                    onClick={() => handleIgnoreSuggestion('price', suggestion.id)}
                  >
                    忽略
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{suggestion.supplier}</Text>
                      <Tag color="green">
                        <DownOutlined />
                        {suggestion.saving > 0 ? ((suggestion.saving / suggestion.currentPrice) * 100).toFixed(1) + '%' : '可议价'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Text>
                        当前价格: ¥{(suggestion.currentPrice || 0).toLocaleString()} → 
                        目标价格: ¥{(suggestion.negotiationPrice || 0).toLocaleString()}
                      </Text>
                      <Text type="success">
                        预计节省: ¥{(suggestion.saving || 0).toLocaleString()}
                      </Text>
                      <Tag color={suggestion.confidence === 'high' ? 'green' : suggestion.confidence === 'medium' ? 'orange' : 'red'}>
                        可行性: {suggestion.confidence}
                      </Tag>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无议价建议" />
        )}
      </Card>

      {/* 生命周期预警 */}
      <Card 
        title={
          <Space>
            <AlertOutlined />
            <span>生命周期预警</span>
          </Space>
        }
      >
        {suggestions.lifecycleWarnings.length > 0 ? (
          <List
            dataSource={suggestions.lifecycleWarnings}
            renderItem={(warning) => (
              <List.Item
                className="border-b last:border-b-0 pb-4 last:pb-0"
                actions={[
                  <Button
                    key="accept"
                    size="small"
                    type="primary"
                    onClick={() => generateECNDraft('lifecycle', warning.id)}
                  >
                    采纳建议
                  </Button>,
                  <Button
                    key="ignore"
                    size="small"
                    onClick={() => handleIgnoreSuggestion('lifecycle', warning.id)}
                  >
                    忽略
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{warning.partName || '零件'}</Text>
                      <Tag color={getRiskLevelColor(warning.riskLevel)}>
                        风险等级: {warning.riskLevel}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      {warning.currentPhase && warning.nextPhase && (
                        <Text>
                          生命周期变化: {warning.currentPhase} → {warning.nextPhase}
                        </Text>
                      )}
                      {warning.estimatedDate && (
                        <Text type="secondary">
                          预计日期: {warning.estimatedDate}
                        </Text>
                      )}
                      <Paragraph className="text-sm m-0 bg-gray-50 p-2 rounded">
                        <AlertOutlined style={{ marginRight: 4 }} />
                        {warning.message}
                      </Paragraph>
                      {warning.recommendation && (
                        <Paragraph className="text-sm m-0">
                          <ArrowRightOutlined style={{ marginRight: 4 }} />
                          建议: {warning.recommendation}
                        </Paragraph>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无生命周期预警" />
        )}
      </Card>

      <Divider />
      <Text type="secondary" className="block text-center">
        * 建议由AI基于历史数据和市场趋势生成，仅供参考
      </Text>
    </Drawer>
    </>
  );
};

export default CostDownDrawer;