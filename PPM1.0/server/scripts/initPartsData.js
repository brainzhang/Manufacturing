const mongoose = require('mongoose');
const Part = require('../src/models/Part');

// 连接MongoDB
mongoose.connect('mongodb://localhost:27017/ppm3', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 生成Part ID和Part No的函数
const generatePartId = (category, index) => {
  const categoryAbbr = {
    'CPU': 'CPU',
    'Memory': 'MEM',
    'Storage': 'STR',
    'Motherboard': 'MB',
    'GPU': 'GPU',
    'Power Supply': 'PSU',
    'Cooler': 'COOL',
    'Case': 'CASE',
    'Peripheral': 'PERI'
  };
  
  const abbr = categoryAbbr[category] || 'PAR';
  const number = (index + 1).toString().padStart(4, '0');
  return `${abbr}${number}`;
};

const generatePartNo = (name, vendor, index) => {
  const vendorAbbr = {
    'Intel': 'INT',
    'AMD': 'AMD',
    'Kingston': 'KST',
    'Corsair': 'COR',
    'Samsung': 'SAM',
    'Western Digital': 'WD',
    'Seagate': 'SEA',
    'ASUS': 'ASU',
    'Gigabyte': 'GIG',
    'MSI': 'MSI',
    'NVIDIA': 'NVI',
    'Logitech': 'LOG',
    'Razer': 'RAZ',
    'Dell': 'DEL',
    'Apple': 'APL'
  };
  
  const vendorCode = vendorAbbr[vendor] || 'OTH';
  const nameCode = name.replace(/[^A-Z]/g, '').substring(0, 3) || 'PAR';
  return `${vendorCode}-${nameCode}-${(index + 1).toString().padStart(4, '0')}`;
};

// 100个实际业务数据的Parts表
const businessParts = [
  // CPU系列 (10个)
  { name: 'Intel Core i9-13900K', category: 'CPU', vendor: 'Intel', spec: '24 Cores 32 Threads 5.8GHz', status: 'active' },
  { name: 'AMD Ryzen 9 7950X', category: 'CPU', vendor: 'AMD', spec: '16 Cores 32 Threads 5.7GHz', status: 'active' },
  { name: 'Intel Core i7-13700K', category: 'CPU', vendor: 'Intel', spec: '16 Cores 24 Threads 5.4GHz', status: 'active' },
  { name: 'AMD Ryzen 7 7700X', category: 'CPU', vendor: 'AMD', spec: '8 Cores 16 Threads 5.4GHz', status: 'active' },
  { name: 'Intel Core i5-13600K', category: 'CPU', vendor: 'Intel', spec: '14 Cores 20 Threads 5.1GHz', status: 'active' },
  { name: 'AMD Ryzen 5 7600X', category: 'CPU', vendor: 'AMD', spec: '6 Cores 12 Threads 5.3GHz', status: 'active' },
  { name: 'Intel Xeon W-3375', category: 'CPU', vendor: 'Intel', spec: '38 Cores 76 Threads 4.0GHz', status: 'active' },
  { name: 'AMD EPYC 9654', category: 'CPU', vendor: 'AMD', spec: '96 Cores 192 Threads 2.4GHz', status: 'active' },
  { name: 'Intel Core i3-13100', category: 'CPU', vendor: 'Intel', spec: '4 Cores 8 Threads 4.5GHz', status: 'active' },
  { name: 'AMD Ryzen 3 7300X', category: 'CPU', vendor: 'AMD', spec: '4 Cores 8 Threads 4.5GHz', status: 'active' },

  // Memory系列 (15个)
  { name: 'Kingston Fury 16GB DDR5', category: 'Memory', vendor: 'Kingston', spec: 'DDR5 4800MHz CL38', status: 'active' },
  { name: 'Corsair Vengeance 32GB DDR5', category: 'Memory', vendor: 'Corsair', spec: 'DDR5 5200MHz CL40', status: 'active' },
  { name: 'G.Skill Trident Z 64GB DDR5', category: 'Memory', vendor: 'G.Skill', spec: 'DDR5 6000MHz CL30', status: 'active' },
  { name: 'Samsung 8GB DDR4', category: 'Memory', vendor: 'Samsung', spec: 'DDR4 3200MHz CL22', status: 'active' },
  { name: 'Crucial 16GB DDR4', category: 'Memory', vendor: 'Crucial', spec: 'DDR4 2666MHz CL19', status: 'active' },
  { name: 'Team Group 32GB DDR4', category: 'Memory', vendor: 'Team Group', spec: 'DDR4 3600MHz CL18', status: 'active' },
  { name: 'ADATA 8GB DDR3', category: 'Memory', vendor: 'ADATA', spec: 'DDR3 1600MHz CL11', status: 'active' },
  { name: 'Hynix 4GB DDR3', category: 'Memory', vendor: 'Hynix', spec: 'DDR3 1333MHz CL9', status: 'active' },
  { name: 'Micron 16GB DDR4 ECC', category: 'Memory', vendor: 'Micron', spec: 'DDR4 3200MHz ECC', status: 'active' },
  { name: 'Kingston Server 64GB DDR4', category: 'Memory', vendor: 'Kingston', spec: 'DDR4 2933MHz ECC', status: 'active' },
  { name: 'Corsair Dominator 128GB DDR5', category: 'Memory', vendor: 'Corsair', spec: 'DDR5 5600MHz CL40', status: 'active' },
  { name: 'G.Skill Ripjaws 8GB DDR4', category: 'Memory', vendor: 'G.Skill', spec: 'DDR4 2400MHz CL17', status: 'active' },
  { name: 'Patriot Viper 16GB DDR4', category: 'Memory', vendor: 'Patriot', spec: 'DDR4 3000MHz CL16', status: 'active' },
  { name: 'Transcend 4GB DDR3', category: 'Memory', vendor: 'Transcend', spec: 'DDR3 1066MHz CL7', status: 'active' },
  { name: 'Apacer 2GB DDR2', category: 'Memory', vendor: 'Apacer', spec: 'DDR2 800MHz CL5', status: 'active' },

  // Storage系列 (15个)
  { name: 'Samsung 980 Pro 1TB', category: 'Storage', vendor: 'Samsung', spec: 'NVMe M.2 PCIe 4.0', status: 'active' },
  { name: 'WD Black SN850X 2TB', category: 'Storage', vendor: 'Western Digital', spec: 'NVMe M.2 PCIe 4.0', status: 'active' },
  { name: 'Crucial P5 Plus 500GB', category: 'Storage', vendor: 'Crucial', spec: 'NVMe M.2 PCIe 4.0', status: 'active' },
  { name: 'Seagate FireCuda 4TB', category: 'Storage', vendor: 'Seagate', spec: 'NVMe M.2 PCIe 4.0', status: 'active' },
  { name: 'Kingston KC3000 1TB', category: 'Storage', vendor: 'Kingston', spec: 'NVMe M.2 PCIe 4.0', status: 'active' },
  { name: 'Seagate Barracuda 2TB', category: 'Storage', vendor: 'Seagate', spec: 'SATA 3.5" 7200RPM', status: 'active' },
  { name: 'WD Blue 4TB', category: 'Storage', vendor: 'Western Digital', spec: 'SATA 3.5" 5400RPM', status: 'active' },
  { name: 'Toshiba P300 3TB', category: 'Storage', vendor: 'Toshiba', spec: 'SATA 3.5" 7200RPM', status: 'active' },
  { name: 'Seagate IronWolf 8TB', category: 'Storage', vendor: 'Seagate', spec: 'SATA 3.5" NAS Drive', status: 'active' },
  { name: 'WD Red Plus 6TB', category: 'Storage', vendor: 'Western Digital', spec: 'SATA 3.5" NAS Drive', status: 'active' },
  { name: 'Intel 670p 1TB', category: 'Storage', vendor: 'Intel', spec: 'NVMe M.2 PCIe 3.0', status: 'active' },
  { name: 'ADATA XPG S70 2TB', category: 'Storage', vendor: 'ADATA', spec: 'NVMe M.2 PCIe 4.0', status: 'active' },
  { name: 'Team Group MP34 512GB', category: 'Storage', vendor: 'Team Group', spec: 'NVMe M.2 PCIe 3.0', status: 'active' },
  { name: 'Sabrent Rocket 4TB', category: 'Storage', vendor: 'Sabrent', spec: 'NVMe M.2 PCIe 4.0', status: 'active' },
  { name: 'PNY CS3040 2TB', category: 'Storage', vendor: 'PNY', spec: 'NVMe M.2 PCIe 4.0', status: 'active' },

  // Motherboard系列 (10个)
  { name: 'ASUS ROG Maximus Z790', category: 'Motherboard', vendor: 'ASUS', spec: 'Intel Z790 ATX Motherboard', status: 'active' },
  { name: 'Gigabyte X670 AORUS', category: 'Motherboard', vendor: 'Gigabyte', spec: 'AMD X670 ATX Motherboard', status: 'active' },
  { name: 'MSI MPG B650', category: 'Motherboard', vendor: 'MSI', spec: 'AMD B650 ATX Motherboard', status: 'active' },
  { name: 'ASRock Z690 Steel', category: 'Motherboard', vendor: 'ASRock', spec: 'Intel Z690 ATX Motherboard', status: 'active' },
  { name: 'ASUS TUF B660', category: 'Motherboard', vendor: 'ASUS', spec: 'Intel B660 mATX Motherboard', status: 'active' },
  { name: 'Gigabyte B550M', category: 'Motherboard', vendor: 'Gigabyte', spec: 'AMD B550 mATX Motherboard', status: 'active' },
  { name: 'MSI PRO Z790', category: 'Motherboard', vendor: 'MSI', spec: 'Intel Z790 ATX Motherboard', status: 'active' },
  { name: 'ASUS PRIME B760', category: 'Motherboard', vendor: 'ASUS', spec: 'Intel B760 ATX Motherboard', status: 'active' },
  { name: 'ASRock B650M', category: 'Motherboard', vendor: 'ASRock', spec: 'AMD B650 mATX Motherboard', status: 'active' },
  { name: 'Gigabyte Z690 AERO', category: 'Motherboard', vendor: 'Gigabyte', spec: 'Intel Z690 ATX Motherboard', status: 'active' },

  // GPU系列 (10个)
  { name: 'NVIDIA RTX 4090', category: 'GPU', vendor: 'NVIDIA', spec: '24GB GDDR6X Founders Edition', status: 'active' },
  { name: 'AMD RX 7900 XTX', category: 'GPU', vendor: 'AMD', spec: '24GB GDDR6 Reference Edition', status: 'active' },
  { name: 'NVIDIA RTX 4080', category: 'GPU', vendor: 'NVIDIA', spec: '16GB GDDR6X Founders Edition', status: 'active' },
  { name: 'AMD RX 7800 XT', category: 'GPU', vendor: 'AMD', spec: '16GB GDDR6 Reference Edition', status: 'active' },
  { name: 'NVIDIA RTX 4070 Ti', category: 'GPU', vendor: 'NVIDIA', spec: '12GB GDDR6X Founders Edition', status: 'active' },
  { name: 'AMD RX 7700 XT', category: 'GPU', vendor: 'AMD', spec: '12GB GDDR6 Reference Edition', status: 'active' },
  { name: 'NVIDIA RTX 4060', category: 'GPU', vendor: 'NVIDIA', spec: '8GB GDDR6 Founders Edition', status: 'active' },
  { name: 'AMD RX 7600', category: 'GPU', vendor: 'AMD', spec: '8GB GDDR6 Reference Edition', status: 'active' },
  { name: 'NVIDIA RTX 3050', category: 'GPU', vendor: 'NVIDIA', spec: '8GB GDDR6 Founders Edition', status: 'active' },
  { name: 'AMD RX 6500 XT', category: 'GPU', vendor: 'AMD', spec: '4GB GDDR6 Reference Edition', status: 'active' },

  // Power Supply系列 (10个)
  { name: 'Corsair RM1000x', category: 'Power Supply', vendor: 'Corsair', spec: '1000W 80Plus Gold Fully Modular', status: 'active' },
  { name: 'Seasonic Prime TX-850', category: 'Power Supply', vendor: 'Seasonic', spec: '850W 80Plus Titanium', status: 'active' },
  { name: 'EVGA SuperNOVA 750', category: 'Power Supply', vendor: 'EVGA', spec: '750W 80Plus Gold Fully Modular', status: 'active' },
  { name: 'Cooler Master V850', category: 'Power Supply', vendor: 'Cooler Master', spec: '850W 80Plus Gold Fully Modular', status: 'active' },
  { name: 'Thermaltake Toughpower 650', category: 'Power Supply', vendor: 'Thermaltake', spec: '650W 80Plus Gold', status: 'active' },
  { name: 'Be Quiet! Straight Power 11', category: 'Power Supply', vendor: 'Be Quiet!', spec: '750W 80Plus Platinum', status: 'active' },
  { name: 'FSP Hydro PTM Pro', category: 'Power Supply', vendor: 'FSP', spec: '1200W 80Plus Platinum', status: 'active' },
  { name: 'SilverStone SX1000', category: 'Power Supply', vendor: 'SilverStone', spec: '1000W 80Plus Platinum SFX', status: 'active' },
  { name: 'Antec HCG-850', category: 'Power Supply', vendor: 'Antec', spec: '850W 80Plus Gold', status: 'active' },
  { name: 'NZXT C850', category: 'Power Supply', vendor: 'NZXT', spec: '850W 80Plus Gold Fully Modular', status: 'active' },

  // Cooler系列 (10个)
  { name: 'Noctua NH-D15', category: 'Cooler', vendor: 'Noctua', spec: 'Dual Tower Dual Fan CPU Cooler', status: 'active' },
  { name: 'Corsair H150i Elite', category: 'Cooler', vendor: 'Corsair', spec: '360mm AIO Liquid Cooler RGB', status: 'active' },
  { name: 'Arctic Liquid Freezer II', category: 'Cooler', vendor: 'Arctic', spec: '280mm AIO Liquid Cooler', status: 'active' },
  { name: 'Cooler Master Hyper 212', category: 'Cooler', vendor: 'Cooler Master', spec: 'Single Tower Single Fan CPU Cooler', status: 'active' },
  { name: 'NZXT Kraken Z73', category: 'Cooler', vendor: 'NZXT', spec: '360mm AIO Liquid Cooler LCD Display', status: 'active' },
  { name: 'Deepcool AK620', category: 'Cooler', vendor: 'Deepcool', spec: 'Dual Tower Dual Fan CPU Cooler', status: 'active' },
  { name: 'be quiet! Dark Rock Pro 4', category: 'Cooler', vendor: 'be quiet!', spec: 'Dual Tower Dual Fan CPU Cooler', status: 'active' },
  { name: 'Thermalright Peerless', category: 'Cooler', vendor: 'Thermalright', spec: 'Dual Tower Dual Fan CPU Cooler', status: 'active' },
  { name: 'ID-COOLING SE-207', category: 'Cooler', vendor: 'ID-COOLING', spec: 'Dual Tower Dual Fan CPU Cooler', status: 'active' },
  { name: 'Scythe Fuma 2', category: 'Cooler', vendor: 'Scythe', spec: 'Dual Tower Dual Fan CPU Cooler', status: 'active' },

  // Case系列 (10个)
  { name: 'Lian Li O11 Dynamic', category: 'Case', vendor: 'Lian Li', spec: 'Mid Tower Dual Tempered Glass', status: 'active' },
  { name: 'Fractal Design Meshify 2', category: 'Case', vendor: 'Fractal Design', spec: 'Mid Tower Mesh Front Panel', status: 'active' },
  { name: 'Corsair 4000D Airflow', category: 'Case', vendor: 'Corsair', spec: 'Mid Tower Optimized Airflow', status: 'active' },
  { name: 'Phanteks Eclipse P500A', category: 'Case', vendor: 'Phanteks', spec: 'Mid Tower RGB Lighting', status: 'active' },
  { name: 'NZXT H7 Flow', category: 'Case', vendor: 'NZXT', spec: 'Mid Tower Mesh Front Panel', status: 'active' },
  { name: 'Cooler Master TD500', category: 'Case', vendor: 'Cooler Master', spec: 'Mid Tower Three Fans', status: 'active' },
  { name: 'be quiet! Pure Base 500', category: 'Case', vendor: 'be quiet!', spec: 'Mid Tower Silent Design', status: 'active' },
  { name: 'Thermaltake Level 20', category: 'Case', vendor: 'Thermaltake', spec: 'Full Tower Dual Chamber Design', status: 'active' },
  { name: 'SilverStone RL06', category: 'Case', vendor: 'SilverStone', spec: 'Mid Tower High Performance Cooling', status: 'active' },
  { name: 'InWin 101', category: 'Case', vendor: 'InWin', spec: 'Mid Tower Minimalist Design', status: 'active' },

  // Peripheral系列 (10个)
  { name: 'Logitech G Pro X', category: 'Peripheral', vendor: 'Logitech', spec: 'Mechanical Keyboard Brown Switch', status: 'active' },
  { name: 'Razer DeathAdder V3', category: 'Peripheral', vendor: 'Razer', spec: 'Gaming Mouse Optical Sensor', status: 'active' },
  { name: 'SteelSeries Arctis Pro', category: 'Peripheral', vendor: 'SteelSeries', spec: 'Gaming Headset Hi-Res Audio', status: 'active' },
  { name: 'ASUS ROG Swift', category: 'Peripheral', vendor: 'ASUS', spec: '27" 2K 170Hz Gaming Monitor', status: 'active' },
  { name: 'Dell UltraSharp U2720Q', category: 'Peripheral', vendor: 'Dell', spec: '27" 4K IPS Monitor', status: 'active' },
  { name: 'Corsair K100 RGB', category: 'Peripheral', vendor: 'Corsair', spec: 'Mechanical Keyboard Optical Switch', status: 'active' },
  { name: 'HyperX Cloud II', category: 'Peripheral', vendor: 'HyperX', spec: 'Gaming Headset 7.1 Virtual Surround', status: 'active' },
  { name: 'Samsung Odyssey G9', category: 'Peripheral', vendor: 'Samsung', spec: '49" Curved Gaming Monitor', status: 'active' },
  { name: 'Microsoft Surface', category: 'Peripheral', vendor: 'Microsoft', spec: 'Wireless Keyboard Mouse Combo', status: 'active' },
  { name: 'Apple Magic Mouse', category: 'Peripheral', vendor: 'Apple', spec: 'Wireless Multi-Touch Mouse', status: 'active' }
];

async function initPartsData() {
  try {
    console.log('开始初始化Parts数据...');
    
    // 清空现有Parts数据
    await Part.deleteMany({});
    console.log('清空现有Parts数据完成');
    
    // 为每个零件添加part_id和part_no
    const partsWithIds = businessParts.map((part, index) => {
      const partId = generatePartId(part.category, index);
      const partNo = generatePartNo(part.name, part.vendor, index);
      return {
        ...part,
        part_id: partId,
        part_no: partNo
      };
    });
    
    // 插入100个实际业务数据的Parts
    const createdParts = await Part.insertMany(partsWithIds);
    console.log(`成功插入 ${createdParts.length} 个Parts数据`);
    
    // 显示数据统计
    console.log('\nParts数据统计:');
    const categories = [...new Set(createdParts.map(p => p.category))];
    categories.forEach(category => {
      const count = createdParts.filter(p => p.category === category).length;
      console.log(`- ${category}: ${count}个`);
    });
    
    console.log('\nParts数据初始化完成！');
    
  } catch (error) {
    console.error('初始化Parts数据时出错:', error);
  } finally {
    mongoose.connection.close();
  }
}

// 运行初始化
initPartsData();