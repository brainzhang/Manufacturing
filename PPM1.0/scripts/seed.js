const mongoose = require('mongoose');
const Part = require('../server/src/models/Part');
const BOM = require('../server/src/models/BOM');
const PNMap = require('../server/src/models/PNMap');
const Alignment = require('../server/src/models/Alignment');
const User = require('../server/src/models/User');
const Product = require('../server/src/models/Product');

// Connect to database
mongoose.connect('mongodb://localhost:27017/ppm3', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Handle deprecation warnings
mongoose.set('strictQuery', false);

const seedData = async () => {
  try {
    // Clear existing data
    await Part.deleteMany({});
    await BOM.deleteMany({});
    await PNMap.deleteMany({});
    await Alignment.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Product.deleteMany({});

    // Create sample users - use save() to trigger password hashing middleware
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });

    const pmUser = new User({
      name: 'Product Manager',
      email: 'pm@example.com',
      password: 'password123',
      role: 'product_manager'
    });

    const savedAdmin = await adminUser.save();
    const savedPm = await pmUser.save();
    const users = [savedAdmin, savedPm];

    console.log('Users created:', users.length);

    // Create sample parts - Electronic Components (真正的电子元器件)
    const parts = await Part.insertMany([
      // 电阻器 (Resistors)
      { part_id: 'PT0001', part_no: 'PT0001', name: '10kΩ 1W Resistor', category: 'Resistor', spec: '10kΩ, 1W, ±5%', vendor: 'Yageo', status: 'active' },
      { part_id: 'PT0002', part_no: 'PT0002', name: '100Ω 0.25W Resistor', category: 'Resistor', spec: '100Ω, 0.25W, ±1%', vendor: 'Vishay', status: 'active' },
      { part_id: 'PT0003', part_no: 'PT0003', name: '1kΩ 0.5W Resistor', category: 'Resistor', spec: '1kΩ, 0.5W, ±5%', vendor: 'ROHM', status: 'active' },
      { part_id: 'PT0004', part_no: 'PT0004', name: '4.7kΩ 0.25W Resistor', category: 'Resistor', spec: '4.7kΩ, 0.25W, ±1%', vendor: 'Panasonic', status: 'active' },
      { part_id: 'PT0005', part_no: 'PT0005', name: '47kΩ 0.5W Resistor', category: 'Resistor', spec: '47kΩ, 0.5W, ±5%', vendor: 'Yageo', status: 'active' },
      
      // 电容器 (Capacitors)
      { part_id: 'PT0006', part_no: 'PT0006', name: '100nF 50V Ceramic Capacitor', category: 'Capacitor', spec: '100nF, 50V, X7R', vendor: 'Murata', status: 'active' },
      { part_id: 'PT0007', part_no: 'PT0007', name: '10μF 25V Electrolytic Capacitor', category: 'Capacitor', spec: '10μF, 25V, Radial', vendor: 'Nichicon', status: 'active' },
      { part_id: 'PT0008', part_no: 'PT0008', name: '1μF 50V Ceramic Capacitor', category: 'Capacitor', spec: '1μF, 50V, X7R', vendor: 'TDK', status: 'active' },
      { part_id: 'PT0009', part_no: 'PT0009', name: '47μF 16V Tantalum Capacitor', category: 'Capacitor', spec: '47μF, 16V, SMD', vendor: 'KEMET', status: 'active' },
      { part_id: 'PT0010', part_no: 'PT0010', name: '220μF 35V Electrolytic Capacitor', category: 'Capacitor', spec: '220μF, 35V, Radial', vendor: 'Rubycon', status: 'active' },
      
      // 晶体管 (Transistors)
      { part_id: 'PT0011', part_no: 'PT0011', name: '2N2222 NPN Transistor', category: 'Transistor', spec: 'NPN, 40V, 600mA', vendor: 'ON Semiconductor', status: 'active' },
      { part_id: 'PT0012', part_no: 'PT0012', name: 'BC547 NPN Transistor', category: 'Transistor', spec: 'NPN, 45V, 100mA', vendor: 'Fairchild', status: 'active' },
      { part_id: 'PT0013', part_no: 'PT0013', name: '2N3904 NPN Transistor', category: 'Transistor', spec: 'NPN, 40V, 200mA', vendor: 'STMicroelectronics', status: 'active' },
      { part_id: 'PT0014', part_no: 'PT0014', name: 'IRF540 N-Channel MOSFET', category: 'Transistor', spec: 'N-Channel, 100V, 33A', vendor: 'Infineon', status: 'active' },
      { part_id: 'PT0015', part_no: 'PT0015', name: 'BC557 PNP Transistor', category: 'Transistor', spec: 'PNP, 45V, 100mA', vendor: 'Fairchild', status: 'active' },
      
      // 二极管 (Diodes)
      { part_id: 'PT0016', part_no: 'PT0016', name: '1N4148 Fast Switching Diode', category: 'Diode', spec: '100V, 200mA, Fast Recovery', vendor: 'Diodes Inc.', status: 'active' },
      { part_id: 'PT0017', part_no: 'PT0017', name: '1N4007 Rectifier Diode', category: 'Diode', spec: '1000V, 1A, General Purpose', vendor: 'Vishay', status: 'active' },
      { part_id: 'PT0018', part_no: 'PT0018', name: 'Red LED', category: 'Diode', spec: '2V, 20mA, 5mm', vendor: 'Kingbright', status: 'active' },
      { part_id: 'PT0019', part_no: 'PT0019', name: '5.1V Zener Diode', category: 'Diode', spec: '5.1V, 500mW, DO-35', vendor: 'ON Semiconductor', status: 'active' },
      { part_id: 'PT0020', part_no: 'PT0020', name: '1N5819 Schottky Diode', category: 'Diode', spec: '40V, 1A, Low Forward Voltage', vendor: 'Vishay', status: 'active' },
      
      // 集成电路 (Integrated Circuits)
      { part_id: 'PT0021', part_no: 'PT0021', category: 'IC', name: 'LM358 Dual Op-Amp', spec: 'Dual, Low Power, 3-32V', vendor: 'Texas Instruments', status: 'active' },
      { part_id: 'PT0022', part_no: 'PT0022', category: 'IC', name: 'LM7805 5V Voltage Regulator', spec: '5V, 1A, TO-220', vendor: 'STMicroelectronics', status: 'active' },
      { part_id: 'PT0023', part_no: 'PT0023', category: 'IC', name: 'ATmega328 Microcontroller', spec: '8-bit, 32KB Flash, 28-pin', vendor: 'Microchip', status: 'active' },
      { part_id: 'PT0024', part_no: 'PT0024', category: 'IC', name: 'NE555 Timer IC', spec: 'Timer, 4.5-16V, 8-pin', vendor: 'Texas Instruments', status: 'active' },
      { part_id: 'PT0025', part_no: 'PT0025', category: 'IC', name: 'LM317 Adjustable Regulator', spec: '1.2-37V, 1.5A, TO-220', vendor: 'Texas Instruments', status: 'active' },
      
      // 电感器 (Inductors)
      { part_id: 'PT0026', part_no: 'PT0026', category: 'Inductor', name: '100μH Power Inductor', spec: '100μH, 1A, SMD', vendor: 'Coilcraft', status: 'active' },
      { part_id: 'PT0027', part_no: 'PT0027', category: 'Inductor', name: '10μH Power Inductor', spec: '10μH, 2A, Radial', vendor: 'Bourns', status: 'active' },
      { part_id: 'PT0028', part_no: 'PT0028', category: 'Inductor', name: '1mH Power Inductor', spec: '1mH, 500mA, Axial', vendor: 'Würth Elektronik', status: 'active' },
      { part_id: 'PT0029', part_no: 'PT0029', category: 'Inductor', name: '22μH Power Inductor', spec: '22μH, 1.5A, SMD', vendor: 'TDK', status: 'active' },
      { part_id: 'PT0030', part_no: 'PT0030', category: 'Inductor', name: '470μH Power Inductor', spec: '470μH, 300mA, Radial', vendor: 'Bourns', status: 'active' },
      
      // 变压器 (Transformers)
      { part_id: 'PT0031', part_no: 'PT0031', category: 'Transformer', name: '12V 1A Power Transformer', spec: '12V, 1A, 50/60Hz', vendor: 'Hammond', status: 'active' },
      { part_id: 'PT0032', part_no: 'PT0032', category: 'Transformer', name: '5V 2A Power Transformer', spec: '5V, 2A, 50/60Hz', vendor: 'Talema', status: 'active' },
      { part_id: 'PT0033', part_no: 'PT0033', category: 'Transformer', name: '24V 0.5A Power Transformer', spec: '24V, 0.5A, 50/60Hz', vendor: 'Hammond', status: 'active' },
      
      // 晶振 (Oscillators)
      { part_id: 'PT0034', part_no: 'PT0034', category: 'Oscillator', name: '16MHz Crystal Oscillator', spec: '16MHz, HC-49S, ±50ppm', vendor: 'Abracon', status: 'active' },
      { part_id: 'PT0035', part_no: 'PT0035', category: 'Oscillator', name: '32.768kHz Crystal', spec: '32.768kHz, Watch Crystal', vendor: 'Epson', status: 'active' },
      { part_id: 'PT0036', part_no: 'PT0036', category: 'Oscillator', name: '4MHz Crystal Oscillator', spec: '4MHz, HC-49S, ±50ppm', vendor: 'Abracon', status: 'active' },
      
      // 传感器 (Sensors)
      { part_id: 'PT0037', part_no: 'PT0037', category: 'Sensor', name: 'LM35 Temperature Sensor', spec: 'Temperature, 0-100°C, TO-92', vendor: 'Texas Instruments', status: 'active' },
      { part_id: 'PT0038', part_no: 'PT0038', category: 'Sensor', name: 'DHT22 Humidity Sensor', spec: 'Humidity & Temperature, Digital', vendor: 'Aosong', status: 'active' },
      { part_id: 'PT0039', part_no: 'PT0039', category: 'Sensor', name: 'PIR Motion Sensor', spec: 'Motion Detection, 5-12V', vendor: 'Panasonic', status: 'active' },
      { part_id: 'PT0040', part_no: 'PT0040', category: 'Sensor', name: 'Photoresistor', spec: 'Light Dependent Resistor, 5mm', vendor: 'Adafruit', status: 'active' },
      
      // 连接器 (Connectors)
      { part_id: 'PT0041', part_no: 'PT0041', category: 'Connector', name: 'USB-C Connector', spec: 'USB 3.1, 24-pin, SMD', vendor: 'Molex', status: 'active' },
      { part_id: 'PT0042', part_no: 'PT0042', category: 'Connector', name: 'HDMI Connector', spec: 'HDMI Type A, 19-pin', vendor: 'Amphenol', status: 'active' },
      { part_id: 'PT0043', part_no: 'PT0043', category: 'Connector', name: 'DB9 Serial Connector', spec: '9-pin D-Sub, Male', vendor: 'TE Connectivity', status: 'active' },
      { part_id: 'PT0044', part_no: 'PT0044', category: 'Connector', name: '3.5mm Audio Jack', spec: 'Stereo, PCB Mount', vendor: 'CUI Devices', status: 'active' },
      { part_id: 'PT0045', part_no: 'PT0045', category: 'Connector', name: 'DC Power Jack', spec: '2.1mm, PCB Mount', vendor: 'CUI Devices', status: 'active' }
    ]);

    console.log('Parts created:', parts.length);

    // Create sample Products first
    const products = await Product.insertMany([
      {
        product_id: 'PROD001',
        model: 'ThinkPad X1 Carbon',
        product_line: 'ThinkPad',
        description: 'Premium business laptop',
        status: 'production'
      },
      {
        product_id: 'PROD002',
        model: 'ThinkPad T14',
        product_line: 'ThinkPad',
        description: 'Professional business laptop',
        status: 'production'
      },
      {
        product_id: 'PROD003',
        model: 'ThinkPad P1',
        product_line: 'ThinkPad',
        description: 'Mobile workstation',
        status: 'production'
      }
    ]);

    console.log('Products created:', products.length);

    // Create sample BOMs - Generate 100 BOMs
    const bomData = [];
    
    // Create more products for variety
    const additionalProducts = await Product.insertMany([
      {
        product_id: 'PROD004',
        model: 'ThinkPad X1 Yoga',
        product_line: 'ThinkPad',
        description: 'Convertible business laptop',
        status: 'production'
      },
      {
        product_id: 'PROD005',
        model: 'ThinkPad P15',
        product_line: 'ThinkPad',
        description: 'Mobile workstation',
        status: 'production'
      },
      {
        product_id: 'PROD006',
        model: 'ThinkPad E14',
        product_line: 'ThinkPad',
        description: 'Entry-level business laptop',
        status: 'production'
      },
      {
        product_id: 'PROD007',
        model: 'ThinkPad L14',
        product_line: 'ThinkPad',
        description: 'Mainstream business laptop',
        status: 'production'
      },
      {
        product_id: 'PROD008',
        model: 'ThinkPad X13',
        product_line: 'ThinkPad',
        description: 'Ultraportable business laptop',
        status: 'production'
      }
    ]);
    
    const allProducts = [...products, ...additionalProducts];
    
    // Generate 100 BOMs
    for (let i = 1; i <= 100; i++) {
      const productIndex = i % allProducts.length;
      const product = allProducts[productIndex];
      
      // Create parts array with 2-5 random parts
      const partCount = Math.floor(Math.random() * 4) + 2; // 2-5 parts
      const bomParts = [];
      
      for (let j = 0; j < partCount; j++) {
        const partIndex = (i + j) % parts.length;
        const part = parts[partIndex];
        const positions = ['Top Side', 'Bottom Side', 'Internal', 'External'];
        const position = positions[j % positions.length];
        
        bomParts.push({
          part_id: part._id,
          quantity: Math.floor(Math.random() * 5) + 1, // 1-5 quantity
          position: position
        });
      }
      
      const versions = ['Gen 1', 'Gen 2', 'Gen 3', 'Gen 4', 'Gen 5', 'Gen 6', 'Gen 7', 'Gen 8', 'Gen 9', 'Gen 10'];
      const statuses = ['draft', 'active', 'inactive'];
      
      // 生成基于电子元器件的BOM名称
      const electronicComponents = ['Resistor', 'Capacitor', 'Transistor', 'Diode', 'IC', 'Inductor', 'Transformer', 'Oscillator', 'Sensor', 'Connector'];
      const componentTypes = ['SMD', 'Through-Hole', 'BGA', 'QFP', 'SOT', 'DIP'];
      const values = ['10kΩ', '100nF', '2N2222', '1N4148', 'LM358', '100μH', '12V', '16MHz', 'LM35', 'USB-C'];
      
      const component = electronicComponents[i % electronicComponents.length];
      const type = componentTypes[i % componentTypes.length];
      const value = values[i % values.length];
      
      const bomName = `${component} ${type} ${value}`;
      
      // 生成新的BOM ID格式：BOM Name缩写+数字编号
      const abbreviationMap = {
        'capacitor': 'Cap',
        'resistor': 'Res',
        'transistor': 'Tra',
        'diode': 'Dio',
        'inductor': 'Ind',
        'transformer': 'Tra',
        'oscillator': 'Osc',
        'sensor': 'Sen',
        'connector': 'Con',
        'ic': 'IC'
      };
      
      const lowerComponent = component.toLowerCase();
      const abbreviation = abbreviationMap[lowerComponent] || component.substring(0, 3);
      const bomId = `${abbreviation}${i.toString().padStart(4, '0')}`;
      
      bomData.push({
        bom_id: bomId,
        bom_name: bomName,
        product_id: product._id,
        version: versions[i % versions.length],
        product_line: product.product_line,
        parts: bomParts,
        status: statuses[i % statuses.length]
      });
    }
    
    const boms = await BOM.insertMany(bomData);

    console.log('BOMs created:', boms.length);

    // Create sample PN mappings
    const pnMaps = await PNMap.insertMany([
      {
        part_id: parts[0]._id,
        target_part_id: parts[0]._id, // 使用相同的part作为target_part
        target_pn: 'PN-THINKPAD-X1-CARBON-GEN10-CPU',
        match_strength: 'high',
        source: 'auto_generated',
        status: 'active'
      }
    ]);

    console.log('PN Maps created:', pnMaps.length);

    // Create sample alignments
    const alignments = await Alignment.insertMany([
      {
        bom_id: boms[0]._id,
        pn_id: pnMaps[0]._id,
        target_pn: 'PN-THINKPAD-X1-CARBON-GEN10-CPU',
        priority: 'high',
        status: 'completed',
        created_at: new Date()
      },
      {
        bom_id: boms[0]._id,
        pn_id: pnMaps[0]._id,
        target_pn: 'PN-THINKPAD-X1-CARBON-GEN10-MEMORY',
        priority: 'medium',
        status: 'pending',
        created_at: new Date()
      }
    ]);

    console.log('Alignments created:', alignments.length);

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();