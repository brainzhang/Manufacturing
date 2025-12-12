import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  List, 
  Badge, 
  Button, 
  Space, 
  Progress, 
  Table, 
  Tag, 
  Divider, 
  Alert, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Spin, 
  Empty 
} from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseCircleOutlined, 
  InfoCircleOutlined,
  SafetyOutlined,
  FileTextOutlined,
  SyncOutlined,
  BugOutlined,
  WarningOutlined
} from '@ant-design/icons';
import styles from './PublishCheckStep.module.css';

const { Option } = Select;

const PublishCheckStep = ({ 
  bomData, 
  costSummary, 
  complianceResults, 
  onPublish, 
  onGoBack,
  onFixIssue,
  onGenerateReport
}) => {
  const [loading, setLoading] = useState(true);
  const [publishStatus, setPublishStatus] = useState('checking'); // checking, ready, warning, error
  const [checkResults, setCheckResults] = useState({
    integrity: { passed: 0, total: 0, items: [] },
    compliance: { passed: 0, total: 0, items: [] },
    consistency: { passed: 0, total: 0, items: [] }
  });
  const [issues, setIssues] = useState([]);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportForm] = Form.useForm();

  // 初始化检查
  useEffect(() => {
    performPublishChecks();
  }, [bomData, costSummary, complianceResults]);

  // 执行发布前检查
  const performPublishChecks = () => {
    setLoading(true);
    
    // 模拟异步检查过程
    setTimeout(() => {
      const integrityCheck = checkIntegrity();
      const complianceCheck = checkCompliance();
      const consistencyCheck = checkConsistency();
      
      const allIssues = [
        ...integrityCheck.items.filter(item => !item.passed),
        ...complianceCheck.items.filter(item => !item.passed),
        ...consistencyCheck.items.filter(item => !item.passed)
      ];
      
      setCheckResults({
        integrity: integrityCheck,
        compliance: complianceCheck,
        consistency: consistencyCheck
      });
      
      setIssues(allIssues);
      
      // 确定整体状态
      const totalChecks = integrityCheck.total + complianceCheck.total + consistencyCheck.total;
      const passedChecks = integrityCheck.passed + complianceCheck.passed + consistencyCheck.passed;
      const passRate = totalChecks > 0 ? passedChecks / totalChecks : 0;
      
      if (passRate >= 0.95) {
        setPublishStatus('ready');
      } else if (passRate >= 0.8) {
        setPublishStatus('warning');
      } else {
        setPublishStatus('error');
      }
      
      setLoading(false);
    }, 1500);
  };

  // 完整性检查
  const checkIntegrity = () => {
    const items = [
      {
        key: 'basic-info',
        title: '基础信息完整性',
        description: 'BOM名称、产品型号、版本等基础信息已填写',
        passed: bomData && bomData.name && bomData.productId && bomData.version,
        details: bomData ? [
          { label: 'BOM名称', value: bomData.name || '未填写' },
          { label: '产品型号', value: bomData.productId || '未选择' },
          { label: '版本', value: bomData.version || '未设置' }
        ] : []
      },
      {
        key: 'bom-structure',
        title: 'BOM结构完整性',
        description: 'BOM层级结构完整，无空节点',
        passed: bomData && bomData.treeData && bomData.treeData.length > 0,
        details: bomData && bomData.treeData ? [
          { label: '节点总数', value: countTotalNodes(bomData.treeData) },
          { label: '层级深度', value: getMaxDepth(bomData.treeData) },
          { label: '空节点数', value: countEmptyNodes(bomData.treeData) }
        ] : []
      },
      {
        key: 'cost-calculation',
        title: '成本计算完整性',
        description: '所有物料成本已计算，总成本已汇总',
        passed: costSummary && costSummary.totalCost > 0,
        details: costSummary ? [
          { label: '总成本', value: `¥${costSummary.totalCost.toFixed(2)}` },
          { label: '物料成本', value: `¥${costSummary.materialCost.toFixed(2)}` },
          { label: '人工成本', value: `¥${costSummary.laborCost.toFixed(2)}` },
          { label: '管理费用', value: `¥${costSummary.overheadCost.toFixed(2)}` }
        ] : []
      }
    ];
    
    const passed = items.filter(item => item.passed).length;
    
    return { passed, total: items.length, items };
  };

  // 合规性检查
  const checkCompliance = () => {
    const items = [
      {
        key: 'rohs-compliance',
        title: 'RoHS合规性',
        description: '所有物料符合RoHS环保指令要求',
        passed: complianceResults && complianceResults.rohsCompliance,
        details: complianceResults ? [
          { label: '合规率', value: `${(complianceResults.rohsComplianceRate * 100).toFixed(1)}%` },
          { label: '不合规物料数', value: complianceResults.rohsNonCompliantCount || 0 }
        ] : []
      },
      {
        key: 'ce-certification',
        title: 'CE认证',
        description: '产品符合CE认证要求',
        passed: complianceResults && complianceResults.ceCertification,
        details: complianceResults ? [
          { label: '认证状态', value: complianceResults.ceCertification ? '已通过' : '未通过' },
          { label: '有效期至', value: complianceResults.ceExpiryDate || '未知' }
        ] : []
      },
      {
        key: 'fcc-compliance',
        title: 'FCC合规性',
        description: '产品符合FCC电磁兼容性要求',
        passed: complianceResults && complianceResults.fccCompliance,
        details: complianceResults ? [
          { label: '合规状态', value: complianceResults.fccCompliance ? '已通过' : '未通过' },
          { label: '测试报告', value: complianceResults.fccReportAvailable ? '已上传' : '未上传' }
        ] : []
      },
      {
        key: 'energy-star',
        title: '能源之星认证',
        description: '产品符合能源效率要求',
        passed: complianceResults && complianceResults.energyStarCompliance,
        details: complianceResults ? [
          { label: '能效等级', value: complianceResults.energyStarLevel || '未评级' },
          { label: '年耗电量', value: complianceResults.annualEnergyConsumption || '未知' }
        ] : []
      }
    ];
    
    const passed = items.filter(item => item.passed).length;
    
    return { passed, total: items.length, items };
  };

  // 一致性检查
  const checkConsistency = () => {
    const items = [
      {
        key: 'lifecycle-consistency',
        title: '零件生命周期一致性',
        description: '所有零件生命周期状态与产品发布计划一致',
        passed: complianceResults && complianceResults.lifecycleConsistency,
        details: complianceResults ? [
          { label: 'EOL零件数', value: complianceResults.eolPartsCount || 0 },
          { label: '即将EOL零件数', value: complianceResults.nearEolPartsCount || 0 }
        ] : []
      },
      {
        key: 'alternative-parts',
        title: '替代料配置',
        description: '关键物料已配置替代料',
        passed: complianceResults && complianceResults.alternativePartsConfigured,
        details: complianceResults ? [
          { label: '关键物料数', value: complianceResults.criticalPartsCount || 0 },
          { label: '已配置替代料', value: complianceResults.configuredAlternativesCount || 0 }
        ] : []
      },
      {
        key: 'cost-threshold',
        title: '成本阈值一致性',
        description: '总成本在预算阈值范围内',
        passed: costSummary && costSummary.withinThreshold,
        details: costSummary ? [
          { label: '当前成本', value: `¥${costSummary.totalCost.toFixed(2)}` },
          { label: '预算阈值', value: `¥${costSummary.threshold.toFixed(2)}` },
          { label: '使用率', value: `${((costSummary.totalCost / costSummary.threshold) * 100).toFixed(1)}%` }
        ] : []
      }
    ];
    
    const passed = items.filter(item => item.passed).length;
    
    return { passed, total: items.length, items };
  };

  // 辅助函数：计算总节点数
  const countTotalNodes = (nodes) => {
    if (!nodes || nodes.length === 0) return 0;
    
    let count = nodes.length;
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        count += countTotalNodes(node.children);
      }
    });
    
    return count;
  };

  // 辅助函数：计算最大深度
  const getMaxDepth = (nodes, currentDepth = 1) => {
    if (!nodes || nodes.length === 0) return currentDepth - 1;
    
    let maxDepth = currentDepth;
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        const depth = getMaxDepth(node.children, currentDepth + 1);
        maxDepth = Math.max(maxDepth, depth);
      }
    });
    
    return maxDepth;
  };

  // 辅助函数：计算空节点数
  const countEmptyNodes = (nodes) => {
    if (!nodes || nodes.length === 0) return 0;
    
    let count = 0;
    nodes.forEach(node => {
      if (!node.partId || !node.partName) {
        count++;
      }
      if (node.children && node.children.length > 0) {
        count += countEmptyNodes(node.children);
      }
    });
    
    return count;
  };

  // 处理发布
  const handlePublish = () => {
    if (publishStatus === 'error') {
      message.error('请解决所有错误后再发布');
      return;
    }
    
    Modal.confirm({
      title: '确认发布BOM',
      content: `发布后BOM将同步到SAP系统，您确定要继续吗？`,
      okText: '确认发布',
      cancelText: '取消',
      onOk: () => {
        onPublish && onPublish();
      }
    });
  };

  // 处理生成报告
  const handleGenerateReport = () => {
    setReportModalVisible(true);
  };

  // 提交报告表单
  const handleReportSubmit = (values) => {
    onGenerateReport && onGenerateReport(values);
    setReportModalVisible(false);
    message.success('报告生成成功');
  };

  // 渲染状态图标
  const renderStatusIcon = () => {
    switch (publishStatus) {
      case 'ready':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 48 }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 48 }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#f5222d', fontSize: 48 }} />;
      default:
        return <SyncOutlined spin style={{ color: '#1890ff', fontSize: 48 }} />;
    }
  };

  // 渲染状态标题
  const renderStatusTitle = () => {
    switch (publishStatus) {
      case 'ready':
        return '检查通过，可以发布';
      case 'warning':
        return '存在警告项，建议修复后发布';
      case 'error':
        return '存在错误项，请修复后再发布';
      default:
        return '正在执行发布前检查...';
    }
  };

  // 渲染状态描述
  const renderStatusDescription = () => {
    const totalChecks = checkResults.integrity.total + checkResults.compliance.total + checkResults.consistency.total;
    const passedChecks = checkResults.integrity.passed + checkResults.compliance.passed + checkResults.consistency.passed;
    const passRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
    
    return `已完成 ${passedChecks}/${totalChecks} 项检查，通过率 ${passRate.toFixed(1)}%`;
  };

  // 渲染检查项
  const renderCheckItem = (item) => {
    return (
      <List.Item className={styles.checkItem}>
        <List.Item.Meta
          avatar={item.passed ? 
            <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
            <CloseCircleOutlined style={{ color: '#f5222d' }} />
          }
          title={
            <span>
              {item.title}
              <Badge 
                count={item.passed ? '通过' : '未通过'} 
                style={{ 
                  backgroundColor: item.passed ? '#52c41a' : '#f5222d',
                  marginLeft: 8 
                }} 
              />
            </span>
          }
          description={item.description}
        />
        {!item.passed && (
          <Button 
            type="link" 
            size="small"
            onClick={() => onFixIssue && onFixIssue(item.key)}
          >
            修复
          </Button>
        )}
      </List.Item>
    );
  };

  // 问题表格列定义
  const issueColumns = [
    {
      title: '问题类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeMap = {
          'integrity': { text: '完整性', color: 'blue', icon: <InfoCircleOutlined /> },
          'compliance': { text: '合规性', color: 'green', icon: <SafetyOutlined /> },
          'consistency': { text: '一致性', color: 'orange', icon: <SyncOutlined /> }
        };
        const config = typeMap[type] || { text: '未知', color: 'default', icon: <BugOutlined /> };
        
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '问题描述',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => {
        const severityMap = {
          'high': { text: '高', color: 'red' },
          'medium': { text: '中', color: 'orange' },
          'low': { text: '低', color: 'blue' }
        };
        const config = severityMap[severity] || { text: '未知', color: 'default' };
        
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          size="small"
          onClick={() => onFixIssue && onFixIssue(record.key)}
        >
          修复
        </Button>
      )
    }
  ];

  // 准备问题数据
  const prepareIssueData = () => {
    const issueData = [];
    
    // 处理完整性问题
    checkResults.integrity.items.forEach(item => {
      if (!item.passed) {
        issueData.push({
          key: item.key,
          type: 'integrity',
          title: item.title,
          severity: 'high'
        });
      }
    });
    
    // 处理合规性问题
    checkResults.compliance.items.forEach(item => {
      if (!item.passed) {
        issueData.push({
          key: item.key,
          type: 'compliance',
          title: item.title,
          severity: 'medium'
        });
      }
    });
    
    // 处理一致性问题
    checkResults.consistency.items.forEach(item => {
      if (!item.passed) {
        issueData.push({
          key: item.key,
          type: 'consistency',
          title: item.title,
          severity: 'low'
        });
      }
    });
    
    return issueData;
  };

  if (loading) {
    return (
      <div className={styles.publishCheckStep}>
        <Spin size="large" tip="正在执行发布前检查...">
          <div style={{ height: 400 }} />
        </Spin>
      </div>
    );
  }

  return (
    <div className={styles.publishCheckStep}>
      {/* 整体状态卡片 */}
      <Card className={styles.overallStatusCard}>
        <div className={styles.statusHeader}>
          <div className={styles.statusIcon}>
            {renderStatusIcon()}
          </div>
          <div className={styles.statusContent}>
            <h2 className={styles.statusTitle}>{renderStatusTitle()}</h2>
            <p className={styles.statusDescription}>{renderStatusDescription()}</p>
            <Progress 
              percent={parseInt(
                ((checkResults.integrity.passed + checkResults.compliance.passed + checkResults.consistency.passed) / 
                (checkResults.integrity.total + checkResults.compliance.total + checkResults.consistency.total)) * 100
              )} 
              className={styles.statusProgress}
              status={publishStatus === 'error' ? 'exception' : publishStatus === 'warning' ? 'active' : 'success'}
            />
          </div>
        </div>
      </Card>

      {/* 检查结果卡片 */}
      <Row gutter={16}>
        <Col span={8}>
          <Card 
            title={<><FileTextOutlined /> 完整性检查</>} 
            className={styles.checkCard}
            extra={<Badge count={`${checkResults.integrity.passed}/${checkResults.integrity.total}`} />}
          >
            <List
              dataSource={checkResults.integrity.items}
              renderItem={renderCheckItem}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            title={<><SafetyOutlined /> 合规性检查</>} 
            className={styles.checkCard}
            extra={<Badge count={`${checkResults.compliance.passed}/${checkResults.compliance.total}`} />}
          >
            <List
              dataSource={checkResults.compliance.items}
              renderItem={renderCheckItem}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card 
            title={<><SyncOutlined /> 一致性检查</>} 
            className={styles.checkCard}
            extra={<Badge count={`${checkResults.consistency.passed}/${checkResults.consistency.total}`} />}
          >
            <List
              dataSource={checkResults.consistency.items}
              renderItem={renderCheckItem}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 问题列表 */}
      {issues.length > 0 && (
        <Card 
          title={<><WarningOutlined /> 需要修复的问题</>} 
          className={styles.issuesCard}
          extra={<Badge count={issues.length} />}
        >
          <Table
            columns={issueColumns}
            dataSource={prepareIssueData()}
            pagination={false}
            size="small"
            rowKey="key"
          />
        </Card>
      )}

      {/* 操作按钮 */}
      <div className={styles.actionButtons}>
        <Space>
          <Button onClick={handleGenerateReport}>
            生成检查报告
          </Button>
        </Space>
        <Space>
          <Button onClick={performPublishChecks}>
            重新检查
          </Button>
          <Button 
            type="primary" 
            onClick={handlePublish}
            disabled={publishStatus === 'error'}
          >
            发布BOM
          </Button>
        </Space>
      </div>

      {/* 生成报告模态框 */}
      <Modal
        title="生成检查报告"
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        onOk={() => reportForm.submit()}
        okText="生成"
        cancelText="取消"
      >
        <Form form={reportForm} onFinish={handleReportSubmit} layout="vertical">
          <Form.Item 
            name="reportName" 
            label="报告名称" 
            rules={[{ required: true, message: '请输入报告名称' }]}
            initialValue={`BOM检查报告_${new Date().toLocaleDateString()}`}
          >
            <Input placeholder="请输入报告名称" />
          </Form.Item>
          <Form.Item 
            name="reportFormat" 
            label="报告格式" 
            initialValue="pdf"
          >
            <Select placeholder="请选择报告格式">
              <Option value="pdf">PDF</Option>
              <Option value="excel">Excel</Option>
              <Option value="word">Word</Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="includeDetails" 
            label="包含详细内容" 
            initialValue={true}
          >
            <Select placeholder="请选择详细程度">
              <Option value={true}>包含所有检查项详情</Option>
              <Option value={false}>仅包含摘要和问题项</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PublishCheckStep;