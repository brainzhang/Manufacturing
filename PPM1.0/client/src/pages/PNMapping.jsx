import React, { useState, useEffect } from 'react';
import { fetchPNMaps, createPNMap, updatePNMap, deletePNMap, importPNMaps } from '../services/pnMapService';
import { fetchParts } from '../services/partService';
import { fetchTargetParts } from '../services/targetPartService';
import PNMapList from '../components/PNMapList';
import PNMapForm from '../components/PNMapForm';
import MappingMatrix from '../components/MappingMatrix';
import ImportModal from '../components/ImportModal';

const PNMapping = () => {
  const [pnMaps, setPNMaps] = useState([]);
  const [parts, setParts] = useState([]);
  const [targetParts, setTargetParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPNMap, setSelectedPNMap] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'matrix'

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [pnMapsData, partsData, targetPartsData] = await Promise.all([
        fetchPNMaps(),
        fetchParts(),
        fetchTargetParts()
      ]);
      setPNMaps(pnMapsData);
      setParts(partsData);
      setTargetParts(targetPartsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('加载数据失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPNMaps = async () => {
    try {
      setLoading(true);
      const data = await fetchPNMaps();
      setPNMaps(data);
    } catch (error) {
      console.error('Error loading PN maps:', error);
      alert('加载PN映射失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedPNMap(null);
    setShowForm(true);
  };

  const handleEdit = (pnMap) => {
    setSelectedPNMap(pnMap);
    setShowForm(true);
  };

  const handleDelete = async (pnMapId) => {
    if (window.confirm('Are you sure you want to delete this PN mapping?')) {
      try {
        await deletePNMap(pnMapId);
        loadPNMaps();
      } catch (error) {
        console.error('Error deleting PN map:', error);
        alert('Failed to delete PN map: ' + error.message);
      }
    }
  };

  const handleSave = async (pnMapData) => {
    try {
      if (selectedPNMap) {
        await updatePNMap(selectedPNMap._id, pnMapData);
      } else {
        await createPNMap(pnMapData);
      }
      setShowForm(false);
      loadPNMaps();
    } catch (error) {
      console.error('Error saving PN map:', error);
      alert('Failed to save PN map: ' + error.message);
    }
  };

  const handleImport = async (file) => {
    try {
      const result = await importPNMaps(file);
      setShowImportModal(false);
      loadPNMaps(); // Refresh the list
      return result;
    } catch (error) {
      console.error('Error importing PN maps:', error);
      throw error;
    }
  };

  const handleImportClick = () => {
    setShowImportModal(true);
  };

  const handleMappingChange = async (partId, targetPartId, isMapped) => {
    try {
      if (isMapped) {
        // 创建新的映射
        await createPNMap({
          part_id: partId,
          target_part_id: targetPartId,
          match_strength: 'medium',
          status: 'active'
        });
      } else {
        // 删除现有的映射
        const existingMapping = pnMaps.find(m => 
          m.part_id === partId && m.target_part_id === targetPartId
        );
        if (existingMapping) {
          await deletePNMap(existingMapping._id);
        }
      }
      loadAllData();
    } catch (error) {
      console.error('Error updating mapping:', error);
      alert('更新映射失败: ' + error.message);
    }
  };

  if (loading) return <div className="text-center py-10">加载PN映射中...</div>;

  return (
    <div className="pn-mapping">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">PN映射管理</h1>
        <div className="flex space-x-3">
          <div className="flex space-x-2">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded ${
                viewMode === 'list' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              列表视图
            </button>
            <button 
              onClick={() => setViewMode('matrix')}
              className={`px-4 py-2 rounded ${
                viewMode === 'matrix' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              矩阵视图
            </button>
          </div>
          <button 
            onClick={handleImportClick}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            导入映射
          </button>
          <button 
            onClick={handleCreate}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            添加新映射
          </button>
        </div>
      </div>

      {showForm ? (
        <PNMapForm 
          pnMap={selectedPNMap}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      ) : viewMode === 'matrix' ? (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">多对多映射矩阵</h2>
          <MappingMatrix 
            parts={parts}
            targetParts={targetParts}
            mappings={pnMaps}
            onMappingChange={handleMappingChange}
          />
        </div>
      ) : (
        <PNMapList 
          pnMaps={pnMaps}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        title="Import PN Mappings"
      />
    </div>
  );
};

export default PNMapping;