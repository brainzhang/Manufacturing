# Change: Add BOM Version Control

## Why
当前系统缺乏BOM版本管理功能，无法追踪BOM的变更历史和版本演进，这对于制造行业的产品迭代和质量控制至关重要。

## What Changes
- 添加BOM版本管理界面
- 实现版本比较功能
- 支持版本回滚操作
- 添加版本变更日志记录
- **BREAKING**: 修改现有BOM数据结构以支持版本字段

## Impact
- Affected specs: bom-management
- Affected code: CreateBOMWizard.jsx, BOMManagement.jsx, 后端BOM API