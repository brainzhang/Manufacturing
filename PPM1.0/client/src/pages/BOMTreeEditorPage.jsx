import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Card, 
  Row, 
  Col, 
  Button, 
  Space, 
  message, 
  Spin, 
  Breadcrumb,
  Typography,
  Divider,
  Modal,
  Form,
  Input,
  Select,
  Alert
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import BOMTreeEditor from '../components/BOMTreeEditor';
import { 
  createBOM, 
  updateBOM, 
  fetchBOMById as getBOMById 
} from '../services/bomService';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const BOMTreeEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bomData, setBomData] = useState(null);
  const [bomInfo, setBomInfo] = useState({
    name: '',
    productModel: '',
    version: '1.0',
    description: ''
  });
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [form] = Form.useForm();

  // 加载BOM数据
  const loadBOMData = async () => {
    if (!id) {
      // 如果没有id，使用默认模板
      const defaultTemplate = {
        id: 'node-0',
        key: 'node-0',
        title: '整机',
        level: 1,
        nodeType: '父节点',
        position: '1',
        children: []
      };
      setBomData(defaultTemplate);
      return;
    }
    
    setLoading(true);
    try {
      const response = await getBOMById(id);
      setBomData(response.structure || {});
      setBomInfo({
        name: response.name || '',
        productModel: response.productModel || '',
        version: response.version || '1.0',
        description: response.description || ''
      });
      form.setFieldsValue({
        name: response.name || '',
        productModel: response.productModel || '',
        version: response.version || '1.0',
        description: response.description || ''
      });
    } catch (error) {
      console.error('加载BOM数据错误:', error);
      message.error('加载BOM数据时发生错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBOMData();
  }, [id]);

  // 保存BOM数据
  const handleSaveBOM = async (treeData) => {
    setLoading(true);
    try {
      const bomToSave = {
        ...bomInfo,
        structure: treeData,
        status: 'DRAFT'
      };

      let response;
      if (id) {
        // 更新现有BOM
        response = await updateBOM(id, bomToSave);
      } else {
        // 创建新BOM
        response = await createBOM(bomToSave);
      }

      message.success('BOM保存成功');
      if (!id) {
        // 如果是新建BOM，跳转到编辑页面
        navigate(`/bom/editor/${response.id}`);
      }
    } catch (error) {
      console.error('保存BOM错误:', error);
      message.error(error.message || '保存BOM时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 处理BOM信息更新
  const handleBOMInfoChange = (changedFields, allFields) => {
    setBomInfo({
      ...bomInfo,
      ...changedFields
    });
  };

  // 预览BOM数据
  const handlePreview = (treeData) => {
    setPreviewData(treeData);
    setPreviewModalVisible(true);
  };

  // 递归渲染BOM结构预览
  const renderBOMPreview = (node, level = 0) => {
    const indent = '  '.repeat(level);
    const isEditable = node.level >= 6;
    
    return (
      <div key={node.id} style={{ marginBottom: 8 }}>
        <div>
          <Text strong>{indent}{node.title}</Text>
          {node.position && <Text code style={{ marginLeft: 8 }}>{node.position}</Text>}
          {isEditable && (
            <span style={{ marginLeft: 16 }}>
              <Text>零件: {node.partName || '-'}</Text>
              <Text style={{ marginLeft: 8 }}>用量: {node.quantity || 0}</Text>
              <Text style={{ marginLeft: 8 }}>单位: {node.unit || '-'}</Text>
              <Text style={{ marginLeft: 8 }}>成本: ¥{(node.cost || 0).toFixed(2)}</Text>
              <Text style={{ marginLeft: 8 }}>供应商: {node.supplier || '-'}</Text>
            </span>
          )}
        </div>
        {node.children && node.children.map(child => renderBOMPreview(child, level + 1))}
      </div>
    );
  };

  // 返回BOM列表
  const handleBackToList = () => {
    navigate('/boms');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={handleBackToList}
              >
                返回BOM列表
              </Button>
              <Divider type="vertical" />
              <Title level={4} style={{ margin: 0 }}>
                {id ? '编辑BOM' : '创建BOM'}
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<EyeOutlined />} 
                onClick={() => handlePreview(bomData)}
              >
                预览
              </Button>
            </Space>
          </Col>
        </Row>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="BOM基本信息">
                <Form
                  form={form}
                  layout="vertical"
                  onValuesChange={handleBOMInfoChange}
                  initialValues={bomInfo}
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        label="BOM名称"
                        name="name"
                        rules={[{ required: true, message: '请输入BOM名称' }]}
                      >
                        <Input placeholder="请输入BOM名称" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="产品型号"
                        name="productModel"
                        rules={[{ required: true, message: '请输入产品型号' }]}
                      >
                        <Input placeholder="请输入产品型号" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="版本"
                        name="version"
                        rules={[{ required: true, message: '请输入版本' }]}
                      >
                        <Input placeholder="请输入版本" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item
                        label="描述"
                        name="description"
                      >
                        <Input.TextArea rows={3} placeholder="请输入BOM描述" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </Col>
            
            <Col span={24}>
              <Alert
                message="BOM树形结构编辑"
                description={
                  <div>
                    <p>• 7层BOM结构：整机(L1) → 模块(L2) → 子模块(L3) → 零件族(L4) → 零件组(L5) → 主料(L6) → 替代料(L7)</p>
                    <p>• L6和L7节点支持编辑详细物料信息（零件名称、用量、单位、成本、供应商、差异、生命周期状态）</p>
                    <p>• 位号会根据层级自动生成</p>
                  </div>
                }
                type="info"
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: 16 }}
              />
            </Col>
            
            <Col span={24}>
              <BOMTreeEditor 
                initialData={bomData} 
                onSave={handleSaveBOM}
              />
            </Col>
          </Row>
        </Spin>
      </Content>

      <Modal
        title="BOM结构预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {previewData && (
          <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
            {renderBOMPreview(previewData)}
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default BOMTreeEditorPage;