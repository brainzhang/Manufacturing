# SAP/PLM 系统API集成文档

本文档提供了PPM平台与SAP/PLM系统进行数据同步和差异对齐的API调用示例。

## 1. 数据同步接口

### 1.1 开始同步操作

```javascript
import { startSync } from '@/services/alignmentService';
import { SyncType, SourceSystem } from '@/types/dataSync';

// 执行全量同步
async function performFullSync() {
  try {
    const syncParams = {
      syncType: SyncType.FULL,
      sourceSystem: SourceSystem.SAP,
      includeAllBoms: true
    };
    
    const result = await startSync(syncParams);
    console.log('同步操作已启动:', result.syncId);
    
    // 返回同步ID用于后续查询状态
    return result.syncId;
  } catch (error) {
    console.error('启动同步失败:', error.message);
    throw error;
  }
}

// 执行增量同步
async function performIncrementalSync(bomIds) {
  try {
    const syncParams = {
      syncType: SyncType.INCREMENTAL,
      sourceSystem: SourceSystem.PLM,
      bomIds: bomIds // 特定BOM的ID列表
    };
    
    const result = await startSync(syncParams);
    console.log('增量同步已启动:', result.syncId);
    return result.syncId;
  } catch (error) {
    console.error('启动增量同步失败:', error.message);
    throw error;
  }
}
```

### 1.2 查询同步状态

```javascript
import { getSyncStatus } from '@/services/alignmentService';

// 轮询同步状态
async function pollSyncStatus(syncId, callback, interval = 2000) {
  try {
    const status = await getSyncStatus(syncId);
    
    // 调用回调函数更新UI
    callback(status);
    
    // 如果同步未完成，继续轮询
    if (status.status === 'RUNNING' || status.status === 'PENDING') {
      setTimeout(() => {
        pollSyncStatus(syncId, callback, interval);
      }, interval);
    }
  } catch (error) {
    console.error('获取同步状态失败:', error.message);
  }
}
```

### 1.3 取消同步操作

```javascript
import { cancelSync } from '@/services/alignmentService';

async function stopSyncOperation(syncId) {
  try {
    await cancelSync(syncId);
    console.log('同步操作已取消');
    return true;
  } catch (error) {
    console.error('取消同步失败:', error.message);
    return false;
  }
}
```

## 2. 差异对齐接口

### 2.1 获取差异对齐记录

```javascript
import { fetchAlignments } from '@/services/alignmentService';
import { AlignmentLevel, AlignmentStatus } from '@/types/dataSync';

async function loadAlignments(filters = {}) {
  try {
    const params = {
      page: filters.page || 1,
      pageSize: filters.pageSize || 20,
      status: filters.status,
      alignmentLevel: filters.level,
      partId: filters.partId,
      ...filters
    };
    
    const result = await fetchAlignments(params);
    return result;
  } catch (error) {
    console.error('获取对齐记录失败:', error.message);
    return { data: [], total: 0 };
  }
}

// 示例：加载所有高优先级未处理的差异
async function loadHighPriorityAlignments() {
  return await loadAlignments({
    status: AlignmentStatus.PENDING,
    alignmentLevel: AlignmentLevel.HIGH
  });
}
```

### 2.2 执行数据对齐

```javascript
import { performAlignment, updateAlignment } from '@/services/alignmentService';

// 批量对齐
async function batchAlignRecords(recordIds, resolutionStrategy) {
  try {
    const result = await performAlignment(recordIds);
    console.log(`成功对齐 ${result.successCount} 条记录`);
    return result;
  } catch (error) {
    console.error('批量对齐失败:', error.message);
    throw error;
  }
}

// 单条记录对齐
async function alignSingleRecord(recordId, resolution) {
  try {
    const result = await updateAlignment(recordId, {
      resolution: resolution,
      status: 'COMPLETED'
    });
    console.log('记录对齐成功');
    return result;
  } catch (error) {
    console.error('单条记录对齐失败:', error.message);
    throw error;
  }
}
```

### 2.3 获取差异统计信息

```javascript
import { getAlignmentStatistics } from '@/services/alignmentService';

async function loadStatistics() {
  try {
    const stats = await getAlignmentStatistics();
    console.log('差异统计:', stats);
    return stats;
  } catch (error) {
    console.error('获取统计信息失败:', error.message);
    return null;
  }
}
```

## 3. 同步日志查询

```javascript
import { getSyncLogs } from '@/services/alignmentService';
import { SyncStatus, SyncType } from '@/types/dataSync';

async function loadSyncHistory(filters = {}) {
  try {
    const params = {
      page: filters.page || 1,
      pageSize: filters.pageSize || 10,
      syncType: filters.syncType,
      syncStatus: filters.syncStatus,
      startDate: filters.startDate,
      endDate: filters.endDate,
      ...filters
    };
    
    const result = await getSyncLogs(params);
    return result;
  } catch (error) {
    console.error('获取同步日志失败:', error.message);
    return { data: [], total: 0 };
  }
}
```

## 4. 数据导出功能

```javascript
import { exportAlignments, exportSyncLogs } from '@/services/alignmentService';

// 导出差异记录
async function downloadAlignments(format = 'EXCEL', filters = {}) {
  try {
    const response = await exportAlignments({
      format: format,
      filters: filters
    });
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `alignments_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    console.log('差异记录导出成功');
    return true;
  } catch (error) {
    console.error('导出差异记录失败:', error.message);
    return false;
  }
}

// 导出同步日志
async function downloadSyncLogs(format = 'EXCEL', filters = {}) {
  try {
    const response = await exportSyncLogs({
      format: format,
      filters: filters
    });
    
    // 创建下载链接
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sync_logs_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    console.log('同步日志导出成功');
    return true;
  } catch (error) {
    console.error('导出同步日志失败:', error.message);
    return false;
  }
}
```

## 5. 错误处理最佳实践

```javascript
// 统一错误处理函数
function handleApiError(error) {
  if (error.response) {
    // 服务器返回错误响应
    console.error('API错误:', error.response.status, error.response.data);
    
    if (error.response.status === 401) {
      // 未授权，处理登录过期
      console.log('请重新登录');
      // 这里可以添加重定向到登录页面的逻辑
    } else if (error.response.status === 403) {
      console.log('您没有权限执行此操作');
    } else if (error.response.status === 404) {
      console.log('请求的资源不存在');
    } else if (error.response.status >= 500) {
      console.log('服务器错误，请稍后再试');
    }
  } else if (error.request) {
    // 请求已发出但没有收到响应
    console.error('网络错误，请检查您的连接');
  } else {
    // 设置请求时发生错误
    console.error('请求错误:', error.message);
  }
  
  // 可以在这里添加全局错误通知
  return Promise.reject(error);
}

// 使用示例
try {
  const result = await startSync(syncParams);
  // 处理成功结果
} catch (error) {
  handleApiError(error);
}
```

## 6. 完整集成示例

以下是一个完整的集成示例，展示如何结合使用上述API：

```javascript
import { 
  startSync, 
  getSyncStatus, 
  fetchAlignments, 
  performAlignment,
  getAlignmentStatistics 
} from '@/services/alignmentService';
import { SyncType, SourceSystem, AlignmentStatus } from '@/types/dataSync';

// 执行同步并处理结果
async function syncAndProcessDifferences() {
  try {
    // 1. 启动同步
    const syncId = await performFullSync();
    
    // 2. 等待同步完成
    const syncResult = await waitForSyncCompletion(syncId);
    
    if (syncResult.status === 'COMPLETED') {
      console.log(`同步完成，发现 ${syncResult.diffCount} 个差异`);
      
      // 3. 获取差异统计
      const stats = await getAlignmentStatistics();
      console.log('差异统计:', stats);
      
      // 4. 加载高优先级差异
      const criticalAlignments = await loadAlignments({
        status: AlignmentStatus.PENDING,
        alignmentLevel: 'CRITICAL'
      });
      
      // 5. 对关键差异进行自动对齐
      if (criticalAlignments.data.length > 0) {
        const recordIds = criticalAlignments.data.map(record => record.recordId);
        await batchAlignRecords(recordIds, 'USE_SAP');
        console.log('已自动对齐所有关键差异');
      }
      
      return true;
    } else {
      console.error('同步失败:', syncResult.errorMessage);
      return false;
    }
  } catch (error) {
    console.error('同步和处理过程失败:', error);
    return false;
  }
}

// 等待同步完成（带超时处理）
async function waitForSyncCompletion(syncId, timeoutMs = 3600000) { // 默认1小时超时
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error('同步操作超时'));
        return;
      }
      
      try {
        const status = await getSyncStatus(syncId);
        
        if (status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'CANCELLED') {
          resolve(status);
        } else {
          console.log(`同步进度: ${status.progress}%`);
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        reject(error);
      }
    };
    
    checkStatus();
  });
}
```

## 7. 性能优化建议

1. **批量操作**：尽量使用批量API，减少HTTP请求次数
2. **合理设置分页**：对于大量数据，使用适当的pageSize（建议20-50条/页）
3. **缓存策略**：对不常变动的数据实施缓存，如统计信息
4. **避免频繁轮询**：使用指数退避算法减少轮询频率
5. **并行请求**：使用Promise.all并行处理不相互依赖的请求