import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Card, Row, Col, Tag, Button, Empty, Drawer, Descriptions, Space, message, Checkbox, Table, Typography, Modal, Form, Select } from 'antd';
import { 
  BarChartOutlined, LineChartOutlined, ArrowUpOutlined, ArrowDownOutlined,
  FileExcelOutlined, CheckCircleOutlined, ExclamationCircleOutlined, StarOutlined,
  SettingOutlined, DatabaseOutlined, DeleteOutlined, PlusOutlined, ApiOutlined,
  EditOutlined, FilterOutlined, LoadingOutlined, ReloadOutlined, SearchOutlined,
  GithubOutlined
} from '@ant-design/icons';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import AltPoolTable, { AltNode } from '../components/AltPoolTable';
import MainTree from '../components/MainTree';
import AltDetailDrawer from '../components/AltDetailDrawer';
const { Content, Sider } = Layout;
const { Text, Title } = Typography;

// 定义BOM层级的主料接口
interface MainPart {
  id: string;
  partNumber: string;
  name: string;
  cost: number;
  position: string;
  altCount: number;
  bomLevel: number;
  children?: MainPart[];
}

// 成本趋势数据接口
interface CostTrendData {
  month: string;
  mainCost: number;
  altCost: number;
}

// 合规风险接口
interface ComplianceRisk {
  name: string;
  status: 'passed' | 'missing' | 'warning';
  level: 'high' | 'medium' | 'low';
}

const SubstitutePage: React.FC = () => {
  // 状态管理
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedAltPart, setSelectedAltPart] = useState<AltNode | null>(null);
  const [selectedMainPart, setSelectedMainPart] = useState<MainPart | null>(null);
  const [selectedRows, setSelectedRows] = useState<AltNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiRecommendVisible, setAiRecommendVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [altParts, setAltParts] = useState<AltNode[]>([]);
  const [showAddToBOMModal, setShowAddToBOMModal] = useState(false);
  const [currentAddToBOMIds, setCurrentAddToBOMIds] = useState<string[]>([]);
  const [selectedBOM, setSelectedBOM] = useState<string>('');
  
  // 模拟BOM列表数据
  const mockBOMList = [
    { id: 'BOM-001', name: '产品A-BOM' },
    { id: 'BOM-002', name: '产品B-BOM' },
    { id: 'BOM-003', name: '产品C-BOM' },
  ];
  
  // BOM层级结构的主料数据（包含7层结构）
  const mockMainParts: MainPart[] = [
    {
      id: 'BOM-ROOT',
      partNumber: 'PRD-001',
      name: '笔记本电脑产品',
      cost: 8999,
      position: 'Root',
      altCount: 0,
      bomLevel: 1,
      children: [
        {
          id: 'BOM-PCB-001',
          partNumber: 'PCB-001',
          name: '主板组件',
          cost: 3500,
          position: 'Main PCB',
          altCount: 0,
          bomLevel: 2,
          children: [
            {
              id: 'BOM-MOTHERBOARD-001',
              partNumber: 'MB-001',
              name: '主板',
              cost: 1200,
              position: 'M1',
              altCount: 0,
              bomLevel: 3,
              children: [
                {
                  id: 'BOM-CPU-SOCKET-001',
                  partNumber: 'SOCKET-CPU',
                  name: 'CPU插槽',
                  cost: 50,
                  position: 'CPU_SOCKET',
                  altCount: 0,
                  bomLevel: 4,
                  children: [
                    {
                      id: 'BOM-PROCESSOR-001',
                      partNumber: 'PROC-001',
                      name: '处理器模块',
                      cost: 3200,
                      position: 'U1',
                      altCount: 0,
                      bomLevel: 5,
                      children: [
                        {
                          id: 'CPU-MAIN-001',
                          partNumber: 'CPU-001',
                          name: 'Intel Core i7-13800H',
                          cost: 3200,
                          position: 'U1.A',
                          altCount: 3,
                          bomLevel: 6
                        },
                        {
                          id: 'CPU-MAIN-002',
                          partNumber: 'CPU-002',
                          name: 'Intel Core i9-14900K',
                          cost: 4500,
                          position: 'U1.B',
                          altCount: 2,
                          bomLevel: 6
                        },
                        {
                          id: 'CPU-MAIN-003',
                          partNumber: 'CPU-003',
                          name: 'Intel Core i3-12100',
                          cost: 1200,
                          position: 'U1.C',
                          altCount: 1,
                          bomLevel: 6
                        },
                        {
                          id: 'CPU-MAIN-004',
                          partNumber: 'CPU-004',
                          name: 'AMD Ryzen 9 7950X',
                          cost: 4300,
                          position: 'U1.D',
                          altCount: 2,
                          bomLevel: 6
                        },
                        {
                          id: 'CPU-MAIN-005',
                          partNumber: 'CPU-005',
                          name: 'AMD Ryzen 7 7800X3D',
                          cost: 3800,
                          position: 'U1.E',
                          altCount: 2,
                          bomLevel: 6
                        },
                        {
                          id: 'CPU-MAIN-006',
                          partNumber: 'CPU-006',
                          name: 'AMD Ryzen 5 7600X',
                          cost: 2500,
                          position: 'U1.F',
                          altCount: 2,
                          bomLevel: 6
                        },
                        {
                          id: 'CPU-MAIN-007',
                          partNumber: 'CPU-007',
                          name: 'AMD Ryzen 3 7300X',
                          cost: 1400,
                          position: 'U1.G',
                          altCount: 1,
                          bomLevel: 6
                        }
                      ]
                    },
                    {
                      id: 'BOM-MEMORY-001',
                      partNumber: 'MEM-001',
                      name: '内存模块',
                      cost: 800,
                      position: 'M1',
                      altCount: 0,
                      bomLevel: 5,
                      children: [
                        {
                          id: 'RAM-MAIN-001',
                          partNumber: 'RAM-001',
                          name: 'Samsung 16GB LPDDR5 6400MHz',
                          cost: 800,
                          position: 'M1.A',
                          altCount: 2,
                          bomLevel: 6
                        }
                      ]
                    },
                    {
                      id: 'BOM-STORAGE-001',
                      partNumber: 'STORAGE-001',
                      name: '存储模块',
                      cost: 1500,
                      position: 'S1',
                      altCount: 0,
                      bomLevel: 5,
                      children: [
                        {
                          id: 'SSD-MAIN-001',
                          partNumber: 'SSD-001',
                          name: 'Samsung 990 PRO 2TB NVMe',
                          cost: 1500,
                          position: 'S1.A',
                          altCount: 2,
                          bomLevel: 6
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
  ];
  
  // 扁平化获取所有L6主料
  const getAllL6Parts = (parts: MainPart[]): MainPart[] => {
    let result: MainPart[] = [];
    
    parts.forEach(part => {
      if (part.bomLevel === 6) {
        result.push(part);
      }
      if (part.children && part.children.length > 0) {
        result = [...result, ...getAllL6Parts(part.children)];
      }
    });
    
    return result;
  };
  
  // 获取所有L6主料
  const [l6MainParts, setL6MainParts] = useState<MainPart[]>(getAllL6Parts(mockMainParts));

  // 更新后的替代料数据，更符合需求中的展示格式
  const mockAltParts: AltNode[] = [
    // CPU替代料
    {
      id: 'ALT-001',
      parentId: 'CPU-MAIN-001',
      group: 'A',
      partId: 'CPU-ALT-001',
      partName: 'i5-1335U',
      qty: 1,
      cost: 3200,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE', 'FCC'],
      fffScore: 98,
      isDefault: true,
      status: 'Active'
    },
    {
      id: 'ALT-002',
      parentId: 'CPU-MAIN-001',
      group: 'A',
      partId: 'CPU-ALT-002',
      partName: 'AMD Ryzen 7 7840U',
      qty: 1,
      cost: 3400,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE'],
      fffScore: 92,
      isDefault: false,
      status: 'Active'
    },
    {
      id: 'ALT-003',
      parentId: 'CPU-MAIN-001',
      group: 'A',
      partId: 'CPU-ALT-003',
      partName: 'Intel Core Ultra 5 135H',
      qty: 1,
      cost: 2880,
      lifecycle: 'PhaseOut',
      compliance: ['RoHS', 'CE', 'FCC'],
      fffScore: 85,
      isDefault: false,
      status: 'Active'
    },
    // Intel Core i9-14900K 替代料
    {
      id: 'ALT-008',
      parentId: 'CPU-MAIN-002',
      group: 'A',
      partId: 'CPU-ALT-008',
      partName: 'Intel Core i9-14900KF',
      qty: 1,
      cost: 4350,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE', 'FCC'],
      fffScore: 97,
      isDefault: true,
      status: 'Active'
    },
    {
      id: 'ALT-009',
      parentId: 'CPU-MAIN-002',
      group: 'A',
      partId: 'CPU-ALT-009',
      partName: 'AMD Ryzen 9 7950X3D',
      qty: 1,
      cost: 4600,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE'],
      fffScore: 94,
      isDefault: false,
      status: 'Active'
    },
    // Intel Core i3-12100 替代料
    {
      id: 'ALT-010',
      parentId: 'CPU-MAIN-003',
      group: 'A',
      partId: 'CPU-ALT-010',
      partName: 'Intel Core i3-12100F',
      qty: 1,
      cost: 1100,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE', 'FCC'],
      fffScore: 95,
      isDefault: true,
      status: 'Active'
    },
    // AMD Ryzen 9 7950X 替代料
    {
      id: 'ALT-011',
      parentId: 'CPU-MAIN-004',
      group: 'A',
      partId: 'CPU-ALT-011',
      partName: 'AMD Ryzen 9 7950X3D',
      qty: 1,
      cost: 4500,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE'],
      fffScore: 96,
      isDefault: true,
      status: 'Active'
    },
    {
      id: 'ALT-012',
      parentId: 'CPU-MAIN-004',
      group: 'A',
      partId: 'CPU-ALT-012',
      partName: 'Intel Core i9-13900KS',
      qty: 1,
      cost: 4700,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE', 'FCC'],
      fffScore: 93,
      isDefault: false,
      status: 'Active'
    },
    // AMD Ryzen 7 7800X3D 替代料
    {
      id: 'ALT-013',
      parentId: 'CPU-MAIN-005',
      group: 'A',
      partId: 'CPU-ALT-013',
      partName: 'AMD Ryzen 7 7700X',
      qty: 1,
      cost: 3200,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE'],
      fffScore: 95,
      isDefault: true,
      status: 'Active'
    },
    {
      id: 'ALT-014',
      parentId: 'CPU-MAIN-005',
      group: 'A',
      partId: 'CPU-ALT-014',
      partName: 'Intel Core i7-13700K',
      qty: 1,
      cost: 3500,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE', 'FCC'],
      fffScore: 92,
      isDefault: false,
      status: 'Active'
    },
    // AMD Ryzen 5 7600X 替代料
    {
      id: 'ALT-015',
      parentId: 'CPU-MAIN-006',
      group: 'A',
      partId: 'CPU-ALT-015',
      partName: 'AMD Ryzen 5 7600',
      qty: 1,
      cost: 2200,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE'],
      fffScore: 96,
      isDefault: true,
      status: 'Active'
    },
    {
      id: 'ALT-016',
      parentId: 'CPU-MAIN-006',
      group: 'A',
      partId: 'CPU-ALT-016',
      partName: 'Intel Core i5-13600K',
      qty: 1,
      cost: 2400,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE', 'FCC'],
      fffScore: 93,
      isDefault: false,
      status: 'Active'
    },
    // AMD Ryzen 3 7300X 替代料
    {
      id: 'ALT-017',
      parentId: 'CPU-MAIN-007',
      group: 'A',
      partId: 'CPU-ALT-017',
      partName: 'AMD Ryzen 3 7300',
      qty: 1,
      cost: 1250,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE'],
      fffScore: 94,
      isDefault: true,
      status: 'Active'
    },
    // 内存替代料
    {      
      id: 'ALT-004',
      parentId: 'RAM-MAIN-001',
      group: 'A',
      partId: 'RAM-ALT-001',
      partName: 'SK Hynix 16GB LPDDR5X 7467MHz',
      qty: 1,
      cost: 750,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE'],
      fffScore: 96,
      isDefault: true,
      status: 'Active'
    },
    {      
      id: 'ALT-005',
      parentId: 'RAM-MAIN-001',
      group: 'A',
      partId: 'RAM-ALT-002',
      partName: 'Micron 16GB LPDDR5 6400MHz',
      qty: 1,
      cost: 820,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE', 'FCC'],
      fffScore: 88,
      isDefault: false,
      status: 'Active'
    },
    // SSD替代料
    {      
      id: 'ALT-006',
      parentId: 'SSD-MAIN-001',
      group: 'A',
      partId: 'SSD-ALT-001',
      partName: 'Western Digital Black SN850X 2TB',
      qty: 1,
      cost: 1350,
      lifecycle: 'Active',
      compliance: ['RoHS', 'CE'],
      fffScore: 94,
      isDefault: true,
      status: 'Active'
    },
    {      
      id: 'ALT-007',
      parentId: 'SSD-MAIN-001',
      group: 'A',
      partId: 'SSD-ALT-002',
      partName: 'Crucial P5 Plus 2TB',
      qty: 1,
      cost: 1480,
      lifecycle: 'PhaseOut',
      compliance: ['RoHS'],
      fffScore: 75,
      isDefault: false,
      status: 'Active'
    }
  ];
  
  // 成本趋势数据
  const costTrendData: CostTrendData[] = [
    { month: '2023-01', mainCost: 3200, altCost: 3000 },
    { month: '2023-02', mainCost: 3250, altCost: 2950 },
    { month: '2023-03', mainCost: 3300, altCost: 2900 },
    { month: '2023-04', mainCost: 3250, altCost: 2880 },
    { month: '2023-05', mainCost: 3200, altCost: 2900 },
    { month: '2023-06', mainCost: 3150, altCost: 2850 },
    { month: '2023-07', mainCost: 3100, altCost: 2800 },
    { month: '2023-08', mainCost: 3050, altCost: 2750 },
    { month: '2023-09', mainCost: 3000, altCost: 2700 },
    { month: '2023-10', mainCost: 2950, altCost: 2650 },
    { month: '2023-11', mainCost: 2900, altCost: 2600 },
    { month: '2023-12', mainCost: 2850, altCost: 2550 }
  ];
  
  // 合规风险数据
  const complianceRisks: ComplianceRisk[] = [
    { name: 'RoHS', status: 'passed', level: 'high' },
    { name: 'CE', status: 'passed', level: 'high' },
    { name: 'FCC', status: 'missing', level: 'medium' },
    { name: 'REACH', status: 'warning', level: 'low' }
  ];
  
  // 功能函数实现
  const setDefault = (id: string) => {
    console.log('设置默认替代料:', id);
    Modal.confirm({
      title: '设为默认替代料',
      content: '确定要将此替代料设为默认吗？这将会更新主料成本并进行rollup计算。',
      onOk: () => {
        message.success('已设为默认替代料');
        // 模拟成本更新逻辑
        if (selectedMainPart) {
          const updatedAlt = mockAltParts.find(alt => alt.id === id);
          if (updatedAlt && updatedAlt.cost < selectedMainPart.cost) {
            message.info(`主料成本已从 ¥${selectedMainPart.cost} 更新为 ¥${updatedAlt.cost}`);
          }
        }
      }
    });
  };

  const deprecateAlt = (id: string) => {
    console.log('废弃替代料:', id);
    Modal.confirm({
      title: '废弃替代料',
      content: '确定要废弃此替代料吗？这将把使用量设置为0并推送至SAP。',
      onOk: () => {
        message.success('已废弃替代料');
      }
    });
  };

  // 打开添加到BOM模态框
  const addToBOM = (id: string) => {
    setCurrentAddToBOMIds([id]);
    setShowAddToBOMModal(true);
  };
  
  // 确认添加到BOM
  const confirmAddToBOM = () => {
    if (!selectedBOM) {
      message.warning('请选择目标BOM');
      return;
    }
    
    console.log('添加零件到BOM:', currentAddToBOMIds, '目标BOM:', selectedBOM);
    message.success(`已添加 ${currentAddToBOMIds.length} 个零件到BOM`);
    setShowAddToBOMModal(false);
    setSelectedBOM('');
  };
  
  // 渲染添加到BOM模态框
  const renderAddToBOMModal = () => (
    <Modal
      title={currentAddToBOMIds.length === 1 ? '添加到BOM' : '批量添加到BOM'}
      open={showAddToBOMModal}
      onOk={confirmAddToBOM}
      onCancel={() => setShowAddToBOMModal(false)}
      width={600}
    >
      <div style={{ marginBottom: 20 }}>
        <h4>{currentAddToBOMIds.length === 1 ? '选择目标BOM' : `批量添加 ${currentAddToBOMIds.length} 个零件到BOM`}</h4>
      </div>
      <Form.Item label="目标BOM" required>
        <Select
          placeholder="请选择目标BOM"
          style={{ width: '100%' }}
          value={selectedBOM}
          onChange={(value) => setSelectedBOM(value)}
          options={mockBOMList.map(bom => ({
            label: bom.name,
            value: bom.id
          }))}
        />
      </Form.Item>
    </Modal>
  );

  const batchSetDefault = (ids: string[]) => {
    console.log('批量设置默认替代料:', ids);
    Modal.confirm({
      title: '批量设置默认替代料',
      content: `确定要将选中的 ${ids.length} 个替代料设为默认吗？`,
      onOk: () => {
        message.success(`已批量设置 ${ids.length} 个替代料为默认`);
      }
    });
  };

  const batchDeprecate = (ids: string[]) => {
    console.log('批量废弃替代料:', ids);
    Modal.confirm({
      title: '批量废弃替代料',
      content: `确定要废弃选中的 ${ids.length} 个替代料吗？`,
      onOk: () => {
        message.success(`已批量废弃 ${ids.length} 个替代料`);
      }
    });
  };

  const batchAddToBOM = (ids: string[]) => {
    setCurrentAddToBOMIds(ids);
    setShowAddToBOMModal(true);
  };

  const handleSelectRow = (record: AltNode, selected: boolean) => {
    console.log('选择行:', record.partName, selected);
    if (selected) {
      setSelectedRows([...selectedRows, record]);
    } else {
      setSelectedRows(selectedRows.filter(row => row.id !== record.id));
    }
  };

  // 获取KPI数据
  const getKPI = () => {
    return {
      totalAltParts: 12450,
      defaultRate: 78,
      avgCostReduction: 320,
      complianceRiskCount: 23,
      trends: {
        totalAltParts: '+5%',
        defaultRate: '+2%',
        avgCostReduction: '-8%',
        complianceRiskCount: '-3'
      }
    };
  };

  // 打开AI推荐抽屉
  const openAIRecommend = (part?: MainPart) => {
    // 如果传入了主料，则先选中该主料
    if (part) {
      handleMainPartSelect(part);
    }
    
    if (selectedMainPart) {
      console.log('SubstitutePage - 为主料', selectedMainPart.name, '打开AI推荐抽屉');
      setAiRecommendVisible(true);
      // 这里可以调用AI推荐API获取推荐结果
      // 模拟推荐结果
      const mockRecommendations = [
        { name: '推荐替代料1', reason: '成本低20%，性能相当' },
        { name: '推荐替代料2', reason: '全球供货稳定，交期更短' },
        { name: '推荐替代料3', reason: '环保认证更完善' }
      ];
      console.log('AI推荐结果:', mockRecommendations);
    } else {
      message.warning('请先选择一个主料');
    }
  };

  // 初始化数据 - 使用mock数据简化逻辑
  useEffect(() => {
    console.log('SubstitutePage - 使用mock数据初始化，总数量:', mockAltParts.length);
    console.log('L6主料数量:', l6MainParts.length);
    
    // 设置altParts状态，确保替代料池有数据显示
    setAltParts(mockAltParts);
    console.log('SubstitutePage - 已初始化altParts状态');
    
    // 确保找到有替代料的主料
    let validMainPart = null;
    let validAltPart = null;
    
    // 遍历主料列表，找到有替代料的主料
    for (const mainPart of l6MainParts) {
      const matchingAlt = mockAltParts.find(alt => 
        alt.parentId === mainPart.id && alt.status === 'Active' && alt.cost
      );
      
      if (matchingAlt) {
        validMainPart = mainPart;
        validAltPart = matchingAlt;
        break;
      }
    }
    
    // 如果找到有效配对，设置选中状态
    if (validMainPart && validAltPart) {
      setSelectedMainPart(validMainPart);
      setSelectedAltPart(validAltPart);
      console.log('SubstitutePage - 已设置默认主料和替代料配对:', 
        validMainPart.name, '->', validAltPart.partName);
      // 不在这里立即调用getCostComparisonData，因为状态更新是异步的
    } else {
      // 如果没有找到有效配对，至少设置一个主料
      if (l6MainParts.length > 0) {
        const defaultMainPart = l6MainParts[0];
        setSelectedMainPart(defaultMainPart);
        console.log('SubstitutePage - 只设置了主料，未找到有效替代料:', defaultMainPart.name);
      }
    }
  }, []);
  
  // 监听选中状态变化，确保状态更新后再获取成本数据
  useEffect(() => {
    if (selectedMainPart && selectedAltPart) {
      console.log('SubstitutePage - 选中状态已更新，当前配对:', 
        selectedMainPart.name, '->', selectedAltPart.partName);
      const costData = getCostComparisonData();
      console.log('SubstitutePage - 当前可用于图表的成本趋势数据:', costData.length > 0 ? '有数据' : '无数据');
    }
  }, [selectedMainPart, selectedAltPart]);

  // 处理替代料选择
  const handleAltPartSelect = (part: AltNode) => {
    console.log('SubstitutePage - 选择替代料:', part.id, part.partName);
    // 确保正确设置selectedAltPart状态
    setSelectedAltPart(part);
    
    // 可选：打开详情抽屉，但不影响成本趋势图显示
    setDetailDrawerVisible(true);
    
    // 如果没有对应的主料信息，尝试从l6MainParts中查找
    if (!selectedMainPart || selectedMainPart.id !== part.parentId) {
      const mainPart = l6MainParts.find(p => p.id === part.parentId);
      if (mainPart) {
        setSelectedMainPart(mainPart);
      }
    }
    
    console.log('SubstitutePage - 替代料选择后状态:', { selectedMainPart, selectedAltPart: part });
  };
  
  // 使用useMemo优化成本趋势数据计算，避免每次渲染都重新计算
  const computedCostTrendData = useMemo(() => {
    // 不再严格要求选中状态，即使未选中也生成默认数据
    if (!selectedMainPart || !selectedAltPart) {
      console.log('SubstitutePage - 使用默认数据初始化成本趋势图表');
    }
    
    // 生成从2024-03到2025-10的完整时间序列，每个单位是1个月
    const generateMonths = () => {
      const months: string[] = [];
      const startYear = 2024;
      const startMonth = 3;
      const endYear = 2025;
      const endMonth = 10;
      
      for (let year = startYear; year <= endYear; year++) {
        const start = year === startYear ? startMonth : 1;
        const end = year === endYear ? endMonth : 12;
        
        for (let month = start; month <= end; month++) {
          months.push(`${year}-${month.toString().padStart(2, '0')}`);
        }
      }
      
      return months;
    };
    
    const months = generateMonths();
    
    // 使用选中部分的成本或默认成本
    const baseCost = selectedMainPart?.cost || 3000;
    const altBaseCost = selectedAltPart?.cost || 2800;
    
    const result = months.map((month, index) => {
      // 使用索引生成可预测的波动
      const factor = 1 + 0.05 * Math.sin(index * 0.5);
      const altFactor = 1 + 0.05 * Math.sin(index * 0.5 + 0.5);
      
      return {
        month,
        mainCost: Number((baseCost * factor).toFixed(2)),
        altCost: Number((altBaseCost * altFactor).toFixed(2))
      };
    });
    
    console.log('SubstitutePage - 生成的成本趋势数据:', result.length);
    return result;
  }, [selectedMainPart, selectedAltPart]);
  
  // 保持原函数接口兼容，首先使用computedCostTrendData，如果为空则回退到costTrendData
  const getCostComparisonData = () => {
    console.log('SubstitutePage - getCostComparisonData: computedCostTrendData=', computedCostTrendData);
    console.log('SubstitutePage - getCostComparisonData: computedCostTrendData类型=', typeof computedCostTrendData);
    console.log('SubstitutePage - getCostComparisonData: computedCostTrendData长度=', computedCostTrendData.length);
    console.log('SubstitutePage - getCostComparisonData: costTrendData=', costTrendData);
    
    // 确保返回的是数组
    const result = computedCostTrendData && Array.isArray(computedCostTrendData) && computedCostTrendData.length > 0 
      ? computedCostTrendData 
      : (costTrendData && Array.isArray(costTrendData) ? costTrendData : []);
      
    console.log('SubstitutePage - getCostComparisonData: 最终返回数据=', result);
    console.log('SubstitutePage - getCostComparisonData: 最终返回数据长度=', result.length);
    
    return result;
  };
  
  // 获取所有零件的成本对比数据
  const getAllPartsCostComparisonData = () => {
    // 为每个主料和其替代料生成成本对比数据
    const comparisonData = [];
    
    l6MainParts.forEach(mainPart => {
      const relatedAltParts = mockAltParts.filter(alt => alt.parentId === mainPart.id);
      
      if (relatedAltParts.length > 0) {
        comparisonData.push({
          mainPart: mainPart.name,
          mainCost: mainPart.cost,
          altParts: relatedAltParts.map(alt => ({
            name: alt.partName,
            cost: alt.cost,
            savings: mainPart.cost - alt.cost,
            savingsPercentage: ((mainPart.cost - alt.cost) / mainPart.cost * 100).toFixed(1)
          }))
        });
      }
    });
    
    return comparisonData;
  };

  // 批量操作

  // 批量设为默认
  const handleBatchSetDefault = () => {
    // 实现批量设为默认的逻辑
    if (selectedRows.length > 0) {
      const updatedAltParts = altParts.map(part => {
        // 如果是选中的零件，设为默认
        if (selectedRows.some(selected => selected.id === part.id)) {
          return { ...part, isDefault: true };
        }
        // 如果是同一主料的其他零件，取消默认
        if (selectedRows.some(selected => selected.parentId === part.parentId)) {
          return { ...part, isDefault: false };
        }
        return part;
      });
      setAltParts(updatedAltParts);
      message.success(`已将 ${selectedRows.length} 个零件设为默认`);
    } else {
      message.warning('请先选择需要操作的替代料');
    }
  };

  // 批量弃用
  const handleBatchDeprecate = () => {
    // 实现批量弃用的逻辑
    if (selectedRows.length > 0) {
      const updatedAltParts = altParts.map(part => {
        if (selectedRows.some(selected => selected.id === part.id)) {
          return { ...part, status: 'Deprecated' as const };
        }
        return part;
      });
      setAltParts(updatedAltParts);
      setSelectedRows([]);
      message.success(`已弃用 ${selectedRows.length} 个零件`);
    } else {
      message.warning('请先选择需要操作的替代料');
    }
  };

  // 批量加入BOM
  const handleBatchAddToBOM = () => {
    if (selectedRows.length > 0) {
      batchAddToBOM(selectedRows.map(row => row.id));
    } else {
      message.warning('请先选择需要操作的替代料');
    }
  };

  // 导出对比表
  const handleExport = () => {
    console.log('Export comparison table');
    if (!selectedMainPart || filteredAltParts.length === 0) {
      message.warning('请先选择主料并确保有替代料数据');
      return;
    }
    
    // 模拟Excel导出功能
    const exportData = filteredAltParts.map(part => ({
      '零件编号': part.partId,
      '零件名称': part.partName,
      '成本': part.cost,
      '相比主料节省': selectedMainPart ? (selectedMainPart.cost - part.cost).toFixed(2) : 'N/A',
      '生命周期': part.status,
      '合规状态': part.compliance ? '合规' : '不合规',
      'FFF评分': part.fffScore,
      '是否默认': part.isDefault ? '是' : '否'
    }));
    
    console.log('导出数据:', exportData);
    message.success(`已成功导出 ${exportData.length} 条替代料对比数据`);
  };

  // KPI数据将在下方定义
  // kpis将在kpiData定义后初始化

  // 过滤当前主料的替代料 - 使用mock数据确保能显示内容
  const [filteredAltParts, setFilteredAltParts] = useState<AltNode[]>([]);
    
  // 初始化逻辑已合并到上方的useEffect中，避免重复设置altParts状态
    
  // 过滤替代料
  useEffect(() => {
    console.log('SubstitutePage - 开始过滤替代料:', {
      selectedMainPartId: selectedMainPart?.id || '未选择',
      selectedMainPartName: selectedMainPart?.name || '未选择'
    });

    if (!selectedMainPart || !selectedMainPart.id) {
      setFilteredAltParts([]);
      console.log('SubstitutePage - 未选择主料或主料ID无效，清空过滤结果');
      return;
    }

    // 使用mock数据进行过滤，增加错误处理
    let filtered = [];
    try {
      filtered = mockAltParts.filter(part => {
        // 确保part对象有必要的属性
        if (!part || !part.parentId || !part.status) {
          console.warn('SubstitutePage - 替代料对象属性不完整:', part);
          return false;
        }
        
        const match = part.parentId === selectedMainPart.id && part.status === 'Active';
        console.log(`过滤检查: ${part.partId || 'Unknown'} (parentId: ${part.parentId}) 匹配 ${selectedMainPart.id}: ${match}`);
        return match;
      });
      
      console.log('SubstitutePage - Mock数据按主料过滤后数量:', filtered.length);
    } catch (error) {
      console.error('SubstitutePage - 过滤替代料时出错:', error);
      filtered = [];
    }

    setFilteredAltParts(filtered);
    
    // 如果有匹配的替代料，自动选择第一个
    if (filtered.length > 0 && (!selectedAltPart || selectedAltPart.parentId !== selectedMainPart.id)) {
      console.log('SubstitutePage - 自动选择第一个替代料:', filtered[0].partId, filtered[0].name);
      setSelectedAltPart(filtered[0]);
    }
    
    console.log('SubstitutePage - 最终过滤结果数量:', filtered.length);
    console.log('SubstitutePage - 最终过滤结果列表:', filtered);
  }, [selectedMainPart]);
  
  // 添加额外的调试日志
  useEffect(() => {
    if (selectedMainPart) {
      console.log('SubstitutePage - 选择的主料:', selectedMainPart.id, selectedMainPart.partNumber);
      console.log('SubstitutePage - 使用mock数据找到的替代料数量:', filteredAltParts.length);
      console.log('SubstitutePage - 找到的替代料列表:', filteredAltParts);
    }
  }, [selectedMainPart, filteredAltParts]);
    
  // 处理主料选择
  const handleMainPartSelect = (part: MainPart) => {
    console.log('SubstitutePage - 选择主料:', part.id, part.partNumber, part.name);
    setSelectedMainPart(part);
    setSelectedRows([]); // 重置选择行
    // 使用mock数据检查是否有匹配的替代料
    const matchingAlts = mockAltParts.filter(alt => alt.parentId === part.id && alt.status === 'Active');
    console.log(`SubstitutePage - 为 ${part.partNumber} 找到 ${matchingAlts.length} 个替代料`);
  };
  
  // 处理主料拖拽重新分组
  const handleMainPartDrag = (dragPart: MainPart, dropPart: MainPart) => {
    message.info(`已将 ${dragPart.name} 从组 ${dragPart.position?.split('-')[0]} 移动到组 ${dropPart.position?.split('-')[0]}`);
    // 实际应用中需要更新BOM结构和替代料分组
    // 这里简单模拟：更新位置信息
    const updatedPart = { ...dragPart, position: `${dropPart.position?.split('-')[0]}-${dragPart.position?.split('-')[1]}` };
    
    // 更新l6MainParts中的对应项
    setL6MainParts(prevParts => 
      prevParts.map(part => part.id === dragPart.id ? updatedPart : part)
    );
    
    // 如果当前选中的正是被拖拽的主料，同步更新选中状态
    if (selectedMainPart?.id === dragPart.id) {
      setSelectedMainPart(updatedPart);
    }
  };

  // 替代料看板数据
  const kpiData = [
    { key: 'total', value: 12450, trend: 5, trendType: 'up', label: '替代料总数', source: 'MDM替代池' },
    { key: 'preferred', value: 78, trend: 2, trendType: 'up', label: '默认首选率', source: '替代料表', unit: '%' },
    { key: 'costReduction', value: -320, trend: 8, trendType: 'down', label: '成本降幅(平均)', source: '成本rollup', unit: '¥' },
    { key: 'complianceRisk', value: 23, trend: 3, trendType: 'down', label: '合规风险数', source: '合规API' },
  ];
  
  // 初始化kpis
  const kpis = kpiData.map(item => ({
    name: item.label,
    value: `${item.unit || ''}${item.value}${item.unit === '%' ? '' : ''}`,
    trend: `${item.trendType === 'up' ? '+' : ''}${item.trend}%`,
    trendIcon: item.trendType === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />,
    dataSource: item.source,
    color: 'green'
  }));

  // 生成成本趋势数据
  const generateCostTrendData = () => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    return months.map(month => ({
      month,
      mainCost: Math.round(Math.random() * 10000 + 5000),
      altCost: Math.round(Math.random() * 8000 + 3000),
    }));
  };

  const generatedCostTrendData2 = generateCostTrendData();

  // 添加全局样式优化
  const globalStyles = `
    .substitute-page {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    /* 优化表格行样式 */
    .table-row-red {
      background-color: #fff2f0 !important;
    }
    .table-row-orange {
      background-color: #fff7e6 !important;
    }
    .table-row-green {
      background-color: #f6ffed !important;
    }
    
    /* 卡片样式优化 */
    .kpi-card {
      transition: all 0.3s ease;
    }
    .kpi-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    
    /* 按钮悬停效果 */
    .ant-btn {
      transition: all 0.3s ease;
    }
    .ant-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    
    /* 表格样式优化 */
    .ant-table-tbody > tr:hover > td {
      background-color: #fafafa;
    }
    
    /* 抽屉动画优化 */
    .ant-drawer {
      transition: all 0.3s ease;
    }
    
    /* 批量操作栏样式优化 */
    .batch-actions {
      transition: all 0.3s ease;
    }
    
    /* 滚动条样式优化 */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-thumb {
      background: #d9d9d9;
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #bfbfbf;
    }
    ::-webkit-scrollbar-track {
      background: #f5f5f5;
    }
  `;

  return (
    <div className="substitute-page" style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <style>{globalStyles}</style>
      {/* 替代料看板 */}
      <div className="dashboard-section" style={{ marginBottom: 24 }}>
        {/* KPI指标卡片 */}
        <div className="kpi-cards" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {kpiData.map((kpi) => (
              <Col span={6} key={kpi.key}>
                <Card className="kpi-card" style={{ border: '1px solid #f0f0f0' }}>
                  <div className="kpi-header">
                    <h3>{kpi.label}</h3>
                    <span className="kpi-source" style={{ fontSize: '12px', color: '#999' }}>{kpi.source}</span>
                  </div>
                  <div className="kpi-value" style={{ margin: '10px 0' }}>
                    <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
                      {kpi.unit && kpi.unit !== '%' ? `${kpi.unit} ` : ''}
                      {kpi.value.toLocaleString()}
                      {kpi.unit === '%' && '%'}
                    </span>
                  </div>
                  <div className={`kpi-trend ${kpi.trendType}`}>
                    <Tag color={kpi.trendType === 'up' ? 'green' : 'red'}>
                      {kpi.trendType === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      <span>{kpi.trendType === 'up' ? '+' : '-'}{kpi.trend}{kpi.label.includes('率') ? '%' : ''}</span>
                    </Tag>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        
        {/* 成本趋势图 */}
        <div className="cost-trend-chart" ref={(el) => {
          if (el) {
            console.log('SubstitutePage - 成本趋势图容器已渲染', {
              width: el.offsetWidth,
              height: el.offsetHeight,
              display: window.getComputedStyle(el).display,
              visibility: window.getComputedStyle(el).visibility,
              opacity: window.getComputedStyle(el).opacity
            });
          }
        }}>
          <Card style={{ border: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
            <h3 className="text-xs font-normal">成本趋势分析</h3>
              <div style={{ height: 400, backgroundColor: '#fff', position: 'relative' }}>
                {getCostComparisonData() && getCostComparisonData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      // 创建统一的数据结构，每个月份包含所有CPU型号的数据
                      data={getCostComparisonData().map(item => {
                        const cpuData: any = { month: item.month };
                        // 为每个CPU型号生成数据
                        l6MainParts.filter(part => part.name.includes('Intel') || part.name.includes('AMD')).forEach(cpu => {
                          cpuData[cpu.id] = Number((cpu.cost * (1 + 0.05 * Math.sin(new Date(item.month).getTime() / 10000000000))).toFixed(2));
                        });
                        return cpuData;
                      })}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`¥${value}`, undefined]} />
                      <Legend />
                      {/* 为所有CPU型号生成Line元素 */}
                      {l6MainParts.filter(part => part.name.includes('Intel') || part.name.includes('AMD')).map((cpu, index) => (
                        <Line 
                          key={cpu.id}
                          type="monotone" 
                          dataKey={cpu.id} // 使用CPU的id作为数据键
                          stroke={index % 7 === 0 ? '#8884d8' : index % 7 === 1 ? '#82ca9d' : index % 7 === 2 ? '#ff7300' : index % 7 === 3 ? '#0088fe' : index % 7 === 4 ? '#00C49F' : index % 7 === 5 ? '#FFBB28' : '#FF8042'}
                          strokeWidth={2}
                          name={`${cpu.name} 成本`}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#999'
                  }}>
                    暂无成本趋势数据
                  </div>
                )}
              </div>
          </Card>
        </div>
      </div>
      


      {/* 主内容区域 */}
      <div className="main-content" style={{ display: 'flex', gap: 16 }}>
        {/* 左侧：主料树 */}
        <div className="main-part-tree" style={{ width: '518px', flexShrink: 0 }}>
          <Card style={{ border: '1px solid #f0f0f0', height: 'calc(100vh - 500px)' }}>
            <h3 style={{ marginBottom: 16 }}>主料列表（L6层级）</h3>
            <Table
              columns={[
                {
                  title: '位号',
                  dataIndex: 'position',
                  key: 'position',
                  width: 60
                },
                {
                  title: '主料名称',
                  dataIndex: 'name',
                  key: 'name',
                  ellipsis: true
                },
                {
                  title: '成本',
                  dataIndex: 'cost',
                  key: 'cost',
                  render: (value: number) => `¥${value}`
                },
                {
                  title: '替代料',
                  dataIndex: 'altCount',
                  key: 'altCount'
                },
                {
                  title: '操作',
                  key: 'action',
                  render: () => (
                    <Button type="text" size="small" icon={<StarOutlined />} onClick={(e) => openAIRecommend()}>
                      推荐
                    </Button>
                  )
                }
              ]}
              dataSource={l6MainParts}
              rowKey="id"
              pagination={false}
              onRow={(record) => ({
                onClick: () => handleMainPartSelect(record),
                style: selectedMainPart?.id === record.id ? { backgroundColor: '#e6f7ff' } : {}
              })}
            />
          </Card>
        </div>

        {/* 中部：替代料池 */}
        <div className="alt-pool" style={{ flex: 1 }}>
          <Card style={{ border: '1px solid #f0f0f0', height: 'calc(100vh - 500px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
              <h3>替代料池 - {selectedMainPart?.name || '未选择主料'}</h3>
            </div>
            <>
              <Table
               columns={[
                 {
                   title: '位号',
                   dataIndex: 'position',
                   key: 'position',
                 },
                 {
                   title: '零件名称',
                   dataIndex: 'partName',
                   key: 'partName',
                 },
                 {
                   title: '成本',
                   dataIndex: 'cost',
                   key: 'cost',
                   render: (cost: number) => `¥${cost.toLocaleString()}`,
                 },
                 {
                   title: '生命周期',
                   dataIndex: 'status',
                   key: 'status',
                 },
                 {
                   title: '合规',
                   dataIndex: 'compliant',
                   key: 'compliant',
                   render: (compliant: boolean) => compliant ? <CheckCircleOutlined style={{ color: 'green' }} /> : <ExclamationCircleOutlined style={{ color: 'red' }} />,
                 },
                 {
                   title: 'FFF',
                   dataIndex: 'fffScore',
                   key: 'fffScore',
                   render: (score: number) => {
                     let color = '#1890ff'; // 默认蓝色
                     if (score >= 95) color = 'green';
                     else if (score >= 80 && score < 95) color = 'orange';
                     else color = 'red';
                     return <span style={{ color }}>{score}</span>;
                   },
                 },
                 {
                   title: '默认',
                   dataIndex: 'isDefault',
                   key: 'isDefault',
                   render: (isDefault: boolean) => isDefault ? <StarOutlined style={{ color: 'gold' }} /> : null,
                 },
                 {
                   title: '操作',
                   key: 'action',
                   render: (_: any, record: any) => (
                     <Space size="middle">
                       <Button 
                         onClick={() => setDefault(record)} 
                         disabled={record.isDefault}
                       >
                         设为默认
                       </Button>
                       <Button danger onClick={() => deprecateAlt(record)}>
                         弃用
                       </Button>
                     </Space>
                   ),
                 },
               ]}
              dataSource={filteredAltParts}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              rowSelection={{ 
                selectedRowKeys: selectedRows.map(row => row.id), 
                onChange: (selectedRowKeys, selectedRows) => {
                  console.log('选择行:', selectedRows);
                  setSelectedRows(selectedRows as AltNode[]);
                } 
              }}
              onRow={(record) => ({
                onClick: () => handleAltPartSelect(record)
              })}
              rowClassName={(record) => {
                  // 获取对应的主料信息
                  const mainPart = selectedMainPart || l6MainParts.find(p => p.id === record.parentId);
                   
                  // 红色：生命周期≤PhaseOut
                  if (record.status === 'PhaseOut' || record.status === 'Obsolete' || record.status === 'Not Recommended') {
                    return 'table-row-red';
                  }
                   
                  // 绿色行：成本<主料且合规
                  if (mainPart && record.cost < mainPart.cost && record.compliance) {
                    return 'table-row-green';
                  }
                   
                  // 橙色：成本≥主料
                  if (mainPart && record.cost >= mainPart.cost) {
                    return 'table-row-orange';
                  }
                   
                  return '';
                }}
              style={{
                  backgroundColor: '#fff',
                  borderRadius: '8px 8px 0 0',
                  overflow: 'hidden'
                }}
              />
              
              {/* 批量操作栏 */}
              {selectedRows.length > 0 && (
                <div className="batch-actions" style={{
                  backgroundColor: '#fafafa',
                  padding: '12px 16px',
                  border: '1px solid #f0f0f0',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    已选择 <strong>{selectedRows.length}</strong> 项
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button type="primary" onClick={handleBatchSetDefault}>
                      批量设为默认
                    </Button>
                    <Button danger onClick={handleBatchDeprecate}>
                      批量弃用
                    </Button>
                    <Button onClick={handleBatchAddToBOM}>
                      批量加入BOM
                    </Button>
                    <Button icon={<FileExcelOutlined />} onClick={handleExport}>
                      导出对比表
                    </Button>
                  </div>
                </div>
              )}
            </>
              <style>{`
                .table-row-red {
                  background-color: #ffcccc !important;
                }
                .table-row-orange {
                  background-color: #fff0cc !important;
                }
                .table-row-green {
                  background-color: #e6ffe6 !important;
                }
              `}</style>
          </Card>
        </div>
      </div>

      {/* 底部：批量操作栏 */}
      {selectedRows.length > 0 && (
        <div className="batch-actions" style={{ marginTop: 16, padding: 16, backgroundColor: '#fff', border: '1px solid #f0f0f0', borderRadius: 4 }}>
          <Button type="primary" onClick={handleBatchSetDefault}>
            设为默认
          </Button>
          <Button danger style={{ marginLeft: 10 }} onClick={handleBatchDeprecate}>
            弃用
          </Button>
          <Button style={{ marginLeft: 10 }} onClick={handleBatchAddToBOM}>
            加入BOM
          </Button>
          <Button style={{ marginLeft: 10 }} onClick={handleExport}>
            导出对比表
          </Button>
          <span style={{ marginLeft: 10, color: '#666' }}>已选择 {selectedRows.length} 项</span>
        </div>
      )}

      {renderAddToBOMModal()}
      
      {/* 右侧替代详情抽屉 */}
      <Drawer
          title={`替代料详情 - ${selectedAltPart?.partName || ''}`}
          width={600}
          placement="right"
          onClose={() => setDetailDrawerVisible(false)}
          open={detailDrawerVisible}
      >
        {selectedAltPart && (
          <div style={{ padding: '20px 0' }}>
            {/* 顶部：大图+基础属性 */}
            <div style={{ display: 'flex', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ width: '120px', height: '120px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginRight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src="/placeholder/part.jpg" 
                  alt={selectedAltPart.partName} 
                  style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '4px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <h3>{selectedAltPart.partName}</h3>
                <p style={{ margin: '5px 0' }}>位号: -</p>
                <p style={{ margin: '5px 0' }}>零件编号: {selectedAltPart.partId}</p>
                <p style={{ margin: '5px 0' }}>成本: <strong style={{ color: selectedMainPart && selectedAltPart.cost < selectedMainPart.cost ? 'green' : 'orange' }}>
                  ¥{selectedAltPart.cost.toLocaleString()}
                </strong></p>
                <p style={{ margin: '5px 0' }}>生命周期: {selectedAltPart.status}</p>
                {selectedMainPart && (
                  <p style={{ margin: '5px 0', color: selectedAltPart.cost < selectedMainPart.cost ? 'green' : 'orange' }}>
                    相比主料: {selectedAltPart.cost < selectedMainPart.cost ? '↓' : '↑'} ¥{(Math.abs(selectedAltPart.cost - selectedMainPart.cost)).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px' }}>成本趋势对比 (近12个月)</h4>
              <div style={{ height: '250px', marginBottom: '20px', backgroundColor: '#fff' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getCostComparisonData()}
                    margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`¥${value}`, undefined]} />
                    <Legend />
                    <Line type="monotone" dataKey="mainCost" name="主料成本" stroke="#1890ff" strokeWidth={2} />
                    <Line type="monotone" dataKey="altCost" name="替代料成本" stroke="#52c41a" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div style={{ border: '1px solid #e8e8e8', borderRadius: '6px', padding: '15px', marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px' }}>合规信息</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span>RoHS认证</span>
                {selectedAltPart.compliance && selectedAltPart.compliance.includes('RoHS') ? (
                  <CheckCircleOutlined style={{ color: 'green' }} />
                ) : (
                  <span style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
                    <ExclamationCircleOutlined />
                    <span style={{ marginLeft: '5px' }}>缺失</span>
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span>REACH认证</span>
                {selectedAltPart.compliance && selectedAltPart.compliance.includes('REACH') ? (
                  <CheckCircleOutlined style={{ color: 'green' }} />
                ) : (
                  <span style={{ color: 'red', display: 'flex', alignItems: 'center' }}>
                    <ExclamationCircleOutlined />
                    <span style={{ marginLeft: '5px' }}>缺失</span>
                  </span>
                )}
              </div>
              <div style={{ marginTop: 10 }}>
                {!selectedAltPart.compliance && (
                  <Button type="primary" danger style={{ width: '100%' }}>
                    一键替换为合规零件
                  </Button>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
              <Space size="middle">
                <Button 
                  onClick={() => setDefault(selectedAltPart.id)} 
                  disabled={selectedAltPart.isDefault}
                >
                  设为默认
                </Button>
                <Button danger onClick={() => deprecateAlt(selectedAltPart.id)}>
                  弃用
                </Button>
                <Button type="primary" onClick={() => addToBOM(selectedAltPart.id)}>
                  加入BOM
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SubstitutePage;