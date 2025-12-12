// 7层BOM结构模板数据
export const bom7LayerTemplate = {
  'ThinkPad X1 Carbon Gen12': {
    name: 'ThinkPad X1 Carbon Gen12',
    description: '第12代ThinkPad X1 Carbon商务旗舰笔记本电脑',
    version: 'v1.1',
    lastUpdated: '2024-01-15',
    structure: [
      {
        key: 'product',
        title: 'ThinkPad X1 Carbon Gen12',
        level: 1,
        isParentNode: true,
        children: [
          {
            key: 'mainboard',
            title: '主板',
            level: 2,
            isParentNode: true,
            children: [
              {
                key: 'cpu',
                title: 'CPU模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'cpu-family',
                    title: '处理器族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'cpu-group',
                        title: '处理器组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'cpu-main',
                            title: 'Intel Core i7-1260P',
                            level: 6,
                            isParentNode: false,
                            partId: 'CPU-1260P',
                            quantity: 1,
                            unit: '个',
                            cost: 2599,
                            supplier: 'Intel',
                            lifecycle: '量产',
                            position: 'U1.A',
                            children: [
                              {
                                key: 'cpu-alt1',
                                title: 'Intel Core i5-1240P',
                                level: 7,
                                isParentNode: false,
                                partId: 'CPU-1240P',
                                quantity: 1,
                                unit: '个',
                                cost: 1899,
                                supplier: 'Intel',
                                lifecycle: '量产',
                                position: 'U1.A.1',
                                isAlternative: true
                              },
                              {
                                key: 'cpu-alt2',
                                title: 'Intel Core i7-1350U',
                                level: 7,
                                isParentNode: false,
                                partId: 'CPU-1350U',
                                quantity: 1,
                                unit: '个',
                                cost: 2399,
                                supplier: 'Intel',
                                lifecycle: '量产',
                                position: 'U1.A.2',
                                isAlternative: true
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                key: 'memory',
                title: '内存模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'memory-family',
                    title: '内存族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'memory-group',
                        title: '内存组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'memory-main',
                            title: '16GB LPDDR5 5200MHz',
                            level: 6,
                            isParentNode: false,
                            partId: 'MEM-LPDDR5-16GB',
                            quantity: 1,
                            unit: '个',
                            cost: 899,
                            supplier: 'Samsung',
                            lifecycle: '量产',
                            position: 'M1.A',
                            children: [
                              {
                                key: 'memory-alt1',
                                title: '32GB LPDDR5 5200MHz',
                                level: 7,
                                isParentNode: false,
                                partId: 'MEM-LPDDR5-32GB',
                                quantity: 1,
                                unit: '个',
                                cost: 1699,
                                supplier: 'Samsung',
                                lifecycle: '量产',
                                position: 'M1.A.1',
                                isAlternative: true
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                key: 'storage',
                title: '存储模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'storage-family',
                    title: '存储族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'storage-group',
                        title: '存储组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'ssd-main',
                            title: '1TB NVMe SSD',
                            level: 6,
                            isParentNode: false,
                            partId: 'SSD-NVME-1TB',
                            quantity: 1,
                            unit: '个',
                            cost: 799,
                            supplier: 'Western Digital',
                            lifecycle: 'Active',
                            position: 'S1.A',
                            children: [
                              {
                                key: 'ssd-alt1',
                                title: '512GB NVMe SSD',
                                level: 7,
                                isParentNode: false,
                                partId: 'SSD-NVME-512GB',
                                quantity: 1,
                                unit: '个',
                                cost: 499,
                                supplier: 'Western Digital',
                                lifecycle: 'Active',
                                position: 'S1.A.1',
                                isAlternative: true
                              },
                              {
                                key: 'ssd-alt2',
                                title: '2TB NVMe SSD',
                                level: 7,
                                isParentNode: false,
                                partId: 'SSD-NVME-2TB',
                                quantity: 1,
                                unit: '个',
                                cost: 1299,
                                supplier: 'Western Digital',
                                lifecycle: 'Active',
                                position: 'S1.A.2',
                                isAlternative: true
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            key: 'power',
            title: '电源',
            level: 2,
            isParentNode: true,
            children: [
              {
                key: 'battery',
                title: '电池模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'battery-family',
                    title: '电池族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'battery-group',
                        title: '电池组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'battery-main',
                            title: '57Wh锂电池',
                            level: 6,
                            isParentNode: false,
                            partId: 'BAT-57WH',
                            quantity: 1,
                            unit: '个',
                            cost: 1299,
                            supplier: 'LG Chem',
                            lifecycle: 'Active',
                            position: 'B1.A',
                            children: []
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                key: 'adapter',
                title: '适配器模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'adapter-family',
                    title: '适配器族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'adapter-group',
                        title: '适配器组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'adapter-main',
                            title: '65W USB-C适配器',
                            level: 6,
                            isParentNode: false,
                            partId: 'ADP-65W-USBC',
                            quantity: 1,
                            unit: '个',
                            cost: 299,
                            supplier: 'Lenovo',
                            lifecycle: 'Active',
                            position: 'A1.A',
                            children: []
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          {
            key: 'case',
            title: '外壳',
            level: 2,
            isParentNode: true,
            children: [
              {
                key: 'display',
                title: '显示模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'display-family',
                    title: '显示族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'display-group',
                        title: '显示组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'display-main',
                            title: '14英寸2.8K OLED显示屏',
                            level: 6,
                            isParentNode: false,
                            partId: 'DSP-14-2K8-OLED',
                            quantity: 1,
                            unit: '个',
                            cost: 1599,
                            supplier: 'Samsung',
                            lifecycle: 'Active',
                            position: 'D1.A',
                            children: []
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                key: 'chassis',
                title: '机壳模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'chassis-family',
                    title: '机壳族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'chassis-group',
                        title: '机壳组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'chassis-main',
                            title: '碳纤维机身',
                            level: 6,
                            isParentNode: false,
                            partId: 'CHS-CARBON',
                            quantity: 1,
                            unit: '个',
                            cost: 899,
                            supplier: 'Lenovo',
                            lifecycle: 'Active',
                            position: 'C1.A',
                            children: []
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  'ThinkPad T14 Gen3': {
    name: 'ThinkPad T14 Gen3',
    description: '主流商务笔记本',
    version: 'v1.0',
    lastUpdated: '2023-09-20',
    structure: [
      {
        key: 'product',
        title: 'ThinkPad T14 Gen3',
        level: 1,
        isParentNode: true,
        children: [
          {
            key: 'mainboard',
            title: '主板',
            level: 2,
            isParentNode: true,
            children: [
              {
                key: 'cpu',
                title: 'CPU模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'cpu-family',
                    title: '处理器族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'cpu-group',
                        title: '处理器组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'cpu-main',
                            title: 'Intel Core i5-1235U',
                            level: 6,
                            isParentNode: false,
                            partId: 'CPU-1235U',
                            quantity: 1,
                            unit: '个',
                            cost: 1899,
                            supplier: 'Intel',
                            lifecycle: 'Active',
                            position: 'U1.A',
                            children: [
                              {
                                key: 'cpu-alt1',
                                title: 'Intel Core i7-1255U',
                                level: 7,
                                isParentNode: false,
                                partId: 'CPU-1255U',
                                quantity: 1,
                                unit: '个',
                                cost: 2399,
                                supplier: 'Intel',
                                lifecycle: 'Active',
                                position: 'U1.A.1',
                                isAlternative: true
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                key: 'memory',
                title: '内存模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'memory-family',
                    title: '内存族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'memory-group',
                        title: '内存组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'memory-main',
                            title: '8GB DDR4 3200MHz',
                            level: 6,
                            isParentNode: false,
                            partId: 'MEM-DDR4-8GB',
                            quantity: 1,
                            unit: '个',
                            cost: 399,
                            supplier: 'Crucial',
                            lifecycle: 'Active',
                            position: 'M1.A',
                            children: [
                              {
                                key: 'memory-alt1',
                                title: '16GB DDR4 3200MHz',
                                level: 7,
                                isParentNode: false,
                                partId: 'MEM-DDR4-16GB',
                                quantity: 1,
                                unit: '个',
                                cost: 699,
                                supplier: 'Crucial',
                                lifecycle: 'Active',
                                position: 'M1.A.1',
                                isAlternative: true
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  'ThinkPad P1 Gen6': {
    name: 'ThinkPad P1 Gen6',
    description: '移动工作站',
    version: 'v1.0',
    lastUpdated: '2023-08-15',
    structure: [
      {
        key: 'product',
        title: 'ThinkPad P1 Gen6',
        level: 1,
        isParentNode: true,
        children: [
          {
            key: 'mainboard',
            title: '主板',
            level: 2,
            isParentNode: true,
            children: [
              {
                key: 'cpu',
                title: 'CPU模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'cpu-family',
                    title: '处理器族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'cpu-group',
                        title: '处理器组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'cpu-main',
                            title: 'Intel Core i9-13900HX',
                            level: 6,
                            isParentNode: false,
                            partId: 'CPU-13900HX',
                            quantity: 1,
                            unit: '个',
                            cost: 3999,
                            supplier: 'Intel',
                            lifecycle: 'Active',
                            position: 'U1.A',
                            children: []
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  'ThinkBook 16p Gen4': {
    name: 'ThinkBook 16p Gen4',
    description: '时尚商务笔记本',
    version: 'v1.0',
    lastUpdated: '2023-07-10',
    structure: [
      {
        key: 'product',
        title: 'ThinkBook 16p Gen4',
        level: 1,
        isParentNode: true,
        children: [
          {
            key: 'mainboard',
            title: '主板',
            level: 2,
            isParentNode: true,
            children: [
              {
                key: 'cpu',
                title: 'CPU模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'cpu-family',
                    title: '处理器族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'cpu-group',
                        title: '处理器组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'cpu-main',
                            title: 'AMD Ryzen 7 7840HS',
                            level: 6,
                            isParentNode: false,
                            partId: 'CPU-7840HS',
                            quantity: 1,
                            unit: '个',
                            cost: 2799,
                            supplier: 'AMD',
                            lifecycle: 'Active',
                            position: 'U1.A',
                            children: []
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  'Legion Slim 7 Gen8': {
    name: 'Legion Slim 7 Gen8',
    description: '游戏本',
    version: 'v1.0',
    lastUpdated: '2023-06-05',
    structure: [
      {
        key: 'product',
        title: 'Legion Slim 7 Gen8',
        level: 1,
        isParentNode: true,
        children: [
          {
            key: 'mainboard',
            title: '主板',
            level: 2,
            isParentNode: true,
            children: [
              {
                key: 'cpu',
                title: 'CPU模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'cpu-family',
                    title: '处理器族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'cpu-group',
                        title: '处理器组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'cpu-main',
                            title: 'Intel Core i9-13900HX',
                            level: 6,
                            isParentNode: false,
                            partId: 'CPU-13900HX',
                            quantity: 1,
                            unit: '个',
                            cost: 3999,
                            supplier: 'Intel',
                            lifecycle: 'Active',
                            position: 'U1.A',
                            children: []
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                key: 'gpu',
                title: 'GPU模块',
                level: 3,
                isParentNode: true,
                children: [
                  {
                    key: 'gpu-family',
                    title: '显卡族',
                    level: 4,
                    isParentNode: true,
                    children: [
                      {
                        key: 'gpu-group',
                        title: '显卡组',
                        level: 5,
                        isParentNode: true,
                        children: [
                          {
                            key: 'gpu-main',
                            title: 'NVIDIA RTX 4070',
                            level: 6,
                            isParentNode: false,
                            partId: 'GPU-RTX4070',
                            quantity: 1,
                            unit: '个',
                            cost: 4999,
                            supplier: 'NVIDIA',
                            lifecycle: 'Active',
                            position: 'G1.A',
                            children: []
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
};