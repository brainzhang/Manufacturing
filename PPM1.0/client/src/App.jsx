import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PartManagement from './pages/PartManagement';
import PartImportPage from './pages/PartImportPage';
import BOMManagement from './pages/BOMManagement';
import BOMTest from './pages/BOMTest';
import BOMTreeEditorPage from './pages/BOMTreeEditorPage';
import PNMapping from './pages/PNMapping';
import Alignment from './pages/Alignment';
import ConfigurationGenerator from './pages/ConfigurationGenerator';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import ProductCreate from './pages/ProductCreate';
import ProductEdit from './pages/ProductEdit';
import Login from './pages/Login';
import CreateBOMWizardPage from './pages/CreateBOMWizardPage';
import BOMGenerator from './components/BOMGenerator';
import BOMStructureNew from './components/BOMStructureNew';
import BOMBatchCompare from './components/BOMBatchCompare';
import SubstitutePage from './pages/SubstitutePage';
import AltTestPage from './pages/AltTestPage';
import SimpleAltTest from './pages/SimpleAltTest';
import DifferenceRadarPage from './pages/DifferenceRadarPage';
import CostDashboardPage from './pages/CostDashboardPage';
import ComplianceDashboardPage from './pages/ComplianceDashboardPage';
import TaskDetailPage from './pages/TaskDetailPage';
import { ProductProvider } from './contexts/ProductContext';

function App() {
  return (
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProductProvider>
          <div className="App flex flex-col min-h-screen">
            <Navbar />
            {/* 主内容区域，使用flex-1确保它占用剩余空间，w-full确保宽度充满 */}
            <div className="flex-1 w-full">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products/list" element={<ProductList />} />
                <Route path="/products/create" element={<ProductCreate />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/products/:id/edit" element={<ProductEdit />} />
                <Route path="/bom-generator" element={<BOMGenerator />} />
                <Route path="/bom-structure-new" element={<BOMStructureNew />} />
                <Route path="/bom-compare" element={<BOMBatchCompare />} />
                <Route path="/parts/import" element={<PartImportPage />} />
                <Route path="/parts/alternatives" element={<SubstitutePage />} />
                <Route path="/parts/alt-test" element={<AltTestPage />} />
                <Route path="/parts/simple-alt-test" element={<SimpleAltTest />} />
                <Route path="/alignment/radar" element={<DifferenceRadarPage />} />
                <Route path="/alignment/sync" element={<div className="container mx-auto px-4 py-8"><h1>一键同步</h1><p>数据管理员专用模块</p></div>} />
                <Route path="/reports/cost" element={<CostDashboardPage />} />
                <Route path="/reports/compliance" element={<ComplianceDashboardPage />} />
                <Route path="/parts" element={<PartManagement />} />
                <Route path="/boms" element={<BOMManagement />} />
                <Route path="/boms/test" element={<BOMTest />} />
                <Route path="/boms/create-wizard" element={<CreateBOMWizardPage />} />
                <Route path="/bom/editor/:id?" element={<BOMTreeEditorPage />} />
                <Route path="/pn-mapping" element={<PNMapping />} />
                <Route path="/alignment" element={<Alignment />} />
                <Route path="/configuration-generator" element={<ConfigurationGenerator />} />
                <Route path="/login" element={<Login />} />
                <Route path="/tasks/:id" element={<TaskDetailPage />} />
              </Routes>
            </div>
          </div>
        </ProductProvider>
      </Router>
  );
}

export default App;