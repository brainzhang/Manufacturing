## ADDED Requirements

### Requirement: BOM Version Creation
系统SHALL提供创建新BOM版本的功能，支持手动指定版本号和变更说明。

#### Scenario: Create new BOM version
- **WHEN** 用户在BOM管理界面点击"创建新版本"按钮
- **AND** 输入版本号和变更说明
- **AND** 确认创建
- **THEN** 系统创建当前BOM的副本并标记为新版本
- **AND** 记录创建时间和操作者信息

### Requirement: BOM Version Comparison
系统SHALL提供BOM版本比较功能，支持两个版本之间的差异可视化展示。

#### Scenario: Compare two BOM versions
- **WHEN** 用户选择两个不同的BOM版本进行比较
- **THEN** 系统显示两个版本的差异
- **AND** 高亮显示新增、删除和修改的组件
- **AND** 提供汇总统计信息

### Requirement: BOM Version Rollback
系统SHALL提供BOM版本回滚功能，允许用户将BOM恢复到指定版本。

#### Scenario: Rollback BOM to previous version
- **WHEN** 用户选择历史版本并点击"回滚到此版本"
- **AND** 确认回滚操作
- **THEN** 系统将当前BOM替换为所选版本
- **AND** 创建新版本记录此次回滚操作

## MODIFIED Requirements

### Requirement: BOM Data Structure
BOM数据结构SHALL支持版本信息字段，包括版本号、创建时间、创建者和变更说明。

#### Scenario: Save BOM with version info
- **WHEN** 保存BOM时
- **THEN** 系统自动保存版本信息
- **AND** 记录创建时间和操作者

### Requirement: BOM Management Interface
BOM管理界面SHALL包含版本管理相关控件和显示区域。

#### Scenario: View BOM versions
- **WHEN** 用户进入BOM管理界面
- **THEN** 系统显示当前版本和历史版本列表
- **AND** 提供版本管理操作按钮