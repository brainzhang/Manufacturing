import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Button, 
  Tree, 
  Space, 
  Tag, 
  Tooltip,
  message,
  Input,
  Select,
  Alert,
  Statistic,
  Empty,
  Table,
  Drawer,
  List,
  Badge,
  Form,
  Card,
  Row,
  Col,
  Switch
} from 'antd';
import { 
  SwapOutlined,
  StopOutlined,
  PlayCircleOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  FileTextOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  DownOutlined,
  UpOutlined,
  SearchOutlined
} from '@ant-design/icons';

import { BOM_LEVELS } from '../constants/bomConstants';
import { getAlternativeParts } from '../utils/aiUtils';
import { bom7LayerTemplate } from './bom7LayerTemplate';

const { Option } = Select;
const { TreeNode } = Tree;
const { TextArea } = Input;

// 全局计数器，确保节点ID的唯一性
let nodeCounter = 0;

// 生成唯一ID的辅助函数
const generateUniqueId = () => {
  const timestamp = Date.now();
  nodeCounter++;
  const randomStr = Math.random().toString(36).substr(2, 9);
  const extraRandom = Math.floor(Math.random() * 10000);
  return `node-${timestamp}-${nodeCounter}-${randomStr}-${extraRandom}`;
};

// 检查重复key的辅助函数
const detectDuplicateKeys = (treeData, operationName = 'unknown') => {
  const keyMap = new Map();
  let hasDuplicates = false;
  
  const traverse = (nodes, path = '') => {
    nodes.forEach((node, index) => {
      const currentPath = path ? `${path}.${index}` : `[${index}]`;
      
      if (keyMap.has(node.key)) {
        console.warn(`🔴 重复key检测: 在操作 '${operationName}' 中发现重复的key '${node.key}'!`);
        console.warn(`   - 第一个节点路径: ${keyMap.get(node.key)}`);
        console.warn(`   - 重复节点路径: ${currentPath}`);
        hasDuplicates = true;
      } else {
        keyMap.set(node.key, currentPath);
      }
      
      if (node.children && node.children.length > 0) {
        traverse(node.children, `${currentPath}.children`);
      }
    });
  };
  
  traverse(Array.isArray(treeData) ? treeData : [treeData]);
  
  if (hasDuplicates) {
    console.warn(`⚠️  总共发现 ${keyMap.size} 个唯一key，但存在重复`);
  } else if (process.env.NODE_ENV === 'development') {
    console.log(`✅ 重复key检测: 在操作 '${operationName}' 中未发现重复key，总节点数: ${keyMap.size}`);
  }
  
  return !hasDuplicates;
};

// BOM节点数据模型
const createBOMNode = (config) => {
  // 使用增强的唯一ID生成函数
  const nodeId = config.id || generateUniqueId();

  return {
    id: nodeId,
    key: config.key || nodeId, // 添加key属性并与id保持一致
    parentId: config.parentId || null,
    level: config.level,
    position: config.position || '',
    nodeType: config.nodeType || (config.level === 6 ? '主料' : config.level === 7 ? '替代料' : '父'),
    partId: config.partId,
    partName: config.partName || '',
    quantity: config.quantity || 1,
    unit: config.unit || '个',
    cost: config.cost || 0,
    supplier: config.supplier || '',
    variance: config.variance || 0,
    lifecycle: config.lifecycle || 'Active',
    itemStatus: config.itemStatus || 'Active',
    substituteGroup: config.substituteGroup,
    children: config.children || [],
    title: config.title || `层级${config.level}节点`
  };
};
// 位号生成规则
const generatePosition = (level, parentPosition = '', index = 1, isAlternative = false) => {
  const levelPrefixes = {
    [BOM_LEVELS.L1.level]: 'M', // 整机 (Machine)
    [BOM_LEVELS.L2.level]: 'U', // 模块 (Unit)
    [BOM_LEVELS.L3.level]: 'S', // 子模块 (Submodule)
    [BOM_LEVELS.L4.level]: 'F', // 族 (Family)
    [BOM_LEVELS.L5.level]: 'G', // 组 (Group)
    [BOM_LEVELS.L6.level]: 'P', // 主料 (Primary Part)
    [BOM_LEVELS.L7.level]: 'A'  // 替代料 (Alternative Part)
  };
  
  const prefix = levelPrefixes[level];
  
  // L1层级处理
  if (level === BOM_LEVELS.L1.level) {
    return `${prefix}${index}`;
  }
  
  // L6/L7层级处理 - 适应非严格层级结构
  if (level >= BOM_LEVELS.L6.level) {
    if (parentPosition) {
      if (level === BOM_LEVELS.L6.level) {
        // 对于L6节点，无论父节点层级如何，都使用统一格式
        // 检查父节点位号是否已经包含.L6的标识
        if (parentPosition.includes('.P')) {
          // 如果已有.P，则提取序号并递增
          const match = parentPosition.match(/\.P(\d+)$/);
          if (match) {
            const currentIndex = parseInt(match[1]) + 1;
            return parentPosition.replace(/\.P\d+$/, `.P${currentIndex}`);
          }
        }
        // 标准情况，直接添加.P+序号
        return `${parentPosition}.P${index}`;
      } else if (level === BOM_LEVELS.L7.level) {
        // 替代料使用字母标识：A, B, C...
        const altChar = String.fromCharCode(65 + index - 1); // A, B, C...
        return `${parentPosition}.${altChar}`;
      }
    }
    return `${prefix}${index}`;
  }
  
  // L2-L5层级处理 - 支持多个同级节点
  if (parentPosition) {
    // 检查父节点下是否已有同层级的节点
    const parentParts = parentPosition.split('.');
    const lastPart = parentParts[parentParts.length - 1];
    
    // 如果父节点已经有同层级的子节点，使用正确的序号递增
    if (lastPart.startsWith(prefix)) {
      // 提取现有序号并递增
      const existingIndex = parseInt(lastPart.substring(1)) || 1;
      return parentPosition.replace(new RegExp(`${prefix}\d+$`), `${prefix}${existingIndex + 1}`);
    }
    
    // 正常情况，添加新的层级标识
    return `${parentPosition}.${prefix}${index}`;
  }
  
  return `${prefix}${index}`;
};

// 生成默认BOM模板
const generateDefaultTemplate = () => {
  const rootNode = createBOMNode({
    level: 1,
    title: '笔记本电脑整机',
    position: generatePosition(1)
  });

  // L2: 模块层 - 结构模块
  const module1 = createBOMNode({
    level: 2,
    title: '结构模块',
    parentId: rootNode.id,
    position: generatePosition(2, rootNode.position, 1)
  });

  // L2: 模块层 - 主板模块
  const module2 = createBOMNode({
    level: 2,
    title: '主板模块',
    parentId: rootNode.id,
    position: generatePosition(2, rootNode.position, 2)
  });

  // L2: 模块层 - 电源模块
  const module3 = createBOMNode({
    level: 2,
    title: '电源模块',
    parentId: rootNode.id,
    position: generatePosition(2, rootNode.position, 3)
  });

  // L2: 模块层 - 存储模块
  const module4 = createBOMNode({
    level: 2,
    title: '存储模块',
    parentId: rootNode.id,
    position: generatePosition(2, rootNode.position, 4)
  });

  // L2: 模块层 - 显示模块
  const module5 = createBOMNode({
    level: 2,
    title: '显示模块',
    parentId: rootNode.id,
    position: generatePosition(2, rootNode.position, 5)
  });

  // L2: 模块层 - 散热模块
  const module6 = createBOMNode({
    level: 2,
    title: '散热模块',
    parentId: rootNode.id,
    position: generatePosition(2, rootNode.position, 6)
  });

  // L2: 模块层 - 通讯模块
  const module7 = createBOMNode({
    level: 2,
    title: '通讯模块',
    parentId: rootNode.id,
    position: generatePosition(2, rootNode.position, 7)
  });

  // L2: 模块层 - 接口模块
  const module8 = createBOMNode({
    level: 2,
    title: '接口模块',
    parentId: rootNode.id,
    position: generatePosition(2, rootNode.position, 8)
  });

  // L3: 子模块层 - 机壳子系统
  const subModule1 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: '机壳子系统',
    parentId: module1.id,
    position: generatePosition(BOM_LEVELS.L3.level, module1.position, 1)
  });

  // L3: 子模块层 - CPU子系统
  const subModule2 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: 'CPU子系统',
    parentId: module2.id,
    position: generatePosition(BOM_LEVELS.L3.level, module2.position, 1)
  });

  // L3: 子模块层 - 内存子系统
  const subModule3 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: '内存子系统',
    parentId: module2.id,
    position: generatePosition(BOM_LEVELS.L3.level, module2.position, 2)
  });

  // L3: 子模块层 - 存储子系统
  const subModule4 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: '存储子系统',
    parentId: module4.id,
    position: generatePosition(BOM_LEVELS.L3.level, module4.position, 1)
  });

  // L3: 子模块层 - 显卡子系统
  const subModule5 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: '显卡子系统',
    parentId: module2.id,
    position: generatePosition(BOM_LEVELS.L3.level, module2.position, 3)
  });

  // L3: 子模块层 - 网卡子系统
  const subModule6 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: '网络子系统',
    parentId: module7.id,
    position: generatePosition(BOM_LEVELS.L3.level, module7.position, 1)
  });

  // L3: 子模块层 - 散热子系统
  const subModule7 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: '散热子系统',
    parentId: module6.id,
    position: generatePosition(BOM_LEVELS.L3.level, module6.position, 1)
  });

  // L3: 子模块层 - 接口子系统
  const subModule8 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: '接口子系统',
    parentId: module8.id,
    position: generatePosition(BOM_LEVELS.L3.level, module8.position, 1)
  });

  // L3: 子模块层 - 屏幕子系统
  const subModule9 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: '屏幕子系统',
    parentId: module5.id,
    position: generatePosition(BOM_LEVELS.L3.level, module5.position, 1)
  });

  // L3: 子模块层 - 键盘子系统
  const subModule10 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: '键盘子系统',
    parentId: module8.id,
    position: generatePosition(BOM_LEVELS.L3.level, module8.position, 2)
  });

  // L3: 子模块层 - 触摸板子系统
  const subModule11 = createBOMNode({
    level: BOM_LEVELS.L3.level,
    title: '触摸板子系统',
    parentId: module8.id,
    position: generatePosition(BOM_LEVELS.L3.level, module8.position, 3)
  });

  // L4: 族层 - 机壳族
  const caseFamily = createBOMNode({
    level: 4,
    title: '铝合金机壳族',
    parentId: subModule1.id,
    position: generatePosition(4, subModule1.position, 1)
  });

  // L4: 族层 - CPU族
  const cpuFamily = createBOMNode({
    level: 4,
    title: 'Intel处理器族',
    parentId: subModule2.id,
    position: generatePosition(4, subModule2.position, 1)
  });

  // L4: 族层 - 内存族
  const memoryFamily = createBOMNode({
    level: 4,
    title: 'DDR5内存族',
    parentId: subModule3.id,
    position: generatePosition(4, subModule3.position, 1)
  });
  
  // 构建完整的BOM树结构
  const buildTree = (parent, children) => {
    return {
      ...parent,
      children: children.map(child => {
        if (child.children && child.children.length > 0) {
          return buildTree(child, child.children);
        }
        return child;
      })
    };
  };

  // L4: 族层 - 硬盘族
  const storageFamily = createBOMNode({
    level: 4,
    title: 'NVMe SSD族',
    parentId: subModule4.id,
    position: generatePosition(4, subModule4.position, 1)
  });

  // L4: 族层 - 显卡族
  const gpuFamily = createBOMNode({
    level: 4,
    title: 'NVIDIA显卡族',
    parentId: subModule5.id,
    position: generatePosition(4, subModule5.position, 1)
  });

  // L4: 族层 - 网卡族
  const networkFamily = createBOMNode({
    level: 4,
    title: 'Intel网卡族',
    parentId: subModule6.id,
    position: generatePosition(4, subModule6.position, 1)
  });

  // L4: 族层 - 散热族
  const coolingFamily = createBOMNode({
    level: 4,
    title: '热管散热器族',
    parentId: subModule7.id,
    position: generatePosition(4, subModule7.position, 1)
  });

  // L4: 族层 - 接口族
  const interfaceFamily = createBOMNode({
    level: 4,
    title: 'USB-C接口族',
    parentId: subModule8.id,
    position: generatePosition(4, subModule8.position, 1)
  });

  // L4: 族层 - 屏幕族
  const screenFamily = createBOMNode({
    level: 4,
    title: 'IPS屏幕族',
    parentId: subModule9.id,
    position: generatePosition(4, subModule9.position, 1)
  });

  // L4: 族层 - 键盘族
  const keyboardFamily = createBOMNode({
    level: 4,
    title: '背光键盘族',
    parentId: subModule10.id,
    position: generatePosition(4, subModule10.position, 1)
  });

  // L4: 族层 - 触摸板族
  const touchpadFamily = createBOMNode({
    level: 4,
    title: '多点触控板族',
    parentId: subModule11.id,
    position: generatePosition(4, subModule11.position, 1)
  });

  // L5: 组层 - 机壳组
  const caseGroup = createBOMNode({
    level: 5,
    title: '14英寸铝合金机壳组',
    parentId: caseFamily.id,
    position: generatePosition(5, caseFamily.position, 1)
  });

  // L5: 组层 - CPU组
  const cpuGroup = createBOMNode({
    level: 5,
    title: 'Core Ultra处理器组',
    parentId: cpuFamily.id,
    position: generatePosition(5, cpuFamily.position, 1)
  });

  // L5: 组层 - 内存组
  const memoryGroup = createBOMNode({
    level: 5,
    title: '16GB DDR5组',
    parentId: memoryFamily.id,
    position: generatePosition(5, memoryFamily.position, 1)
  });

  // L5: 组层 - 存储组
  const storageGroup = createBOMNode({
    level: 5,
    title: '1TB NVMe SSD组',
    parentId: storageFamily.id,
    position: generatePosition(5, storageFamily.position, 1)
  });

  // L5: 组层 - 显卡组
  const gpuGroup = createBOMNode({
    level: 5,
    title: 'RTX 4060显卡组',
    parentId: gpuFamily.id,
    position: generatePosition(5, gpuFamily.position, 1)
  });

  // L5: 组层 - 网卡组
  const networkGroup = createBOMNode({
    level: 5,
    title: 'WiFi 6E网卡组',
    parentId: networkFamily.id,
    position: generatePosition(5, networkFamily.position, 1)
  });

  // L5: 组层 - 散热组
  const coolingGroup = createBOMNode({
    level: 5,
    title: '双热管散热组',
    parentId: coolingFamily.id,
    position: generatePosition(5, coolingFamily.position, 1)
  });

  // L5: 组层 - 接口组
  const interfaceGroup = createBOMNode({
    level: 5,
    title: '雷电4接口组',
    parentId: interfaceFamily.id,
    position: generatePosition(5, interfaceFamily.position, 1)
  });

  // L5: 组层 - 屏幕组
  const screenGroup = createBOMNode({
    level: 5,
    title: '14英寸2.5K屏幕组',
    parentId: screenFamily.id,
    position: generatePosition(5, screenFamily.position, 1)
  });

  // L5: 组层 - 键盘组
  const keyboardGroup = createBOMNode({
    level: 5,
    title: 'RGB背光键盘组',
    parentId: keyboardFamily.id,
    position: generatePosition(5, keyboardFamily.position, 1)
  });

  // L5: 组层 - 触摸板组
  const touchpadGroup = createBOMNode({
    level: 5,
    title: '玻璃触控板组',
    parentId: touchpadFamily.id,
    position: generatePosition(5, touchpadFamily.position, 1)
  });

  // L6: 主料层 - 机壳主料
  const caseMain = createBOMNode({
    level: 6,
    title: '镁合金机身外壳',
    nodeType: '主料',
    partId: 'CHASSIS-MAG',
    partName: '镁合金机身外壳',
    parentId: caseGroup.id,
    position: generatePosition(6, caseGroup.position, 1),
    quantity: 1,
    unit: '个',
    cost: 699,  // 正确成本¥699
    supplier: 'Foxconn',
    variance: 0,
    lifecycle: 'Active',
    itemStatus: 'Active'
  });

  // L6: 主料层 - CPU主料
  const cpuMain = createBOMNode({
    level: 6,
    title: 'Intel Core i5-1345U处理器',
    nodeType: '主料',
    partId: 'CPU-I5-1345U',
    partName: 'Intel Core i5-1345U处理器',
    parentId: cpuGroup.id,
    position: generatePosition(6, cpuGroup.position, 1),
    quantity: 1,
    unit: '个',
    cost: 1899,  // 正确成本¥1,899
    supplier: 'Intel Corporation',
    variance: 0,
    lifecycle: 'Active',
    itemStatus: 'Active'
  });

  // L6: 主料层 - 内存主料
  const memoryMain = createBOMNode({
    level: 6,
    title: '16GB DDR5 4800MHz内存',
    nodeType: '主料',
    partId: 'RAM-16GB-DDR5',
    partName: '16GB DDR5 4800MHz内存',
    parentId: memoryGroup.id,
    position: generatePosition(6, memoryGroup.position, 1),
    quantity: 1,
    unit: '条',
    cost: 499,  // 正确成本¥499
    supplier: 'Samsung Electronics',
    variance: 0,
    lifecycle: 'Active',
    itemStatus: 'Active'
  });

  // L6: 主料层 - 硬盘主料
  const storageMain = createBOMNode({
    level: 6,
    title: '512GB NVMe SSD固态硬盘',
    nodeType: '主料',
    partId: 'SSD-512GB-NVMe',
    partName: '512GB NVMe SSD固态硬盘',
    parentId: storageGroup.id,
    position: generatePosition(6, storageGroup.position, 1),
    quantity: 1,
    unit: '个',
    cost: 299,  // 正确成本¥299
    supplier: 'Western Digital',
    variance: 0,
    lifecycle: 'Active',
    itemStatus: 'Active'
  });

  // L6: 主料层 - 显卡主料
  const gpuMain = createBOMNode({
    level: 6,
    title: 'NVIDIA RTX 4060',
    nodeType: '主料',
    partId: 'GPU-001',
    partName: 'NVIDIA GeForce RTX 4060 8GB',
    parentId: gpuGroup.id,
    position: generatePosition(6, gpuGroup.position, 1),
    quantity: 1,
    unit: '个',
    cost: 3200,
    supplier: 'NVIDIA Corporation',
    variance: 0,
    lifecycle: 'Active',
    itemStatus: 'Active'  // 修改为激活状态，操作按钮为弃用
  });

  // L6: 主料层 - 网卡主料
  const networkMain = createBOMNode({
    level: 6,
    title: 'Intel Wi-Fi 6E AX211',
    nodeType: '主料',
    partId: 'WIFI-6E',
    partName: 'Intel Wi-Fi 6E AX211',
    parentId: networkGroup.id,
    position: generatePosition(6, networkGroup.position, 1),
    quantity: 1,
    unit: '个',
    cost: 99,  // 正确成本¥99
    supplier: 'Intel Corporation',
    variance: 0,
    lifecycle: 'Active',
    itemStatus: 'Active'
  });

  // L6: 主料层 - 散热器主料
  const coolingMain = createBOMNode({
    level: 6,
    title: '双热管散热器',
    nodeType: '主料',
    partId: 'COOL-001',
    partName: '双热管CPU散热器',
    parentId: coolingGroup.id,
    position: generatePosition(6, coolingGroup.position, 1),
    quantity: 1,
    unit: '个',
    cost: 350,
    supplier: 'Cooler Master',
    variance: 0,
    lifecycle: 'Active',
    itemStatus: 'Active'  // 修改为激活状态，操作按钮为弃用
  });

  // L6: 主料层 - 接口主料
  const interfaceMain = createBOMNode({
    level: 6,
    title: '雷电4接口',
    nodeType: '主料',
    partId: 'IFACE-001',
    partName: '雷电4 Type-C接口',
    parentId: interfaceGroup.id,
    position: generatePosition(6, interfaceGroup.position, 1),
    quantity: 2,
    unit: '个',
    cost: 200,
    supplier: 'Intel Corporation',
    variance: 0,
    lifecycle: 'Active',
    itemStatus: 'Active'  // 修改为激活状态，操作按钮为弃用
  });

  // L6: 主料层 - 屏幕主料
  const screenMain = createBOMNode({
    level: 6,
    title: '14英寸FHD IPS显示屏',
    nodeType: '主料',
    partId: 'LCD-14IN-FHD',
    partName: '14英寸FHD IPS显示屏',
    parentId: screenGroup.id,
    position: generatePosition(6, screenGroup.position, 1),
    quantity: 1,
    unit: '个',
    cost: 799,  // 正确成本¥799
    supplier: 'LG Display',
    variance: 0,
    lifecycle: 'Active',
    itemStatus: 'Active'
  });

  // L6: 主料层 - 键盘主料
  const keyboardMain = createBOMNode({
    level: 6,
    title: '背光键盘',
    nodeType: '主料',
    partId: 'KEYBOARD-BACKLIT',
    partName: '背光键盘',
    parentId: keyboardGroup.id,
    position: generatePosition(6, keyboardGroup.position, 1),
    quantity: 1,
    unit: '个',
    cost: 199,  // 正确成本¥199
    supplier: 'Logitech',
    variance: 0,
    lifecycle: 'Active',
    itemStatus: 'Active'
  });

  // L6: 主料层 - 触摸板主料（您提供的正确L6主料零件中没有触摸板，移除此零件）
  // 原触摸板零件已移除，因为正确L6主料零件清单中不包含触摸板

  // L7: 替代料层 - 机壳替代料
  const caseAlternative = createBOMNode({
    level: 7,
    title: '14英寸碳纤维机壳',
    nodeType: '替代料',
    partId: 'CASE-002',
    parentId: caseMain.key,  // 修正：L7替代料的parentId应指向对应的L6主料的key，不是id
    position: generatePosition(7, caseMain.position, 1, true),
    quantity: 1,
    cost: 1500,
    lifecycle: 'Active',
    itemStatus: 'Inactive',  // 修改为Inactive状态，初始不可编辑
    substituteGroup: 'A'
  });

  // L7: 替代料层 - CPU替代料（只保留一个，移除多余的AMD Ryzen 7 7840U）
  const cpuAlternative1 = createBOMNode({
    level: 7,
    title: 'Intel Core Ultra 5 135H',
    nodeType: '替代料',
    partId: 'CPU-002',
    parentId: cpuMain.key,  // 修正：L7替代料的parentId应指向对应的L6主料的key
    position: generatePosition(7, cpuMain.position, 1, true),
    quantity: 1,
    cost: 3800,
    lifecycle: 'Active',
    itemStatus: 'Inactive',  // 修改为Inactive状态，初始不可编辑
    substituteGroup: 'A'
  });

  // L7: 替代料层 - 内存替代料
  const memoryAlternative = createBOMNode({
    level: 7,
    title: '16GB DDR5 5200MHz',
    nodeType: '替代料',
    partId: 'MEM-002',
    parentId: memoryMain.key,  // 修正：L7替代料的parentId应指向对应的L6主料的key
    position: generatePosition(7, memoryMain.position, 1, true),
    quantity: 2,
    cost: 850,
    lifecycle: 'Active',
    itemStatus: 'Inactive',  // 修改为Inactive状态，初始不可编辑
    substituteGroup: 'A'
  });

  // L7: 替代料层 - 硬盘替代料
  const storageAlternative = createBOMNode({
    level: 7,
    title: '1TB NVMe PCIe 3.0',
    nodeType: '替代料',
    partId: 'SSD-002',
    parentId: storageMain.key,  // 修正：L7替代料的parentId应指向对应的L6主料的key
    position: generatePosition(7, storageMain.position, 1, true),
    quantity: 1,
    cost: 550,
    lifecycle: 'Active',
    itemStatus: 'Inactive',  // 修改为Inactive状态，初始不可编辑
    substituteGroup: 'A'
  });

  // L7: 替代料层 - 散热器替代料
  const coolingAlternative = createBOMNode({
    level: 7,
    title: '三热管散热器',
    nodeType: '替代料',
    partId: 'COOL-002',
    parentId: coolingMain.key,  // 修正：L7替代料的parentId应指向对应的L6主料的key
    position: generatePosition(7, coolingMain.position, 1, true),
    quantity: 1,
    cost: 420,
    lifecycle: 'Active',
    itemStatus: 'Inactive',  // 修改为Inactive状态，初始不可编辑
    substituteGroup: 'A'
  });

  // 构建树结构
  caseGroup.children = [caseMain, caseAlternative];
  cpuGroup.children = [cpuMain, cpuAlternative1];  // 移除cpuAlternative2，只保留一个CPU替代料
  memoryGroup.children = [memoryMain, memoryAlternative];
  storageGroup.children = [storageMain, storageAlternative];
  gpuGroup.children = [gpuMain];
  networkGroup.children = [networkMain];
  coolingGroup.children = [coolingMain, coolingAlternative];
  interfaceGroup.children = [interfaceMain];
  screenGroup.children = [screenMain];
  keyboardGroup.children = [keyboardMain];
  // 触摸板零件已移除，因为正确L6主料零件清单中不包含触摸板

  caseFamily.children = [caseGroup];
  cpuFamily.children = [cpuGroup];
  memoryFamily.children = [memoryGroup];
  storageFamily.children = [storageGroup];
  gpuFamily.children = [gpuGroup];
  networkFamily.children = [networkGroup];
  coolingFamily.children = [coolingGroup];
  interfaceFamily.children = [interfaceGroup];
  screenFamily.children = [screenGroup];
  keyboardFamily.children = [keyboardGroup];
  // 触摸板家族已移除

  subModule1.children = [caseFamily];
  subModule2.children = [cpuFamily];
  subModule3.children = [memoryFamily];
  subModule4.children = [storageFamily];
  subModule5.children = [gpuFamily];
  subModule6.children = [networkFamily];
  subModule7.children = [coolingFamily];
  subModule8.children = [interfaceFamily];
  subModule9.children = [screenFamily];
  subModule10.children = [keyboardFamily];
  // subModule11已移除，触摸板家族不再存在

  module1.children = [subModule1];
  module2.children = [subModule2, subModule3, subModule5];
  module4.children = [subModule4];
  module5.children = [subModule9];
  module6.children = [subModule7];
  module7.children = [subModule6];
  module8.children = [subModule8, subModule10];

  rootNode.children = [module1, module2, module3, module4, module5, module6, module7, module8];

  return [rootNode];
};



// 获取零件列表（仅L6/L7层）
const getPartsList = (treeData) => {
  const parts = [];
  
  const traverse = (nodes) => {
    nodes.forEach(node => {
      if (node.level >= 6) { // 直接使用数字而不是BOM_LEVELS常量，避免依赖
        parts.push({
          key: node.key,
          position: node.position,
          partName: node.partName || node.title,
          quantity: node.quantity,
          unit: node.unit,
          cost: node.cost,
          supplier: node.supplier,
          variance: node.variance,
          lifecycle: node.lifecycle,
          itemStatus: node.itemStatus,
          level: node.level,
          nodeType: node.nodeType,
          parentId: node.parentId  // 添加parentId字段，用于L7替代料关联L6主料
        });
      }
      
      if (node.children) {
        traverse(node.children);
      }
    });
  };
  
  traverse(treeData);
  // 移除调试日志，减少控制台输出
  return parts;
}

// 计算BOM零件列表的总成本（与BOM树结构逻辑一致）
const calculatePartsListCost = (parts) => {
  // 检查parts是否存在且为数组
  if (!parts || !Array.isArray(parts)) {
    return 0;
  }
  
  // 检查是否有激活的L7替代料 - 使用数字常量而非BOM_LEVELS
  const hasActiveAlternative = parts.some(part => part.level === 7 && part.itemStatus === 'Active');
  
  let totalCost = 0;
  
  if (hasActiveAlternative) {
    // 有激活的L7替代料，只计算激活的L7替代料成本
    parts.forEach(part => {
      if (part.level === 7 && part.itemStatus === 'Active') {
        totalCost += (part.cost || 0) * (part.quantity || 1);
      }
    });
  } else {
    // 没有激活的L7替代料，计算激活的L6主料成本
    parts.forEach(part => {
      if (part.level === 6 && part.itemStatus === 'Active') {
        totalCost += (part.cost || 0) * (part.quantity || 1);
      }
    });
  }
  
  return totalCost;
};

// 表格列定义已移至组件内部作为tableColumns

// BOM操作组件
const BOMStructureNew = ({ 
  form: externalForm, 
  currentStep, 
  onStepChange, 
  initialData = null,
  onStructureChange,
  addLog,
  productModel = null
}) => {

  

  
  const [bomTreeData, setBomTreeDataState] = useState([]);

// 设置BOM树数据
const setBomTreeData = (data) => {
  setBomTreeDataState(data);
  // 触发重新渲染和统计信息更新
  setTimeout(() => {
    if (onStructureChange) {
      onStructureChange(data);
    }
  }, 100);
};
  
  // 防抖定时器引用
  const debounceTimerRef = useRef(null);
  
  // 统一的防抖函数
  const debounce = useCallback((callback, delay = 300) => {
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // 设置新的定时器
    debounceTimerRef.current = setTimeout(() => {
      callback();
      debounceTimerRef.current = null;
    }, delay);
  }, []);

  // 表格列配置 - 移到组件内部以正确访问组件状态
  const tableColumns = [
    {
      title: '位号',
      dataIndex: 'position',
      key: 'position',
      width: 120,
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level) => {
        return `层级${level}`;
      },
    },
    {
      title: '零件名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => {
        // 确保显示正确的零件名称，优先使用partName，然后是title
        return record.partName || text || '未命名零件';
      },
    },
    {
      title: '零件ID',
      dataIndex: 'partId',
      key: 'partId',
      width: 150,
      render: (text, record) => {
        // 确保显示正确的零件ID
        return text || record.key || 'N/A';
      },
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      width: 100,
      render: (cost) => typeof cost === 'number' ? `¥${cost.toFixed(2)}` : 'N/A',
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 120,
      render: (text) => text || '未指定',
    },
    {
      title: '差异',
      dataIndex: 'variance',
      key: 'variance',
      width: 80,
      render: (variance) => {
        if (typeof variance !== 'number') return 'N/A';
        const color = variance > 0 ? 'red' : variance < 0 ? 'green' : 'default';
        return <span style={{ color }}>{variance > 0 ? '+' : ''}{variance}%</span>;
      },
    },
    {
      title: '生命周期',
      dataIndex: 'lifecycle',
      key: 'lifecycle',
      width: 100,
      render: (text) => {
        const colors = {
          'Active': 'green',
          'Inactive': 'gray',
          'Deprecated': 'red',
          'Obsolete': 'red',
          'New': 'blue',
        };
        return <Tag color={colors[text] || 'default'}>{text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'itemStatus',
      key: 'itemStatus',
      width: 100,
      render: (text) => {
        const colors = {
          'Active': 'green',
          'Inactive': 'orange',
          'Deprecated': 'red',
          'Obsolete': 'darkred',
        };
        const labels = {
          'Active': '激活',
          'Inactive': '未激活',
          'Deprecated': '已弃用',
          'Obsolete': '已淘汰',
        };
        return <Tag color={colors[text] || 'default'}>{labels[text] || text}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => {
        const isAlternative = record.level === 7;
        const isL6 = record.level === 6;
        const isDeprecated = record.itemStatus === 'Deprecated';
        const isInactive = record.itemStatus === 'Inactive';
            
        // 检查同一L6主料下是否有已激活的L7替代料
        // 使用partsList来查找，而不是从bomTreeData中查找
        const hasActiveL7Alternative = (() => {
          if (isAlternative) return false; // L7替代料不需要检查
          if (!isL6) return false; // 非L6节点不需要检查
          
          // 在partsList中查找对应的L6主料的L7替代料
          const l7Alternatives = partsList.filter(p => 
            p.parentId === record.key && 
            p.level === 7 && 
            p.itemStatus === 'Active'
          );
          
          return l7Alternatives.length > 0;
        })();
            
        // 检查L6主料是否被弃用或未激活
        const isL6Deactivated = isL6 && (isDeprecated || isInactive);
        
        // 检查L7替代料是否可以替换主料
        const canL7Replace = isAlternative && (() => {
          // 使用record中的parentId来查找对应的L6主料节点
          // 在partsList中查找对应的L6主料
          const l6Parent = partsList.find(p => p.key === record.parentId && p.level === 6);
          
          // 如果找到L6父节点且该节点被弃用或未激活，则L7替代料可以替换
          return l6Parent && (l6Parent.itemStatus === 'Deprecated' || l6Parent.itemStatus === 'Inactive');
        })();
        
        return (
          <Space size="small">
            {/* L7替代料：不显示替换按钮，保持与树形结构操作一致 */}
            
            {/* L6主料：弃用/启用按钮 */}
            {!isAlternative && (
              <Button 
                type="link" 
                size="small" 
                icon={isDeprecated || isInactive ? <CheckCircleOutlined /> : <StopOutlined />}
                onClick={(e) => {
                  console.log('L6主料启用/弃用按钮被点击，record:', record);
                  e.stopPropagation();
                  // 如果是L6主料且处于Inactive或Deprecated状态，使用handleEnable函数
                  if (isL6 && (isInactive || isDeprecated)) {
                    handleEnable(record);
                  } else {
                    // 其他情况使用handleToggleStatus函数（包括L6主料处于Active状态时）
                    handleToggleStatus(record);
                  }
                }}
                title={isDeprecated || isInactive ? "启用此主料" : "弃用此主料"}
              >
                {isDeprecated || isInactive ? '启用' : '弃用'}
              </Button>
            )}
          </Space>
        );
      }
    }
  ];
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAlternativeDrawer, setShowAlternativeDrawer] = useState(false);
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' 或 'table'
  const [lowCostAlternatives, setLowCostAlternatives] = useState([]);
  const [missingPartsWarning, setMissingPartsWarning] = useState(false);
  const [missingPartsDetails, setMissingPartsDetails] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [positionAutoComplete, setPositionAutoComplete] = useState(true);
  const [initialTotalCost, setInitialTotalCost] = useState(0); // 保存初始总成本
  const [currentTotalCost, setCurrentTotalCost] = useState(0); // 当前总成本
  const [statistics, setStatistics] = useState({
    totalParts: 0,
    totalCost: 0,
    activeParts: 0,
    deprecatedParts: 0,
    inactiveParts: 0,
    alternativeParts: 0,
    activeAlternativeParts: 0,
    supplierCount: 0,
    costPercentage: 0,
    effectiveParts: 0,
    hasActiveAlternative: false,
    averageVariance: 0,
    totalVariance: 0
  }); // 存储统计信息
  const [treeExpanded, setTreeExpanded] = useState(true); // 控制树的展开/折叠状态
  const [searchKeyword, setSearchKeyword] = useState(''); // 搜索关键词
  const [lowCostDrawerVisible, setLowCostDrawerVisible] = useState(false); // 低价替换料抽屉可见性
  const [currentL6Node, setCurrentL6Node] = useState(null); // 当前选中的L6节点
  const [top5Alternatives, setTop5Alternatives] = useState([]); // Top5低价替换料
  // 移除Excel导入相关的状态变量 // 产品序列号
  const [partsList, setPartsList] = useState([]); // 零件列表状态

  // 搜索过滤逻辑
  const filteredTreeData = React.useMemo(() => {
    if (!searchKeyword) return bomTreeData;
    
    const filterNode = (node) => {
      const match = node.title?.includes(searchKeyword) || 
                    node.position?.includes(searchKeyword) ||
                    node.partId?.includes(searchKeyword);
      
      if (match) return true;
      
      if (node.children) {
        const filteredChildren = node.children.filter(filterNode);
        if (filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren
          };
        }
      }
      
      return false;
    };
    
    return bomTreeData.map(node => filterNode(node)).filter(Boolean);
  }, [bomTreeData, searchKeyword]);

  // 处理树展开/折叠
  React.useEffect(() => {
    if (treeExpanded) {
      // 获取所有节点的key
      const getAllKeys = (nodes, keys = []) => {
        nodes.forEach(node => {
          keys.push(node.key);
          if (node.children) {
            getAllKeys(node.children, keys);
          }
        });
        return keys;
      };
      setExpandedKeys(getAllKeys(bomTreeData));
    } else {
      setExpandedKeys([]);
    }
  }, [treeExpanded, bomTreeData]);

  // 优化后的calculateStatistics函数 - 接收treeData参数而不是依赖状态
  const calculateStatistics = useCallback((treeData) => {
    if (!treeData || treeData.length === 0) {
      return {
        totalParts: 0,
        totalCost: 0,
        activeParts: 0,
        deprecatedParts: 0,
        inactiveParts: 0,
        alternativeParts: 0,
        activeAlternativeParts: 0,
        supplierCount: 0,
        costPercentage: 0,
        effectiveParts: 0,
        hasActiveAlternative: false,
        averageVariance: 0
      };
    }

    let totalParts = 0;
    let totalCost = 0;
    let activeParts = 0;
    let deprecatedParts = 0;
    let inactiveParts = 0; // 新增Inactive状态零件计数
    let alternativeParts = 0;
    let activeAlternativeParts = 0;
    let supplierCount = new Set();
    let totalVariance = 0; // 总差异
    let varianceCount = 0; // 差异计数
    let l6Groups = new Map(); // 存储L6主料及其对应的L7替代料

    const traverse = (nodes) => {
      nodes.forEach(node => {
        if (node.level >= 6) {
          totalParts++;
          
          if (node.level === 6) {
          // L6主料统计
          if (node.itemStatus === 'Active') {
            activeParts++;
            
            // 统计供应商（如果没有激活的L7替代料）
            if (node.supplier && node.supplier.trim() !== '') {
              supplierCount.add(node.supplier);
            }
          } else if (node.itemStatus === 'Deprecated') {
            deprecatedParts++;
          } else if (node.itemStatus === 'Inactive') {
            inactiveParts++;
          }
          
          // 无论L6主料状态如何，都存储L6主料信息
          l6Groups.set(node.key, {
            l6Node: node,
            hasActiveL7: false,
            l7Cost: 0,
            l7Supplier: null,
            l7Variance: 0,
            l6Variance: node.variance || 0  // 保存L6主料的差异值
          });
        } else if (node.level === 7) {
          // L7替代料统计
          alternativeParts++;
          // 只有Active状态的L7替代料才计入统计
          if (node.itemStatus === 'Active') {
            activeAlternativeParts++;
            console.log('发现激活的L7替代料:', node.title, '差异值:', node.variance);
              
              // 查找对应的L6主料
              let l6Key = null;
              if (node.parentId) {
                l6Key = node.parentId;
              } else {
                for (const [key, value] of l6Groups.entries()) {
                  if (value.l6Node.position === node.position) {
                    l6Key = key;
                    break;
                  }
                }
              }
              
              if (l6Key && l6Groups.has(l6Key)) {
                const group = l6Groups.get(l6Key);
                group.hasActiveL7 = true;
                group.l7Cost = (node.cost || 0) * (node.quantity || 1);
                group.l7Supplier = node.supplier;
                group.l7Variance = node.variance || 0;
                console.log('更新L6组:', group.l6Node.title, 'L7差异值:', group.l7Variance);
              }
            }
          }
        }
        
        if (node.children) {
          traverse(node.children);
        }
      });
    };

    traverse(treeData);
    
    // 计算总成本：如果L6有激活的L7替代料，则只计算L7成本；否则计算L6成本
  l6Groups.forEach(group => {
    if (group.hasActiveL7) {
      totalCost += group.l7Cost;
      // 使用L7替代料的供应商和差异
      if (group.l7Supplier && group.l7Supplier.trim() !== '') {
        supplierCount.add(group.l7Supplier);
      }
      // 使用L7替代料的差异值，而不是L6主料的差异值
      console.log('L7替代料差异值:', group.l7Variance, 'L6主料:', group.l6Node.title);
      totalVariance += group.l7Variance;
      varianceCount++;
    } else {
      // 无论L6主料状态如何，都计算成本（只有Active状态才计入总成本）
      if (group.l6Node.itemStatus === 'Active') {
        totalCost += (group.l6Node.cost || 0) * (group.l6Node.quantity || 1);
      }
      // 不再累加L6主料的差异值，只计算L7替代料的差异值
      console.log('L6主料差异值不计入统计:', group.l6Variance, 'L6主料:', group.l6Node.title, '状态:', group.l6Node.itemStatus);
    }
  });
    
    // 计算有效零件数量（激活的L6主料 + 激活的L7替代料）
    const effectiveParts = activeParts + activeAlternativeParts;
    
    // 计算平均差异
    const averageVariance = varianceCount > 0 ? (totalVariance / varianceCount) : 0;
    
    console.log('统计计算结果:', {
      totalVariance,
      varianceCount,
      averageVariance,
      activeAlternativeParts
    });
    
    const newStatistics = {
      totalParts,
      totalCost,
      activeParts,
      deprecatedParts,
      inactiveParts,
      alternativeParts,
      activeAlternativeParts,
      supplierCount: supplierCount.size,
      costPercentage: totalParts > 0 ? (effectiveParts / totalParts) * 100 : 0,
      effectiveParts,
      hasActiveAlternative: activeAlternativeParts > 0,
      averageVariance,
      totalVariance // 新增总差异值，用于列表同步
    };
    
    return newStatistics;
  }, []); // 移除BOM_LEVELS依赖，因为它是常量不会改变

  // 监听bomTreeData变化，自动重新计算统计信息
  useEffect(() => {
    console.log('bomTreeData变化监听触发:', {
      hasData: bomTreeData && bomTreeData.length > 0,
      dataLength: bomTreeData ? bomTreeData.length : 0,
      firstNode: bomTreeData && bomTreeData.length > 0 ? bomTreeData[0] : null
    });
    
    // 只有当bomTreeData不为空时才计算统计信息
    if (bomTreeData && bomTreeData.length > 0) {
      // 使用统一的防抖处理，避免频繁计算
      debounce(() => {
        console.log('开始计算统计信息...');
        const newStatistics = calculateStatistics(bomTreeData);
        console.log('统计信息计算完成:', newStatistics);
        setStatistics(newStatistics);
        
        // 计算总成本
        const newTotalCost = calculateInitialCost(bomTreeData);
        console.log('总成本计算完成:', newTotalCost);
        setCurrentTotalCost(newTotalCost);
        
        console.log('Statistics updated due to BOM data change:', newStatistics);
      }, 300);
    }
  }, [bomTreeData, debounce]); // 添加debounce依赖

  // 监听BOM统计更新事件
  useEffect(() => {
    const handleBOMStatisticsUpdated = (event) => {
      const { statistics, totalCost } = event.detail;
      
      // 更新统计信息状态
      setStatistics(statistics);
      setCurrentTotalCost(totalCost);
      
      console.log('统计信息已更新:', statistics);
    };
    
    // 添加事件监听器
    window.addEventListener('bomStatisticsUpdated', handleBOMStatisticsUpdated);
    
    // 清除事件监听器
    return () => {
      window.removeEventListener('bomStatisticsUpdated', handleBOMStatisticsUpdated);
    };
  }, []);

  // 组件初始化时，从本地存储加载统计信息（如果有）
  useEffect(() => {
    try {
      const savedStatistics = localStorage.getItem('bomStatistics');
      if (savedStatistics) {
        const { statistics, totalCost, productModel: savedProductModel } = JSON.parse(savedStatistics);
        
        // 只有当产品型号匹配时才加载保存的统计信息
        if (savedProductModel === productModel) {
          setStatistics(statistics);
          setCurrentTotalCost(totalCost);
        }
      }
    } catch (error) {
      console.error('加载保存的统计信息失败:', error);
    }
  }, [productModel]);

  // 更新统计信息
  const updateStatistics = useCallback((treeData) => {
    if (!treeData || treeData.length === 0) return;
    
    // 计算新的统计信息
    const newStatistics = calculateStatistics(treeData);
    setStatistics(newStatistics);
    
    // 计算新的总成本
    const newTotalCost = calculateInitialCost(treeData);
    setCurrentTotalCost(newTotalCost);
    
    console.log('Statistics updated via updateStatistics:', newStatistics);
    
    // 触发BOM统计更新事件，确保其他组件也能获取到最新的统计信息
    window.dispatchEvent(new CustomEvent('bomStatisticsUpdated', {
      detail: {
        statistics: newStatistics,
        totalCost: newTotalCost
      }
    }));
  }, [calculateStatistics]); // 移除calculateInitialCost依赖，因为它在后面定义且不会改变

  // 检查缺失件预警
  const checkMissingParts = useCallback((treeData) => {
    // 获取当前BOM中的所有L6主料
    const currentParts = [];
    const traverse = (nodes) => {
      if (!nodes || !Array.isArray(nodes)) return;
      
      nodes.forEach(node => {
        if (node.level === 6 && node.itemStatus === 'Active') { // 使用数字常量而非BOM_LEVELS
          currentParts.push({
            key: node.key,
            title: node.title,
            position: node.position,
            partId: node.partId,
            cost: node.cost,
            supplier: node.supplier,
            lifecycle: node.lifecycle,
            itemStatus: node.itemStatus
          });
        }
        
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    
    traverse(treeData);
    
    // 模拟模板数据 - 在实际应用中，这应该从API获取
    const templateParts = [
      { key: 'template-1', title: 'CPU处理器', position: 'M1.U2.S1.F1.G1.P1', required: true },
      { key: 'template-2', title: '主板芯片组', position: 'M1.U2.S1.F1.G1.P2', required: true },
      { key: 'template-3', title: '内存条', position: 'M1.U4.S1.F1.G1.P1', required: true },
      { key: 'template-4', title: '固态硬盘', position: 'M1.U4.S1.F1.F1.G1.P1', required: true },
      { key: 'template-5', title: '显示屏', position: 'M1.U5.S1.F1.G1.P1', required: true },
      { key: 'template-6', title: '电池', position: 'M1.U3.S1.F1.G1.P1', required: true },
      { key: 'template-7', title: '键盘', position: 'M1.U1.S1.F1.G1.P1', required: true },
      { key: 'template-8', title: '触摸板', position: 'M1.U1.S1.F1.G1.P2', required: true }
    ];
    
    // 检查缺失的零件
    const missingParts = [];
    templateParts.forEach(templatePart => {
      const isPresent = currentParts.some(currentPart => 
        currentPart.title === templatePart.title || 
        currentPart.partId === templatePart.partId
      );
      
      if (!isPresent && templatePart.required) {
        missingParts.push({
          ...templatePart,
          reason: '模板中必需的零件未在当前BOM中找到'
        });
      }
    });
    
    // 计算差异百分比
    const totalTemplateParts = templateParts.filter(p => p.required).length;
    const missingCount = missingParts.length;
    const differencePercentage = totalTemplateParts > 0 ? (missingCount / totalTemplateParts) * 100 : 0;
    
    const warningThreshold = 5; // 5%差异阈值
    const hasWarning = differencePercentage > warningThreshold;
    
    // 更新状态
    setMissingPartsWarning(hasWarning);
    setMissingPartsDetails(missingParts); // 存储缺失件详情
    
    return {
      hasWarning,
      missingParts,
      differencePercentage
    };
  }, []); // 移除所有依赖，避免无限循环



  // 获取所有节点键
  const getAllNodeKeys = useCallback((nodes) => {
    let keys = [];
    
    const traverse = (nodeList) => {
      nodeList.forEach(node => {
        keys.push(node.key);
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      });
    };
    
    traverse(nodes);
    return keys;
  }, []);

  // 验证BOM结构
  const validateBOMStructure = useCallback((treeData) => {
    // 为了支持随时保存模板，即使没有L6零件也返回true
    // 仅在下一步或发布时进行严格验证
    return true;
  }, []);

  // 计算BOM总成本（考虑L6主料和L7替代料的情况）
  const calculateInitialCost = useCallback((treeData) => {
    let totalCost = 0;
    let l6Groups = new Map(); // 存储L6主料及其对应的L7替代料
    
    // 遍历树结构，收集L6和L7节点信息
    const traverse = (nodes) => {
      nodes.forEach(node => {
        if (node.level === 6 && (node.itemStatus === 'Active' || node.itemStatus === 'Inactive')) { // 使用数字常量
          // 存储L6主料信息（包括Active和Inactive状态）
          l6Groups.set(node.key, {
            l6Node: node,
            hasActiveL7: false,
            l7Cost: 0
          });
        } else if (node.level === 7 && node.itemStatus === 'Active') { // 使用数字常量
          // 查找对应的L6主料
          let l6Key = null;
          if (node.parentId) {
            // 如果有parentId，直接查找
            l6Key = node.parentId;
          } else {
            // 否则通过position匹配（L6和L7的position应该相同）
            for (const [key, value] of l6Groups.entries()) {
              if (value.l6Node.position === node.position) {
                l6Key = key;
                break;
              }
            }
          }
          
          if (l6Key && l6Groups.has(l6Key)) {
            // 如果L7替代料是激活状态，则L6主料不计入成本
            l6Groups.get(l6Key).hasActiveL7 = true;
            l6Groups.get(l6Key).l7Cost += (node.cost || 0) * (node.quantity || 1);
          }
        }
        
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    
    if (treeData && treeData.length > 0) {
      traverse(treeData);
      
      // 计算总成本
      l6Groups.forEach(group => {
        if (group.hasActiveL7) {
          // 如果有激活的L7替代料，使用L7的成本
          totalCost += group.l7Cost;
        } else if (group.l6Node.itemStatus === 'Active') {
          // 如果没有激活的L7替代料，且L6主料是激活状态，使用L6的成本
          totalCost += (group.l6Node.cost || 0) * (group.l6Node.quantity || 1);
        }
        // 如果L6主料是Inactive状态且没有激活的L7替代料，不计入成本
      });
    }
    
    return totalCost;
  }, []); // 移除所有依赖，避免无限循环

  // 将产品信息更新函数提取到组件级别
  const updateNodeWithProductInfo = useCallback((nodes, productModel, productSerialNumber) => {
    return nodes.map(node => {
      // 特别处理L1节点，将其标题更新为产品型号
      if (node.level === 1) {
        return {
          ...node,
          title: `${productModel}`, // 使用产品型号作为L1节点标题
          productModel: productModel,
          productSerialNumber: productSerialNumber
        };
      }
      
      if (node.level >= 6) {
        return {
          ...node,
          productModel: productModel,
          productSerialNumber: productSerialNumber,
          // 更新零件名称，包含产品型号信息
          partName: node.partName ? `${node.partName} (${productModel})` : `${node.title} (${productModel})`
        };
      }
      
      if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: updateNodeWithProductInfo(node.children, productModel, productSerialNumber)
        };
      }
      
      return node;
    });
  }, []);

  // 加载默认模板
  const loadDefaultTemplate = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      // 直接使用默认值，移除Excel导入相关的状态设置
      const defaultProductModel = 'ThinkPad T14 Gen 4';
      const defaultProductSerialNumber = 'SN-TP14G4-2024-001';
      
      const template = generateDefaultTemplate();
      
      // 使用提取的函数更新产品信息
      const updatedTemplate = updateNodeWithProductInfo(template, defaultProductModel, defaultProductSerialNumber);
      setBomTreeData(updatedTemplate);
      
      // 初始状态设置为全部展开
      const allKeys = getAllNodeKeys(updatedTemplate);
      setExpandedKeys(allKeys);
      
      // 计算并保存初始总成本（所有激活的L6主料成本）
      let initialCost = 0;
      const calculateInitialCostForTemplate = (nodes) => {
        nodes.forEach(node => {
          if (node.level === 6 && node.itemStatus === 'Active') {
            initialCost += (node.cost || 0) * (node.quantity || 1);
          }
          if (node.children) {
            calculateInitialCostForTemplate(node.children);
          }
        });
      };
      calculateInitialCostForTemplate(updatedTemplate);
      setInitialTotalCost(initialCost);
      
      // 触发缺失件预警检查
      checkMissingParts(updatedTemplate);
      
      // 生成parts列表并更新父组件
      const parts = getPartsList(updatedTemplate);
      setPartsList(parts);
      
      // 计算总成本
      const totalCost = calculatePartsListCost(parts);
      
      // 计算统计信息
      const newStatistics = calculateStatistics(updatedTemplate);
      setStatistics(newStatistics);
      setCurrentTotalCost(totalCost);
      
      console.log('默认模板加载完成:', {
        totalCost,
        statistics: newStatistics,
        partsCount: parts.length
      });
      
      // 传递给父组件
      if (onStructureChange) {
        // 使用防抖处理，避免频繁调用导致的无限循环
        setTimeout(() => {
          onStructureChange({
            treeData: updatedTemplate,
            parts: parts,
            totalCost: totalCost,
            statistics: newStatistics,
            productModel: defaultProductModel,
            productSerialNumber: defaultProductSerialNumber
          });
        }, 100); // 100ms延迟，减少触发频率
      }
      
      setLoading(false);
    }, 500);
  }, [onStructureChange, validateBOMStructure, calculateInitialCost, checkMissingParts, BOM_LEVELS, getAllNodeKeys, getPartsList, calculatePartsListCost]);

  // 初始化加载默认模板（仅在组件首次加载且没有initialData时执行）
  useEffect(() => {
    console.log('初始化检查 - initialData:', initialData, 'bomTreeData:', bomTreeData);
    // 只有在没有initialData且bomTreeData为空时才加载默认模板
    if (!initialData && (!bomTreeData || bomTreeData.length === 0)) {
      console.log('开始加载默认模板...');
      loadDefaultTemplate();
    } else if (initialData) {
      console.log('检测到initialData，跳过默认模板加载');
    }
  }, [initialData, loadDefaultTemplate]); // 添加loadDefaultTemplate到依赖项

  // 处理initialData，初始化productModel和productSerialNumber
  useEffect(() => {
    if (initialData && initialData.bomData && Array.isArray(initialData.bomData)) {
      // 更新产品型号和序列号
      if (initialData.productModel) setProductModel(initialData.productModel);
      if (initialData.productSerialNumber) setProductSerialNumber(initialData.productSerialNumber);
      
      // 更新节点产品信息并加载BOM数据
      const updatedBomData = updateNodeWithProductInfo(initialData.bomData, initialData.productModel, initialData.productSerialNumber);
      setBomTreeData(updatedBomData);
      
      // 初始状态设置为全部展开
      const allKeys = getAllNodeKeys(initialData.bomData);
      setExpandedKeys(allKeys);
      
      // 计算并保存初始总成本
      let initialCost = 0;
      const calculateInitialCostForData = (nodes) => {
        nodes.forEach(node => {
          if (node.level === 6 && node.itemStatus === 'Active') {
            initialCost += (node.cost || 0) * (node.quantity || 1);
          }
          if (node.children) calculateInitialCostForData(node.children);
        });
      };
      calculateInitialCostForData(initialData.bomData);
      setInitialTotalCost(initialCost);
      
      // 触发缺失件预警检查
      checkMissingParts(initialData.bomData);
    }
  }, [initialData, updateNodeWithProductInfo, getAllNodeKeys, checkMissingParts]);
  
  // 定义序列号状态和产品型号的setter函数（产品型号从props获取）
  const [productSerialNumber, setProductSerialNumber] = useState('SN-TP14G4-2024-001');
  


  // 监听bomTreeData变化，生成parts列表并更新父组件
  useEffect(() => {
    console.log('BOMStructureNew - bomTreeData变化监听触发:', {
      hasData: bomTreeData && bomTreeData.length > 0,
      dataLength: bomTreeData ? bomTreeData.length : 0,
      hasOnStructureChange: !!onStructureChange
    });
    
    if (bomTreeData && bomTreeData.length > 0 && onStructureChange) {
      // 使用统一的防抖处理，避免频繁调用导致的无限循环
      debounce(() => {
        // 生成零件列表
        const parts = getPartsList(bomTreeData);
        setPartsList(parts);
        
        // 计算总成本
        const cost = calculatePartsListCost(parts);
        
        // 计算统计信息
        const newStatistics = calculateStatistics(bomTreeData);
        setStatistics(newStatistics);
        
        console.log('BOMStructureNew - 计算完成:', {
          partsCount: parts.length,
          totalCost: cost,
          statistics: newStatistics
        });
        
        // 更新父组件
        const updateData = {
          treeData: bomTreeData,
          parts: parts,
          totalCost: cost,
          statistics: newStatistics,
          productModel: productModel,
          productSerialNumber: productSerialNumber
        };
        
        console.log('BOMStructureNew - 调用onStructureChange:', updateData);
        onStructureChange(updateData);
      }, 300);
    }
  }, [bomTreeData, onStructureChange, productModel, productSerialNumber, debounce, getPartsList, calculatePartsListCost, calculateStatistics]); // 添加缺失的依赖项
  
  // 组件卸载时清除所有定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);
  
  // 提供setProductModel函数，用于更新产品型号
  const setProductModel = useCallback((value) => {
    console.log('更新产品型号:', value);
    // 在实际应用中，这里可能需要通过props或context更新父组件中的productModel
    // 此处仅提供一个基本实现以避免未定义错误
  }, []);
    
  // 严格验证BOM结构（用于下一步或发布）
const validateBOMStructureStrict = useCallback((treeData) => {
  let hasL6Parts = false;
  
  const traverse = (nodes) => {
    nodes.forEach(node => {
      if (node.level === 6 && node.itemStatus === 'Active') {
        hasL6Parts = true;
      }
      if (node.children) {
        traverse(node.children);
      }
    });
  };
  
  traverse(treeData);
  return hasL6Parts;
}, []); // 移除BOM_LEVELS依赖，因为它是常量不会改变



  // 弃用零件
  const handleDeprecate = useCallback((node) => {
    const updateNodeStatus = (nodes, targetKey) => {
      return nodes.map(node => {
        if (node.key === targetKey) {
          return {
            ...node,
            itemStatus: 'Deprecated',
            quantity: 0
          };
        }
        
        if (node.children) {
          return {
            ...node,
            children: updateNodeStatus(node.children, targetKey)
          };
        }
        
        return node;
      });
    };

    const newData = updateNodeStatus(bomTreeData, node.key);
    setBomTreeData(newData);
    
    // 计算新的总成本
    const newTotalCost = calculateInitialCost(newData);
    
    // 通知SAP系统
    message.success(`零件 ${node.title} 已弃用，数量置0并同步SAP`);
    
    // 延迟通知父组件，避免无限重渲染
      setTimeout(() => {
        if (onStructureChange) {
          onStructureChange({
            data: newData,
            sourceType: 'platform',
            isValid: validateBOMStructure(newData),
            totalCost: newTotalCost
          });
        }
      }, 100); // 增加延迟到100ms，减少触发频率
  }, [bomTreeData, onStructureChange, calculateInitialCost, validateBOMStructure]);

  // 启用零件
  const handleEnable = useCallback((node) => {
    // 只处理L6主料的启用
    if (node.level !== 6) {
      message.error('只能启用L6层的主料');
      return;
    }
    
    console.log('handleEnable called for L6 node:', node);
    
    const updateNodeStatus = (nodes, targetKey) => {
      return nodes.map(currentNode => {
        // 启用目标L6主料
        if (currentNode.key === targetKey) {
          console.log(`Enabling L6 node: ${currentNode.title}, setting status to Active`);
          return {
            ...currentNode,
            itemStatus: 'Active',
            lifecycle: 'Active',
            quantity: currentNode.quantity || 1,
            isActive: true
          };
        }
        
        // 如果是同一父节点下的L7替代料，则置灰（设为Inactive）
        if (currentNode.level === 7 && currentNode.parentId === node.parentId) {
          console.log(`Disabling L7 node: ${currentNode.title}, setting status to Inactive`);
          return {
            ...currentNode,
            itemStatus: 'Inactive',
            lifecycle: 'PhaseOut',
            quantity: 0,
            isActive: false
          };
        }
        
        // 递归处理子节点
        if (currentNode.children) {
          return {
            ...currentNode,
            children: updateNodeStatus(currentNode.children, targetKey)
          };
        }
        
        return currentNode;
      });
    };

    const newData = updateNodeStatus(bomTreeData, node.key);
    console.log('Updated BOM data after enable:', newData);
    setBomTreeData(newData);
    
    // 触发缺失件预警检查
    checkMissingParts(newData);
    
    message.success(`零件 ${node.title} 已启用，L7替代料已置灰`);
    
    // 计算新的总成本
    const newTotalCost = calculateInitialCost(newData);
    console.log('New total cost after enable:', newTotalCost);
    
    // 延迟通知父组件，避免无限重渲染
    setTimeout(() => {
      if (onStructureChange) {
        onStructureChange({
          data: newData,
          sourceType: 'platform',
          isValid: validateBOMStructure(newData),
          totalCost: newTotalCost
        });
      }
    }, 0);
  }, [bomTreeData, onStructureChange, checkMissingParts, calculateInitialCost, validateBOMStructure]);

  // 替换零件
  const handleReplace = useCallback((node, newPart) => {
    const replaceNode = (nodes, targetKey, replacement) => {
      return nodes.map(node => {
        if (node.key === targetKey) {
          // 标记旧零件为已替换
          const oldPart = {
            ...node,
            itemStatus: 'Replaced'
          };
          
          // 创建新零件
          const newPartNode = {
            ...replacement,
            parentId: node.parentId,
            position: node.position,
            key: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
          
          return newPartNode;
        }
        
        if (node.children) {
          return {
            ...node,
            children: replaceNode(node.children, targetKey, replacement)
          };
        }
        
        return node;
      });
    };

    const newData = replaceNode(bomTreeData, node.key, newPart);
    setBomTreeData(newData);
    
    // 触发缺失件预警检查
    checkMissingParts(newData);
    
    // 计算新的总成本
    const newTotalCost = calculateInitialCost(newData);
    
    message.success(`零件 ${node.title} 已替换，位号不变，成本差异实时刷新`);
    
    // 延迟通知父组件，避免无限重渲染
    setTimeout(() => {
      if (onStructureChange) {
        onStructureChange({
          data: newData,
          sourceType: 'platform',
          isValid: validateBOMStructure(newData),
          totalCost: newTotalCost
        });
      }
    }, 0);
  }, [bomTreeData, onStructureChange, checkMissingParts, calculateInitialCost, validateBOMStructure]);

  // 处理零件数量变化
  const handleQuantityChange = useCallback((key, value) => {
    console.log('handleQuantityChange - 数量变化:', { key, value });
    
    const updateNodeQuantity = (nodes, targetKey, newQuantity) => {
      return nodes.map(node => {
        if (node.key === targetKey) {
          const updatedNode = {
            ...node,
            quantity: value || 0
          };
          console.log('更新节点数量:', {
            title: node.title,
            oldQuantity: node.quantity,
            newQuantity: value,
            cost: node.cost
          });
          return updatedNode;
        }
        
        if (node.children) {
          return {
            ...node,
            children: updateNodeQuantity(node.children, targetKey, newQuantity)
          };
        }
        
        return node;
      });
    };

    const newData = updateNodeQuantity(bomTreeData, key, value);
    setBomTreeData(newData);
    
    // 触发缺失件预警检查
    checkMissingParts(newData);
    
    // 计算新的总成本
    const newTotalCost = calculateInitialCost(newData);
    console.log('handleQuantityChange - 新总成本计算完成:', newTotalCost);
    
    if (onStructureChange) {
      console.log('handleQuantityChange - 触发onStructureChange:', {
        totalCost: newTotalCost,
        dataLength: newData.length
      });
      // 添加延迟确保数据正确传递
      setTimeout(() => {
        onStructureChange({
          data: newData,
          sourceType: 'platform',
          isValid: validateBOMStructure(newData),
          totalCost: newTotalCost
        });
      }, 50);
    }
  }, [bomTreeData, onStructureChange, checkMissingParts, calculateInitialCost, validateBOMStructure]);

  // 处理零件单位变化
  const handleUnitChange = useCallback((key, value) => {
    const updateNodeUnit = (nodes, targetKey, newUnit) => {
      return nodes.map(node => {
        if (node.key === targetKey) {
          return {
            ...node,
            unit: value || '个'
          };
        }
        
        if (node.children) {
          return {
            ...node,
            children: updateNodeUnit(node.children, targetKey, newUnit)
          };
        }
        
        return node;
      });
    };

    const newData = updateNodeUnit(bomTreeData, key, value);
    setBomTreeData(newData);
    
    // 触发缺失件预警检查
    checkMissingParts(newData);
    
    // 计算新的总成本
    const newTotalCost = calculateInitialCost(newData);
    
    // 延迟通知父组件，避免无限重渲染
    setTimeout(() => {
      if (onStructureChange) {
        onStructureChange({
          data: newData,
          sourceType: 'platform',
          isValid: validateBOMStructure(newData),
          totalCost: newTotalCost
        });
      }
    }, 0);
  }, [bomTreeData, onStructureChange, checkMissingParts, calculateInitialCost, validateBOMStructure]);

  // 替换零件：激活L7替代料，弃用L6主料
  const handleReplacePartAlt = useCallback((alternativeNode) => {
    if (alternativeNode.level !== 7) {
      message.error('只能替换L7层的替代料');
      return;
    }

    // 查找L6主料节点
    let l6Node = null;
    let parentNode = null;
    
    const findL6Node = (nodes) => {
      console.log('开始查找L6节点，替代料信息:', {
        level: alternativeNode.level,
        parentId: alternativeNode.parentId,
        position: alternativeNode.position,
        title: alternativeNode.title
      });
      
      for (const node of nodes) {
        console.log('检查节点:', {
          key: node.key,
          level: node.level,
          title: node.title,
          position: node.position,
          children: node.children ? node.children.length : 0
        });
        
        if (node.children) {
          // 查找与替代料同组的L6主料节点（不限制状态）
          const l6Child = node.children.find(child => {
            console.log('检查子节点:', {
              key: child.key,
              level: child.level,
              title: child.title,
              position: child.position,
              isMatch: child.level === BOM_LEVELS.L6.level &&
                (child.key === alternativeNode.parentId || 
                 child.parentId === alternativeNode.parentId || 
                 (child.title && alternativeNode.title && 
                  child.title.split(' ')[0] === alternativeNode.title.split(' ')[0]) ||
                 (child.position && alternativeNode.position && 
                  child.position === alternativeNode.position))
            });
            
            return child.level === 6 &&
              (child.key === alternativeNode.parentId || 
               child.parentId === alternativeNode.parentId || 
               (child.title && alternativeNode.title && 
                child.title.split(' ')[0] === alternativeNode.title.split(' ')[0]) ||
               (child.position && alternativeNode.position && 
                child.position === alternativeNode.position));
          });
          
          if (l6Child) {
            console.log('找到匹配的L6节点:', l6Child);
            l6Node = l6Child;
            parentNode = node;
            return;
          }
          
          // 递归查找
          findL6Node(node.children);
        }
      }
    };
    
    // 如果没有找到L6节点，尝试通过其他方式查找
    if (!l6Node) {
      // 尝试通过替代料的parentId查找L6节点
      if (alternativeNode.parentId) {
        const findL6ByParentId = (nodes) => {
          for (const node of nodes) {
            if (node.key === alternativeNode.parentId && node.level === 6) {
              l6Node = node;
              // 查找L6的父节点
              const findParent = (nodes, targetKey) => {
                for (const n of nodes) {
                  if (n.children && n.children.some(child => child.key === targetKey)) {
                    parentNode = n;
                    return;
                  }
                  if (n.children) {
                    findParent(n.children, targetKey);
                  }
                }
              };
              findParent(bomTreeData, node.key);
              return;
            }
            if (node.children) {
              findL6ByParentId(node.children);
            }
          }
        };
        findL6ByParentId(bomTreeData);
      }
    }
    
    // 如果仍然没有找到，尝试通过position全局查找
    if (!l6Node && alternativeNode.position) {
      const findL6ByPosition = (nodes) => {
        for (const node of nodes) {
          if (node.level === 6 && node.position === alternativeNode.position) {
            l6Node = node;
            // 查找L6的父节点
            const findParent = (nodes, targetKey) => {
              for (const n of nodes) {
                if (n.children && n.children.some(child => child.key === targetKey)) {
                  parentNode = n;
                  return;
                }
                if (n.children) {
                  findParent(n.children, targetKey);
                }
              }
            };
            findParent(bomTreeData, node.key);
            return;
          }
          if (node.children) {
            findL6ByPosition(node.children);
          }
        }
      };
      findL6ByPosition(bomTreeData);
    }
    
    findL6Node(bomTreeData);

    // 添加调试日志
    console.log('After findL6Node:');
    console.log('l6Node:', l6Node);
    console.log('parentNode:', parentNode);

    if (!l6Node || !parentNode) {
      message.error('未找到对应的L6主料节点');
      return;
    }

    // 添加调试日志
    console.log('handleReplacePart called with alternativeNode:', alternativeNode);
    console.log('alternativeNode.level:', alternativeNode.level);
    console.log('alternativeNode.parentId:', alternativeNode.parentId);
    console.log('alternativeNode.position:', alternativeNode.position);
    console.log('alternativeNode.itemStatus:', alternativeNode.itemStatus);
    
    // 更新BOM结构
    const updateBOMStructure = (nodes, targetAlternative, targetL6, targetParent) => {
      return nodes.map(node => {
        // 找到L6主料的父节点
        if (node.key === targetParent.key) {
          // 检查是否已存在该L7替代料节点
          const existingL7Index = node.children.findIndex(child => 
            child.level === 7 && child.id === targetAlternative.id
          );
          
          let updatedChildren;
          
          if (existingL7Index >= 0) {
            // 如果已存在，直接激活它，并弃用其他L7替代料
            updatedChildren = node.children.map(child => {
              if (child.key === targetL6.key) {
                // 弃用L6主料，设置为Inactive状态和PhaseOut生命周期，使其置灰带删除线
                // 操作按钮将自动变为"启动"按钮
                return {
                  ...child,
                  itemStatus: 'Inactive',
                  lifecycle: 'PhaseOut',
                  quantity: 0
                };
              } else if (child.level === 7 && child.id === targetAlternative.id) {
                // 激活选中的L7替代料，使其不被置灰不带删除线
                return {
                  ...child,
                  itemStatus: 'Active',
                  lifecycle: 'Active',
                  quantity: child.quantity || 1,
                  variance: targetAlternative.costReduction || 0,
                  isActive: true // 明确标记为激活状态，确保样式正确显示
                };
              } else if (child.level === 7) {
                // 弃用其他所有L7替代料
                return {
                  ...child,
                  itemStatus: 'Inactive',
                  lifecycle: 'PhaseOut',
                  quantity: 0,
                  isActive: false
                };
              }
              return child;
            });
          } else {
            // 如果不存在，添加新的L7替代料节点，并弃用其他L7替代料
            const l7Node = {
              ...targetAlternative,
              key: `l7-${targetAlternative.id}-${Date.now()}`,
              level: 7,
              nodeType: '替代料',
              parentId: targetL6.key, // L7替代料的parentId应指向对应的L6主料
              itemStatus: 'Active',
              lifecycle: 'Active',
              quantity: targetAlternative.quantity || 1,
              position: targetL6.position, // 继承L6的位号
              variance: targetAlternative.costReduction || 0,
              difference: targetAlternative.costReduction || 0,  // 确保差异值一致性
              isActive: true // 明确标记为激活状态，确保样式正确显示
            };
            
            updatedChildren = node.children.map(child => {
              if (child.key === targetL6.key) {
                // 弃用L6主料，设置为Inactive状态和PhaseOut生命周期，使其置灰带删除线
                // 操作按钮将自动变为"启动"按钮
                return {
                  ...child,
                  itemStatus: 'Inactive',
                  lifecycle: 'PhaseOut',
                  quantity: 0
                };
              } else if (child.level === 7) {
                // 弃用其他所有L7替代料
                return {
                  ...child,
                  itemStatus: 'Inactive',
                  lifecycle: 'PhaseOut',
                  quantity: 0,
                  isActive: false
                };
              }
              return child;
            });
            
            // 添加新的L7替代料节点
              updatedChildren.push(l7Node);
            }
            
            updatedChildren = updatedChildren;
          
          return {
            ...node,
            children: updatedChildren
          };
        }
        
        if (node.children) {
          return {
            ...node,
            children: updateBOMStructure(node.children, targetAlternative, targetL6, targetParent)
          };
        }
        
        return node;
      });
    };

    const newData = updateBOMStructure(bomTreeData, alternativeNode, l6Node, parentNode);
    
    // 添加调试日志
    console.log('After updateBOMStructure:');
    console.log('newData:', newData);
    
    setBomTreeData(newData);
    
    // 重新计算总成本，而不是基于initialTotalCost进行增量计算
    const newTotalCost = calculateInitialCost(newData);
    
    // 触发缺失件预警检查
    checkMissingParts(newData);
    
    // 强制重新计算统计信息，确保平均差异同步更新
    const newStatistics = calculateStatistics(newData);
    console.log('New statistics after replacement:', newStatistics);
    
    message.success(`已替换为 ${alternativeNode.title}，原主料已弃用`);
    setShowAlternativeDrawer(false);
    
    // 延迟通知父组件，避免无限重渲染
    setTimeout(() => {
      if (onStructureChange) {
        onStructureChange({
          data: newData,
          sourceType: 'platform',
          isValid: validateBOMStructure(newData),
          totalCost: newTotalCost,
          statistics: newStatistics  // 传递最新的统计信息
        });
      }
    }, 0);
  }, [bomTreeData, onStructureChange, checkMissingParts, calculateInitialCost, calculateStatistics, validateBOMStructure]);

  // 打开替代料抽屉 - 修复L6层级检查和替代料获取
  const handleShowAlternatives = useCallback((node) => {
    // 确保只处理L6层级的节点
    if (node.level !== 6) {
      message.warning('只能为L6层级零件选择替代料');
      return;
    }
    
    console.log('L6零件点击灯泡图标，准备获取替代料:', node);
    
    // 获取同组FFF零件数据 - 传入完整的节点信息
    const alternatives = getAlternativeParts(node);
    console.log('获取到的替代料列表:', alternatives);
    
    // 确保替代料包含正确的parentId和成本差异信息
    const enhancedAlternatives = alternatives.map(alt => ({
      ...alt,
      parentId: node.key, // 确保替代料知道其父节点
      costReduction: alt.costReduction || alt.variance || 0, // 确保成本差异信息
      variance: alt.variance || alt.costReduction || 0, // 确保差异值一致性
      quantity: alt.quantity || 1 // 确保数量信息
    }));
    
    setLowCostAlternatives(enhancedAlternatives);
    setShowAlternativeDrawer(true);
  }, [getAlternativeParts, message]);

  // 处理应用替代料 - 修复L6主料弃用和L7替代料激活逻辑
  const handleReplacePart = useCallback((alternativeNode) => {
    if (!alternativeNode || !alternativeNode.parentId) return;
    
    console.log('开始处理替代料应用:', alternativeNode);
    
    // 找到对应的L6主料节点和父节点
    const findL6AndParentNodes = (nodes, nodeId) => {
      for (const node of nodes) {
        if (node.children) {
          // 检查子节点中是否有目标L6节点
          const l6Child = node.children.find(child => child.key === nodeId && child.level === 6);
          if (l6Child) {
            return { l6Node: l6Child, parentNode: node };
          }
          // 递归查找
          const found = findL6AndParentNodes(node.children, nodeId);
          if (found) return found;
        }
      }
      return null;
    };
    
    const nodes = findL6AndParentNodes(bomTreeData, alternativeNode.parentId);
    if (!nodes) {
      console.warn('未找到对应的L6主料节点:', alternativeNode.parentId);
      return;
    }
    
    const { l6Node, parentNode } = nodes;
    console.log('找到L6节点和父节点:', { l6Node, parentNode });
    
    // 更新BOM结构 - 弃用L6主料，激活选中的L7替代料
    const updateBOMStructure = (nodes, targetAlternative, targetL6, targetParent) => {
      return nodes.map(node => {
        // 找到L6主料的父节点
        if (node.key === targetParent.key) {
          // 检查是否已存在该L7替代料节点
          const existingL7Index = node.children.findIndex(child => 
            child.level === 7 && child.partId === targetAlternative.partId
          );
          
          let updatedChildren;
          
          if (existingL7Index >= 0) {
            // 如果已存在，直接激活它，并弃用L6主料和其他L7替代料
            updatedChildren = node.children.map(child => {
              if (child.key === targetL6.key) {
                // 弃用L6主料，设置为Inactive状态和PhaseOut生命周期，使其置灰带删除线
                // 操作按钮将自动变为"启动"按钮
                return {
                  ...child,
                  itemStatus: 'Inactive',
                  lifecycle: 'PhaseOut',
                  quantity: 0,
                  isActive: false,
                  style: { textDecoration: 'line-through', opacity: 0.6 }
                };
              } else if (child.level === 7 && child.partId === targetAlternative.partId) {
                // 激活选中的L7替代料，使其不被置灰不带删除线
                return {
                  ...child,
                  itemStatus: 'Active',
                  lifecycle: 'Active',
                  quantity: targetAlternative.quantity || 1,
                  variance: targetAlternative.costReduction || targetAlternative.variance || 0,
                  difference: targetAlternative.costReduction || targetAlternative.variance || 0,
                  isActive: true, // 明确标记为激活状态，确保样式正确显示
                  isActiveAlternative: true,
                  style: { opacity: 1 }
                };
              } else if (child.level === 7) {
                // 弃用其他所有L7替代料
                return {
                  ...child,
                  itemStatus: 'Inactive',
                  lifecycle: 'PhaseOut',
                  quantity: 0,
                  isActive: false,
                  isActiveAlternative: false,
                  style: { textDecoration: 'line-through', opacity: 0.6 }
                };
              }
              return child;
            });
          } else {
            // 检查是否已存在相同partId的L7替代料
            const existingL7WithSamePartId = node.children.find(child => 
              child.level === 7 && child.partId === targetAlternative.partId
            );
            
            if (existingL7WithSamePartId) {
              // 如果已存在相同partId的L7替代料，只更新其状态为Active
              updatedChildren = node.children.map(child => {
                if (child.key === targetL6.key) {
                  // 弃用L6主料
                  return {
                    ...child,
                    itemStatus: 'Inactive',
                    lifecycle: 'PhaseOut',
                    quantity: 0,
                    isActive: false,
                    style: { textDecoration: 'line-through', opacity: 0.6 }
                  };
                } else if (child.key === existingL7WithSamePartId.key) {
                  // 激活已存在的相同partId的L7替代料
                  return {
                    ...child,
                    itemStatus: 'Active',
                    lifecycle: 'Active',
                    quantity: targetAlternative.quantity || 1,
                    variance: targetAlternative.costReduction || targetAlternative.variance || 0,
                    difference: targetAlternative.costReduction || targetAlternative.variance || 0,
                    isActive: true,
                    isActiveAlternative: true,
                    style: { opacity: 1 }
                  };
                } else if (child.level === 7) {
                  // 弃用其他所有L7替代料
                  return {
                    ...child,
                    itemStatus: 'Inactive',
                    lifecycle: 'PhaseOut',
                    isActive: false,
                    isActiveAlternative: false,
                    quantity: 0,
                    style: { textDecoration: 'line-through', opacity: 0.6 }
                  };
                }
                return child;
              });
            } else {
              // 如果不存在相同partId的L7替代料，创建新的L7节点
              const l7Node = {
                ...targetAlternative,
                key: `l7-${targetAlternative.partId}-${Date.now()}`,
                level: 7,
                nodeType: '替代料',
                parentId: targetL6.key,
                itemStatus: 'Active',
                lifecycle: 'Active',
                quantity: targetAlternative.quantity || 1,
                position: targetL6.position,
                variance: targetAlternative.costReduction || targetAlternative.variance || 0,
                difference: targetAlternative.costReduction || targetAlternative.variance || 0,
                isActive: true,
                isActiveAlternative: true,
                substituteGroup: targetAlternative.substituteGroup || 'A',
                style: { opacity: 1 }
              };
              
              // 弃用所有其他L7替代料
              updatedChildren = node.children.map(child => {
                if (child.key === targetL6.key) {
                  // 弃用L6主料
                  return {
                    ...child,
                    itemStatus: 'Inactive',
                    lifecycle: 'PhaseOut',
                    quantity: 0,
                    isActive: false,
                    style: { textDecoration: 'line-through', opacity: 0.6 }
                  };
                } else if (child.level === 7) {
                  // 弃用其他所有L7替代料
                  return {
                    ...child,
                    itemStatus: 'Inactive',
                    lifecycle: 'PhaseOut',
                    isActive: false,
                    isActiveAlternative: false,
                    quantity: 0,
                    style: { textDecoration: 'line-through', opacity: 0.6 }
                  };
                }
                return child;
              });
              
              // 添加新的L7替代料节点
              updatedChildren.push(l7Node);
            }
          }
          
          return {
            ...node,
            children: updatedChildren
          };
        }
        
        if (node.children) {
          return {
            ...node,
            children: updateBOMStructure(node.children, targetAlternative, targetL6, targetParent)
          };
        }
        
        return node;
      });
    };
    
    const newTreeData = updateBOMStructure(bomTreeData, alternativeNode, l6Node, parentNode);
    
    // 检测重复key
    detectDuplicateKeys(newTreeData, 'replace_part');
    
    setBomTreeData(newTreeData);
    
    // 显示成功消息
    message.success(`已应用替代料: ${alternativeNode.partName || alternativeNode.title}`);
    
    // 计算新的总成本
    const newTotalCost = calculateInitialCost(newTreeData);
    
    // 强制重新计算统计信息，确保平均差异同步更新
    const newStatistics = calculateStatistics(newTreeData);
    
    // 更新partsList以同步BOM列表
    const newPartsList = getPartsList(newTreeData);
    setPartsList(newPartsList);
    
    // 延迟通知父组件，避免无限重渲染
    setTimeout(() => {
      if (onStructureChange) {
        onStructureChange({
          data: newTreeData,
          sourceType: 'platform',
          isValid: validateBOMStructure(newTreeData),
          totalCost: newTotalCost,
          statistics: newStatistics,
          partsList: newPartsList
        });
      }
    }, 0);
  }, [bomTreeData, onStructureChange, calculateInitialCost, calculateStatistics, validateBOMStructure, getPartsList]);

  // 切换零件状态（弃用/启用）- 修复L6主料弃用时L7替代料激活逻辑
  const handleToggleStatus = useCallback((node) => {
    console.log('handleToggleStatus called with node:', node);
    
    const updateNodeStatus = (nodes, targetKey) => {
      return nodes.map(item => {
        // 处理目标节点
        if (item.key === targetKey) {
          // 根据当前状态确定新状态
          let newStatus;
          if (item.itemStatus === 'Deprecated') {
            newStatus = 'Active';
          } else if (item.itemStatus === 'Inactive') {
            newStatus = 'Active';
          } else if (item.itemStatus === 'Active') {
            newStatus = 'Deprecated'; // Active状态改为Deprecated
          } else {
            newStatus = 'Deprecated'; // 其他状态也改为Deprecated
          }
          
          const newQuantity = newStatus === 'Active' ? (item.quantity || 1) : 0;
          const newLifecycle = newStatus === 'Active' ? 'Active' : 'PhaseOut';
          
          console.log(`Updating node ${item.title} from ${item.itemStatus} to ${newStatus}, quantity from ${item.quantity} to ${newQuantity}`);
          
          // 处理L7替代料状态
          let updatedChildren = item.children;
          let alternativeData = null;
          
          if (item.level === 6 && item.children && item.children.some(child => child.level === 7)) {
            // 获取所有L7替代料
            const l7Children = item.children.filter(child => child.level === 7);
            
            updatedChildren = item.children.map((child, index) => {
              if (child.level === 7) {
                if (newStatus === 'Active') {
                  // L6主料启用时，所有L7替代料都置为Inactive
                  const l7Status = 'Inactive';
                  const l7Quantity = 0;
                  const l7Lifecycle = 'PhaseOut';
                  
                  return {
                    ...child,
                    itemStatus: l7Status,
                    lifecycle: l7Lifecycle,
                    quantity: l7Quantity,
                    isActive: false,
                    isActiveAlternative: false,
                    parentId: item.key,
                    difference: child.difference || 0  // 确保差异值一致性
                  };
                } else {
                  // L6主料弃用时，只激活第一个L7替代料，其他保持Inactive
                  // 这里确保只有一个L7替代料被激活
                  const isFirstL7 = index === l7Children.findIndex(l7 => l7.key === child.key);
                  const l7Status = isFirstL7 ? 'Active' : 'Inactive';
                  const l7Quantity = l7Status === 'Active' ? (child.quantity || 1) : 0;
                  const l7Lifecycle = l7Status === 'Active' ? 'Active' : 'PhaseOut';
                  const isActive = l7Status === 'Active';
                  
                  console.log(`Updating L7 child ${child.title} to status ${l7Status}, quantity ${l7Quantity}`);
                  
                  // 当L7被激活时，保存其数据用于更新L6
                  if (isActive) {
                    alternativeData = {
                      title: child.title,
                      partId: child.partId,
                      partName: child.partName,
                      description: child.description,
                      cost: child.cost,
                      quantity: l7Quantity,
                      lifecycle: l7Lifecycle,
                      supplier: child.supplier,
                      difference: child.difference || child.variance || 0,  // 确保差异值一致性
                      variance: child.variance || child.difference || 0,   // 确保差异值一致性
                      // 保留原始L6的其他重要属性
                      position: item.position,
                      key: item.key,
                      level: item.level
                    };
                  }
                  
                  return {
                    ...child,
                    itemStatus: l7Status,
                    lifecycle: l7Lifecycle,
                    quantity: l7Quantity,
                    isActive: isActive,
                    isActiveAlternative: isActive,
                    parentId: item.key,
                    difference: child.difference || child.variance || 0,  // 确保差异值一致性
                    variance: child.variance || child.difference || 0   // 确保差异值一致性
                  };
                }
              }
              return child;
            });
          }
          
          // 当L6被弃用且有激活的L7替代料时，将L7的值复制到L6节点
          if (newStatus === 'Deprecated' && alternativeData) {
            console.log(`L6节点${item.title}被弃用，使用L7替代料${alternativeData.title}的值进行替换`);
            return {
              ...item,
              itemStatus: newStatus,
              lifecycle: newLifecycle,
              quantity: newQuantity,
              children: updatedChildren,
              // 复制L7替代料的主要属性，但保留Deprecated状态
              title: alternativeData.title,
              partId: alternativeData.partId,
              partName: alternativeData.partName,
              description: alternativeData.description,
              cost: alternativeData.cost,
              supplier: alternativeData.supplier,
              difference: alternativeData.difference || alternativeData.variance || 0,  // 确保差异值一致性
              variance: alternativeData.variance || alternativeData.difference || 0,   // 确保差异值一致性
              // 添加replacedByL7标记，表示此L6节点已被L7替代料替换
              replacedByL7: true
            };
          }
          
          return {
            ...item,
            itemStatus: newStatus,
            lifecycle: newLifecycle,
            quantity: newQuantity,
            children: updatedChildren,
            difference: item.difference || item.variance || 0,  // 确保差异值一致性
            variance: item.variance || item.difference || 0   // 确保差异值一致性
          };
        }
        
        // 递归处理子节点
        if (item.children) {
          return {
            ...item,
            children: updateNodeStatus(item.children, targetKey)
          };
        }
        
        return item;
      });
    };

    const newData = updateNodeStatus(bomTreeData, node.key);
    console.log('Updated BOM data after toggle:', newData);
    
    // 检测重复key
    detectDuplicateKeys(newData, 'toggle_status');
    
    setBomTreeData(newData);
    
    // 计算新的总成本
    const newTotalCost = calculateInitialCost(newData);
    console.log('New total cost after toggle:', newTotalCost);
    
    // 强制重新计算统计信息，确保平均差异同步更新
    const newStatistics = calculateStatistics(newData);
    console.log('New statistics after toggle:', newStatistics);
    console.log('Average variance updated:', newStatistics.averageVariance);
    
    // 更新partsList以同步BOM列表
    const newPartsList = getPartsList(newData);
    setPartsList(newPartsList);
    
    const statusText = node.itemStatus === 'Deprecated' || node.itemStatus === 'Inactive' ? '启用' : '弃用';
    message.success(`零件 ${node.title} 已${statusText}`);
    
    // 延迟通知父组件，避免无限重渲染
    setTimeout(() => {
      if (onStructureChange) {
        onStructureChange({
          data: newData,
          sourceType: 'platform',
          isValid: validateBOMStructure(newData),
          totalCost: newTotalCost,
          statistics: newStatistics,  // 传递最新的统计信息
          partsList: newPartsList
        });
      }
    }, 0);
  }, [bomTreeData, onStructureChange, calculateInitialCost, calculateStatistics, validateBOMStructure, getPartsList]); // 添加getPartsList依赖



  // 自动补全位号
  const autoCompletePosition = useCallback((parentNode, childIndex) => {
    if (!positionAutoComplete) return null;
    
    if (parentNode && parentNode.position) {
      const level = parentNode.level + 1;
      return generatePosition(level, parentNode.position, childIndex);
    }
    return null;
  }, [positionAutoComplete, generatePosition]);

  // 获取层级颜色
  const getLevelColor = useCallback((level) => {
    const colors = {
      1: 'red',
      2: 'orange',
      3: 'gold',
      4: 'green',
      5: 'blue',
      6: 'purple',
      7: 'cyan'
    };
    return colors[level] || 'default';
  }, []);

  // 实时校验功能
  const validateBOMInRealTime = useCallback((treeData) => {
    const errors = [];
    
    const traverse = (nodes) => {
      nodes.forEach(node => {
        // 用量≤0红色高亮
        if (node.quantity !== undefined && node.quantity <= 0) {
          errors.push({
            type: 'quantity_error',
            message: `用量必须大于0: ${node.title}`,
            nodeKey: node.key,
            severity: 'error'
          });
        }
        
        // 零件生命周期=PhaseOut橙色警告
        if (node.lifecycle === 'PhaseOut') {
          errors.push({
            type: 'lifecycle_warning',
            message: `零件即将停产: ${node.title}`,
            nodeKey: node.key,
            severity: 'warning'
          });
        }
        
        // 重复位号检查
        if (node.position) {
          const duplicateNodes = treeData.filter(n => 
            n !== node && n.position === node.position
          );
          if (duplicateNodes.length > 0) {
            errors.push({
              type: 'duplicate_position',
              message: `位号重复: ${node.position}`,
              nodeKey: node.key,
              severity: 'error'
            });
          }
        }
        
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    
    traverse(treeData);
    setValidationErrors(errors);
    return errors;
  }, [setValidationErrors]);

  // 打开AI辅助抽屉
  const handleShowAIDrawer = useCallback(() => {
    // 执行实时校验
    validateBOMInRealTime(bomTreeData);
    // 检查缺失件
    checkMissingParts(bomTreeData);
    setShowAIDrawer(true);
  }, [validateBOMInRealTime, checkMissingParts, bomTreeData]);

  // 添加编辑状态
  const [editingNodeKey, setEditingNodeKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // renderNodeTitle 已删除，仅用于BOM树预览模块

  // 使用useRef来存储handleShowReplaceModal函数的引用
  const handleShowReplaceModalRef = useRef(null);
  
  // 组件卸载时清除所有定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  // 显示替换模态框
  const handleShowReplaceModal = useCallback((node) => {
    // 这里实现替换模态框逻辑
    message.info(`准备替换零件: ${node.title}`);
  }, []);

  // 处理L6主料的弃用/启用
  const handleToggleL6Status = useCallback((node) => {
    // 更新BOM树数据
    const updateNodeStatus = (nodes, targetKey) => {
      return nodes.map(n => {
        if (n.key === targetKey) {
          // 切换L6节点状态
          const newStatus = n.itemStatus === 'Active' ? 'Inactive' : 'Active';
          return { ...n, itemStatus: newStatus };
        }
        
        // 如果是L7节点且父节点是目标节点，则切换状态
        if (n.level === 7 && n.parentId === targetKey) {
          const parentStatus = nodes.find(p => p.key === targetKey)?.itemStatus;
          // L7状态与L6相反
          const newStatus = parentStatus === 'Active' ? 'Active' : 'Inactive';
          return { ...n, itemStatus: newStatus };
        }
        
        // 递归处理子节点
        if (n.children && n.children.length > 0) {
          return { ...n, children: updateNodeStatus(n.children, targetKey) };
        }
        
        return n;
      });
    };
    
    const updatedTreeData = updateNodeStatus(bomTreeData, node.key);
    setBomTreeData(updatedTreeData);
    
    // 更新统计信息
    updateStatistics(updatedTreeData);
    
    message.success(`${node.itemStatus === 'Active' ? '弃用' : '启用'}成功`);
  }, [bomTreeData, updateStatistics]);

  // 显示低价替换料抽屉
  const handleShowLowCostAlternatives = useCallback((node) => {
    setCurrentL6Node(node);
    
    // 模拟获取Top5低价替换料
    const mockAlternatives = [
      {
        id: 'ALT001',
        name: '碳纤维机壳',
        description: '轻量化碳纤维材料',
        cost: node.cost * 0.85, // 15%成本降低
        supplier: '供应商X',
        lifecycle: 'Active',
        costReduction: 15
      },
      {
        id: 'ALT002',
        name: '铝合金机壳',
        description: '高强度铝合金材料',
        cost: node.cost * 0.92, // 8%成本降低
        supplier: '供应商Y',
        lifecycle: 'Active',
        costReduction: 8
      },
      {
        id: 'ALT003',
        name: '镁合金机壳',
        description: '轻质镁合金材料',
        cost: node.cost * 0.90, // 10%成本降低
        supplier: '供应商Z',
        lifecycle: 'Active',
        costReduction: 10
      },
      {
        id: 'ALT004',
        name: '复合塑料机壳',
        description: '高强度复合塑料',
        cost: node.cost * 0.75, // 25%成本降低
        supplier: '供应商W',
        lifecycle: 'Active',
        costReduction: 25
      },
      {
        id: 'ALT005',
        name: '再生材料机壳',
        description: '环保再生材料',
        cost: node.cost * 0.80, // 20%成本降低
        supplier: '供应商V',
        lifecycle: 'Active',
        costReduction: 20
      }
    ];
    
    setTop5Alternatives(mockAlternatives);
    setLowCostDrawerVisible(true);
  }, []);

  // 选择低价替换料
  const handleSelectLowCostAlternative = useCallback((alternative) => {
    if (!currentL6Node) return;
    
    // 更新BOM树数据
    const updateNodeWithAlternative = (nodes, targetKey) => {
      return nodes.map(n => {
        if (n.key === targetKey) {
          // 更新L6节点状态为未激活，但不修改其差异值
          console.log('更新L6主料状态为未激活:', n.title);
          return { 
            ...n, 
            itemStatus: 'Inactive'
          };
        }
        
        // 如果是L7节点且父节点是目标节点，则更新为选中的替换料
        if (n.level === 7 && n.parentId === targetKey) {
          console.log('更新L7替代料:', alternative.name, '差异值:', -alternative.costReduction);
          return {
            ...n,
            title: alternative.name,
            partName: alternative.name,
            cost: alternative.cost,
            supplier: alternative.supplier,
            lifecycle: alternative.lifecycle,
            itemStatus: 'Active',
            variance: -alternative.costReduction
          };
        }
        
        // 递归处理子节点
        if (n.children && n.children.length > 0) {
          return { ...n, children: updateNodeWithAlternative(n.children, targetKey) };
        }
        
        return n;
      });
    };
    
    const updatedTreeData = updateNodeWithAlternative(bomTreeData, currentL6Node.key);
    setBomTreeData(updatedTreeData);
    
    console.log('BOM树数据已更新，开始更新统计信息...');
    
    // 更新统计信息
    updateStatistics(updatedTreeData);
    
    // 关闭抽屉
    setLowCostDrawerVisible(false);
    
    message.success(`已选择替换料: ${alternative.name}，成本降低${alternative.costReduction}%`);
  }, [bomTreeData, currentL6Node, updateStatistics]);

  // 更新ref引用
  useEffect(() => {
    handleShowReplaceModalRef.current = handleShowReplaceModal;
  }, [handleShowReplaceModal]);

  // 转换树数据格式
  const convertToTreeData = useCallback((nodes) => {
    return nodes.map(node => {
      // 对于L6和L7层级，显示更详细的信息
      if (node.level >= 6) {
        const statusColor = node.itemStatus === 'Active' ? '#52c41a' : 
                           node.itemStatus === 'Inactive' ? '#faad14' : '#ff4d4f';
        const varianceColor = node.variance > 0 ? '#52c41a' : 
                             node.variance < 0 ? '#ff4d4f' : '#666';
        
        // L7节点样式：置灰和删除线（当状态为未激活时）
        const l7Style = node.level === 7 && node.itemStatus === 'Inactive' ? {
          color: '#999',
          textDecoration: 'line-through'
        } : {};
        
        // L6节点样式：置灰和删除线（当状态为未激活时）
        const l6Style = node.level === 6 && node.itemStatus === 'Inactive' ? {
          color: '#999',
          textDecoration: 'line-through'
        } : {};
        
        // 用量≤0红色高亮
        const quantityStyle = node.quantity <= 0 ? { color: '#ff4d4f' } : {};
        
        // 生命周期为PhaseOut橙色警告
        const lifecycleStyle = node.lifecycle === 'PhaseOut' ? { color: '#fa8c16' } : {};
        
        return {
          key: node.key,
          title: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', ...(node.level === 6 ? l6Style : l7Style) }}>
                <span style={{ marginRight: '8px', fontWeight: 'bold' }}>{node.position}</span>
                <span>{node.title}</span>
                {node.lifecycle === 'PhaseOut' && (
                  <Tag color="orange" style={{ marginLeft: '8px' }}>PhaseOut</Tag>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={quantityStyle}>数量: {node.quantity}{node.unit}</span>
                <span>成本: ¥{node.cost}</span>
                <span style={{ color: varianceColor }}>差异: {node.variance}%</span>
                <Tag color={statusColor}>{node.itemStatus === 'Active' ? '激活' : 
                                       node.itemStatus === 'Inactive' ? '未激活' : '已弃用'}</Tag>
                {node.level === 6 && (
                  <>
                    <Button 
                      size="small" 
                      type={node.itemStatus === 'Active' ? 'default' : 'primary'}
                      icon={node.itemStatus === 'Active' ? <StopOutlined /> : <PlayCircleOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleL6Status(node);
                      }}
                    >
                      {node.itemStatus === 'Active' ? '弃用' : '启用'}
                    </Button>
                    <Button 
                      size="small" 
                      type="primary"
                      icon={<BulbOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowLowCostAlternatives(node);
                      }}
                    >
                      低价替换
                    </Button>
                  </>
                )}
              </div>
            </div>
          ),
          data: node,
          children: node.children && node.children.length > 0 ? convertToTreeData(node.children) : undefined
        };
      } else {
        // 对于L1-L5层级，显示位号和标题
        return {
          key: node.key,
          title: (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }}>
                <span style={{ marginRight: '8px', fontWeight: 'bold' }}>{node.position}</span>
                <span>{node.title}</span>
              </div>
            </div>
          ),
          data: node,
          children: node.children && node.children.length > 0 ? convertToTreeData(node.children) : undefined
        };
      }
    });
  }, [handleToggleL6Status, handleShowLowCostAlternatives]);

  // 将partsList转换为树形数据结构
  const convertPartsListToTreeData = useCallback((parts) => {
    // 创建一个映射，便于快速查找节点
    const nodeMap = new Map();
    
    // 首先创建所有节点
    parts.forEach(part => {
      nodeMap.set(part.key, {
        key: part.key,
        title: part.title,
        data: part,
        children: []
      });
    });
    
    // 构建树形结构
    const treeNodes = [];
    nodeMap.forEach(node => {
      const parentId = node.data.parentId;
      if (parentId && nodeMap.has(parentId)) {
        // 有父节点，添加到父节点的children中
        nodeMap.get(parentId).children.push(node);
      } else {
        // 没有父节点或者是根节点
        treeNodes.push(node);
      }
    });
    
    return treeNodes;
  }, []);

  // 处理节点选择
  const handleSelect = useCallback((selectedKeys, { node, selected }) => {
    setSelectedKeys(selectedKeys);
  }, []);

  // 处理节点展开
  const handleExpand = useCallback((expandedKeys) => {
    setExpandedKeys(expandedKeys);
  }, []);

  // 下一步处理
  const handleNextStep = useCallback(() => {
    // 产品型号和序列号现在是关联显示的值，不需要验证必填
    
    // 使用严格验证确保BOM结构完整
    const isValid = validateBOMStructureStrict(bomTreeData);
    
    if (!isValid) {
      message.error('BOM结构不完整，请确保至少有一个激活的主料零件');
      return;
    }
    
    if (onStepChange) {
      onStepChange(currentStep + 1);
    }
  }, [bomTreeData, onStepChange, currentStep]);

  // 计算零件列表和总成本
  useEffect(() => {
    // 使用统一的防抖处理，避免频繁计算
    debounce(() => {
      const newPartsList = getPartsList(bomTreeData);
      setPartsList(newPartsList);
      const calculatedTotalCost = calculateInitialCost(bomTreeData);    
      setCurrentTotalCost(calculatedTotalCost); // 更新状态

      // 调试日志：检查L7替代料数据
      console.log('L7替代料数据:', newPartsList.filter(p => p.level === BOM_LEVELS.L7.level));
      console.log('L7替代料按钮渲染条件检查:');
      newPartsList.filter(p => p.level === BOM_LEVELS.L7.level).forEach(p => {
        console.log(`- ${p.partName}: level=${p.level}, itemStatus=${p.itemStatus}, isAlternative=${p.level === BOM_LEVELS.L7.level}, shouldShowButton=${p.level === BOM_LEVELS.L7.level && (p.itemStatus === 'Inactive' || p.itemStatus === 'Active')}`);
      });
    }, 300);
  }, [bomTreeData, debounce]); // 添加debounce依赖

  return (
    <div className="bom-structure-new" style={{ minHeight: '600px' }}>

      
      <Card 
        title="BOM结构搭建" 
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col span={12}>
            <Form.Item 
              label="产品型号" 
            >
              <div style={{ padding: '4px 11px', backgroundColor: '#f5f5f5', borderRadius: '6px', minHeight: '32px', display: 'flex', alignItems: 'center' }}>
                ThinkPad T14 Gen 4
              </div>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              label="产品序列号" 
            >
              <div style={{ padding: '4px 11px', backgroundColor: '#f5f5f5', borderRadius: '6px', minHeight: '32px', display: 'flex', alignItems: 'center' }}>
                SN-TP14G4-2024-001
              </div>
            </Form.Item>
          </Col>
        </Row>
        
      </Card>

      {/* 缺失件预警Banner */}
      {Math.abs(statistics.averageVariance) > 5 && (
        <Alert
          message="缺失件预警"
          description={`模板与已选零件差异超过5%，当前平均差异为${statistics.averageVariance.toFixed(2)}%，请检查BOM结构完整性`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* 统计面板 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16}>
          <Col span={3}>
            <Statistic title="总零件数" value={statistics.totalParts || 0} />
          </Col>
          <Col span={3}>
            <Statistic title="激活零件" value={statistics.activeParts || 0} valueStyle={{ color: '#3f8600' }} />
          </Col>
          <Col span={3}>
            <Statistic title="弃用零件" value={statistics.deprecatedParts || 0} valueStyle={{ color: '#cf1322' }} />
          </Col>
          <Col span={3}>
            <Statistic title="激活替代料" value={statistics.activeAlternativeParts || 0} valueStyle={{ color: '#13c2c2' }} />
          </Col>
          <Col span={3}>
            <Statistic title="总替代料" value={statistics.alternativeParts || 0} valueStyle={{ color: '#722ed1' }} />
          </Col>
          <Col span={3}>
            <Statistic title="供应商数" value={statistics.supplierCount || 0} valueStyle={{ color: '#1890ff' }} />
          </Col>
          <Col span={3}>
            <Statistic title="总成本" value={currentTotalCost || 0} prefix="¥" />
          </Col>
          <Col span={3}>
            <Statistic 
              title="平均差异" 
              value={statistics.averageVariance || 0} 
              precision={2}
              valueStyle={{ 
                color: (statistics.averageVariance || 0) > 0 ? '#3f8600' : (statistics.averageVariance || 0) < 0 ? '#cf1322' : '#666' 
              }}
              suffix="%" 
            />
          </Col>
        </Row>
      </Card>

      {/* 主内容区域 - 左右两栏布局 */}
      <Row gutter={16}>
        {/* 左侧 - BOM结构视图 */}
        <Col span={24}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{viewMode === 'tree' ? '平台模板-BOM树形结构' : 'BOM零件列表'}</span>
                <Space>
                  {viewMode === 'tree' && (
                    <>
                      <Button 
                        size="small" 
                        icon={<DownOutlined />} 
                        onClick={() => setTreeExpanded(true)}
                      >
                        全部展开
                      </Button>
                      <Button 
                        size="small" 
                        icon={<UpOutlined />} 
                        onClick={() => setTreeExpanded(false)}
                      >
                        全部折叠
                      </Button>
                      <Space.Compact>
                        <Input
                          placeholder="搜索零件"
                          allowClear
                          size="small"
                          value={searchKeyword}
                          onChange={(e) => setSearchKeyword(e.target.value)}
                          onPressEnter={(e) => setSearchKeyword(e.target.value)}
                          style={{ width: '150px' }}
                        />
                        <Button 
                          size="small" 
                          icon={<SearchOutlined />}
                          onClick={() => setSearchKeyword(searchKeyword)}
                        />
                      </Space.Compact>
                    </>
                  )}
                  <Space.Compact>
                    <Button 
                      type={viewMode === 'tree' ? 'primary' : 'default'}
                      icon={<AppstoreOutlined />}
                      onClick={() => setViewMode('tree')}
                    >
                      树形视图
                    </Button>
                    <Button 
                      type={viewMode === 'table' ? 'primary' : 'default'}
                      icon={<UnorderedListOutlined />}
                      onClick={() => setViewMode('table')}
                    >
                      表格视图
                    </Button>
                  </Space.Compact>
                  <Button 
                    type="primary" 
                    icon={<FileTextOutlined />}
                    onClick={loadDefaultTemplate}
                  >
                    重新加载模板
                  </Button>
                </Space>
              </div>
            }
            loading={loading}
          >
            {partsList.length === 0 ? (
              <Empty 
                description="暂无BOM数据"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={loadDefaultTemplate}>
                  加载默认模板
                </Button>
              </Empty>
            ) : (
              viewMode === 'tree' ? (
                // 树形视图
                <div style={{ overflowX: 'auto' }}>
                  <Tree
                    showLine
                    selectedKeys={selectedKeys}
                    expandedKeys={expandedKeys}
                    autoExpandParent={true}
                    onSelect={handleSelect}
                    onExpand={(keys) => setExpandedKeys(keys)}
                    treeData={convertToTreeData(bomTreeData)}
                    style={{ minHeight: '400px', minWidth: '1000px' }}
                    switcherIcon={(props) => {
                      const { isLeaf, isExpanded, onClick } = props;
                      // 如果是叶子节点，不显示展开图标
                      if (isLeaf) {
                        return <span style={{ width: 16, display: 'inline-block' }} />;
                      }
                      // 确保展开图标可点击并正确传递点击事件
                      return (
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onClick) {
                              onClick(e);
                            }
                          }}
                          style={{ 
                            cursor: 'pointer', 
                            fontSize: '12px',
                            marginRight: 4,
                            transform: isExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            userSelect: 'none',
                            display: 'inline-block',
                            width: 16,
                            textAlign: 'center'
                          }}
                        >
                          +
                        </span>
                      );
                    }}
                  />
                </div>
              ) : (
                // 表格视图
                <Table
                  columns={tableColumns}
                  dataSource={partsList}
                  rowKey="key"
                  rowClassName={(record) => {
                    // L7替代料的样式设置 - 使用record中的数据而不是查找bomTreeData
                    if (record.level === BOM_LEVELS.L7.level) { // L7替代料
                      // 使用record中的parentId来查找对应的L6主料节点
                      // 在partsList中查找对应的L6主料
                      const l6Parent = partsList.find(p => p.key === record.parentId && p.level === BOM_LEVELS.L6.level);
                      
                      // 只有当L6主料存在且处于激活状态时，替代料才置灰
                      // 当L6主料被弃用时，替代料不置灰且可点击替换
                      if (l6Parent && l6Parent.itemStatus === 'Active') {
                        return 'deprecated-alternative-row'; // 主料启用时，替代料置灰
                      }
                      // 当L6主料被弃用时，替代料保持正常样式（不置灰）
                    }
                    // 主料弃用时，显示弃用样式
                    if (record.itemStatus === 'Deprecated' || record.itemStatus === 'Inactive') {
                      return 'deprecated-row';
                    }
                    return '';
                  }}
                  pagination={{
                    pageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条零件记录`
                  }}
                  scroll={{ x: 1200 }}
                  size="middle"
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}>
                          <strong>总计</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3}>
                          <strong>{partsList.length} 个零件</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4}>
                          <strong>¥{currentTotalCost}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} colSpan={6}>
                          <Space>
                            <Tag color="green">主料: {partsList.filter(p => p.level === BOM_LEVELS.L6.level && p.itemStatus === 'Active').length}</Tag>
                            <Tag color="cyan">激活替代料: {partsList.filter(p => p.level === BOM_LEVELS.L7.level && p.itemStatus === 'Active').length}</Tag>
                            <Tag color="blue">总替代料: {partsList.filter(p => p.level === BOM_LEVELS.L7.level).length}</Tag>
                            <Tag color="red">已弃用: {partsList.filter(p => p.itemStatus === 'Deprecated').length}</Tag>
                          </Space>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              )
            )}
          </Card>
        </Col>
      </Row>

      {/* 实时校验错误提示 */}
      {validationErrors.length > 0 && (
        <Alert
          message={`发现 ${validationErrors.length} 个校验问题`}
          description={
            <div>
              {validationErrors.slice(0, 3).map((error, index) => (
                <div key={`error-${index}`} style={{ 
                  color: error.severity === 'error' ? '#cf1322' : '#fa8c16',
                  marginBottom: '4px'
                }}>
                  • {error.message}
                </div>
              ))}
              {validationErrors.length > 3 && (
                <div style={{ color: '#666', fontSize: '12px' }}>
                  还有 {validationErrors.length - 3} 个问题...
                </div>
              )}
            </div>
          }
          type={validationErrors.some(e => e.severity === 'error') ? 'error' : 'warning'}
          showIcon
          closable
          style={{ marginBottom: '16px' }}
        />
      )}


      {/* AI辅助按钮 */}
      <div style={{ position: 'fixed', right: '20px', bottom: '20px', zIndex: 1000 }}>
        <Tooltip title="AI辅助（低成本替代/缺失件预警/实时校验）">
          <Button 
            type="primary" 
            shape="circle" 
            size="large"
            icon={<RobotOutlined />}
            onClick={handleShowAIDrawer}
            style={{
              width: '60px',
              height: '60px',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)'
            }}
          />
        </Tooltip>
      </div>

      {/* 替代料抽屉 */}
      <Drawer
        title="替代料选择"
        placement="right"
        width={600}
        onClose={() => setShowAlternativeDrawer(false)}
        open={showAlternativeDrawer}
      >
        <Card 
          title="Top3低成本替代料" 
          extra={<Tag color="green">成本降幅排序</Tag>}
          style={{ marginBottom: '16px' }}
        >
          <List
            dataSource={lowCostAlternatives.slice(0, 3)}
            renderItem={(item, index) => (
              <List.Item
                key={`low-cost-alt-${index}`}
                actions={[
                  <Button 
                    type="link" 
                    key="select"
                    onClick={() => {
                      // 创建L7节点并替换
                      const l7Node = {
                        ...item,
                        id: item.id,
                        key: `l7-${item.id}`,
                        level: 7, // 使用数字常量
                        nodeType: '替代料',
                        parentId: selectedNode?.parentId || selectedNode?.id,
                        itemStatus: 'Active',
                        quantity: 1,
                        variance: item.costReduction // 使用成本降幅作为差异值
                      };
                      handleReplacePart(l7Node);
                    }}
                  >
                    选择
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Badge 
                      count={index + 1} 
                      style={{ 
                        backgroundColor: item.costReduction > 10 ? '#52c41a' : '#faad14'
                      }}
                    />
                  }
                  title={
                    <div>
                      {item.title}
                      <Tag color="blue" style={{ marginLeft: '8px' }}>
                        {item.substituteGroup}组
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <div>成本: ¥{item.cost} (降幅: {item.costReduction}%)</div>
                      <div>供应商: {item.supplier}</div>
                      <div>匹配度: {item.matchScore}%</div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Card>

        <Card title="同组FFF零件">
          <Table
            columns={[
              {
                title: '零件名称',
                dataIndex: 'title',
                key: 'title'
              },
              {
                title: '成本',
                dataIndex: 'cost',
                key: 'cost',
                render: (cost) => `¥${cost}`
              },
              {
                title: '降幅',
                dataIndex: 'costReduction',
                key: 'costReduction',
                render: (reduction) => (
                  <Tag color={reduction > 0 ? 'green' : 'red'}>
                    {reduction > 0 ? '+' : ''}{reduction}%
                  </Tag>
                )
              },
              {
                title: '操作',
                key: 'action',
                render: (_, record) => (
                  <Button 
                    type="link"
                    onClick={() => {
                      // 创建L7节点并替换
                      const l7Node = {
                        ...record,
                        id: record.id,
                        key: `l7-${record.id}`,
                        level: 7, // 使用数字常量
                        nodeType: '替代料',
                        parentId: record.parentId,
                        itemStatus: 'Active',
                        quantity: 1,
                        variance: record.costReduction // 使用成本降幅作为差异值
                      };
                      handleReplacePart(l7Node);
                    }}
                  >
                    替换
                  </Button>
                )
              }
            ]}
            dataSource={lowCostAlternatives}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      </Drawer>

      {/* 低价替换料抽屉 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BulbOutlined style={{ marginRight: '8px', color: '#faad14' }} />
            <span>低价替换料推荐 - {currentL6Node?.title}</span>
          </div>
        }
        placement="right"
        onClose={() => setLowCostDrawerVisible(false)}
        open={lowCostDrawerVisible}
        width={800}
        destroyOnHidden
      >
        <Alert
          message="低成本选择"
          description="以下是根据成本排序的Top5低价替换料，点击选择将自动替换当前主料并更新BOM结构"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <List
          dataSource={top5Alternatives}
          renderItem={(item, index) => (
            <List.Item
              key={`low-cost-alt-${index}`}
              actions={[
                <Button 
                  type="primary" 
                  key="select"
                  onClick={() => handleSelectLowCostAlternative(item)}
                >
                  选择此替换料
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Badge 
                    count={index + 1} 
                    style={{ 
                      backgroundColor: item.costReduction > 15 ? '#52c41a' : '#faad14'
                    }}
                  />
                }
                title={
                  <div>
                    {item.name}
                    <Tag color="blue" style={{ marginLeft: '8px' }}>
                      {item.supplier}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <div>描述: {item.description}</div>
                    <div>原成本: ¥{currentL6Node?.cost} → 新成本: ¥{item.cost}</div>
                    <div>
                      <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                        成本降幅: {item.costReduction}%
                      </span>
                    </div>
                    <div>生命周期: <Tag color="green">{item.lifecycle}</Tag></div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>

      {/* AI辅助抽屉 */}
      <Drawer
        title="AI辅助功能"
        placement="right"
        width={500}
        onClose={() => setShowAIDrawer(false)}
        open={showAIDrawer}
      >
        <Card title="实时校验结果" style={{ marginBottom: '16px' }}>
          {validationErrors.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#52c41a' }}>
              <CheckCircleOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
              <div>无校验问题</div>
            </div>
          ) : (
            <List
              size="small"
              dataSource={validationErrors}
              renderItem={(error, index) => (
                <List.Item key={`validation-error-${index}`}>
                  <List.Item.Meta
                    avatar={
                      <ExclamationCircleOutlined 
                        style={{ 
                          color: error.severity === 'error' ? '#cf1322' : '#fa8c16' 
                        }} 
                      />
                    }
                    title={error.message}
                    description={`位号: ${error.nodeKey}`}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        <Card title="缺失件预警" style={{ marginBottom: '16px' }}>
          {missingPartsWarning ? (
            <div>
              <div style={{ color: '#fa8c16', marginBottom: '12px' }}>
                <WarningOutlined /> 模板与实际选择差异超过5%
              </div>
              <List
                size="small"
                dataSource={missingPartsDetails}
                renderItem={(item, index) => (
                  <List.Item key={`missing-part-${index}`}>
                    <List.Item.Meta
                      avatar={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                      title={item.title}
                      description={
                        <div>
                          <div>位号: {item.position}</div>
                          <div>原因: {item.reason}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          ) : (
            <div style={{ color: '#52c41a' }}>
              <SafetyCertificateOutlined /> 零件选择完整
            </div>
          )}
        </Card>

        <Card title="自动补全位号">
          <div style={{ marginBottom: '12px' }}>
            <Switch 
              checked={positionAutoComplete}
              onChange={setPositionAutoComplete}
              checkedChildren="开启"
              unCheckedChildren="关闭"
            />
            <span style={{ marginLeft: '8px' }}>按照"主板-CPU-R1-C1"规则自动填充</span>
          </div>
          
          <div>
            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>当前位号规则</div>
            <TextArea 
              rows={3}
              readOnly
              defaultValue="M1.U1.S1.F1.G1.P1 → M1.U1.S1.F1.G1.A1"
            />
          </div>
        </Card>

        <Card title="低成本替代建议" style={{ marginTop: '16px' }}>
          <List
            size="small"
            dataSource={lowCostAlternatives.slice(0, 3)}
            renderItem={(item, index) => (
              <List.Item key={`low-cost-suggestion-${index}`}>
                <List.Item.Meta
                  avatar={<ThunderboltOutlined style={{ color: '#52c41a' }} />}
                  title={item.title}
                  description={`成本降幅: ${item.costReduction}%`}
                />
                <Button type="link" size="small">应用</Button>
              </List.Item>
            )}
          />
        </Card>
      </Drawer>
    </div>
  );
};

// 添加样式定义
const styles = `
  .deprecated-alternative-row {
    opacity: 0.4;
    text-decoration: line-through;
    color: #999;
  }
  
  .deprecated-row {
    opacity: 0.4;
    text-decoration: line-through;
    color: #999;
  }
`;

// 注入样式到页面
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.type = 'text/css';
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}

export default BOMStructureNew;
