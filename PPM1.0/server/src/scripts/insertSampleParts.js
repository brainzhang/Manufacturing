const mongoose = require('mongoose');
const Part = require('../models/Part');

// 50条真实业务数据
const sampleParts = [
  // 电阻器 (Resistors)
  { name: "贴片电阻 10KΩ 1% 0603", part_no: "RC0603JR-0710KL", category: "Resistors", vendor: "Yageo", quantity: 1000, spec: "10KΩ ±1% 1/10W" },
  { name: "贴片电阻 1KΩ 5% 0805", part_no: "RC0805JR-071KL", category: "Resistors", vendor: "Yageo", quantity: 800, spec: "1KΩ ±5% 1/8W" },
  { name: "贴片电阻 100Ω 1% 0402", part_no: "RC0402FR-07100RL", category: "Resistors", vendor: "Yageo", quantity: 1500, spec: "100Ω ±1% 1/16W" },
  { name: "功率电阻 0.1Ω 5% 2512", part_no: "RL2512FK-070R1L", category: "Resistors", vendor: "Yageo", quantity: 200, spec: "0.1Ω ±5% 1W" },
  { name: "精密电阻 1MΩ 0.1% 1206", part_no: "RNCP1206FTD1M00", category: "Resistors", vendor: "KOA", quantity: 100, spec: "1MΩ ±0.1% 1/4W" },

  // 电容器 (Capacitors)
  { name: "陶瓷电容 100nF 50V X7R 0603", part_no: "C0603C104K5RACTU", category: "Capacitors", vendor: "Kemet", quantity: 2000, spec: "100nF ±10% 50V" },
  { name: "电解电容 10μF 25V 铝电解", part_no: "ECA-1EM100", category: "Capacitors", vendor: "Panasonic", quantity: 500, spec: "10μF ±20% 25V" },
  { name: "钽电容 22μF 16V 7343", part_no: "T491B226K016AT", category: "Capacitors", vendor: "Kemet", quantity: 300, spec: "22μF ±10% 16V" },
  { name: "薄膜电容 1μF 100V PET", part_no: "BFC233861104", category: "Capacitors", vendor: "Vishay", quantity: 200, spec: "1μF ±5% 100V" },
  { name: "超级电容 1F 5.5V", part_no: "DGH105Q5R5", category: "Capacitors", vendor: "Cornell Dubilier", quantity: 50, spec: "1F ±20% 5.5V" },

  // 电感器 (Inductors)
  { name: "功率电感 10μH 3A 屏蔽", part_no: "74437324100", category: "Inductors", vendor: "Würth Elektronik", quantity: 300, spec: "10μH ±20% 3A" },
  { name: "贴片电感 1μH 2A 0603", part_no: "LPS3015-102MRC", category: "Inductors", vendor: "Coilcraft", quantity: 600, spec: "1μH ±20% 2A" },
  { name: "功率电感 100μH 1A", part_no: "7447709100", category: "Inductors", vendor: "Würth Elektronik", quantity: 200, spec: "100μH ±20% 1A" },
  { name: "高频电感 22nH 0805", part_no: "0402CS-22NXJB", category: "Inductors", vendor: "Coilcraft", quantity: 800, spec: "22nH ±5% 高频" },
  { name: "共模电感 10mH 100mA", part_no: "DLW21SN121SQ2L", category: "Inductors", vendor: "Murata", quantity: 150, spec: "10mH ±20% 100mA" },

  // 二极管 (Diodes)
  { name: "肖特基二极管 40V 3A", part_no: "B340A-13-F", category: "Diodes", vendor: "Diodes Incorporated", quantity: 1000, spec: "40V 3A Vf=0.45V" },
  { name: "齐纳二极管 5.1V 500mW", part_no: "BZX84C5V1LT1G", category: "Diodes", vendor: "ON Semiconductor", quantity: 1500, spec: "5.1V ±5% 500mW" },
  { name: "整流二极管 1000V 1A", part_no: "1N4007", category: "Diodes", vendor: "Vishay", quantity: 2000, spec: "1000V 1A DO-41" },
  { name: "发光二极管 红色 5mm", part_no: "L-53HD", category: "Diodes", vendor: "Lite-On", quantity: 5000, spec: "红色 20mA 2.0V" },
  { name: "TVS二极管 24V 600W", part_no: "SMBJ24A", category: "Diodes", vendor: "Littelfuse", quantity: 400, spec: "24V 600W 单向" },

  // 晶体管 (Transistors)
  { name: "NPN晶体管 40V 200mA", part_no: "BC847B", category: "Transistors", vendor: "Nexperia", quantity: 3000, spec: "40V 200mA SOT-23" },
  { name: "MOSFET N沟道 60V 30A", part_no: "IRFZ44N", category: "Transistors", vendor: "Infineon", quantity: 500, spec: "60V 30A TO-220" },
  { name: "MOSFET P沟道 -30V -5.6A", part_no: "IRF9Z34N", category: "Transistors", vendor: "Infineon", quantity: 400, spec: "-30V -5.6A TO-220" },
  { name: "IGBT 600V 25A", part_no: "FGA25N120ANTD", category: "Transistors", vendor: "Fairchild", quantity: 200, spec: "600V 25A TO-3P" },
  { name: "达林顿晶体管 50V 500mA", part_no: "ULN2003A", category: "Transistors", vendor: "Texas Instruments", quantity: 800, spec: "50V 500mA 7通道" },

  // 集成电路 (Integrated Circuits)
  { name: "运算放大器 双路 通用", part_no: "LM358DT", category: "Integrated Circuits", vendor: "STMicroelectronics", quantity: 2000, spec: "双路 通用 运放" },
  { name: "电压比较器 单路", part_no: "LM393DT", category: "Integrated Circuits", vendor: "STMicroelectronics", quantity: 1500, spec: "单路 比较器" },
  { name: "LDO稳压器 3.3V 1A", part_no: "AMS1117-3.3", category: "Integrated Circuits", vendor: "AMS", quantity: 1000, spec: "3.3V 1A LDO" },
  { name: "Buck转换器 5V 3A", part_no: "LM2596S-5.0", category: "Integrated Circuits", vendor: "Texas Instruments", quantity: 300, spec: "5V 3A Buck" },
  { name: "逻辑门 四路2输入与门", part_no: "74HC08", category: "Integrated Circuits", vendor: "Nexperia", quantity: 2500, spec: "四路2输入与门" },

  // 电压调节器 (Voltage Regulators)
  { name: "LDO稳压器 5V 150mA", part_no: "MCP1700T-5002E/TT", category: "Voltage Regulators", vendor: "Microchip", quantity: 1200, spec: "5V 150mA LDO" },
  { name: "Buck转换器 12V 2A", part_no: "LM2675M-12", category: "Voltage Regulators", vendor: "Texas Instruments", quantity: 400, spec: "12V 2A Buck" },
  { name: "Boost转换器 5V 1A", part_no: "LM2733Y", category: "Voltage Regulators", vendor: "Texas Instruments", quantity: 350, spec: "5V 1A Boost" },
  { name: "开关稳压器 3.3V 3A", part_no: "TPS5430DDAR", category: "Voltage Regulators", vendor: "Texas Instruments", quantity: 280, spec: "3.3V 3A 开关" },
  { name: "电荷泵 5V 100mA", part_no: "MAX660CSA+", category: "Voltage Regulators", vendor: "Maxim Integrated", quantity: 600, spec: "5V 100mA 电荷泵" },

  // 温度传感器 (Temperature Sensors)
  { name: "数字温度传感器 I2C", part_no: "TMP102", category: "Temperature Sensors", vendor: "Texas Instruments", quantity: 800, spec: "-40°C to +125°C I2C" },
  { name: "模拟温度传感器", part_no: "LM35DZ", category: "Temperature Sensors", vendor: "Texas Instruments", quantity: 1000, spec: "-55°C to +150°C 模拟" },
  { name: "热电偶放大器", part_no: "MAX31855KASA+", category: "Temperature Sensors", vendor: "Maxim Integrated", quantity: 300, spec: "K型热电偶 SPI" },
  { name: "红外温度传感器", part_no: "MLX90614ESF-BAA", category: "Temperature Sensors", vendor: "Melexis", quantity: 150, spec: "-40°C to +125°C 非接触" },
  { name: "热敏电阻 10K NTC", part_no: "NTCG103JF103FT1", category: "Temperature Sensors", vendor: "TDK", quantity: 2000, spec: "10KΩ 25°C NTC" },

  // 运动传感器 (Motion Sensors)
  { name: "加速度计 3轴 ±2g", part_no: "ADXL345BCCZ", category: "Motion Sensors", vendor: "Analog Devices", quantity: 600, spec: "3轴 ±2g I2C/SPI" },
  { name: "陀螺仪 3轴 ±250°/s", part_no: "L3GD20H", category: "Motion Sensors", vendor: "STMicroelectronics", quantity: 450, spec: "3轴 ±250°/s I2C/SPI" },
  { name: "磁力计 3轴", part_no: "HMC5883L", category: "Motion Sensors", vendor: "Honeywell", quantity: 700, spec: "3轴 磁力计 I2C" },
  { name: "IMU 6轴", part_no: "MPU-6050", category: "Motion Sensors", vendor: "InvenSense", quantity: 500, spec: "3轴加速度+3轴陀螺仪" },
  { name: "霍尔传感器 单极", part_no: "AH3376-P-B", category: "Motion Sensors", vendor: "Diodes Incorporated", quantity: 1200, spec: "单极 霍尔效应" },

  // 光学传感器 (Optical Sensors)
  { name: "环境光传感器", part_no: "TSL2561", category: "Optical Sensors", vendor: "AMS", quantity: 800, spec: "0.1 to 40,000+ Lux I2C" },
  { name: "颜色传感器 RGB", part_no: "TCS34725", category: "Optical Sensors", vendor: "AMS", quantity: 600, spec: "RGB颜色传感器 I2C" },
  { name: "光电晶体管 NPN", part_no: "LTR-329ALS-01", category: "Optical Sensors", vendor: "Lite-On", quantity: 2000, spec: "NPN 光电晶体管" },
  { name: "红外接收器 38kHz", part_no: "TSOP38238", category: "Optical Sensors", vendor: "Vishay", quantity: 1500, spec: "38kHz 红外接收" },
  { name: "光电耦合器", part_no: "PC817", category: "Optical Sensors", vendor: "Sharp", quantity: 2500, spec: "光电耦合器 晶体管输出" }
];

async function insertSampleParts() {
  try {
    // 连接MongoDB
    await mongoose.connect('mongodb://localhost:27017/ppm3', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // 清空现有Parts数据
    await Part.deleteMany({});
    console.log('Cleared existing parts data');

    // 为每个零件生成Part ID并插入
    const partsWithIds = sampleParts.map((part, index) => ({
      ...part,
      part_id: generatePartId(part.category, index)
    }));

    // 插入数据
    const result = await Part.insertMany(partsWithIds);
    console.log(`Successfully inserted ${result.length} parts`);

    // 显示插入的数据统计
    const categoryStats = {};
    result.forEach(part => {
      categoryStats[part.category] = (categoryStats[part.category] || 0) + 1;
    });

    console.log('\nInserted parts by category:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} parts`);
    });

  } catch (error) {
    console.error('Error inserting sample parts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// 生成Part ID的函数
function generatePartId(category, index) {
  const categoryAbbr = {
    'Resistors': 'RES',
    'Capacitors': 'CAP',
    'Inductors': 'IND',
    'Diodes': 'DIO',
    'Transistors': 'TRA',
    'Integrated Circuits': 'IC',
    'Voltage Regulators': 'VR',
    'Power Supplies': 'PS',
    'Temperature Sensors': 'TS',
    'Motion Sensors': 'MS',
    'Optical Sensors': 'OS',
    'Board Connectors': 'BC',
    'Cable Connectors': 'CC',
    'Crystal Oscillators': 'XO',
    'Crystals': 'XTAL'
  };
  
  const abbr = categoryAbbr[category] || 'PAR';
  const number = (index + 1).toString().padStart(4, '0');
  return `${abbr}${number}`;
}

// 执行插入
insertSampleParts();