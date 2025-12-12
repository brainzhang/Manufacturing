import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Eye, Edit, Trash2, Power, RotateCcw, ChevronDown, ChevronUp, Download, Upload } from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';
import * as XLSX from 'xlsx';



// 选项定义
const categoryOptions = ["全部", "Ultrabook", "Gaming", "Workstation", "2-in-1", "Tablet"];
const platformOptions = ["全部", "Intel", "AMD", "Qualcomm"];
const familyOptions = ["全部", "ThinkPad X1", "Legion Gaming", "IdeaPad Consumer", "ThinkStation", "Yoga", "ThinkBook"];
const targetMarketOptions = ["全部", "Enterprise", "Business", "Consumer", "Gaming", "Education"];
const lifecycleOptions = ["全部", "planning", "development", "production", "sustaining", "end_of_life"];
const statusOptions = ["全部", "草稿", "活跃", "已废弃"];

// 中文状态到英文状态的反向映射（用于筛选）
const statusToValueMap = {
  "草稿": "draft",
  "活跃": "active",
  "已废弃": "deprecated"
};

// 生命周期和状态的显示映射

// 删除重复的默认导出，保留文件末尾的唯一默认导出即可

// 移除重复的默认导出，保留文件末尾的唯一默认导出即可

// 生命周期和状态的显示映射
const lifecycleMap = {
  "planning": "规划中",
  "development": "开发中",
  "production": "量产",
  "sustaining": "维护期",
  "end_of_life": "已停产"
};

const statusMap = {
  "draft": "草稿",
  "active": "活跃",
  "deprecated": "已废弃"
};

// 生命周期状态的颜色映射
const lifecycleColorMap = {
  "planning": "bg-blue-100 text-blue-800",
  "development": "bg-purple-100 text-purple-800",
  "production": "bg-green-100 text-green-800",
  "sustaining": "bg-yellow-100 text-yellow-800",
  "end_of_life": "bg-gray-100 text-gray-800"
};

const statusColorMap = {
  "draft": "bg-gray-100 text-gray-800",
  "active": "bg-green-100 text-green-800",
  "deprecated": "bg-red-100 text-red-800"
};

const ProductList = () => {
  const navigate = useNavigate();
  // 使用ProductContext中的数据和函数
  const { products, isLoading, saveProducts, deleteProduct, deleteProducts, importProducts } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // 筛选状态
  const [category, setCategory] = useState("全部");
  const [platform, setPlatform] = useState("全部");
  const [family, setFamily] = useState("全部");
  const [targetMarket, setTargetMarket] = useState("全部");
  const [lifecycle, setLifecycle] = useState("全部");
  const [status, setStatus] = useState("全部");
  
  // 排序状态
  const [sortField, setSortField] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [expandedRows, setExpandedRows] = useState([]);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15); // 每页显示15条数据
  
  // 复选框状态
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // 导入功能状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(''); // '', 'validating', 'success', 'error'
  const [importMessage, setImportMessage] = useState('');
  const [importMode, setImportMode] = useState('merge'); // 'merge' or 'replace'
  const [showImportOptions, setShowImportOptions] = useState(false);
  
  // 导出功能状态
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // 获取经过筛选和排序的产品列表 - 移到组件顶部，在useEffect使用前定义
  const getFilteredProducts = () => {
    console.log('getFilteredProducts called, products.length:', products ? products.length : 'products is null/undefined');
    
    // 确保products是数组
    if (!products || !Array.isArray(products)) {
      console.log('Products is null, undefined, or not an array');
      return [];
    }
    
    if (products.length === 0) {
      console.log('Products is empty array');
      return [];
    }
    
    // 创建products的深拷贝，避免状态竞争
    let result = [...products];
    
    // 先应用搜索筛选
    if (searchTerm) {
      result = result.filter(product => 
        product.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 应用各种筛选条件
    if (category !== "全部") {
      result = result.filter(product => product.category === category);
    }
    
    if (platform !== "全部") {
      result = result.filter(product => product.platform === platform);
    }
    
    if (family !== "全部") {
      result = result.filter(product => product.family === family);
    }
    
    if (targetMarket !== "全部") {
      result = result.filter(product => {
        if (Array.isArray(product.targetMarket)) {
          return product.targetMarket.includes(targetMarket);
        }
        return product.targetMarket === targetMarket;
      });
    }
    
    if (lifecycle !== "全部") {
      result = result.filter(product => product.lifecycle === lifecycle);
    }
    
    if (status !== "全部") {
      result = result.filter(product => product.status === status);
    }
    
    // 应用排序
    if (sortField) {
      result.sort((a, b) => {
        const valueA = a[sortField];
        const valueB = b[sortField];
        
        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return sortOrder === 'asc' ? -1 : 1;
        if (valueB == null) return sortOrder === 'asc' ? 1 : -1;
        
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortOrder === 'asc' 
            ? valueA.localeCompare(valueB)
            : valueB.localeCompare(valueA);
        }
        
        return sortOrder === 'asc' 
          ? (valueA - valueB)
          : (valueB - valueA);
      });
    }
    
    console.log('getFilteredProducts result:', result.length);
    return result;
  };

  // 处理从localStorage加载的数据，确保日期格式正确
  const processLoadedProducts = (products) => {
    return products.map(product => {
      // 检查日期是否已经是正确格式，避免重复转换
      const releaseDate = typeof product.releaseDate === 'string' && product.releaseDate.includes('-') 
        ? product.releaseDate 
        : convertDate(product.releaseDate);
      
      return {
        ...product,
        releaseDate
      };
    });
  };

  // 注意：数据加载现在由ProductContext处理
  
  // 调试日志：组件初始化和状态变化
  useEffect(() => {
    console.log('ProductList: 组件状态初始化', {
      productsLength: products.length,
      isLoading,
      searchTerm,
      category,
      platform,
      family,
      targetMarket,
      lifecycle,
      status
    });
  }, []);
  
  // 监听products变化
  useEffect(() => {
    console.log('ProductList: products变化', { productsLength: products.length });
    if (products && products.length > 0) {
      // 当products加载后，立即更新filteredProducts
      const result = getFilteredProducts();
      console.log('Products加载后，更新filteredProducts:', result.length);
      setFilteredProducts(result);
    } else if (products && products.length === 0) {
      // 如果products为空数组，也要更新filteredProducts
      console.log('Products为空数组，更新filteredProducts为空数组');
      setFilteredProducts([]);
    }
  }, [products]);
  
  useEffect(() => {
    // 移除重复的筛选逻辑，统一使用getFilteredProducts函数
    if (products && Array.isArray(products)) {
      const result = getFilteredProducts();
      console.log('Filtered products count:', result.length);
      setFilteredProducts(result);
      // 当筛选条件改变时，重置到第一页
      setCurrentPage(1);
    }
  }, [searchTerm, category, platform, family, targetMarket, lifecycle, status, sortField, sortOrder, products]);
  
  // 处理排序
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  // 处理展开/收起行
  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };
  
  // 处理单个产品选择
  const handleProductSelect = (id) => {
    setSelectedProducts(prev => 
      prev.includes(id) 
        ? prev.filter(productId => productId !== id)
        : [...prev, id]
    );
  };
  
  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectAll) {
      // 取消全选
      setSelectedProducts([]);
    } else {
      // 全选
      setSelectedProducts(filteredProducts.map(product => product.id));
    }
    setSelectAll(!selectAll);
  };
  

  
  // 批量导出Excel
  const handleBatchExportExcel = () => {
    // 确定要导出的产品数据
    const productsToExport = selectedProducts.length > 0 
      ? filteredProducts.filter(p => selectedProducts.includes(p.id))
      : filteredProducts;
    
    if (productsToExport.length === 0) {
      alert("没有可导出的产品数据");
      return;
    }
    
    // 准备导出数据
    const exportData = productsToExport.map(product => ({
      '产品ID': product.id || '',
      '产品型号': product.model || '',
      '产品名称': product.name || '',
      '产品类别': product.category || '',
      '产品描述': product.description || '',
      '平台': product.platform || '',
      '产品家族': product.family || '',
      '目标市场': Array.isArray(product.targetMarket) ? product.targetMarket.join(', ') : (product.targetMarket || ''),
      '目标成本': product.targetCost || '',
      'BOM版本': product.currentBOM || '',
      '生命周期': lifecycleMap[product.lifecycle] || product.lifecycle || '',
      '发布日期': product.releaseDate || '',
      '规格': product.specs || '',
      '状态': statusMap[product.status] || product.status || '',
      '产品图片URL': product.image || '',
      '产品序列号': Array.isArray(product.serialNumbers) ? product.serialNumbers.join('; ') : (product.serialNumbers || ''),
      '创建时间': product.createdAt || '',
      '更新时间': product.updatedAt || ''
    }));
    
    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "产品数据");
    
    // 设置列宽
    const colWidths = [
      { wch: 15 }, // 产品ID
      { wch: 20 }, // 产品型号
      { wch: 30 }, // 产品名称
      { wch: 15 }, // 产品类别
      { wch: 40 }, // 产品描述
      { wch: 15 }, // 平台
      { wch: 20 }, // 产品家族
      { wch: 25 }, // 目标市场
      { wch: 15 }, // 目标成本
      { wch: 20 }, // BOM版本
      { wch: 15 }, // 生命周期
      { wch: 15 }, // 发布日期
      { wch: 40 }, // 规格
      { wch: 15 }, // 状态
      { wch: 30 }, // 产品图片URL
      { wch: 30 }, // 产品序列号
      { wch: 20 }, // 创建时间
      { wch: 20 }  // 更新时间
    ];
    ws['!cols'] = colWidths;
    
    // 生成文件名
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const fileName = `产品数据导出_${timestamp}.xlsx`;
    
    // 导出文件
    XLSX.writeFile(wb, fileName);
    
    alert(`已成功导出 ${productsToExport.length} 个产品数据到 ${fileName}`);
  };
  
  // 批量导出CSV
  const handleBatchExportCSV = () => {
    // 确定要导出的产品数据
    const productsToExport = selectedProducts.length > 0 
      ? filteredProducts.filter(p => selectedProducts.includes(p.id))
      : filteredProducts;
    
    if (productsToExport.length === 0) {
      alert("没有可导出的产品数据");
      return;
    }
    
    // 准备CSV内容
    const headers = [
      '产品ID', '产品型号', '产品名称', '产品类别', '产品描述', 
      '平台', '产品家族', '目标市场', '目标成本', 'BOM版本', 
      '生命周期', '发布日期', '规格', '状态', '产品图片URL', '产品序列号',
      '创建时间', '更新时间'
    ];
    
    // 转换数据
    const csvContent = [
      headers.join(','),
      ...productsToExport.map(product => [
        `"${product.id || ''}"`,
        `"${product.model || ''}"`,
        `"${product.name || ''}"`,
        `"${product.category || ''}"`,
        `"${(product.description || '').replace(/"/g, '""')}"`, // 转义双引号
        `"${product.platform || ''}"`,
        `"${product.family || ''}"`,
        `"${Array.isArray(product.targetMarket) ? product.targetMarket.join(', ') : (product.targetMarket || '')}"`,
        `"${product.targetCost || ''}"`,
        `"${product.currentBOM || ''}"`,
        `"${lifecycleMap[product.lifecycle] || product.lifecycle || ''}"`,
        `"${product.releaseDate || ''}"`,
        `"${(product.specs || '').replace(/"/g, '""')}"`, // 转义双引号
        `"${statusMap[product.status] || product.status || ''}"`,
        `"${product.image || ''}"`,
        `"${Array.isArray(product.serialNumbers) ? product.serialNumbers.join('; ') : (product.serialNumbers || '')}"`,
        `"${product.createdAt || ''}"`,
        `"${product.updatedAt || ''}"`
      ].join(','))
    ].join('\n');
    
    // 创建Blob并下载
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // 添加BOM以支持中文
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // 生成文件名
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `产品数据导出_${timestamp}.csv`;
      
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`已成功导出 ${productsToExport.length} 个产品数据到 ${fileName}`);
    } else {
      alert('您的浏览器不支持文件下载功能');
    }
  };
  
  // 状态映射：根据状态映射到生命周期
  const getStatusToLifecycleMapping = (status) => {
    switch(status) {
      case "draft":
        return "planning"; // 草稿映射到规划中
      case "active":
        return "development"; // 活跃映射到开发中（默认）
      case "deprecated":
        return "end_of_life"; // 已废弃映射到已停产
      default:
        return status;
    }
  };
  
  // 废弃产品
  const handleDeprecateProduct = (productId) => {
    if (window.confirm('确定要废弃此产品吗？')) {
      const updatedProducts = products.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            status: 'deprecated',
            lifecycle: 'end_of_life',
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      
      saveProducts(updatedProducts);
      alert('产品已废弃');
    }
  };
  
  // 启用产品（恢复之前的状态）
  const handleRestoreProduct = (productId) => {
    if (window.confirm('确定要启用此产品吗？')) {
      const updatedProducts = products.map(p => {
        if (p.id === productId) {
          // 从已废弃恢复到活跃，根据产品生命周期确定原来的状态
          // 如果是量产或维护期产品，恢复对应状态，否则恢复到开发中
          let originalLifecycle = 'development';
          if (p.lifecycle === 'end_of_life') {
            // 根据业务逻辑，判断原来可能是什么状态
            originalLifecycle = 'development';
          }
          
          return {
            ...p,
            status: 'active',
            lifecycle: originalLifecycle,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });
      
      saveProducts(updatedProducts);
      alert('产品已启用');
    }
  };
  

  
  // 下载CSV导入模板
  const handleDownloadCSVTemplate = () => {
    // 创建CSV模板内容
    const headers = [
      '产品ID', '产品型号', '产品名称', '产品类别', '产品描述', 
      '平台', '产品家族', '目标市场', '目标成本', 'BOM版本', 
      '生命周期', '发布日期', '规格', '状态', '产品图片URL', '产品序列号'
    ];
    
    // 示例数据
    const exampleData = [
      'P001', 'ThinkPad X1 Carbon Gen 11', 'ThinkPad X1 Carbon 第11代', 'Ultrabook', 
      '轻薄商务笔记本，采用第13代Intel处理器', 'Intel', 'ThinkPad X1', 
      'Enterprise,Business', '12999', 'BOM-TP-X1C-11', 'development', 
      '2023-06-15', '14英寸屏幕，16GB内存，512GB固态硬盘', 'draft', 
      'https://img.pconline.com.cn/images/upload/upc/tx/onlinephotolib/2501/03/c0/472340081_1735898913370.jpg', 'SN001;SN002;SN003'
    ];
    
    // 将数据转换为CSV格式
    const csvContent = [
      headers.join(','),
      exampleData.map(field => `"${field}"`).join(',')
    ].join('\n');
    
    // 创建Blob并下载
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', '产品导入模板.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // 下载Excel导入模板
  const handleDownloadExcelTemplate = () => {
    // 创建Excel模板
    const headers = [
      '产品ID', '产品型号', '产品名称', '产品类别', '产品描述', 
      '平台', '产品家族', '目标市场', '目标成本', 'BOM版本', 
      '生命周期', '发布日期', '规格', '状态', '产品图片URL', '产品序列号'
    ];
    
    // 示例数据
    const exampleData = [{
      '产品ID': 'P001',
      '产品型号': 'ThinkPad X1 Carbon Gen 11',
      '产品名称': 'ThinkPad X1 Carbon 第11代',
      '产品类别': 'Ultrabook',
      '产品描述': '轻薄商务笔记本，采用第13代Intel处理器',
      '平台': 'Intel',
      '产品家族': 'ThinkPad X1',
      '目标市场': 'Enterprise,Business',
      '目标成本': 12999,
      'BOM版本': 'BOM-TP-X1C-11',
      '生命周期': 'development',
      '发布日期': '2023-06-15',
      '规格': '14英寸屏幕，16GB内存，512GB固态硬盘',
      '状态': 'draft',
      '产品图片URL': 'https://img.pconline.com.cn/images/upload/upc/tx/onlinephotolib/2501/03/c0/472340081_1735898913370.jpg',
      '产品序列号': 'SN001;SN002;SN003'
    }];
    
    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet([headers, ...exampleData.map(row => headers.map(header => row[header] || ''))], { skipHeader: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "产品导入模板");
    
    // 设置列宽
    const colWidths = [
      { wch: 15 }, // 产品ID
      { wch: 25 }, // 产品型号
      { wch: 25 }, // 产品名称
      { wch: 15 }, // 产品类别
      { wch: 40 }, // 产品描述
      { wch: 15 }, // 平台
      { wch: 20 }, // 产品家族
      { wch: 20 }, // 目标市场
      { wch: 15 }, // 目标成本
      { wch: 20 }, // BOM版本
      { wch: 15 }, // 生命周期
      { wch: 15 }, // 发布日期
      { wch: 40 }, // 规格
      { wch: 15 }, // 状态
      { wch: 30 }, // 产品图片URL
      { wch: 30 }  // 产品序列号
    ];
    ws['!cols'] = colWidths;
    
    // 导出文件
    XLSX.writeFile(wb, '产品导入模板.xlsx');
  };
  
  // 处理文件上传
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
    }
  };
  
  // 验证导入数据
  const validateImportData = (data) => {
    const errors = [];
    
    if (!Array.isArray(data) || data.length === 0) {
      errors.push('没有找到有效的数据行');
      return errors;
    }
    
    // 检查必需字段
    data.forEach((row, index) => {
      const rowNum = index + 2; // Excel行号从2开始（第一行是标题）
      
      if (!row['产品ID'] || row['产品ID'].toString().trim() === '') {
        errors.push(`第${rowNum}行：产品ID不能为空`);
      }
      
      if (!row['产品型号'] || row['产品型号'].toString().trim() === '') {
        errors.push(`第${rowNum}行：产品型号不能为空`);
      }
      
      if (!row['产品名称'] || row['产品名称'].toString().trim() === '') {
        errors.push(`第${rowNum}行：产品名称不能为空`);
      }
      
      // 检查目标成本的格式
      if (row['目标成本'] && isNaN(parseFloat(row['目标成本']))) {
        errors.push(`第${rowNum}行：目标成本必须是数字`);
      }
    });
    
    // 检查重复的产品ID
    const ids = data.map(row => row['产品ID']).filter(id => id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`以下产品ID重复: ${duplicateIds.join(', ')}`);
    }
    
    return errors;
  };
  
  // 处理导入
  const handleImport = () => {
    if (!importFile) {
      alert('请先选择要导入的文件');
      return;
    }
    
    setImportStatus('validating');
    setImportMessage('正在验证数据...');
    
    const fileExtension = importFile.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
      // 处理CSV文件
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length < 2) {
            setImportStatus('error');
            setImportMessage('文件内容为空或格式不正确');
            return;
          }
          
          // 解析CSV
          const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, ''));
          const data = [];
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
            const row = {};
            
            headers.forEach((header, index) => {
              row[header] = values[index];
            });
            
            data.push(row);
          }
          
          processImportData(data);
        } catch (error) {
          setImportStatus('error');
          setImportMessage('文件解析失败: ' + error.message);
        }
      };
      
      reader.readAsText(importFile);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // 处理Excel文件
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const excelData = new Uint8Array(e.target.result);
          const workbook = XLSX.read(excelData, { type: 'array' });
          
          // 获取第一个工作表
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // 转换为JSON格式
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            setImportStatus('error');
            setImportMessage('文件内容为空或格式不正确');
            return;
          }
          
          // 获取表头和数据
          const headers = jsonData[0];
          const data = [];
          
          for (let i = 1; i < jsonData.length; i++) {
            if (jsonData[i].length === headers.length) {
              const row = {};
              headers.forEach((header, index) => {
                row[header] = jsonData[i][index];
              });
              data.push(row);
            }
          }
          
          processImportData(data);
        } catch (error) {
          setImportStatus('error');
          setImportMessage('Excel文件解析失败: ' + error.message);
        }
      };
      
      reader.readAsArrayBuffer(importFile);
    } else {
      setImportStatus('error');
      setImportMessage('不支持的文件格式，请上传CSV或Excel文件');
    }
  };
  
  // 处理导入数据的通用函数
  // 日期格式转换函数
  const convertDate = (dateValue) => {
    if (!dateValue) return '';
    
    console.log('转换日期:', dateValue, '类型:', typeof dateValue);
    
    // 如果已经是字符串格式（YYYY-MM-DD），直接返回
    if (typeof dateValue === 'string' && dateValue.includes('-')) {
      console.log('日期已是标准格式，直接返回:', dateValue);
      return dateValue;
    }
    
    // 如果是Excel日期序列号
    if (typeof dateValue === 'number') {
      // Excel日期从1900-01-01开始，序号1对应1900-01-01
      // Excel有一个Bug，认为1900年是闰年，所以需要减1
      let adjustedDate = dateValue;
      if (dateValue > 59) {
        adjustedDate = dateValue - 1; // 修正Excel的闰年Bug
      }
      
      // Excel基准日期是1899-12-30，序号0对应该日期
      const date = new Date(Math.round((adjustedDate - 25569) * 86400 * 1000));
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        console.log('无效的Excel日期:', dateValue);
        return String(dateValue); // 返回原始值
      }
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const result = `${year}-${month}-${day}`;
      console.log('Excel日期', dateValue, '转换为:', result);
      return result;
    }
    
    // 如果是日期对象
    if (dateValue instanceof Date) {
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // 如果是YYYY/MM/DD格式
    if (typeof dateValue === 'string' && dateValue.includes('/')) {
      const parts = dateValue.split('/');
      if (parts.length === 3) {
        const year = parts[0];
        const month = String(parts[1]).padStart(2, '0');
        const day = String(parts[2]).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    
    // 如果是YYYYMMDD格式
    if (typeof dateValue === 'string' && /^\d{8}$/.test(dateValue)) {
      const year = dateValue.substring(0, 4);
      const month = dateValue.substring(4, 6);
      const day = dateValue.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    
    // 尝试解析为日期
    const parsedDate = new Date(dateValue);
    if (!isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    console.log('无法解析的日期格式:', dateValue);
    return String(dateValue); // 返回原始值
  };

  const processImportData = (data) => {
    try {
      // 验证数据
      const errors = validateImportData(data);
      
      if (errors.length > 0) {
        setImportStatus('error');
        setImportMessage('数据验证失败:<br/>' + errors.join('<br/>'));
        return;
      }
      
      // 获取当前时间戳
      const currentTimestamp = new Date().toISOString();
      
      // 转换数据格式
      const newProducts = data.map(row => ({
        id: row['产品ID'],
        model: row['产品型号'],
        name: row['产品名称'],
        category: row['产品类别'],
        image: row['产品图片URL'] || `https://img.pconline.com.cn/images/upload/upc/tx/onlinephotolib/2501/03/c0/472340081_1735898913370.jpg`,
        description: row['产品描述'] || '',
        platform: row['平台'],
        family: row['产品家族'],
        targetMarket: row['目标市场'] ? row['目标市场'].split(',').map(m => m.trim()).filter(m => m) : [], // 分割目标市场为数组
        targetCost: parseFloat(row['目标成本']) || 0,
        currentBOM: row['当前BOM'] || '',
        lifecycle: row['生命周期'],
        releaseDate: convertDate(row['发布日期']), // 转换日期格式
        specs: row['规格'] || '',
        status: row['状态'] || 'draft',
        serialNumbers: row['产品序列号'] ? row['产品序列号'].split(';').map(s => s.trim()).filter(s => s) : [], // 分割序列号
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp
      }));
      
      // 使用ProductContext导入产品
      const updatedProducts = importProducts(newProducts);
      
      // 模拟导入过程UI反馈
      setTimeout(() => {
        setImportStatus('success');
        if (importMode === 'replace') {
          setImportMessage(`成功导入 ${newProducts.length} 个产品，替换了所有现有数据`);
        } else {
          const duplicateCount = newProducts.length - (updatedProducts.length - products.length);
          if (duplicateCount > 0) {
            setImportMessage(`成功导入 ${updatedProducts.length - products.length} 个产品，跳过了 ${duplicateCount} 个重复产品`);
          } else {
            setImportMessage(`成功导入 ${updatedProducts.length - products.length} 个产品`);
          }
        }
        
        // 2秒后关闭弹窗
        setTimeout(() => {
          closeImportModal();
        }, 2000);
      }, 500);
    } catch (error) {
      setImportStatus('error');
      setImportMessage('数据处理失败: ' + error.message);
    }
  };
  
  // 关闭导入弹窗
  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportStatus('');
    setImportMessage('');
    setImportMode('merge');
    setShowImportOptions(false);
  };

  // 获取当前页显示的产品数据
  const getCurrentPageProducts = () => {
    // 使用状态中的filteredProducts，而不是重新计算
    if (!filteredProducts || !Array.isArray(filteredProducts)) {
      return [];
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  };
  
  // 使用useMemo优化displayProducts的计算
  const displayProducts = React.useMemo(() => {
    console.log('计算displayProducts:', {
      currentPage,
      itemsPerPage,
      filteredProductsLength: filteredProducts ? filteredProducts.length : 'filteredProducts is null/undefined',
      filterParams: { searchTerm, category, platform, family, targetMarket, lifecycle, status },
      sortParams: { sortField, sortOrder }
    });
    const result = getCurrentPageProducts();
    console.log('displayProducts计算结果:', result.length);
    return result;
  }, [filteredProducts, currentPage, itemsPerPage, searchTerm, category, platform, family, targetMarket, lifecycle, status, sortField, sortOrder]);
  
  // 计算总页数
  const getTotalPages = () => {
    // 使用状态中的filteredProducts，而不是重新计算
    if (!filteredProducts || !Array.isArray(filteredProducts)) {
      return 0;
    }
    return Math.ceil(filteredProducts.length / itemsPerPage);
  };

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="px-4 py-8 flex justify-center items-center" style={{ width: '100%', minWidth: '1400px', height: '500px' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">正在加载产品数据...</p>
        </div>
      </div>
    );
  }
  
  // 调试日志
  if (process.env.NODE_ENV !== 'production') {
    console.log('渲染前状态:', {
      displayProductsLength: displayProducts.length,
      isLoading,
      productsLength: products ? products.length : 'products is null/undefined',
      filteredProductsCount: filteredProducts.length,
      currentPage,
      searchTerm,
      category,
      platform,
      family,
      targetMarket,
      lifecycle,
      status
    });
  }

  return (
    <div className="px-4 py-8" style={{ width: '100%', minWidth: '1600px' }}>
      {/* 标题和操作按钮 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">产品库</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            <Upload size={18} />
            <span>导入产品</span>
          </button>
          
          {/* 批量导出下拉菜单 */}
          <div className="relative inline-block">
            <button 
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
              onClick={() => setShowExportOptions(!showExportOptions)}
            >
              <Download size={18} />
              <span>批量导出</span>
              <ChevronDown size={16} />
            </button>
            
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleBatchExportExcel();
                      setShowExportOptions(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    导出为Excel
                  </button>
                  <button
                    onClick={() => {
                      handleBatchExportCSV();
                      setShowExportOptions(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    导出为CSV
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => navigate('/products/create')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>新增产品</span>
          </button>
        </div>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="relative bg-white shadow-sm border border-gray-200 rounded-lg p-4 mb-6" style={{ borderRadius: '8px', width: '100%', height: '91px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '16px', color: '#000000' }}>
        {/* 搜索栏 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="搜索产品型号、名称或ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              showFilters 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            <span>筛选</span>
          </button>
        </div>
        
        {/* 筛选选项 */}
        {showFilters && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 mt-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">产品类别</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categoryOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">平台</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                {platformOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">产品家族</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={family}
                onChange={(e) => setFamily(e.target.value)}
              >
                {familyOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标市场</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
              >
                {targetMarketOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生命周期</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={lifecycle}
                onChange={(e) => setLifecycle(e.target.value)}
              >
                {lifecycleOptions.map(opt => (
                  <option key={opt} value={opt}>{lifecycleMap[opt] || opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setCategory("全部");
                  setPlatform("全部");
                  setFamily("全部");
                  setTargetMarket("全部");
                  setLifecycle("全部");
                  setStatus("全部");
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors w-full"
              >
                清除筛选
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 批量操作栏 */}
      {selectedProducts.length > 0 && (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            已选择 <span className="font-medium">{selectedProducts.length}</span> 项
          </div>
        </div>
      )}

      {/* 数据表格 */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ maxWidth: '100%', overflowX: 'scroll' }}>
          <table className="min-w-full divide-y divide-gray-200" style={{ width: '100%', minWidth: '1800px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-center" style={{ width: '210px' }}>产品图片</th>
                <th className="px-4 py-3 text-left">
                  <button
                    className="flex items-center font-medium text-gray-700 hover:text-blue-600"
                    onClick={() => handleSort('model')}
                  >
                    产品型号
                    {sortField === 'model' && (
                      sortOrder === 'asc' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    className="flex items-center font-medium text-gray-700 hover:text-blue-600"
                    onClick={() => handleSort('id')}
                  >
                    产品ID
                    {sortField === 'id' && (
                      sortOrder === 'asc' ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">产品序列号</th>
                <th className="px-4 py-3 text-left">产品名称</th>
                <th className="px-4 py-3 text-left">产品类别</th>
                <th className="px-4 py-3 text-left">平台</th>
                <th className="px-4 py-3 text-left">产品家族</th>
                <th className="px-4 py-3 text-left">目标市场</th>
                <th className="px-4 py-3 text-left">目标成本</th>
                <th className="px-4 py-3 text-left">BOM版本</th>
                <th className="px-4 py-3 text-left">生命周期</th>
                <th className="px-4 py-3 text-left">发布日期</th>
                <th className="px-4 py-3 text-left">规格</th>
                <th className="px-4 py-3 text-left">更新时间</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayProducts && displayProducts.length > 0 ? (
                displayProducts.map(product => (
                  <React.Fragment key={product.id}>
                    <tr className={`hover:bg-gray-50 ${product.status === 'deprecated' ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleProductSelect(product.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <img 
                          src={product.image || ''} 
                          alt={product.name} 
                          className="h-32 w-32 object-cover rounded-md"
                          style={{ height: '128px', width: '128px', objectFit: 'cover' }}
                          onError={(e) => {
                            // 使用占位图片或SVG图标代替加载失败的图片
                            e.target.outerHTML = `<svg class="h-32 w-32 object-cover rounded-md bg-gray-100 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>`;
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.model}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {Array.isArray(product.serialNumbers) && product.serialNumbers.length > 0 
                          ? product.serialNumbers.slice(0, 2).join(', ') + (product.serialNumbers.length > 2 ? '...' : '')
                          : '暂无序列号'
                        }
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.category}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.platform}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.family}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {Array.isArray(product.targetMarket) ? product.targetMarket.join(', ') : product.targetMarket}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">¥{product.targetCost}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.currentBOM}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${lifecycleColorMap[product.lifecycle] || 'bg-gray-100 text-gray-800'}`}>
                          {lifecycleMap[product.lifecycle] || product.lifecycle}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.releaseDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <button
                          onClick={() => toggleRowExpansion(product.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          查看详情
                          {expandedRows.includes(product.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {product.updatedAt ? new Date(product.updatedAt).toLocaleString('zh-CN') : '未知'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColorMap[product.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusMap[product.status] || product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                            title="查看详情"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/products/${product.id}/edit`)}
                            className="text-green-600 hover:text-green-800"
                            title="编辑产品"
                          >
                            <Edit size={16} />
                          </button>
                          
                          {/* 根据状态显示不同的操作按钮 */}
                          {product.status === 'deprecated' ? (
                            // 已废弃状态只显示启用按钮，且整行置灰
                            <>
                              <button
                                onClick={() => handleRestoreProduct(product.id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="启用产品"
                              >
                                <Power size={16} />
                              </button>
                            </>
                          ) : (
                            // 其他状态根据生命周期判断是否可以废弃
                            <>
                              {/* 量产且活跃或维护期且活跃的产品不能废弃 */}
                              {(product.lifecycle === 'production' && product.status === 'active') || 
                               (product.lifecycle === 'sustaining' && product.status === 'active') ? (
                                /* 不显示废弃按钮 */
                                <></>
                              ) : (
                                <button
                                  onClick={() => handleDeprecateProduct(product.id)}
                                  className="text-orange-600 hover:text-orange-800"
                                  title="废弃产品"
                                >
                                  <RotateCcw size={16} />
                                </button>
                              )}

                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* 展开行显示详细信息 */}
                    {expandedRows.includes(product.id) && (
                      <tr>
                        <td colSpan="19" className="px-4 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">产品规格</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.specs || '暂无规格信息'}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">产品描述</h4>
                              <p className="text-sm text-gray-600">{product.description || '暂无描述信息'}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">产品序列号</h4>
                              <p className="text-sm text-gray-600">
                                {Array.isArray(product.serialNumbers) && product.serialNumbers.length > 0 
                                  ? product.serialNumbers.join(', ')
                                  : '暂无序列号信息'
                                }
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">更新信息</h4>
                              <p className="text-sm text-gray-600">
                                创建时间: {product.createdAt ? new Date(product.createdAt).toLocaleString('zh-CN') : '未知'}<br />
                                更新时间: {product.updatedAt ? new Date(product.updatedAt).toLocaleString('zh-CN') : '未知'}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan="19" className="px-4 py-8 text-center text-gray-500">
                    {isLoading ? (
                      '正在加载产品数据...'
                    ) : (!products || products.length === 0) ? (
                      '暂无产品数据'
                    ) : (!filteredProducts || filteredProducts.length === 0) ? (
                      '没有找到符合条件的产品'
                    ) : (
                      '当前页没有产品数据'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页控件 */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4 mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          显示第 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, (filteredProducts && filteredProducts.length) || 0)} 项，共 {(filteredProducts && filteredProducts.length) || 0} 项
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            首页
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            上一页
          </button>
          
          {/* 页码显示逻辑 */}
          {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map(page => {
            // 只显示当前页附近的页码
            if (
              page === 1 || 
              page === getTotalPages() || 
              (page >= currentPage - 2 && page <= currentPage + 2)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              );
            } else if (
              page === currentPage - 3 || 
              page === currentPage + 3
            ) {
              return <span key={page} className="px-2">...</span>;
            }
            return null;
          })}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(getTotalPages(), prev + 1))}
            disabled={currentPage === getTotalPages()}
            className={`px-3 py-1 rounded ${currentPage === getTotalPages() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            下一页
          </button>
          <button
            onClick={() => setCurrentPage(getTotalPages())}
            disabled={currentPage === getTotalPages()}
            className={`px-3 py-1 rounded ${currentPage === getTotalPages() ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            末页
          </button>
        </div>
      </div>

      {/* 导入产品弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={closeImportModal}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">导入产品数据</h3>
                    
                    {/* 导入模式选择 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">导入模式</label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="importMode"
                            value="merge"
                            checked={importMode === 'merge'}
                            onChange={(e) => setImportMode(e.target.value)}
                            className="mr-2"
                          />
                          <span>合并导入（保留现有数据，添加新产品）</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="importMode"
                            value="replace"
                            checked={importMode === 'replace'}
                            onChange={(e) => setImportMode(e.target.value)}
                            className="mr-2"
                          />
                          <span>替换导入（清空现有数据，导入新产品）</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* 文件上传区域 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">选择文件</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                        <div className="space-y-1 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                              <span>上传文件</span>
                              <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                            </label>
                            <p className="pl-1">或拖拽文件到此处</p>
                          </div>
                          <p className="text-xs text-gray-500">支持CSV, XLSX格式</p>
                        </div>
                      </div>
                      
                      {/* 已选择的文件显示 */}
                      {importFile && (
                        <div className="mt-2 text-sm text-gray-600">
                          已选择: <span className="font-medium">{importFile.name}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 下载模板链接 */}
                    <div className="mb-4 flex justify-center space-x-4">
                      <button
                        type="button"
                        onClick={handleDownloadCSVTemplate}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Download size={16} className="mr-2" />
                        下载CSV模板
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadExcelTemplate}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Download size={16} className="mr-2" />
                        下载Excel模板
                      </button>
                    </div>
                    
                    {/* 导入状态提示 */}
                    {importStatus && (
                      <div className={`mb-4 p-3 rounded-md text-sm ${
                        importStatus === 'success' ? 'bg-green-50 text-green-800' :
                        importStatus === 'error' ? 'bg-red-50 text-red-800' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        {importStatus === 'validating' ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            正在验证数据...
                          </div>
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: importMessage }} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={!importFile || importStatus === 'validating'}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {importStatus === 'validating' ? '验证中...' : '导入数据'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeImportModal}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      

    </div>
  );
};

export default ProductList;