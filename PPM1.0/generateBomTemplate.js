const XLSX = require('xlsx');

// 联想电脑BOM模板数据
const bomTemplate = [
  // 表头
  [
    'BOM名称',
    '产品型号',
    '产品序列号',
    'BOM版本',
    '层级',
    '物料数',
    '差异',
    '对齐',
    '状态',
    '总成本',
    '同步状态',
    '修改时间',
    '修改人',
    'SAP BOM ID'
  ],
  // ThinkPad X1 Carbon BOM数据 - 10条
  [
    'ThinkPad X1 Carbon BOM-Gen11',
    'ThinkPad X1 Carbon-2023款',
    'SN-TP-X1-2023-001',
    'V11.3',
    5,
    128,
    2,
    'HIGH',
    '已批准',
    12999.00,
    '已同步',
    '2023-08-15 14:30',
    '张工程师',
    'SAP-BOM-TP-X1-20230815'
  ],
  [
    'ThinkPad X1 Carbon BOM-Gen11',
    'ThinkPad X1 Carbon-2023款',
    'SN-TP-X1-2023-002',
    'V11.3',
    5,
    128,
    0,
    'NONE',
    'SYNCED',
    12999.00,
    '已同步',
    '2023-09-10 16:45',
    '李工程师',
    'SAP-BOM-TP-X1-20230910'
  ],
  [
    'ThinkPad X1 Carbon BOM-Gen11',
    'ThinkPad X1 Carbon-2023款',
    'SN-TP-X1-2023-003',
    'V11.2',
    5,
    126,
    3,
    'MEDIUM',
    '已批准',
    12850.00,
    '待同步',
    '2023-07-22 10:15',
    '王工程师',
    'SAP-BOM-TP-X1-20230722'
  ],
  [
    'ThinkPad X1 Carbon BOM-Gen11',
    'ThinkPad X1 Carbon-2023款',
    'SN-TP-X1-2023-004',
    'V11.1',
    5,
    124,
    5,
    'HIGH',
    '已批准',
    12800.00,
    '已同步',
    '2023-06-18 09:20',
    '赵工程师',
    'SAP-BOM-TP-X1-20230618'
  ],
  [
    'ThinkPad X1 Carbon BOM-Gen10',
    'ThinkPad X1 Carbon-2022款',
    'SN-TP-X1-2022-001',
    'V10.8',
    5,
    122,
    0,
    'NONE',
    '已作废',
    12750.00,
    '已同步',
    '2022-11-05 14:10',
    '周工程师',
    'SAP-BOM-TP-X1-20221105'
  ],
  // ThinkPad T14 BOM数据 - 10条
  [
    'ThinkPad T14 BOM-Gen3',
    'ThinkPad T14-2023款',
    'SN-TP-T14-2023-001',
    'V3.5',
    4,
    95,
    1,
    'LOW',
    '已批准',
    8799.00,
    '已同步',
    '2023-08-22 11:45',
    '吴工程师',
    'SAP-BOM-TP-T14-20230822'
  ],
  [
    'ThinkPad T14 BOM-Gen3',
    'ThinkPad T14-2023款',
    'SN-TP-T14-2023-002',
    'V3.5',
    4,
    95,
    0,
    'NONE',
    'SYNCED',
    8799.00,
    '已同步',
    '2023-09-15 15:30',
    '郑工程师',
    'SAP-BOM-TP-T14-20230915'
  ],
  [
    'ThinkPad T14 BOM-Gen2',
    'ThinkPad T14-2022款',
    'SN-TP-T14-2022-001',
    'V2.9',
    4,
    92,
    4,
    'MEDIUM',
    '已批准',
    8499.00,
    '待同步',
    '2022-12-10 10:20',
    '钱工程师',
    'SAP-BOM-TP-T14-20221210'
  ],
  [
    'ThinkPad T14 BOM-Gen2',
    'ThinkPad T14-2022款',
    'SN-TP-T14-2022-002',
    'V2.8',
    4,
    91,
    0,
    'NONE',
    '已作废',
    8399.00,
    '已同步',
    '2022-10-08 16:40',
    '孙工程师',
    'SAP-BOM-TP-T14-20221008'
  ],
  [
    'ThinkPad T14 BOM-Gen2',
    'ThinkPad T14-2022款',
    'SN-TP-T14-2022-003',
    'V2.7',
    4,
    89,
    2,
    'LOW',
    '草稿',
    8299.00,
    '待同步',
    '2022-08-25 13:15',
    '李工程师',
    'SAP-BOM-TP-T14-20220825'
  ],
  [
    'ThinkPad T14 BOM-Gen2',
    'ThinkPad T14-2022款',
    'SN-TP-T14-2022-004',
    'V2.7',
    4,
    89,
    0,
    'NONE',
    '已驳回',
    8299.00,
    '待同步',
    '2022-07-18 09:45',
    '王工程师',
    'SAP-BOM-TP-T14-20220718'
  ],
  // ThinkBook 16p BOM数据 - 5条
  [
    'ThinkBook 16p BOM-Gen2',
    'ThinkBook 16p-2023款',
    'SN-TB-16p-2023-001',
    'V2.3',
    4,
    88,
    0,
    'NONE',
    'SYNCED',
    7499.00,
    '已同步',
    '2023-08-30 14:20',
    '陈工程师',
    'SAP-BOM-TB-16p-20230830'
  ],
  [
    'ThinkBook 16p BOM-Gen2',
    'ThinkBook 16p-2023款',
    'SN-TB-16p-2023-002',
    'V2.2',
    4,
    86,
    3,
    'MEDIUM',
    '已批准',
    7399.00,
    '待同步',
    '2023-07-12 10:55',
    '杨工程师',
    'SAP-BOM-TB-16p-20230712'
  ],
  [
    'ThinkBook 16p BOM-Gen2',
    'ThinkBook 16p-2023款',
    'SN-TB-16p-2023-003',
    'V2.2',
    4,
    86,
    0,
    'NONE',
    '已驳回',
    7399.00,
    '待同步',
    '2023-06-05 16:30',
    '黄工程师',
    'SAP-BOM-TB-16p-20230605'
  ],
  [
    'ThinkBook 16p BOM-Gen1',
    'ThinkBook 16p-2022款',
    'SN-TB-16p-2022-001',
    'V1.8',
    4,
    84,
    2,
    'LOW',
    '已批准',
    7199.00,
    '已同步',
    '2022-11-22 11:15',
    '林工程师',
    'SAP-BOM-TB-16p-20221122'
  ],
  [
    'ThinkBook 16p BOM-Gen1',
    'ThinkBook 16p-2022款',
    'SN-TB-16p-2022-002',
    'V1.7',
    4,
    82,
    0,
    'NONE',
    '已作废',
    6999.00,
    '已同步',
    '2022-09-10 15:40',
    '张工程师',
    'SAP-BOM-TB-16p-20220910'
  ]
];

// 创建工作簿
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(bomTemplate);

// 设置列宽
const colWidths = [
  { wch: 25 }, // BOM名称
  { wch: 20 }, // 产品型号
  { wch: 20 }, // 产品序列号
  { wch: 10 }, // BOM版本
  { wch: 8 },  // 层级
  { wch: 8 },  // 物料数
  { wch: 8 },  // 差异
  { wch: 8 },  // 对齐
  { wch: 10 }, // 状态
  { wch: 10 }, // 总成本
  { wch: 10 }, // 同步状态
  { wch: 20 }, // 修改时间
  { wch: 10 }, // 修改人
  { wch: 20 }  // SAP BOM ID
];
ws['!cols'] = colWidths;

// 添加工作表到工作簿
XLSX.utils.book_append_sheet(wb, ws, "联想电脑BOM导入模板");

// 写入文件
const fileName = '联想电脑BOM导入模板.xlsx';
XLSX.writeFile(wb, fileName);

console.log(`已生成 ${fileName} 文件，包含${bomTemplate.length - 1}条BOM数据`);