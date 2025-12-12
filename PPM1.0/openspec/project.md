# Project Context

## Purpose
PPM (Product Portfolio Management) 3.0是一个制造行业产品组合管理系统，主要用于BOM(物料清单)管理、产品成本分析和生命周期管理。该系统支持多种BOM构建方式，包括平台模板、Excel导入和手动构建，并提供7层BOM层次结构管理功能。

## Tech Stack
- **前端**: React 18.2.0, React Router 6.8.0, Ant Design 5.28.0
- **图表库**: D3.js 7.8.2, Recharts 2.4.3
- **图标库**: Lucide React 0.553.0
- **状态管理**: React Redux 8.0.5, Redux 4.2.1
- **HTTP客户端**: Axios 1.3.0
- **数据处理**: XLSX 0.18.5
- **CSS框架**: Tailwind CSS 3.2.4
- **构建工具**: Vite 7.1.12
- **后端**: Node.js (server目录)

## Project Conventions

### Code Style
- 使用函数式React组件和React Hooks
- 组件文件使用PascalCase命名（如CreateBOMWizard.jsx）
- 状态变量使用camelCase命名（如selectedGroupLevel）
- 函数使用camelCase命名（如updateNodePosition）
- 使用ESLint和Prettier进行代码格式化

### Architecture Patterns
- 采用单页面应用(SPA)架构
- 组件设计遵循单一职责原则
- 使用Context进行全局状态管理（ProductContext）
- 模块化设计，功能按组件分离
- RESTful API设计原则（前后端分离）

### Testing Strategy
- 单元测试覆盖核心业务逻辑
- 组件测试确保UI交互正确性
- 集成测试验证跨组件功能
- E2E测试覆盖关键用户流程

### Git Workflow
- 采用Git Flow分支模型
- 功能开发使用feature分支
- 代码审查后合并到develop分支
- 定期发布到master分支

## Domain Context
- **BOM层次结构**: 7层结构(L1-L7)，从产品主分类到最小零件
- **位号格式**: P-产品代码-L1-L2-L3-L4-L5-L6-L7
- **生命周期管理**: 支持量产、维护期、PhaseOut、EOL等状态
- **成本管理**: 包含物料成本、人工成本和间接费用
- **供应商管理**: 支持多供应商和替代料管理
- **合规性管理**: 支持风险检查和合规评估

## Important Constraints
- 成本数据精度要求到小数点后2位
- 必须支持大数据量BOM的性能优化
- 严格的权限控制和数据安全要求
- 浏览器兼容性支持Chrome和Edge
- 响应式设计支持平板和桌面设备

## External Dependencies
- 零件数据库API
- 供应商信息API
- 成本分析API
- 文件存储服务
- 用户认证服务