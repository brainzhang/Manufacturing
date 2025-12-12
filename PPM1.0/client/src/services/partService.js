import api from './api';

// 模拟ThinkPad笔记本零部件数据
export const mockPartsData = [
  {
    _id: 'LNB-P001',
    name: 'ThinkPad X1 Carbon 2023 主板',
    description: 'ThinkPad X1 Carbon 12th Gen 主板组件，支持Intel Core i7-1365U处理器',
    category: '主板',
    part_no: 'FRU 5B21B54763',
    part_id: 'LNB-P001',
    cost: 3299,
    supplier: '联想供应链',
    lifecycle: 'Active',
    specifications: {
      model: 'X1 Carbon 12th Gen',
      processor: 'Intel Core i7-1365U',
      chipset: 'Intel SoC',
      memory_slots: 2,
      form_factor: 'Ultrabook专用'
    }
  },
  {
    _id: 'LNB-P002',
    name: 'ThinkPad 14英寸 2.8K OLED显示屏',
    description: '14英寸 2.8K (2880x1800) OLED触控显示屏，16:10比例，60Hz刷新率',
    category: '显示屏',
    part_no: 'FRU 02DC845',
    part_id: 'LNB-P002',
    cost: 1899,
    supplier: '京东方光电',
    lifecycle: 'Active',
    specifications: {
      diagonal: '14英寸',
      resolution: '2.8K (2880x1800)',
      panel_type: 'OLED',
      refresh_rate: '60Hz',
      aspect_ratio: '16:10',
      touch_support: true
    }
  },
  {
    _id: 'LNB-P003',
    name: 'ThinkPad Ultra Performance电池',
    description: '72Wh大容量锂离子电池，支持快速充电，最长续航可达20小时',
    category: '电池',
    part_no: 'FRU 5B10W51831',
    part_id: 'LNB-P003',
    cost: 799,
    supplier: '松下能源',
    lifecycle: 'Active',
    specifications: {
      capacity: '72Wh',
      voltage: '15.2V',
      chemistry: '锂离子',
      cycles: '500+',
      fast_charge: true
    }
  },
  {
    _id: 'LNB-P004',
    name: 'ThinkPad 背光键盘模组',
    description: '全尺寸背光键盘，带TrackPoint指点杆，防泼溅设计，支持两档亮度调节',
    category: '键盘',
    part_no: 'FRU 01YP953',
    part_id: 'LNB-P004',
    cost: 399,
    supplier: '群光电子',
    lifecycle: 'Active',
    specifications: {
      type: '全尺寸键盘',
      backlight: true,
      trackpoint: true,
      spill_resistant: true,
      language: '中文(美式键盘)'
    }
  },
  {
    _id: 'LNB-P005',
    name: 'Intel Core i7-1365U处理器',
    description: '第13代Intel Core i7-1365U处理器，10核(2P+8E)，最高频率5.0GHz',
    category: '处理器',
    part_no: 'CM8071504877811',
    part_id: 'LNB-P005',
    cost: 1699,
    supplier: 'Intel',
    lifecycle: 'Active',
    specifications: {
      cores: 10,
      threads: 12,
      base_frequency: '1.2GHz',
      max_turbo_frequency: '5.0GHz',
      cache: '12MB',
      tdp: '15W'
    }
  },
  {
    _id: 'LNB-P006',
    name: 'ThinkPad Thunderbolt 4扩展卡',
    description: '支持双Thunderbolt 4接口，支持40Gbps数据传输，兼容USB4',
    category: '接口卡',
    part_no: 'FRU 02DC877',
    part_id: 'LNB-P006',
    cost: 499,
    supplier: 'JAE Electronics',
    lifecycle: 'Active',
    specifications: {
      interface: 'Thunderbolt 4',
      ports: 2,
      data_rate: '40Gbps',
      video_support: '4K@60Hz x2',
      power_delivery: '100W'
    }
  },
  {
    _id: 'LNB-P007',
    name: 'NVIDIA GeForce RTX 4050独立显卡',
    description: 'RTX 4050笔记本电脑独立显卡，6GB GDDR6显存，支持DLSS 3',
    category: '显卡',
    part_no: 'FRU 5B21B54765',
    part_id: 'LNB-P007',
    cost: 1199,
    supplier: 'NVIDIA',
    lifecycle: 'Active',
    specifications: {
      memory: '6GB GDDR6',
      cuda_cores: 2560,
      boost_clock: '2.3GHz',
      tdp: '45W',
      features: ['DLSS 3', 'Ray Tracing', 'NVENC']
    }
  },
  {
    _id: 'LNB-P008',
    name: 'ThinkPad 16GB DDR5内存模块',
    description: '16GB DDR5-5200MHz SO-DIMM内存模块，CL42时序，低电压设计',
    category: '内存',
    part_no: 'FRU 02DC693',
    part_id: 'LNB-P008',
    cost: 499,
    supplier: '三星半导体',
    lifecycle: 'Active',
    specifications: {
      capacity: '16GB',
      type: 'DDR5',
      speed: '5200MHz',
      form_factor: 'SO-DIMM',
      voltage: '1.1V',
      latency: 'CL42'
    }
  },
  {
    _id: 'LNB-P009',
    name: 'ThinkPad 1TB NVMe SSD',
    description: '1TB PCIe Gen4 x4 NVMe SSD，顺序读取速度高达7000MB/s',
    category: '存储设备',
    part_no: 'FRU 02DC871',
    part_id: 'LNB-P009',
    cost: 799,
    supplier: 'SK海力士',
    lifecycle: 'Active',
    specifications: {
      capacity: '1TB',
      interface: 'PCIe Gen4 x4',
      form_factor: 'M.2 2280',
      read_speed: '7000MB/s',
      write_speed: '6000MB/s',
      tbw: '600TB'
    }
  },
  {
    _id: 'LNB-P010',
    name: 'ThinkPad 智能指纹识别器',
    description: '集成式指纹识别模块，支持Windows Hello，防篡改设计',
    category: '生物识别',
    part_no: 'FRU 02DC677',
    part_id: 'LNB-P010',
    cost: 199,
    supplier: 'Goodix',
    lifecycle: 'Active',
    specifications: {
      technology: '电容式',
      resolution: '508dpi',
      security: 'FIDO2认证',
      interface: 'USB 2.0',
      features: ['Windows Hello', '防篡改']
    }
  },
  {
    _id: 'LNB-P011',
    name: 'ThinkPad Wi-Fi 6E无线网卡',
    description: 'Wi-Fi 6E (802.11ax)无线网卡，支持2.4GHz/5GHz/6GHz三频段，蓝牙5.3',
    category: '网络设备',
    part_no: 'FRU 02DC681',
    part_id: 'LNB-P011',
    cost: 299,
    supplier: 'Intel',
    lifecycle: 'Active',
    specifications: {
      standard: 'Wi-Fi 6E (802.11ax)',
      bands: ['2.4GHz', '5GHz', '6GHz'],
      max_speed: '2400Mbps',
      bluetooth: '5.3',
      interface: 'M.2 2230'
    }
  },
  {
    _id: 'LNB-P012',
    name: 'ThinkPad 高清摄像头模组',
    description: '1080p FHD高清摄像头，支持Windows Hello人脸识别，带隐私物理开关',
    category: '摄像头',
    part_no: 'FRU 02DC665',
    part_id: 'LNB-P012',
    cost: 249,
    supplier: 'Lite-On',
    lifecycle: 'Active',
    specifications: {
      resolution: '1080p (1920x1080)',
      frame_rate: '30fps',
      features: ['Windows Hello', '物理隐私开关', '自动对焦'],
      microphone: '双阵列麦克风',
      sensor: '2MP CMOS'
    }
  },
  {
    _id: 'LNB-P013',
    name: 'ThinkPad 65W USB-C电源适配器',
    description: '65W USB-C电源适配器，支持快速充电，兼容USB Power Delivery 3.0',
    category: '电源适配器',
    part_no: 'FRU 4X20V55775',
    part_id: 'LNB-P013',
    cost: 399,
    supplier: 'Delta Electronics',
    lifecycle: 'Active',
    specifications: {
      wattage: '65W',
      output: '20V/3.25A, 5V/3A, 9V/3A, 15V/3A',
      input: '100-240V ~ 50/60Hz',
      standards: ['USB PD 3.0', 'Energy Star'],
      connector: 'USB-C'
    }
  },
  {
    _id: 'LNB-P014',
    name: 'ThinkPad 散热模组',
    description: '双热管散热模组，搭配高效能风扇，支持智能温控系统',
    category: '散热系统',
    part_no: 'FRU 02DC849',
    part_id: 'LNB-P014',
    cost: 449,
    supplier: 'AVC',
    lifecycle: 'Active',
    specifications: {
      design: '双热管',
      fans: 1,
      material: '铜+铝',
      thermal_paste: '含银导热膏',
      features: ['智能温控', '静音设计']
    }
  },
  {
    _id: 'LNB-P015',
    name: 'ThinkPad USB-A接口扩展板',
    description: '提供2个USB 3.2 Gen1接口，支持5Gbps数据传输，向下兼容USB 2.0',
    category: '接口板',
    part_no: 'FRU 02DC689',
    part_id: 'LNB-P015',
    cost: 199,
    supplier: 'Foxconn',
    lifecycle: 'Active',
    specifications: {
      ports: '2x USB 3.2 Gen1',
      data_rate: '5Gbps',
      power_output: '5V/0.9A per port',
      compatibility: 'USB 2.0/1.1',
      controller: 'ASMedia ASM1042'
    }
  },
  {
    _id: 'LNB-P016',
    name: 'ThinkPad 音频子系统',
    description: '高品质立体声扬声器，支持Dolby Atmos音效，带麦克风阵列',
    category: '音频设备',
    part_no: 'FRU 02DC685',
    part_id: 'LNB-P016',
    cost: 299,
    supplier: 'Harman Kardon',
    lifecycle: 'Active',
    specifications: {
      speakers: '立体声2W x2',
      audio_technology: 'Dolby Atmos',
      microphones: '双阵列降噪麦克风',
      codec: 'Realtek ALC257',
      jack: '3.5mm耳机/麦克风二合一接口'
    }
  },
  {
    _id: 'LNB-P017',
    name: 'ThinkPad 镁铝合金上盖',
    description: '轻薄耐用的镁铝合金上盖，带碳纤维增强，防滚架设计',
    category: '外壳组件',
    part_no: 'FRU 02DC863',
    part_id: 'LNB-P017',
    cost: 699,
    supplier: 'CNC Manufacturing',
    lifecycle: 'Active',
    specifications: {
      material: '镁铝合金+碳纤维增强',
      color: '黑色',
      weight: '230g',
      features: ['防滚架', '防刮涂层'],
      dimensions: '312 x 221 x 8mm'
    }
  },
  {
    _id: 'LNB-P018',
    name: 'ThinkPad SD读卡器模块',
    description: '支持SD 4.0高速读卡器，最高读取速度312MB/s，支持UHS-II标准',
    category: '读卡器',
    part_no: 'FRU 02DC697',
    part_id: 'LNB-P018',
    cost: 149,
    supplier: 'Realtek',
    lifecycle: 'Active',
    specifications: {
      standard: 'SD 4.0 UHS-II',
      max_read_speed: '312MB/s',
      supported_cards: ['SD', 'SDHC', 'SDXC', 'MMC'],
      interface: 'PCIe',
      bus_width: '4-bit'
    }
  },
  {
    _id: 'LNB-P019',
    name: 'ThinkPad 触控板组件',
    description: '玻璃材质多点触控板，支持手势操作，带物理按键',
    category: '输入设备',
    part_no: 'FRU 02DC673',
    part_id: 'LNB-P019',
    cost: 299,
    supplier: 'Synaptics',
    lifecycle: 'Active',
    specifications: {
      material: '玻璃',
      touch_surface: '多点触控',
      buttons: '物理按键',
      features: ['手势支持', '精准追踪'],
      size: '115 x 75mm'
    }
  },
  {
    _id: 'LNB-P020',
    name: 'ThinkPad 电源管理模块',
    description: '智能电源管理电路，支持多种电源模式，电量保护功能',
    category: '电源管理',
    part_no: 'FRU 02DC873',
    part_id: 'LNB-P020',
    cost: 349,
    supplier: 'Texas Instruments',
    lifecycle: 'Active',
    specifications: {
      chipset: 'TI BQ25703A',
      features: ['快充支持', '电量保护', '温度监测'],
      supported_voltages: '5V-20V',
      power_states: ['高性能', '平衡', '省电']
    }
  }
];

export const fetchParts = async (params = {}) => {
  try {
    // 直接返回模拟数据，而不是调用API
    console.log('返回模拟零件数据:', mockPartsData.length, '个零件');
    return mockPartsData;
    
    // 注释掉API调用部分
    /*
    // Request all parts without pagination limit for dropdowns
    const requestParams = {
      ...params,
      limit: params.limit || 1000 // Set high limit to get all parts
    };
    
    const response = await api.get('/parts', { params: requestParams });
    
    console.log('fetchParts API response:', response.data);
    
    // Handle both paginated and non-paginated responses
    if (response.data.parts) {
      console.log('Returning response.data.parts:', response.data.parts.length, 'items');
      return response.data.parts;
    }
    console.log('Returning response.data directly');
    return response.data;
    */
  } catch (error) {
    console.error('fetchParts error:', error);
    // 发生错误时仍然返回模拟数据
    console.log('发生错误，返回模拟零件数据');
    return mockPartsData;
  }
};

export const fetchPartById = async (id) => {
  try {
    const response = await api.get(`/parts/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to fetch part');
  }
};

export const createPart = async (partData) => {
  try {
    const response = await api.post('/parts', partData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to create part');
  }
};

export const updatePart = async (id, partData) => {
  try {
    const response = await api.put(`/parts/${id}`, partData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to update part');
  }
};

export const deletePart = async (id) => {
  try {
    const response = await api.delete(`/parts/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete part');
  }
};

export const deleteParts = async (ids) => {
  try {
    const response = await api.post('/parts/batch-delete', { ids });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete parts');
  }
};



export const importParts = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/import/parts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to import parts');
  }
};

export const deleteAllParts = async () => {
  try {
    const response = await api.delete('/parts/all?confirm=true');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to delete all parts');
  }
};