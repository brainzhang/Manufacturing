import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Card,
  Avatar,
  Typography,
  Space,
  Tooltip,
  message,
  AutoComplete
} from 'antd';
import {
  SearchOutlined,
  InfoCircleOutlined,
  PictureOutlined
} from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const BasicInfoStep = ({ currentStep, onStepChange, data, onChange, addLog }) => {
  const [form] = Form.useForm();
  const [productModels, setProductModels] = useState([]);
  const [productSerials, setProductSerials] = useState([]);
  const [productImage, setProductImage] = useState('');
  const [productAttributes, setProductAttributes] = useState({});
  const [bomVersions, setBomVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 模拟MDM产品库数据
  const mockProductModels = [
    { 
      id: 'THINKPAD-T14-GEN3', 
      name: 'ThinkPad T14 Gen 3', 
      platform: 'ThinkPad',
      family: 'T Series',
      gen: 'Gen 3',
      image: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.alicdn.com%2Fi3%2F11973589%2FO1CN01mRb4Ch1cNoLCTubmE_%21%2111973589.jpg&refer=http%3A%2F%2Fimg.alicdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1766599687&t=214c55333a3a4f83116b0245dbaef862'
    },
    { 
      id: 'THINKPAD-X1-CARBON-GEN10', 
      name: 'ThinkPad X1 Carbon Gen 10', 
      platform: 'ThinkPad',
      family: 'X1 Series',
      gen: 'Gen 10',
      image: 'https://nimg.ws.126.net/?url=http%3A%2F%2Fdingyue.ws.126.net%2F2024%2F1111%2Fc2f1f216j00smrkzj006ud000lw00gdm.jpg&thumbnail=660x2147483647&quality=80&type=jpg'
    },
    { 
      id: 'LENOVO-YOGA-7I', 
      name: 'Lenovo Yoga 7i', 
      platform: 'Yoga',
      family: 'Yoga Series',
      gen: '7i',
      image: 'https://inews.gtimg.com/om_bt/OTKllX-tLiHtFOVxtE3sEIk5yoj7gv-gWM55e9xwRQ-nQAA/641'
    },
    { 
      id: 'THINKBOOK-14S', 
      name: 'ThinkBook 14s', 
      platform: 'ThinkBook',
      family: 'ThinkBook Series',
      gen: '14s',
      image: 'https://bkimg.cdn.bcebos.com/pic/d1a20cf431adcbef6f710066a3af2edda3cc9f0c'
    }
  ];
  
  // 模拟产品序列号数据 - 全部按照SN格式规范化
  const mockProductSerials = {
    'THINKPAD-T14-GEN3': ['SN-T14G3-2024-001', 'SN-T14G3-2024-002', 'SN-T14G3-2024-003', 'SN-T14G3-2023-Q1', 'SN-T14G3-2023-Q2', 'SN-T14G3-2023-Q3', 'SN-T14G3-2023-Q4'],
    'THINKPAD-X1-CARBON-GEN10': ['SN-X1C10-2024-001', 'SN-X1C10-2024-002', 'SN-X1C10-2024-003', 'SN-X1C10-2023-Q1', 'SN-X1C10-2023-Q2', 'SN-X1C10-2023-Q3', 'SN-X1C10-2023-Q4'],
    'LENOVO-YOGA-7I': ['SN-YGA7I-2024-001', 'SN-YGA7I-2024-002', 'SN-YGA7I-2024-003', 'SN-YGA7I-2023-Q1', 'SN-YGA7I-2023-Q2', 'SN-YGA7I-2023-Q3', 'SN-YGA7I-2023-Q4'],
    'THINKBOOK-14S': ['SN-TBK14S-2024-001', 'SN-TBK14S-2024-002', 'SN-TBK14S-2024-003', 'SN-TBK14S-2023-Q1', 'SN-TBK14S-2023-Q2', 'SN-TBK14S-2023-Q3', 'SN-TBK14S-2023-Q4']
  };
  
  // 模拟工厂数据
  const mockFactories = [
    { id: 'WH', name: '武汉工厂' },
    { id: 'SZ', name: '深圳工厂' },
    { id: 'CD', name: '成都工厂' },
    { id: 'HJ', name: '合肥工厂' }
  ];
  
  // 模拟平台数据
  const mockPlatforms = [
    { id: 'ThinkPad', name: 'ThinkPad' },
    { id: 'ThinkBook', name: 'ThinkBook' },
    { id: 'Yoga', name: 'Yoga' },
    { id: 'IdeaPad', name: 'IdeaPad' }
  ];
  
  // 模拟Family数据
  const mockFamilies = [
    { id: 'T Series', name: 'T Series', platform: 'ThinkPad' },
    { id: 'X1 Series', name: 'X1 Series', platform: 'ThinkPad' },
    { id: 'ThinkBook Series', name: 'ThinkBook Series', platform: 'ThinkBook' },
    { id: 'Yoga Series', name: 'Yoga Series', platform: 'Yoga' },
    { id: 'IdeaPad Series', name: 'IdeaPad Series', platform: 'IdeaPad' }
  ];
  
  // 模拟GEN数据
  const mockGens = [
    { id: 'Gen 1', name: 'Gen 1' },
    { id: 'Gen 2', name: 'Gen 2' },
    { id: 'Gen 3', name: 'Gen 3' },
    { id: 'Gen 4', name: 'Gen 4' },
    { id: 'Gen 5', name: 'Gen 5' }
  ];

  // 初始化表单数据
  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
      
      // 如果有产品型号，加载相关数据
      if (data.productModel) {
        handleProductModelChange(data.productModel);
      }
    } else {
      // 设置默认值
      form.setFieldsValue({
        bomVersion: 'v1.0',
        factory: 'WH' // 默认用户主工厂
      });
      
      // 生成默认BOM名称
      generateDefaultBomName();
    }
  }, [data, form]);

  // 加载产品型号数据
  useEffect(() => {
    // 模拟从MDM产品库加载产品型号
    setProductModels(mockProductModels);
  }, []);

  // 生成默认BOM名称
  const generateDefaultBomName = () => {
    const currentDate = new Date();
    const yearMonth = `${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const defaultName = `ThinkPad-基础BOM-${yearMonth}`;
    form.setFieldsValue({ bomName: defaultName });
  };

  // 处理产品型号变化
  const handleProductModelChange = (value) => {
    const selectedModel = productModels.find(model => model.id === value);
    if (selectedModel) {
      // 加载产品序列号
      setProductSerials(mockProductSerials[value] || []);
      
      // 设置产品图片和属性
      setProductImage(selectedModel.image);
      setProductAttributes({
        platform: selectedModel.platform,
        family: selectedModel.family,
        gen: selectedModel.gen
      });
      
      // 生成基于产品型号的BOM名称
      const currentDate = new Date();
      const yearMonth = `${currentDate.getFullYear()}${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
      const suggestedName = `${selectedModel.name.replace(/\s+/g, '-')}-基础BOM-${yearMonth}`;
      form.setFieldsValue({ bomName: suggestedName });
      
      // 检查是否已有BOM版本，自动生成新版本
      checkExistingBomVersions(value);
      
      // 记录日志
      addLog && addLog(`选择了产品型号: ${selectedModel.name}`);
    }
  };

  // 检查已有的BOM版本
  const checkExistingBomVersions = (productModel) => {
    // 模拟检查已有BOM版本
    const existingVersions = ['v1.0', 'v1.1', 'v1.2'];
    setBomVersions(existingVersions);
    
    // 如果已有版本，自动生成新版本
    if (existingVersions.length > 0) {
      const lastVersion = existingVersions[existingVersions.length - 1];
      const versionParts = lastVersion.split('.');
      const majorVersion = versionParts[0];
      const minorVersion = parseInt(versionParts[1]) + 1;
      const newVersion = `${majorVersion}.${minorVersion}`;
      form.setFieldsValue({ bomVersion: newVersion });
    } else {
      form.setFieldsValue({ bomVersion: 'v1.0' });
    }
  };

  // 处理表单值变化
  const handleValuesChange = (changedValues, allValues) => {
    if (onChange) {
      onChange(allValues);
    }
  };

  // 处理下一步
  const handleNext = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // 记录日志
      addLog && addLog(`完成基础信息填写: ${values.bomName}`);
      
      // 通知父组件
      onStepChange && onStepChange(currentStep + 1, values);
    } catch (error) {
      console.error('表单验证失败:', error);
      message.error('请检查表单填写是否正确');
    } finally {
      setLoading(false);
    }
  };

  // 处理上一步
  const handlePrev = () => {
    onStepChange && onStepChange(currentStep - 1);
  };

  // 搜索产品型号
  const handleSearch = (value) => {
    // 模拟搜索产品型号
    if (value) {
      const filtered = productModels.filter(model => 
        model.name.toLowerCase().includes(value.toLowerCase()) ||
        model.id.toLowerCase().includes(value.toLowerCase())
      );
      setProductModels(filtered.length > 0 ? filtered : mockProductModels);
    } else {
      setProductModels(mockProductModels);
    }
  };

  return (
    <div className="basic-info-step">
      <Row gutter={[24, 24]}>
        <Col span={16}>
          <Card title="基础信息" variant="borderless">
            <Form
              form={form}
              layout="vertical"
              onValuesChange={handleValuesChange}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="productModel"
                    label="产品型号"
                    rules={[{ required: true, message: '请选择产品型号' }]}
                  >
                    <Select
                      placeholder="请选择产品型号"
                      showSearch
                      filterOption={false}
                      onSearch={handleSearch}
                      onChange={handleProductModelChange}
                      suffixIcon={<SearchOutlined />}
                    >
                      {productModels.map(model => (
                        <Option key={model.id} value={model.id}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              size="small" 
                              src={model.image} 
                              icon={<PictureOutlined />}
                              style={{ marginRight: 8 }}
                            />
                            {model.name}
                          </div>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="productSerial"
                    label="产品序列号"
                    rules={[{ required: true, message: '请选择产品序列号' }]}
                  >
                    <Select placeholder="请选择产品序列号">
                      {productSerials.map(serial => (
                        <Option key={serial} value={serial}>{serial}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="bomName"
                    label="BOM名称"
                    rules={[
                      { required: true, message: '请输入BOM名称' },
                      { max: 120, message: 'BOM名称不能超过120个字符' }
                    ]}
                  >
                    <Input 
                      placeholder="请输入BOM名称" 
                      suffix={
                        <Tooltip title="AI推荐规则：&lt;型号&gt;-&lt;用途&gt;-&lt;年月&gt;">
                          <InfoCircleOutlined style={{ color: '#1890ff' }} />
                        </Tooltip>
                      }
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="bomVersion"
                    label="BOM版本"
                    rules={[{ required: true, message: '请选择BOM版本' }]}
                  >
                    <Select placeholder="请选择BOM版本">
                      <Option value="v1.0">v1.0</Option>
                      <Option value="v1.1">v1.1</Option>
                      <Option value="v1.2">v1.2</Option>
                      <Option value="v2.0">v2.0</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item
                    name="platform"
                    label="平台"
                    rules={[{ required: true, message: '请选择平台' }]}
                  >
                    <Select placeholder="请选择平台">
                      {mockPlatforms.map(platform => (
                        <Option key={platform.id} value={platform.id}>{platform.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="family"
                    label="Family"
                    rules={[{ required: true, message: '请选择Family' }]}
                  >
                    <Select placeholder="请选择Family">
                      {mockFamilies
                        .filter(family => !form.getFieldValue('platform') || family.platform === form.getFieldValue('platform'))
                        .map(family => (
                          <Option key={family.id} value={family.id}>{family.name}</Option>
                        ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="gen"
                    label="GEN"
                    rules={[{ required: true, message: '请选择GEN' }]}
                  >
                    <Select placeholder="请选择GEN">
                      {mockGens.map(gen => (
                        <Option key={gen.id} value={gen.id}>{gen.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="factory"
                    label="工厂"
                    rules={[{ required: true, message: '请选择工厂' }]}
                  >
                    <Select placeholder="请选择工厂">
                      {mockFactories.map(factory => (
                        <Option key={factory.id} value={factory.id}>{factory.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="remarks"
                label="备注"
                rules={[{ max: 500, message: '备注不能超过500个字符' }]}
              >
                <TextArea rows={4} placeholder="请输入备注信息" />
              </Form.Item>
            </Form>
          </Card>
        </Col>
        
        <Col span={8}>
          <Card title="产品预览" variant="borderless">
            {productImage ? (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Avatar 
                  size={240} 
                  src={productImage} 
                  icon={<PictureOutlined />}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <Avatar 
                  size={240} 
                  icon={<PictureOutlined />}
                  style={{ backgroundColor: '#f0f0f0', color: '#ccc' }}
                />
              </div>
            )}
            
            {productAttributes.platform && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>基础属性</Title>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>平台：</Text>
                  <Text>{productAttributes.platform}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Family：</Text>
                  <Text>{productAttributes.family}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>GEN：</Text>
                  <Text>{productAttributes.gen}</Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>产品序列号：</Text>
                  <Text>{form.getFieldValue('productSerial') || '-'}</Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BasicInfoStep;