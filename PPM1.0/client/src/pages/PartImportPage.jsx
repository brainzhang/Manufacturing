import React, { useState, useCallback } from 'react';
import { 
  Input, Button, Row, Col, Card, 
  Table, Steps, Upload, Progress, Spin, 
  notification
} from 'antd';
import { 
  FileExcelOutlined, FileTextOutlined, 
  ReloadOutlined, CheckOutlined, ArrowLeftOutlined, ArrowRightOutlined
} from '@ant-design/icons';
import { importParts } from '../services/partService';
import * as XLSX from 'xlsx';

const PartImportPage = () => {
  // 批量导入相关状态
  const [importStep, setImportStep] = useState(1);
  const [importFile, setImportFile] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [importProgress, setImportProgress] = useState(0);
  
  // AI预处理相关状态
  const [aiProcessedData, setAiProcessedData] = useState([]);
  const [aiResult, setAiResult] = useState({
    dedupList: [],
    missingList: []
  });
  
  // 差异检测相关状态
  const [diffResult, setDiffResult] = useState({
    diffList: [],
    complianceList: []
  });
  
  // 写入结果相关状态
  const [writeResult, setWriteResult] = useState({
    successCount: 0,
    failCount: 0,
    failRows: []
  });

  // 处理文件上传
  const handleFileUpload = useCallback((file) => {
    setImportFile(file);
    // 模拟文件读取和预处理
    setTimeout(() => {
      notification.success({ message: '文件上传成功' });
    }, 500);
    return false; // 阻止自动上传
  }, []);

  // 下载导入模板
  const handleDownloadTemplate = useCallback(() => {
    // 创建零件导入模板数据 - 联想电脑零部件
    const partTemplate = [
      // 表头 - 增加更多字段
      [
        '零件ID',
        '零件名称',
        '类别',
        '子类别',
        '生命周期',
        '成本(元)',
        '库存数量',
        '安全库存',
        '供应商',
        '供应商代码',
        '库存位置',
        '适用机型',
        '品牌',
        '型号规格',
        '材质',
        '尺寸(mm)',
        '重量(g)',
        '颜色',
        '批次号',
        '生产日期',
        '保质期',
        '描述',
        '创建日期',
        '修改日期',
        '负责人',
        '审核状态'
      ],
      // 20条联想电脑真实零部件数据
      ['LNB-P001', 'ThinkPad X1 Carbon A壳', '机身覆盖件', '上盖', '量产', 1580.00, 120, 50, '富士康科技集团', 'FSK001', '仓库A-1-01', 'ThinkPad X1 Carbon Gen10', 'Lenovo', '5M10Y69781', '碳纤维复合', '323x217x3.2', 125, '碳黑色', '2305A001', '2023-05-10', '36个月', 'ThinkPad X1 Carbon Gen10 顶盖，碳纤维材质，含Logo', '2023-01-15', '2023-06-20', '张工程师', '已审核'],
      ['LNB-P002', 'ThinkPad T14 键盘框架', '机身结构件', '键盘支撑', '量产', 850.00, 85, 40, '广达电脑', 'QUANTA002', '仓库A-2-03', 'ThinkPad T14 Gen3', 'Lenovo', '5M10W84275', '镁铝合金', '332x227x1.5', 180, '银色', '2306B002', '2023-06-15', '36个月', 'ThinkPad T14 Gen3 键盘框架，镁铝合金材质', '2023-01-20', '2023-07-10', '李工程师', '已审核'],
      ['LNB-P003', 'ThinkPad 通用转轴组件', '机身结构件', '转轴', '量产', 320.00, 200, 80, '群光电子', 'CHICONY003', '仓库B-1-05', 'ThinkPad T/X/P系列', 'Lenovo', '5M10V64123', '不锈钢', '25x18x12', 45, '银色', '2304C003', '2023-04-20', '48个月', 'ThinkPad全系列通用双转轴组件，不锈钢材质', '2022-12-05', '2023-05-15', '王工程师', '已审核'],
      ['LNB-P004', 'ThinkPad T14 14寸LCD屏幕', '显示屏', 'LCD面板', '量产', 1850.00, 60, 30, '友达光电', 'AUO004', '仓库C-1-02', 'ThinkPad T14 Gen3', 'AU Optronics', 'B140HTN03.1', 'IPS LCD', '309.4x173.9x3.2', 250, '雾面黑', '2307D004', '2023-07-05', '24个月', '14英寸 FHD IPS 防眩光 LCD屏幕，300尼特亮度', '2023-02-10', '2023-06-25', '刘工程师', '已审核'],
      ['LNB-P005', 'ThinkPad X1 Carbon OLED屏幕', '显示屏', 'OLED面板', '量产', 2650.00, 45, 20, '三星显示', 'SAMSUNG005', '仓库C-2-07', 'ThinkPad X1 Carbon Gen10', 'Samsung', 'LTN133HL01-T01', 'OLED', '290x165x2.8', 210, '镜面黑', '2308E005', '2023-08-10', '24个月', '13.3英寸 2.8K OLED触控屏幕，400尼特亮度', '2023-03-01', '2023-07-05', '赵工程师', '已审核'],
      ['LNB-P006', 'ThinkPad 背光键盘', '输入设备', '键盘', '量产', 680.00, 150, 60, '旭丽电子', 'KYE006', '仓库D-1-03', 'ThinkPad全系列', 'Lenovo', '0B47193', 'ABS塑料', '310x110x6', 220, '黑色', '2303F006', '2023-03-25', '24个月', 'ThinkPad全系列背光键盘，含指点杆，防泼溅设计', '2023-01-18', '2023-06-18', '孙工程师', '已审核'],
      ['LNB-P007', 'ThinkPad 精密触摸板', '输入设备', '触摸板', '量产', 320.00, 180, 70, '阿尔卑斯电气', 'ALPS007', '仓库D-2-05', 'ThinkPad X1/T14系列', 'Lenovo', '00NY493', '玻璃', '110x65x2.5', 45, '黑色', '2305G007', '2023-05-20', '24个月', 'ThinkPad精密玻璃触摸板，多点触控支持', '2023-02-05', '2023-05-20', '周工程师', '已审核'],
      ['LNB-P008', 'ThinkPad 67Wh电池组', '电源', '内置电池', '量产', 1050.00, 90, 40, 'LG化学', 'LGCHEM008', '仓库E-1-04', 'ThinkPad X1 Carbon Gen10', 'LG', '01AV493', '锂聚合物', '200x80x12', 420, '黑色', '2306H008', '2023-06-10', '24个月', '67Wh高容量锂聚合物电池组，支持快充', '2023-01-25', '2023-07-15', '吴工程师', '已审核'],
      ['LNB-P009', 'ThinkPad 65W适配器', '电源', 'AC适配器', '量产', 380.00, 160, 80, '台达电子', 'DELTA009', '仓库E-2-06', 'ThinkPad全系列', 'Lenovo', '4X20M26268', 'PC/ABS', '100x50x28', 220, '黑色', '2304I009', '2023-04-15', '36个月', '65W USB-C电源适配器，支持快充', '2023-02-15', '2023-06-10', '郑工程师', '已审核'],
      ['LNB-P010', 'ThinkPad X1 主板', '电子元件', '主板', '量产', 3580.00, 35, 15, '联想电子', 'LENOVO010', '仓库F-1-02', 'ThinkPad X1 Carbon Gen10', 'Lenovo', 'FRU 02HK739', 'PCB+元器件', '280x200x2.5', 320, '绿色PCB', '2307J010', '2023-07-20', '36个月', 'ThinkPad X1 Carbon Gen10 主板，Intel平台', '2023-01-10', '2023-06-28', '钱工程师', '已审核'],
      ['LNB-P011', 'ThinkPad CPU散热器', '散热系统', '散热模组', '量产', 350.00, 120, 50, '奇宏科技', 'AVC011', '仓库G-1-08', 'ThinkPad X1/T14系列', 'AVC', '5F10W39592', '铝+铜', '100x80x15', 85, '银色', '2305K011', '2023-05-25', '24个月', '高性能铜管散热器，双风扇设计', '2023-02-08', '2023-05-30', '孙工程师', '已审核'],
      ['LNB-P012', 'ThinkPad SSD模块', '存储设备', '固态硬盘', '量产', 1380.00, 80, 30, '三星电子', 'SAMSUNG012', '仓库H-1-03', 'ThinkPad全系列', 'Samsung', 'MZVL21T0HCLR', 'NAND Flash', '80x22x3.5', 8, '银色', '2308L012', '2023-08-05', '36个月', '1TB NVMe SSD，PCIe 4.0，读取速度7000MB/s', '2023-03-05', '2023-07-02', '周工程师', '已审核'],
      ['LNB-P013', 'ThinkPad 内存模块', '存储设备', '内存', '量产', 950.00, 110, 45, '美光科技', 'MICRON013', '仓库H-2-05', 'ThinkPad全系列', 'Micron', 'MT40A512M16JE-083E', 'DRAM', '69.6x30x3.8', 10, '绿色PCB', '2306M013', '2023-06-25', '36个月', '16GB DDR4-3200 SODIMM内存模块', '2023-02-20', '2023-06-15', '吴工程师', '已审核'],
      ['LNB-P014', 'ThinkPad 无线网卡', '网络设备', 'WiFi模块', '量产', 520.00, 95, 40, '英特尔', 'INTEL014', '仓库I-1-06', 'ThinkPad全系列', 'Intel', 'AX211', 'PCB+芯片', '30x26x2.2', 6, '绿色PCB', '2307N014', '2023-07-15', '24个月', 'Intel WiFi 6E AX211无线网卡，支持蓝牙5.2', '2023-01-30', '2023-06-22', '郑工程师', '已审核'],
      ['LNB-P015', 'ThinkPad 扬声器模块', '音频设备', '扬声器', '量产', 260.00, 140, 55, '瑞声科技', 'AAC015', '仓库J-1-04', 'ThinkPad X1/T14系列', 'AAC', '5M10W64587', 'ABS+磁铁', '40x25x8', 15, '黑色', '2305O015', '2023-05-15', '24个月', '立体声扬声器模块，支持杜比音效', '2023-02-12', '2023-05-25', '钱工程师', '已审核'],
      ['LNB-P016', 'ThinkPad IR摄像头', '影像设备', '摄像头', '量产', 450.00, 75, 30, 'Lite-On', 'LITEON016', '仓库K-1-02', 'ThinkPad X1系列', 'Lite-On', '5M10Y43892', 'CMOS', '20x20x5', 10, '黑色', '2307P016', '2023-07-25', '24个月', '1080p高清IR摄像头，支持Windows Hello', '2023-03-10', '2023-07-08', '孙工程师', '已审核'],
      ['LNB-P017', 'ThinkPad 指纹模块', '安全设备', '指纹识别', '量产', 480.00, 65, 25, 'Validity', 'VALIDITY017', '仓库L-1-05', 'ThinkPad全系列', 'Validity', '5M10U85732', '电容式', '18x18x1.5', 5, '黑色', '2306Q017', '2023-06-30', '24个月', '高精度电容式指纹识别模块', '2023-02-25', '2023-06-12', '周工程师', '已审核'],
      ['LNB-P018', 'ThinkPad 掌托面板', '机身覆盖件', '掌托', '量产', 420.00, 130, 50, '富士康科技集团', 'FSK018', '仓库A-3-07', 'ThinkPad T14 Gen3', 'Lenovo', '5M10W64187', '镁铝合金', '332x227x1.2', 160, '银色', '2304R018', '2023-04-10', '36个月', '镁铝合金掌托面板，含触摸板开口', '2023-01-12', '2023-06-05', '吴工程师', '已审核'],
      ['LNB-P019', 'ThinkPad SSD支架', '机身结构件', '硬盘支架', '量产', 150.00, 190, 70, '捷普科技', 'JABIL019', '仓库B-2-03', 'ThinkPad全系列', 'Lenovo', '5M10U85632', '铝合金', '100x30x2', 20, '银色', '2303S019', '2023-03-10', '48个月', 'M.2 SSD固定支架，铝合金材质', '2023-02-01', '2023-05-18', '郑工程师', '已审核'],
      ['LNB-P020', 'ThinkPad I/O接口板', '电子元件', '接口板', '量产', 750.00, 85, 35, '联想电子', 'LENOVO020', '仓库F-2-08', 'ThinkPad T14 Gen3', 'Lenovo', '5M10W76432', 'PCB+接口', '120x80x2.5', 45, '绿色PCB', '2306T020', '2023-06-20', '36个月', 'I/O接口扩展板，含USB-C、HDMI等接口', '2023-03-08', '2023-07-12', '钱工程师', '已审核']
    ];

    // 创建工作簿和工作表
    const ws = XLSX.utils.aoa_to_sheet(partTemplate);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '联想电脑零部件导入模板');

    // 设置列宽
    ws['!cols'] = [
      { wch: 12 }, // 零件ID
      { wch: 25 }, // 零件名称
      { wch: 12 }, // 类别
      { wch: 12 }, // 子类别
      { wch: 10 }, // 生命周期
      { wch: 12 }, // 成本(元)
      { wch: 12 }, // 库存数量
      { wch: 10 }, // 安全库存
      { wch: 15 }, // 供应商
      { wch: 12 }, // 供应商代码
      { wch: 12 }, // 库存位置
      { wch: 20 }, // 适用机型
      { wch: 10 }, // 品牌
      { wch: 15 }, // 型号规格
      { wch: 10 }, // 材质
      { wch: 12 }, // 尺寸(mm)
      { wch: 10 }, // 重量(g)
      { wch: 8 },  // 颜色
      { wch: 12 }, // 批次号
      { wch: 12 }, // 生产日期
      { wch: 10 }, // 保质期
      { wch: 35 }, // 描述
      { wch: 12 }, // 创建日期
      { wch: 12 }, // 修改日期
      { wch: 10 }, // 负责人
      { wch: 10 }  // 审核状态
    ];

    // 下载Excel文件
    XLSX.writeFile(wb, '联想电脑零部件导入模板.xlsx');
    notification.success({ message: '联想电脑零部件模板下载成功' });
  }, []);

  // 查看导入说明
  const handleViewInstructions = useCallback(() => {
    // 创建导入说明内容
    const instructionsContent = `
    零件批量导入说明：
    
    1. 文件格式要求：
       - 支持 .xlsx 和 .csv 格式文件
       - 文件大小不超过50MB
       - 表头必须包含以下字段：零件ID、零件名称、类别、子类别、生命周期、成本(元)、库存数量、安全库存、供应商、供应商代码、库存位置、适用机型、品牌、型号规格、材质、尺寸(mm)、重量(g)、颜色、批次号、生产日期、保质期、描述、创建日期、修改日期、负责人、审核状态
    
    2. 数据填写规范：
       - 零件ID：必填，字母数字组合，建议格式如LNB-P001
       - 零件名称：必填，不超过100个字符
       - 类别：必填，如机身覆盖件、电子元件等
       - 子类别：必填，如键盘支撑、上盖等
       - 生命周期：必填，可选值：量产、试产、设计中、停产
       - 成本(元)：必填，数字格式，保留2位小数
       - 库存数量：必填，整数格式
       - 安全库存：必填，整数格式
       - 供应商：必填，不超过50个字符
       - 供应商代码：必填，字母数字组合
       - 库存位置：必填，建议格式如仓库A-1-01
       - 适用机型：必填，如ThinkPad X1 Carbon Gen10
       - 品牌：必填，如Lenovo
       - 型号规格：必填，如5M10Y69781
       - 材质：必填，如碳纤维复合、镁铝合金等
       - 尺寸(mm)：必填，如323x217x3.2
       - 重量(g)：必填，整数格式
       - 颜色：必填，如碳黑色、银色
       - 批次号：必填，字母数字组合
       - 生产日期：必填，格式：YYYY-MM-DD
       - 保质期：必填，如24个月、36个月
       - 描述：必填，不超过200个字符
       - 创建日期：必填，格式：YYYY-MM-DD
       - 修改日期：必填，格式：YYYY-MM-DD
       - 负责人：必填，不超过20个字符
       - 审核状态：必填，可选值：已审核、待审核、未通过
    
    3. 导入流程：
       - 步骤1：上传符合规范的Excel/CSV文件
       - 步骤2：AI预处理，自动检测重复数据和缺失字段
       - 步骤3：差异修正，与MDM系统进行数据对比并修正
       - 步骤4：批量写入数据库
       - 步骤5：查看导入结果并导出失败记录
    
    4. 常见问题：
       - Q: 导入失败怎么办？
       - A: 请查看导入结果页面的失败原因，修正数据后重新上传
       - 
       - Q: 如何处理重复数据？
       - A: AI预处理阶段会自动检测重复数据，您可以选择一键合并或忽略
       - 
       - Q: 字段映射错误如何处理？
       - A: 确保表头字段名称与模板完全一致
    `;
    
    // 创建说明弹窗
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.top = '50%';
    div.style.left = '50%';
    div.style.transform = 'translate(-50%, -50%)';
    div.style.width = '600px';
    div.style.maxHeight = '80vh';
    div.style.backgroundColor = 'white';
    div.style.borderRadius = '8px';
    div.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    div.style.padding = '24px';
    div.style.overflow = 'auto';
    div.style.zIndex = '10000';
    
    const title = document.createElement('h3');
    title.textContent = '零件批量导入说明';
    title.style.fontSize = '18px';
    title.style.fontWeight = '600';
    title.style.marginBottom = '16px';
    
    const content = document.createElement('pre');
    content.textContent = instructionsContent;
    content.style.whiteSpace = 'pre-wrap';
    content.style.lineHeight = '1.6';
    content.style.margin = '0';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '16px';
    closeButton.style.right = '16px';
    closeButton.style.padding = '6px 12px';
    closeButton.style.backgroundColor = '#f0f0f0';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';
    
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '9999';
    
    const closeModal = () => {
      document.body.removeChild(div);
      document.body.removeChild(overlay);
    };
    
    closeButton.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    div.appendChild(title);
    div.appendChild(content);
    div.appendChild(closeButton);
    
    document.body.appendChild(overlay);
    document.body.appendChild(div);
  }, []);

  // 下一步
  const handleNextStep = useCallback(() => {
    if (importStep < 5) {
      setImportStep(importStep + 1);
      
      // 模拟不同步骤的处理逻辑
      if (importStep === 1) {
        // 模拟AI预处理
        setImportProgress(25);
        setTimeout(() => {
          // 模拟预处理数据 - 联想电脑零部件（包含完整26个字段）
          const mockProcessedData = [
            {
              partId: 'LNB-P001',
              partName: 'ThinkPad X1 Carbon A壳',
              category: '机身覆盖件',
              subCategory: '上盖',
              lifecycle: '量产',
              cost: 1580.00,
              stockQuantity: 120,
              safetyStock: 50,
              supplier: '富士康科技集团',
              supplierCode: 'FSK001',
              stockLocation: '仓库A-1-01',
              applicableModel: 'ThinkPad X1 Carbon Gen10',
              brand: 'Lenovo',
              modelSpec: '5M10Y69781',
              material: '碳纤维复合',
              dimensions: '323x217x3.2',
              weight: 125,
              color: '碳黑色',
              batchNumber: '2305A001',
              productionDate: '2023-05-10',
              shelfLife: '36个月',
              description: 'ThinkPad X1 Carbon Gen10 顶盖，碳纤维材质，含Logo',
              createDate: '2023-01-15',
              modifyDate: '2023-06-20',
              responsiblePerson: '张工程师',
              auditStatus: '已审核'
            },
            {
              partId: 'LNB-P002',
              partName: 'ThinkPad T14 键盘框架',
              category: '机身结构件',
              subCategory: '键盘支撑',
              lifecycle: '量产',
              cost: 850.00,
              stockQuantity: 85,
              safetyStock: 40,
              supplier: '广达电脑',
              supplierCode: 'QUANTA002',
              stockLocation: '仓库A-2-03',
              applicableModel: 'ThinkPad T14 Gen3',
              brand: 'Lenovo',
              modelSpec: '5M10W84275',
              material: '镁铝合金',
              dimensions: '332x227x1.5',
              weight: 180,
              color: '银色',
              batchNumber: '2306B002',
              productionDate: '2023-06-15',
              shelfLife: '36个月',
              description: 'ThinkPad T14 Gen3 键盘框架，镁铝合金材质',
              createDate: '2023-01-20',
              modifyDate: '2023-07-10',
              responsiblePerson: '李工程师',
              auditStatus: '已审核'
            },
            {
              partId: 'LNB-P003',
              partName: 'ThinkPad 通用转轴组件',
              category: '机身结构件',
              subCategory: '转轴',
              lifecycle: '量产',
              cost: 320.00,
              stockQuantity: 200,
              safetyStock: 80,
              supplier: '群光电子',
              supplierCode: 'CHICONY003',
              stockLocation: '仓库B-1-05',
              applicableModel: 'ThinkPad T/X/P系列',
              brand: 'Lenovo',
              modelSpec: '5M10V64123',
              material: '不锈钢',
              dimensions: '25x18x12',
              weight: 45,
              color: '银色',
              batchNumber: '2304C003',
              productionDate: '2023-04-20',
              shelfLife: '48个月',
              description: 'ThinkPad全系列通用双转轴组件，不锈钢材质',
              createDate: '2022-12-05',
              modifyDate: '2023-05-15',
              responsiblePerson: '王工程师',
              auditStatus: '已审核'
            },
            {
              partId: 'LNB-P004',
              partName: 'ThinkPad T14 14寸LCD屏幕',
              category: '显示屏',
              subCategory: 'LCD面板',
              lifecycle: '量产',
              cost: 1850.00,
              stockQuantity: 60,
              safetyStock: 30,
              supplier: '友达光电',
              supplierCode: 'AUO004',
              stockLocation: '仓库C-1-02',
              applicableModel: 'ThinkPad T14 Gen3',
              brand: 'AU Optronics',
              modelSpec: 'B140HTN03.1',
              material: 'IPS LCD',
              dimensions: '309.4x173.9x3.2',
              weight: 250,
              color: '雾面黑',
              batchNumber: '2307D004',
              productionDate: '2023-07-05',
              shelfLife: '24个月',
              description: '14英寸 FHD IPS 防眩光 LCD屏幕，300尼特亮度',
              createDate: '2023-02-10',
              modifyDate: '2023-06-25',
              responsiblePerson: '刘工程师',
              auditStatus: '已审核'
            },
            {
              partId: 'LNB-P005',
              partName: 'ThinkPad X1 Carbon OLED屏幕',
              category: '显示屏',
              subCategory: 'OLED面板',
              lifecycle: '量产',
              cost: 2650.00,
              stockQuantity: 45,
              safetyStock: 20,
              supplier: '三星显示',
              supplierCode: 'SAMSUNG005',
              stockLocation: '仓库C-2-07',
              applicableModel: 'ThinkPad X1 Carbon Gen10',
              brand: 'Samsung',
              modelSpec: 'LTN133HL01-T01',
              material: 'OLED',
              dimensions: '290x165x2.8',
              weight: 210,
              color: '镜面黑',
              batchNumber: '2308E005',
              productionDate: '2023-08-10',
              shelfLife: '24个月',
              description: '13.3英寸 2.8K OLED触控屏幕，400尼特亮度',
              createDate: '2023-03-01',
              modifyDate: '2023-07-05',
              responsiblePerson: '赵工程师',
              auditStatus: '已审核'
            }
          ];
          setAiProcessedData(mockProcessedData);
          
          // 模拟AI预处理结果
          setAiResult({
            dedupList: [
              { duplicateRows: [3, 8, 12], partId: 'LNB-P003' }
            ],
            missingList: [
              { rowIndex: 2, partId: 'LNB-P003', missingFields: ['供应商', '库存位置', '安全库存'] },
              { rowIndex: 4, partId: 'LNB-P005', missingFields: ['库存位置', '批次号'] }
            ]
          });
          setImportProgress(0);
        }, 1500);
      } else if (importStep === 2) {
        // 模拟差异检测
        setImportProgress(50);
        setTimeout(() => {
          // 模拟差异检测结果
          setDiffResult({
            diffList: [
              { index: 0, partId: 'LNB-P001', field: 'cost', currentValue: 1500, mdmValue: 1600 },
              { index: 0, partId: 'LNB-P001', field: 'stockQuantity', currentValue: 120, mdmValue: 115 },
              { index: 0, partId: 'LNB-P001', field: 'supplier', currentValue: '富士康科技集团', mdmValue: '富士康科技集团(更新)' },
              { index: 1, partId: 'LNB-P002', field: 'stockQuantity', currentValue: 85, mdmValue: 95 },
              { index: 1, partId: 'LNB-P002', field: 'category', currentValue: '显示器', mdmValue: '显示屏组件' },
              { index: 1, partId: 'LNB-P002', field: 'shelfLife', currentValue: '24个月', mdmValue: '36个月' },
              { index: 2, partId: 'LNB-P003', field: 'material', currentValue: '铝合金', mdmValue: '航空铝合金' },
              { index: 2, partId: 'LNB-P003', field: 'dimensions', currentValue: '310x210x15', mdmValue: '310x210x16' },
              { index: 3, partId: 'LNB-P004', field: 'cost', currentValue: 1800, mdmValue: 1750 },
              { index: 3, partId: 'LNB-P004', field: 'weight', currentValue: 280, mdmValue: 285 },
              { index: 3, partId: 'LNB-P004', field: 'auditStatus', currentValue: '已审核', mdmValue: '审核中' },
              { index: 4, partId: 'LNB-P005', field: 'stockLocation', currentValue: '仓库C-2-07', mdmValue: '仓库C-3-08' },
              { index: 4, partId: 'LNB-P005', field: 'batchNumber', currentValue: '2308E005', mdmValue: '2309E001' }
            ],
            complianceList: [
              { partId: 'LNB-P001', issue: '成本高于标准成本10%', suggestion: '建议与供应商协商降价' },
              { partId: 'LNB-P005', issue: '库存低于安全库存', suggestion: '建议增加采购订单' },
              { partId: 'LNB-P002', issue: '类别分类不规范', suggestion: '建议使用标准分类体系' },
              { partId: 'LNB-P004', issue: '审核状态异常', suggestion: '请联系质量部门确认' }
            ]
          });
          setImportProgress(0);
        }, 1500);
      } else if (importStep === 3) {
        // 模拟批量写入
        setImportProgress(0);
        const interval = setInterval(() => {
          setImportProgress(prev => {
            const newProgress = prev + 10;
            if (newProgress >= 100) {
              clearInterval(interval);
              // 模拟写入结果
              setWriteResult({
                successCount: 4,
                failCount: 1,
                failRows: [
                  { index: 3, partId: 'LNB-P004', error: '数据库约束冲突' }
                ]
              });
            }
            return newProgress > 100 ? 100 : newProgress;
          });
        }, 200);
      }
    }
  }, [importStep]);

  // 上一步
  const handlePrevStep = useCallback(() => {
    if (importStep > 1) {
      setImportStep(importStep - 1);
    }
  }, [importStep]);

  // 处理AI补全
  const handleAIFill = useCallback((rowIndex) => {
    // 模拟AI补全功能
    setAiResult(prev => ({
      ...prev,
      missingList: prev.missingList.filter(item => item.rowIndex !== rowIndex)
    }));
    notification.success({ message: 'AI补全成功' });
  }, []);

  // 处理差异修正
  const handleAdoptMDM = useCallback((index, field) => {
    // 模拟采纳MDM值
    setDiffResult(prev => ({
      ...prev,
      diffList: prev.diffList.filter(item => !(item.index === index && item.field === field))
    }));
    notification.success({ message: '已采纳MDM值' });
  }, []);

  // 导出结果
  const handleExportResult = useCallback(() => {
    // 模拟导出结果
    notification.success({ message: '结果导出成功' });
  }, []);

  // 重新开始
  const handleRestart = useCallback(() => {
    setImportStep(1);
    setImportFile(null);
    setAiProcessedData([]);
    setAiResult({ dedupList: [], missingList: [] });
    setDiffResult({ diffList: [], complianceList: [] });
    setWriteResult({ successCount: 0, failCount: 0, failRows: [] });
    setImportProgress(0);
  }, []);

  return (
    <div className="part-import-page min-h-screen bg-gray-50 p-4">
      <div className="w-full mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">零件批量导入</h1>
        
        {/* 步骤条 */}
        <div className="w-full">
          <Steps
            current={importStep - 1}
            className="mb-6 w-full"
            items={[
              { title: '上传文件', description: '上传.xlsx或.csv文件', className: 'flex-1' },
              { title: 'AI预处理', description: '自动补全、去重、分类', className: 'flex-1' },
              { title: '差异修正', description: '对比MDM/SAP并修正', className: 'flex-1' },
              { title: '批量写入', description: '写入数据库并同步', className: 'flex-1' },
              { title: '结果导出', description: '导出成功/失败结果', className: 'flex-1' }
            ]}
          />
        </div>

        {/* 进度条 */}
        {importProgress > 0 && importProgress < 100 && (
          <Progress percent={importProgress} status="active" className="mb-6 w-full" />
        )}

        {/* 步骤内容 */}
        <div className="w-full mb-6">
          {/* 步骤1：上传文件 */}
          {importStep === 1 && (
            <div>
              <h3 className="text-lg font-medium mb-4">上传零件数据文件</h3>
              <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300 text-center">
                <Upload.Dragger
                  fileList={importFile ? [{ uid: '1', name: importFile.name, status: 'done' }] : []}
                  beforeUpload={handleFileUpload}
                  customRequest={() => {}}
                  accept=".xlsx,.csv"
                >
                  <p className="ant-upload-drag-icon">
                    <FileExcelOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持 .xlsx 和 .csv 格式文件，最大50MB
                  </p>
                </Upload.Dragger>
                <div className="mt-6 flex justify-center space-x-4">
                  <Button icon={<FileTextOutlined />} onClick={handleDownloadTemplate}>下载模板</Button>
                  <Button icon={<FileTextOutlined />} onClick={handleViewInstructions}>查看说明</Button>
                </div>
              </div>
            </div>
          )}

          {/* 步骤2：AI预处理 */}
          {importStep === 2 && (
            <div>
              <h3 className="text-lg font-medium mb-4">AI预处理结果</h3>
              
              {/* 预处理数据表格 */}
              <div className="mb-6">
                <h4 className="text-md font-medium mb-2">预处理后数据</h4>
                <Table
                  dataSource={aiProcessedData}
                  columns={[
                    { title: '序号', key: 'index', render: (_, __, index) => index + 1 },
                    { title: '零件ID', dataIndex: ['partId'], key: 'partId' },
                    { title: '零件名称', dataIndex: ['partName'], key: 'partName' },
                    { title: '类别', dataIndex: ['category'], key: 'category' },
                    { title: '子类别', dataIndex: ['subCategory'], key: 'subCategory' },
                    { title: '生命周期', dataIndex: ['lifecycle'], key: 'lifecycle' },
                    { title: '成本(元)', dataIndex: ['cost'], key: 'cost' },
                    { title: '库存数量', dataIndex: ['stockQuantity'], key: 'stockQuantity' },
                    { title: '安全库存', dataIndex: ['safetyStock'], key: 'safetyStock' },
                    { title: '供应商代码', dataIndex: ['supplierCode'], key: 'supplierCode' },
                    { title: '供应商名称', dataIndex: ['supplier'], key: 'supplier' },
                    { title: '材质', dataIndex: ['material'], key: 'material' },
                    { title: '尺寸', dataIndex: ['dimensions'], key: 'dimensions' },
                    { title: '重量(g)', dataIndex: ['weight'], key: 'weight' },
                    { title: '批次号', dataIndex: ['batchNumber'], key: 'batchNumber' },
                    { title: '生产日期', dataIndex: ['productionDate'], key: 'productionDate' },
                    { title: '有效期至', dataIndex: ['shelfLife'], key: 'shelfLife' },
                    { title: '位置', dataIndex: ['stockLocation'], key: 'stockLocation' },
                    { title: '状态', dataIndex: ['auditStatus'], key: 'auditStatus' },
                    { title: '描述', dataIndex: ['description'], key: 'description' },
                  ]}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  scroll={{ x: 1200 }}
                />
              </div>

              {/* 预处理提示卡片 */}
              <div className="space-y-4">
                {aiResult.dedupList.length > 0 && (
                  <Card title="重复数据检测" type="inner">
                    <div className="text-sm">
                      {aiResult.dedupList.map((item, index) => (
                        <div key={index} className="mb-2">
                          <p>发现重复行：第{item.duplicateRows.join('、')}行</p>
                          <Button size="small" type="link">一键合并</Button>
                          <Button size="small" type="link">忽略</Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {aiResult.missingList.length > 0 && (
                  <Card title="缺失字段补全" type="inner">
                    <div className="text-sm">
                      {aiResult.missingList.map((item, index) => (
                        <div key={index} className="mb-2">
                          <p>第{item.rowIndex + 1}行缺失字段：{item.missingFields.join('、')}</p>
                          <Button size="small" type="link" onClick={() => handleAIFill(item.rowIndex)}>AI补全</Button>
                          <Button size="small" type="link">手动填写</Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* 步骤3：差异修正 */}
          {importStep === 3 && (
            <div>
              <h3 className="text-lg font-medium mb-4">差异检测与修正</h3>
              
              {/* 差异数据表格 */}
              <div className="mb-6">
                <h4 className="text-md font-medium mb-2">差异数据（红色标注）</h4>
                <Table
                  dataSource={aiProcessedData}
                  columns={[
                    { title: '序号', key: 'index', render: (_, __, index) => index + 1 },
                    { title: '零件ID', 
                      dataIndex: ['partId'], 
                      key: 'partId',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'partId');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '零件名称', 
                      dataIndex: ['partName'], 
                      key: 'partName',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'partName');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '类别', 
                      dataIndex: ['category'], 
                      key: 'category',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'category');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '子类别', 
                      dataIndex: ['subCategory'], 
                      key: 'subCategory',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'subCategory');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '生命周期', 
                      dataIndex: ['lifeCycle'], 
                      key: 'lifeCycle',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'lifeCycle');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '成本(元)', 
                      dataIndex: ['cost'], 
                      key: 'cost',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'cost');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '库存数量', 
                      dataIndex: ['stockQuantity'], 
                      key: 'stockQuantity',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'stockQuantity');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '安全库存', 
                      dataIndex: ['safetyStock'], 
                      key: 'safetyStock',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'safetyStock');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '供应商', 
                      dataIndex: ['supplier'], 
                      key: 'supplier',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'supplier');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '供应商代码', 
                      dataIndex: ['supplierCode'], 
                      key: 'supplierCode',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'supplierCode');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '材质', 
                      dataIndex: ['material'], 
                      key: 'material',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'material');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '尺寸', 
                      dataIndex: ['dimensions'], 
                      key: 'dimensions',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'dimensions');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '重量(g)', 
                      dataIndex: ['weight'], 
                      key: 'weight',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'weight');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '批次号', 
                      dataIndex: ['batchNumber'], 
                      key: 'batchNumber',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'batchNumber');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '生产日期', 
                      dataIndex: ['productionDate'], 
                      key: 'productionDate',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'productionDate');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '有效期至', 
                      dataIndex: ['shelfLife'], 
                      key: 'shelfLife',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'shelfLife');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '存放位置', 
                      dataIndex: ['stockLocation'], 
                      key: 'stockLocation',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'stockLocation');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '状态', 
                      dataIndex: ['auditStatus'], 
                      key: 'auditStatus',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'auditStatus');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                  ]}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  scroll={{ x: 1200 }}
                />
              </div>

              {/* 差异提示卡片 */}
              <div className="space-y-4">
                {diffResult.diffList.length > 0 && (
                  <Card title="差异列表" type="inner">
                    <div className="text-sm">
                      {diffResult.diffList.map((diff, index) => {
                        // 字段名称映射，将英文字段名转换为中文显示
                        const fieldNameMap = {
                          'partId': '零件ID',
                          'partName': '零件名称',
                          'category': '类别',
                          'subCategory': '子类别',
                          'lifecycle': '生命周期',
                          'cost': '成本(元)',
                          'stockQuantity': '库存数量',
                          'safetyStock': '安全库存',
                          'supplier': '供应商',
                          'supplierCode': '供应商代码',
                          'material': '材质',
                          'dimensions': '尺寸',
                          'weight': '重量(g)',
                          'batchNumber': '批次号',
                          'productionDate': '生产日期',
                          'shelfLife': '保质期',
                          'stockLocation': '库存位置',
                          'auditStatus': '审核状态',
                          'description': '描述',
                          'createDate': '创建日期',
                          'modifyDate': '修改日期',
                          'responsiblePerson': '负责人',
                          'applicableModel': '适用机型',
                          'brand': '品牌',
                          'modelSpec': '型号规格'
                        };
                        return (
                          <div key={index} className="mb-2">
                            <p>第{diff.index + 1}行 - {fieldNameMap[diff.field] || diff.field}：当前值 {diff.currentValue} vs MDM值 {diff.mdmValue}</p>
                            <Button size="small" type="link" onClick={() => handleAdoptMDM(diff.index, diff.field)}>采纳MDM值</Button>
                            <Button size="small" type="link">保持当前值</Button>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
                {diffResult.complianceList.length > 0 && (
                  <Card title="合规提示" type="inner" className="bg-yellow-50">
                    <div className="text-sm">
                      {diffResult.complianceList.map((item, index) => (
                        <div key={index} className="mb-2">
                          <p>零件 {item.partId}：{item.issue}</p>
                          <p>建议：{item.suggestion}</p>
                          <Button size="small" type="link">一键替换</Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* 步骤4：批量写入 */}
          {importStep === 4 && (
            <div>
              <h3 className="text-lg font-medium mb-4">批量写入进度</h3>
              
              {importProgress < 100 ? (
                <div className="text-center py-8">
                  <Spin size="large" />
                  <p className="mt-4">正在写入数据，请稍候...</p>
                </div>
              ) : (
                <div>
                  <div className="bg-green-50 p-4 rounded-lg mb-4">
                    <p className="text-green-700 font-medium">
                      批量写入完成！成功：{writeResult.successCount}条，失败：{writeResult.failCount}条
                    </p>
                  </div>
                  
                  {writeResult.failRows.length > 0 && (
                    <Card title="失败详情" type="inner">
                      <Table
                        dataSource={writeResult.failRows}
                        columns={[
                          { title: '序号', dataIndex: ['index'], key: 'index', render: (val) => val + 1 },
                          { title: '零件ID', dataIndex: ['partId'], key: 'partId' },
                          { title: '失败原因', dataIndex: ['error'], key: 'error' },
                        ]}
                        pagination={{ pageSize: 5 }}
                        size="small"
                        scroll={{ x: 800 }}
                      />
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 步骤5：结果导出 */}
          {importStep === 5 && (
            <div className="text-center py-8">
              <div className="mb-6">
                <CheckOutlined style={{ fontSize: '64px', color: '#52c41a' }} />
                <h3 className="text-xl font-medium mt-4">导入任务已完成</h3>
                <p className="text-gray-600 mt-2">成功：{writeResult.successCount}条，失败：{writeResult.failCount}条</p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button type="primary" icon={<FileExcelOutlined />} onClick={handleExportResult}>
                  导出结果
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleRestart}>
                  重新导入
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 步骤导航按钮 */}
          <div className="flex justify-between mt-6">
            {/* 上一步按钮 - 除了第1步都显示 */}
            {importStep > 1 && (importProgress === 0 || importProgress === 100) && (
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={handlePrevStep}
              >
                上一步
              </Button>
            )}
            
            {/* 空div用于保持对齐 */}
            {importStep === 1 && <div></div>}
            
            {/* 下一步/完成按钮 */}
            {importStep < 5 && (importProgress === 0 || importProgress === 100) && (
              <Button 
                type="primary" 
                icon={<ArrowRightOutlined />} 
                onClick={handleNextStep}
                disabled={importStep === 1 && !importFile}
              >
                {importStep === 4 ? '完成' : '下一步'}
              </Button>
            )}
          
          {/* 第5步（结果导出）特殊导航 */}
          {importStep === 5 && (
            <div className="flex space-x-4">
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={handlePrevStep}
              >
                返回批量写入
              </Button>
              <Button type="primary" icon={<ReloadOutlined />} onClick={handleRestart}>
                重新导入
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartImportPage;