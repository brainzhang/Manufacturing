// 7层BOM结构平台模板数据
// L1: 整机 -> L2: 大模块 -> L3: 子模块 -> L4: 零件族 -> L5: 零件组 -> L6: 主料 -> L7: 替代料
import { createBOMNode } from '../utils/bomHelpers';

// 生成平台模板
export const generatePlatformTemplate = (platformName = '笔记本电脑整机') => {
  // L1: 整机
  const rootNode = createBOMNode({
    level: 1,
    title: platformName,
    position: '1'
  });

  // L2: 模块层
  const motherboardModule = createBOMNode({
    level: 2,
    title: '主板模块',
    parentId: rootNode.id,
    position: '1.1'
  });

  const powerModule = createBOMNode({
    level: 2,
    title: '电源模块',
    parentId: rootNode.id,
    position: '1.2'
  });

  const displayModule = createBOMNode({
    level: 2,
    title: '显示模块',
    parentId: rootNode.id,
    position: '1.3'
  });

  const inputModule = createBOMNode({
    level: 2,
    title: '输入模块',
    parentId: rootNode.id,
    position: '1.4'
  });

  const storageModule = createBOMNode({
    level: 2,
    title: '存储模块',
    parentId: rootNode.id,
    position: '1.5'
  });

  const communicationModule = createBOMNode({
    level: 2,
    title: '通信模块',
    parentId: rootNode.id,
    position: '1.6'
  });

  const chassisModule = createBOMNode({
    level: 2,
    title: '机壳模块',
    parentId: rootNode.id,
    position: '1.7'
  });

  // ============ 主板模块 ============
  
  // L3: 子模块
  const cpuSubsystem = createBOMNode({
    level: 3,
    title: 'CPU子系统',
    parentId: motherboardModule.id,
    position: '1.1.1'
  });

  const memorySubsystem = createBOMNode({
    level: 3,
    title: '内存子系统',
    parentId: motherboardModule.id,
    position: '1.1.2'
  });

  const chipsetSubsystem = createBOMNode({
    level: 3,
    title: '芯片组子系统',
    parentId: motherboardModule.id,
    position: '1.1.3'
  });

  const ioSubsystem = createBOMNode({
    level: 3,
    title: 'I/O子系统',
    parentId: motherboardModule.id,
    position: '1.1.4'
  });

  // L4: CPU族
  const intelCpuFamily = createBOMNode({
    level: 4,
    title: 'Intel处理器族',
    parentId: cpuSubsystem.id,
    position: '1.1.1.1'
  });

  // L5: CPU组
  const coreUltraGroup = createBOMNode({
    level: 5,
    title: 'Core Ultra处理器组',
    parentId: intelCpuFamily.id,
    position: '1.1.1.1.1'
  });

  // L6: CPU主料
  const intelCoreUltra7 = createBOMNode({
    level: 6,
    title: 'Intel Core Ultra 7 155H',
    nodeType: '主料',
    partId: 'CPU-001',
    materialName: 'Intel Core Ultra 7 155H',
    parentId: coreUltraGroup.id,
    position: 'U1.A',
    quantity: 1,
    unit: '个',
    cost: 4500,
    supplier: 'Intel',
    variance: 0,
    lifecycle: '量产',
    status: 'Active'
  });

  // L7: CPU替代料
  const intelCoreUltra5 = createBOMNode({
    level: 7,
    title: 'Intel Core Ultra 5 135H',
    nodeType: '替代料',
    partId: 'CPU-002',
    materialName: 'Intel Core Ultra 5 135H',
    parentId: coreUltraGroup.id,
    position: 'U1.A.1',
    quantity: 1,
    unit: '个',
    cost: 3800,
    supplier: 'Intel',
    variance: -15.6,
    lifecycle: '量产',
    status: 'Active',
    substituteGroup: 'A'
  });

  const amdRyzen7 = createBOMNode({
    level: 7,
    title: 'AMD Ryzen 7 7840U',
    nodeType: '替代料',
    partId: 'CPU-003',
    materialName: 'AMD Ryzen 7 7840U',
    parentId: coreUltraGroup.id,
    position: 'U1.A.2',
    quantity: 1,
    unit: '个',
    cost: 4200,
    supplier: 'AMD',
    variance: -6.7,
    lifecycle: '量产',
    status: 'Active',
    substituteGroup: 'B'
  });

  // ============ 内存子系统 ============
  
  // L4: 内存族
  const ddr5Family = createBOMNode({
    level: 4,
    title: 'DDR5内存族',
    parentId: memorySubsystem.id,
    position: '1.1.2.1'
  });

  // L5: 内存组
  const lppdr5Group = createBOMNode({
    level: 5,
    title: 'LPDDR5X内存组',
    parentId: ddr5Family.id,
    position: '1.1.2.1.1'
  });

  // L6: 内存主料
  const samsung16GB = createBOMNode({
    level: 6,
    title: 'LPDDR5X 16GB',
    nodeType: '主料',
    partId: 'MEM-001',
    materialName: '三星 LPDDR5X 16GB内存条',
    parentId: lppdr5Group.id,
    position: 'M1.A',
    quantity: 2,
    unit: '条',
    cost: 800,
    supplier: '三星',
    variance: 0,
    lifecycle: '量产',
    status: 'Active'
  });

  // L7: 内存替代料
  const skHynix16GB = createBOMNode({
    level: 7,
    title: 'SK Hynix 16GB LPDDR5X',
    nodeType: '替代料',
    partId: 'MEM-002',
    materialName: 'SK海力士 LPDDR5X 16GB内存条',
    parentId: lppdr5Group.id,
    position: 'M1.A.1',
    quantity: 2,
    unit: '条',
    cost: 750,
    supplier: 'SK海力士',
    variance: -6.3,
    lifecycle: '量产',
    status: 'Active',
    substituteGroup: 'A'
  });

  const micron16GB = createBOMNode({
    level: 7,
    title: 'Micron 16GB LPDDR5X',
    nodeType: '替代料',
    partId: 'MEM-003',
    materialName: '美光 LPDDR5X 16GB内存条',
    parentId: lppdr5Group.id,
    position: 'M1.A.2',
    quantity: 2,
    unit: '条',
    cost: 780,
    supplier: '美光',
    variance: -2.5,
    lifecycle: '量产',
    status: 'Active',
    substituteGroup: 'B'
  });

  // ============ 存储模块 ============
  
  // L3: 存储子系统
  const ssdSubsystem = createBOMNode({
    level: 3,
    title: '固态硬盘子系统',
    parentId: storageModule.id,
    position: '1.5.1'
  });

  // L4: 固态硬盘族
  const nvmeFamily = createBOMNode({
    level: 4,
    title: 'NVMe固态硬盘族',
    parentId: ssdSubsystem.id,
    position: '1.5.1.1'
  });

  // L5: 固态硬盘组
  const nvmeGroup = createBOMNode({
    level: 5,
    title: 'M.2固态硬盘组',
    parentId: nvmeFamily.id,
    position: '1.5.1.1.1'
  });

  // L6: 硬盘主料
  const wdBlack2TB = createBOMNode({
    level: 6,
    title: 'WD Black SN850X 2TB',
    nodeType: '主料',
    partId: 'SSD-001',
    materialName: '西部数据 WD Black SN850X 2TB NVMe固态硬盘',
    parentId: nvmeGroup.id,
    position: 'S1.A',
    quantity: 1,
    unit: '块',
    cost: 1800,
    supplier: '西部数据',
    variance: 0,
    lifecycle: '量产',
    status: 'Active'
  });

  // L7: 硬盘替代料
  const samsung9802TB = createBOMNode({
    level: 7,
    title: 'Samsung 980 PRO 2TB',
    nodeType: '替代料',
    partId: 'SSD-002',
    materialName: '三星 980 PRO 2TB NVMe固态硬盘',
    parentId: nvmeGroup.id,
    position: 'S1.A.1',
    quantity: 1,
    unit: '块',
    cost: 1750,
    supplier: '三星',
    variance: -2.8,
    lifecycle: '量产',
    status: 'Active',
    substituteGroup: 'A'
  });

  const crucial2TB = createBOMNode({
    level: 7,
    title: 'Crucial P5 Plus 2TB',
    nodeType: '替代料',
    partId: 'SSD-003',
    materialName: '英睿达 P5 Plus 2TB NVMe固态硬盘',
    parentId: nvmeGroup.id,
    position: 'S1.A.2',
    quantity: 1,
    unit: '块',
    cost: 1600,
    supplier: '英睿达',
    variance: -11.1,
    lifecycle: '量产',
    status: 'Active',
    substituteGroup: 'B'
  });

  // ============ 显示模块 ============
  
  // L3: 显示子系统
  const lcdSubsystem = createBOMNode({
    level: 3,
    title: 'LCD显示子系统',
    parentId: displayModule.id,
    position: '1.3.1'
  });

  // L4: 显示屏族
  const lcdFamily = createBOMNode({
    level: 4,
    title: 'LCD显示屏族',
    parentId: lcdSubsystem.id,
    position: '1.3.1.1'
  });

  // L5: 显示屏组
  const ipsGroup = createBOMNode({
    level: 5,
    title: 'IPS显示屏组',
    parentId: lcdFamily.id,
    position: '1.3.1.1.1'
  });

  // L6: 显示屏主料
  const boe14Inch = createBOMNode({
    level: 6,
    title: 'BOE 14英寸 2.8K IPS屏',
    nodeType: '主料',
    partId: 'LCD-001',
    materialName: '京东方 14英寸 2.8K IPS显示屏',
    parentId: ipsGroup.id,
    position: 'L1.A',
    quantity: 1,
    unit: '块',
    cost: 1200,
    supplier: '京东方',
    variance: 0,
    lifecycle: '量产',
    status: 'Active'
  });

  // ============ 电源模块 ============
  
  // L3: 电源子系统
  const adapterSubsystem = createBOMNode({
    level: 3,
    title: '电源适配器子系统',
    parentId: powerModule.id,
    position: '1.2.1'
  });

  // L4: 电源适配器族
  const adapterFamily = createBOMNode({
    level: 4,
    title: '电源适配器族',
    parentId: adapterSubsystem.id,
    position: '1.2.1.1'
  });

  // L5: 电源适配器组
  const adapterGroup = createBOMNode({
    level: 5,
    title: '65W电源适配器组',
    parentId: adapterFamily.id,
    position: '1.2.1.1.1'
  });

  // L6: 电源适配器主料
  const lenovo65W = createBOMNode({
    level: 6,
    title: '联想 65W USB-C电源适配器',
    nodeType: '主料',
    partId: 'PWR-001',
    materialName: '联想 65W USB-C电源适配器',
    parentId: adapterGroup.id,
    position: 'P1.A',
    quantity: 1,
    unit: '个',
    cost: 250,
    supplier: '联想',
    variance: 0,
    lifecycle: '量产',
    status: 'Active'
  });

  // ============ 通信模块 ============
  
  // L3: 网络子系统
  const networkSubsystem = createBOMNode({
    level: 3,
    title: '网络子系统',
    parentId: communicationModule.id,
    position: '1.6.1'
  });

  // L4: 网卡族
  const wifiFamily = createBOMNode({
    level: 4,
    title: 'Wi-Fi网卡族',
    parentId: networkSubsystem.id,
    position: '1.6.1.1'
  });

  // L5: 网卡组
  const wifiGroup = createBOMNode({
    level: 5,
    title: 'Wi-Fi 6E网卡组',
    parentId: wifiFamily.id,
    position: '1.6.1.1.1'
  });

  // L6: 网卡主料
  const intelWifi = createBOMNode({
    level: 6,
    title: 'Intel Wi-Fi 6E AX211',
    nodeType: '主料',
    partId: 'NET-001',
    materialName: 'Intel Wi-Fi 6E AX211无线网卡',
    parentId: wifiGroup.id,
    position: 'N1.A',
    quantity: 1,
    unit: '个',
    cost: 150,
    supplier: 'Intel',
    variance: 0,
    lifecycle: '量产',
    status: 'Active'
  });

  // L7: 网卡替代料
  const qualcommWifi = createBOMNode({
    level: 7,
    title: 'Qualcomm Wi-Fi 6E QCNCM865',
    nodeType: '替代料',
    partId: 'NET-002',
    materialName: '高通 Wi-Fi 6E QCNCM865无线网卡',
    parentId: wifiGroup.id,
    position: 'N1.A.1',
    quantity: 1,
    unit: '个',
    cost: 140,
    supplier: '高通',
    variance: -6.7,
    lifecycle: '量产',
    status: 'Active',
    substituteGroup: 'A'
  });

  // ============ 输入模块 ============
  
  // L3: 键盘子系统
  const keyboardSubsystem = createBOMNode({
    level: 3,
    title: '键盘子系统',
    parentId: inputModule.id,
    position: '1.4.1'
  });

  // L4: 键盘族
  const keyboardFamily = createBOMNode({
    level: 4,
    title: '背光键盘族',
    parentId: keyboardSubsystem.id,
    position: '1.4.1.1'
  });

  // L5: 键盘组
  const keyboardGroup = createBOMNode({
    level: 5,
    title: '全尺寸背光键盘组',
    parentId: keyboardFamily.id,
    position: '1.4.1.1.1'
  });

  // L6: 键盘主料
  const lenovoKeyboard = createBOMNode({
    level: 6,
    title: '联想 ThinkPad背光键盘',
    nodeType: '主料',
    partId: 'KB-001',
    materialName: '联想 ThinkPad全尺寸背光键盘',
    parentId: keyboardGroup.id,
    position: 'K1.A',
    quantity: 1,
    unit: '个',
    cost: 280,
    supplier: '联想',
    variance: 0,
    lifecycle: '量产',
    status: 'Active'
  });

  // ============ 机壳模块 ============
  
  // L3: 机壳子系统
  const chassisSubsystem = createBOMNode({
    level: 3,
    title: '机壳子系统',
    parentId: chassisModule.id,
    position: '1.7.1'
  });

  // L4: 机壳族
  const chassisFamily = createBOMNode({
    level: 4,
    title: '铝合金机壳族',
    parentId: chassisSubsystem.id,
    position: '1.7.1.1'
  });

  // L5: 机壳组
  const chassisGroup = createBOMNode({
    level: 5,
    title: '碳纤维机壳组',
    parentId: chassisFamily.id,
    position: '1.7.1.1.1'
  });

  // L6: 机壳主料
  const carbonChassis = createBOMNode({
    level: 6,
    title: 'ThinkPad碳纤维机壳',
    nodeType: '主料',
    partId: 'CHS-001',
    materialName: '联想 ThinkPad碳纤维机壳',
    parentId: chassisGroup.id,
    position: 'C1.A',
    quantity: 1,
    unit: '套',
    cost: 800,
    supplier: '联想',
    variance: 0,
    lifecycle: '量产',
    status: 'Active'
  });

  // ============ 构建树结构 ============
  
  // CPU结构
  coreUltraGroup.children = [intelCoreUltra7, intelCoreUltra5, amdRyzen7];
  intelCpuFamily.children = [coreUltraGroup];
  cpuSubsystem.children = [intelCpuFamily];
  
  // 内存结构
  lppdr5Group.children = [samsung16GB, skHynix16GB, micron16GB];
  ddr5Family.children = [lppdr5Group];
  memorySubsystem.children = [ddr5Family];
  
  // 硬盘结构
  nvmeGroup.children = [wdBlack2TB, samsung9802TB, crucial2TB];
  nvmeFamily.children = [nvmeGroup];
  ssdSubsystem.children = [nvmeFamily];
  
  // 显示屏结构
  ipsGroup.children = [boe14Inch];
  lcdFamily.children = [ipsGroup];
  lcdSubsystem.children = [lcdFamily];
  
  // 电源结构
  adapterGroup.children = [lenovo65W];
  adapterFamily.children = [adapterGroup];
  adapterSubsystem.children = [adapterFamily];
  
  // 网络结构
  wifiGroup.children = [intelWifi, qualcommWifi];
  wifiFamily.children = [wifiGroup];
  networkSubsystem.children = [wifiFamily];
  
  // 键盘结构
  keyboardGroup.children = [lenovoKeyboard];
  keyboardFamily.children = [keyboardGroup];
  keyboardSubsystem.children = [keyboardFamily];
  
  // 机壳结构
  chassisGroup.children = [carbonChassis];
  chassisFamily.children = [chassisGroup];
  chassisSubsystem.children = [chassisFamily];
  
  // 模块结构
  motherboardModule.children = [cpuSubsystem, memorySubsystem, chipsetSubsystem, ioSubsystem];
  powerModule.children = [adapterSubsystem];
  displayModule.children = [lcdSubsystem];
  inputModule.children = [keyboardSubsystem];
  storageModule.children = [ssdSubsystem];
  communicationModule.children = [networkSubsystem];
  chassisModule.children = [chassisSubsystem];
  
  // 整机结构
  rootNode.children = [
    motherboardModule, 
    powerModule, 
    displayModule, 
    inputModule, 
    storageModule, 
    communicationModule, 
    chassisModule
  ];

  return [rootNode];
};

export default generatePlatformTemplate;