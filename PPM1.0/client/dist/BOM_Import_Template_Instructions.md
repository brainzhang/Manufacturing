# BOM Import Template Instructions (完全上传导入版本)

## Excel Template Setup Instructions

### 1. 模板结构 - 完全上传导入版本
模板包含以下列：
- **BOM ID**: 系统生成，不可修改
- **BOM Name**: 必须从下拉列表中选择（映射到数据库model字段）
- **Part ID**: 系统生成，不可修改
- **Part Name**: 必须从下拉列表中选择（与系统数据保持一致）
- **Quantity**: 数字，最小值为1
- **Position**: 必须从下拉列表中选择（与系统数据保持一致）
- **Product ID**: 系统生成，不可修改
- **Product Name**: 必须从下拉列表中选择（与系统数据保持一致）
- **Version**: 版本号，必须从下拉列表中选择（映射到数据库version字段）
- **Product Line**: 必须从下拉列表中选择（映射到数据库product_line字段）
- **Status**: 状态字段（只读，通过Actions操作自动变更）
- **Actions**: 操作列（选择操作后自动更新Status）

### 2. 字段映射规则
- **BOM Name** → **model** (数据库字段)
- **Version** → **version** (数据库字段)  
- **Product Line** → **product_line** (数据库字段)

### 3. 必需字段说明
以下字段为导入必需字段，必须填写有效数据：
- BOM Name (model)
- Version (version)
- Product Line (product_line)

### 4. 下拉框功能说明
模板包含以下下拉框选项：
- **BOM Name**: Main Board, Power Supply, CPU Module 等20个选项
- **Part Name**: Resistor, Capacitor, IC Chip 等6个选项
- **Position**: Top Side, Bottom Side, Internal, External
- **Product Name**: Smartphone, Laptop, Tablet, Server, Router, Switch
- **Version**: V1.0 到 V3.2, Latest, Stable
- **Product Line**: Consumer Electronics, Enterprise, Industrial, Medical, Automotive
- **Actions**: Push, Pushed

### 5. 状态映射规则
- **Status 字段**：三个独立状态（Active、Inactive、Draft）
- **Actions 字段**：两个操作状态（push、pushed）
- **推送可用性规则**：
  - **Active** → push available（可以触发点击推送）
  - **Inactive** → push unavailable（不可以点击触发推送）
  - **Draft** → push unavailable（不可以点击触发推送）
  - **pushed** 状态不可触发推送（无论Status如何）

### 6. 数据验证规则
- 所有下拉框字段必须从预定义列表中选择
- Quantity字段必须为大于0的整数
- 必需字段不能为空
- ID字段为只读，不可修改

### 7. 模板特性
- ✅ 包含20条完整的测试数据
- ✅ 符合完全上传导入规则
- ✅ 支持批量导入操作
- ✅ 数据验证和格式检查
- ✅ 状态自动计算
- ✅ 单元格保护设置

### 8. 使用说明
1. 下载模板文件
2. 填写或修改数据（注意必需字段）
3. 保存文件
4. 通过BOM导入界面上传文件
5. 系统将自动验证并导入数据

### 9. 注意事项
- 请勿修改ID字段和状态字段
- 确保所有必需字段都有有效数据
- 使用下拉框选择选项以保证数据一致性
- 模板支持一次性导入多条记录

### 10. 技术支持
如遇到导入问题，请检查：
- 必需字段是否填写完整
- 数据格式是否符合要求
- 下拉框选项是否从预定义列表中选择

---
*最后更新: 2025/11/3 - 完全上传导入版本*