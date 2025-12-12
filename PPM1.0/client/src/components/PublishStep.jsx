import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Space, 
  Progress, 
  Steps, 
  Alert, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Spin, 
  Descriptions,
  Tag,
  Divider,
  Timeline,
  Result,
  Statistic,
  List,
  Avatar,
  Upload,
  Badge,
  Tooltip
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloudUploadOutlined, 
  DownloadOutlined, 
  SyncOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  RocketOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  ApiOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import styles from './PublishStep.module.css';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const PublishStep = ({ 
  bomData, 
  costSummary, 
  complianceResults, 
  onPublish, 
  onGoBack,
  onSaveDraft,
  onExportBOM,
  onGenerateReport
}) => {
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStep, setPublishStep] = useState(0);
  const [publishResult, setPublishResult] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm] = Form.useForm();
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportForm] = Form.useForm();

  // 发布步骤
  const PUBLISH_STEPS = [
    {
      title: '生成BOM ID',
      description: '为BOM分配唯一标识符',
      icon: <DatabaseOutlined />
    },
    {
      title: '数据验证',
      description: '验证BOM数据完整性',
      icon: <CheckCircleOutlined />
    },
    {
      title: '保存到本地',
      description: '将BOM数据保存到本地数据库',
      icon: <FileTextOutlined />
    },
    {
      title: '同步到SAP',
      description: '推送BOM数据到SAP系统',
      icon: <ApiOutlined />
    },
    {
      title: '完成发布',
      description: 'BOM发布成功',
      icon: <CheckOutlined />
    }
  ];

  // 初始化
  useEffect(() => {
    // 检查是否已经发布过
    if (bomData && bomData.status === 'active' && bomData.bom_id) {
      setPublishResult({
        success: true,
        bomId: bomData.bom_id,
        publishTime: bomData.publish_time || new Date().toLocaleString(),
        sapStatus: bomData.sap_status || 'success'
      });
      setPublishStep(PUBLISH_STEPS.length - 1);
    }
  }, [bomData]);

  // 处理发布
  const handlePublish = async (values) => {
    try {
      setPublishing(true);
      setShowPublishModal(false);
      
      // 执行发布步骤
      for (let i = 0; i < PUBLISH_STEPS.length; i++) {
        setPublishStep(i);
        
        // 模拟每个步骤的处理时间
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 模拟可能的错误
        if (i === 3 && Math.random() < 0.1) { // 10%概率在SAP同步时出错
          throw new Error('SAP系统连接超时，请稍后重试');
        }
      }
      
      // 发布成功
      const bomId = generateBOMId();
      const publishTime = new Date().toLocaleString();
      
      setPublishResult({
        success: true,
        bomId,
        publishTime,
        sapStatus: 'success'
      });
      
      message.success('BOM发布成功！');
      
      // 调用父组件的发布回调
      if (onPublish) {
        onPublish({
          ...bomData,
          bom_id: bomId,
          status: 'active',
          publish_time: publishTime,
          sap_status: 'success'
        });
      }
    } catch (error) {
      message.error('发布失败: ' + error.message);
      
      setPublishResult({
        success: false,
        error: error.message,
        failedStep: publishStep
      });
    } finally {
      setPublishing(false);
    }
  };

  // 生成BOM ID
  const generateBOMId = () => {
    const prefix = 'BOM';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  };

  // 处理导出
  const handleExport = (values) => {
    setExportModalVisible(false);
    
    if (onExportBOM) {
      onExportBOM(values);
    }
    
    message.success(`正在导出${values.format}格式的BOM数据`);
  };

  // 处理生成报告
  const handleGenerateReport = () => {
    if (onGenerateReport) {
      onGenerateReport();
    }
    
    message.success('正在生成BOM报告');
  };

  // 重置发布状态
  const resetPublishStatus = () => {
    setPublishStep(0);
    setPublishResult(null);
  };

  // 渲染发布结果
  const renderPublishResult = () => {
    if (!publishResult) return null;
    
    if (publishResult.success) {
      return (
        <Result
          status="success"
          title="BOM发布成功！"
          subTitle={`BOM ID: ${publishResult.bomId} 已成功同步到SAP系统`}
          extra={[
            <Button key="view" type="primary" icon={<FileTextOutlined />}>
              查看BOM详情
            </Button>,
            <Button key="export" icon={<DownloadOutlined />} onClick={() => setExportModalVisible(true)}>
              导出BOM
            </Button>,
            <Button key="report" icon={<FileTextOutlined />} onClick={handleGenerateReport}>
              生成报告
            </Button>
          ]}
        />
      );
    } else {
      return (
        <Result
          status="error"
          title="BOM发布失败"
          subTitle={publishResult.error}
          extra={[
            <Button key="retry" type="primary" onClick={resetPublishStatus}>
              重新发布
            </Button>,
            <Button key="save" icon={<FileTextOutlined />} onClick={onSaveDraft}>
              保存草稿
            </Button>
          ]}
        />
      );
    }
  };

  // 渲染发布进度
  const renderPublishProgress = () => {
    return (
      <div className={styles.publishProgress}>
        <Steps current={publishStep} direction="vertical" size="small">
          {PUBLISH_STEPS.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={publishing && index === publishStep ? <LoadingOutlined /> : step.icon}
              status={
                index < publishStep ? 'finish' : 
                index === publishStep ? (publishing ? 'process' : 'wait') : 'wait'
              }
            />
          ))}
        </Steps>
        
        {publishing && (
          <div className={styles.publishProgressInfo}>
            <Spin spinning={publishing} tip="正在发布BOM...">
              <div style={{ height: 100 }} />
            </Spin>
          </div>
        )}
      </div>
    );
  };

  // 渲染BOM信息
  const renderBOMInfo = () => {
    return (
      <Card title="BOM信息" className={styles.infoCard}>
        <Descriptions column={2}>
          <Descriptions.Item label="BOM ID">
            {bomData.bom_id || <Tag color="blue">将自动生成</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="BOM名称">
            {bomData.bom_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="产品型号">
            {bomData.product_model || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="版本">
            {bomData.version || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="工厂">
            {bomData.factory || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={bomData.status === 'active' ? 'green' : 'blue'}>
              {bomData.status === 'active' ? '已发布' : '草稿'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
        
        <Divider />
        
        <Row gutter={16}>
          <Col span={24}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className={styles.statisticItem}>
                <Statistic title="零件总数" value={costSummary.partCount || 0} />
              </div>
              <div className={styles.statisticItem}>
                <Statistic 
                  title="总成本" 
                  value={costSummary.totalCost || 0} 
                  prefix="¥"
                  precision={2}
                />
              </div>
              <div className={styles.statisticItem}>
                <Statistic 
                  title="成本使用率" 
                  value={costSummary.totalCost && costSummary.targetCost ? 
                    (costSummary.totalCost / costSummary.targetCost * 100).toFixed(1) : 0} 
                  suffix="%"
                />
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染合规状态
  const renderComplianceStatus = () => {
    const complianceItems = [
      { key: 'rohs', name: 'RoHS', ...complianceResults.rohs },
      { key: 'ce', name: 'CE', ...complianceResults.ce },
      { key: 'fcc', name: 'FCC', ...complianceResults.fcc },
      { key: 'energyStar', name: '能源之星', ...complianceResults.energyStar }
    ];
    
    return (
      <Card title="合规状态" className={styles.infoCard}>
        <List
          dataSource={complianceItems}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={item.passed ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                    style={{ 
                      backgroundColor: item.passed ? '#52c41a' : '#faad14' 
                    }}
                  />
                }
                title={
                  <span>
                    {item.name}
                    <Tag 
                      color={item.passed ? 'green' : 'orange'} 
                      style={{ marginLeft: 8 }}
                    >
                      {item.passed ? '通过' : '未通过'}
                    </Tag>
                  </span>
                }
                description={`${item.percentage}% ${item.message}`}
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  // 渲染操作历史
  const renderOperationHistory = () => {
    // 模拟操作历史数据
    const operations = [
      { time: '2023-06-01 10:30:00', action: '创建BOM', status: 'success', user: '张三' },
      { time: '2023-06-01 10:35:00', action: '添加零件', status: 'success', user: '张三' },
      { time: '2023-06-01 10:40:00', action: '成本计算', status: 'success', user: '张三' },
      { time: '2023-06-01 10:45:00', action: '合规检查', status: 'warning', user: '张三' },
      { time: '2023-06-01 10:50:00', action: '保存草稿', status: 'success', user: '张三' }
    ];
    
    return (
      <Card title="操作历史" className={styles.infoCard}>
        <Timeline>
          {operations.map((op, index) => (
            <Timeline.Item 
              key={index}
              color={op.status === 'success' ? 'green' : op.status === 'warning' ? 'orange' : 'red'}
              dot={op.status === 'success' ? <CheckCircleOutlined /> : op.status === 'warning' ? <WarningOutlined /> : <CloseCircleOutlined />}
            >
              <div className={styles.operationItem}>
                <div className={styles.operationTime}>{op.time}</div>
                <div className={styles.operationAction}>{op.action}</div>
                <div className={styles.operationUser}>操作人: {op.user}</div>
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    );
  };

  // 如果已经发布，显示发布结果
  if (publishResult) {
    return (
      <div className={styles.publishStep}>
        {renderPublishResult()}
        
        <div className={styles.actionButtons}>
          <Space>
            <Button onClick={onSaveDraft}>
              保存草稿
            </Button>
            <Button onClick={() => setExportModalVisible(true)}>
              导出BOM
            </Button>
            <Button onClick={handleGenerateReport}>
              生成报告
            </Button>
          </Space>
        </div>
        
        {/* 导出模态框 */}
        <Modal
          title="导出BOM"
          open={exportModalVisible}
          onCancel={() => setExportModalVisible(false)}
          onOk={() => exportForm.submit()}
          okText="导出"
          cancelText="取消"
        >
          <Form form={exportForm} onFinish={handleExport} layout="vertical">
            <Form.Item 
              name="format" 
              label="导出格式" 
              rules={[{ required: true, message: '请选择导出格式' }]}
              initialValue="excel"
            >
              <Select placeholder="请选择导出格式">
                <Option value="excel">Excel</Option>
                <Option value="pdf">PDF</Option>
                <Option value="csv">CSV</Option>
                <Option value="json">JSON</Option>
              </Select>
            </Form.Item>
            <Form.Item 
              name="includeDetails" 
              label="包含内容" 
              initialValue="all"
            >
              <Select placeholder="请选择包含内容">
                <Option value="all">所有信息</Option>
                <Option value="structure">仅BOM结构</Option>
                <Option value="cost">仅成本信息</Option>
                <Option value="compliance">仅合规信息</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  // 正在发布或准备发布
  return (
    <div className={styles.publishStep}>
      <Row gutter={16}>
        <Col span={publishing ? 24 : 12}>
          {publishing ? (
            renderPublishProgress()
          ) : (
            renderBOMInfo()
          )}
        </Col>
        {!publishing && (
          <Col span={12}>
            {renderComplianceStatus()}
          </Col>
        )}
      </Row>
      
      {!publishing && (
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={24}>
            {renderOperationHistory()}
          </Col>
        </Row>
      )}
      
      <div className={styles.actionButtons}>
        <Space>
          <Button onClick={onSaveDraft}>
            保存草稿
          </Button>
          <Button onClick={() => setExportModalVisible(true)}>
            导出BOM
          </Button>
          <Button onClick={handleGenerateReport}>
            生成报告
          </Button>
        </Space>
        <Space>
          <Button 
            type="primary" 
            size="large"
            icon={<RocketOutlined />}
            loading={publishing}
            onClick={() => setShowPublishModal(true)}
          >
            发布到SAP
          </Button>
        </Space>
      </div>
      
      {/* 发布确认模态框 */}
      <Modal
        title="确认发布BOM"
        open={showPublishModal}
        onCancel={() => setShowPublishModal(false)}
        onOk={() => publishForm.submit()}
        okText="确认发布"
        cancelText="取消"
        width={600}
      >
        <Alert
          message="发布说明"
          description={
            <div>
              <p>1. 发布后BOM将同步到SAP系统</p>
              <p>2. BOM状态将变更为"已发布"</p>
              <p>3. 发布后BOM将不可随意修改</p>
              <p>4. 请确保所有信息已正确填写</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form form={publishForm} onFinish={handlePublish} layout="vertical">
          <Form.Item 
            name="confirm" 
            label="请输入'确认发布'以继续" 
            rules={[
              { required: true, message: '请输入确认文本' },
              { validator: (_, value) => {
                if (value === '确认发布') {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('请输入正确的确认文本'));
              }}
            ]}
          >
            <Input placeholder="请输入'确认发布'" />
          </Form.Item>
          <Form.Item 
            name="notes" 
            label="发布备注"
          >
            <TextArea rows={3} placeholder="请输入发布备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 导出模态框 */}
      <Modal
        title="导出BOM"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        onOk={() => exportForm.submit()}
        okText="导出"
        cancelText="取消"
      >
        <Form form={exportForm} onFinish={handleExport} layout="vertical">
          <Form.Item 
            name="format" 
            label="导出格式" 
            rules={[{ required: true, message: '请选择导出格式' }]}
            initialValue="excel"
          >
            <Select placeholder="请选择导出格式">
              <Option value="excel">Excel</Option>
              <Option value="pdf">PDF</Option>
              <Option value="csv">CSV</Option>
              <Option value="json">JSON</Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="includeDetails" 
            label="包含内容" 
            initialValue="all"
          >
            <Select placeholder="请选择包含内容">
              <Option value="all">所有信息</Option>
              <Option value="structure">仅BOM结构</Option>
              <Option value="cost">仅成本信息</Option>
              <Option value="compliance">仅合规信息</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PublishStep;