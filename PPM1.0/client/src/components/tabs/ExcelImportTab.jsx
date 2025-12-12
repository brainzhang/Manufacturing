import React, { useState } from 'react';
import { 
  Card, 
  Steps, 
  Upload, 
  Button, 
  Alert, 
  Progress, 
  Table, 
  Space, 
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  message,
  Spin
} from 'antd';
import { 
  InboxOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  FileExcelOutlined,
  DiffOutlined,
  ImportOutlined,
  CloudUploadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { BOM_LEVELS } from '../../constants/bomConstants';

const { Dragger } = Upload;
const { Step } = Steps;
const { Title, Text, Paragraph } = Typography;
const { Column } = Table;

// 模拟AI预处理服务
const aiPreprocessService = {
  // 分析Excel结构
  analyzeExcelStructure: async (fileData) => {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 返回分析结果
    return {
      success: true,
      detectedFormat: 'standard',
      totalRows: fileData.length,
      headerMappings: {
        '零件名称': 'name',
        '位号': 'position',
        '用量': 'quantity',
        '单位': 'unit',
        '成本': 'cost',
        '供应商': 'supplier',
        '层级': 'level'
      },
      confidence: 0.92,
      recommendations: [
        '检测到标准BOM格式，数据质量良好',
        '发现3个缺失的位号，建议使用AI自动补全',
        '成本字段需要转换，当前为文本格式'
      ]
    };
  },
  
  // 预处理数据
  preprocessData: async (rawData, analysisResult) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 转换数据格式
    const processedData = rawData.map((row, index) => {
      // 根据分析结果映射字段
      const mappedRow = {};
      Object.keys(analysisResult.headerMappings).forEach(header => {
        const fieldName = analysisResult.headerMappings[header];
        mappedRow[fieldName] = row[header];
      });
      
      // 处理特殊字段
      if (mappedRow.cost && typeof mappedRow.cost === 'string') {
        mappedRow.cost = parseFloat(mappedRow.cost.replace(/[^\d.]/g, ''));
      }
      
      if (mappedRow.quantity && typeof mappedRow.quantity === 'string') {
        mappedRow.quantity = parseInt(mappedRow.quantity) || 0;
      }
      
      // 自动生成位号（如果缺失）
      if (!mappedRow.position) {
        mappedRow.position = `AUTO-${index + 1}`;
      }
      
      return mappedRow;
    });
    
    return {
      success: true,
      processedData,
      stats: {
        totalRows: processedData.length,
        validRows: processedData.filter(row => 
          row.name && row.quantity > 0
        ).length,
        invalidRows: processedData.length - processedData.filter(row => 
          row.name && row.quantity > 0
        ).length,
        totalCost: processedData.reduce((sum, row) => 
          sum + (row.cost || 0) * (row.quantity || 0), 0
        )
      }
    };
  }
};

// 模拟模板对比服务
const templateComparisonService = {
  // 对比与模板的差异
  compareWithTemplate: async (processedData) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 模拟差异检测结果
    return {
      matchPercentage: 85,
      totalDifferences: 12,
      differenceTypes: {
        missingParts: 5,
        extraParts: 3,
        specChanges: 4
      },
      differences: [
        {
          type: 'missing',
          position: 'U1.B',
          name: '主芯片组',
          severity: 'high',
          description: '模板中存在但导入数据中缺失'
        },
        {
          type: 'extra',
          position: 'R1.A',
          name: '额外电阻',
          severity: 'low',
          description: '导入数据中存在但模板中没有'
        },
        {
          type: 'spec_change',
          position: 'M1.A',
          name: '内存模块',
          severity: 'medium',
          description: '规格差异：模板中为32GB，导入数据中为16GB'
        }
      ]
    };
  }
};

// Excel导入步骤
const IMPORT_STEPS = [
  {
    title: '上传文件',
    description: '选择Excel文件'
  },
  {
    title: 'AI预处理',
    description: '智能解析和清洗'
  },
  {
    title: '差异预览',
    description: '对比模板差异'
  },
  {
    title: '应用导入',
    description: '确认并导入BOM'
  }
];

const ExcelImportTab = ({ onStructureImport }) => {
  // 状态管理
  const [currentStep, setCurrentStep] = useState(0);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [rawData, setRawData] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [processedData, setProcessedData] = useState([]);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  
  // 下载模板
  const handleDownloadTemplate = () => {
    // 创建模板数据
    const templateData = [
      {
        '位号': '主板-CPU-R1-C1-P1',
        '零件名称': 'Intel Core i7-12700K',
        '用量': 1,
        '单位': '个',
        '成本': 2599,
        '供应商': 'Intel',
        '差异': '',
        '生命周期': '量产',
        '层级': BOM_LEVELS.L6.level
      },
      {
        '位号': '主板-CPU-R1-C1-P1.1',
        '零件名称': 'AMD Ryzen 7 5800X',
        '用量': 1,
        '单位': '个',
        '成本': 2399,
        '供应商': 'AMD',
        '差异': '',
        '生命周期': '量产',
        '层级': BOM_LEVELS.L7.level
      },
      {
        '位号': '主板-Memory-R1-C1-P1',
        '零件名称': 'DDR4-3200 16GB',
        '用量': 2,
        '单位': '条',
        '成本': 499,
        '供应商': 'Kingston',
        '差异': '',
        '生命周期': '量产',
        '层级': BOM_LEVELS.L6.level
      },
      {
        '位号': '主板-Memory-R1-C1-P1.1',
        '零件名称': 'DDR4-3200 16GB',
        '用量': 2,
        '单位': '条',
        '成本': 459,
        '供应商': 'Corsair',
        '差异': '',
        '生命周期': '量产',
        '层级': BOM_LEVELS.L7.level
      }
    ];

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // 设置列宽
    const colWidths = [
      { wch: 20 }, // 位号
      { wch: 25 }, // 零件名称
      { wch: 8 },  // 用量
      { wch: 8 },  // 单位
      { wch: 10 }, // 成本
      { wch: 15 }, // 供应商
      { wch: 15 }, // 差异
      { wch: 10 }, // 生命周期
      { wch: 8 }   // 层级
    ];
    ws['!cols'] = colWidths;
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, "BOM导入模板");
    
    // 下载文件
    XLSX.writeFile(wb, "BOM导入模板.xlsx");
    
    message.success('模板下载成功');
  };

  // 文件上传处理
  const handleFileUpload = (info) => {
    const { file } = info;
    
    // 验证文件类型
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   file.type === 'application/vnd.ms-excel' ||
                   file.name.endsWith('.xlsx') || 
                   file.name.endsWith('.xls');
    
    if (!isExcel) {
      message.error('只支持Excel文件格式!');
      return;
    }
    
    setFile(file);
    
    // 读取Excel文件
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // 获取第一个工作表
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 转换为JSON数据
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setRawData(jsonData);
        setCurrentStep(1);
      } catch (error) {
        message.error('文件解析失败: ' + error.message);
      }
    };
    
    reader.readAsArrayBuffer(file.originFileObj);
  };
  
  // AI预处理
  const handlePreprocess = async () => {
    if (!rawData || rawData.length === 0) return;
    
    setLoading(true);
    setImportProgress(20);
    
    try {
      // 分析Excel结构
      const analysis = await aiPreprocessService.analyzeExcelStructure(rawData);
      setAnalysisResult(analysis);
      setImportProgress(50);
      
      // 预处理数据
      const preprocessingResult = await aiPreprocessService.preprocessData(rawData, analysis);
      setProcessedData(preprocessingResult.processedData);
      setImportProgress(80);
      
      // 与模板对比
      const comparison = await templateComparisonService.compareWithTemplate(preprocessingResult.processedData);
      setComparisonResult(comparison);
      setImportProgress(100);
      
      setCurrentStep(2);
    } catch (error) {
      message.error('预处理失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 应用导入
  const handleApplyImport = async () => {
    if (!processedData || processedData.length === 0) return;
    
    setApplyLoading(true);
    
    try {
      // 转换为BOM树结构
      const bomTree = convertToBOMTree(processedData);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentStep(3);
      
      // 通知父组件
      if (onStructureImport) {
        onStructureImport(bomTree);
      }
      
      message.success('BOM导入成功!');
    } catch (error) {
      message.error('导入失败: ' + error.message);
    } finally {
      setApplyLoading(false);
    }
  };
  
  // 转换为BOM树结构
  const convertToBOMTree = (data) => {
    // 这里实现将平面数据转换为{BOM_LEVELS.L7.level}层BOM树结构的逻辑
    // 简化版实现，实际应根据位号层级关系构建
    
    // 创建L1根节点
    const bomTree = {
      key: 'excel-import-root',
      title: '导入BOM根节点',
      level: BOM_LEVELS.L1.level,
      isParentNode: true,
      children: []
    };
    
    // 创建L2-L5的虚拟节点
    const moduleNode = {
      key: 'excel-import-module',
      title: '导入模块',
      level: BOM_LEVELS.L2.level,
      isParentNode: true,
      children: []
    };
    
    const submoduleNode = {
      key: 'excel-import-submodule',
      title: '导入子模块',
      level: BOM_LEVELS.L3.level,
      isParentNode: true,
      children: []
    };
    
    const familyNode = {
      key: 'excel-import-family',
      title: '导入零件族',
      level: BOM_LEVELS.L4.level,
      isParentNode: true,
      children: []
    };
    
    const groupNode = {
      key: 'excel-import-group',
      title: '导入零件组',
      level: BOM_LEVELS.L5.level,
      isParentNode: true,
      children: []
    };
    
    // 将L6零件添加到组节点
    data.forEach((item, index) => {
      const partNode = {
        key: `excel-import-part-${index}`,
        title: item.name || `零件${index + 1}`,
        position: item.position || `AUTO-${index + 1}`,
        level: BOM_LEVELS.L6.level,
        isPart: true,
        isParentNode: false,
        quantity: item.quantity || 1,
        unit: item.unit || '个',
        cost: item.cost || 0,
        supplier: item.supplier || '未知',
        lifecycle: '量产',
        children: []
      };
      
      // 如果有替代料，添加L7节点
      if (item.alternatives && item.alternatives.length > 0) {
        item.alternatives.forEach((alt, altIndex) => {
          const altNode = {
            key: `excel-import-part-${index}-alt-${altIndex}`,
            title: alt.name || `替代料${altIndex + 1}`,
            position: `${partNode.position}.${altIndex + 1}`,
            level: BOM_LEVELS.L7.level,
            isPart: true,
            isParentNode: false,
            isAlternative: true,
            quantity: item.quantity || 1,
            unit: item.unit || '个',
            cost: alt.cost || 0,
            supplier: alt.supplier || '未知',
            lifecycle: alt.lifecycle || '量产'
          };
          
          partNode.children.push(altNode);
        });
      }
      
      groupNode.children.push(partNode);
    });
    
    // 构建树结构
    familyNode.children.push(groupNode);
    submoduleNode.children.push(familyNode);
    moduleNode.children.push(submoduleNode);
    bomTree.children.push(moduleNode);
    
    return [bomTree];
  };
  
  // 重置导入过程
  const handleReset = () => {
    setCurrentStep(0);
    setFile(null);
    setRawData([]);
    setAnalysisResult(null);
    setProcessedData([]);
    setComparisonResult(null);
    setImportProgress(0);
  };
  
  // 渲染文件上传区域
  const renderFileUpload = () => (
    <div>
      <Row gutter={16}>
        <Col span={16}>
          <Card title="上传Excel文件" style={{ marginBottom: 16 }} extra={
            <Button 
              type="link" 
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              下载模板
            </Button>
          }>
            <Dragger
              name="file"
              multiple={false}
              accept=".xlsx,.xls"
              beforeUpload={() => false} // 阻止自动上传
              onChange={handleFileUpload}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽Excel文件到此区域上传</p>
              <p className="ant-upload-hint">支持.xlsx和.xls格式，文件大小不超过10MB</p>
            </Dragger>
          </Card>
          
          {file && (
            <Card size="small">
              <Space>
                <FileExcelOutlined style={{ color: '#52c41a' }} />
                <span>{file.name}</span>
                <Button size="small" onClick={handleReset}>
                  重新选择
                </Button>
              </Space>
            </Card>
          )}
        </Col>
        
        <Col span={8}>
          <Card title="导入说明" size="small">
            <div>
              
              
              <Title level={5}>Excel字段说明</Title>
              <ul>
                <li><strong>位号</strong>: 零件在BOM中的唯一标识</li>
                <li><strong>零件名称</strong>: 零件的描述性名称</li>
                <li><strong>用量</strong>: 该零件在产品中的使用数量</li>
                <li><strong>单位</strong>: 零件的计量单位，如"个"、"套"等</li>
                <li><strong>成本</strong>: 单个零件的成本价格</li>
                <li><strong>供应商</strong>: 零件的供应商名称</li>
                <li><strong>差异</strong>: 与标准模板的差异说明</li>
                <li><strong>生命周期</strong>: 零件的生命周期阶段</li>
                <li><strong>层级</strong>: 零件在BOM结构中的层级(1-{BOM_LEVELS.L7.level})</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
  
  // 渲染AI预处理区域
  const renderPreprocess = () => (
    <div>
      <Card title="AI预处理中..." style={{ marginBottom: 16 }}>
        {loading ? (
          <div>
            <Progress percent={importProgress} />
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Spin size="large" />
            </div>
          </div>
        ) : (
          <div>
            <Button 
              type="primary" 
              size="large"
              icon={<CloudUploadOutlined />}
              onClick={handlePreprocess}
            >
              开始AI预处理
            </Button>
          </div>
        )}
      </Card>
      
      {analysisResult && (
        <Card title="分析结果" size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="总行数"
                value={analysisResult.totalRows}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="格式置信度"
                value={analysisResult.confidence}
                precision={2}
                suffix="%"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="检测格式"
                value={analysisResult.detectedFormat}
              />
            </Col>
          </Row>
          
          <div style={{ marginTop: 16 }}>
            <Title level={5}>AI建议</Title>
            <ul>
              {analysisResult.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
  
  // 渲染差异预览区域
  const renderDiffPreview = () => (
    <div>
      <Card title="模板对比结果" style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Statistic
              title="匹配度"
              value={comparisonResult?.matchPercentage || 0}
              precision={1}
              suffix="%"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="差异项"
              value={comparisonResult?.totalDifferences || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="总行数"
              value={processedData.length}
            />
          </Col>
        </Row>
        
        <Table
          dataSource={comparisonResult?.differences || []}
          rowKey="position"
          pagination={false}
          size="small"
        >
          <Column
            title="类型"
            dataIndex="type"
            key="type"
            render={type => {
              const typeMap = {
                missing: { text: '缺失', color: 'red' },
                extra: { text: '多余', color: 'orange' },
                spec_change: { text: '规格变更', color: 'blue' }
              };
              const config = typeMap[type];
              return <Tag color={config.color}>{config.text}</Tag>;
            }}
          />
          <Column
            title="位号"
            dataIndex="position"
            key="position"
          />
          <Column
            title="名称"
            dataIndex="name"
            key="name"
          />
          <Column
            title="严重程度"
            dataIndex="severity"
            key="severity"
            render={severity => {
              const severityMap = {
                high: { text: '高', color: 'red' },
                medium: { text: '中', color: 'orange' },
                low: { text: '低', color: 'green' }
              };
              const config = severityMap[severity];
              return <Tag color={config.color}>{config.text}</Tag>;
            }}
          />
          <Column
            title="描述"
            dataIndex="description"
            key="description"
          />
        </Table>
      </Card>
      
      <Row justify="end">
        <Space>
          <Button onClick={handleReset}>重新上传</Button>
          <Button 
            type="primary"
            icon={<ImportOutlined />}
            onClick={handleApplyImport}
            loading={applyLoading}
          >
            确认导入
          </Button>
        </Space>
      </Row>
    </div>
  );
  
  // 渲染应用成功区域
  const renderSuccess = () => (
    <div>
      <Alert
        message="导入成功!"
        description={`已成功导入${processedData.length}条BOM记录，请检查右侧BOM树结构`}
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        style={{ marginBottom: 16 }}
      />
      
      <Card title="导入统计" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="总零件数"
              value={processedData.length}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="总成本"
              value={processedData.reduce((sum, item) => sum + (item.cost || 0) * (item.quantity || 0), 0)}
              precision={2}
              prefix="¥"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="供应商数"
              value={new Set(processedData.map(item => item.supplier)).size}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
  
  // 根据当前步骤渲染内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderFileUpload();
      case 1:
        return renderPreprocess();
      case 2:
        return renderDiffPreview();
      case 3:
        return renderSuccess();
      default:
        return null;
    }
  };
  
  return (
    <div style={{ padding: 16 }}>
      <Title level={3}>Excel导入BOM</Title>
      <Text type="secondary">上传Excel文件，通过AI智能预处理，对比模板差异，一键导入BOM结构</Text>
      
      <Card style={{ marginTop: 16 }}>
        <Steps current={currentStep} items={IMPORT_STEPS} />
      </Card>
      
      <div style={{ marginTop: 16 }}>
        {renderStepContent()}
      </div>
    </div>
  );
};

export default ExcelImportTab;