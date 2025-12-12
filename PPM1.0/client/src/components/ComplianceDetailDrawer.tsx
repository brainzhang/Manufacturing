import React, { useState } from 'react';
import { Drawer, Descriptions, List, Tag, Button, Space, Modal, Calendar, Image, message } from 'antd';
import { ReloadOutlined, SwapOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

// 到期零件接口定义
interface ExpiryPart {
  partName: string;
  certificateType: string;
  certificateNumber: string;
}

// 实现到期日历组件
const CertCalendar: React.FC<{
  highlightDates: string[];
  expiryPartsByDate: Record<string, ExpiryPart[]>;
  onDateSelect: (date: dayjs.Dayjs) => void;
}> = ({ highlightDates, expiryPartsByDate, onDateSelect }) => {
  // 自定义日期单元格渲染
  const dateCellRender = (value: dayjs.Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    const hasExpiry = highlightDates.includes(dateStr);
    
    return (
      <div className={`p-1 text-center ${hasExpiry ? 'bg-warning/20 rounded cursor-pointer' : ''}`}>
        <span className={hasExpiry ? 'font-medium text-warning' : ''}>
          {value.date()}
        </span>
      </div>
    );
  };

  return (
    <Calendar
      fullscreen={false}
      cellRender={dateCellRender}
      onSelect={onDateSelect}
      className="calendar-style"
    />
  );
};

interface Certificate {
  id: string;
  type: string;
  certNumber: string;
  expireDate: string;
  status: 'valid' | 'expiring' | 'expired';
}

interface PartDetail {
  id: string;
  position: string;
  name: string;
  supplier: string;
  cost: number;
  lifecycle: string;
  imageUrl?: string;
  certificates: Certificate[];
}

interface ComplianceDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  partData?: PartDetail;
  onRenewCert?: (certId: string) => void;
  onReplaceCert?: (certId: string) => void;
  onExportCert?: (certId: string) => void;
  onRenewAllCertificates?: () => void;
  onReplaceWithCompliant?: () => void;
  onExportAllCertificates?: () => void;
}

const ComplianceDetailDrawer: React.FC<ComplianceDetailDrawerProps> = ({
  visible,
  onClose,
  partData,
  onRenewCert,
  onReplaceCert,
  onExportCert,
  onRenewAllCertificates,
  onReplaceWithCompliant,
  onExportAllCertificates
}) => {
  // 状态管理
  const [expiryModalVisible, setExpiryModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const [expiryParts, setExpiryParts] = useState<ExpiryPart[]>([]);

  // 模拟零件详情数据
  const mockPartData: PartDetail = {
    id: 'part-1',
    position: 'U1',
    name: 'i7-1555U处理器',
    supplier: 'Intel',
    cost: 250.50,
    lifecycle: 'Active',
    // 模拟零件图片URL
    imageUrl: '/placeholder/cpu-part.jpg',
    certificates: [
      {
        id: 'cert-1',
        type: 'RoHS',
        certNumber: 'ROHS-2025-001',
        expireDate: '2025-08-01',
        status: 'expiring'
      },
      {
        id: 'cert-2',
        type: 'CE',
        certNumber: 'CE-2025-002',
        expireDate: '2025-12-01',
        status: 'valid'
      },
      {
        id: 'cert-3',
        type: 'REACH',
        certNumber: 'REACH-2024-001',
        expireDate: '2024-10-15',
        status: 'expired'
      }
    ]
  };

  const part = partData || mockPartData;
  // 确保part不为undefined且有certificates属性
  const safePart = part || mockPartData;
  const certificates = safePart.certificates || [];

  // 根据证书状态获取颜色和文本
  const getCertStatusConfig = (status: Certificate['status']) => {
    switch (status) {
      case 'valid':
        return { color: 'success', text: '有效' };
      case 'expiring':
        return { color: 'warning', text: '即将到期' };
      case 'expired':
        return { color: 'error', text: '已过期' };
      default:
        return { color: 'default', text: '未知' };
    }
  };

  // 获取即将到期的证书日期用于日历高亮
  const expiringDates = certificates
    .filter(cert => cert.status === 'expiring' || cert.status === 'expired')
    .map(cert => cert.expireDate);

  // 按日期分组的到期零件数据（模拟）
  const expiryPartsByDate: Record<string, ExpiryPart[]> = {};
  certificates.forEach(cert => {
    if (cert.status === 'expiring' || cert.status === 'expired') {
      if (!expiryPartsByDate[cert.expireDate]) {
        expiryPartsByDate[cert.expireDate] = [];
      }
      expiryPartsByDate[cert.expireDate].push({
        partName: part.name,
        certificateType: cert.type,
        certificateNumber: cert.certNumber
      });
    }
  });

  // 处理日历日期选择
  const handleCalendarSelect = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const parts = expiryPartsByDate[dateStr];
    
    if (parts && parts.length > 0) {
      setSelectedDate(date);
      setExpiryParts(parts);
      setExpiryModalVisible(true);
    }
  };

  // 处理关闭到期零件列表弹窗
  const handleCloseExpiryModal = () => {
    setExpiryModalVisible(false);
    setSelectedDate(null);
    setExpiryParts([]);
  };

  // 处理续期证书
  const handleRenewCert = (certId: string) => {
    Modal.confirm({
      title: '续期证书',
      content: '确定要续期此证书吗？',
      onOk: () => onRenewCert?.(certId)
    });
  };

  // 处理替换证书
  const handleReplaceCert = (certId: string) => {
    Modal.confirm({
      title: '替换证书',
      content: '确定要替换此证书吗？',
      onOk: () => onReplaceCert?.(certId)
    });
  };

  return (
    <>
      <Drawer
        title={`零件详情 - ${part.name}`}
        placement="right"
        onClose={onClose}
        open={visible}
        width={600}
      >
        {/* 零件大图和基础属性 */}
        <div className="mb-6">
          {part.imageUrl ? (
            <Image
              src={part.imageUrl}
              alt={part.name}
              style={{ width: '100%', height: 200, objectFit: 'contain' }}
              preview={false}
              className="mb-4 border rounded"
            />
          ) : (
            <div className="bg-gray-100 h-40 flex items-center justify-center mb-4">
              <span className="text-gray-500">零件图片占位</span>
            </div>
          )}
          <Descriptions column={2} size="small">
            <Descriptions.Item label="位号">{part.position}</Descriptions.Item>
            <Descriptions.Item label="供应商">{part.supplier}</Descriptions.Item>
            <Descriptions.Item label="成本">${part.cost ? `$${part.cost.toFixed(2)}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="生命周期">{part.lifecycle}</Descriptions.Item>
          </Descriptions>
        </div>

        {/* 证书列表 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">证书列表</h3>
          <List
            size="small"
            bordered
            dataSource={part.certificates}
            renderItem={(cert) => {
              const statusConfig = getCertStatusConfig(cert.status);
              return (
                <List.Item
                  actions={[
                    cert.status !== 'valid' && (
                      <Button
                        size="small"
                        icon={<ReloadOutlined />}
                        onClick={() => handleRenewCert(cert.id)}
                      >
                        续期
                      </Button>
                    ),
                    <Button
                      size="small"
                      icon={<SwapOutlined />}
                      onClick={() => handleReplaceCert(cert.id)}
                    >
                      替换
                    </Button>,
                    <Button
                      size="small"
                      icon={<FileTextOutlined />}
                      onClick={() => onExportCert?.(cert.id)}
                    >
                      查看
                    </Button>
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{cert.type}</span>
                        <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
                      </Space>
                    }
                    description={
                      <Space direction="vertical">
                        <span>证书编号: {cert.certNumber}</span>
                        <span>有效期至: {cert.expireDate}</span>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>

        {/* 到期日历 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">到期日历</h3>
          <CertCalendar 
            highlightDates={expiringDates} 
            expiryPartsByDate={expiryPartsByDate}
            onDateSelect={handleCalendarSelect}
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between pt-4 border-t">
          <Space>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => {
                message.info('打开MDM证书上传弹窗');
                onRenewAllCertificates?.();
              }}
            >
              续期证书
            </Button>
            <Button
              icon={<SwapOutlined />}
              onClick={() => {
                message.info('打开替代料抽屉');
                onReplaceWithCompliant?.();
              }}
            >
              替换为合规
            </Button>
          </Space>
          <Button
            icon={<FileTextOutlined />}
            onClick={() => {
              message.success('下载PDF证书');
              onExportAllCertificates?.();
            }}
          >
            导出证书
          </Button>
        </div>
      </Drawer>

      {/* 到期零件列表弹窗 */}
      <Modal
        title={selectedDate ? `${selectedDate.format('YYYY-MM-DD')} 到期零件列表` : '到期零件列表'}
        open={expiryModalVisible}
        onOk={handleCloseExpiryModal}
        onCancel={handleCloseExpiryModal}
        width={500}
      >
      <div className="space-y-3">
        {expiryParts.map((item, index) => (
          <div key={index} className="p-3 border rounded bg-gray-50">
            <div className="space-y-1">
              <div><strong>零件名称:</strong> {item.partName}</div>
              <div><strong>证书类型:</strong> {item.certificateType}</div>
              <div><strong>证书编号:</strong> {item.certificateNumber}</div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  </>
  );
}

export default ComplianceDetailDrawer;