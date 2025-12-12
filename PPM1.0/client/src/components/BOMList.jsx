import React, { useState, useMemo } from 'react';

// Icons
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BatchDeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <line x1="8" y1="12" x2="16" y2="12" strokeWidth="2" />
  </svg>
);

const PushIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const PushedIcon = () => (
  <svg className="w-4 h-4" fill="red" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const RevokedIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// 生成BOM ID的函数 - BOM + 4位数字
const generateBOMId = (bomId) => {
  if (bomId && bomId.startsWith('BOM')) {
    return bomId; // 如果已经是BOM格式，直接返回
  }
  
  // 生成新的BOM ID：BOM + 4位数字
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `BOM${randomNum}`;
};

// 生成Part ID的函数 - 基于Part Name缩写+数字编号4位
const generatePartId = (partName, position, index = 0) => {
  // 使用Position作为Part Name，如果没有则使用partName
  const actualPartName = position || partName || 'Unknown';
  
  // Part Name缩写映射表（与pushBOMsToParts.js保持一致）
  const abbreviationMap = {
    '电阻': 'RES',
    '电容': 'CAP',
    '传感器': 'SEN',
    '连接器': 'CON',
    '晶体管': 'TRA',
    'IC': 'IC',
    '电感': 'IND',
    '二极管': 'DIO',
    '振荡器': 'OSC',
    '变压器': 'TRA',
    'power supply': 'PS',
    'cpu': 'CPU',
    'memory': 'MEM',
    'storage': 'STR',
    'motherboard': 'MB',
    'gpu': 'GPU',
    'case': 'CAS',
    'cooling': 'COO',
    'display': 'DIS',
    'keyboard': 'KB',
    'mouse': 'MOU',
    'signal processing': 'SP',
    'control circuit': 'CC',
    'interface': 'INT',
    'sensor': 'SEN',
    'oscillator': 'OSC',
    'filter': 'FIL'
  };

  // 查找匹配的关键词
  let abbreviation = 'PAR';
  for (const [keyword, abbr] of Object.entries(abbreviationMap)) {
    if (actualPartName && actualPartName.toLowerCase().includes(keyword.toLowerCase())) {
      abbreviation = abbr;
      break;
    }
  }

  // 生成4位数字编号，从0001开始
  const number = (index + 1).toString().padStart(4, '0');
  
  return `${abbreviation}${number}`;
};

// 分析Part Name的函数 - 正确显示Part信息
const analyzePartName = (part, bom) => {
  // 优先显示Part的实际名称
  if (part.part_id?.name) return part.part_id.name;
  if (part.name) return part.name;
  if (part.part_name) return part.part_name;
  
  // 其次使用Position作为Part Name
  if (part.position && part.position !== 'N/A') {
    return part.position;
  }
  
  // 当Part Name为N/A时，根据BOM信息推断
  if (bom && bom.bom_name) {
    // 从BOM Name中提取关键信息作为Part Name
    const bomName = bom.bom_name;
    
    // 移除常见的BOM后缀
    let inferredName = bomName
      .replace(/BOM$/i, '')
      .replace(/Bill of Materials$/i, '')
      .replace(/物料清单$/i, '')
      .trim();
    
    return inferredName || 'N/A';
  }
  
  return 'N/A';
};

const BOMList = ({ boms, onEdit, onDelete, onBatchDelete, onPush }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBOMs, setSelectedBOMs] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showBatchDelete, setShowBatchDelete] = useState(false);
  const [individualDeleteBOM, setIndividualDeleteBOM] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' });

  const [showPushConfirm, setShowPushConfirm] = useState(false);
  const [currentPushBOM, setCurrentPushBOM] = useState(null);
  const itemsPerPage = 20;

  // 排序函数
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 排序数据
  const sortedBOMs = useMemo(() => {
    if (!sortConfig.key) return boms;
    
    // 特殊处理status字段的排序
    if (sortConfig.key === 'status') {
      const statusOrder = { 'active': 1, 'draft': 2, 'inactive': 3, 'discarded': 3 };
      
      return [...boms].sort((a, b) => {
        const aOrder = statusOrder[a.status] || 5;
        const bOrder = statusOrder[b.status] || 5;
        
        if (aOrder < bOrder) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aOrder > bOrder) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    // 其他字段的默认排序
    return [...boms].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [boms, sortConfig]);

  // 生成搜索建议
  const generateSearchSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const suggestions = [];
    
    // 从BOM ID中提取建议
    boms.forEach(bom => {
      if (bom.bom_id?.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.push({
          type: 'BOM ID',
          value: bom.bom_id,
          display: `BOM ID: ${bom.bom_id}`
        });
      }
      
      if (bom.bom_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.push({
          type: 'BOM Name',
          value: bom.bom_name,
          display: `BOM Name: ${bom.bom_name}`
        });
      }
    });
    
    // 去重
    return suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.value === suggestion.value && s.type === suggestion.type)
    ).slice(0, 5); // 最多显示5个建议
  }, [boms, searchTerm]);

  // 过滤BOM数据
  const filteredBOMs = useMemo(() => {
    if (!searchTerm.trim()) return sortedBOMs;
    
    return sortedBOMs.filter(bom => 
      bom.bom_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bom.bom_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedBOMs, searchTerm]);

  // 分页数据
  const paginatedBOMs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBOMs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBOMs, currentPage]);

  // 总页数
  const totalPages = Math.ceil(filteredBOMs.length / itemsPerPage);

  // 切换BOM选择状态
  const toggleBOMSelection = (bomId) => {
    setSelectedBOMs(prev => {
      let newSelected;
      if (prev.includes(bomId)) {
        newSelected = prev.filter(id => id !== bomId);
      } else {
        newSelected = [...prev, bomId];
      }
      
      // 检查是否需要显示批量删除图标
      setShowBatchDelete(newSelected.length > 0);
      
      return newSelected;
    });
  };

  // 处理搜索输入变化
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // 搜索时重置到第一页
    
    // 显示/隐藏建议框
    if (value.trim() && generateSearchSuggestions.length > 0) {
      setShowSuggestions(true);
      setSearchSuggestions(generateSearchSuggestions);
    } else {
      setShowSuggestions(false);
      setSearchSuggestions([]);
    }
  };

  // 选择搜索建议
  const selectSuggestion = (suggestion) => {
    setSearchTerm(suggestion.value);
    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedBOMs.length === paginatedBOMs.length) {
      setSelectedBOMs([]);
      setShowBatchDelete(false);
    } else {
      setSelectedBOMs(paginatedBOMs.map(bom => bom._id));
      setShowBatchDelete(paginatedBOMs.length > 0);
    }
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedBOMs.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedBOMs.length} BOM(s)?`)) {
      // 调用父组件的批量删除函数
      onBatchDelete(selectedBOMs);
      // 立即清空选中列表
      setSelectedBOMs([]);
      setShowBatchDelete(false);
    }
  };

  // 单个删除
  const handleIndividualDelete = (bomId) => {
    if (window.confirm('Are you sure you want to delete this BOM? This action cannot be undone.')) {
      onDelete(bomId);
      // 同时从选中列表中移除
      setSelectedBOMs(prev => prev.filter(id => id !== bomId));
    }
  };

  // 显示/隐藏单个删除图标
  const toggleIndividualDeleteIcon = (bomId) => {
    setIndividualDeleteBOM(prev => prev === bomId ? null : bomId);
  };

  // 确认单个删除（保留函数，但不再使用）
  const confirmIndividualDelete = () => {
    if (individualDeleteBOM) {
      onDelete(individualDeleteBOM);
      setIndividualDeleteBOM(null);
      // 同时从选中列表中移除
      setSelectedBOMs(prev => prev.filter(id => id !== individualDeleteBOM));
    }
  };

  // 取消单个删除（保留函数，但不再使用）
  const cancelIndividualDelete = () => {
    setIndividualDeleteBOM(null);
  };

  // 处理Push按钮点击
  const handlePushClick = async (bomId, currentStatus) => {
    // 只能从push状态推送到pushed状态，不能手动从pushed状态回到push状态
    if (currentStatus === 'pushed') {
      alert('BOM已推送到Parts，状态不能手动回退。如需回退，请在Parts模块删除对应的Part数据。');
      return;
    }
    
    // 推送操作（从push状态到pushed状态）
    const apiEndpoint = '/api/v1/push/push-boms-to-parts';
    const requestBody = { bomIds: [bomId], targetStatus: 'pushed' };
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        
        // 重新加载BOMs数据以获取最新的push_status
        window.location.reload();
      } else {
        throw new Error('操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      alert('操作失败: ' + error.message);
    }
  };

  // 确认推送
  const confirmPush = () => {
    if (currentPushBOM) {
      // 更新推送状态为pushed

      
      // 调用父组件的onPush函数
      onPush(currentPushBOM);
      
      // 关闭确认对话框
      setShowPushConfirm(false);
      setCurrentPushBOM(null);
    }
  };

  // 取消推送操作
  const cancelPush = () => {
    setShowPushConfirm(false);
    setCurrentPushBOM(null);
  };

  // 生成页码按钮
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 添加第一页按钮
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className="px-3 py-1 mx-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis-start" className="px-2 text-gray-500">
            ...
          </span>
        );
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 mx-1 rounded ${
            i === currentPage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // 添加最后一页按钮
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis-end" className="px-2 text-gray-500">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className="px-3 py-1 mx-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          {totalPages}
        </button>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center mt-4 space-y-3">
        <div className="flex items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 mx-1 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
            &laquo; Previous
          </button>
          
          {pages}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 mx-1 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
            Next &raquo;
          </button>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <span className="text-gray-500">
            {filteredBOMs.length} items total
          </span>
          <span className="text-gray-500">
            Showing {Math.min(itemsPerPage, paginatedBOMs.length)} items per page
          </span>
        </div>
        
        {/* 快速跳转 */}
        {totalPages > 10 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Go to page:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bom-list">
      {/* 搜索和批量操作工具栏 */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
          {/* 搜索框 */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search by BOM ID or Name..."
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchTerm.trim() && searchSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // 延迟隐藏下拉框，以便点击选项
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* 搜索建议下拉框 */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 cursor-pointer hover:bg-blue-100 border-b border-gray-100 last:border-b-0"
                    onClick={() => selectSuggestion(suggestion)}
                    onMouseDown={(e) => e.preventDefault()} // 防止onBlur触发
                  >
                    <div className="text-sm font-medium text-gray-800">{suggestion.display}</div>
                    <div className="text-xs text-gray-500">{suggestion.type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 批量操作 */}
          <div className="flex items-center space-x-3">
            {showBatchDelete && (
              <button
                onClick={handleBatchDelete}
                className="bg-red-500 hover:bg-red-700 text-white font-medium py-2 px-4 rounded flex items-center space-x-2"
                title="批量删除选中的BOM"
              >
                <BatchDeleteIcon />
                <span>批量删除 ({selectedBOMs.length})</span>
              </button>
            )}
            <span className="text-sm text-gray-600">
              {selectedBOMs.length} selected
            </span>
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto bg-white rounded-lg shadow w-full">
        <table className="min-w-full" style={{ width: '120%' }}>
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-4 border-b text-left w-12">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedBOMs.length === paginatedBOMs.length && paginatedBOMs.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </th>
              <th className="py-3 px-4 border-b text-left">BOM ID</th>
              <th className="py-3 px-4 border-b text-left">BOM Name</th>
              <th className="py-3 px-4 border-b text-left">Part ID</th>
              <th className="py-3 px-4 border-b text-left">Part Name</th>
              <th className="py-3 px-4 border-b text-left">Quantity</th>
              <th className="py-3 px-4 border-b text-left">Position</th>
              <th className="py-3 px-4 border-b text-left">Product ID</th>
              <th className="py-3 px-4 border-b text-left">Product Name</th>
              <th className="py-3 px-4 border-b text-left">Version</th>
              <th className="py-3 px-4 border-b text-left">Product Line</th>
              <th className="py-3 px-4 border-b text-left cursor-pointer" onClick={() => handleSort('status')}>
                Status
                <span className="ml-1 inline-flex flex-col">
                  <svg className={`w-2 h-2 ${sortConfig.key === 'status' && sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  <svg className={`w-2 h-2 ${sortConfig.key === 'status' && sortConfig.direction === 'desc' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </th>
              <th className="py-3 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBOMs.map((bom) => {
              const isSelected = selectedBOMs.includes(bom._id);
              
              // 如果BOM没有parts，显示一行基本信息
              if (!bom.parts || bom.parts.length === 0) {
                return (
                  <tr key={bom._id} className={isSelected ? 'bg-blue-50' : ''}>
                    <td className="py-2 px-4 border-b">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            toggleBOMSelection(bom._id);
                            toggleIndividualDeleteIcon(bom._id);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        {isSelected && (
                          <button
                            onClick={() => handleIndividualDelete(bom._id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            title="删除此BOM"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b">{generateBOMId(bom.bom_name, bom.bom_id)}</td>
                    <td className="py-2 px-4 border-b">{bom.bom_name}</td>
                    <td className="py-2 px-4 border-b text-center" colSpan="3">No Parts</td>
                    <td className="py-2 px-4 border-b">{bom.product_id?.product_id || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{bom.product_id?.model || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{bom.version}</td>
                    <td className="py-2 px-4 border-b">{bom.product_line}</td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex flex-col">
                        <span>{bom.status === 'discarded' ? 'Inactive' : bom.status.charAt(0).toUpperCase() + bom.status.slice(1)}</span>
                        {bom.push_status === 'pushed' && (
                          <span className="text-xs text-green-600">(Pushed)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onEdit(bom)}
                          className="bg-blue-400 hover:bg-blue-600 text-white font-medium py-1.5 px-3 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handlePushClick(bom.bom_id, bom.push_status)}
                          disabled={bom.status !== 'active' || bom.push_status === 'pushed'}
                          className={`font-medium py-1.5 px-3 rounded text-sm flex items-center space-x-1 ${
                            bom.status === 'active' && bom.push_status !== 'pushed'
                              ? 'bg-white border border-gray-300 text-black hover:bg-gray-100'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          title={
                            bom.status !== 'active' 
                              ? 'Only Active BOMs can be pushed' 
                              : bom.push_status === 'pushed' 
                                ? 'BOM已推送到Parts，状态不能手动回退' 
                                : 'Push to Parts'
                          }
                        >
                          {bom.push_status === 'pushed' ? (
                            <>
                              <div 
                                className="cursor-not-allowed"
                                title="BOM已推送到Parts，状态不能手动回退"
                              >
                                <PushedIcon />
                              </div>
                              <span>Pushed</span>
                            </>
                          ) : (
                            <>
                              <PushIcon />
                              <span>Push</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
              
              // 如果BOM有parts，为每个part创建一行
              return bom.parts.map((part, partIndex) => (
                <tr key={`${bom._id}-${partIndex}`} className={isSelected ? 'bg-blue-50' : ''}>
                  {partIndex === 0 ? (
                    <>
                      <td className="py-2 px-4 border-b" rowSpan={bom.parts.length}>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              toggleBOMSelection(bom._id);
                              toggleIndividualDeleteIcon(bom._id);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          {isSelected && (
                            <button
                              onClick={() => handleIndividualDelete(bom._id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="删除此BOM"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4 border-b" rowSpan={bom.parts.length}>
                        {generateBOMId(bom.bom_name, bom.bom_id)}
                      </td>
                      <td className="py-2 px-4 border-b" rowSpan={bom.parts.length}>
                        {bom.bom_name}
                      </td>
                    </>
                  ) : null}
                  <td className="py-2 px-4 border-b">{generatePartId(part.part_id?.name || part.name, part.position, partIndex)}</td>
                  <td className="py-2 px-4 border-b">{analyzePartName(part, bom)}</td>
                  <td className="py-2 px-4 border-b">{part.quantity}</td>
                  <td className="py-2 px-4 border-b">{part.position || 'N/A'}</td>
                  {partIndex === 0 ? (
                    <>
                      <td className="py-2 px-4 border-b" rowSpan={bom.parts.length}>
                        {bom.product_id?.product_id || 'N/A'}
                      </td>
                      <td className="py-2 px-4 border-b" rowSpan={bom.parts.length}>
                        {bom.product_id?.model || 'N/A'}
                      </td>
                      <td className="py-2 px-4 border-b" rowSpan={bom.parts.length}>
                        {bom.version}
                      </td>
                      <td className="py-2 px-4 border-b" rowSpan={bom.parts.length}>
                        {bom.product_line}
                      </td>
                      <td className="py-2 px-4 border-b" rowSpan={bom.parts.length}>
                        <div className="flex flex-col">
                          <span>{bom.status === 'discarded' ? 'Inactive' : bom.status.charAt(0).toUpperCase() + bom.status.slice(1)}</span>
                          {bom.push_status === 'pushed' && (
                            <span className="text-xs text-green-600">(Pushed)</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4 border-b" rowSpan={bom.parts.length}>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onEdit(bom)}
                            className="bg-blue-400 hover:bg-blue-600 text-white font-medium py-1.5 px-3 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handlePushClick(bom.bom_id, bom.push_status)}
                            disabled={bom.status !== 'active' || bom.push_status === 'pushed'}
                            className={`font-medium py-1.5 px-3 rounded text-sm flex items-center space-x-1 ${
                              bom.status === 'active' && bom.push_status !== 'pushed'
                                ? 'bg-white border border-gray-300 text-black hover:bg-gray-100'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            title={
                              bom.status !== 'active' 
                                ? 'Only Active BOMs can be pushed' 
                                : bom.push_status === 'pushed' 
                                  ? 'BOM已推送到Parts，状态不能手动回退' 
                                  : 'Push to Parts'
                            }
                          >
                            {bom.push_status === 'pushed' ? (
                              <>
                                <div 
                                  className="cursor-not-allowed"
                                  title="BOM已推送到Parts，状态不能手动回退"
                                >
                                  <PushedIcon />
                                </div>
                                <span>Pushed</span>
                              </>
                            ) : (
                              <>
                                <PushIcon />
                                <span>Push</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </>
                  ) : null}
                </tr>
              ));
            })}
          </tbody>
        </table>
        
        {/* 分页 */}
        {totalPages > 1 && renderPagination()}
      </div>

      {/* Push确认对话框 */}
      {showPushConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认推送</h3>
            <p className="text-gray-600 mb-6">
              您确定要将此BOM推送到Parts吗？推送后BOM将同步到Parts模块。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelPush}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmPush}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                确认推送
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BOMList;