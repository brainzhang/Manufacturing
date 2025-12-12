const mongoose = require('mongoose');
const BOM = require('../src/models/BOM');
const Part = require('../src/models/Part');
const Product = require('../src/models/Product');

// 连接MongoDB
mongoose.connect('mongodb://localhost:27017/ppm', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 符合业务标准的Part数据
const sampleParts = [
  // 电子元器件
  { part_id: 'P001', name: 'CPU处理器', category: '电子元器件', spec: 'Intel Core i7-12700K处理器', vendor: 'Intel', status: 'active' },
  { part_id: 'P002', name: '内存条', category: '电子元器件', spec: 'DDR4 16GB 3200MHz内存', vendor: 'Kingston', status: 'active' },
  { part_id: 'P003', name: '固态硬盘', category: '电子元器件', spec: 'NVMe M.2 1TB SSD', vendor: 'Samsung', status: 'active' },
  { part_id: 'P004', name: '主板', category: '电子元器件', spec: 'Z690 ATX主板', vendor: 'ASUS', status: 'active' },
  { part_id: 'P005', name: '显卡', category: '电子元器件', spec: 'RTX 4070 12GB显卡', vendor: 'NVIDIA', status: 'active' },
  
  // 机械零件
  { part_id: 'P006', name: '机箱外壳', category: '机械零件', spec: 'ATX中塔机箱', vendor: 'Cooler Master', status: 'active' },
  { part_id: 'P007', name: '电源', category: '机械零件', spec: '850W金牌电源', vendor: 'Corsair', status: 'active' },
  { part_id: 'P008', name: '散热器', category: '机械零件', spec: '240mm水冷散热器', vendor: 'NZXT', status: 'active' },
  { part_id: 'P009', name: '风扇', category: '机械零件', spec: '120mm RGB风扇', vendor: 'Thermaltake', status: 'active' },
  
  // 连接器
  { part_id: 'P010', name: 'SATA数据线', category: '连接器', spec: 'SATA 3.0数据线', vendor: 'Generic', status: 'active' },
  { part_id: 'P011', name: '电源线', category: '连接器', spec: '标准电源线', vendor: 'Generic', status: 'active' },
  { part_id: 'P012', name: 'HDMI线', category: '连接器', spec: 'HDMI 2.1数据线', vendor: 'Generic', status: 'active' },
  
  // 包装材料
  { part_id: 'P013', name: '包装盒', category: '包装材料', spec: '电脑主机包装盒', vendor: 'Custom', status: 'active' },
  { part_id: 'P014', name: '泡沫填充物', category: '包装材料', spec: '防震泡沫填充', vendor: 'Custom', status: 'active' },
  { part_id: 'P015', name: '说明书', category: '包装材料', spec: '产品使用说明书', vendor: 'Custom', status: 'active' }
];

// 产品数据 - 添加平台和Family映射
const sampleProducts = [
  { 
    product_id: 'PRD001', 
    model: 'Gaming Pro', 
    product_line: '游戏系列', 
    platform: 'desktop', 
    family: 'intel_core', 
    description: '高端游戏电脑配置', 
    status: 'production' 
  },
  { 
    product_id: 'PRD002', 
    model: 'Office Basic', 
    product_line: '办公系列', 
    platform: 'desktop', 
    family: 'intel_core', 
    description: '企业办公电脑配置', 
    status: 'production' 
  },
  { 
    product_id: 'PRD003', 
    model: 'Server Enterprise', 
    product_line: '服务器系列', 
    platform: 'server', 
    family: 'intel_xeon', 
    description: '企业级服务器配置', 
    status: 'production' 
  },
  { 
    product_id: 'PRD004', 
    model: 'Workstation Pro', 
    product_line: '工作站系列', 
    platform: 'desktop', 
    family: 'intel_core', 
    description: '专业设计工作站', 
    status: 'production' 
  },
  { 
    product_id: 'PRD005', 
    model: 'Thinkpad X1 Yoga', 
    product_line: '笔记本系列', 
    platform: 'laptop', 
    family: 'intel_core', 
    description: '轻薄商务笔记本', 
    status: 'production' 
  },
  { 
    product_id: 'PRD006', 
    model: 'Surface Pro 9', 
    product_line: '平板系列', 
    platform: 'mobile', 
    family: 'intel_core', 
    description: '二合一平板电脑', 
    status: 'production' 
  },
  { 
    product_id: 'PRD007', 
    model: 'Raspberry Pi 4', 
    product_line: '嵌入式系列', 
    platform: 'embedded', 
    family: 'arm_cortex', 
    description: '单板计算机', 
    status: 'production' 
  },
  { 
    product_id: 'PRD008', 
    model: 'NVIDIA Jetson', 
    product_line: 'AI计算系列', 
    platform: 'embedded', 
    family: 'nvidia_tegra', 
    description: 'AI边缘计算设备', 
    status: 'production' 
  }
];

// BOM数据 - 符合业务标准的结构
const sampleBOMs = [
  {
    bom_name: '游戏电脑BOM V1.0',
    version: '1.0',
    product_line: '游戏系列',
    status: 'active',
    parts: [
      { part_id: null, quantity: 1, position: 'CPU插槽' },
      { part_id: null, quantity: 2, position: '内存插槽' },
      { part_id: null, quantity: 1, position: 'M.2插槽' },
      { part_id: null, quantity: 1, position: '主板' },
      { part_id: null, quantity: 1, position: '显卡插槽' },
      { part_id: null, quantity: 1, position: '机箱' },
      { part_id: null, quantity: 1, position: '电源' },
      { part_id: null, quantity: 3, position: '风扇位' },
      { part_id: null, quantity: 2, position: 'SATA接口' },
      { part_id: null, quantity: 1, position: '包装' }
    ]
  },
  {
    bom_name: '办公电脑BOM V1.0',
    version: '1.0',
    product_line: '办公系列',
    status: 'active',
    parts: [
      { part_id: null, quantity: 1, position: 'CPU插槽' },
      { part_id: null, quantity: 1, position: '内存插槽' },
      { part_id: null, quantity: 1, position: 'SATA接口' },
      { part_id: null, quantity: 1, position: '主板' },
      { part_id: null, quantity: 1, position: '机箱' },
      { part_id: null, quantity: 1, position: '电源' },
      { part_id: null, quantity: 2, position: '风扇位' },
      { part_id: null, quantity: 1, position: '包装' }
    ]
  },
  {
    bom_name: '服务器BOM V1.0',
    version: '1.0',
    product_line: '服务器系列',
    status: 'active',
    parts: [
      { part_id: null, quantity: 2, position: 'CPU插槽' },
      { part_id: null, quantity: 8, position: '内存插槽' },
      { part_id: null, quantity: 4, position: '硬盘位' },
      { part_id: null, quantity: 1, position: '主板' },
      { part_id: null, quantity: 2, position: '电源' },
      { part_id: null, quantity: 6, position: '风扇位' },
      { part_id: null, quantity: 1, position: '机箱' },
      { part_id: null, quantity: 1, position: '包装' }
    ]
  }
];

async function initData() {
  try {
    console.log('开始初始化数据...');
    
    // 清空现有数据
    await Part.deleteMany({});
    await Product.deleteMany({});
    await BOM.deleteMany({});
    
    console.log('清空现有数据完成');
    
    // 插入Part数据
    const createdParts = await Part.insertMany(sampleParts);
    console.log(`插入 ${createdParts.length} 个Part数据完成`);
    
    // 插入Product数据
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`插入 ${createdProducts.length} 个Product数据完成`);
    
    // 创建BOM数据，关联实际的Part ID
    const bomsToInsert = [];
    
    for (let i = 0; i < sampleBOMs.length; i++) {
      const bomData = { ...sampleBOMs[i] };
      bomData.product_id = createdProducts[i % createdProducts.length]._id;
      
      // 为每个BOM分配不同的Part组合
      const startIndex = i * 5; // 每个BOM使用不同的Part组合
      bomData.parts = bomData.parts.map((part, index) => ({
        ...part,
        part_id: createdParts[(startIndex + index) % createdParts.length]._id
      }));
      
      bomsToInsert.push(bomData);
    }
    
    // 插入BOM数据
    const createdBOMs = await BOM.insertMany(bomsToInsert);
    console.log(`插入 ${createdBOMs.length} 个BOM数据完成`);
    
    console.log('数据初始化完成！');
    console.log('\n数据统计:');
    console.log(`- Parts: ${createdParts.length}`);
    console.log(`- Products: ${createdProducts.length}`);
    console.log(`- BOMs: ${createdBOMs.length}`);
    
  } catch (error) {
    console.error('初始化数据时出错:', error);
  } finally {
    mongoose.connection.close();
  }
}

// 运行初始化
initData();