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



const PartList = ({ parts, onEdit, onDelete, onBatchDelete, onDeleteAll, loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedParts, setSelectedParts] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [individualDeletePart, setIndividualDeletePart] = useState(null);
  
  // 只有当有零件数据且不在加载状态时才显示清空按钮
  const showDeleteAllButton = parts.length > 0 && !loading;

  const [sortConfig, setSortConfig] = useState({ key: 'status', direction: 'asc' });
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
  const sortedParts = useMemo(() => {
    if (!sortConfig.key) return parts;
    
    // 特殊处理status字段的排序
    if (sortConfig.key === 'status') {
      const statusOrder = { 'active': 1, 'draft': 2, 'inactive': 3, 'discarded': 4 };
      
      return [...parts].sort((a, b) => {
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
    return [...parts].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [parts, sortConfig]);

  // 生成搜索建议
  const generateSearchSuggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const suggestions = [];
    
    // 从Part ID中提取建议
    parts.forEach(part => {
      if (part.part_id?.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.push({
          type: 'Part ID',
          value: part.part_id,
          display: `Part ID: ${part.part_id}`
        });
      }
      
      if (part.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        suggestions.push({
          type: 'Part Name',
          value: part.name,
          display: `Part Name: ${part.name}`
        });
      }
    });
    
    // 去重
    return suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.value === suggestion.value && s.type === suggestion.type)
    ).slice(0, 5); // 最多显示5个建议
  }, [parts, searchTerm]);

  // 过滤Part数据
  const filteredParts = useMemo(() => {
    if (!searchTerm.trim()) return sortedParts;
    
    return sortedParts.filter(part => 
      part.part_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedParts, searchTerm]);

  // 分页数据
  const paginatedParts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredParts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredParts, currentPage]);

  // 总页数
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);

  // 切换Part选择状态
  const togglePartSelection = (partId) => {
    setSelectedParts(prev => {
      let newSelected;
      if (prev.includes(partId)) {
        newSelected = prev.filter(id => id !== partId);
      } else {
        newSelected = [...prev, partId];
      }
      
      return newSelected;
    });
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedParts.length === 0) return;
    
    // 直接弹出批量删除确认对话框
    setIndividualDeletePart('batch');
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
    if (selectedParts.length === paginatedParts.length) {
      setSelectedParts([]);
    } else {
      setSelectedParts(paginatedParts.map(part => part._id));
    }
  };

  // 单个删除
  const handleIndividualDelete = (partId) => {
    setIndividualDeletePart(partId);
  };

  // 确认单个删除
  const confirmIndividualDelete = () => {
    if (individualDeletePart) {
      onDelete(individualDeletePart);
      setIndividualDeletePart(null);
    }
  };

  // 取消单个删除
  const cancelIndividualDelete = () => {
    setIndividualDeletePart(null);
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
            {filteredParts.length} items total
          </span>
          <span className="text-gray-500">
            Showing {Math.min(itemsPerPage, paginatedParts.length)} items per page
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
    <div className="part-list">
                </span>
              </th>
              <th className="py-3 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedParts.map((part) => {
              const isSelected = selectedParts.includes(part._id);
              
              return (
                <tr key={part._id} className={isSelected ? 'bg-blue-50' : ''}>
                  <td className="py-2 px-4 border-b">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePartSelection(part._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      {isSelected && (
                        <button
                          onClick={() => handleIndividualDelete(part._id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="删除此Part"
                        >
                          <BatchDeleteIcon />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-4 border-b font-mono text-sm">{part.part_id}</td>
                  <td className="py-2 px-4 border-b font-medium">{part.name}</td>
                  <td className="py-2 px-4 border-b font-medium text-center">{part.quantity || 1}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded text-xs ${
                      part.position === 'Top Side' ? 'bg-blue-100 text-blue-800' :
                      part.position === 'Bottom Side' ? 'bg-purple-100 text-purple-800' :
                      part.position === 'Internal' ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {part.position || 'Top Side'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">{part.product_id || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{part.product_name || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{part.spec}</td>
                  <td className="py-2 px-4 border-b">
                    {part.vendor && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {part.vendor}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {part.category}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">{part.version || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">{part.product_line || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">
                    <span className={`px-2 py-1 rounded text-xs ${
                      part.status === 'active' ? 'bg-green-100 text-green-800' :
                      part.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {part.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => onEdit(part)}
                      className="bg-blue-400 hover:bg-blue-600 text-white font-medium py-1.5 px-3 rounded text-sm"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* 分页 */}
        {totalPages > 1 && renderPagination()}
      </div>

      {/* 删除确认对话框 */}
      {individualDeletePart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {individualDeletePart === 'batch' ? '批量删除确认' : '确认删除'}
            </h3>
            <p className="text-gray-600 mb-6">
              {individualDeletePart === 'batch' 
                ? `您确定要删除选中的 ${selectedParts.length} 个Part吗？此操作不可撤销。`
                : '您确定要删除此Part吗？此操作不可撤销。'
              }
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelIndividualDelete}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (individualDeletePart === 'batch') {
                    // 执行批量删除 - 使用批量删除API
                    try {
                      // 将选中的Part IDs从_id转换为part_id
                      const partIds = selectedParts.map(partId => {
                        const part = parts.find(p => p._id === partId);
                        return part ? part.part_id : partId;
                      });
                      await onBatchDelete(partIds);
                      setSelectedParts([]); // 清空选中状态
                    } catch (error) {
                      console.error('批量删除失败:', error);
                      // 错误信息已经在onBatchDelete中处理
                    }
                  } else {
                    // 执行单个删除
                    await onDelete(individualDeletePart);
                  }
                  setIndividualDeletePart(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PartList;