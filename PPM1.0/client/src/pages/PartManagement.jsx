import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Input, Button, Row, Col, Drawer, Card, Badge, Avatar, 
  Table, Select, Slider, Checkbox, InputNumber, Modal,
  Empty, Spin, Space, Tag, Steps, Upload, Progress, Tabs, notification,
  Pagination
} from 'antd';
import { 
  SearchOutlined, FilterOutlined, QrcodeOutlined, 
  PlusOutlined, CheckCircleOutlined, EyeOutlined,
  BulbOutlined, DownloadOutlined, BarChartOutlined,
  ArrowLeftOutlined, ArrowRightOutlined, FileExcelOutlined,
  FileTextOutlined, ReloadOutlined, CheckOutlined
} from '@ant-design/icons';
import { fetchParts, createPart, updatePart, importParts, deletePart, deleteParts, deleteAllParts } from '../services/partService';
import PartForm from '../components/PartForm';
const { Option } = Select;
const { TextArea } = Input;

const PartManagement = () => {
  const navigate = useNavigate();
  // 零件数据状态
  const [parts, setParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParts, setSelectedParts] = useState([]);
  
  // 搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  // 视图状态
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [previewDrawerVisible, setPreviewDrawerVisible] = useState(false);
  const [previewPart, setPreviewPart] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15); // 每页显示15个卡片
  
  // 批量操作状态
  const [showAddToBOMModal, setShowAddToBOMModal] = useState(false);
  const [targetBOMId, setTargetBOMId] = useState('');
  const [quantity, setQuantity] = useState(1);
  
  // 过滤器状态
  const [filters, setFilters] = useState({
    productFamily: [],
    category: [],
    lifecycle: [],
    costRange: [0, 5000],
    certification: [],
    stockRange: [0, 10000]
  });
  
  // 模拟数据，用于演示
  const mockParts = [
    {
      partId: 'P001',
      partName: 'i7-1555U处理器',
      position: 'U1',
      productLine: 'X系列',
      category: '电子',
      lifecycle: 'Active',
      cost: 4500,
      stock: 1200,
      substituteGroup: 'CPU-001',
      certification: ['RoHS', 'CE'],
      thumbnailUrl: 'https://pic.rmb.bdstatic.com/bjh/250314/dump/5a5431c5cb6c3b616df1dfcc53268974.jpeg'
    },
    {
      partId: 'P002',
      partName: 'i5-1535U处理器',
      position: 'U2',
      productLine: 'T系列',
      category: '电子',
      lifecycle: 'Active',
      cost: 3200,
      stock: 2500,
      substituteGroup: 'CPU-001',
      certification: ['RoHS', 'CE'],
      thumbnailUrl: 'https://img1.baidu.com/it/u=3171454781,1219845320&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500'
    },
    {
      partId: 'P003',
      partName: 'AMD Ryzen 7 7735U',
      position: 'U3',
      productLine: 'L系列',
      category: '电子',
      lifecycle: 'Active',
      cost: 3800,
      stock: 800,
      substituteGroup: 'CPU-001',
      certification: ['RoHS', 'CE', 'FCC'],
      thumbnailUrl: 'https://p5.itc.cn/q_70/images03/20220817/add1f37f2b7d43c3ad6941d048ca844d.jpeg'
    },
    {
      partId: 'P004',
      partName: 'DDR5-4800内存',
      position: 'RAM1',
      productLine: 'X系列',
      category: '电子',
      lifecycle: 'Active',
      cost: 650,
      stock: 5000,
      substituteGroup: 'RAM-001',
      certification: ['RoHS'],
      thumbnailUrl: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.alicdn.com%2Fimgextra%2Fi3%2F249465071%2FO1CN01kSiLt01nKZKnAtXO9_%21%21249465071.png&refer=http%3A%2F%2Fimg.alicdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1766342484&t=6e8a3b2afeb0a39478604ba0215ea50e'
    },
    {
      partId: 'P005',
      partName: 'DDR5-4200内存',
      position: 'RAM2',
      productLine: 'T系列',
      category: '电子',
      lifecycle: 'PhaseOut',
      cost: 450,
      stock: 3000,
      substituteGroup: 'RAM-001',
      certification: ['RoHS'],
      thumbnailUrl: 'https://doc-fd.zol-img.com.cn/t_s2000x2000/g7/M00/02/05/ChMkLGToQ7SIRUoKAADibhzixeoAAUH8QDPTpoAAOKG486.jpg'
    },
    {
      partId: 'LNB-P001',
      partName: 'ThinkPad X1 Carbon 2023 主板',
      position: 'MB1',
      productLine: 'X系列',
      category: '主板',
      lifecycle: 'Active',
      cost: 3299,
      stock: 800,
      substituteGroup: 'MB-001',
      certification: ['RoHS', 'CE'],
      thumbnailUrl: 'https://img2.baidu.com/it/u=4280095558,1085422884&fm=253&fmt=auto&app=138&f=JPEG?w=667&h=500',
      description: 'ThinkPad X1 Carbon 12th Gen 主板组件，支持Intel Core i7-1365U处理器'
    },
    {
      partId: 'LNB-P002',
      partName: 'ThinkPad 14英寸 2.8K OLED显示屏',
      position: 'LCD1',
      productLine: 'X系列',
      category: '显示屏',
      lifecycle: 'Active',
      cost: 1899,
      stock: 1200,
      substituteGroup: 'LCD-001',
      certification: ['RoHS'],
      thumbnailUrl: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.alicdn.com%2Fimgextra%2Fi4%2FO1CN01iyo7CM1ilz7K1Mvem_%21%214611686018427383606-0-rate.jpg&refer=http%3A%2F%2Fimg.alicdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1766342674&t=5c081436513f865e35aa0c94637c336a',
      description: '14英寸 2.8K (2880x1800) OLED触控显示屏，16:10比例，60Hz刷新率'
    },
    {
      partId: 'LNB-P003',
      partName: 'ThinkPad Ultra Performance电池',
      position: 'BAT1',
      productLine: 'X系列',
      category: '电池',
      lifecycle: 'Active',
      cost: 799,
      stock: 2000,
      substituteGroup: 'BAT-001',
      certification: ['UN38.3', 'RoHS'],
      thumbnailUrl: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fcbu01.alicdn.com%2Fimg%2Fibank%2FO1CN01eXio182JNNNqCcJsS_%21%212214394079409-0-cib.jpg&refer=http%3A%2F%2Fcbu01.alicdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1766342718&t=7471efd6ae86e0a20c2474cc7d92828a',
      description: '72Wh大容量锂离子电池，支持快速充电，最长续航可达20小时'
    },
    {
      partId: 'LNB-P004',
      partName: 'ThinkPad 背光键盘模组',
      position: 'KB1',
      productLine: 'X系列',
      category: '键盘',
      lifecycle: 'Active',
      cost: 399,
      stock: 1500,
      substituteGroup: 'KB-001',
      certification: ['RoHS'],
      thumbnailUrl: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.alicdn.com%2Fimgextra%2Fi4%2F118198933%2FO1CN01kyaKAo2FrMtNrvJ0i_%21%21118198933.jpg&refer=http%3A%2F%2Fimg.alicdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1766342775&t=a3a9f43eae609e1da468f74c47e2a5fb',
      description: '全尺寸背光键盘，带TrackPoint指点杆，防泼溅设计，支持两档亮度调节'
    },
    {
      partId: 'LNB-P005',
      partName: 'Intel Core i7-1365U处理器',
      position: 'CPU1',
      productLine: 'X系列',
      category: '处理器',
      lifecycle: 'Active',
      cost: 1699,
      stock: 900,
      substituteGroup: 'CPU-001',
      certification: ['RoHS', 'CE'],
      thumbnailUrl: 'https://bkimg.cdn.bcebos.com/pic/4a36acaf2edda3cc7cd9c12512b02e01213fb80e3427',
      description: '第13代Intel Core i7-1365U处理器，10核(2P+8E)，最高频率5.0GHz'
    },
    {
      partId: 'LNB-P006',
      partName: 'ThinkPad Thunderbolt 4扩展卡',
      position: 'TB1',
      productLine: 'X系列',
      category: '接口卡',
      lifecycle: 'Active',
      cost: 499,
      stock: 1100,
      substituteGroup: 'IO-001',
      certification: ['RoHS'],
      thumbnailUrl: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.alicdn.com%2Fimgextra%2Fi3%2F21230313%2FO1CN014Jw2EH1EBOsGVK3m4_%21%2121230313.png&refer=http%3A%2F%2Fimg.alicdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1766342881&t=51a712d3a8f92b0c3493595b5d4492bb',
      description: '支持双Thunderbolt 4接口，支持40Gbps数据传输，兼容USB4'
    },
    {
      partId: 'LNB-P007',
      partName: 'NVIDIA GeForce RTX 4050独立显卡',
      position: 'GPU1',
      productLine: 'P系列',
      category: '显卡',
      lifecycle: 'Active',
      cost: 1199,
      stock: 700,
      substituteGroup: 'GPU-001',
      certification: ['RoHS', 'CE'],
      thumbnailUrl: 'https://pic.rmb.bdstatic.com/bjh/3ea8b34f97/241017/65eea359a044447e116c00d76cca1041.png',
      description: 'RTX 4050笔记本电脑独立显卡，6GB GDDR6显存，支持DLSS 3'
    },
    {
      partId: 'LNB-P008',
      partName: 'ThinkPad 16GB DDR5内存模块',
      position: 'RAM1',
      productLine: 'X系列',
      category: '内存',
      lifecycle: 'Active',
      cost: 499,
      stock: 2500,
      substituteGroup: 'RAM-001',
      certification: ['RoHS'],
      thumbnailUrl: 'https://img4.pconline.com.cn/pconline/images/product/20231227/16713333.jpg',
      description: '16GB DDR5-5200MHz SO-DIMM内存模块，CL42时序，低电压设计'
    },
    {
      partId: 'LNB-P009',
      partName: 'ThinkPad 1TB NVMe SSD',
      position: 'SSD1',
      productLine: 'X系列',
      category: '存储设备',
      lifecycle: 'Active',
      cost: 799,
      stock: 1800,
      substituteGroup: 'SSD-001',
      certification: ['RoHS'],
      thumbnailUrl: 'https://img0.baidu.com/it/u=4273132406,2701480455&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
      description: '1TB PCIe Gen4 x4 NVMe SSD，顺序读取速度高达7000MB/s'
    },
    {
      partId: 'LNB-P010',
      partName: 'ThinkPad 智能指纹识别器',
      position: 'FP1',
      productLine: 'X系列',
      category: '生物识别',
      lifecycle: 'Active',
      cost: 199,
      stock: 3000,
      substituteGroup: 'SEC-001',
      certification: ['FCC', 'RoHS'],
      thumbnailUrl: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.alicdn.com%2Fimgextra%2Fi2%2F150893531%2FTB2mf5_viMnBKNjSZFCXXX0KFXa_%21%21150893531.jpg&refer=http%3A%2F%2Fimg.alicdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1766343124&t=030fef59378996c7c49b38e0f4409491',
      description: '集成式指纹识别模块，支持Windows Hello，防篡改设计'
    },
    {
      partId: 'LNB-P011',
      partName: 'ThinkPad Wi-Fi 6E无线网卡',
      position: 'WIFI1',
      productLine: 'X系列',
      category: '网络设备',
      lifecycle: 'Active',
      cost: 299,
      stock: 2200,
      substituteGroup: 'NET-001',
      certification: ['FCC', 'RoHS'],
      thumbnailUrl: 'https://picsum.photos/id/175/200/200',
      description: 'Wi-Fi 6E (802.11ax)无线网卡，支持2.4GHz/5GHz/6GHz三频段，蓝牙5.3'
    },
    {
      partId: 'LNB-P012',
      partName: 'ThinkPad 高清摄像头模组',
      position: 'CAM1',
      productLine: 'X系列',
      category: '摄像头',
      lifecycle: 'Active',
      cost: 249,
      stock: 2800,
      substituteGroup: 'CAM-001',
      certification: ['RoHS'],
      thumbnailUrl: 'https://picsum.photos/id/176/200/200',
      description: '1080p FHD高清摄像头，支持Windows Hello人脸识别，带隐私物理开关'
    },
    {
      partId: 'LNB-P013',
      partName: 'ThinkPad 65W USB-C电源适配器',
      position: 'ADP1',
      productLine: '全系列',
      category: '电源适配器',
      lifecycle: 'Active',
      cost: 399,
      stock: 3500,
      substituteGroup: 'PWR-001',
      certification: ['UL', 'CE', 'RoHS'],
      thumbnailUrl: 'https://picsum.photos/id/177/200/200',
        description: '65W USB-C电源适配器，支持快速充电，兼容USB Power Delivery 3.0'
    },
    {
      partId: 'LNB-P014',
      partName: 'ThinkPad 散热模组',
      position: 'HS1',
      productLine: 'X系列',
      category: '散热系统',
      lifecycle: 'Active',
      cost: 449,
      stock: 1300,
      substituteGroup: 'HS-001',
      certification: ['RoHS'],
      thumbnailUrl: 'https://picsum.photos/id/178/200/200',
      description: '双热管散热模组，搭配高效能风扇，支持智能温控系统'
    },
    {
      partId: 'LNB-P015',
      partName: 'ThinkPad USB-A接口扩展板',
      position: 'USB1',
      productLine: 'X系列',
      category: '接口板',
      lifecycle: 'Active',
      cost: 199,
      stock: 2100,
      substituteGroup: 'IO-002',
      certification: ['RoHS'],
      thumbnailUrl: 'https://picsum.photos/id/179/200/200',
      description: '提供2个USB 3.2 Gen1接口，支持5Gbps数据传输，向下兼容USB 2.0'
    },
    {
      partId: 'LNB-P016',
      partName: 'ThinkPad 音频子系统',
      position: 'AUD1',
      productLine: 'X系列',
      category: '音频设备',
      lifecycle: 'Active',
      cost: 299,
      stock: 1700,
      substituteGroup: 'AUD-001',
      certification: ['RoHS'],
      thumbnailUrl: 'https://picsum.photos/id/180/200/200',
      description: '高品质立体声扬声器，支持Dolby Atmos音效，带麦克风阵列'
    },
    {
      partId: 'LNB-P017',
      partName: 'ThinkPad 镁铝合金上盖',
      position: 'CASE1',
      productLine: 'X系列',
      category: '外壳组件',
      lifecycle: 'Active',
      cost: 699,
      stock: 900,
      substituteGroup: 'CASE-001',
      certification: ['RoHS'],
      thumbnailUrl: 'https://picsum.photos/id/181/200/200',
      description: '轻薄耐用的镁铝合金上盖，带碳纤维增强，防滚架设计'
    },
    {
      partId: 'LNB-P018',
      partName: 'ThinkPad SD读卡器模块',
      position: 'SD1',
      productLine: 'X系列',
      category: '读卡器',
      lifecycle: 'Active',
      cost: 149,
      stock: 2400,
      substituteGroup: 'IO-003',
      certification: ['RoHS'],
      thumbnailUrl: 'https://picsum.photos/id/182/200/200',
      description: '支持SD 4.0高速读卡器，最高读取速度312MB/s，支持UHS-II标准'
    },
    {
      partId: 'LNB-P019',
      partName: 'ThinkPad 触控板组件',
      position: 'TP1',
      productLine: 'X系列',
      category: '输入设备',
      lifecycle: 'Active',
      cost: 299,
      stock: 1600,
      substituteGroup: 'INPUT-001',
      certification: ['RoHS'],
      thumbnailUrl: 'https://picsum.photos/id/183/200/200',
      description: '玻璃材质多点触控板，支持手势操作，带物理按键'
    },
    {
      partId: 'LNB-P020',
      partName: 'ThinkPad 电源管理模块',
      position: 'PWRMGMT1',
      productLine: 'X系列',
      category: '电源管理',
      lifecycle: 'Active',
      cost: 349,
      stock: 1400,
      substituteGroup: 'PWR-002',
      certification: ['RoHS'],
      thumbnailUrl: 'https://picsum.photos/id/184/200/200',
      description: '智能电源管理电路，支持多种电源模式，电量保护功能'
    }
  ];
  
  // 表单相关状态
  const [selectedPart, setSelectedPart] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // 批量导入相关状态
  const [importStep, setImportStep] = useState(1); // 1:上传, 2:AI预处理, 3:差异修正, 4:批量写入, 5:结果导出
  const [importFile, setImportFile] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [aiProcessedData, setAiProcessedData] = useState([]);
  const [aiResult, setAiResult] = useState({
    dedupList: [],
    missingList: [],
    categoryList: [],
    lifecycleList: []
  });
  const [diffResult, setDiffResult] = useState({
    diffList: [],
    costRangeList: [],
    complianceList: []
  });
  const [correctedData, setCorrectedData] = useState([]);
  const [writeResult, setWriteResult] = useState({
    successCount: 0,
    failCount: 0,
    failRows: []
  });
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  useEffect(() => {
    loadParts();
    loadFiltersFromStorage();
  }, []);

  const loadParts = async () => {
    try {
      setLoading(true);
      // 模拟API调用，实际使用时替换为真实API
      // const response = await fetchParts();
      // const data = response.parts || response;
      
      // 使用模拟数据
      const data = mockParts;
      setParts(data);
      setFilteredParts(data);
    } catch (error) {
      console.error('Error loading parts:', error);
      alert('加载零件失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 从localStorage加载筛选方案
  const loadFiltersFromStorage = () => {
    const savedFilters = localStorage.getItem('partSearchFilters');
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    }
  };
  
  // 保存筛选方案到localStorage
  const saveFiltersToStorage = (newFilters) => {
    localStorage.setItem('partSearchFilters', JSON.stringify(newFilters));
  };
  
  // 三合一搜索功能
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    
    // 清除之前的定时器
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // 300ms debounce
    const timeout = setTimeout(() => {
      filterParts(value, filters);
      setCurrentPage(1); // 搜索时重置到第一页
    }, 300);
    
    setSearchTimeout(timeout);
  }, [searchTimeout, filters]);
  
  // 过滤零件数据
  const filterParts = useCallback((term, appliedFilters) => {
    let results = [...parts];
    
    // 搜索词过滤
    if (term) {
      const searchTerm = term.toLowerCase();
      results = results.filter(part => 
        part.partId.toLowerCase().includes(searchTerm) ||
        part.partName.toLowerCase().includes(searchTerm) ||
        part.position.toLowerCase().includes(searchTerm)
      );
    }
    
    // 应用过滤器
    if (appliedFilters.productFamily.length > 0) {
      results = results.filter(part => 
        appliedFilters.productFamily.includes(part.productLine)
      );
    }
    
    if (appliedFilters.category.length > 0) {
      results = results.filter(part => 
        appliedFilters.category.includes(part.category)
      );
    }
    
    if (appliedFilters.lifecycle.length > 0) {
      results = results.filter(part => 
        appliedFilters.lifecycle.includes(part.lifecycle)
      );
    }
    
    // 成本范围过滤
    results = results.filter(part => 
      part.cost >= appliedFilters.costRange[0] && 
      part.cost <= appliedFilters.costRange[1]
    );
    
    // 认证过滤
    if (appliedFilters.certification.length > 0) {
      results = results.filter(part => 
        appliedFilters.certification.some(cert => part.certification.includes(cert))
      );
    }
    
    // 库存范围过滤
    results = results.filter(part => 
      part.stock >= appliedFilters.stockRange[0] && 
      part.stock <= appliedFilters.stockRange[1]
    );
    
    setFilteredParts(results);
  }, [parts]);
  
  // 处理过滤器变更
  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    saveFiltersToStorage(newFilters);
    filterParts(searchTerm, newFilters);
    setCurrentPage(1); // 筛选时重置到第一页
  };
  
  // 处理零件悬停，显示预览抽屉
  const handlePartHover = (part) => {
    setPreviewPart(part);
    setPreviewDrawerVisible(true);
  };
  
  // 处理零件选中
  const handlePartSelect = (part) => {
    if (selectedParts.find(p => p.partId === part.partId)) {
      setSelectedParts(selectedParts.filter(p => p.partId !== part.partId));
    } else {
      setSelectedParts([...selectedParts, part]);
    }
  };
  
  // 批量加入BOM
  const handleBatchAddToBOM = () => {
    setShowAddToBOMModal(true);
  };
  
  // 确认加入BOM
  const confirmAddToBOM = () => {
    // 模拟加入BOM操作
    console.log('Adding parts to BOM:', targetBOMId, selectedParts, quantity);
    setShowAddToBOMModal(false);
    setSelectedParts([]);
    alert(`成功将 ${selectedParts.length} 个零件加入BOM`);
  };
  
  // 获取替代料
  const getSubstituteParts = (part) => {
    return parts.filter(p => 
      p.substituteGroup === part.substituteGroup && 
      p.partId !== part.partId &&
      p.lifecycle === 'Active'
    );
  };
  
  // 导出Excel
  const handleExportExcel = () => {
    // 模拟导出Excel
    console.log('Exporting to Excel:', filteredParts);
    alert('导出成功');
  };
  
  // 生成对比车
  const handleGenerateComparison = () => {
    // 最多选择4个零件
    const comparisonParts = selectedParts.slice(0, 4);
    console.log('Generating comparison for:', comparisonParts);
    alert(`已生成 ${comparisonParts.length} 个零件的对比`);
  };

  // 保留原有功能，但在新界面中可能不再直接使用
  const handleCreate = () => {
    setSelectedPart(null);
    setShowForm(true);
  };

  const handleEdit = (part) => {
    setSelectedPart(part);
    setShowForm(true);
  };

  const handleSave = async (partData) => {
    try {
      if (selectedPart) {
        await updatePart(selectedPart._id, partData);
      } else {
        await createPart(partData);
      }
      setShowForm(false);
      loadParts(); // Refresh the list
    } catch (error) {
      console.error('Error saving part:', error);
      alert('Failed to save part: ' + error.message);
    }
  };

  // 批量导入核心逻辑 - 模拟数据生成
  const generateMockData = () => {
    const mockParts = [
      { partId: 'P001', partName: 'i7-1555U处理器', position: 'U1', productLine: 'X系列', category: '电子', lifecycle: 'Active', cost: 4500, stock: 1200, substituteGroup: 'CPU-001', certification: ['RoHS', 'CE'] },
      { partId: 'P002', partName: 'i5-1535U处理器', position: 'U2', productLine: 'T系列', category: '电子', lifecycle: 'Active', cost: 3200, stock: 2500, substituteGroup: 'CPU-001', certification: ['RoHS', 'CE'] },
      { partId: 'P003', partName: 'AMD Ryzen 7 7735U', position: 'U3', productLine: 'L系列', category: '电子', lifecycle: 'Active', cost: 3800, stock: 800, substituteGroup: 'CPU-001', certification: ['RoHS', 'CE', 'FCC'] },
      { partId: 'P004', partName: 'DDR5-4800内存', position: 'RAM1', productLine: 'X系列', category: '电子', lifecycle: 'Active', cost: 650, stock: 5000, substituteGroup: 'RAM-001', certification: ['RoHS'] },
      { partId: 'P005', partName: 'DDR5-4200内存', position: 'RAM2', productLine: 'T系列', category: '电子', lifecycle: 'PhaseOut', cost: 450, stock: 3000, substituteGroup: 'RAM-001', certification: ['RoHS'] },
      { partId: 'P006', partName: 'RTX 4070显卡', position: 'GPU1', productLine: 'G系列', category: '电子', lifecycle: 'Active', cost: 4200, stock: 500, substituteGroup: 'GPU-001', certification: ['RoHS', 'CE'] },
      { partId: 'P007', partName: 'RTX 4060显卡', position: 'GPU2', productLine: 'G系列', category: '电子', lifecycle: 'Active', cost: 2800, stock: 800, substituteGroup: 'GPU-001', certification: ['RoHS', 'CE'] },
      { partId: 'P008', partName: 'NVMe 1TB SSD', position: 'SSD1', productLine: 'X系列', category: '存储', lifecycle: 'Active', cost: 750, stock: 3000, substituteGroup: 'SSD-001', certification: ['RoHS'] },
      { partId: 'P009', partName: 'NVMe 512GB SSD', position: 'SSD2', productLine: 'T系列', category: '存储', lifecycle: 'Active', cost: 420, stock: 4000, substituteGroup: 'SSD-001', certification: ['RoHS'] },
      { partId: 'P010', partName: '16GB DDR5内存', position: 'RAM3', productLine: 'L系列', category: '电子', lifecycle: 'PhaseOut', cost: 320, stock: 6000, substituteGroup: 'RAM-001', certification: ['RoHS'] }
    ];
    
    return {
      aiResult: {
        dedupList: [{ duplicateRows: [2, 3], mainRow: 2, fields: ['partName', 'cost'] }],
        missingList: [{ rowIndex: 4, missingFields: ['certification'] }, { rowIndex: 9, missingFields: ['stock'] }],
        categoryList: mockParts.map((part, index) => ({ index, predictedCategory: part.category, confidence: 0.95 })),
        lifecycleList: mockParts.map((part, index) => ({ index, predictedLifecycle: part.lifecycle, confidence: 0.92 })),
        processedData: mockParts
      },
      diffResult: {
        diffList: [
          { index: 0, field: 'cost', currentValue: 4500, mdmValue: 4499, source: 'SAP' },
          { index: 2, field: 'certification', currentValue: ['RoHS', 'CE', 'FCC'], mdmValue: ['RoHS', 'CE'], source: 'MDM' },
          { index: 5, field: 'stock', currentValue: 500, mdmValue: 480, source: 'SAP' }
        ],
        costRangeList: mockParts.map((part, index) => ({ 
          index, 
          currentCost: part.cost, 
          minCost: Math.round(part.cost * 0.95), 
          maxCost: Math.round(part.cost * 1.05) 
        })),
        complianceList: [
          { index: 6, partId: 'P007', issue: 'RoHS合规检查待处理', suggestion: '使用RTX 4060 Ti替代' },
          { index: 9, partId: 'P010', issue: '产品即将停产', suggestion: '升级到DDR5-5200内存' }
        ]
      },
      writeResult: {
        successCount: 8,
        failCount: 2,
        failRows: [
          { index: 6, partId: 'P007', reason: '合规检查失败' },
          { index: 9, partId: 'P010', reason: '生命周期已过期' }
        ]
      }
    };
  };

  // 批量导入 - 步骤导航
  const handleImportNextStep = () => {
    if (importStep < 5) {
      setImportStep(importStep + 1);
    }
  };

  const handleImportPrevStep = () => {
    if (importStep > 1) {
      setImportStep(importStep - 1);
    }
  };

  // 批量导入 - 重置
  const handleImportReset = () => {
    setImportStep(1);
    setImportFile(null);
    setColumnMapping({});
    setAiProcessedData([]);
    setAiResult({ dedupList: [], missingList: [], categoryList: [], lifecycleList: [] });
    setDiffResult({ diffList: [], costRangeList: [], complianceList: [] });
    setCorrectedData([]);
    setWriteResult({ successCount: 0, failCount: 0, failRows: [] });
    setImportProgress(0);
  };

  // 批量导入 - 文件上传处理
  const handleFileUpload = (file) => {
    if (file.size > 50 * 1024 * 1024) {
      notification.error({ message: '文件大小超限', description: '文件大小不能超过50MB' });
      return false;
    }
    
    const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    if (!validTypes.includes(file.type)) {
      notification.error({ message: '文件格式无效', description: '请上传.xlsx或.csv文件' });
      return false;
    }
    
    setImportFile(file);
    return false; // 阻止自动上传
  };

  // 批量导入 - AI预处理
  const handleAIPreprocess = async () => {
    setImportLoading(true);
    setImportProgress(0);
    
    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
          }
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 200);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData = generateMockData();
      setAiResult(mockData.aiResult);
      setAiProcessedData(mockData.aiResult.processedData);
      setCorrectedData([...mockData.aiResult.processedData]);
      
      handleImportNextStep();
    } catch (error) {
      notification.error({ message: 'AI预处理失败', description: error.message });
    } finally {
      setImportLoading(false);
      setImportProgress(100);
    }
  };

  // 批量导入 - 差异检测
  const handleDiffDetection = async () => {
    setImportLoading(true);
    setImportProgress(0);
    
    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = prev + 20;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
          }
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 150);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockData = generateMockData();
      setDiffResult(mockData.diffResult);
      
      handleImportNextStep();
    } catch (error) {
      notification.error({ message: '差异检测失败', description: error.message });
    } finally {
      setImportLoading(false);
      setImportProgress(100);
    }
  };

  // 批量导入 - 批量写入
  const handleBulkWrite = async () => {
    setImportLoading(true);
    setImportProgress(0);
    
    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
          }
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 300);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockData = generateMockData();
      setWriteResult(mockData.writeResult);
      
      handleImportNextStep();
    } catch (error) {
      notification.error({ message: '批量写入失败', description: error.message });
    } finally {
      setImportLoading(false);
      setImportProgress(100);
    }
  };

  // 批量导入 - 结果导出
  const handleExportResults = () => {
    handleImportNextStep();
    // 实际项目中这里会生成并下载Excel文件
    notification.success({ message: '导出成功', description: '结果文件已生成' });
  };

  // 批量导入 - 打开导入页面
  // 批量导入功能已移至专用页面

  // 原始导入函数（保留兼容性）
  const handleImport = async (file) => {
    try {
      const result = await importParts(file);
      loadParts(); // Refresh the list
      return result;
    } catch (error) {
      console.error('Error importing parts:', error);
      throw error;
    }
  };

  // 渲染零件卡片
  const renderPartCard = (part) => {
    const isSelected = selectedParts.find(p => p.partId === part.partId);
    
    return (
      <Card 
        key={part.partId}
        hoverable
        cover={
          <div className="relative">
            <img alt={part.partName} src={part.thumbnailUrl} className="h-32 w-full object-cover" />
            {isSelected && (
              <div className="absolute top-2 right-2">
                <Badge count={1} showZero={false} color="blue" />
              </div>
            )}
          </div>
        }
        className={`cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => handlePartSelect(part)}
        onMouseEnter={() => handlePartHover(part)}
      >
        <div className="flex justify-between items-start">
          <h3 className="text-base font-medium">{part.partName}</h3>
          <Badge status={part.lifecycle === 'Active' ? 'success' : 'warning'} text={part.lifecycle} />
        </div>
        <p className="text-sm text-gray-500">位号: {part.position}</p>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-lg font-bold text-blue-600">¥{part.cost.toLocaleString()}</span>
          <span className="text-sm">库存: {part.stock.toLocaleString()}</span>
        </div>
        <div className="mt-3 flex justify-between">
          <Button size="small" type="primary" icon={<PlusOutlined />}>加入BOM</Button>
          <Button size="small" icon={<BulbOutlined />}>替代料</Button>
          <Button size="small" icon={<EyeOutlined />}>详情</Button>
        </div>
      </Card>
    );
  };
  
  // 表格列定义
  const columns = [
    {
      title: () => (
        <Checkbox 
          checked={selectedParts.length === filteredParts.length && filteredParts.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedParts([...filteredParts]);
            } else {
              setSelectedParts([]);
            }
          }}
        />
      ),
      key: 'select',
      render: (_, part) => (
        <Checkbox 
          checked={selectedParts.find(p => p.partId === part.partId) !== undefined}
          onChange={() => handlePartSelect(part)}
        />
      ),
      width: 40
    },
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
      render: (cost) => `¥${cost.toLocaleString()}`,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock) => stock.toLocaleString(),
    },
    {
      title: '生命周期',
      dataIndex: 'lifecycle',
      key: 'lifecycle',
      render: (lifecycle) => (
        <Badge status={lifecycle === 'Active' ? 'success' : 'warning'} text={lifecycle} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, part) => (
        <Space size="middle">
          <Button size="small" type="primary" icon={<PlusOutlined />}>加入BOM</Button>
          <Button size="small" icon={<BulbOutlined />}>替代料</Button>
        </Space>
      ),
    },
  ];
  
  // 渲染过滤器抽屉
  const renderFilterDrawer = () => (
    <Drawer
      title="高级筛选"
      placement="left"
      onClose={() => setShowFilterDrawer(false)}
      open={showFilterDrawer}
      width={300}
    >
      <div className="space-y-6 p-2">
        {/* 产品族 */}
        <div>
          <h3 className="text-base font-medium mb-2">产品族</h3>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="选择产品族"
            value={filters.productFamily}
            onChange={(value) => handleFilterChange('productFamily', value)}
          >
            <Option value="X系列">X系列</Option>
            <Option value="T系列">T系列</Option>
            <Option value="L系列">L系列</Option>
          </Select>
        </div>
        
        {/* 类别 */}
        <div>
          <h3 className="text-base font-medium mb-2">类别</h3>
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="选择类别"
            value={filters.category}
            onChange={(value) => handleFilterChange('category', value)}
          >
            <Option value="电子">电子</Option>
            <Option value="结构">结构</Option>
            <Option value="包装">包装</Option>
          </Select>
        </div>
        
        {/* 生命周期 */}
        <div>
          <h3 className="text-base font-medium mb-2">生命周期</h3>
          <div className="space-y-2">
            <Checkbox 
              checked={filters.lifecycle.includes('Active')}
              onChange={(e) => {
                const newLifecycle = e.target.checked 
                  ? [...filters.lifecycle, 'Active']
                  : filters.lifecycle.filter(l => l !== 'Active');
                handleFilterChange('lifecycle', newLifecycle);
              }}
            >
              Active
            </Checkbox>
            <Checkbox 
              checked={filters.lifecycle.includes('PhaseOut')}
              onChange={(e) => {
                const newLifecycle = e.target.checked 
                  ? [...filters.lifecycle, 'PhaseOut']
                  : filters.lifecycle.filter(l => l !== 'PhaseOut');
                handleFilterChange('lifecycle', newLifecycle);
              }}
            >
              PhaseOut
            </Checkbox>
            <Checkbox 
              checked={filters.lifecycle.includes('Obs')}
              onChange={(e) => {
                const newLifecycle = e.target.checked 
                  ? [...filters.lifecycle, 'Obs']
                  : filters.lifecycle.filter(l => l !== 'Obs');
                handleFilterChange('lifecycle', newLifecycle);
              }}
            >
              Obs
            </Checkbox>
          </div>
        </div>
        
        {/* 成本区间 */}
        <div>
          <h3 className="text-base font-medium mb-2">成本区间</h3>
          <Slider
            range
            min={0}
            max={5000}
            value={filters.costRange}
            onChange={(value) => handleFilterChange('costRange', value)}
          />
          <div className="flex justify-between text-sm">
            <span>¥{filters.costRange[0]}</span>
            <span>¥{filters.costRange[1]}</span>
          </div>
        </div>
        
        {/* 认证 */}
        <div>
          <h3 className="text-base font-medium mb-2">认证</h3>
          <div className="space-y-2">
            <Checkbox 
              checked={filters.certification.includes('RoHS')}
              onChange={(e) => {
                const newCert = e.target.checked 
                  ? [...filters.certification, 'RoHS']
                  : filters.certification.filter(c => c !== 'RoHS');
                handleFilterChange('certification', newCert);
              }}
            >
              RoHS
            </Checkbox>
            <Checkbox 
              checked={filters.certification.includes('CE')}
              onChange={(e) => {
                const newCert = e.target.checked 
                  ? [...filters.certification, 'CE']
                  : filters.certification.filter(c => c !== 'CE');
                handleFilterChange('certification', newCert);
              }}
            >
              CE
            </Checkbox>
            <Checkbox 
              checked={filters.certification.includes('FCC')}
              onChange={(e) => {
                const newCert = e.target.checked 
                  ? [...filters.certification, 'FCC']
                  : filters.certification.filter(c => c !== 'FCC');
                handleFilterChange('certification', newCert);
              }}
            >
              FCC
            </Checkbox>
          </div>
        </div>
        
        {/* 库存区间 */}
        <div>
          <h3 className="text-base font-medium mb-2">库存区间</h3>
          <div className="flex space-x-2 mb-2">
            <InputNumber 
              min={0}
              value={filters.stockRange[0]}
              onChange={(value) => {
                const newRange = [...filters.stockRange];
                newRange[0] = value;
                handleFilterChange('stockRange', newRange);
              }}
              style={{ width: '100%' }}
            />
            <span>-</span>
            <InputNumber 
              min={0}
              value={filters.stockRange[1]}
              onChange={(value) => {
                const newRange = [...filters.stockRange];
                newRange[1] = value;
                handleFilterChange('stockRange', newRange);
              }}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </Drawer>
  );
  
  // 渲染预览抽屉
  const renderPreviewDrawer = () => {
    if (!previewPart) return null;
    
    const substitutes = getSubstituteParts(previewPart);
    
    return (
      <Drawer
        title={`零件详情: ${previewPart.partName}`}
        placement="right"
        onClose={() => setPreviewDrawerVisible(false)}
        open={previewDrawerVisible}
        width={400}
      >
        <div className="space-y-4">
          {/* 零件大图 */}
          <div className="flex justify-center">
            <img 
              alt={previewPart.partName} 
              src={previewPart.thumbnailUrl} 
              className="h-48 object-contain border rounded"
            />
          </div>
          
          {/* 基础属性 */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">零件ID:</span>
              <span>{previewPart.partId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">位号:</span>
              <span>{previewPart.position}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">产品族:</span>
              <span>{previewPart.productLine}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">成本:</span>
              <span className="font-bold text-blue-600">¥{previewPart.cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">库存:</span>
              <span>{previewPart.stock.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">认证:</span>
              <div>
                {previewPart.certification.map(cert => (
                  <Tag key={cert} color="blue">{cert}</Tag>
                ))}
              </div>
            </div>
          </div>
          
          {/* 替代料 */}
          <div>
            <h3 className="text-base font-medium mb-2">替代料 ({substitutes.length})</h3>
            {substitutes.length > 0 ? (
              <div className="space-y-2">
                {substitutes.map(sub => {
                  const costDiff = sub.cost - previewPart.cost;
                  const costDiffPercent = (costDiff / previewPart.cost * 100).toFixed(1);
                  
                  return (
                    <div key={sub.partId} className="border rounded p-2">
                      <div className="flex justify-between">
                        <span>{sub.partName}</span>
                        <Badge status={costDiff < 0 ? 'success' : 'error'} 
                          text={costDiff < 0 ? '节省' : '超支'} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>¥{sub.cost.toLocaleString()}</span>
                        <span className={costDiff < 0 ? 'text-green-600' : 'text-red-600'}>
                          {costDiff < 0 ? '-' : '+'}{Math.abs(costDiffPercent)}%
                        </span>
                      </div>
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>成本对比</span>
                          <span>{costDiffPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${costDiff < 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(Math.abs(costDiffPercent), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty description="无替代料" />
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="flex space-x-2">
            <Button type="primary" block onClick={() => {
              setTargetBOMId('');
              setQuantity(1);
              setPreviewDrawerVisible(false);
              setShowAddToBOMModal(true);
            }}>
              加入BOM
            </Button>
            <Button onClick={() => {
              // 实现详情跳转逻辑
              alert(`查看零件 ${previewPart.partId} 的详细信息`);
            }}>
              详情
            </Button>
          </div>
        </div>
      </Drawer>
    );
  };
  
  // 渲染加入BOM弹窗
  const renderAddToBOMModal = () => (
    <Modal
      title="加入BOM"
      open={showAddToBOMModal}
      onOk={confirmAddToBOM}
      onCancel={() => setShowAddToBOMModal(false)}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">选择目标BOM</label>
          <Select
            placeholder="选择BOM"
            style={{ width: '100%' }}
            value={targetBOMId}
            onChange={setTargetBOMId}
          >
            <Option value="BOM001">产品A - 主BOM</Option>
            <Option value="BOM002">产品B - 主BOM</Option>
            <Option value="BOM003">产品C - 主BOM</Option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">数量</label>
          <InputNumber min={1} defaultValue={1} onChange={setQuantity} style={{ width: '100%' }} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">选择的零件</label>
          <div className="border rounded p-2 max-h-40 overflow-y-auto">
            {selectedParts.map(part => (
              <div key={part.partId} className="flex justify-between items-center py-1">
                <span>{part.partName} ({part.partId})</span>
                <Badge count={1} showZero={false} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );

  // 渲染顶部搜索区
  const renderSearchBar = () => (
    <div className="sticky top-0 bg-white p-4 shadow-sm z-5">
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="输入位号/名称/型号/描述"
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <Button 
          icon={<FilterOutlined />} 
          onClick={() => setShowFilterDrawer(true)}
        >
          高级筛选
        </Button>
        <Button icon={<QrcodeOutlined />}>扫码搜索</Button>
        <Button 
          type="primary" 
          icon={<FileExcelOutlined />} 
          onClick={() => navigate('/parts/import')}
        >
          批量导入
        </Button>
      </div>
    </div>
  );
  
  // 渲染结果区
  const renderResults = () => (
    <div className="p-4">
      {/* 视图切换和统计 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          找到 {filteredParts.length} 个零件
        </div>
        <div className="flex space-x-2">
          <Button 
            type={viewMode === 'card' ? 'primary' : 'default'} 
            onClick={() => setViewMode('card')}
          >
            卡片视图
          </Button>
          <Button 
            type={viewMode === 'table' ? 'primary' : 'default'} 
            onClick={() => setViewMode('table')}
          >
            表格视图
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Spin size="large" />
        </div>
      ) : filteredParts.length === 0 ? (
        <Empty description="暂无匹配的零件" />
      ) : viewMode === 'card' ? (
        <>
          <Row gutter={[16, 16]}>
            {filteredParts
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map(part => (
                <Col xs={24} sm={12} lg={8} xxl={6} key={part.partId}>
                  {renderPartCard(part)}
                </Col>
              ))
            }
          </Row>
          {filteredParts.length > pageSize && (
            <div className="mt-8 flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredParts.length}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showTotal={(total, range) => `${range[0]}-${range[1]} 条，共 ${total} 条`}
              />
            </div>
          )}
        </>
      ) : (
        <Table 
          columns={columns} 
          dataSource={filteredParts} 
          rowKey="partId" 
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onMouseEnter: () => handlePartHover(record),
          })}
        />
      )}
    </div>
  );
  
  // 渲染底部批量操作栏
  const renderBatchActions = () => {
    if (selectedParts.length === 0) return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex justify-between items-center z-20">
        <div>
          已选择 {selectedParts.length} 个零件
        </div>
        <div className="flex space-x-2">
          <Button type="primary" onClick={handleBatchAddToBOM}>
            加入BOM
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
            导出Excel
          </Button>
          <Button icon={<BarChartOutlined />} onClick={handleGenerateComparison}>
            生成对比车
          </Button>
        </div>
      </div>
    );
  };
  
  // 主渲染
  if (showForm) {
    return (
      <div className="part-management">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <PartForm 
            part={selectedPart}
            onSave={handleSave}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="part-management min-h-screen">
      {/* 顶部搜索区 */}
      {renderSearchBar()}
      
      {/* 主内容区 */}
      <div className="pb-20">{renderResults()}</div>
      
      {/* 过滤器抽屉 */}
      {renderFilterDrawer()}
      
      {/* 预览抽屉 */}
      {renderPreviewDrawer()}
      
      {/* 批量操作栏 */}
      {renderBatchActions()}
      
      {/* 加入BOM弹窗 */}
      {renderAddToBOMModal()}
      
      {/* 批量导入模态框 */}
      <Modal
        title="零件批量导入"
        open={showImportModal}
        onCancel={() => setShowImportModal(false)}
        footer={null}
        width={900}
        centered
      >
        {/* 步骤条 */}
        <Steps
          current={importStep - 1}
          className="mb-6"
          items={[
            { title: '上传文件', description: '上传.xlsx或.csv文件' },
            { title: 'AI预处理', description: '自动补全、去重、分类' },
            { title: '差异修正', description: '对比MDM/SAP并修正' },
            { title: '批量写入', description: '写入数据库并同步' },
            { title: '结果导出', description: '导出成功/失败结果' }
          ]}
        />

        {/* 进度条 */}
        {importProgress > 0 && importProgress < 100 && (
          <Progress percent={importProgress} status="active" className="mb-6" />
        )}

        {/* 步骤内容 */}
        <div className="mb-6">
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
                  <Button icon={<FileTextOutlined />}>下载模板</Button>
                  <Button icon={<FileTextOutlined />}>查看说明</Button>
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
                    { title: '生命周期', dataIndex: ['lifecycle'], key: 'lifecycle' },
                    { title: '成本', dataIndex: ['cost'], key: 'cost' },
                  ]}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  scroll={{ x: 800 }}
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
                          <Button size="small" type="link">AI补全</Button>
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
                    { title: '零件ID', dataIndex: ['partId'], key: 'partId' },
                    { title: '零件名称', dataIndex: ['partName'], key: 'partName' },
                    { title: '成本', 
                      dataIndex: ['cost'], 
                      key: 'cost',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'cost');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                    { title: '库存', 
                      dataIndex: ['stock'], 
                      key: 'stock',
                      render: (value, _, index) => {
                        const hasDiff = diffResult.diffList.some(d => d.index === index && d.field === 'stock');
                        return hasDiff ? <span className="text-red-600">{value}</span> : value;
                      }
                    },
                  ]}
                  pagination={{ pageSize: 5 }}
                  size="small"
                  scroll={{ x: 800 }}
                />
              </div>

              {/* 差异提示卡片 */}
              <div className="space-y-4">
                {diffResult.diffList.length > 0 && (
                  <Card title="差异列表" type="inner">
                    <div className="text-sm">
                      {diffResult.diffList.map((diff, index) => (
                        <div key={index} className="mb-2">
                          <p>第{diff.index + 1}行 - {diff.field}：当前值 {diff.currentValue} vs MDM值 {diff.mdmValue}</p>
                          <Button size="small" type="link">采纳MDM值</Button>
                          <Button size="small" type="link">保持当前值</Button>
                        </div>
                      ))}
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
                          { title: '失败原因', dataIndex: ['reason'], key: 'reason' },
                        ]}
                        pagination={false}
                        size="small"
                      />
                      <Button size="small" type="link" className="mt-2">下载失败记录</Button>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 步骤5：结果导出 */}
          {importStep === 5 && (
            <div>
              <h3 className="text-lg font-medium mb-4">导入结果摘要</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="text-center bg-green-50 border-green-200">
                  <div className="text-3xl font-bold text-green-600">{writeResult.successCount}</div>
                  <div className="text-sm text-green-700">成功导入</div>
                </Card>
                <Card className="text-center bg-red-50 border-red-200">
                  <div className="text-3xl font-bold text-red-600">{writeResult.failCount}</div>
                  <div className="text-sm text-red-700">导入失败</div>
                </Card>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <h4 className="text-md font-medium mb-4">导出选项</h4>
                <div className="flex justify-center space-x-4">
                  <Button type="primary" icon={<FileExcelOutlined />} size="large">
                    导出全部结果
                  </Button>
                  {writeResult.failCount > 0 && (
                    <Button icon={<FileExcelOutlined />} size="large">
                      仅导出失败记录
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-between items-center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleImportPrevStep}
            disabled={importStep === 1 || importLoading}
          >
            上一步
          </Button>
          
          {importStep < 5 ? (
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              loading={importLoading}
              disabled={importStep === 1 && !importFile}
              onClick={() => {
                switch (importStep) {
                  case 1: handleAIPreprocess(); break;
                  case 2: handleDiffDetection(); break;
                  case 3: handleBulkWrite(); break;
                  case 4: handleExportResults(); break;
                }
              }}
            >
              {importStep === 1 ? '开始预处理' :
               importStep === 2 ? '检测差异' :
               importStep === 3 ? '批量写入' :
               '导出结果'}
            </Button>
          ) : (
            <div className="flex space-x-4">
              <Button onClick={handleImportReset} icon={<ReloadOutlined />}>
                重新导入
              </Button>
              <Button type="primary" onClick={() => {
                setShowImportModal(false);
                handleImportReset();
                loadParts(); // 刷新零件列表
              }}>
                完成
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default PartManagement;