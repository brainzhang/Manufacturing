// 合规BOM树模拟数据
// 定义本地 ComplianceStatus 类型，避免引入不存在的模块
type ComplianceStatus = 'compliant' | 'expiring' | 'missing';

export interface ComplianceTreeNode {
  id: string;
  name: string;
  position: string;
  status: ComplianceStatus;
  expireDate?: string;
  certificateExpiry?: string;
  children?: ComplianceTreeNode[];
}

// 生成未来日期
const generateFutureDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// 生成过去日期
const generatePastDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

// 模拟合规BOM树数据
export const complianceBOMTreeData: ComplianceTreeNode[] = [
  {
    id: '1',
    name: '主产品',
    position: '1',
    status: 'compliant',
    children: [
      {
        id: '1-1',
        name: '主板模块',
        position: '1.1',
        status: 'compliant',
        children: [
          {
            id: '1-1-1',
            name: 'CPU',
            position: '1.1.1',
            status: 'expiring',
            expireDate: generateFutureDate(60), // 60天后到期
            children: [
              {
                id: '1-1-1-1',
                name: 'Intel Core i7',
                position: '1.1.1.1',
                status: 'expiring',
                certificateExpiry: generateFutureDate(60)
              }
            ]
          },
          {
            id: '1-1-2',
            name: '内存',
            position: '1.1.2',
            status: 'compliant',
            children: [
              {
                id: '1-1-2-1',
                name: '16GB DDR4',
                position: '1.1.2.1',
                status: 'compliant',
                certificateExpiry: generateFutureDate(180)
              }
            ]
          }
        ]
      },
      {
        id: '1-2',
        name: '显示模块',
        position: '1.2',
        status: 'missing',
        children: [
          {
            id: '1-2-1',
            name: 'LCD面板',
            position: '1.2.1',
            status: 'missing',
            children: [
              {
                id: '1-2-1-1',
                name: '15.6英寸FHD',
                position: '1.2.1.1',
                status: 'missing'
              }
            ]
          },
          {
            id: '1-2-2',
            name: '显卡',
            position: '1.2.2',
            status: 'compliant',
            children: [
              {
                id: '1-2-2-1',
                name: 'NVIDIA GTX 1650',
                position: '1.2.2.1',
                status: 'compliant',
                certificateExpiry: generateFutureDate(240)
              }
            ]
          }
        ]
      },
      {
        id: '1-3',
        name: '电源模块',
        position: '1.3',
        status: 'expiring',
        expireDate: generateFutureDate(30), // 30天后到期
        children: [
          {
            id: '1-3-1',
            name: '电池',
            position: '1.3.1',
            status: 'expiring',
            certificateExpiry: generateFutureDate(30)
          },
          {
            id: '1-3-2',
            name: '适配器',
            position: '1.3.2',
            status: 'compliant',
            certificateExpiry: generateFutureDate(200)
          }
        ]
      }
    ]
  },
  {
    id: '2',
    name: '配件套装',
    position: '2',
    status: 'compliant',
    children: [
      {
        id: '2-1',
        name: '键盘',
        position: '2.1',
        status: 'compliant',
        certificateExpiry: generateFutureDate(150)
      },
      {
        id: '2-2',
        name: '鼠标',
        position: '2.2',
        status: 'expiring',
        certificateExpiry: generateFutureDate(85) // 85天后到期
      }
    ]
  }
];

// 模拟合规表格数据
export const complianceTableData = [
  {
    key: '1-1-1-1',
    position: '1.1.1.1',
    partName: 'Intel Core i7',
    quantity: 1,
    unit: '个',
    cost: 2500,
    supplier: 'Intel官方',
    difference: 0,
    lifecycle: 'Active',
    status: 'expiring',
    certificateExpiry: generateFutureDate(60),
    operation: ['查看', '替换']
  },
  {
    key: '1-1-2-1',
    position: '1.1.2.1',
    partName: '16GB DDR4',
    quantity: 2,
    unit: '条',
    cost: 800,
    supplier: '三星电子',
    difference: 0,
    lifecycle: 'Active',
    status: 'compliant',
    certificateExpiry: generateFutureDate(180),
    operation: ['查看', '替换']
  },
  {
    key: '1-2-1-1',
    position: '1.2.1.1',
    partName: '15.6英寸FHD',
    quantity: 1,
    unit: '个',
    cost: 1200,
    supplier: 'LG Display',
    difference: 0,
    lifecycle: 'Active',
    status: 'missing',
    certificateExpiry: '',
    operation: ['查看', '替换']
  },
  {
    key: '1-2-2-1',
    position: '1.2.2.1',
    partName: 'NVIDIA GTX 1650',
    quantity: 1,
    unit: '个',
    cost: 1800,
    supplier: 'NVIDIA',
    difference: 0,
    lifecycle: 'Active',
    status: 'compliant',
    certificateExpiry: generateFutureDate(240),
    operation: ['查看', '替换']
  },
  {
    key: '1-3-1',
    position: '1.3.1',
    partName: '电池',
    quantity: 1,
    unit: '个',
    cost: 600,
    supplier: '索尼电池',
    difference: 0,
    lifecycle: 'Active',
    status: 'expiring',
    certificateExpiry: generateFutureDate(30),
    operation: ['查看', '替换']
  },
  {
    key: '1-3-2',
    position: '1.3.2',
    partName: '适配器',
    quantity: 1,
    unit: '个',
    cost: 300,
    supplier: '绿巨能',
    difference: 0,
    lifecycle: 'Active',
    status: 'compliant',
    certificateExpiry: generateFutureDate(200),
    operation: ['查看', '替换']
  },
  {
    key: '2-1',
    position: '2.1',
    partName: '键盘',
    quantity: 1,
    unit: '个',
    cost: 200,
    supplier: '罗技',
    difference: 0,
    lifecycle: 'Active',
    status: 'compliant',
    certificateExpiry: generateFutureDate(150),
    operation: ['查看', '替换']
  },
  {
    key: '2-2',
    position: '2.2',
    partName: '鼠标',
    quantity: 1,
    unit: '个',
    cost: 150,
    supplier: '罗技',
    difference: 0,
    lifecycle: 'Active',
    status: 'expiring',
    certificateExpiry: generateFutureDate(85),
    operation: ['查看', '替换']
  }
];

// 模拟合规趋势数据
export const complianceTrendData = [
  { date: '2024-01', rate: 95 },
  { date: '2024-02', rate: 92 },
  { date: '2024-03', rate: 93 },
  { date: '2024-04', rate: 91 },
  { date: '2024-05', rate: 94 },
  { date: '2024-06', rate: 90 }
];

// 模拟合规警告数据
export const complianceWarnings = [
  {
    type: 'certificate-expiring',
    title: '证书即将到期',
    count: 3,
    description: '有3个组件的合规证书将在90天内到期'
  },
  {
    type: 'missing-cert',
    title: '缺失认证',
    count: 1,
    description: '有1个组件缺失必要的合规认证'
  },
  {
    type: 'supplier-compliance',
    title: '供应商合规问题',
    count: 0,
    description: '当前无供应商合规问题'
  }
];