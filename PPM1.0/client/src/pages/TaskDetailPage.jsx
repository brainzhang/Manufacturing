import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, List, Button, Tag, Divider, Empty, Spin, message, Modal, Table, Form, Select, Input, Space } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

// 模拟任务明细数据结构
const mockTaskDetails = {
  1: {
    id: 1,
    title: "BOM审批：ThinkPad X1 Carbon 2024",
    type: "审批",
    priority: "high",
    status: "pending",
    createdAt: "2024-01-15T09:30:00Z",
    deadline: "2024-01-18T17:00:00Z",
    assignee: "张三",
    creator: "李四",
    description: "新的ThinkPad X1 Carbon 2024型号的BOM需要审批，包含最新的处理器和内存配置。",
    relatedProduct: {
      id: "P12345",
      name: "ThinkPad X1 Carbon 2024",
      model: "X1C-2024"
    },
    relatedBOM: {
      id: "BOM-2024-001",
      version: "1.0",
      itemsCount: 156
    },
    details: [
      {
        id: "detail-1",
        category: "零件变更",
        description: "处理器从i7-1365U升级到i7-1465U",
        status: "pending",
        actionRequired: "审批"
      },
      {
        id: "detail-2",
        category: "零件变更",
        description: "内存从16GB升级到32GB标配",
        status: "pending",
        actionRequired: "审批"
      },
      {
        id: "detail-3",
        category: "新增零件",
        description: "新增指纹识别模块",
        status: "pending",
        actionRequired: "审批"
      }
    ]
  },
  2: {
    id: 2,
    title: "物料编码差异确认：内存模块",
    type: "差异确认",
    priority: "medium",
    status: "pending",
    createdAt: "2024-01-15T10:15:00Z",
    deadline: "2024-01-19T17:00:00Z",
    assignee: "张三",
    creator: "王五",
    description: "SAP系统与本地系统中内存模块的编码存在差异，需要确认正确的编码。",
    relatedProduct: null,
    relatedBOM: null,
    details: [
      {
        id: "detail-4",
        category: "编码差异",
        description: "内存模块：SAP编码 M12345 vs 本地编码 MEM-16GB-DDR4",
        status: "pending",
        actionRequired: "确认正确编码",
        sapValue: "M12345",
        localValue: "MEM-16GB-DDR4",
        partInfo: {
          partId: "MEM-001",
          description: "16GB DDR4 3200MHz内存模块",
          cost: 89.99
        }
      },
      {
        id: "detail-5",
        category: "编码差异",
        description: "内存模块：SAP编码 M12346 vs 本地编码 MEM-32GB-DDR4",
        status: "pending",
        actionRequired: "确认正确编码",
        sapValue: "M12346",
        localValue: "MEM-32GB-DDR4",
        partInfo: {
          partId: "MEM-002",
          description: "32GB DDR4 3200MHz内存模块",
          cost: 179.99
        }
      }
    ]
  },
  3: {
    id: 3,
    title: "BOM审批：ThinkBook Plus Gen 5",
    type: "审批",
    priority: "medium",
    status: "pending",
    createdAt: "2024-01-15T11:20:00Z",
    deadline: "2024-01-20T17:00:00Z",
    assignee: "张三",
    creator: "赵六",
    description: "ThinkBook Plus Gen 5双屏笔记本的BOM需要审批。",
    relatedProduct: {
      id: "P12346",
      name: "ThinkBook Plus Gen 5",
      model: "TBP-G5"
    },
    relatedBOM: {
      id: "BOM-2024-002",
      version: "1.0",
      itemsCount: 189
    },
    details: [
      {
        id: "detail-6",
        category: "新增零件",
        description: "右侧副显示屏组件",
        status: "pending",
        actionRequired: "审批"
      },
      {
        id: "detail-7",
        category: "零件变更",
        description: "主显示屏分辨率升级到3.2K",
        status: "pending",
        actionRequired: "审批"
      }
    ]
  }
};

// 任务明细页面组件
const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [form] = Form.useForm();

  // 加载任务明细数据
  useEffect(() => {
    const fetchTaskDetail = async () => {
      try {
        setLoading(true);
        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 使用模拟数据
        const taskData = mockTaskDetails[id];
        if (taskData) {
          setTask(taskData);
        } else {
          message.error('未找到任务信息');
          navigate('/');
        }
      } catch (error) {
        message.error('加载任务详情失败');
        console.error('Error fetching task detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetail();
  }, [id, navigate]);

  // 处理审批操作
  const handleApprove = async (detailId) => {
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 更新本地状态
      setTask(prevTask => ({
        ...prevTask,
        details: prevTask.details.map(detail => 
          detail.id === detailId 
            ? { ...detail, status: 'approved' }
            : detail
        )
      }));
      
      message.success('操作已批准');
      
      // 检查是否所有明细都已处理
      checkAllDetailsProcessed();
    } catch (error) {
      message.error('操作失败');
      console.error('Error approving:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理拒绝操作
  const handleReject = async (detailId, reason) => {
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 更新本地状态
      setTask(prevTask => ({
        ...prevTask,
        details: prevTask.details.map(detail => 
          detail.id === detailId 
            ? { ...detail, status: 'rejected', rejectReason: reason }
            : detail
        )
      }));
      
      message.success('操作已拒绝');
      
      // 检查是否所有明细都已处理
      checkAllDetailsProcessed();
    } catch (error) {
      message.error('操作失败');
      console.error('Error rejecting:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理差异确认操作
  const handleConfirmDifference = async (detailId, confirmedValue) => {
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 更新本地状态
      setTask(prevTask => ({
        ...prevTask,
        details: prevTask.details.map(detail => 
          detail.id === detailId 
            ? { ...detail, status: 'confirmed', confirmedValue }
            : detail
        )
      }));
      
      message.success('差异已确认');
      
      // 检查是否所有明细都已处理
      checkAllDetailsProcessed();
    } catch (error) {
      message.error('操作失败');
      console.error('Error confirming difference:', error);
    } finally {
      setLoading(false);
    }
  };

  // 检查是否所有明细都已处理
  const checkAllDetailsProcessed = () => {
    const allProcessed = task.details.every(detail => 
      detail.status === 'approved' || detail.status === 'rejected' || detail.status === 'confirmed'
    );
    
    if (allProcessed) {
      // 更新任务状态为已完成
      setTask(prevTask => ({
        ...prevTask,
        status: 'completed'
      }));
      message.success('所有明细已处理，任务已完成');
    }
  };

  // 打开操作模态框
  const showActionModal = (detail) => {
    setSelectedDetail(detail);
    form.resetFields();
    setModalVisible(true);
  };

  // 关闭操作模态框
  const handleModalCancel = () => {
    setModalVisible(false);
    setSelectedDetail(null);
    form.resetFields();
  };

  // 提交操作表单
  const handleModalSubmit = async (values) => {
    if (!selectedDetail) return;
    
    if (task.type === '审批') {
      if (values.action === 'approve') {
        await handleApprove(selectedDetail.id);
      } else {
        await handleReject(selectedDetail.id, values.reason);
      }
    } else if (task.type === '差异确认') {
      await handleConfirmDifference(selectedDetail.id, values.confirmedValue);
    }
    
    setModalVisible(false);
    setSelectedDetail(null);
  };

  // 返回上一页
  const handleBack = () => {
    navigate('/');
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 根据优先级获取标签颜色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  // 根据状态获取标签颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'default';
      case 'completed': return 'green';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'confirmed': return 'green';
      default: return 'default';
    }
  };

  if (loading && !task) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large">
          <div className="py-4">加载任务详情...</div>
        </Spin>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Empty description="未找到任务信息" />
      </div>
    );
  }

  // 定义明细表格的列配置
  const columns = [
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      render: (text) => <Tag>{text}</Tag>
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status === 'pending' && '待处理'}
          {status === 'approved' && '已批准'}
          {status === 'rejected' && '已拒绝'}
          {status === 'confirmed' && '已确认'}
        </Tag>
      )
    },
    {
      title: '需要操作',
      dataIndex: 'actionRequired',
      key: 'actionRequired'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        record.status === 'pending' ? (
          <Button type="primary" size="small" onClick={() => showActionModal(record)}>
            处理
          </Button>
        ) : (
          <Tag color={getStatusColor(record.status)}>
            {record.status === 'approved' && '已批准'}
            {record.status === 'rejected' && '已拒绝'}
            {record.status === 'confirmed' && '已确认'}
          </Tag>
        )
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 返回按钮 */}
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBack}
        className="mb-4"
      >
        返回仪表板
      </Button>

      <div className="max-w-7xl mx-auto">
        {/* 任务标题卡片 */}
        <Card 
          title={
            <div className="flex items-center justify-between">
              <span>{task.title}</span>
              <Space>
                <Tag color={getPriorityColor(task.priority)}>
                  {task.priority === 'high' && '高优先级'}
                  {task.priority === 'medium' && '中优先级'}
                  {task.priority === 'low' && '低优先级'}
                </Tag>
                <Tag color={getStatusColor(task.status)}>
                  {task.status === 'pending' && '待处理'}
                  {task.status === 'completed' && '已完成'}
                </Tag>
              </Space>
            </div>
          }
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">任务类型</p>
              <p className="text-base font-medium">
                {task.type === '审批' ? (
                  <Tag color="blue">审批任务</Tag>
                ) : (
                  <Tag color="orange">差异确认</Tag>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">创建时间</p>
              <p className="text-base">{formatDate(task.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">截止时间</p>
              <p className="text-base">{formatDate(task.deadline)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">负责人</p>
              <p className="text-base">{task.assignee}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">创建人</p>
              <p className="text-base">{task.creator}</p>
            </div>
          </div>

          <Divider />

          <div>
            <p className="text-sm text-gray-500 mb-2">任务描述</p>
            <p className="text-base">{task.description}</p>
          </div>

          <Divider />

          {/* 相关产品信息 */}
          {task.relatedProduct && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">相关产品</p>
              <Card size="small">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{task.relatedProduct.name}</p>
                    <p className="text-sm text-gray-500">型号: {task.relatedProduct.model}</p>
                  </div>
                  <Tag color="blue">ID: {task.relatedProduct.id}</Tag>
                </div>
              </Card>
            </div>
          )}

          {/* 相关BOM信息 */}
          {task.relatedBOM && (
            <div>
              <p className="text-sm text-gray-500 mb-2">相关BOM</p>
              <Card size="small">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{task.relatedBOM.id}</p>
                    <p className="text-sm text-gray-500">版本: {task.relatedBOM.version}</p>
                  </div>
                  <Tag color="green">{task.relatedBOM.itemsCount} 个零件</Tag>
                </div>
              </Card>
            </div>
          )}
        </Card>

        {/* 任务明细列表 */}
        <Card 
          title={`任务明细 (${task.details.length})`}
          className="mb-6"
        >
          <Table 
            columns={columns} 
            dataSource={task.details} 
            rowKey="id" 
            pagination={false}
            locale={{ emptyText: '暂无明细数据' }}
          />
        </Card>
      </div>

      {/* 操作模态框 */}
      <Modal
        title={`处理 ${task.type === '审批' ? '审批' : '差异确认'} 项`}
        open={modalVisible}
        onOk={form.submit}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        destroyOnClose
      >
        {selectedDetail && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleModalSubmit}
          >
            <Form.Item label="描述">
              <div className="p-2 bg-gray-50 rounded">{selectedDetail.description}</div>
            </Form.Item>
            
            {task.type === '审批' ? (
              <>
                <Form.Item 
                  name="action" 
                  label="操作" 
                  rules={[{ required: true, message: '请选择操作' }]}
                >
                  <Select>
                    <Option value="approve">批准</Option>
                    <Option value="reject">拒绝</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item 
                  name="reason" 
                  label="拒绝原因" 
                  rules={[
                    {
                      required: ({ getFieldValue }) => getFieldValue('action') === 'reject',
                      message: '请输入拒绝原因'
                    }
                  ]}
                >
                  <TextArea rows={4} placeholder="请输入拒绝原因（如果拒绝）" />
                </Form.Item>
              </>
            ) : (
              <Form.Item 
                name="confirmedValue" 
                label="确认的值" 
                rules={[{ required: true, message: '请选择确认的值' }]}
              >
                <Select>
                  <Option value={selectedDetail.sapValue}>SAP值: {selectedDetail.sapValue}</Option>
                  <Option value={selectedDetail.localValue}>本地值: {selectedDetail.localValue}</Option>
                </Select>
              </Form.Item>
            )}
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default TaskDetailPage;