// 生成随机数的辅助函数

// 生成随机数的辅助函数
const randomInRange = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloatInRange = (min: number, max: number, decimals: number = 2): number => 
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// 生成月份数组
const generateMonths = (count: number = 12): string[] => {
  const months = [];
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }
  
  return months;
};

// 生成多层级树结构的辅助函数
const generateTreeStructure = (depth: number, prefix: string, partName: string, cost: number): any => {
  if (depth <= 0) {
    return null;
  }
  
  const node: any = {
    key: prefix,
    title: `${partName}`,
    position: `${prefix}POS`,
    partName: `${partName}`,
    currentCost: cost,
    targetCost: cost * 0.95
  };
  
  if (depth > 1) {
    node.children = [
      generateTreeStructure(depth - 1, `${prefix}-1`, `${partName}子部件1`, cost * 0.6),
      generateTreeStructure(depth - 1, `${prefix}-2`, `${partName}子部件2`, cost * 0.4)
    ];
  }
  
  return node;
};

// Mock成本树数据 - 7层深度
export const mockCostTreeData: any[] = [
  {
    key: 'ASM001',
    title: 'ThinkPad X1 Carbon 主装配',
    position: 'ASM001',
    partName: 'ThinkPad X1 Carbon 主装配',
    currentCost: 12850,
    targetCost: 12500,
    children: [
      {
        key: 'A1',
        title: '上盖组件',
        position: 'TOP001',
        partName: '镁铝合金上盖组件',
        currentCost: 1850,
        targetCost: 1700,
        children: [
          {
            key: 'A1-1',
            title: '上盖本体',
            position: 'TOP-01',
            partName: '镁铝合金上盖',
            currentCost: 1200,
            targetCost: 1100,
            children: [
              {
                key: 'A1-1-1',
                title: '外表面处理',
                position: 'TOP-FIN',
                partName: '阳极氧化表面处理',
                currentCost: 300,
                targetCost: 280,
                children: [
                  {
                    key: 'A1-1-1-1',
                    title: '底漆层',
                    position: 'TOP-PRIMER',
                    partName: '防护底漆',
                    currentCost: 80,
                    targetCost: 75,
                    children: [
                      {
                        key: 'A1-1-1-1-1',
                        title: '底涂层材料',
                        position: 'TOP-MAT',
                        partName: '环保底漆材料',
                        currentCost: 40,
                        targetCost: 38,
                        children: [
                          {
                            key: 'A1-1-1-1-1-1',
                            title: '树脂成分',
                            position: 'TOP-RESIN',
                            partName: '环氧树脂基料',
                            currentCost: 25,
                            targetCost: 23
                          },
                          {
                            key: 'A1-1-1-1-1-2',
                            title: '硬化剂',
                            position: 'TOP-HARD',
                            partName: '环保型硬化剂',
                            currentCost: 15,
                            targetCost: 15
                          }
                        ]
                      },
                      {
                        key: 'A1-1-1-1-2',
                        title: '涂层工艺',
                        position: 'TOP-PROC',
                        partName: '静电喷涂工艺',
                        currentCost: 40,
                        targetCost: 37
                      }
                    ]
                  },
                  {
                    key: 'A1-1-1-2',
                    title: '面漆层',
                    position: 'TOP-TOP',
                    partName: 'ThinkPad黑色面漆',
                    currentCost: 220,
                    targetCost: 205,
                    children: [
                      {
                        key: 'A1-1-1-2-1',
                        title: '面漆材料',
                        position: 'TOP-FINMAT',
                        partName: '高光泽面漆',
                        currentCost: 150,
                        targetCost: 140,
                        children: [
                          {
                            key: 'A1-1-1-2-1-1',
                            title: '着色剂',
                            position: 'TOP-COLOR',
                            partName: '黑色纳米颜料',
                            currentCost: 80,
                            targetCost: 75
                          },
                          {
                            key: 'A1-1-1-2-1-2',
                            title: '基料',
                            position: 'TOP-BASE',
                            partName: 'UV固化基料',
                            currentCost: 70,
                            targetCost: 65
                          }
                        ]
                      },
                      {
                        key: 'A1-1-1-2-2',
                        title: '表面处理',
                        position: 'TOP-FINISH',
                        partName: '抛光处理',
                        currentCost: 70,
                        targetCost: 65
                      }
                    ]
                  }
                ]
              },
              {
                key: 'A1-1-2',
                title: '结构框架',
                position: 'TOP-FRAME',
                partName: '镁铝合金骨架',
                currentCost: 900,
                targetCost: 820,
                children: [
                  {
                    key: 'A1-1-2-1',
                    title: '原材料',
                    position: 'TOP-MATERIAL',
                    partName: '航空级镁铝合金',
                    currentCost: 500,
                    targetCost: 450,
                    children: [
                      {
                        key: 'A1-1-2-1-1',
                        title: '铝材成分',
                        position: 'TOP-AL',
                        partName: '6061铝合金',
                        currentCost: 300,
                        targetCost: 270,
                        children: [
                          {
                            key: 'A1-1-2-1-1-1',
                            title: '铝含量',
                            position: 'TOP-AL-MAIN',
                            partName: '高纯铝',
                            currentCost: 200,
                            targetCost: 180
                          },
                          {
                            key: 'A1-1-2-1-1-2',
                            title: '合金元素',
                            position: 'TOP-AL-ALLOY',
                            partName: '镁锌合金元素',
                            currentCost: 100,
                            targetCost: 90
                          }
                        ]
                      },
                      {
                        key: 'A1-1-2-1-2',
                        title: '加工处理',
                        position: 'TOP-PROCESS',
                        partName: '热处理工艺',
                        currentCost: 200,
                        targetCost: 180
                      }
                    ]
                  },
                  {
                    key: 'A1-1-2-2',
                    title: '成型工艺',
                    position: 'TOP-FORMING',
                    partName: 'CNC精密加工',
                    currentCost: 400,
                    targetCost: 370,
                    children: [
                      {
                        key: 'A1-1-2-2-1',
                        title: 'CNC加工',
                        position: 'TOP-CNC',
                        partName: '5轴CNC加工',
                        currentCost: 250,
                        targetCost: 230,
                        children: [
                          {
                            key: 'A1-1-2-2-1-1',
                            title: '编程费用',
                            position: 'TOP-CNC-PRG',
                            partName: 'CNC加工程序',
                            currentCost: 50,
                            targetCost: 45
                          },
                          {
                            key: 'A1-1-2-2-1-2',
                            title: '机床操作',
                            position: 'TOP-CNC-OP',
                            partName: 'CNC设备运行',
                            currentCost: 200,
                            targetCost: 185
                          }
                        ]
                      },
                      {
                        key: 'A1-1-2-2-2',
                        title: '表面处理',
                        position: 'TOP-SURFACE',
                        partName: '精密抛光',
                        currentCost: 150,
                        targetCost: 140
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            key: 'A1-2',
            title: 'Logo',
            position: 'LOGO',
            partName: 'ThinkPad Logo',
            currentCost: 150,
            targetCost: 150,
            children: [
              {
                key: 'A1-2-1',
                title: 'Logo主体',
                position: 'LOGO-MAIN',
                partName: '金属Logo',
                currentCost: 100,
                targetCost: 100,
                children: [
                  {
                    key: 'A1-2-1-1',
                    title: 'Logo材料',
                    position: 'LOGO-MAT',
                    partName: '不锈钢材质',
                    currentCost: 50,
                    targetCost: 50,
                    children: [
                      {
                        key: 'A1-2-1-1-1',
                        title: '不锈钢基材',
                        position: 'LOGO-SS',
                        partName: '304不锈钢',
                        currentCost: 30,
                        targetCost: 30
                      },
                      {
                        key: 'A1-2-1-1-2',
                        title: '表面镀层',
                        position: 'LOGO-PLATE',
                        partName: '镀铬处理',
                        currentCost: 20,
                        targetCost: 20
                      }
                    ]
                  },
                  {
                    key: 'A1-2-1-2',
                    title: 'Logo加工',
                    position: 'LOGO-PROC',
                    partName: '激光蚀刻',
                    currentCost: 50,
                    targetCost: 50
                  }
                ]
              },
              {
                key: 'A1-2-2',
                title: '背胶',
                position: 'LOGO-ADHESIVE',
                partName: '高强度3M背胶',
                currentCost: 50,
                targetCost: 50
              }
            ]
          }
        ]
      },
      {
        key: 'A2',
        title: '显示组件',
        position: 'LCD001',
        partName: '14寸OLED显示屏组件',
        currentCost: 3200,
        targetCost: 3000
      },
      {
        key: 'A3',
        title: '主板组件',
        position: 'MB001',
        partName: '系统主板组件',
        currentCost: 4500,
        targetCost: 4200,
        children: [
          {
            key: 'A3-1',
            title: 'CPU',
            position: 'U1',
            partName: 'Intel Core i7-1555U',
            currentCost: 2200,
            targetCost: 1800
          },
          {
            key: 'A3-2',
            title: '内存',
            position: 'RAM',
            partName: '16GB LPDDR5 RAM',
            currentCost: 850,
            targetCost: 800
          },
          {
            key: 'A3-3',
            title: '电源管理',
            position: 'PMIC',
            partName: '电源管理电路',
            currentCost: 350,
            targetCost: 320
          }
        ]
      },
      {
        key: 'A4',
        title: '输入组件',
        position: 'INPUT001',
        partName: '键盘触控板组件',
        currentCost: 800,
        targetCost: 750
      },
      {
        key: 'A5',
        title: '接口组件',
        position: 'IO001',
        partName: 'IO接口组件',
        currentCost: 600,
        targetCost: 550
      },
      {
        key: 'A6',
        title: '音频组件',
        position: 'AUDIO001',
        partName: '音频系统组件',
        currentCost: 400,
        targetCost: 380
      },
      {
        key: 'A7',
        title: '存储组件',
        position: 'SSD001',
        partName: 'NVMe SSD组件',
        currentCost: 1500,
        targetCost: 1400
      }
    ]
  }
];

// Mock成本漂移数据
export const mockCostDriftData: any[] = [
  {
    id: '1',
    position: 'U1',
    partName: 'Intel Core i7-1555U',
    currentCost: 2200,
    targetCost: 1800,
    lifecycle: 'PhaseOut',
    supplier: 'Intel'
  },
  {
    id: '2',
    position: 'TOP-01',
    partName: '镁铝合金上盖',
    currentCost: 1200,
    targetCost: 1100,
    lifecycle: 'Production',
    supplier: 'Foxconn'
  },
  {
    id: '3',
    position: 'LCD001',
    partName: '14寸OLED显示屏组件',
    currentCost: 3200,
    targetCost: 3000,
    lifecycle: 'Production',
    supplier: 'BOE'
  },
  {
    id: '4',
    position: 'RAM',
    partName: '16GB LPDDR5 RAM',
    currentCost: 850,
    targetCost: 800,
    lifecycle: 'Production',
    supplier: 'Samsung'
  },
  {
    id: '5',
    position: 'SSD001',
    partName: 'NVMe SSD组件',
    currentCost: 1500,
    targetCost: 1400,
    lifecycle: 'PhaseIn',
    supplier: 'Western Digital'
  },
  {
    id: '6',
    position: 'PMIC',
    partName: '电源管理电路',
    currentCost: 350,
    targetCost: 320,
    lifecycle: 'Production',
    supplier: 'Texas Instruments'
  },
  {
    id: '7',
    position: 'KB',
    partName: '背光键盘',
    currentCost: 450,
    targetCost: 420,
    lifecycle: 'Production',
    supplier: 'Sunrex'
  },
  {
    id: '8',
    position: 'TP',
    partName: '触控板组件',
    currentCost: 250,
    targetCost: 230,
    lifecycle: 'Production',
    supplier: 'Sunrex'
  },
  {
    id: '9',
    position: 'USB',
    partName: 'USB接口扩展板',
    currentCost: 200,
    targetCost: 180,
    lifecycle: 'Production',
    supplier: 'LiteOn'
  },
  {
    id: '10',
    position: 'SPK',
    partName: '立体声扬声器',
    currentCost: 250,
    targetCost: 240,
    lifecycle: 'Production',
    supplier: 'Dynaudio'
  },
  {
    id: '11',
    position: 'SDCARD',
    partName: 'SD读卡器模块',
    currentCost: 120,
    targetCost: 100,
    lifecycle: 'Production',
    supplier: 'Realtek'
  },
  {
    id: '12',
    position: 'WIFI',
    partName: 'Wi-Fi 6E模块',
    currentCost: 280,
    targetCost: 260,
    lifecycle: 'PhaseIn',
    supplier: 'Intel'
  },
  {
    id: '13',
    position: 'BATT',
    partName: '电池组',
    currentCost: 750,
    targetCost: 700,
    lifecycle: 'Production',
    supplier: 'LG Chem'
  },
  {
    id: '14',
    position: 'FAN',
    partName: '散热风扇',
    currentCost: 180,
    targetCost: 170,
    lifecycle: 'Production',
    supplier: 'Delta'
  },
  {
    id: '15',
    position: 'HEATSINK',
    partName: '散热片组件',
    currentCost: 220,
    targetCost: 200,
    lifecycle: 'Production',
    supplier: 'Aavid'
  }
];

// Mock成本历史数据
export const generateMockCostHistory = (baseCost: number, months: string[] = generateMonths()): any[] => {
  return months.map(month => {
    const variation = randomFloatInRange(-0.05, 0.08);
    const standardPrice = baseCost * (1 + variation);
    
    return {
      month,
      standardPrice: parseFloat(standardPrice.toFixed(2)),
      averagePrice: parseFloat((standardPrice * randomFloatInRange(0.95, 1.05)).toFixed(2)),
      contractPrice: parseFloat((standardPrice * randomFloatInRange(0.9, 1.0)).toFixed(2))
    };
  });
};

// Mock供应商数据
export const generateMockSupplierData = (count: number = 3): any[] => {
  const suppliers = ['Foxconn', 'Pegatron', 'Wistron', 'Compal', 'Quanta'];
  const total = 100;
  let remaining = total;
  const data: any[] = [];
  
  for (let i = 0; i < count - 1; i++) {
    const value = randomInRange(10, Math.floor(remaining / 2));
    remaining -= value;
    data.push({
      name: suppliers[i],
      value,
      percentage: parseFloat((value / total * 100).toFixed(1))
    });
  }
  
  // 添加最后一个供应商
  data.push({
    name: suppliers[count - 1],
    value: remaining,
    percentage: parseFloat((remaining / total * 100).toFixed(1))
  });
  
  return data;
};

// Mock零件详情
export const generateMockPartDetail = (id: string, position: string, partName: string): any => {
  const baseCost = randomInRange(100, 5000);
  const targetCost = baseCost * randomFloatInRange(0.85, 0.98);
  
  return {
    id,
    position,
    partName,
    currentCost: baseCost,
    targetCost: parseFloat(targetCost.toFixed(2)),
    lifecycle: ['PhaseIn', 'Production', 'PhaseOut'][randomInRange(0, 2)] as any,
    supplier: ['Foxconn', 'Intel', 'Samsung', 'BOE', 'Western Digital'][randomInRange(0, 4)],
    thumbnailUrl: `https://picsum.photos/id/${randomInRange(160, 184)}/400/400`,
    description: `${partName}是笔记本电脑的关键组件，采用高质量材料制造，具有良好的性能和可靠性。适用于ThinkPad X1 Carbon系列产品。`,
    material: ['铝合金', '塑料', '玻璃纤维', '镁合金', '碳纤维'][randomInRange(0, 4)],
    weight: randomFloatInRange(50, 500),
    unit: 'g',
    leadTime: randomInRange(7, 60),
    moq: randomInRange(100, 1000)
  };
};

// Mock降本建议
export const generateMockCostDownSuggestions = (partName: string): any => {
  // 生成替代料建议
  const alternatives = [
    {
      id: 'ALT001',
      name: `${partName}替代方案A`,
      currentCost: randomInRange(1000, 3000),
      alternativeCost: randomInRange(800, 2500),
      savingPercent: randomFloatInRange(10, 30),
      compatibility: '95%兼容',
      supplier: '替代供应商A',
      lifecycle: 'PhaseIn'
    },
    {
      id: 'ALT002',
      name: `${partName}替代方案B`,
      currentCost: randomInRange(1000, 3000),
      alternativeCost: randomInRange(800, 2500),
      savingPercent: randomFloatInRange(10, 25),
      compatibility: '90%兼容',
      supplier: '替代供应商B',
      lifecycle: 'Production'
    }
  ];
  
  // 生成议价建议
  const priceNegotiations = [
    {
      supplier: '现有供应商',
      currentPrice: randomInRange(1000, 3000),
      historicalLow: randomInRange(800, 2500),
      lastNegotiatedDate: '2024-01-15',
      negotiationPotential: '历史数据显示该供应商过去曾提供10-15%的折扣，建议在下一季度采购前进行议价。'
    }
  ];
  
  // 生成生命周期预警
  const lifecycleWarnings = [
    {
      partId: 'CURRENT',
      partName,
      currentPhase: 'PhaseOut',
      nextPhase: 'Discontinued',
      estimatedDate: '2024-12-31',
      riskLevel: 'high' as const,
      suggestion: '该零件即将停产，建议立即寻找替代方案或增加安全库存。'
    }
  ];
  
  return {
    alternatives,
    priceNegotiations,
    lifecycleWarnings
  };
};

// 生成产品族成本趋势数据
export const generateProductFamilyTrend = (months: string[] = generateMonths()): any[] => {
  let baseCost = 125000; // 产品族成本基数较大
  
  return months.map(month => {
    // 模拟季度性波动，产品族整体成本波动较小
    const variation = randomFloatInRange(-0.01, 0.02);
    baseCost = baseCost * (1 + variation);
    
    return {
      month,
      cost: parseFloat(baseCost.toFixed(2))
    };
  });
};

// 生成主料成本趋势数据
export const generateMainMaterialTrend = (months: string[] = generateMonths()): any[] => {
  let baseCost = 80000; // 主料成本基数中等
  
  return months.map(month => {
    // 主料成本波动较大，受市场供应影响
    const variation = randomFloatInRange(-0.03, 0.05);
    baseCost = baseCost * (1 + variation);
    
    return {
      month,
      cost: parseFloat(baseCost.toFixed(2))
    };
  });
};

// 生成替代料成本趋势数据
export const generateAlternativeMaterialTrend = (months: string[] = generateMonths()): any[] => {
  let baseCost = 40000; // 替代料成本基数较小
  
  return months.map(month => {
    // 替代料成本波动中等，但有上升趋势（市场发展）
    const variation = randomFloatInRange(-0.02, 0.04) + 0.005; // 加入0.5%的月度增长趋势
    baseCost = baseCost * (1 + variation);
    
    return {
      month,
      cost: parseFloat(baseCost.toFixed(2))
    };
  });
};

// 兼容旧接口的成本趋势生成函数
export const generateMockCostTrend = (months: string[] = generateMonths()): any[] => {
  return generateProductFamilyTrend(months);
};

// Mock预警数据
export const mockWarnings = [
  {
    type: 'overTarget',
    level: 'high',
    message: '部分零件成本超目标5%以上',
    count: 5
  },
  {
    type: 'lifecycleRisk',
    level: 'medium',
    message: '2个零件处于PhaseOut阶段',
    count: 2
  },
  {
    type: 'supplierConcentration',
    level: 'low',
    message: 'CPU类零件供应商集中度较高',
    count: 1
  }
];

// 导出综合Mock数据
export const mockDashboardData = {
  currentCost: 12850,
  targetCost: 12500,
  // 为不同类型成本创建独立的趋势数据
  costTrend: generateMockCostTrend(),
  productFamilyTrend: generateProductFamilyTrend(),
  mainMaterialTrend: generateMainMaterialTrend(),
  alternativeMaterialTrend: generateAlternativeMaterialTrend(),
  warnings: mockWarnings,
  costTreeData: mockCostTreeData,
  costDriftData: mockCostDriftData,
  selectedPart: generateMockPartDetail('1', 'U1', 'Intel Core i7-1555U'),
  costHistoryData: generateMockCostHistory(2200),
  supplierData: generateMockSupplierData(),
  costDownSuggestions: generateMockCostDownSuggestions('Intel Core i7-1555U')
};