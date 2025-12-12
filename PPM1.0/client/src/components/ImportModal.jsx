import React, { useState } from 'react';

const ImportModal = ({ isOpen, onClose, onImport, title = "Import Data" }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
      
      if (validExtensions.includes(fileExtension)) {
        setFile(selectedFile);
        setImportResult(null);
      } else {
        alert('Please select a valid CSV or Excel file (.csv, .xlsx, .xls)');
        e.target.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      setImportResult({
        success: false,
        message: '请先选择要导入的文件'
      });
      return;
    }

    // 文件大小验证（最大10MB）
    if (file.size > 10 * 1024 * 1024) {
      setImportResult({
        success: false,
        message: '文件大小超过限制（最大10MB）'
      });
      return;
    }

    setImporting(true);
    setImportResult(null);
    
    try {
      const result = await onImport(file);
      
      // 解析导入结果，提供详细反馈
      let message = '';
      if (result.success) {
        const importedCount = result.imported || result.count || 0;
        const skippedCount = result.skipped || 0;
        const errorCount = result.errors ? result.errors.length : 0;
        
        if (importedCount > 0) {
          message = `✅ 导入成功！成功导入 ${importedCount} 条记录`;
          if (skippedCount > 0) {
            message += `，跳过 ${skippedCount} 条重复记录`;
          }
          if (errorCount > 0) {
            message += `，${errorCount} 条记录导入失败`;
          }
        } else {
          message = '⚠️ 没有成功导入任何记录';
          if (skippedCount > 0) {
            message += `，跳过 ${skippedCount} 条重复记录`;
          }
          if (errorCount > 0) {
            message += `，${errorCount} 条记录导入失败`;
          }
        }
      } else {
        message = `❌ 导入失败：${result.message || '未知错误'}`;
      }
      
      setImportResult({
        success: result.success,
        message: message,
        details: result
      });
      
      setFile(null);
      // Reset file input
      document.getElementById('file-input').value = '';
    } catch (error) {
      console.error('Import error:', error);
      
      // 提供更详细的错误信息
      let errorMessage = '导入失败：';
      if (error.message.includes('Network Error')) {
        errorMessage += '网络连接失败，请检查网络连接';
      } else if (error.message.includes('timeout')) {
        errorMessage += '请求超时，请稍后重试';
      } else if (error.message.includes('500')) {
        errorMessage += '服务器内部错误，请联系管理员';
      } else if (error.message.includes('413')) {
        errorMessage += '文件太大，请压缩文件后重试';
      } else {
        errorMessage += error.message;
      }
      
      setImportResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    onClose();
  };

  const handleDownloadTemplate = async () => {
    try {
      // 下载动态生成的Excel模板（带下拉框功能）
      const response = await fetch('/api/v1/templates/bom-import-template');
      
      if (!response.ok) {
        throw new Error(`下载失败: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'BOM_Import_Template_With_Dropdown.xlsx';
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载模板失败:', error);
      alert('下载模板失败，请稍后重试');
    }
  };

  const handleDownloadInstructions = () => {
    // 下载使用说明文档
    const link = document.createElement('a');
    link.href = '/BOM_Import_Template_Instructions.md';
    link.download = 'BOM_Import_Template_Instructions.md';
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select File (CSV or Excel)
            </label>
            <div className="flex space-x-3">
              <button
                onClick={handleDownloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                type="button"
              >
                Download Template
              </button>
              <button
                onClick={handleDownloadInstructions}
                className="text-sm text-green-600 hover:text-green-800 underline"
                type="button"
              >
                Instructions
              </button>
            </div>
          </div>
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: CSV, Excel (.xlsx, .xls)
          </p>
        </div>

        {file && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium">Selected file:</p>
            <p className="text-sm text-gray-600">{file.name}</p>
            <p className="text-xs text-gray-500">Size: {(file.size / 1024).toFixed(2)} KB</p>
          </div>
        )}

        {importResult && (
          <div className={`mb-4 p-3 rounded-md ${
            importResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            <p className="text-sm font-medium">
              {importResult.success ? '✓ Import Successful' : '✗ Import Failed'}
            </p>
            <p className="text-sm">{importResult.message}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={importing}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;