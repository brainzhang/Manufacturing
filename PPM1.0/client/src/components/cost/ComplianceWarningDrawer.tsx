import React, { useState, useEffect } from 'react';
import { Drawer, Card, Typography, List, Tag, Progress, Button, Space, Badge, message } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, BarChartOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface AlternativePart {
  id: string;
  name: string;
  supplier: string;
  fff: number;
  cost: number;
  certificationStatus: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface CertificationRenewal {
  id: string;
  name: string;
  expiresAt: string;
  daysRemaining: number;
  status: 'normal' | 'warning' | 'urgent';
}

interface SupplierCompliance {
  id: string;
  name: string;
  complianceRate: number;
  issues: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ComplianceWarningDrawerProps {
  visible: boolean;
  part?: any | null;
  alternativeParts?: AlternativePart[];
  certificationRenewals?: CertificationRenewal[];
  supplierCompliance?: SupplierCompliance[];
  onClose: () => void;
  onAcceptSuggestion?: (suggestionType: string, suggestionId: string) => void;
  onIgnoreSuggestion?: (suggestionType: string, suggestionId: string) => void;
}

const ComplianceWarningDrawer: React.FC<ComplianceWarningDrawerProps> = ({
  visible,
  part,
  alternativeParts = [],
  certificationRenewals = [],
  supplierCompliance = [],
  onClose,
  onAcceptSuggestion,
  onIgnoreSuggestion
}) => {
  // 生成模拟数据（实际应用中应从API获取）
  const [mockAlternativeParts, setMockAlternativeParts] = useState<AlternativePart[]>([]);
  const [mockCertificationRenewals, setMockCertificationRenewals] = useState<CertificationRenewal[]>([]);
  const [mockSupplierCompliance, setMockSupplierCompliance] = useState<SupplierCompliance[]>([]);
  const [ignoredSuggestions, setIgnoredSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible && !alternativeParts.length) {
      // 生成模拟合规替代料数据（FFF≥95%）
      const mockAlts: AlternativePart[] = [
        {
          id: 'ALT-001',
          name: '合规替代料A',
          supplier: '合规供应商A',
          fff: 98.5,
          cost: 125.5,
          certificationStatus: '已认证',
          riskLevel: 'low'
        },
        {
          id: 'ALT-002',
          name: '合规替代料B',
          supplier: '合规供应商B',
          fff: 96.2,
          cost: 118.3,
          certificationStatus: '已认证',
          riskLevel: 'low'
        },
        {
          id: 'ALT-003',
          name: '合规替代料C',
          supplier: '合规供应商C',
          fff: 95.8,
          cost: 132.0,
          certificationStatus: '审核中',
          riskLevel: 'medium'
        }
      ];
      setMockAlternativeParts(mockAlts);

      // 生成模拟证书续期数据（提前90天）
      const mockCerts: CertificationRenewal[] = [
        {
          id: 'CERT-001',
          name: 'ISO 9001认证',
          expiresAt: '2024-12-15',
          daysRemaining: 45,
          status: 'warning'
        },
        {
          id: 'CERT-002',
          name: 'RoHS合规证书',
          expiresAt: '2024-10-20',
          daysRemaining: 15,
          status: 'urgent'
        },
        {
          id: 'CERT-003',
          name: 'REACH注册证',
          expiresAt: '2025-03-10',
          daysRemaining: 120,
          status: 'normal'
        }
      ];
      setMockCertificationRenewals(mockCerts);

      // 生成模拟供应商合规率数据
      const mockSuppliers: SupplierCompliance[] = [
        {
          id: 'SUPP-001',
          name: '供应商A',
          complianceRate: 95.2,
          issues: 2,
          riskLevel: 'low'
        },
        {
          id: 'SUPP-002',
          name: '供应商B',
          complianceRate: 88.7,
          issues: 5,
          riskLevel: 'medium'
        },
        {
          id: 'SUPP-003',
          name: '供应商C',
          complianceRate: 76.3,
          issues: 8,
          riskLevel: 'high'
        }
      ];
      setMockSupplierCompliance(mockSuppliers);
    }
  }, [visible, alternativeParts.length]);

  // 获取风险标签颜色
  const getRiskTagColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'green';
      case 'medium':
        return 'orange';
      case 'high':
        return 'red';
      default:
        return 'default';
    }
  };

  // 获取证书状态颜色
  const getCertStatusColor = (status: string) => {
    switch (status) {
      case 'urgent':
        return 'red';
      case 'warning':
        return 'orange';
      case 'normal':
        return 'green';
      default:
        return 'default';
    }
  };

  // 处理采纳建议
  const handleAcceptSuggestion = (suggestionType: string, suggestionId: string) => {
    if (onAcceptSuggestion) {
      onAcceptSuggestion(suggestionType, suggestionId);
    } else {
      // 模拟生成ECN草稿
      message.success('已生成ECN草稿');
      console.log(`采纳${suggestionType}类型建议，ID: ${suggestionId}`);
    }
  };

  // 处理忽略建议
  const handleIgnoreSuggestion = (suggestionType: string, suggestionId: string) => {
    const key = `${suggestionType}-${suggestionId}`;
    setIgnoredSuggestions(prev => new Set(prev).add(key));
    
    if (onIgnoreSuggestion) {
      onIgnoreSuggestion(suggestionType, suggestionId);
    } else {
      message.info('建议已忽略');
      console.log(`忽略${suggestionType}类型建议，ID: ${suggestionId}`);
    }
  };

  // 处理采纳所有建议
  const handleAcceptAllSuggestions = () => {
    // 采纳所有替代料建议
    displayAlternativeParts.forEach(alt => {
      const key = `alternative-${alt.id}`;
      if (!ignoredSuggestions.has(key)) {
        handleAcceptSuggestion('alternative', alt.id);
      }
    });
    
    // 采纳所有证书续期建议
    displayCertificationRenewals.forEach(cert => {
      const key = `certification-${cert.id}`;
      if (!ignoredSuggestions.has(key) && cert.status !== 'normal') {
        handleAcceptSuggestion('certification', cert.id);
      }
    });
    
    message.success('已采纳所有有效建议');
    // 可以选择关闭抽屉或保持打开
    // onClose();
  };

  // 使用传入的数据或模拟数据
  const displayAlternativeParts = alternativeParts.length > 0 ? alternativeParts : mockAlternativeParts;
  const displayCertificationRenewals = certificationRenewals.length > 0 ? certificationRenewals : mockCertificationRenewals;
  const displaySupplierCompliance = supplierCompliance.length > 0 ? supplierCompliance : mockSupplierCompliance;

  // 过滤出未被忽略的高匹配度替代料（FFF≥95%）
  const filteredAlternatives = displayAlternativeParts
    .filter(p => p.fff >= 95)
    .filter(alt => !ignoredSuggestions.has(`alternative-${alt.id}`));
    
  // 过滤出未被忽略的需要续期的证书（提前90天）
  const filteredCertifications = displayCertificationRenewals
    .filter(cert => cert.daysRemaining <= 90)
    .filter(cert => !ignoredSuggestions.has(`certification-${cert.id}`));

  return (
    <Drawer
      title={part ? `${part.partName} - AI合规预警` : 'AI合规预警'}
      placement="right"
      width={450}
      onClose={onClose}
      open={visible}
      className="compliance-warning-drawer"
      // 常驻浮动配置
      destroyOnClose={false}
      closable={true}
      maskClosable={true}
    >
      <div className="space-y-6 p-2">
        {/* 推荐合规替代料（FFF≥95%） */}
        <Card 
          title="推荐合规替代料 (FFF≥95%)" 
          extra={<Badge count={filteredAlternatives.length} />}
          size="small"
        >
          <List
            itemLayout="horizontal"
            dataSource={filteredAlternatives}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                actions={[
                  <Button
                    key="accept"
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleAcceptSuggestion('alternative', item.id)}
                  >
                    采纳建议
                  </Button>,
                  <Button
                    key="ignore"
                    size="small"
                    onClick={() => handleIgnoreSuggestion('alternative', item.id)}
                  >
                    忽略
                  </Button>
                ]}
                className="mb-2"
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-2">
                      <Text strong>{item.name}</Text>
                      <Tag color={getRiskTagColor(item.riskLevel)}>
                        {item.riskLevel === 'low' ? '低风险' : item.riskLevel === 'medium' ? '中风险' : '高风险'}
                      </Tag>
                    </div>
                  }
                  description={
                    <div className="space-y-1">
                      <div>供应商: {item.supplier}</div>
                      <div className="flex items-center gap-2">
                        <Text type="secondary">匹配度:</Text>
                        <Text strong style={{ color: '#1890ff' }}>{item.fff}%</Text>
                      </div>
                      <div>成本: ¥{item.cost}</div>
                      <div>认证状态: <Tag color={item.certificationStatus === '已认证' ? 'green' : 'orange'}>{item.certificationStatus}</Tag></div>
                    </div>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无推荐的合规替代料' }}
          />
        </Card>

        {/* 证书续期建议（提前90天） */}
        <Card 
          title="证书续期建议 (提前90天)" 
          extra={<ClockCircleOutlined />}
          size="small"
        >
          <List
            itemLayout="horizontal"
            dataSource={filteredCertifications}
            renderItem={(cert) => (
              <List.Item
                key={cert.id}
                actions={[
                  <Button
                    key="accept"
                    type={cert.status === 'urgent' ? 'primary' : 'default'}
                    danger={cert.status === 'urgent'}
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleAcceptSuggestion('certification', cert.id)}
                  >
                    采纳建议
                  </Button>,
                  <Button
                    key="ignore"
                    size="small"
                    onClick={() => handleIgnoreSuggestion('certification', cert.id)}
                  >
                    忽略
                  </Button>
                ]}
                className="mb-2"
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-2">
                      <Text strong>{cert.name}</Text>
                      <Tag color={getCertStatusColor(cert.status)}>
                        {cert.status === 'urgent' ? '紧急' : cert.status === 'warning' ? '警告' : '正常'}
                      </Tag>
                    </div>
                  }
                  description={
                    <div className="space-y-1">
                      <div>到期日期: {cert.expiresAt}</div>
                      <div>
                        <Progress
                          percent={(cert.daysRemaining / 90) * 100}
                          status={cert.status === 'urgent' ? 'exception' : cert.status === 'warning' ? 'active' : 'normal'}
                          strokeColor={getCertStatusColor(cert.status) === 'red' ? '#ff4d4f' : getCertStatusColor(cert.status) === 'orange' ? '#faad14' : '#52c41a'}
                          size="small"
                        />
                        <Text className="ml-2" type={cert.status === 'urgent' ? 'danger' : cert.status === 'warning' ? 'warning' : 'secondary'}>
                          剩余 {cert.daysRemaining} 天
                        </Text>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无需要续期的证书' }}
          />
        </Card>

        {/* 供应商合规率分析 */}
        <Card 
          title="供应商合规率分析" 
          extra={<BarChartOutlined />}
          size="small"
        >
          <List
            itemLayout="vertical"
            dataSource={displaySupplierCompliance}
            renderItem={(supplier) => (
              <List.Item key={supplier.id} className="mb-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Text strong>{supplier.name}</Text>
                    <Tag color={getRiskTagColor(supplier.riskLevel)}>
                      {supplier.riskLevel === 'low' ? '低风险' : supplier.riskLevel === 'medium' ? '中风险' : '高风险'}
                    </Tag>
                  </div>
                  <div>
                    <Progress
                      percent={supplier.complianceRate}
                      status={supplier.complianceRate >= 90 ? 'success' : supplier.complianceRate >= 80 ? 'normal' : 'exception'}
                      strokeColor={supplier.complianceRate >= 90 ? '#52c41a' : supplier.complianceRate >= 80 ? '#1890ff' : '#ff4d4f'}
                      size="small"
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>合规率: {supplier.complianceRate}%</span>
                    <span>合规问题: {supplier.issues} 个</span>
                  </div>
                </div>
              </List.Item>
            )}
            locale={{ emptyText: '暂无供应商合规数据' }}
          />
        </Card>

        {/* 底部操作按钮 */}
        <div className="pt-4 border-t flex justify-end">
          <Space>
            <Button onClick={onClose}>关闭</Button>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleAcceptAllSuggestions}
            >
              采纳所有建议
            </Button>
          </Space>
        </div>
      </div>
    </Drawer>
  );
};

export default ComplianceWarningDrawer;