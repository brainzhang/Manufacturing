import React, { useState, useEffect } from 'react';
import { Select } from 'antd';
import { fetchParts } from '../services/partService';
import { fetchProducts } from '../services/productService';

const { Option } = Select;

// BOM分类配置表 - 2级分类 + 物理参数配置
const BOM_CATEGORIES = {
  // 一级分类 - 主要功能类别
  'Passive Components': {
    // 二级分类 - 具体类型 + 物理参数配置
    'Resistors': {
      parameters: {
        resistance: { type: 'number', unit: 'Ω', range: '1mΩ - 100MΩ', precision: '1% - 10%' },
        power: { type: 'number', unit: 'W', range: '0.125W - 100W', common: ['0.125W', '0.25W', '0.5W', '1W', '2W', '5W'] },
        tolerance: { type: 'select', options: ['±1%', '±2%', '±5%', '±10%', '±20%'] },
        package: { type: 'select', options: ['0402', '0603', '0805', '1206', '2010', '2512', 'Axial', 'Radial'] }
      }
    },
    'Capacitors': {
      parameters: {
        capacitance: { type: 'number', unit: 'F', range: '1pF - 100mF', common: ['1pF', '10pF', '100pF', '1nF', '10nF', '100nF', '1μF', '10μF', '100μF', '1000μF'] },
        voltage: { type: 'number', unit: 'V', range: '6.3V - 1000V', common: ['6.3V', '10V', '16V', '25V', '50V', '100V', '250V', '400V', '630V'] },
        tolerance: { type: 'select', options: ['±5%', '±10%', '±20%', '+80/-20%'] },
        package: { type: 'select', options: ['0402', '0603', '0805', '1206', 'Radial', 'Axial', 'SMD', 'QFP', 'BGA'] }
      }
    },
    'Inductors': {
      parameters: {
        inductance: { type: 'number', unit: 'H', range: '1nH - 100mH', common: ['1nH', '10nH', '100nH', '1μH', '10μH', '100μH', '1mH', '10mH'] },
        current: { type: 'number', unit: 'A', range: '10mA - 100A', common: ['100mA', '500mA', '1A', '2A', '5A', '10A'] },
        dcResistance: { type: 'number', unit: 'Ω', range: '0.001Ω - 10Ω' },
        package: { type: 'select', options: ['0402', '0603', '0805', '1206', 'Axial', 'Radial', 'SMD'] }
      }
    }
  },
  'Active Components': {
    'Diodes': {
      parameters: {
        type: { type: 'select', options: ['Rectifier', 'Zener', 'Schottky', 'LED', 'TVS', 'Varactor'] },
        voltage: { type: 'number', unit: 'V', range: '5V - 1000V' },
        current: { type: 'number', unit: 'A', range: '100mA - 100A' },
        package: { type: 'select', options: ['SOD-123', 'SOD-323', 'SMA', 'SMB', 'SMC', 'DO-41', 'DO-15'] }
      }
    },
    'Transistors': {
      parameters: {
        type: { type: 'select', options: ['BJT-NPN', 'BJT-PNP', 'MOSFET-N', 'MOSFET-P', 'IGBT'] },
        voltage: { type: 'number', unit: 'V', range: '30V - 1200V' },
        current: { type: 'number', unit: 'A', range: '100mA - 100A' },
        package: { type: 'select', options: ['SOT-23', 'SOT-223', 'TO-92', 'TO-220', 'TO-247', 'DFN', 'QFN'] }
      }
    },
    'Integrated Circuits': {
      parameters: {
        function: { type: 'select', options: ['Op-Amp', 'Comparator', 'Voltage Regulator', 'Timer', 'Logic Gate', 'MCU', 'ADC', 'DAC'] },
        supplyVoltage: { type: 'number', unit: 'V', range: '1.8V - 36V' },
        speed: { type: 'number', unit: 'MHz', range: '1MHz - 4GHz' },
        package: { type: 'select', options: ['SOIC', 'TSSOP', 'QFP', 'BGA', 'LQFP', 'DFN', 'QFN'] }
      }
    }
  },
  'Power Management': {
    'Voltage Regulators': {
      parameters: {
        type: { type: 'select', options: ['LDO', 'Buck', 'Boost', 'Buck-Boost', 'Charge Pump'] },
        inputVoltage: { type: 'number', unit: 'V', range: '2.5V - 60V' },
        outputVoltage: { type: 'number', unit: 'V', range: '0.8V - 36V' },
        current: { type: 'number', unit: 'A', range: '100mA - 20A' }
      }
    },
    'Power Supplies': {
      parameters: {
        type: { type: 'select', options: ['AC-DC', 'DC-DC', 'Battery', 'UPS'] },
        input: { type: 'text', placeholder: 'e.g., 100-240VAC, 12VDC' },
        output: { type: 'text', placeholder: 'e.g., 5VDC, ±12VDC' },
        power: { type: 'number', unit: 'W', range: '5W - 2000W' }
      }
    }
  },
  'Sensors & Transducers': {
    'Temperature Sensors': {
      parameters: {
        type: { type: 'select', options: ['Thermistor', 'RTD', 'Thermocouple', 'IC Sensor'] },
        range: { type: 'text', placeholder: 'e.g., -40°C to +125°C' },
        accuracy: { type: 'text', placeholder: 'e.g., ±0.5°C' },
        interface: { type: 'select', options: ['Analog', 'Digital', 'I2C', 'SPI'] }
      }
    },
    'Motion Sensors': {
      parameters: {
        type: { type: 'select', options: ['Accelerometer', 'Gyroscope', 'Magnetometer', 'IMU'] },
        range: { type: 'text', placeholder: 'e.g., ±2g, ±2000°/s' },
        resolution: { type: 'text', placeholder: 'e.g., 16-bit' },
        interface: { type: 'select', options: ['I2C', 'SPI', 'Analog'] }
      }
    },
    'Optical Sensors': {
      parameters: {
        type: { type: 'select', options: ['Photodiode', 'Phototransistor', 'Ambient Light', 'Color'] },
        wavelength: { type: 'text', placeholder: 'e.g., 400-700nm' },
        sensitivity: { type: 'text', placeholder: 'e.g., 0.1 lux' },
        package: { type: 'select', options: ['SMD', 'Through-hole', 'Module'] }
      }
    }
  },
  'Connectors & Interfaces': {
    'Board Connectors': {
      parameters: {
        type: { type: 'select', options: ['Header', 'Socket', 'Edge', 'FPC', 'Board-to-Board'] },
        pitch: { type: 'number', unit: 'mm', range: '0.5mm - 2.54mm' },
        pins: { type: 'number', range: '1 - 200 pins' },
        current: { type: 'number', unit: 'A', range: '1A - 30A' }
      }
    },
    'Cable Connectors': {
      parameters: {
        type: { type: 'select', options: ['USB', 'HDMI', 'Ethernet', 'Power', 'Audio', 'RF'] },
        standard: { type: 'text', placeholder: 'e.g., USB-C, HDMI 2.1' },
        current: { type: 'number', unit: 'A', range: '1A - 100A' },
        shielding: { type: 'select', options: ['Unshielded', 'Shielded', 'Double Shielded'] }
      }
    }
  },
  'Oscillators & Crystals': {
    'Crystal Oscillators': {
      parameters: {
        frequency: { type: 'number', unit: 'Hz', range: '32.768kHz - 200MHz', common: ['32.768kHz', '4MHz', '8MHz', '12MHz', '16MHz', '20MHz', '25MHz', '50MHz'] },
        stability: { type: 'text', placeholder: 'e.g., ±10ppm, ±20ppm' },
        package: { type: 'select', options: ['SMD', 'DIP', 'SOT', 'QFP'] },
        voltage: { type: 'number', unit: 'V', range: '1.8V - 5V' }
      }
    },
    'Crystals': {
      parameters: {
        frequency: { type: 'number', unit: 'Hz', range: '4MHz - 50MHz' },
        loadCapacitance: { type: 'number', unit: 'pF', range: '8pF - 32pF' },
        package: { type: 'select', options: ['HC-49S', 'SMD', 'Through-hole'] },
        tolerance: { type: 'text', placeholder: 'e.g., ±10ppm, ±20ppm' }
      }
    }
  }
};

// Icons
const BatchDeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const BOMForm = ({ bom, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    bom_id: '',
    bom_name: '',
    product_id: '',
    product_serial: [], // 多选模式应该使用数组
    product_gen: 'GEN3',
    parts: [],
    version: '',
    product_line: '',
    status: 'draft'
  });
  const [parts, setParts] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedPart, setSelectedPart] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [position, setPosition] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [selectedPartsToDelete, setSelectedPartsToDelete] = useState([]);
  const [positionSuggestions, setPositionSuggestions] = useState([]);
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  
  // BOM分类选择状态 - 2级分类
  const [selectedLevel1, setSelectedLevel1] = useState('');
  const [selectedLevel2, setSelectedLevel2] = useState('');
  const [bomNameSuggestions, setBomNameSuggestions] = useState([]);
  const [showBomNameDropdown, setShowBomNameDropdown] = useState(false);
  
  // 物理参数配置状态
  const [physicalParameters, setPhysicalParameters] = useState({});
  
  // 预定义的位置选项（与Part模型保持一致）
  const positionOptions = [
    'Top Side', 'Bottom Side', 'Internal', 'External'
  ];

  // 获取BOM分类选项 - 2级分类
  const getLevel1Options = () => Object.keys(BOM_CATEGORIES);
  const getLevel2Options = () => selectedLevel1 ? Object.keys(BOM_CATEGORIES[selectedLevel1] || {}) : [];
  
  // 获取物理参数配置
  const getPhysicalParameters = () => {
    if (!selectedLevel1 || !selectedLevel2) return {};
    return BOM_CATEGORIES[selectedLevel1]?.[selectedLevel2]?.parameters || {};
  };

  // 获取分类名称的缩写
  const getLevelAbbreviation = (levelName) => {
    const abbreviationMap = {
      // Power Management 相关
      'Power Management': 'PM',
      'Voltage Regulators': 'VR',
      'Buck': 'B',
      'Boost': 'BST',
      'LDO': 'LDO',
      
      // Passive Components 相关
      'Passive Components': 'PC',
      'Resistors': 'R',
      'Capacitors': 'C',
      'Inductors': 'L',
      
      // Semiconductors 相关
      'Semiconductors': 'SC',
      'Diodes': 'D',
      'Transistors': 'T',
      'ICs': 'IC',
      
      // Connectors 相关
      'Connectors': 'CN',
      'Headers': 'HDR',
      'Sockets': 'SKT',
      'Terminals': 'TERM',
      
      // 默认规则：取前2-3个字母
    };
    
    // 如果映射中有定义，使用映射的缩写
    if (abbreviationMap[levelName]) {
      return abbreviationMap[levelName];
    }
    
    // 默认规则：对于多单词名称，取每个单词的首字母
    if (levelName.includes(' ')) {
      return levelName.split(' ').map(word => word.charAt(0).toUpperCase()).join('');
    }
    
    // 单单词名称：取前3个字母
    return levelName.substring(0, 3).toUpperCase();
  };

  // 生成BOM名称建议 - 2级分类 + 物理参数
  const generateBomNameSuggestions = () => {
    const suggestions = [];
    const params = getPhysicalParameters();
    
    if (selectedLevel2) {
      // 基础名称
      suggestions.push(`${selectedLevel1} - ${selectedLevel2}`);
      
      // 带物理参数的名称建议
      if (Object.keys(params).length > 0) {
        // 根据参数类型生成不同的名称格式
        const paramNames = Object.keys(params);
        
        // 如果有频率参数（如振荡器）
        if (params.frequency) {
          suggestions.push(`${selectedLevel1} - ${selectedLevel2} ${params.frequency.common ? params.frequency.common[0] : ''}`);
        }
        
        // 如果有电容参数
        if (params.capacitance) {
          suggestions.push(`${selectedLevel1} - ${selectedLevel2} ${params.capacitance.common ? params.capacitance.common[0] : ''}`);
        }
        
        // 如果有电阻参数
        if (params.resistance) {
          suggestions.push(`${selectedLevel1} - ${selectedLevel2} ${params.resistance.common ? params.resistance.common[0] : ''}`);
        }
        
        // 通用参数组合
        suggestions.push(`${selectedLevel1} - ${selectedLevel2} with ${paramNames.slice(0, 2).join(' & ')}`);
      }
    }
    
    if (selectedLevel1) {
      suggestions.push(`${selectedLevel1}`);
    }
    
    return suggestions;
  };

  // 处理BOM名称输入变化
  const handleBomNameInputChange = (value) => {
    setFormData(prev => ({
      ...prev,
      bom_name: value
    }));
    
    if (value.trim() === '') {
      setBomNameSuggestions([]);
      setShowBomNameDropdown(false);
      return;
    }
    
    // 模糊匹配：不区分大小写，支持首字母匹配
    const allSuggestions = generateBomNameSuggestions();
    const filtered = allSuggestions.filter(suggestion => 
      suggestion.toLowerCase().includes(value.toLowerCase()) ||
      suggestion.toLowerCase().startsWith(value.toLowerCase())
    );
    
    setBomNameSuggestions(filtered);
    setShowBomNameDropdown(filtered.length > 0);
  };

  // 选择BOM名称建议
  const selectBomName = (selectedName) => {
    setFormData(prev => ({
      ...prev,
      bom_name: selectedName
    }));
    setShowBomNameDropdown(false);
    setBomNameSuggestions([]);
  };

  // Auto-generate BOM name - 一级缩写+二级缩写+所有物理参数值（单位）的拼接字符串
  const autoGenerateBomName = async () => {
    const params = getPhysicalParameters();
    
    if (selectedLevel2) {
      // 生成一级和二级缩写
      const level1Abbr = getLevelAbbreviation(selectedLevel1);
      const level2Abbr = getLevelAbbreviation(selectedLevel2);
      
      // 基础名称：一级缩写+二级缩写
      let bomName = `${level1Abbr}${level2Abbr}`;
      
      // 添加所有物理参数值（单位）的拼接
      if (Object.keys(physicalParameters).length > 0) {
        const paramParts = [];
        
        // 遍历所有已设置的物理参数
        Object.entries(physicalParameters).forEach(([paramName, paramValue]) => {
          if (paramValue && paramValue !== '') {
            const paramConfig = params[paramName];
            if (paramConfig) {
              // 获取参数的单位
              const unit = paramConfig.unit || '';
              // 对于数值参数，直接拼接值+单位
              // 对于选择参数，使用选择的值
              paramParts.push(`${paramValue}${unit}`);
            }
          }
        });
        
        // 如果有参数，添加到名称中
        if (paramParts.length > 0) {
          bomName += paramParts.join('');
        }
      }
      
      // 特殊处理：如果选择了Type参数，将其缩写添加到名称中
      if (physicalParameters.type && physicalParameters.type !== '') {
        const typeAbbr = getLevelAbbreviation(physicalParameters.type);
        bomName = `${level1Abbr}${level2Abbr}${typeAbbr}`;
        
        // 重新添加其他参数
        const otherParams = Object.entries(physicalParameters)
          .filter(([paramName, paramValue]) => paramName !== 'type' && paramValue && paramValue !== '')
          .map(([paramName, paramValue]) => {
            const paramConfig = params[paramName];
            const unit = paramConfig?.unit || '';
            return `${paramValue}${unit}`;
          });
        
        if (otherParams.length > 0) {
          bomName += otherParams.join('');
        }
      }
      
      selectBomName(bomName);
    } else if (selectedLevel1) {
      // 只有一级分类时，只使用一级缩写
      const level1Abbr = getLevelAbbreviation(selectedLevel1);
      selectBomName(`${level1Abbr}`);
    }
    
    // Ensure parts data is loaded for dropdowns
    if (parts.length === 0) {
      try {
        console.log('Auto generating BOM name, reloading parts data...');
        await loadPartsAndProducts();
        console.log('Parts data reloaded after auto generate');
      } catch (error) {
        console.error('Error loading parts data after auto generate:', error);
      }
    }
  };

  // 解析BOM名称并设置分类级别
  const parseBomNameAndSetLevels = (bomName) => {
    if (!bomName) return;
    
    const parts = bomName.split(' - ');
    
    if (parts.length >= 1) {
      const level1 = parts[0];
      if (getLevel1Options().includes(level1)) {
        setSelectedLevel1(level1);
      }
    }
    
    if (parts.length >= 2) {
      const level2 = parts[1];
      if (getLevel2Options().includes(level2)) {
        setSelectedLevel2(level2);
      }
    }
  };

  // 模糊匹配函数
  const handlePositionInputChange = (value) => {
    setPosition(value);
    
    if (value.trim() === '') {
      setPositionSuggestions([]);
      setShowPositionDropdown(false);
      return;
    }
    
    // 模糊匹配：不区分大小写，支持首字母匹配
    const filtered = positionOptions.filter(option => 
      option.toLowerCase().includes(value.toLowerCase()) ||
      option.toLowerCase().startsWith(value.toLowerCase())
    );
    
    setPositionSuggestions(filtered);
    setShowPositionDropdown(filtered.length > 0);
  };

  // 选择位置选项
  const selectPosition = (selectedPosition) => {
    setPosition(selectedPosition);
    setShowPositionDropdown(false);
    setPositionSuggestions([]);
  };

  useEffect(() => {
    // Ensure parts and products data are loaded every time form opens
    const loadData = async () => {
      try {
        console.log('Loading parts and products data...');
        await loadPartsAndProducts();
        console.log('Parts and products data loaded successfully');
      } catch (error) {
        console.error('Error loading parts and products data:', error);
      }
    };
    
    loadData();
    
    if (bom) {
      console.log('Editing existing BOM:', bom);
      console.log('BOM parts raw:', bom.parts);
      
      // Format parts correctly: part_id is ObjectId (MongoDB _id)
      const formattedParts = bom.parts ? bom.parts.map(part => {
        console.log('Formatting part:', part);
        console.log('part.part_id:', part.part_id);
        console.log('part.part_id type:', typeof part.part_id);
        
        // If part_id is already populated (object), use it directly
        const partInfo = typeof part.part_id === 'object' && part.part_id !== null ? part.part_id : null;
        const partId = partInfo ? partInfo._id : part.part_id;
        
        console.log('Extracted partInfo:', partInfo);
        console.log('Extracted partId:', partId);
        
        return {
          part_id: partId, // Use _id (ObjectId)
          quantity: part.quantity || 1,
          position: part.position || 'N/A',
          part_info: partInfo || part // Save complete Part info for display
        };
      }) : [];
      
      console.log('Formatted parts for editing:', formattedParts);
      
      setFormData({
        bom_id: bom.bom_id || '',
        bom_name: bom.bom_name || '',
        product_id: bom.product_id?._id || bom.product_id || '',
        parts: formattedParts,
        version: bom.version || '',
        product_line: bom.product_line || '',
        status: bom.status || 'draft'
      });
      // Parse BOM name and set category levels when editing
      parseBomNameAndSetLevels(bom.bom_name);
    } else {
      // 新建时生成BOM ID - 确保每次新建都生成新ID
      const generateBOMId = () => {
        // 生成四位随机数字，范围从0001到9999
        const randomNum = Math.floor(Math.random() * 9999) + 1;
        return `BOM${randomNum.toString().padStart(4, '0')}`;
      };
      
      setFormData({
        bom_id: generateBOMId(),
        bom_name: '',
        product_id: '',
        parts: [],
        version: '',
        product_line: '',
        status: 'draft'
      });
      
      // 新建时重置分类级别
      setSelectedLevel1('');
      setSelectedLevel2('');
    }
  }, [bom]);

  const loadPartsAndProducts = async () => {
    try {
      console.log('Starting to load parts and products data...');
      
      const [partsData, productsData] = await Promise.all([
        fetchParts(),
        fetchProducts()
      ]);
      
      // Debug: Check parts data structure
      console.log('Parts data loaded:', partsData);
      console.log('Parts data type:', typeof partsData);
      console.log('Parts data length:', Array.isArray(partsData) ? partsData.length : 'Not an array');
      
      // Enhanced data validation and error handling
      let processedParts = [];
      
      if (Array.isArray(partsData)) {
        processedParts = partsData;
      } else if (partsData && partsData.parts && Array.isArray(partsData.parts)) {
        // Handle API nested structure
        processedParts = partsData.parts;
      } else if (partsData && Array.isArray(partsData.data)) {
        // Handle other possible response formats
        processedParts = partsData.data;
      } else {
        console.error('Parts data format not recognized:', partsData);
        processedParts = [];
      }
      
      console.log('Processed parts data:', processedParts);
      console.log('Processed parts length:', processedParts.length);
      
      if (processedParts.length > 0) {
        console.log('First part structure:', processedParts[0]);
        console.log('First part _id:', processedParts[0]._id);
        console.log('First part category:', processedParts[0].category);
        console.log('First part vendor:', processedParts[0].vendor);
        console.log('First part name:', processedParts[0].name);
        console.log('First part part_no:', processedParts[0].part_no);
        console.log('First part part_id:', processedParts[0].part_id);
        
        // 确保parts数据有正确的字段映射
        const formattedParts = processedParts.map(part => ({
          ...part,
          // 确保part_id字段存在，用于BOM关联
          part_id: part._id || part.part_id,
          // 确保name字段存在
          name: part.name || part.part_name || part.part_no || 'Unknown Part',
          // 确保其他必要字段存在
          category: part.category || 'N/A',
          vendor: part.vendor || 'N/A'
        }));
        
        console.log('Formatted parts data:', formattedParts);
        setParts(formattedParts);
      } else {
        console.warn('No parts loaded! Parts dropdown will be empty.');
        setParts(processedParts);
      }
      
      // Handle products data
      let processedProducts = [];
      if (Array.isArray(productsData)) {
        processedProducts = productsData;
      } else if (productsData && productsData.products && Array.isArray(productsData.products)) {
        processedProducts = productsData.products;
      } else if (productsData && Array.isArray(productsData.data)) {
        processedProducts = productsData.data;
      } else {
        console.error('Products data format not recognized:', productsData);
        processedProducts = [];
      }
      
      setProducts(processedProducts);
      
      console.log('Data loading complete, parts count:', processedParts.length, 'products count:', processedProducts.length);
      
      return { parts: processedParts, products: processedProducts };
      
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error details:', error.message, error.stack);
      
      // Set default data if API call fails
      setParts([]);
      setProducts([]);
      
      // Show user-friendly error message
      alert('Failed to load parts and products data. Please check network connection or contact administrator. Error: ' + error.message);
      
      throw error;
    }
  };

  // 获取唯一的分类列表
  const getUniqueCategories = () => {
    if (!Array.isArray(parts) || parts.length === 0) {
      console.warn('Parts数据为空或不是数组，返回空分类列表');
      console.log('当前parts数据:', parts);
      return [];
    }
    
    try {
      const categories = [...new Set(parts.map(part => part.category))];
      const filteredCategories = categories.filter(category => category && category.trim() !== '');
      console.log('获取到的分类列表:', filteredCategories);
      console.log('原始parts数据中的category字段:', parts.map(p => p.category));
      return filteredCategories;
    } catch (error) {
      console.error('获取分类列表时出错:', error);
      return [];
    }
  };

  // 获取唯一的供应商列表
  const getUniqueVendors = () => {
    if (!Array.isArray(parts) || parts.length === 0) {
      console.warn('Parts数据为空或不是数组，返回空供应商列表');
      console.log('当前parts数据:', parts);
      return [];
    }
    
    try {
      const vendors = [...new Set(parts.map(part => part.vendor))];
      const filteredVendors = vendors.filter(vendor => vendor && vendor.trim() !== '');
      console.log('获取到的供应商列表:', filteredVendors);
      console.log('原始parts数据中的vendor字段:', parts.map(p => p.vendor));
      return filteredVendors;
    } catch (error) {
      console.error('获取供应商列表时出错:', error);
      return [];
    }
  };

  // 根据分类和供应商筛选零件
  const getFilteredParts = () => {
    if (!Array.isArray(parts) || parts.length === 0) {
      console.warn('Parts数据为空或不是数组，返回空零件列表');
      return [];
    }
    
    try {
      const filteredParts = parts.filter(part => {
        const categoryMatch = !categoryFilter || part.category === categoryFilter;
        const vendorMatch = !vendorFilter || part.vendor === vendorFilter;
        return categoryMatch && vendorMatch;
      });
      
      console.log('筛选后的零件列表:', filteredParts.length, '个零件');
      console.log('筛选条件 - 分类:', categoryFilter, '供应商:', vendorFilter);
      
      return filteredParts;
    } catch (error) {
      console.error('筛选零件时出错:', error);
      return [];
    }
  };



  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addPart = () => {
    console.log('addPart called - selectedPart:', selectedPart, 'quantity:', quantity);
    console.log('Available parts:', parts.length);
    
    if (!selectedPart || quantity < 1 || !position) {
      console.error('Validation failed - selectedPart:', selectedPart, 'quantity:', quantity, 'position:', position);
      alert('Please select a part, set quantity, and choose position');
      return;
    }
    
    // Get selected Part info
    const selectedPartInfo = parts.find(part => part._id === selectedPart);
    if (!selectedPartInfo) {
      alert('Selected part information is invalid');
      return;
    }
    
    // Check if part is already added
    const isPartAlreadyAdded = formData.parts.some(part => part.part_id === selectedPart);
    if (isPartAlreadyAdded) {
      alert('This part has already been added to the BOM');
      return;
    }
    
    // part_id is ObjectId (MongoDB _id)
    const newPart = {
      part_id: selectedPartInfo._id, // Use Part document's _id field (ObjectId)
      quantity: parseInt(quantity),
      position: position || 'N/A',
      part_info: selectedPartInfo // Save complete Part info for display
    };
    
    setFormData(prev => ({
      ...prev,
      parts: [...prev.parts, newPart]
    }));
    
    // Reset form
    setSelectedPart('');
    setQuantity(1);
    setPosition('');
    
    console.log('Part added successfully:', newPart);
  };

  const removePart = (index) => {
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, i) => i !== index)
    }));
  };

  // 切换零件选择状态
  const togglePartSelection = (index) => {
    setSelectedPartsToDelete(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // 批量删除选中的零件
  const batchRemoveParts = () => {
    if (selectedPartsToDelete.length === 0) return;
    
    setFormData(prev => ({
      ...prev,
      parts: prev.parts.filter((_, index) => !selectedPartsToDelete.includes(index))
    }));
    
    // 清空选择
    setSelectedPartsToDelete([]);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedPartsToDelete.length === formData.parts.length) {
      setSelectedPartsToDelete([]);
    } else {
      setSelectedPartsToDelete(formData.parts.map((_, index) => index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 检查必填字段是否完整
    const requiredFields = ['bom_name', 'product_id', 'version'];
    const hasMissingFields = requiredFields.some(field => !formData[field]);
    const hasNoParts = formData.parts.length === 0;
    
    // 根据您的定义实现状态逻辑：
    // 1. draft: 如果缺少一个值或以上，保存后status为draft
    // 2. inactive: 如果所有值已经选择，但Manipulation下拉值是inactive，保存后status为inactive
    // 3. active: 如果所有值已经选择，且Manipulation下拉值是active，保存后status为active
    
    let finalStatus = formData.status;
    
    // 如果缺少必填字段或没有零件，强制设置为draft状态
    if (hasMissingFields || hasNoParts) {
      finalStatus = 'draft';
    }
    // 如果所有字段完整，但用户选择的是inactive，保持inactive
    else if (formData.status === 'inactive') {
      finalStatus = 'inactive';
    }
    // 如果所有字段完整，且用户选择的是active，保持active
    else if (formData.status === 'active') {
      finalStatus = 'active';
    }
    // 如果所有字段完整，但用户选择的是draft，保持draft
    else if (formData.status === 'draft') {
      finalStatus = 'draft';
    }
    
    const finalFormData = {
      ...formData,
      status: finalStatus,
      push_status: finalStatus === 'active' ? 'push' : 'push' // Active状态可推送，其他状态显示Push但置灰
    };
    
    onSave(finalFormData);
  };

  return (
    <div className="bom-form bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">{bom ? 'Edit BOM' : 'Create New BOM'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bom_id">
            BOM ID
          </label>
          <input
            type="text"
            id="bom_id"
            name="bom_id"
            value={formData.bom_id}
            readOnly
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bom_name">
            BOM Name (Electronic Component Classification)
          </label>
          
          {/* BOM分类选择器 - 2级分类 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="level1">
                Level 1
              </label>
              <select
                id="level1"
                value={selectedLevel1}
                onChange={(e) => {
                  setSelectedLevel1(e.target.value);
                  setSelectedLevel2('');
                  setPhysicalParameters({});
                }}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Level 1</option>
                {getLevel1Options().map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="level2">
                Level 2
              </label>
              <select
                id="level2"
                value={selectedLevel2}
                onChange={(e) => {
                  setSelectedLevel2(e.target.value);
                  setPhysicalParameters(getPhysicalParameters());
                }}
                disabled={!selectedLevel1}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline disabled:bg-gray-100"
              >
                <option value="">Select Level 2</option>
                {getLevel2Options().map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* 物理参数配置 */}
          {selectedLevel2 && Object.keys(getPhysicalParameters()).length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3">Physical Parameters Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(getPhysicalParameters()).map(([paramName, paramConfig]) => (
                  <div key={paramName}>
                    <label className="block text-gray-700 text-sm font-bold mb-1 capitalize">
                      {paramName.replace(/([A-Z])/g, ' $1')}
                      {paramConfig.unit && ` (${paramConfig.unit})`}
                    </label>
                    
                    {paramConfig.type === 'select' ? (
                      <select
                        value={physicalParameters[paramName] || ''}
                        onChange={(e) => setPhysicalParameters(prev => ({
                          ...prev,
                          [paramName]: e.target.value
                        }))}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      >
                        <option value="">Select {paramName}</option>
                        {paramConfig.options.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : paramConfig.type === 'number' ? (
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={physicalParameters[paramName] || ''}
                          onChange={(e) => setPhysicalParameters(prev => ({
                            ...prev,
                            [paramName]: e.target.value
                          }))}
                          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          placeholder={paramConfig.range ? `Range: ${paramConfig.range}` : ''}
                        />
                        {paramConfig.common && (
                          <select
                            onChange={(e) => setPhysicalParameters(prev => ({
                              ...prev,
                              [paramName]: e.target.value
                            }))}
                            className="shadow appearance-none border rounded w-32 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="">Common values</option>
                            {paramConfig.common.map(value => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={physicalParameters[paramName] || ''}
                        onChange={(e) => setPhysicalParameters(prev => ({
                          ...prev,
                          [paramName]: e.target.value
                        }))}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder={paramConfig.placeholder || `Enter ${paramName}`}
                      />
                    )}
                    
                    {paramConfig.range && (
                      <div className="text-xs text-gray-500 mt-1">Range: {paramConfig.range}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* BOM名称输入框与自动生成按钮 */}
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                id="bom_name"
                name="bom_name"
                value={formData.bom_name}
                onChange={(e) => handleBomNameInputChange(e.target.value)}
                onFocus={() => {
                  if (formData.bom_name.trim() === '') {
                    setBomNameSuggestions(generateBomNameSuggestions());
                    setShowBomNameDropdown(true);
                  }
                }}
                onBlur={() => {
                  // 延迟隐藏下拉框，以便点击选项
                  setTimeout(() => setShowBomNameDropdown(false), 200);
                }}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Enter BOM name or select from suggestions..."
                required
              />
              
              {/* BOM名称下拉建议框 */}
              {showBomNameDropdown && bomNameSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {bomNameSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 cursor-pointer hover:bg-blue-100 border-b border-gray-100 last:border-b-0"
                      onClick={() => selectBomName(suggestion)}
                      onMouseDown={(e) => e.preventDefault()} // 防止onBlur触发
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="position">
                Position
              </label>
              <select
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Position</option>
                <option value="Top Side">Top Side</option>
                <option value="Bottom Side">Bottom Side</option>
                <option value="Internal">Internal</option>
                <option value="External">External</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="button"
                onClick={autoGenerateBomName}
                disabled={!selectedLevel1}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400 disabled:cursor-not-allowed"
                title="Auto-generate BOM name from selected categories"
              >
                Auto Generate
              </button>
            </div>
          </div>
          
          {/* 分类提示 */}
          <div className="mt-2 text-sm text-gray-600">
            <strong>Classification System:</strong> Level 1 → Level 2 → Physical Parameters
            <br />
            <strong>Examples:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>Passive Components → Capacitors → 100nF, 16V, ±10%</li>
              <li>Oscillators & Crystals → Crystal Oscillators → 16MHz, ±20ppm, 3.3V</li>
              <li>Active Components → Diodes → Rectifier, 1000V, 1A</li>
            </ul>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Parts
          </label>
          
          {/* Selected Parts Table - 与BOMList字段保持一致 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold">Selected Parts ({formData.parts.length}):</h4>
              {formData.parts.length > 0 && (
                <button
                  type="button"
                  onClick={batchRemoveParts}
                  disabled={selectedPartsToDelete.length === 0}
                  className="flex items-center bg-red-500 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                  title="Delete Selected"
                >
                  <BatchDeleteIcon />
                  <span className="ml-1">Delete Selected ({selectedPartsToDelete.length})</span>
                </button>
              )}
            </div>
            
            {formData.parts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-3 border-b text-left">
                        <input
                          type="checkbox"
                          checked={selectedPartsToDelete.length === formData.parts.length && formData.parts.length > 0}
                          onChange={toggleSelectAll}
                          className="cursor-pointer"
                        />
                      </th>
                      <th className="py-2 px-3 border-b text-left">Part ID</th>
                      <th className="py-2 px-3 border-b text-left">Part Name</th>
                      <th className="py-2 px-3 border-b text-left">Quantity</th>
                      <th className="py-2 px-3 border-b text-left">Position</th>
                      <th className="py-2 px-3 border-b text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.parts.map((part, index) => {
                      // 优先使用part_info，如果没有则查找parts列表中的对应part
                      const partInfo = part.part_info || parts.find(p => p._id === part.part_id) || {};
                      const isSelected = selectedPartsToDelete.includes(index);
                      
                      // 生成Part ID（与BOMList保持一致）- 点击保存时自动生成
                      const generatePartId = (partName, position, index = 0) => {
                        const actualPartName = position || partName || 'Unknown';
                        const abbreviationMap = {
                          '电阻': 'RES', '电容': 'CAP', '传感器': 'SEN', '连接器': 'CON',
                          '晶体管': 'TRA', 'IC': 'IC', '电感': 'IND', '二极管': 'DIO',
                          '振荡器': 'OSC', '变压器': 'TRA', 'power supply': 'PS', 'cpu': 'CPU',
                          'memory': 'MEM', 'storage': 'STR', 'motherboard': 'MB', 'gpu': 'GPU'
                        };
                        
                        let abbreviation = 'PAR';
                        for (const [keyword, abbr] of Object.entries(abbreviationMap)) {
                          if (actualPartName && actualPartName.toLowerCase().includes(keyword.toLowerCase())) {
                            abbreviation = abbr;
                            break;
                          }
                        }
                        
                        const number = (index + 1).toString().padStart(4, '0');
                        return `${abbreviation}${number}`;
                      };
                      
                      // 确保正确显示Part信息
                      const partName = partInfo.name || partInfo.part_name || part.position || 'N/A';
                      const partId = generatePartId(partName, part.position, index);
                      
                      return (
                        <tr key={index} className={`${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                          <td className="py-2 px-3 border-b">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePartSelection(index)}
                              className="cursor-pointer"
                            />
                          </td>
                          <td className="py-2 px-3 border-b">{partId}</td>
                          <td className="py-2 px-3 border-b">{partName}</td>
                          <td className="py-2 px-3 border-b">{part.quantity}</td>
                          <td className="py-2 px-3 border-b">{part.position || 'N/A'}</td>
                          <td className="py-2 px-3 border-b text-center">
                            <button
                              type="button"
                              onClick={() => removePart(index)}
                              className="text-red-600 hover:text-red-800 font-bold"
                              title="Remove this part"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500 italic p-3 bg-gray-50 rounded text-center">No parts added yet. Use the form below to add parts.</div>
            )}
          </div>
          
          {/* Add Part Form with Part Name, Quantity, Position */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="selectedPart">
                Part Name
              </label>
              <select
                id="selectedPart"
                value={selectedPart}
                onChange={(e) => setSelectedPart(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Part Name</option>
                {getFilteredParts().length > 0 ? (
                  getFilteredParts().map(part => (
                    <option key={part._id} value={part._id}>
                      {part.name} ({part.part_no})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No parts available</option>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="quantity">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="position">
                Position
              </label>
              <select
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select Position</option>
                <option value="Top Side">Top Side</option>
                <option value="Bottom Side">Bottom Side</option>
                <option value="Internal">Internal</option>
                <option value="External">External</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="button"
                onClick={addPart}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Add Part
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="product_id">
              产品型号
            </label>
            <select
              id="product_id"
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">请选择产品型号</option>
              {products.map(product => (
                <option key={product._id} value={product._id}>
                  {product.model} - {product.product_line}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="product_serial">
              产品序列号
            </label>
            <Select
              mode="multiple"
              placeholder="请选择产品序列号"
              value={formData.product_serial}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  product_serial: value
                }));
              }}
              className="w-full"
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              <Option value="SN001">SN001</Option>
              <Option value="SN002">SN002</Option>
              <Option value="SN003">SN003</Option>
              <Option value="SN004">SN004</Option>
              <Option value="SN005">SN005</Option>
              <Option value="SN006">SN006</Option>
              <Option value="SN007">SN007</Option>
              <Option value="SN008">SN008</Option>
              <Option value="SN009">SN009</Option>
              <Option value="SN010">SN010</Option>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="version">
              BOM版本
            </label>
            <input
              type="text"
              id="version"
              name="version"
              value={formData.version}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="product_gen">
              产品版本GEN
            </label>
            <select
              id="product_gen"
              name="product_gen"
              value={formData.product_gen || 'GEN3'}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="GEN1">GEN1</option>
              <option value="GEN2">GEN2</option>
              <option value="GEN3">GEN3</option>
              <option value="GEN4">GEN4</option>
            </select>
          </div>
        </div>
        
        {/* 右侧预览部分 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            {/* 原有内容保持不变 */}
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-3">产品预览</h4>
            
            {/* 产品图片 */}
            <div className="mb-4">
              <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                {formData.product_id ? (
                  <img 
                    src={`/api/products/${formData.product_id}/image`} 
                    alt="产品图片" 
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={(e) => {
                      const modal = document.createElement('div');
                      modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
                      modal.onclick = () => document.body.removeChild(modal);
                      
                      const img = document.createElement('img');
                      img.src = e.target.src;
                      img.className = 'max-w-full max-h-full';
                      
                      modal.appendChild(img);
                      document.body.appendChild(modal);
                    }}
                  />
                ) : (
                  <span className="text-gray-500">暂无产品图片</span>
                )}
              </div>
              <p className="text-xs text-center text-gray-500 mt-1">点击图片可放大预览</p>
            </div>
            
            {/* 基础属性 */}
            <div className="space-y-2">
              <div>
                <span className="text-xs font-semibold text-gray-600">平台：</span>
                <span className="text-xs text-gray-800 ml-1">
                  {products.find(p => p._id === formData.product_id)?.platform || '未选择'}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-600">Family：</span>
                <span className="text-xs text-gray-800 ml-1">
                  {products.find(p => p._id === formData.product_id)?.product_line || '未选择'}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-600">型号：</span>
                <span className="text-xs text-gray-800 ml-1">
                  {products.find(p => p._id === formData.product_id)?.model || '未选择'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="product_line">
            Product Line
          </label>
          <select
            id="product_line"
            name="product_line"
            value={formData.product_line}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select Product Line</option>
            <option value="ThinkPad">ThinkPad</option>
            <option value="ThinkCentre">ThinkCentre</option>
            <option value="ThinkStation">ThinkStation</option>
            <option value="IdeaPad">IdeaPad</option>
            <option value="IdeaCentre">IdeaCentre</option>
            <option value="Legion">Legion</option>
            <option value="Yoga">Yoga</option>
            <option value="ThinkBook">ThinkBook</option>
            <option value="ThinkVision">ThinkVision</option>
            <option value="ThinkSmart">ThinkSmart</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
            Manipulation
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
            <option value="active">Active</option>
          </select>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Save BOM
          </button>
        </div>
      </form>
    </div>
  );
};

export default BOMForm;