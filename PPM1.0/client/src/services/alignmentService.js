/**
 * 数据对齐服务
 * 提供与SAP/PLM系统数据同步和差异对齐相关的API调用
 */
import api from './api';

/**
 * 获取差异对齐记录列表
 * @param {Object} params - 查询参数
 * @param {string} params.partId - 零件ID (可选)
 * @param {string} params.status - 状态过滤 (可选)
 * @param {string} params.alignmentLevel - 差异级别过滤 (可选)
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} - 返回Promise对象
 */
export const fetchAlignments = async (params = {}) => {
  try {
    const response = await api.get('/alignments', { 
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        partId: params.partId,
        status: params.status,
        alignmentLevel: params.alignmentLevel,
        ...params
      } 
    });
    // Handle both paginated and non-paginated responses
    if (response.data.data) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('获取差异对齐记录失败:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch alignments');
  }
};

/**
 * 根据ID获取单个差异对齐记录
 * @param {string} id - 对齐记录ID
 * @returns {Promise} - 返回Promise对象
 */
export const fetchAlignmentById = async (id) => {
  try {
    const response = await api.get(`/alignments/${id}`);
    return response.data;
  } catch (error) {
    console.error('获取差异对齐记录详情失败:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch alignment');
  }
};

/**
 * 执行数据对齐操作
 * @param {Array|Object} alignmentData - 对齐记录ID列表或对齐数据
 * @returns {Promise} - 返回Promise对象
 */
export const performAlignment = async (alignmentData) => {
  try {
    // 支持批量对齐（数组形式）或单个对齐（对象形式）
    const requestData = Array.isArray(alignmentData) 
      ? { alignmentIds: alignmentData }
      : alignmentData;
      
    const response = await api.post('/alignments', requestData);
    return response.data;
  } catch (error) {
    console.error('执行数据对齐失败:', error);
    throw new Error(error.response?.data?.error || 'Failed to perform alignment');
  }
};

/**
 * 更新单个差异对齐记录
 * @param {string} id - 对齐记录ID
 * @param {Object} alignmentData - 更新数据
 * @param {string} alignmentData.resolution - 解决值
 * @param {string} alignmentData.status - 状态
 * @returns {Promise} - 返回Promise对象
 */
export const updateAlignment = async (id, alignmentData) => {
  try {
    const response = await api.put(`/alignments/${id}`, alignmentData);
    return response.data;
  } catch (error) {
    console.error('更新差异对齐记录失败:', error);
    throw new Error(error.response?.data?.error || 'Failed to update alignment');
  }
};

export const importAlignments = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/import/alignments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('导入对齐记录失败:', error);
    throw new Error(error.response?.data?.error || 'Failed to import alignments');
  }
};

/**
 * 开始同步操作
 * @param {Object} params - 同步参数
 * @param {string} params.syncType - 同步类型 (FULL/INCREMENTAL)
 * @param {string} params.sourceSystem - 源系统 (SAP/PLM)
 * @param {Array} params.bomIds - BOM ID列表 (可选，用于增量同步)
 * @returns {Promise} - 返回Promise对象
 */
export const startSync = async (params) => {
  try {
    const response = await api.post('/sync/start', params);
    return response.data;
  } catch (error) {
    console.error('开始同步操作失败:', error);
    throw new Error(error.response?.data?.error || 'Failed to start sync');
  }
};

/**
 * 获取同步状态
 * @param {string} syncId - 同步操作ID
 * @returns {Promise} - 返回Promise对象
 */
export const getSyncStatus = async (syncId) => {
  try {
    const response = await api.get(`/sync/status/${syncId}`);
    return response.data;
  } catch (error) {
    console.error('获取同步状态失败:', error);
    throw new Error(error.response?.data?.error || 'Failed to get sync status');
  }
};

/**
 * 获取同步日志
 * @param {Object} params - 查询参数
 * @param {string} params.syncType - 同步类型过滤 (可选)
 * @param {string} params.syncStatus - 同步状态过滤 (可选)
 * @param {string} params.startDate - 开始日期 (可选)
 * @param {string} params.endDate - 结束日期 (可选)
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页大小
 * @returns {Promise} - 返回Promise对象
 */
export const getSyncLogs = async (params = {}) => {
  try {
    const response = await api.get('/sync/logs', { 
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        syncType: params.syncType,
        syncStatus: params.syncStatus,
        startDate: params.startDate,
        endDate: params.endDate,
        ...params
      } 
    });
    return response.data;
  } catch (error) {
    console.error('获取同步日志失败:', error);
    throw new Error(error.response?.data?.error || 'Failed to get sync logs');
  }
};

/**
 * 取消正在进行的同步操作
 * @param {string} syncId - 同步操作ID
 * @returns {Promise} - 返回Promise对象
 */
export const cancelSync = async (syncId) => {
  try {
    const response = await api.post(`/sync/cancel/${syncId}`);
    return response.data;
  } catch (error) {
    console.error('取消同步操作失败:', error);
    throw new Error(error.response?.data?.error || 'Failed to cancel sync');
  }
};

/**
 * 获取差异统计信息
 * @returns {Promise} - 返回Promise对象
 */
export const getAlignmentStatistics = async () => {
  try {
    const response = await api.get('/alignment/statistics');
    return response.data;
  } catch (error) {
    console.error('获取差异统计信息失败:', error);
    throw new Error(error.response?.data?.error || 'Failed to get alignment statistics');
  }
};

/**
 * 导出差异记录
 * @param {Object} params - 导出参数
 * @param {string} params.format - 导出格式 (EXCEL/CSV)
 * @param {Object} params.filters - 过滤条件
 * @returns {Promise} - 返回Promise对象
 */
export const exportAlignments = async (params) => {
  try {
    const response = await api.post('/alignment/export', params, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('导出差异记录失败:', error);
    throw new Error(error.response?.data?.error || 'Failed to export alignments');
  }
};

/**
 * 导出同步日志
 * @param {Object} params - 导出参数
 * @param {string} params.format - 导出格式 (EXCEL/CSV)
 * @param {Object} params.filters - 过滤条件
 * @returns {Promise} - 返回Promise对象
 */
export const exportSyncLogs = async (params) => {
  try {
    const response = await api.post('/sync/export', params, {
      responseType: 'blob'
    });
    return response;
  } catch (error) {
    console.error('导出同步日志失败:', error);
    throw new Error(error.response?.data?.error || 'Failed to export sync logs');
  }
};