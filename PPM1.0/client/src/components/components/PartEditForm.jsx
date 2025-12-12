import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Row, Col, message, Space, Button } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

// 模拟供应商数据
const mockSuppliers = [
  { id: 'SUP001', name: '供应商A' },
  { id: 'SUP002', name: '供应商B' },
  { id: 'SUP003', name: '供应商C' },
  { id: 'SUP004', name: '供应商D' },
  { id: 'SUP005', name: '供应商E' }
];

// 生命周期选项
const lifecycleOptions = [
  { value: 'Active', label: '在产' },
  { value: 'PhaseOut', label: '即将停产' },
  { value: 'Obsolete', label: '已停产' },
  { value: 'New', label: '新品' }
];

const PartEditForm = ({ 
  visible, 
  onClose, 
  onSave, 
  editingNode = null,
  bomLevel = 6 // 默认为L6层级
}) => {
  const [form] = Form.useForm();
  
  // 当编辑节点变化时，更新表单数据
  useEffect(() => {
    if (editingNode) {
      form.setFieldsValue({
        partId: editingNode.partId || '',
        partName: editingNode.title || '',
        description: editingNode.description || '',
        quantity: editingNode.quantity || 1,
        unit: editingNode.unit || '个',
        cost: editingNode.cost || 0,
        supplier: editingNode.supplier || '',
        lifecycle: editingNode.lifecycle || 'Active',
        specifications: editingNode.specifications || {}
      });
    } else {
      form.resetFields();
      // 设置默认值
      form.setFieldsValue({
        quantity: 1,
        unit: '个',
        lifecycle: 'Active'
      });
    }
  }, [editingNode, form]);

  // 保存处理
  const handleSave = () => {
    form.validateFields().then(values => {
      // 构建更新的节点数据
      const updatedNode = {
        ...editingNode,
        partId: values.partId,
        title: values.partName,
        description: values.description,
        quantity: values.quantity,
        unit: values.unit,
        cost: values.cost,
        supplier: values.supplier,
        lifecycle: values.lifecycle,
        specifications: values.specifications || {},
        isPart: true,
        level: bomLevel
      };
      
      if (onSave) {
        onSave(updatedNode);
        message.success('零件信息已保存');
      }
    }).catch(error => {
      console.error('表单验证失败:', error);
    });
  };

  // 取消处理
  const handleCancel = () => {
    form.resetFields();
    if (onClose) {
      onClose();
    }
  };

  // 表单布局配置
  const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  };

  return (
    <Modal
      title={editingNode ? '编辑零件' : '添加零件'}
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" icon={<CloseOutlined />} onClick={handleCancel}>
          取消
        </Button>,
        <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          保存
        </Button>
      ]}
      width={800}
      destroyOnHidden
    >
      <Form
        form={form}
        {...formItemLayout}
        initialValues={{
          quantity: 1,
          unit: '个',
          lifecycle: 'Active'
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="partId"
              label="零件编号"
              rules={[{ required: true, message: '请输入零件编号' }]}
            >
              <Input placeholder="请输入零件编号" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="partName"
              label="零件名称"
              rules={[{ required: true, message: '请输入零件名称' }]}
            >
              <Input placeholder="请输入零件名称" />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="description"
          label="描述"
        >
          <TextArea rows={2} placeholder="请输入零件描述" />
        </Form.Item>
        
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="quantity"
              label="用量"
              rules={[{ required: true, message: '请输入用量' }]}
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                placeholder="请输入用量"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="unit"
              label="单位"
              rules={[{ required: true, message: '请选择单位' }]}
            >
              <Select placeholder="请选择单位">
                <Option value="个">个</Option>
                <Option value="套">套</Option>
                <Option value="米">米</Option>
                <Option value="千克">千克</Option>
                <Option value="升">升</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="cost"
              label="成本"
              rules={[{ required: true, message: '请输入成本' }]}
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: '100%' }}
                placeholder="请输入成本"
                formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/¥\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="supplier"
              label="供应商"
              rules={[{ required: true, message: '请选择供应商' }]}
            >
              <Select placeholder="请选择供应商">
                {mockSuppliers.map(supplier => (
                  <Option key={supplier.id} value={supplier.name}>
                    {supplier.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lifecycle"
              label="生命周期"
              rules={[{ required: true, message: '请选择生命周期' }]}
            >
              <Select placeholder="请选择生命周期">
                {lifecycleOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default PartEditForm;