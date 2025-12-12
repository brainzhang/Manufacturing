import React, { useState, useEffect } from 'react';
import { Drawer, Table, Input, Select, Button, Space, message, Tag, Typography } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

// 模拟零件数据 - 20个真实业务数据
const mockPartsData = [
  {
    id: 'LNB-P001',
    name: 'ThinkPad X1 Carbon A壳',
    description: '碳纤维复合材质笔记本上盖',
    category: '机身覆盖件',
    cost: 1580,
    supplier: '富士康科技集团',
    lifecycle: 'Active',
    specifications: {
      brand: 'Lenovo',
      model: '5M10Y69781',
      material: '碳纤维复合',
      dimensions: '323x217x3.2mm',
      weight: '125g',
      color: '碳黑色'
    }
  },
  {
    id: 'LNB-P002',
    name: 'ThinkPad T14 键盘框架',
    description: '镁铝合金键盘支撑结构件',
    category: '机身结构件',
    cost: 850,
    supplier: '广达电脑',
    lifecycle: 'Active',
    specifications: {
      brand: 'Lenovo',
      model: '5M10W84275',
      material: '镁铝合金',
      dimensions: '332x227x1.5mm',
      weight: '180g',
      color: '银色'
    }
  },
  {
    id: 'LNB-P003',
    name: 'ThinkPad 通用转轴组件',
    description: '不锈钢转轴，适用于全系列ThinkPad',
    category: '机身结构件',
    cost: 320,
    supplier: '群光电子',
    lifecycle: 'Active',
    specifications: {
      brand: 'Lenovo',
      model: '5M10V64123',
      material: '不锈钢',
      dimensions: '25x18x12mm',
      weight: '45g',
      color: '银色'
    }
  },
  {
    id: 'LNB-P004',
    name: 'ThinkPad T14 14寸LCD屏幕',
    description: '14英寸FHD IPS液晶显示屏',
    category: '显示屏',
    cost: 1850,
    supplier: '友达光电',
    lifecycle: 'Active',
    specifications: {
      brand: 'AU Optronics',
      model: 'B140HTN03.1',
      type: 'IPS LCD',
      resolution: '1920x1080',
      dimensions: '309.4x173.9x3.2mm',
      weight: '250g'
    }
  },
  {
    id: 'LNB-P005',
    name: 'ThinkPad X1 Carbon 电池组',
    description: '57Wh内置锂离子电池',
    category: '电源部件',
    cost: 680,
    supplier: '松下电器',
    lifecycle: 'Active',
    specifications: {
      brand: 'Panasonic',
      model: '5B10W51834',
      capacity: '57Wh',
      voltage: '11.55V',
      type: '锂离子电池'
    }
  },
  {
    id: 'LNB-P006',
    name: 'ThinkPad T16 散热风扇',
    description: 'CPU散热模块，含铜质散热管',
    category: '散热部件',
    cost: 420,
    supplier: '台达电子',
    lifecycle: 'Active',
    specifications: {
      brand: 'Delta',
      model: '01HY157',
      type: '离心式风扇',
      rpm: '3200',
      bearing: '液压轴承'
    }
  },
  {
    id: 'LNB-P007',
    name: 'ThinkPad P15 电源适配器',
    description: '170W 交流电源适配器',
    category: '电源部件',
    cost: 380,
    supplier: '光宝科技',
    lifecycle: 'Active',
    specifications: {
      brand: 'Lite-On',
      model: 'ADLX170NLC3A',
      output: '20V 8.5A',
      wattage: '170W',
      plug: '方口带针'
    }
  },
  {
    id: 'LNB-P008',
    name: 'ThinkPad X13 触控板',
    description: '多点触控触控板，带物理左右键',
    category: '输入设备',
    cost: 280,
    supplier: 'ALPS',
    lifecycle: 'Active',
    specifications: {
      brand: 'ALPS',
      model: '01YN054',
      type: '多点触控',
      dimensions: '100x70x2mm',
      interface: 'I2C'
    }
  },
  {
    id: 'LNB-P009',
    name: 'ThinkPad 指纹识别模块',
    description: '集成式指纹识别传感器',
    category: '安全模块',
    cost: 150,
    supplier: 'Synaptics',
    lifecycle: 'Active',
    specifications: {
      brand: 'Synaptics',
      model: '01AX708',
      type: '电容式指纹识别',
      interface: 'USB 2.0',
      security: '符合FIDO2标准'
    }
  },
  {
    id: 'LNB-P010',
    name: 'ThinkPad E14 扬声器模块',
    description: '双声道立体声扬声器',
    category: '音频部件',
    cost: 120,
    supplier: '瑞声科技',
    lifecycle: 'Active',
    specifications: {
      brand: 'AAC',
      model: '01HV526',
      type: '立体声扬声器',
      power: '2W x 2',
      frequency: '100Hz-20kHz'
    }
  },
  {
    id: 'LNB-P011',
    name: 'ThinkPad X1 Yoga 触控笔',
    description: '4096级压感触控笔，支持蓝牙',
    category: '输入设备',
    cost: 480,
    supplier: 'Wacom',
    lifecycle: 'Active',
    specifications: {
      brand: 'Wacom',
      model: '01HW021',
      pressure: '4096级',
      connectivity: '蓝牙5.0',
      battery: 'AAAA电池 x 1'
    }
  },
  {
    id: 'LNB-P012',
    name: 'ThinkPad T14 Gen3 摄像头模块',
    description: '1080p高清摄像头，带IR人脸识别',
    category: '摄像头',
    cost: 260,
    supplier: 'LiteOn',
    lifecycle: 'Active',
    specifications: {
      brand: 'Lite-On',
      model: '01HX355',
      resolution: '1920x1080',
      features: 'IR人脸识别，隐私物理遮挡'
    }
  },
  {
    id: 'LNB-P013',
    name: 'ThinkPad 网卡模块',
    description: 'Intel Wi-Fi 6E无线网卡',
    category: '网络设备',
    cost: 320,
    supplier: 'Intel',
    lifecycle: 'Active',
    specifications: {
      brand: 'Intel',
      model: 'AX211',
      standard: 'Wi-Fi 6E (802.11ax)',
      speed: '2400Mbps',
      bluetooth: '5.3'
    }
  },
  {
    id: 'LNB-P014',
    name: 'ThinkPad X1 Carbon 雷电接口模块',
    description: '雷电4接口，支持PD充电',
    category: '接口模块',
    cost: 520,
    supplier: 'Intel',
    lifecycle: 'Active',
    specifications: {
      brand: 'Intel',
      model: 'JHL8040R',
      standard: 'Thunderbolt 4',
      bandwidth: '40Gbps',
      features: '支持PD3.0充电'
    }
  },
  {
    id: 'LNB-P015',
    name: 'ThinkPad P1 内存模块',
    description: '32GB DDR5-5200笔记本内存',
    category: '存储设备',
    cost: 1280,
    supplier: '三星电子',
    lifecycle: 'Active',
    specifications: {
      brand: 'Samsung',
      model: 'M425R4GA3BB0-CWE',
      type: 'DDR5',
      capacity: '32GB',
      speed: '5200MHz'
    }
  },
  {
    id: 'LNB-P016',
    name: 'ThinkPad X1 Nano SSD模块',
    description: '1TB NVMe PCIe 4.0固态硬盘',
    category: '存储设备',
    cost: 1850,
    supplier: 'SK海力士',
    lifecycle: 'Active',
    specifications: {
      brand: 'SK Hynix',
      model: 'BC711',
      type: 'NVMe PCIe 4.0',
      capacity: '1TB',
      readSpeed: '5000MB/s'
    }
  },
  {
    id: 'LNB-P017',
    name: 'ThinkPad T16 键盘模组',
    description: '全尺寸背光键盘，带指点杆',
    category: '输入设备',
    cost: 750,
    supplier: '群光电子',
    lifecycle: 'Active',
    specifications: {
      brand: 'Chicony',
      model: '01YP024',
      type: '全尺寸键盘',
      features: '背光，指点杆，防泼溅',
      layout: 'US International'
    }
  },
  {
    id: 'LNB-P018',
    name: 'ThinkPad Yoga 屏幕转轴',
    description: '360度翻转铰链，适用于Yoga系列',
    category: '机身结构件',
    cost: 450,
    supplier: '合勤电子',
    lifecycle: 'PhaseOut',
    specifications: {
      brand: 'ZyXEL',
      model: '01HY740',
      type: '360度翻转铰链',
      material: '高强度合金',
      maxAngle: '360度'
    }
  },
  {
    id: 'LNB-P019',
    name: 'ThinkPad L14 底壳组件',
    description: 'ABS工程塑料底壳，带散热孔',
    category: '机身覆盖件',
    cost: 380,
    supplier: '精英电脑',
    lifecycle: 'Active',
    specifications: {
      brand: 'ECS',
      model: '01YN152',
      material: 'ABS工程塑料',
      color: '黑色',
      features: '带防滑脚垫'
    }
  },
  {
    id: 'LNB-P020',
    name: 'ThinkPad X1 天线模块',
    description: 'MIMO双天线，支持5Ghz和2.4Ghz',
    category: '网络设备',
    cost: 180,
    supplier: '村田制作所',
    lifecycle: 'Active',
    specifications: {
      brand: 'Murata',
      model: '01AX709',
      type: 'MIMO双天线',
      bands: '2.4GHz/5GHz/6GHz',
      gain: '3dBi'
    }
  }
];

const PartsSearchDrawer = ({ visible, onClose, onAddPart }) => {
  // 状态管理
  const [partsData, setPartsData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLifecycle, setSelectedLifecycle] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // 初始化数据
  useEffect(() => {
    setPartsData(mockPartsData);
    setFilteredData(mockPartsData);
  }, []);

  // 搜索过滤
  useEffect(() => {
    let filtered = [...partsData];
    
    if (searchText) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.id.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    if (selectedLifecycle) {
      filtered = filtered.filter(item => item.lifecycle === selectedLifecycle);
    }
    
    setFilteredData(filtered);
  }, [searchText, selectedCategory, selectedLifecycle, partsData]);

  // 添加选中零件
  const handleAddSelectedParts = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一个零件');
      return;
    }
    
    const selectedParts = partsData.filter(item => selectedRowKeys.includes(item.id));
    
    if (onAddPart) {
      onAddPart(selectedParts);
      message.success(`已添加${selectedParts.length}个零件`);
    }
    
    // 清空选择
    setSelectedRowKeys([]);
  };

  // 表格列定义
  const columns = [
    {
      title: '零件编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '零件名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (text) => `¥${text}`
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 100,
    },
    {
      title: '生命周期',
      dataIndex: 'lifecycle',
      key: 'lifecycle',
      width: 100,
      render: (text) => {
        let color = 'green';
        if (text === 'PhaseOut') color = 'orange';
        if (text === 'Obsolete') color = 'red';
        return <Tag color={color}>{text}</Tag>;
      }
    }
  ];

  // 获取所有分类
  const categories = [...new Set(partsData.map(item => item.category))];
  
  // 获取所有生命周期状态
  const lifecycles = [...new Set(partsData.map(item => item.lifecycle))];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title level={4} style={{ margin: 0 }}>零件库</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddSelectedParts}
            disabled={selectedRowKeys.length === 0}
          >
            添加选中零件 ({selectedRowKeys.length})
          </Button>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={1000}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Search
            placeholder="搜索零件名称、编号或描述"
            allowClear
            style={{ width: 250 }}
            onSearch={setSearchText}
            onChange={(e) => !e.target.value && setSearchText('')}
          />
          <Select
            placeholder="选择分类"
            allowClear
            style={{ width: 150 }}
            value={selectedCategory || undefined}
            onChange={setSelectedCategory}
          >
            {categories.map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>
          <Select
            placeholder="选择生命周期"
            allowClear
            style={{ width: 150 }}
            value={selectedLifecycle || undefined}
            onChange={setSelectedLifecycle}
          >
            {lifecycles.map(lifecycle => (
              <Option key={lifecycle} value={lifecycle}>{lifecycle}</Option>
            ))}
          </Select>
        </Space>
      </div>
      
      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        loading={loading}
        scroll={{ y: 400 }}
      />
    </Drawer>
  );
};

export default PartsSearchDrawer;