import React, { useState, useEffect } from 'react';
import { Drawer, Card, List, Tag, Button, Progress, Alert, message, Divider } from 'antd';
import { BulbOutlined, CheckCircleOutlined, ClockCircleOutlined, DownloadOutlined } from '@ant-design/icons';

// 替代料推荐接口
interface AlternativePart {
  partId: string;
  partName: string;
  fffRate: number;
  complianceStatus: string;
  cost: number;
  lifecycle: string;
}

// 证书续期建议接口
interface CertificateRenewalSuggestion {
  certId: string;
  certType: string;
  expiryDate: string;
  daysUntilExpiry: number;
  priority: 'high' | 'medium' | 'low';
}

// 供应商分析接口
interface SupplierAnalysis {
  supplierId: string;
  supplierName: string;
  complianceRate: number;
  totalParts: number;
  atRiskParts: number;
}

interface ComplianceWarningDrawerProps {
  visible: boolean;
  onClose: () => void;
  onAdoptSuggestion: (suggestionType: string, suggestionData: any) => void;
  onIgnoreSuggestion: () => void;
  selectedParts?: any[];
  alertType?: string | null;
}

const ComplianceWarningDrawer: React.FC<ComplianceWarningDrawerProps> = ({
  visible,
  onClose,
  onAdoptSuggestion,
  onIgnoreSuggestion,
  selectedParts = [],
  alertType = null
}) => {
  const [alternativeParts, setAlternativeParts] = useState<AlternativePart[]>([]);
  const [certificateSuggestions, setCertificateSuggestions] = useState<CertificateRenewalSuggestion[]>([]);
  const [supplierAnalysis, setSupplierAnalysis] = useState<SupplierAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  // 模拟数据加载
  useEffect(() => {
    if (visible) {
      setLoading(true);
      // 模拟API调用延迟
      setTimeout(() => {
        // 模拟替代料推荐数据
        const mockAlternativeParts: AlternativePart[] = [
          {
            partId: 'ALT-P-001',
            partName: '合规替代电阻 R10K',
            fffRate: 98,
            complianceStatus: '合规',
            cost: 0.15,
            lifecycle: '活跃'
          },
          {
            partId: 'ALT-P-002',
            partName: '低铅电容 C104',
            fffRate: 95,
            complianceStatus: '合规',
            cost: 0.25,
            lifecycle: '活跃'
          },
          {
            partId: 'ALT-P-003',
            partName: '无卤连接器 JST-XH',
            fffRate: 96,
            complianceStatus: '合规',
            cost: 1.20,
            lifecycle: '活跃'
          }
        ];

        // 模拟证书续期建议数据
        const mockCertificateSuggestions: CertificateRenewalSuggestion[] = [
          {
            certId: 'ROHS-2025-001',
            certType: 'RoHS',
            expiryDate: '2025-08-01',
            daysUntilExpiry: 60,
            priority: 'high'
          },
          {
            certId: 'CE-2025-002',
            certType: 'CE',
            expiryDate: '2025-12-01',
            daysUntilExpiry: 180,
            priority: 'medium'
          },
          {
            certId: 'REACH-2025-003',
            certType: 'REACH',
            expiryDate: '2025-05-15',
            daysUntilExpiry: 15,
            priority: 'high'
          }
        ];

        // 模拟供应商分析数据
        const mockSupplierAnalysis: SupplierAnalysis[] = [
          {
            supplierId: 'SUP-001',
            supplierName: '优质电子有限公司',
            complianceRate: 92,
            totalParts: 150,
            atRiskParts: 12
          },
          {
            supplierId: 'SUP-002',
            supplierName: '诚信元件厂',
            complianceRate: 78,
            totalParts: 80,
            atRiskParts: 18
          },
          {
            supplierId: 'SUP-003',
            supplierName: '创新科技集团',
            complianceRate: 95,
            totalParts: 120,
            atRiskParts: 6
          }
        ];

        setAlternativeParts(mockAlternativeParts);
        setCertificateSuggestions(mockCertificateSuggestions);
        setSupplierAnalysis(mockSupplierAnalysis);
        setLoading(false);
      }, 800);
    }
  }, [visible]);

  // 处理采纳建议
  const handleAdoptSuggestion = (suggestionType: string, suggestionData: any) => {
    message.success('建议已采纳，正在生成ECN草稿...');
    onAdoptSuggestion(suggestionType, suggestionData);
    // 实际项目中应该调用API生成ECN草稿
  };

  // 获取优先级标签颜色
  const getPriorityTagColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'default';
    }
  };

  // 获取合规状态标签颜色
  const getComplianceTagColor = (status: string) => {
    switch (status) {
      case '合规':
        return 'success';
      case '不合规':
        return 'error';
      case '待审核':
        return 'warning';
      default:
        return 'default';
    }
  };

  // 根据预警类型获取抽屉标题
  const getDrawerTitle = () => {
    switch (alertType) {
      case 'certificate-expiring':
        return '证书到期详情';
      case 'missing-cert':
        return '缺失认证详情';
      case 'supplier-compliance':
        return '供应商合规率详情';
      default:
        return 'AI合规预警';
    }
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <BulbOutlined style={{ fontSize: '20px', color: '#faad14' }} />
          <span>{getDrawerTitle()}</span>
        </div>
      }
      placement="bottom"
      onClose={onClose}
      open={visible}
      height="80%"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onIgnoreSuggestion}>忽略</Button>
          <Button type="primary" onClick={() => handleAdoptSuggestion('all', {})}>采纳所有建议</Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* 根据不同的预警类型显示相应的内容 */}
        {(alertType === 'missing-cert' || !alertType) && (
          <Card title="推荐合规替代料 (FFF≥95%)" variant="outlined">
            {loading ? (
              <div className="text-center py-4">加载中...</div>
            ) : (
              <List
                dataSource={alternativeParts}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        onClick={() => handleAdoptSuggestion('alternative', item)}
                      >
                        采纳
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div className="flex items-center justify-between">
                          <span>{item.partName}</span>
                          <Tag color={getComplianceTagColor(item.complianceStatus)}>
                            {item.complianceStatus}
                          </Tag>
                        </div>
                      }
                      description={
                        <div className="space-y-2">
                          <div>物料编号: {item.partId}</div>
                          <div className="flex items-center gap-4">
                            <span>FFF匹配度: <strong>{item.fffRate}%</strong></span>
                            <span>成本: ¥{item.cost.toFixed(2)}</span>
                            <span>生命周期: {item.lifecycle}</span>
                          </div>
                          <Progress percent={item.fffRate} status="active" />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        )}

        {(alertType === 'certificate-expiring' || !alertType) && (
          <Card title="证书续期建议" variant="outlined">
            {loading ? (
              <div className="text-center py-4">加载中...</div>
            ) : (
              <List
                dataSource={certificateSuggestions}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        icon={<ClockCircleOutlined />}
                        onClick={() => handleAdoptSuggestion('certificate', item)}
                      >
                        安排续期
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div className="flex items-center justify-between">
                          <span>{item.certType} 认证</span>
                          <Tag color={getPriorityTagColor(item.priority)}>
                            {item.priority === 'high' ? '高优先级' : 
                             item.priority === 'medium' ? '中优先级' : '低优先级'}
                          </Tag>
                        </div>
                      }
                      description={
                        <div className="space-y-2">
                          <div>证书编号: {item.certId}</div>
                          <div className="flex items-center gap-4">
                            <span>到期日期: {item.expiryDate}</span>
                            <span>
                              剩余天数:
                              <strong className={item.daysUntilExpiry < 30 ? 'text-red-600' : ''}>
                                {' '}{item.daysUntilExpiry} 天
                              </strong>
                            </span>
                          </div>
                          <Alert 
                            message={`建议提前${item.daysUntilExpiry > 90 ? '90' : item.daysUntilExpiry}天安排续期`} 
                            type="info" 
                            showIcon 
                            className="text-sm"
                          />
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        )}

        {(alertType === 'supplier-compliance' || !alertType) && (
          <Card title="供应商合规率分析" variant="outlined">
            {loading ? (
              <div className="text-center py-4">加载中...</div>
            ) : (
              <List
                dataSource={supplierAnalysis}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        icon={<DownloadOutlined />}
                        onClick={() => handleAdoptSuggestion('supplier', item)}
                      >
                        导出报告
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div className="flex items-center justify-between">
                          <span>{item.supplierName}</span>
                          <Tag color={item.complianceRate < 80 ? 'red' : item.complianceRate < 90 ? 'orange' : 'green'}>
                            {item.complianceRate}%
                          </Tag>
                        </div>
                      }
                      description={
                        <div className="space-y-2">
                          <div>供应商编号: {item.supplierId}</div>
                          <div className="flex items-center gap-4">
                            <span>总零件数: {item.totalParts}</span>
                            <span>风险零件数: {item.atRiskParts}</span>
                          </div>
                          <Progress 
                            percent={item.complianceRate} 
                            status={item.complianceRate < 80 ? 'exception' : 'active'} 
                          />
                          {item.complianceRate < 80 && (
                            <Alert 
                              message="供应商合规率过低，建议优化供应商管理或考虑替代供应商" 
                              type="warning" 
                              showIcon 
                              className="text-sm"
                            />
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        )}

        {/* 总体建议汇总 - 只有在没有指定特定预警类型时显示 */}
        {!alertType && (
          <Card title="总体建议汇总" variant="outlined">
            <div className="space-y-4">
              <Alert 
                message="建议立即处理高优先级证书续期" 
                description="有2份证书将在90天内到期，需要尽快安排续期工作。" 
                type="warning" 
                showIcon 
              />
              <Alert 
                message="推荐替换不合规零件" 
                description={`已为您找到${alternativeParts.length}个高匹配度(FFF≥95%)的合规替代方案。`} 
                type="info" 
                showIcon 
              />
              <Alert 
                message="供应商管理建议" 
                description="建议对合规率低于80%的供应商进行审核，并考虑优化供应商结构。" 
                type="info" 
                showIcon 
              />
              <Button 
                type="primary" 
                block 
                size="large"
                onClick={() => handleAdoptSuggestion('all', {})}
                className="mt-4"
              >
                <CheckCircleOutlined /> 采纳全部建议并生成ECN草稿
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Drawer>
  );
};

export default ComplianceWarningDrawer;