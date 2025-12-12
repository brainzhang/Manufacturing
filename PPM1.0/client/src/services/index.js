// 导出所有服务
export { fetchProducts, fetchProductById, createProduct, updateProduct, deleteProduct } from './productService';
export { fetchParts, fetchPartById, createPart, updatePart, deletePart } from './partService';
export { fetchBOMs, fetchBOMById, createBOM, updateBOM, deleteBOM } from './bomService';
export { fetchPNMaps, createPNMap, updatePNMap, deletePNMap } from './pnMapService';
export { fetchAlignments, fetchAlignmentById, performAlignment, updateAlignment, importAlignments } from './alignmentService';
export { generateConfigurations, getConfigurationReport, validateConfiguration } from './configurationService';
export { fetchTargetParts, createTargetPart, updateTargetPart, deleteTargetPart } from './targetPartService';
export { login, logout, register } from './authService';
export { fetchDashboardData } from './dashboardService';