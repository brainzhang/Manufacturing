import React, { useState, useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Tag, DatePicker, message, Radio, Upload, Spin, Alert, Card, Row, Col, Divider, InputNumber, Space, Tabs } from 'antd';
import { UploadOutlined, FileTextOutlined, SaveOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, AlertOutlined } from '@ant-design/icons';
import type { RcFile, UploadProps } from 'antd/es/upload/interface';
import type { ComplianceStatus, RemediationRecord } from '../types/compliance';
// 已移除与局部声明冲突的导入
import type { Dayjs } from 'dayjs';
import '../styles/ComplianceStyles.css';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ComplianceTreeNode {
  id: string;
  name: string;
  position: string;
  status: ComplianceStatus;
  expireDate?: string;
  certificateExpiry?: string;
  certificateType?: string;
  certificateNumber?: string;
  manufacturer?: string;
  supplier?: string;
};

interface ComplianceRemediationDrawerProps {
  visible: boolean;
  onClose: () => void;
  node?: ComplianceTreeNode;
  onSubmit?: (record: RemediationRecord) => void;
  loading?: boolean;
}

const getSeverityLevel = (status: ComplianceStatus, expireDate?: string): 'Critical' | 'High' | 'Medium' | 'Low' => {
  if (status === 'missing') {
    return 'Critical';
  }
  
  if (status === 'expiring' && expireDate) {
    const now = new Date();
    const expiry = new Date(expireDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 30) {
      return 'Critical';
    } else if (diffDays <= 60) {
      return 'High';
    } else {
      return 'Medium';
    }
  }
  
  return 'Low';
};

const getIssueType = (status: ComplianceStatus): 'missing-cert' | 'expiring-cert' | 'supplier-issue' => {
  switch (status) {
    case 'missing':
      return 'missing-cert';
    case 'expiring':
      return 'expiring-cert';
    default:
      return 'supplier-issue';
  }
};

const getSuggestedFix = (status: ComplianceStatus): string => {
  switch (status) {
    case 'missing':
      return '请申请并上传缺失的合规认证文件';
    case 'expiring':
      return '请尽快更新即将到期的认证文件';
    default:
      return '请检查并确保所有合规要求';
  }
};

const ComplianceRemediationDrawer: React.FC<ComplianceRemediationDrawerProps> = ({
  visible,
  onClose,
  node,
  onSubmit,
  loading = false
}) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadProps['fileList']>([]);
  const [severity, setSeverity] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('Medium');

  // 当节点变化时更新表单
  useEffect(() => {
    if (visible && node) {
      const nodeSeverity = getSeverityLevel(node.status, node.expireDate || node.certificateExpiry);
      setSeverity(nodeSeverity);
      
      form.setFieldsValue({
        partName: node.name,
        position: node.position,
        issueType: getIssueType(node.status),
        description: `[${node.status === 'missing' ? '缺失认证' : node.status === 'expiring' ? '证书即将到期' : '合规问题'}] ${node.name} (${node.position})`,
        severity: nodeSeverity,
        suggestedFix: getSuggestedFix(node.status),
        certificateExpiry: node.expireDate || node.certificateExpiry
          ? [null, new Date(node.expireDate || node.certificateExpiry)]
          : undefined
      });
    } else {
      form.resetFields();
      setFileList([]);
    }
  }, [visible, node, form]);

  // 自定义上传处理
  const customRequest: UploadProps['customRequest'] = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess('ok', file);
      setFileList([...fileList, file as any]);
    }, 1000);
  };

  // 处理文件变化
  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // 处理文件移除
  const handleRemove: UploadProps['onRemove'] = (file) => {
    setFileList(fileList.filter(f => f.uid !== file.uid));
    return true;
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setUploading(true);
      const values = await form.validateFields();
      
      const remediationRecord: RemediationRecord = {
        id: `remediation-${Date.now()}`,
        partId: node?.id || '',
        partName: values.partName,
        position: values.position,
        issueType: values.issueType,
        description: values.description,
        severity: values.severity,
        suggestedFix: values.suggestedFix,
        assignedTo: values.assignedTo,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onSubmit) {
        onSubmit(remediationRecord);
      }
      
      message.success('整改方案已提交');
      onClose();
    } catch (error) {
      message.error('提交失败，请检查表单');
    } finally {
      setUploading(false);
    }
  };

  // 获取严重程度对应的样式
  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'red';
      case 'High':
        return 'orange';
      case 'Medium':
        return 'blue';
      case 'Low':
        return 'green';
      default:
        return 'default';
    }
  };

  if (!node) {
    return null;
  }

  return (
    <Drawer
      title={`合规整改 - ${node.name}`}
      width={650}
      placement="right"
      onClose={onClose}
      open={visible}
      footer={
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} style={{ marginRight: 8 }} disabled={loading}>
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={uploading || loading}
            icon={<SaveOutlined />}
          >
            提交整改方案
          </Button>
        </div>
      }
      className="compliance-remediation-drawer fade-in"
    >
      <Form
        form={form}
        layout="vertical"
        className="remediation-form"
      >
        {/* 零件信息卡片 */}
        <Card className="remediation-header" title="零件信息" bordered={false}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <div className="info-item">
                <div className="info-label">位号</div>
                <div className="info-value">{node.position}</div>
              </div>
            </Col>
            <Col span={12}>
              <div className="info-item">
                <div className="info-label">零件名称</div>
                <div className="info-value">{node.name}</div>
              </div>
            </Col>
            <Col span={12}>
              <div className="info-item">
                <div className="info-label">严重程度</div>
                <div className="info-value" style={{ color: getSeverityColor(severity) }}>
                  {severity}
                </div>
              </div>
            </Col>
            <Col span={12}>
              <div className="info-item">
                <div className="info-label">合规状态</div>
                <div className="info-value" style={{ 
                  color: node.status === 'compliant' ? '#52c41a' :
                  node.status === 'expiring' ? '#faad14' : '#ff4d4f'
                }}>
                  {node.status === 'compliant' ? '合规' :
                   node.status === 'expiring' ? '即将到期' : '缺失认证'}
                </div>
              </div>
            </Col>
            {node.expireDate && (
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">证书到期</div>
                  <div className="info-value">{node.expireDate}</div>
                </div>
              </Col>
            )}
            {(node as any).lifecycle && (
              <Col span={12}>
                <div className="info-item">
                  <div className="info-label">生命周期</div>
                  <div className="info-value">{(node as any).lifecycle}</div>
                </div>
              </Col>
            )}
          </Row>
        </Card>

        {node.status === 'expiring' && node.expireDate && (
          <Alert
            message="证书即将到期"
            description={`该组件的合规证书将于 ${node.expireDate} 到期，请尽快更新。`}
            type="warning"
            showIcon
            style={{ marginBottom: 16, marginTop: 16 }}
          />
        )}

        {node.status === 'missing' && (
          <Alert
            message="缺失认证"
            description="该组件缺少必要的合规认证文件，请尽快申请并上传。"
            type="error"
            showIcon
            style={{ marginBottom: 16, marginTop: 16 }}
          />
        )}

        {/* 整改信息卡片 */}
        <Card title="整改信息" bordered={false} className="mt-4">
        <Form.Item name="partName" label="零件名称" rules={[{ required: true }]}>
          <Input readOnly />
        </Form.Item>

        <Form.Item name="position" label="位号" rules={[{ required: true }]}>
          <Input readOnly />
        </Form.Item>

        <Form.Item name="certificateExpiry" label="证书有效期">
          <RangePicker disabled />
        </Form.Item>

        <Form.Item name="issueType" label="问题类型" rules={[{ required: true }]}>
          <Select disabled>
            <Option value="missing-cert">缺失认证</Option>
            <Option value="expiring-cert">证书即将到期</Option>
            <Option value="supplier-issue">供应商合规问题</Option>
          </Select>
        </Form.Item>

        <Form.Item name="severity" label="严重程度" rules={[{ required: true }]}>
          <Radio.Group>
            <Radio.Button value="Critical" style={{ color: 'red' }}>Critical</Radio.Button>
            <Radio.Button value="High" style={{ color: 'orange' }}>High</Radio.Button>
            <Radio.Button value="Medium" style={{ color: 'blue' }}>Medium</Radio.Button>
            <Radio.Button value="Low" style={{ color: 'green' }}>Low</Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="description" label="问题描述" rules={[{ required: true }]}>
          <TextArea rows={4} placeholder="请详细描述合规问题..." />
        </Form.Item>

        <Form.Item name="suggestedFix" label="建议修复方案">
          <TextArea rows={3} placeholder="请输入建议的修复方案..." />
        </Form.Item>

        <Form.Item name="assignedTo" label="负责人" rules={[{ required: true }]}>
          <Select placeholder="请选择负责人">
            <Option value="zhangsan">张三</Option>
            <Option value="lisi">李四</Option>
            <Option value="wangwu">王五</Option>
          </Select>
        </Form.Item>

        <Form.Item label="上传证明文件">
          <Upload
            name="files"
            fileList={fileList}
            customRequest={customRequest}
            onChange={handleChange}
            onRemove={handleRemove}
            multiple
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            beforeUpload={(file) => {
              const isAllowedType = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'].some(ext => 
                file.name.toLowerCase().endsWith(ext)
              );
              const isLessThan10M = file.size / 1024 / 1024 < 10;

              if (!isAllowedType) {
                message.error('只允许上传 PDF、Word、图片格式的文件!');
              }
              if (!isLessThan10M) {
                message.error('文件大小不能超过 10MB!');
              }
              return isAllowedType && isLessThan10M;
            }}
          >
            <Button icon={<UploadOutlined />}>点击上传</Button>
          </Upload>
          <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
            支持格式：PDF、Word、图片，最多上传5个文件，单个文件大小不超过10MB
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
            建议上传：合规证书、整改计划文档、相关证明材料等
          </div>
        </Form.Item>

        <Form.Item label="整改计划">
          <div className="remediation-plan">
            <div className="plan-item">
              <ClockCircleOutlined style={{ color: '#1890ff' }} />
              <span>申请新证书/更新证书</span>
            </div>
            <div className="plan-item">
              <FileTextOutlined style={{ color: '#1890ff' }} />
              <span>提交合规审核</span>
            </div>
            <div className="plan-item">
              <CheckCircleOutlined style={{ color: '#1890ff' }} />
              <span>完成整改并关闭</span>
            </div>
          </div>
        </Form.Item>
        </Card>
      </Form>

      <style>{
        `
        .remediation-form {
          max-height: 70vh;
          overflow-y: auto;
        }
        .remediation-header {
          margin-bottom: 20px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
        }
        .info-label {
          color: #666;
          font-size: 14px;
        }
        .info-value {
          font-weight: 500;
          font-size: 14px;
        }
        .mt-4 {
          margin-top: 16px;
        }
        .remediation-plan {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .plan-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px;
        }
        @media (max-width: 768px) {
          .drawer-content {
            padding: 12px;
          }
        }
        `
      }</style>
    </Drawer>
  );
};

export default ComplianceRemediationDrawer;