import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Steps, 
  Button, 
  Space, 
  Form, 
  Input, 
  Modal, 
  Alert, 
  Row, 
  Col, 
  Descriptions, 
  Tag, 
  Statistic, 
  Divider, 
  Timeline, 
  List, 
  Avatar,
  Spin,
  Result,
  Select,
  message,
  Progress,
  Upload,
  DatePicker,
  Radio,
  Checkbox,
  Table,
  Tooltip,
  Badge
} from 'antd';
import { 
  UploadOutlined,
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined,
  RocketOutlined,
  LoadingOutlined,
  CloudUploadOutlined,
  DatabaseOutlined,
  SyncOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  ExportOutlined,
  ImportOutlined,
  SettingOutlined,
  UserOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  BankOutlined
} from '@ant-design/icons';
import styles from './ReleaseToSAPStep.module.css';

const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

// SAP发布步骤定义
const SAP_RELEASE_STEPS = [
  {
    title: '数据验证',
    description: '验证BOM数据完整性',
    icon: <CheckCircleOutlined />
  },
  {
    title: 'SAP连接',
    description: '建立与SAP系统的连接',
    icon: <DatabaseOutlined />
  },
  {
    title: '数据映射',
    description: '将本地数据映射到SAP格式',
    icon: <SyncOutlined />
  },
  {
    title: '数据传输',
    description: '传输数据到SAP系统',
    icon: <CloudUploadOutlined />
  },
  {
    title: 'SAP确认',
    description: '接收SAP系统确认',
    icon: <SafetyCertificateOutlined />
  },
  {
    title: '完成发布',
    description: 'BOM已成功发布到SAP',
    icon: <CheckCircleOutlined />
  }
];

const ReleaseToSAPStep = ({ 
  bomData = {}, 
  costSummary = {}, 
  complianceResults = {}, 
  onSaveDraft, 
  onExport,
  onSAPRelease,
  currentUser,
  sapConfig
}) => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [releaseStep, setReleaseStep] = useState(0);
  const [releaseResult, setReleaseResult] = useState(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // connected, disconnected, testing
  const [sapSystemInfo, setSapSystemInfo] = useState(null);
  const [dataMapping, setDataMapping] = useState({});
  const [validationResults, setValidationResults] = useState({});
  const [transferProgress, setTransferProgress] = useState(0);
  const [releaseHistory, setReleaseHistory] = useState([]);
  
  // 表单实例
  const [releaseForm] = Form.useForm();
  const [configForm] = Form.useForm();
  const [mappingForm] = Form.useForm();
  const [exportForm] = Form.useForm();

  // 初始化组件
  useEffect(() => {
    // 检查SAP连接状态
    checkSAPConnection();
    
    // 加载历史发布记录
    loadReleaseHistory();
    
    // 初始化数据映射
    initializeDataMapping();
  }, []);

  // 检查SAP连接
  const checkSAPConnection = async () => {
    setConnectionStatus('testing');
    try {
      // 确保sapConfig有默认值
      const config = sapConfig || {};
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟成功连接
      setConnectionStatus('connected');
      setSapSystemInfo({
        systemId: config.systemId || 'SAP_PRD_01',
        client: config.client || '100',
        environment: config.environment || 'Production',
        version: config.version || 'S/4HANA 1909',
        lastSync: new Date().toLocaleString()
      });
      
      message.success('已成功连接到SAP系统');
    } catch (error) {
      setConnectionStatus('disconnected');
      message.error('连接SAP系统失败，请检查配置');
    }
  };

  // 加载发布历史
  const loadReleaseHistory = async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟历史数据
      const history = [
        { 
          id: 'REL-2023-001', 
          date: '2023-05-15 14:30:00', 
          bomId: 'BOM-2023-001', 
          status: 'success', 
          user: '张三',
          sapDocId: 'SAP-55000123'
        },
        { 
          id: 'REL-2023-002', 
          date: '2023-05-20 10:15:00', 
          bomId: 'BOM-2023-002', 
          status: 'failed', 
          user: '李四',
          error: '数据映射失败：缺少必填字段'
        },
        { 
          id: 'REL-2023-003', 
          date: '2023-05-25 16:45:00', 
          bomId: 'BOM-2023-003', 
          status: 'success', 
          user: '王五',
          sapDocId: 'SAP-55000156'
        }
      ];
      
      setReleaseHistory(history);
    } catch (error) {
      message.error('加载发布历史失败');
    }
  };

  // 初始化数据映射
  const initializeDataMapping = async () => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟映射数据
      const mapping = {
        bomId: { sapField: 'MATNR', required: true, mapped: true },
        bomName: { sapField: 'MAKTX', required: true, mapped: true },
        productModel: { sapField: 'MODEL', required: false, mapped: true },
        version: { sapField: 'VERSN', required: true, mapped: true },
        factory: { sapField: 'WERKS', required: true, mapped: true },
        status: { sapField: 'STATU', required: true, mapped: false },
        totalCost: { sapField: 'COST', required: false, mapped: true },
        currency: { sapField: 'CURR', required: false, mapped: true },
        createdBy: { sapField: 'CREATOR', required: true, mapped: true },
        createdDate: { sapField: 'CREATED', required: true, mapped: true }
      };
      
      setDataMapping(mapping);
    } catch (error) {
      message.error('初始化数据映射失败');
    }
  };

  // 数据映射到SAP格式
  const mapDataToSAP = async (bomData) => {
    try {
      // 确保bomData有默认值
      const bom = bomData || {};
      
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 映射数据格式
      const sapData = {
        header: {
          materialNumber: bom.productModel || 'UNKNOWN',
          materialDescription: bom.name || '未命名BOM',
          plant: sapConfig?.plant || '1000',
          storageLocation: sapConfig?.storageLocation || '0001'
        },
        items: (bom.parts || []).map(part => ({
          component: part.partNumber || 'UNKNOWN',
          componentDescription: part.name || '未命名零件',
          quantity: part.quantity || 1,
          unit: part.unit || 'EA',
          price: part.unitPrice || 0
        }))
      };
      
      return {
        success: true,
        data: sapData
      };
    } catch (error) {
      return {
        success: false,
        message: `数据映射失败: ${error.message}`
      };
    }
  };

  // 验证数据
  const validateData = () => {
    // 确保bomData.parts有默认值
    const parts = (bomData && bomData.parts) || [];
    
    if (parts.length === 0) {
      message.error('BOM中没有零件数据，无法发布到SAP');
      return false;
    }
    
    // 检查是否有零件缺少必要信息
    const invalidParts = parts.filter(part => !part.partNumber || !part.quantity || !part.unitPrice);
    if (invalidParts.length > 0) {
      message.error(`有${invalidParts.length}个零件缺少必要信息（零件编号、数量或单价）`);
      return false;
    }
    
    return true;
  };

  // 处理SAP发布
  const handleSAPRelease = async (values) => {
    setReleasing(true);
    setReleaseStep(0);
    setReleaseResult(null);
    
    try {
      // 确保bomData有默认值
      const bom = bomData || {};
      
      // 步骤1: 数据验证
      setReleaseStep(0);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 模拟验证结果
      const validation = {
        bomData: { status: 'success', message: 'BOM数据验证通过' },
        costData: { status: 'warning', message: '成本数据超出预算10%' },
        complianceData: { status: 'success', message: '合规数据验证通过' }
      };
      
      setValidationResults(validation);
      
      // 步骤2: SAP连接
      setReleaseStep(1);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 步骤3: 数据映射
      setReleaseStep(2);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 步骤4: 数据传输
      setReleaseStep(3);
      
      // 模拟传输进度
      for (let i = 0; i <= 100; i += 10) {
        setTransferProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // 步骤5: SAP确认
      setReleaseStep(4);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 步骤6: 完成发布
      setReleaseStep(5);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 设置发布结果
      const result = {
        success: true,
        sapDocumentId: `SAP-${Date.now()}`,
        releaseTime: new Date().toLocaleString(),
        releasedBy: currentUser?.name || '当前用户',
        notes: values.notes
      };
      
      setReleaseResult(result);
      
      // 调用父组件回调
      if (onSAPRelease) {
        onSAPRelease(result);
      }
      
      message.success('BOM已成功发布到SAP系统');
      
      // 刷新发布历史
      loadReleaseHistory();
      
    } catch (error) {
      // 设置失败结果
      const result = {
        success: false,
        error: error.message || '发布到SAP系统时发生未知错误',
        failedAtStep: SAP_RELEASE_STEPS[releaseStep]?.title || '未知步骤'
      };
      
      setReleaseResult(result);
      message.error(`发布失败: ${result.error}`);
    } finally {
      setReleasing(false);
      setShowReleaseModal(false);
    }
  };

  // 处理导出
  const handleExport = async (values) => {
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      message.success(`BOM已导出为${values.format.toUpperCase()}格式`);
      setExportModalVisible(false);
      
      // 调用父组件回调
      if (onExport) {
        onExport(values);
      }
    } catch (error) {
      message.error('导出失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理SAP配置
  const handleSAPConfig = async (values) => {
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      message.success('SAP配置已保存');
      setShowConfigModal(false);
      
      // 重新检查连接
      checkSAPConnection();
    } catch (error) {
      message.error('保存配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理数据映射配置
  const handleMappingConfig = async (values) => {
    try {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 更新映射配置
      const updatedMapping = { ...dataMapping };
      Object.keys(values).forEach(key => {
        if (updatedMapping[key]) {
          updatedMapping[key].mapped = values[key];
        }
      });
      
      setDataMapping(updatedMapping);
      message.success('数据映射配置已更新');
      setShowMappingModal(false);
    } catch (error) {
      message.error('更新映射配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染SAP连接状态
  const renderSAPConnectionStatus = () => {
    const getStatusConfig = () => {
      switch (connectionStatus) {
        case 'connected':
          return { color: 'success', text: '已连接', icon: <CheckCircleOutlined /> };
        case 'disconnected':
          return { color: 'error', text: '未连接', icon: <CloseCircleOutlined /> };
        case 'testing':
          return { color: 'processing', text: '连接中...', icon: <LoadingOutlined /> };
        default:
          return { color: 'default', text: '未知状态', icon: <ExclamationCircleOutlined /> };
      }
    };
    
    const statusConfig = getStatusConfig();
    
    return (
      <Card title="SAP系统状态" className={styles.infoCard} size="small">
        <Row gutter={16}>
          <Col span={12}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>连接状态:</span>
              <Badge 
                status={statusConfig.color} 
                text={
                  <span>
                    {statusConfig.icon} {statusConfig.text}
                  </span>
                } 
              />
            </div>
          </Col>
          <Col span={12}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>系统ID:</span>
              <span>{sapSystemInfo?.systemId || '-'}</span>
            </div>
          </Col>
        </Row>
        {sapSystemInfo && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Descriptions column={2} size="small">
              <Descriptions.Item label="客户端">{sapSystemInfo.client || '-'}</Descriptions.Item>
              <Descriptions.Item label="环境">{sapSystemInfo.environment || '-'}</Descriptions.Item>
              <Descriptions.Item label="版本">{sapSystemInfo.version || '-'}</Descriptions.Item>
              <Descriptions.Item label="最后同步">{sapSystemInfo.lastSync || '-'}</Descriptions.Item>
            </Descriptions>
          </>
        )}
        <div style={{ marginTop: 12 }}>
          <Space>
            <Button 
              size="small" 
              icon={<SyncOutlined />} 
              onClick={checkSAPConnection}
              loading={connectionStatus === 'testing'}
            >
              重新连接
            </Button>
            <Button 
              size="small" 
              icon={<SettingOutlined />} 
              onClick={() => setShowConfigModal(true)}
            >
              配置
            </Button>
          </Space>
        </div>
      </Card>
    );
  };

  // 渲染数据验证结果
  const renderValidationResults = () => {
    return (
      <Card title="数据验证结果" className={styles.infoCard} size="small">
        <List
          size="small"
          dataSource={Object.entries(validationResults)}
          renderItem={([key, result]) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={
                      result.status === 'success' ? <CheckCircleOutlined /> : 
                      result.status === 'warning' ? <WarningOutlined /> : 
                      <CloseCircleOutlined />
                    }
                    style={{ 
                      backgroundColor: 
                        result.status === 'success' ? '#52c41a' : 
                        result.status === 'warning' ? '#faad14' : 
                        '#ff4d4f' 
                    }}
                    size="small"
                  />
                }
                title={
                  <span>
                    {key === 'bomData' ? 'BOM数据' : 
                     key === 'costData' ? '成本数据' : 
                     key === 'complianceData' ? '合规数据' : key}
                  </span>
                }
                description={result.message}
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  // 渲染合规状态
  const renderComplianceStatus = () => {
    // 确保complianceResults有默认值
    const compliance = complianceResults || {};
    
    return (
      <Card title="合规状态" className={styles.infoCard}>
        <List
          itemLayout="horizontal"
          dataSource={[
            { title: 'RoHS', status: compliance.rohs || 'pending' },
            { title: 'CE', status: compliance.ce || 'pending' },
            { title: 'FCC', status: compliance.fcc || 'pending' },
            { title: '能源之星', status: compliance.energyStar || 'pending' },
          ]}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Badge 
                    status={item.status === 'pass' ? 'success' : item.status === 'fail' ? 'error' : 'default'} 
                    text={item.title} 
                  />
                }
                description={
                  <span className={item.status === 'pass' ? styles.passStatus : item.status === 'fail' ? styles.failStatus : styles.pendingStatus}>
                    {item.status === 'pass' ? '通过' : item.status === 'fail' ? '未通过' : '待检查'}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  // 渲染数据映射状态
  const renderDataMappingStatus = () => {
    const mappedFields = Object.values(dataMapping).filter(field => field.mapped).length;
    const totalFields = Object.keys(dataMapping).length;
    const requiredMapped = Object.values(dataMapping).filter(field => field.required && field.mapped).length;
    const totalRequired = Object.values(dataMapping).filter(field => field.required).length;
    
    return (
      <Card title="数据映射状态" className={styles.infoCard} size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Progress 
              percent={Math.round((mappedFields / totalFields) * 100)} 
              status={mappedFields === totalFields ? 'success' : 'active'}
              format={() => `${mappedFields}/${totalFields}`}
              size="small"
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
              总字段映射进度
            </div>
          </Col>
          <Col span={12}>
            <Progress 
              percent={Math.round((requiredMapped / totalRequired) * 100)} 
              status={requiredMapped === totalRequired ? 'success' : 'exception'}
              format={() => `${requiredMapped}/${totalRequired}`}
              size="small"
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
              必填字段映射进度
            </div>
          </Col>
        </Row>
        
        <div style={{ marginTop: 12 }}>
          <Button 
            size="small" 
            icon={<SettingOutlined />} 
            onClick={() => setShowMappingModal(true)}
          >
            配置映射
          </Button>
        </div>
      </Card>
    );
  };

  // 渲染发布进度
  const renderReleaseProgress = () => {
    return (
      <div className={styles.releaseProgress}>
        <Card title="正在发布到SAP系统" className={styles.infoCard}>
          <Steps 
            current={releaseStep} 
            direction="vertical" 
            size="small"
            className={styles.releaseSteps}
          >
            {SAP_RELEASE_STEPS.map((step, index) => (
              <Step
                key={index}
                title={step.title}
                description={step.description}
                icon={releasing && index === releaseStep ? <LoadingOutlined /> : step.icon}
                status={
                  index < releaseStep ? 'finish' : 
                  index === releaseStep ? (releasing ? 'process' : 'wait') : 'wait'
                }
              />
            ))}
          </Steps>
          
          {releasing && releaseStep === 3 && (
            <div className={styles.transferProgress}>
              <div className={styles.transferProgressInfo}>
                <Progress 
                  percent={transferProgress} 
                  status={transferProgress === 100 ? 'success' : 'active'}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <div className={styles.transferProgressText}>
                  数据传输进度: {transferProgress}%
                </div>
              </div>
            </div>
          )}
          
          {releasing && (
            <div className={styles.releaseProgressInfo}>
              <Spin spinning={releasing} tip="正在发布BOM到SAP系统...">
                <div style={{ height: 100 }} />
              </Spin>
            </div>
          )}
        </Card>
      </div>
    );
  };

  // 渲染发布结果
  const renderReleaseResult = () => {
    if (!releaseResult) return null;
    
    return (
      <Result
        status={releaseResult.success ? "success" : "error"}
        title={releaseResult.success ? "成功发布到SAP系统" : "发布到SAP系统失败"}
        subTitle={
          releaseResult.success 
            ? `SAP文档ID: ${releaseResult.sapDocumentId}` 
            : `失败步骤: ${releaseResult.failedAtStep}`
        }
        extra={[
          <Button key="export" icon={<ExportOutlined />} onClick={() => setExportModalVisible(true)}>
            导出发布报告
          </Button>,
          <Button key="view" type="primary" icon={<FileTextOutlined />}>
            查看SAP文档
          </Button>,
          <Button key="new" icon={<RocketOutlined />} onClick={() => setReleaseResult(null)}>
            发布新的BOM
          </Button>
        ]}
      />
    );
  };

  // 渲染BOM信息
  const renderBOMInfo = () => {
    // 确保costSummary有默认值
    const summary = costSummary || {};
    
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
                <Statistic title="零件总数" value={summary.partCount || 0} />
              </div>
              <div className={styles.statisticItem}>
                <Statistic 
                  title="总成本" 
                  value={summary.totalCost || 0} 
                  prefix="¥"
                  precision={2}
                />
              </div>
              <div className={styles.statisticItem}>
                <Statistic 
                  title="成本使用率" 
                  value={summary.totalCost && summary.targetCost ? 
                    (summary.totalCost / summary.targetCost * 100).toFixed(1) : 0} 
                  suffix="%"
                />
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染发布历史
  const renderReleaseHistory = () => {
    // 确保releaseHistory有默认值
    const history = releaseHistory || [];
    
    return (
      <Card title="SAP发布历史" className={styles.infoCard}>
        <Timeline>
          {history.length > 0 ? (
            history.map((item, index) => (
              <Timeline.Item 
                key={index}
                color={item.status === 'success' ? 'green' : 'red'}
                dot={item.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              >
                <div className={styles.operationItem}>
                  <div className={styles.operationTime}>{item.date}</div>
                  <div className={styles.operationAction}>
                    {item.bomId} - {item.status === 'success' ? '发布成功' : '发布失败'}
                  </div>
                  <div className={styles.operationUser}>
                    操作人: {item.user} | ID: {item.id}
                    {item.sapDocId && <span> | SAP文档: {item.sapDocId}</span>}
                  </div>
                  {item.error && (
                    <div className={styles.operationError}>
                      错误: {item.error}
                    </div>
                  )}
                </div>
              </Timeline.Item>
            ))
          ) : (
            <Timeline.Item>
              <div className={styles.operationItem}>
                <div className={styles.operationAction}>暂无发布历史</div>
              </div>
            </Timeline.Item>
          )}
        </Timeline>
      </Card>
    );
  };

  // 如果已经发布，显示发布结果
  if (releaseResult) {
    return (
      <div className={styles.releaseToSAPStep}>
        {renderReleaseResult()}
        
        <div className={styles.actionButtons}>
          <Space>
            <Button onClick={onSaveDraft}>
              保存草稿
            </Button>
            <Button onClick={() => setExportModalVisible(true)}>
              导出BOM
            </Button>
            <Button onClick={() => setExportModalVisible(true)}>
              导出发布报告
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
                <Option value="sap">SAP发布信息</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  // 正在发布或准备发布
  return (
    <div className={styles.releaseToSAPStep}>
      <Row gutter={16}>
        <Col span={releasing ? 24 : 12}>
          {releasing ? (
            renderReleaseProgress()
          ) : (
            renderBOMInfo()
          )}
        </Col>
        {!releasing && (
          <Col span={12}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                {renderSAPConnectionStatus()}
              </Col>
              <Col span={24}>
                {renderDataMappingStatus()}
              </Col>
              <Col span={24}>
                {renderValidationResults()}
              </Col>
            </Row>
          </Col>
        )}
      </Row>
      
      {!releasing && (
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={24}>
            {renderReleaseHistory()}
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
        </Space>
        <Space>
          <Button 
            type="primary" 
            size="large"
            icon={<RocketOutlined />}
            loading={releasing}
            onClick={() => setShowReleaseModal(true)}
            disabled={connectionStatus !== 'connected'}
          >
            发布到SAP
          </Button>
        </Space>
      </div>
      
      {/* SAP发布确认模态框 */}
      <Modal
        title="确认发布BOM到SAP系统"
        open={showReleaseModal}
        onCancel={() => setShowReleaseModal(false)}
        onOk={() => releaseForm.submit()}
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
              <p>5. 发布过程可能需要几分钟时间</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form form={releaseForm} onFinish={handleSAPRelease} layout="vertical">
          <Form.Item 
            name="confirm" 
            label="请输入'确认发布到SAP'以继续" 
            rules={[
              { required: true, message: '请输入确认文本' },
              { validator: (_, value) => {
                if (value === '确认发布到SAP') {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('请输入正确的确认文本'));
              }}
            ]}
          >
            <Input placeholder="请输入'确认发布到SAP'" />
          </Form.Item>
          <Form.Item 
            name="notes" 
            label="发布备注"
          >
            <TextArea rows={3} placeholder="请输入发布备注（可选）" />
          </Form.Item>
          <Form.Item 
            name="priority" 
            label="发布优先级" 
            initialValue="normal"
          >
            <Radio.Group>
              <Radio value="low">低</Radio>
              <Radio value="normal">普通</Radio>
              <Radio value="high">高</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* SAP配置模态框 */}
      <Modal
        title="SAP系统配置"
        open={showConfigModal}
        onCancel={() => setShowConfigModal(false)}
        onOk={() => configForm.submit()}
        okText="保存配置"
        cancelText="取消"
        width={700}
      >
        <Form form={configForm} onFinish={handleSAPConfig} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="systemId" 
                label="系统ID" 
                initialValue="SAP_PRD_01"
                rules={[{ required: true, message: '请输入系统ID' }]}
              >
                <Input placeholder="请输入SAP系统ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="client" 
                label="客户端" 
                initialValue="100"
                rules={[{ required: true, message: '请输入客户端' }]}
              >
                <Input placeholder="请输入客户端" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="username" 
                label="用户名" 
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入SAP用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="password" 
                label="密码" 
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="请输入SAP密码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="language" 
                label="语言" 
                initialValue="ZH"
              >
                <Select placeholder="请选择语言">
                  <Option value="ZH">中文</Option>
                  <Option value="EN">英文</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="environment" 
                label="环境" 
                initialValue="PRD"
              >
                <Select placeholder="请选择环境">
                  <Option value="DEV">开发环境</Option>
                  <Option value="QAS">测试环境</Option>
                  <Option value="PRD">生产环境</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item 
            name="description" 
            label="描述"
          >
            <TextArea rows={2} placeholder="请输入SAP系统描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
      
      {/* 数据映射配置模态框 */}
      <Modal
        title="数据映射配置"
        open={showMappingModal}
        onCancel={() => setShowMappingModal(false)}
        onOk={() => mappingForm.submit()}
        okText="保存配置"
        cancelText="取消"
        width={800}
      >
        <Alert
          message="数据映射说明"
          description="配置本地BOM数据字段与SAP系统字段的映射关系。必填字段必须映射才能成功发布。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Form form={mappingForm} onFinish={handleMappingConfig} layout="vertical">
          <Table
            dataSource={Object.entries(dataMapping).map(([key, value]) => ({
              key,
              localField: key,
              localFieldDesc: 
                key === 'bomId' ? 'BOM ID' :
                key === 'bomName' ? 'BOM名称' :
                key === 'productModel' ? '产品型号' :
                key === 'version' ? '版本' :
                key === 'factory' ? '工厂' :
                key === 'status' ? '状态' :
                key === 'totalCost' ? '总成本' :
                key === 'currency' ? '货币' :
                key === 'createdBy' ? '创建人' :
                key === 'createdDate' ? '创建日期' : key,
              sapField: value.sapField,
              required: value.required,
              mapped: value.mapped
            }))}
            pagination={false}
            size="small"
          >
            <Table.Column 
              title="本地字段" 
              dataIndex="localField" 
              key="localField"
              render={(text, record) => (
                <div>
                  <div>{text}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{record.localFieldDesc}</div>
                </div>
              )}
            />
            <Table.Column 
              title="SAP字段" 
              dataIndex="sapField" 
              key="sapField"
            />
            <Table.Column 
              title="必填" 
              dataIndex="required" 
              key="required"
              render={(required) => (
                <Tag color={required ? 'red' : 'blue'}>
                  {required ? '是' : '否'}
                </Tag>
              )}
            />
            <Table.Column 
              title="映射" 
              dataIndex="mapped" 
              key="mapped"
              render={(mapped, record) => (
                <Form.Item 
                  name={record.key} 
                  valuePropName="checked"
                  style={{ margin: 0 }}
                >
                  <Checkbox defaultChecked={mapped} />
                </Form.Item>
              )}
            />
          </Table>
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
              <Option value="sap">SAP发布信息</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReleaseToSAPStep;