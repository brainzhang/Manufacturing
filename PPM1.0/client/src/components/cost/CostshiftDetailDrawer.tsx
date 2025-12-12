import React, { useState, useEffect } from 'react';
import { Drawer, Card, Typography, Table, Button, Space, Tag, Image, Modal, DatePicker, Radio } from 'antd';
import { CalendarOutlined, DownloadOutlined, UploadOutlined, SwapOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import type { ColumnsType } from 'antd/es/table';
import type { Dayjs } from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Group: RadioGroup } = Radio;

interface Certificate {
  id: string;
  type: string;
  certificateNumber: string;
  expiryDate: string;
  status: string; // 有效、即将到期、已过期
}

interface PartInfo {
  partId: string;
  partName: string;
  partNumber: string;
  description: string;
  supplier: string;
  manufacturer: string;
  imageUrl?: string;
}

interface PriceData {
  month: string;
  standardPrice: number;
  movingAveragePrice: number;
  contractPrice: number;
}

interface ComplianceDetailDrawerProps {
  visible: boolean;
  part?: PartInfo | null;
  certificates?: Certificate[];
  onClose: () => void;
  onRenewCertificate?: (certificateId: string) => void;
  onReplaceWithCompliant?: () => void;
  onExportCertificate?: (certificateId: string) => void;
  onViewCertificate?: (certificateId: string) => void;
}

const ComplianceDetailDrawer: React.FC<ComplianceDetailDrawerProps> = ({
  visible,
  part,
  certificates = [],
  onClose,
  onRenewCertificate,
  onReplaceWithCompliant,
  onExportCertificate,
  onViewCertificate
}) => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [expiryModalVisible, setExpiryModalVisible] = useState(false);
  const [expiryParts, setExpiryParts] = useState<any[]>([]);
  const [mockCertificates, setMockCertificates] = useState<Certificate[]>([]);
  const [mockPartInfo, setMockPartInfo] = useState<PartInfo>({
    partId: 'PART-001',
    partName: '电子元件X-23',
    partNumber: 'EC-2024-001',
    description: '高精度电子元件，用于控制系统',
    supplier: '优质供应商',
    manufacturer: '专业制造商',
    imageUrl: '/placeholder/costshift.jpg'
  });
  const [priceType, setPriceType] = useState<'standard' | 'movingAverage' | 'contract'>('standard');
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [supplierData, setSupplierData] = useState<{name: string, value: number}[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  // 生成模拟数据
  useEffect(() => {
    if (visible && !certificates.length) {
      const mockCerts: Certificate[] = [
        {
          id: 'CERT-001',
          type: 'RoHS',
          certificateNumber: 'ROHS-2025-001',
          expiryDate: '2025-08-01',
          status: '即将到期'
        },
        {
          id: 'CERT-002',
          type: 'CE',
          certificateNumber: 'CE-2025-002',
          expiryDate: '2025-12-01',
          status: '有效'
        },
        {
          id: 'CERT-003',
          type: 'REACH',
          certificateNumber: 'REACH-2024-003',
          expiryDate: '2024-11-30',
          status: '有效'
        },
        {
          id: 'CERT-004',
          type: 'ISO 9001',
          certificateNumber: 'ISO-2025-004',
          expiryDate: '2025-06-15',
          status: '即将到期'
        }
      ];
      setMockCertificates(mockCerts);
    }
    
    // 生成近12个月的模拟价格数据（模拟MDM价格API数据）
    const generatePriceData = (): PriceData[] => {
      const months = [];
      const now = new Date();
      let baseStandardPrice = 100 + Math.random() * 50;
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = `${date.getMonth() + 1}月`;
        
        // 添加一些随机波动
        const standardPrice = baseStandardPrice + (Math.random() - 0.5) * 10;
        const movingAveragePrice = standardPrice * (0.95 + Math.random() * 0.1);
        const contractPrice = standardPrice * (0.9 + Math.random() * 0.15);
        
        // 让价格有一定的趋势
        baseStandardPrice += (Math.random() - 0.4) * 3;
        
        months.push({
          month: monthStr,
          standardPrice: Number(standardPrice.toFixed(2)),
          movingAveragePrice: Number(movingAveragePrice.toFixed(2)),
          contractPrice: Number(contractPrice.toFixed(2))
        });
      }
      return months;
    };
    
    // 生成供应商占比数据（模拟MDM供应商配额数据）
    const generateSupplierData = () => [
      { name: 'Foxconn', value: 45 },
      { name: '广达电脑', value: 25 },
      { name: '和硕科技', value: 15 },
      { name: '英业达', value: 10 },
      { name: '仁宝电脑', value: 5 }
    ];
    
    setPriceData(generatePriceData());
    setSupplierData(generateSupplierData());
  }, [visible, certificates.length]);

  // 获取状态对应的标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case '有效':
        return 'green';
      case '即将到期':
        return 'orange';
      case '已过期':
        return 'red';
      default:
        return 'default';
    }
  };

  // 处理日历日期点击
  const handleCalendarSelect = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      // 模拟根据日期查看到期零件
      const dateStr = date.format('YYYY-MM-DD');
      const parts = [
        {
          partName: '电子元件X-23',
          certificateType: 'RoHS',
          certificateNumber: 'ROHS-2025-001'
        },
        {
          partName: '连接器Y-15',
          certificateType: 'RoHS',
          certificateNumber: 'ROHS-2025-002'
        }
      ];
      setExpiryParts(parts);
      setExpiryModalVisible(true);
    }
  };

  // 处理证书续期
  const handleRenew = (certificateId: string) => {
    if (onRenewCertificate) {
      onRenewCertificate(certificateId);
    } else {
      // 模拟打开MDM证书上传弹窗
      Modal.info({
        title: '证书续期',
        content: `打开MDM证书上传弹窗，证书ID: ${certificateId}`,
        onOk: () => console.log('上传证书')
      });
    }
  };

  // 处理替换为合规零件
  const handleReplace = () => {
    if (onReplaceWithCompliant) {
      onReplaceWithCompliant();
    } else {
      // 模拟打开替代料抽屉
      Modal.info({
        title: '替换为合规零件',
        content: '打开替代料抽屉，显示可用的合规替代料',
        onOk: () => console.log('替换零件')
      });
    }
  };

  // 处理导出证书
  const handleExport = (certificateId: string) => {
    if (onExportCertificate) {
      onExportCertificate(certificateId);
    } else {
      console.log('导出证书:', certificateId);
      // 模拟下载PDF证书
      Modal.success({
        title: '导出成功',
        content: `证书已成功导出为PDF格式`,
        onOk: () => {}
      });
    }
  };

  // 处理查看证书
  const handleView = (certificateId: string) => {
    if (onViewCertificate) {
      onViewCertificate(certificateId);
    } else {
      console.log('查看证书:', certificateId);
      Modal.info({
        title: '查看证书',
        content: `查看证书详情，证书ID: ${certificateId}`,
        onOk: () => {}
      });
    }
  };
  
  // 处理价格类型切换
  const handlePriceTypeChange = (e: any) => {
    setPriceType(e.target.value);
  };
  
  // 处理供应商点击
  const handleSupplierClick = (supplierName: string) => {
    setSelectedSupplier(supplierName);
    // 在实际应用中，这里应该打开供应商详情弹窗
    Modal.info({
      title: `供应商详情: ${supplierName}`,
      content: (
        <div>
          <p>供应商名称: {supplierName}</p>
          <p>联系电话: 400-888-8888</p>
          <p>地址: 中国上海市浦东新区张江高科技园区</p>
          <p>合作年限: 5年</p>
          <p>供应商等级: A级</p>
        </div>
      ),
      onOk: () => setSelectedSupplier(null)
    });
  };

  // 表格列配置
  const columns: ColumnsType<Certificate> = [
    {
      title: '认证',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: '证书编号',
      dataIndex: 'certificateNumber',
      key: 'certificateNumber'
    },
    {
      title: '有效期',
      dataIndex: 'expiryDate',
      key: 'expiryDate'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        if (record.status === '即将到期' || record.status === '已过期') {
          return (
            <Space size="small">
              <Button size="small" onClick={() => handleRenew(record.id)}>
                续期
              </Button>
              <Button size="small" onClick={() => handleReplace()}>替换</Button>
            </Space>
          );
        } else {
          return (
            <Button size="small" onClick={() => handleView(record.id)}>查看</Button>
          );
        }
      }
    }
  ];

  const displayCertificates = certificates.length > 0 ? certificates : mockCertificates;
  const displayPart = part || mockPartInfo;

  return (
    <>
      <Drawer
        title={displayPart.partName ? `${displayPart.partName} - 成本详情` : '成本详情'}
        placement="right"
        width={600}
        onClose={onClose}
        open={visible}
        className="compliance-detail-drawer"
      >
        <div className="space-y-6 p-2">
          {/* 零件大图 + 基础属性 */}
          <Card title="零件信息">
            <div className="flex flex-col md:flex-row gap-4">
              {displayPart.imageUrl && (
                <div className="flex-shrink-0">
                  <Image
                    width={200}
                    height={200}
                    src={displayPart.imageUrl}
                    alt={displayPart.partName}
                    fallback="/placeholder/costshift.jpg"
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Text strong>零件编号:</Text>
                  <Text>{displayPart.partNumber}</Text>
                </div>
                <div className="flex justify-between">
                  <Text strong>零件名称:</Text>
                  <Text>{displayPart.partName}</Text>
                </div>
                <div className="flex justify-between">
                  <Text strong>供应商:</Text>
                  <Text>{displayPart.supplier}</Text>
                </div>
                <div className="flex justify-between">
                  <Text strong>制造商:</Text>
                  <Text>{displayPart.manufacturer}</Text>
                </div>
                <div>
                  <Text strong className="block mb-1">描述:</Text>
                  <Text type="secondary">{displayPart.description}</Text>
                </div>
              </div>
            </div>
          </Card>

          {/* 证书列表已删除 */}

          {/* 成本曲线图 */}
          <Card title="成本曲线（近12个月）" extra={
            <RadioGroup value={priceType} onChange={handlePriceTypeChange}>
              <Radio.Button value="standard">标准价</Radio.Button>
              <Radio.Button value="movingAverage">移动平均价</Radio.Button>
              <Radio.Button value="contract">合同价</Radio.Button>
            </RadioGroup>
          }>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {priceType === 'standard' && (
                    <Line 
                      type="monotone" 
                      dataKey="standardPrice" 
                      name="标准价" 
                      stroke="#1890ff" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                  )}
                  {priceType === 'movingAverage' && (
                    <Line 
                      type="monotone" 
                      dataKey="movingAveragePrice" 
                      name="移动平均价" 
                      stroke="#52c41a" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                  )}
                  {priceType === 'contract' && (
                    <Line 
                      type="monotone" 
                      dataKey="contractPrice" 
                      name="合同价" 
                      stroke="#faad14" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }} 
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-right">
              <Text type="secondary">数据来源：MDM价格API</Text>
            </div>
          </Card>
          
          {/* 供应商占比饼图 */}
          <Card title="供应商占比">
            <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supplierData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={(_, index) => handleSupplierClick(supplierData[index].name)}
                    stroke={selectedSupplier ? "#ffffff" : "none"}
                    strokeWidth={selectedSupplier ? 2 : 1}
                  >
                    {supplierData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={[
                          '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'
                        ][index % 5]}
                        style={{
                          cursor: 'pointer',
                          opacity: selectedSupplier === entry.name ? 1 : 0.8
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-right">
              <Text type="secondary">数据来源：MDM供应商配额</Text>
            </div>
            <div className="text-center mt-2">
              <Text type="secondary" style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                点击扇区查看供应商详情
              </Text>
            </div>
          </Card>
          
          {/* 到期日历 */}
          <Card title="到期日历" extra={<CalendarOutlined />}>
            <div className="p-2">
              <Text type="secondary">点击日期查看到期零件</Text>
              <DatePicker
                  style={{ width: '100%' }}
                  onChange={handleCalendarSelect}
                  className="calendar-style"
              />
            </div>
          </Card>

          {/* 底部操作按钮已删除 */}
        </div>
      </Drawer>

      {/* 到期零件列表弹窗 */}
      <Modal
        title={`${selectedDate?.format('YYYY-MM-DD')} 到期零件列表`}
        open={expiryModalVisible}
        onOk={() => setExpiryModalVisible(false)}
        onCancel={() => setExpiryModalVisible(false)}
        width={500}
      >
        <div className="space-y-3">
          {expiryParts.map((item, index) => (
            <Card key={index} size="small">
              <div className="space-y-1">
                <div><Text strong>零件名称:</Text> {item.partName}</div>
                <div><Text strong>证书类型:</Text> {item.certificateType}</div>
                <div><Text strong>证书编号:</Text> {item.certificateNumber}</div>
              </div>
            </Card>
          ))}
        </div>
      </Modal>
    </>
  );
};

export default ComplianceDetailDrawer;